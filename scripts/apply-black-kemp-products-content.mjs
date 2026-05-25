#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const VERIFY = process.argv.includes("--verify");
const ENV_FILE = "env";
const OUTPUT_DIR = "tmp/black-kemp";
const TARGET_TEMPLATE = "black-kemp";
const BLACK_KEMP_TAG = "black-kemp";
const PARENT_HANDLE = "kemp-black-jewellery";

const BLACK_KEMP_COLLECTION_HANDLES = [
  "kemp-black-bharatanatyam-kuchipudi-dance-jewellery-set",
  "kemp-black-short-necklace",
  "kemp-black-long-haram",
  "premium-black-kemp-headsets-nethichutti",
  "kemp-black-nethi-chutti-maang-tikka",
  "kemp-black-mattal",
  "kemp-black-earrings-jhumki-jhumka",
  "black-kemp-vaddanam-temple-jewellery-oddiyanam",
  "black-kemp-bharatanatyam-accessories"
];

const COMMON_COLLECTION_HANDLES = [
  PARENT_HANDLE,
  ...BLACK_KEMP_COLLECTION_HANDLES,
  "kemp-jewellery",
  "bharatanatyam-jewellery"
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
      if (attempt < attempts) await sleep(800 * attempt);
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

async function fetchCollectionProducts(handles) {
  const query = `
    query CollectionProducts($handle: String!, $after: String) {
      collectionByHandle(handle: $handle) {
        id
        legacyResourceId
        handle
        title
        productsCount { count }
        ruleSet { appliedDisjunctively rules { column relation condition } }
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
            tags
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
  for (const handle of handles) {
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
      legacyResourceId: collection.legacyResourceId,
      handle: collection.handle,
      title: collection.title,
      count: collection.productsCount.count,
      ruleSet: collection.ruleSet
    });
  }
  return { collections, products: [...byId.values()].filter(isBlackKempProduct) };
}

async function fetchCollectionIds(handles) {
  const byHandle = new Map();
  for (const handle of [...new Set(handles)]) {
    const data = await gql(
      `query CollectionByHandle($handle: String!) { collectionByHandle(handle: $handle) { id handle title legacyResourceId } }`,
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

function isBlackKempProduct(product) {
  return `${product.title} ${product.productType} ${product.handle}`.toLowerCase().includes("black");
}

function hasBlackKempTag(tags) {
  return tags.some((tag) => ["black-kemp", "black kemp"].includes(tag.toLowerCase()));
}

function codeFor(product) {
  const text = `${product.title} ${product.handle} ${product.variants.nodes.map((variant) => variant.sku).join(" ")}`;
  const match = text.match(/\b([A-Z]{2,4})[-\s]?0?(\d{1,4})\b/i);
  if (!match) return "";
  return `${match[1].toUpperCase()}${match[2].padStart(3, "0")}`;
}

function roleFor(product) {
  if (product.collections.includes("kemp-black-bharatanatyam-kuchipudi-dance-jewellery-set")) return "complete set";
  if (product.collections.includes("kemp-black-short-necklace")) return "short necklace";
  if (product.collections.includes("kemp-black-long-haram")) return "long haram";
  if (product.collections.includes("premium-black-kemp-headsets-nethichutti")) return "headset";
  if (product.collections.includes("kemp-black-nethi-chutti-maang-tikka")) return "nethi chutti";
  if (product.collections.includes("kemp-black-mattal")) return "mattal";
  if (product.collections.includes("kemp-black-earrings-jhumki-jhumka")) return "earrings";
  if (product.collections.includes("black-kemp-vaddanam-temple-jewellery-oddiyanam")) return "waist belt";
  const context = `${product.title} ${product.productType} ${product.handle}`.toLowerCase();
  if (context.includes("jada")) return "jada";
  if (context.includes("rakodi") || context.includes("ragadi")) return "rakodi";
  if (context.includes("sun") || context.includes("moon")) return "sun and moon";
  if (context.includes("nose") || context.includes("nath") || context.includes("bullaki") || context.includes("bulaki")) return "nose pin";
  if (context.includes("bangle")) return "bangles";
  if (context.includes("baju") || context.includes("vanki") || context.includes("armlet")) return "vanki";
  if (context.includes("set")) return "complete set";
  if (context.includes("short") || context.includes("addigai") || context.includes("choker")) return "short necklace";
  if (context.includes("long") || context.includes("haram")) return "long haram";
  if (context.includes("head")) return "headset";
  if (context.includes("maang") || context.includes("tikka") || context.includes("nethi")) return "nethi chutti";
  if (context.includes("mattal") || context.includes("matil")) return "mattal";
  if (context.includes("earring") || context.includes("jhum")) return "earrings";
  if (context.includes("vaddanam") || context.includes("oddiyanam") || context.includes("waist")) return "waist belt";
  return "accessory";
}

function rolesFor(role, product) {
  const context = `${product.title} ${product.productType}`.toLowerCase();
  if (role === "headset") return context.includes("nethi") ? ["headset", "nethi chutti"] : ["headset"];
  if (role === "earrings") return context.includes("jhum") ? ["earrings", "jhumki"] : ["earrings"];
  if (role === "waist belt") return ["waist belt", "vaddanam"];
  if (role === "vanki") return ["vanki", "bajuband"];
  if (role === "complete set") return ["complete set"];
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
    bangles: "Wrist",
    vanki: "Upper arm",
    jada: "Braid / hair extension",
    rakodi: "Bun / back head placement",
    "sun and moon": "Side head ornaments"
  }[role] || "Black kemp dance accessory placement";
}

function collectionRefsFor(role) {
  const base = [PARENT_HANDLE];
  const map = {
    "complete set": ["kemp-black-bharatanatyam-kuchipudi-dance-jewellery-set", "kemp-black-short-necklace", "kemp-black-long-haram", "black-kemp-vaddanam-temple-jewellery-oddiyanam"],
    "short necklace": ["kemp-black-short-necklace", "kemp-black-long-haram", "kemp-black-earrings-jhumki-jhumka"],
    "long haram": ["kemp-black-long-haram", "kemp-black-short-necklace", "black-kemp-vaddanam-temple-jewellery-oddiyanam"],
    headset: ["premium-black-kemp-headsets-nethichutti", "kemp-black-nethi-chutti-maang-tikka", "black-kemp-bharatanatyam-accessories"],
    "nethi chutti": ["kemp-black-nethi-chutti-maang-tikka", "premium-black-kemp-headsets-nethichutti"],
    mattal: ["kemp-black-mattal", "kemp-black-earrings-jhumki-jhumka"],
    earrings: ["kemp-black-earrings-jhumki-jhumka", "kemp-black-mattal"],
    "waist belt": ["black-kemp-vaddanam-temple-jewellery-oddiyanam", "kemp-black-bharatanatyam-kuchipudi-dance-jewellery-set"],
    "nose pin": ["black-kemp-bharatanatyam-accessories", "premium-black-kemp-headsets-nethichutti"],
    bangles: ["black-kemp-bharatanatyam-accessories", "kemp-black-earrings-jhumki-jhumka"],
    vanki: ["black-kemp-bharatanatyam-accessories", "kemp-black-bharatanatyam-kuchipudi-dance-jewellery-set"],
    accessory: ["black-kemp-bharatanatyam-accessories", "premium-black-kemp-headsets-nethichutti"],
    jada: ["black-kemp-bharatanatyam-accessories", "premium-black-kemp-headsets-nethichutti"],
    rakodi: ["black-kemp-bharatanatyam-accessories", "premium-black-kemp-headsets-nethichutti"],
    "sun and moon": ["black-kemp-bharatanatyam-accessories", "premium-black-kemp-headsets-nethichutti"]
  };
  return [...new Set([...base, ...(map[role] || ["black-kemp-bharatanatyam-accessories"])])];
}

function motifFor(product) {
  const context = `${product.title} ${product.handle}`.toLowerCase();
  if (context.includes("mango")) return "Mango ";
  if (context.includes("pearl")) return "Pearl ";
  if (context.includes("temple")) return "Temple ";
  if (context.includes("antique")) return "Antique ";
  return "";
}

function titleFor(product, data) {
  const code = data.code ? ` ${data.code}` : "";
  const motif = data.motif;
  const titleByRole = {
    "complete set": `Black Kemp Bharatanatyam Kuchipudi Dance Jewellery Set${code}`,
    "short necklace": `Black Kemp ${motif}Short Necklace for Bharatanatyam and Kuchipudi${code}`,
    "long haram": `Black Kemp ${motif}Long Haram for Bharatanatyam and Kuchipudi${code}`,
    headset: `Black Kemp Bharatanatyam Kuchipudi Headset${code}`,
    "nethi chutti": `Black Kemp Nethi Chutti Maang Tikka for Bharatanatyam${code}`,
    mattal: `Black Kemp Mattal Ear Chain for Bharatanatyam and Kuchipudi${code}`,
    earrings: `Black Kemp Jhumka Earrings for Bharatanatyam and Kuchipudi${code}`,
    "waist belt": `Black Kemp Vaddanam Oddiyanam Waist Belt for Bharatanatyam${code}`,
    "nose pin": `Black Kemp Nath Nose Pin for Bharatanatyam${code}`,
    bangles: `Black Kemp Bangles for Bharatanatyam and Kuchipudi${code}`,
    vanki: `Black Kemp Vanki Bajuband Armlet for Bharatanatyam${code}`,
    jada: `Black Kemp Jada Braid Accessory for Bharatanatyam${code}`,
    rakodi: `Black Kemp Rakodi Hair Ornament for Bharatanatyam${code}`,
    "sun and moon": `Black Kemp Sun and Moon Head Ornaments for Bharatanatyam${code}`
  };
  return (titleByRole[data.role] || `Black Kemp Bharatanatyam Kuchipudi Dance Accessory${code}`).replace(/\s+/g, " ").trim();
}

function fitNotesFor(role) {
  const fitByRole = {
    "complete set": "Use this black kemp set when the costume direction needs a darker contrast while keeping the classical temple jewellery look. Confirm the teacher's component list, costume color and stage lighting before ordering.",
    "short necklace": "Use the short necklace for the close neck or upper-chest layer. Compare black stone contrast, pendant scale and neckline space before pairing it with a long haram.",
    "long haram": "Use the long haram for the lower costume line and stage proportion. Check the black stone contrast against costume pleats, dancer height and short necklace layer.",
    headset: "Check forehead size, center parting, bun position and pinning comfort. Match the headset with black kemp nethi chutti, mattal, earrings and necklace layers.",
    "nethi chutti": "Check forehead placement, center parting and pinning support. Keep black kemp finish consistent with headset, earrings and necklace pieces.",
    mattal: "Check ear-chain length, earring weight and side-hair placement so the mattal can be secured comfortably through performance movement.",
    earrings: "Check earring weight, closure comfort and whether mattal support is needed for long programs.",
    "waist belt": "Measure over the costume and pleats, not only the body waist. Check adjustability, closure comfort and how the black kemp vaddanam sits during movement.",
    "nose pin": "Confirm side, size and comfort before performance use, especially for younger dancers or first-time users.",
    bangles: "Check wrist comfort, bangle size and mudra visibility. Match the black kemp finish with the main jewellery set.",
    vanki: "Check upper-arm comfort, sleeve placement and adjustability so the vanki stays secure while dancing.",
    jada: "Check braid length, hairstyle plan and how the black kemp jada will be pinned with rakodi, flowers and head ornaments.",
    rakodi: "Check bun size, back-head placement and hairstyle support before matching the rakodi with other black kemp hair pieces.",
    "sun and moon": "Check side-head placement, pinning support and whether the teacher requires sun and moon pieces for the performance look."
  };
  return fitByRole[role] || "Compare product photos, black stone contrast, finish, scale and dancer comfort before matching this piece with the costume.";
}

function sizeNotesFor(role) {
  const sizeByRole = {
    "complete set": "Black kemp sets should be checked against dancer height, costume neckline, waist placement, hairstyle and teacher requirements. Included pieces are as shown in product photos unless separately specified.",
    "short necklace": "Short necklace fit is judged by neckline space, necklace width, pendant scale and how it layers above the long haram.",
    "long haram": "Long haram fit is judged by drop, pendant scale, dancer height and how it falls over the costume pleats.",
    "waist belt": "Waist belt fit should be checked over the full dance costume. Confirm adjustability before time-sensitive stage or group orders.",
    mattal: "Mattal fit is judged by chain length, earring placement and hairstyle support.",
    earrings: "Earring fit is judged by weight, closure type and comfort for the planned program length.",
    headset: "Headset fit is judged by forehead size, center parting, bun placement and pinning support.",
    "nethi chutti": "Nethi chutti fit is judged by forehead size, center parting and how it aligns with the hairstyle."
  };
  return sizeByRole[role] || "Use product photos to judge scale, placement and comfort before ordering.";
}

function dataFor(product, collectionIdsByHandle) {
  const role = roleFor(product);
  const data = {
    role,
    roles: rolesFor(role, product),
    code: codeFor(product),
    motif: motifFor(product),
    placement: placementFor(role),
    productType: product.productType,
    performanceContext: ["stage performance", "arangetram", "senior performance", "bridal classical styling"],
    buyerContext: ["adult dancer", "parent", "teacher", "bridal classical styling"],
    fitNotes: fitNotesFor(role),
    sizeNotes: sizeNotesFor(role),
    measurementConfidence: "Check product photos",
    matchingCollectionIds: collectionRefsFor(role)
      .map((handle) => collectionIdsByHandle.get(handle)?.id)
      .filter(Boolean),
    matchingFinish: "black kemp / gold-plated temple jewellery finish",
    stoneColor: "black kemp stones",
    material: "Black kemp stone work with gold-plated temple jewellery base as shown in product photos",
    finish: "Black kemp temple jewellery finish with gold plating as shown in product photos",
    careInstructions: "Keep away from water, perfume, sweat and harsh chemicals. After use, wipe gently with a soft dry cloth and store matching pieces separately in a dry box or pouch.",
    qualityChecks: "Checked for visible stone setting, gold finish, joints, hooks or closures, component completeness as shown, packing and shipping readiness before dispatch."
  };
  data.title = titleFor(product, data);
  return data;
}

function htmlFor(data) {
  const roleCopy = {
    "complete set": "a coordinated black kemp jewellery set",
    "short necklace": "the close neck or upper-chest necklace layer",
    "long haram": "the longer haram layer for costume balance",
    headset: "the forehead and head-styling placement",
    "nethi chutti": "the center forehead ornament placement",
    mattal: "the ear-chain placement beside the hairstyle",
    earrings: "the ear and side-profile placement",
    "waist belt": "the waist and costume-pleat placement"
  }[data.role] || "a black kemp dance ornament";
  return `
<p>${data.title} is ${roleCopy} for Bharatanatyam, Kuchipudi, arangetram planning, senior stage performance and bridal classical styling when the costume needs a stronger black-stone contrast.</p>
<ul>
  <li>${data.fitNotes}</li>
  <li>${data.sizeNotes}</li>
  <li>Black kemp should be matched carefully by stone color, gold finish, scale, costume color and the teacher's required component list.</li>
  <li>Material: ${data.material}.</li>
  <li>${data.careInstructions}</li>
</ul>
`.trim();
}

function seoDescriptionFor(data) {
  const base = `${data.title} with black kemp stones for Bharatanatyam, Kuchipudi, arangetram and classical stage styling with costume contrast.`;
  return base.length > 156 ? `${base.slice(0, 153).replace(/\s+\S*$/, "")}...` : base;
}

function imageAltFor(data) {
  return `${data.title} with black kemp stones`.replace(/\s+/g, " ");
}

function metafieldsFor(product, data) {
  const fields = [
    ["dance_form_suitable", "list.single_line_text_field", ["Bharatanatyam", "Kuchipudi"]],
    ["dance_range", "single_line_text_field", "black kemp"],
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

async function tagsAdd(product, tag) {
  if (product.tags.includes(tag)) return null;
  const mutation = `
    mutation TagsAdd($id: ID!, $tags: [String!]!) {
      tagsAdd(id: $id, tags: $tags) {
        node { id }
        userErrors { field message }
      }
    }
  `;
  const result = await gql(mutation, { id: product.id, tags: [tag] });
  const errors = result.tagsAdd.userErrors || [];
  if (errors.length) throw new Error(`tagsAdd ${product.handle}: ${JSON.stringify(errors)}`);
  return result.tagsAdd.node;
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

async function updateParentRule(collectionIdsByHandle) {
  const parent = collectionIdsByHandle.get(PARENT_HANDLE);
  if (!parent?.legacyResourceId) throw new Error(`Missing parent collection legacy id: ${PARENT_HANDLE}`);
  const body = await fetchJson(`${REST_ENDPOINT}/smart_collections/${parent.legacyResourceId}.json`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN
    },
    body: JSON.stringify({
      smart_collection: {
        id: Number(parent.legacyResourceId),
        disjunctive: false,
        rules: [{ column: "tag", relation: "equals", condition: BLACK_KEMP_TAG }]
      }
    })
  });
  return body.smart_collection;
}

async function verifyProducts(products) {
  const rows = products.map((product) => ({
    handle: product.handle,
    status: product.status,
    title: product.title,
    productType: product.productType,
    templateSuffix: product.templateSuffix || "default",
    tags: product.tags,
    seoTitle: product.seo?.title || "",
    seoDescription: product.seo?.description || "",
    collections: product.collections
  }));
  const issueRows = rows.filter((row) => row.templateSuffix !== TARGET_TEMPLATE || !row.title.toLowerCase().startsWith("black kemp") || !hasBlackKempTag(row.tags));
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
  const { collections, products } = await fetchCollectionProducts(BLACK_KEMP_COLLECTION_HANDLES);
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
      oldTemplate: product.templateSuffix || "default",
      newTemplate: TARGET_TEMPLATE,
      hasBlackKempTag: hasBlackKempTag(product.tags),
      role: data.role,
      roles: data.roles,
      matchingCollectionRefs: data.matchingCollectionIds.length
    });
    console.log(`[${APPLY ? "UPDATE" : "DRY"}] ${product.status} ${data.role} ${product.handle}: "${product.title}" -> "${data.title}"`);

    if (APPLY) {
      await updateProduct(product, data);
      await setMetafields(product, data);
      await tagsAdd(product, BLACK_KEMP_TAG);
      await updateImageAlt(product, data);
      await sleep(220);
    }
  }

  const roleCounts = previewRows.reduce((acc, row) => {
    acc[row.role] = (acc[row.role] || 0) + 1;
    return acc;
  }, {});
  fs.writeFileSync(`${OUTPUT_DIR}/content-preview.json`, JSON.stringify({
    collections,
    count: products.length,
    roleCounts,
    rows: previewRows
  }, null, 2));
  console.log(`[PREVIEW] ${OUTPUT_DIR}/content-preview.json`);
  console.log(`[COUNT] ${products.length}`);
  console.log(`[ROLES] ${JSON.stringify(roleCounts)}`);

  if (APPLY) {
    await updateParentRule(collectionIdsByHandle);
    console.log(`[UPDATED PARENT RULE] ${PARENT_HANDLE} -> tag=${BLACK_KEMP_TAG}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
