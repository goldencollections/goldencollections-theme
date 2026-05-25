import { readEnv } from "./meta-lib.mjs";

const APPLY = process.argv.includes("--apply");
const PRODUCT_HANDLE = "divine-goddess-lakshmi-jewellery-deity-long-haram-dln-095";
const TARGET_COLLECTION_HANDLES = ["lakshmi-amman-deity-jewellery"];
const DEITY_METAOBJECT_HANDLE = "varalakshmi-lakshmi-amman";

const env = readEnv();
const shop = env.SHOPIFY_STORE_DOMAIN;
const token = env.SHOPIFY_ADMIN_TOKEN;
const apiVersion = env.SHOPIFY_API_VERSION || "2025-10";

if (!shop || !token) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN");
}

const current = await loadCurrent();
const product = current.productByHandle;
if (!product) throw new Error(`Missing product ${PRODUCT_HANDLE}`);

const targetCollections = TARGET_COLLECTION_HANDLES.map((handle, index) => {
  const collection = current[`collection${index}`];
  if (!collection) throw new Error(`Missing collection ${handle}`);
  return collection;
});

const deity = current.metaobjects.nodes[0];
if (!deity) throw new Error(`Missing deity metaobject ${DEITY_METAOBJECT_HANDLE}`);

const existingCollectionHandles = new Set(product.collections.nodes.map((collection) => collection.handle));
const collectionsToAdd = targetCollections.filter((collection) => !existingCollectionHandles.has(collection.handle));

const metafields = [
  {
    ownerId: product.id,
    namespace: "custom",
    key: "primary_deity",
    type: "single_line_text_field",
    value: "Lakshmi / Amman",
  },
  {
    ownerId: product.id,
    namespace: "custom",
    key: "primary_deity_ref",
    type: "metaobject_reference",
    value: deity.id,
  },
  {
    ownerId: product.id,
    namespace: "custom",
    key: "compatible_deities",
    type: "list.single_line_text_field",
    value: JSON.stringify(["Varalakshmi / Lakshmi / Amman"]),
  },
  {
    ownerId: product.id,
    namespace: "custom",
    key: "compatible_deity_refs",
    type: "list.metaobject_reference",
    value: JSON.stringify([deity.id]),
  },
];

const result = {
  apply: APPLY,
  product: {
    id: product.id,
    title: product.title,
    handle: product.handle,
    currentCollections: [...existingCollectionHandles].sort(),
  },
  targetCollections: targetCollections.map((collection) => ({
    id: collection.id,
    title: collection.title,
    handle: collection.handle,
    alreadyContainsProduct: existingCollectionHandles.has(collection.handle),
  })),
  deityMetaobject: {
    id: deity.id,
    handle: deity.handle,
  },
  changes: {
    collectionsToAdd: collectionsToAdd.map((collection) => collection.handle),
    metafields: metafields.map((field) => `${field.namespace}.${field.key}`),
  },
};

if (APPLY) {
  for (const collection of collectionsToAdd) {
    const data = await gql(
      `mutation AddProducts($id: ID!, $productIds: [ID!]!) {
        collectionAddProducts(id: $id, productIds: $productIds) {
          userErrors { field message }
        }
      }`,
      { id: collection.id, productIds: [product.id] },
    );
    const errors = data.collectionAddProducts.userErrors || [];
    if (errors.length) throw new Error(`collectionAddProducts ${collection.handle}: ${JSON.stringify(errors)}`);
  }

  const meta = await gql(
    `mutation SetMetafields($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        userErrors { field message code }
      }
    }`,
    { metafields },
  );
  const errors = meta.metafieldsSet.userErrors || [];
  if (errors.length) throw new Error(`metafieldsSet: ${JSON.stringify(errors)}`);
}

console.log(JSON.stringify(result, null, 2));

async function loadCurrent() {
  const collectionQueries = TARGET_COLLECTION_HANDLES.map(
    (handle, index) => `collection${index}: collectionByHandle(handle: "${handle}") { id title handle }`,
  ).join("\n");

  return gql(`
    query LakshmiNearWinCurrent {
      productByHandle(handle: "${PRODUCT_HANDLE}") {
        id
        title
        handle
        collections(first: 20) { nodes { id title handle } }
      }
      ${collectionQueries}
      metaobjects(type: "deity_group", first: 1, query: "handle:${DEITY_METAOBJECT_HANDLE}") {
        nodes { id handle }
      }
    }
  `);
}

async function gql(query, variables = {}) {
  const res = await fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) {
    throw new Error(`Shopify GraphQL error: ${JSON.stringify(json.errors || json)}`);
  }
  return json.data;
}
