import fs from "fs";
import path from "path";
import { googleApi, root } from "./google-gbp-lib.mjs";

const outputPath = path.join(root, "tmp", "google-gbp-accounts-locations.json");

const accountsResponse = await googleApi("https://mybusinessaccountmanagement.googleapis.com/v1/accounts");
const accounts = accountsResponse.accounts || [];

const result = [];
for (const account of accounts) {
  const locationsUrl = new URL(`https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations`);
  locationsUrl.searchParams.set("readMask", "name,title,storefrontAddress,websiteUri,metadata");
  locationsUrl.searchParams.set("pageSize", "100");

  let locations = [];
  try {
    const locationsResponse = await googleApi(locationsUrl.toString());
    locations = locationsResponse.locations || [];
  } catch (error) {
    locations = [{ error: error.message }];
  }

  result.push({
    account,
    locations,
  });
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

console.log(
  JSON.stringify(
    result.map((item) => ({
      accountName: item.account.name,
      accountTitle: item.account.accountName,
      locations: item.locations.map((location) => ({
        name: location.name,
        title: location.title,
        websiteUri: location.websiteUri,
        error: location.error,
      })),
    })),
    null,
    2,
  ),
);
