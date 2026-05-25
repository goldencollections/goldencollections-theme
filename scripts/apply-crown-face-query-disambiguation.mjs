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

const COLLECTION_HANDLES = ["deity-stone-crowns", "deity-crowns", "premium-deity-crowns"];
const CROWN_TYPES = new Set(["Deity Stone Crowns", "Deity Gold Plated Crowns", "Premium Deity Crowns"]);
const FIT_NOTE_KEY = "custom.fit_notes";

if (!SHOP || !TOKEN) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const products = await fetchCrownProducts();
const changes = [];
for (const product of products.values()) {
  if (product.status !== "ACTIVE" || product.totalInventory <= 0 || !CROWN_TYPES.has(product.productType)) continue;

  const descriptionHtml = cleanCrownFaceTerms(product.descriptionHtml || "");
  const fitNotes = product.metafields.nodes.find((metafield) => `${metafield.namespace}.${metafield.key}` === FIT_NOTE_KEY);
  const nextFitNotes = fitNotes ? cleanCrownFaceTerms(fitNotes.value) : "";
  const changedDescription = descriptionHtml && descriptionHtml !== product.descriptionHtml;
  const changedFitNotes = fitNotes && nextFitNotes !== fitNotes.value;
  if (!changedDescription && !changedFitNotes) continue;

  changes.push({
    id: product.id,
    handle: product.handle,
    title: product.title,
    productType: product.productType,
    changedDescription,
    changedFitNotes,
    oldDescriptionSnippet: stripHtml(product.descriptionHtml).slice(0, 320),
    newDescriptionSnippet: stripHtml(descriptionHtml).slice(0, 320),
    oldFitNotes: fitNotes?.value || "",
    newFitNotes: nextFitNotes,
    descriptionHtml
  });
}

const previewPath = path.join(OUT_DIR, "crown-face-query-disambiguation-preview.json");
fs.writeFileSync(
  previewPath,
  `${JSON.stringify(changes.map(({ descriptionHtml, ...change }) => change), null, 2)}\n`
);

if (!APPLY) {
  console.log(`Previewed ${changes.length} crown face-query disambiguation updates at ${path.relative(root, previewPath)}`);
  process.exit(0);
}

const applied = [];
for (const change of changes) {
  if (change.changedDescription) {
    await productUpdate({ id: change.id, descriptionHtml: change.descriptionHtml });
  }
  if (change.changedFitNotes) {
    await metafieldsSet([
      {
        ownerId: change.id,
        namespace: "custom",
        key: "fit_notes",
        type: "multi_line_text_field",
        value: change.newFitNotes
      }
    ]);
  }
  applied.push({ ...change, descriptionHtml: undefined, appliedAt: new Date().toISOString() });
  console.log(`Updated crown disambiguation: ${change.handle}`);
}

const appliedPath = path.join(OUT_DIR, "applied-crown-face-query-disambiguation.json");
fs.writeFileSync(appliedPath, `${JSON.stringify(applied, null, 2)}\n`);
console.log(`Applied ${applied.length} crown face-query disambiguation updates at ${path.relative(root, appliedPath)}`);

function cleanCrownFaceTerms(value) {
  return String(value || "")
    .replace(/\bwidth with the head or face area\b/gi, "width with the idol head area")
    .replace(/\bwith the head or face area\b/gi, "with the idol head area")
    .replace(/\bidol head width, face shape, hairstyle\b/gi, "idol head width, head profile, hairstyle")
    .replace(/\bhead width, face shape, hairstyle\b/gi, "head width, head profile, hairstyle")
    .replace(/\bface shape\b/gi, "head profile");
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

async function fetchCrownProducts() {
  const products = new Map();
  for (const handle of COLLECTION_HANDLES) {
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
                productType
                descriptionHtml
                metafields(first: 80) { nodes { namespace key value type } }
              }
            }
          }
        }`,
        { handle, after }
      );
      const page = data.collectionByHandle?.products;
      if (!page) throw new Error(`Collection not found: ${handle}`);
      for (const product of page.nodes) products.set(product.id, product);
      after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
    } while (after);
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

async function metafieldsSet(metafields) {
  const data = await gql(
    `mutation SetMetafields($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
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
