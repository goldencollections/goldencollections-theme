#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const OUT_DIR = path.join(root, "tmp", "deity-waist-belt-ucp-sprint");
const env = readEnv(path.join(root, "env"));
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const GRAPHQL_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;

const APPLY = process.argv.includes("--apply");
const TARGET_SKUS = [
  "DWB-007",
  "DWB-028",
  "DWB-012",
  "DWB-011",
  "DWB-002",
  "DWB-006",
  "DWB-025",
  "DWB-005",
  "DWB-004",
  "DWB-014",
  "DWB-017",
  "DWB-022",
  "DWB-023"
];

const VARALAKSHMI_REGIONAL_NAMES = [
  "Vaddanam",
  "Oddiyanam",
  "Waist Belt",
  "Kamarband",
  "Kati Sutra",
  "Deity waist ornament",
  "Goddess waist belt",
  "Varalakshmi vaddanam",
  "Varalakshmi waist belt",
  "Lakshmi vaddanam",
  "Amman vaddanam",
  "Ammavaru vaddanam",
  "Goddess vaddanam"
];

if (!SHOP || !TOKEN) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const products = [];
for (const sku of TARGET_SKUS) {
  const product = await fetchProductBySku(sku);
  if (product) products.push(product);
}

const updates = products
  .filter((product) => product.status === "ACTIVE")
  .filter((product) => totalInventory(product) > 0)
  .map((product) => {
    const sku = firstMatchingSku(product);
    const newTitle = waistBeltTitle(product.title, sku);
    const descriptionTag = `Shop ${newTitle} for Varalakshmi, Lakshmi / Amman and other god or goddess idols. Check waist length, size guidance and product photos before ordering.`;
    return {
      id: product.id,
      oldTitle: product.title,
      newTitle,
      handle: product.handle,
      sku,
      inventory: totalInventory(product),
      metafields: [
        {
          ownerId: product.id,
          namespace: "custom",
          key: "regional_names",
          type: "list.single_line_text_field",
          value: JSON.stringify(VARALAKSHMI_REGIONAL_NAMES)
        },
        {
          ownerId: product.id,
          namespace: "global",
          key: "description_tag",
          type: "single_line_text_field",
          value: descriptionTag
        },
        {
          ownerId: product.id,
          namespace: "global",
          key: "title_tag",
          type: "single_line_text_field",
          value: `${newTitle} | Golden Collections`
        }
      ]
    };
  });

const previewPath = path.join(OUT_DIR, "varalakshmi-waist-belt-disambiguation-preview.json");
fs.writeFileSync(previewPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), updates }, null, 2)}\n`);

if (!APPLY) {
  console.log(`Previewed ${updates.length} waist-belt updates at ${path.relative(root, previewPath)}`);
  process.exit(0);
}

const applied = [];
for (const update of updates) {
  await productUpdate({ id: update.id, title: update.newTitle });
  await metafieldsSet(update.metafields);
  applied.push({ ...update, appliedAt: new Date().toISOString() });
}

const appliedPath = path.join(OUT_DIR, "applied-varalakshmi-waist-belt-disambiguation.json");
fs.writeFileSync(appliedPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), applied }, null, 2)}\n`);
console.log(`Applied ${applied.length} waist-belt updates at ${path.relative(root, appliedPath)}`);

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

function waistBeltTitle(title, sku) {
  const withoutSku = title.replace(/\s*DWB\s*-?\s*\d+\b/i, "").trim();
  const base = withoutSku.replace(/^Deity Vaddanam Waist Belt/i, "Deity Vaddanam Waist Belt for Varalakshmi / Goddess Idol");
  return `${base} ${sku}`.replace(/\s+/g, " ").trim();
}

function firstMatchingSku(product) {
  const skus = product.variants.nodes.map((variant) => variant.sku).filter(Boolean);
  return TARGET_SKUS.find((target) => skus.some((sku) => sku.toUpperCase().startsWith(target))) || skus[0] || "";
}

function totalInventory(product) {
  return product.variants.nodes.reduce((sum, variant) => sum + (variant.inventoryQuantity || 0), 0);
}

async function fetchProductBySku(sku) {
  const data = await gql(
    `query ProductBySku($query: String!) {
      products(first: 5, query: $query) {
        nodes {
          id
          title
          handle
          status
          productType
          variants(first: 40) { nodes { sku inventoryQuantity } }
        }
      }
    }`,
    { query: `sku:${sku}` }
  );
  return data.products.nodes.find((product) => product.productType === "Deity Waist Belt") || data.products.nodes[0] || null;
}

async function productUpdate(input) {
  const data = await gql(
    `mutation ProductUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        product { id title }
        userErrors { field message }
      }
    }`,
    { input }
  );
  const errors = data.productUpdate.userErrors || [];
  if (errors.length) throw new Error(JSON.stringify(errors, null, 2));
}

async function metafieldsSet(metafields) {
  const data = await gql(
    `mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { id namespace key value }
        userErrors { field message code }
      }
    }`,
    { metafields }
  );
  const errors = data.metafieldsSet.userErrors || [];
  if (errors.length) throw new Error(JSON.stringify(errors, null, 2));
}

async function gql(query, variables = {}) {
  const response = await fetchWithRetry(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN
    },
    body: JSON.stringify({ query, variables })
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : null;
  if (!response.ok || json?.errors) {
    throw new Error(`GraphQL HTTP ${response.status}: ${text.slice(0, 1200)}`);
  }
  return json.data;
}

async function fetchWithRetry(url, options, attempts = 3) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetch(url, options);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }
  throw lastError;
}
