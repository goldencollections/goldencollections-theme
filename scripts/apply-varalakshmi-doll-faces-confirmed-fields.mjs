#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const COLLECTION_HANDLE = "varalakshmi-doll-faces";
const ENV_FILE = "env";
const GPC_RELIGIOUS_ITEMS = "97";
const NEW_SKU_HANDLE = "gold-plated-varalakshmi-face-idol-for-puja-decoration";
const NEW_SKU = "VDF057";

const MATERIAL_BY_SKU = new Map(
  Object.entries({
    VDF017: "Brass with Meenkari paint",
    VDF006: "Alloy metal with yellow paint with stone jewellery",
    VVF001: "German Silver with Blue Tanjore paint with one gram gold jewellery",
    VLFACE011: "Alloy metal with yellow paint with stone jewellery",
    VLFACE005: "Alloy metal with yellow paint with stone jewellery",
    VDF004: "Alloy metal with yellow paint with stone jewellery",
    VDF005: "Alloy metal with yellow paint with stone jewellery",
    VDF010: "Alloy metal with yellow paint",
    VDF012: "Alloy metal with yellow paint",
    VDF031: "Plastic face with gold plating",
    VDF002: "Alloy metal with blue paint",
    VDF003: "Alloy metal with blue paint",
    VDF009: "Alloy metal with cream paint",
    VLFACE003: "Alloy metal with Yellow paint",
    VDF007: "Alloy metal with Yellow paint",
    VDF011: "Alloy metal with Yellow paint",
    VDF001: "Alloy metal with Yellow paint",
    VDF041: "German Silver",
    VDF037: "Alloy metal with yellow paint with stone jewellery",
    VDF036: "Alloy metal with Yellow paint",
    VDF035: "Alloy metal with Black paint",
    VDF054: "Plastic with black paint and stone jewellery",
    VDF029: "Alloy metal with yellow paint with stone jewellery",
    VDF030: "Alloy metal with yellow paint with stone jewellery",
    VDF028: "Alloy metal with yellow paint with stone jewellery",
    VLFACE008: "German silver face with Tanjore paint and oxidised jewellery",
    VLFACE002: "German silver face with blue Tanjore paint and one gram jewellery",
    VDF057: "Brass",
    VDF031_1: "Fiber"
  })
);

const DRAFT_SKUS = new Set(
  ["VLFACE009", "VDF016", "VLFACE006", "VDF055", "VLFACE007", "VLFACE004", "VLFACE010", "VDF008"].map(normalizeSku)
);

const REGIONAL_NAMES = [
  "Varalakshmi face",
  "Varalakshmi doll face",
  "Ammavaru face",
  "Amman face",
  "Lakshmi face",
  "Lakshmi Devi face",
  "Devi face",
  "Mugam",
  "Mukham",
  "Alankaram face",
  "Kalasam face",
  "Ammavari face"
];

const RELATED_COLLECTION_HANDLES = [
  "vara-lakshmi-dolls",
  "hands-legs-for-varalakshmi-idol",
  "vagamalai-thomala",
  "varalakshmi-deity-jewellery",
  "banana-tree-banana-bunches-for-pooja-varamahalakshmi-vratham"
];

const DEITY_HANDLES = {
  varalakshmi: "varalakshmi-lakshmi-amman",
  vishnu: "balaji-vishnu-perumal",
  shiva: "shiva-mahadev",
  durga: "durga-devi-amman-parvati"
};

const env = readEnv(ENV_FILE);
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const GRAPHQL_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;
const REST_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}`;

if (!SHOP || !TOKEN) {
  console.error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN");
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

async function rest(path, options = {}) {
  const res = await fetch(`${REST_ENDPOINT}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN,
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(`REST ${options.method || "GET"} ${path}: ${res.status} ${text}`);
  return body;
}

function metafield(ownerId, namespace, key, type, value) {
  return { ownerId, namespace, key, type, value: String(value) };
}

async function fetchCollectionAndProducts() {
  const products = [];
  let collection = null;
  let after = null;
  do {
    const data = await gql(
      `query Products($handle: String!, $after: String) {
        collectionByHandle(handle: $handle) {
          id legacyResourceId handle title sortOrder productsCount { count }
          metafields(first: 100) { nodes { namespace key value type } }
          products(first: 80, after: $after) {
            pageInfo { hasNextPage endCursor }
            nodes {
              id legacyResourceId handle title descriptionHtml productType status totalInventory tags templateSuffix
              seo { title description }
              images(first: 60) { nodes { id altText url } }
              variants(first: 100) {
                nodes { id legacyResourceId title sku barcode inventoryQuantity selectedOptions { name value } }
              }
              metafields(first: 100) { nodes { namespace key value type } }
            }
          }
        }
      }`,
      { handle: COLLECTION_HANDLE, after }
    );
    collection = data.collectionByHandle;
    if (!collection) throw new Error(`Collection not found: ${COLLECTION_HANDLE}`);
    products.push(...collection.products.nodes);
    after = collection.products.pageInfo.hasNextPage ? collection.products.pageInfo.endCursor : null;
  } while (after);
  return { collection, products };
}

async function fetchCollectionRefs(handles) {
  const refs = {};
  for (const handle of handles) {
    const data = await gql(`query Collection($handle: String!) { collectionByHandle(handle: $handle) { id handle title } }`, { handle });
    if (data.collectionByHandle) refs[handle] = data.collectionByHandle;
  }
  return refs;
}

async function fetchMetaobjectRefs() {
  const refs = {};
  for (const [key, handle] of Object.entries(DEITY_HANDLES)) {
    const data = await gql(
      `query Metaobject($handle: MetaobjectHandleInput!) {
        metaobjectByHandle(handle: $handle) { id handle fields { key value } }
      }`,
      { handle: { type: "deity_group", handle } }
    );
    if (data.metaobjectByHandle) refs[key] = data.metaobjectByHandle;
  }
  return refs;
}

function normalizeSku(value) {
  return String(value || "").replace(/\s+/g, "").replace(/-/g, "").toUpperCase();
}

function sku(product) {
  if (product.handle === NEW_SKU_HANDLE) return NEW_SKU;
  const fromVariant = product.variants.nodes.find((variant) => variant.sku)?.sku || "";
  const fromTitle = product.title.match(/\b[A-Z]{2,5}-?\d{2,4}\b/)?.[0] || "";
  const fromHandle = product.handle.match(/\b[a-z]{2,5}-?\d{2,4}\b/i)?.[0] || "";
  return String(fromVariant || fromTitle || fromHandle || "").replace(/\s+/g, "").toUpperCase();
}

function skuKey(product) {
  return normalizeSku(sku(product));
}

function context(product) {
  return `${product.title} ${product.productType} ${product.descriptionHtml || ""} ${product.variants.nodes
    .map((variant) => `${variant.title} ${variant.selectedOptions.map((option) => `${option.name} ${option.value}`).join(" ")}`)
    .join(" ")}`;
}

function confirmedMaterialContext(product) {
  return `${product.title} ${product.variants.nodes
    .map((variant) => `${variant.title} ${variant.selectedOptions.map((option) => `${option.name} ${option.value}`).join(" ")}`)
    .join(" ")}`;
}

function materialFor(product) {
  const key = skuKey(product);
  if (MATERIAL_BY_SKU.has(key)) return MATERIAL_BY_SKU.get(key);
  const blob = confirmedMaterialContext(product);
  if (/german\s+silver/i.test(blob)) return /tanjore/i.test(blob) ? "German Silver with Tanjore paint" : "German Silver";
  if (/gold\s*plated/i.test(blob)) return "Gold Plated";
  if (/\bbrass\b/i.test(blob)) return /stone|jewell?ery|crown|earrings|kireetam|kireedam/i.test(blob) ? "Brass with stone jewellery" : "Brass";
  if (/\bpop\b/i.test(blob)) return /jewell?ery/i.test(blob) ? "POP face with jewellery decoration" : "POP";
  if (/\bplastic\b/i.test(blob)) return "Plastic";
  return "";
}

function deityInfo(product, refs) {
  const blob = context(product).toLowerCase();
  if (/vishnu|balaji|venkatesh|perumal/.test(blob)) {
    return { key: "vishnu", name: "Balaji / Vishnu / Venkateswara / Perumal", refs: [refs.vishnu?.id].filter(Boolean) };
  }
  if (/shiva/.test(blob)) {
    return { key: "shiva", name: "Shiva / Mahadev", refs: [refs.shiva?.id].filter(Boolean) };
  }
  if (/kali|durga/.test(blob)) {
    return { key: "durga", name: "Durga / Devi / Amman / Parvati", refs: [refs.durga?.id, refs.varalakshmi?.id].filter(Boolean) };
  }
  return { key: "varalakshmi", name: "Varalakshmi / Lakshmi / Amman", refs: [refs.varalakshmi?.id].filter(Boolean) };
}

function heightWidth(product) {
  const heights = [];
  const widths = [];
  const addPair = (value) => {
    const match = String(value || "").match(/(\d+(?:\.\d+)?)\s*(?:x|×|X)\s*(\d+(?:\.\d+)?)/);
    if (match) {
      heights.push(Number(match[1]));
      widths.push(Number(match[2]));
      return true;
    }
    return false;
  };
  for (const variant of product.variants.nodes) {
    for (const option of variant.selectedOptions) {
      if (/size/i.test(option.name)) {
        if (addPair(option.value)) continue;
      }
      if (/height|length/i.test(option.name)) {
        const match = String(option.value || "").match(/(\d+(?:\.\d+)?)/);
        if (match) heights.push(Number(match[1]));
      }
      if (/width/i.test(option.name)) {
        const match = String(option.value || "").match(/(\d+(?:\.\d+)?)/);
        if (match) widths.push(Number(match[1]));
      }
    }
    addPair(variant.title);
  }
  return {
    heights: [...new Set(heights)].sort((a, b) => a - b),
    widths: [...new Set(widths)].sort((a, b) => a - b)
  };
}

function colorFor(product) {
  const colors = product.variants.nodes
    .flatMap((variant) => variant.selectedOptions)
    .filter((option) => /colou?r/i.test(option.name))
    .map((option) => String(option.value || "").trim())
    .filter(Boolean)
    .filter((value) => !/default/i.test(value))
    .map((value) => value.replace(/multicolou?r/i, "Multi Color").replace(/marron/i, "Maroon"));
  return [...new Set(colors)][0] || "";
}

function styleFor(product) {
  const blob = context(product);
  if (/ashta\s*lakshmi|ashtalakshmi|8\s*set/i.test(blob)) return "Ashta Lakshmi 8 Face Set";
  if (/buddha/i.test(blob)) return "Buddha Face Base Decorated for Varalakshmi Alankaram";
  if (/vishnu|balaji|venkatesh|perumal/i.test(blob)) return "Vishnu / Balaji Face";
  if (/shiva/i.test(blob)) return "Shiva Face";
  if (/kali/i.test(blob)) return "Kali Matha Face";
  if (/durga/i.test(blob)) return "Durga Lakshmi Face";
  if (/german\s+silver/i.test(blob)) return "German Silver Face";
  if (/brass/i.test(blob)) return "Brass Face";
  if (/pop/i.test(blob)) return "POP Face";
  return "Deity Face";
}

function titleFor(product) {
  const code = sku(product).replace("-", "");
  const dims = heightWidth(product);
  const heightPart = dims.heights.length === 1 ? ` ${formatNumber(dims.heights[0])} in` : "";
  const style = styleFor(product);
  const deity = deityInfo(product, {}).key;
  if (style === "Ashta Lakshmi 8 Face Set") return `Ashta Lakshmi Devi Faces 8 Set ${code}`;
  if (style === "Buddha Face Base Decorated for Varalakshmi Alankaram") return `Buddha Face Base Decorated for Varalakshmi Alankaram ${code}`;
  if (deity === "vishnu") return `${style}${heightPart} ${code}`.trim();
  if (deity === "shiva") return `Shiva Face for Pooja${heightPart} ${code}`.trim();
  if (style === "Kali Matha Face") return `Kali Matha Face for Pooja${heightPart} ${code}`.trim();
  if (style === "Durga Lakshmi Face") return `Durga Lakshmi Mata Face for Kalasam Pooja ${code}`;
  return `Varalakshmi Ammavaru ${style}${heightPart} ${code}`.replace(/\s+/g, " ").trim();
}

function seoTitleFor(title) {
  return `${title} | Golden Collections`.slice(0, 70);
}

function fitNotes(product) {
  const dims = heightWidth(product);
  const height = dims.heights.length === 1 ? `${formatNumber(dims.heights[0])} in face height` : "selected face height";
  const width = dims.widths.length === 1 ? ` and ${formatNumber(dims.widths[0])} in front width` : "";
  return `Compare ${height}${width} with your kalasam, idol body, forehead/crown area, earring clearance, backdrop and jewellery placement. Height, Length or L means vertical face/setup height; W means front width, not thickness.`;
}

function includedItems(product) {
  if (/ashta\s*lakshmi|ashtalakshmi|8\s*set/i.test(context(product))) return ["Eight Ashta Lakshmi deity faces as shown in photos"];
  return ["One deity face setup as shown in photos"];
}

function componentCount(product) {
  return /ashta\s*lakshmi|ashtalakshmi|8\s*set/i.test(context(product)) ? 8 : 1;
}

function productDescription(product, refs) {
  const title = titleFor(product);
  const material = materialFor(product);
  const deity = deityInfo(product, refs);
  const style = styleFor(product);
  const useText = deity.key === "vishnu"
    ? "for Vishnu, Balaji, Venkateshwara or Perumal alankaram, including Lakshmi Kalyanam and festive pooja setups"
    : deity.key === "shiva"
      ? "for Shiva pooja and deity alankaram"
      : deity.key === "durga"
        ? "for Durga, Kali, Devi, Amman and goddess pooja alankaram"
        : "for Varalakshmi Vratham, Varamahalakshmi Habba, Lakshmi Pooja, Friday pooja and festive Amman alankaram";
  return [
    `<p>${title} is a ${style.toLowerCase()} ${useText}. It is selected for the face area of a kalasam, idol body, doll setup or festive pooja backdrop.</p>`,
    `<p><strong>Material:</strong> ${material}.</p>`,
    `<p><strong>Included:</strong> ${includedItems(product).join(", ")}.</p>`,
    `<p><strong>Fit guidance:</strong> ${fitNotes(product)}</p>`,
    "<p>Use the product photos and measurement images to match crown space, face width, earrings, nose ornament, necklace area and surrounding decoration before ordering.</p>"
  ].join("");
}

function tagsFor(product, refs) {
  const deity = deityInfo(product, refs);
  return [
    ...new Set([
      "Deity Face",
      "Idol Face",
      "Kalasam Face",
      "Alankaram Face",
      "Varalakshmi Face",
      "Ammavaru Face",
      "Amman Face",
      "Lakshmi Face",
      deity.name,
      "Varalakshmi Vratham",
      "Pooja Decoration",
      "Golden Collections",
      sku(product)
    ].filter(Boolean))
  ];
}

function productMetafields(product, refs, ornamentTypeRef) {
  const deity = deityInfo(product, refs);
  const dims = heightWidth(product);
  const inputs = [
    metafield(product.id, "custom", "range_type", "single_line_text_field", "Varalakshmi Vratham / Deity Face"),
    metafield(product.id, "custom", "ornament_type", "single_line_text_field", "Deity Face / Idol Face"),
    metafield(product.id, "custom", "placement", "single_line_text_field", "Face / Kalasam / Idol body / Alankaram backdrop"),
    metafield(product.id, "custom", "material", "single_line_text_field", materialFor(product)),
    metafield(product.id, "custom", "compatibility_class", "single_line_text_field", deity.name),
    metafield(product.id, "custom", "compatible_deities", "list.single_line_text_field", JSON.stringify([deity.name])),
    metafield(product.id, "custom", "compatible_deity_refs", "list.metaobject_reference", JSON.stringify(deity.refs)),
    metafield(product.id, "custom", "primary_deity_ref", "metaobject_reference", deity.refs[0] || refs.varalakshmi?.id),
    metafield(product.id, "custom", "fit_notes", "multi_line_text_field", fitNotes(product)),
    metafield(product.id, "custom", "size_confidence", "single_line_text_field", dims.heights.length || dims.widths.length ? "Variant or photo measurement" : "Check product photos"),
    metafield(product.id, "custom", "component_count", "number_integer", String(componentCount(product))),
    metafield(product.id, "custom", "set_items_included", "list.single_line_text_field", JSON.stringify(includedItems(product))),
    metafield(product.id, "custom", "regional_names", "list.single_line_text_field", JSON.stringify(REGIONAL_NAMES)),
    metafield(product.id, "mm-google-shopping", "google_product_category", "string", GPC_RELIGIOUS_ITEMS),
    metafield(product.id, "mc-facebook", "google_product_category", "string", GPC_RELIGIOUS_ITEMS),
    metafield(product.id, "mm-google-shopping", "condition", "string", "new"),
    metafield(product.id, "mm-google-shopping", "custom_product", "boolean", "true")
  ];
  if (ornamentTypeRef) inputs.push(metafield(product.id, "custom", "ornament_type_ref", "metaobject_reference", ornamentTypeRef));
  if (dims.heights.length === 1) inputs.push(metafield(product.id, "custom", "ornament_height_in", "number_decimal", String(dims.heights[0])));
  if (dims.widths.length === 1) inputs.push(metafield(product.id, "custom", "ornament_width_in", "number_decimal", String(dims.widths[0])));
  return inputs;
}

function collectionMetafields(collection, relatedRefs) {
  const relatedIds = RELATED_COLLECTION_HANDLES.map((handle) => relatedRefs[handle]?.id).filter(Boolean);
  const inputs = [
    metafield(collection.id, "custom", "display_title", "single_line_text_field", "Varalakshmi Doll Faces"),
    metafield(
      collection.id,
      "custom",
      "collection_intro",
      "multi_line_text_field",
      "Varalakshmi doll faces, Ammavaru faces, Amman faces and deity face setups for kalasam, idol body and festive alankaram. Choose by deity, material, face height, front width, crown space and visible jewellery setup."
    ),
    metafield(
      collection.id,
      "custom",
      "size_fit_intro",
      "multi_line_text_field",
      "For deity face products, Height, Length or L means vertical face/setup height. W means front width, not thickness. Measure kalasam or idol body placement, forehead and crown space, earring clearance, backdrop area and nearby jewellery before ordering."
    ),
    metafield(collection.id, "custom", "faq_family", "single_line_text_field", "varalakshmi"),
    metafield(collection.id, "custom", "collection_role", "single_line_text_field", "festival"),
    metafield(collection.id, "custom", "deity_first_enabled", "boolean", "true"),
    metafield(collection.id, "custom", "shopping_path_label", "single_line_text_field", "Faces"),
    metafield(collection.id, "custom", "parent_menu_handles", "single_line_text_field", "varalakshmi-collection-circles"),
    metafield(collection.id, "custom", "regional_keyword_cluster", "list.single_line_text_field", JSON.stringify(REGIONAL_NAMES))
  ];
  if (relatedIds.length) inputs.push(metafield(collection.id, "custom", "related_collection_refs", "list.collection_reference", JSON.stringify(relatedIds)));
  return inputs;
}

async function updateCollection(collection, relatedRefs) {
  const descriptionHtml = [
    "<p>Shop Varalakshmi doll faces, Ammavaru faces, Amman faces, Lakshmi faces and deity face setups for Varalakshmi Vratham, Varamahalakshmi Habba, Lakshmi Pooja, kalasam decoration, idol body alankaram and Navratri or festive display.</p>",
    "<p>Choose by deity style, confirmed material, face height, front width, crown space, earring clearance and the visible jewellery setup shown in the product photos. For this collection, Height, Length or L means vertical face/setup height, and W means front width, not thickness.</p>"
  ].join("");
  if (!APPLY) {
    console.log(`[DRY COLLECTION] ${collection.title} -> Varalakshmi Doll Faces`);
  } else {
    const data = await gql(
      `mutation CollectionUpdate($input: CollectionInput!) {
        collectionUpdate(input: $input) {
          userErrors { field message }
        }
      }`,
      {
        input: {
          id: collection.id,
          title: "Varalakshmi Doll Faces",
          descriptionHtml,
          templateSuffix: "deity-ornament-default",
          sortOrder: "MANUAL",
          seo: {
            title: "Varalakshmi Doll Faces for Pooja and Alankaram",
            description:
              "Shop Varalakshmi doll faces, Ammavaru faces and deity face setups for kalasam, idol body and pooja alankaram. Choose by material, face height and width."
          }
        }
      }
    );
    const errors = data.collectionUpdate.userErrors || [];
    if (errors.length) throw new Error(`collectionUpdate: ${JSON.stringify(errors)}`);
  }
  await setMetafields(collectionMetafields(collection, relatedRefs));
}

async function updateProduct(product, refs) {
  const title = titleFor(product);
  const description = productDescription(product, refs);
  const seoDescription = `Shop ${title} for pooja, kalasam, idol body or deity alankaram. Check confirmed material, face height, front width and visible setup.`;
  if (!APPLY) {
    console.log(`[DRY PRODUCT] ${product.handle}: ${product.title} -> ${title}`);
    return;
  }
  const data = await gql(
    `mutation ProductUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        userErrors { field message }
      }
    }`,
    {
      input: {
        id: product.id,
        title,
        productType: "Deity Faces",
        templateSuffix: "deity-lite",
        descriptionHtml: description,
        tags: tagsFor(product, refs),
        seo: {
          title: seoTitleFor(title),
          description: seoDescription.slice(0, 200)
        }
      }
    }
  );
  const errors = data.productUpdate.userErrors || [];
  if (errors.length) throw new Error(`productUpdate ${product.handle}: ${JSON.stringify(errors)}`);
  await updateImageAlts(product, title);
}

async function updateImageAlts(product, title) {
  for (const [index, image] of product.images.nodes.entries()) {
    const imageId = image.id.split("/").pop();
    const alt = `${title} deity face for pooja alankaram image ${index + 1}`;
    await rest(`/products/${product.legacyResourceId}/images/${imageId}.json`, {
      method: "PUT",
      body: JSON.stringify({ image: { id: Number(imageId), alt } })
    });
  }
}

async function setMetafields(inputs) {
  for (let index = 0; index < inputs.length; index += 20) {
    const chunk = inputs.slice(index, index + 20);
    if (!APPLY) {
      console.log(`[DRY METAFIELDS] ${chunk.length}`);
      continue;
    }
    const data = await gql(
      `mutation SetMetafields($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          userErrors { field message code }
        }
      }`,
      { metafields: chunk }
    );
    const errors = data.metafieldsSet.userErrors || [];
    if (errors.length) throw new Error(`metafieldsSet: ${JSON.stringify(errors)}`);
  }
}

async function draftUnavailable(products) {
  const targets = products.filter((product) => product.status === "ACTIVE" && DRAFT_SKUS.has(skuKey(product)));
  console.log(`${APPLY ? "Drafting" : "Would draft"} ${targets.length} unavailable active products: ${targets.map((product) => sku(product)).join(", ")}`);
  if (!APPLY) return;
  for (const product of targets) {
    const data = await gql(
      `mutation ProductUpdate($input: ProductInput!) {
        productUpdate(input: $input) { userErrors { field message } }
      }`,
      { input: { id: product.id, status: "DRAFT" } }
    );
    const errors = data.productUpdate.userErrors || [];
    if (errors.length) throw new Error(`draft ${product.handle}: ${JSON.stringify(errors)}`);
    product.status = "DRAFT";
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
  for (let index = 0; index < identifiers.length; index += 250) {
    const data = await gql(
      `mutation DeleteMetafields($metafields: [MetafieldIdentifierInput!]!) {
        metafieldsDelete(metafields: $metafields) { userErrors { field message } }
      }`,
      { metafields: identifiers.slice(index, index + 250) }
    );
    const errors = data.metafieldsDelete.userErrors || [];
    if (errors.length) throw new Error(`metafieldsDelete: ${JSON.stringify(errors)}`);
  }
}

async function updateVariantSkuBarcodes(products) {
  let updated = 0;
  for (const product of products) {
    const productSku = sku(product);
    for (const variant of product.variants.nodes) {
      const targetSku = variant.sku || productSku;
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

async function reorderCollection(collection, products) {
  const ordered = [...products].sort((a, b) => sortBucket(a) - sortBucket(b));
  const moves = ordered.map((product, index) => ({ id: product.id, newPosition: String(index) }));
  if (!APPLY) {
    console.log(`[DRY REORDER] ${moves.length} products, first 6: ${ordered.slice(0, 6).map((product) => sku(product)).join(", ")}`);
    return;
  }
  const data = await gql(
    `mutation Reorder($id: ID!, $moves: [MoveInput!]!) {
      collectionReorderProducts(id: $id, moves: $moves) { job { id done } userErrors { field message } }
    }`,
    { id: collection.id, moves }
  );
  const errors = data.collectionReorderProducts.userErrors || [];
  if (errors.length) throw new Error(`collectionReorderProducts: ${JSON.stringify(errors)}`);
  const job = data.collectionReorderProducts.job;
  if (job && !job.done) await waitForJob(job.id);
}

function sortBucket(product) {
  if (product.status === "ACTIVE" && product.images.nodes.length > 0 && product.totalInventory > 0) return 0;
  if (product.status === "ACTIVE" && product.images.nodes.length > 0) return 1;
  if (product.status === "ACTIVE") return 2;
  return 3;
}

async function waitForJob(jobId) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const data = await gql(`query Job($id: ID!) { job(id: $id) { id done } }`, { id: jobId });
    if (data.job?.done) return;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error(`Timed out waiting for job ${jobId}`);
}

function formatNumber(value) {
  return Number(value).toString();
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  const { collection, products } = await fetchCollectionAndProducts();
  const relatedRefs = await fetchCollectionRefs(RELATED_COLLECTION_HANDLES);
  const deityRefs = await fetchMetaobjectRefs();
  console.log(`Fetched ${products.length} products from ${collection.handle}.`);

  await draftUnavailable(products);
  const activeProducts = products.filter((product) => product.status === "ACTIVE" && !DRAFT_SKUS.has(skuKey(product)));
  const updateProducts = activeProducts.filter((product) => materialFor(product));
  const missingMaterial = activeProducts.filter((product) => !materialFor(product));
  if (missingMaterial.length) {
    throw new Error(`Active products still missing material: ${missingMaterial.map((product) => `${sku(product)} ${product.handle}`).join("; ")}`);
  }

  await updateCollection(collection, relatedRefs);
  await setMetafields(updateProducts.flatMap((product) => productMetafields(product, deityRefs, collection.metafields.nodes.find((m) => m.namespace === "custom" && m.key === "ornament_type_ref")?.value)));
  for (const product of updateProducts) await updateProduct(product, deityRefs);
  await deleteWrongGoogleFields(updateProducts);
  await updateVariantSkuBarcodes(updateProducts);
  await reorderCollection(collection, products);

  const active = products.filter((product) => product.status === "ACTIVE").length;
  const draft = products.filter((product) => product.status === "DRAFT").length;
  console.log(`${APPLY ? "Updated" : "Would update"} ${updateProducts.length} active face products. Collection now ${active} active, ${draft} draft.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
