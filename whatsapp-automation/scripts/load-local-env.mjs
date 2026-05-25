import fs from "node:fs";
import path from "node:path";

export function loadLocalEnv() {
  for (const file of [
    path.join(process.cwd(), ".env.local"),
    path.join(process.cwd(), ".env.vercel.new.local"),
    path.join(process.cwd(), ".env.scheduler.local"),
    path.join(process.cwd(), "..", "env"),
  ]) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([^#][^=]+)=(.*)$/);
      if (!match) continue;
      const key = match[1].trim();
      const value = match[2].trim().replace(/^['"]|['"]$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  }
}
