#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const ENV_FILE = "env";
const HANDLE_ARG = process.argv.find((arg) => arg.startsWith("--handle="));
const COLLECTION_HANDLE = HANDLE_ARG ? HANDLE_ARG.slice("--handle=".length) : "deity-necklace";

const env = readEnv(ENV_FILE);
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const GRAPHQL_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;

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

async function fetchProducts(handle) {
  const products = [];
  let after = null;
  do {
    const data = await gql(
      `query CollectionProducts($handle: String!, $after: String) {
        collectionByHandle(handle: $handle) {
          id
          handle
          title
          products(first: 100, after: $after) {
            pageInfo { hasNextPage endCursor }
            nodes {
              id
              handle
              title
              status
              totalInventory
              images(first: 1) { nodes { id } }
              variants(first: 10) { nodes { sku } }
            }
          }
        }
      }`,
      { handle, after }
    );
    const collection = data.collectionByHandle;
    if (!collection) throw new Error(`Collection not found: ${handle}`);
    products.push(...collection.products.nodes);
    after = collection.products.pageInfo.hasNextPage ? collection.products.pageInfo.endCursor : null;
  } while (after);
  return products;
}

function sku(product) {
  return product.variants.nodes.find((variant) => variant.sku)?.sku || "";
}

async function draftProduct(product) {
  if (!APPLY) return;
  const data = await gql(
    `mutation ProductUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        product { id handle status }
        userErrors { field message }
      }
    }`,
    { input: { id: product.id, status: "DRAFT" } }
  );
  const errors = data.productUpdate.userErrors || [];
  if (errors.length) throw new Error(`productUpdate ${product.handle}: ${JSON.stringify(errors)}`);
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  const products = await fetchProducts(COLLECTION_HANDLE);
  const zeroImageActive = products.filter((product) => product.status === "ACTIVE" && product.images.nodes.length === 0);
  console.log(
    JSON.stringify(
      {
        collection: COLLECTION_HANDLE,
        totalProducts: products.length,
        activeZeroImageCount: zeroImageActive.length,
        products: zeroImageActive.map((product) => ({
          sku: sku(product),
          title: product.title,
          handle: product.handle,
          inventory: product.totalInventory
        }))
      },
      null,
      2
    )
  );

  for (const product of zeroImageActive) {
    console.log(`${APPLY ? "Drafting" : "Would draft"}: ${sku(product)} ${product.title}`);
    await draftProduct(product);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
