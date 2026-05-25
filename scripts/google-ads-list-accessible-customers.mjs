import fs from "fs";
import path from "path";
import { googleAdsApi, root } from "./google-ads-lib.mjs";

const outputPath = path.join(root, "tmp", "google-ads-accessible-customers.json");
const data = await googleAdsApi("/v20/customers:listAccessibleCustomers", { method: "GET" });

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify({ created_at: new Date().toISOString(), ...data }, null, 2));

console.log(JSON.stringify(data, null, 2));
