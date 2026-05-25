#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { analyticsApi, getAnalyticsPropertyId } from "./google-analytics-lib.mjs";

const root = process.cwd();
const OUT_DIR = path.join(root, "tmp", "ucp-revenue-baseline");
const env = readEnv(path.join(root, "env"));
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const GRAPHQL_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;
const DAYS = Number(argValue("--days") || 90);
const propertyId = argValue("--ga4-property") || getAnalyticsPropertyId();

if (!SHOP || !TOKEN) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const targetGroups = loadTargetGroups();
const targetSkus = [...new Set(Object.values(targetGroups).flat())].sort();
const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);
const until = new Date();
const orders = await fetchOrdersSince(since);
const shopifyBaseline = summarizeShopifyOrders(orders, targetSkus, targetGroups);
const ga4Baseline = await tryGa4ItemBaseline(targetSkus);

const baseline = {
  generatedAt: new Date().toISOString(),
  note: "Baseline captured after the first UCP cleanup because the request came immediately after live changes. Use as the post-change starting line for 14/30/90-day comparisons.",
  window: {
    days: DAYS,
    since: since.toISOString(),
    until: until.toISOString()
  },
  targetGroups,
  targetSkus,
  shopify: shopifyBaseline,
  ga4: ga4Baseline
};

fs.writeFileSync(path.join(OUT_DIR, "ucp-revenue-baseline.json"), `${JSON.stringify(baseline, null, 2)}\n`);
fs.writeFileSync(path.join(OUT_DIR, "ucp-revenue-baseline.csv"), toCsv(flattenShopifyRows(shopifyBaseline.bySku)));
writeMarkdown(baseline);

console.log(
  JSON.stringify(
    {
      outputDir: path.relative(root, OUT_DIR),
      targetSkuCount: targetSkus.length,
      shopifyMatchedSkus: shopifyBaseline.skusWithOrders,
      shopifyOrders: shopifyBaseline.totalOrders,
      shopifyQuantity: shopifyBaseline.totalQuantity,
      shopifyRevenue: shopifyBaseline.totalRevenue,
      ga4Status: ga4Baseline.status
    },
    null,
    2
  )
);

function loadTargetGroups() {
  const crownTriage = readJsonIfExists("tmp/crown-ucp-sprint/crown-triage.json", { products: [] });
  const crownBaseline = readJsonIfExists("tmp/crown-ucp-sprint/ucp-baseline.json", []);
  const shortBaseline = readJsonIfExists("tmp/deity-short-necklace-ucp-sprint/ucp-baseline.json", []);
  const longBaseline = readJsonIfExists("tmp/deity-long-haram-ucp-sprint/ucp-baseline.json", []);
  const waistBaseline = readRows(readJsonIfExists("tmp/deity-waist-belt-ucp-sprint/ucp-final.json", { rows: [] }));
  const earringBaseline = readRows(readJsonIfExists("tmp/deity-earrings-ucp-sprint/ucp-after-collection-cleanup-strict.json", { runs: [] }));
  const hasthamPadamBaseline = readRows(readJsonIfExists("tmp/hastham-padam-ucp-sprint/ucp-final-after-description-sync.json", []));
  const varalakshmiFaceBaseline = readRows(readJsonIfExists("tmp/varalakshmi-face-ucp-sprint/ucp-final-after-doll-face-refinement.json", []));
  const shortSynonyms = readJsonIfExists("tmp/deity-short-necklace-ucp-sprint/applied-short-haram-query-synonyms.json", []);
  const longDisambig = readJsonIfExists("tmp/deity-short-necklace-ucp-sprint/applied-long-haram-short-query-disambiguation.json", []);
  const longAltUpdates = readJsonIfExists("tmp/deity-long-haram-ucp-sprint/applied-long-haram-measurement-alt-updates.json", []);
  const waistAltUpdates = readJsonIfExists("tmp/deity-waist-belt-ucp-sprint/applied-waist-belt-measurement-alt-updates.json", []);
  const earringAltUpdates = readJsonIfExists("tmp/deity-earrings-ucp-sprint/applied-earrings-measurement-alt-updates.json", []);
  const hasthamPadamAltUpdates = readJsonIfExists("tmp/hastham-padam-ucp-sprint/applied-hastham-padam-measurement-alt.json", []);
  const anilCapture = readJsonIfExists("tmp/crown-ucp-sprint/anil-crown-capture-list.json", []);

  const crownByVariant = new Map();
  for (const product of crownTriage.products || []) {
    for (const variant of product.variantSummary || []) crownByVariant.set(variant.id, product.sku);
  }

  return {
    crown_ucp_top_results: unique(
      crownBaseline.flatMap((entry) => (entry.results || []).map((result) => crownByVariant.get(result.variant)).filter(Boolean))
    ),
    crown_anil_capture_needed: unique(anilCapture.map((row) => row.sku)),
    short_haram_live_updated: unique(shortSynonyms.map((row) => row.sku)),
    short_haram_ucp_top_results: unique(
      shortBaseline.flatMap((entry) =>
        (entry.results || [])
          .filter((result) => result.isTarget)
          .map((result) => skuFromTitle(result.title))
          .filter(Boolean)
      )
    ),
    long_haram_disambiguated_from_short_query: unique(longDisambig.map((row) => row.sku)),
    long_haram_ucp_top_results: unique(
      longBaseline.flatMap((entry) =>
        (entry.results || [])
          .filter((result) => result.isTarget)
          .map((result) => skuFromTitle(result.title))
          .filter(Boolean)
      )
    ),
    long_haram_proof_hardened: unique(longAltUpdates.map((row) => row.sku)),
    waist_belt_ucp_top_results: ucpSkus(waistBaseline),
    waist_belt_proof_hardened: unique(waistAltUpdates.map((row) => row.sku)),
    deity_earrings_ucp_top_results: ucpSkus(earringBaseline.filter((entry) => !/jhumki/i.test(entry.prompt))),
    deity_earrings_proof_hardened: unique(earringAltUpdates.map((row) => row.sku)),
    hastham_padam_ucp_top_results: ucpSkus(hasthamPadamBaseline),
    hastham_padam_proof_hardened: unique(hasthamPadamAltUpdates.map((row) => row.sku)),
    varalakshmi_face_ucp_top_results: ucpSkus(varalakshmiFaceBaseline)
  };
}

function readRows(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.rows)) return parsed.rows;
  if (Array.isArray(parsed.runs)) return parsed.runs;
  return [];
}

function ucpSkus(rows) {
  return unique(
    rows.flatMap((entry) =>
      (entry.results || [])
        .filter((result) => result.correct ?? result.isTarget ?? !result.isWrong)
        .map((result) => skuFromTitle(result.title))
        .filter(Boolean)
    )
  );
}

async function fetchOrdersSince(sinceDate) {
  const orders = [];
  let after = null;
  const query = `created_at:>=${sinceDate.toISOString().slice(0, 10)}`;
  do {
    const data = await gql(
      `query($after: String, $query: String!) {
        orders(first: 50, after: $after, query: $query, sortKey: CREATED_AT, reverse: true) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            name
            createdAt
            displayFinancialStatus
            currencyCode
            totalPriceSet { shopMoney { amount currencyCode } }
            lineItems(first: 100) {
              nodes {
                title
                sku
                quantity
                discountedTotalSet { shopMoney { amount currencyCode } }
                originalTotalSet { shopMoney { amount currencyCode } }
                variant { id sku }
                product { id handle title }
              }
            }
          }
        }
      }`,
      { after, query }
    );
    const connection = data.orders;
    orders.push(...connection.nodes);
    after = connection.pageInfo.hasNextPage ? connection.pageInfo.endCursor : null;
  } while (after);
  return orders;
}

function summarizeShopifyOrders(orders, targetSkus, targetGroups) {
  const bySku = Object.fromEntries(
    targetSkus.map((sku) => [
      sku,
      {
        sku,
        groups: Object.entries(targetGroups)
          .filter(([, skus]) => skus.includes(sku))
          .map(([group]) => group),
        quantity: 0,
        revenue: 0,
        orderCount: 0,
        orders: []
      }
    ])
  );

  for (const order of orders) {
    const matchedInOrder = new Set();
    for (const lineItem of order.lineItems?.nodes || []) {
      const sku = normalizeSku(lineItem.sku || lineItem.variant?.sku || skuFromTitle(lineItem.title));
      if (!bySku[sku]) continue;
      const revenue = Number(lineItem.discountedTotalSet?.shopMoney?.amount || lineItem.originalTotalSet?.shopMoney?.amount || 0);
      bySku[sku].quantity += Number(lineItem.quantity || 0);
      bySku[sku].revenue += revenue;
      bySku[sku].orders.push({
        orderName: order.name,
        orderId: order.id,
        createdAt: order.createdAt,
        financialStatus: order.displayFinancialStatus,
        title: lineItem.title,
        quantity: Number(lineItem.quantity || 0),
        revenue,
        currency: lineItem.discountedTotalSet?.shopMoney?.currencyCode || order.currencyCode,
        productHandle: lineItem.product?.handle || ""
      });
      matchedInOrder.add(sku);
    }
    for (const sku of matchedInOrder) bySku[sku].orderCount += 1;
  }

  const rows = Object.values(bySku);
  return {
    source: "Shopify Admin Orders API",
    totalOrdersScanned: orders.length,
    totalOrders: new Set(rows.flatMap((row) => row.orders.map((order) => order.orderId))).size,
    totalQuantity: rows.reduce((sum, row) => sum + row.quantity, 0),
    totalRevenue: round2(rows.reduce((sum, row) => sum + row.revenue, 0)),
    skusWithOrders: rows.filter((row) => row.orderCount > 0).length,
    bySku: Object.fromEntries(rows.map((row) => [row.sku, { ...row, revenue: round2(row.revenue) }]))
  };
}

async function tryGa4ItemBaseline(targetSkus) {
  if (!propertyId) return { status: "skipped", reason: "Missing GOOGLE_ANALYTICS_PROPERTY_ID" };
  if (!fs.existsSync(path.join(root, "tmp", "google-analytics-token.json"))) {
    return { status: "skipped", reason: "Missing tmp/google-analytics-token.json" };
  }
  try {
    const body = {
      dateRanges: [{ startDate: `${DAYS}daysAgo`, endDate: "today" }],
      dimensions: [{ name: "itemId" }, { name: "itemName" }],
      metrics: [{ name: "itemsViewed" }, { name: "itemsAddedToCart" }, { name: "itemsPurchased" }, { name: "itemRevenue" }],
      limit: "1000"
    };
    const report = await analyticsApi(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
      method: "POST",
      body: JSON.stringify(body)
    });
    const allRows = (report.rows || []).map((row) => ({
      itemId: row.dimensionValues?.[0]?.value || "",
      itemName: row.dimensionValues?.[1]?.value || "",
      itemsViewed: Number(row.metricValues?.[0]?.value || 0),
      itemsAddedToCart: Number(row.metricValues?.[1]?.value || 0),
      itemsPurchased: Number(row.metricValues?.[2]?.value || 0),
      itemRevenue: Number(row.metricValues?.[3]?.value || 0)
    }));
    const targetSet = new Set(targetSkus);
    const rows = allRows
      .map((row) => ({ ...row, matchedSku: targetSet.has(normalizeSku(row.itemId)) ? normalizeSku(row.itemId) : skuFromTitle(row.itemName) }))
      .filter((row) => targetSet.has(row.matchedSku));
    return { status: "ok", propertyId, request: body, rowCount: report.rowCount || 0, returnedRows: allRows.length, rows };
  } catch (error) {
    return { status: "error", propertyId, reason: error.message };
  }
}

function writeMarkdown(baseline) {
  const lines = [
    "# UCP Sprint Revenue Baseline",
    "",
    `Generated: ${baseline.generatedAt}`,
    "",
    baseline.note,
    "",
    `Window: last ${baseline.window.days} days, ${baseline.window.since} to ${baseline.window.until}.`,
    "",
    "## Summary",
    "",
    `- Target SKUs: ${baseline.targetSkus.length}`,
    `- Shopify orders scanned: ${baseline.shopify.totalOrdersScanned}`,
    `- Target SKU orders: ${baseline.shopify.totalOrders}`,
    `- Target SKU quantity: ${baseline.shopify.totalQuantity}`,
    `- Target SKU revenue: ${baseline.shopify.totalRevenue}`,
    `- GA4 item baseline: ${baseline.ga4.status}${baseline.ga4.reason ? ` (${baseline.ga4.reason})` : ""}`,
    ...(baseline.ga4.status === "ok"
      ? [
          `- GA4 matched item rows: ${baseline.ga4.rows.length}`,
          `- GA4 matched item views: ${sumGa4(baseline.ga4.rows, "itemsViewed")}`,
          `- GA4 matched add-to-carts: ${sumGa4(baseline.ga4.rows, "itemsAddedToCart")}`,
          `- GA4 matched items purchased: ${sumGa4(baseline.ga4.rows, "itemsPurchased")}`,
          `- GA4 matched item revenue: ${round2(sumGa4(baseline.ga4.rows, "itemRevenue"))}`
        ]
      : []),
    "",
    "## Groups",
    "",
    ...Object.entries(baseline.targetGroups).map(([group, skus]) => `- ${group}: ${skus.join(", ") || "-"}`),
    "",
    "## Shopify SKU Rows",
    "",
    "| SKU | Groups | Orders | Quantity | Revenue |",
    "| --- | --- | ---: | ---: | ---: |",
    ...Object.values(baseline.shopify.bySku)
      .sort((a, b) => b.revenue - a.revenue || b.quantity - a.quantity || a.sku.localeCompare(b.sku))
      .map((row) => `| ${row.sku} | ${row.groups.join("; ")} | ${row.orderCount} | ${row.quantity} | ${row.revenue} |`)
  ];
  if (baseline.ga4.status === "ok" && baseline.ga4.rows.length) {
    lines.push(
      "",
      "## GA4 Matched Item Rows",
      "",
      "| SKU | Item name | Views | Add to carts | Purchased | Revenue |",
      "| --- | --- | ---: | ---: | ---: | ---: |",
      ...baseline.ga4.rows
        .slice()
        .sort((a, b) => b.itemsAddedToCart - a.itemsAddedToCart || b.itemRevenue - a.itemRevenue)
        .map(
          (row) =>
            `| ${row.matchedSku} | ${md(row.itemName)} | ${row.itemsViewed} | ${row.itemsAddedToCart} | ${row.itemsPurchased} | ${round2(row.itemRevenue)} |`
        )
    );
  }
  fs.writeFileSync(path.join(OUT_DIR, "ucp-revenue-baseline.md"), `${lines.join("\n")}\n`);
}

async function gql(query, variables = {}) {
  const response = await fetchWithRetry(GRAPHQL_ENDPOINT, {
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

async function fetchWithRetry(url, options, attempts = 3) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetch(url, options);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }
  throw lastError;
}

function flattenShopifyRows(bySku) {
  return Object.values(bySku).map((row) => ({
    sku: row.sku,
    groups: row.groups.join("; "),
    orderCount: row.orderCount,
    quantity: row.quantity,
    revenue: row.revenue
  }));
}

function toCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return `${[headers.join(","), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))].join("\n")}\n`;
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function skuFromTitle(title) {
  const text = String(title || "");
  const knownPrefix = text.match(/\b(DJhandslegs|DWB|DGE|DGC|DSN|DLN|VHL|VDF|VLFACE|VVF)[-\s]?(\d{1,4})\b/i);
  if (knownPrefix) return `${knownPrefix[1].toUpperCase()}${knownPrefix[2].padStart(3, "0")}`;
  const match = text.match(/\b([A-Z]{2,5})[-\s]?(\d{2,4})\b/i);
  return match ? `${match[1].toUpperCase()}${match[2].padStart(3, "0")}` : "";
}

function normalizeSku(value) {
  return skuFromTitle(value) || String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function unique(values) {
  return [...new Set(values.map(normalizeSku).filter(Boolean))].sort();
}

function round2(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function sumGa4(rows, key) {
  return rows.reduce((sum, row) => sum + Number(row[key] || 0), 0);
}

function md(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}

function argValue(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : "";
}

function readJsonIfExists(relativePath, fallback) {
  const filePath = path.join(root, relativePath);
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : fallback;
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
