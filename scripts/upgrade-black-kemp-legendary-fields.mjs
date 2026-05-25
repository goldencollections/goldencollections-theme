#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const ENV_FILE = "env";
const OUTPUT_DIR = "tmp/black-kemp-legendary";

const products = [
  {
    sku: "BJN023",
    handle: "black-kemp-green-stone-short-necklace-bharatanatyam-bjn023",
    title: "Black Kemp Green Purple Short Necklace for Bharatanatyam and Kuchipudi BJN023",
    seoTitle: "Black Kemp Green Purple Short Necklace BJN023",
    seoDescription:
      "Black kemp short necklace for Bharatanatyam and Kuchipudi with green, purple and clear stones for arangetram and stage performance.",
    color: "Black/Green/Purple/Clear",
    colorText: "black kemp finish with green, purple and clear stones",
    visibleDetails: "green center stones, purple/maroon kemp stones and clear stone highlights",
    imageAlts: [
      "Black kemp green purple short necklace for Bharatanatyam front view BJN023",
      "Black kemp green purple short necklace with red tie cord angled view BJN023",
      "Black kemp green purple stones close-up on Bharatanatyam short necklace BJN023"
    ]
  },
  {
    sku: "BJN024",
    handle: "black-kemp-pearl-short-necklace-bharatanatyam-bjn024",
    title: "Black Kemp Pearl Purple Short Necklace for Bharatanatyam and Kuchipudi BJN024",
    seoTitle: "Black Kemp Pearl Purple Short Necklace BJN024",
    seoDescription:
      "Black kemp pearl short necklace for Bharatanatyam and Kuchipudi with purple stones, clear highlights and pearl drops for stage styling.",
    color: "Black/Purple/Clear/White",
    colorText: "black kemp finish with purple stones, clear highlights and white pearl drops",
    visibleDetails: "purple stone rows, clear stone highlights, white pearl drops and a center pendant",
    imageAlts: [
      "Black kemp pearl purple short necklace for Bharatanatyam front view BJN024",
      "Black kemp pearl short necklace with purple stones angled view BJN024",
      "Black kemp pearl drops and purple stone pendant close-up BJN024"
    ]
  }
];

const common = {
  brand: "Golden Collections",
  productType: "Black Kemp Short Necklace",
  material: "Brass with black rhodium plating",
  jewelryMaterial: "Brass",
  jewelryType: "Necklace",
  necklaceDesign: "Short necklace / choker-style dance necklace",
  finish: "Black rhodium-plated dance jewellery finish",
  size: "One Size",
  setIncludes: "One necklace",
  targetGender: "female",
  ageGroup: "adult",
  origin: "India",
  originCode: "IN",
  hsnCode: "711719",
  googleProductCategory: "196",
  weight: "500 g",
  condition: "new",
  customProduct: "true"
};

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
      if (attempt < attempts) await sleep(700 * attempt);
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

function productDescription(product) {
  return `
<p>${product.title} is a black kemp short necklace for Bharatanatyam and Kuchipudi costume styling. The product photos show ${product.visibleDetails}, giving the neckline a clear temple-jewellery contrast for arangetram planning, dance institute programs and classical stage performance.</p>
<ul>
  <li>Use as the close neck or upper-chest necklace layer above the blouse neckline.</li>
  <li>Suitable for Bharatanatyam, Kuchipudi, arangetram, stage performance and bridal classical styling.</li>
  <li>Material: ${common.material}; ${common.size}; includes ${common.setIncludes.toLowerCase()}.</li>
  <li>Match with black kemp earrings, mattal, headset, long haram and waist belt when building a coordinated dance jewellery set.</li>
  <li>For best fit, compare the necklace scale in the photos with dancer age, costume neckline and any long haram worn below it.</li>
  <li>Keep away from water, perfume and sweat. Wipe gently after use and store in a dry pouch or box.</li>
</ul>
`.trim();
}

function productDetails(product) {
  return [
    { label: "Brand", value: common.brand },
    { label: "Product type", value: common.productType },
    { label: "Jewellery type", value: common.jewelryType },
    { label: "Necklace design", value: common.necklaceDesign },
    { label: "Dance forms", value: "Bharatanatyam, Kuchipudi" },
    { label: "Placement", value: "Neckline / upper chest" },
    { label: "Material", value: common.material },
    { label: "Finish", value: common.finish },
    { label: "Visible color and stones", value: product.colorText },
    { label: "Size", value: common.size },
    { label: "Set includes", value: common.setIncludes },
    { label: "Age group", value: common.ageGroup },
    { label: "Target gender", value: common.targetGender },
    { label: "Country of origin", value: common.origin },
    { label: "HSN / HS code", value: common.hsnCode },
    { label: "Weight", value: common.weight }
  ];
}

function productFaqs(product) {
  return [
    {
      question: "What is this black kemp short necklace used for?",
      answer:
        "It is worn as the short necklace layer near the neckline for Bharatanatyam and Kuchipudi costumes, including arangetram and stage performances."
    },
    {
      question: "What is included with this product?",
      answer: "This listing includes one black kemp short necklace. Matching earrings, mattal, headset, long haram and waist belt are sold separately unless shown as part of a separate set."
    },
    {
      question: "Is it suitable for adult Bharatanatyam dancers?",
      answer:
        "Yes. This product is listed for adult Bharatanatyam and Kuchipudi styling. For kids or group orders, compare the product photos with costume neckline and dancer size before ordering."
    },
    {
      question: "What colors are visible in this necklace?",
      answer: `The product photos show ${product.colorText}.`
    },
    {
      question: "How should black kemp jewellery be cared for?",
      answer:
        "Keep it away from water, perfume, sweat and harsh chemicals. After use, wipe it gently with a soft dry cloth and store it separately in a dry box or pouch."
    }
  ];
}

function keyFeatures(product) {
  return [
    "Black kemp short necklace for classical dance costume styling",
    product.visibleDetails,
    "Designed for Bharatanatyam, Kuchipudi, arangetram and stage performance",
    "One necklace included",
    "Works as the neckline or upper-chest layer in a coordinated black kemp set"
  ];
}

function aiProductIntelligence(product) {
  return {
    brand: common.brand,
    sku: product.sku,
    product_type: common.productType,
    category: "Apparel & Accessories > Jewelry > Necklaces",
    dance_range: "black kemp",
    dance_forms: ["Bharatanatyam", "Kuchipudi"],
    target_gender: common.targetGender,
    age_group: common.ageGroup,
    material: common.material,
    jewelry_material: common.jewelryMaterial,
    jewelry_type: common.jewelryType,
    necklace_design: common.necklaceDesign,
    visible_colors: product.color.split("/"),
    set_includes: common.setIncludes,
    placement: "Neckline / upper chest",
    country_of_origin: common.origin,
    hsn_code: common.hsnCode,
    agent_summary: `${product.title} is a one-piece black kemp short necklace for Bharatanatyam and Kuchipudi neckline styling.`
  };
}

async function getProduct(handle) {
  const data = await gql(
    `query ProductByHandle($query: String!) {
      products(first: 1, query: $query) {
        nodes {
          id legacyResourceId handle title
          images(first: 10) { nodes { id altText url } }
          metafields(first: 250) { nodes { namespace key type value } }
        }
      }
    }`,
    { query: `handle:${handle}` }
  );
  const product = data.products.nodes[0];
  if (!product) throw new Error(`Product not found: ${handle}`);
  return product;
}

function metafields(product, ownerId) {
  const values = [
    ["custom", "brand", "single_line_text_field", common.brand],
    ["custom", "country_of_origin", "single_line_text_field", common.origin],
    ["custom", "hsn_code", "single_line_text_field", common.hsnCode],
    ["custom", "product_details", "json", productDetails(product)],
    ["custom", "product_faqs", "json", productFaqs(product)],
    ["custom", "key_features", "json", keyFeatures(product)],
    ["custom", "ai_product_intelligence", "json", aiProductIntelligence(product)],
    ["custom", "material", "single_line_text_field", common.material],
    ["custom", "component_count", "number_integer", "1"],
    ["custom", "set_items_included", "list.single_line_text_field", [common.setIncludes]],
    ["mm-google-shopping", "google_product_category", "string", common.googleProductCategory],
    ["mm-google-shopping", "condition", "string", common.condition],
    ["mm-google-shopping", "custom_product", "boolean", common.customProduct],
    ["mm-google-shopping", "age_group", "string", common.ageGroup],
    ["mm-google-shopping", "gender", "string", common.targetGender],
    ["mm-google-shopping", "color", "string", product.color],
    ["mm-google-shopping", "material", "string", common.jewelryMaterial],
    ["mm-google-shopping", "size", "string", common.size],
    ["mc-facebook", "google_product_category", "string", common.googleProductCategory],
    ["mc-facebook", "condition", "string", common.condition],
    ["mc-facebook", "age_group", "string", common.ageGroup],
    ["mc-facebook", "gender", "string", common.targetGender],
    ["mc-facebook", "color", "string", product.color],
    ["mc-facebook", "material", "string", common.jewelryMaterial],
    ["dance", "buyer_context", "list.single_line_text_field", ["adult dancer", "dance institute", "teacher", "bridal classical styling"]],
    ["dance", "stone_color", "single_line_text_field", product.colorText],
    ["dance", "measurement_confidence", "single_line_text_field", "Owner confirmed size label; exact measurement pending"],
    [
      "dance",
      "size_notes",
      "multi_line_text_field",
      "One Size. Exact necklace drop/width is not listed yet; compare the product photos with costume neckline and dancer size before ordering."
    ]
  ];
  return values.map(([namespace, key, type, value]) => ({
    ownerId,
    namespace,
    key,
    type,
    value: Array.isArray(value) || typeof value === "object" ? JSON.stringify(value) : String(value)
  }));
}

async function updateProduct(product, shopifyProduct) {
  const mutation = `
    mutation ProductUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        product { id handle title seo { title description } descriptionHtml }
        userErrors { field message }
      }
    }
  `;
  const data = await gql(mutation, {
    input: {
      id: shopifyProduct.id,
      title: product.title,
      descriptionHtml: productDescription(product),
      seo: {
        title: product.seoTitle,
        description: product.seoDescription
      }
    }
  });
  const errors = data.productUpdate.userErrors || [];
  if (errors.length) throw new Error(`productUpdate ${product.sku}: ${JSON.stringify(errors)}`);
  return data.productUpdate.product;
}

async function setMetafields(inputs) {
  const mutation = `
    mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { namespace key type value }
        userErrors { field message code }
      }
    }
  `;
  const written = [];
  for (let index = 0; index < inputs.length; index += 20) {
    const chunk = inputs.slice(index, index + 20);
    const data = await gql(mutation, { metafields: chunk });
    const errors = data.metafieldsSet.userErrors || [];
    if (errors.length) throw new Error(`metafieldsSet: ${JSON.stringify(errors)}`);
    written.push(...data.metafieldsSet.metafields);
  }
  return written;
}

async function updateImageAlts(product, shopifyProduct) {
  const images = shopifyProduct.images.nodes;
  const updates = [];
  for (let index = 0; index < images.length; index += 1) {
    const image = images[index];
    const imageId = image.id.split("/").pop();
    const alt = product.imageAlts[index] || product.seoTitle;
    if (!APPLY) {
      updates.push({ imageId, alt });
      continue;
    }
    const result = await fetchJson(`${REST_ENDPOINT}/products/${shopifyProduct.legacyResourceId}/images/${imageId}.json`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": TOKEN
      },
      body: JSON.stringify({ image: { id: Number(imageId), alt } })
    });
    updates.push({ imageId, alt: result.image.alt });
  }
  return updates;
}

async function verify(handle) {
  const data = await gql(
    `query Verify($query: String!) {
      products(first: 1, query: $query) {
        nodes {
          handle title seo { title description }
          media(first: 10) { nodes { alt mediaContentType ... on MediaImage { image { altText width height } } } }
          metafields(first: 250) { nodes { namespace key type value } }
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
  const report = [];
  for (const product of products) {
    const shopifyProduct = await getProduct(product.handle);
    console.log(`[UPGRADE] ${product.sku} ${shopifyProduct.handle}`);
    if (APPLY) {
      await updateProduct(product, shopifyProduct);
      await setMetafields(metafields(product, shopifyProduct.id));
    }
    const imageUpdates = await updateImageAlts(product, shopifyProduct);
    const verified = APPLY ? await verify(product.handle) : null;
    report.push({ sku: product.sku, handle: product.handle, imageUpdates, verified });
  }
  const reportPath = `${OUTPUT_DIR}/black-kemp-legendary-upgrade-${new Date().toISOString().slice(0, 10)}.json`;
  fs.writeFileSync(reportPath, JSON.stringify({ products: report }, null, 2));
  console.log(`[REPORT] ${reportPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
