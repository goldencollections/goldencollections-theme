#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const COLLECTION_HANDLE = "deity-crowns";
const DRAMA_COLLECTION_HANDLE = "drama-dance-crowns";
const HAIR_COLLECTION_HANDLE = "deity-hair-crown";
const ENV_FILE = "env";

const env = readEnv(ENV_FILE);
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const GRAPHQL_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;
const REST_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}`;

const GPC_RELIGIOUS_ITEMS = "97";
const MATERIAL = "Brass with Gold Plating";
const ORNAMENT_HANDLE = "crown-mukut-kireedam";
const ALL_DEITY_TEXT = [
  "Varalakshmi / Lakshmi / Amman",
  "Balaji / Vishnu / Venkateswara / Perumal",
  "Krishna / Radha Krishna",
  "Ganesha / Ganapati / Vinayaka",
  "Shiva / Mahadev",
  "Durga / Devi / Amman / Parvati",
  "Murugan / Subramanya / Kartikeya / Skanda",
  "Ayyappa / Ayyappan",
  "Hanuman / Anjaneya"
];
const DEITY_HANDLES = {
  lakshmi: "varalakshmi-lakshmi-amman",
  vishnu: "balaji-vishnu-perumal",
  krishna: "krishna-radha-krishna",
  ganesha: "ganesha-ganapati-vinayaka",
  shiva: "shiva-mahadev",
  durga: "durga-devi-amman-parvati",
  murugan: "murugan-subramanya",
  ayyappa: "ayyappa",
  hanuman: "hanuman-anjaneya"
};
const REGIONAL_NAMES = [
  "deity crown",
  "god crown",
  "goddess crown",
  "idol crown",
  "mukut",
  "kireedam",
  "kireetam",
  "kirita",
  "makuta",
  "kreedam",
  "Amman crown",
  "Balaji crown",
  "Vishnu mukut",
  "Perumal kireedam",
  "Andal crown",
  "alankaram crown",
  "temple deity crown"
];

const COLLECTION_UPDATE = {
  title: "Deity Gold Plated Crowns",
  bodyHtml:
    "<p>Shop deity gold plated crowns, mukut and kireedam for Hindu god and goddess idol alankaram. These brass crowns with gold plating are used for pooja, temple, festival and home altar decoration.</p><p>Each product includes one crown. Choose by crown style, color and measured size. For crown sizes, H means height, W means width and D means diameter/depth. Compare the product photos with your idol head width, height clearance, face shape, hairstyle and existing ornaments before ordering.</p>",
  seoTitle: "Deity Gold Plated Crowns, Mukut & Kireedam",
  seoDescription:
    "Shop brass gold plated deity crowns, mukut and kireedam for god and goddess idols. Choose by H x W x D size, style and head fit.",
  metafields: {
    display_title: "Gold Plated Crowns",
    collection_intro:
      "Deity gold plated crowns, mukut and kireedam for Hindu god and goddess idol alankaram. Each product includes one brass crown with gold plating. Browse by crown style and measured size, then compare product photos with the idol head, face and crown placement area.",
    size_fit_intro:
      "For deity crowns, read size as Height x Width x Diameter/Depth. Compare crown height with the space above the idol head, width with the head or face area, and diameter/depth with how the crown sits on the head or behind the face. Left or right tilted styles are Andal crowns and should be matched carefully.",
    faq_family: "crown",
    collection_role: "ornament_first",
    deity_first_enabled: "true",
    shopping_path_label: "Crowns",
    regional_keyword_cluster: REGIONAL_NAMES
  }
};

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
  const bodyText = await res.text();
  const body = bodyText ? JSON.parse(bodyText) : {};
  if (!res.ok) throw new Error(`REST ${options.method || "GET"} ${path}: ${res.status} ${bodyText}`);
  return body;
}

function metafield(ownerId, namespace, key, type, value) {
  return { ownerId, namespace, key, type, value: String(value) };
}

async function fetchCollection(handle) {
  const data = await gql(
    `query Collection($handle: String!) {
      collectionByHandle(handle: $handle) {
        id
        legacyResourceId
        handle
        title
        products(first: 250) {
          nodes { id }
        }
      }
    }`,
    { handle }
  );
  if (!data.collectionByHandle) throw new Error(`Collection not found: ${handle}`);
  return data.collectionByHandle;
}

async function fetchProducts(handle) {
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
              legacyResourceId
              handle
              title
              descriptionHtml
              productType
              status
              totalInventory
              tags
              templateSuffix
              seo { title description }
              variants(first: 80) {
                nodes {
                  id
                  legacyResourceId
                  title
                  sku
                  barcode
                  selectedOptions { name value }
                }
              }
              images(first: 30) {
                nodes { id altText url }
              }
              metafields(first: 180) {
                nodes { namespace key type value }
              }
            }
          }
        }
      }`,
      { handle, after }
    );
    const conn = data.collectionByHandle.products;
    products.push(...conn.nodes);
    after = conn.pageInfo.hasNextPage ? conn.pageInfo.endCursor : null;
  } while (after);
  return products;
}

async function fetchRefs() {
  const entries = [
    ["ornament", "deity_ornament_type", ORNAMENT_HANDLE],
    ...Object.entries(DEITY_HANDLES).map(([key, handle]) => [key, "deity_group", handle])
  ];
  const refs = {};
  for (const [key, type, handle] of entries) {
    const data = await gql(
      `query Metaobject($handle: MetaobjectHandleInput!) {
        metaobjectByHandle(handle: $handle) { id handle type }
      }`,
      { handle: { type, handle } }
    );
    if (!data.metaobjectByHandle) throw new Error(`Missing metaobject ${type}/${handle}`);
    refs[key] = data.metaobjectByHandle;
  }
  return refs;
}

function textBlob(product) {
  return [product.title, product.handle, product.productType, ...styleValues(product), ...sizeValues(product)].join(" ");
}

function firstSku(product) {
  const productCode = `${product.title} ${product.handle}`.match(/\b(DGC|DHC)\s*-?\s*(\d+)\b/i);
  if (productCode) return `${productCode[1].toUpperCase()}${productCode[2]}`;
  const sku = product.variants.nodes.map((variant) => variant.sku).find(Boolean);
  if (sku) return sku.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return "";
}

function optionValues(product, pattern) {
  return [
    ...new Set(
      product.variants.nodes.flatMap((variant) =>
        variant.selectedOptions
          .filter((option) => pattern.test(option.name))
          .map((option) => option.value)
      )
    )
  ].filter(Boolean);
}

function styleValues(product) {
  return optionValues(product, /style|type/i);
}

function colorValues(product) {
  return optionValues(product, /color/i);
}

function sizeValues(product) {
  return optionValues(product, /size|height|width|diameter|length|inch|inches|h x r x d/i);
}

function parseTriple(value) {
  const match = String(value).match(/(\d+(?:\.\d+)?)\s*[xX]\s*(\d+(?:\.\d+)?)\s*[xX]\s*(\d+(?:\.\d+)?)/);
  if (!match) return null;
  return { height: match[1], width: match[2], depth: match[3] };
}

function sizeFacts(product) {
  const triples = sizeValues(product).map(parseTriple).filter(Boolean);
  const keys = [...new Set(triples.map((size) => `${size.height}|${size.width}|${size.depth}`))];
  if (keys.length !== 1) return { variantLevel: triples.length > 0 };
  const [height, width, depth] = keys[0].split("|");
  return { height, width, depth, variantLevel: false };
}

function isDramaCrown(product) {
  return /drama crowns/i.test(product.productType || "") || /drama|dance costume/i.test(textBlob(product));
}

function isHairCrown(product) {
  return /hair crown/i.test(product.productType || "") || /hair crown|koppu|bun/i.test(textBlob(product));
}

function isAndalCrown(product) {
  return /andal|andalu|\bleft\b|\bright\b/i.test(textBlob(product));
}

function deityLabel(product) {
  const blob = textBlob(product);
  if (isAndalCrown(product)) return "Andal";
  if (/balaji|vishnu|venkatesh|venkateswara|perumal|srinivasa/i.test(blob)) return "Balaji / Vishnu";
  if (/god\s*(and|&)?\s*goddess|god goddess/i.test(blob)) return "Deity";
  if (/amman|ammavaru|lakshmi|devi|goddess|durga|parvati/i.test(blob)) return "Goddess";
  return "Deity";
}

function normalizedStyle(product) {
  const values = styleValues(product).filter((value) => value && !/^default title$/i.test(value));
  if (!values.length) return "";
  const first = values[0].replace(/\s+/g, " ").trim();
  return first
    .replace(/Andalu/gi, "Andal")
    .replace(/\bAndal\b/gi, "")
    .replace(/\bCrown\b/gi, "")
    .replace(/\bMukut\b/gi, "")
    .replace(/\bKireedam\b/gi, "")
    .replace(/\bKireetam\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function titleFor(product) {
  const sku = firstSku(product);
  const deity = deityLabel(product);
  const style = normalizedStyle(product);
  const stylePart = style && !/crown|mukut|kireed/i.test(style) ? `${style} ` : style ? `${style} ` : "";
  const suffix = sku ? ` ${sku}` : "";
  let title = `${deity} ${stylePart}Gold Plated Crown${suffix}`;
  title = title.replace(/\s+/g, " ").trim();
  if (title.length <= 70) return title;
  title = `${deity} Gold Plated Crown${suffix}`.replace(/\s+/g, " ").trim();
  return title.length <= 70 ? title : title.slice(0, 70).trim();
}

function sizeLabel(size) {
  if (size.height && size.width && size.depth) {
    return `${size.height} x ${size.width} x ${size.depth} inch Height x Width x Diameter/Depth`;
  }
  if (size.variantLevel) return "Choose the variant size shown on the product page";
  return "Check the measured crown size shown on the product page";
}

function fitNotes(product) {
  const andal = isAndalCrown(product)
    ? " This is an Andal-style tilted crown when the style or variant says Left, Right, Andal or Andalu; match the tilt direction to the idol."
    : "";
  return `Compare Height x Width x Diameter/Depth with the idol head width, face shape, hair or crown base, and height clearance above the head.${andal} Product images and variant sizes are the final fit check.`;
}

function seoTitleFor(title) {
  const suffix = " for God Idols";
  return `${title}${suffix}`.length <= 70 ? `${title}${suffix}` : title.slice(0, 70).trim();
}

function productDescription(product, size) {
  const deity = deityLabel(product);
  const style = normalizedStyle(product);
  const styleText = style ? `${style} style ` : "";
  const andal = isAndalCrown(product)
    ? "<li>Left or right tilted Andal styles should be matched to the idol's crown placement direction.</li>"
    : "";
  return [
    `<p>${deity} ${styleText}gold plated deity crown for Hindu god and goddess idol alankaram. Each product includes one crown made from brass with gold plating for pooja, temple, festival or home altar decoration.</p>`,
    "<h3>How to choose</h3>",
    `<ul><li>Includes one deity crown.</li><li>Material: ${MATERIAL}.</li><li>Read crown size as Height x Width x Diameter/Depth. ${sizeLabel(size)}.</li><li>Compare crown height with available space above the idol head, width with the head or face area, and diameter/depth with how the crown sits on the idol.</li>${andal}<li>Review product photos, measurement images, color and style before ordering.</li></ul>`,
    "<h3>Fit guidance</h3>",
    "<p>Gold plated deity crowns can be used for different god and goddess idols when the measured size, head shape, hairstyle and crown style fit. Deity-specific names in the title or photos can be used as extra guidance, but size and placement are the final fit check.</p>"
  ].join("\n");
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

function productMetafields(product, refs) {
  const size = sizeFacts(product);
  const style = normalizedStyle(product);
  const inputs = [
    metafield(product.id, "custom", "range_type", "single_line_text_field", "Deity"),
    metafield(product.id, "custom", "ornament_type", "single_line_text_field", "Crown / Mukut / Kireedam"),
    metafield(product.id, "custom", "ornament_type_ref", "metaobject_reference", refs.ornament.id),
    metafield(product.id, "custom", "placement", "single_line_text_field", "Head"),
    metafield(product.id, "custom", "material", "single_line_text_field", MATERIAL),
    metafield(product.id, "custom", "compatibility_class", "single_line_text_field", "General/Common"),
    metafield(product.id, "custom", "compatible_deities", "list.single_line_text_field", JSON.stringify(ALL_DEITY_TEXT)),
    metafield(
      product.id,
      "custom",
      "compatible_deity_refs",
      "list.metaobject_reference",
      JSON.stringify(Object.keys(DEITY_HANDLES).map((key) => refs[key].id))
    ),
    metafield(product.id, "custom", "not_for_deities", "list.single_line_text_field", JSON.stringify([])),
    metafield(product.id, "custom", "not_for_deity_refs", "list.metaobject_reference", JSON.stringify([])),
    metafield(product.id, "custom", "fit_notes", "multi_line_text_field", fitNotes(product)),
    metafield(
      product.id,
      "custom",
      "size_confidence",
      "single_line_text_field",
      size.variantLevel ? "Variant-level measured size" : size.height ? "Measured size from product variant" : "Check product photos"
    ),
    metafield(product.id, "custom", "component_count", "number_integer", "1"),
    metafield(product.id, "custom", "set_items_included", "list.single_line_text_field", JSON.stringify(["One deity crown"])),
    metafield(product.id, "custom", "regional_names", "list.single_line_text_field", JSON.stringify(REGIONAL_NAMES)),
    metafield(product.id, "mm-google-shopping", "google_product_category", "string", GPC_RELIGIOUS_ITEMS),
    metafield(product.id, "mc-facebook", "google_product_category", "string", GPC_RELIGIOUS_ITEMS),
    metafield(product.id, "mm-google-shopping", "condition", "string", "new"),
    metafield(product.id, "mm-google-shopping", "custom_product", "boolean", "true")
  ];
  if (style) inputs.push(metafield(product.id, "custom", "crown_style", "single_line_text_field", style));
  if (size.height) inputs.push(metafield(product.id, "custom", "ornament_height_in", "number_decimal", size.height));
  if (size.width) inputs.push(metafield(product.id, "custom", "ornament_width_in", "number_decimal", size.width));
  if (size.depth) inputs.push(metafield(product.id, "custom", "ornament_depth_in", "number_decimal", size.depth));
  return inputs;
}

async function setMetafields(inputs) {
  if (!APPLY) {
    console.log(`[DRY METAFIELDS] ${inputs.length}`);
    return;
  }
  for (let index = 0; index < inputs.length; index += 20) {
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
    console.log(`metafields ${Math.min(index + 20, inputs.length)}/${inputs.length}`);
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

async function updateProduct(product) {
  const size = sizeFacts(product);
  const title = titleFor(product);
  const seoDescription = `Shop ${title}, one brass gold plated deity crown for god and goddess idol alankaram. ${sizeLabel(size)}; compare head fit before ordering.`;
  const tags = [
    ...new Set([
      ...(product.tags || []),
      "deity crown",
      "gold plated crown",
      "mukut",
      "kireedam",
      "god crown",
      "goddess crown",
      "idol alankaram",
      ...(isAndalCrown(product) ? ["Andal crown", "tilted crown"] : [])
    ])
  ];
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
        productType: "Deity Gold Plated Crowns",
        templateSuffix: "deity-lite",
        descriptionHtml: productDescription(product, size),
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

async function updateImageAlts(product, title) {
  for (const [index, image] of product.images.nodes.entries()) {
    const imageId = image.id.split("/").pop();
    const alt = `${title} deity crown image ${index + 1}`;
    await rest(`/products/${product.legacyResourceId}/images/${imageId}.json`, {
      method: "PUT",
      body: JSON.stringify({ image: { id: Number(imageId), alt } })
    });
  }
}

async function deleteWrongGoogleFields(products) {
  const identifiers = [];
  for (const product of products) {
    identifiers.push({ ownerId: product.id, namespace: "mm-google-shopping", key: "age_group" });
    identifiers.push({ ownerId: product.id, namespace: "mm-google-shopping", key: "gender" });
  }
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
    for (const variant of product.variants.nodes) {
      if (!variant.sku || variant.barcode === variant.sku) continue;
      if (APPLY) {
        await rest(`/variants/${variant.legacyResourceId}.json`, {
          method: "PUT",
          body: JSON.stringify({ variant: { id: Number(variant.legacyResourceId), barcode: variant.sku } })
        });
      }
      updated += 1;
    }
  }
  console.log(`${APPLY ? "Updated" : "Would update"} ${updated} variant barcodes.`);
}

async function moveProducts(sourceCollection, targetCollection, products, label) {
  if (!products.length) return;
  const targetIds = new Set(targetCollection.products.nodes.map((product) => product.id));
  const toAdd = products.map((product) => product.id).filter((id) => !targetIds.has(id));
  console.log(`${label}: ${products.length} to move, ${toAdd.length} need add to ${targetCollection.handle}`);
  if (!APPLY) return;
  for (let index = 0; index < toAdd.length; index += 250) {
    const data = await gql(
      `mutation AddProducts($id: ID!, $productIds: [ID!]!) {
        collectionAddProducts(id: $id, productIds: $productIds) {
          userErrors { field message }
        }
      }`,
      { id: targetCollection.id, productIds: toAdd.slice(index, index + 250) }
    );
    const errors = data.collectionAddProducts.userErrors || [];
    if (errors.length) throw new Error(`collectionAddProducts ${label}: ${JSON.stringify(errors)}`);
  }
  for (let index = 0; index < products.length; index += 250) {
    const data = await gql(
      `mutation RemoveProducts($id: ID!, $productIds: [ID!]!) {
        collectionRemoveProducts(id: $id, productIds: $productIds) {
          userErrors { field message }
        }
      }`,
      { id: sourceCollection.id, productIds: products.slice(index, index + 250).map((product) => product.id) }
    );
    const errors = data.collectionRemoveProducts.userErrors || [];
    if (errors.length) throw new Error(`collectionRemoveProducts ${label}: ${JSON.stringify(errors)}`);
  }
}

async function draftZeroImageProducts(products) {
  const targets = products.filter((product) => product.status === "ACTIVE" && product.images.nodes.length === 0);
  console.log(`Active zero-image products to draft: ${targets.length}`);
  if (!APPLY) return;
  for (const product of targets) {
    const data = await gql(
      `mutation ProductUpdate($input: ProductInput!) {
        productUpdate(input: $input) {
          userErrors { field message }
        }
      }`,
      { input: { id: product.id, status: "DRAFT" } }
    );
    const errors = data.productUpdate.userErrors || [];
    if (errors.length) throw new Error(`draft ${product.handle}: ${JSON.stringify(errors)}`);
    product.status = "DRAFT";
  }
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  const sourceCollection = await fetchCollection(COLLECTION_HANDLE);
  const dramaCollection = await fetchCollection(DRAMA_COLLECTION_HANDLE);
  const hairCollection = await fetchCollection(HAIR_COLLECTION_HANDLE);
  const products = await fetchProducts(COLLECTION_HANDLE);
  const refs = await fetchRefs();

  const dramaProducts = products.filter(isDramaCrown);
  const hairProducts = products.filter((product) => isHairCrown(product) && !isDramaCrown(product));
  const deityProducts = products.filter((product) => !isDramaCrown(product) && !isHairCrown(product));

  console.log(`Products fetched: ${products.length}`);
  console.log(`Deity crown products to optimize: ${deityProducts.length}`);
  console.log(`Drama products to move: ${dramaProducts.length}`);
  console.log(`Hair crown products to move: ${hairProducts.length}`);

  await moveProducts(sourceCollection, dramaCollection, dramaProducts, "Drama crowns");
  await moveProducts(sourceCollection, hairCollection, hairProducts, "Hair crowns");
  await draftZeroImageProducts(products);

  const inputs = [
    ...collectionMetafields(sourceCollection, refs),
    ...deityProducts.flatMap((product) => productMetafields(product, refs))
  ];
  console.log(`Metafields planned: ${inputs.length}`);
  await updateCollection(sourceCollection);
  await setMetafields(inputs);
  await deleteWrongGoogleFields(deityProducts);
  await updateVariantBarcodes(deityProducts);
  for (const product of deityProducts) await updateProduct(product);
  console.log("Deity crowns confirmed-field pass complete.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
