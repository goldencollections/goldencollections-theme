import fs from "fs";
import path from "path";
import { googleAdsApi, readEnv, root } from "./google-ads-lib.mjs";

const env = readEnv();
const managerCustomerId = (process.argv[2] || env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || env.GOOGLE_ADS_CUSTOMER_ID || "").replaceAll("-", "");
if (!managerCustomerId) {
  throw new Error("Missing manager customer ID. Set GOOGLE_ADS_LOGIN_CUSTOMER_ID/GOOGLE_ADS_CUSTOMER_ID in env or pass it as the first argument.");
}

const outputPath = path.join(root, "tmp", "google-ads-customer-clients.json");
const query = `
  SELECT
    customer_client.client_customer,
    customer_client.descriptive_name,
    customer_client.currency_code,
    customer_client.time_zone,
    customer_client.status,
    customer_client.manager,
    customer_client.level,
    customer_client.hidden
  FROM customer_client
  WHERE customer_client.level <= 1
  ORDER BY customer_client.level, customer_client.descriptive_name
`;

const data = await googleAdsApi(`/v20/customers/${managerCustomerId}/googleAds:search`, {
  method: "POST",
  body: JSON.stringify({ query }),
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify({ created_at: new Date().toISOString(), managerCustomerId, query, data }, null, 2));

console.log(
  JSON.stringify(
    {
      outputPath,
      managerCustomerId,
      rowCount: data.results?.length || 0,
      rows: (data.results || []).map((row) => row.customerClient),
    },
    null,
    2,
  ),
);
