#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const OUT_DIR = path.join(root, "tmp", "deity-short-necklace-ucp-sprint");
const env = readEnv(path.join(root, "env"));
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const APPLY_FILE = argValue("--apply-file") || path.join(OUT_DIR, "approved-short-necklace-measurement-alt-updates.json");

if (!SHOP || !TOKEN) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
}

const updates = JSON.parse(fs.readFileSync(APPLY_FILE, "utf8"));
if (!Array.isArray(updates)) throw new Error(`Expected ${APPLY_FILE} to contain an array`);

const safeUpdates = updates.filter((update) => update.approved === true && update.legacyResourceId && update.imageLegacyId && update.alt);
if (!safeUpdates.length) {
  console.log("No approved short-necklace measurement alt updates found.");
  process.exit(0);
}

const applied = [];
for (const update of safeUpdates) {
  await rest(`/products/${update.legacyResourceId}/images/${update.imageLegacyId}.json`, {
    method: "PUT",
    body: JSON.stringify({ image: { id: Number(update.imageLegacyId), alt: update.alt } })
  });
  applied.push(update);
  console.log(`Updated alt: ${update.handle} image ${update.position}`);
}

const output = path.join(OUT_DIR, "applied-short-necklace-measurement-alt-updates.json");
fs.writeFileSync(output, `${JSON.stringify(applied, null, 2)}\n`);
console.log(`Wrote ${path.relative(root, output)}`);

async function rest(resourcePath, options = {}) {
  const response = await fetch(`https://${SHOP}/admin/api/${API_VERSION}${resourcePath}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN,
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${resourcePath} failed: ${response.status} ${text}`);
  }
  return text ? JSON.parse(text) : {};
}

function argValue(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : "";
}

function readEnv(filePath) {
  return Object.fromEntries(
    fs
      .readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, "")];
      })
  );
}
