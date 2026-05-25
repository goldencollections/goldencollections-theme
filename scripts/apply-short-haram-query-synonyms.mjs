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

const SYNONYMS = [
  "deity short haram",
  "short haram for god idol",
  "short haram for goddess idol",
  "god idol short haram",
  "goddess idol short haram"
];

if (!SHOP || !TOKEN) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const targets = loadTargets();
const preview = [];

for (const target of targets) {
  const product = await fetchProduct(target.handle);
  if (!product) continue;

  const ornamentType = product.metafieldOrnamentType?.value || "";
  if (!/short necklace/i.test(ornamentType)) {
    preview.push({ ...target, skipped: true, reason: `Ornament type is not Short Necklace: ${ornamentType}` });
    continue;
  }

  const current = parseListMetafield(product.metafieldRegionalNames?.value);
  const next = distinct([...current, ...SYNONYMS]);
  const added = next.filter((value) => !current.includes(value));
  const row = {
    productId: product.id,
    handle: product.handle,
    title: product.title,
    sku: target.sku,
    promptEvidence: target.promptEvidence,
    ornamentType,
    added,
    before: current,
    after: next
  };
  preview.push(row);

  if (APPLY && added.length) {
    await metafieldsSet([
      {
        ownerId: product.id,
        namespace: "custom",
        key: "regional_names",
        type: "list.single_line_text_field",
        value: JSON.stringify(next)
      }
    ]);
    console.log(`Updated regional names: ${target.sku} ${product.handle}`);
  }
}

const output = path.join(OUT_DIR, APPLY ? "applied-short-haram-query-synonyms.json" : "short-haram-query-synonyms-preview.json");
fs.writeFileSync(output, `${JSON.stringify(preview, null, 2)}\n`);
console.log(`${APPLY ? "Applied" : "Previewed"} ${preview.filter((row) => !row.skipped && row.added?.length).length} short-haram synonym updates.`);
console.log(`Wrote ${path.relative(root, output)}`);

function loadTargets() {
  const triage = readJson(path.join(OUT_DIR, "short-necklace-triage.json"));
  const baseline = readJson(path.join(OUT_DIR, "ucp-baseline.json"));
  const products = triage.products || [];
  const byVariant = new Map();
  for (const product of products) {
    for (const variant of product.variantSummary || []) byVariant.set(variant.id, product);
  }

  const seen = new Map();
  for (const entry of baseline) {
    for (const result of entry.results || []) {
      const product = byVariant.get(result.variant) || products.find((candidate) => candidate.title === result.title);
      if (!product || result.isWrongType) continue;
      if (!/short necklace/i.test(product.productType || "")) continue;
      if (!seen.has(product.id)) {
        seen.set(product.id, {
          id: product.id,
          handle: product.handle,
          title: product.title,
          sku: product.sku,
          promptEvidence: []
        });
      }
      seen.get(product.id).promptEvidence.push(`${entry.prompt} rank ${result.rank}`);
    }
  }

  return [...seen.values()].sort((a, b) => a.sku.localeCompare(b.sku));
}

async function fetchProduct(handle) {
  const data = await gql(
    `query($handle: String!) {
      productByHandle(handle: $handle) {
        id
        handle
        title
        metafieldRegionalNames: metafield(namespace: "custom", key: "regional_names") {
          type
          value
        }
        metafieldOrnamentType: metafield(namespace: "custom", key: "ornament_type") {
          value
        }
      }
    }`,
    { handle }
  );
  return data.productByHandle;
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

function parseListMetafield(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
  } catch {
    return [];
  }
}

function distinct(values) {
  return [...new Set(values.map((value) => String(value).trim()).filter(Boolean))];
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
