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
const TARGET_TITLES = ["VVD137"];
const OLD_CLARIFIERS = [
  "This is a complete Varalakshmi idol/doll setup, not a face-only mugham replacement. If you need only the separate face or mugham, choose a Varalakshmi doll face product instead."
];
const CLARIFIER =
  "This is a complete Varalakshmi idol/doll setup sold as a finished setup, rather than a separate replacement part.";

if (!SHOP || !TOKEN) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const products = await fetchTargetProducts();
const changes = [];
for (const product of products) {
  const cleanedHtml = removeOldClarifiers(product.descriptionHtml || "");
  if (stripHtml(cleanedHtml).includes(CLARIFIER)) continue;
  const descriptionHtml = insertAfterFirstParagraph(cleanedHtml, `<p>${CLARIFIER}</p>`);
  changes.push({
    id: product.id,
    handle: product.handle,
    title: product.title,
    oldSnippet: stripHtml(product.descriptionHtml).slice(0, 360),
    newSnippet: stripHtml(descriptionHtml).slice(0, 520),
    descriptionHtml
  });
}

const previewPath = path.join(OUT_DIR, "full-idol-face-query-disambiguation-preview.json");
fs.writeFileSync(previewPath, `${JSON.stringify(changes.map(({ descriptionHtml, ...change }) => change), null, 2)}\n`);

if (!APPLY) {
  console.log(`Previewed ${changes.length} full-idol face-query disambiguation updates at ${path.relative(root, previewPath)}`);
  process.exit(0);
}

const applied = [];
for (const change of changes) {
  await productUpdate({ id: change.id, descriptionHtml: change.descriptionHtml });
  applied.push({ ...change, descriptionHtml: undefined, appliedAt: new Date().toISOString() });
  console.log(`Updated full-idol disambiguation: ${change.handle}`);
}

const appliedPath = path.join(OUT_DIR, "applied-full-idol-face-query-disambiguation.json");
fs.writeFileSync(appliedPath, `${JSON.stringify(applied, null, 2)}\n`);
console.log(`Applied ${applied.length} full-idol face-query disambiguation updates at ${path.relative(root, appliedPath)}`);

function insertAfterFirstParagraph(html, paragraph) {
  const index = String(html || "").search(/<\/p>/i);
  if (index === -1) return `${paragraph}${html || ""}`;
  return `${html.slice(0, index + 4)}${paragraph}${html.slice(index + 4)}`;
}

function removeOldClarifiers(html) {
  let next = String(html || "");
  for (const clarifier of OLD_CLARIFIERS) {
    next = next.replace(new RegExp(`<p>\\s*${escapeRegExp(clarifier)}\\s*</p>`, "gi"), "");
    next = next.replace(new RegExp(escapeRegExp(clarifier), "gi"), "");
  }
  return next;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

async function fetchTargetProducts() {
  const products = [];
  for (const term of TARGET_TITLES) {
    const data = await gql(
      `query Products($query: String!) {
        products(first: 10, query: $query) {
          nodes {
            id
            title
            handle
            status
            totalInventory
            descriptionHtml
          }
        }
      }`,
      { query: term }
    );
    products.push(...data.products.nodes.filter((product) => product.status === "ACTIVE" && product.totalInventory > 0 && product.title.includes(term)));
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
