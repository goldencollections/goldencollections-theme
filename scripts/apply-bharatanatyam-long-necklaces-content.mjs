#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const COLLECTION_HANDLE = "bharatanatyam-long-necklace";
const TARGET_TEMPLATE = "bharatanatyam-dance";
const PRODUCT_TYPE = "Bharatanatyam Long Necklaces";
const ENV_FILE = "env";
const OUTPUT_DIR = "tmp/dance-long-necklaces";

const MATCHING_COLLECTION_HANDLES = [
  "bharatanatyam-long-necklace",
  "bharatanatyam-short-necklaces",
  "bharatanatyam-dance-necklace-long-and-short",
  "bharatanatyam-jewellery"
];

const SHORT_TO_LONG_MATCHES = {
  "bharatanatyam-pearls-necklace-short-ethnic-chain-bsn-020": "bharatanatyam-pearls-necklace-long-ethnic-chain-bln-020",
  "bharatanatyam-jewelry-traditional-ornaments-bsn-038": "bharatanatyam-long-necklace-traditional-dance-jewelry-bln-038",
  "bharatanatyam-short-necklace-elegant-dance-jewelry-bsn-003": "bharatanatyam-long-necklace-elegant-dance-jewelry-bln-003",
  "elegant-bharatanatyam-short-chain-kempu-stones-necklace-bsn-007": "elegant-bharatanatyam-long-chain-kempu-stones-necklace-bln-007",
  "bharatanatyam-jewellery-short-haram-goldencollections-bsn-010": "bharatanatyam-jewellery-long-haram-goldencollections-bln-010",
  "kempu-pearls-bharatanatyam-short-chain-goldencollections-bsn-013": "kempu-pearls-bharatanatyam-long-chain-goldencollections-bln-013",
  "bharatanatyam-pearl-short-necklace-traditional-dance-jewelry-bsn-001": "bharatanatyam-pearl-long-necklace-traditional-dance-jewelry-bln-001",
  "kempu-red-green-bharatanatyam-short-chain-goldencollections-bsn-033": "bharatanatyam-long-necklace-traditional-designs-bln-033",
  "short-pearl-haram-for-bharatnatyam-goldencollections-bsn-023": "long-pearl-haram-for-bharatnatyam-goldencollections-bln-023",
  "short-pearl-haram-for-bharatnatyam-and-kuchipudi-bsn-016": "long-pearl-haram-for-bharatnatyam-and-kuchipudi-bln-016",
  "kempu-red-green-pearls-bharatanatyam-short-necklace-bsn-009": "kempu-red-green-pearls-bharatanatyam-long-necklace-bln-009",
  "wholesale-bharatanatyam-short-necklace-sets-goldencollections-bsn-011": "wholesale-bharatanatyam-long-necklace-sets-goldencollections-bln-011",
  "kempu-red-green-bharatanatyam-short-chain-goldencollections-bsn-018": "kempu-red-green-bharatanatyam-long-chain-goldencollections-bln-018",
  "kempu-pearls-bharatanatyam-short-haram-goldencollections-bsn-006": "kempu-pearls-bharatanatyam-long-haram-goldencollections-bln-006",
  "traditional-kempu-pearls-bharatanatyam-necklace-bsn-025": "traditional-kempu-pearls-bharatanatyam-necklace-bln-025",
  "kempu-red-green-pearls-bharatanatyam-short-necklace-bsn-028": "authentic-bharatanatyam-long-harams-bln-028",
  "kempu-bharatanatyam-short-necklace-goldencollections-bsn-008": "kempu-bharatanatyam-long-necklace-goldencollections-bln-008",
  "gold-plated-bharatanatyam-short-haram-traditional-jewelry-bsn-036": "bharatanatyam-indian-pearl-necklace",
  "imitation-bharatanatyam-short-chain-classical-dance-jewelry-bsn-019": "imitation-bharatanatyam-long-chain-classical-dance-jewelry-bln-019",
  "gold-plated-kempu-bharatanatyam-short-necklace-bsn-015": "gold-plated-kempu-bharatanatyam-long-necklace-bln-015",
  "golden-plated-kemp-bharatanatyam-short-haram-bsn-027": "stunning-bharatanatyam-long-haram-styles-bln-027",
  "bharatanatyam-short-haram-classical-dance-necklace-bsn-002": "bharatanatyam-long-haram-classical-dance-necklace-bln-002",
  "bharatanatyam-short-chain-with-kempu-stones-goldencollections-bsn-026": "long-necklace-traditional-elegance-for-your-performance-bln-026",
  "maroon-and-green-pearls-bharatanatyam-short-necklace-bsn-012": "maroon-and-green-pearls-bharatanatyam-long-necklace-bln-012",
  "bharatanatyam-short-chain-traditional-indian-dance-jewelry-bsn-004": "bharatanatyam-long-chain-traditional-indian-dance-jewelry-bln-004",
  "bharatanatyam-kemp-short-chain-classical-dance-jewelry-bsn-024": "bharatanatyam-kemp-long-chain-classical-dance-jewelry-bln-024",
  "kempu-red-green-bharatanatyam-necklace-goldencollections-bsn-022": "kempu-red-green-bharatanatyam-necklace-goldencollections-bln-022",
  "classical-bharatanatyam-short-chain-kempu-stones-jewelry-bsn-005": "bharatanatyam-pearls-long-haram-kemp-stones-bln-005",
  "kempu-pearls-bharatanatyam-short-chain-goldencollections-bsn-035": "bharatanatyam-kemp-stone-long-necklace-haram-classical-dance-jewelry",
  "bharatanatyam-kempu-short-haram-classical-dance-jewelry-bsn-034": "bharatanatyam-long-haram-embrace-tradition-bln-034",
  "classical-bharatanatyam-short-chain-kempu-stones-jewelry-bsn-029": "explore-timeless-bharatanatyam-long-haram-styles-bln-029",
  "bharatanatyam-short-necklace-authentic-designs-bsn-037": "bharatanatyam-kempu-gold-necklace",
  "gold-plated-kemp-bharatanatyam-short-chain-goldencollections-bsn-014": "gold-plated-kemp-bharatanatyam-long-chain-goldencollections-bln-014",
  "bharatanatyam-short-necklace-bsn044": "bharatanatyam-classical-gold-necklace",
  "elegant-bharatanatyam-short-chain-kempu-stones-necklace-bsn-031": "bharatanatyam-long-necklace-adorn-yourself-with-grace-bln-031",
  "graceful-short-haram-bharatanatyam-temple-necklace-bsn-039": "bharatanatyam-long-haram-temple-jewelry-for-dancers-bln-039",
  "temple-kemp-pearls-mala-for-bharatanatyam-goldencollections-bsn-017": "temple-kemp-pearls-mala-for-bharatanatyam-goldencollections-bln-017",
  "kempu-pearls-bharatanatyam-short-haram-goldencollections-bsn-030": "bharatanatyam-pearl-long-haram-round-kemp-discs-temple-pendant-bln055"
};

const LONG_TO_SHORT_MATCHES = Object.fromEntries(
  Object.entries(SHORT_TO_LONG_MATCHES).map(([shortHandle, longHandle]) => [longHandle, shortHandle])
);

const INCLUDED_EXTRAS = {
  "traditional-kempu-bharatanatyam-long-haram-bln-021": ["short necklace"],
  "traditional-kempu-pearls-bharatanatyam-necklace-bln-025": ["short necklace", "earrings"],
  "bharatanatyam-temple-pearl-necklace": ["earrings"],
  "bharatanatyam-majestic-temple-necklace": ["short necklace", "earrings"],
  "bharatanatyam-classical-kempu-necklace": ["short necklace", "earrings"],
  "bharatanatyam-kempu-temple-necklace": ["short necklace", "earrings"],
  "bharatanatyam-gold-haram": ["short necklace", "earrings"],
  "bharatanatyam-pearl-mango-necklace": ["earrings"],
  "bharatanatyam-indian-antique-necklace": ["short necklace", "earrings"],
  "bharatanatyam-majestic-gold-necklace": ["short necklace", "earrings"],
  "bharatanatyam-classical-pearl-necklace": ["short necklace"],
  "bharatanatyam-gold-pearl-necklace": ["short necklace", "extra long haram"],
  "bharatanatyam-classical-temple-necklace": ["short necklace", "extra long haram", "earrings"],
  "bharatanatyam-temple-kempu-necklace": ["short necklace"],
  "bharatanatyam-indian-kempu-necklace": ["short necklace"],
  "bharatanatyam-majestic-kempu-necklace": ["short necklace"],
  "bharatanatyam-antique-gold-necklace": ["short necklace"],
  "bharatanatyam-temple-haram": ["earrings"],
  "bharatanatyam-antique-haram": ["earrings"]
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

async function fetchCollectionProducts() {
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

  const products = [];
  let collection;
  let after = null;
  do {
    const data = await gql(query, { handle: COLLECTION_HANDLE, after });
    collection = data.collectionByHandle;
    if (!collection) throw new Error(`Collection not found: ${COLLECTION_HANDLE}`);
    products.push(...collection.products.nodes);
    after = collection.products.pageInfo.endCursor;
  } while (collection.products.pageInfo.hasNextPage);
  return { collection, products };
}

async function fetchCollectionIds(handles) {
  const entries = [];
  for (const handle of handles) {
    const data = await gql(
      `query CollectionByHandle($handle: String!) { collectionByHandle(handle: $handle) { id handle title } }`,
      { handle }
    );
    if (!data.collectionByHandle) {
      console.warn(`[MISSING COLLECTION] ${handle}`);
      continue;
    }
    entries.push(data.collectionByHandle);
  }
  return entries;
}

async function fetchProductIds(handles) {
  const byHandle = new Map();
  for (const handle of handles) {
    const data = await gql(
      `query ProductByHandle($query: String!) { products(first: 1, query: $query) { nodes { id handle title } } }`,
      { query: `handle:${handle}` }
    );
    const product = data.products.nodes[0];
    if (!product) {
      console.warn(`[MISSING MATCH PRODUCT] ${handle}`);
      continue;
    }
    byHandle.set(handle, product);
  }
  return byHandle;
}

function codeFor(product) {
  const text = `${product.title} ${product.handle}`;
  const match = text.match(/\bbln[-\s]?0?(\d{1,3})\b/i);
  if (!match) return "";
  return `BLN-${match[1].padStart(3, "0")}`;
}

function visualFor(product) {
  const text = `${product.handle} ${product.title}`.toLowerCase();
  const hasPearls = /pearl|pearls/.test(text);
  const hasTemple = /temple|lakshmi|kasumala|mango/.test(text);
  const hasMaroon = /maroon/.test(text);
  const hasAntique = /antique/.test(text);
  const hasGoldOnlyIntent = /gold-haram|gold-necklace|gold pearl|gold plated/.test(text);
  const isStatement =
    /majestic|stunning|authentic|wholesale|lakshmi|kasumala|peacock|round-kemp-discs|temple|classical/.test(text);
  const feature = featureFor(text, hasPearls, hasTemple, hasAntique);
  const stoneColor = stoneColorFor(text, hasPearls, hasMaroon, hasGoldOnlyIntent);
  const includedExtras = INCLUDED_EXTRAS[product.handle] || [];
  return { feature, stoneColor, hasPearls, hasTemple, hasAntique, isStatement, includedExtras };
}

function featureFor(text, hasPearls, hasTemple, hasAntique) {
  if (/kasumala/.test(text)) return "kasumala-inspired temple pendant";
  if (/peacock/.test(text)) return "Lakshmi peacock temple pendant";
  if (/round-kemp-discs|round kemp side discs/.test(text)) return "round kemp side discs and temple pendant";
  if (/mango/.test(text)) return "mango motif temple pendant";
  if (/lakshmi/.test(text)) return "Lakshmi temple pendant";
  if (/antique/.test(text) || hasAntique) return "antique gold tone temple styling";
  if (hasTemple) return "temple pendant";
  if (hasPearls) return "pearl strands and kemp-style pendant";
  return "kemp-style pendant";
}

function stoneColorFor(text, hasPearls, hasMaroon, hasGoldOnlyIntent) {
  if (hasMaroon) return "maroon, green and clear stones with white pearls";
  if (/blue/.test(text)) return "blue, red and clear stones";
  if (hasGoldOnlyIntent && !/kemp|kempu|stone/.test(text)) {
    return hasPearls ? "gold tone detailing with white pearls" : "gold tone detailing with red and green stones";
  }
  return hasPearls ? "red, green and clear stones with white pearls" : "red, green and clear stones";
}

function titleFor(product, data) {
  const code = codeFor(product);
  const detail = titleCase(data.feature);
  const modifier = modifierFor(product);
  let base = modifier
    ? `Bharatanatyam ${modifier} Long Haram with ${detail}`
    : `Bharatanatyam Long Haram with ${detail}`;
  if (data.includedExtras.includes("short necklace") || data.includedExtras.includes("extra long haram")) {
    base = base.replace(" Long Haram with ", " Long Haram Set with ");
  }
  if (data.includedExtras.includes("earrings")) {
    base = `${base} and Earrings`;
  }
  if (!code || base.toLowerCase().includes(code.toLowerCase())) return base;
  return `${base} ${code}`;
}

function modifierFor(product) {
  if (codeFor(product)) return "";
  const text = `${product.handle} ${product.title}`.toLowerCase().replace(/[-_]+/g, " ");
  const modifiers = [
    ["majestic gold", "Majestic Gold"],
    ["majestic pearl", "Majestic Pearl"],
    ["pearl gold", "Pearl Gold"],
    ["temple dance", "Mango Temple Dance"],
    ["temple pearl", "Temple Pearl"],
    ["majestic temple", "Majestic Temple"],
    ["classical kempu", "Classical Kempu"],
    ["kempu temple", "Kempu Temple"],
    ["gold haram", "Gold"],
    ["pearl mango", "Pearl Mango"],
    ["indian antique", "Indian Antique"],
    ["classical pearl", "Classical Pearl"],
    ["temple kempu", "Temple Kempu"],
    ["indian kempu", "Indian Kempu"],
    ["majestic kempu", "Majestic Kempu"],
    ["antique gold", "Antique Gold"],
    ["temple haram", "Temple"],
    ["antique haram", "Antique"]
  ];
  return modifiers.find(([needle]) => text.includes(needle))?.[1] || "";
}

function titleCase(value) {
  return value
    .split(" ")
    .map((word) => (["and", "with"].includes(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(" ");
}

function htmlFor(product, data) {
  const photoSentence = `The product photo shows a long haram with ${data.feature} and ${data.stoneColor}.`;
  const stageUse = data.isStatement
    ? "Use it when the dancer needs a stronger lower necklace layer that is visible from stage distance."
    : "Use it as the lower necklace layer to balance the costume pleats and short necklace.";
  const includedSentence = includedItemsSentence(data);

  return `
<p>A Bharatanatyam long haram for lower chest costume balance in classical dance styling. ${photoSentence}</p>
<ul>
  <li>${stageUse}</li>
  <li>Owner-confirmed standard 24-inch long haram, suitable for both kids and adults when the dancer height and costume proportion are appropriate.</li>
  ${includedSentence ? `<li>${includedSentence}</li>` : ""}
  <li>Suitable for regular Bharatanatyam and Kuchipudi stage performances, school programs and dance institute costume planning.</li>
  <li>Pair with a short necklace, earrings, mattal, headset, waist belt and hair accessories when building a complete dance jewellery look.</li>
  <li>Compare the haram drop, pendant scale, stone color and pearl work with dancer height, blouse neckline, costume pleats and the short necklace worn with it.</li>
  <li>For arangetram or premium long-term use, many dancers choose real kemp jewellery; this piece is from the regular Bharatanatyam/Kuchipudi dance jewellery range.</li>
</ul>
`.trim();
}

function seoDescriptionFor(data) {
  const included = data.includedExtras.includes("earrings")
    ? " Includes matching earrings shown."
    : data.includedExtras.length
      ? " Includes the extra items shown."
      : "";
  return `24-inch Bharatanatyam and Kuchipudi long haram with ${data.stoneColor} for regular stage performances and dance institute costume styling.${included}`;
}

function includedItemsSentence(data) {
  if (!data.includedExtras.length) return "";
  return `Includes the ${humanList(["long haram", ...data.includedExtras])} shown in the product photo.`;
}

function humanList(items) {
  const labels = items.map((item) => (item === "earrings" ? "matching earrings" : item));
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")} and ${labels.at(-1)}`;
}

function metafieldsFor(product, data, matchingCollectionIds, matchingProductIdsByHandle) {
  const matchingShortHandle = LONG_TO_SHORT_MATCHES[product.handle];
  const matchingProductIds = matchingShortHandle && matchingProductIdsByHandle.has(matchingShortHandle)
    ? [matchingProductIdsByHandle.get(matchingShortHandle).id]
    : [];
  const productRoles = ["long haram"];
  if (data.includedExtras.includes("short necklace")) productRoles.push("short necklace");
  if (data.includedExtras.includes("earrings")) productRoles.push("earrings");

  const fields = [
    ["dance_form_suitable", "list.single_line_text_field", ["Bharatanatyam", "Kuchipudi"]],
    ["dance_range", "single_line_text_field", "regular dance"],
    ["product_tier", "single_line_text_field", "regular"],
    ["dance_product_role", "list.single_line_text_field", productRoles],
    ["performance_context", "list.single_line_text_field", ["stage performance", "school program", "dance institute program", "class"]],
    ["buyer_context", "list.single_line_text_field", ["kids", "adult dancer", "dance institute", "teacher"]],
    ["placement", "single_line_text_field", "Lower chest / costume pleats"],
    [
      "fit_notes",
      "multi_line_text_field",
      data.isStatement
        ? "Use as a stronger 24-inch long-haram layer for lower costume balance. Compare pendant scale and pearl strands with dancer height, blouse neckline and costume pleats before ordering."
        : "Use as the 24-inch long-haram layer for lower costume balance. Compare pendant scale and pearl strands with dancer height, blouse neckline and costume pleats before ordering."
    ],
    [
      "size_notes",
      "multi_line_text_field",
      "Owner-confirmed standard 24-inch regular Bharatanatyam long haram, suitable for both kids and adults when the dancer height, blouse neckline and costume proportion are appropriate."
    ],
    ["measurement_confidence", "single_line_text_field", "Owner confirmed"],
    ["haram_drop_in", "number_decimal", "24.0"],
    ["component_count", "number_integer", String(componentCount(data))],
    ["matching_collection_refs", "list.collection_reference", matchingCollectionIds],
    ["matching_product_refs", "list.product_reference", matchingProductIds],
    ["matching_finish", "single_line_text_field", matchingFinish(data)],
    ["stone_color", "single_line_text_field", data.stoneColor],
    ["material", "single_line_text_field", "Kemp-style stone work on alloy metal with gold plating"],
    ["finish", "single_line_text_field", "Gold plated regular dance jewellery finish"],
    [
      "care_instructions",
      "multi_line_text_field",
      "Keep away from water, perfume and sweat after use. Store separately in a dry box or pouch so stones, pearl strands, pendant joints and gold finish are protected."
    ],
    [
      "quality_checks",
      "multi_line_text_field",
      "Checked for stone setting, pendant joints, chain or cord attachment, pearl strands where present, included items where shown, surface finish and packing before shipping."
    ]
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

function matchingFinish(data) {
  const parts = ["gold", "red-green stones"];
  if (data.stoneColor.includes("maroon")) return "gold / maroon-green stones / pearl";
  if (data.hasPearls) parts.push("pearl");
  if (data.hasAntique) parts.push("antique gold tone");
  return [...new Set(parts)].join(" / ");
}

function componentCount(data) {
  let count = 1;
  if (data.includedExtras.includes("short necklace")) count += 1;
  if (data.includedExtras.includes("extra long haram")) count += 1;
  if (data.includedExtras.includes("earrings")) count += 2;
  return count;
}

function imageAltFor(product, data) {
  const code = codeFor(product);
  const included = data.includedExtras.length ? `, shown with ${humanList(data.includedExtras)}` : "";
  return `Bharatanatyam long haram with ${data.stoneColor}${included}${code ? ` ${code}` : ""}`;
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
  const title = titleFor(product, data);
  const update = await gql(mutation, {
    input: {
      id: product.id,
      title,
      productType: PRODUCT_TYPE,
      templateSuffix: TARGET_TEMPLATE,
      descriptionHtml: htmlFor(product, data),
      seo: {
        title: `${title.replace(/\s+BLN-\d{3}$/i, "")} | Golden Collections`,
        description: seoDescriptionFor(data).slice(0, 320)
      }
    }
  });
  const errors = update.productUpdate.userErrors || [];
  if (errors.length) throw new Error(`productUpdate ${product.handle}: ${JSON.stringify(errors)}`);
  return update.productUpdate.product;
}

async function setMetafields(product, data, matchingCollectionIds, matchingProductIdsByHandle) {
  const mutation = `
    mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { namespace key type value }
        userErrors { field message code }
      }
    }
  `;
  const set = await gql(mutation, { metafields: metafieldsFor(product, data, matchingCollectionIds, matchingProductIdsByHandle) });
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

function ownerQuestionRows(products) {
  const rows = [["handle", "status", "question_area", "question", "why_it_matters"]];
  for (const product of products) {
    rows.push([
      product.handle,
      product.status,
      "measurement",
      "Owner confirmed standard long haram length as 24 inches.",
      "Applied to haram_drop_in with measurement_confidence Owner confirmed."
    ]);
    rows.push([
      product.handle,
      product.status,
      "included_components",
      "Owner confirmed extra visible items in product photos are included.",
      "Applied to visible component count and role values where images show extras."
    ]);
  }
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  const { products } = await fetchCollectionProducts();
  const matchingCollections = await fetchCollectionIds(MATCHING_COLLECTION_HANDLES);
  const matchingCollectionIds = matchingCollections.map((collection) => collection.id);
  const matchingProductIdsByHandle = await fetchProductIds([...new Set(Object.values(LONG_TO_SHORT_MATCHES))]);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const previewRows = [];
  for (const product of products) {
    const data = visualFor(product);
    const title = titleFor(product, data);
    previewRows.push({
      handle: product.handle,
      status: product.status,
      oldTitle: product.title,
      newTitle: title,
      oldTemplate: product.templateSuffix || "default",
      newTemplate: TARGET_TEMPLATE,
      feature: data.feature,
      stoneColor: data.stoneColor,
      includedExtras: data.includedExtras,
      componentCount: componentCount(data),
      matchingShortHandle: LONG_TO_SHORT_MATCHES[product.handle] || null,
      measurementConfidence: "Owner confirmed",
      haramDropIn: 24
    });
    console.log(`[${APPLY ? "UPDATE" : "DRY"}] ${product.status} ${product.handle}: "${product.title}" -> "${title}"`);

    if (APPLY) {
      await updateProduct(product, data);
      await setMetafields(product, data, matchingCollectionIds, matchingProductIdsByHandle);
      await updateImageAlt(product, data);
    }
  }

  fs.writeFileSync(`${OUTPUT_DIR}/long-necklace-content-preview.json`, JSON.stringify(previewRows, null, 2));
  fs.writeFileSync(`${OUTPUT_DIR}/owner-questions.csv`, ownerQuestionRows(products));
  console.log(`[PREVIEW] ${OUTPUT_DIR}/long-necklace-content-preview.json`);
  console.log(`[QUESTIONS] ${OUTPUT_DIR}/owner-questions.csv`);
  console.log(`[COUNT] ${products.length}`);
  console.log(`[EXACT SHORT MATCHES] ${previewRows.filter((row) => row.matchingShortHandle).length}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
