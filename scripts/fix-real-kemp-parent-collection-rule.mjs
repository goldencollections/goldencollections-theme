#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const ENV_FILE = "env";
const OUTPUT_DIR = "tmp/real-kemp";
const REAL_KEMP_TAG = "real-kemp";
const BLACK_KEMP_TAG = "black-kemp";
const PARENT_HANDLE = "kemp-jewellery";

const REAL_KEMP_COLLECTION_HANDLES = [
  "kemp-bharatanatyam-jewellery-dance-sets",
  "kemp-short-haram",
  "kemp-long-necklace",
  "kemp-headset",
  "kemp-mang-tikka",
  "kemp-mattal-ear-chains",
  "kemp-earrings",
  "kemp-vaddanam-waistbelt",
  "kemp-accessories"
];

const BLACK_KEMP_COLLECTION_HANDLES = [
  "kemp-black-bharatanatyam-kuchipudi-dance-jewellery-set",
  "kemp-black-short-necklace",
  "kemp-black-long-haram",
  "premium-black-kemp-headsets-nethichutti",
  "kemp-black-nethi-chutti-maang-tikka",
  "kemp-black-mattal",
  "kemp-black-earrings-jhumki-jhumka",
  "black-kemp-vaddanam-temple-jewellery-oddiyanam",
  "black-kemp-bharatanatyam-accessories"
];

const env = readEnv(ENV_FILE);
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const GRAPHQL_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;
const REST_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}`;

if (!SHOP || !TOKEN) {
  console.error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
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
        return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, "")];
      })
  );
}

async function fetchJson(url, options, attempts = 5) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const res = await fetch(url, options);
      const text = await res.text();
      let body;
      try {
        body = JSON.parse(text);
      } catch {
        throw new Error(`Non-JSON response ${res.status}: ${text.slice(0, 160)}`);
      }
      if (!res.ok || body.errors) throw new Error(`HTTP ${res.status}: ${JSON.stringify(body.errors || body)}`);
      return body;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(800 * attempt);
    }
  }
  throw lastError;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function gql(query, variables = {}) {
  const body = await fetchJson(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN
    },
    body: JSON.stringify({ query, variables })
  });
  if (body.errors?.length) throw new Error(`GraphQL errors: ${JSON.stringify(body.errors)}`);
  return body.data;
}

function isBlackKemp(product) {
  return `${product.title} ${product.productType} ${product.handle}`.toLowerCase().includes("black kemp");
}

function isRegularMattalLeak(product) {
  return product.productType === "Bharatanatyam Mattal";
}

function isRealKemp(product) {
  return !isBlackKemp(product) && !isRegularMattalLeak(product);
}

async function fetchCollectionProducts(handles) {
  const query = `
    query CollectionProducts($handle: String!, $after: String) {
      collectionByHandle(handle: $handle) {
        id
        legacyResourceId
        handle
        title
        productsCount { count }
        ruleSet { appliedDisjunctively rules { column relation condition } }
        products(first: 50, after: $after, sortKey: COLLECTION_DEFAULT) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            legacyResourceId
            handle
            title
            productType
            status
            tags
          }
        }
      }
    }
  `;

  const byId = new Map();
  const collections = [];
  for (const handle of handles) {
    let after = null;
    let collection;
    do {
      const data = await gql(query, { handle, after });
      collection = data.collectionByHandle;
      if (!collection) throw new Error(`Collection not found: ${handle}`);
      for (const product of collection.products.nodes) {
        if (!byId.has(product.id)) byId.set(product.id, { ...product, collections: [] });
        byId.get(product.id).collections.push(handle);
      }
      after = collection.products.pageInfo.endCursor;
    } while (collection.products.pageInfo.hasNextPage);
    collections.push({
      id: collection.id,
      legacyResourceId: collection.legacyResourceId,
      handle: collection.handle,
      title: collection.title,
      count: collection.productsCount.count,
      ruleSet: collection.ruleSet
    });
  }
  return { collections, products: [...byId.values()] };
}

async function fetchCollection(handle) {
  const data = await gql(
    `query Collection($handle: String!) {
      collectionByHandle(handle: $handle) {
        id
        legacyResourceId
        handle
        title
        productsCount { count }
        ruleSet { appliedDisjunctively rules { column relation condition } }
      }
    }`,
    { handle }
  );
  if (!data.collectionByHandle) throw new Error(`Collection not found: ${handle}`);
  return data.collectionByHandle;
}

async function tagsAdd(productIds, tag) {
  const mutation = `
    mutation TagsAdd($id: ID!, $tags: [String!]!) {
      tagsAdd(id: $id, tags: $tags) {
        node { id }
        userErrors { field message }
      }
    }
  `;
  for (const id of productIds) {
    const result = await gql(mutation, { id, tags: [tag] });
    const errors = result.tagsAdd.userErrors || [];
    if (errors.length) throw new Error(`tagsAdd ${id}: ${JSON.stringify(errors)}`);
    await sleep(120);
  }
}

async function updateSmartCollectionRule(collectionLegacyId) {
  const body = await fetchJson(`${REST_ENDPOINT}/smart_collections/${collectionLegacyId}.json`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN
    },
    body: JSON.stringify({
      smart_collection: {
        id: Number(collectionLegacyId),
        disjunctive: false,
        rules: [
          {
            column: "tag",
            relation: "equals",
            condition: REAL_KEMP_TAG
          }
        ]
      }
    })
  });
  return body.smart_collection;
}

async function verifyParent() {
  const { products } = await fetchCollectionProducts([PARENT_HANDLE]);
  const blackLeaks = products.filter(isBlackKemp);
  const regularMattalLeaks = products.filter(isRegularMattalLeak);
  const missingRealTag = products.filter((product) => !product.tags.includes(REAL_KEMP_TAG));
  const rows = products.map((product) => ({
    handle: product.handle,
    title: product.title,
    productType: product.productType,
    status: product.status,
    tags: product.tags
  }));
  const report = {
    ok: blackLeaks.length === 0 && regularMattalLeaks.length === 0 && missingRealTag.length === 0,
    count: products.length,
    blackLeakCount: blackLeaks.length,
    regularMattalLeakCount: regularMattalLeaks.length,
    missingRealTagCount: missingRealTag.length,
    blackLeaks: blackLeaks.map((product) => product.handle),
    regularMattalLeaks: regularMattalLeaks.map((product) => product.handle),
    missingRealTag: missingRealTag.map((product) => product.handle),
    rows
  };
  fs.writeFileSync(`${OUTPUT_DIR}/parent-rule-verify.json`, JSON.stringify(report, null, 2));
  return report;
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const parentBefore = await fetchCollection(PARENT_HANDLE);
  const real = await fetchCollectionProducts(REAL_KEMP_COLLECTION_HANDLES);
  const black = await fetchCollectionProducts(BLACK_KEMP_COLLECTION_HANDLES);

  const realProducts = real.products.filter(isRealKemp);
  const excludedFromReal = real.products.filter((product) => !isRealKemp(product));
  const blackProducts = black.products.filter(isBlackKemp);
  const realNeedingTag = realProducts.filter((product) => !product.tags.includes(REAL_KEMP_TAG));
  const blackNeedingTag = blackProducts.filter((product) => !product.tags.includes(BLACK_KEMP_TAG));

  const preview = {
    parentBefore,
    realCollectionCount: real.products.length,
    realProductsToKeep: realProducts.length,
    excludedFromReal: excludedFromReal.map((product) => ({
      handle: product.handle,
      title: product.title,
      productType: product.productType,
      collections: product.collections
    })),
    blackCollectionCount: black.products.length,
    blackProducts: blackProducts.length,
    realNeedingTag: realNeedingTag.map((product) => product.handle),
    blackNeedingTag: blackNeedingTag.map((product) => product.handle),
    proposedParentRule: {
      disjunctive: false,
      rules: [{ column: "tag", relation: "equals", condition: REAL_KEMP_TAG }]
    }
  };
  fs.writeFileSync(`${OUTPUT_DIR}/parent-rule-preview.json`, JSON.stringify(preview, null, 2));
  console.log(`[PREVIEW] ${OUTPUT_DIR}/parent-rule-preview.json`);
  console.log(`[REAL PRODUCTS] ${realProducts.length}`);
  console.log(`[REAL NEEDING TAG] ${realNeedingTag.length}`);
  console.log(`[BLACK PRODUCTS] ${blackProducts.length}`);
  console.log(`[BLACK NEEDING TAG] ${blackNeedingTag.length}`);
  console.log(`[EXCLUDED FROM REAL] ${excludedFromReal.length}`);

  if (!APPLY) return;

  if (realNeedingTag.length) await tagsAdd(realNeedingTag.map((product) => product.id), REAL_KEMP_TAG);
  if (blackNeedingTag.length) await tagsAdd(blackNeedingTag.map((product) => product.id), BLACK_KEMP_TAG);
  await updateSmartCollectionRule(parentBefore.legacyResourceId);
  await sleep(3500);
  const parentAfter = await fetchCollection(PARENT_HANDLE);
  const verify = await verifyParent();
  fs.writeFileSync(`${OUTPUT_DIR}/parent-rule-after.json`, JSON.stringify({ parentAfter, verify }, null, 2));
  console.log(`[UPDATED PARENT RULE] ${PARENT_HANDLE}`);
  console.log(`[VERIFY COUNT] ${verify.count}`);
  console.log(`[VERIFY OK] ${verify.ok}`);
  console.log(`[VERIFY] ${OUTPUT_DIR}/parent-rule-verify.json`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
