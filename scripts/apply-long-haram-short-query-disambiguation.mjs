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

const TARGET_SKUS = new Set(["DLN139", "DLN058", "DLN028"]);
const LONG_HARAM_REGIONAL_NAMES = [
  "deity long haram",
  "deity long necklace",
  "long haram for lower body idol alankaram",
  "long necklace for lower chest idol alankaram",
  "idol long haram",
  "idol long necklace",
  "long haar for deity idol",
  "long mala for deity idol",
  "long malai for deity idol",
  "lower body alankaram necklace",
  "temple deity long necklace",
  "swamy long alankaram necklace",
  "ammavaru long haram",
  "amman long haram",
  "lakshmi long haram"
];

if (!SHOP || !TOKEN) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const products = await fetchTargetProducts();
const preview = [];

for (const product of products) {
  const sku = firstSku(product);
  const ornamentType = product.metafieldOrnamentType?.value || "";
  if (!TARGET_SKUS.has(sku) || !/long/i.test(ornamentType || product.productType || product.title)) continue;

  const currentRegionalNames = parseListMetafield(product.metafieldRegionalNames?.value);
  const currentFitNotes = product.metafieldFitNotes?.value || "";
  const currentDescriptionTag = product.metafieldDescriptionTag?.value || "";
  const currentDescriptionHtml = product.descriptionHtml || "";

  const nextFitNotes = strengthenFitNotes(currentFitNotes);
  const nextDescriptionTag = strengthenDescriptionTag(currentDescriptionTag, product.title);
  const nextDescriptionHtml = strengthenDescription(currentDescriptionHtml);

  const row = {
    productId: product.id,
    handle: product.handle,
    title: product.title,
    sku,
    productType: product.productType,
    ornamentType,
    beforeRegionalNames: currentRegionalNames,
    afterRegionalNames: LONG_HARAM_REGIONAL_NAMES,
    changedRegionalNames: JSON.stringify(currentRegionalNames) !== JSON.stringify(LONG_HARAM_REGIONAL_NAMES),
    beforeFitNotes: currentFitNotes,
    afterFitNotes: nextFitNotes,
    changedFitNotes: currentFitNotes !== nextFitNotes,
    beforeDescriptionTag: currentDescriptionTag,
    afterDescriptionTag: nextDescriptionTag,
    changedDescriptionTag: currentDescriptionTag !== nextDescriptionTag,
    beforeDescriptionText: stripHtml(currentDescriptionHtml).slice(0, 260),
    afterDescriptionText: stripHtml(nextDescriptionHtml).slice(0, 260),
    changedDescription: currentDescriptionHtml !== nextDescriptionHtml
  };
  preview.push(row);

  if (APPLY) {
    const metafields = [];
    if (row.changedRegionalNames) {
      metafields.push({
        ownerId: product.id,
        namespace: "custom",
        key: "regional_names",
        type: "list.single_line_text_field",
        value: JSON.stringify(LONG_HARAM_REGIONAL_NAMES)
      });
    }
    if (row.changedFitNotes) {
      metafields.push({
        ownerId: product.id,
        namespace: "custom",
        key: "fit_notes",
        type: "multi_line_text_field",
        value: nextFitNotes
      });
    }
    if (row.changedDescriptionTag) {
      metafields.push({
        ownerId: product.id,
        namespace: "global",
        key: "description_tag",
        type: "single_line_text_field",
        value: nextDescriptionTag
      });
    }
    if (metafields.length) await metafieldsSet(metafields);
    if (row.changedDescription) await productUpdate(product.id, nextDescriptionHtml);
    console.log(`Updated long-haram disambiguation: ${sku} ${product.handle}`);
  }
}

const output = path.join(
  OUT_DIR,
  APPLY ? "applied-long-haram-short-query-disambiguation.json" : "long-haram-short-query-disambiguation-preview.json"
);
fs.writeFileSync(output, `${JSON.stringify(preview, null, 2)}\n`);
console.log(`${APPLY ? "Applied" : "Previewed"} ${preview.length} long-haram disambiguation rows.`);
console.log(`Wrote ${path.relative(root, output)}`);

async function fetchTargetProducts() {
  const products = [];
  let after = null;
  do {
    const data = await gql(
      `query($after: String) {
        collectionByHandle(handle: "deity-long-harams") {
          products(first: 100, after: $after) {
            pageInfo { hasNextPage endCursor }
            nodes {
              id
              handle
              title
              productType
              descriptionHtml
              variants(first: 20) {
                nodes { sku selectedOptions { name value } }
              }
              metafieldRegionalNames: metafield(namespace: "custom", key: "regional_names") { value }
              metafieldOrnamentType: metafield(namespace: "custom", key: "ornament_type") { value }
              metafieldFitNotes: metafield(namespace: "custom", key: "fit_notes") { value }
              metafieldDescriptionTag: metafield(namespace: "global", key: "description_tag") { value }
            }
          }
        }
      }`,
      { after }
    );
    const connection = data.collectionByHandle?.products;
    if (!connection) throw new Error("Missing deity-long-harams collection");
    products.push(...connection.nodes);
    after = connection.pageInfo.hasNextPage ? connection.pageInfo.endCursor : null;
  } while (after);
  return products;
}

function strengthenFitNotes(value) {
  const target =
    "Long harams are for lower chest, body or dress-drape placement rather than close neck or upper-chest placement. Compare Length x Width with idol height, chest width and desired drop before ordering.";
  if (/lower chest, body or dress-drape placement/i.test(value)) return value;
  return value ? `${value}\n${target}` : target;
}

function strengthenDescriptionTag(value, title) {
  const current = String(value || "").trim();
  if (/lower chest|body drop|dress/i.test(current) && /long haram|long necklace/i.test(current)) return current;
  const label = title || "Deity long haram";
  return `Shop ${label} as a long haram / long necklace for lower chest, body or dress-drape idol alankaram. Compare Length x Width before ordering.`.slice(0, 320);
}

function strengthenDescription(html) {
  const marker =
    "This is a long haram / long necklace for lower chest, body or dress-drape idol alankaram.";
  if (/lower chest, body or dress-drape idol alankaram/i.test(html)) return html;
  if (/Deity long haram\s*\/\s*long necklace/i.test(html)) {
    return html.replace(
      /Deity long haram\s*\/\s*long necklace for Hindu god and goddess idol alankaram\./i,
      `Deity long haram / long necklace for Hindu god and goddess idol alankaram. ${marker}`
    );
  }
  return `<p>${marker}</p>\n${html}`;
}

async function productUpdate(id, descriptionHtml) {
  const data = await gql(
    `mutation($input: ProductInput!) {
      productUpdate(input: $input) {
        product { id }
        userErrors { field message }
      }
    }`,
    { input: { id, descriptionHtml } }
  );
  const errors = data.productUpdate.userErrors || [];
  if (errors.length) throw new Error(JSON.stringify(errors, null, 2));
}

async function metafieldsSet(metafields) {
  const data = await gql(
    `mutation($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { id key }
        userErrors { field message }
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

function firstSku(product) {
  const titleSku = product.title.match(/\bDLN[-\s]?(\d+)\b/i);
  if (titleSku) return `DLN${titleSku[1].padStart(3, "0")}`;
  return product.variants.nodes.find((variant) => variant.sku)?.sku || "";
}

function parseListMetafield(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
  } catch {
    return [];
  }
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
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
