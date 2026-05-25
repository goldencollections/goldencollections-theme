import fs from "fs";
import path from "path";
import { getMerchantAccountId, listAll, root } from "./merchant-lib.mjs";

const accountId = getMerchantAccountId() || process.argv[2] || "767542510";
const outputJsonPath = path.join(root, "tmp", "merchant-product-issues.json");
const outputCsvPath = path.join(root, "tmp", "merchant-product-issues.csv");
const parent = `accounts/${accountId}`;

const products = await listAll(`https://merchantapi.googleapis.com/products/v1/${parent}/products?pageSize=1000`, "products");

function attr(product, name) {
  return product.customAttributes?.find((item) => item.name === name)?.value || "";
}

function money(price) {
  if (!price?.amountMicros) return "";
  return `${Number(price.amountMicros) / 1000000} ${price.currencyCode || ""}`.trim();
}

function csvValue(value) {
  const string = value == null ? "" : String(value);
  return `"${string.replace(/"/g, '""')}"`;
}

const rows = [];
for (const product of products) {
  const productAttributes = product.productAttributes || {};
  const issues = product.productStatus?.itemLevelIssues || [];
  for (const issue of issues) {
    rows.push({
      offerId: product.offerId,
      sku: attr(product, "sku"),
      title: productAttributes.title || "",
      link: productAttributes.link || "",
      imageLink: productAttributes.imageLink || "",
      availability: productAttributes.availability || "",
      price: money(productAttributes.price),
      dataSource: product.dataSource || "",
      contentLanguage: product.contentLanguage || "",
      feedLabel: product.feedLabel || "",
      issueCode: issue.code || "",
      severity: issue.severity || "",
      attribute: issue.attribute || "",
      description: issue.description || "",
      detail: issue.detail || "",
      documentationUri: issue.documentationUri || "",
    });
  }
}

const issueCounts = rows.reduce((counts, row) => {
  const key = `${row.severity}:${row.issueCode}`;
  counts[key] = (counts[key] || 0) + 1;
  return counts;
}, {});

const csvHeaders = [
  "offerId",
  "sku",
  "title",
  "link",
  "imageLink",
  "availability",
  "price",
  "dataSource",
  "contentLanguage",
  "feedLabel",
  "issueCode",
  "severity",
  "attribute",
  "description",
  "detail",
  "documentationUri",
];

fs.mkdirSync(path.dirname(outputJsonPath), { recursive: true });
fs.writeFileSync(
  outputJsonPath,
  JSON.stringify(
    {
      created_at: new Date().toISOString(),
      accountId,
      productCount: products.length,
      issueRowCount: rows.length,
      issueCounts,
      rows,
    },
    null,
    2,
  ),
);
fs.writeFileSync(
  outputCsvPath,
  [
    csvHeaders.join(","),
    ...rows.map((row) => csvHeaders.map((header) => csvValue(row[header])).join(",")),
  ].join("\n"),
);

console.log(
  JSON.stringify(
    {
      accountId,
      productCount: products.length,
      issueRowCount: rows.length,
      issueCounts,
      outputJsonPath,
      outputCsvPath,
    },
    null,
    2,
  ),
);
