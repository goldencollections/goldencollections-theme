import fs from "fs";
import path from "path";
import { getMerchantAccountId, listAll, merchantApi, root } from "./merchant-lib.mjs";

const accountId = getMerchantAccountId() || process.argv[2];
if (!accountId) {
  throw new Error("Missing merchant account ID. Set MERCHANT_CENTER_ACCOUNT_ID in env or pass it as the first argument.");
}

const outputPath = path.join(root, "tmp", "merchant-diagnostics.json");
const parent = `accounts/${accountId}`;
const output = {
  created_at: new Date().toISOString(),
  accountId,
  aggregateProductStatuses: null,
  accountIssues: null,
  productSample: null,
  errors: [],
};

async function capture(key, fn) {
  try {
    output[key] = await fn();
  } catch (error) {
    output.errors.push({ key, message: error.message });
  }
}

await capture("aggregateProductStatuses", async () =>
  listAll(`https://merchantapi.googleapis.com/issueresolution/v1/${parent}/aggregateProductStatuses?pageSize=250`, "aggregateProductStatuses"),
);

await capture("accountIssues", async () =>
  listAll(`https://merchantapi.googleapis.com/accounts/v1/${parent}/issues?pageSize=250`, "accountIssues"),
);

await capture("productSample", async () =>
  merchantApi(`https://merchantapi.googleapis.com/products/v1/${parent}/products?pageSize=100`),
);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

const summary = {
  outputPath,
  accountId,
  aggregateStatusCount: output.aggregateProductStatuses?.length || 0,
  accountIssueCount: output.accountIssues?.length || 0,
  productSampleCount: output.productSample?.products?.length || 0,
  errors: output.errors,
  statuses: (output.aggregateProductStatuses || []).map((status) => ({
    name: status.name,
    reportingContext: status.reportingContext,
    countryCode: status.countryCode || status.country,
    statistics: status.statistics || status.stats,
    issueCount: (status.issues || status.itemLevelIssues || []).length,
  })),
};

console.log(JSON.stringify(summary, null, 2));
