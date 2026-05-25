#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const env = readEnv(path.join(root, "env"));
const ids = process.argv.slice(2);

if (!ids.length) {
  throw new Error("Pass one or more ProductVariant gid:// IDs");
}
if (!env.SHOPIFY_STORE_DOMAIN || !env.SHOPIFY_ADMIN_TOKEN) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
}

const query = `#graphql
  query VariantAvailability($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on ProductVariant {
        id
        sku
        title
        availableForSale
        inventoryQuantity
        price
        selectedOptions {
          name
          value
        }
        product {
          title
          handle
          status
          onlineStoreUrl
        }
      }
    }
  }
`;

const response = await fetch(
  `https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/${env.SHOPIFY_API_VERSION || "2025-10"}/graphql.json`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": env.SHOPIFY_ADMIN_TOKEN
    },
    body: JSON.stringify({ query, variables: { ids } })
  }
);
const payload = await response.json();
if (payload.errors) {
  console.error(JSON.stringify(payload.errors, null, 2));
  process.exit(1);
}

for (const node of payload.data.nodes) {
  if (!node) {
    console.log("NOT_FOUND");
    continue;
  }
  console.log(
    [
      node.sku || "",
      node.id,
      node.availableForSale,
      node.inventoryQuantity,
      node.product.status,
      node.product.handle,
      node.title,
      (node.selectedOptions || []).map((option) => `${option.name}: ${option.value}`).join("; ")
    ].join("\t")
  );
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
