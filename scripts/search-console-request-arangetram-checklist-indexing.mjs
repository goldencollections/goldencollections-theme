#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { getAccessToken, readEnv, root, searchConsoleApi } from "./search-console-lib.mjs";

const targetUrl =
  "https://www.goldencollections.com/pages/bharatanatyam-arangetram-kuchipudi-rangapravesam-jewellery-checklist";
const outputPath = path.join(root, "tmp", "gsc-arangetram-checklist-indexing-2026-05-24.json");

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

const env = readEnv();
const siteUrl = env.SEARCH_CONSOLE_SITE_URL || "sc-domain:goldencollections.com";
const accessToken = await getAccessToken();
const result = {
  createdAt: new Date().toISOString(),
  siteUrl,
  url: targetUrl,
};

try {
  result.urlInspection = {
    ok: true,
    body: await searchConsoleApi("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
      method: "POST",
      body: JSON.stringify({
        inspectionUrl: targetUrl,
        siteUrl,
      }),
    }),
  };
} catch (error) {
  result.urlInspection = {
    ok: false,
    error: error.message,
  };
}

result.indexingRequest = await indexingApi(accessToken, targetUrl);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
