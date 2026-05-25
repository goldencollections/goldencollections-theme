#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const OUT_DIR = path.join(root, "tmp", "deity-short-necklace-ucp-sprint");
const env = readEnv(path.join(root, "env"));
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const GRAPHQL_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;
const APPLY = process.argv.includes("--apply");

const TITLE_BY_SKU = {
  DSN029: "Deity 1 Step Short Haram / Short Necklace DSN029",
  DSN061: "Deity 2 Step Short Haram / Short Necklace DSN061",
  DSN063: "Goddess 2 Step Short Haram / Short Necklace DSN063",
  DSN065: "Goddess Pink 2 Step Short Haram / Short Necklace DSN065",
  DSN066: "Amman / Ammavaru Short Haram / Chest Necklace DSN066",
  DSN067: "Varalakshmi Short Haram / Chest Necklace DSN067",
  DSN076: "Goddess Short Haram / Chest Necklace DSN076",
  DSN077: "Lakshmi / Amman Short Haram / Chest Necklace DSN077",
  DSN078: "Goddess Short Haram / Chest Necklace DSN078",
  DSN079: "Lakshmi / Amman Short Haram / Chest Necklace DSN079",
  DSN081: "Goddess Short Haram / Chest Necklace DSN081",
  DSN083: "Goddess Short Haram / Chest Necklace DSN083",
  DSN089: "Lakshmi / Amman Short Haram / Chest Necklace DSN089",
  DSN090: "Goddess Short Haram / Chest Necklace DSN090",
  DSN097: "Lakshmi / Amman Short Haram / Chest Necklace DSN097",
  DSN125: "Goddess Short Haram / Chest Necklace DSN125",
  DSN127: "Deity 2 Step Short Haram / Short Necklace DSN127",
  DSN132: "Lakshmi / Amman 1 Step Short Haram / Short Necklace DSN132",
  DSN216: "Deity Short Haram / Short Necklace DSN216",
  DSN217: "Deity Short Haram / Short Necklace DSN217",
  DSN218: "Deity Short Haram / Short Necklace with Pink Green Stones DSN218"
};

if (!SHOP || !TOKEN) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const synonymRows = readJson(path.join(OUT_DIR, "applied-short-haram-query-synonyms.json"));
const targets = synonymRows.filter((row) => TITLE_BY_SKU[row.sku]);
const preview = [];

for (const target of targets) {
  const product = await fetchProduct(target.handle);
  if (!product) continue;

  const ornamentType = product.metafieldOrnamentType?.value || "";
  if (!/short necklace/i.test(ornamentType)) {
    preview.push({ ...target, skipped: true, reason: `Ornament type is not Short Necklace: ${ornamentType}` });
    continue;
  }

  const nextTitle = TITLE_BY_SKU[target.sku];
  const currentTitleTag = product.metafieldTitleTag?.value || "";
  const nextTitleTag = /short\s+haram/i.test(currentTitleTag)
    ? currentTitleTag
    : nextTitle.slice(0, 255);
  const row = {
    productId: product.id,
    handle: product.handle,
    sku: target.sku,
    ornamentType,
    beforeTitle: product.title,
    afterTitle: nextTitle,
    changedTitle: product.title !== nextTitle,
    beforeTitleTag: currentTitleTag,
    afterTitleTag: nextTitleTag,
    changedTitleTag: currentTitleTag !== nextTitleTag
  };
  preview.push(row);

  if (APPLY && (row.changedTitle || row.changedTitleTag)) {
    if (row.changedTitle) {
      await productUpdate(product.id, nextTitle);
    }
    if (row.changedTitleTag) {
      await metafieldsSet([
        {
          ownerId: product.id,
          namespace: "global",
          key: "title_tag",
          type: "single_line_text_field",
          value: nextTitleTag
        }
      ]);
    }
    console.log(`Updated short haram title: ${target.sku} ${product.handle}`);
  }
}

const output = path.join(OUT_DIR, APPLY ? "applied-short-haram-title-disambiguation.json" : "short-haram-title-disambiguation-preview.json");
fs.writeFileSync(output, `${JSON.stringify(preview, null, 2)}\n`);
console.log(`${APPLY ? "Applied" : "Previewed"} ${preview.filter((row) => row.changedTitle || row.changedTitleTag).length} title disambiguation updates.`);
console.log(`Wrote ${path.relative(root, output)}`);

async function fetchProduct(handle) {
  const data = await gql(
    `query($handle: String!) {
      productByHandle(handle: $handle) {
        id
        handle
        title
        metafieldOrnamentType: metafield(namespace: "custom", key: "ornament_type") {
          value
        }
        metafieldTitleTag: metafield(namespace: "global", key: "title_tag") {
          value
        }
      }
    }`,
    { handle }
  );
  return data.productByHandle;
}

async function productUpdate(id, title) {
  const data = await gql(
    `mutation($input: ProductInput!) {
      productUpdate(input: $input) {
        product {
          id
        }
        userErrors {
          field
          message
        }
      }
    }`,
    { input: { id, title } }
  );
  const errors = data.productUpdate.userErrors || [];
  if (errors.length) throw new Error(JSON.stringify(errors, null, 2));
}

async function metafieldsSet(metafields) {
  const data = await gql(
    `mutation($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          key
        }
        userErrors {
          field
          message
        }
      }
    }`,
    { metafields }
  );
  const errors = data.metafieldsSet.userErrors || [];
  if (errors.length) throw new Error(JSON.stringify(errors, null, 2));
}

async function gql(query, variables = {}) {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN
    },
    body: JSON.stringify({ query, variables })
  });
  const json = await response.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors, null, 2));
  return json.data;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
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
