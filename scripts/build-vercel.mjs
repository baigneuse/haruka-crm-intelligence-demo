import { cpSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";

const root = process.cwd();
const output = resolve(root, ".vercel/output");
if (dirname(output) !== resolve(root, ".vercel")) throw new Error("Unsafe deployment output path");
rmSync(output, { recursive: true, force: true });
const func = join(output, "functions/api.func");
mkdirSync(func, { recursive: true });
const staticRoot = join(output, "static");
mkdirSync(staticRoot, { recursive: true });
for (const file of ["index.html", "app.js", "styles.css", "favicon.svg"]) {
  cpSync(join(root, "public", file), join(staticRoot, file));
}
// Positive allowlist: reference SQL, tests, source maps, env, metadata and DB adapter never ship.
const folders = ["api", "agent", "analytics", "data", "domain"];
function copyJavaScript(source, destination) {
  mkdirSync(destination, { recursive: true });
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    if (entry.isDirectory()) copyJavaScript(join(source, entry.name), join(destination, entry.name));
    else if (entry.name.endsWith(".js")) cpSync(join(source, entry.name), join(destination, entry.name));
  }
}
for (const folder of folders) copyJavaScript(join(root, "dist", folder), join(func, folder));
mkdirSync(join(func, "repositories"));
for (const file of ["crm-repository.js", "in-memory-crm-repository.js"]) {
  cpSync(join(root, "dist/repositories", file), join(func, "repositories", file));
}
const json = (file, data) => writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
json(join(func, "package.json"), { private: true, type: "module" });
json(join(func, ".vc-config.json"), {
  runtime: "nodejs22.x", handler: "api/node-handler.js", launcherType: "Nodejs",
  shouldAddHelpers: false, shouldAddSourcemapSupport: false, maxDuration: 10,
});
json(join(output, "config.json"), {
  version: 3,
  routes: [
    { src: "/(.*)", headers: {
      "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Referrer-Policy": "no-referrer",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
    }, continue: true },
    { src: "/api/(.*)", dest: "/api", headers: { "Cache-Control": "no-store" } },
    { handle: "filesystem" },
    { src: "/.*", status: 404 },
  ],
});
console.log("Built synthetic-only deployment: four static assets and one read-only function; no database adapter.");
