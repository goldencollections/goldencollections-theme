#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const COLLECTION_HANDLE = "hands-legs-for-varalakshmi-idol";
const ENV_FILE = "env";
const GPC_RELIGIOUS_ITEMS = "97";
const DRAFT_SKUS = new Set(["VHL025"].map(normalizeSku));
const HANDS_ONLY_SKUS = new Set(["VHL027"].map(normalizeSku));
const CLOTH_SPONGE_BY_SKU = new Map(
  Object.entries({
    VHL008: "Sponge with white cloth",
    VHL009: "Sponge with white cloth",
    VHL005: "Sponge with white cloth",
    VHL006: "Sponge with white cloth",
    VHL007: "Sponge with white cloth",
    VHL003: "Sponge with yellow cloth",
    VHL004: "Sponge with yellow cloth",
    VHL001: "Sponge with yellow cloth",
    VHL002: "Sponge with yellow cloth"
  })
);

const REGIONAL_NAMES = [
  "Varalakshmi hands",
  "Varalakshmi legs",
  "Varalakshmi hastham",
  "Varalakshmi padam",
  "Hastham and Padam",
  "Hastam Padam",
  "Ammavaru hastham",
  "Amman hands",
  "Lakshmi hands and legs",
  "Deity hands",
  "Deity legs",
  "Lotus hands",
  "Balaji hastham",
  "Vishnu hands"
];

const RELATED_COLLECTION_HANDLES = [
  "vara-lakshmi-dolls",
  "varalakshmi-doll-faces",
  "varalakshmi-deity-jewellery",
  "vagamalai-thomala",
  "banana-tree-banana-bunches-for-pooja-varamahalakshmi-vratham"
];

const DEITY_HANDLES = {
  varalakshmi: "varalakshmi-lakshmi-amman",
  vishnu: "balaji-vishnu-perumal",
  multi: "multi-deity"
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
  const fromTitle = product.title.match(/\b(?:DJ-?hands-?legs-?\d{1,4}|[A-Z]{2,5}-?\d{2,4})\b/i)?.[0] || "";
  const fromHandle = product.handle.match(/\b[a-z]{2,5}-?\d{2,4}\b/i)?.[0] || "";
  const fromVariant = product.variants.nodes.find((variant) => variant.sku)?.sku || "";
  return String(fromTitle || fromVariant || fromHandle || "").replace(/\s+/g, "");
}

function skuKey(product) {
  return normalizeSku(sku(product));
}

function context(product) {
  return `${product.title} ${product.productType} ${product.descriptionHtml || ""} ${product.variants.nodes
    .map((variant) => `${variant.title} ${variant.selectedOptions.map((option) => `${option.name} ${option.value}`).join(" ")}`)
    .join(" ")}`;
}

function variantStyle(product) {
  const styles = product.variants.nodes
    .flatMap((variant) => variant.selectedOptions)
    .filter((option) => /style/i.test(option.name))
    .map((option) => option.value)
    .filter((value) => !/default/i.test(value));
  return [...new Set(styles)][0] || "";
}

function materialFor(product) {
  const blob = context(product);
  const key = skuKey(product);
  if (CLOTH_SPONGE_BY_SKU.has(key)) return CLOTH_SPONGE_BY_SKU.get(key);
  if (/cloth/i.test(blob)) return "Cloth with sponge fillings";
  if (/silver/i.test(blob)) return "Alloy metal with silver plating";
  if (/stone\s+has|stone\s+hast|stone\s+pad|stone\s+path|hastapatham|stone hands|stone hands and legs|stone.*hands and legs/i.test(blob)) return "Resin Stone";
  if (/\bgold[\s-]*plated\b|\bplated\s+hands\b|\bplated\s+hast/i.test(blob)) return "Alloy metal with gold plating";
  if (/lotus|balaji\s+hastham|stone|white\s+stones|pink\s+stones|green\s+.*stones|multi/i.test(blob)) return "Alloy metal with stones";
  return "";
}

function measurement(product) {
  const inchHeights = [];
  const inchWidths = [];
  const cmPairs = [];
  const addNumber = (bucket, value) => {
    const match = String(value || "").match(/(\d+(?:\.\d+)?)/);
    if (match) bucket.push(Number(match[1]));
  };
  const addPair = (value, unit) => {
    const match = String(value || "").match(/(\d+(?:\.\d+)?)\s*(?:x|×|X)\s*(\d+(?:\.\d+)?)/);
    if (!match) return false;
    if (unit === "cm") cmPairs.push(`${match[1]} x ${match[2]} cm`);
    else {
      inchHeights.push(Number(match[1]));
      inchWidths.push(Number(match[2]));
    }
    return true;
  };
  for (const variant of product.variants.nodes) {
    for (const option of variant.selectedOptions) {
      if (/size.*cms/i.test(option.name)) {
        addPair(option.value, "cm");
      } else if (/size.*inch/i.test(option.name)) {
        addPair(option.value, "in");
      } else if (/height|length/i.test(option.name)) {
        addNumber(inchHeights, option.value);
      } else if (/width/i.test(option.name)) {
        addNumber(inchWidths, option.value);
      }
    }
    if (/x/i.test(variant.title) && !/cms/i.test(product.variants.nodes.flatMap((v) => v.selectedOptions).map((o) => o.name).join(" "))) {
      addPair(variant.title, "in");
    }
  }
  return {
    inchHeights: [...new Set(inchHeights)].sort((a, b) => a - b),
    inchWidths: [...new Set(inchWidths)].sort((a, b) => a - b),
    cmPairs: [...new Set(cmPairs)]
  };
}

function colorFor(product) {
  const colors = product.variants.nodes
    .flatMap((variant) => variant.selectedOptions)
    .filter((option) => /colou?r/i.test(option.name))
    .map((option) => option.value.replace(/marron/i, "Maroon"))
    .filter((value) => value && !/default/i.test(value));
  return [...new Set(colors)][0] || "";
}

function isHasthamPadam(product) {
  if (HANDS_ONLY_SKUS.has(skuKey(product))) return false;
  if (isBalajiHastham(product)) return false;
  const style = variantStyle(product);
  const blob = context(product);
  return /hastham\s+and\s+padam|hastam\s+and\s+padam|hands\s+and\s+legs|hands\s+legs|padam|patham|feet/i.test(`${style} ${blob}`);
}

function isBalajiHastham(product) {
  return /balaji\s+hastham|vishnu|balaji/i.test(context(product));
}

function styleFor(product) {
  if (isBalajiHastham(product)) return "Balaji Hastham";
  if (/lotus/i.test(context(product))) return "Lotus Hands";
  if (isHasthamPadam(product)) return "Hastham and Padam";
  return "Deity Hands";
}

function componentCount(product) {
  return isHasthamPadam(product) ? 4 : 2;
}

function includedItems(product) {
  if (isHasthamPadam(product)) return ["Two deity hands and two deity legs as shown in photos"];
  if (isBalajiHastham(product)) return ["Two folded Balaji style deity hands as shown in photos"];
  return ["Two deity hands as shown in photos"];
}

function deityInfo(product, refs) {
  if (isBalajiHastham(product)) {
    return {
      key: "vishnu",
      primary: "Balaji / Vishnu / Venkateswara / Perumal",
      compatibility: "Folded Balaji Hastham style for Balaji, Vishnu, Venkateswara and Perumal; can be used for other god idols only when this folded-hands style fits.",
      refs: [refs.vishnu?.id, refs.multi?.id].filter(Boolean)
    };
  }
  return {
    key: "varalakshmi",
    primary: "Varalakshmi / Lakshmi / Amman",
    compatibility: "Varalakshmi, Lakshmi, Amman, Ammavaru and general god or goddess idol setups when the measured hand, leg and dress placement fits.",
    refs: [refs.varalakshmi?.id, refs.multi?.id].filter(Boolean)
  };
}

function titleFor(product) {
  const code = sku(product).replace(/-/g, "");
  const style = styleFor(product);
  const material = materialFor(product);
  const color = colorFor(product);
  const dims = measurement(product);
  const height = dims.inchHeights.length === 1 ? ` ${formatNumber(dims.inchHeights[0])} in` : "";
  const colorText = color && !/multi/i.test(color) ? ` ${color}` : "";
  if (HANDS_ONLY_SKUS.has(skuKey(product))) return `Gold Plated Deity Hastham ${code}`.replace(/\s+/g, " ").trim();
  if (style === "Balaji Hastham") return `Balaji Vishnu Folded Hastham${height}${colorText} ${code}`.replace(/\s+/g, " ").trim();
  if (style === "Lotus Hands") return `Varalakshmi Lotus Hands${height}${colorText} ${code}`.replace(/\s+/g, " ").trim();
  if (/silver/i.test(material)) return `Silver Plated Hastham and Padam${height} ${code}`.replace(/\s+/g, " ").trim();
  if (/cloth|sponge/i.test(material)) return `Cloth Hastham and Padam for Varalakshmi Doll${height}${colorText} ${code}`.replace(/\s+/g, " ").trim();
  if (/resin stone/i.test(material)) return `Resin Stone Hastham and Padam${height} ${code}`.replace(/\s+/g, " ").trim();
  if (/gold/i.test(material)) return `Gold Plated Hastham and Padam${height} ${code}`.replace(/\s+/g, " ").trim();
  return `Varalakshmi Hastham and Padam${height}${colorText} ${code}`.replace(/\s+/g, " ").trim();
}

function seoTitleFor(title) {
  return `${title} | Golden Collections`.slice(0, 70);
}

function fitNotes(product) {
  const dims = measurement(product);
  const inchParts = [];
  if (dims.inchHeights.length === 1) inchParts.push(`${formatNumber(dims.inchHeights[0])} in vertical height/length`);
  if (dims.inchWidths.length === 1) inchParts.push(`${formatNumber(dims.inchWidths[0])} in front width`);
  const cmText = dims.cmPairs.length ? ` Selected size values are shown in centimeters: ${dims.cmPairs.join(", ")}. Keep these cm values in mind while matching the idol body.` : "";
  return `Compare ${inchParts.length ? inchParts.join(" and ") : "the selected size"} with your idol body, arm placement, leg placement, saree or dress width, jewellery and backdrop. Height, Length or L means vertical hand/leg height or length; W means front width, not thickness.${cmText}`;
}

function productDescription(product, refs) {
  const title = titleFor(product);
  const material = materialFor(product);
  const deity = deityInfo(product, refs);
  const style = styleFor(product);
  const useText = deity.key === "vishnu"
    ? "for Balaji, Vishnu, Venkateswara and Perumal alankaram where folded hastham placement is appropriate"
    : "for Varalakshmi Vratham, Varamahalakshmi Habba, Lakshmi Pooja, Amman alankaram and festive deity doll decoration";
  return [
    `<p>${title} is a ${style.toLowerCase()} set ${useText}. It is used to complete the hand, arm, foot or leg placement on a Varalakshmi doll, kalasam body, deity idol or festive alankaram setup.</p>`,
    `<p><strong>Material:</strong> ${material}.</p>`,
    `<p><strong>Included:</strong> ${includedItems(product).join(", ")}.</p>`,
    `<p><strong>Fit guidance:</strong> ${fitNotes(product)}</p>`,
    "<p>Use the product photos and measurement images to match hand direction, leg placement, dress width, jewellery clearance and the overall deity posture before ordering.</p>"
  ].join("");
}

function tagsFor(product, refs) {
  const deity = deityInfo(product, refs);
  return [
    ...new Set([
      "Varalakshmi Hands",
      "Varalakshmi Legs",
      "Hastham and Padam",
      "Hastam Padam",
      "Deity Hands",
      "Deity Legs",
      "Ammavaru Hastham",
      "Amman Hands",
      styleFor(product),
      deity.primary,
      "Varalakshmi Vratham",
      "Pooja Decoration",
      "Golden Collections",
      sku(product)
    ].filter(Boolean))
  ];
}

function productMetafields(product, refs, ornamentTypeRef) {
  const deity = deityInfo(product, refs);
  const dims = measurement(product);
  const inputs = [
    metafield(product.id, "custom", "range_type", "single_line_text_field", "Varalakshmi Vratham / Deity Hands and Legs"),
    metafield(product.id, "custom", "ornament_type", "single_line_text_field", "Hastham and Padam / Deity Hands and Legs"),
    metafield(product.id, "custom", "placement", "single_line_text_field", "Hands / Legs / Idol body / Alankaram setup"),
    metafield(product.id, "custom", "material", "single_line_text_field", materialFor(product)),
    metafield(product.id, "custom", "compatibility_class", "single_line_text_field", deity.compatibility),
    metafield(product.id, "custom", "compatible_deities", "list.single_line_text_field", JSON.stringify([deity.primary, "General god and goddess idols"])),
    metafield(product.id, "custom", "compatible_deity_refs", "list.metaobject_reference", JSON.stringify(deity.refs)),
    metafield(product.id, "custom", "primary_deity_ref", "metaobject_reference", deity.refs[0] || refs.varalakshmi?.id),
    metafield(product.id, "custom", "fit_notes", "multi_line_text_field", fitNotes(product)),
    metafield(product.id, "custom", "size_confidence", "single_line_text_field", dims.inchHeights.length || dims.inchWidths.length ? "Variant measurement" : dims.cmPairs.length ? "Variant measurement in cm" : "Check product photos"),
    metafield(product.id, "custom", "component_count", "number_integer", String(componentCount(product))),
    metafield(product.id, "custom", "set_items_included", "list.single_line_text_field", JSON.stringify(includedItems(product))),
    metafield(product.id, "custom", "regional_names", "list.single_line_text_field", JSON.stringify(REGIONAL_NAMES)),
    metafield(product.id, "mm-google-shopping", "google_product_category", "string", GPC_RELIGIOUS_ITEMS),
    metafield(product.id, "mc-facebook", "google_product_category", "string", GPC_RELIGIOUS_ITEMS),
    metafield(product.id, "mm-google-shopping", "condition", "string", "new"),
    metafield(product.id, "mm-google-shopping", "custom_product", "boolean", "true")
  ];
  if (ornamentTypeRef) inputs.push(metafield(product.id, "custom", "ornament_type_ref", "metaobject_reference", ornamentTypeRef));
  if (dims.inchHeights.length === 1) inputs.push(metafield(product.id, "custom", "ornament_height_in", "number_decimal", String(dims.inchHeights[0])));
  if (dims.inchWidths.length === 1) inputs.push(metafield(product.id, "custom", "ornament_width_in", "number_decimal", String(dims.inchWidths[0])));
  return inputs;
}

function collectionMetafields(collection, relatedRefs) {
  const relatedIds = RELATED_COLLECTION_HANDLES.map((handle) => relatedRefs[handle]?.id).filter(Boolean);
  const inputs = [
    metafield(collection.id, "custom", "display_title", "single_line_text_field", "Varalakshmi Hastham and Padam"),
    metafield(
      collection.id,
      "custom",
      "collection_intro",
      "multi_line_text_field",
      "Hastham and Padam, deity hands, deity legs, lotus hands and Balaji folded hastham for Varalakshmi dolls, Lakshmi/Amman alankaram and god or goddess idol decoration. Choose by style, material, component set, height/length, width and placement."
    ),
    metafield(
      collection.id,
      "custom",
      "size_fit_intro",
      "multi_line_text_field",
      "For this collection, Height, Length or L means vertical hand/leg height or length. W means front width, not thickness. If a size is shown in centimeters, keep the cm value in fit notes and compare it directly with the idol body, dress width and hand or leg placement."
    ),
    metafield(collection.id, "custom", "faq_family", "single_line_text_field", "varalakshmi"),
    metafield(collection.id, "custom", "collection_role", "single_line_text_field", "festival"),
    metafield(collection.id, "custom", "deity_first_enabled", "boolean", "true"),
    metafield(collection.id, "custom", "shopping_path_label", "single_line_text_field", "Hands & Legs"),
    metafield(collection.id, "custom", "parent_menu_handles", "single_line_text_field", "varalakshmi-collection-circles"),
    metafield(collection.id, "custom", "regional_keyword_cluster", "list.single_line_text_field", JSON.stringify(REGIONAL_NAMES))
  ];
  if (relatedIds.length) inputs.push(metafield(collection.id, "custom", "related_collection_refs", "list.collection_reference", JSON.stringify(relatedIds)));
  return inputs;
}

async function updateCollection(collection, relatedRefs) {
  const descriptionHtml = [
    "<p>Shop Varalakshmi Hastham and Padam, deity hands, deity legs, lotus hands and Balaji folded hastham for Varalakshmi Vratham, Varamahalakshmi Habba, Lakshmi Pooja, Amman alankaram and festive god or goddess idol decoration.</p>",
    "<p>Choose by confirmed material, included pieces, hand style, leg placement, height or length, front width, dress clearance and the product photos. Height, Length or L means vertical hand/leg height or length, and W means front width, not thickness.</p>"
  ].join("");
  if (!APPLY) {
    console.log(`[DRY COLLECTION] ${collection.title} -> Varalakshmi Hastham and Padam`);
  } else {
    const data = await gql(
      `mutation CollectionUpdate($input: CollectionInput!) {
        collectionUpdate(input: $input) { userErrors { field message } }
      }`,
      {
        input: {
          id: collection.id,
          title: "Varalakshmi Hastham and Padam",
          descriptionHtml,
          templateSuffix: "deity-ornament-default",
          sortOrder: "MANUAL",
          seo: {
            title: "Varalakshmi Hastham and Padam Hands and Legs",
            description:
              "Shop Varalakshmi Hastham and Padam, deity hands, legs, lotus hands and Balaji folded hastham for idol alankaram. Choose by material, size and fit."
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
  const seoDescription = `Shop ${title} for Varalakshmi, Lakshmi, Amman or deity idol alankaram. Check material, included pieces, height or length and width.`;
  if (!APPLY) {
    console.log(`[DRY PRODUCT] ${product.handle}: ${product.title} -> ${title}`);
    return;
  }
  const data = await gql(
    `mutation ProductUpdate($input: ProductInput!) {
      productUpdate(input: $input) { userErrors { field message } }
    }`,
    {
      input: {
        id: product.id,
        title,
        productType: "Deity Hands and Legs",
        templateSuffix: "deity-lite",
        descriptionHtml: productDescription(product, refs),
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
    const alt = `${title} deity hastham padam for idol alankaram image ${index + 1}`;
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
        metafieldsSet(metafields: $metafields) { userErrors { field message code } }
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
  const ornamentTypeRef = collection.metafields.nodes.find((m) => m.namespace === "custom" && m.key === "ornament_type_ref")?.value;
  console.log(`Fetched ${products.length} products from ${collection.handle}.`);

  await draftUnavailable(products);
  const updateProducts = products.filter((product) => product.status === "ACTIVE" && !DRAFT_SKUS.has(skuKey(product)));
  const missingMaterial = updateProducts.filter((product) => !materialFor(product));
  if (missingMaterial.length) {
    throw new Error(`Active products still missing material: ${missingMaterial.map((product) => `${sku(product)} ${product.handle}`).join("; ")}`);
  }
  await updateCollection(collection, relatedRefs);
  await setMetafields(updateProducts.flatMap((product) => productMetafields(product, deityRefs, ornamentTypeRef)));
  for (const product of updateProducts) await updateProduct(product, deityRefs);
  await deleteWrongGoogleFields(updateProducts);
  await updateVariantSkuBarcodes(updateProducts);
  await reorderCollection(collection, products);

  const active = products.filter((product) => product.status === "ACTIVE").length;
  const draft = products.filter((product) => product.status === "DRAFT").length;
  console.log(`${APPLY ? "Updated" : "Would update"} ${updateProducts.length} active hands/legs products. Collection now ${active} active, ${draft} draft.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
