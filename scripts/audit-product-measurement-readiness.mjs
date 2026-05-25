#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const env = readEnv(path.join(root, "env"));
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const GRAPHQL_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;

const PRODUCT_PAGE_SIZE = Number(argValue("--page-size") || 50);
const IMAGE_LIMIT = Number(argValue("--image-limit") || 100);
const METAFIELD_LIMIT = Number(argValue("--metafield-limit") || 250);
const PRODUCT_LIMIT = Number(argValue("--limit") || 0);
const OUTPUT_FILE =
  argValue("--output") ||
  path.join(
    "knowledge-base",
    "outputs",
    `shopify-product-proof-measurement-readiness-audit-${today()}.md`,
  );

const MEASUREMENT_RE = /\b(measure|measurement|measurements|ruler|scale|size|sizing|inch|inches|in\.|cm|centimeter|centimetre|height|width|length|dimension|dimensions)\b/i;
const PHOTO_MEASUREMENT_RE =
  /\b(refer|see|check|review|view|look)\b[\s\S]{0,120}\b(photo|photos|image|images|picture|pictures|measurement|measurements|size|sizes|dimension|dimensions|height|width|length)\b/i;
const MEASUREMENT_PHOTO_RE =
  /\b(photo|photos|image|images|picture|pictures|measurement|measurements|size|sizes|dimension|dimensions|height|width|length)\b[\s\S]{0,120}\b(refer|see|check|review|view|shown|listed|provided|available)\b/i;
const DIMENSION_VALUE_RE = /\b(height|width|length|size|dimension|dimensions|measurement|measurements)\b[\s\S]{0,80}\b(\d+(?:\.\d+)?\s?(?:cm|inch|inches|in\.|"))\b/i;

if (!SHOP || !TOKEN) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
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
      }),
  );
}

function argValue(name) {
  return process.argv.find((arg) => arg.startsWith(`${name}=`))?.split("=").slice(1).join("=");
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function gql(query, variables = {}) {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : null;
  if (!response.ok || json?.errors) {
    throw new Error(`GraphQL HTTP ${response.status}: ${text.slice(0, 1000)}`);
  }
  await waitForThrottle(json.extensions?.cost?.throttleStatus);
  return json.data;
}

async function waitForThrottle(status) {
  if (!status) return;
  const { currentlyAvailable, restoreRate } = status;
  if (currentlyAvailable == null || restoreRate == null || currentlyAvailable >= 250) return;
  const waitMs = Math.ceil(((250 - currentlyAvailable) / restoreRate) * 1000);
  await new Promise((resolve) => setTimeout(resolve, Math.min(Math.max(waitMs, 500), 5000)));
}

async function fetchActiveProducts() {
  const products = [];
  let cursor = null;
  do {
    const remaining = PRODUCT_LIMIT ? PRODUCT_LIMIT - products.length : PRODUCT_PAGE_SIZE;
    const first = PRODUCT_LIMIT ? Math.min(PRODUCT_PAGE_SIZE, remaining) : PRODUCT_PAGE_SIZE;
    if (first <= 0) break;

    const data = await gql(
      `query Products($cursor: String, $first: Int!, $imageLimit: Int!, $metafieldLimit: Int!) {
        products(first: $first, after: $cursor, query: "status:active", sortKey: ID) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            legacyResourceId
            title
            handle
            status
            onlineStoreUrl
            productType
            vendor
            descriptionHtml
            images(first: $imageLimit) {
              pageInfo { hasNextPage }
              nodes {
                id
                altText
                url
              }
            }
            metafields(first: $metafieldLimit) {
              pageInfo { hasNextPage }
              nodes {
                id
                namespace
                key
                type
                value
              }
            }
          }
        }
      }`,
      { cursor, first, imageLimit: IMAGE_LIMIT, metafieldLimit: METAFIELD_LIMIT },
    );

    products.push(...data.products.nodes);
    cursor = data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor : null;
    console.error(`Fetched ${products.length} active products...`);
  } while (cursor && (!PRODUCT_LIMIT || products.length < PRODUCT_LIMIT));
  return products;
}

function imageFilename(url) {
  if (!url) return "";
  try {
    return decodeURIComponent(path.posix.basename(new URL(url).pathname));
  } catch {
    return url.split("/").pop() || "";
  }
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function snippet(text, regex) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  const match = clean.match(regex);
  if (!match) return "";
  const index = Math.max(0, match.index - 60);
  const end = Math.min(clean.length, match.index + match[0].length + 60);
  return `${index > 0 ? "..." : ""}${clean.slice(index, end)}${end < clean.length ? "..." : ""}`;
}

function classify(product) {
  const measurementMetafields = product.metafields.nodes.filter((metafield) => {
    const haystack = `${metafield.namespace}.${metafield.key} ${metafield.type} ${metafield.value}`;
    return MEASUREMENT_RE.test(haystack);
  });

  const measurementImages = product.images.nodes
    .map((image) => ({
      id: image.id,
      altText: image.altText || "",
      filename: imageFilename(image.url),
      url: image.url,
    }))
    .filter((image) => MEASUREMENT_RE.test(`${image.altText} ${image.filename}`));

  const descriptionText = stripHtml(product.descriptionHtml);
  const descriptionSignal =
    PHOTO_MEASUREMENT_RE.test(descriptionText) ||
    MEASUREMENT_PHOTO_RE.test(descriptionText) ||
    DIMENSION_VALUE_RE.test(descriptionText);

  const signals = {
    metafield: measurementMetafields.length > 0,
    image: measurementImages.length > 0,
    description: descriptionSignal,
  };

  return {
    id: product.id,
    legacyResourceId: product.legacyResourceId,
    title: product.title,
    handle: product.handle,
    status: product.status,
    onlineStoreUrl: product.onlineStoreUrl || `https://www.goldencollections.com/products/${product.handle}`,
    productType: product.productType || "",
    vendor: product.vendor || "",
    imageCount: product.images.nodes.length,
    imageLimitReached: product.images.pageInfo.hasNextPage,
    metafieldCount: product.metafields.nodes.length,
    metafieldLimitReached: product.metafields.pageInfo.hasNextPage,
    measurementMetafields: measurementMetafields.map((metafield) => ({
      namespace: metafield.namespace,
      key: metafield.key,
      type: metafield.type,
      valuePreview: String(metafield.value || "").slice(0, 160),
    })),
    measurementImages: measurementImages.map((image) => ({
      altText: image.altText,
      filename: image.filename,
    })),
    descriptionSignal,
    descriptionSnippet: descriptionSignal
      ? snippet(descriptionText, PHOTO_MEASUREMENT_RE) ||
        snippet(descriptionText, MEASUREMENT_PHOTO_RE) ||
        snippet(descriptionText, DIMENSION_VALUE_RE)
      : "",
    signals,
    signalCount: Object.values(signals).filter(Boolean).length,
  };
}

function mdEscape(value) {
  return String(value ?? "")
    .replace(/\r?\n/g, " ")
    .replace(/\|/g, "\\|")
    .trim();
}

function markdownTable(rows, columns) {
  if (!rows.length) return "_None found._\n";
  return [
    `| ${columns.map((column) => column.label).join(" | ")} |`,
    `| ${columns.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${columns.map((column) => mdEscape(column.value(row))).join(" | ")} |`),
  ].join("\n");
}

function signalLabels(row) {
  return [
    row.signals.metafield ? "metafield" : "",
    row.signals.image ? "image" : "",
    row.signals.description ? "description" : "",
  ]
    .filter(Boolean)
    .join(", ");
}

function countBy(rows, keyFn) {
  const counts = new Map();
  for (const row of rows) {
    const key = keyFn(row) || "(blank)";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, count]) => ({ label, count }));
}

function buildReport(rows) {
  const withMetafields = rows.filter((row) => row.signals.metafield);
  const withImages = rows.filter((row) => row.signals.image);
  const withDescription = rows.filter((row) => row.signals.description);
  const missingSignals = rows.filter((row) => row.signalCount === 0);
  const limitRows = rows.filter((row) => row.imageLimitReached || row.metafieldLimitReached);
  const outputLimit = Number(argValue("--report-row-limit") || 300);
  const cap = (items) => items.slice(0, outputLimit);

  const summaryRows = [
    ["Active products audited", rows.length],
    ["Products with measurement-related metafields", withMetafields.length],
    ["Products with measurement/ruler/size image alt text or filename signals", withImages.length],
    ["Products whose description points buyers to photos/measurements", withDescription.length],
    ["Products with at least one readiness signal", rows.filter((row) => row.signalCount > 0).length],
    ["Products missing all audited signals", missingSignals.length],
    ["Products where image/metafield pagination limit was reached", limitRows.length],
  ];

  const productColumns = [
    { label: "Product", value: (row) => `[${row.title}](${row.onlineStoreUrl})` },
    { label: "Handle", value: (row) => row.handle },
    { label: "Signals", value: signalLabels },
  ];

  const imageColumns = [
    { label: "Product", value: (row) => `[${row.title}](${row.onlineStoreUrl})` },
    { label: "Handle", value: (row) => row.handle },
    {
      label: "Image matches",
      value: (row) =>
        row.measurementImages
          .map((image) => image.altText || image.filename)
          .slice(0, 3)
          .join("; "),
    },
  ];

  const metafieldColumns = [
    { label: "Product", value: (row) => `[${row.title}](${row.onlineStoreUrl})` },
    { label: "Handle", value: (row) => row.handle },
    {
      label: "Metafields",
      value: (row) =>
        row.measurementMetafields
          .map((metafield) => `${metafield.namespace}.${metafield.key}`)
          .slice(0, 5)
          .join("; "),
    },
  ];

  const descriptionColumns = [
    { label: "Product", value: (row) => `[${row.title}](${row.onlineStoreUrl})` },
    { label: "Handle", value: (row) => row.handle },
    { label: "Copy signal", value: (row) => row.descriptionSnippet },
  ];

  const missingColumns = [
    { label: "Product", value: (row) => `[${row.title}](${row.onlineStoreUrl})` },
    { label: "Handle", value: (row) => row.handle },
    { label: "Type", value: (row) => row.productType },
  ];

  const typeColumns = [
    { label: "Product type", value: (row) => row.label },
    { label: "Missing-signal products", value: (row) => row.count },
  ];

  return `# Shopify Product Proof / Measurement Readiness Audit

Created: ${new Date().toISOString()}

Scope: read-only Shopify Admin API scan of ACTIVE products using API version \`${API_VERSION}\`.

Limits: product pagination fetched ${PRODUCT_LIMIT ? `the first ${PRODUCT_LIMIT}` : "all returned"} ACTIVE products. Per product, the script requested up to ${IMAGE_LIMIT} images and ${METAFIELD_LIMIT} metafields. ${limitRows.length ? `${limitRows.length} product(s) hit a per-product pagination limit and may need a deeper follow-up.` : "No product hit the per-product image/metafield pagination limit."}

Signals audited:

- Measurement-related product metafields: namespace, key, type, or value matching measurement/ruler/size/inches/cm/height/width/length/dimensions terms.
- Product image alt text or filename matching measurement/ruler/size/inches/cm/height/width/length/dimensions terms.
- Product description copy that references buyer-facing photos/images/measurements/sizes/dimensions, or includes explicit dimension values.

## Summary

| Metric | Count |
| --- | ---: |
${summaryRows.map(([label, count]) => `| ${label} | ${count} |`).join("\n")}

## Products With Any Readiness Signal

${markdownTable(cap(rows.filter((row) => row.signalCount > 0)), productColumns)}
${rows.filter((row) => row.signalCount > 0).length > outputLimit ? `\n_Table capped at ${outputLimit} rows._\n` : ""}

## Measurement-Related Metafields

${markdownTable(cap(withMetafields), metafieldColumns)}
${withMetafields.length > outputLimit ? `\n_Table capped at ${outputLimit} rows._\n` : ""}

## Measurement / Ruler / Size Image Signals

${markdownTable(cap(withImages), imageColumns)}
${withImages.length > outputLimit ? `\n_Table capped at ${outputLimit} rows._\n` : ""}

## Description / Copy Signals

${markdownTable(cap(withDescription), descriptionColumns)}
${withDescription.length > outputLimit ? `\n_Table capped at ${outputLimit} rows._\n` : ""}

## Products Missing All Audited Signals

### Product Type Breakdown

${markdownTable(countBy(missingSignals, (row) => row.productType), typeColumns)}

### Product List

${markdownTable(cap(missingSignals), missingColumns)}
${missingSignals.length > outputLimit ? `\n_Table capped at ${outputLimit} rows._\n` : ""}

## Products Hitting Per-Product Limits

${markdownTable(
  limitRows,
  [
    { label: "Product", value: (row) => `[${row.title}](${row.onlineStoreUrl})` },
    { label: "Handle", value: (row) => row.handle },
    { label: "Image limit reached", value: (row) => row.imageLimitReached },
    { label: "Metafield limit reached", value: (row) => row.metafieldLimitReached },
  ],
)}
`;
}

const products = await fetchActiveProducts();
const rows = products.map(classify);
const report = buildReport(rows);

fs.mkdirSync(path.dirname(path.join(root, OUTPUT_FILE)), { recursive: true });
fs.writeFileSync(path.join(root, OUTPUT_FILE), report);

const summary = {
  outputFile: OUTPUT_FILE,
  activeProductsAudited: rows.length,
  withMeasurementMetafields: rows.filter((row) => row.signals.metafield).length,
  withMeasurementImageSignals: rows.filter((row) => row.signals.image).length,
  withDescriptionSignals: rows.filter((row) => row.signals.description).length,
  withAnySignal: rows.filter((row) => row.signalCount > 0).length,
  missingAllSignals: rows.filter((row) => row.signalCount === 0).length,
  productsHittingPerProductLimits: rows.filter((row) => row.imageLimitReached || row.metafieldLimitReached).length,
};

console.log(JSON.stringify(summary, null, 2));
