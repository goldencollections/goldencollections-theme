import fs from "fs";
import path from "path";
import { googleAdsApi, readEnv, root } from "./google-ads-lib.mjs";

const env = readEnv();
const customerId = (process.argv[2] || env.GOOGLE_ADS_CUSTOMER_ID || "").replaceAll("-", "");
if (!customerId) {
  throw new Error("Missing Google Ads customer ID. Set GOOGLE_ADS_CUSTOMER_ID in env or pass it as the first argument.");
}

const outputPath = path.join(root, "tmp", "google-ads-shopping-readiness.json");
const query = `
  SELECT
    customer.id,
    customer.descriptive_name,
    customer.currency_code,
    customer.status,
    campaign.id,
    campaign.name,
    campaign.status,
    campaign.advertising_channel_type,
    metrics.impressions,
    metrics.clicks,
    metrics.cost_micros,
    metrics.conversions,
    metrics.conversions_value
  FROM campaign
  WHERE campaign.advertising_channel_type IN ('SHOPPING', 'PERFORMANCE_MAX')
    AND segments.date DURING LAST_30_DAYS
  ORDER BY metrics.cost_micros DESC
  LIMIT 100
`;

const data = await googleAdsApi(`/v20/customers/${customerId}/googleAds:search`, {
  method: "POST",
  body: JSON.stringify({ query }),
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify({ created_at: new Date().toISOString(), customerId, query, data }, null, 2));

console.log(
  JSON.stringify(
    {
      outputPath,
      customerId,
      rowCount: data.results?.length || 0,
      rows: data.results || [],
    },
    null,
    2,
  ),
);
