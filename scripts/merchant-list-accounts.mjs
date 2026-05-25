import fs from "fs";
import path from "path";
import { listAll, root } from "./merchant-lib.mjs";

const outputPath = path.join(root, "tmp", "merchant-accounts.json");
const accounts = await listAll("https://merchantapi.googleapis.com/accounts/v1/accounts?pageSize=500", "accounts");

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify({ created_at: new Date().toISOString(), accounts }, null, 2));

console.log(
  JSON.stringify(
    accounts.map((account) => ({
      name: account.name,
      accountId: account.accountId,
      accountName: account.accountName,
      adultContent: account.adultContent,
    })),
    null,
    2,
  ),
);
