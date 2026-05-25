import fs from "node:fs";
import path from "node:path";

const APPLY = process.argv.includes("--apply");
const ONLY_ANIL_FIT_VIDEO = process.argv.includes("--only-anil-fit-video");
const ENV_FILE = "env";
const root = process.cwd();

const env = Object.fromEntries(
  fs
    .readFileSync(path.join(root, ENV_FILE), "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    })
);

const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const REST_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}`;

if (!SHOP || !TOKEN) {
  console.error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN");
  process.exit(1);
}

const authorityAssets = [
  "sections/gc-knowledge-hub.liquid",
  "templates/page.golden-collections-knowledge-hub.json",
  "templates/page.golden-glossary.liquid",
  "sections/gc-anil-authority-profile.liquid",
  "templates/page.anil-tunk.json",
  "sections/gc-deity-authority-hub.liquid",
  "templates/page.deity-jewellery-alankaram-guide.json",
  "sections/gc-idol-measurement-guide.liquid",
  "templates/page.how-to-measure-idol-for-deity-jewellery.json",
  "templates/page.deity-size-guide.json",
  "sections/main-page.liquid",
  "sections/footer.liquid",
  "sections/gc-anil-fit-video.liquid",
  "sections/gc-deity-crown-guide.liquid",
  "templates/page.deity-crown-mukut-kireedam-size-guide.json",
  "sections/gc-authority-simple-guide.liquid",
  "templates/page.deity-jewellery-regional-names.json",
  "templates/page.short-haram-vs-long-haram-for-god-idols.json",
  "templates/page.varalakshmi-alankaram-guide.json",
  "sections/gc-deity-compatibility-guide.liquid",
  "templates/page.lakshmi-varalakshmi-deity-jewellery-guide.json",
  "templates/page.balaji-vishnu-perumal-deity-jewellery-guide.json",
  "templates/page.ganesha-deity-crown-ornament-guide.json",
  "templates/page.krishna-deity-jewellery-guide.json",
  "templates/page.amman-devi-alankaram-jewellery-guide.json",
  "templates/page.how-golden-collections-checks-deity-jewellery-fit.json"
];

const anilFitVideoAssets = [
  "snippets/gc-anil-half-crown-fit-video.liquid",
  "sections/gc-anil-fit-video.liquid",
  "sections/gc-idol-measurement-guide.liquid",
  "sections/gc-deity-compatibility-guide.liquid",
  "templates/page.how-to-measure-idol-for-deity-jewellery.json",
  "templates/page.how-golden-collections-checks-deity-jewellery-fit.json",
  "templates/page.anil-tunk.json",
  "templates/page.deity-crown-mukut-kireedam-size-guide.json"
];

const uploadFromLocal = ONLY_ANIL_FIT_VIDEO ? anilFitVideoAssets : authorityAssets;

const patchLiveAssets = [
  "snippets/deity-lite-size-help.liquid",
  "snippets/deity-fit-panel.liquid",
  "snippets/facets.liquid",
  "sections/deity-product-story.liquid",
  "sections/ornament-collection-footer.liquid",
  "sections/shop-by-deity-root.liquid"
];

const OLD_SIZE_URL = "/pages/deity-jewellery-size-guide";
const NEW_SIZE_URL = "/pages/how-to-measure-idol-for-deity-jewellery";

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
    console.log(`[DRY ASSET] put ${key}`);
    return;
  }
  await rest(`/themes/${themeId}/assets.json`, {
    method: "PUT",
    body: JSON.stringify({
      asset: {
        key,
        value
      }
    })
  });
}

async function uploadLocalAsset(themeId, key) {
  const fullPath = path.join(root, key);
  const value = fs.readFileSync(fullPath, "utf8");
  console.log(`[${APPLY ? "UPLOAD" : "DRY UPLOAD"}] ${key}`);
  await putAsset(themeId, key, value);
}

async function patchLiveAsset(themeId, key) {
  const liveValue = await getAsset(themeId, key);
  if (!liveValue) {
    console.log(`[SKIP] live asset missing or empty: ${key}`);
    return;
  }
  if (!liveValue.includes(OLD_SIZE_URL)) {
    console.log(`[NOOP] ${key} has no old size-guide URL`);
    return;
  }
  const patched = liveValue.split(OLD_SIZE_URL).join(NEW_SIZE_URL);
  console.log(`[${APPLY ? "PATCH" : "DRY PATCH"}] ${key}`);
  await putAsset(themeId, key, patched);
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  if (ONLY_ANIL_FIT_VIDEO) console.log("Scope: Anil half-crown fit video assets only");
  const theme = await findMainTheme();
  console.log(`Main theme: ${theme.name} (${theme.id})`);

  for (const key of uploadFromLocal) {
    await uploadLocalAsset(theme.id, key);
  }

  if (!ONLY_ANIL_FIT_VIDEO) {
    for (const key of patchLiveAssets) {
      await patchLiveAsset(theme.id, key);
    }
  }

  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
