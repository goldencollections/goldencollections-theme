import fs from "fs";

const ENV_FILE = "env";
const ISSUE_FILE = "tmp/merchant-product-issues.json";
const OUTPUT_FILE = "tmp/merchant-missing-image-shopify-audit.json";
const LIMIT = Number(process.argv.find((arg) => arg.startsWith("--limit="))?.split("=")[1] || 0);

const env = Object.fromEntries(
  fs.readFileSync(ENV_FILE, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, "")];
    }),
);

const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const REST = `https://${SHOP}/admin/api/${API_VERSION}`;

if (!SHOP || !TOKEN) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
}

const issueExport = JSON.parse(fs.readFileSync(ISSUE_FILE, "utf8"));

function parseOfferId(offerId) {
  const match = offerId.match(/^shopify_[A-Z]{2}_(\d+)_(\d+)$/);
  if (!match) return null;
  return { productId: match[1], variantId: match[2] };
}

async function shopifyRest(pathname) {
  const res = await fetch(`${REST}${pathname}`, {
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN,
    },
  });
  const text = await res.text();
  if (!res.ok) {
    return { error: `HTTP ${res.status}: ${text.slice(0, 500)}` };
  }
  return JSON.parse(text);
}

const missingImageRows = issueExport.rows.filter(
  (row) => row.severity === "DISAPPROVED" && row.issueCode === "item_missing_required_attribute" && row.attribute === "image link",
);

const unique = new Map();
for (const row of missingImageRows) {
  if (!unique.has(row.offerId)) unique.set(row.offerId, row);
}

const rows = [];
for (const row of [...unique.values()].slice(0, LIMIT || undefined)) {
  const parsed = parseOfferId(row.offerId);
  if (!parsed) {
    rows.push({
      offerId: row.offerId,
      sku: row.sku,
      title: row.title,
      shopifyOfferParsed: false,
      note: "Offer ID is not in Shopify country/product/variant format.",
    });
    continue;
  }

  const productData = await shopifyRest(`/products/${parsed.productId}.json`);
  if (productData.error) {
    rows.push({
      offerId: row.offerId,
      sku: row.sku,
      title: row.title,
      ...parsed,
      shopifyOfferParsed: true,
      shopifyError: productData.error,
    });
    continue;
  }

  const product = productData.product;
  const variant = product.variants.find((item) => String(item.id) === parsed.variantId);
  const firstImage = product.images[0] || null;
  const variantImage = variant?.image_id ? product.images.find((image) => String(image.id) === String(variant.image_id)) : null;

  rows.push({
    offerId: row.offerId,
    sku: row.sku || variant?.sku || "",
    title: row.title,
    link: row.link,
    ...parsed,
    shopifyOfferParsed: true,
    productHandle: product.handle,
    productStatus: product.status,
    publishedAt: product.published_at,
    imageCount: product.images.length,
    firstImageId: firstImage?.id || null,
    firstImageSrc: firstImage?.src || "",
    variantExists: Boolean(variant),
    variantImageId: variant?.image_id || null,
    variantImageSrc: variantImage?.src || "",
    canLikelyFixByVariantImage: Boolean(variant && firstImage && !variant.image_id),
  });
}

fs.writeFileSync(
  OUTPUT_FILE,
  JSON.stringify(
    {
      created_at: new Date().toISOString(),
      totalMissingImageOffers: unique.size,
      auditedOffers: rows.length,
      likelyVariantImageFixes: rows.filter((row) => row.canLikelyFixByVariantImage).length,
      noProductImages: rows.filter((row) => row.shopifyOfferParsed && !row.imageCount).length,
      rows,
    },
    null,
    2,
  ),
);

console.log(
  JSON.stringify(
    {
      outputFile: OUTPUT_FILE,
      totalMissingImageOffers: unique.size,
      auditedOffers: rows.length,
      likelyVariantImageFixes: rows.filter((row) => row.canLikelyFixByVariantImage).length,
      noProductImages: rows.filter((row) => row.shopifyOfferParsed && !row.imageCount).length,
    },
    null,
    2,
  ),
);
