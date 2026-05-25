import fs from "fs";
import path from "path";
import { readEnv, root, searchConsoleApi } from "./search-console-lib.mjs";

const env = readEnv();
const siteUrl = env.SEARCH_CONSOLE_SITE_URL || "sc-domain:goldencollections.com";
const outputPath = path.join(root, "tmp", "search-console-page2-goldmine.json");

const end = new Date();
end.setDate(end.getDate() - 3);
const start = new Date(end);
start.setDate(start.getDate() - 90);

function iso(date) {
  return date.toISOString().slice(0, 10);
}

const payload = {
  startDate: env.SEARCH_CONSOLE_START_DATE || iso(start),
  endDate: env.SEARCH_CONSOLE_END_DATE || iso(end),
  dimensions: ["query", "page"],
  rowLimit: Number(env.SEARCH_CONSOLE_ROW_LIMIT || 25000),
  startRow: 0,
};

const encodedSite = encodeURIComponent(siteUrl);
const result = await searchConsoleApi(`https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`, {
  method: "POST",
  body: JSON.stringify(payload),
});

const rows = (result.rows || [])
  .map((row) => ({
    query: row.keys?.[0],
    page: row.keys?.[1],
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
  }))
  .filter((row) => row.position >= 8 && row.position <= 25 && row.impressions >= 20)
  .sort((a, b) => b.impressions - a.impressions);

const output = {
  created_at: new Date().toISOString(),
  siteUrl,
  request: payload,
  rows,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(JSON.stringify({ outputPath, count: rows.length, top: rows.slice(0, 20) }, null, 2));
