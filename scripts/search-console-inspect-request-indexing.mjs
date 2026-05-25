import fs from "fs";
import path from "path";
import { getAccessToken, readEnv, root, searchConsoleApi } from "./search-console-lib.mjs";

const urls = [
  "https://www.goldencollections.com/",
  "https://www.goldencollections.com/pages/about-us",
  "https://www.goldencollections.com/pages/anil-tunk",
  "https://www.goldencollections.com/pages/jewelry-glossary",
];

const env = readEnv();
const siteUrl = env.SEARCH_CONSOLE_SITE_URL || "sc-domain:goldencollections.com";
const outputPath = path.join(root, "tmp", "search-console-url-inspection-indexing.json");

async function indexingApi(accessToken, url) {
  const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, type: "URL_UPDATED" }),
  });

  const text = await res.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  return {
    ok: res.ok,
    status: res.status,
    statusText: res.statusText,
    body,
  };
}

const accessToken = await getAccessToken();
const results = [];

for (const url of urls) {
  const item = { url };

  try {
    const inspection = await searchConsoleApi("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
      method: "POST",
      body: JSON.stringify({
        inspectionUrl: url,
        siteUrl,
      }),
    });
    item.urlInspection = {
      ok: true,
      status: 200,
      body: inspection,
    };
  } catch (error) {
    item.urlInspection = {
      ok: false,
      error: error.message,
    };
  }

  item.indexingRequest = await indexingApi(accessToken, url);
  results.push(item);
}

const output = {
  createdAt: new Date().toISOString(),
  siteUrl,
  urls,
  results,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
