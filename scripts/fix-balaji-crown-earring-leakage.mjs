#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "tmp", "crown-regression-investigation");
const env = readEnv(path.join(root, "env"));
const shop = env.SHOPIFY_STORE_DOMAIN;
const token = env.SHOPIFY_ADMIN_TOKEN;
const apiVersion = env.SHOPIFY_API_VERSION || "2025-10";
const endpoint = `https://${shop}/admin/api/${apiVersion}/graphql.json`;
const apply = process.argv.includes("--apply");

const baselineFile = path.join(root, "tmp", "crown-ucp-sprint", "ucp-regression-retest-2026-05-19.json");
const collectionHandle = "deity-earrings-for-god-idols-statues";

if (!shop || !token) throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");

fs.mkdirSync(outDir, { recursive: true });

const before = await fetchLeakingProducts();
const collectionBefore = await fetchCollection();
const changes = before.map((product) => {
  const fitNotes = product.metafields.nodes.find((metafield) => metafield.key === "fit_notes");
  return {
    productId: product.id,
    title: product.title,
    handle: product.handle,
    descriptionChanged: product.descriptionHtml !== cleanEarringFitLanguage(product.descriptionHtml),
    fitNotesMetafieldId: fitNotes?.id || "",
    fitNotesMetafield: fitNotes
      ? {
          ownerId: product.id,
          namespace: fitNotes.namespace,
          key: fitNotes.key,
          type: fitNotes.type
        }
      : null,
    fitNotesChanged: fitNotes ? fitNotes.value !== cleanEarringFitLanguage(fitNotes.value) : false,
    descriptionHtml: cleanEarringFitLanguage(product.descriptionHtml),
    fitNotesValue: fitNotes ? cleanEarringFitLanguage(fitNotes.value) : ""
  };
});

const collectionChange = {
  collectionId: collectionBefore.id,
  handle: collectionBefore.handle,
  descriptionChanged: collectionBefore.descriptionHtml !== cleanEarringFitLanguage(collectionBefore.descriptionHtml),
  descriptionHtml: cleanEarringFitLanguage(collectionBefore.descriptionHtml),
  metafields: collectionBefore.metafields.nodes
    .filter((metafield) => ["collection_intro", "size_fit_intro"].includes(metafield.key))
    .map((metafield) => ({
      id: metafield.id,
      namespace: metafield.namespace,
      key: metafield.key,
      type: metafield.type,
      before: metafield.value,
      after: cleanEarringFitLanguage(metafield.value),
      changed: metafield.value !== cleanEarringFitLanguage(metafield.value)
    }))
};

const beforePath = path.join(outDir, "balaji-earring-leakage-cleanup-before.json");
fs.writeFileSync(beforePath, `${JSON.stringify({ generatedAt: new Date().toISOString(), products: before, collection: collectionBefore, changes, collectionChange }, null, 2)}\n`);
console.log(`Wrote ${path.relative(root, beforePath)}`);

for (const change of changes) {
  if (!change.descriptionChanged && !change.fitNotesChanged) {
    console.log(`No product text change needed: ${change.handle}`);
    continue;
  }
  console.log(`${apply ? "Apply" : "Dry"} product cleanup: ${change.handle}`);
  if (apply) await updateProduct(change);
}

if (collectionChange.descriptionChanged || collectionChange.metafields.some((item) => item.changed)) {
  console.log(`${apply ? "Apply" : "Dry"} collection cleanup: ${collectionChange.handle}`);
  if (apply) await updateCollection(collectionChange);
}

if (apply) {
  const after = await fetchLeakingProducts();
  const collectionAfter = await fetchCollection();
  const afterPath = path.join(outDir, "balaji-earring-leakage-cleanup-after.json");
  fs.writeFileSync(afterPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), products: after, collection: collectionAfter }, null, 2)}\n`);
  console.log(`Wrote ${path.relative(root, afterPath)}`);
}

async function fetchLeakingProducts() {
  const baseline = JSON.parse(fs.readFileSync(baselineFile, "utf8"));
  const balaji = baseline.find((row) => row.prompt === "Balaji crown for idol");
  if (!balaji) throw new Error("Balaji crown prompt not found in baseline");
  const ids = balaji.results.slice(0, 10).filter((result) => result.isWrongType).map((result) => result.variant);
  const data = await gql(
    `query LeakingProducts($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on ProductVariant {
          id
          sku
          product {
            id
            title
            handle
            status
            productType
            descriptionHtml
            seo { title description }
            metafields(first: 50, namespace: "custom") {
              nodes { id namespace key type value }
            }
          }
        }
      }
    }`,
    { ids }
  );
  const seen = new Set();
  return data.nodes
    .map((node) => ({ leakingVariantId: node.id, leakingVariantSku: node.sku, ...node.product }))
    .filter((product) => {
      if (seen.has(product.id)) return false;
      seen.add(product.id);
      return true;
    });
}

async function fetchCollection() {
  const data = await gql(
    `query Collection($handle: String!) {
      collectionByHandle(handle: $handle) {
        id
        handle
        title
        descriptionHtml
        seo { title description }
        metafields(first: 50, namespace: "custom") {
          nodes { id namespace key type value }
        }
      }
    }`,
    { handle: collectionHandle }
  );
  if (!data.collectionByHandle) throw new Error(`Collection not found: ${collectionHandle}`);
  return data.collectionByHandle;
}

async function updateProduct(change) {
  const input = {
    id: change.productId,
    descriptionHtml: change.descriptionHtml
  };
  const data = await gql(
    `mutation ProductUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        userErrors { field message }
      }
    }`,
    { input }
  );
  const errors = data.productUpdate.userErrors || [];
  if (errors.length) throw new Error(`productUpdate ${change.handle}: ${JSON.stringify(errors)}`);

  if (change.fitNotesMetafieldId && change.fitNotesChanged) {
    await setMetafields([
      {
        ownerId: change.fitNotesMetafield.ownerId,
        namespace: change.fitNotesMetafield.namespace,
        key: change.fitNotesMetafield.key,
        type: change.fitNotesMetafield.type,
        value: change.fitNotesValue
      }
    ]);
  }
}

async function updateCollection(change) {
  if (change.descriptionChanged) {
    const data = await gql(
      `mutation CollectionUpdate($input: CollectionInput!) {
        collectionUpdate(input: $input) {
          userErrors { field message }
        }
      }`,
      { input: { id: change.collectionId, descriptionHtml: change.descriptionHtml } }
    );
    const errors = data.collectionUpdate.userErrors || [];
    if (errors.length) throw new Error(`collectionUpdate ${change.handle}: ${JSON.stringify(errors)}`);
  }
  const metafields = change.metafields
    .filter((item) => item.changed)
    .map((item) => ({
      ownerId: change.collectionId,
      namespace: item.namespace,
      key: item.key,
      type: item.type,
      value: item.after
    }));
  if (metafields.length) await setMetafields(metafields);
}

async function setMetafields(metafields) {
  const data = await gql(
    `mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        userErrors { field message }
      }
    }`,
    { metafields }
  );
  const errors = data.metafieldsSet.userErrors || [];
  if (errors.length) throw new Error(`metafieldsSet: ${JSON.stringify(errors)}`);
}

async function gql(query, variables = {}) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token
    },
    body: JSON.stringify({ query, variables })
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : null;
  if (!response.ok || json?.errors) {
    throw new Error(`GraphQL HTTP ${response.status}: ${text.slice(0, 1200)}`);
  }
  await waitForThrottle(json.extensions?.cost?.throttleStatus);
  return json.data;
}

function cleanEarringFitLanguage(value) {
  return String(value || "")
    .replace(/\bcrown position\b/gi, "head ornament clearance")
    .replace(/\blarge crown\b/gi, "large head ornament")
    .replace(/\bcrown\b/gi, "head ornament");
}

async function waitForThrottle(status) {
  if (!status) return;
  const { currentlyAvailable, restoreRate } = status;
  if (currentlyAvailable == null || restoreRate == null || currentlyAvailable >= 250) return;
  const waitMs = Math.ceil(((250 - currentlyAvailable) / restoreRate) * 1000);
  await new Promise((resolve) => setTimeout(resolve, Math.min(Math.max(waitMs, 500), 5000)));
}

function readEnv(filePath) {
  return Object.fromEntries(
    fs
      .readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, "")];
      })
  );
}
