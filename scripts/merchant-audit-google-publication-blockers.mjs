import fs from "node:fs";
import path from "node:path";
import { readEnv, root } from "./meta-lib.mjs";

const GOOGLE_YOUTUBE_PUBLICATION_ID = "gid://shopify/Publication/158476632362";
const TARGET_CLASSIFICATIONS = new Set([
  "draft_product_without_images",
  "draft_product_in_feed",
  "stale_variant_offer",
  "availability_sync_review",
  "merchant_price_matches_current_shopify_or_needs_currency_check",
]);

const env = readEnv();
const shop = env.SHOPIFY_STORE_DOMAIN;
const token = env.SHOPIFY_ADMIN_TOKEN;
const apiVersion = env.SHOPIFY_API_VERSION || "2025-10";

if (!shop || !token) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN");
}

const auditPath = path.join(root, "tmp", "merchant-current-blocker-audit.json");
if (!fs.existsSync(auditPath)) {
  throw new Error("Missing tmp/merchant-current-blocker-audit.json. Run merchant-audit-current-blockers.mjs first.");
}

const audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));
const rows = audit.rows || [];
const targetRows = rows.filter((row) => TARGET_CLASSIFICATIONS.has(row.classification));
const productIds = [...new Set(targetRows.map((row) => row.productId).filter(Boolean))];

const products = [];
for (const chunk of chunks(productIds, 100)) {
  const ids = chunk.map((id) => `gid://shopify/Product/${id}`);
  const data = await shopifyGql(
    `
    query ProductNodes($ids: [ID!]!, $publicationId: ID!) {
      nodes(ids: $ids) {
        ... on Product {
          id
          legacyResourceId
          title
          handle
          status
          publishedAt
          onlineStoreUrl
          publishedOnPublication(publicationId: $publicationId)
          featuredMedia { preview { image { url } } }
          variants(first: 25) {
            nodes {
              id
              legacyResourceId
              sku
              price
              availableForSale
              inventoryQuantity
            }
          }
        }
      }
    }
  `,
    { ids, publicationId: GOOGLE_YOUTUBE_PUBLICATION_ID },
  );
  products.push(...(data.nodes || []).filter(Boolean));
}

const byProductId = new Map(products.map((product) => [String(product.legacyResourceId), product]));
const enrichedRows = targetRows.map((row) => {
  const product = byProductId.get(String(row.productId));
  const variant = product?.variants?.nodes?.find((candidate) => String(candidate.legacyResourceId) === String(row.variantId));

  return {
    family: row.family,
    offerId: row.offerId,
    classification: row.classification,
    recommendedAction: row.recommendedAction,
    merchantTitle: row.merchantTitle,
    productId: row.productId,
    variantId: row.variantId,
    sku: row.sku,
    productHandle: row.productHandle,
    merchantAvailability: row.merchantAvailability,
    merchantPrice: row.merchantPrice,
    shopify: product
      ? {
          title: product.title,
          handle: product.handle,
          status: product.status,
          publishedAt: product.publishedAt,
          onlineStoreUrl: product.onlineStoreUrl,
          publishedOnGoogleYouTube: Boolean(product.publishedOnPublication),
          hasFeaturedImage: Boolean(product.featuredMedia?.preview?.image?.url),
          variantFound: Boolean(variant),
          variantSku: variant?.sku || null,
          variantPrice: variant?.price || null,
          variantAvailableForSale: variant?.availableForSale ?? null,
          variantInventoryQuantity: variant?.inventoryQuantity ?? null,
        }
      : null,
  };
});

const summary = {
  checked_at: new Date().toISOString(),
  source_issue_file: "tmp/merchant-current-blocker-audit.json",
  google_publication_id: GOOGLE_YOUTUBE_PUBLICATION_ID,
  target_row_count: targetRows.length,
  unique_product_count: productIds.length,
  shopify_products_found: products.length,
  by_classification: groupCount(enrichedRows, (row) => row.classification),
  by_classification_and_google_publication: groupCount(
    enrichedRows,
    (row) => `${row.classification}:${row.shopify?.publishedOnGoogleYouTube ? "published" : "not_published"}`,
  ),
  by_shopify_status: groupCount(enrichedRows, (row) => row.shopify?.status || "missing_product"),
  rows_missing_shopify_product: enrichedRows.filter((row) => !row.shopify).length,
  rows_published_on_google: enrichedRows.filter((row) => row.shopify?.publishedOnGoogleYouTube).length,
  draft_rows_published_on_google: enrichedRows.filter(
    (row) => row.shopify?.status === "DRAFT" && row.shopify?.publishedOnGoogleYouTube,
  ).length,
  stale_variant_rows_with_missing_variant: enrichedRows.filter(
    (row) => row.classification === "stale_variant_offer" && row.shopify?.variantFound === false,
  ).length,
};

const report = { summary, rows: enrichedRows };
const outPath = path.join(root, "tmp", `shopify-google-publication-blocker-audit-${localDate()}.json`);
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

console.log(JSON.stringify({ outputPath: outPath, summary }, null, 2));

function chunks(values, size) {
  const result = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

function groupCount(values, keyFn) {
  const counts = {};
  for (const value of values) {
    const key = keyFn(value);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

function localDate() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

async function shopifyGql(query, variables = {}) {
  const res = await fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) {
    throw new Error(`Shopify GraphQL error: ${JSON.stringify(json.errors || json)}`);
  }
  return json.data;
}
