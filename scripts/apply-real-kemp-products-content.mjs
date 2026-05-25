#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const VERIFY = process.argv.includes("--verify");
const SKIP_UPDATED = process.argv.includes("--skip-updated");
const ENV_FILE = "env";
const OUTPUT_DIR = "tmp/real-kemp";
const TARGET_TEMPLATE = "real-kemp";

const REAL_KEMP_COLLECTION_HANDLES = [
  "kemp-bharatanatyam-jewellery-dance-sets",
  "kemp-short-haram",
  "kemp-long-necklace",
  "kemp-headset",
  "kemp-mang-tikka",
  "kemp-mattal-ear-chains",
  "kemp-earrings",
  "kemp-vaddanam-waistbelt",
  "kemp-accessories",
  "kemp-mattal"
];

const COMMON_COLLECTION_HANDLES = [
  "kemp-jewellery",
  ...REAL_KEMP_COLLECTION_HANDLES,
  "bharatanatyam-jewellery",
  "bharatanatyam-jewellery-sets",
  "bharatanatyam-dance-necklace-long-and-short"
];

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

async function fetchJson(url, options, attempts = 5) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const res = await fetch(url, options);
      const text = await res.text();
      let body;
      try {
        body = JSON.parse(text);
      } catch {
        throw new Error(`Non-JSON response ${res.status}: ${text.slice(0, 160)}`);
      }
      if (!res.ok || body.errors) throw new Error(`HTTP ${res.status}: ${JSON.stringify(body.errors || body)}`);
      return body;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(700 * attempt);
    }
  }
  throw lastError;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

async function fetchCollectionProducts() {
  const query = `
    query CollectionProducts($handle: String!, $after: String) {
      collectionByHandle(handle: $handle) {
        id
        handle
        title
        productsCount { count }
        products(first: 50, after: $after, sortKey: COLLECTION_DEFAULT) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            legacyResourceId
            handle
            title
            productType
            status
            templateSuffix
            seo { title description }
            featuredImage { url altText }
            images(first: 1) { nodes { id altText url } }
            variants(first: 8) { nodes { title sku price } }
          }
        }
      }
    }
  `;

  const byId = new Map();
  const collections = [];
  for (const handle of REAL_KEMP_COLLECTION_HANDLES) {
    let after = null;
    let collection;
    do {
      const data = await gql(query, { handle, after });
      collection = data.collectionByHandle;
      if (!collection) throw new Error(`Collection not found: ${handle}`);
      for (const product of collection.products.nodes) {
        if (!byId.has(product.id)) byId.set(product.id, { ...product, collections: [] });
        byId.get(product.id).collections.push(handle);
      }
      after = collection.products.pageInfo.endCursor;
    } while (collection.products.pageInfo.hasNextPage);
    collections.push({
      id: collection.id,
      handle: collection.handle,
      title: collection.title,
      count: collection.productsCount.count
    });
  }

  const products = [...byId.values()].filter(isRealKempProduct);
  const excluded = [...byId.values()].filter((product) => !isRealKempProduct(product));
  return { collections, products, excluded };
}

async function fetchCollectionIds(handles) {
  const byHandle = new Map();
  for (const handle of [...new Set(handles)]) {
    const data = await gql(
      `query CollectionByHandle($handle: String!) { collectionByHandle(handle: $handle) { id handle title } }`,
      { handle }
    );
    if (!data.collectionByHandle) {
      console.warn(`[MISSING COLLECTION] ${handle}`);
      continue;
    }
    byHandle.set(handle, data.collectionByHandle);
  }
  return byHandle;
}

function isRealKempProduct(product) {
  const context = `${product.title} ${product.productType} ${product.handle}`.toLowerCase();
  if (context.includes("black kemp")) return false;
  if (product.productType === "Bharatanatyam Mattal") return false;
  if (product.productType?.toLowerCase().startsWith("kemp ")) return true;
  return product.collections.some((handle) => handle !== "kemp-mattal") && context.includes("kemp");
}

function codeFor(product) {
  const text = `${product.title} ${product.handle} ${product.variants.nodes.map((variant) => variant.sku).join(" ")}`;
  const match = text.match(/\b([A-Z]{2,4})[-\s]?0?(\d{1,4})\b/i);
  if (!match) return "";
  return `${match[1].toUpperCase()}${match[2].padStart(3, "0")}`;
}

function roleFor(product) {
  const context = `${product.title} ${product.productType} ${product.handle} ${product.collections.join(" ")}`.toLowerCase();
  if (product.collections.includes("kemp-bharatanatyam-jewellery-dance-sets")) return "complete set";
  if (product.collections.includes("kemp-short-haram")) return "short necklace";
  if (product.collections.includes("kemp-long-necklace")) return "long haram";
  if (product.collections.includes("kemp-headset")) return "headset";
  if (product.collections.includes("kemp-mang-tikka")) return "nethi chutti";
  if (product.collections.includes("kemp-mattal-ear-chains")) return "mattal";
  if (product.collections.includes("kemp-earrings")) return "earrings";
  if (product.collections.includes("kemp-vaddanam-waistbelt")) return "waist belt";
  if (product.collections.includes("kemp-mattal")) return "mattal";
  if (context.includes("dance set") || context.includes("jewellery set") || context.includes("jewelry set")) return "complete set";
  if (context.includes("short") || context.includes("choker") || context.includes("addigai")) return "short necklace";
  if (context.includes("long") || context.includes("haram") || context.includes("necklaces")) return "long haram";
  if (context.includes("headset") || context.includes("head set")) return "headset";
  if (context.includes("maang") || context.includes("mang") || context.includes("tikka") || context.includes("nethi")) return "nethi chutti";
  if (context.includes("mattal") || context.includes("matil") || context.includes("mattel")) return "mattal";
  if (context.includes("earring") || context.includes("jhumka") || context.includes("jhumki") || context.includes("buttalu")) return "earrings";
  if (context.includes("vaddanam") || context.includes("oddiyanam") || context.includes("waist") || context.includes("hipbelt")) return "waist belt";
  if (context.includes("nath") || context.includes("nose")) return "nose pin";
  if (context.includes("sun") || context.includes("moon") || context.includes("surya") || context.includes("chandra")) return "sun and moon";
  if (context.includes("rakodi") || context.includes("ragadi") || context.includes("rakkodi")) return "rakodi";
  if (context.includes("baju") || context.includes("vanki") || context.includes("armband")) return "vanki";
  if (context.includes("bangle")) return "bangles";
  if (context.includes("jada") || context.includes("jadai")) return "jada";
  return "accessory";
}

function rolesFor(role, product) {
  const context = `${product.title} ${product.productType}`.toLowerCase();
  if (role === "headset") return context.includes("nethi") ? ["headset", "nethi chutti"] : ["headset"];
  if (role === "earrings") return context.includes("jhum") || context.includes("buttalu") ? ["earrings", "jhumki"] : ["earrings"];
  if (role === "waist belt") return ["waist belt", "vaddanam"];
  if (role === "vanki") return ["vanki", "bajuband"];
  if (role === "complete set") return ["complete set"];
  if (role === "accessory") return ["accessory"];
  return [role];
}

function placementFor(role) {
  return {
    "complete set": "Complete jewellery set / multiple dance placements",
    "short necklace": "Neckline / upper chest",
    "long haram": "Lower chest / costume center line",
    headset: "Forehead / center parting / head styling",
    "nethi chutti": "Forehead / center parting",
    mattal: "Ear chain / side hair placement",
    earrings: "Ears / side profile",
    "waist belt": "Waist / costume pleats",
    "nose pin": "Nose / traditional facial ornament",
    rakodi: "Bun / back head placement",
    "sun and moon": "Side head ornaments",
    vanki: "Upper arm",
    bangles: "Wrist",
    jada: "Braid / hair extension"
  }[role] || "Classical dance accessory placement";
}

function collectionRefsFor(role) {
  const base = ["kemp-jewellery"];
  const map = {
    "complete set": ["kemp-bharatanatyam-jewellery-dance-sets", "kemp-short-haram", "kemp-long-necklace", "kemp-vaddanam-waistbelt"],
    "short necklace": ["kemp-short-haram", "kemp-long-necklace", "kemp-bharatanatyam-jewellery-dance-sets", "kemp-earrings"],
    "long haram": ["kemp-long-necklace", "kemp-short-haram", "kemp-bharatanatyam-jewellery-dance-sets", "kemp-vaddanam-waistbelt"],
    headset: ["kemp-headset", "kemp-mang-tikka", "kemp-accessories"],
    "nethi chutti": ["kemp-mang-tikka", "kemp-headset", "kemp-accessories"],
    mattal: ["kemp-mattal-ear-chains", "kemp-earrings", "kemp-headset"],
    earrings: ["kemp-earrings", "kemp-mattal-ear-chains", "kemp-short-haram"],
    "waist belt": ["kemp-vaddanam-waistbelt", "kemp-bharatanatyam-jewellery-dance-sets", "kemp-long-necklace"],
    "nose pin": ["kemp-accessories", "kemp-headset"],
    rakodi: ["kemp-accessories", "kemp-headset"],
    "sun and moon": ["kemp-accessories", "kemp-headset"],
    vanki: ["kemp-accessories", "kemp-bharatanatyam-jewellery-dance-sets"],
    bangles: ["kemp-accessories", "kemp-earrings"],
    jada: ["kemp-accessories", "kemp-headset"]
  };
  return [...new Set([...base, ...(map[role] || ["kemp-accessories"])])];
}

function productTypeFor(product, role) {
  if (product.productType) return product.productType;
  if (role === "headset") return "Kemp Head Set";
  return product.productType;
}

function motifFor(product) {
  const context = `${product.title} ${product.handle}`.toLowerCase();
  if (context.includes("mango")) return "Mango ";
  if (context.includes("pearl")) return "Pearl ";
  if (context.includes("petal")) return "Petal ";
  if (context.includes("temple")) return "Temple ";
  if (context.includes("antique")) return "Antique ";
  return "";
}

function titleFor(product, data) {
  const code = data.code ? ` ${data.code}` : "";
  const motif = data.motif;
  const titleByRole = {
    "complete set": `Real Kemp Bharatanatyam Kuchipudi Dance Jewellery Set for Arangetram${code}`,
    "short necklace": `Real Kemp ${motif}Short Necklace for Bharatanatyam and Kuchipudi${code}`,
    "long haram": `Real Kemp ${motif}Long Haram for Bharatanatyam and Kuchipudi${code}`,
    headset: `Real Kemp Bharatanatyam Kuchipudi Headset${code}`,
    "nethi chutti": `Real Kemp Nethi Chutti Maang Tikka for Bharatanatyam${code}`,
    mattal: `Real Kemp Ear Mattal for Bharatanatyam and Kuchipudi${code}`,
    earrings: `Real Kemp Jhumka Earrings for Bharatanatyam and Kuchipudi${code}`,
    "waist belt": `Real Kemp Vaddanam Oddiyanam Waist Belt for Bharatanatyam${code}`,
    "nose pin": `Real Kemp Nath Nose Pin for Bharatanatyam${code}`,
    rakodi: `Real Kemp Rakodi Hair Ornament for Bharatanatyam${code}`,
    "sun and moon": `Real Kemp Sun and Moon Head Ornaments for Bharatanatyam${code}`,
    vanki: `Real Kemp Vanki Bajuband Armlet for Bharatanatyam${code}`,
    bangles: `Real Kemp Bangles for Bharatanatyam and Kuchipudi${code}`,
    jada: `Real Kemp Jada Braid Accessory for Bharatanatyam${code}`
  };
  return (titleByRole[data.role] || `Real Kemp Bharatanatyam Kuchipudi Dance Accessory${code}`).replace(/\s+/g, " ").trim();
}

function fitNotesFor(role) {
  const fitByRole = {
    "complete set": "Use this premium real kemp set when the dancer needs a coordinated arangetram, senior-stage or formal classical dance look. Confirm the teacher's full component list, costume color, dancer size and hairstyle before ordering.",
    "short necklace": "Use the short necklace for the close neck or upper-chest layer. Compare width, pendant scale and neckline space before pairing it with a long haram.",
    "long haram": "Use the long haram for the lower costume line and stage proportion. Compare pendant drop with dancer height, costume pleats and the short necklace layer.",
    headset: "Check forehead size, center parting, bun position and pinning comfort. Match the headset finish with nethi chutti, mattal, earrings and the main necklace set.",
    "nethi chutti": "Check forehead placement, center parting and pinning support. Match the stone color and finish with the headset, earrings and necklace layers.",
    mattal: "Check ear-chain length, earring weight and side-hair placement so the ear mattal can be secured comfortably through a performance.",
    earrings: "Check earring weight, closure comfort and whether mattal support is needed for a longer program or arangetram.",
    "waist belt": "Measure over the costume and pleats, not only the body waist. Check adjustability, closure comfort and how the vaddanam sits during movement.",
    "nose pin": "Confirm side, size and comfort before performance use, especially for younger dancers or first-time users.",
    rakodi: "Check bun size, back-head placement and hairstyle support before matching the rakodi with jada and flower pieces.",
    "sun and moon": "Check side-head placement, pinning support and whether the teacher requires sun and moon pieces for the performance look.",
    vanki: "Check upper-arm comfort, sleeve placement and adjustability so the vanki stays secure while dancing.",
    bangles: "Check wrist comfort, bangle size and mudra visibility. Match the gold finish and stones with the main real kemp set.",
    jada: "Check braid length, hairstyle plan and how the jada will be pinned with rakodi, flowers and head ornaments."
  };
  return fitByRole[role] || "Compare product photos, stone color, finish, scale and dancer comfort before matching this piece with the real kemp set.";
}

function sizeNotesFor(role) {
  const sizeByRole = {
    "complete set": "Real kemp sets should be checked against dancer height, costume neckline, waist placement, hairstyle and the teacher's component list. Included pieces are as shown in product photos unless separately specified.",
    "short necklace": "Short necklace fit is judged by neckline space, necklace width, pendant scale and how it layers above the long haram.",
    "long haram": "Long haram fit is judged by drop, pendant scale, dancer height and how it falls over the costume pleats.",
    "waist belt": "Waist belt fit should be checked over the full dance costume. Confirm adjustability before time-sensitive arangetram or group orders.",
    mattal: "Mattal fit is judged by chain length, earring placement, hairstyle support and whether the ear chain sits without pulling.",
    earrings: "Earring fit is judged by weight, closure type and comfort for the planned program length.",
    headset: "Headset fit is judged by forehead size, center parting, bun placement and pinning support.",
    "nethi chutti": "Nethi chutti fit is judged by forehead size, center parting and how it aligns with the hairstyle."
  };
  return sizeByRole[role] || "Use product photos to judge scale, placement and comfort before ordering.";
}

function stoneColorFor(product) {
  const context = `${product.title} ${product.handle}`.toLowerCase();
  if (context.includes("white")) return "white kemp stones with gold finish";
  if (context.includes("green")) return "green kemp stones with gold finish";
  if (context.includes("pearl")) return "red-green kemp stones with pearl accents";
  return "red-green kemp stones";
}

function dataFor(product, collectionIdsByHandle) {
  const role = roleFor(product);
  const data = {
    role,
    roles: rolesFor(role, product),
    code: codeFor(product),
    motif: motifFor(product),
    placement: placementFor(role),
    productType: productTypeFor(product, role),
    performanceContext: ["arangetram", "stage performance", "senior performance", "bridal classical styling"],
    buyerContext: ["adult dancer", "parent", "teacher", "bridal classical styling"],
    fitNotes: fitNotesFor(role),
    sizeNotes: sizeNotesFor(role),
    measurementConfidence: "Check product photos",
    matchingCollectionIds: collectionRefsFor(role)
      .map((handle) => collectionIdsByHandle.get(handle)?.id)
      .filter(Boolean),
    matchingFinish: "real kemp / antique gold-plated temple jewellery finish",
    stoneColor: stoneColorFor(product),
    material: "Real kemp stones with brass or copper base and high gold plating in the Golden Collections real kemp range",
    finish: "Premium real kemp temple jewellery finish with gold plating as shown in product photos",
    careInstructions: "Keep away from water, perfume, sweat and harsh chemicals. After use, wipe gently with a soft dry cloth and store matching pieces separately in a dry box or pouch.",
    qualityChecks: "Checked for visible stone setting, gold finish, joints, hooks or closures, component completeness as shown, packing and shipping readiness before dispatch."
  };
  data.title = titleFor(product, data);
  return data;
}

function htmlFor(data) {
  const roleCopy = {
    "complete set": "a coordinated premium jewellery set",
    "short necklace": "the close neck or upper-chest necklace layer",
    "long haram": "the longer haram layer for costume balance",
    headset: "the forehead and head-styling placement",
    "nethi chutti": "the center forehead ornament placement",
    mattal: "the ear mattal / ear-chain placement beside the hairstyle",
    earrings: "the ear and side-profile placement",
    "waist belt": "the waist and costume-pleat placement"
  }[data.role] || "a premium real kemp dance ornament";
  return `
<p>${data.title} is ${roleCopy} for Bharatanatyam, Kuchipudi, arangetram planning, senior stage performance and bridal classical styling.</p>
<ul>
  <li>${data.fitNotes}</li>
  <li>${data.sizeNotes}</li>
  <li>Real kemp is the premium Golden Collections range and should be matched carefully by stone color, finish, scale and the teacher's required component list.</li>
  <li>Material: ${data.material}.</li>
  <li>${data.careInstructions}</li>
</ul>
`.trim();
}

function seoDescriptionFor(data) {
  const base = `${data.title} with ${data.stoneColor} for Bharatanatyam, Kuchipudi, arangetram and premium classical stage styling.`;
  return base.length > 156 ? `${base.slice(0, 153).replace(/\s+\S*$/, "")}...` : base;
}

function imageAltFor(data) {
  return `${data.title} with ${data.stoneColor}`.replace(/\s+/g, " ");
}

function metafieldsFor(product, data) {
  const fields = [
    ["dance_form_suitable", "list.single_line_text_field", ["Bharatanatyam", "Kuchipudi"]],
    ["dance_range", "single_line_text_field", "real kemp"],
    ["product_tier", "single_line_text_field", "premium"],
    ["dance_product_role", "list.single_line_text_field", data.roles],
    ["performance_context", "list.single_line_text_field", data.performanceContext],
    ["buyer_context", "list.single_line_text_field", data.buyerContext],
    ["placement", "single_line_text_field", data.placement],
    ["fit_notes", "multi_line_text_field", data.fitNotes],
    ["size_notes", "multi_line_text_field", data.sizeNotes],
    ["measurement_confidence", "single_line_text_field", data.measurementConfidence],
    ["matching_collection_refs", "list.collection_reference", data.matchingCollectionIds],
    ["matching_finish", "single_line_text_field", data.matchingFinish],
    ["stone_color", "single_line_text_field", data.stoneColor],
    ["material", "single_line_text_field", data.material],
    ["finish", "single_line_text_field", data.finish],
    ["care_instructions", "multi_line_text_field", data.careInstructions],
    ["quality_checks", "multi_line_text_field", data.qualityChecks]
  ];

  if (data.role !== "complete set") fields.splice(11, 0, ["component_count", "number_integer", "1"]);

  return fields
    .filter(([, , value]) => (Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && value !== ""))
    .map(([key, type, value]) => ({
      ownerId: product.id,
      namespace: "dance",
      key,
      type,
      value: Array.isArray(value) ? JSON.stringify(value) : String(value)
    }));
}

async function updateProduct(product, data) {
  const mutation = `
    mutation ProductUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        product { id handle title productType templateSuffix seo { title description } }
        userErrors { field message }
      }
    }
  `;
  const update = await gql(mutation, {
    input: {
      id: product.id,
      title: data.title,
      productType: data.productType,
      templateSuffix: TARGET_TEMPLATE,
      descriptionHtml: htmlFor(data),
      seo: {
        title: `${data.title} | Golden Collections`,
        description: seoDescriptionFor(data)
      }
    }
  });
  const errors = update.productUpdate.userErrors || [];
  if (errors.length) throw new Error(`productUpdate ${product.handle}: ${JSON.stringify(errors)}`);
  return update.productUpdate.product;
}

async function setMetafields(product, data) {
  const mutation = `
    mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { namespace key type value }
        userErrors { field message code }
      }
    }
  `;
  const set = await gql(mutation, { metafields: metafieldsFor(product, data) });
  const errors = set.metafieldsSet.userErrors || [];
  if (errors.length) throw new Error(`metafieldsSet ${product.handle}: ${JSON.stringify(errors)}`);
  return set.metafieldsSet.metafields;
}

async function updateImageAlt(product, data) {
  const image = product.images.nodes[0];
  if (!image) return null;
  const imageId = image.id.split("/").pop();
  try {
    const body = await fetchJson(`${REST_ENDPOINT}/products/${product.legacyResourceId}/images/${imageId}.json`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": TOKEN
      },
      body: JSON.stringify({ image: { id: imageId, alt: imageAltFor(data) } })
    });
    return body.image;
  } catch (error) {
    console.warn(`[IMAGE ALT WARNING] ${product.handle}: ${error.message}`);
    return null;
  }
}

async function verifyProducts(products) {
  const rows = products.map((product) => ({
    handle: product.handle,
    status: product.status,
    title: product.title,
    productType: product.productType,
    templateSuffix: product.templateSuffix || "default",
    seoTitle: product.seo?.title || "",
    seoDescription: product.seo?.description || "",
    collections: product.collections
  }));
  const issueRows = rows.filter((row) => row.templateSuffix !== TARGET_TEMPLATE || !row.title.toLowerCase().includes("real kemp"));
  fs.writeFileSync(`${OUTPUT_DIR}/final-verify.json`, JSON.stringify({
    ok: issueRows.length === 0,
    count: rows.length,
    issueCount: issueRows.length,
    issues: issueRows,
    rows
  }, null, 2));
  console.log(`[VERIFY] ${OUTPUT_DIR}/final-verify.json`);
  console.log(`[VERIFY COUNT] ${rows.length}`);
  console.log(`[VERIFY ISSUES] ${issueRows.length}`);
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : VERIFY ? "MODE: VERIFY" : "MODE: DRY-RUN");
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const { collections, products, excluded } = await fetchCollectionProducts();
  const collectionIdsByHandle = await fetchCollectionIds(COMMON_COLLECTION_HANDLES);

  if (VERIFY) {
    await verifyProducts(products);
    return;
  }

  const previewRows = [];
  for (const product of products) {
    const data = dataFor(product, collectionIdsByHandle);
    previewRows.push({
      handle: product.handle,
      status: product.status,
      collections: product.collections,
      oldTitle: product.title,
      newTitle: data.title,
      oldProductType: product.productType,
      newProductType: data.productType,
      oldTemplate: product.templateSuffix || "default",
      newTemplate: TARGET_TEMPLATE,
      role: data.role,
      roles: data.roles,
      stoneColor: data.stoneColor,
      measurementConfidence: data.measurementConfidence,
      matchingCollectionRefs: data.matchingCollectionIds.length
    });
    console.log(`[${APPLY ? "UPDATE" : "DRY"}] ${product.status} ${data.role} ${product.handle}: "${product.title}" -> "${data.title}"`);

    if (APPLY) {
      if (SKIP_UPDATED && product.templateSuffix === TARGET_TEMPLATE && product.title.startsWith("Real Kemp ")) {
        console.log(`[SKIP UPDATED] ${product.handle}`);
        continue;
      }
      await updateProduct(product, data);
      await setMetafields(product, data);
      await updateImageAlt(product, data);
      await sleep(250);
    }
  }

  const roleCounts = previewRows.reduce((acc, row) => {
    acc[row.role] = (acc[row.role] || 0) + 1;
    return acc;
  }, {});
  fs.writeFileSync(`${OUTPUT_DIR}/content-preview.json`, JSON.stringify({
    collections,
    count: products.length,
    excluded: excluded.map((product) => ({
      handle: product.handle,
      title: product.title,
      productType: product.productType,
      collections: product.collections
    })),
    roleCounts,
    rows: previewRows
  }, null, 2));
  console.log(`[PREVIEW] ${OUTPUT_DIR}/content-preview.json`);
  console.log(`[COUNT] ${products.length}`);
  console.log(`[EXCLUDED] ${excluded.length}`);
  console.log(`[ROLES] ${JSON.stringify(roleCounts)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
