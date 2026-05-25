#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const PRODUCTS_ONLY = process.argv.includes("--products-only");
const PRODUCT_START = Number(getArg("--start") || 0);
const PRODUCT_LIMIT = Number(getArg("--limit") || 0);
const ENV_FILE = "env";
const STONE_HANDLE = "deity-stone-crowns";
const PREMIUM_HANDLE = "premium-deity-crowns";
const ORNAMENT_HANDLE = "crown-mukut-kireedam";
const GPC_RELIGIOUS_ITEMS = "97";
const STONE_MATERIAL = "Alloy metal with Gold Plating";
const PREMIUM_BRASS_MATERIAL = "Brass";
const PREMIUM_IMPON_MATERIAL = "Impon / Panchaloha";
const PREMIUM_CODES = new Set(["DGC018", "DGC027", "DGC148"]);

const env = readEnv(ENV_FILE);
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const GRAPHQL_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;
const REST_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}`;

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
  "deity stone crown",
  "stone crown for god idol",
  "stone crown for goddess idol",
  "idol crown",
  "mukut",
  "kireedam",
  "kireetam",
  "kirita",
  "makuta",
  "kreedam",
  "CZ stone crown",
  "temple deity crown",
  "alankaram crown",
  "Amman crown",
  "Balaji crown",
  "Venkateshwara kireedam",
  "Perumal crown"
];
const PREMIUM_REGIONAL_NAMES = [
  "premium deity crown",
  "premium deity jewellery",
  "premium temple jewellery crown",
  "impon crown",
  "panchaloha crown",
  "Balaji kireedam",
  "Venkateshwara crown",
  "deity mukut",
  "stone mukut",
  "CZ stone crown"
];

const COLLECTIONS = {
  stone: {
    title: "Deity Stone Crowns",
    bodyHtml:
      "<p>Shop deity stone crowns, mukut and kireedam for Hindu god and goddess idol alankaram. These gold plated stone crowns are used for pooja, temple, festival and home altar decoration.</p><p>Each product includes one crown. Choose by crown style, stone color and measured size. For crown sizes, H means height, W means width and D means diameter/depth. If a size option says L x W x D, L means crown height. Compare product photos with your idol head width, height clearance, face shape, hairstyle and existing ornaments before ordering.</p>",
    seoTitle: "Deity Stone Crowns, Mukut & Kireedam",
    seoDescription:
      "Shop gold plated deity stone crowns, mukut and kireedam for god and goddess idols. Choose by H x W x D size, style and head fit.",
    displayTitle: "Stone Crowns",
    intro:
      "Deity stone crowns, mukut and kireedam for Hindu god and goddess idol alankaram. Each product includes one crown. Browse by crown style, stone color and measured size, then compare product photos with the idol head, face and crown placement area.",
    sizeIntro:
      "For deity stone crowns, read size as Height x Width x Diameter/Depth. If a size says L x W x D, L means crown height. Compare crown height with the space above the idol head, width with the head or face area, and diameter/depth with how the crown sits on the idol.",
    shoppingPathLabel: "Stone Crowns",
    regionalNames: REGIONAL_NAMES
  },
  premium: {
    title: "Premium Deity Crowns",
    bodyHtml:
      "<p>Shop premium deity crowns and temple jewellery mukut for special god and goddess idol alankaram. This premium crown collection includes selected high-finish crowns such as Impon/Panchaloha and premium brass styles with stone work.</p><p>Each product includes one crown. DGC027 is Impon, also known as Panchaloha; the other premium crown styles in this collection are brass. Choose by crown style, stone work and measured size, and compare the product photos with your idol head width, height clearance, face shape and crown placement before ordering.</p>",
    seoTitle: "Premium Deity Crowns | Impon & Temple Mukut",
    seoDescription:
      "Shop premium deity crowns, Impon/Panchaloha crown and temple jewellery mukut for god and goddess idols. Choose by measured crown fit.",
    displayTitle: "Premium Deity Crowns",
    intro:
      "Premium deity crowns and temple jewellery mukut for special god and goddess idol alankaram. This collection separates selected premium crowns from regular stone crowns, including DGC027 Impon/Panchaloha and premium brass crown styles.",
    sizeIntro:
      "For premium deity crowns, read size as Height x Width x Diameter/Depth. DGC018 uses height plus width/diameter wording, DGC027 uses separate Height, Width and Diameter values, and DGC148 uses L x W x D where L means crown height.",
    shoppingPathLabel: "Premium Crowns",
    regionalNames: PREMIUM_REGIONAL_NAMES
  }
};

if (!SHOP || !TOKEN) {
  console.error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN");
  process.exit(1);
}

function getArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index + 1 >= process.argv.length) return null;
  return process.argv[index + 1];
}

function readEnv(file) {
  return Object.fromEntries(
    fs.readFileSync(file, "utf8").split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#")).map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, "")];
    })
  );
}

async function gql(query, variables = {}) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const res = await fetch(GRAPHQL_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN },
        body: JSON.stringify({ query, variables })
      });
      const body = await res.json();
      if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}: ${JSON.stringify(body)}`);
      if (body.errors?.length) throw new Error(`GraphQL errors: ${JSON.stringify(body.errors)}`);
      return body.data;
    } catch (error) {
      lastError = error;
      if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
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
        headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN, ...(options.headers || {}) }
      });
      const text = await res.text();
      const body = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(`REST ${options.method || "GET"} ${path}: ${res.status} ${text}`);
      return body;
    } catch (error) {
      lastError = error;
      if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
  throw lastError;
}

function metafield(ownerId, namespace, key, type, value) {
  return { ownerId, namespace, key, type, value: String(value) };
}

async function fetchCollection(handle) {
  const data = await gql(
    `query Collection($handle: String!) {
      collectionByHandle(handle: $handle) {
        id legacyResourceId handle title templateSuffix sortOrder productsCount { count }
        products(first: 250) { nodes { id } }
      }
    }`,
    { handle }
  );
  return data.collectionByHandle;
}

async function ensurePremiumCollection() {
  const existing = await fetchCollection(PREMIUM_HANDLE);
  if (existing) return existing;
  console.log(`Premium collection missing: ${PREMIUM_HANDLE}`);
  if (!APPLY) return { id: "dry-run-premium", legacyResourceId: "dry-run", handle: PREMIUM_HANDLE, products: { nodes: [] } };
  const body = await rest("/custom_collections.json", {
    method: "POST",
    body: JSON.stringify({
      custom_collection: {
        title: COLLECTIONS.premium.title,
        handle: PREMIUM_HANDLE,
        body_html: COLLECTIONS.premium.bodyHtml,
        published: true,
        template_suffix: "deity-ornament-default"
      }
    })
  });
  return fetchCollection(body.custom_collection.handle);
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
              id legacyResourceId handle title descriptionHtml productType status totalInventory tags templateSuffix
              seo { title description }
              variants(first: 100) {
                nodes {
                  id legacyResourceId title sku barcode selectedOptions { name value }
                }
              }
              images(first: 40) { nodes { id altText url } }
              metafields(first: 180) { nodes { namespace key type value } }
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

function firstCode(product) {
  const match = `${product.title} ${product.handle}`.match(/\b(DGC|DHC)\s*-?\s*(\d+)\b/i);
  if (match) return `${match[1].toUpperCase()}${match[2]}`;
  const sku = product.variants.nodes.map((variant) => variant.sku).find(Boolean);
  return sku ? sku.replace(/[^a-z0-9]/gi, "").toUpperCase() : "";
}

function isPremium(product) {
  return PREMIUM_CODES.has(firstCode(product));
}

function optionValues(product, pattern) {
  return [...new Set(product.variants.nodes.flatMap((variant) => variant.selectedOptions.filter((option) => pattern.test(option.name)).map((option) => option.value)))].filter(Boolean);
}

function styleValues(product) {
  return optionValues(product, /style|type/i);
}

function colorValues(product) {
  return optionValues(product, /color/i);
}

function textBlob(product) {
  return [product.title, product.handle, product.productType, ...styleValues(product), ...colorValues(product)].join(" ");
}

function parseNumber(value) {
  return String(value).match(/(\d+(?:\.\d+)?)/)?.[1] || "";
}

function parseTriple(value) {
  const match = String(value).match(/(\d+(?:\.\d+)?)\s*[xX]\s*(\d+(?:\.\d+)?)\s*[xX]\s*(\d+(?:\.\d+)?)/);
  if (!match) return null;
  return { height: match[1], width: match[2], depth: match[3] };
}

function sizeFacts(product) {
  const triples = optionValues(product, /size|h x r x d/i).map(parseTriple).filter(Boolean);
  const tripleKeys = [...new Set(triples.map((size) => `${size.height}|${size.width}|${size.depth}`))];
  if (tripleKeys.length === 1) {
    const [height, width, depth] = tripleKeys[0].split("|");
    return { height, width, depth, variantLevel: false };
  }

  const heights = optionValues(product, /^height$/i).map(parseNumber).filter(Boolean);
  const diameters = optionValues(product, /^diameter$/i).map(parseNumber).filter(Boolean);
  const widthRaw = optionValues(product, /^width$/i);
  const widths = widthRaw.map(parseNumber).filter(Boolean);
  const widthDiameter = widthRaw.map((value) => String(value).match(/diameter\s*(\d+(?:\.\d+)?)/i)?.[1]).filter(Boolean);
  const height = [...new Set(heights)][0] || "";
  const width = [...new Set(widths)][0] || "";
  const depth = [...new Set(diameters)][0] || [...new Set(widthDiameter)][0] || "";
  if (height && width && depth) return { height, width, depth, variantLevel: false };
  if (height || width || depth || triples.length > 1) return { height, width, depth, variantLevel: true };
  return { variantLevel: false };
}

function normalizedStyle(product) {
  const values = styleValues(product).filter((value) => value && !/^default title$/i.test(value));
  if (!values.length) return "";
  const style = values[0]
    .replace(/Andalu/gi, "Andal")
    .replace(/\bAndal\b/gi, "")
    .replace(/\bCrown\b/gi, "")
    .replace(/\bMukut\b/gi, "")
    .replace(/\bKireedam\b/gi, "")
    .replace(/\bKireetam\b/gi, "")
    .replace(/\bBalaji\b/gi, "")
    .replace(/\bDeity\b/gi, "")
    .replace(/\bGod\b/gi, "")
    .replace(/\bGoddess\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return style;
}

function isAndal(product) {
  return /andal|andalu|\bleft\b|\bright\b/i.test(textBlob(product));
}

function deityLabel(product) {
  const blob = textBlob(product);
  if (isAndal(product)) return "Andal";
  if (/balaji|vishnu|venkatesh|venkateswara|perumal|srinivasa|vaira mudi/i.test(blob)) return "Balaji / Vishnu";
  if (/god\s*(and|&)?\s*goddess|god goddess/i.test(blob)) return "Deity";
  if (/amman|ammavaru|lakshmi|devi|goddess|durga|parvati/i.test(blob)) return "Goddess";
  return "Deity";
}

function materialFor(product) {
  const code = firstCode(product);
  if (code === "DGC027") return PREMIUM_IMPON_MATERIAL;
  if (code === "DGC018" || code === "DGC148") return PREMIUM_BRASS_MATERIAL;
  return STONE_MATERIAL;
}

function rangeType(product) {
  return isPremium(product) ? "Premium Deity" : "Deity";
}

function sizeLabel(size) {
  if (size.height && size.width && size.depth) return `${size.height} x ${size.width} x ${size.depth} inch Height x Width x Diameter/Depth`;
  if (size.variantLevel) return "Choose the variant size shown on the product page";
  return "Check the measured crown size shown on the product page";
}

function titleFor(product) {
  const code = firstCode(product);
  const style = normalizedStyle(product);
  const deity = deityLabel(product);
  const premium = isPremium(product);
  const material = materialFor(product);
  const materialPart = material === PREMIUM_IMPON_MATERIAL ? "Impon " : "";
  const stylePart = style ? `${style} ` : "";
  const base = premium ? `${deity} Premium ${stylePart}${materialPart}Stone Crown` : `${deity} ${stylePart}Stone Crown`;
  const title = `${base} ${code}`.replace(/\s+/g, " ").trim();
  return title.length <= 70 ? title : `${deity} ${premium ? "Premium " : ""}${materialPart}Stone Crown ${code}`.replace(/\s+/g, " ").trim();
}

function seoTitleFor(product, title) {
  const suffix = isPremium(product) ? " | Premium Deity Crown" : " for God Idols";
  return `${title}${suffix}`.length <= 70 ? `${title}${suffix}` : title.slice(0, 70).trim();
}

function fitNotes(product) {
  const andal = isAndal(product) ? " Left or right tilted Andal styles should be matched by direction." : "";
  return `Read crown measurements as Height x Width x Diameter/Depth. If a size says L x W x D, L means crown height. Compare with idol head width, face shape, hairstyle and height clearance.${andal} Product images and variant sizes are the final fit check.`;
}

function productDescription(product, size) {
  const title = titleFor(product);
  const material = materialFor(product);
  const premium = isPremium(product);
  const andal = isAndal(product) ? "<li>Left or right tilted Andal styles should be matched to the idol's crown placement direction.</li>" : "";
  let premiumLine = "";
  if (premium && material === PREMIUM_IMPON_MATERIAL) {
    premiumLine = "<p>This is part of the premium deity crown range. This crown is Impon, also known as Panchaloha.</p>";
  } else if (premium) {
    premiumLine = "<p>This is part of the premium deity crown range. This crown is a premium brass crown style.</p>";
  }
  return [
    `<p>${title} for Hindu god and goddess idol alankaram. Each product includes one crown for pooja, temple, festival or home altar decoration.</p>`,
    premiumLine,
    "<h3>How to choose</h3>",
    `<ul><li>Includes one deity crown.</li><li>Material: ${material}.</li><li>Read crown size as Height x Width x Diameter/Depth. ${sizeLabel(size)}.</li><li>If the option says L x W x D, L means crown height.</li><li>Compare crown height with available space above the idol head, width with the head or face area, and diameter/depth with how the crown sits on the idol.</li>${andal}<li>Review product photos, measurement images, stone work, color and style before ordering.</li></ul>`,
    "<h3>Fit guidance</h3>",
    "<p>Stone crowns can be used for different god and goddess idols when the measured size, head shape, hairstyle and crown style fit. Deity-specific names in the title or photos are additional guidance, but size and placement are the final fit check.</p>"
  ].join("\n");
}

function collectionMetafields(collection, refs, config) {
  return [
    metafield(collection.id, "custom", "display_title", "single_line_text_field", config.displayTitle),
    metafield(collection.id, "custom", "collection_intro", "multi_line_text_field", config.intro),
    metafield(collection.id, "custom", "size_fit_intro", "multi_line_text_field", config.sizeIntro),
    metafield(collection.id, "custom", "faq_family", "single_line_text_field", "crown"),
    metafield(collection.id, "custom", "collection_role", "single_line_text_field", "ornament_first"),
    metafield(collection.id, "custom", "deity_first_enabled", "boolean", "true"),
    metafield(collection.id, "custom", "shopping_path_label", "single_line_text_field", config.shoppingPathLabel),
    metafield(collection.id, "custom", "ornament_type_ref", "metaobject_reference", refs.ornament.id),
    metafield(collection.id, "custom", "ornament_type_refs", "list.metaobject_reference", JSON.stringify([refs.ornament.id])),
    metafield(collection.id, "custom", "regional_keyword_cluster", "list.single_line_text_field", JSON.stringify(config.regionalNames))
  ];
}

function productMetafields(product, refs) {
  const size = sizeFacts(product);
  const style = normalizedStyle(product);
  const inputs = [
    metafield(product.id, "custom", "range_type", "single_line_text_field", rangeType(product)),
    metafield(product.id, "custom", "ornament_type", "single_line_text_field", "Crown / Mukut / Kireedam"),
    metafield(product.id, "custom", "ornament_type_ref", "metaobject_reference", refs.ornament.id),
    metafield(product.id, "custom", "placement", "single_line_text_field", "Head"),
    metafield(product.id, "custom", "material", "single_line_text_field", materialFor(product)),
    metafield(product.id, "custom", "compatibility_class", "single_line_text_field", "General/Common"),
    metafield(product.id, "custom", "compatible_deities", "list.single_line_text_field", JSON.stringify(ALL_DEITY_TEXT)),
    metafield(product.id, "custom", "compatible_deity_refs", "list.metaobject_reference", JSON.stringify(Object.keys(DEITY_HANDLES).map((key) => refs[key].id))),
    metafield(product.id, "custom", "not_for_deities", "list.single_line_text_field", JSON.stringify([])),
    metafield(product.id, "custom", "not_for_deity_refs", "list.metaobject_reference", JSON.stringify([])),
    metafield(product.id, "custom", "fit_notes", "multi_line_text_field", fitNotes(product)),
    metafield(product.id, "custom", "size_confidence", "single_line_text_field", size.variantLevel ? "Variant-level measured size" : size.height ? "Measured size from product variant" : "Check product photos"),
    metafield(product.id, "custom", "component_count", "number_integer", "1"),
    metafield(product.id, "custom", "set_items_included", "list.single_line_text_field", JSON.stringify(["One deity crown"])),
    metafield(product.id, "custom", "regional_names", "list.single_line_text_field", JSON.stringify(isPremium(product) ? PREMIUM_REGIONAL_NAMES : REGIONAL_NAMES)),
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

async function updateCollection(collection, config) {
  if (!APPLY) {
    console.log(`[DRY COLLECTION] ${collection.handle}: ${config.title}`);
    return;
  }
  const data = await gql(
    `mutation CollectionUpdate($input: CollectionInput!) {
      collectionUpdate(input: $input) { userErrors { field message } }
    }`,
    { input: { id: collection.id, title: config.title, descriptionHtml: config.bodyHtml, templateSuffix: "deity-ornament-default", seo: { title: config.seoTitle, description: config.seoDescription } } }
  );
  const errors = data.collectionUpdate.userErrors || [];
  if (errors.length) throw new Error(`collectionUpdate ${collection.handle}: ${JSON.stringify(errors)}`);
}

async function setMetafields(inputs) {
  if (!APPLY) {
    console.log(`[DRY METAFIELDS] ${inputs.length}`);
    return;
  }
  for (let index = 0; index < inputs.length; index += 20) {
    const data = await gql(
      `mutation SetMetafields($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) { userErrors { field message code } }
      }`,
      { metafields: inputs.slice(index, index + 20) }
    );
    const errors = data.metafieldsSet.userErrors || [];
    if (errors.length) throw new Error(`metafieldsSet: ${JSON.stringify(errors)}`);
    console.log(`metafields ${Math.min(index + 20, inputs.length)}/${inputs.length}`);
  }
}

async function updateProduct(product) {
  const size = sizeFacts(product);
  const title = titleFor(product);
  const seoDescription = `Shop ${title}, one deity stone crown for god and goddess idol alankaram. ${sizeLabel(size)}; compare head fit before ordering.`;
  const tags = [...new Set([...(product.tags || []), "deity crown", "stone crown", "mukut", "kireedam", "god crown", "goddess crown", "idol alankaram", ...(isPremium(product) ? ["premium deity crown", "premium deity jewellery"] : []), ...(materialFor(product) === PREMIUM_IMPON_MATERIAL ? ["impon crown", "panchaloha crown"] : [])])];
  if (!APPLY) {
    console.log(`[DRY PRODUCT] ${product.handle}: ${product.title} -> ${title}`);
    return;
  }
  const data = await gql(
    `mutation ProductUpdate($input: ProductInput!) {
      productUpdate(input: $input) { userErrors { field message } }
    }`,
    { input: { id: product.id, title, productType: isPremium(product) ? "Premium Deity Crowns" : "Deity Stone Crowns", templateSuffix: "deity-lite", descriptionHtml: productDescription(product, size), tags, seo: { title: seoTitleFor(product, title), description: seoDescription.slice(0, 200) } } }
  );
  const errors = data.productUpdate.userErrors || [];
  if (errors.length) throw new Error(`productUpdate ${product.handle}: ${JSON.stringify(errors)}`);
  await updateImageAlts(product, title);
}

async function updateImageAlts(product, title) {
  for (const [index, image] of product.images.nodes.entries()) {
    const imageId = image.id.split("/").pop();
    const alt = `${title} deity crown image ${index + 1}`;
    await rest(`/products/${product.legacyResourceId}/images/${imageId}.json`, { method: "PUT", body: JSON.stringify({ image: { id: Number(imageId), alt } }) });
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
        metafieldsDelete(metafields: $metafields) { userErrors { field message } }
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
        await rest(`/variants/${variant.legacyResourceId}.json`, { method: "PUT", body: JSON.stringify({ variant: { id: Number(variant.legacyResourceId), barcode: variant.sku } }) });
      }
      updated += 1;
    }
  }
  console.log(`${APPLY ? "Updated" : "Would update"} ${updated} variant barcodes.`);
}

async function movePremiumProducts(stoneCollection, premiumCollection, premiumProducts) {
  const existing = new Set((premiumCollection.products?.nodes || []).map((product) => product.id));
  const toAdd = premiumProducts.map((product) => product.id).filter((id) => !existing.has(id));
  console.log(`Premium products: ${premiumProducts.length}; add to premium: ${toAdd.length}; remove from stone: ${premiumProducts.length}`);
  if (!APPLY) return;
  if (toAdd.length) {
    const add = await gql(
      `mutation AddProducts($id: ID!, $productIds: [ID!]!) {
        collectionAddProducts(id: $id, productIds: $productIds) { userErrors { field message } }
      }`,
      { id: premiumCollection.id, productIds: toAdd }
    );
    const addErrors = add.collectionAddProducts.userErrors || [];
    if (addErrors.length) throw new Error(`collectionAddProducts premium: ${JSON.stringify(addErrors)}`);
  }
  const remove = await gql(
    `mutation RemoveProducts($id: ID!, $productIds: [ID!]!) {
      collectionRemoveProducts(id: $id, productIds: $productIds) { userErrors { field message } }
    }`,
    { id: stoneCollection.id, productIds: premiumProducts.map((product) => product.id) }
  );
  const removeErrors = remove.collectionRemoveProducts.userErrors || [];
  if (removeErrors.length) throw new Error(`collectionRemoveProducts stone: ${JSON.stringify(removeErrors)}`);
}

async function reorderCollection(collection, products) {
  const sorted = products.slice().sort((a, b) => {
    const rank = (product) => (product.status === "ACTIVE" && product.totalInventory > 0 && product.images.nodes.length > 0 ? 0 : product.status === "ACTIVE" && product.images.nodes.length > 0 ? 1 : 2);
    return rank(a) - rank(b);
  });
  if (!APPLY) {
    console.log(`[DRY REORDER] ${collection.handle}: ${sorted.length}`);
    return;
  }
  const data = await gql(
    `mutation Reorder($id: ID!, $moves: [MoveInput!]!) {
      collectionReorderProducts(id: $id, moves: $moves) { job { id done } userErrors { field message } }
    }`,
    { id: collection.id, moves: sorted.map((product, index) => ({ id: product.id, newPosition: String(index) })) }
  );
  const errors = data.collectionReorderProducts.userErrors || [];
  if (errors.length) throw new Error(`collectionReorderProducts ${collection.handle}: ${JSON.stringify(errors)}`);
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  const stoneCollection = await fetchCollection(STONE_HANDLE);
  const premiumCollection = await ensurePremiumCollection();
  const sourceProducts = await fetchProducts(STONE_HANDLE);
  const refs = await fetchRefs();
  const premiumProductsInStone = sourceProducts.filter(isPremium);
  const stoneProducts = sourceProducts.filter((product) => !isPremium(product));
  console.log(`Stone products fetched: ${sourceProducts.length}`);
  console.log(`Premium targets in stone: ${premiumProductsInStone.map((product) => firstCode(product)).join(", ") || "none"}`);
  console.log(`Stone products to keep/update: ${stoneProducts.length}`);

  if (!PRODUCTS_ONLY) {
    await movePremiumProducts(stoneCollection, premiumCollection, premiumProductsInStone);
    await updateCollection(stoneCollection, COLLECTIONS.stone);
    await updateCollection(premiumCollection, COLLECTIONS.premium);
  }

  const finalStoneProducts = APPLY ? await fetchProducts(STONE_HANDLE) : stoneProducts;
  const finalPremiumProducts = APPLY ? await fetchProducts(PREMIUM_HANDLE) : premiumProductsInStone;
  const products = [...finalStoneProducts, ...finalPremiumProducts.filter(isPremium)];
  const premiumProducts = products.filter(isPremium);
  console.log(`Products to update after move: ${products.length}`);
  console.log(`Premium products to update: ${premiumProducts.map((product) => firstCode(product)).join(", ") || "none"}`);

  if (!PRODUCTS_ONLY) {
    const inputs = [
      ...collectionMetafields(stoneCollection, refs, COLLECTIONS.stone),
      ...collectionMetafields(premiumCollection, refs, COLLECTIONS.premium),
      ...products.flatMap((product) => productMetafields(product, refs))
    ];
    console.log(`Metafields planned: ${inputs.length}`);
    await setMetafields(inputs);
    await deleteWrongGoogleFields(products);
    await updateVariantBarcodes(products);
  }

  const productSlice = PRODUCT_LIMIT > 0 ? products.slice(PRODUCT_START, PRODUCT_START + PRODUCT_LIMIT) : products.slice(PRODUCT_START);
  console.log(`Product content slice: start=${PRODUCT_START}; count=${productSlice.length}; total=${products.length}`);
  for (const [index, product] of productSlice.entries()) {
    await updateProduct(product);
    const absoluteIndex = PRODUCT_START + index + 1;
    if ((index + 1) % 20 === 0 || index + 1 === productSlice.length) {
      console.log(`products ${absoluteIndex}/${products.length}`);
    }
  }
  if (!PRODUCTS_ONLY || PRODUCT_LIMIT === 0 || PRODUCT_START + PRODUCT_LIMIT >= products.length) {
    await reorderCollection(stoneCollection, finalStoneProducts);
    await reorderCollection(premiumCollection, premiumProducts);
  }
  console.log("Deity stone crowns confirmed-field pass complete.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
