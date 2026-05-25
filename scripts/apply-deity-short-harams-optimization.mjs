#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const UPDATE_ACTIVE_CONTENT = process.argv.includes("--content");
const ENV_FILE = "env";
const COLLECTION_HANDLE = "deity-short-harams";
const REVIEW_FILE = "tmp/reviews/deity-short-harams-owner-questions.csv";

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

const COLLECTION_UPDATE = {
  title: "Deity Short Necklace",
  bodyHtml:
    "<p>Shop deity short necklaces for Hindu god and goddess idol alankaram. These ornaments sit around the idol neck or upper chest and should be chosen by idol height, neck or chest placement, product Length x Width, color and step style.</p><p>Most short necklaces can suit different god and goddess idols when the measured fit is correct. Chest Necklace styles are intended only for Venkateshwara Swamy, Balaji, Vishnu, Perumal and goddess idols. Review the product measurement photos before ordering.</p>",
  seoTitle: "Deity Short Necklace for Idols",
  seoDescription:
    "Shop deity short necklaces for god and goddess idols. Choose by idol size, neck or chest width, necklace length, color and measured photos.",
  metafields: {
    display_title: "Short Necklace",
    collection_intro:
      "Short deity necklaces for Hindu god and goddess idols. Browse by style, color and step design, then use each product's measurement photos to compare Length x Width with the idol neck or upper chest area.",
    size_fit_intro:
      "Compare the product Length x Width with your idol neck or upper chest placement before ordering. Chest Necklace styles are only for Venkateshwara, Balaji, Vishnu, Perumal and goddess idols.",
    faq_family: "necklace",
    collection_role: "ornament_first",
    deity_first_enabled: "true",
    shopping_path_label: "Short Necklace",
    regional_keyword_cluster: [
      "deity short necklace",
      "short necklace for god idol",
      "short necklace for goddess idol",
      "deity necklace",
      "idol necklace",
      "god necklace",
      "goddess necklace",
      "haar",
      "mala",
      "malai",
      "alankaram necklace",
      "temple deity necklace",
      "swamy alankaram necklace",
      "lakshmi short necklace",
      "ammavaru short necklace",
      "amman short necklace",
      "venkateshwara chest necklace",
      "goddess chest necklace"
    ]
  }
};

const REGIONAL_NAMES = COLLECTION_UPDATE.metafields.regional_keyword_cluster;
const COMPATIBILITY_TEXT = {
  general: [
    "Multiple Hindu god and goddess idols by measured fit",
    "Varalakshmi / Lakshmi / Amman",
    "Balaji / Vishnu / Venkateswara / Perumal",
    "Krishna / Radha Krishna",
    "Ganesha / Ganapati / Vinayaka",
    "Durga / Devi / Amman / Parvati",
    "Shiva / Mahadev",
    "Murugan / Subramanya",
    "Ayyappa / Ayyappan",
    "Hanuman / Anjaneya"
  ],
  goddess: ["Varalakshmi / Lakshmi / Amman", "Durga / Devi / Amman / Parvati"],
  vishnu: ["Balaji / Vishnu / Venkateswara / Perumal", "Krishna / Radha Krishna"],
  krishna: ["Krishna / Radha Krishna", "Balaji / Vishnu / Venkateswara / Perumal"],
  ganesha: ["Ganesha / Ganapati / Vinayaka"],
  shiva: ["Shiva / Mahadev"],
  chest: [
    "Balaji / Vishnu / Venkateswara / Perumal",
    "Varalakshmi / Lakshmi / Amman",
    "Durga / Devi / Amman / Parvati"
  ]
};

const DEITY_HANDLES = {
  varalakshmi: "varalakshmi-lakshmi-amman",
  vishnu: "balaji-vishnu-perumal",
  krishna: "krishna-radha-krishna",
  ganesha: "ganesha-ganapati-vinayaka",
  shiva: "shiva-mahadev",
  durga: "durga-devi-amman-parvati",
  murugan: "murugan-subramanya",
  ayyappa: "ayyappa",
  hanuman: "hanuman-anjaneya"
};

function readEnv(file) {
  return Object.fromEntries(
    fs
      .readFileSync(file, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
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
  const bodyText = await res.text();
  const body = bodyText ? JSON.parse(bodyText) : {};
  if (!res.ok) throw new Error(`REST ${options.method || "GET"} ${path}: ${res.status} ${bodyText}`);
  return body;
}

function metafield(ownerId, namespace, key, type, value) {
  return { ownerId, namespace, key, type, value };
}

async function fetchCollection() {
  const data = await gql(
    `query Collection($handle: String!) {
      collectionByHandle(handle: $handle) {
        id
        legacyResourceId
        handle
        title
        products(first: 250) {
          nodes {
            id
            legacyResourceId
            handle
            title
            productType
            status
            totalInventory
            tags
            templateSuffix
            variants(first: 20) {
              nodes {
                id
                legacyResourceId
                title
                sku
                barcode
                price
                inventoryQuantity
                selectedOptions { name value }
              }
            }
            images(first: 10) {
              nodes { id altText }
            }
            metafields(first: 100, namespace: "custom") {
              nodes { key value type }
            }
          }
        }
      }
    }`,
    { handle: COLLECTION_HANDLE }
  );
  if (!data.collectionByHandle) throw new Error(`Collection not found: ${COLLECTION_HANDLE}`);
  return data.collectionByHandle;
}

async function fetchRefs() {
  const refs = {};
  const entries = [
    ["ornament", "deity_ornament_type", "short-haram-necklace"],
    ...Object.entries(DEITY_HANDLES).map(([key, handle]) => [key, "deity_group", handle])
  ];

  for (const [key, type, handle] of entries) {
    const data = await gql(
      `query Metaobject($handle: MetaobjectHandleInput!) {
        metaobjectByHandle(handle: $handle) { id handle displayName }
      }`,
      { handle: { type, handle } }
    );
    if (!data.metaobjectByHandle) throw new Error(`Missing ${type}:${handle}`);
    refs[key] = data.metaobjectByHandle;
  }
  return refs;
}

function exactSize(product) {
  const values = new Set();
  for (const variant of product.variants.nodes) {
    for (const option of variant.selectedOptions) {
      if (!/size|length/i.test(option.name)) continue;
      const value = normalizeSize(option.value);
      if (value) values.add(value);
    }
  }
  if (values.size !== 1) return null;
  const value = [...values][0];
  const match = value.match(/^(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)$/i);
  if (!match) return null;
  return { length: match[1], width: match[2], label: value.toUpperCase().replace(/\s*X\s*/i, " x ") };
}

function normalizeSize(value) {
  return String(value || "")
    .trim()
    .replace(/[×]/g, "x")
    .replace(/\s+/g, " ");
}

function classifyProduct(product) {
  const title = product.title.toLowerCase();
  const isChest = hasStyle(product, "Chest");
  if (isChest && /venkateswara|balaji|vishnu|perumal/.test(title)) {
    return {
      group: "chest",
      primaryKey: "vishnu",
      primaryText: "Balaji / Vishnu / Venkateswara / Perumal",
      compatibleKeys: ["vishnu", "varalakshmi", "durga"],
      notForKeys: ["ganesha", "shiva", "murugan", "ayyappa", "hanuman"],
      compatibilityClass: "Multi-Deity"
    };
  }
  if (isChest && /varalakshmi|vara lakshmi|lakshmi|amman|ammavaru/.test(title)) {
    return {
      group: "chest",
      primaryKey: "varalakshmi",
      primaryText: "Varalakshmi / Lakshmi / Amman",
      compatibleKeys: ["vishnu", "varalakshmi", "durga"],
      notForKeys: ["ganesha", "shiva", "murugan", "ayyappa", "hanuman"],
      compatibilityClass: "Multi-Deity"
    };
  }
  if (isChest && /durga|devi|goddess|saraswati/.test(title)) {
    return {
      group: "chest",
      primaryKey: null,
      compatibleKeys: ["vishnu", "varalakshmi", "durga"],
      notForKeys: ["ganesha", "shiva", "murugan", "ayyappa", "hanuman"],
      compatibilityClass: "Multi-Deity"
    };
  }
  if (isChest) {
    return {
      group: "chest",
      primaryKey: null,
      compatibleKeys: ["vishnu", "varalakshmi", "durga"],
      notForKeys: ["ganesha", "shiva", "murugan", "ayyappa", "hanuman"],
      compatibilityClass: "Multi-Deity"
    };
  }
  if (/varalakshmi|vara lakshmi|lakshmi|amman|ammavaru/.test(title)) {
    return {
      group: "goddess",
      primaryKey: "varalakshmi",
      primaryText: "Varalakshmi / Lakshmi / Amman",
      compatibleKeys: ["durga"],
      compatibilityClass: "Deity Specific"
    };
  }
  if (/durga|devi|goddess|saraswati/.test(title)) {
    return {
      group: "goddess",
      primaryKey: null,
      compatibleKeys: ["varalakshmi", "durga"],
      compatibilityClass: "Multi-Deity"
    };
  }
  if (/venkateswara|balaji|vishnu|perumal/.test(title)) {
    return {
      group: "vishnu",
      primaryKey: "vishnu",
      primaryText: "Balaji / Vishnu / Venkateswara / Perumal",
      compatibleKeys: ["krishna"],
      compatibilityClass: "Deity Specific"
    };
  }
  if (/krishna|radha/.test(title)) {
    return {
      group: "krishna",
      primaryKey: "krishna",
      primaryText: "Krishna / Radha Krishna",
      compatibleKeys: ["vishnu"],
      compatibilityClass: "Deity Specific"
    };
  }
  if (/ganesh|ganesha|ganapati|vinayaka/.test(title)) {
    return {
      group: "ganesha",
      primaryKey: "ganesha",
      primaryText: "Ganesha / Ganapati / Vinayaka",
      compatibleKeys: [],
      compatibilityClass: "Deity Specific"
    };
  }
  if (/shiva|mahadev/.test(title)) {
    return {
      group: "shiva",
      primaryKey: "shiva",
      primaryText: "Shiva / Mahadev",
      compatibleKeys: [],
      compatibilityClass: "Deity Specific"
    };
  }
  return {
    group: "general",
    primaryKey: null,
    compatibleKeys: Object.keys(DEITY_HANDLES),
    notForKeys: [],
    compatibilityClass: "General/Common"
  };
}

function hasStyle(product, styleName) {
  return product.variants.nodes.some((variant) =>
    variant.selectedOptions.some(
      (option) => option.name.toLowerCase() === "style" && option.value.toLowerCase() === styleName.toLowerCase()
    )
  );
}

function titleFor(product) {
  const sku = firstSku(product);
  const title = product.title.toLowerCase();
  const style = firstOption(product, "Style");
  const color = firstOption(product, "Color");
  const stone = title.includes("stone") ? "Stone " : "";
  const isChest = /chest/i.test(style);
  const stylePrefix = isChest ? "" : /2 step/i.test(style) ? "2 Step " : /3 step/i.test(style) ? "3 Step " : /1 step/i.test(style) ? "1 Step " : "";

  let deity = isChest ? "Venkateshwara / Goddess" : "Deity";
  if (/varalakshmi/.test(title)) deity = "Varalakshmi";
  else if (/lakshmi/.test(title)) deity = "Lakshmi / Amman";
  else if (/amman|ammavaru/.test(title)) deity = "Amman / Ammavaru";
  else if (/durga|devi|goddess|saraswati/.test(title)) deity = "Goddess";
  else if (/venkateswara|balaji|vishnu|perumal/.test(title)) deity = "Vishnu / Balaji";
  else if (/krishna|radha/.test(title)) deity = "Krishna";
  else if (/ganesh|ganesha|ganapati|vinayaka/.test(title)) deity = "Ganesh";
  else if (/shiva|mahadev/.test(title)) deity = "Shiva";

  const colorText = color && !/default|title|multi/i.test(color) ? `${color} ` : "";
  const productName = isChest ? "Chest Necklace" : "Short Necklace";
  const base = `${deity} ${colorText}${stylePrefix}${stone}${productName}`;
  return `${base.replace(/\s+/g, " ").trim()}${sku ? ` ${sku}` : ""}`;
}

function firstSku(product) {
  const titleSku = product.title.match(/\bDSN[-\s]?(\d+)\b/i);
  if (titleSku) return `DSN${titleSku[1].padStart(3, "0")}`;
  return product.variants.nodes.find((variant) => variant.sku)?.sku || "";
}

function firstOption(product, name) {
  for (const variant of product.variants.nodes) {
    const option = variant.selectedOptions.find((item) => item.name.toLowerCase() === name.toLowerCase());
    if (option?.value) return option.value;
  }
  return "";
}

function shortNecklaceTerm(value) {
  return String(value || "")
    .replace(/\bChest Haram\b/gi, "Chest Necklace")
    .replace(/\bShort Haram\b/gi, "Short Necklace")
    .replace(/\bshort necklace haram\b/gi, "short necklace")
    .replace(/\bnecklace haram\b/gi, "necklace")
    .replace(/\bHaram\b/g, "Necklace")
    .replace(/\bharam\b/g, "necklace")
    .replace(/\s+/g, " ")
    .trim();
}

function activeProductDescription(product, size) {
  const style = firstOption(product, "Style");
  const color = firstOption(product, "Color");
  const sizeText = size ? `${size.label} inches` : "the selected size shown on the product page";
  const styleText = style ? `${shortNecklaceTerm(style)} style` : "short necklace style";
  const colorText = color ? `${color} color` : "selected color";
  const isChest = /chest/i.test(style);
  return [
    isChest
      ? "<p>Chest necklace for Venkateshwara Swamy, Balaji, Vishnu, Perumal and goddess idols. Use it around the upper chest area for pooja, temple, festival or home altar alankaram.</p>"
      : "<p>Deity short necklace for Hindu god and goddess idol alankaram. Use it around the idol neck or upper chest area for pooja, temple, festival or home altar decoration.</p>",
    "<h3>How to choose</h3>",
    `<ul><li>Check the ${sizeText}, ${colorText} and ${styleText} before ordering.</li><li>Compare the necklace length and width with your idol neck, chest and dress placement.</li><li>1 Step, 2 Step and 3 Step refer to the number of necklace rows/layers in the design.</li><li>Review the product photos and measurement views for finish, color and scale.</li></ul>`,
    "<h3>Fit guidance</h3>",
    isChest
      ? "<p>Chest necklaces are only for Venkateshwara Swamy, Balaji, Vishnu, Perumal and goddess idols. Confirm length and width against the idol chest and dress placement before ordering.</p>"
      : "<p>Short necklaces sit closer to the neck or upper chest than long harams. If your idol has a broad chest, heavy dress drape or existing garlands, compare the measured ornament size carefully before ordering.</p>"
  ].join("\n");
}

function productMetafields(product, refs) {
  const classification = classifyProduct(product);
  const size = exactSize(product);
  const inputs = [
    metafield(product.id, "custom", "range_type", "single_line_text_field", "Deity"),
    metafield(product.id, "custom", "ornament_type", "single_line_text_field", "Short Necklace"),
    metafield(product.id, "custom", "ornament_type_ref", "metaobject_reference", refs.ornament.id),
    metafield(product.id, "custom", "placement", "single_line_text_field", "Neck / upper chest"),
    metafield(product.id, "custom", "material", "single_line_text_field", "Alloy metal with stone work"),
    metafield(product.id, "custom", "compatibility_class", "single_line_text_field", classification.compatibilityClass),
    metafield(product.id, "custom", "regional_names", "list.single_line_text_field", JSON.stringify(REGIONAL_NAMES)),
    metafield(
      product.id,
      "custom",
      "compatible_deities",
      "list.single_line_text_field",
      JSON.stringify(COMPATIBILITY_TEXT[classification.group] || COMPATIBILITY_TEXT.general)
    ),
    metafield(
      product.id,
      "custom",
      "compatible_deity_refs",
      "list.metaobject_reference",
      JSON.stringify(classification.compatibleKeys.map((key) => refs[key].id))
    ),
    metafield(
      product.id,
      "custom",
      "fit_notes",
      "multi_line_text_field",
      hasStyle(product, "Chest")
        ? size
          ? `Chest necklace is suitable for Venkateshwara Swamy, Balaji, Vishnu, Perumal and goddess idols. Compare the ${size.label} inch length x width with the idol upper chest and dress placement before ordering.`
          : "Chest necklace is suitable for Venkateshwara Swamy, Balaji, Vishnu, Perumal and goddess idols. Compare the selected size and measurement photos with the idol upper chest and dress placement before ordering."
        : size
          ? `Compare the ${size.label} inch necklace length x width with the idol neck or upper chest area before ordering. Short necklaces sit close to the neck or upper chest.`
          : "Compare the selected size and measurement photos with the idol neck or upper chest area before ordering. Short necklaces sit close to the neck or upper chest."
    ),
    metafield(
      product.id,
      "custom",
      "size_confidence",
      "single_line_text_field",
      size ? "Variant size confirmed" : "Check product image"
    ),
    metafield(product.id, "mm-google-shopping", "google_product_category", "string", "196"),
    metafield(product.id, "mc-facebook", "google_product_category", "string", "196"),
    metafield(product.id, "mm-google-shopping", "condition", "string", "new"),
    metafield(product.id, "mm-google-shopping", "custom_product", "boolean", "true")
  ];

  if (classification.primaryKey) {
    inputs.push(metafield(product.id, "custom", "primary_deity", "single_line_text_field", classification.primaryText));
    inputs.push(metafield(product.id, "custom", "primary_deity_ref", "metaobject_reference", refs[classification.primaryKey].id));
  }
  if (classification.notForKeys?.length) {
    inputs.push(
      metafield(
        product.id,
        "custom",
        "not_for_deities",
        "list.single_line_text_field",
        JSON.stringify(classification.notForKeys.map((key) => refs[key].displayName))
      )
    );
    inputs.push(
      metafield(
        product.id,
        "custom",
        "not_for_deity_refs",
        "list.metaobject_reference",
        JSON.stringify(classification.notForKeys.map((key) => refs[key].id))
      )
    );
  }
  if (size) {
    inputs.push(metafield(product.id, "custom", "ornament_width_in", "number_decimal", size.width));
    inputs.push(metafield(product.id, "custom", "ornament_height_in", "number_decimal", size.length));
  }
  inputs.push(metafield(product.id, "custom", "component_count", "number_integer", "1"));
  inputs.push(
    metafield(
      product.id,
      "custom",
      "set_items_included",
      "list.single_line_text_field",
      JSON.stringify(["Single short necklace"])
    )
  );

  return inputs;
}

function collectionMetafields(collection, refs) {
  return [
    metafield(collection.id, "custom", "display_title", "single_line_text_field", COLLECTION_UPDATE.metafields.display_title),
    metafield(collection.id, "custom", "collection_intro", "multi_line_text_field", COLLECTION_UPDATE.metafields.collection_intro),
    metafield(collection.id, "custom", "size_fit_intro", "multi_line_text_field", COLLECTION_UPDATE.metafields.size_fit_intro),
    metafield(collection.id, "custom", "faq_family", "single_line_text_field", COLLECTION_UPDATE.metafields.faq_family),
    metafield(collection.id, "custom", "collection_role", "single_line_text_field", COLLECTION_UPDATE.metafields.collection_role),
    metafield(collection.id, "custom", "deity_first_enabled", "boolean", COLLECTION_UPDATE.metafields.deity_first_enabled),
    metafield(collection.id, "custom", "shopping_path_label", "single_line_text_field", COLLECTION_UPDATE.metafields.shopping_path_label),
    metafield(collection.id, "custom", "ornament_type_ref", "metaobject_reference", refs.ornament.id),
    metafield(collection.id, "custom", "ornament_type_refs", "list.metaobject_reference", JSON.stringify([refs.ornament.id])),
    metafield(
      collection.id,
      "custom",
      "regional_keyword_cluster",
      "list.single_line_text_field",
      JSON.stringify(COLLECTION_UPDATE.metafields.regional_keyword_cluster)
    )
  ];
}

async function updateCollection(collection) {
  if (!APPLY) {
    console.log(`[DRY COLLECTION] ${collection.title} -> ${COLLECTION_UPDATE.title}`);
    return;
  }

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
        title: COLLECTION_UPDATE.title,
        descriptionHtml: COLLECTION_UPDATE.bodyHtml,
        templateSuffix: "deity-ornament-default",
        seo: {
          title: COLLECTION_UPDATE.seoTitle,
          description: COLLECTION_UPDATE.seoDescription
        }
      }
    }
  );
  const errors = data.collectionUpdate.userErrors || [];
  if (errors.length) throw new Error(`collectionUpdate: ${JSON.stringify(errors)}`);
}

async function setMetafields(inputs) {
  if (!APPLY) {
    console.log(`[DRY METAFIELDS] ${inputs.length}`);
    return;
  }
  for (let i = 0; i < inputs.length; i += 25) {
    const data = await gql(
      `mutation SetMetafields($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { ownerType namespace key type value }
          userErrors { field message code }
        }
      }`,
      { metafields: inputs.slice(i, i + 25) }
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
  if (!APPLY || !identifiers.length) return;
  for (let i = 0; i < identifiers.length; i += 250) {
    const data = await gql(
      `mutation DeleteMetafields($metafields: [MetafieldIdentifierInput!]!) {
        metafieldsDelete(metafields: $metafields) {
          deletedMetafields { ownerId namespace key }
          userErrors { field message }
        }
      }`,
      { metafields: identifiers.slice(i, i + 250) }
    );
    const errors = data.metafieldsDelete.userErrors || [];
    if (errors.length) throw new Error(`metafieldsDelete: ${JSON.stringify(errors)}`);
  }
}

async function updateVariantBarcodes(products) {
  let count = 0;
  for (const product of products) {
    const variants = product.variants.nodes
      .filter((variant) => variant.sku && variant.barcode !== variant.sku)
      .map((variant) => ({ id: variant.id, barcode: variant.sku }));
    if (!variants.length) continue;
    count += variants.length;

    if (!APPLY) continue;
    const data = await gql(
      `mutation ProductVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
          productVariants { id barcode sku }
          userErrors { field message code }
        }
      }`,
      { productId: product.id, variants }
    );
    const errors = data.productVariantsBulkUpdate.userErrors || [];
    if (errors.length) throw new Error(`productVariantsBulkUpdate ${product.handle}: ${JSON.stringify(errors)}`);
  }
  console.log(`${APPLY ? "Updated" : "Would update"} ${count} variant barcodes.`);
}

async function updateActiveProductContent(products) {
  const activeProducts = products;
  for (const product of activeProducts) {
    const size = exactSize(product);
    const title = titleFor(product);
    const isChest = hasStyle(product, "Chest");
    const seoDescription = isChest
      ? size
        ? `Shop ${title} for Venkateshwara Swamy and goddess idol alankaram. Size ${size.label} inch length x width; compare chest placement before ordering.`
        : `Shop ${title} for Venkateshwara Swamy and goddess idol alankaram. Compare selected size, chest placement and photos before ordering.`
      : size
        ? `Shop ${title} for Hindu god and goddess idol alankaram. Size ${size.label} inch length x width; compare neck or chest placement before ordering.`
        : `Shop ${title} for Hindu god and goddess idol alankaram. Compare selected size, neck or chest placement and product photos before ordering.`;
    const tags = [
      ...new Set([
        ...product.tags
          .filter((tag) => !/haram/i.test(tag))
          .map(shortNecklaceTerm),
        "deity short necklace",
        "idol necklace",
        "god jewellery",
        "goddess jewellery",
        "alankaram"
      ])
    ];

    if (!APPLY || !UPDATE_ACTIVE_CONTENT) {
      console.log(`[DRY CONTENT] ${product.handle}: ${product.title} -> ${title}`);
      continue;
    }

    const data = await gql(
      `mutation ProductUpdate($input: ProductInput!) {
        productUpdate(input: $input) {
          product { id handle title seo { title description } }
          userErrors { field message }
        }
      }`,
      {
        input: {
          id: product.id,
          title,
          descriptionHtml: activeProductDescription(product, size),
          tags,
          seo: {
            title: title.slice(0, 70),
            description: seoDescription.slice(0, 200)
          }
        }
      }
    );
    const errors = data.productUpdate.userErrors || [];
    if (errors.length) throw new Error(`productUpdate ${product.handle}: ${JSON.stringify(errors)}`);

    await updateImageAlts(product, title);
  }
}

async function updateImageAlts(product, title) {
  if (!product.legacyResourceId || !product.images.nodes.length) return;
  const isChest = hasStyle(product, "Chest");
  for (let index = 0; index < product.images.nodes.length; index += 1) {
    const image = product.images.nodes[index];
    const imageId = image.id.split("/").pop();
    const alt = isChest
      ? `${title} for Venkateshwara and goddess idol chest alankaram image ${index + 1}`
      : `${title} deity short necklace image ${index + 1}`;
    await rest(`/products/${product.legacyResourceId}/images/${imageId}.json`, {
      method: "PUT",
      body: JSON.stringify({ image: { id: Number(imageId), alt } })
    });
  }
}

function writeQuestions(products) {
  fs.mkdirSync("tmp/reviews", { recursive: true });
  const rows = [
    [
      "scope",
      "handle",
      "title",
      "question",
      "why_needed",
      "suggested_default_if_confirmed"
    ],
    [
      "collection",
      COLLECTION_HANDLE,
      COLLECTION_UPDATE.title,
      "No required open questions remain after owner confirmation on material, component count, size model, step model and Chest Necklace deity compatibility.",
      "Optional only: live model photos or video demos can improve the Size Help page later.",
      ""
    ]
  ];

  fs.writeFileSync(REVIEW_FILE, rows.map((row) => row.map(csv).join(",")).join("\n"));
  console.log(`Questions written: ${REVIEW_FILE}`);
}

function csv(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  const [collection, refs] = await Promise.all([fetchCollection(), fetchRefs()]);
  const products = collection.products.nodes;
  console.log(`Collection: ${collection.title}`);
  console.log(`Products attached: ${products.length}; active=${products.filter((p) => p.status === "ACTIVE").length}; draft=${products.filter((p) => p.status === "DRAFT").length}`);

  const activeProducts = products.filter((product) => product.status === "ACTIVE");
  const allMetafields = [
    ...collectionMetafields(collection, refs),
    ...products.flatMap((product) => productMetafields(product, refs))
  ];

  await updateCollection(collection);
  await setMetafields(allMetafields);
  await deleteWrongGoogleFields(products);
  await updateVariantBarcodes(products);
  await updateActiveProductContent(products);
  writeQuestions(products);

  console.log("Deity short necklace optimization complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
