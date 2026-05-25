#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const ENV_FILE = "env";
const PARENT_HANDLE = "deity-crowns-1";
const KEEP_CHILD_HANDLES = ["deity-crowns", "deity-stone-crowns", "premium-deity-crowns"];
const REMOVE_CHILD_HANDLES = ["drama-dance-crowns", "deity-hair-crown"];

const env = readEnv(ENV_FILE);
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const GRAPHQL_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;

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

function metafield(ownerId, namespace, key, type, value) {
  return { ownerId, namespace, key, type, value: String(value) };
}

async function fetchCollection(handle) {
  const products = [];
  let collection = null;
  let after = null;
  do {
    const data = await gql(
      `query CollectionProducts($handle: String!, $after: String) {
        collectionByHandle(handle: $handle) {
          id handle title sortOrder productsCount { count }
          products(first: 100, after: $after) {
            pageInfo { hasNextPage endCursor }
            nodes {
              id handle title status totalInventory productType
              images(first: 3) { nodes { id } }
              variants(first: 10) { nodes { sku } }
            }
          }
        }
      }`,
      { handle, after }
    );
    collection = data.collectionByHandle;
    if (!collection) throw new Error(`Collection not found: ${handle}`);
    products.push(...collection.products.nodes);
    after = collection.products.pageInfo.hasNextPage ? collection.products.pageInfo.endCursor : null;
  } while (after);
  return { collection, products };
}

async function setMetafields(inputs) {
  for (let index = 0; index < inputs.length; index += 20) {
    const chunk = inputs.slice(index, index + 20);
    if (!APPLY) {
      console.log(`[DRY METAFIELDS] ${chunk.length}`);
      continue;
    }
    const data = await gql(
      `mutation SetMetafields($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          userErrors { field message code }
        }
      }`,
      { metafields: chunk }
    );
    const errors = data.metafieldsSet.userErrors || [];
    if (errors.length) throw new Error(`metafieldsSet: ${JSON.stringify(errors)}`);
  }
}

async function updateCollection(collection, childCollections) {
  const descriptionHtml = [
    "<p>Shop deity crowns, mukut, kireedam and kirita for Hindu god and goddess idols. This parent crown collection brings together gold plated crowns, stone crowns and premium deity crowns for temple alankaram, home pooja and festive decoration.</p>",
    "<p>Choose by crown style, deity context, material, height, width and diameter/depth. For crown sizes, H means height, W means width, D means diameter or depth, and L in L x W x D should be read as crown height. Compare the product measurement photos with the idol head, face width, available crown height and placement before ordering.</p>"
  ].join("");

  if (!APPLY) {
    console.log(`[DRY COLLECTION] ${collection.title} -> Deity Crowns`);
  } else {
    const data = await gql(
      `mutation CollectionUpdate($input: CollectionInput!) {
        collectionUpdate(input: $input) {
          collection { id handle title seo { title description } }
          userErrors { field message }
        }
      }`,
      {
        input: {
          id: collection.id,
          title: "Deity Crowns",
          descriptionHtml,
          templateSuffix: "deity-ornament-default",
          sortOrder: "MANUAL",
          seo: {
            title: "Deity Crowns, Mukut and Kireedam for God Idols",
            description:
              "Shop deity crowns, mukut, kireedam and kirita for Hindu god and goddess idols. Browse gold plated, stone and premium crowns by size, style and fit."
          }
        }
      }
    );
    const errors = data.collectionUpdate.userErrors || [];
    if (errors.length) throw new Error(`collectionUpdate: ${JSON.stringify(errors)}`);
  }

  const childIds = childCollections.map(({ collection }) => collection.id);
  await setMetafields([
    metafield(collection.id, "custom", "display_title", "single_line_text_field", "Deity Crowns"),
    metafield(
      collection.id,
      "custom",
      "collection_intro",
      "multi_line_text_field",
      "Deity crowns, mukut, kireedam and kirita for Hindu god and goddess idols, organized into gold plated crowns, stone crowns and premium deity crowns."
    ),
    metafield(
      collection.id,
      "custom",
      "size_fit_intro",
      "multi_line_text_field",
      "For deity crowns, read H x W x D as Height x Width x Diameter/Depth. If a product uses L x W x D, L means crown height. Compare idol head or face width, crown height, depth/diameter, style, tilt direction and placement before ordering."
    ),
    metafield(collection.id, "custom", "faq_family", "single_line_text_field", "crown"),
    metafield(collection.id, "custom", "collection_role", "single_line_text_field", "ornament_first"),
    metafield(collection.id, "custom", "deity_first_enabled", "boolean", "false"),
    metafield(collection.id, "custom", "shopping_path_label", "single_line_text_field", "Crowns"),
    metafield(
      collection.id,
      "custom",
      "regional_keyword_cluster",
      "list.single_line_text_field",
      JSON.stringify(["deity crown", "god crown", "goddess crown", "mukut", "kireedam", "kireetam", "kirita", "makuta", "thalapaga", "alankaram crown"])
    ),
    metafield(collection.id, "custom", "subcollections", "list.collection_reference", JSON.stringify(childIds)),
    metafield(collection.id, "custom", "related_collection_refs", "list.collection_reference", JSON.stringify(childIds)),
    metafield(collection.id, "custom", "parent_menu_handles", "single_line_text_field", "deity-collection-circles")
  ]);
}

async function collectionAddProducts(collectionId, productIds) {
  for (let index = 0; index < productIds.length; index += 250) {
    const chunk = productIds.slice(index, index + 250);
    if (!APPLY) {
      console.log(`[DRY ADD] ${chunk.length}`);
      continue;
    }
    const data = await gql(
      `mutation AddProducts($id: ID!, $productIds: [ID!]!) {
        collectionAddProducts(id: $id, productIds: $productIds) {
          collection { id handle productsCount { count } }
          userErrors { field message }
        }
      }`,
      { id: collectionId, productIds: chunk }
    );
    const errors = data.collectionAddProducts.userErrors || [];
    if (errors.length) throw new Error(`collectionAddProducts: ${JSON.stringify(errors)}`);
  }
}

async function collectionRemoveProducts(collectionId, productIds) {
  for (let index = 0; index < productIds.length; index += 250) {
    const chunk = productIds.slice(index, index + 250);
    if (!APPLY) {
      console.log(`[DRY REMOVE] ${chunk.length}`);
      continue;
    }
    const data = await gql(
      `mutation RemoveProducts($id: ID!, $productIds: [ID!]!) {
        collectionRemoveProducts(id: $id, productIds: $productIds) {
          job { id done }
          userErrors { field message }
        }
      }`,
      { id: collectionId, productIds: chunk }
    );
    const errors = data.collectionRemoveProducts.userErrors || [];
    if (errors.length) throw new Error(`collectionRemoveProducts: ${JSON.stringify(errors)}`);
    if (data.collectionRemoveProducts.job && !data.collectionRemoveProducts.job.done) {
      await waitForJob(data.collectionRemoveProducts.job.id);
    }
  }
}

async function waitForJob(jobId) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const data = await gql(`query Job($id: ID!) { job(id: $id) { id done } }`, { id: jobId });
    if (data.job?.done) return;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error(`Job did not finish: ${jobId}`);
}

function productRank(product) {
  if (product.status === "ACTIVE" && product.totalInventory > 0 && product.images.nodes.length > 0) return 0;
  if (product.status === "ACTIVE" && product.images.nodes.length > 0) return 1;
  return 2;
}

async function reorderProducts(collectionId, products) {
  const ordered = products
    .map((product, originalIndex) => ({ ...product, originalIndex }))
    .sort((a, b) => productRank(a) - productRank(b) || a.originalIndex - b.originalIndex);
  const moves = ordered
    .slice()
    .reverse()
    .map((product) => ({ id: product.id, newPosition: "0" }));
  if (!APPLY) {
    console.log(`[DRY REORDER] ${moves.length}`);
    return;
  }
  const data = await gql(
    `mutation ReorderCollection($id: ID!, $moves: [MoveInput!]!) {
      collectionReorderProducts(id: $id, moves: $moves) {
        job { id done }
        userErrors { field message }
      }
    }`,
    { id: collectionId, moves }
  );
  const errors = data.collectionReorderProducts.userErrors || [];
  if (errors.length) throw new Error(`collectionReorderProducts: ${JSON.stringify(errors)}`);
  if (data.collectionReorderProducts.job && !data.collectionReorderProducts.job.done) {
    console.log(`Reorder job: ${data.collectionReorderProducts.job.id}`);
    await waitForJob(data.collectionReorderProducts.job.id);
  }
}

function ids(products) {
  return [...new Set(products.map((product) => product.id))];
}

function sku(product) {
  return product.variants.nodes.find((variant) => variant.sku)?.sku || "";
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  const parent = await fetchCollection(PARENT_HANDLE);
  const keepChildren = [];
  for (const handle of KEEP_CHILD_HANDLES) keepChildren.push(await fetchCollection(handle));
  const removeChildren = [];
  for (const handle of REMOVE_CHILD_HANDLES) removeChildren.push(await fetchCollection(handle));

  const desiredProductIds = new Set(keepChildren.flatMap(({ products }) => ids(products)));
  const removeProductIds = new Set(removeChildren.flatMap(({ products }) => ids(products)));
  const parentProductIds = new Set(ids(parent.products));

  const toAdd = [...desiredProductIds].filter((id) => !parentProductIds.has(id));
  const toRemove = parent.products
    .filter((product) => removeProductIds.has(product.id) || /Drama Crowns|Hair Crown|Deity Gold Crowns/i.test(product.productType))
    .map((product) => product.id);

  console.log(
    JSON.stringify(
      {
        parentBefore: { count: parent.products.length, active: parent.products.filter((p) => p.status === "ACTIVE").length },
        childCounts: keepChildren.map(({ collection, products }) => ({ handle: collection.handle, count: products.length })),
        removeCounts: removeChildren.map(({ collection, products }) => ({ handle: collection.handle, count: products.length })),
        toAdd: toAdd.length,
        toRemove: toRemove.length,
        removeSample: parent.products
          .filter((product) => toRemove.includes(product.id))
          .slice(0, 12)
          .map((product) => ({ sku: sku(product), title: product.title, type: product.productType }))
      },
      null,
      2
    )
  );

  await updateCollection(parent.collection, keepChildren);
  await collectionAddProducts(parent.collection.id, toAdd);
  await collectionRemoveProducts(parent.collection.id, toRemove);

  const after = await fetchCollection(PARENT_HANDLE);
  await reorderProducts(after.collection.id, after.products);
  console.log(`Parent collection pass complete. Products after fetch: ${after.products.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
