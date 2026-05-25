#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const OUT_DIR = path.join(root, "tmp", "deity-waist-belt-ucp-sprint");
const BUSINESS = "https://www.goldencollections.com";
const NPX = process.platform === "win32" ? "npx.cmd" : "npx";
const LABEL = argValue("--label") || "snapshot";

const PROMPTS = [
  "deity waist belt for idol",
  "vaddanam for god idol",
  "goddess waist belt with size",
  "Varalakshmi vaddanam for pooja idol"
];

const TARGET_RE =
  /\b(vaddanam|waist\s*belt|oddiyanam|odiyanam|kamarband|kamar\s*band|dwb\s*-?\s*\d+)\b/i;
const WRONG_TYPE_RE =
  /\b(crown|mukut|kireedam|kireetam|haram|necklace|earring|jhumki|face|mugham|mukham|hands|legs|hastham|padam|nose|arch|prabhavali|thomala|vagamalai|bhujalu|idol\s+set|full\s+idol)\b/i;

fs.mkdirSync(OUT_DIR, { recursive: true });

const runs = PROMPTS.map((prompt) => runPrompt(prompt));
const jsonPath = path.join(OUT_DIR, `ucp-${LABEL}.json`);
const mdPath = path.join(OUT_DIR, `ucp-${LABEL}.md`);
fs.writeFileSync(jsonPath, `${JSON.stringify(runs, null, 2)}\n`);
fs.writeFileSync(mdPath, renderReport(runs));
console.log(`Wrote ${path.relative(root, jsonPath)}`);
console.log(`Wrote ${path.relative(root, mdPath)}`);

function runPrompt(prompt) {
  console.log(`UCP search: ${prompt}`);
  const output = execFileSync(
    NPX,
    [
      "@shopify/ucp-cli",
      "catalog",
      "search",
      "--business",
      BUSINESS,
      "--set",
      `/query=${JSON.stringify(prompt)}`,
      "--set",
      `/context/intent=${JSON.stringify(prompt)}`,
      "--set",
      "/context/address_country=IN",
      "--set",
      "/context/currency=INR",
      "--view",
      ":compact",
      "--format",
      "json",
      "--token-limit",
      "6000"
    ],
    { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], shell: process.platform === "win32" }
  );
  const parsed = JSON.parse(output);
  const results = (parsed.result || []).map((result, index) => {
    const title = result.title || "";
    const text = normalize(title);
    const isTarget = TARGET_RE.test(text);
    const isWrongType = !isTarget || WRONG_TYPE_RE.test(text);
    return {
      rank: index + 1,
      title,
      variant: result.variant || "",
      price: result.price ?? null,
      currency: result.currency || "",
      isTarget,
      isWrongType,
      correct: isTarget && !isWrongType
    };
  });
  return {
    prompt,
    generatedAt: new Date().toISOString(),
    topCount: results.length,
    top3Correct: results.slice(0, 3).filter((result) => result.correct).length,
    top10Correct: results.slice(0, 10).filter((result) => result.correct).length,
    wrongTop10: results.slice(0, 10).filter((result) => !result.correct),
    results
  };
}

function renderReport(runs) {
  const top3 = runs.reduce((sum, run) => sum + run.top3Correct, 0);
  const top10 = runs.reduce((sum, run) => sum + run.top10Correct, 0);
  const lines = [
    `# Deity Waist Belt UCP ${LABEL}`,
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    `Overall top 3: ${top3}/${runs.length * 3}`,
    `Overall top 10: ${top10}/${runs.length * 10}`,
    ""
  ];

  for (const run of runs) {
    lines.push(`## ${run.prompt}`, "");
    lines.push(`Top 3: ${run.top3Correct}/3`);
    lines.push(`Top 10: ${run.top10Correct}/10`, "");
    for (const result of run.results.slice(0, 10)) {
      lines.push(`${result.rank}. ${result.correct ? "OK" : "WRONG"} - ${result.title}`);
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function normalize(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function argValue(flag) {
  const exact = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  if (exact) return exact.slice(flag.length + 1);
  const index = process.argv.indexOf(flag);
  return index === -1 ? "" : process.argv[index + 1] || "";
}
