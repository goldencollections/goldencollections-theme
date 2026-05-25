#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const OUT_DIR = path.join(root, "tmp", "deity-short-necklace-ucp-sprint");
const env = readEnv(path.join(root, "env"));
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const GRAPHQL_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;
const APPLY = process.argv.includes("--apply");

if (!SHOP || !TOKEN) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const targets = readJson(path.join(OUT_DIR, "applied-short-haram-query-synonyms.json"));
const preview = [];

for (const target of targets) {
  const product = await fetchProduct(target.handle);
  if (!product) continue;

  const ornamentType = product.metafieldOrnamentType?.value || "";
  if (!/short necklace/i.test(ornamentType)) {
    preview.push({ ...target, skipped: true, reason: `Ornament type is not Short Necklace: ${ornamentType}` });
    continue;
  }

  const currentDescriptionHtml = product.descriptionHtml || "";
  const currentDescriptionTag = product.metafieldDescriptionTag?.value || "";
  const nextDescriptionHtml = strengthenDescription(currentDescriptionHtml);
  const nextDescriptionTag = strengthenDescriptionTag(currentDescriptionTag, product.title);

  const changedDescription = nextDescriptionHtml !== currentDescriptionHtml;
  const changedDescriptionTag = nextDescriptionTag !== currentDescriptionTag;
  const row = {
    productId: product.id,
    handle: product.handle,
    title: product.title,
    sku: target.sku,
    ornamentType,
    changedDescription,
    changedDescriptionTag,
    beforeDescriptionText: stripHtml(currentDescriptionHtml).slice(0, 240),
    afterDescriptionText: stripHtml(nextDescriptionHtml).slice(0, 240),
    beforeDescriptionTag: currentDescriptionTag,
    afterDescriptionTag: nextDescriptionTag
  };
  preview.push(row);

  if (APPLY && (changedDescription || changedDescriptionTag)) {
    if (changedDescription) {
      await productUpdate(product.id, nextDescriptionHtml);
    }
    if (changedDescriptionTag) {
      await metafieldsSet([
        {
          ownerId: product.id,
          namespace: "global",
          key: "description_tag",
          type: "single_line_text_field",
          value: nextDescriptionTag
        }
      ]);
    }
    console.log(`Updated short haram wording: ${target.sku} ${product.handle}`);
  }
}

const output = path.join(
  OUT_DIR,
  APPLY ? "applied-short-haram-description-disambiguation.json" : "short-haram-description-disambiguation-preview.json"
);
fs.writeFileSync(output, `${JSON.stringify(preview, null, 2)}\n`);
console.log(`${APPLY ? "Applied" : "Previewed"} ${preview.filter((row) => row.changedDescription || row.changedDescriptionTag).length} description disambiguation updates.`);
console.log(`Wrote ${path.relative(root, output)}`);

function strengthenDescription(html) {
  if (/short\s+haram\s*\/\s*short\s+necklace/i.test(html)) return html;
  const replacements = [
    [/Deity short necklace for Hindu god and goddess idol alankaram\./i, "Deity short haram / short necklace for Hindu god and goddess idol alankaram."],
    [/This deity short necklace is made for Hindu god and goddess idol alankaram\./i, "This deity short haram / short necklace is made for Hindu god and goddess idol alankaram."],
    [/Goddess short necklace for Hindu god and goddess idol alankaram\./i, "Goddess short haram / short necklace for Hindu god and goddess idol alankaram."],
    [/Chest necklace for/i, "Deity short haram / chest necklace for"],
    [/Chest necklace is suitable/i, "Deity short haram / chest necklace is suitable"]
  ];
  for (const [pattern, replacement] of replacements) {
    if (pattern.test(html)) return html.replace(pattern, replacement);
  }
  return `<p>Deity short haram / short necklace for Hindu god and goddess idol alankaram.</p>\n${html}`;
}

function strengthenDescriptionTag(value, title) {
  const current = String(value || "").trim();
  if (/short\s+haram/i.test(current)) return current;
  if (/short necklace/i.test(current)) {
    return current.replace(/short necklace/ig, (match) => `${match} / short haram`).slice(0, 320);
  }
  const productLabel = title || "deity short necklace";
  return `Shop ${productLabel} as a deity short haram / short necklace for Hindu god and goddess idol alankaram. Compare size and placement before ordering.`.slice(0, 320);
}

async function fetchProduct(handle) {
  const data = await gql(
    `query($handle: String!) {
      productByHandle(handle: $handle) {
        id
        handle
        title
        descriptionHtml
        metafieldOrnamentType: metafield(namespace: "custom", key: "ornament_type") {
          value
        }
        metafieldDescriptionTag: metafield(namespace: "global", key: "description_tag") {
          value
        }
      }
    }`,
    { handle }
  );
  return data.productByHandle;
}

async function productUpdate(id, descriptionHtml) {
  const data = await gql(
    `mutation($input: ProductInput!) {
      productUpdate(input: $input) {
        product {
          id
        }
        userErrors {
          field
          message
        }
      }
    }`,
    { input: { id, descriptionHtml } }
  );
  const errors = data.productUpdate.userErrors || [];
  if (errors.length) throw new Error(JSON.stringify(errors, null, 2));
}

async function metafieldsSet(metafields) {
  const data = await gql(
    `mutation($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          key
        }
        userErrors {
          field
          message
        }
      }
    }`,
    { metafields }
  );
  const errors = data.metafieldsSet.userErrors || [];
  if (errors.length) throw new Error(JSON.stringify(errors, null, 2));
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
  const json = await response.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors, null, 2));
  return json.data;
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
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
