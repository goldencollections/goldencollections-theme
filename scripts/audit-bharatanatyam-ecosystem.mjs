#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "tmp", "bharatanatyam-ecosystem-audit");
const env = readEnv(path.join(root, "env"));
const shop = env.SHOPIFY_STORE_DOMAIN;
const token = env.SHOPIFY_ADMIN_TOKEN;
const apiVersion = env.SHOPIFY_API_VERSION || "2025-10";
const endpoint = `https://${shop}/admin/api/${apiVersion}/graphql.json`;

const TERMS = [
  "bharatanatyam",
  "kuchipudi",
  "dance",
  "arangetram",
  "kemp",
  "black kemp",
  "real kemp",
  "ghungroo",
  "salangai",
  "chilanka",
  "mattal",
  "matil",
  "mattel",
  "nethi",
  "chutti",
  "maang",
  "tikka",
  "oddiyanam",
  "vaddanam",
  "vanki",
  "baju",
  "jada",
  "jadai",
  "rakodi",
  "sun moon",
  "surya",
  "chandra",
  "nath",
  "nose pin"
];

const CONFIRMED_DANCE_COLLECTION_HANDLES = [
  "bharatanatyam-bangles",
  "bharatanatyam-dance-accessories-flower-hair-head-set-maang-tikka-mattal-makeup",
  "bharatanatyam-dance-necklace-long-and-short",
  "bharatanatyam-earrings-collection",
  "bharatanatyam-flowers",
  "bharatanatyam-ghungroo",
  "bharatanatyam-hair-accessories",
  "bharatanatyam-hair-buns-dance-donuts-full-half-rings",
  "bharatanatyam-hair-crowns",
  "bharatanatyam-headset-jewelry",
  "bharatanatyam-jada-jadai-kunjalam-sets",
  "bharatanatyam-jewellery",
  "bharatanatyam-jewellery-sets",
  "bharatanatyam-long-necklace",
  "bharatanatyam-maang-tikka-matil",
  "bharatanatyam-makeup-hair-essentials",
  "bharatanatyam-nose-pin",
  "bharatanatyam-nose-pin-collection",
  "bharatanatyam-practice-sarees",
  "bharatanatyam-rakodi",
  "bharatanatyam-short-necklaces",
  "bharatanatyam-sun-moon",
  "bharatanatyam-vanki-baju-band",
  "bharatanatyam-waist-belts",
  "bharatnatyam-dance-jewellery-kids-collection",
  "black-kemp-bharatanatyam-accessories",
  "black-kemp-vaddanam-temple-jewellery-oddiyanam",
  "drama-dance-crowns",
  "kemp-accessories",
  "kemp-bharatanatyam-jewellery-dance-sets",
  "kemp-black-bharatanatyam-kuchipudi-dance-jewellery-set",
  "kemp-black-earrings-jhumki-jhumka",
  "kemp-black-jewellery",
  "kemp-black-long-haram",
  "kemp-black-mattal",
  "kemp-black-nethi-chutti-maang-tikka",
  "kemp-black-short-necklace",
  "kemp-earrings",
  "kemp-headset",
  "kemp-jewellery",
  "kemp-long-necklace",
  "kemp-mang-tikka",
  "kemp-mattal",
  "kemp-mattal-ear-chains",
  "kemp-short-haram",
  "kemp-vaddanam-waistbelt",
  "mattal-matil-bharatanatyam-dance",
  "nattuvangam-thattu-kazhi-bharatanatyam-chembu-and-dance-plate",
  "premium-black-kemp-headsets-nethichutti"
];

const DANCE_METAFIELDS = [
  "dance_form_suitable",
  "dance_range",
  "product_tier",
  "dance_product_role",
  "performance_context",
  "buyer_context",
  "placement",
  "fit_notes",
  "size_notes",
  "measurement_confidence",
  "component_count",
  "matching_finish",
  "stone_color",
  "material",
  "finish",
  "care_instructions",
  "quality_checks"
];

const MERCHANT_FIELDS = [
  ["mm-google-shopping", "google_product_category"],
  ["mm-google-shopping", "condition"],
  ["mm-google-shopping", "custom_product"],
  ["mm-google-shopping", "age_group"],
  ["mm-google-shopping", "gender"],
  ["mm-google-shopping", "color"],
  ["mm-google-shopping", "material"],
  ["mm-google-shopping", "size"],
  ["mc-facebook", "google_product_category"]
];

const CUSTOM_FIELDS = [
  "brand",
  "country_of_origin",
  "hsn_code",
  "product_details",
  "product_faqs",
  "key_features",
  "ai_product_intelligence"
];

if (!shop || !token) throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
fs.mkdirSync(outDir, { recursive: true });

const [collections, products] = await Promise.all([fetchCollections(), fetchProducts()]);
const confirmedDanceCollectionHandles = new Set(CONFIRMED_DANCE_COLLECTION_HANDLES);
const danceCollections = collections
  .filter((collection) => confirmedDanceCollectionHandles.has(collection.handle))
  .sort((a, b) => a.handle.localeCompare(b.handle));
const danceCollectionHandles = new Set(danceCollections.map((collection) => collection.handle));
const danceProducts = products
  .filter((product) => isDanceProduct(product, danceCollectionHandles))
  .map(scoreProduct)
  .sort((a, b) => a.handle.localeCompare(b.handle));

const collectionRows = danceCollections.map(scoreCollection);
const productSummary = summarizeProducts(danceProducts);
const collectionSummary = summarizeCollections(collectionRows);
const familySummary = summarizeByFamily(danceProducts);

const report = {
  generatedAt: new Date().toISOString(),
  shop,
  terms: TERMS,
  summary: {
    collections: collectionSummary,
    products: productSummary,
    families: familySummary
  },
  collections: collectionRows,
  products: danceProducts
};

fs.writeFileSync(path.join(outDir, "bharatanatyam-ecosystem-audit.json"), `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(path.join(outDir, "bharatanatyam-products.csv"), toCsv(danceProducts.map(productCsvRow)));
fs.writeFileSync(path.join(outDir, "bharatanatyam-collections.csv"), toCsv(collectionRows.map(collectionCsvRow)));
fs.writeFileSync(path.join(outDir, "bharatanatyam-ecosystem-audit.md"), renderMarkdown(report));

console.log(`Collections: ${collectionRows.length}`);
console.log(`Products: ${danceProducts.length}`);
console.log(`Active products: ${productSummary.active}`);
console.log(`Products with no images: ${productSummary.noImages}`);
console.log(`Products with full dance core fields: ${productSummary.fullDanceCore}`);
console.log(`Products missing Merchant essentials: ${productSummary.missingMerchantEssentials}`);
console.log(`Wrote ${path.relative(root, path.join(outDir, "bharatanatyam-ecosystem-audit.md"))}`);

async function fetchCollections() {
  const collections = [];
  let after = null;
  do {
    const data = await gql(
      `query Collections($after: String) {
        collections(first: 100, after: $after) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            handle
            title
            descriptionHtml
            updatedAt
            seo { title description }
            productsCount { count }
            metafields(first: 80) { nodes { namespace key type value } }
          }
        }
      }`,
      { after }
    );
    collections.push(...data.collections.nodes);
    after = data.collections.pageInfo.hasNextPage ? data.collections.pageInfo.endCursor : null;
  } while (after);
  return collections;
}

async function fetchProducts() {
  const products = [];
  let after = null;
  do {
    const data = await gql(
      `query Products($after: String) {
        products(first: 100, after: $after) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            legacyResourceId
            title
            handle
            status
            productType
            vendor
            tags
            totalInventory
            tracksInventory
            onlineStoreUrl
            templateSuffix
            publishedAt
            createdAt
            updatedAt
            category { id name fullName }
            seo { title description }
            collections(first: 30) { nodes { handle title } }
            options { name values }
            variants(first: 20) {
              nodes {
                id
                legacyResourceId
                sku
                barcode
                availableForSale
                inventoryQuantity
                price
                compareAtPrice
                taxable
                selectedOptions { name value }
              }
            }
            images(first: 10) { nodes { id url altText width height } }
            metafields(first: 120) { nodes { namespace key type value } }
          }
        }
      }`,
      { after }
    );
    products.push(...data.products.nodes);
    after = data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor : null;
  } while (after);
  return products;
}

function isDanceCollection(collection) {
  const text = normalize(`${collection.handle} ${collection.title} ${stripHtml(collection.descriptionHtml)} ${metaValues(collection)}`);
  return TERMS.some((term) => text.includes(term));
}

function isDanceProduct(product, collectionHandles) {
  const collectionHit = product.collections.nodes.some((collection) => collectionHandles.has(collection.handle));
  const hasDanceMetafields = product.metafields.nodes.some((metafield) => metafield.namespace === "dance");
  const text = normalize(
    `${product.title} ${product.handle} ${product.productType} ${product.tags.join(" ")} ${product.collections.nodes
      .map((collection) => `${collection.handle} ${collection.title}`)
      .join(" ")} ${metaValues(product)}`
  );
  return (
    collectionHit ||
    hasDanceMetafields ||
    /\b(bharatanatyam|bharatnatyam|kuchipudi|arangetram|black kemp|real kemp|ghungroo|salangai|chilanka)\b/.test(text)
  );
}

function scoreCollection(collection) {
  const metafields = fieldMap(collection.metafields.nodes);
  const descriptionText = stripHtml(collection.descriptionHtml);
  const seoTitle = collection.seo?.title || "";
  const seoDescription = collection.seo?.description || "";
  return {
    id: collection.id,
    handle: collection.handle,
    title: collection.title,
    productCount: collection.productsCount?.count || 0,
    hasDescription: descriptionText.length > 80,
    descriptionLength: descriptionText.length,
    hasSeoTitle: Boolean(seoTitle),
    seoTitleLength: seoTitle.length,
    hasSeoDescription: Boolean(seoDescription),
    seoDescriptionLength: seoDescription.length,
    metafieldCount: collection.metafields.nodes.length,
    hasDisplayTitle: metafields.has("custom.display_title"),
    hasCollectionIntro: metafields.has("custom.collection_intro"),
    hasSizeFitIntro: metafields.has("custom.size_fit_intro"),
    hasRegionalKeywords: metafields.has("custom.regional_keyword_cluster"),
    hasFaqFamily: metafields.has("custom.faq_family"),
    updatedAt: collection.updatedAt
  };
}

function scoreProduct(product) {
  const metafields = fieldMap(product.metafields.nodes);
  const collections = product.collections.nodes.map((collection) => collection.handle);
  const images = product.images.nodes;
  const altTexts = images.map((image) => image.altText || "");
  const uniqueAltTexts = new Set(altTexts.filter(Boolean));
  const seoTitle = product.seo?.title || "";
  const seoDescription = product.seo?.description || "";
  const danceFields = DANCE_METAFIELDS.filter((key) => metafields.has(`dance.${key}`));
  const missingDanceFields = DANCE_METAFIELDS.filter((key) => !metafields.has(`dance.${key}`));
  const merchantFields = MERCHANT_FIELDS.filter(([ns, key]) => metafields.has(`${ns}.${key}`)).map(([ns, key]) => `${ns}.${key}`);
  const missingMerchantFields = MERCHANT_FIELDS.filter(([ns, key]) => !metafields.has(`${ns}.${key}`)).map(
    ([ns, key]) => `${ns}.${key}`
  );
  const customFields = CUSTOM_FIELDS.filter((key) => metafields.has(`custom.${key}`));
  const roles = parseList(metafields.get("dance.dance_product_role")?.value);
  const range = metafields.get("dance.dance_range")?.value || "";
  const family = inferFamily(product, collections, roles, range);
  const availableVariants = product.variants.nodes.filter((variant) => variant.availableForSale);
  const unavailableFirstVariant = product.variants.nodes.length && !product.variants.nodes[0].availableForSale;
  const skuValues = product.variants.nodes.map((variant) => variant.sku).filter(Boolean);

  return {
    id: product.id,
    legacyResourceId: product.legacyResourceId,
    title: product.title,
    handle: product.handle,
    status: product.status,
    productType: product.productType,
    family,
    vendor: product.vendor,
    collections,
    tags: product.tags,
    totalInventory: product.totalInventory,
    active: product.status === "ACTIVE",
    onlineStoreUrl: product.onlineStoreUrl || "",
    templateSuffix: product.templateSuffix || "",
    category: product.category?.fullName || "",
    seoTitle,
    seoTitleLength: seoTitle.length,
    seoDescription,
    seoDescriptionLength: seoDescription.length,
    imageCount: images.length,
    missingImages: images.length === 0,
    uniqueAltTextCount: uniqueAltTexts.size,
    hasDuplicateAltText: images.length > 1 && uniqueAltTexts.size <= 1,
    blankAltTextCount: altTexts.filter((alt) => !alt).length,
    hasMeasurementAlt: altTexts.some((alt) => /measure|measurement|ruler|scale|size|inch|cm|height|width|length|drop/i.test(alt)),
    variantCount: product.variants.nodes.length,
    skuValues,
    availableVariantCount: availableVariants.length,
    unavailableFirstVariant,
    firstVariantSku: product.variants.nodes[0]?.sku || "",
    firstVariantAvailable: product.variants.nodes[0]?.availableForSale ?? null,
    firstVariantTaxable: product.variants.nodes[0]?.taxable ?? null,
    priceMin: min(product.variants.nodes.map((variant) => Number(variant.price)).filter((value) => Number.isFinite(value))),
    priceMax: max(product.variants.nodes.map((variant) => Number(variant.price)).filter((value) => Number.isFinite(value))),
    danceFieldCount: danceFields.length,
    danceFields,
    missingDanceFields,
    hasDanceCore: ["dance_form_suitable", "dance_range", "dance_product_role", "performance_context", "buyer_context", "placement", "fit_notes", "size_notes", "material", "care_instructions", "quality_checks"].every((key) =>
      metafields.has(`dance.${key}`)
    ),
    measurementConfidence: metafields.get("dance.measurement_confidence")?.value || "",
    merchantFieldCount: merchantFields.length,
    merchantFields,
    missingMerchantFields,
    customFieldCount: customFields.length,
    customFields,
    lacksCustomTrustPack: CUSTOM_FIELDS.some((key) => !metafields.has(`custom.${key}`)),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  };
}

function summarizeProducts(products) {
  return {
    total: products.length,
    active: products.filter((product) => product.active).length,
    draftOrArchived: products.filter((product) => !product.active).length,
    noImages: products.filter((product) => product.missingImages).length,
    duplicateAltText: products.filter((product) => product.hasDuplicateAltText).length,
    blankAltText: products.filter((product) => product.blankAltTextCount > 0).length,
    measurementAlt: products.filter((product) => product.hasMeasurementAlt).length,
    fullDanceCore: products.filter((product) => product.hasDanceCore).length,
    missingMerchantEssentials: products.filter((product) => {
      const missing = new Set(product.missingMerchantFields);
      return ["mm-google-shopping.google_product_category", "mm-google-shopping.condition", "mm-google-shopping.custom_product"].some((field) =>
        missing.has(field)
      );
    }).length,
    unavailableFirstVariant: products.filter((product) => product.unavailableFirstVariant).length,
    customTrustPackComplete: products.filter((product) => !product.lacksCustomTrustPack).length
  };
}

function summarizeCollections(collections) {
  return {
    total: collections.length,
    withDescription: collections.filter((collection) => collection.hasDescription).length,
    withSeoTitle: collections.filter((collection) => collection.hasSeoTitle).length,
    withSeoDescription: collections.filter((collection) => collection.hasSeoDescription).length,
    withCollectionIntro: collections.filter((collection) => collection.hasCollectionIntro).length,
    withSizeFitIntro: collections.filter((collection) => collection.hasSizeFitIntro).length,
    withRegionalKeywords: collections.filter((collection) => collection.hasRegionalKeywords).length,
    withFaqFamily: collections.filter((collection) => collection.hasFaqFamily).length
  };
}

function summarizeByFamily(products) {
  const grouped = new Map();
  for (const product of products) {
    const row = grouped.get(product.family) || {
      family: product.family,
      total: 0,
      active: 0,
      noImages: 0,
      fullDanceCore: 0,
      missingMerchantEssentials: 0,
      duplicateAltText: 0,
      measurementAlt: 0
    };
    row.total += 1;
    if (product.active) row.active += 1;
    if (product.missingImages) row.noImages += 1;
    if (product.hasDanceCore) row.fullDanceCore += 1;
    if (["mm-google-shopping.google_product_category", "mm-google-shopping.condition", "mm-google-shopping.custom_product"].some((field) => product.missingMerchantFields.includes(field))) {
      row.missingMerchantEssentials += 1;
    }
    if (product.hasDuplicateAltText) row.duplicateAltText += 1;
    if (product.hasMeasurementAlt) row.measurementAlt += 1;
    grouped.set(product.family, row);
  }
  return [...grouped.values()].sort((a, b) => b.total - a.total || a.family.localeCompare(b.family));
}

function inferFamily(product, collections, roles, range) {
  const text = normalize(`${product.title} ${product.handle} ${product.productType} ${collections.join(" ")} ${roles.join(" ")} ${range}`);
  if (text.includes("real kemp")) return "real kemp";
  if (text.includes("black kemp") || text.includes("kemp-black")) return "black kemp";
  if (text.includes("kids")) return "kids dance";
  if (text.includes("set")) return "sets";
  if (text.includes("ghungroo") || text.includes("salangai") || text.includes("chilanka")) return "ghungroo/salangai";
  if (text.includes("short necklace")) return "short necklaces";
  if (text.includes("long") || text.includes("haram")) return "long harams";
  if (text.includes("mattal") || text.includes("matil") || text.includes("mattel")) return "mattal";
  if (text.includes("headset") || text.includes("nethi") || text.includes("maang") || text.includes("tikka")) return "headset/nethi chutti";
  if (text.includes("earring") || text.includes("jhum")) return "earrings";
  if (text.includes("waist") || text.includes("vaddanam") || text.includes("oddiyanam")) return "waist belts";
  if (text.includes("jada") || text.includes("rakodi") || text.includes("hair") || text.includes("sun") || text.includes("moon")) return "hair accessories";
  if (text.includes("vanki") || text.includes("baju")) return "vanki/baju band";
  if (text.includes("makeup") || text.includes("cosmetic") || text.includes("alta") || text.includes("instrument") || text.includes("nattuvangam")) return "cosmetics/instruments";
  return "other dance";
}

function productCsvRow(product) {
  return {
    handle: product.handle,
    title: product.title,
    status: product.status,
    family: product.family,
    productType: product.productType,
    category: product.category,
    collections: product.collections.join("|"),
    totalInventory: product.totalInventory,
    imageCount: product.imageCount,
    duplicateAltText: product.hasDuplicateAltText,
    blankAltTextCount: product.blankAltTextCount,
    hasMeasurementAlt: product.hasMeasurementAlt,
    seoTitleLength: product.seoTitleLength,
    seoDescriptionLength: product.seoDescriptionLength,
    danceFieldCount: product.danceFieldCount,
    hasDanceCore: product.hasDanceCore,
    merchantFieldCount: product.merchantFieldCount,
    missingMerchantFields: product.missingMerchantFields.join("|"),
    customFieldCount: product.customFieldCount,
    lacksCustomTrustPack: product.lacksCustomTrustPack,
    unavailableFirstVariant: product.unavailableFirstVariant,
    firstVariantSku: product.firstVariantSku,
    onlineStoreUrl: product.onlineStoreUrl
  };
}

function collectionCsvRow(collection) {
  return {
    handle: collection.handle,
    title: collection.title,
    productCount: collection.productCount,
    hasDescription: collection.hasDescription,
    descriptionLength: collection.descriptionLength,
    seoTitleLength: collection.seoTitleLength,
    seoDescriptionLength: collection.seoDescriptionLength,
    metafieldCount: collection.metafieldCount,
    hasCollectionIntro: collection.hasCollectionIntro,
    hasSizeFitIntro: collection.hasSizeFitIntro,
    hasRegionalKeywords: collection.hasRegionalKeywords,
    hasFaqFamily: collection.hasFaqFamily
  };
}

function renderMarkdown(report) {
  const lines = [
    "# Bharatanatyam Ecosystem Audit Data",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Summary",
    "",
    `Collections matched: ${report.summary.collections.total}`,
    `Products matched: ${report.summary.products.total}`,
    `Active products: ${report.summary.products.active}`,
    `Products with no images: ${report.summary.products.noImages}`,
    `Products with duplicate image alt text: ${report.summary.products.duplicateAltText}`,
    `Products with measurement/scale alt signal: ${report.summary.products.measurementAlt}`,
    `Products with full dance core fields: ${report.summary.products.fullDanceCore}`,
    `Products missing Merchant essentials: ${report.summary.products.missingMerchantEssentials}`,
    `Products with unavailable first/default variant: ${report.summary.products.unavailableFirstVariant}`,
    `Products with complete custom trust pack: ${report.summary.products.customTrustPackComplete}`,
    "",
    "## Product Families",
    "",
    "| Family | Total | Active | No images | Full dance core | Missing Merchant essentials | Duplicate alt | Measurement alt |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |"
  ];
  for (const family of report.summary.families) {
    lines.push(
      `| ${md(family.family)} | ${family.total} | ${family.active} | ${family.noImages} | ${family.fullDanceCore} | ${family.missingMerchantEssentials} | ${family.duplicateAltText} | ${family.measurementAlt} |`
    );
  }
  lines.push("", "## Collections With Weak Structured Signals", "");
  lines.push("| Handle | Products | Description | Intro | Size/Fit | Regional | FAQ |");
  lines.push("| --- | ---: | --- | --- | --- | --- | --- |");
  for (const collection of report.collections.filter((item) => !item.hasCollectionIntro || !item.hasSizeFitIntro || !item.hasRegionalKeywords || !item.hasFaqFamily).slice(0, 60)) {
    lines.push(
      `| ${md(collection.handle)} | ${collection.productCount} | ${yes(collection.hasDescription)} | ${yes(collection.hasCollectionIntro)} | ${yes(collection.hasSizeFitIntro)} | ${yes(collection.hasRegionalKeywords)} | ${yes(collection.hasFaqFamily)} |`
    );
  }
  lines.push("", "## Highest-Risk Product Rows", "");
  lines.push("| Handle | Status | Family | Images | Alt issue | Dance fields | Merchant missing | Custom trust |");
  lines.push("| --- | --- | --- | ---: | --- | ---: | --- | --- |");
  for (const product of report.products
    .filter((item) => item.missingImages || item.hasDuplicateAltText || !item.hasDanceCore || item.missingMerchantFields.length || item.lacksCustomTrustPack)
    .slice(0, 100)) {
    lines.push(
      `| ${md(product.handle)} | ${product.status} | ${md(product.family)} | ${product.imageCount} | ${product.missingImages ? "no images" : product.hasDuplicateAltText ? "duplicate alt" : ""} | ${product.danceFieldCount} | ${md(product.missingMerchantFields.slice(0, 4).join(", "))} | ${product.lacksCustomTrustPack ? "missing" : "ok"} |`
    );
  }
  return `${lines.join("\n")}\n`;
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
    throw new Error(`GraphQL HTTP ${response.status}: ${text.slice(0, 1600)}`);
  }
  await waitForThrottle(json.extensions?.cost?.throttleStatus);
  return json.data;
}

async function waitForThrottle(status) {
  if (!status) return;
  const { currentlyAvailable, restoreRate } = status;
  if (currentlyAvailable == null || restoreRate == null || currentlyAvailable >= 250) return;
  const waitMs = Math.ceil(((250 - currentlyAvailable) / restoreRate) * 1000);
  await new Promise((resolve) => setTimeout(resolve, Math.min(Math.max(waitMs, 500), 5000)));
}

function fieldMap(nodes) {
  return new Map(nodes.map((node) => [`${node.namespace}.${node.key}`, node]));
}

function metaValues(owner) {
  return (owner.metafields?.nodes || []).map((node) => node.value).join(" ");
}

function parseList(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [String(parsed)];
  } catch {
    return [String(value)];
  }
}

function stripHtml(value) {
  return String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function normalize(value) {
  return stripHtml(value).toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
}

function min(values) {
  return values.length ? Math.min(...values) : null;
}

function max(values) {
  return values.length ? Math.max(...values) : null;
}

function yes(value) {
  return value ? "yes" : "no";
}

function md(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function toCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return `${headers.join(",")}\n${rows.map((row) => headers.map((header) => csv(row[header])).join(",")).join("\n")}\n`;
}

function csv(value) {
  const text = Array.isArray(value) ? value.join("|") : String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
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
