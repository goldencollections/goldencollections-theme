#!/usr/bin/env node
import fs from "node:fs";

const ENV_FILE = "env";
const REQUIRED_CUSTOM = [
  "range_type",
  "ornament_type",
  "ornament_type_ref",
  "placement",
  "material",
  "compatibility_class",
  "compatible_deities",
  "compatible_deity_refs",
  "primary_deity_ref",
  "fit_notes",
  "size_confidence",
  "component_count",
  "set_items_included",
  "regional_names"
];

const CONFIGS = [
  { handle: "deity-eyes-for-god-idols-statues", title: "Deity Eyes", gpc: "97" },
  { handle: "waist-belt-vaddanam-jewellery-for-hindu-gods-goddess-1", title: "Deity Waist Belts", gpc: "169" },
  { handle: "god-goddess-arch", title: "Deity Arches for Crowns", gpc: "97" },
  { handle: "deity-god-pustal-tadu-thali-kasulaperu", title: "Deity Pustal Tadu and Thali", gpc: "97" },
  { handle: "god-deity-pendants", title: "Deity Pendants and Lockets", gpc: "192" },
  { handle: "buy-stone-nathu-bullaku-nose-rings-for-goddess-amman-jewelry", title: "Deity Nose Rings", gpc: "97" },
  { handle: "buy-god-mustache-jewellery-deity-mustache-accessories-for-idols", title: "Deity Mustache", gpc: "97" },
  { handle: "god-goddess-weapons", title: "Deity Weapons and Symbols", gpc: "97" },
  { handle: "buy-deity-taira-idol-sacred-taira-statues-for-pooja-and-worship", title: "Deity Taira", gpc: "97", draftedSkuKeys: new Set(["GDT004", "GDT007", "GDT012"]) },
  { handle: "deity-bindi-tilak-thiruman", title: "Deity Bindi, Tilak and Thiruman", gpc: "97" },
  { handle: "stone-shankh-chakra-gold-plated-shanku-chakra-for-vishnu-and-perumal", title: "Deity Shanku Chakra", gpc: "97" }
];

const env = readEnv(ENV_FILE);
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const GRAPHQL_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;
const STORE = "https://www.goldencollections.com";

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
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN },
    body: JSON.stringify({ query, variables })
  });
  const body = await res.json();
  if (body.errors?.length) throw new Error(`GraphQL errors: ${JSON.stringify(body.errors)}`);
  return body.data;
}

async function fetchCollection(config) {
  const products = [];
  let collection = null;
  let after = null;
  do {
    const data = await gql(
      `query Products($handle: String!, $after: String) {
        collectionByHandle(handle: $handle) {
          id handle title sortOrder templateSuffix productsCount { count } seo { title description }
          metafields(first: 80) { nodes { namespace key value type } }
          products(first: 100, after: $after) {
            pageInfo { hasNextPage endCursor }
            nodes {
              id handle title productType status totalInventory templateSuffix
              images(first: 10) { nodes { id altText } }
              variants(first: 100) { nodes { sku barcode selectedOptions { name value } } }
              metafields(first: 100) { nodes { namespace key value type } }
            }
          }
        }
      }`,
      { handle: config.handle, after }
    );
    collection = data.collectionByHandle;
    if (!collection) throw new Error(`Missing collection ${config.handle}`);
    products.push(...collection.products.nodes);
    after = collection.products.pageInfo.hasNextPage ? collection.products.pageInfo.endCursor : null;
  } while (after);
  return { collection, products };
}

function mf(product, namespace, key) {
  return product.metafields.nodes.find((node) => node.namespace === namespace && node.key === key)?.value || "";
}

function normalizeSku(value) {
  return String(value || "").replace(/\s+/g, "").replace(/-/g, "").toUpperCase();
}

function skuKey(product) {
  return normalizeSku(product.variants.nodes.find((variant) => variant.sku)?.sku || product.title.match(/\b[A-Z]{2,5}-?\d{3}\b/i)?.[0] || "");
}

function orderViolation(products) {
  let seenSoldOut = false;
  for (const product of products) {
    if (product.status !== "ACTIVE") continue;
    if (product.totalInventory > 0) {
      if (seenSoldOut) return true;
    } else {
      seenSoldOut = true;
    }
  }
  return false;
}

function extractJsonLd(html) {
  const blocks = [];
  const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html))) {
    const raw = match[1].trim();
    try {
      blocks.push({ ok: true, value: JSON.parse(raw) });
    } catch (error) {
      blocks.push({ ok: false, error: error.message });
    }
  }
  return blocks;
}

function hasType(value, type) {
  if (!value) return false;
  if (Array.isArray(value)) return value.some((item) => hasType(item, type));
  if (typeof value === "object") {
    const current = value["@type"];
    if (current === type || (Array.isArray(current) && current.includes(type))) return true;
    return Object.values(value).some((item) => hasType(item, type));
  }
  return false;
}

async function fetchPage(path) {
  const res = await fetch(`${STORE}${path}?_verify=${Date.now()}`, {
    headers: { "User-Agent": "GoldenCollectionsSEOAudit/1.0" }
  });
  const html = await res.text();
  if (!res.ok) throw new Error(`${path} returned ${res.status}`);
  return html;
}

async function main() {
  const output = [];
  let totalActive = 0;
  let totalProductPages = 0;
  let totalProductJsonOk = 0;
  let totalProductFaqOk = 0;
  let totalJsonBad = 0;

  for (const config of CONFIGS) {
    const { collection, products } = await fetchCollection(config);
    const active = products.filter((product) => product.status === "ACTIVE");
    const draft = products.filter((product) => product.status === "DRAFT");
    totalActive += active.length;

    const missingFields = active.filter((product) => REQUIRED_CUSTOM.some((key) => !mf(product, "custom", key)));
    const badFeed = active.filter(
      (product) =>
        mf(product, "mm-google-shopping", "google_product_category") !== config.gpc ||
        mf(product, "mm-google-shopping", "condition") !== "new" ||
        mf(product, "mm-google-shopping", "custom_product") !== "true" ||
        mf(product, "mm-google-shopping", "age_group") ||
        mf(product, "mm-google-shopping", "gender")
    );
    const badTemplate = active.filter((product) => product.templateSuffix !== "deity-lite");
    const activeZeroImages = active.filter((product) => product.images.nodes.length === 0);
    const draftSkuStatus =
      config.draftedSkuKeys &&
      products.filter((product) => config.draftedSkuKeys.has(skuKey(product))).every((product) => product.status === "DRAFT");

    const collectionHtml = await fetchPage(`/collections/${config.handle}`);
    const collectionJson = extractJsonLd(collectionHtml);
    const collectionBad = collectionJson.filter((block) => !block.ok).length;
    totalJsonBad += collectionBad;

    let productJsonOk = 0;
    let productFaqOk = 0;
    let productJsonBad = 0;
    for (const product of active) {
      const html = await fetchPage(`/products/${product.handle}`);
      const blocks = extractJsonLd(html);
      productJsonBad += blocks.filter((block) => !block.ok).length;
      if (blocks.some((block) => block.ok && hasType(block.value, "Product"))) productJsonOk += 1;
      if (blocks.some((block) => block.ok && hasType(block.value, "FAQPage"))) productFaqOk += 1;
      totalProductPages += 1;
    }
    totalJsonBad += productJsonBad;
    totalProductJsonOk += productJsonOk;
    totalProductFaqOk += productFaqOk;

    output.push({
      handle: config.handle,
      titleOk: collection.title === config.title,
      templateOk: collection.templateSuffix === "deity-ornament-default",
      sortOk: collection.sortOrder === "MANUAL" && !orderViolation(products),
      active: active.length,
      draft: draft.length,
      activeZeroImages: activeZeroImages.length,
      missingFields: missingFields.length,
      badFeed: badFeed.length,
      badTemplate: badTemplate.length,
      draftedSkuStatus: draftSkuStatus ?? true,
      collectionJsonOk: collectionJson.filter((block) => block.ok).length,
      collectionJsonBad: collectionBad,
      productPagesChecked: active.length,
      productJsonOk,
      productFaqOk,
      productJsonBad
    });
  }

  console.log(JSON.stringify({ totalActive, totalProductPages, totalProductJsonOk, totalProductFaqOk, totalJsonBad, collections: output }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
