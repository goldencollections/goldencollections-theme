#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const TARGET_TEMPLATE = "bharatanatyam-dance-accordion";
const ENV_FILE = "env";
const OUTPUT_DIR = "tmp/dance-hair-accessories";

const COLLECTION_HANDLES = [
  "bharatanatyam-flowers",
  "bharatanatyam-jada-jadai-kunjalam-sets",
  "bharatanatyam-hair-buns-dance-donuts-full-half-rings",
  "bharatanatyam-rakodi",
  "bharatanatyam-sun-moon",
  "bharatanatyam-hair-crowns"
];

const COMMON_COLLECTION_HANDLES = [
  "bharatanatyam-hair-accessories",
  "bharatanatyam-dance-accessories-flower-hair-head-set-maang-tikka-mattal-makeup",
  "bharatanatyam-dance-necklace-long-and-short",
  "bharatanatyam-jewellery"
];

const ROLE_COLLECTIONS = {
  flowers: ["bharatanatyam-flowers", "bharatanatyam-hair-buns-dance-donuts-full-half-rings"],
  jada: ["bharatanatyam-jada-jadai-kunjalam-sets", "bharatanatyam-rakodi", "bharatanatyam-sun-moon"],
  "hair bun": ["bharatanatyam-hair-buns-dance-donuts-full-half-rings", "bharatanatyam-rakodi", "bharatanatyam-flowers"],
  rakodi: ["bharatanatyam-rakodi", "bharatanatyam-hair-buns-dance-donuts-full-half-rings", "bharatanatyam-sun-moon"],
  "sun and moon": ["bharatanatyam-sun-moon", "bharatanatyam-rakodi", "bharatanatyam-jada-jadai-kunjalam-sets"],
  "hair crown": ["bharatanatyam-hair-crowns", "bharatanatyam-rakodi", "bharatanatyam-jada-jadai-kunjalam-sets"]
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

async function fetchJson(url, options, attempts = 3) {
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
      if (attempt < attempts) await sleep(750 * attempt);
    }
  }
  throw lastError;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchCollectionProducts(handles) {
  const query = `
    query CollectionProducts($handle: String!, $after: String) {
      collectionByHandle(handle: $handle) {
        id
        handle
        title
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
    collections.push({ id: collection.id, handle: collection.handle, title: collection.title });
  }
  return { collections, products: [...byId.values()] };
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

function codeFor(product) {
  const text = `${product.title} ${product.handle}`;
  const bhku = text.match(/\bBH[-\s]?KU[-\s]?0?(\d{1,4})\b/i);
  if (bhku) return `BHK-${bhku[1].padStart(3, "0")}`;
  const match = text.match(/\b(BDF|BHK|BHA)[-\s]?0?(\d{1,4})\b/i);
  if (!match) return "";
  return `${match[1].toUpperCase()}-${match[2].padStart(3, "0")}`;
}

function roleFor(product) {
  if (product.collections.includes("bharatanatyam-sun-moon")) return "sun and moon";
  if (product.collections.includes("bharatanatyam-hair-crowns")) return "hair crown";
  if (product.collections.includes("bharatanatyam-rakodi")) return "rakodi";
  if (product.collections.includes("bharatanatyam-hair-buns-dance-donuts-full-half-rings")) return "hair bun";
  if (product.collections.includes("bharatanatyam-jada-jadai-kunjalam-sets")) return "jada";
  if (product.collections.includes("bharatanatyam-flowers")) return "flowers";
  return "hair accessory";
}

function dataFor(product, collectionIdsByHandle) {
  const role = roleFor(product);
  const code = codeFor(product);
  const text = `${product.handle} ${product.title} ${product.productType}`.toLowerCase();
  const color = colorFor(role, text);
  const roles = rolesFor(role, text);
  const matchingCollectionIds = matchingCollectionHandles(role, product.collections)
    .map((handle) => collectionIdsByHandle.get(handle)?.id)
    .filter(Boolean);

  return {
    role,
    roles,
    code,
    color,
    matchingCollectionIds,
    title: titleFor(role, product, { code, text }),
    productType: productTypeFor(role),
    placement: placementFor(role),
    performanceContext: performanceContextFor(role),
    buyerContext: ["kids", "adult dancer", "dance institute", "teacher"],
    fitNotes: fitNotesFor(role),
    sizeNotes: sizeNotesFor(role),
    measurementConfidence: "Check product photos",
    componentCount: componentCountFor(role, text),
    material: materialFor(role),
    finish: finishFor(role),
    careInstructions: careFor(role),
    qualityChecks: qualityFor(role),
    matchingFinish: matchingFinishFor(role, color)
  };
}

function rolesFor(role, text) {
  const map = {
    flowers: ["flowers", "gajra", "veni"],
    jada: ["jada", "jada kuchulu", "kunjalam"],
    "hair bun": ["hair bun", "bun ring"],
    rakodi: ["rakodi"],
    "sun and moon": ["sun and moon", "surya chandra"],
    "hair crown": ["hair crown"]
  };
  const roles = [...(map[role] || ["hair accessory"])];
  if (role !== "rakodi" && text.includes("rakodi")) roles.push("rakodi");
  if (role !== "hair crown" && text.includes("crown")) roles.push("hair crown");
  return [...new Set(roles)];
}

function titleFor(role, product, { code, text }) {
  const suffix = code ? ` ${code}` : "";
  if (!code) {
    const uniqueTitle = uniqueFallbackTitle(role, product.handle);
    if (uniqueTitle) return uniqueTitle;
  }
  if (role === "flowers") {
    if (text.includes("white") && text.includes("orange")) return `White and Orange Bharatanatyam Gajra Veni Flowers${suffix}`;
    if (text.includes("white")) return `White Bharatanatyam Gajra Veni Flowers${suffix}`;
    if (text.includes("orange")) return `Orange Bharatanatyam Gajra Veni Flowers${suffix}`;
    return `Bharatanatyam Gajra Veni Hair Flowers${suffix}`;
  }
  if (role === "jada") {
    if (/billalu|bilalu/.test(text)) return `Bharatanatyam Jada Billalu Hair Ornament${suffix}`;
    if (/kuchulu|kucchulu|kuppulu|kunjalam/.test(text)) return `Bharatanatyam Jada Kuchulu Kunjalam Hair Accessory${suffix}`;
    if (/extension|braid/.test(text)) return `Bharatanatyam Hair Jada Braid Accessory${suffix}`;
    return `Bharatanatyam Jada Hair Accessory${suffix}`;
  }
  if (role === "hair bun") {
    if (text.includes("full") && text.includes("half")) return `Bharatanatyam Full and Half Hair Bun Ring${suffix}`;
    if (/black|thread/.test(text)) return `Bharatanatyam Hair Bun Support Accessory${suffix}`;
    return `Bharatanatyam Hair Bun Ring${suffix}`;
  }
  if (role === "rakodi") {
    if (text.includes("pearl")) return `Bharatanatyam Pearl Border Rakodi Hair Ornament${suffix}`;
    if (text.includes("lakshmi")) return `Bharatanatyam Lakshmi Rakodi Hair Ornament${suffix}`;
    if (text.includes("floral")) return `Bharatanatyam Floral Rakodi Hair Ornament${suffix}`;
    return `Bharatanatyam Rakodi Hair Ornament${suffix}`;
  }
  if (role === "sun and moon") {
    return `Bharatanatyam Sun and Moon Surya Chandra Hair Ornaments${suffix}`;
  }
  if (role === "hair crown") {
    if (text.includes("arch")) return `Bharatanatyam Arch Hair Crown${suffix}`;
    if (text.includes("rakodi")) return `Bharatanatyam Hair Crown Rakodi Ornament${suffix}`;
    return `Bharatanatyam Hair Crown${suffix}`;
  }
  return `${product.title.replace(/\s+-?\s*GoldenCollections$/i, "").trim()}${suffix}`;
}

function uniqueFallbackTitle(role, handle) {
  const map = {
    jada: [
      [/traditional-hair-braids-jada/, "Bharatanatyam Braid Jada Hair Accessory"],
      [/jada-billalu-hair-jada/, "Bharatanatyam Jada Billalu and Kunjalam Set"],
      [/hair-embellishments/, "Bharatanatyam Jadai Hair Embellishment"],
      [/classic-bharatanatyam-hair-extensions/, "Classic Bharatanatyam Hair Jada Extension"],
      [/traditional-hair-accessories/, "Bharatanatyam Round Jada Billalu Hair Ornament"],
      [/jada-billalu-for-hairstyles/, "Bharatanatyam Jada Billalu Hair Styling Ornament"],
      [/traditional-indian-hair-ornaments/, "Bharatanatyam Traditional Hair Ornament"],
      [/jada-billalu-set/, "Bharatanatyam Jada Billalu Hair Set"],
      [/jada-billalu-hair-accessory/, "Bharatanatyam Jada Billalu Hair Accessory"],
      [/bridal-hair-accessories/, "Bharatanatyam Jada Hair Ornament"]
    ],
    "hair bun": [
      [/traditional-bharatanatyam-hair-bun/, "Traditional Bharatanatyam Hair Bun Ring"],
      [/hair-bun-cover/, "Bharatanatyam Hair Bun Cover"],
      [/hair-bun-decoration-ideas/, "Bharatanatyam Hair Bun Decoration Accessory"],
      [/hair-bun-accessory-purchase/, "Bharatanatyam Hair Bun Accessory"],
      [/temple-jewellery-hair-accessories/, "Bharatanatyam Temple Hair Ornament"],
      [/hair-bun-ring-purchase/, "Bharatanatyam Hair Bun Ring Accessory"],
      [/hair-ornaments-online-store/, "Bharatanatyam Hair Ornaments"],
      [/hair-bun-decoration-goldencollections/, "Bharatanatyam Hair Bun Decoration"],
      [/dance-hair-bun-ring/, "Bharatanatyam Dance Hair Bun Ring"],
      [/hair-bun-jewelry-suppliers/, "Bharatanatyam Hair Bun Jewellery"],
      [/hair-bun-accessories/, "Bharatanatyam Hair Bun Accessories"],
      [/dance-hair-ornaments/, "Bharatanatyam Dance Hair Ornaments"],
      [/hair-jewelry-online/, "Bharatanatyam Hair Jewellery"]
    ],
    rakodi: [
      [/rakodi-design/, "Bharatanatyam Rakodi Hair Ornament Design"],
      [/traditional-rakodi-ornament/, "Traditional Bharatanatyam Rakodi Hair Ornament"],
      [/ethnic-rakodi/, "Bharatanatyam Ethnic Rakodi Hair Ornament"],
      [/bridal-rakodi/, "Bharatanatyam Stage Rakodi Hair Ornament"]
    ]
  };
  for (const [pattern, title] of map[role] || []) {
    if (pattern.test(handle)) return title;
  }
  return "";
}

function productTypeFor(role) {
  const map = {
    flowers: "Bharatanatyam Fabric Flower",
    jada: "Bharatanatyam Jada",
    "hair bun": "Bharatanatyam Buns",
    rakodi: "Bharatanatyam Rakodi",
    "sun and moon": "Bharatanatyam Sun & Moon",
    "hair crown": "Bharatanatyam Crowns"
  };
  return map[role] || "Bharatanatyam Hair Accessories";
}

function placementFor(role) {
  const map = {
    flowers: "Bun, braid or back hair arrangement",
    jada: "Braid / jada",
    "hair bun": "Back hair bun / bun support",
    rakodi: "Center back of head / bun",
    "sun and moon": "Sides of head near the hairline or bun",
    "hair crown": "Top or back hair crown placement"
  };
  return map[role] || "Dance hairstyle placement";
}

function performanceContextFor(role) {
  if (role === "hair bun") return ["practice", "class", "stage performance", "school program", "dance institute program"];
  return ["arangetram", "stage performance", "ceremony", "school program", "dance institute program"];
}

function fitNotesFor(role) {
  const map = {
    flowers: "Choose by hairstyle plan: bun wrapping, braid decoration or back-hair coverage. Check product photos for flower length, fullness and attachment style before ordering.",
    jada: "Match the jada with braid length, dancer height and the planned rakodi, flowers and kunjalam placement. Check product photos before ordering when exact length is not listed.",
    "hair bun": "Best selected by bun size and hairstyle support. Check the product photos for full ring, half ring, donut or support style before ordering.",
    rakodi: "Choose by bun size and back-head placement. Compare the rakodi diameter in product photos with the dancer's bun and hairstyle plan.",
    "sun and moon": "Use as a pair or head-ornament set only when the product photos show both pieces. Check side placement, pinning and hairstyle support before ordering.",
    "hair crown": "Check crown width, height, curve and pinning support against the dancer's hairstyle and role requirement before ordering."
  };
  return map[role] || "Check product photos, hairstyle placement and costume matching before ordering.";
}

function sizeNotesFor(role) {
  const map = {
    flowers: "Flower, gajra or veni size should be matched to bun size, braid length and stage visibility. Exact length can vary by design; use product photos for comparison.",
    jada: "Jada size should be checked against braid length and costume scale. Contact Golden Collections with dancer age and braid length if exact fit is critical.",
    "hair bun": "Bun ring and support size should be matched to the dancer's bun diameter. Contact Golden Collections with bun size if exact fit is critical.",
    rakodi: "Rakodi size should be matched to bun diameter or back-head placement. Use product photos for scale when exact diameter is not listed.",
    "sun and moon": "Check whether the photos show a pair, set or rakodi-style head ornament. Confirm with support if the exact included pieces are important.",
    "hair crown": "Hair crown size should be matched to role styling, bun placement and head comfort. Use product photos for scale when exact dimensions are not listed."
  };
  return map[role] || "Check size and placement from product photos before ordering.";
}

function componentCountFor(role, text) {
  if (role === "sun and moon" && /sun.*moon|moon.*sun|surya|chandra|soorya/.test(text)) return 2;
  return 1;
}

function materialFor(role) {
  if (role === "flowers") return "Artificial cloth flower material as shown in product photos";
  if (role === "hair bun") return "Hair bun ring/support material as shown in product photos";
  return "Gold-tone dance hair ornament with stone-look accents as shown in product photos";
}

function finishFor(role) {
  if (role === "flowers") return "Artificial flower finish as shown in product photos";
  if (role === "hair bun") return "Hair support finish as shown in product photos";
  return "Gold-tone regular dance finish as shown in product photos";
}

function colorFor(role, text) {
  if (role === "flowers") {
    if (text.includes("white") && text.includes("orange")) return "white and orange flower tones";
    if (text.includes("white")) return "white flower tones";
    if (text.includes("orange")) return "orange flower tones";
    return "flower colors as shown in product photos";
  }
  if (text.includes("pearl")) return "pearl-look white accents";
  if (text.includes("multicolor")) return "multicolor stone-look accents";
  if (/red|green|kemp|kempu/.test(text)) return "red-green stone-look accents";
  if (text.includes("kundan")) return "kundan-style stone-look accents";
  return "gold-tone / as shown in product photos";
}

function matchingFinishFor(role, color) {
  if (role === "flowers") return color;
  if (role === "hair bun") return "hair support / as shown";
  return "gold-tone / stone-look accents";
}

function careFor(role) {
  if (role === "flowers") return "Keep away from water, perfume and heavy pressure. Store flat or loosely so the flower shape is not crushed.";
  if (role === "hair bun") return "Keep dry after use and store without heavy pressure so the bun ring or support shape is protected.";
  return "Keep away from water, perfume and sweat after use. Store separately in a dry box or pouch so stones, pins and gold-tone finish are protected.";
}

function qualityFor(role) {
  if (role === "flowers") return "Checked for flower shape, color match, attachment condition and packing before shipping.";
  if (role === "hair bun") return "Checked for ring/support shape, attachment condition and packing before shipping.";
  if (role === "sun and moon") return "Checked for pair or set completeness where applicable, stone setting, pinning condition and packing before shipping.";
  return "Checked for stone setting, pinning condition, surface finish, set completeness where applicable and packing before shipping.";
}

function matchingCollectionHandles(role, currentHandles) {
  const handles = [...(ROLE_COLLECTIONS[role] || currentHandles), ...COMMON_COLLECTION_HANDLES];
  return [...new Set(handles)];
}

function htmlFor(product, data) {
  return `
<p>${introFor(data)} This hair accessory is selected for Bharatanatyam and Kuchipudi costume planning, where placement, pinning comfort and hairstyle scale matter on stage.</p>
<ul>
  <li>${useFor(data)}</li>
  <li>${data.sizeNotes}</li>
  <li>Useful for regular stage performances, school programs, dance institute use and arangetram preparation when the teacher confirms the hairstyle plan.</li>
  <li>Match flower color, gold-tone finish, stone-look accents and scale with the dancer's costume, jewellery and hairstyle before ordering.</li>
  <li>${data.careInstructions}</li>
</ul>
`.trim();
}

function introFor(data) {
  const intro = {
    flowers: "Bharatanatyam gajra/veni hair flowers for bun, braid and back-hair decoration.",
    jada: "Bharatanatyam jada/jada kuchulu hair accessory for braid styling and classical dance costume completion.",
    "hair bun": "Bharatanatyam hair bun ring or support accessory for creating a neat dance hairstyle base.",
    rakodi: "Bharatanatyam rakodi hair ornament for the center back of the head, usually over the bun or braid start.",
    "sun and moon": "Bharatanatyam sun and moon, also called surya chandra, for traditional head styling.",
    "hair crown": "Bharatanatyam hair crown ornament for elaborate classical dance, role-based or stage hairstyle styling."
  };
  return intro[data.role] || "Bharatanatyam hair accessory for classical dance hairstyle styling.";
}

function useFor(data) {
  if (data.role === "flowers") return "Use after the bun or braid shape is set, so the flowers frame the hairstyle cleanly without hiding jewellery.";
  if (data.role === "jada") return "Use down the braid or jada line, often with rakodi, flowers and kunjalam for a fuller classical hairstyle.";
  if (data.role === "hair bun") return "Use to build or support a neat bun before adding flowers, rakodi or crown styling.";
  if (data.role === "rakodi") return "Use over the bun or braid-start area when the costume direction needs a traditional circular back-head ornament.";
  if (data.role === "sun and moon") return "Use on either side of the head or as shown in the product photos to complete traditional surya chandra styling.";
  if (data.role === "hair crown") return "Use when the role, choreography or costume needs a more prominent crown-like head ornament.";
  return `Use for ${data.placement.toLowerCase()} as part of a complete Bharatanatyam or Kuchipudi performance look.`;
}

function seoDescriptionFor(data) {
  const core = {
    flowers: "Shop Bharatanatyam gajra, veni and dance hair flowers for bun, braid and Kuchipudi stage hairstyle styling. Choose by color, coverage and attachment.",
    jada: "Shop Bharatanatyam jada, jada kuchulu and kunjalam hair accessories for braid styling, arangetram preparation and Kuchipudi stage costumes.",
    "hair bun": "Shop Bharatanatyam hair bun rings and support accessories for neat classical dance hairstyles, practice, school programs and stage performances.",
    rakodi: "Shop Bharatanatyam rakodi hair ornaments for bun and back-head placement, with gold-tone and stone-look styles for Kuchipudi and stage dance.",
    "sun and moon": "Shop Bharatanatyam sun and moon, surya chandra hair ornaments for traditional head styling in Bharatanatyam and Kuchipudi performances.",
    "hair crown": "Shop Bharatanatyam hair crowns and crown-style head ornaments for classical dance, role-based stage styling and Kuchipudi costume looks."
  }[data.role] || "Shop Bharatanatyam hair accessories for classical dance hairstyle styling.";
  return core.slice(0, 320);
}

function imageAltFor(product, data) {
  return `${data.title} for Bharatanatyam and Kuchipudi dance hairstyle`.replace(/\s+/g, " ");
}

function metafieldsFor(product, data) {
  const fields = [
    ["dance_form_suitable", "list.single_line_text_field", ["Bharatanatyam", "Kuchipudi"]],
    ["dance_range", "single_line_text_field", "regular dance"],
    ["product_tier", "single_line_text_field", "regular"],
    ["dance_product_role", "list.single_line_text_field", data.roles],
    ["performance_context", "list.single_line_text_field", data.performanceContext],
    ["buyer_context", "list.single_line_text_field", data.buyerContext],
    ["placement", "single_line_text_field", data.placement],
    ["fit_notes", "multi_line_text_field", data.fitNotes],
    ["size_notes", "multi_line_text_field", data.sizeNotes],
    ["measurement_confidence", "single_line_text_field", data.measurementConfidence],
    ["component_count", "number_integer", String(data.componentCount)],
    ["matching_collection_refs", "list.collection_reference", data.matchingCollectionIds],
    ["matching_product_refs", "list.product_reference", []],
    ["matching_finish", "single_line_text_field", data.matchingFinish],
    ["stone_color", "single_line_text_field", data.color],
    ["material", "single_line_text_field", data.material],
    ["finish", "single_line_text_field", data.finish],
    ["care_instructions", "multi_line_text_field", data.careInstructions],
    ["quality_checks", "multi_line_text_field", data.qualityChecks]
  ];

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
        product { id handle title templateSuffix seo { title description } }
        userErrors { field message }
      }
    }
  `;
  const baseSeoTitle = data.title.replace(/\s+(BDF|BHK|BHA)-\d{3,4}$/i, "");
  const update = await gql(mutation, {
    input: {
      id: product.id,
      title: data.title,
      productType: data.productType,
      templateSuffix: TARGET_TEMPLATE,
      descriptionHtml: htmlFor(product, data),
      seo: {
        title: `${baseSeoTitle} | Golden Collections`,
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
  const body = await fetchJson(`${REST_ENDPOINT}/products/${product.legacyResourceId}/images/${imageId}.json`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN
    },
    body: JSON.stringify({ image: { id: imageId, alt: imageAltFor(product, data) } })
  });
  return body.image;
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  const { collections, products } = await fetchCollectionProducts(COLLECTION_HANDLES);
  const collectionIdsByHandle = await fetchCollectionIds([
    ...COLLECTION_HANDLES,
    ...COMMON_COLLECTION_HANDLES
  ]);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const previewRows = [];
  for (const product of products) {
    const data = dataFor(product, collectionIdsByHandle);
    previewRows.push({
      handle: product.handle,
      status: product.status,
      collections: product.collections,
      oldTitle: product.title,
      newTitle: data.title,
      role: data.role,
      roles: data.roles,
      productType: data.productType,
      templateSuffix: TARGET_TEMPLATE,
      componentCount: data.componentCount,
      measurementConfidence: data.measurementConfidence,
      matchingCollectionRefs: data.matchingCollectionIds.length
    });
    console.log(`[${APPLY ? "UPDATE" : "DRY"}] ${product.status} ${data.role} ${product.handle}: "${product.title}" -> "${data.title}"`);

    if (APPLY) {
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
  fs.writeFileSync(`${OUTPUT_DIR}/hair-accessory-product-content-preview.json`, JSON.stringify({
    collections,
    count: products.length,
    roleCounts,
    rows: previewRows
  }, null, 2));
  console.log(`[PREVIEW] ${OUTPUT_DIR}/hair-accessory-product-content-preview.json`);
  console.log(`[COUNT] ${products.length}`);
  console.log(`[ROLES] ${JSON.stringify(roleCounts)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
