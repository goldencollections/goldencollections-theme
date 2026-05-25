#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const ENV_FILE = "env";
const GPC_RELIGIOUS_ITEMS = "97";

const COLLECTIONS_TO_FETCH = [
  "lotus-asana-deity-peedam-kamal-aasan",
  "coconut-stand",
  "deity-accessories-nose-rings-mustache-weapons-taira"
];

const PRODUCT_CONFIGS = {
  "divine-lotus-stand-for-varalakshmi-vratham-goldencollections-dgs-015": lotus("DGS-015", "14"),
  "kamal-lotus-for-goddess-asanam-ideal-for-vratham-decoration-dgs-014": lotus("DGS-014", "12"),
  "lotus-asan-for-devi-alangaram-varalakshmi-vratham-decoration-dgs-012": lotus("DGS-012", "10"),
  "varalakshmi-pink-lotus-kamal-asanam-for-goddess-alangaram-dgs-013": lotus("DGS-013", "13"),
  "lakshmi-pooja-kalasam-decoration-seven-point-support": {
    code: "DAC-002",
    title: "German Silver Coconut Stand for Pooja 5 Point Support DAC-002",
    type: "Deity Accessories- Coconut Stand",
    ornament: "Coconut Stand / Kalasam Support",
    placement: "Kalasam / coconut base / pooja setup",
    material: "German Silver",
    componentCount: 1,
    included: "One German Silver coconut stand / 5 point kalasam support as shown in photos",
    fit:
      "Length 5.5 inches means vertical stand height. Width 4 inches means base width. Compare the stand with your coconut, kalasam base, flower decoration and pooja space before ordering.",
    height: "5.5",
    width: "4",
    rangeType: "Pooja Decor",
    compatibilityClass: "General Pooja Decor",
    primary: "multi",
    compatible: ["multi", "varalakshmi"],
    compatibleNames: ["General pooja and deity setups", "Varalakshmi / Lakshmi / Amman"],
    regionals: ["Coconut stand", "Kalasam stand", "Pooja coconut support", "Coconut holder", "Varalakshmi coconut stand", "Lakshmi Pooja stand", "German Silver stand", "5 point support"]
  },
  "varalakshmi-pooja-kalasam-decoration-flower-stand-stick": {
    code: "DAC-013",
    title: "German Silver Flower Stand Stick for Varalakshmi Pooja DAC-013",
    type: "Deity Accessories- Coconut Stand",
    ornament: "Flower Stand Stick / Kalasam Decor Stand",
    placement: "Kalasam / flower decoration / pooja setup",
    material: "German Silver",
    componentCount: 1,
    included: "One German Silver flower stand stick as shown in photos",
    fit:
      "Length 10.5 inches means the stand/stick width, not vertical height. Compare the width with your kalasam, flower decoration and pooja setup before ordering.",
    width: "10.5",
    rangeType: "Pooja Decor",
    compatibilityClass: "General Pooja Decor",
    primary: "multi",
    compatible: ["multi", "varalakshmi"],
    compatibleNames: ["General pooja and deity setups", "Varalakshmi / Lakshmi / Amman"],
    regionals: ["Flower stand stick", "Kalasam flower stand", "Pooja stand stick", "Varalakshmi flower stand", "Lakshmi Pooja stand", "German Silver stand", "Kalasam decor stand"]
  },
  "deity-sun-and-moon-jewellery-sun-moon-billai-for-gods-goddesses-dsm001": {
    code: "DSM-001",
    title: "Goddess Sun and Moon Billai Pair with Stone Work DSM-001",
    type: "Deity Accessories- Sun Moon",
    ornament: "Sun and Moon Billai",
    placement: "Head / hair / crown side / goddess alankaram",
    material: "Alloy metal with stone work",
    componentCount: 2,
    included: "Pair set of Sun and Moon Billai ornaments as shown in photos",
    fit:
      "Size in cms (L x W) means Length/height x front width. Keep the cm values in fit notes and compare the pair with the goddess idol head, crown side, hair area and nearby jewellery before ordering.",
    rangeType: "Deity Alankaram Accessory",
    compatibilityClass: "Goddess Specific",
    primary: "varalakshmi",
    compatible: ["varalakshmi", "durga"],
    compatibleNames: ["Varalakshmi / Lakshmi / Amman", "Durga / Devi / Amman / Parvati"],
    regionals: ["Sun Moon Billai", "Surya Chandra Billai", "Sun and Moon ornaments", "Goddess Billai", "Amman Billai", "Lakshmi head ornament", "Devi head jewellery"]
  },
  "deity-god-moon-billai-jewellery-by-goldencollections-dsm002": {
    code: "DSM-002",
    title: "Goddess Moon Billai Ornament with Stone Work DSM-002",
    type: "Deity Accessories- Sun Moon",
    ornament: "Moon Billai",
    placement: "Head / hair / crown side / goddess alankaram",
    material: "Alloy metal with stone work",
    componentCount: 1,
    included: "One Moon Billai ornament as shown in photos",
    fit:
      "Size in cms (L x W) means Length/height x front width. Keep the cm values in fit notes and compare the Moon Billai with the goddess idol head, crown side, hair area and nearby jewellery before ordering.",
    rangeType: "Deity Alankaram Accessory",
    compatibilityClass: "Goddess Specific",
    primary: "varalakshmi",
    compatible: ["varalakshmi", "durga"],
    compatibleNames: ["Varalakshmi / Lakshmi / Amman", "Durga / Devi / Amman / Parvati"],
    regionals: ["Moon Billai", "Chandra Billai", "Goddess Billai", "Amman Billai", "Lakshmi head ornament", "Devi head jewellery"]
  }
};

const DEITY_HANDLES = {
  multi: "multi-deity",
  varalakshmi: "varalakshmi-lakshmi-amman",
  durga: "durga-devi-amman-parvati"
};

const ORNAMENT_HANDLES = {
  general: "general-accessories"
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

function lotus(code, length) {
  return {
    code,
    title: `Lotus Asana Deity Peedam with Velvet Cloth ${code}`,
    type: "Deity Accessories- Lotus",
    ornament: "Lotus Asana / Deity Peedam / Kamal Aasan",
    placement: "Idol base / altar / goddess alankaram",
    material: "Cardboard with velvet cloth",
    componentCount: 1,
    included: "One Lotus Asana / deity Peedam as shown in photos",
    fit:
      `Length ${length} inches means the across/diameter size of the lotus seat, not vertical height. Compare the lotus diameter with the idol base, dress spread, kalasam area and altar depth before ordering.`,
    width: length,
    rangeType: "Pooja Decor",
    compatibilityClass: "Goddess Focused",
    primary: "varalakshmi",
    compatible: ["varalakshmi", "durga"],
    compatibleNames: ["Varalakshmi / Lakshmi / Amman", "Other goddess idols when the base size fits"],
    regionals: ["Lotus Asana", "Kamal Aasan", "Thamarai Peedam", "Padma Peetam", "Lotus Peedam", "Lotus stand", "Deity Peedam", "Varalakshmi lotus", "Lakshmi lotus asana"]
  };
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

async function gql(query, variables = {}) {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN },
    body: JSON.stringify({ query, variables })
  });
  const body = await res.json();
  if (body.errors?.length) throw new Error(`GraphQL errors: ${JSON.stringify(body.errors)}`);
  return body.data;
}

async function rest(path, options = {}) {
  const res = await fetch(`${REST_ENDPOINT}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN, ...(options.headers || {}) }
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(`REST ${options.method || "GET"} ${path}: ${res.status} ${text}`);
  return body;
}

function metafield(ownerId, namespace, key, type, value) {
  return { ownerId, namespace, key, type, value: String(value) };
}

async function fetchMetaobjectRefs(type, handles) {
  const refs = {};
  for (const [key, handle] of Object.entries(handles)) {
    const data = await gql(
      `query Metaobject($handle: MetaobjectHandleInput!) {
        metaobjectByHandle(handle: $handle) { id handle fields { key value } }
      }`,
      { handle: { type, handle } }
    );
    if (data.metaobjectByHandle) refs[key] = data.metaobjectByHandle;
  }
  return refs;
}

async function fetchProducts() {
  const map = new Map();
  for (const handle of COLLECTIONS_TO_FETCH) {
    let after = null;
    do {
      const data = await gql(
        `query Products($handle: String!, $after: String) {
          collectionByHandle(handle: $handle) {
            products(first: 100, after: $after) {
              pageInfo { hasNextPage endCursor }
              nodes {
                id legacyResourceId handle title status totalInventory productType tags templateSuffix
                seo { title description }
                images(first: 50) { nodes { id altText } }
                variants(first: 100) { nodes { id legacyResourceId title sku barcode selectedOptions { name value } } }
                metafields(first: 100) { nodes { namespace key value type } }
              }
            }
          }
        }`,
        { handle, after }
      );
      const conn = data.collectionByHandle.products;
      for (const product of conn.nodes) {
        if (PRODUCT_CONFIGS[product.handle]) map.set(product.handle, product);
      }
      after = conn.pageInfo.hasNextPage ? conn.pageInfo.endCursor : null;
    } while (after);
  }
  return [...map.values()];
}

function cmSizeNotes(product) {
  const values = product.variants.nodes
    .flatMap((variant) => variant.selectedOptions)
    .filter((option) => /cms?/i.test(option.name))
    .map((option) => `${option.value} cm`);
  return [...new Set(values)];
}

function productDescription(product, config) {
  const cm = cmSizeNotes(product);
  const cmText = cm.length ? ` Available cm size labels: ${cm.join(", ")}.` : "";
  return [
    `<p>${config.title} is a pooja and deity alankaram accessory from Golden Collections.</p>`,
    `<p><strong>Material:</strong> ${config.material}.</p>`,
    `<p><strong>Included:</strong> ${config.included}.</p>`,
    `<p><strong>Compatibility:</strong> ${config.compatibleNames.join(", ")}.</p>`,
    `<p><strong>Fit guidance:</strong> ${config.fit}${cmText}</p>`,
    "<p>Use the product photos to compare front scale, base size, placement clearance and nearby decorations before ordering.</p>"
  ].join("");
}

function seoDescription(config) {
  return `Shop ${config.title}. Material: ${config.material}. Check included pieces, size meaning, compatibility and product photos before ordering.`.slice(0, 200);
}

function tags(product, config) {
  return [
    ...new Set([
      ...config.regionals,
      ...config.compatibleNames,
      config.ornament,
      config.code,
      "Pooja Decor",
      "Deity Alankaram",
      "Golden Collections"
    ])
  ];
}

function productMetafields(product, config, refs) {
  const deityRefIds = config.compatible.map((key) => refs.deities[key]?.id).filter(Boolean);
  const inputs = [
    metafield(product.id, "custom", "range_type", "single_line_text_field", config.rangeType),
    metafield(product.id, "custom", "ornament_type", "single_line_text_field", config.ornament),
    metafield(product.id, "custom", "placement", "single_line_text_field", config.placement),
    metafield(product.id, "custom", "material", "single_line_text_field", config.material),
    metafield(product.id, "custom", "compatibility_class", "single_line_text_field", config.compatibilityClass),
    metafield(product.id, "custom", "compatible_deities", "list.single_line_text_field", JSON.stringify(config.compatibleNames)),
    metafield(product.id, "custom", "compatible_deity_refs", "list.metaobject_reference", JSON.stringify(deityRefIds)),
    metafield(product.id, "custom", "primary_deity_ref", "metaobject_reference", refs.deities[config.primary]?.id || deityRefIds[0]),
    metafield(product.id, "custom", "fit_notes", "multi_line_text_field", `${config.fit}${cmSizeNotes(product).length ? ` CM size labels: ${cmSizeNotes(product).join(", ")}.` : ""}`),
    metafield(product.id, "custom", "size_confidence", "single_line_text_field", "Owner confirmed size meaning"),
    metafield(product.id, "custom", "component_count", "number_integer", String(config.componentCount)),
    metafield(product.id, "custom", "set_items_included", "list.single_line_text_field", JSON.stringify([config.included])),
    metafield(product.id, "custom", "regional_names", "list.single_line_text_field", JSON.stringify(config.regionals)),
    metafield(product.id, "custom", "ornament_type_ref", "metaobject_reference", refs.ornaments.general.id),
    metafield(product.id, "mm-google-shopping", "google_product_category", "string", GPC_RELIGIOUS_ITEMS),
    metafield(product.id, "mc-facebook", "google_product_category", "string", GPC_RELIGIOUS_ITEMS),
    metafield(product.id, "mm-google-shopping", "condition", "string", "new"),
    metafield(product.id, "mm-google-shopping", "custom_product", "boolean", "true")
  ];
  if (config.height) inputs.push(metafield(product.id, "custom", "ornament_height_in", "number_decimal", config.height));
  if (config.width) inputs.push(metafield(product.id, "custom", "ornament_width_in", "number_decimal", config.width));
  return inputs;
}

async function setMetafields(inputs) {
  for (let index = 0; index < inputs.length; index += 20) {
    const chunk = inputs.slice(index, index + 20).filter((input) => input.value !== "undefined" && input.value !== "");
    if (!chunk.length) continue;
    if (!APPLY) {
      console.log(`[DRY METAFIELDS] ${chunk.length}`);
      continue;
    }
    const data = await gql(
      `mutation SetMetafields($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) { userErrors { field message code } }
      }`,
      { metafields: chunk }
    );
    const errors = data.metafieldsSet.userErrors || [];
    if (errors.length) throw new Error(`metafieldsSet: ${JSON.stringify(errors)}`);
  }
}

async function updateProduct(product, config) {
  if (!APPLY) {
    console.log(`[DRY PRODUCT] ${product.handle}: ${product.title} -> ${config.title}`);
    return;
  }
  const data = await gql(
    `mutation ProductUpdate($input: ProductInput!) {
      productUpdate(input: $input) { userErrors { field message } }
    }`,
    {
      input: {
        id: product.id,
        title: config.title,
        productType: config.type,
        templateSuffix: "deity-lite",
        descriptionHtml: productDescription(product, config),
        tags: tags(product, config),
        seo: {
          title: `${config.title} | Golden Collections`.slice(0, 70),
          description: seoDescription(config)
        }
      }
    }
  );
  const errors = data.productUpdate.userErrors || [];
  if (errors.length) throw new Error(`productUpdate ${product.handle}: ${JSON.stringify(errors)}`);
  await updateImageAlts(product, config);
}

async function updateImageAlts(product, config) {
  for (const [index, image] of product.images.nodes.entries()) {
    const imageId = image.id.split("/").pop();
    const alt = `${config.title} ${config.ornament} pooja decor image ${index + 1}`;
    await rest(`/products/${product.legacyResourceId}/images/${imageId}.json`, {
      method: "PUT",
      body: JSON.stringify({ image: { id: Number(imageId), alt } })
    });
  }
}

async function deleteWrongGoogleFields(products) {
  const identifiers = products.flatMap((product) => [
    { ownerId: product.id, namespace: "mm-google-shopping", key: "age_group" },
    { ownerId: product.id, namespace: "mm-google-shopping", key: "gender" }
  ]);
  if (!APPLY) {
    console.log(`[DRY DELETE] ${identifiers.length} age/gender metafields`);
    return;
  }
  const data = await gql(
    `mutation DeleteMetafields($metafields: [MetafieldIdentifierInput!]!) {
      metafieldsDelete(metafields: $metafields) { userErrors { field message } }
    }`,
    { metafields: identifiers }
  );
  const errors = data.metafieldsDelete.userErrors || [];
  if (errors.length) throw new Error(`metafieldsDelete: ${JSON.stringify(errors)}`);
}

async function updateVariantSkuBarcodes(products) {
  let updated = 0;
  for (const product of products) {
    for (const variant of product.variants.nodes) {
      const targetSku = variant.sku || PRODUCT_CONFIGS[product.handle].code;
      if (!targetSku || (variant.sku === targetSku && variant.barcode === targetSku)) continue;
      if (APPLY) {
        await rest(`/variants/${variant.legacyResourceId}.json`, {
          method: "PUT",
          body: JSON.stringify({ variant: { id: Number(variant.legacyResourceId), sku: targetSku, barcode: targetSku } })
        });
      }
      updated += 1;
    }
  }
  console.log(`${APPLY ? "Updated" : "Would update"} ${updated} variant SKU/barcodes.`);
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  const refs = {
    deities: await fetchMetaobjectRefs("deity_group", DEITY_HANDLES),
    ornaments: await fetchMetaobjectRefs("deity_ornament_type", ORNAMENT_HANDLES)
  };
  const products = await fetchProducts();
  console.log(`Products to update: ${products.length}`);
  await setMetafields(products.flatMap((product) => productMetafields(product, PRODUCT_CONFIGS[product.handle], refs)));
  for (const product of products) await updateProduct(product, PRODUCT_CONFIGS[product.handle]);
  await deleteWrongGoogleFields(products);
  await updateVariantSkuBarcodes(products);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
