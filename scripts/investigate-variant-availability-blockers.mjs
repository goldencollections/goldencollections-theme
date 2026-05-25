#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "tmp", "variant-blocker-investigation");
const env = readEnv(path.join(root, "env"));
const shop = env.SHOPIFY_STORE_DOMAIN;
const token = env.SHOPIFY_ADMIN_TOKEN;
const apiVersion = env.SHOPIFY_API_VERSION || "2025-10";
const endpoint = `https://${shop}/admin/api/${apiVersion}/graphql.json`;
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const business = "https://www.goldencollections.com";
const apply = process.argv.includes("--apply");

const targets = [
  { sku: "DGE009", preferredSku: "DGE009-2" },
  { sku: "DGE013", preferredSku: "DGE013-2" },
  { sku: "VHL013", preferredSku: "VHL013-1" },
  { sku: "VDF031", preferredSku: "VDF0311" }
];

if (!shop || !token) throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");

fs.mkdirSync(outDir, { recursive: true });

const before = await inspectTargets();
const plan = before.map(planProduct);
const beforePath = path.join(outDir, `variant-blockers-before-${dateLabel()}.json`);
fs.writeFileSync(beforePath, `${JSON.stringify({ generatedAt: new Date().toISOString(), targets: before, plan }, null, 2)}\n`);
console.log(`Wrote ${path.relative(root, beforePath)}`);

if (apply) {
  for (const item of plan) {
    if (!item.actionable) {
      console.log(`Skip ${item.sku}: ${item.reason}`);
      continue;
    }
    console.log(`Reorder ${item.sku}: ${item.preferredSku} -> position 1`);
    await reorderProduct(item.productId, item.positions);
  }

  const after = await inspectTargets();
  const afterPath = path.join(outDir, `variant-blockers-after-${dateLabel()}.json`);
  fs.writeFileSync(afterPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), targets: after }, null, 2)}\n`);
  console.log(`Wrote ${path.relative(root, afterPath)}`);
}

async function inspectTargets() {
  const products = [];
  for (const target of targets) {
    const product = await fetchProductBySku(target.sku);
    const variants = product.variants.nodes.map((variant, index) => ({
      index: index + 1,
      id: variant.id,
      legacyResourceId: variant.legacyResourceId,
      sku: variant.sku,
      availableForSale: variant.availableForSale,
      inventoryQuantity: variant.inventoryQuantity,
      price: variant.price,
      selectedOptions: variant.selectedOptions
    }));
    const first = variants[0];
    const preferred = variants.find((variant) => variant.sku === target.preferredSku);
    products.push({
      sku: target.sku,
      preferredSku: target.preferredSku,
      productId: product.id,
      title: product.title,
      handle: product.handle,
      status: product.status,
      productType: product.productType,
      totalInventory: product.totalInventory,
      firstVariant: first,
      preferredVariant: preferred || null,
      variants,
      ucp: {
        firstVariant: getProduct(first.id),
        preferredVariant: preferred ? getProduct(preferred.id) : null
      }
    });
  }
  return products;
}

function planProduct(product) {
  if (!product.preferredVariant) {
    return { sku: product.sku, actionable: false, reason: `preferred SKU ${product.preferredSku} not found` };
  }
  if (!product.preferredVariant.availableForSale) {
    return { sku: product.sku, actionable: false, reason: `preferred SKU ${product.preferredSku} is unavailable` };
  }
  if (product.firstVariant.id === product.preferredVariant.id) {
    return { sku: product.sku, actionable: false, reason: "preferred variant is already first" };
  }
  const ordered = [
    product.preferredVariant,
    ...product.variants.filter((variant) => variant.id !== product.preferredVariant.id)
  ];
  return {
    sku: product.sku,
    productId: product.productId,
    actionable: true,
    reason: "first/default variant is unavailable while an in-stock measured variant exists",
    preferredSku: product.preferredSku,
    preferredVariantId: product.preferredVariant.id,
    oldFirstSku: product.firstVariant.sku,
    oldFirstVariantId: product.firstVariant.id,
    positions: ordered.map((variant, index) => ({ id: variant.id, position: index + 1 }))
  };
}

async function fetchProductBySku(sku) {
  const data = await gql(
    `query ProductBySku($query: String!) {
      products(first: 1, query: $query) {
        nodes {
          id
          title
          handle
          status
          productType
          totalInventory
          variants(first: 100) {
            nodes {
              id
              legacyResourceId
              sku
              availableForSale
              inventoryQuantity
              price
              selectedOptions { name value }
            }
          }
        }
      }
    }`,
    { query: `sku:${sku}` }
  );
  const product = data.products.nodes[0];
  if (!product) throw new Error(`No product found for ${sku}`);
  return product;
}

async function reorderProduct(productId, positions) {
  const data = await gql(
    `mutation ReorderVariants($productId: ID!, $positions: [ProductVariantPositionInput!]!) {
      productVariantsBulkReorder(productId: $productId, positions: $positions) {
        product { id title }
        userErrors { field message }
      }
    }`,
    { productId, positions }
  );
  const errors = data.productVariantsBulkReorder.userErrors || [];
  if (errors.length) throw new Error(`productVariantsBulkReorder ${productId}: ${JSON.stringify(errors)}`);
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
    throw new Error(`GraphQL HTTP ${response.status}: ${text.slice(0, 1200)}`);
  }
  await waitForThrottle(json.extensions?.cost?.throttleStatus);
  return json.data;
}

function getProduct(variantId) {
  try {
    const output = execFileSync(
      npx,
      [
        "@shopify/ucp-cli",
        "catalog",
        "get_product",
        variantId,
        "--business",
        business,
        "--refresh",
        "--format",
        "json",
        "--filter-output",
        "result.product.title,result.product.url,result.product.options,result.product.selected,result.product.price_range,result.product.collections,result.product.media",
        "--token-limit",
        "5000"
      ],
      { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], shell: process.platform === "win32" }
    );
    const product = JSON.parse(output).result?.product || {};
    return {
      title: product.title || "",
      url: product.url || "",
      selected: product.selected || [],
      options: product.options || [],
      selectedAvailabilityIssues: selectedAvailabilityIssues(product),
      priceRange: product.price_range || null,
      mediaCount: (product.media || []).length
    };
  } catch (error) {
    return { error: String(error.stdout || error.stderr || error.message || "unknown error").slice(0, 1200) };
  }
}

function selectedAvailabilityIssues(product) {
  const issues = [];
  const options = product.options || [];
  const selected = product.selected || [];
  for (const selectedOption of selected) {
    const matching = options.find((option) => option.name === selectedOption.name);
    const selectedValue = selectedOption.value || selectedOption.label || "";
    const availableValues = new Set(
      (matching?.values || []).filter((value) => value.available).map((value) => value.value || value.label)
    );
    if (availableValues.size && !availableValues.has(selectedValue)) {
      issues.push(`${selectedOption.name}: selected '${selectedValue}' currently unavailable`);
    }
  }
  return issues;
}

async function waitForThrottle(status) {
  if (!status) return;
  const { currentlyAvailable, restoreRate } = status;
  if (currentlyAvailable == null || restoreRate == null || currentlyAvailable >= 250) return;
  const waitMs = Math.ceil(((250 - currentlyAvailable) / restoreRate) * 1000);
  await new Promise((resolve) => setTimeout(resolve, Math.min(Math.max(waitMs, 500), 5000)));
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

function dateLabel() {
  return new Date().toISOString().slice(0, 10);
}
