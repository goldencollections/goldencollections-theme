#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const OUT_DIR = path.join(root, "tmp", "deity-short-necklace-ucp-sprint");
const env = readEnv(path.join(root, "env"));
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const GRAPHQL_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;
const BUSINESS = "https://www.goldencollections.com";
const NPX = process.platform === "win32" ? "npx.cmd" : "npx";

const UCP_ONLY = process.argv.includes("--ucp-only");
const TRIAGE_ONLY = process.argv.includes("--triage-only");
const NO_UCP = process.argv.includes("--no-ucp");
const COLLECTION_LIMIT = Number(argValue("--collection-limit") || 8);
const PRODUCT_LIMIT_PER_COLLECTION = Number(argValue("--product-limit") || 250);

const PROMPTS = [
  "deity short necklace for idol",
  "short haram for god idol",
  "goddess short necklace with size",
  "Balaji short necklace for idol"
];

const SEED_COLLECTION_HANDLES = [
  "deity-short-harams",
  "deity-necklace"
];

const MEASUREMENT_RE =
  /\b(measure|measurement|measurements|ruler|scale|size|sizing|inch|inches|in\.|cm|centimeter|centimetre|height|width|length|dimension|dimensions|drop|neck|chest|l\s*x\s*w|length\s*x\s*width)\b/i;
const DIMENSION_VALUE_RE = /\b\d+(?:\.\d+)?\s*(?:x|by|inch|inches|in\.|cm|")\b/i;
const TARGET_RE = /\b(short[-\s]*(?:haram|necklace)|chest[-\s]*necklace|deity[-\s]*necklace|god(?:dess)?[-\s]*necklace|idol[-\s]*necklace|dsn\s*-?\s*\d+)\b/i;
const STRONG_TARGET_RE = /\b(short[-\s]*(?:haram|necklace)|chest[-\s]*necklace|dsn\s*-?\s*\d+)\b/i;
const WRONG_TARGET_RE =
  /\b(crown|mukut|kireedam|kireetam|earring|jhumki|vaddanam|waist|hands|legs|hastham|padam|nose|arch|prabhavali|long[-\s]*(?:haram|necklace)|vagamalai|thomala|bhujalu)\b/i;
const DANCE_OR_KEMP_RE = /\b(bharatanatyam|kuchipudi|dance|arangetram|black[-\s]*kemp|real[-\s]*kemp|kemp[-\s]*(?:short|long|necklace|haram))\b/i;

if (!SHOP || !TOKEN) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const baseline = TRIAGE_ONLY || NO_UCP ? readExistingBaseline() : runUcpBaseline();
if (UCP_ONLY) {
  writeReport(baseline, readExistingTriage(), readJson("collection-discovery.json", []));
  console.log(`Wrote UCP baseline to ${path.relative(root, OUT_DIR)}`);
} else {
  const discovery = await discoverCollections();
  const triage = await runTriage(baseline, discovery);
  writeReport(baseline, triage, discovery);
  console.log(`Wrote deity short necklace sprint outputs to ${path.relative(root, OUT_DIR)}`);
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

function argValue(flag) {
  const exact = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  if (exact) return exact.slice(flag.length + 1);
  const index = process.argv.indexOf(flag);
  return index === -1 ? "" : process.argv[index + 1] || "";
}

function readJson(fileName, fallback) {
  const filePath = path.join(OUT_DIR, fileName);
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readExistingBaseline() {
  return readJson("ucp-baseline.json", []);
}

function readExistingTriage() {
  return readJson("short-necklace-triage.json", { products: [], summary: {} });
}

function runUcpBaseline() {
  const baseline = PROMPTS.map((prompt) => {
    console.log(`UCP search: ${prompt}`);
    const output = execFileSync(
      NPX,
      [
        "@shopify/ucp-cli",
        "catalog",
        "search",
        "--business",
        BUSINESS,
        "--set",
        `/query=${JSON.stringify(prompt)}`,
        "--set",
        `/context/intent=${JSON.stringify(prompt)}`,
        "--set",
        "/context/address_country=IN",
        "--set",
        "/context/currency=INR",
        "--view",
        ":compact",
        "--format",
        "json",
        "--token-limit",
        "6000"
      ],
      { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], shell: process.platform === "win32" }
    );
    const parsed = JSON.parse(output);
    const results = (parsed.result || []).map((result, index) => ({
      rank: index + 1,
      title: result.title || "",
      variant: result.variant || "",
      price: result.price ?? null,
      currency: result.currency || "",
      isTarget: isShortNecklaceTitle(result.title || ""),
      isWrongType: isWrongShortNecklaceResult(result.title || "")
    }));
    return {
      prompt,
      generatedAt: new Date().toISOString(),
      topCount: results.length,
      top3Correct: results.slice(0, 3).filter((result) => result.isTarget && !result.isWrongType).length,
      top10Correct: results.filter((result) => result.isTarget && !result.isWrongType).length,
      wrongTop10: results.filter((result) => result.isWrongType),
      results
    };
  });
  fs.writeFileSync(path.join(OUT_DIR, "ucp-baseline.json"), `${JSON.stringify(baseline, null, 2)}\n`);
  return baseline;
}

function isShortNecklaceTitle(title) {
  const text = normalizeText(title);
  return STRONG_TARGET_RE.test(text) || (/\bdeity\b/.test(text) && /\bnecklace\b/.test(text) && !/\blong\b/.test(text));
}

function isWrongShortNecklaceResult(title) {
  const text = normalizeText(title);
  if (!isShortNecklaceTitle(text)) return true;
  return WRONG_TARGET_RE.test(text) || DANCE_OR_KEMP_RE.test(text);
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
  const text = await response.text();
  const json = text ? JSON.parse(text) : null;
  if (!response.ok || json?.errors) {
    throw new Error(`GraphQL HTTP ${response.status}: ${text.slice(0, 1200)}`);
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

async function discoverCollections() {
  const localHandles = discoverLocalCollectionHandles();
  const seededHandles = new Set([...SEED_COLLECTION_HANDLES, ...localHandles]);
  const liveCollections = await fetchAllCollections();
  const byHandle = new Map(liveCollections.map((collection) => [collection.handle, collection]));

  const scored = liveCollections
    .map((collection) => ({ ...collection, discoveryScore: collectionScore(collection, seededHandles) }))
    .filter((collection) => collection.discoveryScore >= 10)
    .sort((a, b) => b.discoveryScore - a.discoveryScore || a.handle.localeCompare(b.handle));

  const seededLive = [...seededHandles]
    .map((handle) => byHandle.get(handle))
    .filter(Boolean)
    .map((collection) => ({
      ...collection,
      discoveryScore: Math.max(collectionScore(collection, seededHandles), collection.handle === "deity-short-harams" ? 100 : 1)
    }));

  const merged = new Map();
  for (const collection of [...seededLive, ...scored]) {
    const previous = merged.get(collection.handle);
    if (!previous || collection.discoveryScore > previous.discoveryScore) merged.set(collection.handle, collection);
  }

  const discovery = [...merged.values()]
    .sort((a, b) => b.discoveryScore - a.discoveryScore || a.handle.localeCompare(b.handle))
    .slice(0, COLLECTION_LIMIT)
    .map((collection) => ({
      id: collection.id,
      handle: collection.handle,
      title: collection.title,
      productsCount: collection.productsCount?.count ?? collection.productsCount ?? null,
      discoveryScore: collection.discoveryScore,
      localSeed: seededHandles.has(collection.handle),
      matchedSignals: collectionSignals(collection)
    }));

  fs.writeFileSync(path.join(OUT_DIR, "collection-discovery.json"), `${JSON.stringify(discovery, null, 2)}\n`);
  return discovery;
}

function discoverLocalCollectionHandles() {
  const handles = new Set();
  const files = [
    "scripts/create-golden-upload-folders.ps1",
    "scripts/update-deity-necklace-collection-content.mjs",
    "scripts/apply-deity-short-harams-optimization.mjs",
    "sections/feelori-mega-menu.liquid",
    "snippets/feelori-mega-menu.liquid"
  ];
  for (const relativeFile of files) {
    const filePath = path.join(root, relativeFile);
    if (!fs.existsSync(filePath)) continue;
    const text = fs.readFileSync(filePath, "utf8");
    for (const match of text.matchAll(/\/collections\/([a-z0-9-]+)/gi)) handles.add(match[1]);
    for (const match of text.matchAll(/\b([a-z0-9]+(?:-[a-z0-9]+){1,})\b/g)) {
      const handle = match[1];
      if (/deity-short/.test(handle) || handle === "deity-necklace") handles.add(handle);
    }
  }
  return [...handles];
}

async function fetchAllCollections() {
  const collections = [];
  let after = null;
  do {
    const data = await gql(
      `query Collections($after: String) {
        collections(first: 100, after: $after, sortKey: TITLE) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            handle
            title
            productsCount { count }
            metafields(first: 50, namespace: "custom") {
              nodes { key type value }
            }
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

function collectionScore(collection, seededHandles) {
  const text = collectionText(collection);
  let score = 0;
  if (collection.handle === "deity-short-harams") score += 100;
  if (seededHandles.has(collection.handle)) score += 10;
  if (/\bdeity\b/.test(text)) score += 2;
  if (/\bshort[-\s]*(haram|necklace|necklaces|harams)\b/.test(text)) score += 8;
  if (/\bnecklace\b/.test(text) && /\bdeity\b/.test(text)) score += 4;
  if (/\b(chest necklace|god necklace|goddess necklace|idol necklace)\b/.test(text)) score += 4;
  if (collection.handle === "deity-necklace") score += 3;
  if (collection.handle !== "deity-necklace" && /\blong[-\s]*(haram|necklace|necklaces|harams)\b/.test(text)) score -= 10;
  if (DANCE_OR_KEMP_RE.test(text)) score -= 20;
  return score;
}

function collectionSignals(collection) {
  const text = collectionText(collection);
  return [
    collection.handle === "deity-short-harams" ? "exact deity-short-harams handle" : "",
    /\bdeity\b/.test(text) ? "deity signal" : "",
    /\bshort[-\s]*(haram|necklace|necklaces|harams)\b/.test(text) ? "short necklace/haram signal" : "",
    /\b(chest necklace|god necklace|goddess necklace|idol necklace)\b/.test(text) ? "idol necklace phrase" : "",
    collection.handle === "deity-necklace" ? "parent deity necklace collection" : ""
  ].filter(Boolean);
}

function collectionText(collection) {
  const metafieldText = (collection.metafields?.nodes || []).map((metafield) => metafield.value).join(" ");
  return normalizeText(`${collection.handle} ${collection.title} ${metafieldText}`);
}

async function runTriage(baseline, discovery) {
  const ucpVariantIds = new Set(baseline.flatMap((entry) => entry.results.map((result) => result.variant).filter(Boolean)));
  const productsById = new Map();

  for (const collection of discovery) {
    const products = await fetchCollectionProducts(collection.handle);
    for (const product of products) {
      upsertProduct(productsById, product, collection.handle);
    }
  }

  const ucpProducts = await fetchProductsForUcpVariants([...ucpVariantIds]);
  for (const product of ucpProducts) {
    upsertProduct(productsById, product, "__ucp_result__");
  }

  const products = [...productsById.values()]
    .filter(isLikelyTargetProduct)
    .map((product) => classifyProduct(product, ucpVariantIds))
    .sort((a, b) => treatmentRank(a.treatment) - treatmentRank(b.treatment) || b.totalInventory - a.totalInventory || a.title.localeCompare(b.title));

  const visualReviewImages = products
    .filter((product) => ["Tier 2", "Tier 1", "Tier 0"].includes(product.proofTier) || product.ucpTopResult)
    .flatMap((product) =>
      product.images
        .filter((image) => image.position >= 2 && image.position <= 4)
        .map((image) => ({
          productId: product.id,
          legacyResourceId: product.legacyResourceId,
          handle: product.handle,
          title: product.title,
          sku: product.sku,
          proofTier: product.proofTier,
          ucpTopResult: product.ucpTopResult,
          imageId: image.id,
          imageLegacyId: numericId(image.id),
          position: image.position,
          altText: image.altText,
          filename: image.filename,
          url: image.url,
          proposedAlt: proposedMeasurementAlt(product, image)
        }))
    );

  const triage = {
    generatedAt: new Date().toISOString(),
    collections: discovery.map((collection) => collection.handle),
    productLimitPerCollection: PRODUCT_LIMIT_PER_COLLECTION,
    summary: summarizeProducts(products),
    products,
    visualReviewImages
  };

  fs.writeFileSync(path.join(OUT_DIR, "short-necklace-triage.json"), `${JSON.stringify(triage, null, 2)}\n`);
  fs.writeFileSync(path.join(OUT_DIR, "short-necklace-visual-review.json"), `${JSON.stringify(visualReviewImages, null, 2)}\n`);
  fs.writeFileSync(path.join(OUT_DIR, "short-necklace-triage.csv"), toCsv(products.map(productCsvRow)));
  fs.writeFileSync(path.join(OUT_DIR, "short-necklace-visual-review.csv"), toCsv(visualReviewImages));
  return triage;
}

function upsertProduct(productsById, product, collectionHandle) {
  const existing = productsById.get(product.id);
  const handles = new Set([...(existing?.collectionHandles || []), ...(product.collectionHandles || []), collectionHandle].filter(Boolean));
  productsById.set(product.id, { ...(existing || product), ...product, collectionHandles: [...handles] });
}

async function fetchCollectionProducts(handle) {
  const products = [];
  let after = null;
  do {
    const remaining = PRODUCT_LIMIT_PER_COLLECTION ? PRODUCT_LIMIT_PER_COLLECTION - products.length : 50;
    const first = PRODUCT_LIMIT_PER_COLLECTION ? Math.min(50, remaining) : 50;
    if (first <= 0) break;
    const data = await gql(productConnectionQuery("CollectionProducts"), { handle, after, first });
    if (!data.collectionByHandle) {
      console.warn(`Collection missing: ${handle}`);
      return [];
    }
    const connection = data.collectionByHandle.products;
    products.push(...connection.nodes);
    after = connection.pageInfo.hasNextPage ? connection.pageInfo.endCursor : null;
  } while (after && (!PRODUCT_LIMIT_PER_COLLECTION || products.length < PRODUCT_LIMIT_PER_COLLECTION));
  return products;
}

function productConnectionQuery(operationName) {
  return `query ${operationName}($handle: String!, $after: String, $first: Int!) {
    collectionByHandle(handle: $handle) {
      products(first: $first, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes {
          ${productFields()}
        }
      }
    }
  }`;
}

async function fetchProductsForUcpVariants(variantIds) {
  const ids = variantIds.filter((id) => /^gid:\/\/shopify\/ProductVariant\//.test(id));
  if (!ids.length) return [];
  const products = [];
  for (let i = 0; i < ids.length; i += 25) {
    const data = await gql(
      `query UcpVariantProducts($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on ProductVariant {
            id
            product {
              ${productFields()}
            }
          }
        }
      }`,
      { ids: ids.slice(i, i + 25) }
    );
    products.push(...data.nodes.map((node) => node?.product).filter(Boolean));
  }
  return products;
}

function productFields() {
  return `
    id
    legacyResourceId
    handle
    title
    descriptionHtml
    productType
    vendor
    status
    totalInventory
    tracksInventory
    tags
    templateSuffix
    onlineStoreUrl
    seo { title description }
    collections(first: 20) { nodes { handle title } }
    variants(first: 100) {
      nodes {
        id
        legacyResourceId
        title
        sku
        inventoryQuantity
        availableForSale
        selectedOptions { name value }
      }
    }
    images(first: 50) {
      nodes { id altText url }
    }
    metafields(first: 250) {
      nodes { namespace key type value }
    }`;
}

function isLikelyTargetProduct(product) {
  const identityText = normalizeText(`${product.handle} ${product.title} ${product.productType || ""}`);
  const collectionText = normalizeText([
    ...(product.collectionHandles || []),
    ...(product.collections?.nodes || []).map((collection) => `${collection.handle} ${collection.title}`)
  ].join(" "));
  if (DANCE_OR_KEMP_RE.test(identityText) || DANCE_OR_KEMP_RE.test(collectionText)) return false;
  if (WRONG_TARGET_RE.test(identityText)) return false;
  if (STRONG_TARGET_RE.test(identityText)) return true;
  if (/deity-short-harams/.test(collectionText)) return true;
  const ornament = product.metafields?.nodes?.find((metafield) => metafield.namespace === "custom" && metafield.key === "ornament_type")?.value || "";
  return /short\s*necklace|short\s*haram/i.test(ornament);
}

function classifyProduct(product, variantIds) {
  const images = product.images.nodes.map((image, index) => ({
    id: image.id,
    legacyId: numericId(image.id),
    position: index + 1,
    altText: image.altText || "",
    url: image.url,
    filename: imageFilename(image.url),
    hasMeasurementText: MEASUREMENT_RE.test(`${image.altText || ""} ${imageFilename(image.url)}`)
  }));
  const metafields = Object.fromEntries(
    product.metafields.nodes.map((metafield) => [`${metafield.namespace}.${metafield.key}`, metafield])
  );
  const measurementMetafields = product.metafields.nodes.filter((metafield) =>
    isMeasurementMetafield(metafield)
  );
  const variantSizeSignals = variantSizeValues(product);
  const dimensionValues = [
    ...measurementMetafields.map((metafield) => `${metafield.namespace}.${metafield.key}=${metafield.value}`),
    ...variantSizeSignals
  ];
  const machineReadableMeasurementImage = images.some((image) => image.hasMeasurementText);
  const hasImageSlotsToReview = images.some((image) => image.position >= 2 && image.position <= 4);
  const descriptionText = stripHtml(product.descriptionHtml);
  const copyMentionsMeasurements = MEASUREMENT_RE.test(descriptionText) || DIMENSION_VALUE_RE.test(descriptionText);
  const hasDimensions = dimensionValues.length > 0;
  const ucpTopResult = product.variants.nodes.some((variant) => variantIds.has(variant.id));
  const sku = firstSku(product);
  const proofTier = proofTierFor({
    hasDimensions,
    machineReadableMeasurementImage,
    hasImageSlotsToReview,
    copyMentionsMeasurements
  });

  return {
    id: product.id,
    legacyResourceId: product.legacyResourceId,
    handle: product.handle,
    title: product.title,
    onlineStoreUrl: product.onlineStoreUrl || "",
    sku,
    status: product.status,
    totalInventory: Number(product.totalInventory || 0),
    productType: product.productType || "",
    collectionHandles: [
      ...(product.collectionHandles || []),
      ...(product.collections?.nodes || []).map((collection) => collection.handle)
    ].filter(unique),
    ucpTopResult,
    proofTier,
    promotionAuthority: promotionAuthorityFor(proofTier),
    treatment: treatmentFor(product, proofTier, ucpTopResult),
    imageCount: images.length,
    hasImageSlotsToReview,
    machineReadableMeasurementImage,
    copyMentionsMeasurements,
    hasDimensions,
    dimensionValues,
    currentMeasurementImagePositions: images.filter((image) => image.hasMeasurementText).map((image) => image.position),
    imagePositionsNeedingVisualReview: images
      .filter((image) => image.position >= 2 && image.position <= 4 && !image.hasMeasurementText)
      .map((image) => image.position),
    variantSummary: product.variants.nodes.map((variant) => ({
      id: variant.id,
      sku: variant.sku || "",
      title: variant.title,
      availableForSale: variant.availableForSale,
      inventoryQuantity: variant.inventoryQuantity,
      selectedOptions: variant.selectedOptions
    })),
    images,
    metafields: {
      ornament_type: metafields["custom.ornament_type"]?.value || "",
      placement: metafields["custom.placement"]?.value || "",
      material: metafields["custom.material"]?.value || "",
      size_confidence: metafields["custom.size_confidence"]?.value || "",
      fit_notes: metafields["custom.fit_notes"]?.value || "",
      ornament_height_in: metafields["custom.ornament_height_in"]?.value || "",
      ornament_width_in: metafields["custom.ornament_width_in"]?.value || "",
      ornament_depth_in: metafields["custom.ornament_depth_in"]?.value || "",
      primary_deity: metafields["custom.primary_deity"]?.value || "",
      compatibility_class: metafields["custom.compatibility_class"]?.value || ""
    }
  };
}

function isMeasurementMetafield(metafield) {
  const identity = `${metafield.namespace}.${metafield.key}`;
  if (
    [
      "custom.ornament_height_in",
      "custom.ornament_width_in",
      "custom.ornament_depth_in",
      "custom.idol_height_min_in",
      "custom.idol_height_max_in",
      "custom.size_confidence",
      "custom.fit_notes"
    ].includes(identity)
  ) {
    return Boolean(String(metafield.value || "").trim()) && !/^check product image$/i.test(String(metafield.value || ""));
  }
  return MEASUREMENT_RE.test(`${identity} ${metafield.type} ${metafield.value}`) || DIMENSION_VALUE_RE.test(String(metafield.value || ""));
}

function proofTierFor({ hasDimensions, machineReadableMeasurementImage, hasImageSlotsToReview, copyMentionsMeasurements }) {
  if (hasDimensions && machineReadableMeasurementImage) return "Tier 3";
  if (hasDimensions && hasImageSlotsToReview) return "Tier 2";
  if (hasDimensions || machineReadableMeasurementImage || copyMentionsMeasurements) return "Tier 1";
  return "Tier 0";
}

function promotionAuthorityFor(tier) {
  if (tier === "Tier 3") return "Codex only";
  if (tier === "Tier 2") return "Codex visual review, Anil only if dimensions are ambiguous";
  if (tier === "Tier 1") return "Codex metadata/image-alt evidence only; Anil for new measurement claims";
  return "Anil/product decision before any measurement claim";
}

function treatmentFor(product, tier, ucpTopResult) {
  if (product.status !== "ACTIVE" || Number(product.totalInventory || 0) <= 0) return "C";
  if (ucpTopResult || tier === "Tier 3" || tier === "Tier 2") return "A";
  if (tier === "Tier 1") return "B";
  return "C";
}

function treatmentRank(treatment) {
  return { A: 0, B: 1, C: 2 }[treatment] ?? 9;
}

function firstSku(product) {
  const match = `${product.title} ${product.handle}`.match(/\b(DSN|DGC|DHC)\s*-?\s*(\d+)\b/i);
  if (match) return `${match[1].toUpperCase()}${match[2]}`;
  const sku = product.variants.nodes.map((variant) => variant.sku).find(Boolean);
  return sku ? sku.replace(/[^a-z0-9]/gi, "").toUpperCase() : "";
}

function variantSizeValues(product) {
  const values = [];
  for (const variant of product.variants.nodes) {
    for (const option of variant.selectedOptions || []) {
      const text = `${option.name}: ${option.value}`;
      if (MEASUREMENT_RE.test(text) || DIMENSION_VALUE_RE.test(text)) values.push(text);
    }
  }
  return [...new Set(values)];
}

function imageFilename(url) {
  if (!url) return "";
  try {
    return decodeURIComponent(path.posix.basename(new URL(url).pathname));
  } catch {
    return String(url).split("/").pop() || "";
  }
}

function numericId(gid) {
  return String(gid || "").split("/").pop();
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function proposedMeasurementAlt(product) {
  const sku = product.sku ? ` ${product.sku}` : "";
  const label = /chest/i.test(product.title) ? "chest deity necklace" : "deity short necklace";
  return `${product.title}${sku} ${label} measurement image showing length and width reference`
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

function summarizeProducts(products) {
  return {
    total: products.length,
    active: products.filter((product) => product.status === "ACTIVE").length,
    inStock: products.filter((product) => Number(product.totalInventory || 0) > 0).length,
    activeInStock: products.filter((product) => product.status === "ACTIVE" && Number(product.totalInventory || 0) > 0).length,
    ucpTopResults: products.filter((product) => product.ucpTopResult).length,
    byTier: countBy(products, (product) => product.proofTier),
    byTreatment: countBy(products, (product) => product.treatment),
    machineReadableMeasurementImage: products.filter((product) => product.machineReadableMeasurementImage).length,
    needsVisualReview: products.filter((product) => product.imagePositionsNeedingVisualReview.length).length
  };
}

function countBy(rows, keyFn) {
  return rows.reduce((acc, row) => {
    const key = keyFn(row) || "(blank)";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function productCsvRow(product) {
  return {
    handle: product.handle,
    sku: product.sku,
    title: product.title,
    status: product.status,
    inventory: product.totalInventory,
    productType: product.productType,
    collections: product.collectionHandles.join("; "),
    ucpTopResult: product.ucpTopResult,
    proofTier: product.proofTier,
    promotionAuthority: product.promotionAuthority,
    treatment: product.treatment,
    imageCount: product.imageCount,
    measurementImagePositions: product.currentMeasurementImagePositions.join(";"),
    visualReviewPositions: product.imagePositionsNeedingVisualReview.join(";"),
    hasDimensions: product.hasDimensions,
    copyMentionsMeasurements: product.copyMentionsMeasurements,
    url: product.onlineStoreUrl || `https://www.goldencollections.com/products/${product.handle}`
  };
}

function toCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header])).join(","));
  }
  return `${lines.join("\n")}\n`;
}

function csvEscape(value) {
  const text = Array.isArray(value) ? value.join("; ") : String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function writeReport(baseline, triage, discovery) {
  const top3ProofRows = top3ProofMatrix(baseline, triage.products || []);
  const appliedSynonyms = readJson("applied-short-haram-query-synonyms.json", []);
  const appliedDescriptions = readJson("applied-short-haram-description-disambiguation.json", []);
  const currentShortHaramTitles = (triage.products || []).filter((product) => /short haram/i.test(product.title || ""));
  const appliedAltUpdates = readJson("applied-short-necklace-measurement-alt-updates.json", []);
  const lines = [
    "# Deity Short Necklace UCP Sprint",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Guardrails",
    "",
    "- The sprint scaffold uses Shopify GraphQL reads and writes local tmp files.",
    "- Live Shopify updates, when present, are made only by separate explicit apply scripts and recorded below.",
    "- Collection handles are discovered from local handle hints plus live Shopify collection handles.",
    "- Measurement claims stay tiered by metadata, variant size, copy, and image alt/filename signals.",
    "",
    "## Collection Discovery",
    "",
    "| Handle | Title | Products | Score | Signals |",
    "| --- | --- | ---: | ---: | --- |",
    ...discovery.map((collection) => {
      return `| ${md(collection.handle)} | ${md(collection.title)} | ${collection.productsCount ?? ""} | ${collection.discoveryScore} | ${md(collection.matchedSignals.join("; ") || "-")} |`;
    }),
    "",
    "## UCP Baseline",
    "",
    "| Prompt | Top 3 correct | Top 10 correct | Wrong top-10 results |",
    "| --- | ---: | ---: | --- |",
    ...baseline.map((entry) => {
      const wrong = entry.wrongTop10.map((result) => `${result.rank}. ${result.title}`).join("<br>") || "-";
      return `| ${md(entry.prompt)} | ${entry.top3Correct}/3 | ${entry.top10Correct}/${entry.topCount} | ${md(wrong)} |`;
    }),
    "",
    "### Top 3 Proof Layer",
    "",
    "| Prompt | Rank | Product | Proof tier | Machine-readable measurement image |",
    "| --- | ---: | --- | --- | --- |",
    ...top3ProofRows.map((row) => {
      return `| ${md(row.prompt)} | ${row.rank} | ${md(row.product)} | ${row.proofTier} | ${row.machineReadableMeasurementImage ? "yes" : "no"} |`;
    }),
    "",
    "## Product Triage",
    "",
    `- Total likely deity short necklace products: ${triage.summary?.total ?? 0}`,
    `- Active: ${triage.summary?.active ?? 0}`,
    `- In stock: ${triage.summary?.inStock ?? 0}`,
    `- Active and in stock: ${triage.summary?.activeInStock ?? 0}`,
    `- Products appearing in UCP top results: ${triage.summary?.ucpTopResults ?? 0}`,
    `- Machine-readable measurement image signal: ${triage.summary?.machineReadableMeasurementImage ?? 0}`,
    `- Need image 2/3/4 visual review: ${triage.summary?.needsVisualReview ?? 0}`,
    `- Applied short-haram regional-name synonym updates: ${appliedSynonyms.length}`,
    `- Applied short-haram description/meta disambiguation updates: ${appliedDescriptions.filter((row) => row.changedDescription || row.changedDescriptionTag).length}`,
    `- Current products with short-haram title disambiguation: ${currentShortHaramTitles.length}`,
    `- Applied reviewed short-necklace measurement image alt updates: ${appliedAltUpdates.length}`,
    "",
    "### Proof Tiers",
    "",
    "| Tier | Count | Promotion authority |",
    "| --- | ---: | --- |",
    ...Object.entries(triage.summary?.byTier || {}).map(([tier, count]) => {
      return `| ${tier} | ${count} | ${promotionAuthorityFor(tier)} |`;
    }),
    "",
    "### Treatment",
    "",
    "| Treatment | Count | Meaning |",
    "| --- | ---: | --- |",
    `| A | ${triage.summary?.byTreatment?.A || 0} | Sprint priority: in-stock, UCP-visible, or proof-rich enough to improve now |`,
    `| B | ${triage.summary?.byTreatment?.B || 0} | Minimum cleanup or later batch |`,
    `| C | ${triage.summary?.byTreatment?.C || 0} | Restock/product decision or insufficient evidence before full investment |`,
    "",
    "## Files",
    "",
    "- `tmp/deity-short-necklace-ucp-sprint/ucp-baseline.json`",
    "- `tmp/deity-short-necklace-ucp-sprint/collection-discovery.json`",
    "- `tmp/deity-short-necklace-ucp-sprint/short-necklace-triage.json`",
    "- `tmp/deity-short-necklace-ucp-sprint/short-necklace-triage.csv`",
    "- `tmp/deity-short-necklace-ucp-sprint/short-necklace-visual-review.json`",
    "- `tmp/deity-short-necklace-ucp-sprint/short-necklace-visual-review.csv`",
    "- `tmp/deity-short-necklace-ucp-sprint/applied-short-haram-query-synonyms.json`",
    "- `tmp/deity-short-necklace-ucp-sprint/applied-short-haram-description-disambiguation.json`",
    "- `tmp/deity-short-necklace-ucp-sprint/applied-short-haram-title-disambiguation.json`",
    "- `tmp/deity-short-necklace-ucp-sprint/applied-short-necklace-measurement-alt-updates.json`",
    "- `tmp/deity-short-necklace-ucp-sprint/short-necklace-visual-review-contact-sheet.jpg`",
    "",
    "## Next Safe Step",
    "",
    "Review the Tier 2 and Tier 1 image-position rows, approve only visibly measured ruler/tape photos, and keep any future Shopify writes in a separate explicit apply script."
  ];
  fs.writeFileSync(path.join(OUT_DIR, "deity-short-necklace-ucp-sprint-report.md"), `${lines.join("\n")}\n`);
}

function top3ProofMatrix(baseline, products) {
  return baseline.flatMap((entry) =>
    entry.results.slice(0, 3).map((result) => {
      const product = findProductForUcpResult(products, result);
      return {
        prompt: entry.prompt,
        rank: result.rank,
        product: result.title,
        proofTier: product?.proofTier || "unknown",
        machineReadableMeasurementImage: Boolean(product?.machineReadableMeasurementImage)
      };
    })
  );
}

function findProductForUcpResult(products, result) {
  return (
    products.find((product) => product.variantSummary?.some((variant) => variant.id === result.variant)) ||
    products.find((product) => product.title === result.title)
  );
}

function productText(product) {
  const metafieldText = (product.metafields?.nodes || []).map((metafield) => metafield.value).join(" ");
  return normalizeText(`${product.handle} ${product.title} ${product.productType || ""} ${(product.tags || []).join(" ")} ${metafieldText}`);
}

function normalizeText(value) {
  return String(value || "").toLowerCase().replace(/[_/]+/g, "-").replace(/\s+/g, " ").trim();
}

function md(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}

function unique(value, index, array) {
  return Boolean(value) && array.indexOf(value) === index;
}
