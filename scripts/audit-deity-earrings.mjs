#!/usr/bin/env node
import fs from "node:fs";

const ENV_FILE = "env";
const COLLECTION_HANDLE = "deity-earrings-for-god-idols-statues";
const OUT_DIR = "tmp/reviews";
const OUT_JSON = `${OUT_DIR}/deity-earrings-audit.json`;
const OUT_CSV = `${OUT_DIR}/deity-earrings-owner-questions.csv`;

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
        return [line.slice(0, index), line.slice(index + 1)];
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

async function fetchCollection() {
  const data = await gql(
    `query Collection($handle: String!) {
      collectionByHandle(handle: $handle) {
        id
        legacyResourceId
        handle
        title
        descriptionHtml
        templateSuffix
        sortOrder
        productsCount { count }
        seo { title description }
        metafields(first: 100) {
          nodes { namespace key type value }
        }
      }
    }`,
    { handle: COLLECTION_HANDLE }
  );
  if (!data.collectionByHandle) throw new Error(`Collection not found: ${COLLECTION_HANDLE}`);
  return data.collectionByHandle;
}

async function fetchProducts() {
  const products = [];
  let after = null;
  do {
    const data = await gql(
      `query Products($handle: String!, $after: String) {
        collectionByHandle(handle: $handle) {
          products(first: 50, after: $after) {
            pageInfo { hasNextPage endCursor }
            nodes {
              id
              legacyResourceId
              handle
              title
              descriptionHtml
              productType
              vendor
              status
              totalInventory
              tags
              templateSuffix
              seo { title description }
              variants(first: 50) {
                nodes {
                  id
                  legacyResourceId
                  title
                  sku
                  barcode
                  price
                  inventoryQuantity
                  selectedOptions { name value }
                }
              }
              images(first: 10) {
                nodes { id altText url }
              }
              metafields(first: 120) {
                nodes { namespace key type value }
              }
            }
          }
        }
      }`,
      { handle: COLLECTION_HANDLE, after }
    );
    const conn = data.collectionByHandle.products;
    products.push(...conn.nodes);
    after = conn.pageInfo.hasNextPage ? conn.pageInfo.endCursor : null;
  } while (after);
  return products;
}

function mf(nodes, namespace, key) {
  return nodes.find((node) => node.namespace === namespace && node.key === key)?.value || "";
}

function optionNames(product) {
  return [
    ...new Set(
      product.variants.nodes.flatMap((variant) =>
        variant.selectedOptions.map((option) => option.name)
      )
    )
  ];
}

function optionValues(product, namePattern) {
  return [
    ...new Set(
      product.variants.nodes.flatMap((variant) =>
        variant.selectedOptions
          .filter((option) => namePattern.test(option.name))
          .map((option) => option.value)
      )
    )
  ].filter(Boolean);
}

function titleMatches(product, pattern) {
  return pattern.test(`${product.title} ${product.handle} ${product.tags.join(" ")}`);
}

function sizeValues(product) {
  return optionValues(product, /size|length|height|width|diameter/i);
}

function productFacts(product) {
  return {
    id: product.id,
    legacyResourceId: product.legacyResourceId,
    handle: product.handle,
    title: product.title,
    status: product.status,
    totalInventory: product.totalInventory,
    productType: product.productType,
    templateSuffix: product.templateSuffix,
    variantCount: product.variants.nodes.length,
    optionNames: optionNames(product),
    sizeValues: sizeValues(product),
    styleValues: optionValues(product, /style/i),
    colorValues: optionValues(product, /color/i),
    skus: [...new Set(product.variants.nodes.map((variant) => variant.sku).filter(Boolean))],
    barcodeMismatchCount: product.variants.nodes.filter((variant) => variant.sku && variant.barcode !== variant.sku).length,
    imageCount: product.images.nodes.length,
    blankAltCount: product.images.nodes.filter((image) => !String(image.altText || "").trim()).length,
    googleProductCategory: mf(product.metafields.nodes, "mm-google-shopping", "google_product_category"),
    facebookProductCategory: mf(product.metafields.nodes, "mc-facebook", "google_product_category"),
    condition: mf(product.metafields.nodes, "mm-google-shopping", "condition"),
    customProduct: mf(product.metafields.nodes, "mm-google-shopping", "custom_product"),
    gender: mf(product.metafields.nodes, "mm-google-shopping", "gender"),
    ageGroup: mf(product.metafields.nodes, "mm-google-shopping", "age_group"),
    rangeType: mf(product.metafields.nodes, "custom", "range_type"),
    ornamentType: mf(product.metafields.nodes, "custom", "ornament_type"),
    placement: mf(product.metafields.nodes, "custom", "placement"),
    material: mf(product.metafields.nodes, "custom", "material"),
    compatibilityClass: mf(product.metafields.nodes, "custom", "compatibility_class"),
    compatibleDeities: mf(product.metafields.nodes, "custom", "compatible_deities"),
    componentCount: mf(product.metafields.nodes, "custom", "component_count"),
    setItemsIncluded: mf(product.metafields.nodes, "custom", "set_items_included"),
    sizeConfidence: mf(product.metafields.nodes, "custom", "size_confidence"),
    ornamentHeightIn: mf(product.metafields.nodes, "custom", "ornament_height_in"),
    ornamentWidthIn: mf(product.metafields.nodes, "custom", "ornament_width_in"),
    likelyGoddess: titleMatches(product, /lakshmi|amman|ammavaru|devi|durga|goddess|saraswati/i),
    likelyVishnu: titleMatches(product, /venkatesh|balaji|vishnu|perumal/i),
    likelyKrishna: titleMatches(product, /krishna|radha/i),
    likelyGanesh: titleMatches(product, /ganesh|ganesha|ganapati|vinayaka/i),
    likelyGeneric: titleMatches(product, /deity|god|idol|jhumki|jhumka|earring/i)
  };
}

function countsBy(products, getter) {
  const map = new Map();
  for (const product of products) {
    const value = getter(product) || "(blank)";
    map.set(value, (map.get(value) || 0) + 1);
  }
  return Object.fromEntries([...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

function csv(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function writeQuestions(summary) {
  const rows = [
    ["scope", "handle", "question", "why_needed", "suggested_default_if_confirmed"],
    [
      "collection",
      COLLECTION_HANDLE,
      "For deity earrings, what is the confirmed material for the majority/all products in this collection?",
      "Material should not be guessed. It affects product descriptions, metafields, Merchant Center attributes and FAQ.",
      "Alloy metal with stone work, only if this matches the real earrings."
    ],
    [
      "collection",
      COLLECTION_HANDLE,
      "Does each product include one pair of earrings, or can some products be single pieces/sets with other components?",
      "Component count and set_items_included must be factual.",
      "Pair of deity earrings; component_count 2, only if every product is sold as a pair."
    ],
    [
      "collection",
      COLLECTION_HANDLE,
      "Are these earrings broadly suitable for all god and goddess idols when ear placement and size match, or are some styles goddess-only/Vishnu-only?",
      "Compatibility fields and deity-first collection mapping need accurate product fit.",
      "General/Common for generic earrings; deity-specific only when title/style clearly says so."
    ],
    [
      "collection",
      COLLECTION_HANDLE,
      "How should the current size variant values be interpreted for earrings: height x width, length x width, diameter, or another measurement?",
      "The storefront and metafields need correct size language.",
      "Height x Width for earring ornament face, only if that is how product sizes are measured."
    ]
  ];

  fs.writeFileSync(OUT_CSV, rows.map((row) => row.map(csv).join(",")).join("\n"));
}

async function main() {
  const [collection, products] = await Promise.all([fetchCollection(), fetchProducts()]);
  const facts = products.map(productFacts);
  const summary = {
    collection: {
      handle: collection.handle,
      title: collection.title,
      templateSuffix: collection.templateSuffix,
      sortOrder: collection.sortOrder,
      productsCount: collection.productsCount.count,
      seo: collection.seo,
      metafields: collection.metafields.nodes
    },
    productSummary: {
      fetchedProducts: products.length,
      byStatus: countsBy(facts, (product) => product.status),
      activeInStock: facts.filter((product) => product.status === "ACTIVE" && product.totalInventory > 0).length,
      activeSoldOut: facts.filter((product) => product.status === "ACTIVE" && product.totalInventory <= 0).length,
      googleCategories: countsBy(facts, (product) => product.googleProductCategory),
      facebookCategories: countsBy(facts, (product) => product.facebookProductCategory),
      condition: countsBy(facts, (product) => product.condition),
      customProduct: countsBy(facts, (product) => product.customProduct),
      ageGroup: countsBy(facts, (product) => product.ageGroup),
      gender: countsBy(facts, (product) => product.gender),
      rangeType: countsBy(facts, (product) => product.rangeType),
      ornamentType: countsBy(facts, (product) => product.ornamentType),
      placement: countsBy(facts, (product) => product.placement),
      material: countsBy(facts, (product) => product.material),
      compatibilityClass: countsBy(facts, (product) => product.compatibilityClass),
      componentCount: countsBy(facts, (product) => product.componentCount),
      sizeConfidence: countsBy(facts, (product) => product.sizeConfidence),
      optionNameCounts: countsBy(
        facts.flatMap((product) => product.optionNames.map((optionName) => ({ optionName }))),
        (item) => item.optionName
      ),
      productsWithBarcodeMismatch: facts.filter((product) => product.barcodeMismatchCount > 0).length,
      blankImageAltProducts: facts.filter((product) => product.blankAltCount > 0).length,
      likelyGoddess: facts.filter((product) => product.likelyGoddess).length,
      likelyVishnu: facts.filter((product) => product.likelyVishnu).length,
      likelyKrishna: facts.filter((product) => product.likelyKrishna).length,
      likelyGanesh: facts.filter((product) => product.likelyGanesh).length
    },
    products: facts
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(summary, null, 2));
  writeQuestions(summary);

  console.log(`Collection: ${collection.title} (${collection.handle})`);
  console.log(`Products: ${products.length}; active=${summary.productSummary.byStatus.ACTIVE || 0}; draft=${summary.productSummary.byStatus.DRAFT || 0}`);
  console.log(`Active in stock: ${summary.productSummary.activeInStock}; active sold out: ${summary.productSummary.activeSoldOut}`);
  console.log(`Google categories: ${JSON.stringify(summary.productSummary.googleCategories)}`);
  console.log(`Material values: ${JSON.stringify(summary.productSummary.material)}`);
  console.log(`Component counts: ${JSON.stringify(summary.productSummary.componentCount)}`);
  console.log(`Option names: ${JSON.stringify(summary.productSummary.optionNameCounts)}`);
  console.log(`Barcode mismatches: ${summary.productSummary.productsWithBarcodeMismatch}`);
  console.log(`Blank alt products: ${summary.productSummary.blankImageAltProducts}`);
  console.log(`Wrote ${OUT_JSON}`);
  console.log(`Wrote ${OUT_CSV}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
