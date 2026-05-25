#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const OUT_DIR = path.join(root, "tmp", "hastham-padam-ucp-sprint");
const env = readEnv(path.join(root, "env"));
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const GRAPHQL_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;
const APPLY = process.argv.includes("--apply");
const APPLIED_TITLE_FILE = path.join(OUT_DIR, "applied-hastham-padam-title-disambiguation.json");

if (!SHOP || !TOKEN) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
}

const titleUpdates = JSON.parse(fs.readFileSync(APPLIED_TITLE_FILE, "utf8")).applied || [];
const products = await fetchProductsByIds(titleUpdates.map((update) => update.id));
const changes = [];

for (const update of titleUpdates) {
  const product = products.get(update.id);
  if (!product?.descriptionHtml) continue;
  let nextDescriptionHtml = product.descriptionHtml;
  nextDescriptionHtml = replaceEscaped(nextDescriptionHtml, update.oldTitle, update.newTitle);
  if (/Lotus Hands Legs Hastham Padam/i.test(update.newTitle)) {
    nextDescriptionHtml = nextDescriptionHtml.replace(/\bis a lotus hands set\b/i, "is a lotus hands and legs hastham padam set");
  }
  if (nextDescriptionHtml === product.descriptionHtml) continue;
  changes.push({
    id: product.id,
    handle: product.handle,
    title: product.title,
    oldTitle: update.oldTitle,
    newTitle: update.newTitle,
    oldSnippet: stripHtml(product.descriptionHtml).slice(0, 260),
    newSnippet: stripHtml(nextDescriptionHtml).slice(0, 260),
    descriptionHtml: nextDescriptionHtml
  });
}

const previewPath = path.join(OUT_DIR, "hastham-padam-description-title-sync-preview.json");
fs.writeFileSync(previewPath, `${JSON.stringify(changes.map(({ descriptionHtml, ...change }) => change), null, 2)}\n`);

if (!APPLY) {
  console.log(`Previewed ${changes.length} hastham/padam description title sync updates at ${path.relative(root, previewPath)}`);
  process.exit(0);
}

const applied = [];
for (const change of changes) {
  await productUpdate({ id: change.id, descriptionHtml: change.descriptionHtml });
  applied.push({ ...change, descriptionHtml: undefined, appliedAt: new Date().toISOString() });
  console.log(`Updated description: ${change.handle}`);
}

const appliedPath = path.join(OUT_DIR, "applied-hastham-padam-description-title-sync.json");
fs.writeFileSync(appliedPath, `${JSON.stringify(applied, null, 2)}\n`);
console.log(`Applied ${applied.length} hastham/padam description title sync updates at ${path.relative(root, appliedPath)}`);

function replaceEscaped(html, from, to) {
  const escapedFrom = escapeHtml(from);
  if (html.includes(escapedFrom)) return html.replace(escapedFrom, escapeHtml(to));
  return html.replace(from, to);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function stripHtml(value) {
  return String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
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

async function fetchProductsByIds(ids) {
  const products = new Map();
  for (let index = 0; index < ids.length; index += 20) {
    const chunk = ids.slice(index, index + 20);
    const data = await gql(
      `query Products($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on Product {
            id
            title
            handle
            descriptionHtml
          }
        }
      }`,
      { ids: chunk }
    );
    for (const product of data.nodes.filter(Boolean)) products.set(product.id, product);
  }
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
