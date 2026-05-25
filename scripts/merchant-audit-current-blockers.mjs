#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ENV_FILE = "env";
const ISSUE_FILE = "tmp/merchant-product-issues.json";
const OUTPUT_JSON = "tmp/merchant-current-blocker-audit.json";
const OUTPUT_CSV = "tmp/merchant-current-blocker-audit.csv";

const env = readEnv(ENV_FILE);
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const REST = `https://${SHOP}/admin/api/${API_VERSION}`;

if (!SHOP || !TOKEN) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
}

const issueExport = JSON.parse(fs.readFileSync(ISSUE_FILE, "utf8"));

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
      }),
  );
}

function parseOfferId(offerId) {
  const match = offerId.match(/^shopify_[A-Z]{2}_(\d+)_(\d+)$/);
  if (!match) return null;
  return { productId: match[1], variantId: match[2] };
}

function csvValue(value) {
  const string = value == null ? "" : String(value);
  return `"${string.replace(/"/g, '""')}"`;
}

function issueRows(severity, issueCode, attribute) {
  const rows = issueExport.rows.filter(
    (row) =>
      row.severity === severity &&
      row.issueCode === issueCode &&
      (attribute ? row.attribute === attribute : true),
  );
  const unique = new Map();
  for (const row of rows) {
    if (!unique.has(row.offerId)) unique.set(row.offerId, row);
  }
  return [...unique.values()];
}

async function shopifyRest(pathname) {
  const response = await fetch(`${REST}${pathname}`, {
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN,
    },
  });
  const text = await response.text();
  if (!response.ok) {
    return { error: `HTTP ${response.status}: ${text.slice(0, 500)}` };
  }
  return JSON.parse(text);
}

const productCache = new Map();
async function getProduct(productId) {
  if (!productCache.has(productId)) {
    productCache.set(productId, shopifyRest(`/products/${productId}.json`));
  }
  return productCache.get(productId);
}

async function classify(row, family) {
  const parsed = parseOfferId(row.offerId);
  const base = {
    family,
    offerId: row.offerId,
    sku: row.sku,
    merchantTitle: row.title,
    merchantLink: row.link,
    merchantImageLink: row.imageLink,
    merchantAvailability: row.availability,
    merchantPrice: row.price,
    issueCode: row.issueCode,
    severity: row.severity,
    attribute: row.attribute,
    parsedShopifyOffer: Boolean(parsed),
    productId: parsed?.productId || "",
    variantId: parsed?.variantId || "",
  };

  if (!parsed) {
    return { ...base, classification: "non_shopify_offer_id", recommendedAction: "Remove or exclude stale non-Shopify offer from the active Merchant feed source." };
  }

  const productData = await getProduct(parsed.productId);
  if (productData.error) {
    return { ...base, shopifyError: productData.error, classification: "shopify_product_unavailable", recommendedAction: "Remove stale offer from feed source or restore the Shopify product if it should be live." };
  }

  const product = productData.product;
  const variant = product.variants.find((item) => String(item.id) === parsed.variantId);
  const variantImage = variant?.image_id ? product.images.find((image) => String(image.id) === String(variant.image_id)) : null;
  const firstImage = product.images[0] || null;
  const status = product.status;

  let classification = "needs_feed_source_review";
  let recommendedAction = "Compare Shopify and feed source values before writing to Merchant Center.";

  if (family === "missing_image") {
    if (status === "draft" && product.images.length === 0) {
      classification = "draft_product_without_images";
      recommendedAction = "Keep draft/no-image product out of the active Merchant feed until real product images exist.";
    } else if (!variant) {
      classification = "stale_variant_offer";
      recommendedAction = "Remove stale variant offer from the feed source or resync the Shopify Google channel.";
    } else if (firstImage && !variant.image_id) {
      classification = "variant_has_no_image_assignment";
      recommendedAction = "Assign a confirmed product image to the variant in Shopify/feed source.";
    }
  }

  if (family === "landing_page") {
    if (status === "draft") {
      classification = "draft_product_in_feed";
      recommendedAction = "Keep draft product out of the active Merchant feed until it is published and crawlable.";
    } else if (!variant) {
      classification = "stale_variant_landing_url";
      recommendedAction = "Remove stale variant offer or resync the Shopify Google channel so Merchant stops using the old variant URL.";
    } else if (!product.published_at) {
      classification = "active_but_unpublished_product";
      recommendedAction = "Publish product to Online Store/Google channel if it should sell; otherwise exclude it from Merchant.";
    }
  }

  if (family === "price_mismatch") {
    const shopifyPrice = variant?.price || "";
    classification = shopifyPrice && row.price && !row.price.startsWith(shopifyPrice)
      ? "merchant_price_differs_from_shopify"
      : "merchant_price_matches_current_shopify_or_needs_currency_check";
    recommendedAction = "Force feed/source resync for this offer, then recheck Merchant diagnostics before editing product copy.";
  }

  if (family === "availability_updated") {
    const shopifyAvailability = variant ? (Number(variant.inventory_quantity) > 0 || product.status === "active" ? "review_inventory_policy" : "out_of_stock") : "missing_variant";
    classification = variant ? "availability_sync_review" : "stale_variant_offer";
    recommendedAction = "Compare Shopify inventory policy, stock, and feed availability; resync source rather than editing Merchant directly.";
    base.shopifyAvailabilityHint = shopifyAvailability;
  }

  return {
    ...base,
    productHandle: product.handle,
    productStatus: status,
    publishedAt: product.published_at || "",
    imageCount: product.images.length,
    variantExists: Boolean(variant),
    variantSku: variant?.sku || "",
    variantPrice: variant?.price || "",
    variantInventoryQuantity: variant?.inventory_quantity ?? "",
    variantInventoryPolicy: variant?.inventory_policy || "",
    variantImageId: variant?.image_id || "",
    variantImageSrc: variantImage?.src || "",
    firstImageSrc: firstImage?.src || "",
    classification,
    recommendedAction,
  };
}

const targets = [
  ["missing_image", "DISAPPROVED", "item_missing_required_attribute", "image link"],
  ["landing_page", "DISAPPROVED", "landing_page_error", "link"],
  ["price_mismatch", "DISAPPROVED", "price_mismatch", "price"],
  ["availability_updated", "NOT_IMPACTED", "availability_updated", "availability"],
];

const rows = [];
for (const [family, severity, issueCode, attribute] of targets) {
  for (const row of issueRows(severity, issueCode, attribute)) {
    rows.push(await classify(row, family));
  }
}

const summary = {};
for (const row of rows) {
  const key = `${row.family}:${row.classification}`;
  summary[key] = (summary[key] || 0) + 1;
}

const output = {
  created_at: new Date().toISOString(),
  sourceIssueFile: ISSUE_FILE,
  productCount: issueExport.productCount,
  issueRowCount: issueExport.issueRowCount,
  summary,
  rows,
};

fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
fs.writeFileSync(OUTPUT_JSON, JSON.stringify(output, null, 2));

const headers = [
  "family",
  "classification",
  "recommendedAction",
  "offerId",
  "sku",
  "variantSku",
  "productHandle",
  "productStatus",
  "publishedAt",
  "imageCount",
  "variantExists",
  "merchantPrice",
  "variantPrice",
  "merchantAvailability",
  "variantInventoryQuantity",
  "variantInventoryPolicy",
  "merchantLink",
];
fs.writeFileSync(
  OUTPUT_CSV,
  [headers.join(","), ...rows.map((row) => headers.map((header) => csvValue(row[header])).join(","))].join("\n"),
);

console.log(JSON.stringify({ outputJson: OUTPUT_JSON, outputCsv: OUTPUT_CSV, rowCount: rows.length, summary }, null, 2));
