import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
// The installed legacy Sites packager accepts Workers only. Stage the native
// static.directory contract without adding a server to this Vite application.
const stage = fs.mkdtempSync(path.join(os.tmpdir(), "usf-static-"));
const out = process.argv[2] || "/private/tmp/usf-campus-drive.tar.gz";
fs.accessSync("dist/index.html");
const manifest = JSON.parse(fs.readFileSync(".openai/hosting.json", "utf8"));
if (manifest.static?.directory !== "dist")
  throw new Error("Expected dist static output");
fs.cpSync("dist", path.join(stage, "dist"), { recursive: true });
for (const dir of [".openai", "dist/.openai"]) {
  fs.mkdirSync(path.join(stage, dir), { recursive: true });
  fs.copyFileSync(
    ".openai/hosting.json",
    path.join(stage, dir, "hosting.json"),
  );
}
execFileSync("tar", ["-czf", out, "-C", stage, "dist", ".openai"]);
const entries = execFileSync("tar", ["-tzf", out], { encoding: "utf8" });
for (const name of [
  "dist/index.html",
  ".openai/hosting.json",
  "dist/.openai/hosting.json",
])
  if (!entries.split("\n").includes(name)) throw new Error(`Missing ${name}`);
console.log(out);
fs.rmSync(stage, { recursive: true });
