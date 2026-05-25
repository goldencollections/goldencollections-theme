#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const APPLY = process.argv.includes("--apply");
const ENV_FILE = "env";
const root = process.cwd();

const LOCAL_UPLOAD_ASSETS = [
  "layout/theme.liquid",
  "snippets/organization-schema.liquid",
  "sections/main-product.liquid",
  "sections/rich-text.liquid",
  "templates/collection.json",
  "templates/collection.deity-main-collections.json",
  "templates/collection.deity-ornament-default.json",
  "templates/collection.real-kemp.json",
  "templates/collection.black-kemp.json"
];

const SETTINGS_ASSET = "config/settings_data.json";
const FACEBOOK_OLD = "https://www.facebook.com/goldencolletions/";
const FACEBOOK_NEW = "https://www.facebook.com/goldencollections/";
const X_PROFILE = "https://x.com/GCJewellery";
const CANONICAL_ID_ASSETS = [
  "snippets/dance-collection-schema.liquid",
  "snippets/deity-product-schema.liquid",
  "snippets/deity-collection-schema.liquid",
  "snippets/gc-anil-half-crown-fit-video.liquid",
  "snippets/dance-collection-schema-v2.liquid",
  "sections/dance-collection-hub.liquid",
  "templates/page.golden-glossary.liquid",
  "sections/gc-anil-fit-video.liquid",
  "sections/gc-anil-authority-profile.liquid",
  "sections/gc-deity-authority-hub.liquid",
  "sections/gc-deity-compatibility-guide.liquid",
  "sections/gc-deity-crown-guide.liquid",
  "sections/gc-proof-stories-hub.liquid",
  "sections/gc-idol-measurement-guide.liquid",
  "sections/gc-varalakshmi-examples.liquid",
  "sections/gc-knowledge-hub.liquid",
  "sections/main-article.liquid"
];

const env = readEnv(path.join(root, ENV_FILE));
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const REST_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}`;

if (!SHOP || !TOKEN) {
  console.error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN");
  process.exit(1);
}

function readEnv(file) {
  return Object.fromEntries(
    fs
      .readFileSync(file, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, "")];
      })
  );
}

async function rest(pathname, options = {}) {
  const res = await fetch(`${REST_ENDPOINT}${pathname}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN,
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }
  }
  if (!res.ok) throw new Error(`REST ${options.method || "GET"} ${pathname} HTTP ${res.status}: ${text}`);
  return json;
}

async function findMainTheme() {
  const json = await rest("/themes.json");
  const themes = json.themes || [];
  const main = themes.find((theme) => theme.role === "main");
  if (!main) throw new Error(`No main theme found. Themes: ${themes.map((theme) => `${theme.id}:${theme.role}`).join(", ")}`);
  return main;
}

async function getAsset(themeId, key) {
  const json = await rest(`/themes/${themeId}/assets.json?asset[key]=${encodeURIComponent(key)}`);
  return json.asset?.value || "";
}

async function putAsset(themeId, key, value) {
  if (!APPLY) {
    console.log(`[DRY PUT] ${key}`);
    return;
  }
  await rest(`/themes/${themeId}/assets.json`, {
    method: "PUT",
    body: JSON.stringify({ asset: { key, value } })
  });
}

async function uploadLocalAsset(themeId, key) {
  const value = fs.readFileSync(path.join(root, key), "utf8");
  console.log(`[${APPLY ? "UPLOAD" : "DRY UPLOAD"}] ${key}`);
  await putAsset(themeId, key, value);
}

function splitShopifyJson(value) {
  const prefixMatch = value.match(/^\s*\/\*[\s\S]*?\*\/\s*/);
  const prefix = prefixMatch?.[0] || "";
  const body = value.slice(prefix.length);
  return { prefix, json: JSON.parse(body) };
}

function patchSocialSettings(node, stats = { facebook: 0, twitter: 0 }) {
  if (!node || typeof node !== "object") return stats;

  if (Object.prototype.hasOwnProperty.call(node, "social_facebook_link")) {
    if (String(node.social_facebook_link || "").includes("goldencolletions")) {
      node.social_facebook_link = FACEBOOK_NEW;
      stats.facebook += 1;
    }
  }

  if (Object.prototype.hasOwnProperty.call(node, "social_twitter_link")) {
    if (!String(node.social_twitter_link || "").trim()) {
      node.social_twitter_link = X_PROFILE;
      stats.twitter += 1;
    }
  }

  for (const value of Object.values(node)) patchSocialSettings(value, stats);
  return stats;
}

async function patchSettingsData(themeId) {
  const liveValue = await getAsset(themeId, SETTINGS_ASSET);
  if (!liveValue) throw new Error(`Live asset missing: ${SETTINGS_ASSET}`);

  const { prefix, json } = splitShopifyJson(liveValue);
  const stats = patchSocialSettings(json);

  if (stats.facebook === 0 && stats.twitter === 0) {
    console.log(`[NOOP] ${SETTINGS_ASSET}`);
    return;
  }

  const patched = `${prefix}${JSON.stringify(json, null, 2)}\n`;
  console.log(`[${APPLY ? "PATCH" : "DRY PATCH"}] ${SETTINGS_ASSET} facebook=${stats.facebook} twitter=${stats.twitter}`);
  await putAsset(themeId, SETTINGS_ASSET, patched);
}

async function patchCanonicalEntityIds(themeId, key) {
  const liveValue = await getAsset(themeId, key);
  if (!liveValue) {
    console.log(`[SKIP] live asset missing: ${key}`);
    return;
  }

  const patched = liveValue
    .split("https://goldencollections.com/#organization")
    .join("https://www.goldencollections.com/#organization")
    .split("https://goldencollections.com/#website")
    .join("https://www.goldencollections.com/#website");

  if (patched === liveValue) {
    console.log(`[NOOP] ${key}`);
    return;
  }

  console.log(`[${APPLY ? "PATCH" : "DRY PATCH"}] ${key}`);
  await putAsset(themeId, key, patched);
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  const theme = await findMainTheme();
  console.log(`Main theme: ${theme.name} (${theme.id})`);

  for (const key of LOCAL_UPLOAD_ASSETS) {
    await uploadLocalAsset(theme.id, key);
  }

  await patchSettingsData(theme.id);
  for (const key of CANONICAL_ID_ASSETS) {
    await patchCanonicalEntityIds(theme.id, key);
  }
  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
