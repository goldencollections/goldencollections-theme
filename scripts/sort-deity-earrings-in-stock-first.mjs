#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const ENV_FILE = "env";
const COLLECTION_HANDLE = "deity-earrings-for-god-idols-statues";

const env = readEnv(ENV_FILE);
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const GRAPHQL_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;
const REST_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}`;

if (!SHOP || !TOKEN) {
  console.error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN");
  process.exit(1);
}

function readEnv(file) {
  return Object.fromEntries(
    fs
      .readFileSync(file, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      })
  );
}

async function gql(query, variables = {}) {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN
    },
    body: JSON.stringify({ query, variables })
  });
  const body = await res.json();
  if (body.errors?.length) throw new Error(`GraphQL errors: ${JSON.stringify(body.errors)}`);
  return body.data;
}

async function rest(path, options = {}) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const res = await fetch(`${REST_ENDPOINT}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": TOKEN,
          ...(options.headers || {})
        }
      });
      const bodyText = await res.text();
      const body = bodyText ? JSON.parse(bodyText) : {};
      if (!res.ok) throw new Error(`REST ${options.method || "GET"} ${path}: ${res.status} ${bodyText}`);
      return body;
    } catch (error) {
      lastError = error;
      if (attempt === 4) break;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
  throw lastError;
}

async function findCustomCollection() {
  const body = await rest(`/custom_collections.json?handle=${encodeURIComponent(COLLECTION_HANDLE)}&limit=1`);
  const collection = body.custom_collections?.[0];
  if (!collection) throw new Error(`Custom collection not found: ${COLLECTION_HANDLE}`);
  return collection;
}

async function fetchProducts() {
  const products = [];
  let after = null;
  do {
    const data = await gql(
      `query Products($handle: String!, $after: String) {
        collectionByHandle(handle: $handle) {
          sortOrder
          products(first: 50, after: $after) {
            pageInfo { hasNextPage endCursor }
            nodes {
              id
              legacyResourceId
              handle
              title
              status
              totalInventory
            }
          }
        }
      }`,
      { handle: COLLECTION_HANDLE, after }
    );
    const conn = data.collectionByHandle.products;
    products.push(...conn.nodes);
    after = conn.pageInfo.hasNextPage ? conn.pageInfo.endCursor : null;
  } while (after);
  return products;
}

async function listCollects(collectionId) {
  const body = await rest(`/collects.json?collection_id=${collectionId}&limit=250`);
  return body.collects || [];
}

function groupRank(product) {
  if (product.status === "ACTIVE" && product.totalInventory > 0) return 0;
  if (product.status === "ACTIVE") return 1;
  return 2;
}

async function setManualSort(collectionId) {
  if (!APPLY) {
    console.log(`[DRY COLLECTION SORT] ${collectionId} -> manual`);
    return;
  }
  await rest(`/custom_collections/${collectionId}.json`, {
    method: "PUT",
    body: JSON.stringify({ custom_collection: { id: collectionId, sort_order: "manual" } })
  });
}

async function updateCollectPositions(collectsByProductId, orderedProducts) {
  for (const product of orderedProducts) {
    if (!collectsByProductId.has(String(product.legacyResourceId))) {
      throw new Error(`Missing collect for ${product.handle}`);
    }
  }
  console.log(`${APPLY ? "Will reorder" : "Would reorder"} ${orderedProducts.length} products with collectionReorderProducts.`);
}

async function reorderProducts(collectionGid, orderedProducts) {
  const moves = orderedProducts
    .slice()
    .reverse()
    .map((product) => ({ id: product.id, newPosition: "0" }));

  if (!APPLY) {
    console.log(`[DRY GRAPHQL REORDER] ${moves.length} moves`);
    return;
  }

  const data = await gql(
    `mutation ReorderCollection($id: ID!, $moves: [MoveInput!]!) {
      collectionReorderProducts(id: $id, moves: $moves) {
        job { id done }
        userErrors { field message }
      }
    }`,
    { id: collectionGid, moves }
  );
  const errors = data.collectionReorderProducts.userErrors || [];
  if (errors.length) throw new Error(`collectionReorderProducts: ${JSON.stringify(errors)}`);

  const job = data.collectionReorderProducts.job;
  console.log(`Reorder job: ${job.id}; done=${job.done}`);
  if (!job.done) await waitForJob(job.id);
}

async function waitForJob(jobId) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const data = await gql(
      `query Job($id: ID!) {
        job(id: $id) { id done }
      }`,
      { id: jobId }
    );
    if (data.job?.done) {
      console.log("Reorder job done.");
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error(`Reorder job did not finish: ${jobId}`);
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  const [collection, products] = await Promise.all([findCustomCollection(), fetchProducts()]);
  const orderedProducts = products
    .map((product, index) => ({ ...product, originalIndex: index }))
    .sort((a, b) => groupRank(a) - groupRank(b) || a.originalIndex - b.originalIndex);

  const counts = {
    activeInStock: orderedProducts.filter((product) => product.status === "ACTIVE" && product.totalInventory > 0).length,
    activeSoldOut: orderedProducts.filter((product) => product.status === "ACTIVE" && product.totalInventory <= 0).length,
    nonActive: orderedProducts.filter((product) => product.status !== "ACTIVE").length
  };
  console.log(`Collection ${collection.id} ${collection.handle}; current sort=${collection.sort_order}; products=${products.length}`);
  console.log(JSON.stringify(counts));
  console.log(`First five after sort: ${orderedProducts.slice(0, 5).map((product) => product.handle).join(", ")}`);
  console.log(`Last five after sort: ${orderedProducts.slice(-5).map((product) => product.handle).join(", ")}`);

  const collects = await listCollects(collection.id);
  const collectsByProductId = new Map(collects.map((collect) => [String(collect.product_id), collect]));
  await setManualSort(collection.id);
  await updateCollectPositions(collectsByProductId, orderedProducts);
  await reorderProducts(`gid://shopify/Collection/${collection.id}`, orderedProducts);
  console.log("Deity earrings in-stock-first ordering complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
