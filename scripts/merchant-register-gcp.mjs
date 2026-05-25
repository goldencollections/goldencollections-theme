import fs from "fs";
import path from "path";
import { getMerchantAccountId, merchantApi, readEnv, root } from "./merchant-lib.mjs";

const env = readEnv();
const accountId = getMerchantAccountId() || process.argv[2];
const developerEmail = env.MERCHANT_CENTER_DEVELOPER_EMAIL || process.argv[3] || "goldencollections9@gmail.com";

if (!accountId) {
  throw new Error("Missing merchant account ID. Set MERCHANT_CENTER_ACCOUNT_ID in env or pass it as the first argument.");
}

if (!developerEmail) {
  throw new Error("Missing developer email. Set MERCHANT_CENTER_DEVELOPER_EMAIL in env or pass it as the second argument.");
}

const outputPath = path.join(root, "tmp", "merchant-registration.json");
const registration = await merchantApi(
  `https://merchantapi.googleapis.com/accounts/v1/accounts/${accountId}/developerRegistration:registerGcp`,
  {
    method: "POST",
    body: JSON.stringify({ developerEmail }),
  },
);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(
  outputPath,
  JSON.stringify(
    {
      created_at: new Date().toISOString(),
      accountId,
      developerEmail,
      registration,
    },
    null,
    2,
  ),
);

console.log(
  JSON.stringify(
    {
      outputPath,
      accountId,
      developerEmail,
      name: registration.name,
      gcpIds: registration.gcpIds,
    },
    null,
    2,
  ),
);
