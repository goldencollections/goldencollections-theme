#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const TARGET_TEMPLATE = "bharatanatyam-dance-accordion";
const ENV_FILE = "env";
const OUTPUT_DIR = "tmp/dance-sets";

const COLLECTION_HANDLES = [
  "bharatanatyam-jewellery-sets",
  "bharatnatyam-dance-jewellery-kids-collection"
];

const COMMON_COLLECTION_HANDLES = [
  "bharatanatyam-jewellery-sets",
  "bharatnatyam-dance-jewellery-kids-collection",
  "bharatanatyam-dance-necklace-long-and-short",
  "bharatanatyam-short-necklaces",
  "bharatanatyam-long-necklace",
  "bharatanatyam-dance-accessories-flower-hair-head-set-maang-tikka-mattal-makeup",
  "bharatanatyam-hair-accessories",
  "bharatanatyam-ghungroo",
  "kemp-bharatanatyam-jewellery-dance-sets",
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
            variants(first: 10) { nodes { title sku } }
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

function codeFor(product) {
  const text = `${product.title} ${product.handle}`;
  const bds = text.match(/\bBDS[-\s]?0?(\d{1,4})\b/i);
  if (bds) return `BDS-${bds[1].padStart(3, "0")}`;
  const bh = text.match(/\bBH[-\s]?0?(\d{1,4})\b/i);
  if (bh) return `BH-${bh[1].padStart(3, "0")}`;
  return "";
}

function isKids(product) {
  const text = `${product.handle} ${product.title} ${product.collections.join(" ")}`.toLowerCase();
  return text.includes("kids") || text.includes("little radha") || text.includes("little gopika");
}

function dataFor(product, collectionIdsByHandle) {
  const kids = isKids(product);
  const code = codeFor(product);
  const text = `${product.handle} ${product.title}`.toLowerCase();
  const matchingCollectionIds = matchingCollectionHandles(kids)
    .map((handle) => collectionIdsByHandle.get(handle)?.id)
    .filter(Boolean);

  return {
    kids,
    code,
    role: "complete set",
    roles: kids ? ["complete set", "kids dance set"] : ["complete set"],
    title: titleFor(product, { kids, code, text }),
    productType: product.productType,
    placement: "Complete jewellery set / multiple dance placements",
    performanceContext: kids ? ["stage performance", "school program", "dance institute program", "class"] : ["arangetram", "stage performance", "school program", "dance institute program"],
    buyerContext: kids ? ["kids", "dance institute", "teacher"] : ["adult dancer", "dance institute", "teacher"],
    fitNotes: fitNotesFor(kids),
    sizeNotes: sizeNotesFor(kids),
    measurementConfidence: "Check product photos",
    componentCount: 1,
    matchingCollectionIds,
    matchingFinish: matchingFinishFor(text),
    stoneColor: stoneColorFor(text),
    material: "Kemp-style stone work, alloy and gold plating as shown in product photos",
    finish: "Gold plated regular dance jewellery finish as shown in product photos",
    careInstructions: "Keep away from water, perfume and sweat after use. Store each component separately in a dry box or pouch so stones, joints and gold finish are protected.",
    qualityChecks: "Checked for visible stone setting, component completeness as shown, joints, surface finish and packing before shipping."
  };
}

function titleFor(product, { kids, code, text }) {
  const suffix = code ? ` ${code}` : "";
  if (kids) {
    if (text.includes("little radha")) return `Kids Bharatanatyam Dance Jewellery Set Little Radha${suffix}`;
    if (text.includes("little gopika")) return `Kids Bharatanatyam Dance Jewellery Set Little Gopika${suffix}`;
    return `Kids Bharatanatyam Dance Jewellery Set${suffix}`;
  }
  if (text.includes("mango")) return `Bharatanatyam Mango Dance Jewellery Set${suffix}`;
  if (text.includes("antique")) return `Antique Bharatanatyam Dance Jewellery Set${suffix}`;
  if (text.includes("temple")) return `Bharatanatyam Temple Dance Jewellery Set${suffix}`;
  if (text.includes("classical")) return `Classical Bharatanatyam Dance Jewellery Set${suffix}`;
  if (text.includes("traditional")) return `Traditional Bharatanatyam Dance Jewellery Set${suffix}`;
  if (text.includes("sparkling")) return `Sparkling Bharatanatyam Dance Jewellery Set${suffix}`;
  if (text.includes("elegant")) return `Elegant Bharatanatyam Dance Jewellery Set${suffix}`;
  if (text.includes("divine")) return `Divine Bharatanatyam Dance Jewellery Set${suffix}`;
  if (text.includes("exquisite")) return `Exquisite Bharatanatyam Dance Jewellery Set${suffix}`;
  return `Bharatanatyam Dance Jewellery Set${suffix || ` ${fallbackSuffix(product.handle)}`}`.trim();
}

function fallbackSuffix(handle) {
  return handle
    .split("-")
    .filter((part) => part && !["by", "for", "and", "the", "goldencollections", "golden", "collections", "bharatanatyam", "dance", "jewellery", "jewelry", "set", "sets"].includes(part))
    .slice(-2)
    .join(" ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function fitNotesFor(kids) {
  if (kids) {
    return "Choose by dancer age group, costume size, comfort and teacher component list. Check product photos for included pieces and confirm any missing component before ordering for a school program, class or stage performance.";
  }
  return "Choose by dancer age group, costume color, blouse neckline, hairstyle, waist placement and teacher component list. Check product photos for included pieces before ordering, especially for arangetram or group programs.";
}

function sizeNotesFor(kids) {
  if (kids) {
    return "Kids dance sets should be matched to the child's costume size, height, neckline, hairstyle and comfort. Do not assume one kids jewellery set fits every child; compare photos and measurements before ordering.";
  }
  return "Complete dance sets should be matched to dancer height, costume pleats, neckline, hairstyle and waist placement. Components are as shown in product photos unless separately specified.";
}

function matchingCollectionHandles(kids) {
  if (kids) {
    return [
      "bharatnatyam-dance-jewellery-kids-collection",
      "bharatanatyam-jewellery-sets",
      "bharatanatyam-hair-accessories",
      "bharatanatyam-ghungroo",
      "bharatanatyam-jewellery"
    ];
  }
  return [
    "bharatanatyam-jewellery-sets",
    "bharatanatyam-dance-necklace-long-and-short",
    "bharatanatyam-short-necklaces",
    "bharatanatyam-long-necklace",
    "bharatanatyam-dance-accessories-flower-hair-head-set-maang-tikka-mattal-makeup",
    "bharatanatyam-hair-accessories",
    "bharatanatyam-ghungroo",
    "kemp-bharatanatyam-jewellery-dance-sets",
    "bharatanatyam-jewellery"
  ];
}

function matchingFinishFor(text) {
  if (text.includes("antique")) return "antique gold / red-green stones";
  if (text.includes("mango")) return "gold / mango design / red-green stones";
  return "gold / red-green stones";
}

function stoneColorFor(text) {
  if (text.includes("antique")) return "red-green stone-look accents / antique finish";
  if (text.includes("mango")) return "red-green stone-look accents / mango motif";
  return "red-green stone-look accents";
}

function htmlFor(data) {
  return `
<p>${data.kids ? "Kids Bharatanatyam dance jewellery set and children's jewellery set" : "Bharatanatyam dance jewellery set"} for Bharatanatyam and Kuchipudi costume planning. Use this set when the dancer needs a coordinated regular dance look for class, school programs, dance institute performances or stage use.</p>
<ul>
  <li>${data.fitNotes}</li>
  <li>${data.sizeNotes}</li>
  <li>For arangetram, many buyers choose premium real kemp jewellery; confirm the teacher's required component list and performance standard before ordering a regular set.</li>
  <li>Match the set finish, stone color, pendant scale, hairstyle and costume colors with the full stage look.</li>
  <li>${data.careInstructions}</li>
</ul>
`.trim();
}

function seoDescriptionFor(data) {
  if (data.kids) {
    return "Shop kids jewellery sets for Bharatanatyam and Kuchipudi class, school programs and stage use. Check included pieces, costume fit and teacher list.";
  }
  return "Shop Bharatanatyam dance jewellery sets for Kuchipudi, stage programs, school performances and arangetram preparation. Check included pieces and teacher list.";
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
  const collectionIdsByHandle = await fetchCollectionIds(COMMON_COLLECTION_HANDLES);
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
    console.log(`[${APPLY ? "UPDATE" : "DRY"}] ${product.status} ${data.kids ? "kids set" : "adult set"} ${product.handle}: "${product.title}" -> "${data.title}"`);

    if (APPLY) {
      await updateProduct(product, data);
      await setMetafields(product, data);
      await updateImageAlt(product, data);
      await sleep(250);
    }
  }

  const roleCounts = previewRows.reduce((acc, row) => {
    const key = row.roles.includes("kids dance set") ? "kids dance set" : row.role;
    acc[key] = (acc[key] || 0) + 1;
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
