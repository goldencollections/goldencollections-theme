import fs from "node:fs";
import path from "node:path";
import { getMerchantAccountId, listAll, merchantApi, root } from "./merchant-lib.mjs";

const APPLY = process.argv.includes("--apply");
const accountArg = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
const accountId = getMerchantAccountId() || accountArg || "767542510";
const sourceIssuePath = path.join(root, "tmp", "merchant-product-issues.json");
const sourceAuditPath = path.join(root, "tmp", "shopify-google-publication-blocker-audit-2026-05-17.json");

if (!fs.existsSync(sourceIssuePath)) {
  throw new Error("Missing tmp/merchant-product-issues.json. Run merchant-export-product-issues.mjs first.");
}
if (!fs.existsSync(sourceAuditPath)) {
  throw new Error("Missing tmp/shopify-google-publication-blocker-audit-2026-05-17.json. Run merchant-audit-google-publication-blockers.mjs first.");
}

const issueRows = JSON.parse(fs.readFileSync(sourceIssuePath, "utf8")).rows || [];
const auditRows = JSON.parse(fs.readFileSync(sourceAuditPath, "utf8")).rows || [];
const merchantProducts = await listAll(`https://merchantapi.googleapis.com/products/v1/accounts/${accountId}/products?pageSize=1000`, "products");
const issueByOffer = new Map();
for (const row of issueRows) {
  if (!issueByOffer.has(row.offerId)) issueByOffer.set(row.offerId, row);
}
const productByOfferAndSource = new Map();
for (const product of merchantProducts) {
  if (!product.offerId || !product.dataSource || !product.name) continue;
  productByOfferAndSource.set(`${product.offerId}|${product.dataSource}`, product);
}

const candidates = [];
for (const row of auditRows) {
  const issue = issueByOffer.get(row.offerId);
  if (!issue?.dataSource || !issue.contentLanguage || !issue.feedLabel) continue;

  const safeDraftRemoval =
    ["draft_product_without_images", "draft_product_in_feed"].includes(row.classification) &&
    row.shopify?.status === "DRAFT" &&
    row.shopify?.publishedOnGoogleYouTube === false;
  const safeStaleVariantRemoval = row.shopify?.variantFound === false;

  if (!safeDraftRemoval && !safeStaleVariantRemoval) continue;

  candidates.push({
    productInputId: productInputIdFor(issue, row),
    offerId: row.offerId,
    classification: row.classification,
    dataSource: issue.dataSource,
    merchantTitle: row.merchantTitle,
    shopifyStatus: row.shopify?.status || null,
    publishedOnGoogleYouTube: row.shopify?.publishedOnGoogleYouTube ?? null,
    variantFound: row.shopify?.variantFound ?? null,
  });
}

const deduped = [...new Map(candidates.map((candidate) => [`${candidate.productInputId}|${candidate.dataSource}`, candidate])).values()];
const results = [];

if (APPLY) {
  for (const candidate of deduped) {
    const url = new URL(
      `https://merchantapi.googleapis.com/products/v1/accounts/${accountId}/productInputs/${encodeURIComponent(candidate.productInputId)}`,
    );
    url.searchParams.set("dataSource", candidate.dataSource);

    try {
      await merchantApi(url.toString(), { method: "DELETE" });
      results.push({ ...candidate, status: "deleted" });
    } catch (error) {
      results.push({ ...candidate, status: "error", error: error.message });
    }
  }
}

const summary = {
  created_at: new Date().toISOString(),
  apply: APPLY,
  accountId,
  sourceIssueFile: "tmp/merchant-product-issues.json",
  sourceAuditFile: "tmp/shopify-google-publication-blocker-audit-2026-05-17.json",
  candidateCount: candidates.length,
  dedupedCandidateCount: deduped.length,
  byClassification: groupCount(deduped, (candidate) => candidate.classification),
  resultCounts: APPLY ? groupCount(results, (result) => result.status) : {},
};

const output = {
  summary,
  candidates: APPLY ? results : deduped,
};
const outPath = path.join(
  root,
  "tmp",
  `merchant-invalid-feed-offer-delete-${localDate()}-${runStamp()}${APPLY ? "-applied" : "-dry-run"}.json`,
);
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log(JSON.stringify({ outputPath: outPath, summary }, null, 2));

function groupCount(values, keyFn) {
  const counts = {};
  for (const value of values) {
    const key = keyFn(value);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

function productInputIdFor(issue, row) {
  const product = productByOfferAndSource.get(`${row.offerId}|${issue.dataSource}`);
  if (product?.name) {
    return product.name.split("/").pop();
  }
  return `${issue.contentLanguage}~${issue.feedLabel}~${row.offerId}`;
}

function localDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function runStamp() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.hour}${byType.minute}${byType.second}`;
}
