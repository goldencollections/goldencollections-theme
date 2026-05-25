#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const ENV_FILE = "env";
const env = readEnv(ENV_FILE);
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const GRAPHQL_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;

// These products appeared as wrong-type results for crown UCP prompts.
// The edits only remove crown-intent wording from non-crown products.
const TARGET_VARIANT_IDS = [
  "gid://shopify/ProductVariant/48815161377066", // Venkateshwara Balaji Idol VVD104
  "gid://shopify/ProductVariant/49020716908842", // Vishnu / Balaji Face VDF035
  "gid://shopify/ProductVariant/45345455866154", // Vishnu / Balaji Face VDF002
  "gid://shopify/ProductVariant/48913083302186", // Vishnu / Balaji Face VVF001
  "gid://shopify/ProductVariant/47467412586794" // Vishnu / Balaji Face VLFACE-002
];

const REPLACEMENTS = [
  {
    from: /including crown, hair and decoration where shown\./gi,
    to: "including head decoration, hair and visible decoration where shown."
  },
  {
    from: /forehead\/crown area/gi,
    to: "forehead/top area"
  },
  {
    from: /match crown space/gi,
    to: "match upper face space"
  }
];

if (!SHOP || !TOKEN) throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN");

function readEnv(file) {
  return Object.fromEntries(
    fs
      .readFileSync(file, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, "")];
      })
  );
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
  return json.data;
}

function rewrite(html) {
  let next = html || "";
  for (const replacement of REPLACEMENTS) next = next.replace(replacement.from, replacement.to);
  return next;
}

const data = await gql(
  `query Targets($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on ProductVariant {
        id
        product {
          id
          legacyResourceId
          handle
          title
          productType
          descriptionHtml
        }
      }
    }
  }`,
  { ids: TARGET_VARIANT_IDS }
);

const products = [];
const seen = new Set();
for (const node of data.nodes || []) {
  if (!node?.product || seen.has(node.product.id)) continue;
  seen.add(node.product.id);
  products.push(node.product);
}

const changes = products
  .map((product) => {
    const next = rewrite(product.descriptionHtml);
    return {
      id: product.id,
      handle: product.handle,
      title: product.title,
      productType: product.productType,
      changed: next !== product.descriptionHtml,
      before: product.descriptionHtml,
      after: next
    };
  })
  .filter((change) => change.changed);

fs.mkdirSync("tmp/crown-ucp-sprint", { recursive: true });
fs.writeFileSync("tmp/crown-ucp-sprint/non-crown-disambiguation-preview.json", `${JSON.stringify(changes, null, 2)}\n`);

if (!changes.length) {
  console.log("No disambiguation changes needed.");
  process.exit(0);
}

for (const change of changes) {
  console.log(`${APPLY ? "UPDATE" : "DRY"} ${change.title} (${change.handle})`);
  if (!APPLY) continue;
  const result = await gql(
    `mutation UpdateProduct($input: ProductInput!) {
      productUpdate(input: $input) {
        userErrors { field message }
      }
    }`,
    { input: { id: change.id, descriptionHtml: change.after } }
  );
  const errors = result.productUpdate.userErrors || [];
  if (errors.length) throw new Error(`productUpdate ${change.handle}: ${JSON.stringify(errors)}`);
}

console.log(`${APPLY ? "Applied" : "Previewed"} ${changes.length} non-crown disambiguation change(s).`);
