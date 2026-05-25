import fs from "fs";
import path from "path";
import { readEnv, root, searchConsoleApi } from "./search-console-lib.mjs";

const env = readEnv();
const siteUrl = env.SEARCH_CONSOLE_SITE_URL || "https://www.goldencollections.com/";
const urls = [
  "https://www.goldencollections.com/",
  "https://www.goldencollections.com/pages/about-us",
  "https://www.goldencollections.com/pages/anil-tunk",
  "https://www.goldencollections.com/pages/jewelry-glossary",
  "https://www.goldencollections.com/pages/golden-collections-knowledge-hub",
  "https://www.goldencollections.com/pages/lakshmi-varalakshmi-deity-jewellery-guide",
  "https://www.goldencollections.com/pages/balaji-vishnu-perumal-deity-jewellery-guide",
  "https://www.goldencollections.com/pages/ganesha-deity-crown-ornament-guide",
  "https://www.goldencollections.com/pages/krishna-deity-jewellery-guide",
  "https://www.goldencollections.com/pages/amman-devi-alankaram-jewellery-guide",
  "https://www.goldencollections.com/pages/how-golden-collections-checks-deity-jewellery-fit",
];

const outputPath = path.join(root, "tmp", "search-console-authority-url-inspection.json");

async function inspectUrl(inspectionUrl) {
  return searchConsoleApi("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
    method: "POST",
    body: JSON.stringify({
      inspectionUrl,
      siteUrl,
      languageCode: "en-US",
    }),
  });
}

const results = [];

for (const url of urls) {
  try {
    const result = await inspectUrl(url);
    const indexStatusResult = result.inspectionResult?.indexStatusResult || {};
    results.push({
      url,
      status: "ok",
      verdict: indexStatusResult.verdict || null,
      coverageState: indexStatusResult.coverageState || null,
      robotsTxtState: indexStatusResult.robotsTxtState || null,
      indexingState: indexStatusResult.indexingState || null,
      pageFetchState: indexStatusResult.pageFetchState || null,
      googleCanonical: indexStatusResult.googleCanonical || null,
      userCanonical: indexStatusResult.userCanonical || null,
      lastCrawlTime: indexStatusResult.lastCrawlTime || null,
      raw: result,
    });
  } catch (error) {
    results.push({
      url,
      status: "error",
      error: error.message,
    });
  }
}

const output = {
  created_at: new Date().toISOString(),
  siteUrl,
  note: "Search Console URL Inspection API does not provide a general request-indexing action for normal Shopify pages. Use this output to confirm status, then request indexing manually in the Search Console UI if needed.",
  results,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(
  JSON.stringify(
    {
      outputPath,
      siteUrl,
      results: results.map(({ url, status, verdict, coverageState, indexingState, pageFetchState, lastCrawlTime, error }) => ({
        url,
        status,
        verdict,
        coverageState,
        indexingState,
        pageFetchState,
        lastCrawlTime,
        error,
      })),
    },
    null,
    2,
  ),
);
