import { access, readdir, readFile } from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";

const root = process.cwd();
const ignoredDirectories = new Set([".git", ".vercel", ".npm-cache", ".test-dist", "node_modules", "dist", "coverage"]);
const markdownFiles = [];
const failures = [];
const externalLinks = new Set();
const slug = (value) => value.toLowerCase().replace(/[^\p{L}\p{N}_\- ]/gu, "").replace(/ /g, "-");

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (extname(entry.name).toLowerCase() === ".md") markdownFiles.push(path);
  }
}

await walk(root);
for (const file of markdownFiles) {
  const content = (await readFile(file, "utf8")).replace(/```[\s\S]*?```/g, "");
  const links = content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g);
  for (const match of links) {
    const rawTarget = match[1]?.trim();
    if (!rawTarget) continue;
    if (/^https?:/.test(rawTarget)) { externalLinks.add(rawTarget); continue; }
    const target = rawTarget.replace(/^<|>$/g, "").split("#")[0];
    const path = target ? resolve(dirname(file), decodeURIComponent(target)) : file;
    const anchor = rawTarget.split("#")[1];
    try {
      await access(path);
      if (relative(root, path).startsWith("..")) throw new Error("Link escapes repository");
      if (anchor && extname(path) === ".md") {
        const headings = [...(await readFile(path, "utf8")).matchAll(/^#{1,6}\s+(.+)$/gm)].map((heading) => slug(heading[1]));
        if (!headings.includes(decodeURIComponent(anchor))) throw new Error("Missing anchor");
      }
    } catch {
      failures.push(`${relative(root, file)} -> ${rawTarget}`);
    }
  }
}

if (process.argv.includes("--external")) {
  for (const url of externalLinks) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(15000), redirect: "follow" });
      await response.body?.cancel();
      if (!response.ok) failures.push(`External link returned ${response.status}: ${url}`);
    } catch { failures.push(`External link could not be verified: ${url}`); }
  }
}

if (failures.length > 0) {
  console.error("Broken local Markdown links:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Markdown links passed across ${markdownFiles.length} files (paths and anchors); ${externalLinks.size} external URLs ${process.argv.includes("--external") ? "verified" : "not fetched"}.`);
}
