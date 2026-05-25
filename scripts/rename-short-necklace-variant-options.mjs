import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const ENV_FILE = "env";
const COLLECTION_HANDLE = "deity-short-harams";

const env = Object.fromEntries(
  fs
    .readFileSync(ENV_FILE, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    })
);

const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const GRAPHQL_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;
const REST_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}`;

if (!SHOP || !TOKEN) {
  console.error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN");
  process.exit(1);
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
  const res = await fetch(`${REST_ENDPOINT}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN,
      ...(options.headers || {})
    }
  });
  const bodyText = await res.text();
  if (!res.ok) throw new Error(`REST ${options.method || "GET"} ${path}: ${res.status} ${bodyText}`);
  return bodyText ? JSON.parse(bodyText) : {};
}

function cleanOption(value) {
  return String(value || "")
    .replace(/\bChest Haram\b/gi, "Chest Necklace")
    .replace(/\bShort Haram\b/gi, "Short Necklace")
    .replace(/\bHaram\b/g, "Necklace")
    .replace(/\bharam\b/g, "necklace")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchProducts() {
  const products = [];
  let after = null;
  do {
    const data = await gql(
      `query Products($handle: String!, $after: String) {
        collectionByHandle(handle: $handle) {
          products(first: 50, after: $after) {
            pageInfo { hasNextPage endCursor }
            nodes {
              handle
              variants(first: 100) {
                nodes {
                  legacyResourceId
                  selectedOptions { name value }
                }
              }
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

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  const products = await fetchProducts();
  const changes = [];

  for (const product of products) {
    for (const variant of product.variants.nodes) {
      const update = {};
      variant.selectedOptions.forEach((option, index) => {
        const cleaned = cleanOption(option.value);
        if (cleaned !== option.value) update[`option${index + 1}`] = cleaned;
      });
      if (Object.keys(update).length) {
        changes.push({ product: product.handle, variantId: variant.legacyResourceId, update });
      }
    }
  }

  console.log(`Products checked: ${products.length}`);
  console.log(`Variant option updates: ${changes.length}`);
  changes.slice(0, 20).forEach((change) => console.log(`- ${change.product} / ${change.variantId}: ${JSON.stringify(change.update)}`));
  if (changes.length > 20) console.log(`...and ${changes.length - 20} more`);

  if (!APPLY) return;
  for (const change of changes) {
    await rest(`/variants/${change.variantId}.json`, {
      method: "PUT",
      body: JSON.stringify({ variant: { id: Number(change.variantId), ...change.update } })
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
