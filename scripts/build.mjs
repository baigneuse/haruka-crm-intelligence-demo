import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { resolve, dirname } from "node:path";

const root = process.cwd();
const output = resolve(root, "dist");
if (dirname(output) !== root) throw new Error("Unsafe build output path");
// Only this compiler-owned output is removed; old source maps must not survive a build.
rmSync(output, { recursive: true, force: true });
execFileSync(process.execPath, ["node_modules/typescript/bin/tsc", "-p", "tsconfig.build.json"], { stdio: "inherit" });
