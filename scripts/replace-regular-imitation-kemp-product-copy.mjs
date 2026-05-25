import fs from "fs";
import path from "path";

const root = process.cwd();
const APPLY = process.argv.includes("--apply");
const env = Object.fromEntries(
  fs.readFileSync(path.join(root, "env"), "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);

const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";

const OLD_SENTENCE = "For arangetram or premium long-term use, many dancers choose real kemp jewellery; this piece is from the regular imitation kemp dance range.";
const NEW_SENTENCE = "For arangetram or premium long-term use, many dancers choose real kemp jewellery; this piece is from the regular Bharatanatyam/Kuchipudi dance jewellery range.";

if (!SHOP || !TOKEN) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
}

async function gql(query, variables = {}) {
  const res = await fetch(`https://${SHOP}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok || json.errors) {
    throw new Error(`GraphQL HTTP ${res.status}: ${text}`);
  }
  return json.data;
}

async function fetchProducts() {
  const products = [];
  let cursor = null;
  do {
    const data = await gql(
      `query($query:String!, $cursor:String) {
        products(first: 100, after: $cursor, query: $query) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            title
            handle
            status
            onlineStoreUrl
            descriptionHtml
          }
        }
      }`,
      { query: `"${OLD_SENTENCE}"`, cursor },
    );
    products.push(...data.products.nodes);
    cursor = data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor : null;
  } while (cursor);
  return products.filter((product) => product.descriptionHtml?.includes(OLD_SENTENCE));
}

async function updateProduct(product) {
  const descriptionHtml = product.descriptionHtml.split(OLD_SENTENCE).join(NEW_SENTENCE);
  const data = await gql(
    `mutation($input: ProductInput!) {
      productUpdate(input: $input) {
        product { id title handle status }
        userErrors { field message }
      }
    }`,
    { input: { id: product.id, descriptionHtml } },
  );
  const errors = data.productUpdate.userErrors || [];
  if (errors.length) {
    throw new Error(`productUpdate ${product.handle}: ${JSON.stringify(errors)}`);
  }
  return data.productUpdate.product;
}

const products = await fetchProducts();
const outputDir = path.join(root, "tmp", "regular-kemp-copy-cleanup-2026-05-16");
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  path.join(outputDir, APPLY ? "before-apply.json" : "dry-run.json"),
  JSON.stringify(
    {
      createdAt: new Date().toISOString(),
      apply: APPLY,
      oldSentence: OLD_SENTENCE,
      newSentence: NEW_SENTENCE,
      count: products.length,
      products: products.map(({ id, title, handle, status, onlineStoreUrl }) => ({
        id,
        title,
        handle,
        status,
        onlineStoreUrl,
      })),
    },
    null,
    2,
  ),
);

const updated = [];
if (APPLY) {
  for (const product of products) {
    updated.push(await updateProduct(product));
  }
  const remaining = await fetchProducts();
  fs.writeFileSync(
    path.join(outputDir, "after-apply.json"),
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        updatedCount: updated.length,
        remainingCount: remaining.length,
        updated,
        remaining: remaining.map(({ id, title, handle, status, onlineStoreUrl }) => ({
          id,
          title,
          handle,
          status,
          onlineStoreUrl,
        })),
      },
      null,
      2,
    ),
  );
}

console.log(JSON.stringify({ apply: APPLY, matchedCount: products.length, updatedCount: updated.length }, null, 2));
