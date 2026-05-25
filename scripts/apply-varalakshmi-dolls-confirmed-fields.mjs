#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const COLLECTION_HANDLE = "vara-lakshmi-dolls";
const ENV_FILE = "env";
const GPC_RELIGIOUS_ITEMS = "97";

const MATERIAL =
  "Sponge body; plastic or wooden base on some idols, wrapped with saree; alloy metal face decorated with stones, kundan and beads; some faces include one gram gold jewellery";

const REGIONAL_NAMES = [
  "Varalakshmi idol",
  "Varamahalakshmi doll",
  "Ammavaru bommai",
  "Amman doll",
  "Lakshmi idol",
  "Lakshmi Devi vigraham",
  "Varalakshmi bommai",
  "Varamahalakshmi Habba doll",
  "Varalakshmi Vratham idol",
  "Lakshmi Amman idol"
];

const RELATED_COLLECTION_HANDLES = [
  "varalakshmi-deity-jewellery",
  "varalakshmi-doll-faces",
  "hands-legs-for-varalakshmi-idol",
  "vagamalai-thomala",
  "banana-tree-banana-bunches-for-pooja-varamahalakshmi-vratham"
];

const DEITY_HANDLES = {
  varalakshmi: "varalakshmi-lakshmi-amman",
  vishnu: "balaji-vishnu-perumal"
};

const SPECIAL_HANDLES = {
  venkateshwara: "lord-venkateshwara-swamy-balaji-idol-with-decoration",
  ashtaLakshmi: "sacred-varamahalakshmi-idol-set-vvd-098"
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

function mf(nodes, namespace, key) {
  return nodes.find((item) => item.namespace === namespace && item.key === key)?.value || "";
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
          metafields(first: 80) { nodes { namespace key value type reference { ... on Metaobject { id handle fields { key value } } } } }
          products(first: 50, after: $after) {
            pageInfo { hasNextPage endCursor }
            nodes {
              id legacyResourceId handle title descriptionHtml productType status totalInventory tags templateSuffix
              seo { title description }
              images(first: 50) { nodes { id altText url } }
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

function sku(product) {
  const fromVariant = product.variants.nodes.find((variant) => variant.sku)?.sku || "";
  const fromTitle = product.title.match(/\b[A-Z]{2,5}-?\d{2,4}\b/)?.[0] || "";
  const fromHandle = product.handle.match(/\b[a-z]{2,5}-?\d{2,4}\b/i)?.[0] || "";
  return String(fromVariant || fromTitle || fromHandle || "").replace(/\s+/g, "").replace("-", "").toUpperCase();
}

function textContext(product) {
  const optionText = product.variants.nodes
    .flatMap((variant) => variant.selectedOptions)
    .map((option) => `${option.name} ${option.value}`)
    .join(" ");
  return `${product.title} ${product.productType} ${optionText} ${product.descriptionHtml || ""}`.toLowerCase();
}

function heightValues(product) {
  const values = [];
  for (const variant of product.variants.nodes) {
    for (const option of variant.selectedOptions) {
      if (/height|size/i.test(option.name)) {
        const match = String(option.value || "").match(/(\d+(?:\.\d+)?)/);
        if (match) values.push(Number(match[1]));
      }
    }
  }
  return [...new Set(values)].sort((a, b) => a - b);
}

function colorValues(product) {
  const colors = product.variants.nodes
    .flatMap((variant) => variant.selectedOptions)
    .filter((option) => /color|colour/i.test(option.name))
    .map((option) => normalizeColor(option.value))
    .filter(Boolean)
    .filter((value) => !/^default title$/i.test(value))
    .filter((value) => !/^\d+$/.test(value))
    .filter((value) => !/\bbody\b/i.test(value));
  return [...new Set(colors)];
}

function normalizeColor(value) {
  const cleaned = cleanWords(value)
    .replace(/voilet/gi, "violet")
    .replace(/marron/gi, "maroon")
    .replace(/^multi$/i, "Multi Color")
    .replace(/^[\s/&-]+|[\s/&-]+$/g, "");
  return cleaned
    .split(/(\s+|\/|&|-)/)
    .map((part) => (/^[a-z]/i.test(part) ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : part))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanWords(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\b(varamahalakshmi|varalakshmi|vratham|pooja|festival)\b/gi, "")
    .replace(/\b(idol|doll|amman|lakshmi)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isBodyOnly(product) {
  return /\bbody\b/.test(textContext(product)) && !/face|full|jewell?ery|set/.test(textContext(product));
}

function isFaceOnly(product) {
  return /\bface\b/.test(textContext(product)) && !/body|full set|complete/.test(textContext(product));
}

function isFullSet(product) {
  return /full|complete|jewell?ery|set|saree|dress|crown/.test(textContext(product)) && !isBodyOnly(product) && !isFaceOnly(product);
}

function titleFor(product) {
  if (product.handle === SPECIAL_HANDLES.venkateshwara) {
    const heights = heightValues(product);
    const heightPart = heights.length === 1 ? ` ${formatNumber(heights[0])} in` : "";
    return `Venkateshwara Balaji Idol for Varalakshmi Vratham${heightPart} VVD104`;
  }
  if (product.handle === SPECIAL_HANDLES.ashtaLakshmi) {
    const heights = heightValues(product);
    const heightPart = heights.length === 1 ? ` ${formatNumber(heights[0])} in` : "";
    const code = sku(product);
    return `Ashta Lakshmi Doll Set for Varalakshmi Pooja and Navratri${heightPart}${code ? ` ${code}` : ""}`;
  }
  const code = sku(product);
  const heights = heightValues(product);
  const heightPart = heights.length === 1 ? `${formatNumber(heights[0])} in ` : "";
  const colors = colorValues(product);
  const colorPart = colors.length === 1 && colors[0].length <= 18 ? `${colors[0]} ` : "";
  let base = "Varalakshmi Amman Idol";
  if (isBodyOnly(product)) base = "Varalakshmi Idol Body";
  else if (isFaceOnly(product)) base = "Varalakshmi Amman Face";
  else if (isFullSet(product)) base = "Varalakshmi Amman Idol Full Set";
  return `${base} ${heightPart}${colorPart}${code}`.replace(/\s+/g, " ").trim().slice(0, 95);
}

function seoTitleFor(title) {
  return `${title} | Golden Collections`.slice(0, 70);
}

function productDescription(product) {
  const title = titleFor(product);
  const heights = heightValues(product);
  const heightLine = heights.length === 1
    ? `<p><strong>Height:</strong> ${formatNumber(heights[0])} inches finished idol/doll height, including crown, hair and decoration where shown.</p>`
    : "<p><strong>Height:</strong> Select the required Height variant. Height means the finished idol or doll height, including crown, hair and decoration where shown.</p>";
  const included = isBodyOnly(product)
    ? "Includes the Varalakshmi idol body or setup shown in the product photos."
    : isFaceOnly(product)
      ? "Includes the Varalakshmi face piece shown in the product photos."
      : "Includes the Varalakshmi idol or doll setup shown in the product photos. Full set styles include the visible idol body, face, jewellery pieces, saree or dress, crown and decorations shown in the photos.";
  if (product.handle === SPECIAL_HANDLES.venkateshwara) {
    return [
      `<p>${title} is a Venkateshwara / Balaji idol for Varalakshmi Vratham families who place Lord Venkateshwara beside the Varalakshmi pooja setup as part of their home ritual tradition.</p>`,
      heightLine,
      `<p><strong>Material:</strong> ${MATERIAL}.</p>`,
      "<p><strong>Included:</strong> Includes the Venkateshwara / Balaji idol setup shown in the product photos, including visible decoration pieces shown.</p>",
      "<p>Before ordering, compare the selected height, base space, display depth and your pooja mandapam, kalasam area or altar shelf space.</p>"
    ].join("");
  }
  if (product.handle === SPECIAL_HANDLES.ashtaLakshmi) {
    return [
      `<p>${title} is used for Varalakshmi pooja, Ashta Lakshmi worship and Navratri or Dasara display. Families may worship each doll on a separate day or place the full set together, depending on their tradition.</p>`,
      heightLine,
      `<p><strong>Material:</strong> ${MATERIAL}.</p>`,
      "<p><strong>Included:</strong> Includes the doll set and visible decorations shown in the product photos.</p>",
      "<p>Before ordering, compare the selected height, display width, base space, depth and your pooja mandapam, golu steps or altar shelf space.</p>"
    ].join("");
  }
  return [
    `<p>${title} is for Varalakshmi Vratham, Varamahalakshmi Habba, Lakshmi Pooja, Friday pooja, Navaratri golu and festive Amman alankaram setups.</p>`,
    heightLine,
    `<p><strong>Material:</strong> ${MATERIAL}.</p>`,
    `<p><strong>Included:</strong> ${included}</p>`,
    "<p>Before ordering, compare the selected height, base space, display depth, color, saree or dress style, visible jewellery, crown and your pooja mandapam, kalasam area or altar shelf space.</p>"
  ].join("");
}

function tagsFor(product) {
  if (product.handle === SPECIAL_HANDLES.venkateshwara) {
    return [
      "Venkateshwara Idol",
      "Balaji Idol",
      "Vishnu Idol",
      "Varalakshmi Vratham",
      "Varamahalakshmi Habba",
      "Pooja Idol",
      "Golden Collections",
      ...(sku(product) ? [sku(product)] : [])
    ];
  }
  if (product.handle === SPECIAL_HANDLES.ashtaLakshmi) {
    return [
      "Ashta Lakshmi Doll Set",
      "Varalakshmi Pooja",
      "Varalakshmi Vratham",
      "Navratri Golu",
      "Dasara Doll Set",
      "Lakshmi Idol",
      "Pooja Idol",
      "Golden Collections"
    ];
  }
  return [
    ...new Set([
      "Varalakshmi Idol",
      "Varamahalakshmi Doll",
      "Ammavaru Bommai",
      "Amman Doll",
      "Lakshmi Idol",
      "Varalakshmi Vratham",
      "Varamahalakshmi Habba",
      "Lakshmi Pooja",
      "Navaratri Golu",
      "Pooja Idol",
      "Golden Collections",
      ...(sku(product) ? [sku(product)] : [])
    ])
  ];
}

function fitNotes(product) {
  const heights = heightValues(product);
  const heightText = heights.length === 1
    ? `This product is marked as ${formatNumber(heights[0])} inches finished idol or doll height, including crown, hair and decoration where shown.`
    : "The selected Height variant is the finished idol or doll height, including crown, hair and decoration where shown.";
  return `${heightText} Compare it with your pooja mandapam, kalasam area, altar shelf height, base space and display depth before ordering.`;
}

function includedItems(product) {
  if (product.handle === SPECIAL_HANDLES.venkateshwara) return ["One Venkateshwara / Balaji idol setup as shown in photos"];
  if (product.handle === SPECIAL_HANDLES.ashtaLakshmi) return ["One Ashta Lakshmi doll set as shown in photos"];
  if (isBodyOnly(product)) return ["One Varalakshmi idol body or setup as shown in photos"];
  if (isFaceOnly(product)) return ["One Varalakshmi face piece as shown in photos"];
  return [
    "One Varalakshmi idol or doll setup as shown in photos",
    "Visible idol body",
    "Visible face",
    "Visible jewellery pieces",
    "Visible saree or dress",
    "Visible crown and decorations"
  ];
}

function productMetafields(product, collectionRefs, deityRefs) {
  const heights = heightValues(product);
  const primaryDeityRef = product.handle === SPECIAL_HANDLES.venkateshwara
    ? deityRefs.vishnu?.id
    : deityRefs.varalakshmi?.id || mf(collectionRefs, "custom", "primary_deity_ref");
  const ornamentTypeRef = mf(collectionRefs, "custom", "ornament_type_ref");
  const compatibleDeityNames = product.handle === SPECIAL_HANDLES.venkateshwara
    ? ["Balaji / Vishnu / Venkateswara / Perumal", "Varalakshmi / Lakshmi / Amman"]
    : ["Varalakshmi / Lakshmi / Amman"];
  const compatibleDeityRefs = product.handle === SPECIAL_HANDLES.venkateshwara
    ? [deityRefs.vishnu?.id, deityRefs.varalakshmi?.id].filter(Boolean)
    : [primaryDeityRef].filter(Boolean);
  const compatibilityClass = product.handle === SPECIAL_HANDLES.venkateshwara
    ? "Venkateshwara / Balaji idol used beside Varalakshmi Vratham setup"
    : product.handle === SPECIAL_HANDLES.ashtaLakshmi
      ? "Varalakshmi / Ashta Lakshmi / Navratri pooja"
      : "Varalakshmi / Lakshmi / Amman";
  const inputs = [
    metafield(product.id, "custom", "range_type", "single_line_text_field", "Varalakshmi Vratham"),
    metafield(product.id, "custom", "ornament_type", "single_line_text_field", product.handle === SPECIAL_HANDLES.venkateshwara ? "Venkateshwara / Balaji Pooja Idol" : "Varalakshmi Idol / Doll"),
    metafield(product.id, "custom", "placement", "single_line_text_field", "Pooja mandapam / kalasam area / altar"),
    metafield(product.id, "custom", "material", "single_line_text_field", MATERIAL),
    metafield(product.id, "custom", "compatibility_class", "single_line_text_field", compatibilityClass),
    metafield(product.id, "custom", "compatible_deities", "list.single_line_text_field", JSON.stringify(compatibleDeityNames)),
    metafield(product.id, "custom", "fit_notes", "multi_line_text_field", fitNotes(product)),
    metafield(product.id, "custom", "size_confidence", "single_line_text_field", heights.length === 1 ? "Variant finished height" : "Variant-level finished height"),
    metafield(product.id, "custom", "component_count", "number_integer", "1"),
    metafield(product.id, "custom", "set_items_included", "list.single_line_text_field", JSON.stringify(includedItems(product))),
    metafield(product.id, "custom", "regional_names", "list.single_line_text_field", JSON.stringify(REGIONAL_NAMES)),
    metafield(product.id, "mm-google-shopping", "google_product_category", "string", GPC_RELIGIOUS_ITEMS),
    metafield(product.id, "mc-facebook", "google_product_category", "string", GPC_RELIGIOUS_ITEMS),
    metafield(product.id, "mm-google-shopping", "condition", "string", "new"),
    metafield(product.id, "mm-google-shopping", "custom_product", "boolean", "true")
  ];
  if (ornamentTypeRef) inputs.push(metafield(product.id, "custom", "ornament_type_ref", "metaobject_reference", ornamentTypeRef));
  if (primaryDeityRef) {
    inputs.push(metafield(product.id, "custom", "primary_deity_ref", "metaobject_reference", primaryDeityRef));
    inputs.push(metafield(product.id, "custom", "compatible_deity_refs", "list.metaobject_reference", JSON.stringify(compatibleDeityRefs)));
  }
  if (heights.length === 1) inputs.push(metafield(product.id, "custom", "ornament_height_in", "number_decimal", String(heights[0])));
  return inputs;
}

function collectionMetafields(collection, relatedRefs) {
  const relatedIds = RELATED_COLLECTION_HANDLES.map((handle) => relatedRefs[handle]?.id).filter(Boolean);
  const inputs = [
    metafield(collection.id, "custom", "display_title", "single_line_text_field", "Varalakshmi Idols and Dolls"),
    metafield(
      collection.id,
      "custom",
      "collection_intro",
      "multi_line_text_field",
      "Varalakshmi idols, Varamahalakshmi dolls, Ammavaru bommai and Lakshmi Amman pooja sets for Varalakshmi Vratham, Varamahalakshmi Habba, Friday pooja and festive Amman alankaram."
    ),
    metafield(
      collection.id,
      "custom",
      "size_fit_intro",
      "multi_line_text_field",
      "For Varalakshmi idols and dolls, Height means the full finished idol or doll height, including crown, hair and decoration where shown. Compare it with your pooja mandapam, kalasam area, altar shelf, base space and display depth."
    ),
    metafield(collection.id, "custom", "faq_family", "single_line_text_field", "varalakshmi"),
    metafield(collection.id, "custom", "collection_role", "single_line_text_field", "festival"),
    metafield(collection.id, "custom", "deity_first_enabled", "boolean", "true"),
    metafield(collection.id, "custom", "shopping_path_label", "single_line_text_field", "Idols"),
    metafield(collection.id, "custom", "parent_menu_handles", "single_line_text_field", "varalakshmi-collection-circles"),
    metafield(collection.id, "custom", "regional_keyword_cluster", "list.single_line_text_field", JSON.stringify(REGIONAL_NAMES))
  ];
  if (relatedIds.length) {
    inputs.push(metafield(collection.id, "custom", "related_collection_refs", "list.collection_reference", JSON.stringify(relatedIds)));
  }
  return inputs;
}

async function updateCollection(collection, relatedRefs) {
  const descriptionHtml = [
    "<p>Shop Varalakshmi idols, Varamahalakshmi dolls, Ammavaru bommai and Lakshmi Amman pooja sets for Varalakshmi Vratham, Varamahalakshmi Habba, Friday pooja, Navaratri golu and festive Amman alankaram.</p>",
    "<p>Choose by finished idol height, color, style and the visible included setup. The Height variant means the full finished idol or doll height, including crown, hair and decoration where shown. Compare it with your pooja mandapam, kalasam area, altar shelf, base space and display depth.</p>"
  ].join("");
  if (!APPLY) {
    console.log(`[DRY COLLECTION] ${collection.title} -> Varalakshmi Idols and Dolls`);
  } else {
    const data = await gql(
      `mutation CollectionUpdate($input: CollectionInput!) {
        collectionUpdate(input: $input) {
          collection { id handle title seo { title description } }
          userErrors { field message }
        }
      }`,
      {
        input: {
          id: collection.id,
          title: "Varalakshmi Idols and Dolls",
          descriptionHtml,
          templateSuffix: "deity-ornament-default",
          sortOrder: "MANUAL",
          seo: {
            title: "Varalakshmi Idols & Dolls for Vratham Pooja",
            description:
              "Shop Varalakshmi idols, Varamahalakshmi dolls and Ammavaru bommai for Vratham pooja. Choose full idol sets by finished height, color and visible included items."
          }
        }
      }
    );
    const errors = data.collectionUpdate.userErrors || [];
    if (errors.length) throw new Error(`collectionUpdate: ${JSON.stringify(errors)}`);
  }
  await setMetafields(collectionMetafields(collection, relatedRefs));
}

async function updateProduct(product) {
  const title = titleFor(product);
  const seoTitle = product.handle === SPECIAL_HANDLES.ashtaLakshmi
    ? "Ashta Lakshmi Doll Set for Varalakshmi Pooja"
    : seoTitleFor(title);
  const seoDescription = product.handle === SPECIAL_HANDLES.venkateshwara
    ? `Shop ${title} for Varalakshmi Vratham families who place Balaji beside the pooja setup. Height is finished idol height.`
    : product.handle === SPECIAL_HANDLES.ashtaLakshmi
      ? "Shop Ashta Lakshmi Doll Set for Varalakshmi Pooja and Navratri display. Used for Ashta Lakshmi worship, Varalakshmi pooja and festive doll setup."
      : `Shop ${title} for Varalakshmi Vratham, Varamahalakshmi Habba and Lakshmi Pooja. Height is finished idol height; check visible included setup.`;
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
        productType: "Varalakshmi Vratham Dolls",
        templateSuffix: "deity-lite",
        descriptionHtml: productDescription(product),
        tags: tagsFor(product),
        seo: {
          title: seoTitle,
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
    const alt = product.handle === SPECIAL_HANDLES.venkateshwara
      ? `${title} Venkateshwara Balaji idol for Varalakshmi Vratham image ${index + 1}`
      : `${title} for Varalakshmi Vratham pooja image ${index + 1}`;
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
        metafieldsDelete(metafields: $metafields) {
          userErrors { field message }
        }
      }`,
      { metafields: identifiers.slice(index, index + 250) }
    );
    const errors = data.metafieldsDelete.userErrors || [];
    if (errors.length) throw new Error(`metafieldsDelete: ${JSON.stringify(errors)}`);
  }
}

async function updateVariantBarcodes(products) {
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
  console.log(`${APPLY ? "Updated" : "Would update"} ${updated} variant barcodes.`);
}

async function reorderCollection(collection, products) {
  const ordered = [...products].sort((a, b) => sortBucket(a) - sortBucket(b));
  const moves = ordered.map((product, index) => ({ id: product.id, newPosition: String(index) }));
  if (!APPLY) {
    console.log(`[DRY REORDER] ${moves.length} products, first 5: ${ordered.slice(0, 5).map((product) => sku(product) || product.handle).join(", ")}`);
    return;
  }
  const data = await gql(
    `mutation Reorder($id: ID!, $moves: [MoveInput!]!) {
      collectionReorderProducts(id: $id, moves: $moves) {
        job { id done }
        userErrors { field message }
      }
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
  console.log(`Fetched ${products.length} products from ${collection.handle}. Related refs: ${Object.keys(relatedRefs).join(", ") || "none"}`);
  console.log(`Deity refs: ${Object.keys(deityRefs).join(", ") || "none"}`);

  await updateCollection(collection, relatedRefs);
  await setMetafields(products.flatMap((product) => productMetafields(product, collection.metafields.nodes, deityRefs)));

  for (const product of products) await updateProduct(product);
  await deleteWrongGoogleFields(products);
  await updateVariantBarcodes(products);
  await reorderCollection(collection, products);

  const active = products.filter((product) => product.status === "ACTIVE").length;
  const draft = products.filter((product) => product.status === "DRAFT").length;
  const zeroImage = products.filter((product) => product.images.nodes.length === 0).length;
  console.log(`${APPLY ? "Updated" : "Would update"} collection ${collection.handle}: ${products.length} products (${active} active, ${draft} draft, ${zeroImage} zero-image).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
