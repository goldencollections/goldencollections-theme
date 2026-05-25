#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const OUT_DIR = path.join(root, "tmp", "hastham-padam-ucp-sprint");
const BUSINESS = "https://www.goldencollections.com";
const NPX = process.platform === "win32" ? "npx.cmd" : "npx";
const LABEL = argValue("--label") || "snapshot";

const PROMPTS = [
  "Varalakshmi hands and legs",
  "hastham padam for idol",
  "goddess hands legs with size",
  "Varalakshmi hastham padam for pooja"
];

const TARGET_RE =
  /\b(hastham|hastam|padam|patham|hands?\s*(?:and|&)?\s*legs?|legs?\s*(?:and|&)?\s*hands?|lotus\s+hands?|deity\s+hastham|vhl\s*-?\s*\d+|djhandslegs\s*-?\s*\d+|dj-hands-legs\s*-?\s*\d+|dhl\s*-?\s*\d+)\b/i;
const WRONG_TYPE_RE =
  /\b(crown|mukut|kireedam|kireetam|taira|turai|haram|necklace|vaddanam|waist|earring|jhumki|face|mugham|nose|arch|prabhavali|thomala|vagamalai|bhujalu)\b/i;

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
    const target = isTarget(title);
    const wrongType = isWrongType(title);
    return {
      rank: index + 1,
      title,
      variant: result.variant || "",
      price: result.price ?? null,
      currency: result.currency || "",
      isTarget: target,
      isWrongType: wrongType,
      correct: target && !wrongType
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

function isTarget(title) {
  return TARGET_RE.test(normalize(title));
}

function isWrongType(title) {
  const text = normalize(title);
  return !TARGET_RE.test(text) || WRONG_TYPE_RE.test(text);
}

function normalize(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function renderReport(runs) {
  const top3 = runs.reduce((sum, run) => sum + run.top3Correct, 0);
  const top10 = runs.reduce((sum, run) => sum + run.top10Correct, 0);
  const lines = [
    `# Hastham Padam UCP ${LABEL}`,
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
      const mark = result.correct ? "OK" : "WRONG";
      lines.push(`${result.rank}. ${mark} - ${result.title}`);
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function argValue(flag) {
  const exact = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  if (exact) return exact.slice(flag.length + 1);
  const index = process.argv.indexOf(flag);
  return index === -1 ? "" : process.argv[index + 1] || "";
}
