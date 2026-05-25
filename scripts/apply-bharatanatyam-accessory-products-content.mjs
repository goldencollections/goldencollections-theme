#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const TARGET_TEMPLATE = "bharatanatyam-dance";
const ENV_FILE = "env";
const OUTPUT_DIR = "tmp/dance-accessories";

const COLLECTION_HANDLES = [
  "bharatanatyam-ghungroo",
  "bharatanatyam-bangles",
  "mattal-matil-bharatanatyam-dance",
  "bharatanatyam-waist-belts",
  "bharatanatyam-headset-jewelry",
  "bharatanatyam-maang-tikka-matil",
  "bharatanatyam-earrings-collection",
  "bharatanatyam-nose-pin",
  "bharatanatyam-nose-pin-collection",
  "bharatanatyam-vanki-baju-band",
  "drama-dance-crowns"
];

const COMMON_COLLECTION_HANDLES = [
  "bharatanatyam-dance-accessories-flower-hair-head-set-maang-tikka-mattal-makeup",
  "bharatanatyam-dance-necklace-long-and-short",
  "bharatanatyam-jewellery"
];

const ROLE_COLLECTIONS = {
  ghungroo: ["bharatanatyam-ghungroo"],
  "ghungroo bag": ["bharatanatyam-ghungroo"],
  anklet: ["bharatanatyam-ghungroo"],
  bangles: ["bharatanatyam-bangles"],
  mattal: ["mattal-matil-bharatanatyam-dance", "bharatanatyam-earrings-collection"],
  "waist belt": ["bharatanatyam-waist-belts"],
  headset: ["bharatanatyam-headset-jewelry", "bharatanatyam-maang-tikka-matil"],
  "nethi chutti": ["bharatanatyam-maang-tikka-matil", "bharatanatyam-headset-jewelry"],
  earrings: ["bharatanatyam-earrings-collection", "mattal-matil-bharatanatyam-dance"],
  "nose pin": ["bharatanatyam-nose-pin", "bharatanatyam-nose-pin-collection"],
  vanki: ["bharatanatyam-vanki-baju-band"],
  "dance crown": ["drama-dance-crowns"]
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
            priceRangeV2 { minVariantPrice { amount currencyCode } }
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
  const match = text.match(/\b(BDG|BHB|BDM|BWB|BHS|BMT|BJE|BNP|BHA|BBB|BDC|DGC)[-\s]?0?(\d{1,4})\b/i);
  if (!match) return "";
  const prefix = match[1].toUpperCase();
  const digits = match[2];
  return `${prefix}-${digits.length >= 3 ? digits : digits.padStart(3, "0")}`;
}

function roleFor(product) {
  const productType = product.productType.toLowerCase();
  const text = `${product.handle} ${product.title} ${product.productType} ${product.collections.join(" ")}`.toLowerCase();
  if (text.includes("bag")) return "ghungroo bag";
  if (product.collections.includes("bharatanatyam-bangles")) return "bangles";
  if (productType.includes("maang") || productType.includes("tikka") || productType.includes("nethi")) return "nethi chutti";
  if (productType.includes("matil") || productType.includes("mattal") || productType.includes("mattel")) return "mattal";
  if (productType.includes("earring")) return "earrings";
  if (productType.includes("head set") || productType.includes("headset")) return "headset";
  if (productType.includes("waist")) return "waist belt";
  if (productType.includes("bangle")) return "bangles";
  if (productType.includes("nose")) return "nose pin";
  if (productType.includes("bajuband")) return "vanki";
  if (productType.includes("salangai")) return "ghungroo";
  if (productType.includes("drama crown")) return "dance crown";
  if (text.includes("payal") || text.includes("anklet") && !text.includes("ghungroo")) return "anklet";
  if (text.includes("ghungroo") || text.includes("salangai") || text.includes("chilanka")) return "ghungroo";
  if (text.includes("bangle")) return "bangles";
  if (text.includes("mattal") || text.includes("matil") || text.includes("mattel") || text.includes("ear chain")) return "mattal";
  if (text.includes("waist") || text.includes("vaddanam") || text.includes("kamarband") || text.includes("hip belt")) return "waist belt";
  if (text.includes("headset") || text.includes("head set") || text.includes("headpiece")) return "headset";
  if (text.includes("maang") || text.includes("tikka") || text.includes("nethi") || text.includes("chutti")) return "nethi chutti";
  if (text.includes("earring") || text.includes("jhumka") || text.includes("jhumki")) return "earrings";
  if (text.includes("nose") || text.includes("nath") || text.includes("bulaki") || text.includes("mookuthi")) return "nose pin";
  if (text.includes("vanki") || text.includes("baju") || text.includes("bajuband") || text.includes("armlet")) return "vanki";
  if (text.includes("crown") || text.includes("mukut") || text.includes("kireedam")) return "dance crown";
  return "dance accessory";
}

function dataFor(product, collectionIdsByHandle) {
  const role = roleFor(product);
  const code = codeFor(product);
  const text = `${product.handle} ${product.title}`.toLowerCase();
  const hasPearls = /pearl|pearls/.test(text);
  const hasVelvet = /velvet/.test(text);
  const hasLeather = /leather/.test(text);
  const hasBlue = /blue/.test(text);
  const hasMaroon = /maroon/.test(text);
  const hasRed = /red/.test(text);
  const hasBrown = /brown/.test(text);
  const lineMatch = text.match(/\b([3-5])[-\s]?(line|lines|row|rows)\b/i);
  const bellCountMatch = text.match(/\b(50|100)\s*bells?\b/i);
  const lineCount = lineMatch ? Number(lineMatch[1]) : null;
  const bellCount = bellCountMatch ? Number(bellCountMatch[1]) : null;
  const color = colorFor({ hasBlue, hasMaroon, hasRed, hasBrown, hasVelvet, hasLeather, role, text });
  const material = materialFor(role, { hasVelvet, hasLeather });
  const roles = rolesFor(role);
  const componentCount = componentCountFor(role);
  const measurementConfidence = role === "ghungroo bag" ? "Not applicable" : "Check product photos";
  const sizeNotes = sizeNotesFor(role, { lineCount, bellCount });
  const matchingCollectionIds = matchingCollectionHandles(role, product.collections)
    .map((handle) => collectionIdsByHandle.get(handle)?.id)
    .filter(Boolean);

  return {
    role,
    roles,
    code,
    color,
    material,
    lineCount,
    bellCount,
    componentCount,
    measurementConfidence,
    sizeNotes,
    matchingCollectionIds,
    title: titleFor(role, product, { code, color, lineCount, bellCount }),
    productType: productTypeFor(role),
    placement: placementFor(role),
    performanceContext: performanceContextFor(role),
    buyerContext: buyerContextFor(role),
    fitNotes: fitNotesFor(role),
    careInstructions: careFor(role),
    qualityChecks: qualityFor(role)
  };
}

function rolesFor(role) {
  const map = {
    ghungroo: ["ghungroo", "salangai"],
    "ghungroo bag": ["ghungroo bag"],
    anklet: ["anklet"],
    bangles: ["bangles"],
    mattal: ["mattal"],
    "waist belt": ["waist belt", "vaddanam"],
    headset: ["headset", "nethi chutti"],
    "nethi chutti": ["nethi chutti"],
    earrings: ["earrings", "jhumki"],
    "nose pin": ["nose pin"],
    vanki: ["vanki"],
    "dance crown": ["dance crown"]
  };
  return map[role] || ["dance accessory"];
}

function productTypeFor(role) {
  const map = {
    ghungroo: "Bharatanatyam Ghungroo Salangai",
    "ghungroo bag": "Bharatanatyam Ghungroo Accessories",
    anklet: "Bharatanatyam Anklets",
    bangles: "Bharatanatyam Bangles",
    mattal: "Bharatanatyam Mattal",
    "waist belt": "Bharatanatyam Waist Belts",
    headset: "Bharatanatyam Headset",
    "nethi chutti": "Bharatanatyam Nethi Chutti",
    earrings: "Bharatanatyam Earrings",
    "nose pin": "Bharatanatyam Nose Pin",
    vanki: "Bharatanatyam Bajuband",
    "dance crown": "Drama Crowns"
  };
  return map[role] || "Bharatanatyam Dance Accessories";
}

function placementFor(role) {
  const map = {
    ghungroo: "Ankle",
    "ghungroo bag": "Storage / carrying",
    anklet: "Ankle",
    bangles: "Wrist",
    mattal: "Ear chain / hair support",
    "waist belt": "Waist / costume pleats",
    headset: "Forehead / hairline / head",
    "nethi chutti": "Forehead / hair parting",
    earrings: "Ears",
    "nose pin": "Nose",
    vanki: "Upper arm",
    "dance crown": "Head / stage role"
  };
  return map[role] || "Dance costume";
}

function performanceContextFor(role) {
  if (role === "ghungroo") return ["practice", "class", "stage performance", "dance institute program"];
  if (role === "dance crown") return ["stage performance", "ceremony", "dance institute program"];
  return ["stage performance", "school program", "dance institute program", "class"];
}

function buyerContextFor(role) {
  if (role === "dance crown") return ["adult dancer", "dance institute", "teacher"];
  return ["kids", "adult dancer", "dance institute", "teacher"];
}

function titleFor(role, product, details) {
  const { code, color, lineCount, bellCount } = details;
  if (!code) return fallbackTitle(product, role);
  const codeSuffix = code ? ` ${code}` : "";
  const roleTitle = {
    ghungroo: `Bharatanatyam and Kathak Ghungroo Salangai${lineCount ? ` ${lineCount}-Line` : ""}${bellCount ? ` ${bellCount} Bells` : ""}${color ? ` ${titleCase(color)}` : ""}`,
    "ghungroo bag": "Bharatanatyam Ghungroo Salangai Storage Bag",
    anklet: "Bharatanatyam Payal Dance Anklet",
    bangles: "Bharatanatyam Gold Plated Dance Bangles",
    mattal: "Bharatanatyam Mattal Ear Chains with Kemp Stones",
    "waist belt": "Bharatanatyam Vaddanam Waist Belt with Kemp Stones",
    headset: "Bharatanatyam Headset Nethichutti with Kemp Stones",
    "nethi chutti": "Bharatanatyam Nethi Chutti Maang Tikka with Kemp Stones",
    earrings: "Bharatanatyam Jhumka Earrings with Kemp Stones",
    "nose pin": "Bharatanatyam Nath Nose Pin with Kemp Stones",
    vanki: "Bharatanatyam Vanki Bajuband Armlet with Kemp Stones",
    "dance crown": crownTitle(product)
  }[role] || "Bharatanatyam Dance Accessory";
  if (role === "nethi chutti" && product.handle.includes("gold")) {
    return `Bharatanatyam Gold Plated Nethi Chutti Maang Tikka with Kemp Stones${codeSuffix}`.replace(/\s+/g, " ").trim();
  }
  return `${roleTitle}${codeSuffix}`.replace(/\s+/g, " ").trim();
}

function fallbackTitle(product, role) {
  const title = product.title
    .replace(/\s*[-|]\s*Golden\s*Collections\s*$/i, "")
    .replace(/\s*[-|]\s*GoldenCollections\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (/bharatanatyam|kuchipudi|drama|dance/i.test(title)) return title;
  const prefix = {
    ghungroo: "Bharatanatyam and Kathak Ghungroo Salangai",
    "ghungroo bag": "Bharatanatyam Ghungroo Salangai",
    anklet: "Bharatanatyam Payal",
    bangles: "Bharatanatyam Bangles",
    mattal: "Bharatanatyam Mattal",
    "waist belt": "Bharatanatyam Vaddanam",
    headset: "Bharatanatyam Headset",
    "nethi chutti": "Bharatanatyam Nethi Chutti",
    earrings: "Bharatanatyam Earrings",
    "nose pin": "Bharatanatyam Nath Nose Pin",
    vanki: "Bharatanatyam Vanki Bajuband",
    "dance crown": "Bharatanatyam Drama Crown"
  }[role] || "Bharatanatyam Dance Accessory";
  return `${prefix} ${title}`.replace(/\s+/g, " ").trim();
}

function crownTitle(product) {
  const text = `${product.handle} ${product.title}`.toLowerCase();
  if (text.includes("peacock")) return "Bharatanatyam Peacock Drama Crown";
  if (text.includes("naga") || text.includes("snake")) return "Bharatanatyam Naga Drama Crown";
  if (text.includes("lotus")) return "Bharatanatyam Lotus Drama Crown";
  if (text.includes("kundan")) return "Bharatanatyam Kundan Drama Crown";
  if (text.includes("sun")) return "Bharatanatyam Sun Drama Crown";
  if (text.includes("balaji")) return "Bharatanatyam Balaji Drama Crown";
  if (text.includes("goddess")) return "Bharatanatyam Goddess Drama Crown";
  if (text.includes("temple")) return "Bharatanatyam Temple Style Drama Crown";
  return "Bharatanatyam Drama Dance Crown";
}

function colorFor({ hasBlue, hasMaroon, hasRed, hasBrown, role, text }) {
  if (role === "ghungroo") {
    if (hasBlue) return "blue";
    if (hasMaroon) return "maroon";
    if (hasBrown) return "brown";
    if (hasRed) return "red";
    if (text.includes("black")) return "black";
    return "";
  }
  if (role === "dance crown") return text.includes("multicolor") ? "gold with multicolor stones" : "gold tone with stones";
  return "red, green and clear stones";
}

function materialFor(role, flags) {
  if (role === "ghungroo") {
    if (flags.hasLeather) return "Brass ankle bells on leather strap as shown in product photos";
    if (flags.hasVelvet) return "Brass ankle bells on velvet or cloth strap as shown in product photos";
    return "Brass ankle bells with strap material as shown in product photos";
  }
  if (role === "ghungroo bag") return "Fabric storage bag for ghungroo or salangai";
  if (role === "dance crown") return "Stage costume crown with gold finish and stone or sequin work as shown in product photos";
  return "Kemp-style stone work on alloy metal with gold plating";
}

function componentCountFor(role) {
  if (["ghungroo", "bangles", "mattal", "earrings"].includes(role)) return 2;
  return 1;
}

function sizeNotesFor(role, { lineCount, bellCount }) {
  if (role === "ghungroo") {
    const detail = bellCount ? `${bellCount}-bell` : lineCount ? `${lineCount}-line` : "selected";
    return `Choose this ${detail} ghungroo/salangai by teacher preference, dancer level, ankle comfort and sound needed for Bharatanatyam, Kuchipudi or Kathak practice and stage use. Check the product photos and straps before ordering.`;
  }
  if (role === "waist belt") return "Check the product photos for belt style and adjustability. Measure around the costume waist after pleats are set, then contact Golden Collections before ordering if an exact waist range is required.";
  if (role === "bangles") return "Choose by wrist size and comfort. Check product photos and contact Golden Collections before ordering if an exact bangle size is required.";
  if (role === "mattal") return "Match mattal length with hairstyle, ear position and earring drop so the ear chains sit comfortably without pulling during performance.";
  if (role === "headset") return "Check forehead placement, hair parting and bun position so the headset sits securely with the hairstyle and earrings.";
  if (role === "nethi chutti") return "Check forehead size, center placement and hair parting before pairing with headset, sun/moon pieces and earrings.";
  if (role === "earrings") return "Check earring size, weight and ear comfort, especially for younger dancers or long performance programs.";
  if (role === "nose pin") return "Check side placement, size and dancer comfort before pairing with earrings, mattal and necklace pieces.";
  if (role === "vanki") return "Check upper-arm comfort, adjustability and costume sleeve placement before ordering.";
  if (role === "dance crown") return "Check crown height, front width, role requirement, hairstyle support and performer comfort before ordering.";
  if (role === "anklet") return "Check ankle comfort, fastening and stage movement before ordering.";
  return "Check product photos, placement and costume matching before ordering.";
}

function fitNotesFor(role) {
  return sizeNotesFor(role, {});
}

function careFor(role) {
  if (role === "ghungroo") return "Keep ghungroo dry after use. Wipe bells and straps, allow sweat to dry fully, and store in a pouch away from moisture.";
  if (role === "ghungroo bag") return "Keep the bag dry and store ghungroo only after the bells and straps have dried after use.";
  if (role === "dance crown") return "Keep away from water and heavy pressure. Store separately so stones, sequins, edges and crown shape are protected.";
  return "Keep away from water, perfume and sweat after use. Store separately in a dry box or pouch so stones, joints and gold finish are protected.";
}

function qualityFor(role) {
  if (role === "ghungroo") return "Checked for bell attachment, strap stitching or fastening, pair completeness and packing before shipping.";
  if (role === "dance crown") return "Checked for crown shape, stone or sequin setting, edges, role styling and packing before shipping.";
  return "Checked for stone setting, joints, pair or set completeness where applicable, surface finish and packing before shipping.";
}

function matchingCollectionHandles(role, currentHandles) {
  const handles = [...(ROLE_COLLECTIONS[role] || currentHandles), ...COMMON_COLLECTION_HANDLES];
  return [...new Set(handles)];
}

function htmlFor(product, data) {
  const danceForms = danceFormsTextFor(data.role);
  return `
<p>${introFor(data.role, data)} This piece is selected for ${danceForms} costume planning, with placement and comfort checked against the dancer's full stage look.</p>
<ul>
  <li>${useFor(data.role, data)}</li>
  <li>${data.sizeNotes}</li>
  <li>Suitable for regular stage performances, school programs, dance institute use and class preparation unless the teacher specifies a premium real-kemp item.</li>
  <li>Match finish, stone color, scale and comfort with the dancer's costume, hairstyle and other jewellery before ordering.</li>
  <li>${data.careInstructions}</li>
</ul>
`.trim();
}

function introFor(role, data) {
  const intro = {
    ghungroo: `Bharatanatyam, Kuchipudi and Kathak ghungroo/salangai for ankle rhythm and classical dance footwork${data.lineCount ? ` in a ${data.lineCount}-line style` : ""}${data.bellCount ? ` with ${data.bellCount} bells` : ""}.`,
    "ghungroo bag": "Bharatanatyam ghungroo/salangai storage bag for carrying ankle bells safely between class, practice and performance.",
    anklet: "Bharatanatyam payal anklet for classical dance costume finishing and ankle styling.",
    bangles: "Bharatanatyam bangles for completing the hand line and matching the dance jewellery finish.",
    mattal: "Bharatanatyam mattal/matil ear chains for supporting earrings and completing the side profile.",
    "waist belt": "Bharatanatyam waist belt/vaddanam for defining costume pleats and stage silhouette.",
    headset: "Bharatanatyam headset with nethichutti styling for forehead, hairline and head placement.",
    "nethi chutti": "Bharatanatyam nethi chutti/maang tikka for forehead placement in classical dance styling.",
    earrings: "Bharatanatyam earrings/jhumka for matching necklaces, mattal and stage costume sets.",
    "nose pin": "Bharatanatyam nath/nose pin for completing a traditional classical dance face-jewellery look.",
    vanki: "Bharatanatyam vanki/bajuband armlet for upper-arm costume styling.",
    "dance crown": "Drama and dance crown for Bharatanatyam, Kuchipudi and mythological stage roles."
  };
  return intro[role] || "Bharatanatyam dance accessory for classical performance styling.";
}

function useFor(role, data) {
  if (role === "ghungroo") return "Use for practice, class and performance based on teacher preference, dancer level and sound requirement.";
  if (role === "dance crown") return "Use for stage roles, mythological characters, temple-inspired looks and dance-drama presentations.";
  if (role === "waist belt") return "Use to hold and visually define the costume waist and pleats during performance.";
  if (role === "mattal") return "Use with earrings when the side profile needs ear-chain support and a more complete temple jewellery look.";
  return `Use for ${data.placement.toLowerCase()} placement as part of a complete Bharatanatyam or Kuchipudi performance look.`;
}

function seoDescriptionFor(data) {
  const core = {
    ghungroo: "Shop Bharatanatyam, Kuchipudi and Kathak ghungroo/salangai for practice, class and stage performance. Choose by bell count, strap comfort and sound.",
    "ghungroo bag": "Shop Bharatanatyam ghungroo/salangai storage bag for carrying ankle bells safely to class, practice and performance.",
    bangles: "Shop Bharatanatyam bangles for dance costume styling, wrist comfort and matching gold-plated temple jewellery looks.",
    mattal: "Shop Bharatanatyam mattal/matil ear chains for earrings support, classical dance side profile and temple jewellery styling.",
    "waist belt": "Shop Bharatanatyam waist belts, vaddanam and oddiyanam for costume pleats, stage silhouette and classical dance styling.",
    headset: "Shop Bharatanatyam headsets and nethichutti pieces for forehead, hairline and classical dance stage styling.",
    "nethi chutti": "Shop Bharatanatyam nethi chutti and maang tikka pieces for forehead placement, hair parting and dance costume styling.",
    earrings: "Shop Bharatanatyam earrings and jhumka styles for matching necklaces, mattal and classical dance stage jewellery.",
    "nose pin": "Shop Bharatanatyam nath and nose pin styles for traditional dance face jewellery and matching temple jewellery looks.",
    vanki: "Shop Bharatanatyam vanki and bajuband armlets for upper-arm costume styling and classical dance performance looks.",
    "dance crown": "Shop drama and dance crowns for Bharatanatyam, Kuchipudi, mythological roles and stage performance styling."
  }[data.role] || "Shop Bharatanatyam dance accessories for classical performance styling.";
  return core.slice(0, 320);
}

function imageAltFor(product, data) {
  return `${data.title} for ${danceFormsTextFor(data.role)} dance`.replace(/\s+/g, " ");
}

function metafieldsFor(product, data) {
  const fields = [
    ["dance_form_suitable", "list.single_line_text_field", danceFormsFor(data.role)],
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
    ["matching_finish", "single_line_text_field", matchingFinishFor(data)],
    ["stone_color", "single_line_text_field", data.color || "gold tone / as shown in product photos"],
    ["material", "single_line_text_field", data.material],
    ["finish", "single_line_text_field", finishFor(data.role)],
    ["care_instructions", "multi_line_text_field", data.careInstructions],
    ["quality_checks", "multi_line_text_field", data.qualityChecks]
  ];

  if (data.role === "ghungroo" && data.bellCount) fields.push(["ghungroo_bell_count", "number_integer", String(data.bellCount)]);
  if (data.role === "waist belt") fields.push(["waist_belt_adjustable_range", "single_line_text_field", "Adjustable fit; check product photos and contact Golden Collections for exact waist range."]);
  if (data.role === "bangles") fields.push(["bangle_size", "single_line_text_field", "Check product photos and contact Golden Collections for exact bangle size."]);

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

function danceFormsFor(role) {
  if (role === "ghungroo") return ["Bharatanatyam", "Kuchipudi", "Kathak"];
  return ["Bharatanatyam", "Kuchipudi"];
}

function danceFormsTextFor(role) {
  return danceFormsFor(role).join(", ").replace(/, ([^,]*)$/, " and $1");
}

function matchingFinishFor(data) {
  if (data.role === "ghungroo") return data.color ? `${data.color} strap / brass bells` : "brass bells";
  if (data.role === "dance crown") return "gold / stage stones";
  return "gold / red-green stones";
}

function finishFor(role) {
  if (role === "ghungroo") return "Dance ankle bells finish as shown in product photos";
  if (role === "dance crown") return "Gold stage costume finish";
  return "Gold plated regular dance jewellery finish";
}

function titleCase(value) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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
  const update = await gql(mutation, {
    input: {
      id: product.id,
      title: data.title,
      productType: data.productType,
      templateSuffix: TARGET_TEMPLATE,
      descriptionHtml: htmlFor(product, data),
      seo: {
        title: `${data.title.replace(/\s+(BDG|BHB|BDM|BWB|BHS|BMT|BJE|BNP|BHA|BBB|BDC|DGC)-\d{3,4}$/i, "")} | Golden Collections`,
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
  const res = await fetch(`${REST_ENDPOINT}/products/${product.legacyResourceId}/images/${imageId}.json`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN
    },
    body: JSON.stringify({ image: { id: imageId, alt: imageAltFor(product, data) } })
  });
  const body = await res.json();
  if (!res.ok || body.errors) throw new Error(`image alt update ${product.handle}: ${JSON.stringify(body.errors || body)}`);
  return body.image;
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  const { products } = await fetchCollectionProducts(COLLECTION_HANDLES);
  const collectionIdsByHandle = await fetchCollectionIds([
    ...COLLECTION_HANDLES,
    ...COMMON_COLLECTION_HANDLES,
    "bharatanatyam-short-necklaces",
    "bharatanatyam-long-necklace"
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
      productType: data.productType,
      componentCount: data.componentCount,
      measurementConfidence: data.measurementConfidence,
      matchingCollectionRefs: data.matchingCollectionIds.length
    });
    console.log(`[${APPLY ? "UPDATE" : "DRY"}] ${product.status} ${data.role} ${product.handle}: "${product.title}" -> "${data.title}"`);

    if (APPLY) {
      await updateProduct(product, data);
      await setMetafields(product, data);
      await updateImageAlt(product, data);
    }
  }

  fs.writeFileSync(`${OUTPUT_DIR}/accessory-product-content-preview.json`, JSON.stringify(previewRows, null, 2));
  console.log(`[PREVIEW] ${OUTPUT_DIR}/accessory-product-content-preview.json`);
  console.log(`[COUNT] ${products.length}`);
  console.log(`[ROLES] ${JSON.stringify(previewRows.reduce((acc, row) => {
    acc[row.role] = (acc[row.role] || 0) + 1;
    return acc;
  }, {}))}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
