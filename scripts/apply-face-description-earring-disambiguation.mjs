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

if (!SHOP || !TOKEN) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const products = await fetchFaceProducts();
const updates = products
  .map((product) => {
    const newDescriptionHtml = product.descriptionHtml
      .replace(/\bearring clearance\b/gi, "side ornament clearance")
      .replace(/\bface width, earrings, nose ornament\b/gi, "face width, side ornaments, nose ornament");
    if (newDescriptionHtml === product.descriptionHtml) return null;
    return {
      id: product.id,
      title: product.title,
      handle: product.handle,
      oldMatches: product.descriptionHtml.match(/.{0,60}earring.{0,80}/gi) || [],
      newMatches: newDescriptionHtml.match(/.{0,60}earring.{0,80}/gi) || [],
      newDescriptionHtml
    };
  })
  .filter(Boolean);

const previewPath = path.join(OUT_DIR, "face-description-earring-disambiguation-preview.json");
fs.writeFileSync(
  previewPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      updates: updates.map(({ newDescriptionHtml, ...update }) => update)
    },
    null,
    2
  )}\n`
);

if (!APPLY) {
  console.log(`Previewed ${updates.length} face description updates at ${path.relative(root, previewPath)}`);
  process.exit(0);
}

const applied = [];
for (const update of updates) {
  await productUpdate({ id: update.id, descriptionHtml: update.newDescriptionHtml });
  const { newDescriptionHtml, ...summary } = update;
  applied.push({ ...summary, appliedAt: new Date().toISOString() });
}

const appliedPath = path.join(OUT_DIR, "applied-face-description-earring-disambiguation.json");
fs.writeFileSync(appliedPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), applied }, null, 2)}\n`);
console.log(`Applied ${applied.length} face description updates at ${path.relative(root, appliedPath)}`);

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

async function fetchFaceProducts() {
  const products = [];
  let after = null;
  do {
    const data = await gql(
      `query Products($after: String) {
        products(first: 100, after: $after, query: "product_type:'Deity Faces'") {
          pageInfo { hasNextPage endCursor }
          nodes { id title handle descriptionHtml }
        }
      }`,
      { after }
    );
    products.push(...data.products.nodes);
    after = data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor : null;
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
