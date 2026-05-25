#!/usr/bin/env node
import fs from "node:fs";

const ENV_FILE = "env";
const HANDLES = [
  "deity-crowns-1",
  "deity-necklace",
  "varalakshmi-deity-jewellery",
  "sacred-sanctum-decor",
  "deity-accessories-nose-rings-mustache-weapons-taira"
];
const REQUIRED_METAFIELDS = [
  "display_title",
  "collection_intro",
  "size_fit_intro",
  "faq_family",
  "collection_role",
  "deity_first_enabled",
  "shopping_path_label",
  "regional_keyword_cluster"
];

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
      `query CollectionAudit($handle: String!, $after: String) {
        collectionByHandle(handle: $handle) {
          id
          handle
          title
          descriptionHtml
          templateSuffix
          sortOrder
          seo { title description }
          metafields(first: 50, namespace: "custom") {
            nodes { key type value }
          }
          productsCount { count }
          products(first: 100, after: $after) {
            pageInfo { hasNextPage endCursor }
            nodes {
              id
              handle
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
  return { ...collection, products };
}

function productBucket(product) {
  if (product.status === "ACTIVE" && product.images.nodes.length > 0 && product.totalInventory > 0) return 0;
  if (product.status === "ACTIVE" && product.images.nodes.length > 0) return 1;
  if (product.status === "ACTIVE") return 2;
  return 3;
}

function orderProblem(products) {
  let maxSeen = 0;
  for (const product of products) {
    const bucket = productBucket(product);
    if (bucket < maxSeen) return true;
    maxSeen = Math.max(maxSeen, bucket);
  }
  return false;
}

function metafieldMap(collection) {
  return Object.fromEntries(collection.metafields.nodes.map((field) => [field.key, field.value]));
}

async function livePageAudit(handle) {
  const url = `https://www.goldencollections.com/collections/${handle}`;
  const html = await fetch(url, { headers: { "User-Agent": "GoldenCollectionsAudit/1.0" } }).then((res) => res.text());
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((match) =>
    match[1].trim()
  );
  const jsonLd = { ok: 0, bad: 0, types: [] };
  for (const script of scripts) {
    try {
      const parsed = JSON.parse(script);
      jsonLd.ok += 1;
      const items = Array.isArray(parsed) ? parsed : [parsed];
      jsonLd.types.push(
        ...items.flatMap((item) => {
          if (Array.isArray(item?.["@graph"])) return item["@graph"].map((graphItem) => graphItem?.["@type"]).filter(Boolean);
          return item?.["@type"] ? [item["@type"]] : [];
        })
      );
    } catch {
      jsonLd.bad += 1;
    }
  }
  return {
    url,
    statusTextPresent: !/404|Page not found/i.test(html.slice(0, 5000)),
    title: html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || "",
    jsonLd
  };
}

async function main() {
  const audits = [];
  for (const handle of HANDLES) {
    const collection = await fetchCollection(handle);
    const meta = metafieldMap(collection);
    const live = await livePageAudit(handle);
    const missingMetafields = REQUIRED_METAFIELDS.filter((key) => !meta[key]);
    audits.push({
      handle,
      title: collection.title,
      templateSuffix: collection.templateSuffix,
      sortOrder: collection.sortOrder,
      seoTitle: collection.seo?.title || "",
      seoDescription: collection.seo?.description || "",
      descriptionLength: collection.descriptionHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().length,
      metafields: Object.fromEntries(REQUIRED_METAFIELDS.map((key) => [key, meta[key] || ""])),
      missingMetafields,
      productCount: collection.products.length,
      activeProducts: collection.products.filter((product) => product.status === "ACTIVE").length,
      activeZeroImage: collection.products.filter((product) => product.status === "ACTIVE" && product.images.nodes.length === 0).length,
      orderProblem: orderProblem(collection.products),
      firstProducts: collection.products.slice(0, 8).map((product) => ({
        title: product.title,
        status: product.status,
        inventory: product.totalInventory,
        hasImage: product.images.nodes.length > 0
      })),
      live
    });
  }

  fs.mkdirSync("tmp", { recursive: true });
  fs.writeFileSync("tmp/requested-parent-collections-audit.json", `${JSON.stringify(audits, null, 2)}\n`);
  console.log(JSON.stringify(audits, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
