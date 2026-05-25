import fs from "node:fs";
import path from "node:path";
import { readEnv, root } from "./meta-lib.mjs";

const env = readEnv();
const shop = env.SHOPIFY_STORE_DOMAIN;
const token = env.SHOPIFY_ADMIN_TOKEN;
const apiVersion = env.SHOPIFY_API_VERSION || "2025-10";

if (!shop || !token) throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN");

const publications = await shopifyGql(`
  query Publications($first: Int!) {
    publications(first: $first) {
      nodes {
        id
        name
        app { id title }
      }
    }
  }
`, { first: 50 });

const publicationNodes = publications.publications.nodes;
const target = publicationNodes.find((publication) => publication.name === "Facebook & Instagram");
if (!target) throw new Error("Could not find Shopify publication named Facebook & Instagram");

const audit = await auditPublication(target.id);
const report = {
  checked_at: new Date().toISOString(),
  target_publication: target,
  publications: publicationNodes.map((publication) => ({
    id: publication.id,
    name: publication.name,
    app_title: publication.app?.title || null,
  })),
  facebook_instagram: audit,
};

const outPath = path.join(root, "tmp", `meta-shopify-channel-audit-${new Date().toISOString().slice(0, 10)}.json`);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

console.log(JSON.stringify({
  outputPath: outPath,
  targetPublication: target.name,
  activeProductsChecked: audit.active_products_checked,
  publishedToFacebookInstagram: audit.published_to_publication,
  notPublished: audit.not_published,
  missingPreview: audit.missing_preview,
}, null, 2));

async function auditPublication(publicationId) {
  const query = `
    query Products($first: Int!, $after: String, $publicationId: ID!) {
      products(first: $first, after: $after, query: "status:active") {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          title
          handle
          publishedOnPublication(publicationId: $publicationId)
          featuredMedia { preview { image { url } } }
        }
      }
    }
  `;

  let after = null;
  let activeProductsChecked = 0;
  let publishedToPublication = 0;
  const missing = [];

  do {
    const data = await shopifyGql(query, { first: 250, after, publicationId });
    for (const product of data.products.nodes) {
      activeProductsChecked += 1;
      if (product.publishedOnPublication) {
        publishedToPublication += 1;
      } else {
        missing.push({
          title: product.title,
          handle: product.handle,
          has_image: Boolean(product.featuredMedia?.preview?.image?.url),
        });
      }
    }
    after = data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor : null;
  } while (after);

  return {
    active_products_checked: activeProductsChecked,
    published_to_publication: publishedToPublication,
    not_published: activeProductsChecked - publishedToPublication,
    missing_preview: missing.slice(0, 25),
  };
}

async function shopifyGql(query, variables = {}) {
  const res = await fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) {
    throw new Error(`Shopify GraphQL error: ${JSON.stringify(json.errors || json)}`);
  }
  return json.data;
}
