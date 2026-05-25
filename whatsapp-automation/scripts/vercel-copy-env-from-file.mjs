import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const file = process.argv[2] || ".env.vercel.old.local";
const target = process.argv[3] || "production";

if (!fs.existsSync(file)) {
  throw new Error(`Env file not found: ${file}`);
}

const rows = parseEnv(fs.readFileSync(file, "utf8"));
const filteredRows = rows.filter(([key]) => shouldCopy(key));
if (!filteredRows.length) {
  throw new Error(`No env vars found in ${file}`);
}

console.log(`Copying ${filteredRows.length} env vars from ${path.basename(file)} to Vercel ${target}. Values will not be printed.`);

for (const [key, value] of filteredRows) {
  await addEnv(key, value, target);
  console.log(`Added ${key}`);
}

function parseEnv(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    value = value.replace(/^['"]|['"]$/g, "");
    if (!key) continue;
    rows.push([key, value]);
  }
  return rows;
}

function addEnv(key, value, target) {
  return new Promise((resolve, reject) => {
    const command = process.platform === "win32" ? "npx.cmd" : "npx";
    const args = ["vercel", "env", "add", key, target, "--force", "--yes", "--value", value];
    const child = spawn(
      command,
      args,
      { stdio: ["ignore", "pipe", "pipe"] },
    );

    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Failed adding ${key}: ${redact(output)}`));
        return;
      }
      resolve();
    });
  });
}

function redact(text) {
  return text.replace(/[A-Za-z0-9_+=/.-]{16,}/g, "[redacted]");
}

function shouldCopy(key) {
  if (key === "NX_DAEMON") return false;
  if (key.startsWith("TURBO_")) return false;
  if (key === "VERCEL" || key.startsWith("VERCEL_")) return false;
  return true;
}
