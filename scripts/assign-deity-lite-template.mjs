#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const ENV_FILE = getArg("--env") || "env";
const TARGET_TEMPLATE = getArg("--template") || "deity-lite";
const env = readEnv(ENV_FILE);
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const REST_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}`;
const GRAPHQL_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;

const DEITY_COLLECTION_HANDLES = [
  "deity-crowns-1",
  "deity-crowns",
  "deity-stone-crowns",
  "deity-hair-crown",
  "drama-dance-crowns",
  "deity-necklace",
  "deity-short-harams",
  "deity-long-harams",
  "waist-belt-vaddanam-jewellery-for-hindu-gods-goddess-1",
  "deity-earrings-for-god-idols-statues",
  "buy-stone-nathu-bullaku-nose-rings-for-goddess-amman-jewelry",
  "god-deity-pendants",
  "deity-accessories-nose-rings-mustache-weapons-taira",
  "deity-bindi-tilak-thiruman",
  "deity-eyes-for-god-idols-statues",
  "buy-deity-taira-idol-sacred-taira-statues-for-pooja-and-worship",
  "buy-god-mustache-jewellery-deity-mustache-accessories-for-idols",
  "stone-shankh-chakra-gold-plated-shanku-chakra-for-vishnu-and-perumal",
  "god-goddess-weapons",
  "deity-sun-and-moon-jewellery",
  "hands-legs-for-varalakshmi-idol",
  "varalakshmi-doll-faces",
  "vagamalai-thomala",
  "god-goddess-arch",
  "sacred-sanctum-decor",
  "banana-tree-banana-bunches-for-pooja-varamahalakshmi-vratham",
  "lotus-asana-deity-peedam-kamal-aasan",
  "coconut-stand",
  "god-goddess-hair-accessories",
  "god-goddess-cushions",
  "god-goddess-singhasan",
  "deity-god-pustal-tadu-thali-kasulaperu",
  "vara-lakshmi-dolls",
  "deity-god-jewellery",
  "deity-jewelry",
  "deity-jewelry-1",
  "waist-belt-vaddanam-jewellery-for-hindu-gods-goddess",
  "varalakshmi-deity-jewellery",
  "varalakshmi-lakshmi-amman-deity-jewellery",
  "lakshmi-amman-deity-jewellery",
  "balaji-venkateswara-deity-jewellery",
  "krishna-deity-jewellery",
  "ganesh-deity-jewellery",
  "shiva-deity-jewellery",
  "durga-deity-jewellery"
];

if (!SHOP || !TOKEN) {
  console.error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN");
  process.exit(1);
}

function getArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index + 1 >= process.argv.length) return null;
  return process.argv[index + 1];
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

async function rest(path, options = {}) {
  const res = await fetch(`${REST_ENDPOINT}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN,
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(`REST ${options.method || "GET"} ${path}: ${res.status} ${text}`);
  return { body, headers: res.headers };
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

function nextPath(linkHeader) {
  if (!linkHeader) return null;
  const match = linkHeader.match(/<([^>]+)>; rel="next"/);
  if (!match) return null;
  const url = new URL(match[1]);
  return `${url.pathname.replace(`/admin/api/${API_VERSION}`, "")}${url.search}`;
}

async function findCollection(handle) {
  for (const type of ["custom_collections", "smart_collections"]) {
    const { body } = await rest(`/${type}.json?handle=${encodeURIComponent(handle)}&limit=1`);
    if (body[type]?.[0]) return body[type][0];
  }
  return null;
}

async function getCollectionProductIds(collectionId) {
  const ids = new Set();
  let path = `/collections/${collectionId}/products.json?limit=250&fields=id`;
  while (path) {
    const { body, headers } = await rest(path);
    for (const product of body.products || []) ids.add(String(product.id));
    path = nextPath(headers.get("link"));
  }
  return ids;
}

async function getProductsByIds(ids) {
  const products = [];
  for (let index = 0; index < ids.length; index += 100) {
    const batch = ids.slice(index, index + 100).map((id) => `gid://shopify/Product/${id}`);
    const data = await gql(
      `query ProductsById($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on Product {
            id
            legacyResourceId
            handle
            title
            status
            templateSuffix
          }
        }
      }`,
      { ids: batch }
    );
    products.push(...data.nodes.filter(Boolean));
  }
  return products;
}

async function updateProductTemplate(product) {
  if (!APPLY) {
    console.log(`[DRY-RUN UPDATE] ${product.legacyResourceId} ${product.handle}: ${product.templateSuffix || "default"} -> ${TARGET_TEMPLATE}`);
    return;
  }
  await rest(`/products/${product.legacyResourceId}.json`, {
    method: "PUT",
    body: JSON.stringify({
      product: {
        id: product.legacyResourceId,
        template_suffix: TARGET_TEMPLATE
      }
    })
  });
  console.log(`[UPDATED] ${product.legacyResourceId} ${product.handle}: ${product.templateSuffix || "default"} -> ${TARGET_TEMPLATE}`);
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  console.log(`Target product template: ${TARGET_TEMPLATE}`);

  const productIds = new Set();
  for (const handle of DEITY_COLLECTION_HANDLES) {
    const collection = await findCollection(handle);
    if (!collection) {
      console.warn(`[MISSING COLLECTION] ${handle}`);
      continue;
    }
    const ids = await getCollectionProductIds(collection.id);
    console.log(`[COLLECTION] ${handle}: ${ids.size} products`);
    for (const id of ids) productIds.add(id);
  }

  const products = await getProductsByIds([...productIds]);
  const activeProducts = products.filter((product) => product.status === "ACTIVE");
  const toUpdate = activeProducts.filter((product) => product.templateSuffix !== TARGET_TEMPLATE);

  const counts = new Map();
  for (const product of activeProducts) {
    const key = product.templateSuffix || "(default)";
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  console.log("[SUMMARY]");
  console.log(`unique_products=${products.length}`);
  console.log(`active_products=${activeProducts.length}`);
  console.log(`to_update=${toUpdate.length}`);
  for (const [template, count] of [...counts.entries()].sort()) {
    console.log(`template_count ${template}=${count}`);
  }

  for (const product of toUpdate) {
    await updateProductTemplate(product);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
