import fs from "fs";
import path from "path";
import { listAll, root } from "./google-analytics-lib.mjs";

const outputPath = path.join(root, "tmp", "google-analytics-properties.json");
const accountSummaries = await listAll("https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200", "accountSummaries");

const properties = [];
for (const account of accountSummaries) {
  for (const property of account.propertySummaries || []) {
    properties.push({
      account: account.account,
      accountName: account.displayName,
      property: property.property,
      propertyId: property.property?.replace("properties/", ""),
      displayName: property.displayName,
      propertyType: property.propertyType,
      parent: property.parent,
    });
  }
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify({ created_at: new Date().toISOString(), accountSummaries, properties }, null, 2));

console.log(JSON.stringify(properties, null, 2));
