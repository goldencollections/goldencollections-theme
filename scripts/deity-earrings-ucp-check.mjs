#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "tmp", "deity-earrings-ucp-sprint");
const business = "https://www.goldencollections.com";
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const label = argValue("--label") || "current-final";

const prompts = [
  "deity earrings for idol",
  "jhumki for god idol",
  "goddess earrings with size",
  "Balaji earrings for idol"
];

const earringTargetRe =
  /\b(earrings?|ear\s*ornaments?|karna\s*pathak(?:am|kam)|karna\s*pathakkam|jhumki|jhumka|dge\s*-?\s*\d+)\b/i;
const wrongTypeRe =
  /\b(face|mugham|mukham|idol full set|mustache|moustache|sun\s*&?\s*moon|surya|moon|vaddanam|waist belt|crown|mukut|kireedam|haram|necklace|arch|prabhavali|nose ring|nath|bullaku)\b/i;
const strictJhumkiRe = /\b(jhumki|jhumka)\b/i;

fs.mkdirSync(outDir, { recursive: true });

const rows = prompts.map(runPrompt);
const summary = {
  generatedAt: new Date().toISOString(),
  key: `deity-earrings-${label}`,
  totalTop3Correct: rows.reduce((sum, row) => sum + row.top3Correct, 0),
  totalTop10Correct: rows.reduce((sum, row) => sum + row.top10Correct, 0),
  strictJhumkiTop3Correct: rows
    .find((row) => row.prompt === "jhumki for god idol")
    ?.results.slice(0, 3)
    .filter((result) => strictJhumkiRe.test(result.title)).length || 0,
  rows
};

const jsonPath = path.join(outDir, `ucp-${label}.json`);
const mdPath = path.join(outDir, `ucp-${label}.md`);
fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`);
fs.writeFileSync(mdPath, renderReport(summary));
console.log(`Wrote ${path.relative(root, jsonPath)}`);
console.log(`Wrote ${path.relative(root, mdPath)}`);

function runPrompt(prompt) {
  console.log(`UCP search: ${prompt}`);
  const output = execFileSync(
    npx,
    [
      "@shopify/ucp-cli",
      "catalog",
      "search",
      "--business",
      business,
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
    const isTarget = earringTargetRe.test(title);
    const isWrong = !isTarget || wrongTypeRe.test(title);
    return {
      rank: index + 1,
      title,
      variant: result.variant || "",
      price: result.price ?? null,
      currency: result.currency || "",
      isTarget,
      isWrong,
      strictJhumki: strictJhumkiRe.test(title)
    };
  });
  return {
    prompt,
    top3Correct: results.slice(0, 3).filter((result) => !result.isWrong).length,
    top10Correct: results.slice(0, 10).filter((result) => !result.isWrong).length,
    wrongTop10: results.slice(0, 10).filter((result) => result.isWrong),
    results
  };
}

function renderReport(summary) {
  const lines = [
    `# Deity Earrings UCP ${label}`,
    "",
    `Generated: ${summary.generatedAt}`,
    "",
    `- Top 3 score: ${summary.totalTop3Correct}/12`,
    `- Top 10 score: ${summary.totalTop10Correct}/40`,
    `- Strict jhumki top 3 score: ${summary.strictJhumkiTop3Correct}/3`,
    ""
  ];

  for (const row of summary.rows) {
    lines.push(`## ${row.prompt}`, "");
    lines.push(`- Top 3: ${row.top3Correct}/3`);
    lines.push(`- Top 10: ${row.top10Correct}/10`, "");
    for (const result of row.results.slice(0, 10)) {
      const mark = result.isWrong ? "WRONG" : "OK";
      const jhumki = row.prompt.includes("jhumki") && !result.strictJhumki ? " (not strict jhumki)" : "";
      lines.push(`${result.rank}. ${mark} - ${result.title}${jhumki}`);
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
