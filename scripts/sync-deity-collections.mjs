#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const SETUP_COLLECTIONS = process.argv.includes("--setup-collections");
const SYNC_PRODUCTS = process.argv.includes("--sync-products");
const PRUNE = process.argv.includes("--prune");
const DELETE_TITLE_SMART = process.argv.includes("--delete-title-smart");
const ENV_FILE = getArg("--env") || "env";
const CONFIG_FILE = getArg("--config") || "custom-data/deity-collection-sync.config.json";

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

if (!SETUP_COLLECTIONS && !SYNC_PRODUCTS && !DELETE_TITLE_SMART) {
  console.error("Choose at least one operation: --setup-collections, --sync-products, or --delete-title-smart");
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
const deityConfigs = config.deity_collections || [];
const rootCollection = config.root_collection;

function getArg(flag) {
  const i = process.argv.indexOf(flag);
  if (i === -1 || i + 1 >= process.argv.length) return null;
  return process.argv[i + 1];
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

async function rest(path, options = {}) {
  let res;
  let bodyText = "";
  for (let attempt = 0; attempt < 6; attempt += 1) {
    res = await fetch(`${REST_ENDPOINT}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": TOKEN,
        ...(options.headers || {})
      }
    });
    bodyText = await res.text();
    if (res.status !== 429) break;
    const retryAfter = Number(res.headers.get("retry-after") || "1");
    await new Promise((resolve) => setTimeout(resolve, Math.max(1000, retryAfter * 1000)));
  }
  const body = bodyText ? JSON.parse(bodyText) : {};
  body._headers = Object.fromEntries(res.headers.entries());
  if (!res.ok) throw new Error(`REST ${options.method || "GET"} ${path}: ${res.status} ${bodyText}`);
  return body;
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

function gidNumericId(gid) {
  return String(gid || "").split("/").pop();
}

function collectionGid(id) {
  return `gid://shopify/Collection/${id}`;
}

function productGid(id) {
  return `gid://shopify/Product/${id}`;
}

async function getMetaobjectByHandle(type, handle) {
  const data = await gql(
    `query Metaobject($handle: MetaobjectHandleInput!) {
      metaobjectByHandle(handle: $handle) { id handle type displayName fields { key value } }
    }`,
    { handle: { type, handle } }
  );
  return data.metaobjectByHandle || null;
}

async function findCustomCollection(handle) {
  const body = await rest(`/custom_collections.json?handle=${encodeURIComponent(handle)}&limit=1`);
  return body.custom_collections?.[0] || null;
}

async function findSmartCollection(handle) {
  const body = await rest(`/smart_collections.json?handle=${encodeURIComponent(handle)}&limit=1`);
  return body.smart_collections?.[0] || null;
}

async function upsertCustomCollection({ handle, title, template_suffix, body_html }) {
  const existing = await findCustomCollection(handle);
  const payload = {
    custom_collection: {
      title,
      handle,
      template_suffix,
      body_html: body_html || ""
    }
  };

  if (!APPLY) {
    console.log(`[DRY-RUN COLLECTION ${existing ? "UPDATE" : "CREATE"}] ${handle}`);
    return existing || { id: `dry-run-${handle}`, handle, title };
  }

  if (existing) {
    payload.custom_collection.id = existing.id;
    const body = await rest(`/custom_collections/${existing.id}.json`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    console.log(`[COLLECTION UPDATED] ${body.custom_collection.handle}`);
    return body.custom_collection;
  }

  const body = await rest("/custom_collections.json", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  console.log(`[COLLECTION CREATED] ${body.custom_collection.handle}`);
  return body.custom_collection;
}

async function updateCollectionSeo(collectionId, { seo_title, seo_description }) {
  if (!seo_title && !seo_description) return;

  if (!APPLY) {
    console.log(`[DRY-RUN SEO] collection=${collectionId} title="${seo_title || ""}"`);
    return;
  }

  const input = {
    id: collectionGid(collectionId),
    seo: {}
  };
  if (seo_title) input.seo.title = seo_title;
  if (seo_description) input.seo.description = seo_description;

  const data = await gql(
    `mutation CollectionSeoUpdate($input: CollectionInput!) {
      collectionUpdate(input: $input) {
        collection { id handle seo { title description } }
        userErrors { field message }
      }
    }`,
    { input }
  );
  const errors = data.collectionUpdate.userErrors || [];
  if (errors.length) throw new Error(`collectionUpdate SEO: ${JSON.stringify(errors)}`);
  console.log(`[COLLECTION SEO SET] ${data.collectionUpdate.collection.handle}`);
}

async function deleteSmartCollection(handle) {
  const existing = await findSmartCollection(handle);
  if (!existing) return;
  if (!APPLY) {
    console.log(`[DRY-RUN SMART DELETE] ${handle}`);
    return;
  }
  await rest(`/smart_collections/${existing.id}.json`, { method: "DELETE" });
  console.log(`[SMART DELETED] ${handle}`);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const stillExists = await findSmartCollection(handle);
    if (!stillExists) return;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Smart collection still exists after delete: ${handle}`);
}

function metafield(ownerId, key, type, value) {
  return { ownerId, namespace: "custom", key, type, value: String(value) };
}

async function setMetafields(metafields) {
  const data = await gql(
    `mutation SetMetafields($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { id namespace key type value }
        userErrors { field message code }
      }
    }`,
    { metafields }
  );
  const errors = data.metafieldsSet.userErrors || [];
  if (errors.length) throw new Error(`metafieldsSet: ${JSON.stringify(errors)}`);
}

async function setupCollections() {
  if (rootCollection) {
    await deleteSmartCollection(rootCollection.handle);
    const collection = await upsertCustomCollection(rootCollection);
    await updateCollectionSeo(collection.id, rootCollection);
  }

  for (const row of deityConfigs) {
    const deity = await getMetaobjectByHandle("deity_group", row.deity_handle);
    if (!deity) throw new Error(`Missing deity_group metaobject: ${row.deity_handle}`);

    await deleteSmartCollection(row.collection_handle);
    const collection = await upsertCustomCollection({
      handle: row.collection_handle,
      title: row.title,
      template_suffix: "deity-first",
      body_html:
        row.body_html ||
        `${row.title} selected by deity compatibility, ornament type and size guidance.`
    });

    const ownerId = collection.id?.startsWith?.("dry-run")
      ? collection.id
      : collectionGid(collection.id);
    const fields = [
      metafield(ownerId, "collection_role", "single_line_text_field", "deity_landing"),
      metafield(ownerId, "deity_first_enabled", "boolean", "true"),
      metafield(ownerId, "primary_deity_ref", "metaobject_reference", deity.id),
      metafield(ownerId, "deity_group_refs", "list.metaobject_reference", JSON.stringify([deity.id])),
      metafield(ownerId, "display_title", "single_line_text_field", row.display_title || row.title),
      metafield(ownerId, "sort_priority", "number_integer", row.sort_priority || 100)
    ];
    if (row.collection_intro) fields.push(metafield(ownerId, "collection_intro", "multi_line_text_field", row.collection_intro));
    if (row.size_fit_intro) fields.push(metafield(ownerId, "size_fit_intro", "multi_line_text_field", row.size_fit_intro));
    if (row.faq_family) fields.push(metafield(ownerId, "faq_family", "single_line_text_field", row.faq_family));
    if (row.regional_keyword_cluster?.length) {
      fields.push(
        metafield(
          ownerId,
          "regional_keyword_cluster",
          "list.single_line_text_field",
          JSON.stringify(row.regional_keyword_cluster)
        )
      );
    }

    if (!APPLY) {
      console.log(`[DRY-RUN METAFIELDS] ${row.collection_handle} ${fields.map((field) => field.key).join(",")}`);
    } else {
      await setMetafields(fields);
      console.log(`[COLLECTION METAFIELDS SET] ${row.collection_handle}`);
    }
    await updateCollectionSeo(collection.id, row);
  }
}

async function getAllProductsWithCompatibility() {
  const query = `
    query Products($after: String) {
      products(first: 100, after: $after) {
        nodes {
          id legacyResourceId handle title status
          primary: metafield(namespace: "custom", key: "primary_deity_ref") {
            reference { ... on Metaobject { handle } }
          }
          compatible: metafield(namespace: "custom", key: "compatible_deity_refs") {
            references(first: 25) { nodes { ... on Metaobject { handle } } }
          }
          notFor: metafield(namespace: "custom", key: "not_for_deity_refs") {
            references(first: 25) { nodes { ... on Metaobject { handle } } }
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  `;

  const products = [];
  let after = null;
  while (true) {
    const data = await gql(query, { after });
    products.push(...data.products.nodes);
    if (!data.products.pageInfo.hasNextPage) break;
    after = data.products.pageInfo.endCursor;
  }
  return products;
}

function targetDeityHandles(product) {
  const targets = new Set();
  const excluded = new Set(product.notFor?.references?.nodes?.map((node) => node.handle) || []);

  if (product.primary?.reference?.handle) targets.add(product.primary.reference.handle);
  for (const node of product.compatible?.references?.nodes || []) {
    if (node.handle) targets.add(node.handle);
  }
  for (const handle of excluded) targets.delete(handle);
  return targets;
}

async function getCollectProductIds(collectionId) {
  const productIds = new Set();
  let path = `/collects.json?collection_id=${collectionId}&limit=250`;
  while (true) {
    const body = await rest(path);
    for (const collect of body.collects || []) productIds.add(String(collect.product_id));

    const link = body?._headers?.link;
    if (!link || !link.includes('rel="next"')) break;
    path = nextPathFromLink(link);
    if (!path) break;
  }
  return productIds;
}

async function listCollects(collectionId) {
  const collects = [];
  let path = `/collects.json?collection_id=${collectionId}&limit=250`;
  while (true) {
    const body = await rest(path);
    collects.push(...(body.collects || []));
    const link = body?._headers?.link;
    if (!link || !link.includes('rel="next"')) break;
    path = nextPathFromLink(link);
    if (!path) break;
  }
  return collects;
}

function nextPathFromLink(link) {
  const match = String(link || "").match(/<([^>]+)>;\s*rel="next"/);
  if (!match) return null;
  const url = new URL(match[1]);
  return `${url.pathname}${url.search}`.replace(`/admin/api/${API_VERSION}`, "");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function addCollect(collectionId, productId) {
  if (!APPLY) {
    console.log(`[DRY-RUN COLLECT ADD] collection=${collectionId} product=${productId}`);
    return;
  }
  await rest("/collects.json", {
    method: "POST",
    body: JSON.stringify({ collect: { collection_id: collectionId, product_id: productId } })
  });
  console.log(`[COLLECT ADD] collection=${collectionId} product=${productId}`);
  await sleep(650);
}

async function removeCollect(collect) {
  if (!APPLY) {
    console.log(`[DRY-RUN COLLECT REMOVE] collect=${collect.id}`);
    return;
  }
  await rest(`/collects/${collect.id}.json`, { method: "DELETE" });
  console.log(`[COLLECT REMOVE] collect=${collect.id}`);
}

async function syncProducts() {
  const products = await getAllProductsWithCompatibility();
  const configByDeity = new Map();
  for (const row of deityConfigs) {
    if (!configByDeity.has(row.deity_handle)) configByDeity.set(row.deity_handle, []);
    configByDeity.get(row.deity_handle).push(row);
  }
  const desiredByCollectionHandle = new Map(deityConfigs.map((row) => [row.collection_handle, new Set()]));

  for (const product of products) {
    if (product.status && product.status !== "ACTIVE") continue;
    for (const deityHandle of targetDeityHandles(product)) {
      const configRows = configByDeity.get(deityHandle) || [];
      for (const configRow of configRows) {
        desiredByCollectionHandle.get(configRow.collection_handle).add(gidNumericId(product.id));
      }
    }
  }

  for (const row of deityConfigs) {
    const collection = await findCustomCollection(row.collection_handle);
    if (!collection) {
      console.warn(`[MISSING CUSTOM COLLECTION] ${row.collection_handle}. Run --setup-collections first.`);
      continue;
    }

    const desired = desiredByCollectionHandle.get(row.collection_handle) || new Set();
    const currentCollects = await listCollects(collection.id);
    const currentProductIds = new Set(currentCollects.map((collect) => String(collect.product_id)));
    const toAdd = [...desired].filter((productId) => !currentProductIds.has(productId));
    const toRemove = currentCollects.filter((collect) => !desired.has(String(collect.product_id)));

    console.log(
      `[SYNC PLAN] ${row.collection_handle}: desired=${desired.size} current=${currentProductIds.size} add=${toAdd.length} remove=${PRUNE ? toRemove.length : 0}`
    );

    for (const productId of toAdd) await addCollect(collection.id, productId);
    if (PRUNE) {
      for (const collect of toRemove) await removeCollect(collect);
    } else if (toRemove.length) {
      console.log(`[PRUNE SKIPPED] ${row.collection_handle}: ${toRemove.length} products would be removed with --prune`);
    }
  }
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  console.log(`Operations: ${[
    DELETE_TITLE_SMART && "delete-title-smart",
    SETUP_COLLECTIONS && "setup-collections",
    SYNC_PRODUCTS && "sync-products",
    PRUNE && "prune"
  ].filter(Boolean).join(", ")}`);

  if (DELETE_TITLE_SMART && rootCollection) await deleteSmartCollection(rootCollection.handle);
  if (DELETE_TITLE_SMART) {
    for (const row of deityConfigs) await deleteSmartCollection(row.collection_handle);
  }
  if (SETUP_COLLECTIONS) await setupCollections();
  if (SYNC_PRODUCTS) await syncProducts();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
