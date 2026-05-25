#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const OUT_DIR = path.join(root, "tmp", "varalakshmi-face-ucp-sprint");
const env = readEnv(path.join(root, "env"));
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const GRAPHQL_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;
const APPLY = process.argv.includes("--apply");
const COLLECTION_HANDLE = "varalakshmi-doll-faces";

if (!SHOP || !TOKEN) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const products = await fetchCollectionProducts();
const updates = products
  .filter((product) => product.status === "ACTIVE")
  .filter((product) => product.totalInventory > 0)
  .filter((product) => /\bGoddess Face(s)? Mugham\b/i.test(product.title))
  .map((product) => {
    const newTitle = product.title.replace(/\bGoddess Face(s)? Mugham\b/i, "Goddess Doll Face$1 Mugham");
    const newDescriptionHtml = product.descriptionHtml
      ? product.descriptionHtml.replaceAll(escapeHtml(product.title), escapeHtml(newTitle)).replaceAll(product.title, newTitle)
      : "";
    return {
      id: product.id,
      oldTitle: product.title,
      newTitle,
      handle: product.handle,
      descriptionChanged: Boolean(newDescriptionHtml && newDescriptionHtml !== product.descriptionHtml),
      descriptionHtml: newDescriptionHtml
    };
  });

const previewPath = path.join(OUT_DIR, "face-doll-title-refinement-preview.json");
fs.writeFileSync(previewPath, `${JSON.stringify(updates.map(({ descriptionHtml, ...update }) => update), null, 2)}\n`);

if (!APPLY) {
  console.log(`Previewed ${updates.length} face doll-title refinement updates at ${path.relative(root, previewPath)}`);
  process.exit(0);
}

const applied = [];
for (const update of updates) {
  const input = { id: update.id, title: update.newTitle };
  if (update.descriptionChanged) input.descriptionHtml = update.descriptionHtml;
  await productUpdate(input);
  applied.push({ ...update, descriptionHtml: undefined, appliedAt: new Date().toISOString() });
}

const appliedPath = path.join(OUT_DIR, "applied-face-doll-title-refinement.json");
fs.writeFileSync(appliedPath, `${JSON.stringify(applied, null, 2)}\n`);
console.log(`Applied ${applied.length} face doll-title refinement updates at ${path.relative(root, appliedPath)}`);

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
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

async function fetchCollectionProducts() {
  const products = [];
  let after = null;
  do {
    const data = await gql(
      `query Products($handle: String!, $after: String) {
        collectionByHandle(handle: $handle) {
          products(first: 100, after: $after) {
            pageInfo { hasNextPage endCursor }
            nodes {
              id
              title
              handle
              status
              totalInventory
              descriptionHtml
            }
          }
        }
      }`,
      { handle: COLLECTION_HANDLE, after }
    );
    const page = data.collectionByHandle?.products;
    if (!page) throw new Error(`Collection not found: ${COLLECTION_HANDLE}`);
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
