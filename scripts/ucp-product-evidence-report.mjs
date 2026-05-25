#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "tmp", "ucp-product-evidence");
const business = "https://www.goldencollections.com";
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const label = argValue("--label") || new Date().toISOString().slice(0, 10);

const categories = [
  { key: "crowns", file: "tmp/crown-ucp-sprint/ucp-baseline.json", shape: "array" },
  { key: "short-harams", file: "tmp/deity-short-necklace-ucp-sprint/ucp-baseline.json", shape: "array" },
  { key: "long-harams", file: "tmp/deity-long-haram-ucp-sprint/ucp-baseline.json", shape: "array" },
  {
    key: "waist-belts",
    file: "tmp/deity-waist-belt-ucp-sprint/ucp-stability-2026-05-19.json",
    fallbackFile: "tmp/deity-waist-belt-ucp-sprint/ucp-final.json",
    shape: "array"
  },
  {
    key: "earrings",
    file: "tmp/deity-earrings-ucp-sprint/ucp-stability-2026-05-19.json",
    fallbackFile: "tmp/deity-earrings-ucp-sprint/ucp-after-collection-cleanup-strict.json",
    shape: "array"
  },
  {
    key: "hastham-padam",
    file: "tmp/hastham-padam-ucp-sprint/ucp-stability-2026-05-19.json",
    fallbackFile: "tmp/hastham-padam-ucp-sprint/ucp-final-after-description-sync.json",
    shape: "array"
  },
  {
    key: "varalakshmi-faces",
    file: "tmp/varalakshmi-face-ucp-sprint/ucp-stability-2026-05-19.json",
    fallbackFile: "tmp/varalakshmi-face-ucp-sprint/ucp-final-after-doll-face-refinement.json",
    shape: "array"
  }
];

fs.mkdirSync(outDir, { recursive: true });

const report = {
  generatedAt: new Date().toISOString(),
  label,
  business,
  categories: categories.map(readCategoryEvidence)
};

const jsonPath = path.join(outDir, `product-evidence-${label}.json`);
const mdPath = path.join(outDir, `product-evidence-${label}.md`);
fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(mdPath, renderMarkdown(report));
console.log(`Wrote ${path.relative(root, jsonPath)}`);
console.log(`Wrote ${path.relative(root, mdPath)}`);

function readCategoryEvidence(category) {
  const sourceFile = fs.existsSync(path.join(root, category.file)) ? category.file : category.fallbackFile || category.file;
  const sourcePath = path.join(root, sourceFile);
  const parsed = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  const rows = parsed.rows || parsed.runs || parsed;
  const candidates = [];

  for (const row of rows) {
    for (const result of (row.results || []).slice(0, 3)) {
      const correct = result.correct ?? (!result.isWrong && !result.isWrongType);
      if (!correct || !result.variant) continue;
      if (category.key === "earrings" && /jhumki/i.test(row.prompt)) continue;
      candidates.push({
        prompt: row.prompt,
        rank: result.rank,
        title: result.title,
        variant: result.variant
      });
    }
  }

  const selected = uniqueByVariant(candidates).slice(0, 4);
  return {
    key: category.key,
    source: sourceFile,
    selected: selected.map((candidate) => ({
      ...candidate,
      getProduct: getProduct(candidate.variant)
    }))
  };
}

function getProduct(variantId) {
  console.log(`get_product ${variantId}`);
  const parsed = runGetProduct(variantId);
  if (parsed.error) {
    return {
      title: "",
      url: "",
      selected: [],
      options: [],
      selectedAvailabilityIssues: [`get_product error: ${parsed.error}`],
      priceRange: null,
      collectionHandles: [],
      mediaCount: 0,
      mediaUrls: [],
      error: parsed
    };
  }
  const product = parsed.result?.product || {};
  return {
    title: product.title || "",
    url: product.url || "",
    selected: product.selected || [],
    options: product.options || [],
    selectedAvailabilityIssues: selectedAvailabilityIssues(product),
    priceRange: product.price_range || null,
    collectionHandles: (product.collections || []).map((collection) => collection.handle).filter(Boolean),
    mediaCount: (product.media || []).length,
    mediaUrls: (product.media || []).map((media) => media.url).filter(Boolean).slice(0, 3)
  };
}

function runGetProduct(variantId) {
  try {
    const output = execFileSync(
      npx,
      [
        "@shopify/ucp-cli",
        "catalog",
        "get_product",
        variantId,
        "--business",
        business,
        "--refresh",
        "--format",
        "json",
        "--filter-output",
        "result.product.title,result.product.url,result.product.options,result.product.selected,result.product.price_range,result.product.collections,result.product.media",
        "--token-limit",
        "5000"
      ],
      { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], shell: process.platform === "win32" }
    );
    return JSON.parse(output);
  } catch (error) {
    const raw = String(error.stdout || error.stderr || error.message || "");
    try {
      const parsed = JSON.parse(raw);
      return {
        error: parsed.message || parsed.code || "unknown error",
        code: parsed.code || "",
        retryable: parsed.retryable ?? null,
        raw: parsed
      };
    } catch {
      return { error: raw || "unknown error", code: "", retryable: null };
    }
  }
}

function renderMarkdown(report) {
  const lines = [
    `# UCP get_product Evidence ${report.label}`,
    "",
    `Generated: ${report.generatedAt}`,
    `Business: ${report.business}`,
    ""
  ];

  for (const category of report.categories) {
    lines.push(`## ${titleCase(category.key)}`, "");
    lines.push(`Source scorecard: \`${category.source}\``, "");
    lines.push("| Prompt | Rank | Search title | get_product title | Selected | Selected availability issues | Available options | Price range | Collections | Media |");
    lines.push("| --- | ---: | --- | --- | --- | --- | --- | --- | --- | ---: |");
    for (const item of category.selected) {
      const product = item.getProduct;
      lines.push(
        [
          md(item.prompt),
          item.rank,
          md(item.title),
          md(product.title),
          md(product.selected.map((option) => `${option.name}: ${option.label}`).join("; ")),
          md((product.selectedAvailabilityIssues || []).join("; ")),
          md(optionSummary(product.options)),
          md(priceSummary(product.priceRange)),
          md(product.collectionHandles.slice(0, 5).join(", ")),
          product.mediaCount
        ].join(" | ").replace(/^/, "| ").replace(/$/, " |")
      );
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function uniqueByVariant(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.variant)) return false;
    seen.add(item.variant);
    return true;
  });
}

function optionSummary(options) {
  return options
    .map((option) => {
      const available = (option.values || []).filter((value) => value.available).map((value) => value.label);
      return `${option.name}: ${available.slice(0, 4).join(", ")}${available.length > 4 ? "..." : ""}`;
    })
    .join("; ");
}

function selectedAvailabilityIssues(product) {
  const optionValueMap = new Map();
  for (const option of product.options || []) {
    for (const value of option.values || []) {
      optionValueMap.set(`${option.name}\u0000${value.label}`, value);
    }
  }

  const issues = [];
  for (const selected of product.selected || []) {
    const value = optionValueMap.get(`${selected.name}\u0000${selected.label}`);
    if (!value) {
      issues.push(`${selected.name}: selected '${selected.label}' missing from option values`);
    } else if (value.available === false) {
      issues.push(`${selected.name}: selected '${selected.label}' currently unavailable`);
    }
  }
  return issues;
}

function priceSummary(priceRange) {
  if (!priceRange?.min || !priceRange?.max) return "";
  const min = `${priceRange.min.currency} ${priceRange.min.amount / 100}`;
  const max = `${priceRange.max.currency} ${priceRange.max.amount / 100}`;
  return min === max ? min : `${min}-${max}`;
}

function titleCase(value) {
  return String(value).replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function md(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
}

function argValue(flag) {
  const exact = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  if (exact) return exact.slice(flag.length + 1);
  const index = process.argv.indexOf(flag);
  return index === -1 ? "" : process.argv[index + 1] || "";
}
