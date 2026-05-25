import fs from "fs";
import path from "path";
import { root } from "./merchant-lib.mjs";

const diagnosticsPath = path.join(root, "tmp", "merchant-diagnostics.json");
const issuePath = path.join(root, "tmp", "merchant-product-issues.json");
const outputPath = path.join(root, "knowledge-base", "outputs", "merchant-center-diagnostics-2026-05-14.md");

if (!fs.existsSync(diagnosticsPath)) {
  throw new Error("Missing tmp/merchant-diagnostics.json. Run merchant-diagnostics-read.mjs first.");
}

if (!fs.existsSync(issuePath)) {
  throw new Error("Missing tmp/merchant-product-issues.json. Run merchant-export-product-issues.mjs first.");
}

const diagnostics = JSON.parse(fs.readFileSync(diagnosticsPath, "utf8"));
const issueExport = JSON.parse(fs.readFileSync(issuePath, "utf8"));

function contextSummary() {
  const contexts = {};
  for (const status of diagnostics.aggregateProductStatuses || []) {
    const context = status.reportingContext || "UNKNOWN";
    const stats = status.statistics || status.stats || {};
    contexts[context] ||= {
      countryCount: 0,
      countries: new Set(),
      activeMax: 0,
      disapprovedMax: 0,
      expiringMax: 0,
    };
    if (status.countryCode || status.country) contexts[context].countries.add(status.countryCode || status.country);
    contexts[context].activeMax = Math.max(contexts[context].activeMax, Number(stats.activeCount || 0));
    contexts[context].disapprovedMax = Math.max(contexts[context].disapprovedMax, Number(stats.disapprovedCount || 0));
    contexts[context].expiringMax = Math.max(contexts[context].expiringMax, Number(stats.expiringCount || 0));
  }

  return Object.entries(contexts).map(([context, value]) => ({
    context,
    countryCount: value.countries.size,
    activeMax: value.activeMax,
    disapprovedMax: value.disapprovedMax,
    expiringMax: value.expiringMax,
  }));
}

function issueSummary() {
  const byIssue = new Map();
  for (const row of issueExport.rows || []) {
    const key = `${row.severity}:${row.issueCode}`;
    const item = byIssue.get(key) || {
      severity: row.severity,
      issueCode: row.issueCode,
      attribute: row.attribute,
      description: row.description,
      uniqueOffers: new Set(),
      rows: 0,
      samples: [],
    };
    item.rows += 1;
    item.uniqueOffers.add(row.offerId);
    if (item.samples.length < 3 && !item.samples.some((sample) => sample.offerId === row.offerId)) {
      item.samples.push({ offerId: row.offerId, sku: row.sku, title: row.title });
    }
    byIssue.set(key, item);
  }

  const severityRank = { DISAPPROVED: 0, DEMOTED: 1, NOT_IMPACTED: 2 };
  return [...byIssue.values()]
    .map((item) => ({ ...item, uniqueOffers: item.uniqueOffers.size }))
    .sort((a, b) => (severityRank[a.severity] ?? 9) - (severityRank[b.severity] ?? 9) || b.uniqueOffers - a.uniqueOffers);
}

const contexts = contextSummary();
const issues = issueSummary();
const disapproved = issues.filter((issue) => issue.severity === "DISAPPROVED");
const demoted = issues.filter((issue) => issue.severity === "DEMOTED");
const notImpacted = issues.filter((issue) => issue.severity === "NOT_IMPACTED");

const lines = [
  "# Merchant Center Diagnostics - 2026-05-14",
  "",
  "Backlinks: [[../wiki/merchant-center-workflow.md]], [[../wiki/product-upload-workflow.md]], [[../wiki/collection-optimization-playbook.md]]",
  "",
  "## Summary",
  "",
  `- Merchant account: \`${diagnostics.accountId}\` / Golden Collections.`,
  `- Products read through Merchant API: \`${issueExport.productCount}\`.`,
  `- Product issue rows exported: \`${issueExport.issueRowCount}\`.`,
  `- Aggregate status rows: \`${diagnostics.aggregateProductStatuses?.length || 0}\`.`,
  `- Account-level issues: \`${diagnostics.accountIssues?.length || 0}\`.`,
  `- Script errors: \`${diagnostics.errors?.length || 0}\`.`,
  "",
  "No account-level issue was returned by the Merchant API. The current work is product/feed quality.",
  "",
  "## Visibility Contexts",
  "",
  "| Context | Countries | Active Max | Disapproved Max | Expiring Max |",
  "| --- | ---: | ---: | ---: | ---: |",
  ...contexts.map((context) => `| ${context.context} | ${context.countryCount} | ${context.activeMax} | ${context.disapprovedMax} | ${context.expiringMax} |`),
  "",
  "## Top Product Issues",
  "",
  "| Severity | Issue | Attribute | Unique Offers | Description |",
  "| --- | --- | --- | ---: | --- |",
  ...issues
    .slice(0, 20)
    .map((issue) => `| ${issue.severity} | ${issue.issueCode} | ${issue.attribute || ""} | ${issue.uniqueOffers} | ${issue.description || ""} |`),
  "",
  "## Fix Priority",
  "",
  "1. Fix disapproved products with missing product images first. This affects 112 unique offers and directly blocks visibility.",
  "2. Fix product page unavailable errors next. This affects 22 unique offers and usually means unpublished/deleted products, redirect problems, or crawler access problems.",
  "3. Fix price mismatch products. The hard disapproval affects 3 unique offers, while automatic price updates indicate a larger feed/store sync issue.",
  "4. Fix availability mismatch products. Automatic availability updates affect 74 unique offers and should be cleaned at the Shopify/feed source.",
  "5. Fix age group values only after checking the feed source. Missing or invalid age group affects many products but is usually less urgent than disapprovals.",
  "6. Improve image quality and image size after the blocking issues. This includes clean non-watermarked Merchant images where needed.",
  "7. Review likely policy false positives such as alcohol, live animals, identity/belief, and local requirements. These look like classification problems for deity/dance products and may need title/category cleanup plus review requests.",
  "",
  "## Files",
  "",
  "- Raw diagnostics: `C:\\goldencollections-theme\\tmp\\merchant-diagnostics.json`",
  "- Product issue JSON: `C:\\goldencollections-theme\\tmp\\merchant-product-issues.json`",
  "- Product issue CSV: `C:\\goldencollections-theme\\tmp\\merchant-product-issues.csv`",
  "",
  "## Next Step",
  "",
  "Use the product issue CSV to fix the first batch of missing images and product page unavailable errors at the Shopify/feed source. Do not use Merchant API product writes until the current feed source and Shopify Google app behavior are fully understood.",
  "",
  "## Issue Samples",
  "",
];

for (const issue of [...disapproved.slice(0, 8), ...demoted.slice(0, 2), ...notImpacted.slice(0, 5)]) {
  lines.push(`### ${issue.severity}: ${issue.issueCode}`);
  lines.push("");
  lines.push(`- Attribute: \`${issue.attribute || "none"}\``);
  lines.push(`- Unique offers: \`${issue.uniqueOffers}\``);
  lines.push(`- Description: ${issue.description || ""}`);
  for (const sample of issue.samples) {
    lines.push(`- Sample: \`${sample.offerId}\`${sample.sku ? ` / SKU \`${sample.sku}\`` : ""} / ${sample.title}`);
  }
  lines.push("");
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${lines.join("\n").trim()}\n`);

console.log(JSON.stringify({ outputPath, issueTypes: issues.length, disapproved: disapproved.length, demoted: demoted.length, notImpacted: notImpacted.length }, null, 2));
