#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const APPLY = process.argv.includes("--apply");
const OUT_DIR = path.join(root, "tmp", "deity-earrings-ucp-sprint");
const COLLECTION_HANDLE = "deity-earrings-for-god-idols-statues";

const env = readEnv(path.join(root, "env"));
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const GRAPHQL_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;

if (!SHOP || !TOKEN) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const collection = await fetchCollection(COLLECTION_HANDLE);
const nextDescriptionHtml = cleanEarringCollectionTerms(collection.descriptionHtml || "");
const changed = nextDescriptionHtml !== collection.descriptionHtml;

const preview = {
  generatedAt: new Date().toISOString(),
  handle: collection.handle,
  title: collection.title,
  changed,
  oldDescriptionText: stripHtml(collection.descriptionHtml),
  newDescriptionText: stripHtml(nextDescriptionHtml)
};

const previewPath = path.join(OUT_DIR, "deity-earrings-collection-description-cleanup-preview.json");
fs.writeFileSync(previewPath, `${JSON.stringify(preview, null, 2)}\n`);

if (!APPLY) {
  console.log(`Previewed collection description cleanup at ${path.relative(root, previewPath)}`);
  process.exit(0);
}

if (!changed) {
  console.log("No collection description cleanup needed.");
  process.exit(0);
}

await collectionUpdate({
  id: collection.id,
  descriptionHtml: nextDescriptionHtml
});

const appliedPath = path.join(OUT_DIR, "applied-deity-earrings-collection-description-cleanup.json");
fs.writeFileSync(
  appliedPath,
  `${JSON.stringify({ ...preview, appliedAt: new Date().toISOString() }, null, 2)}\n`
);
console.log(`Applied collection description cleanup at ${path.relative(root, appliedPath)}`);

function cleanEarringCollectionTerms(value) {
  return String(value || "")
    .replace(/\bidol ear and face area\b/gi, "idol ear and side ornament area")
    .replace(/\bidol ears and face area\b/gi, "idol ears and side ornament area")
    .replace(/\bear and face area\b/gi, "ear and side ornament area")
    .replace(/\bface width\b/gi, "side clearance");
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

async function fetchCollection(handle) {
  const data = await gql(
    `query Collection($handle: String!) {
      collectionByHandle(handle: $handle) {
        id
        handle
        title
        descriptionHtml
      }
    }`,
    { handle }
  );
  if (!data.collectionByHandle) throw new Error(`Collection not found: ${handle}`);
  return data.collectionByHandle;
}

async function collectionUpdate(input) {
  const data = await gql(
    `mutation CollectionUpdate($input: CollectionInput!) {
      collectionUpdate(input: $input) {
        collection { id handle title descriptionHtml }
        userErrors { field message }
      }
    }`,
    { input }
  );
  const errors = data.collectionUpdate.userErrors || [];
  if (errors.length) throw new Error(`collectionUpdate: ${JSON.stringify(errors, null, 2)}`);
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
