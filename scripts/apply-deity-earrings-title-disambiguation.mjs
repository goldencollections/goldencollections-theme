#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const OUT_DIR = path.join(root, "tmp", "deity-earrings-ucp-sprint");
const env = readEnv(path.join(root, "env"));
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const GRAPHQL_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;

const APPLY = process.argv.includes("--apply");
const COLLECTION_HANDLE = "deity-earrings-for-god-idols-statues";

if (!SHOP || !TOKEN) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const products = await fetchCollectionProducts(COLLECTION_HANDLE);
const updates = products
  .filter((product) => product.status === "ACTIVE")
  .filter((product) => totalInventory(product) > 0)
  .map((product) => {
    const newTitle = titleWithIdolIntent(product.title);
    if (!newTitle || newTitle === product.title) return null;
    return {
      id: product.id,
      oldTitle: product.title,
      newTitle,
      handle: product.handle,
      inventory: totalInventory(product),
      skus: product.variants.nodes.map((variant) => variant.sku).filter(Boolean)
    };
  })
  .filter(Boolean);

const previewPath = path.join(OUT_DIR, "deity-earrings-title-disambiguation-preview.json");
fs.writeFileSync(previewPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), updates }, null, 2)}\n`);

if (!APPLY) {
  console.log(`Previewed ${updates.length} deity earring title updates at ${path.relative(root, previewPath)}`);
  process.exit(0);
}

const applied = [];
for (const update of updates) {
  await productUpdate({ id: update.id, title: update.newTitle });
  applied.push({ ...update, appliedAt: new Date().toISOString() });
}

const appliedPath = path.join(OUT_DIR, "applied-deity-earrings-title-disambiguation.json");
fs.writeFileSync(appliedPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), applied }, null, 2)}\n`);
console.log(`Applied ${applied.length} deity earring title updates at ${path.relative(root, appliedPath)}`);

function titleWithIdolIntent(title) {
  if (/\bfor Goddess Idol\b/i.test(title)) return title;
  const skuMatch = title.match(/\bDGE\s*-?\s*\d+\b/i);
  const sku = skuMatch ? skuMatch[0].replace(/\s+/g, "") : "";
  const base = (sku ? title.replace(/\s*\bDGE\s*-?\s*\d+\b/i, "").trim() : title.trim())
    .replace(/\s+for God Idol$/i, "")
    .trim();
  const target = /Lakshmi|Amman|Goddess/i.test(base) ? "Goddess Idol" : "God Idol";
  const targetPhrase = target === "God Idol" ? "Balaji / God Idol" : target;
  return `${base} for ${targetPhrase}${sku ? ` ${sku}` : ""}`.replace(/\s+/g, " ").trim();
}

function totalInventory(product) {
  return product.variants.nodes.reduce((sum, variant) => sum + (variant.inventoryQuantity || 0), 0);
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

async function fetchCollectionProducts(handle) {
  const products = [];
  let after = null;
  do {
    const data = await gql(
      `query CollectionProducts($handle: String!, $after: String) {
        collectionByHandle(handle: $handle) {
          products(first: 100, after: $after) {
            pageInfo { hasNextPage endCursor }
            nodes {
              id
              title
              handle
              status
              productType
              variants(first: 20) { nodes { sku inventoryQuantity } }
            }
          }
        }
      }`,
      { handle, after }
    );
    const page = data.collectionByHandle?.products;
    if (!page) throw new Error(`Collection not found: ${handle}`);
    products.push(...page.nodes);
    after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (after);
  return products;
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
