#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const UPDATE_ACTIVE_CONTENT = process.argv.includes("--content");
const UPDATE_ALL_CONTENT = process.argv.includes("--all-content");
const ENV_FILE = "env";
const COLLECTION_HANDLE = "deity-earrings-for-god-idols-statues";

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

const REGIONAL_NAMES = [
  "deity earrings",
  "earrings for god idol",
  "earrings for goddess idol",
  "idol earrings",
  "god earrings",
  "goddess earrings",
  "karna pathakam",
  "karnapathakam",
  "karna pathakkam",
  "ear ornaments",
  "ear studs",
  "jhumki",
  "jhumka",
  "alankaram earrings",
  "temple deity earrings",
  "amman earrings",
  "ammavaru earrings",
  "lakshmi earrings"
];

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

const ALL_DEITY_TEXT = [
  "Multiple Hindu god and goddess idols by measured ear placement",
  "Varalakshmi / Lakshmi / Amman",
  "Balaji / Vishnu / Venkateswara / Perumal",
  "Krishna / Radha Krishna",
  "Ganesha / Ganapati / Vinayaka",
  "Durga / Devi / Amman / Parvati",
  "Shiva / Mahadev",
  "Murugan / Subramanya",
  "Ayyappa / Ayyappan",
  "Hanuman / Anjaneya"
];

const COLLECTION_UPDATE = {
  title: "Deity Earrings",
  bodyHtml:
    "<p>Shop deity earrings and Karna Pathakam ear ornaments for Hindu god and goddess idol alankaram. Each product includes a pair of earrings for the idol ear and face area, used for pooja, temple, festival and home altar decoration.</p><p>Choose by style, color and measured size. Most styles are alloy metal with stone work; gold earrings are alloy metal with gold plating. Compare each product's Height x Width or height value with your idol's ear placement, face width, crown position and existing decorations before ordering.</p>",
  seoTitle: "Deity Earrings for God Idols | Karna Pathakam",
  seoDescription:
    "Shop deity earrings and Karna Pathakam ear ornaments for god and goddess idols. Choose by measured size, style, color and ear placement.",
  metafields: {
    display_title: "Earrings",
    collection_intro:
      "Deity earrings and Karna Pathakam ear ornaments for Hindu god and goddess idol alankaram. Each product includes a pair of earrings. Browse by style, color and measured size, then compare the product photos with the idol ear and face area.",
    size_fit_intro:
      "For deity earrings, compare the product Height x Width or height value with the idol ear and face area. Check ear placement, face width, crown position and dress/garland space before ordering.",
    faq_family: "earrings",
    collection_role: "ornament_first",
    deity_first_enabled: "true",
    shopping_path_label: "Earrings",
    regional_keyword_cluster: REGIONAL_NAMES
  }
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
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
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
    } catch (error) {
      lastError = error;
      if (attempt === 4) break;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1200));
    }
  }
  throw lastError;
}

async function rest(path, options = {}) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
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
    } catch (error) {
      lastError = error;
      if (attempt === 4) break;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1200));
    }
  }
  throw lastError;
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
        productsCount { count }
      }
    }`,
    { handle: COLLECTION_HANDLE }
  );
  if (!data.collectionByHandle) throw new Error(`Collection not found: ${COLLECTION_HANDLE}`);
  return data.collectionByHandle;
}

async function fetchProducts() {
  const products = [];
  let after = null;
  do {
    const data = await gql(
      `query Products($handle: String!, $after: String) {
        collectionByHandle(handle: $handle) {
          products(first: 50, after: $after) {
            pageInfo { hasNextPage endCursor }
            nodes {
              id
              handle
              title
              legacyResourceId
              status
              tags
              variants(first: 50) {
                nodes {
                  id
                  sku
                  barcode
                  selectedOptions { name value }
                }
              }
              images(first: 10) {
                nodes { id altText }
              }
            }
          }
        }
      }`,
      { handle: COLLECTION_HANDLE, after }
    );
    const conn = data.collectionByHandle.products;
    products.push(...conn.nodes);
    after = conn.pageInfo.hasNextPage ? conn.pageInfo.endCursor : null;
  } while (after);
  return products;
}

async function fetchRefs() {
  const refs = {};
  const entries = [
    ["ornament", "deity_ornament_type", "earrings"],
    ...Object.entries(DEITY_HANDLES).map(([key, handle]) => [key, "deity_group", handle])
  ];
  for (const [key, type, handle] of entries) {
    const data = await gql(
      `query Ref($handle: MetaobjectHandleInput!) {
        metaobjectByHandle(handle: $handle) { id handle displayName }
      }`,
      { handle: { type, handle } }
    );
    if (!data.metaobjectByHandle) throw new Error(`Missing ${type}:${handle}`);
    refs[key] = data.metaobjectByHandle;
  }
  return refs;
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

function sizeFacts(product) {
  const hxwValues = new Set();
  const heightValues = new Set();
  const lengthValues = new Set();

  for (const variant of product.variants.nodes) {
    for (const option of variant.selectedOptions) {
      const value = normalizeSize(option.value);
      if (!value) continue;
      if (/size in inches \(h x w\)/i.test(option.name)) {
        hxwValues.add(value);
      } else if (/^height$/i.test(option.name)) {
        heightValues.add(value);
      } else if (/^length$/i.test(option.name)) {
        lengthValues.add(value);
      }
    }
  }

  if (hxwValues.size === 1) {
    const value = [...hxwValues][0];
    const match = value.match(/^(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)$/i);
    if (match) {
      return {
        height: match[1],
        width: match[2],
        confidence: "Variant size confirmed"
      };
    }
  }

  if (heightValues.size === 1) {
    const match = [...heightValues][0].match(/(\d+(?:\.\d+)?)/);
    if (match) {
      return {
        height: match[1],
        width: null,
        confidence: "Variant height confirmed; check image for width"
      };
    }
  }

  if (lengthValues.size === 1) {
    const match = [...lengthValues][0].match(/(\d+(?:\.\d+)?)/);
    return {
      height: match ? match[1] : null,
      width: null,
      confidence: "Variant height confirmed; check image for width"
    };
  }

  return {
    height: null,
    width: null,
    confidence: "Select variant and check measuring image"
  };
}

function colorValues(product) {
  return [
    ...new Set(
      product.variants.nodes.flatMap((variant) =>
        variant.selectedOptions
          .filter((option) => /^color$/i.test(option.name))
          .map((option) => option.value.trim())
          .filter(Boolean)
      )
    )
  ];
}

function styleValues(product) {
  return [
    ...new Set(
      product.variants.nodes.flatMap((variant) =>
        variant.selectedOptions
          .filter((option) => /^style$/i.test(option.name))
          .map((option) => option.value.trim())
          .filter(Boolean)
      )
    )
  ];
}

function materialFor(product) {
  const colors = colorValues(product);
  if (colors.length && colors.every((color) => /^gold$/i.test(color))) {
    return "Alloy metal with Gold Plating";
  }
  return "Alloy Metal with Stone work";
}

function primaryDeity(product) {
  const title = product.title.toLowerCase();
  if (/god\s*(?:&|and|\/)?\s*goddess|deity\s+god\s+goddess|god\s+and\s+goddess/.test(title)) {
    return null;
  }
  if (/varalakshmi|vara lakshmi|lakshmi|amman|ammavaru/.test(title)) {
    return { key: "varalakshmi", text: "Varalakshmi / Lakshmi / Amman" };
  }
  if (/durga|devi|goddess|saraswati/.test(title)) {
    return { key: "durga", text: "Durga / Devi / Amman / Parvati" };
  }
  if (/venkateswara|balaji|vishnu|perumal/.test(title)) {
    return { key: "vishnu", text: "Balaji / Vishnu / Venkateswara / Perumal" };
  }
  if (/krishna|radha/.test(title)) {
    return { key: "krishna", text: "Krishna / Radha Krishna" };
  }
  if (/ganesh|ganesha|ganapati|vinayaka/.test(title)) {
    return { key: "ganesha", text: "Ganesha / Ganapati / Vinayaka" };
  }
  if (/shiva|mahadev/.test(title)) {
    return { key: "shiva", text: "Shiva / Mahadev" };
  }
  return null;
}

function normalizeSize(value) {
  return String(value || "")
    .trim()
    .replace(/[Ã—]/g, "x")
    .replace(/\s+/g, " ");
}

function productMetafields(product, refs) {
  const size = sizeFacts(product);
  const inputs = [
    metafield(product.id, "custom", "range_type", "single_line_text_field", "Deity"),
    metafield(product.id, "custom", "ornament_type", "single_line_text_field", "Earrings"),
    metafield(product.id, "custom", "ornament_type_ref", "metaobject_reference", refs.ornament.id),
    metafield(product.id, "custom", "placement", "single_line_text_field", "Ears"),
    metafield(product.id, "custom", "material", "single_line_text_field", materialFor(product)),
    metafield(product.id, "custom", "compatibility_class", "single_line_text_field", "General/Common"),
    metafield(product.id, "custom", "compatible_deities", "list.single_line_text_field", JSON.stringify(ALL_DEITY_TEXT)),
    metafield(
      product.id,
      "custom",
      "compatible_deity_refs",
      "list.metaobject_reference",
      JSON.stringify(Object.keys(DEITY_HANDLES).map((key) => refs[key].id))
    ),
    metafield(product.id, "custom", "regional_names", "list.single_line_text_field", JSON.stringify(REGIONAL_NAMES)),
    metafield(product.id, "custom", "size_confidence", "single_line_text_field", size.confidence),
    metafield(
      product.id,
      "custom",
      "fit_notes",
      "multi_line_text_field",
      "Compare the selected earring size and measuring tape image with the idol ear, face area, crown position and nearby decorations before ordering."
    ),
    metafield(product.id, "mm-google-shopping", "google_product_category", "string", "194"),
    metafield(product.id, "mc-facebook", "google_product_category", "string", "194"),
    metafield(product.id, "mm-google-shopping", "condition", "string", "new"),
    metafield(product.id, "mm-google-shopping", "custom_product", "boolean", "true")
  ];

  const primary = primaryDeity(product);
  if (primary) {
    inputs.push(metafield(product.id, "custom", "primary_deity", "single_line_text_field", primary.text));
    inputs.push(metafield(product.id, "custom", "primary_deity_ref", "metaobject_reference", refs[primary.key].id));
  }
  if (size.height) inputs.push(metafield(product.id, "custom", "ornament_height_in", "number_decimal", size.height));
  if (size.width) inputs.push(metafield(product.id, "custom", "ornament_width_in", "number_decimal", size.width));
  inputs.push(metafield(product.id, "custom", "component_count", "number_integer", "2"));
  inputs.push(
    metafield(
      product.id,
      "custom",
      "set_items_included",
      "list.single_line_text_field",
      JSON.stringify(["Pair of deity earrings"])
    )
  );
  return inputs;
}

function firstSku(product) {
  const titleSku = product.title.match(/\bDGE[-\s]?(\d+)\b/i);
  if (titleSku) return `DGE${titleSku[1].padStart(3, "0")}`;
  return product.variants.nodes.find((variant) => variant.sku)?.sku?.replace(/-/g, "") || "";
}

function styleLabel(product) {
  const styles = styleValues(product);
  if (styles.some((style) => /karna patha/i.test(style))) return "Karna Pathakam";
  if (styles.some((style) => /ear studs?/i.test(style))) return "Ear Studs";
  if (styles.some((style) => /jhumka|jhumki/i.test(style))) return "Jhumka";
  if (styles.some((style) => /round/i.test(style))) return "Round";
  return "Earrings";
}

function deityLabel(product) {
  const primary = primaryDeity(product);
  if (!primary) return "Deity";
  if (primary.key === "varalakshmi") return "Lakshmi / Amman";
  if (primary.key === "durga") return "Goddess";
  if (primary.key === "vishnu") return "Vishnu / Balaji";
  if (primary.key === "krishna") return "Krishna";
  if (primary.key === "ganesha") return "Ganesh";
  if (primary.key === "shiva") return "Shiva";
  return "Deity";
}

function titleFor(product) {
  const sku = firstSku(product);
  const material = materialFor(product);
  const materialPrefix = /Gold Plating/i.test(material) ? "Gold Plated " : "";
  const style = styleLabel(product);
  const productName = style === "Ear Studs" ? "Ear Studs" : style === "Earrings" ? "Earrings" : `${style} Earrings`;
  const title = `${deityLabel(product)} ${materialPrefix}${productName}${sku ? ` ${sku}` : ""}`;
  return title.replace(/\s+/g, " ").trim();
}

function sizeLabel(size) {
  if (size.height && size.width) return `${size.height} x ${size.width} inch Height x Width`;
  if (size.height) return `${size.height} inch height`;
  return "See the selected size shown on the product page";
}

function seoTitleFor(title) {
  const suffix = " for God Idols";
  const cleanTitle = title.replace(/\s+/g, " ").trim();
  if (`${cleanTitle}${suffix}`.length <= 70) return `${cleanTitle}${suffix}`;
  return `${cleanTitle.slice(0, 70 - suffix.length).trim()}${suffix}`;
}

function activeProductDescription(product, size) {
  const material = materialFor(product);
  const style = styleLabel(product);
  return [
    `<p>Pair of deity earrings for Hindu god and goddess idol alankaram. Use these ${style} ear ornaments around the idol ears and face area for pooja, temple, festival or home altar decoration.</p>`,
    "<h3>How to choose</h3>",
    `<ul><li>Includes a pair of earrings.</li><li>Material: ${material}.</li><li>Check ${sizeLabel(size)}, color and style before ordering.</li><li>Compare the earring height and width with the idol ear placement, face width, crown position and nearby decorations.</li><li>Length variant values for this collection refer to earring height.</li><li>Review product photos and measuring tape images for finish, color and scale.</li></ul>`,
    "<h3>Fit guidance</h3>",
    "<p>Generic deity earrings can suit different god and goddess idols when the measured ear placement and proportion fit. If your idol has a large crown, broad face, existing garlands or uneven ear placement, compare the product measurement photos carefully before ordering.</p>"
  ].join("\n");
}

async function updateActiveProductContent(products) {
  const targetProducts = UPDATE_ALL_CONTENT ? products : products.filter((product) => product.status === "ACTIVE");
  for (const product of targetProducts) {
    const size = sizeFacts(product);
    const title = titleFor(product);
    const seoDescription = `Shop ${title}, pair of deity earrings for god and goddess idol alankaram. ${sizeLabel(size)}; compare ear placement before ordering.`;
    const tags = [
      ...new Set([
        ...product.tags,
        "deity earrings",
        "karna pathakam",
        "idol earrings",
        "god jewellery",
        "goddess jewellery",
        "alankaram"
      ])
    ];

    if (!APPLY || (!UPDATE_ACTIVE_CONTENT && !UPDATE_ALL_CONTENT)) {
      console.log(`[DRY CONTENT] ${product.handle}: ${product.title} -> ${title}`);
      continue;
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
          descriptionHtml: activeProductDescription(product, size),
          tags,
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
}

async function updateImageAlts(product, title) {
  if (!product.legacyResourceId || !product.images.nodes.length) return;
  for (let index = 0; index < product.images.nodes.length; index += 1) {
    const image = product.images.nodes[index];
    const imageId = image.id.split("/").pop();
    const alt = `${title} deity earrings image ${index + 1}`;
    await rest(`/products/${product.legacyResourceId}/images/${imageId}.json`, {
      method: "PUT",
      body: JSON.stringify({ image: { id: Number(imageId), alt } })
    });
  }
}

async function updateCollection(collection) {
  if (!APPLY) {
    console.log(`[DRY COLLECTION] ${collection.title} -> ${COLLECTION_UPDATE.title}`);
    return;
  }

  const data = await gql(
    `mutation CollectionUpdate($input: CollectionInput!) {
      collectionUpdate(input: $input) {
        collection { id handle title descriptionHtml seo { title description } }
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
  for (let index = 0; index < inputs.length; index += 20) {
    console.log(`${APPLY ? "Setting" : "Would set"} metafields ${index + 1}-${Math.min(index + 20, inputs.length)} of ${inputs.length}`);
    const data = await gql(
      `mutation SetMetafields($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          userErrors { field message code }
        }
      }`,
      { metafields: inputs.slice(index, index + 20) }
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
    console.log(`[DRY DELETE GOOGLE AGE/GENDER] ${identifiers.length}`);
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

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  const [collection, products, refs] = await Promise.all([fetchCollection(), fetchProducts(), fetchRefs()]);
  console.log(`Collection: ${collection.title}; products=${collection.productsCount.count}; fetched=${products.length}`);
  const inputs = [
    ...collectionMetafields(collection, refs),
    ...products.flatMap((product) => productMetafields(product, refs))
  ];
  console.log(`Metafields planned: ${inputs.length}`);
  await updateCollection(collection);
  await setMetafields(inputs);
  await deleteWrongGoogleFields(products);
  await updateVariantBarcodes(products);
  await updateActiveProductContent(products);
  await deleteWrongGoogleFields(products);
  console.log("Deity earrings safe pass complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
