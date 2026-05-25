#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const COLLECTION_HANDLE = "vagamalai-thomala";
const ENV_FILE = "env";
const GPC_RELIGIOUS_ITEMS = "97";

const DEFAULT_MATERIAL = "Cloth, foam, plastic flowers, beads, stones, lace, zari and thread";
const GOLD_MATERIAL = "Alloy metal with gold plating";

const REGIONAL_NAMES = [
  "Vagamalai",
  "Thomala",
  "Bhujalu",
  "Varalakshmi Vagamalai",
  "Varalakshmi Thomala",
  "Amman Thomala",
  "Ammavaru Thomala",
  "Deity shoulder garland",
  "Deity shoulder decoration",
  "Alankaram garland",
  "Pooja garland",
  "Flower garland for idol"
];

const RELATED_COLLECTION_HANDLES = [
  "vara-lakshmi-dolls",
  "varalakshmi-doll-faces",
  "hands-legs-for-varalakshmi-idol",
  "varalakshmi-deity-jewellery",
  "banana-tree-banana-bunches-for-pooja-varamahalakshmi-vratham"
];

const DEITY_HANDLES = {
  varalakshmi: "varalakshmi-lakshmi-amman",
  multi: "multi-deity"
};

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

async function rest(path, options = {}) {
  const res = await fetch(`${REST_ENDPOINT}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN,
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(`REST ${options.method || "GET"} ${path}: ${res.status} ${text}`);
  return body;
}

function metafield(ownerId, namespace, key, type, value) {
  return { ownerId, namespace, key, type, value: String(value) };
}

async function fetchCollectionAndProducts() {
  const products = [];
  let collection = null;
  let after = null;
  do {
    const data = await gql(
      `query Products($handle: String!, $after: String) {
        collectionByHandle(handle: $handle) {
          id legacyResourceId handle title sortOrder productsCount { count }
          metafields(first: 100) { nodes { namespace key value type } }
          products(first: 80, after: $after) {
            pageInfo { hasNextPage endCursor }
            nodes {
              id legacyResourceId handle title descriptionHtml productType status totalInventory tags templateSuffix
              seo { title description }
              images(first: 60) { nodes { id altText url } }
              variants(first: 100) {
                nodes { id legacyResourceId title sku barcode inventoryQuantity selectedOptions { name value } }
              }
              metafields(first: 100) { nodes { namespace key value type } }
            }
          }
        }
      }`,
      { handle: COLLECTION_HANDLE, after }
    );
    collection = data.collectionByHandle;
    if (!collection) throw new Error(`Collection not found: ${COLLECTION_HANDLE}`);
    products.push(...collection.products.nodes);
    after = collection.products.pageInfo.hasNextPage ? collection.products.pageInfo.endCursor : null;
  } while (after);
  return { collection, products };
}

async function fetchCollectionRefs(handles) {
  const refs = {};
  for (const handle of handles) {
    const data = await gql(`query Collection($handle: String!) { collectionByHandle(handle: $handle) { id handle title } }`, { handle });
    if (data.collectionByHandle) refs[handle] = data.collectionByHandle;
  }
  return refs;
}

async function fetchMetaobjectRefs() {
  const refs = {};
  for (const [key, handle] of Object.entries(DEITY_HANDLES)) {
    const data = await gql(
      `query Metaobject($handle: MetaobjectHandleInput!) {
        metaobjectByHandle(handle: $handle) { id handle fields { key value } }
      }`,
      { handle: { type: "deity_group", handle } }
    );
    if (data.metaobjectByHandle) refs[key] = data.metaobjectByHandle;
  }
  return refs;
}

function normalizeSku(value) {
  return String(value || "").replace(/\s+/g, "").replace(/-/g, "").toUpperCase();
}

function sku(product) {
  const fromVariant = product.variants.nodes.find((variant) => variant.sku)?.sku || "";
  const fromTitle = product.title.match(/\bDVT-?\d{3}\b/i)?.[0] || "";
  const fromHandle = product.handle.match(/\bdvt-?\d{3}\b/i)?.[0] || "";
  return String(fromVariant || fromTitle || fromHandle || "").replace(/\s+/g, "");
}

function skuKey(product) {
  return normalizeSku(sku(product));
}

function colorFor(product) {
  const colors = product.variants.nodes
    .flatMap((variant) => variant.selectedOptions)
    .filter((option) => /colou?r/i.test(option.name))
    .map((option) => option.value)
    .filter((value) => value && !/default/i.test(value));
  return [...new Set(colors)][0] || "";
}

function height(product) {
  const values = [];
  for (const variant of product.variants.nodes) {
    for (const option of variant.selectedOptions) {
      if (/height/i.test(option.name)) {
        const match = String(option.value || "").match(/(\d+(?:\.\d+)?)/);
        if (match) values.push(Number(match[1]));
      }
    }
  }
  return [...new Set(values)].sort((a, b) => a - b);
}

function materialFor(product) {
  return skuKey(product) === "DVT008" ? GOLD_MATERIAL : DEFAULT_MATERIAL;
}

function titleFor(product) {
  const code = sku(product).replace(/-/g, "");
  const color = colorFor(product);
  const heights = height(product);
  const heightText = heights.length === 1 ? ` ${formatNumber(heights[0])} in` : "";
  const colorText = color ? ` ${color}` : "";
  if (skuKey(product) === "DVT008") return `Gold Plated Vagamalai Thomala Bhujalu ${code}`;
  return `Vagamalai Thomala Bhujalu${heightText}${colorText} ${code}`.replace(/\s+/g, " ").trim();
}

function seoTitleFor(title) {
  return `${title} | Golden Collections`.slice(0, 70);
}

function fitNotes(product) {
  const heights = height(product);
  if (heights.length === 1) {
    return `Compare ${formatNumber(heights[0])} in vertical drop/length with your idol height, shoulder width, dress volume, jewellery and garland placement. Height means the vertical drop or length when the Vagamalai, Thomala or Bhujalu pair is placed on the idol.`;
  }
  return "Compare the product photos with your idol height, shoulder width, dress volume, jewellery and garland placement. Size is not confirmed for this product, so check photos before ordering.";
}

function productDescription(product) {
  const title = titleFor(product);
  return [
    `<p>${title} is a paired Vagamalai, Thomala and Bhujalu shoulder decoration for Varalakshmi Vratham, Varamahalakshmi Habba, Lakshmi Pooja, Amman alankaram and god or goddess idol decoration.</p>`,
    `<p><strong>Material:</strong> ${materialFor(product)}.</p>`,
    "<p><strong>Included:</strong> One pair of Vagamalai / Thomala / Bhujalu shoulder garland decorations as shown in the product photos.</p>",
    `<p><strong>Fit guidance:</strong> ${fitNotes(product)}</p>`,
    "<p>Use the product photos to match color, shoulder spread, garland drop, dress volume and nearby jewellery before ordering.</p>"
  ].join("");
}

function tagsFor(product) {
  return [
    ...new Set([
      "Vagamalai",
      "Thomala",
      "Bhujalu",
      "Varalakshmi Vagamalai",
      "Varalakshmi Thomala",
      "Amman Alankaram",
      "Ammavaru Alankaram",
      "Deity Shoulder Garland",
      "Varalakshmi Vratham",
      "Pooja Decoration",
      "Golden Collections",
      colorFor(product),
      sku(product)
    ].filter(Boolean))
  ];
}

function productMetafields(product, refs, ornamentTypeRef) {
  const heights = height(product);
  const deityRefs = [refs.varalakshmi?.id, refs.multi?.id].filter(Boolean);
  const inputs = [
    metafield(product.id, "custom", "range_type", "single_line_text_field", "Varalakshmi Vratham / Deity Garland"),
    metafield(product.id, "custom", "ornament_type", "single_line_text_field", "Vagamalai / Thomala / Bhujalu"),
    metafield(product.id, "custom", "placement", "single_line_text_field", "Shoulders / chest / idol body alankaram"),
    metafield(product.id, "custom", "material", "single_line_text_field", materialFor(product)),
    metafield(product.id, "custom", "compatibility_class", "single_line_text_field", "All god and goddess idols when the measured shoulder placement and drop fit; especially Varalakshmi, Lakshmi, Amman and Ammavaru setups."),
    metafield(product.id, "custom", "compatible_deities", "list.single_line_text_field", JSON.stringify(["All god and goddess idols", "Varalakshmi / Lakshmi / Amman"])),
    metafield(product.id, "custom", "compatible_deity_refs", "list.metaobject_reference", JSON.stringify(deityRefs)),
    metafield(product.id, "custom", "primary_deity_ref", "metaobject_reference", refs.varalakshmi?.id || deityRefs[0]),
    metafield(product.id, "custom", "fit_notes", "multi_line_text_field", fitNotes(product)),
    metafield(product.id, "custom", "size_confidence", "single_line_text_field", heights.length === 1 ? "Variant height measurement" : "Check product photos"),
    metafield(product.id, "custom", "component_count", "number_integer", "2"),
    metafield(product.id, "custom", "set_items_included", "list.single_line_text_field", JSON.stringify(["Pair of Vagamalai / Thomala / Bhujalu shoulder garland decorations as shown in photos"])),
    metafield(product.id, "custom", "regional_names", "list.single_line_text_field", JSON.stringify(REGIONAL_NAMES)),
    metafield(product.id, "mm-google-shopping", "google_product_category", "string", GPC_RELIGIOUS_ITEMS),
    metafield(product.id, "mc-facebook", "google_product_category", "string", GPC_RELIGIOUS_ITEMS),
    metafield(product.id, "mm-google-shopping", "condition", "string", "new"),
    metafield(product.id, "mm-google-shopping", "custom_product", "boolean", "true")
  ];
  if (ornamentTypeRef) inputs.push(metafield(product.id, "custom", "ornament_type_ref", "metaobject_reference", ornamentTypeRef));
  if (heights.length === 1) inputs.push(metafield(product.id, "custom", "ornament_height_in", "number_decimal", String(heights[0])));
  return inputs;
}

function collectionMetafields(collection, relatedRefs) {
  const relatedIds = RELATED_COLLECTION_HANDLES.map((handle) => relatedRefs[handle]?.id).filter(Boolean);
  const inputs = [
    metafield(collection.id, "custom", "display_title", "single_line_text_field", "Vagamalai Thomala and Bhujalu"),
    metafield(
      collection.id,
      "custom",
      "collection_intro",
      "multi_line_text_field",
      "Vagamalai, Thomala and Bhujalu paired shoulder garland decorations for Varalakshmi, Lakshmi, Amman, Ammavaru and god or goddess idol alankaram. Choose by color, material, vertical drop, shoulder placement and dress volume."
    ),
    metafield(
      collection.id,
      "custom",
      "size_fit_intro",
      "multi_line_text_field",
      "For Vagamalai, Thomala and Bhujalu, Height means vertical drop or length when placed on the idol. Compare idol height, shoulder width, chest area, dress volume, jewellery and garland placement before ordering."
    ),
    metafield(collection.id, "custom", "faq_family", "single_line_text_field", "varalakshmi"),
    metafield(collection.id, "custom", "collection_role", "single_line_text_field", "festival"),
    metafield(collection.id, "custom", "deity_first_enabled", "boolean", "true"),
    metafield(collection.id, "custom", "shopping_path_label", "single_line_text_field", "Thomala"),
    metafield(collection.id, "custom", "parent_menu_handles", "single_line_text_field", "varalakshmi-collection-circles"),
    metafield(collection.id, "custom", "regional_keyword_cluster", "list.single_line_text_field", JSON.stringify(REGIONAL_NAMES))
  ];
  if (relatedIds.length) inputs.push(metafield(collection.id, "custom", "related_collection_refs", "list.collection_reference", JSON.stringify(relatedIds)));
  return inputs;
}

async function updateCollection(collection, relatedRefs) {
  const descriptionHtml = [
    "<p>Shop Vagamalai, Thomala and Bhujalu paired shoulder garland decorations for Varalakshmi Vratham, Varamahalakshmi Habba, Lakshmi Pooja, Amman alankaram and god or goddess idol decoration.</p>",
    "<p>Choose by color, confirmed material, vertical drop, idol shoulder width, dress volume and jewellery clearance. Height means the vertical drop or length when the pair is placed on the idol.</p>"
  ].join("");
  if (!APPLY) {
    console.log(`[DRY COLLECTION] ${collection.title} -> Vagamalai Thomala and Bhujalu`);
  } else {
    const data = await gql(
      `mutation CollectionUpdate($input: CollectionInput!) {
        collectionUpdate(input: $input) { userErrors { field message } }
      }`,
      {
        input: {
          id: collection.id,
          title: "Vagamalai Thomala and Bhujalu",
          descriptionHtml,
          templateSuffix: "deity-ornament-default",
          sortOrder: "MANUAL",
          seo: {
            title: "Vagamalai Thomala and Bhujalu for Deity Alankaram",
            description:
              "Shop Vagamalai, Thomala and Bhujalu paired shoulder garlands for Varalakshmi, Amman and deity idol alankaram. Choose by color, material and drop."
          }
        }
      }
    );
    const errors = data.collectionUpdate.userErrors || [];
    if (errors.length) throw new Error(`collectionUpdate: ${JSON.stringify(errors)}`);
  }
  await setMetafields(collectionMetafields(collection, relatedRefs));
}

async function updateProduct(product) {
  const title = titleFor(product);
  const seoDescription = `Shop ${title} for Varalakshmi, Amman and deity idol alankaram. Check material, paired pieces, color and vertical drop.`;
  if (!APPLY) {
    console.log(`[DRY PRODUCT] ${product.handle}: ${product.title} -> ${title}`);
    return;
  }
  const data = await gql(
    `mutation ProductUpdate($input: ProductInput!) {
      productUpdate(input: $input) { userErrors { field message } }
    }`,
    {
      input: {
        id: product.id,
        title,
        productType: "Vagamalai",
        templateSuffix: "deity-lite",
        descriptionHtml: productDescription(product),
        tags: tagsFor(product),
        seo: {
          title: seoTitleFor(title),
          description: seoDescription.slice(0, 200)
        }
      }
    }
  );
  const errors = data.productUpdate.userErrors || [];
  if (errors.length) throw new Error(`productUpdate ${product.handle}: ${JSON.stringify(errors)}`);
  await updateImageAlts(product, title);
}

async function updateImageAlts(product, title) {
  for (const [index, image] of product.images.nodes.entries()) {
    const imageId = image.id.split("/").pop();
    const alt = `${title} deity Vagamalai Thomala Bhujalu shoulder garland image ${index + 1}`;
    await rest(`/products/${product.legacyResourceId}/images/${imageId}.json`, {
      method: "PUT",
      body: JSON.stringify({ image: { id: Number(imageId), alt } })
    });
  }
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

async function deleteWrongGoogleFields(products) {
  const identifiers = products.flatMap((product) => [
    { ownerId: product.id, namespace: "mm-google-shopping", key: "age_group" },
    { ownerId: product.id, namespace: "mm-google-shopping", key: "gender" }
  ]);
  if (!APPLY) {
    console.log(`[DRY DELETE] ${identifiers.length} age/gender metafields`);
    return;
  }
  const data = await gql(
    `mutation DeleteMetafields($metafields: [MetafieldIdentifierInput!]!) {
      metafieldsDelete(metafields: $metafields) { userErrors { field message } }
    }`,
    { metafields: identifiers }
  );
  const errors = data.metafieldsDelete.userErrors || [];
  if (errors.length) throw new Error(`metafieldsDelete: ${JSON.stringify(errors)}`);
}

async function updateVariantSkuBarcodes(products) {
  let updated = 0;
  for (const product of products) {
    const productSku = sku(product);
    for (const variant of product.variants.nodes) {
      const targetSku = variant.sku || productSku;
      if (!targetSku || (variant.sku === targetSku && variant.barcode === targetSku)) continue;
      if (APPLY) {
        await rest(`/variants/${variant.legacyResourceId}.json`, {
          method: "PUT",
          body: JSON.stringify({ variant: { id: Number(variant.legacyResourceId), sku: targetSku, barcode: targetSku } })
        });
      }
      updated += 1;
    }
  }
  console.log(`${APPLY ? "Updated" : "Would update"} ${updated} variant SKU/barcodes.`);
}

async function reorderCollection(collection, products) {
  const ordered = [...products].sort((a, b) => sortBucket(a) - sortBucket(b));
  const moves = ordered.map((product, index) => ({ id: product.id, newPosition: String(index) }));
  if (!APPLY) {
    console.log(`[DRY REORDER] ${moves.length} products, first 6: ${ordered.slice(0, 6).map((product) => sku(product)).join(", ")}`);
    return;
  }
  const data = await gql(
    `mutation Reorder($id: ID!, $moves: [MoveInput!]!) {
      collectionReorderProducts(id: $id, moves: $moves) { job { id done } userErrors { field message } }
    }`,
    { id: collection.id, moves }
  );
  const errors = data.collectionReorderProducts.userErrors || [];
  if (errors.length) throw new Error(`collectionReorderProducts: ${JSON.stringify(errors)}`);
  const job = data.collectionReorderProducts.job;
  if (job && !job.done) await waitForJob(job.id);
}

function sortBucket(product) {
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

function formatNumber(value) {
  return Number(value).toString();
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  const { collection, products } = await fetchCollectionAndProducts();
  const relatedRefs = await fetchCollectionRefs(RELATED_COLLECTION_HANDLES);
  const deityRefs = await fetchMetaobjectRefs();
  const ornamentTypeRef = collection.metafields.nodes.find((m) => m.namespace === "custom" && m.key === "ornament_type_ref")?.value;
  const activeProducts = products.filter((product) => product.status === "ACTIVE");
  console.log(`Fetched ${products.length} products from ${collection.handle}.`);

  await updateCollection(collection, relatedRefs);
  await setMetafields(activeProducts.flatMap((product) => productMetafields(product, deityRefs, ornamentTypeRef)));
  for (const product of activeProducts) await updateProduct(product);
  await deleteWrongGoogleFields(activeProducts);
  await updateVariantSkuBarcodes(activeProducts);
  await reorderCollection(collection, products);
  console.log(`${APPLY ? "Updated" : "Would update"} ${activeProducts.length} active Vagamalai products.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
