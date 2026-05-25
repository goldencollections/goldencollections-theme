#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const TARGET_TEMPLATE = "bharatanatyam-dance-accordion";
const ENV_FILE = "env";
const OUTPUT_DIR = "tmp/dance-cosmetics-instruments";

const COLLECTION_HANDLES = [
  "bharatanatyam-makeup-hair-essentials",
  "nattuvangam-thattu-kazhi-bharatanatyam-chembu-and-dance-plate",
  "bharatanatyam-practice-sarees"
];

const COMMON_COLLECTION_HANDLES = [
  "bharatanatyam-jewellery",
  "bharatanatyam-hair-accessories",
  "bharatanatyam-makeup-hair-essentials",
  "nattuvangam-thattu-kazhi-bharatanatyam-chembu-and-dance-plate",
  "bharatanatyam-practice-sarees"
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
            seo { title description }
            featuredImage { url altText }
            images(first: 1) { nodes { id altText url } }
            variants(first: 30) { nodes { title sku } }
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
      handle: collection.handle,
      title: collection.title,
      count: collection.productsCount.count,
      ruleSet: collection.ruleSet
    });
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

function roleFor(product) {
  const text = `${product.handle} ${product.title} ${product.productType}`.toLowerCase();
  if (text.includes("pancake")) return "pancake makeup";
  if (text.includes("panstick")) return "panstick makeup";
  if (text.includes("alta pen")) return "alta pen";
  if (text.includes("alta") || text.includes("altha") || text.includes("parani")) return "alta liquid";
  if (text.includes("bindi") || text.includes("tikli")) return "bindis";
  if (text.includes("black thread")) return "black thread";
  if (text.includes("pin")) return "hair pins";
  if (text.includes("thattu") || text.includes("kazhi")) return "thattu kazhi";
  if (text.includes("nattuvangam") || text.includes("thaalam")) return "nattuvangam thaalam";
  if (text.includes("dance plate") || text.includes("thalam tharangam")) return "dance plate";
  if (text.includes("practice saree") || text.includes("practice sari")) return "practice saree";
  return "dance item";
}

function dataFor(product, collectionIdsByHandle) {
  const role = roleFor(product);
  const text = `${product.handle} ${product.title} ${product.productType}`.toLowerCase();
  const variants = product.variants.nodes.map((variant) => variant.title).filter(Boolean);
  const matchingCollectionIds = matchingCollectionHandles(role)
    .map((handle) => collectionIdsByHandle.get(handle)?.id)
    .filter(Boolean);

  return {
    role,
    roles: rolesFor(role),
    title: titleFor(role, product),
    productType: product.productType,
    placement: placementFor(role),
    performanceContext: performanceContextFor(role),
    buyerContext: buyerContextFor(role),
    fitNotes: fitNotesFor(role, variants),
    sizeNotes: sizeNotesFor(role, variants),
    measurementConfidence: measurementConfidenceFor(role),
    componentCount: componentCountFor(role, text),
    matchingCollectionIds,
    matchingFinish: matchingFinishFor(role),
    stoneColor: colorFor(role, text),
    material: materialFor(role, text),
    finish: finishFor(role),
    careInstructions: careFor(role),
    qualityChecks: qualityFor(role)
  };
}

function rolesFor(role) {
  const map = {
    "pancake makeup": ["pancake makeup", "stage makeup"],
    "panstick makeup": ["panstick makeup", "stage makeup"],
    "alta pen": ["alta pen", "stage makeup"],
    "alta liquid": ["alta liquid", "stage makeup"],
    bindis: ["bindis", "stage makeup"],
    "hair pins": ["hair pins"],
    "black thread": ["black thread", "hair pins"],
    "thattu kazhi": ["thattu kazhi"],
    "nattuvangam thaalam": ["nattuvangam thaalam", "nattuvangam"],
    "dance plate": ["dance plate"],
    "practice saree": ["practice saree"]
  };
  return map[role] || ["dance item"];
}

function titleFor(role, product) {
  const map = {
    "pancake makeup": "Mifi Pancake Makeup Powder for Bharatanatyam and Kuchipudi",
    "panstick makeup": "Mifi Panstick Makeup Paste for Bharatanatyam and Kuchipudi",
    "alta pen": "Nyra Red Alta Pen for Bharatanatyam and Kuchipudi Pack of 3",
    "alta liquid": "Red Alta Liquid for Bharatanatyam and Kuchipudi Hand and Foot Styling",
    bindis: "Bharatanatyam Bindi Tikli Decals for Stage Makeup",
    "black thread": "Bharatanatyam Black Thread for Hair and Costume Fixing",
    "thattu kazhi": "Bharatanatyam Thattu Kazhi Wooden Rhythm Sticks",
    "nattuvangam thaalam": "Nattuvangam Thaalam Cymbals for Bharatanatyam and Kuchipudi",
    "dance plate": "Brass Dance Plate Thalam Tharangam for Bharatanatyam and Kuchipudi",
    "practice saree": "Bharatanatyam and Kuchipudi Cotton Practice Saree BPS-001"
  };
  if (map[role]) return map[role];
  const pinTitles = {
    "keep-your-hairstyle-in-place-with-bobby-pins-shop-now": "Bharatanatyam Bobby Pins for Dance Hairstyle",
    "discover-versatile-hair-pins-elevate-your-hairstyle-effortlessly": "Bharatanatyam Hair Pins for Dance Hairstyle",
    "metal-pins-for-every-task-find-the-perfect-fastener-here": "Bharatanatyam Metal Pins for Costume and Hair Fixing",
    "fastening-pins-essential-tools-for-sewing-crafting-and-more": "Bharatanatyam Fastening Pins for Costume Support",
    "keep-it-together-with-locking-pins-secure-your-items-safely": "Bharatanatyam Locking Pins for Costume Support",
    "discover-secure-pins-reliable-fastening-solutions-for-every-need": "Bharatanatyam Secure Pins for Costume Support"
  };
  return pinTitles[product.handle] || product.title.replace(/\s+-?\s*GoldenCollections$/i, "").trim();
}

function placementFor(role) {
  const map = {
    "pancake makeup": "Face / stage makeup base",
    "panstick makeup": "Face / stage makeup base",
    "alta pen": "Hands and feet",
    "alta liquid": "Hands and feet",
    bindis: "Forehead / stage makeup",
    "hair pins": "Hair, bun, braid or costume fixing",
    "black thread": "Hair, bun or jewellery tying",
    "thattu kazhi": "Teacher or nattuvanar rhythm use",
    "nattuvangam thaalam": "Teacher or nattuvanar hand rhythm",
    "dance plate": "Dance plate / thalam tharangam practice",
    "practice saree": "Practice costume / rehearsal wear"
  };
  return map[role] || "Dance use";
}

function performanceContextFor(role) {
  if (role === "practice saree") return ["practice", "class", "dance institute program"];
  if (["thattu kazhi", "nattuvangam thaalam", "dance plate"].includes(role)) return ["class", "practice", "stage performance", "ceremony", "dance institute program"];
  if (["hair pins", "black thread"].includes(role)) return ["class", "practice", "stage performance", "arangetram", "dance institute program"];
  return ["arangetram", "stage performance", "school program", "dance institute program"];
}

function buyerContextFor(role) {
  if (["thattu kazhi", "nattuvangam thaalam", "dance plate"].includes(role)) return ["teacher", "dance institute", "adult dancer"];
  return ["kids", "adult dancer", "dance institute", "teacher"];
}

function fitNotesFor(role, variants) {
  if (role === "pancake makeup") return `Choose shade or color option by dancer skin tone, costume color and stage-light requirement. Available options include: ${variants.join(", ")}. Patch-test cosmetics according to your usual makeup practice.`;
  if (role === "panstick makeup") return `Choose shade or color option by dancer skin tone, base coverage preference and makeup-artist direction. Available options include: ${variants.join(", ")}. Patch-test cosmetics according to your usual makeup practice.`;
  if (role === "alta pen") return "Use for red alta-style hand and foot detailing when the teacher or makeup artist wants clearer mudra and foot visibility. Check product photos and pack details before ordering.";
  if (role === "alta liquid") return "Use for red alta/parani-style hand and foot styling. Check color, bottle size and application comfort before ordering.";
  if (role === "bindis") return "Choose by forehead placement, costume color, dancer age group and stage visibility. Confirm adhesive comfort and placement before performance day.";
  if (role === "hair pins") return "Choose pin style and size by hairstyle, bun support, costume fixing need and dancer comfort. Check product photos and variant size before ordering.";
  if (role === "black thread") return "Use for tying or securing dance hair accessories as shown. Check thickness, color and tying requirement before ordering.";
  if (role === "thattu kazhi") return "Choose by teacher or nattuvanar preference. Check grip, sound use, material shown and class/stage requirement before ordering.";
  if (role === "nattuvangam thaalam") return "Choose by teacher or nattuvanar preference. Check hand comfort, sound requirement and product photos before ordering.";
  if (role === "dance plate") return "Choose by dance-school or teacher requirement for thalam tharangam or dance plate use. Check material, size impression and product photos before ordering.";
  if (role === "practice saree") return `Choose by color option, class requirement, drape comfort and movement. Available options include: ${variants.join(", ")}.`;
  return "Check product photos, teacher preference and use case before ordering.";
}

function sizeNotesFor(role, variants) {
  if (role === "pancake makeup" || role === "panstick makeup") return "Shade names are product variant options. Choose the shade with your makeup artist or teacher when stage lighting and costume color matter.";
  if (role === "alta pen") return "Pack and applicator details should be checked from the product photos and variant information before ordering.";
  if (role === "alta liquid") return "Bottle quantity and color should be checked from product photos and variant information before ordering.";
  if (role === "bindis") return "Bindi/tikli size and design should be compared with forehead placement and stage visibility using product photos.";
  if (role === "hair pins" || role === "black thread") return "Pin or thread size should be matched to the hairstyle, bun, braid, costume fixing point and product photos.";
  if (role === "practice saree") return "Practice saree color and fabric option should be selected from variants; confirm drape and class requirement before ordering.";
  return "Check product photos and teacher requirement before ordering.";
}

function measurementConfidenceFor(role) {
  if (["pancake makeup", "panstick makeup", "alta pen", "alta liquid", "bindis"].includes(role)) return "Not applicable";
  return "Check product photos";
}

function componentCountFor(role, text) {
  if (role === "alta pen" && /pack of 3|pack\s*3/.test(text)) return 3;
  return 1;
}

function matchingCollectionHandles(role) {
  if (["thattu kazhi", "nattuvangam thaalam", "dance plate"].includes(role)) {
    return ["nattuvangam-thattu-kazhi-bharatanatyam-chembu-and-dance-plate", "bharatanatyam-jewellery"];
  }
  if (role === "practice saree") {
    return ["bharatanatyam-practice-sarees", "bharatanatyam-jewellery", "bharatanatyam-dance-necklace-long-and-short"];
  }
  return ["bharatanatyam-makeup-hair-essentials", "bharatanatyam-hair-accessories", "bharatanatyam-jewellery"];
}

function matchingFinishFor(role) {
  if (role === "practice saree") return "practice saree color as selected";
  if (role === "hair pins" || role === "black thread") return "black / white / as selected";
  if (["thattu kazhi", "nattuvangam thaalam", "dance plate"].includes(role)) return "instrument finish as shown";
  return "stage makeup shade or color as selected";
}

function colorFor(role, text) {
  if (role === "alta pen" || role === "alta liquid") return "red";
  if (role === "black thread") return "black";
  if (role === "bindis") return "maroon / as selected";
  if (role === "practice saree") return "variant color as selected";
  if (text.includes("white")) return "white";
  if (text.includes("black")) return "black";
  return "as selected / as shown in product photos";
}

function materialFor(role, text) {
  if (role === "dance plate" && text.includes("brass")) return "Brass metal as stated in product title";
  if (role === "thattu kazhi" && text.includes("wood")) return "Wood as stated in product title";
  if (role === "practice saree") return "Cotton as stated in product title and variants";
  if (role === "hair pins") return "Hair/costume pin material as shown in product photos";
  if (role === "black thread") return "Black thread material as shown in product photos";
  return "Product material as shown in product photos";
}

function finishFor(role) {
  if (["pancake makeup", "panstick makeup", "alta pen", "alta liquid", "bindis"].includes(role)) return "Stage makeup finish as selected";
  if (["thattu kazhi", "nattuvangam thaalam", "dance plate"].includes(role)) return "Dance instrument finish as shown";
  if (role === "practice saree") return "Practice wear finish as selected";
  return "Hair and costume support finish as shown";
}

function careFor(role) {
  if (["pancake makeup", "panstick makeup", "alta pen", "alta liquid", "bindis"].includes(role)) return "Keep closed when not in use. Store away from heat, direct sunlight and moisture. Patch-test cosmetics according to your usual makeup practice.";
  if (["hair pins", "black thread"].includes(role)) return "Keep dry and store separately after use so pins, thread and hairstyle tools are easy to find before class or performance.";
  if (role === "practice saree") return "Follow the fabric care instructions on the product or label. Store folded and dry between class and rehearsal use.";
  return "Keep dry after use and store safely so the sound, grip and surface are protected between class, practice and performance.";
}

function qualityFor(role) {
  if (["pancake makeup", "panstick makeup", "alta pen", "alta liquid", "bindis"].includes(role)) return "Checked for selected variant, packing condition and product readiness before shipping.";
  if (role === "practice saree") return "Checked for selected color variant, fabric condition, folding and packing before shipping.";
  if (["hair pins", "black thread"].includes(role)) return "Checked for selected variant, visible condition and packing before shipping.";
  return "Checked for selected variant, visible finish, basic usability and packing before shipping.";
}

function htmlFor(data) {
  return `
<p>${introFor(data)} This product supports Bharatanatyam and Kuchipudi preparation, where teacher preference, comfort, stage visibility and product selection matter before performance day.</p>
<ul>
  <li>${useFor(data)}</li>
  <li>${data.sizeNotes}</li>
  <li>Useful for class, practice, arangetram preparation, school programs or dance institute use depending on the product and teacher requirement.</li>
  <li>${data.careInstructions}</li>
</ul>
`.trim();
}

function introFor(data) {
  const map = {
    "pancake makeup": "Mifi pancake makeup powder for classical dance stage makeup base.",
    "panstick makeup": "Mifi panstick makeup paste for classical dance stage makeup base.",
    "alta pen": "Red alta pen for Bharatanatyam and Kuchipudi hand and foot detailing.",
    "alta liquid": "Red alta liquid/parani for Bharatanatyam and Kuchipudi hand and foot styling.",
    bindis: "Bharatanatyam bindi/tikli decals for forehead stage makeup finishing.",
    "hair pins": "Hair and costume pins for securing Bharatanatyam and Kuchipudi hairstyles or costume points.",
    "black thread": "Black thread for tying or securing dance hair accessories and costume details.",
    "thattu kazhi": "Bharatanatyam thattu kazhi rhythm sticks for teacher-led class and practice use.",
    "nattuvangam thaalam": "Nattuvangam thaalam/cymbals for nattuvanar rhythm support in classical dance.",
    "dance plate": "Dance plate/thalam tharangam item for Bharatanatyam and Kuchipudi practice or performance needs.",
    "practice saree": "Cotton practice saree for Bharatanatyam and Kuchipudi class, rehearsal and practice sessions."
  };
  return map[data.role] || "Bharatanatyam and Kuchipudi dance item.";
}

function useFor(data) {
  if (["pancake makeup", "panstick makeup"].includes(data.role)) return "Use when the dancer needs a stage makeup base selected by shade, lighting, costume color and makeup-artist direction.";
  if (["alta pen", "alta liquid"].includes(data.role)) return "Use for red hand and foot detailing so mudras and footwork read more clearly on stage.";
  if (data.role === "bindis") return "Use as a forehead finishing detail when the costume and teacher direction call for bindi or tikli styling.";
  if (["hair pins", "black thread"].includes(data.role)) return "Use to secure the dance hairstyle, bun, braid, jewellery or costume support points before class or performance.";
  if (["thattu kazhi", "nattuvangam thaalam", "dance plate"].includes(data.role)) return "Use according to the teacher, nattuvanar or dance-school requirement for rhythm, class or presentation needs.";
  if (data.role === "practice saree") return "Use for class and rehearsal when the dancer needs practice drape, movement comfort and teacher correction visibility.";
  return "Use according to the dancer's class, costume or teacher requirement.";
}

function seoDescriptionFor(data) {
  const map = {
    "pancake makeup": "Shop Mifi pancake makeup powder for Bharatanatyam and Kuchipudi stage makeup. Choose shade or color by dancer skin tone, costume and lighting.",
    "panstick makeup": "Shop Mifi panstick makeup paste for Bharatanatyam and Kuchipudi stage makeup. Choose shade by skin tone, coverage preference and makeup direction.",
    "alta pen": "Shop Nyra red alta pen pack for Bharatanatyam and Kuchipudi hand and foot detailing, arangetram preparation and stage performance makeup.",
    "alta liquid": "Shop red alta liquid/parani for Bharatanatyam and Kuchipudi hand and foot styling, mudra visibility and classical dance stage preparation.",
    bindis: "Shop Bharatanatyam bindi and tikli decals for forehead stage makeup, arangetram preparation and Kuchipudi dance costume styling.",
    "hair pins": "Shop Bharatanatyam hair pins and costume pins for securing buns, braids, jewellery and practice or performance costume details.",
    "black thread": "Shop Bharatanatyam black thread for tying dance hair accessories, buns, braids and costume support points before class or performance.",
    "thattu kazhi": "Shop Bharatanatyam thattu kazhi wooden rhythm sticks for teacher-led practice, class use and classical dance rhythm training.",
    "nattuvangam thaalam": "Shop nattuvangam thaalam cymbals for Bharatanatyam and Kuchipudi teachers, nattuvanars, class use and stage rhythm support.",
    "dance plate": "Shop brass dance plate thalam tharangam for Bharatanatyam and Kuchipudi practice, class use and dance-school requirements.",
    "practice saree": "Shop Bharatanatyam and Kuchipudi cotton practice sarees for class, rehearsal and dance institute practice. Choose by color and drape comfort."
  };
  return (map[data.role] || "Shop Bharatanatyam and Kuchipudi dance preparation products.").slice(0, 320);
}

function imageAltFor(data) {
  return `${data.title} for Bharatanatyam and Kuchipudi dance`.replace(/\s+/g, " ");
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
    ["stone_color", "single_line_text_field", data.stoneColor],
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
  const body = await fetchJson(`${REST_ENDPOINT}/products/${product.legacyResourceId}/images/${imageId}.json`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN
    },
    body: JSON.stringify({ image: { id: imageId, alt: imageAltFor(data) } })
  });
  return body.image;
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  const { collections, products } = await fetchCollectionProducts(COLLECTION_HANDLES);
  const collectionIdsByHandle = await fetchCollectionIds([...COLLECTION_HANDLES, ...COMMON_COLLECTION_HANDLES]);
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
      oldProductType: product.productType,
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
  fs.writeFileSync(`${OUTPUT_DIR}/content-preview.json`, JSON.stringify({
    collections,
    count: products.length,
    roleCounts,
    rows: previewRows
  }, null, 2));
  console.log(`[PREVIEW] ${OUTPUT_DIR}/content-preview.json`);
  console.log(`[COUNT] ${products.length}`);
  console.log(`[ROLES] ${JSON.stringify(roleCounts)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
