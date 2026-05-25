import fs from "fs";
import path from "path";
import { root, searchConsoleApi } from "./search-console-lib.mjs";

const outputPath = path.join(root, "tmp", "search-console-sites.json");
const result = await searchConsoleApi("https://www.googleapis.com/webmasters/v3/sites");

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

console.log(
  JSON.stringify(
    (result.siteEntry || []).map((site) => ({
      siteUrl: site.siteUrl,
      permissionLevel: site.permissionLevel,
    })),
    null,
    2,
  ),
);
