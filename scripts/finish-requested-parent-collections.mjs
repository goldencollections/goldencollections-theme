#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const ENV_FILE = "env";
const VARALAKSHMI_HANDLE = "varalakshmi-deity-jewellery";
const REORDER_HANDLES = ["deity-necklace", VARALAKSHMI_HANDLE];

const VARALAKSHMI = {
  handle: VARALAKSHMI_HANDLE,
  title: "Varalakshmi Pooja and Deity Jewellery",
  descriptionHtml: [
    "<p>Shop Varalakshmi Pooja and deity jewellery for Varamahalakshmi Vratham, Lakshmi Pooja, Amman alankaram and festive home temple setup. This collection brings together Varalakshmi dolls and idol sets, decorated faces, hands and legs, Vagamalai / Thomala / Bhujalu, crowns, necklaces and small alankaram accessories.</p>",
    "<p>Start with the idol or doll height, then check face height and width, crown space, hands and legs placement, garland drop, necklace placement and decoration area. Match each product's measured photos and fit notes with your Varalakshmi, Lakshmi or Amman setup before ordering.</p>"
  ].join(""),
  seoTitle: "Varalakshmi Pooja Items and Deity Jewellery",
  seoDescription:
    "Shop Varalakshmi Pooja items and deity jewellery for Vratham alankaram, including dolls, faces, hands, legs, crowns, necklaces and Vagamalai.",
  metafields: {
    display_title: "Varalakshmi Pooja and Deity Jewellery",
    collection_intro:
      "Varalakshmi Pooja and deity jewellery for Varamahalakshmi Vratham, Lakshmi Pooja and Amman alankaram, including dolls, faces, hands, legs, crowns, necklaces, Vagamalai / Thomala / Bhujalu and small accessories.",
    size_fit_intro:
      "Begin with the full idol or doll height, then compare face height and width, crown height and width, hands and legs placement, garland drop, necklace placement and altar decoration space with each product's measurements and photos.",
    faq_family: "varalakshmi",
    collection_role: "festival",
    deity_first_enabled: "true",
    shopping_path_label: "Varalakshmi Pooja",
    regional_keyword_cluster: [
      "Varalakshmi",
      "Vara Lakshmi",
      "Varamahalakshmi",
      "Varamahalakshmi Vratham",
      "Varalakshmi Vratham",
      "Lakshmi Pooja",
      "Amman alankaram",
      "Ammavaru alankaram",
      "Thayar alankaram",
      "Varalakshmi doll",
      "Varalakshmi face",
      "Hastham Padam",
      "Vagamalai",
      "Thomala",
      "Bhujalu"
    ],
    subcollections: [
      "vara-lakshmi-dolls",
      "varalakshmi-doll-faces",
      "hands-legs-for-varalakshmi-idol",
      "vagamalai-thomala",
      "deity-crowns-1",
      "deity-necklace",
      "waist-belt-vaddanam-jewellery-for-hindu-gods-goddess-1",
      "deity-accessories-nose-rings-mustache-weapons-taira",
      "sacred-sanctum-decor"
    ],
    related: [
      "varalakshmi-doll-faces",
      "hands-legs-for-varalakshmi-idol",
      "vagamalai-thomala",
      "sacred-sanctum-decor",
      "deity-accessories-nose-rings-mustache-weapons-taira"
    ]
  }
};

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

async function fetchCollection(handle) {
  const products = [];
  let collection = null;
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
              title
              status
              totalInventory
              images(first: 1) { nodes { id } }
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

async function collectionRefs(handles) {
  const refs = {};
  for (const handle of handles) {
    const data = await gql(`query Collection($handle: String!) { collectionByHandle(handle: $handle) { id handle } }`, { handle });
    if (data.collectionByHandle) refs[handle] = data.collectionByHandle.id;
  }
  return refs;
}

function metafield(ownerId, namespace, key, type, value) {
  return { ownerId, namespace, key, type, value: String(value) };
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
        metafieldsSet(metafields: $metafields) { userErrors { field message code } }
      }`,
      { metafields: chunk }
    );
    const errors = data.metafieldsSet.userErrors || [];
    if (errors.length) throw new Error(`metafieldsSet: ${JSON.stringify(errors)}`);
  }
}

async function updateVaralakshmiCollection() {
  const { collection } = await fetchCollection(VARALAKSHMI.handle);
  if (!APPLY) {
    console.log(`[DRY COLLECTION] ${collection.title} -> ${VARALAKSHMI.title}`);
  } else {
    const data = await gql(
      `mutation CollectionUpdate($input: CollectionInput!) {
        collectionUpdate(input: $input) { userErrors { field message } }
      }`,
      {
        input: {
          id: collection.id,
          title: VARALAKSHMI.title,
          descriptionHtml: VARALAKSHMI.descriptionHtml,
          templateSuffix: "deity-first",
          sortOrder: "MANUAL",
          seo: {
            title: VARALAKSHMI.seoTitle,
            description: VARALAKSHMI.seoDescription
          }
        }
      }
    );
    const errors = data.collectionUpdate.userErrors || [];
    if (errors.length) throw new Error(`collectionUpdate ${VARALAKSHMI.handle}: ${JSON.stringify(errors)}`);
  }

  const refs = await collectionRefs([...VARALAKSHMI.metafields.subcollections, ...VARALAKSHMI.metafields.related]);
  const subcollectionIds = VARALAKSHMI.metafields.subcollections.map((handle) => refs[handle]).filter(Boolean);
  const relatedIds = VARALAKSHMI.metafields.related.map((handle) => refs[handle]).filter(Boolean);
  await setMetafields([
    metafield(collection.id, "custom", "display_title", "single_line_text_field", VARALAKSHMI.metafields.display_title),
    metafield(collection.id, "custom", "collection_intro", "multi_line_text_field", VARALAKSHMI.metafields.collection_intro),
    metafield(collection.id, "custom", "size_fit_intro", "multi_line_text_field", VARALAKSHMI.metafields.size_fit_intro),
    metafield(collection.id, "custom", "faq_family", "single_line_text_field", VARALAKSHMI.metafields.faq_family),
    metafield(collection.id, "custom", "collection_role", "single_line_text_field", VARALAKSHMI.metafields.collection_role),
    metafield(collection.id, "custom", "deity_first_enabled", "boolean", VARALAKSHMI.metafields.deity_first_enabled),
    metafield(collection.id, "custom", "shopping_path_label", "single_line_text_field", VARALAKSHMI.metafields.shopping_path_label),
    metafield(
      collection.id,
      "custom",
      "regional_keyword_cluster",
      "list.single_line_text_field",
      JSON.stringify(VARALAKSHMI.metafields.regional_keyword_cluster)
    ),
    metafield(collection.id, "custom", "subcollections", "list.collection_reference", JSON.stringify(subcollectionIds)),
    metafield(collection.id, "custom", "related_collection_refs", "list.collection_reference", JSON.stringify(relatedIds)),
    metafield(collection.id, "custom", "parent_menu_handles", "single_line_text_field", "deity-collection-circles")
  ]);
}

function productRank(product) {
  if (product.status === "ACTIVE" && product.images.nodes.length > 0 && product.totalInventory > 0) return 0;
  if (product.status === "ACTIVE" && product.images.nodes.length > 0) return 1;
  if (product.status === "ACTIVE") return 2;
  return 3;
}

async function waitForJob(jobId) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const data = await gql(`query Job($id: ID!) { job(id: $id) { id done } }`, { id: jobId });
    if (data.job?.done) return;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error(`Timed out waiting for job ${jobId}`);
}

async function reorderCollection(handle) {
  const { collection, products } = await fetchCollection(handle);
  const ordered = products
    .map((product, index) => ({ ...product, originalIndex: index }))
    .sort((a, b) => productRank(a) - productRank(b) || a.originalIndex - b.originalIndex);
  const moves = ordered
    .slice()
    .reverse()
    .map((product) => ({ id: product.id, newPosition: "0" }));

  console.log(`[${APPLY ? "REORDER" : "DRY REORDER"}] ${handle}: ${moves.length} products`);
  for (let index = 0; index < moves.length; index += 200) {
    const chunk = moves.slice(index, index + 200);
    if (!APPLY) continue;
    const data = await gql(
      `mutation Reorder($id: ID!, $moves: [MoveInput!]!) {
        collectionReorderProducts(id: $id, moves: $moves) { job { id done } userErrors { field message } }
      }`,
      { id: collection.id, moves: chunk }
    );
    const errors = data.collectionReorderProducts.userErrors || [];
    if (errors.length) throw new Error(`collectionReorderProducts ${handle}: ${JSON.stringify(errors)}`);
    const job = data.collectionReorderProducts.job;
    if (job && !job.done) await waitForJob(job.id);
  }
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  await updateVaralakshmiCollection();
  for (const handle of REORDER_HANDLES) await reorderCollection(handle);
  console.log("Requested parent collection finishing pass complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
