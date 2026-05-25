#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const ENV_FILE = "env";
const OUTPUT_DIR = "tmp/kemp-matching";

const FAMILIES = {
  real: {
    label: "Real Kemp",
    handles: [
      "kemp-bharatanatyam-jewellery-dance-sets",
      "kemp-short-haram",
      "kemp-long-necklace",
      "kemp-headset",
      "kemp-mang-tikka",
      "kemp-mattal-ear-chains",
      "kemp-earrings",
      "kemp-vaddanam-waistbelt",
      "kemp-accessories"
    ]
  },
  black: {
    label: "Black Kemp",
    handles: [
      "kemp-black-bharatanatyam-kuchipudi-dance-jewellery-set",
      "kemp-black-short-necklace",
      "kemp-black-long-haram",
      "premium-black-kemp-headsets-nethichutti",
      "kemp-black-nethi-chutti-maang-tikka",
      "kemp-black-mattal",
      "kemp-black-earrings-jhumki-jhumka",
      "black-kemp-vaddanam-temple-jewellery-oddiyanam",
      "black-kemp-bharatanatyam-accessories"
    ]
  }
};

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

async function fetchJson(url, options, attempts = 5) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const res = await fetch(url, options);
      const text = await res.text();
      let body;
      try {
        body = JSON.parse(text);
      } catch {
        throw new Error(`Non-JSON response ${res.status}: ${text.slice(0, 160)}`);
      }
      if (!res.ok || body.errors) throw new Error(`HTTP ${res.status}: ${JSON.stringify(body.errors || body)}`);
      return body;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(800 * attempt);
    }
  }
  throw lastError;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function gql(query, variables = {}) {
  const body = await fetchJson(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN
    },
    body: JSON.stringify({ query, variables })
  });
  if (body.errors?.length) throw new Error(`GraphQL errors: ${JSON.stringify(body.errors)}`);
  return body.data;
}

async function fetchFamilyProducts(familyKey, handles) {
  const query = `
    query CollectionProducts($handle: String!, $after: String) {
      collectionByHandle(handle: $handle) {
        handle
        title
        products(first: 50, after: $after, sortKey: COLLECTION_DEFAULT) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            handle
            title
            productType
            status
            templateSuffix
            tags
            featuredImage { url altText }
            metafield(namespace: "dance", key: "dance_product_role") { value }
          }
        }
      }
    }
  `;

  const byId = new Map();
  for (const handle of handles) {
    let after = null;
    let collection;
    do {
      const data = await gql(query, { handle, after });
      collection = data.collectionByHandle;
      if (!collection) throw new Error(`Collection not found: ${handle}`);
      for (const product of collection.products.nodes) {
        if (!byId.has(product.id)) byId.set(product.id, { ...product, familyKey, collections: [] });
        byId.get(product.id).collections.push(handle);
      }
      after = collection.products.pageInfo.endCursor;
    } while (collection.products.pageInfo.hasNextPage);
  }

  return [...byId.values()]
    .filter((product) => product.status === "ACTIVE")
    .filter((product) => {
      const text = `${product.title} ${product.productType} ${product.handle}`.toLowerCase();
      return familyKey === "black" ? text.includes("black") : !text.includes("black kemp");
    })
    .map((product) => ({
      ...product,
      role: roleFor(product, familyKey),
      motif: motifFor(product),
      codeNumber: codeNumberFor(product)
    }));
}

function roleFor(product, familyKey) {
  const collections = product.collections;
  const roles = safeJson(product.metafield?.value);
  if (Array.isArray(roles) && roles.length) return normalizeRole(roles[0]);
  if (familyKey === "black") {
    if (collections.includes("kemp-black-bharatanatyam-kuchipudi-dance-jewellery-set")) return "complete set";
    if (collections.includes("kemp-black-short-necklace")) return "short necklace";
    if (collections.includes("kemp-black-long-haram")) return "long haram";
    if (collections.includes("premium-black-kemp-headsets-nethichutti")) return "headset";
    if (collections.includes("kemp-black-nethi-chutti-maang-tikka")) return "nethi chutti";
    if (collections.includes("kemp-black-mattal")) return "mattal";
    if (collections.includes("kemp-black-earrings-jhumki-jhumka")) return "earrings";
    if (collections.includes("black-kemp-vaddanam-temple-jewellery-oddiyanam")) return "waist belt";
  } else {
    if (collections.includes("kemp-bharatanatyam-jewellery-dance-sets")) return "complete set";
    if (collections.includes("kemp-short-haram")) return "short necklace";
    if (collections.includes("kemp-long-necklace")) return "long haram";
    if (collections.includes("kemp-headset")) return "headset";
    if (collections.includes("kemp-mang-tikka")) return "nethi chutti";
    if (collections.includes("kemp-mattal-ear-chains")) return "mattal";
    if (collections.includes("kemp-earrings")) return "earrings";
    if (collections.includes("kemp-vaddanam-waistbelt")) return "waist belt";
  }
  return normalizeRole(product.productType || product.title);
}

function normalizeRole(value) {
  const text = String(value).toLowerCase();
  if (text.includes("complete") || text.includes("dance set")) return "complete set";
  if (text.includes("short")) return "short necklace";
  if (text.includes("long") || text.includes("haram")) return "long haram";
  if (text.includes("headset")) return "headset";
  if (text.includes("nethi") || text.includes("maang") || text.includes("tikka")) return "nethi chutti";
  if (text.includes("mattal") || text.includes("matil")) return "mattal";
  if (text.includes("earring") || text.includes("jhum")) return "earrings";
  if (text.includes("waist") || text.includes("vaddanam") || text.includes("oddiyanam")) return "waist belt";
  if (text.includes("bangle")) return "bangles";
  if (text.includes("vanki") || text.includes("baju")) return "vanki";
  if (text.includes("jada")) return "jada";
  if (text.includes("rakodi")) return "rakodi";
  if (text.includes("sun") || text.includes("moon")) return "sun and moon";
  if (text.includes("nose") || text.includes("nath")) return "nose pin";
  return "accessory";
}

function safeJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function motifFor(product) {
  const text = `${product.title} ${product.handle}`.toLowerCase();
  if (text.includes("mango")) return "mango";
  if (text.includes("pearl") || text.includes("muthu")) return "pearl";
  if (text.includes("temple") || text.includes("nataraj") || text.includes("nataraja")) return "temple";
  if (text.includes("antique")) return "antique";
  return "classic";
}

function codeNumberFor(product) {
  const match = `${product.title} ${product.handle}`.match(/\b[A-Z]{2,4}[-\s]?0?(\d{1,4})\b/i);
  return match ? Number(match[1]) : 0;
}

function wantedRoles(role) {
  return {
    "complete set": ["waist belt", "earrings", "mattal", "nethi chutti"],
    "short necklace": ["long haram", "earrings", "mattal", "waist belt"],
    "long haram": ["short necklace", "earrings", "waist belt", "mattal"],
    headset: ["nethi chutti", "earrings", "mattal", "short necklace"],
    "nethi chutti": ["headset", "earrings", "mattal", "short necklace"],
    mattal: ["earrings", "headset", "nethi chutti", "short necklace"],
    earrings: ["mattal", "short necklace", "long haram", "headset"],
    "waist belt": ["long haram", "short necklace", "complete set", "bangles"],
    bangles: ["complete set", "short necklace", "long haram", "earrings"],
    vanki: ["complete set", "waist belt", "short necklace", "long haram"],
    jada: ["headset", "nethi chutti", "complete set", "mattal"],
    rakodi: ["headset", "nethi chutti", "complete set", "jada"],
    "sun and moon": ["headset", "nethi chutti", "complete set", "mattal"],
    "nose pin": ["headset", "nethi chutti", "earrings", "complete set"],
    accessory: ["complete set", "short necklace", "long haram", "headset"]
  }[role] || ["complete set", "short necklace", "long haram", "earrings"];
}

function pickMatches(product, products) {
  const byRole = new Map();
  for (const candidate of products) {
    if (candidate.id === product.id) continue;
    if (!byRole.has(candidate.role)) byRole.set(candidate.role, []);
    byRole.get(candidate.role).push(candidate);
  }

  const matches = [];
  for (const role of wantedRoles(product.role)) {
    const candidates = (byRole.get(role) || []).sort((a, b) => score(product, b) - score(product, a));
    const chosen = candidates.find((candidate) => !matches.some((match) => match.id === candidate.id));
    if (chosen) matches.push(chosen);
    if (matches.length >= 4) break;
  }
  return matches;
}

function score(product, candidate) {
  let value = 0;
  if (candidate.motif === product.motif) value += 50;
  if (candidate.featuredImage?.url) value += 10;
  if (product.codeNumber && candidate.codeNumber) value += Math.max(0, 20 - Math.abs(product.codeNumber - candidate.codeNumber));
  if (candidate.title.toLowerCase().includes("pearl") && product.title.toLowerCase().includes("pearl")) value += 8;
  return value;
}

async function setMatchingProductRefs(product, matches) {
  const mutation = `
    mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { namespace key type value }
        userErrors { field message code }
      }
    }
  `;
  const result = await gql(mutation, {
    metafields: [
      {
        ownerId: product.id,
        namespace: "dance",
        key: "matching_product_refs",
        type: "list.product_reference",
        value: JSON.stringify(matches.map((match) => match.id))
      }
    ]
  });
  const errors = result.metafieldsSet.userErrors || [];
  if (errors.length) throw new Error(`metafieldsSet ${product.handle}: ${JSON.stringify(errors)}`);
  return result.metafieldsSet.metafields;
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const report = {};

  for (const [familyKey, family] of Object.entries(FAMILIES)) {
    const products = await fetchFamilyProducts(familyKey, family.handles);
    const rows = [];
    for (const product of products) {
      const matches = pickMatches(product, products);
      rows.push({
        handle: product.handle,
        title: product.title,
        role: product.role,
        motif: product.motif,
        matchCount: matches.length,
        matches: matches.map((match) => ({
          handle: match.handle,
          title: match.title,
          role: match.role,
          motif: match.motif
        }))
      });
      console.log(`[${APPLY ? "UPDATE" : "DRY"}] ${family.label} ${product.role} ${product.handle}: ${matches.map((match) => match.handle).join(", ")}`);
      if (APPLY && matches.length) {
        await setMatchingProductRefs(product, matches);
        await sleep(120);
      }
    }
    report[familyKey] = {
      label: family.label,
      count: products.length,
      roleCounts: rows.reduce((acc, row) => {
        acc[row.role] = (acc[row.role] || 0) + 1;
        return acc;
      }, {}),
      rows
    };
  }

  fs.writeFileSync(`${OUTPUT_DIR}/matching-product-refs-preview.json`, JSON.stringify(report, null, 2));
  console.log(`[REPORT] ${OUTPUT_DIR}/matching-product-refs-preview.json`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
