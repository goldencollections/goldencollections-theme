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
const REST_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}`;
const APPLY = process.argv.includes("--apply");
const COLLECTION_HANDLE = "hands-legs-for-varalakshmi-idol";

const APPROVED = [
  { sku: "VHL019", positions: [2, 3], proof: "ruler" },
  { sku: "VHL022", positions: [2, 3], proof: "ruler" },
  { sku: "VHL026", positions: [2, 3], proof: "ruler" },
  { sku: "VHL023", positions: [2, 3], proof: "ruler" },
  { sku: "VHL024", positions: [2, 3], proof: "ruler" },
  { sku: "VHL021", positions: [2, 3], proof: "ruler" },
  { sku: "VHL020", positions: [2, 3], proof: "ruler" },
  { sku: "VHL013", positions: [2, 3], proof: "ruler", handsOnly: true },
  { sku: "VHL018", positions: [1], proof: "measurement-labelled" },
  { sku: "VHL010", positions: [2, 3], proof: "ruler" },
  { sku: "VHL011", positions: [2, 3], proof: "ruler" },
  { sku: "DJHANDSLEGS001", positions: [2, 3], proof: "ruler" }
];

if (!SHOP || !TOKEN) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const products = await fetchCollectionProducts();
const bySku = new Map(products.flatMap((product) => skuKeys(product).map((sku) => [sku, product])));
const updates = [];

for (const item of APPROVED) {
  const product = bySku.get(normalizeSku(item.sku));
  if (!product) {
    updates.push({ sku: item.sku, error: "Product not found in collection" });
    continue;
  }
  for (const position of item.positions) {
    const image = product.images.nodes[position - 1];
    if (!image) {
      updates.push({ sku: item.sku, handle: product.handle, position, error: "Image position not found" });
      continue;
    }
    const imageLegacyId = image.id.split("/").pop();
    const alt = altFor(product.title, item, position);
    updates.push({
      approved: true,
      sku: item.sku,
      handle: product.handle,
      title: product.title,
      legacyResourceId: product.legacyResourceId,
      imageLegacyId,
      position,
      oldAlt: image.altText || "",
      alt
    });
  }
}

const previewPath = path.join(OUT_DIR, "hastham-padam-measurement-alt-preview.json");
fs.writeFileSync(previewPath, `${JSON.stringify(updates, null, 2)}\n`);

if (!APPLY) {
  console.log(`Previewed ${updates.filter((update) => update.approved).length} hastham/padam measurement alt updates at ${path.relative(root, previewPath)}`);
  process.exit(0);
}

const applied = [];
for (const update of updates.filter((entry) => entry.approved && entry.legacyResourceId && entry.imageLegacyId && entry.alt)) {
  await rest(`/products/${update.legacyResourceId}/images/${update.imageLegacyId}.json`, {
    method: "PUT",
    body: JSON.stringify({ image: { id: Number(update.imageLegacyId), alt: update.alt } })
  });
  applied.push({ ...update, appliedAt: new Date().toISOString() });
  console.log(`Updated ${update.sku} image ${update.position}`);
}

const appliedPath = path.join(OUT_DIR, "applied-hastham-padam-measurement-alt.json");
fs.writeFileSync(appliedPath, `${JSON.stringify(applied, null, 2)}\n`);
console.log(`Applied ${applied.length} hastham/padam measurement alt updates at ${path.relative(root, appliedPath)}`);

function altFor(title, item, position) {
  if (item.handsOnly) {
    return `${title} measurement photo with ruler for deity hastham hand fit image ${position}`.replace(/\s+/g, " ").trim();
  }
  if (item.proof === "measurement-labelled") {
    return `${title} measurement-labelled product photo showing hastham and padam size image ${position}`.replace(/\s+/g, " ").trim();
  }
  const fitPhrase = position === 3 ? "width and size check" : "idol fit and size guidance";
  return `${title} measurement photo with ruler for hastham padam ${fitPhrase} image ${position}`.replace(/\s+/g, " ").trim();
}

function normalizeSku(value) {
  return String(value || "").replace(/[^a-z0-9]/gi, "").toUpperCase();
}

function skuKeys(product) {
  const values = [
    ...product.variants.nodes.map((variant) => variant.sku),
    ...(product.title.match(/\b(?:VHL|DHL|DJhandslegs|DJ-hands-legs)-?\d+\b/gi) || [])
  ];
  return [...new Set(values.map(normalizeSku).filter(Boolean))];
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
              legacyResourceId
              title
              handle
              status
              totalInventory
              images(first: 20) { nodes { id altText url } }
              variants(first: 50) { nodes { sku } }
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

async function rest(resourcePath, options = {}) {
  const response = await fetchWithRetry(`${REST_ENDPOINT}${resourcePath}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN,
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${resourcePath} failed: ${response.status} ${text}`);
  }
  return text ? JSON.parse(text) : {};
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
