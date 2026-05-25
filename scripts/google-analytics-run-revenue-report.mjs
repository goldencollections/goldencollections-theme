import fs from "fs";
import path from "path";
import { analyticsApi, getAnalyticsPropertyId, root } from "./google-analytics-lib.mjs";

const propertyId = getAnalyticsPropertyId() || process.argv[2];
if (!propertyId) {
  throw new Error("Missing GA4 property ID. Set GOOGLE_ANALYTICS_PROPERTY_ID in env or pass it as the first argument.");
}

const outputPath = path.join(root, "tmp", "google-analytics-revenue-report.json");
const body = {
  dateRanges: [{ startDate: process.env.GOOGLE_ANALYTICS_START_DATE || "90daysAgo", endDate: process.env.GOOGLE_ANALYTICS_END_DATE || "yesterday" }],
  dimensions: [{ name: "landingPagePlusQueryString" }, { name: "sessionDefaultChannelGroup" }],
  metrics: [
    { name: "sessions" },
    { name: "totalUsers" },
    { name: "transactions" },
    { name: "purchaseRevenue" },
    { name: "totalRevenue" },
  ],
  orderBys: [{ metric: { metricName: "purchaseRevenue" }, desc: true }],
  limit: "1000",
};

const report = await analyticsApi(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
  method: "POST",
  body: JSON.stringify(body),
});

const rows = (report.rows || []).map((row) => ({
  landingPagePlusQueryString: row.dimensionValues?.[0]?.value || "",
  sessionDefaultChannelGroup: row.dimensionValues?.[1]?.value || "",
  sessions: Number(row.metricValues?.[0]?.value || 0),
  totalUsers: Number(row.metricValues?.[1]?.value || 0),
  transactions: Number(row.metricValues?.[2]?.value || 0),
  purchaseRevenue: Number(row.metricValues?.[3]?.value || 0),
  totalRevenue: Number(row.metricValues?.[4]?.value || 0),
}));

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(
  outputPath,
  JSON.stringify(
    {
      created_at: new Date().toISOString(),
      propertyId,
      request: body,
      rowCount: report.rowCount,
      rows,
      raw: report,
    },
    null,
    2,
  ),
);

console.log(
  JSON.stringify(
    {
      outputPath,
      propertyId,
      rowCount: report.rowCount,
      returnedRows: rows.length,
      topRows: rows.slice(0, 20),
    },
    null,
    2,
  ),
);
