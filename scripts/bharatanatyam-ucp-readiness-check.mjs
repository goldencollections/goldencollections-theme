#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "tmp", "bharatanatyam-ecosystem-audit");
const label = argValue("--label") || "snapshot";
const business = "https://www.goldencollections.com";
const npx = process.platform === "win32" ? "npx.cmd" : "npx";

const prompts = [
  {
    prompt: "Bharatanatyam jewellery set",
    target: /\b(bharatanatyam|kuchipudi|dance).*(set|jewellery|jewelry)|\bBDS\d+|\bBJS\d+|\bBKS\d+/i,
    wrong: /\b(deity|idol|god|goddess|varalakshmi|balaji|mukut|crown)\b/i
  },
  {
    prompt: "Bharatanatyam jewellery set for kids",
    target: /\b(kid|kids|child|children|bharatanatyam|dance).*(set|jewellery|jewelry)|little gopika|\bBDS\d+/i,
    wrong: /\b(deity|idol|god|goddess|varalakshmi|balaji|mukut|crown)\b/i
  },
  {
    prompt: "Bharatanatyam short necklace",
    target: /\b(short|addigai|necklace|haram|choker|padakkam|bharatanatyam|kemp).*(necklace|haram|addigai|padakkam)|\b(BSN|BBN|BJN)\d+/i,
    wrong: /\b(long haram|waist|vaddanam|mattal|earring|headset|nethi|jada|rakodi|deity|idol|crown)\b/i
  },
  {
    prompt: "Bharatanatyam long haram",
    target: /\b(long|haram|necklace|mala|bharatanatyam|kemp).*(haram|necklace|mala)|\b(BLN|BBN|BJN)\d+/i,
    wrong: /\b(short necklace|choker|addigai|waist|vaddanam|mattal|earring|headset|nethi|jada|rakodi|deity|idol|crown)\b/i
  },
  {
    prompt: "Bharatanatyam waist belt vaddanam",
    target: /\b(vaddanam|waist\s*belt|oddiyanam|odiyanam|kamarband|bharatanatyam).*(vaddanam|waist|belt|oddiyanam)|\bBWB\d+/i,
    wrong: /\b(necklace|haram|mattal|earring|headset|nethi|jada|rakodi|deity|idol|crown)\b/i
  },
  {
    prompt: "Bharatanatyam mattal ear chain",
    target: /\b(mattal|matil|mattel|ear\s*chain|bharatanatyam).*(mattal|matil|mattel|ear\s*chain)|\bBDM\d+|\bBJM\d+/i,
    wrong: /\b(necklace|haram|waist|vaddanam|headset|nethi|jada|rakodi|deity|idol|crown)\b/i
  },
  {
    prompt: "Bharatanatyam ghungroo salangai",
    target: /\b(ghungroo|gungroo|salangai|ankle bells|bharatanatyam|kathak).*(ghungroo|salangai|bells)|\bBDG\d+/i,
    wrong: /\b(necklace|haram|waist|vaddanam|mattal|earring|headset|nethi|jada|rakodi|deity|idol|crown)\b/i
  },
  {
    prompt: "black kemp Bharatanatyam jewellery",
    target: /\b(black kemp|kemp black|black).*(bharatanatyam|kuchipudi|dance|jewellery|jewelry|set|necklace)|\bBJ[SNMTBE]\d+/i,
    wrong: /\b(deity|idol|god|goddess|varalakshmi|balaji|mukut|crown)\b/i
  },
  {
    prompt: "real kemp jewellery for arangetram",
    target: /\b(real kemp|kemp|arangetram|bharatanatyam|kuchipudi).*(set|necklace|haram|jewellery|jewelry)|\b(BKS|BBN|BBM|BWB)\d+/i,
    wrong: /\b(deity|idol|god|goddess|varalakshmi|balaji|mukut|crown)\b/i
  }
];

fs.mkdirSync(outDir, { recursive: true });

const runs = prompts.map(runPrompt);
const jsonPath = path.join(outDir, `bharatanatyam-ucp-${label}.json`);
const mdPath = path.join(outDir, `bharatanatyam-ucp-${label}.md`);
fs.writeFileSync(jsonPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), runs }, null, 2)}\n`);
fs.writeFileSync(mdPath, render(runs));

console.log(`Wrote ${path.relative(root, jsonPath)}`);
console.log(`Wrote ${path.relative(root, mdPath)}`);

function runPrompt(config) {
  console.log(`UCP search: ${config.prompt}`);
  const output = execFileSync(
    npx,
    [
      "@shopify/ucp-cli",
      "catalog",
      "search",
      "--business",
      business,
      "--set",
      `/query=${JSON.stringify(config.prompt)}`,
      "--set",
      `/context/intent=${JSON.stringify(config.prompt)}`,
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
    const title = normalize(result.title || "");
    const isTarget = config.target.test(title);
    const wrongType = config.wrong.test(title);
    return {
      rank: index + 1,
      title: result.title || "",
      variant: result.variant || "",
      price: result.price ?? null,
      currency: result.currency || "",
      correct: isTarget && !wrongType,
      isTarget,
      wrongType
    };
  });

  return {
    prompt: config.prompt,
    generatedAt: new Date().toISOString(),
    top3Correct: results.slice(0, 3).filter((result) => result.correct).length,
    top10Correct: results.slice(0, 10).filter((result) => result.correct).length,
    wrongTop10: results.slice(0, 10).filter((result) => !result.correct),
    results
  };
}

function render(runs) {
  const top3 = runs.reduce((sum, run) => sum + run.top3Correct, 0);
  const top10 = runs.reduce((sum, run) => sum + run.top10Correct, 0);
  const lines = [
    `# Bharatanatyam UCP Readiness ${label}`,
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
      lines.push(`${result.rank}. ${result.correct ? "OK" : "CHECK"} - ${result.title}`);
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
