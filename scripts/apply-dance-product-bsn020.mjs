#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const HANDLE = "bharatanatyam-pearls-necklace-short-ethnic-chain-bsn-020";
const ENV_FILE = "env";

const env = readEnv(ENV_FILE);
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const GRAPHQL_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;
const REST_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}`;

if (!SHOP || !TOKEN) {
  console.error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
  process.exit(1);
}

const PRODUCT_COPY = {
  title: "Bharatanatyam Short Necklace with Pearl Drops BSN-020",
  productType: "Bharatanatyam Short Necklaces",
  templateSuffix: "bharatanatyam-dance",
  seo: {
    title: "Bharatanatyam Short Necklace with Pearl Drops | Golden Collections",
    description:
      "Short Bharatanatyam and Kuchipudi dance necklace with gold finish, red-green stones and pearl drops for neckline framing, stage use and arangetram sets."
  },
  descriptionHtml: `
<p>A short Bharatanatyam necklace for neckline and upper-chest framing in classical dance costume styling. The product photo shows a gold-finish necklace with red, green and clear stones, a center pendant and white pearl drops.</p>
<ul>
  <li>Use as the short necklace layer for Bharatanatyam and Kuchipudi stage costumes.</li>
  <li>Suitable for stage performance, school programs, dance institute shows and as one layer in an arangetram jewellery set.</li>
  <li>Pair with a matching long haram, earrings, mattal, headset, waist belt and hair accessories when building a complete performance look.</li>
  <li>Compare pendant scale with dancer height, blouse neckline and any long haram worn with it before ordering.</li>
</ul>
`.trim()
};

const IMAGE_ALT = "Bharatanatyam short necklace with red green stones and pearl drops BSN-020";

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

async function gql(query, variables = {}) {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN
    },
    body: JSON.stringify({ query, variables })
  });
  const body = await res.json();
  if (body.errors?.length) throw new Error(`GraphQL errors: ${JSON.stringify(body.errors)}`);
  return body.data;
}

async function getProduct() {
  const query = `
    query ProductByHandle($query: String!) {
      products(first: 1, query: $query) {
        nodes {
          id
          legacyResourceId
          handle
          title
          productType
          templateSuffix
          descriptionHtml
          seo { title description }
          images(first: 10) { nodes { id altText url } }
          collections(first: 20) { nodes { id handle title } }
          metafields(first: 100, namespace: "dance") { nodes { namespace key type value } }
        }
      }
    }
  `;
  const data = await gql(query, { query: `handle:${HANDLE}` });
  const product = data.products.nodes[0];
  if (!product) throw new Error(`Product not found: ${HANDLE}`);
  return product;
}

function collectionIds(product, handles) {
  const byHandle = new Map(product.collections.nodes.map((collection) => [collection.handle, collection.id]));
  return handles.map((handle) => byHandle.get(handle)).filter(Boolean);
}

function danceMetafields(product) {
  const relatedCollectionIds = collectionIds(product, [
    "bharatanatyam-short-necklaces",
    "bharatanatyam-dance-necklace-long-and-short",
    "bharatanatyam-jewellery"
  ]);

  const fields = [
    ["dance_form_suitable", "list.single_line_text_field", ["Bharatanatyam", "Kuchipudi"]],
    ["dance_range", "single_line_text_field", "regular dance"],
    ["product_tier", "single_line_text_field", "regular"],
    ["dance_product_role", "list.single_line_text_field", ["short necklace"]],
    ["performance_context", "list.single_line_text_field", ["arangetram", "stage performance", "school program", "dance institute program"]],
    ["buyer_context", "list.single_line_text_field", ["adult dancer", "dance institute", "teacher"]],
    ["placement", "single_line_text_field", "Neckline / upper chest"],
    [
      "fit_notes",
      "multi_line_text_field",
      "Use this as the short necklace layer near the neckline or upper chest. Compare the pendant scale with dancer height, blouse neckline and any long haram worn with it before ordering."
    ],
    [
      "size_notes",
      "multi_line_text_field",
      "No measured necklace drop is listed for this product. Use the product photo for scale and contact Golden Collections before ordering if exact drop length is needed."
    ],
    ["measurement_confidence", "single_line_text_field", "Check product photos"],
    ["component_count", "number_integer", "1"],
    ["matching_collection_refs", "list.collection_reference", relatedCollectionIds],
    ["matching_finish", "single_line_text_field", "gold / red-green stones / pearl"],
    ["stone_color", "single_line_text_field", "red, green and clear stones with white pearl drops"],
    ["material", "single_line_text_field", "Alloy metal with gold plating"],
    ["finish", "single_line_text_field", "Gold plated dance jewellery finish"],
    [
      "care_instructions",
      "multi_line_text_field",
      "Keep away from water, perfume and sweat after use. Store separately in a dry box or pouch so the stones, pearl drops and gold finish are protected."
    ],
    [
      "quality_checks",
      "multi_line_text_field",
      "Checked for stone setting, pendant joints, cord or chain attachment, pearl drops, surface finish and packing before shipping."
    ]
  ];

  return fields
    .filter(([, , value]) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && value !== "";
    })
    .map(([key, type, value]) => ({
      ownerId: product.id,
      namespace: "dance",
      key,
      type,
      value: Array.isArray(value) ? JSON.stringify(value) : String(value)
    }));
}

async function updateProduct(product) {
  const mutation = `
    mutation ProductUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        product { id handle title productType templateSuffix seo { title description } }
        userErrors { field message }
      }
    }
  `;
  const data = await gql(mutation, {
    input: {
      id: product.id,
      title: PRODUCT_COPY.title,
      productType: PRODUCT_COPY.productType,
      templateSuffix: PRODUCT_COPY.templateSuffix,
      descriptionHtml: PRODUCT_COPY.descriptionHtml,
      seo: PRODUCT_COPY.seo
    }
  });
  const errors = data.productUpdate.userErrors || [];
  if (errors.length) throw new Error(`productUpdate: ${JSON.stringify(errors)}`);
  return data.productUpdate.product;
}

async function setMetafields(product) {
  const mutation = `
    mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { namespace key type value }
        userErrors { field message code }
      }
    }
  `;
  const data = await gql(mutation, { metafields: danceMetafields(product) });
  const errors = data.metafieldsSet.userErrors || [];
  if (errors.length) throw new Error(`metafieldsSet: ${JSON.stringify(errors)}`);
  return data.metafieldsSet.metafields;
}

async function updateImageAlt(product) {
  const image = product.images.nodes[0];
  if (!image) return null;

  const imageId = image.id.split("/").pop();
  const res = await fetch(`${REST_ENDPOINT}/products/${product.legacyResourceId}/images/${imageId}.json`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN
    },
    body: JSON.stringify({
      image: {
        id: imageId,
        alt: IMAGE_ALT
      }
    })
  });
  const body = await res.json();
  if (!res.ok || body.errors) throw new Error(`image alt update: ${JSON.stringify(body.errors || body)}`);
  return body.image;
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  const product = await getProduct();
  console.log(`[PRODUCT] ${product.handle}`);
  console.log(`[TITLE] ${product.title} -> ${PRODUCT_COPY.title}`);
  console.log(`[TEMPLATE] ${product.templateSuffix || "default"} -> ${PRODUCT_COPY.templateSuffix}`);
  console.log(`[SEO TITLE] ${product.seo?.title || "(blank)"} -> ${PRODUCT_COPY.seo.title}`);
  console.log(`[IMAGE ALT] ${product.images.nodes[0]?.altText || "(blank)"} -> ${IMAGE_ALT}`);
  console.log(`[DANCE METAFIELDS] ${danceMetafields(product).length}`);

  if (!APPLY) return;

  const updated = await updateProduct(product);
  const metafields = await setMetafields(product);
  const image = await updateImageAlt(product);

  console.log(`[UPDATED PRODUCT] ${updated.handle}`);
  console.log(`[UPDATED METAFIELDS] ${metafields.length}`);
  if (image) console.log(`[UPDATED IMAGE ALT] ${image.alt}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
