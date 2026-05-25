#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const OUT_DIR = path.join(root, "tmp", "crown-ucp-sprint");
const env = readEnv(path.join(root, "env"));
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const GRAPHQL_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;
const REST_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}`;
const BUSINESS = "https://www.goldencollections.com";
const NPX = process.platform === "win32" ? "npx.cmd" : "npx";

const APPLY_ALT = process.argv.includes("--apply-alt");
const APPLY_FILE = argValue("--apply-file") || path.join(OUT_DIR, "approved-alt-updates.json");
const UCP_ONLY = process.argv.includes("--ucp-only");
const TRIAGE_ONLY = process.argv.includes("--triage-only");

const PROMPTS = [
  "Varalakshmi crown for home pooja",
  "deity mukut kireedam",
  "goddess crown with size",
  "Balaji crown for idol"
];

const CROWN_COLLECTIONS = [
  "deity-crowns",
  "deity-stone-crowns",
  "premium-deity-crowns"
];

const MEASUREMENT_RE = /\b(measure|measurement|measurements|ruler|scale|size|sizing|inch|inches|in\.|cm|centimeter|centimetre|height|width|length|dimension|dimensions|h x w|h x r|diameter|depth)\b/i;
const CROWN_RE = /\b(crown|mukut|kireedam|kireetam|kirita|makuta|kreedam)\b/i;
const WRONG_CROWN_RE = /\b(face|idol|doll|hands|legs|hastham|padam|necklace|haram|earring|vaddanam|waist|bangle|ghungroo|salangai)\b/i;

if (!SHOP || !TOKEN) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
}

fs.mkdirSync(OUT_DIR, { recursive: true });

if (APPLY_ALT) {
  await applyAltUpdates();
} else {
  const baseline = TRIAGE_ONLY ? readExistingBaseline() : runUcpBaseline();
  const triage = UCP_ONLY ? readExistingTriage() : await runTriage(baseline);
  writeReport(baseline, triage);
  console.log(`Wrote crown sprint outputs to ${path.relative(root, OUT_DIR)}`);
}

function readEnv(filePath) {
  return Object.fromEntries(
    fs
      .readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, "")];
      })
  );
}

function argValue(flag) {
  const exact = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  if (exact) return exact.slice(flag.length + 1);
  const index = process.argv.indexOf(flag);
  return index === -1 ? "" : process.argv[index + 1] || "";
}

function readJson(fileName, fallback) {
  const filePath = path.join(OUT_DIR, fileName);
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readExistingBaseline() {
  return readJson("ucp-baseline.json", []);
}

function readExistingTriage() {
  return readJson("crown-triage.json", { products: [] });
}

function runUcpBaseline() {
  const baseline = PROMPTS.map((prompt) => {
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
    const results = (parsed.result || []).map((result, index) => ({
      rank: index + 1,
      title: result.title || "",
      variant: result.variant || "",
      price: result.price ?? null,
      currency: result.currency || "",
      isCrown: isCrownTitle(result.title || ""),
      isWrongType: isWrongCrownResult(result.title || "")
    }));
    return {
      prompt,
      generatedAt: new Date().toISOString(),
      topCount: results.length,
      top3Correct: results.slice(0, 3).filter((result) => result.isCrown && !result.isWrongType).length,
      top10Correct: results.filter((result) => result.isCrown && !result.isWrongType).length,
      wrongTop10: results.filter((result) => result.isWrongType),
      results
    };
  });
  fs.writeFileSync(path.join(OUT_DIR, "ucp-baseline.json"), `${JSON.stringify(baseline, null, 2)}\n`);
  return baseline;
}

function isCrownTitle(title) {
  return CROWN_RE.test(title);
}

function isWrongCrownResult(title) {
  return !CROWN_RE.test(title) || WRONG_CROWN_RE.test(title);
}

async function gql(query, variables = {}) {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN
    },
    body: JSON.stringify({ query, variables })
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : null;
  if (!response.ok || json?.errors) {
    throw new Error(`GraphQL HTTP ${response.status}: ${text.slice(0, 1200)}`);
  }
  await waitForThrottle(json.extensions?.cost?.throttleStatus);
  return json.data;
}

async function rest(pathname, options = {}) {
  const response = await fetch(`${REST_ENDPOINT}${pathname}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN,
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(`REST ${options.method || "GET"} ${pathname}: ${response.status} ${text.slice(0, 1200)}`);
  }
  return json;
}

async function waitForThrottle(status) {
  if (!status) return;
  const { currentlyAvailable, restoreRate } = status;
  if (currentlyAvailable == null || restoreRate == null || currentlyAvailable >= 250) return;
  const waitMs = Math.ceil(((250 - currentlyAvailable) / restoreRate) * 1000);
  await new Promise((resolve) => setTimeout(resolve, Math.min(Math.max(waitMs, 500), 5000)));
}

async function runTriage(baseline) {
  const variantIds = new Set(
    baseline.flatMap((entry) => entry.results.map((result) => result.variant).filter(Boolean))
  );
  const productsById = new Map();
  for (const handle of CROWN_COLLECTIONS) {
    const products = await fetchCollectionProducts(handle);
    for (const product of products) {
      const existing = productsById.get(product.id);
      const collectionHandles = [...(existing?.collectionHandles || []), handle];
      productsById.set(product.id, { ...(existing || product), ...product, collectionHandles });
    }
  }

  const products = [...productsById.values()].map((product) => classifyProduct(product, variantIds));
  const rowsForVisualReview = products
    .filter((product) => ["Tier 2", "Tier 1"].includes(product.proofTier) || product.ucpTopResult)
    .flatMap((product) =>
      product.images
        .filter((image) => image.position >= 2 && image.position <= 4)
        .map((image) => ({
          productId: product.id,
          legacyResourceId: product.legacyResourceId,
          handle: product.handle,
          title: product.title,
          sku: product.sku,
          proofTier: product.proofTier,
          ucpTopResult: product.ucpTopResult,
          imageId: image.id,
          imageLegacyId: numericId(image.id),
          position: image.position,
          altText: image.altText,
          filename: image.filename,
          url: image.url,
          proposedAlt: proposedMeasurementAlt(product, image)
        }))
    );

  const triage = {
    generatedAt: new Date().toISOString(),
    collections: CROWN_COLLECTIONS,
    summary: summarizeProducts(products),
    products,
    visualReviewImages: rowsForVisualReview
  };

  fs.writeFileSync(path.join(OUT_DIR, "crown-triage.json"), `${JSON.stringify(triage, null, 2)}\n`);
  fs.writeFileSync(path.join(OUT_DIR, "crown-visual-review.json"), `${JSON.stringify(rowsForVisualReview, null, 2)}\n`);
  fs.writeFileSync(path.join(OUT_DIR, "crown-triage.csv"), toCsv(products.map(productCsvRow)));
  fs.writeFileSync(path.join(OUT_DIR, "crown-visual-review.csv"), toCsv(rowsForVisualReview));
  return triage;
}

async function fetchCollectionProducts(handle) {
  const products = [];
  let after = null;
  do {
    const data = await gql(
      `query Products($handle: String!, $after: String) {
        collectionByHandle(handle: $handle) {
          products(first: 50, after: $after) {
            pageInfo { hasNextPage endCursor }
            nodes {
              id
              legacyResourceId
              handle
              title
              descriptionHtml
              productType
              status
              totalInventory
              tracksInventory
              seo { title description }
              variants(first: 100) {
                nodes {
                  id
                  legacyResourceId
                  title
                  sku
                  inventoryQuantity
                  availableForSale
                  selectedOptions { name value }
                }
              }
              images(first: 50) {
                nodes { id altText url }
              }
              metafields(first: 220) {
                nodes { namespace key type value }
              }
            }
          }
        }
      }`,
      { handle, after }
    );
    if (!data.collectionByHandle) {
      console.warn(`Collection missing: ${handle}`);
      return [];
    }
    const connection = data.collectionByHandle.products;
    products.push(...connection.nodes);
    after = connection.pageInfo.hasNextPage ? connection.pageInfo.endCursor : null;
  } while (after);
  return products;
}

function classifyProduct(product, variantIds) {
  const images = product.images.nodes.map((image, index) => ({
    id: image.id,
    legacyId: numericId(image.id),
    position: index + 1,
    altText: image.altText || "",
    url: image.url,
    filename: imageFilename(image.url),
    hasMeasurementText: MEASUREMENT_RE.test(`${image.altText || ""} ${imageFilename(image.url)}`)
  }));
  const metafields = Object.fromEntries(
    product.metafields.nodes.map((metafield) => [`${metafield.namespace}.${metafield.key}`, metafield])
  );
  const measurementMetafields = product.metafields.nodes.filter((metafield) =>
    MEASUREMENT_RE.test(`${metafield.namespace}.${metafield.key} ${metafield.type} ${metafield.value}`)
  );
  const variantSizeSignals = variantSizeValues(product);
  const dimensionValues = [
    ...measurementMetafields.map((metafield) => `${metafield.namespace}.${metafield.key}=${metafield.value}`),
    ...variantSizeSignals
  ];
  const machineReadableMeasurementImage = images.some((image) => image.hasMeasurementText);
  const hasImageSlotsToReview = images.some((image) => image.position >= 2 && image.position <= 4);
  const descriptionText = stripHtml(product.descriptionHtml);
  const copyMentionsMeasurements = MEASUREMENT_RE.test(descriptionText);
  const hasDimensions = dimensionValues.length > 0;
  const ucpTopResult = product.variants.nodes.some((variant) => variantIds.has(variant.id));
  const sku = firstSku(product);
  const proofTier = proofTierFor({
    hasDimensions,
    machineReadableMeasurementImage,
    hasImageSlotsToReview,
    copyMentionsMeasurements
  });
  const promotionAuthority = promotionAuthorityFor(proofTier);
  return {
    id: product.id,
    legacyResourceId: product.legacyResourceId,
    handle: product.handle,
    title: product.title,
    sku,
    status: product.status,
    totalInventory: product.totalInventory,
    productType: product.productType || "",
    collectionHandles: product.collectionHandles || [],
    ucpTopResult,
    proofTier,
    promotionAuthority,
    treatment: treatmentFor(product, proofTier, ucpTopResult),
    imageCount: images.length,
    hasImageSlotsToReview,
    machineReadableMeasurementImage,
    copyMentionsMeasurements,
    hasDimensions,
    dimensionValues,
    currentMeasurementImagePositions: images.filter((image) => image.hasMeasurementText).map((image) => image.position),
    imagePositionsNeedingVisualReview: images
      .filter((image) => image.position >= 2 && image.position <= 4 && !image.hasMeasurementText)
      .map((image) => image.position),
    variantSummary: product.variants.nodes.map((variant) => ({
      id: variant.id,
      sku: variant.sku || "",
      title: variant.title,
      availableForSale: variant.availableForSale,
      inventoryQuantity: variant.inventoryQuantity,
      selectedOptions: variant.selectedOptions
    })),
    images,
    metafields: {
      ornament_type: metafields["custom.ornament_type"]?.value || "",
      material: metafields["custom.material"]?.value || "",
      size_confidence: metafields["custom.size_confidence"]?.value || "",
      fit_notes: metafields["custom.fit_notes"]?.value || "",
      ornament_height_in: metafields["custom.ornament_height_in"]?.value || "",
      ornament_width_in: metafields["custom.ornament_width_in"]?.value || "",
      ornament_depth_in: metafields["custom.ornament_depth_in"]?.value || "",
      crown_style: metafields["custom.crown_style"]?.value || ""
    }
  };
}

function proofTierFor({ hasDimensions, machineReadableMeasurementImage, hasImageSlotsToReview, copyMentionsMeasurements }) {
  if (hasDimensions && machineReadableMeasurementImage) return "Tier 3";
  if (hasDimensions && hasImageSlotsToReview) return "Tier 2";
  if (hasDimensions || copyMentionsMeasurements) return "Tier 1";
  return "Tier 0";
}

function promotionAuthorityFor(tier) {
  if (tier === "Tier 3") return "Codex only";
  if (tier === "Tier 2") return "Codex visual review, Anil only if dimensions are ambiguous";
  if (tier === "Tier 1") return "Codex metadata only; Anil for new measurement claims";
  return "Anil/product decision before full investment";
}

function treatmentFor(product, tier, ucpTopResult) {
  if (product.status !== "ACTIVE" || Number(product.totalInventory || 0) <= 0) return "C";
  if (ucpTopResult || tier === "Tier 3" || tier === "Tier 2") return "A";
  if (tier === "Tier 1") return "B";
  return "C";
}

function firstSku(product) {
  const match = `${product.title} ${product.handle}`.match(/\b(DGC|DGCG|DHC)\s*-?\s*(\d+)\b/i);
  if (match) return `${match[1].toUpperCase()}${match[2]}`;
  const sku = product.variants.nodes.map((variant) => variant.sku).find(Boolean);
  return sku ? sku.replace(/[^a-z0-9]/gi, "").toUpperCase() : "";
}

function variantSizeValues(product) {
  const values = [];
  for (const variant of product.variants.nodes) {
    for (const option of variant.selectedOptions || []) {
      const text = `${option.name}: ${option.value}`;
      if (MEASUREMENT_RE.test(text) || /\d+(?:\.\d+)?\s*(?:x|inch|inches|cm)/i.test(text)) values.push(text);
    }
  }
  return [...new Set(values)];
}

function imageFilename(url) {
  if (!url) return "";
  try {
    return decodeURIComponent(path.posix.basename(new URL(url).pathname));
  } catch {
    return String(url).split("/").pop() || "";
  }
}

function numericId(gid) {
  return String(gid || "").split("/").pop();
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function proposedMeasurementAlt(product, image) {
  const sku = product.sku ? ` ${product.sku}` : "";
  const style = /round/i.test(product.title) ? "round " : /half/i.test(product.title) ? "half " : "";
  return `${product.title}${sku ? "" : ""} ${style}deity crown measurement image showing size reference`.replace(/\s+/g, " ").trim().slice(0, 180);
}

function summarizeProducts(products) {
  return {
    total: products.length,
    active: products.filter((product) => product.status === "ACTIVE").length,
    inStock: products.filter((product) => Number(product.totalInventory || 0) > 0).length,
    activeInStock: products.filter((product) => product.status === "ACTIVE" && Number(product.totalInventory || 0) > 0).length,
    ucpTopResults: products.filter((product) => product.ucpTopResult).length,
    byTier: countBy(products, (product) => product.proofTier),
    byTreatment: countBy(products, (product) => product.treatment),
    machineReadableMeasurementImage: products.filter((product) => product.machineReadableMeasurementImage).length,
    needsVisualReview: products.filter((product) => product.imagePositionsNeedingVisualReview.length).length
  };
}

function countBy(rows, keyFn) {
  return rows.reduce((acc, row) => {
    const key = keyFn(row) || "(blank)";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function productCsvRow(product) {
  return {
    handle: product.handle,
    sku: product.sku,
    title: product.title,
    status: product.status,
    inventory: product.totalInventory,
    productType: product.productType,
    collections: product.collectionHandles.join("; "),
    ucpTopResult: product.ucpTopResult,
    proofTier: product.proofTier,
    promotionAuthority: product.promotionAuthority,
    treatment: product.treatment,
    imageCount: product.imageCount,
    measurementImagePositions: product.currentMeasurementImagePositions.join(";"),
    visualReviewPositions: product.imagePositionsNeedingVisualReview.join(";"),
    hasDimensions: product.hasDimensions,
    copyMentionsMeasurements: product.copyMentionsMeasurements,
    url: `https://www.goldencollections.com/products/${product.handle}`
  };
}

function toCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header])).join(","));
  }
  return `${lines.join("\n")}\n`;
}

function csvEscape(value) {
  const text = Array.isArray(value) ? value.join("; ") : String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function writeReport(baseline, triage) {
  const appliedAltUpdates = readJson("applied-alt-updates.json", []);
  const firstAltBatch = readJson("approved-alt-updates.json", []).filter((update) => update.approved === true);
  const topUcpAltBatch = readJson("approved-alt-updates-top-ucp.json", []).filter((update) => update.approved === true);
  const cumulativeAppliedAltUpdates = distinctAltUpdates([...firstAltBatch, ...topUcpAltBatch, ...appliedAltUpdates]);
  const verifiedDisambiguation = readJson("verified-non-crown-disambiguation.json", []);
  const top3ProofRows = top3ProofMatrix(baseline, triage.products || []);
  const lines = [
    "# Deity Crown UCP Sprint",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## UCP Baseline",
    "",
    "| Prompt | Top 3 correct | Top 10 correct | Wrong top-10 results |",
    "| --- | ---: | ---: | --- |",
    ...baseline.map((entry) => {
      const wrong = entry.wrongTop10.map((result) => `${result.rank}. ${result.title}`).join("<br>") || "-";
      return `| ${md(entry.prompt)} | ${entry.top3Correct}/3 | ${entry.top10Correct}/${entry.topCount} | ${md(wrong)} |`;
    }),
    "",
    "### Top 3 Proof Layer",
    "",
    "| Prompt | Rank | Product | Proof tier | Machine-readable measurement image |",
    "| --- | ---: | --- | --- | --- |",
    ...top3ProofRows.map((row) => {
      return `| ${md(row.prompt)} | ${row.rank} | ${md(row.product)} | ${row.proofTier} | ${row.machineReadableMeasurementImage ? "yes" : "no"} |`;
    }),
    "",
    "## Crown Product Triage",
    "",
    `- Total crown products in sprint collections: ${triage.summary?.total ?? 0}`,
    `- Active: ${triage.summary?.active ?? 0}`,
    `- In stock: ${triage.summary?.inStock ?? 0}`,
    `- Active and in stock: ${triage.summary?.activeInStock ?? 0}`,
    `- Products appearing in UCP top results: ${triage.summary?.ucpTopResults ?? 0}`,
    `- Machine-readable measurement image signal: ${triage.summary?.machineReadableMeasurementImage ?? 0}`,
    `- Need image 2/3/4 visual review: ${triage.summary?.needsVisualReview ?? 0}`,
    `- Applied reviewed crown measurement image alt updates: ${cumulativeAppliedAltUpdates.length}`,
    `- Verified non-crown query disambiguation products: ${verifiedDisambiguation.length}`,
    "",
    "### Proof Tiers",
    "",
    "| Tier | Count | Promotion authority |",
    "| --- | ---: | --- |",
    ...Object.entries(triage.summary?.byTier || {}).map(([tier, count]) => {
      return `| ${tier} | ${count} | ${promotionAuthorityFor(tier)} |`;
    }),
    "",
    "### Treatment",
    "",
    "| Treatment | Count | Meaning |",
    "| --- | ---: | --- |",
    `| A | ${triage.summary?.byTreatment?.A || 0} | Sprint priority: in-stock, UCP-visible, or proof-rich enough to improve now |`,
    `| B | ${triage.summary?.byTreatment?.B || 0} | Minimum cleanup or later batch |`,
    `| C | ${triage.summary?.byTreatment?.C || 0} | Restock/product decision or insufficient evidence before full investment |`,
    "",
    "## Files",
    "",
    "- `tmp/crown-ucp-sprint/ucp-baseline.json`",
    "- `tmp/crown-ucp-sprint/crown-triage.json`",
    "- `tmp/crown-ucp-sprint/crown-triage.csv`",
    "- `tmp/crown-ucp-sprint/crown-visual-review.json`",
    "- `tmp/crown-ucp-sprint/crown-visual-review.csv`",
    "- `tmp/crown-ucp-sprint/applied-alt-updates.json`",
    "- `tmp/crown-ucp-sprint/approved-alt-updates-top-ucp.json`",
    "- `tmp/crown-ucp-sprint/non-crown-disambiguation-preview.json`",
    "- `tmp/crown-ucp-sprint/verified-non-crown-disambiguation.json`",
    "",
    "## Next Safe Step",
    "",
    "Continue the same evidence-gated pattern: review the remaining Tier 2 image-position rows from `crown-visual-review-contact-sheet.jpg`, approve only visibly measured ruler/tape photos, then run `--apply-alt` for the next batch."
  ];
  fs.writeFileSync(path.join(OUT_DIR, "crown-ucp-sprint-report.md"), `${lines.join("\n")}\n`);
}

function top3ProofMatrix(baseline, products) {
  return baseline.flatMap((entry) =>
    entry.results.slice(0, 3).map((result) => {
      const product = findProductForUcpResult(products, result);
      return {
        prompt: entry.prompt,
        rank: result.rank,
        product: result.title,
        proofTier: product?.proofTier || "unknown",
        machineReadableMeasurementImage: Boolean(product?.machineReadableMeasurementImage)
      };
    })
  );
}

function findProductForUcpResult(products, result) {
  return (
    products.find((product) => product.variantSummary?.some((variant) => variant.id === result.variant)) ||
    products.find((product) => product.title === result.title)
  );
}

function distinctAltUpdates(updates) {
  const byImage = new Map();
  for (const update of updates) {
    const key = update.imageLegacyId || update.imageId || `${update.handle}:${update.position}`;
    if (key) byImage.set(key, update);
  }
  return [...byImage.values()];
}

function md(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}

async function applyAltUpdates() {
  const updates = JSON.parse(fs.readFileSync(APPLY_FILE, "utf8"));
  if (!Array.isArray(updates)) throw new Error(`Expected ${APPLY_FILE} to be an array`);
  const safeUpdates = updates.filter((update) => update.approved === true && update.legacyResourceId && update.imageLegacyId && update.alt);
  if (!safeUpdates.length) {
    console.log("No approved alt updates found.");
    return;
  }
  const applied = [];
  for (const update of safeUpdates) {
    await rest(`/products/${update.legacyResourceId}/images/${update.imageLegacyId}.json`, {
      method: "PUT",
      body: JSON.stringify({ image: { id: Number(update.imageLegacyId), alt: update.alt } })
    });
    applied.push(update);
    console.log(`Updated alt: ${update.handle} image ${update.position}`);
  }
  fs.writeFileSync(path.join(OUT_DIR, "applied-alt-updates.json"), `${JSON.stringify(applied, null, 2)}\n`);
}
