import { execFileSync } from "node:child_process";
import { readFileSync, lstatSync } from "node:fs";

// Findings contain location/category only: never print the matching value.
const git = (...args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
const findings = [];
const patterns = [
  ["API credential", /\bsk-[A-Za-z0-9_-]{20,}\b/],
  ["GitHub credential", /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}\b/],
  ["payment credential", /\b(?:sk|rk)_live_[A-Za-z0-9]{16,}\b/],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["hosted database project", /https:\/\/[a-z0-9]{15,}\.supabase\.co\b/i],
  ["JWT", /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/],
  ["credentialed database URL", /postgres(?:ql)?:\/\/[^\s:/]+:[^\s@]+@[^\s]+/i],
  ["literal authorization", /authorization\s*[:=]\s*["'`]bearer\s+[A-Za-z0-9._~-]{16,}/i],
  ["personal absolute path", /(?:[a-z]:[\\/]+Users[\\/]+[^\s\\/]+|\/(?:Users|home)\/[^\s/]+\/)/i],
  ["credential assignment", /(?:password|secret|token|service_role_key)\s*[=:]\s*["'][A-Za-z0-9_+=/.~-]{20,}["']/i],
];
const extraTerms = (process.env.PUBLIC_SCAN_TERMS ?? "").split("|").filter(Boolean);
function scan(content, location) {
  for (const [category, pattern] of patterns) {
    if (pattern.test(content)) findings.push({ category, location });
  }
  const emails = content.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
  if (emails.some((email) => !/@(?:example\.test|users\.noreply\.github\.com)$/i.test(email))) {
    findings.push({ category: "non-public email", location });
  }
  if (extraTerms.some((term) => content.toLowerCase().includes(term.toLowerCase()))) {
    findings.push({ category: "release-specific private identifier", location });
  }
}

const files = [...new Set(git("ls-files", "--cached", "--others", "--exclude-standard", "-z").split("\0").filter(Boolean))];
for (const file of files) {
  if (/(?:^|\/)(?:\.env(?!\.example$)|\.vercel\/|logs?\/)|\.(?:map|log|pem|key)$/.test(file)) {
    findings.push({ category: "unsafe artifact", location: file });
  }
  if (lstatSync(file).isSymbolicLink()) findings.push({ category: "symlink requires review", location: file });
  else scan(readFileSync(file, "utf8"), file);
}
// Inspect all objects, including dangling objects and reflog-only history, not just HEAD.
const objects = git("cat-file", "--batch-all-objects", "--batch-check=%(objectname) %(objecttype)").trim().split("\n").filter(Boolean);
for (const row of objects) {
  const [oid, type] = row.trim().split(" ");
  if (["blob", "commit", "tag"].includes(type)) scan(git("cat-file", type, oid), `git-object:${oid}`);
}
if (findings.length) {
  console.error("Release scan failed; values are intentionally redacted:");
  findings.forEach(({ category, location }) => console.error(`- ${category}: ${location}`));
  process.exitCode = 1;
} else {
  console.log(`Security/privacy scan passed: ${files.length} source files, ${objects.length} Git objects; no recognized credentials, private emails, personal paths, or unsafe tracked artifacts.`);
}
