import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const ENV_FILE = "env";
const COLLECTION_HANDLE = "deity-long-harams";

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

function metafield(ownerId, namespace, key, type, value) {
  return { ownerId, namespace, key, type, value };
}

function isExplicitSet(product) {
  return /\b(set|ensemble)\b/i.test(product.title);
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
              id
              handle
              title
              componentCount: metafield(namespace: "custom", key: "component_count") { value }
              setItems: metafield(namespace: "custom", key: "set_items_included") { value }
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

async function setMetafields(inputs) {
  if (!APPLY) {
    console.log(`[DRY] Would set ${inputs.length} metafields on ${inputs.length / 2} products.`);
    return;
  }
  for (let index = 0; index < inputs.length; index += 25) {
    const data = await gql(
      `mutation SetMetafields($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          userErrors { field message code }
        }
      }`,
      { metafields: inputs.slice(index, index + 25) }
    );
    if (data.metafieldsSet.userErrors.length) {
      throw new Error(`metafieldsSet: ${JSON.stringify(data.metafieldsSet.userErrors)}`);
    }
  }
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  const products = await fetchProducts();
  const explicitSets = products.filter(isExplicitSet);
  const missingOrDifferent = explicitSets.filter(
    (product) =>
      product.componentCount?.value !== "1" ||
      product.setItems?.value !== JSON.stringify(["Single long haram / long necklace"])
  );
  const inputs = missingOrDifferent.flatMap((product) => [
    metafield(product.id, "custom", "component_count", "number_integer", "1"),
    metafield(
      product.id,
      "custom",
      "set_items_included",
      "list.single_line_text_field",
      JSON.stringify(["Single long haram / long necklace"])
    )
  ]);

  console.log(`Products in collection: ${products.length}`);
  console.log(`Explicit set/ensemble titles: ${explicitSets.length}`);
  console.log(`Need component update: ${missingOrDifferent.length}`);
  missingOrDifferent.slice(0, 20).forEach((product) => console.log(`- ${product.handle}: ${product.title}`));
  if (missingOrDifferent.length > 20) console.log(`...and ${missingOrDifferent.length - 20} more`);

  await setMetafields(inputs);
  console.log("Long haram set/ensemble component fields complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
