#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const APPLY = process.argv.includes("--apply");
const ENV_FILE = "env";
const OUTPUT_DIR = "tmp/black-kemp-upload";
const API_CATEGORY_NECKLACES = "gid://shopify/TaxonomyCategory/aa-6-8";
const API_VERSION_DEFAULT = "2025-10";

const products = [
  {
    sku: "BJN023",
    imagePrefix: "IMG1",
    title: "Black Kemp Green Stone Short Necklace for Bharatanatyam and Kuchipudi BJN023",
    seoTitle: "Black Kemp Green Stone Short Necklace for Bharatanatyam and Kuchipudi",
    handle: "black-kemp-green-stone-short-necklace-bharatanatyam-bjn023",
    color: "Black kemp finish with green and clear stones",
    visibleDetails: "green stone accents, clear stone highlights and repeating temple-style links",
    imageAlt: "Black kemp green stone short necklace for Bharatanatyam and Kuchipudi",
    imageDir:
      "G:/My Drive/GC/01_Products/Kemp-Jewellery/Black-Kemp-Jewellery/Short-Necklace/10_Processed-Shopify-Ready/BJN023-storefront-watermarked"
  },
  {
    sku: "BJN024",
    imagePrefix: "IMG2",
    title: "Black Kemp Pearl Short Necklace for Bharatanatyam and Kuchipudi BJN024",
    seoTitle: "Black Kemp Pearl Short Necklace for Bharatanatyam and Kuchipudi",
    handle: "black-kemp-pearl-short-necklace-bharatanatyam-bjn024",
    color: "Black kemp finish with purple stones, clear stones and pearl drops",
    visibleDetails: "purple stone rows, clear stone highlights, white pearl drops and a center pendant",
    imageAlt: "Black kemp pearl short necklace for Bharatanatyam and Kuchipudi",
    imageDir:
      "G:/My Drive/GC/01_Products/Kemp-Jewellery/Black-Kemp-Jewellery/Short-Necklace/10_Processed-Shopify-Ready/BJN024-storefront-watermarked"
  }
];

const common = {
  price: "4999.00",
  stockQty: 2,
  weightGrams: 500,
  material: "Brass with black rhodium plating",
  size: "One Size",
  setIncludes: "One necklace",
  suitableFor: "Bharatanatyam",
  vendor: "Golden Collections",
  productType: "Black Kemp Short Necklace",
  templateSuffix: "black-kemp",
  hsCode: "711719",
  origin: "IN",
  tags: [
    "black-kemp",
    "black kemp",
    "Bharatanatyam",
    "Kuchipudi",
    "arangetram jewellery",
    "bharatanatyam jewellery",
    "bharatanatyam short necklace",
    "black kemp short necklace",
    "classical dance jewellery",
    "dance necklace",
    "kemp jewellery",
    "short necklace"
  ]
};

const env = readEnv(ENV_FILE);
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || API_VERSION_DEFAULT;
const REST_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}`;
const GRAPHQL_ENDPOINT = `${REST_ENDPOINT}/graphql.json`;

if (!SHOP || !TOKEN) {
  console.error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
  process.exit(1);
}

function readEnv(file) {
  return Object.fromEntries(
    fs
      .readFileSync(file, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, "")];
      })
  );
}

async function fetchJson(url, options, attempts = 4) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const res = await fetch(url, options);
      const text = await res.text();
      const body = text ? JSON.parse(text) : {};
      if (!res.ok || body.errors) throw new Error(`HTTP ${res.status}: ${JSON.stringify(body.errors || body)}`);
      return body;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(900 * attempt);
    }
  }
  throw lastError;
}

async function gql(query, variables = {}) {
  const body = await fetchJson(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN
    },
    body: JSON.stringify({ query, variables })
  });
  if (body.errors?.length) throw new Error(`GraphQL errors: ${JSON.stringify(body.errors)}`);
  return body.data;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function descriptionHtml(product) {
  return `
<p>${product.title} is a black kemp short necklace for Bharatanatyam and Kuchipudi costume styling. The photos show ${product.visibleDetails}, giving the neckline a dark temple-jewellery contrast for stage lighting, arangetram planning and classical dance programs.</p>
<ul>
  <li>Use as the close neck or upper-chest necklace layer for Bharatanatyam and Kuchipudi costumes.</li>
  <li>Suitable for arangetram, stage performance, dance institute programs and bridal classical styling.</li>
  <li>Material: ${common.material}; ${common.size}; includes ${common.setIncludes.toLowerCase()}.</li>
  <li>Match with black kemp earrings, mattal, headset, long haram and waist belt when building a complete dance jewellery set.</li>
  <li>Keep away from water, perfume and sweat. Wipe gently after use and store in a dry pouch or box.</li>
</ul>
`.trim();
}

function seoDescription(product) {
  return `Black kemp short necklace for Bharatanatyam and Kuchipudi with ${product.visibleDetails}. One-size dance jewellery for arangetram and stage styling.`;
}

function imagePayload(product) {
  return fs
    .readdirSync(product.imageDir)
    .filter((file) => file.toLowerCase().endsWith(".jpg"))
    .sort()
    .map((file) => ({
      filename: file,
      alt: product.imageAlt,
      attachment: fs.readFileSync(path.join(product.imageDir, file)).toString("base64")
    }));
}

async function productExists(handle) {
  const data = await gql(
    `query ProductByHandle($query: String!) { products(first: 1, query: $query) { nodes { id legacyResourceId handle title } } }`,
    { query: `handle:${handle}` }
  );
  return data.products.nodes[0] || null;
}

async function createProduct(product) {
  const existing = await productExists(product.handle);
  if (existing) {
    console.log(`[EXISTS] ${product.handle}`);
    return { product: await getRestProduct(existing.legacyResourceId), created: false };
  }

  const body = {
    product: {
      title: product.title,
      body_html: descriptionHtml(product),
      vendor: common.vendor,
      product_type: common.productType,
      handle: product.handle,
      template_suffix: common.templateSuffix,
      tags: common.tags.join(", "),
      status: "active",
      published_scope: "global",
      variants: [
        {
          option1: "Default Title",
          price: common.price,
          sku: product.sku,
          barcode: product.sku,
          inventory_quantity: common.stockQty,
          inventory_management: "shopify",
          inventory_policy: "deny",
          fulfillment_service: "manual",
          taxable: false,
          requires_shipping: true,
          weight: common.weightGrams,
          weight_unit: "g"
        }
      ],
      images: imagePayload(product),
      metafields_global_title_tag: product.seoTitle,
      metafields_global_description_tag: seoDescription(product)
    }
  };

  const result = await fetchJson(`${REST_ENDPOINT}/products.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN
    },
    body: JSON.stringify(body)
  });
  console.log(`[CREATED] ${result.product.handle}`);
  return { product: result.product, created: true };
}

async function getRestProduct(productId) {
  const result = await fetchJson(`${REST_ENDPOINT}/products/${productId}.json`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN
    }
  });
  return result.product;
}

async function updateProductGraph(product, shopifyProduct) {
  const productId = shopifyProduct.admin_graphql_api_id || `gid://shopify/Product/${shopifyProduct.id}`;
  const mutation = `
    mutation ProductUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        product { id handle title category { id fullName } seo { title description } }
        userErrors { field message }
      }
    }
  `;
  const data = await gql(mutation, {
    input: {
      id: productId,
      category: API_CATEGORY_NECKLACES,
      seo: {
        title: product.seoTitle,
        description: seoDescription(product)
      },
      metafields: danceMetafields(product, productId).map(({ ownerId, ...metafield }) => metafield)
    }
  });
  const errors = data.productUpdate.userErrors || [];
  if (errors.length) throw new Error(`productUpdate ${product.sku}: ${JSON.stringify(errors)}`);
  return data.productUpdate.product;
}

function danceMetafields(product, productId) {
  const fields = [
    ["dance_form_suitable", "list.single_line_text_field", ["Bharatanatyam", "Kuchipudi"]],
    ["dance_range", "single_line_text_field", "black kemp"],
    ["product_tier", "single_line_text_field", "premium"],
    ["dance_product_role", "list.single_line_text_field", ["short necklace"]],
    ["performance_context", "list.single_line_text_field", ["arangetram", "stage performance", "dance institute program", "bridal classical styling"]],
    ["buyer_context", "list.single_line_text_field", ["adult dancer", "dance institute", "teacher", "bridal classical styling"]],
    ["placement", "single_line_text_field", "Neckline / upper chest"],
    ["fit_notes", "multi_line_text_field", "Use as the short necklace layer near the neckline or upper chest. Match the black kemp finish with the long haram, earrings, mattal and headset when building a coordinated dance set."],
    ["size_notes", "multi_line_text_field", "One Size. Check the product photos for necklace scale, pendant size and neckline coverage before ordering for a specific costume."],
    ["measurement_confidence", "single_line_text_field", "Owner confirmed"],
    ["component_count", "number_integer", "1"],
    ["matching_finish", "single_line_text_field", "black kemp"],
    ["stone_color", "single_line_text_field", product.color],
    ["material", "single_line_text_field", common.material],
    ["finish", "single_line_text_field", "Black rhodium-plated dance jewellery finish"],
    ["care_instructions", "multi_line_text_field", "Keep away from water, perfume, sweat and harsh chemicals. After use, wipe gently with a soft dry cloth and store separately in a dry box or pouch."],
    ["quality_checks", "multi_line_text_field", "Checked for visible stone setting, finish, cord or hook attachment, necklace shape, packing and shipping readiness before dispatch."]
  ];

  return fields.map(([key, type, value]) => ({
    ownerId: productId,
    namespace: "dance",
    key,
    type,
    value: Array.isArray(value) ? JSON.stringify(value) : String(value)
  }));
}

async function updateVariantAndInventory(shopifyProduct) {
  const variant = shopifyProduct.variants?.[0];
  if (!variant) throw new Error(`No variant returned for ${shopifyProduct.handle}`);

  await fetchJson(`${REST_ENDPOINT}/inventory_items/${variant.inventory_item_id}.json`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN
    },
    body: JSON.stringify({
      inventory_item: {
        id: variant.inventory_item_id,
        country_code_of_origin: common.origin,
        harmonized_system_code: common.hsCode
      }
    })
  });
}

async function publishEverywhere(productId) {
  const publications = await gql(`query { publications(first: 50) { nodes { id name } } }`);
  const input = publications.publications.nodes.map((publication) => ({ publicationId: publication.id }));
  const result = await gql(
    `mutation Publish($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) {
        publishable { ... on Product { id handle } }
        userErrors { field message }
      }
    }`,
    { id: productId, input }
  );
  const errors = result.publishablePublish.userErrors || [];
  return { publications: publications.publications.nodes, errors };
}

async function verifyProduct(handle) {
  const data = await gql(
    `query Verify($query: String!) {
      products(first: 1, query: $query) {
        nodes {
          id legacyResourceId handle title status productType templateSuffix tags
          category { id fullName }
          seo { title description }
          onlineStoreUrl
          images(first: 10) { nodes { altText url } }
          variants(first: 1) {
            nodes {
              sku barcode price taxable inventoryQuantity
              inventoryItem { countryCodeOfOrigin harmonizedSystemCode measurement { weight { value unit } } }
            }
          }
          resourcePublications(first: 20) { nodes { publication { name } isPublished } }
          metafields(first: 30, namespace: "dance") { nodes { key value type } }
        }
      }
    }`,
    { query: `handle:${handle}` }
  );
  return data.products.nodes[0];
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");

  const results = [];
  for (const product of products) {
    const imageCount = imagePayload(product).length;
    console.log(`[PRODUCT] ${product.sku} ${product.handle} images=${imageCount}`);
    if (!APPLY) continue;

    const created = await createProduct(product);
    await updateVariantAndInventory(created.product);
    await updateProductGraph(product, created.product);
    const productId = created.product.admin_graphql_api_id || `gid://shopify/Product/${created.product.id}`;
    const publish = await publishEverywhere(productId);
    const verified = await verifyProduct(product.handle);
    results.push({ sku: product.sku, created: created.created, publishErrors: publish.errors, product: verified });
    await sleep(500);
  }

  const reportPath = path.join(OUTPUT_DIR, `black-kemp-short-necklace-upload-${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({ products: results }, null, 2));
  console.log(`[REPORT] ${reportPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
