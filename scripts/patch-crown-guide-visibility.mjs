import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const env = Object.fromEntries(
  fs
    .readFileSync("env", "utf8")
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
const BASE = `https://${SHOP}/admin/api/${API_VERSION}`;
const CROWN_GUIDE_URL = "/pages/deity-crown-mukut-kireedam-size-guide";

if (!SHOP || !TOKEN) {
  console.error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN");
  process.exit(1);
}

const headers = {
  "X-Shopify-Access-Token": TOKEN,
  "Content-Type": "application/json"
};

async function rest(pathname, options = {}) {
  const res = await fetch(`${BASE}${pathname}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) }
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

async function mainTheme() {
  const json = await rest("/themes.json");
  const theme = (json.themes || []).find((item) => item.role === "main");
  if (!theme) throw new Error("No main theme found");
  return theme;
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

function patchFitPanel(value) {
  if (value.includes(CROWN_GUIDE_URL)) return value;
  let next = value;
  const flagAnchor = "  assign crown_measurement = ''";
  const flagCode = `  assign is_crown_product = false
  if product_title_lc contains 'crown' or product_title_lc contains 'mukut' or product_title_lc contains 'kireed' or product_title_lc contains 'kirita' or ornament_type contains 'Crown' or ornament_type contains 'Mukut' or ornament_type contains 'Kireed'
    assign is_crown_product = true
  endif
`;
  if (!next.includes("assign is_crown_product")) {
    next = next.replace(flagAnchor, `${flagCode}${flagAnchor}`);
  }
  const whatsappAnchor = `    <a href="https://wa.me/917337294499?text={{ 'Hello Golden Collections, I need help checking deity jewellery size for ' | append: product.title | url_encode }}" class="gc-deity-fit__whatsapp">`;
  const actionCode = `    <a href="/pages/how-to-measure-idol-for-deity-jewellery" class="gc-deity-fit__guide">
      Open size guide
    </a>
    {%- if is_crown_product -%}
      <a href="${CROWN_GUIDE_URL}" class="gc-deity-fit__guide">
        Crown size guide
      </a>
    {%- endif -%}
${whatsappAnchor}`;
  if (!next.includes(whatsappAnchor)) throw new Error("Missing fit-panel WhatsApp anchor");
  return next.replace(whatsappAnchor, actionCode);
}

function patchLiteHelp(value) {
  if (value.includes(CROWN_GUIDE_URL)) return value;
  let next = value;
  const liquidAnchor = "  assign ornament_type = ornament_ref.name.value | default: ornament_ref.name | default: product.metafields.custom.ornament_type.value | default: product.metafields.custom.ornament_type | default: product.type";
  const liquidCode = `${liquidAnchor}
  assign product_title_lc = product.title | downcase
  assign is_crown_product = false
  if product_title_lc contains 'crown' or product_title_lc contains 'mukut' or product_title_lc contains 'kireed' or product_title_lc contains 'kirita' or ornament_type contains 'Crown' or ornament_type contains 'Mukut' or ornament_type contains 'Kireed'
    assign is_crown_product = true
  endif`;
  if (!next.includes("assign is_crown_product")) {
    if (!next.includes(liquidAnchor)) throw new Error("Missing lite-help liquid anchor");
    next = next.replace(liquidAnchor, liquidCode);
  }
  const linkAnchor = `  <a href="/pages/how-to-measure-idol-for-deity-jewellery">Size Help</a>`;
  const linkCode = `  <div class="gc-deity-lite-help__actions">
    {%- if is_crown_product -%}
      <a href="${CROWN_GUIDE_URL}">Crown Guide</a>
    {%- endif -%}
    <a href="/pages/how-to-measure-idol-for-deity-jewellery">Size Help</a>
  </div>`;
  if (!next.includes(linkAnchor)) throw new Error("Missing lite-help link anchor");
  next = next.replace(linkAnchor, linkCode);
  const cssAnchor = `  .gc-deity-lite-help a {`;
  const cssCode = `  .gc-deity-lite-help__actions {
    display: flex;
    flex: 0 0 auto;
    flex-wrap: wrap;
    gap: 0.6rem;
    justify-content: flex-end;
  }

${cssAnchor}`;
  if (!next.includes("gc-deity-lite-help__actions {")) {
    next = next.replace(cssAnchor, cssCode);
  }
  const mobileAnchor = `    .gc-deity-lite-help a {
      justify-content: center;
      width: 100%;
    }`;
  const mobileCode = `    .gc-deity-lite-help__actions {
      flex-direction: column;
    }

${mobileAnchor}`;
  if (!next.includes("flex-direction: column;")) {
    next = next.replace(mobileAnchor, mobileCode);
  }
  return next;
}

function patchOrnamentFooter(value) {
  if (value.includes("gc-ornament-footer__guide-callout")) return value;
  let next = value;
  const faqAnchor = `      <div class="gc-ornament-footer__faq-list">
        <details>`;
  const faqCode = `      <div class="gc-ornament-footer__faq-list">
        {%- if collection_handle_lc contains 'crown' or collection_title_lc contains 'crown' or collection_handle_lc contains 'mukut' or collection_title_lc contains 'mukut' or collection_handle_lc contains 'kireed' or collection_title_lc contains 'kireed' -%}
          <div class="gc-ornament-footer__guide-callout">
            <strong>Choosing a crown?</strong>
            <span>Use the crown, mukut and kireedam guide to compare idol height, head width, crown height, depth and crown style before ordering.</span>
            <a href="${CROWN_GUIDE_URL}">Open crown size guide</a>
          </div>
        {%- endif -%}

        <details>`;
  if (!next.includes(faqAnchor)) throw new Error("Missing ornament footer FAQ anchor");
  next = next.replace(faqAnchor, faqCode);
  const cssAnchor = `  .gc-ornament-footer details {`;
  const cssCode = `  .gc-ornament-footer__guide-callout {
    background: #fff7e8;
    border: 1px solid rgba(143, 31, 24, 0.18);
    border-left: 4px solid #8f1f18;
    border-radius: 8px;
    display: grid;
    gap: 0.35rem;
    padding: 1rem;
  }

  .gc-ornament-footer__guide-callout strong {
    color: #21180d;
    font-family: 'New York', 'Times New Roman', serif;
    font-size: 1.45rem;
    line-height: 1.16;
  }

  .gc-ornament-footer__guide-callout span {
    color: #5f5549;
    font-size: 1.16rem;
    line-height: 1.35;
  }

  .gc-ornament-footer__guide-callout a {
    color: #8f1f18;
    font-size: 1.14rem;
    font-weight: 700;
    text-decoration: none;
  }

${cssAnchor}`;
  if (!next.includes("gc-ornament-footer__guide-callout {")) {
    next = next.replace(cssAnchor, cssCode);
  }
  const mediaAnchor = `    .gc-ornament-footer__faq-list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }`;
  const mediaCode = `${mediaAnchor}

    .gc-ornament-footer__guide-callout {
      grid-column: 1 / -1;
    }`;
  if (!next.includes("grid-column: 1 / -1;")) {
    next = next.replace(mediaAnchor, mediaCode);
  }
  return next;
}

const patchers = {
  "snippets/deity-fit-panel.liquid": patchFitPanel,
  "snippets/deity-lite-size-help.liquid": patchLiteHelp,
  "sections/ornament-collection-footer.liquid": patchOrnamentFooter
};

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  const theme = await mainTheme();
  console.log(`Main theme: ${theme.name} (${theme.id})`);
  for (const [key, patcher] of Object.entries(patchers)) {
    const current = await getAsset(theme.id, key);
    const next = patcher(current);
    if (next === current) {
      console.log(`[NOOP] ${key}`);
      continue;
    }
    console.log(`[${APPLY ? "PATCH" : "DRY PATCH"}] ${key}`);
    await putAsset(theme.id, key, next);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
