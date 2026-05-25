#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const COLLECTION_HANDLE = "bharatanatyam-short-necklaces";
const TARGET_TEMPLATE = "bharatanatyam-dance";
const PRODUCT_TYPE = "Bharatanatyam Short Necklaces";
const ENV_FILE = "env";
const OUTPUT_DIR = "tmp/dance-short-necklaces";

const MATCHING_COLLECTION_HANDLES = [
  "bharatanatyam-short-necklaces",
  "bharatanatyam-long-necklace",
  "bharatanatyam-dance-necklace-long-and-short",
  "bharatanatyam-jewellery"
];

const HIGH_CONFIDENCE_LONG_MATCHES = {
  "bharatanatyam-pearls-necklace-short-ethnic-chain-bsn-020": "bharatanatyam-pearls-necklace-long-ethnic-chain-bln-020",
  "bharatanatyam-jewelry-traditional-ornaments-bsn-038": "bharatanatyam-long-necklace-traditional-dance-jewelry-bln-038",
  "bharatanatyam-short-necklace-elegant-dance-jewelry-bsn-003": "bharatanatyam-long-necklace-elegant-dance-jewelry-bln-003",
  "elegant-bharatanatyam-short-chain-kempu-stones-necklace-bsn-007": "elegant-bharatanatyam-long-chain-kempu-stones-necklace-bln-007",
  "bharatanatyam-jewellery-short-haram-goldencollections-bsn-010": "bharatanatyam-jewellery-long-haram-goldencollections-bln-010",
  "kempu-pearls-bharatanatyam-short-chain-goldencollections-bsn-013": "kempu-pearls-bharatanatyam-long-chain-goldencollections-bln-013",
  "bharatanatyam-pearl-short-necklace-traditional-dance-jewelry-bsn-001": "bharatanatyam-pearl-long-necklace-traditional-dance-jewelry-bln-001",
  "kempu-red-green-bharatanatyam-short-chain-goldencollections-bsn-033": "bharatanatyam-long-necklace-traditional-designs-bln-033",
  "short-pearl-haram-for-bharatnatyam-goldencollections-bsn-023": "long-pearl-haram-for-bharatnatyam-goldencollections-bln-023",
  "short-pearl-haram-for-bharatnatyam-and-kuchipudi-bsn-016": "long-pearl-haram-for-bharatnatyam-and-kuchipudi-bln-016",
  "kempu-red-green-pearls-bharatanatyam-short-necklace-bsn-009": "kempu-red-green-pearls-bharatanatyam-long-necklace-bln-009",
  "wholesale-bharatanatyam-short-necklace-sets-goldencollections-bsn-011": "wholesale-bharatanatyam-long-necklace-sets-goldencollections-bln-011",
  "kempu-red-green-bharatanatyam-short-chain-goldencollections-bsn-018": "kempu-red-green-bharatanatyam-long-chain-goldencollections-bln-018",
  "kempu-pearls-bharatanatyam-short-haram-goldencollections-bsn-006": "kempu-pearls-bharatanatyam-long-haram-goldencollections-bln-006",
  "traditional-kempu-pearls-bharatanatyam-necklace-bsn-025": "traditional-kempu-pearls-bharatanatyam-necklace-bln-025",
  "kempu-red-green-pearls-bharatanatyam-short-necklace-bsn-028": "authentic-bharatanatyam-long-harams-bln-028",
  "kempu-bharatanatyam-short-necklace-goldencollections-bsn-008": "kempu-bharatanatyam-long-necklace-goldencollections-bln-008",
  "gold-plated-bharatanatyam-short-haram-traditional-jewelry-bsn-036": "bharatanatyam-indian-pearl-necklace",
  "imitation-bharatanatyam-short-chain-classical-dance-jewelry-bsn-019": "imitation-bharatanatyam-long-chain-classical-dance-jewelry-bln-019",
  "gold-plated-kempu-bharatanatyam-short-necklace-bsn-015": "gold-plated-kempu-bharatanatyam-long-necklace-bln-015",
  "golden-plated-kemp-bharatanatyam-short-haram-bsn-027": "stunning-bharatanatyam-long-haram-styles-bln-027",
  "bharatanatyam-short-haram-classical-dance-necklace-bsn-002": "bharatanatyam-long-haram-classical-dance-necklace-bln-002",
  "bharatanatyam-short-chain-with-kempu-stones-goldencollections-bsn-026": "long-necklace-traditional-elegance-for-your-performance-bln-026",
  "maroon-and-green-pearls-bharatanatyam-short-necklace-bsn-012": "maroon-and-green-pearls-bharatanatyam-long-necklace-bln-012",
  "bharatanatyam-short-chain-traditional-indian-dance-jewelry-bsn-004": "bharatanatyam-long-chain-traditional-indian-dance-jewelry-bln-004",
  "bharatanatyam-kemp-short-chain-classical-dance-jewelry-bsn-024": "bharatanatyam-kemp-long-chain-classical-dance-jewelry-bln-024",
  "kempu-red-green-bharatanatyam-necklace-goldencollections-bsn-022": "kempu-red-green-bharatanatyam-necklace-goldencollections-bln-022",
  "classical-bharatanatyam-short-chain-kempu-stones-jewelry-bsn-005": "bharatanatyam-pearls-long-haram-kemp-stones-bln-005",
  "kempu-pearls-bharatanatyam-short-chain-goldencollections-bsn-035": "bharatanatyam-kemp-stone-long-necklace-haram-classical-dance-jewelry",
  "bharatanatyam-kempu-short-haram-classical-dance-jewelry-bsn-034": "bharatanatyam-long-haram-embrace-tradition-bln-034"
};

const OWNER_APPROVED_MEDIUM_LONG_MATCHES = {
  "classical-bharatanatyam-short-chain-kempu-stones-jewelry-bsn-029": "explore-timeless-bharatanatyam-long-haram-styles-bln-029",
  "bharatanatyam-short-necklace-authentic-designs-bsn-037": "bharatanatyam-kempu-gold-necklace",
  "gold-plated-kemp-bharatanatyam-short-chain-goldencollections-bsn-014": "gold-plated-kemp-bharatanatyam-long-chain-goldencollections-bln-014",
  "bharatanatyam-short-necklace-bsn044": "bharatanatyam-classical-gold-necklace",
  "elegant-bharatanatyam-short-chain-kempu-stones-necklace-bsn-031": "bharatanatyam-long-necklace-adorn-yourself-with-grace-bln-031",
  "graceful-short-haram-bharatanatyam-temple-necklace-bsn-039": "bharatanatyam-long-haram-temple-jewelry-for-dancers-bln-039",
  "temple-kemp-pearls-mala-for-bharatanatyam-goldencollections-bsn-017": "temple-kemp-pearls-mala-for-bharatanatyam-goldencollections-bln-017",
  "kempu-pearls-bharatanatyam-short-haram-goldencollections-bsn-030": "bharatanatyam-pearl-long-haram-round-kemp-discs-temple-pendant-bln055"
};

const LONG_MATCHES = {
  ...HIGH_CONFIDENCE_LONG_MATCHES,
  ...OWNER_APPROVED_MEDIUM_LONG_MATCHES
};

const env = readEnv(ENV_FILE);
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const GRAPHQL_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;
const REST_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}`;

if (!SHOP || !TOKEN) {
  console.error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
  process.exit(1);
}

const VISUALS = {
  "bharatanatyam-pearls-necklace-short-ethnic-chain-bsn-020": visual("statement pendant and pearl drops", "red, green and clear stones with white pearl drops", true, true),
  "classical-bharatanatyam-short-chain-kempu-stones-jewelry-bsn-029": visual("round pendant and pearl drops", "red, green and clear stones with white pearl drops", true),
  "bharatanatyam-jewelry-traditional-ornaments-bsn-038": visual("broad collar and center pendant", "red, green and clear stones with white pearl drops", true, true),
  "bharatanatyam-short-necklace-authentic-designs-bsn-037": visual("round pendant and pearl fringe", "red, green and clear stones with white pearl drops", true),
  "bharatanatyam-short-necklace-elegant-dance-jewelry-bsn-003": visual("round pendant and pearl fringe", "red, green and clear stones with white pearl drops", true),
  "gold-plated-kemp-bharatanatyam-short-chain-goldencollections-bsn-014": visual("round pendant and red-green stones", "red, green and clear stones", false),
  "elegant-bharatanatyam-short-chain-kempu-stones-necklace-bsn-031": visual("round pendant and red-green stones", "red, green and clear stones", false),
  "elegant-bharatanatyam-short-chain-kempu-stones-necklace-bsn-007": visual("double row and pearl fringe", "red, green and clear stones with white pearl drops", true),
  "bharatanatyam-jewellery-short-haram-goldencollections-bsn-010": visual("broad stone collar and pearl fringe", "red, green and clear stones with white pearl drops", true, true),
  "bharatanatyam-short-necklace-bsn044": visual("square kemp-style collar and pearls", "red and clear stones with white pearl drops", true, true),
  "kempu-pearls-bharatanatyam-short-chain-goldencollections-bsn-013": visual("broad green-center collar and pearl fringe", "red, green and clear stones with white pearl drops", true, true),
  "bharatanatyam-pearl-short-necklace-traditional-dance-jewelry-bsn-001": visual("round pendant and pearl fringe", "red, green and clear stones with white pearl drops", true),
  "kempu-red-green-bharatanatyam-short-chain-goldencollections-bsn-033": visual("V-shaped pendant and pearl fringe", "red, green and clear stones with white pearl drops", true),
  "bharatanatyam-short-necklace-kemp-snake-design-bsn043": visual("snake motif and clustered pendants", "red, green and clear stones with white pearl drops", true, true),
  "bharatanatyam-short-necklace-kemp-temple-jewellery-bsn042": visual("temple motif clustered pendants", "red, green and clear stones with white pearl drops", true, true),
  "traditional-kempu-bharatanatyam-short-haram-bsn-021": visual("small rectangular pendant chain", "red, green and clear stones", false),
  "graceful-short-haram-bharatanatyam-temple-necklace-bsn-039": visual("small rectangular pendant chain", "red, green and clear stones", false),
  "short-pearl-haram-for-bharatnatyam-goldencollections-bsn-023": visual("rectangular pendant and pearl drops", "red, green and clear stones with white pearl drops", true),
  "temple-kemp-pearls-mala-for-bharatanatyam-goldencollections-bsn-017": visual("rectangular pendant and pearl fringe", "red, green and clear stones with white pearl drops", true),
  "traditional-kemp-bharatanatyam-short-haram-goldencollections-bsn-032": visual("floral drop motifs", "red, green and clear stones", false),
  "short-pearl-haram-for-bharatnatyam-and-kuchipudi-bsn-016": visual("floral drop motifs and pearl accents", "red, green and clear stones with white pearl drops", true),
  "kempu-pearls-bharatanatyam-short-haram-goldencollections-bsn-030": visual("circular floral medallions", "red, green and clear stones with white pearl drops", true, true),
  "kempu-red-green-pearls-bharatanatyam-short-necklace-bsn-009": visual("floral motifs and pearl drops", "red, green and clear stones with white pearl drops", true, true, true),
  "wholesale-bharatanatyam-short-necklace-sets-goldencollections-bsn-011": visual("statement pendant and pearl drops", "red, green and clear stones with white pearl drops", true, true),
  "kempu-red-green-bharatanatyam-short-chain-goldencollections-bsn-018": visual("floral station pattern", "red, green and clear stones", false, true, true),
  "kempu-pearls-bharatanatyam-short-haram-goldencollections-bsn-006": visual("V-shaped pendant and pearl drop", "red, green and clear stones with white pearl drop", true),
  "traditional-kempu-pearls-bharatanatyam-necklace-bsn-025": visual("large round pendant and pearl fringe", "red, green and clear stones with white pearl drops", true, true),
  "kempu-red-green-pearls-bharatanatyam-short-necklace-bsn-028": visual("circular floral medallions", "red, green and clear stones with white pearl drops", true, true),
  "kempu-bharatanatyam-short-necklace-goldencollections-bsn-008": visual("red kemp-style pendant and pearl fringe", "red and clear stones with white pearl drops", true),
  "gold-plated-bharatanatyam-short-haram-traditional-jewelry-bsn-036": visual("round pendant and pearl fringe", "red, green and clear stones with white pearl drops", true),
  "imitation-bharatanatyam-short-chain-classical-dance-jewelry-bsn-019": visual("green stone chain and pendant", "green and clear stones", false),
  "gold-plated-kempu-bharatanatyam-short-necklace-bsn-015": visual("blue stone chain and round pendant", "blue, red and clear stones", false),
  "golden-plated-kemp-bharatanatyam-short-haram-bsn-027": visual("pendant motifs", "red, green and clear stones", false, true, true),
  "bharatanatyam-short-haram-classical-dance-necklace-bsn-002": visual("layered pendant", "red, green and clear stones", false),
  "bharatanatyam-short-chain-with-kempu-stones-goldencollections-bsn-026": visual("large round medallion", "red, green and clear stones", false, true),
  "maroon-and-green-pearls-bharatanatyam-short-necklace-bsn-012": visual("statement pendant and pearl drops", "maroon, green and clear stones with white pearl drops", true, true),
  "bharatanatyam-short-chain-traditional-indian-dance-jewelry-bsn-004": visual("large round medallion", "red and clear stones", false, true),
  "bharatanatyam-kemp-short-chain-classical-dance-jewelry-bsn-024": visual("large round medallion", "red and clear stones", false, true),
  "divine-elegant-haram": visual("teardrop pendant and pearl fringe", "red, green and clear stones with white pearl drops", true, false, false, "Divine Bharatanatyam Short Necklace with Teardrop Pendant"),
  "royal-temple-haram": visual("floral station pattern", "red, green and clear stones", false, true, false, "Royal Bharatanatyam Short Necklace with Floral Stations"),
  "regal-temple-haram": visual("statement pendant and pearl drops", "red, green and clear stones with white pearl drops", true, true, false, "Regal Bharatanatyam Short Necklace with Pearl Drops"),
  "elegant-temple-haram": visual("round pendant and pearl fringe", "red, green and clear stones with white pearl drops", true, false, false, "Elegant Bharatanatyam Short Necklace with Round Pendant"),
  "divine-temple-haram": visual("double row and round pendant", "red, green and clear stones with white pearl drops", true, false, false, "Divine Bharatanatyam Short Necklace with Round Pendant"),
  "majestic-temple-haram": visual("round pendant and pearl drops", "red, green and clear stones with white pearl drops", true, false, false, "Majestic Bharatanatyam Short Necklace with Pearl Drops"),
  "radiant-temple-haram": visual("teardrop pendant and pearl fringe", "red, green and clear stones with white pearl drops", true, false, false, "Radiant Bharatanatyam Short Necklace with Teardrop Pendant"),
  "graceful-divine-haram": visual("clustered semicircle motifs", "red and clear stones", false, true, false, "Graceful Divine Bharatanatyam Short Necklace"),
  "classic-temple-haram": visual("clustered semicircle motifs", "red and clear stones", false, true, false, "Classic Bharatanatyam Short Necklace with Cluster Motifs"),
  "graceful-temple-haram": visual("double row and round pendant", "red, green and clear stones with white pearl drops", true, false, false, "Graceful Bharatanatyam Short Necklace with Round Pendant"),
  "euphoria-bharatanatyam-short-necklace": visual("pendant and pearl drops", "red, green and clear stones with white pearl drops", true, true, true, "Euphoria Bharatanatyam Short Necklace with Pearl Drops"),
  "serene-bharatanatyam-short-necklace": visual("round pendant and pearl drops", "red, green and clear stones with white pearl drops", true, false, true, "Serene Bharatanatyam Short Necklace with Round Pendant"),
  "harmony-bharatanatyam-short-necklace": visual("double row and pearl drops", "red, green and clear stones with white pearl drops", true, false, true, "Harmony Bharatanatyam Short Necklace with Double Row"),
  "radiant-bharatanatyam-short-necklace": visual("double row and pearl drops", "red, green and clear stones with white pearl drops", true, false, true, "Radiant Bharatanatyam Short Necklace with Double Row"),
  "captivating-bharatanatyam-short-necklace": visual("V-shaped pendant and pearl drops", "red, green and clear stones with white pearl drops", true, true, true, "Captivating Bharatanatyam Short Necklace with Pearl Drops"),
  "elegant-bharatanatyam-short-necklace": visual("statement pendant and pearl drops", "red, green and clear stones with white pearl drops", true, true, true, "Elegant Bharatanatyam Short Necklace with Pearl Drops"),
  "graceful-bharatanatyam-short-necklace": visual("double row and pearl drops", "red, green and clear stones with white pearl drops", true, false, true, "Graceful Bharatanatyam Short Necklace with Double Row"),
  "majestic-bharatanatyam-short-necklace": visual("floral station pattern", "red, green and clear stones", false, true, true, "Majestic Bharatanatyam Short Necklace with Floral Stations"),
  "exquisite-bharatanatyam-short-necklace": visual("clustered semicircle motifs", "red and clear stones", false, true, true, "Exquisite Bharatanatyam Short Necklace with Cluster Motifs"),
  "divine-bharatanatyam-temple-dance-short-necklace-golden-collections": visual("clustered semicircle motifs", "red and clear stones", false, true, true, "Divine Bharatanatyam Temple Dance Short Necklace"),
  "kempu-red-green-bharatanatyam-necklace-goldencollections-bsn-022": visual("statement pendant and pearl drops", "red, green and clear stones with white pearl drops", true, true),
  "classical-bharatanatyam-short-chain-kempu-stones-jewelry-bsn-005": visual("round pendant and pearl drops", "red, green and clear stones with white pearl drops", true),
  "kempu-pearls-bharatanatyam-short-chain-goldencollections-bsn-035": visual("slim red-green stone chain", "red, green and clear stones", false),
  "bharatanatyam-kempu-short-haram-classical-dance-jewelry-bsn-034": visual("statement pendant chain", "red, green and clear stones with white pearl drops", true, true)
};

function visual(feature, stoneColor, hasPearls, isStatement = false, photoShowsEarrings = false, titleOverride = null) {
  return { feature, stoneColor, hasPearls, isStatement, photoShowsEarrings, titleOverride };
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

async function fetchCollectionProducts() {
  const query = `
    query CollectionProducts($handle: String!, $after: String) {
      collectionByHandle(handle: $handle) {
        id
        handle
        title
        products(first: 50, after: $after, sortKey: COLLECTION_DEFAULT) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            legacyResourceId
            handle
            title
            productType
            status
            templateSuffix
            seo { title description }
            featuredImage { url altText }
            images(first: 1) { nodes { id altText url } }
            priceRangeV2 { minVariantPrice { amount currencyCode } }
            collections(first: 20) { nodes { id handle title } }
          }
        }
      }
    }
  `;

  const products = [];
  let collection;
  let after = null;
  do {
    const data = await gql(query, { handle: COLLECTION_HANDLE, after });
    collection = data.collectionByHandle;
    if (!collection) throw new Error(`Collection not found: ${COLLECTION_HANDLE}`);
    products.push(...collection.products.nodes);
    after = collection.products.pageInfo.endCursor;
  } while (collection.products.pageInfo.hasNextPage);
  return { collection, products };
}

async function fetchCollectionIds(handles) {
  const entries = [];
  for (const handle of handles) {
    const data = await gql(
      `query CollectionByHandle($handle: String!) { collectionByHandle(handle: $handle) { id handle title } }`,
      { handle }
    );
    if (!data.collectionByHandle) {
      console.warn(`[MISSING COLLECTION] ${handle}`);
      continue;
    }
    entries.push(data.collectionByHandle);
  }
  return entries;
}

async function fetchProductIds(handles) {
  const byHandle = new Map();
  for (const handle of handles) {
    const data = await gql(
      `query ProductByHandle($query: String!) { products(first: 1, query: $query) { nodes { id handle title } } }`,
      { query: `handle:${handle}` }
    );
    const product = data.products.nodes[0];
    if (!product) {
      console.warn(`[MISSING MATCH PRODUCT] ${handle}`);
      continue;
    }
    byHandle.set(handle, product);
  }
  return byHandle;
}

function codeFor(product) {
  const text = `${product.title} ${product.handle}`;
  const match = text.match(/\bbsn[-\s]?0?(\d{1,3})\b/i);
  if (!match) return "";
  return `BSN-${match[1].padStart(3, "0")}`;
}

function titleFor(product, data) {
  const baseTitle = data.titleOverride || `Bharatanatyam Short Necklace with ${titleCase(data.feature)}`;
  const title = data.photoShowsEarrings && !baseTitle.toLowerCase().includes("earring") ? titleWithEarrings(baseTitle) : baseTitle;
  return withCode(title, codeFor(product));
}

function titleWithEarrings(baseTitle) {
  const marker = " with ";
  const markerIndex = baseTitle.indexOf(marker);
  if (markerIndex === -1) return `${baseTitle} with Earrings`;

  const prefix = baseTitle.slice(0, markerIndex);
  const detail = baseTitle.slice(markerIndex + marker.length).replace(/\s+and\s+/g, ", ");
  return `${prefix} with ${detail} and Earrings`;
}

function withCode(title, code) {
  if (!code || title.toLowerCase().includes(code.toLowerCase())) return title;
  return `${title} ${code}`;
}

function titleCase(value) {
  return value
    .split(" ")
    .map((word) => (["and", "with"].includes(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(" ");
}

function htmlFor(product, data) {
  const photoSentence = data.photoShowsEarrings
    ? `The product photo shows a ${data.feature} design with ${data.stoneColor}, supplied with the matching earrings shown.`
    : `The product photo shows a ${data.feature} design with ${data.stoneColor}.`;
  const strength = data.isStatement
    ? "Use it when the dancer needs a stronger short-necklace layer that remains visible from stage distance."
    : "Use it as the short-necklace layer near the neckline or upper chest.";

  return `
<p>A Bharatanatyam short necklace for neckline and upper-chest framing in classical dance costume styling. ${photoSentence}</p>
<ul>
  <li>${strength}</li>
  <li>Standard one-size regular dance jewellery, suitable for both kids and adults when the costume neckline and pendant scale are appropriate.</li>
  <li>Suitable for regular Bharatanatyam and Kuchipudi stage performances, school programs and dance institute costume planning.</li>
  <li>Pair with a long haram, earrings, mattal, headset, waist belt and hair accessories when building a complete dance jewellery look.</li>
  <li>Compare pendant scale, stone color and pearl drops with the dancer's blouse neckline, costume pleats and other jewellery before ordering.</li>
  <li>For arangetram or premium long-term use, many dancers choose real kemp jewellery; this piece is from the regular Bharatanatyam/Kuchipudi dance jewellery range.</li>
  ${data.photoShowsEarrings ? "<li>Includes the matching earrings shown in the product photo.</li>" : ""}
</ul>
`.trim();
}

function seoDescriptionFor(data) {
  const visible = data.hasPearls ? `${data.stoneColor}` : `${data.stoneColor}`;
  const included = data.photoShowsEarrings ? " Includes matching earrings." : "";
  return `Standard size Bharatanatyam and Kuchipudi short necklace with ${visible} for kids and adults, regular stage use and school programs.${included}`;
}

function performanceContexts(data) {
  return ["stage performance", "school program", "dance institute program", "class"];
}

function metafieldsFor(product, data, matchingCollectionIds, matchingProductIdsByHandle) {
  const matchingLongHandle = LONG_MATCHES[product.handle];
  const matchingProductIds = matchingLongHandle && matchingProductIdsByHandle.has(matchingLongHandle) ? [matchingProductIdsByHandle.get(matchingLongHandle).id] : [];

  const fields = [
    ["dance_form_suitable", "list.single_line_text_field", ["Bharatanatyam", "Kuchipudi"]],
    ["dance_range", "single_line_text_field", "regular dance"],
    ["product_tier", "single_line_text_field", "regular"],
    ["dance_product_role", "list.single_line_text_field", data.photoShowsEarrings ? ["short necklace", "earrings"] : ["short necklace"]],
    ["performance_context", "list.single_line_text_field", performanceContexts(data)],
    ["buyer_context", "list.single_line_text_field", ["kids", "adult dancer", "dance institute", "teacher"]],
    ["placement", "single_line_text_field", "Neckline / upper chest"],
    [
      "fit_notes",
      "multi_line_text_field",
      data.isStatement
        ? "Use as a stronger short-necklace layer near the neckline or upper chest. Compare pendant scale with dancer height, blouse neckline and any long haram worn with it before ordering."
        : "Use as the short-necklace layer near the neckline or upper chest. Compare pendant scale with dancer height, blouse neckline and any long haram worn with it before ordering."
    ],
    [
      "size_notes",
      "multi_line_text_field",
      "Standard one-size regular Bharatanatyam short necklace suitable for both kids and adults when the neckline, dancer height and pendant scale are appropriate. Contact Golden Collections before ordering if an exact necklace drop is needed."
    ],
    ["measurement_confidence", "single_line_text_field", "Owner confirmed"],
    ["component_count", "number_integer", data.photoShowsEarrings ? "3" : "1"],
    ["matching_collection_refs", "list.collection_reference", matchingCollectionIds],
    ["matching_product_refs", "list.product_reference", matchingProductIds],
    ["matching_finish", "single_line_text_field", matchingFinish(data)],
    ["stone_color", "single_line_text_field", data.stoneColor],
    ["material", "single_line_text_field", "Kemp-style stone work on alloy metal with gold plating"],
    ["finish", "single_line_text_field", "Gold plated regular dance jewellery finish"],
    [
      "care_instructions",
      "multi_line_text_field",
      "Keep away from water, perfume and sweat after use. Store separately in a dry box or pouch so stones, pearl drops and gold finish are protected."
    ],
    [
      "quality_checks",
      "multi_line_text_field",
      "Checked for stone setting, pendant joints, cord or chain attachment, included earrings where present, pearl drops where present, surface finish and packing before shipping."
    ]
  ];

  return fields
    .filter(([, , value]) => (Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && value !== ""))
    .map(([key, type, value]) => ({
      ownerId: product.id,
      namespace: "dance",
      key,
      type,
      value: Array.isArray(value) ? JSON.stringify(value) : String(value)
    }));
}

function matchingFinish(data) {
  const parts = ["gold", "red-green stones"];
  if (data.stoneColor.includes("blue")) return "gold / blue-red stones";
  if (data.stoneColor.includes("maroon")) return "gold / maroon-green stones / pearl";
  if (data.hasPearls) parts.push("pearl");
  return parts.join(" / ");
}

function imageAltFor(product, data) {
  const code = codeFor(product);
  const earrings = data.photoShowsEarrings ? ", shown with matching earrings" : "";
  return `Bharatanatyam short necklace with ${data.stoneColor}${earrings}${code ? ` ${code}` : ""}`;
}

async function updateProduct(product, data) {
  const mutation = `
    mutation ProductUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        product { id handle title templateSuffix seo { title description } }
        userErrors { field message }
      }
    }
  `;
  const title = titleFor(product, data);
  const update = await gql(mutation, {
    input: {
      id: product.id,
      title,
      productType: PRODUCT_TYPE,
      templateSuffix: TARGET_TEMPLATE,
      descriptionHtml: htmlFor(product, data),
      seo: {
        title: `${title.replace(/\s+BSN-\d{3}$/i, "")} | Golden Collections`,
        description: seoDescriptionFor(data).slice(0, 320)
      }
    }
  });
  const errors = update.productUpdate.userErrors || [];
  if (errors.length) throw new Error(`productUpdate ${product.handle}: ${JSON.stringify(errors)}`);
  return update.productUpdate.product;
}

async function setMetafields(product, data, matchingCollectionIds, matchingProductIdsByHandle) {
  const mutation = `
    mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { namespace key type value }
        userErrors { field message code }
      }
    }
  `;
  const set = await gql(mutation, { metafields: metafieldsFor(product, data, matchingCollectionIds, matchingProductIdsByHandle) });
  const errors = set.metafieldsSet.userErrors || [];
  if (errors.length) throw new Error(`metafieldsSet ${product.handle}: ${JSON.stringify(errors)}`);
  return set.metafieldsSet.metafields;
}

async function updateImageAlt(product, data) {
  const image = product.images.nodes[0];
  if (!image) return null;
  const imageId = image.id.split("/").pop();
  const res = await fetch(`${REST_ENDPOINT}/products/${product.legacyResourceId}/images/${imageId}.json`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN
    },
    body: JSON.stringify({ image: { id: imageId, alt: imageAltFor(product, data) } })
  });
  const body = await res.json();
  if (!res.ok || body.errors) throw new Error(`image alt update ${product.handle}: ${JSON.stringify(body.errors || body)}`);
  return body.image;
}

function ownerQuestionRows(products) {
  const rows = [
    [
      "handle",
      "status",
      "question_area",
      "question",
      "why_it_matters"
    ]
  ];
  for (const product of products) {
    const data = VISUALS[product.handle];
    rows.push([
      product.handle,
      product.status,
      "measurement",
      "What is the exact necklace drop or full wearable length in inches?",
      "Allows measured fit guidance instead of 'Check product photos'."
    ]);
    rows.push([
      product.handle,
      product.status,
      "age_fit",
      "Is this best for kids, adults, or both?",
      "Improves buyer context and filters without guessing dancer age."
    ]);
    rows.push([
      product.handle,
      product.status,
      "matching_products",
      "Do you want to approve any medium-confidence long haram, mattal/headset or full set matches for this item?",
      "Lets us add exact product references where the visual match was not strong enough to set automatically."
    ]);
    rows.push([
      product.handle,
      product.status,
      "material_stone",
      "Confirm stone type and material: kemp-style/glass/acrylic stones? alloy with gold plating?",
      "Improves Product data and avoids overclaiming material quality."
    ]);
  }
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  const { products } = await fetchCollectionProducts();
  const matchingCollections = await fetchCollectionIds(MATCHING_COLLECTION_HANDLES);
  const matchingCollectionIds = matchingCollections.map((collection) => collection.id);
  const matchingProductIdsByHandle = await fetchProductIds([...new Set(Object.values(LONG_MATCHES))]);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const missing = products.filter((product) => !VISUALS[product.handle]).map((product) => product.handle);
  if (missing.length) throw new Error(`Missing visual data for handles:\n${missing.join("\n")}`);

  const previewRows = [];
  for (const product of products) {
    const data = VISUALS[product.handle];
    const title = titleFor(product, data);
    previewRows.push({
      handle: product.handle,
      status: product.status,
      oldTitle: product.title,
      newTitle: title,
      oldTemplate: product.templateSuffix || "default",
      newTemplate: TARGET_TEMPLATE,
      stoneColor: data.stoneColor,
      photoShowsEarrings: data.photoShowsEarrings,
      matchingLongHandle: LONG_MATCHES[product.handle] || null,
      measurementConfidence: "Owner confirmed"
    });
    console.log(`[${APPLY ? "UPDATE" : "DRY"}] ${product.status} ${product.handle}: "${product.title}" -> "${title}"`);

    if (APPLY) {
      await updateProduct(product, data);
      await setMetafields(product, data, matchingCollectionIds, matchingProductIdsByHandle);
      await updateImageAlt(product, data);
    }
  }

  fs.writeFileSync(`${OUTPUT_DIR}/short-necklace-content-preview.json`, JSON.stringify(previewRows, null, 2));
  fs.writeFileSync(`${OUTPUT_DIR}/owner-questions.csv`, ownerQuestionRows(products));
  console.log(`[PREVIEW] ${OUTPUT_DIR}/short-necklace-content-preview.json`);
  console.log(`[QUESTIONS] ${OUTPUT_DIR}/owner-questions.csv`);
  console.log(`[COUNT] ${products.length}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
