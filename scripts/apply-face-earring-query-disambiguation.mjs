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
const FACE_QUERY = 'product_type:"Deity Faces"';

if (!SHOP || !TOKEN) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const candidates = await fetchFaceProducts();
const updates = candidates
  .map((product) => {
    const fitNotes = product.metafields.nodes.find(
      (metafield) => metafield.namespace === "custom" && metafield.key === "fit_notes"
    );
    if (!fitNotes?.value || !/\bearring clearance\b/i.test(fitNotes.value)) return null;
    return {
      id: product.id,
      title: product.title,
      handle: product.handle,
      sku: product.variants.nodes.map((variant) => variant.sku).filter(Boolean).join(", "),
      oldFitNotes: fitNotes.value,
      newFitNotes: fitNotes.value.replace(/\bearring clearance\b/gi, "side ornament clearance")
    };
  })
  .filter(Boolean);

const previewPath = path.join(OUT_DIR, "face-earring-query-disambiguation-preview.json");
fs.writeFileSync(previewPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), updates }, null, 2)}\n`);

if (!APPLY) {
  console.log(`Previewed ${updates.length} face fit-note updates at ${path.relative(root, previewPath)}`);
  process.exit(0);
}

const applied = [];
for (const update of updates) {
  await metafieldsSet([
    {
      ownerId: update.id,
      namespace: "custom",
      key: "fit_notes",
      type: "multi_line_text_field",
      value: update.newFitNotes
    }
  ]);
  applied.push({ ...update, appliedAt: new Date().toISOString() });
}

const appliedPath = path.join(OUT_DIR, "applied-face-earring-query-disambiguation.json");
fs.writeFileSync(appliedPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), applied }, null, 2)}\n`);
console.log(`Applied ${applied.length} face fit-note updates at ${path.relative(root, appliedPath)}`);

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
      `query Products($query: String!, $after: String) {
        products(first: 100, after: $after, query: $query) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            title
            handle
            variants(first: 5) { nodes { sku } }
            metafields(first: 100) { nodes { namespace key value type } }
          }
        }
      }`,
      { query: FACE_QUERY, after }
    );
    products.push(...data.products.nodes);
    after = data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor : null;
  } while (after);
  return products;
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
