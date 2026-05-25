#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const ENV_FILE = "env";
const OUTPUT_DIR = "tmp/real-kemp";
const SOURCE_HANDLE = "kemp-mattal-ear-chains";
const LEGACY_HANDLE = "kemp-mattal";
const TAG = "real-kemp-mattal";

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
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
    }
  }
  throw lastError;
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

async function fetchCollection(handle) {
  const query = `
    query Collection($handle: String!, $after: String) {
      collectionByHandle(handle: $handle) {
        id
        legacyResourceId
        handle
        title
        productsCount { count }
        ruleSet { appliedDisjunctively rules { column relation condition } }
        products(first: 50, after: $after) {
          pageInfo { hasNextPage endCursor }
          nodes { id handle title productType tags }
        }
      }
    }
  `;
  let after = null;
  let collection;
  const products = [];
  do {
    const data = await gql(query, { handle, after });
    collection = data.collectionByHandle;
    if (!collection) throw new Error(`Collection not found: ${handle}`);
    products.push(...collection.products.nodes);
    after = collection.products.pageInfo.endCursor;
  } while (collection.products.pageInfo.hasNextPage);
  return { ...collection, products };
}

async function tagsAdd(product, tag) {
  if (product.tags.some((existing) => existing.toLowerCase() === tag.toLowerCase())) return;
  const mutation = `
    mutation TagsAdd($id: ID!, $tags: [String!]!) {
      tagsAdd(id: $id, tags: $tags) {
        node { id }
        userErrors { field message }
      }
    }
  `;
  const result = await gql(mutation, { id: product.id, tags: [tag] });
  const errors = result.tagsAdd.userErrors || [];
  if (errors.length) throw new Error(`tagsAdd ${product.handle}: ${JSON.stringify(errors)}`);
}

async function updateLegacyRule(legacyResourceId) {
  const body = await fetchJson(`${REST_ENDPOINT}/smart_collections/${legacyResourceId}.json`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN
    },
    body: JSON.stringify({
      smart_collection: {
        id: Number(legacyResourceId),
        disjunctive: false,
        rules: [{ column: "tag", relation: "equals", condition: TAG }]
      }
    })
  });
  return body.smart_collection;
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const source = await fetchCollection(SOURCE_HANDLE);
  const legacyBefore = await fetchCollection(LEGACY_HANDLE);
  const sourceProducts = source.products.filter((product) => product.productType === "Kemp Mattal Gold");
  const leakageBefore = legacyBefore.products.filter((product) => product.productType !== "Kemp Mattal Gold");

  const preview = {
    source: { handle: source.handle, count: source.products.length, ruleSet: source.ruleSet },
    legacyBefore: { handle: legacyBefore.handle, count: legacyBefore.products.length, ruleSet: legacyBefore.ruleSet },
    tag: TAG,
    sourceProductCount: sourceProducts.length,
    leakageBeforeCount: leakageBefore.length,
    leakageBefore: leakageBefore.map((product) => ({ handle: product.handle, title: product.title, productType: product.productType }))
  };
  fs.writeFileSync(`${OUTPUT_DIR}/kemp-mattal-legacy-preview.json`, JSON.stringify(preview, null, 2));
  console.log(`[SOURCE COUNT] ${sourceProducts.length}`);
  console.log(`[LEGACY BEFORE] ${legacyBefore.products.length}`);
  console.log(`[LEAKAGE BEFORE] ${leakageBefore.length}`);
  console.log(`[PREVIEW] ${OUTPUT_DIR}/kemp-mattal-legacy-preview.json`);

  if (!APPLY) return;

  for (const product of sourceProducts) {
    await tagsAdd(product, TAG);
  }
  await updateLegacyRule(legacyBefore.legacyResourceId);
  await new Promise((resolve) => setTimeout(resolve, 3000));
  const legacyAfter = await fetchCollection(LEGACY_HANDLE);
  const leakageAfter = legacyAfter.products.filter((product) => product.productType !== "Kemp Mattal Gold");
  const report = {
    ok: legacyAfter.products.length === sourceProducts.length && leakageAfter.length === 0,
    legacyAfter: { handle: legacyAfter.handle, count: legacyAfter.products.length, ruleSet: legacyAfter.ruleSet },
    leakageAfterCount: leakageAfter.length,
    products: legacyAfter.products.map((product) => ({ handle: product.handle, title: product.title, productType: product.productType, tags: product.tags }))
  };
  fs.writeFileSync(`${OUTPUT_DIR}/kemp-mattal-legacy-verify.json`, JSON.stringify(report, null, 2));
  console.log(`[LEGACY AFTER] ${legacyAfter.products.length}`);
  console.log(`[LEAKAGE AFTER] ${leakageAfter.length}`);
  console.log(`[VERIFY OK] ${report.ok}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
