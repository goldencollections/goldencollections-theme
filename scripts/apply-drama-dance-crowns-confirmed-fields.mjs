#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const COLLECTION_HANDLE = "drama-dance-crowns";
const ENV_FILE = "env";
const GPC_COSTUME_ACCESSORY = "5192";

const env = readEnv(ENV_FILE);
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const GRAPHQL_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;
const REST_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}`;

const REGIONAL_NAMES = [
  "drama crown",
  "dance crown",
  "Bharatanatyam crown",
  "Kuchipudi crown",
  "stage crown",
  "performance headgear",
  "kireedam",
  "kreedam",
  "kirita",
  "mukut",
  "mythological play crown",
  "god role crown",
  "goddess role crown"
];

const COLLECTION_UPDATE = {
  title: "Drama & Dance Crowns",
  bodyHtml:
    "<p>Shop drama and dance crowns, kireedam and mukut for Bharatanatyam, Kuchipudi and Indian mythological stage performances. These crowns are made for human performers, including deity portrayal, royal roles, dance drama, school shows and stage productions.</p><p>Each product includes one crown unless the product page clearly says it includes a combo item such as Shanku Chakra and earrings. Choose by crown height, front width, style, material and role. For sizes, Height means vertical crown height and Width means the front or head width. If a size is shown as L x W x D, treat L as crown height.</p>",
  seoTitle: "Drama & Dance Crowns for Bharatanatyam and Stage",
  seoDescription:
    "Shop drama crowns, dance kireedam and stage mukut for Bharatanatyam, Kuchipudi and mythological plays. Adult unisex performance crowns by size and role.",
  metafields: {
    display_title: "Drama & Dance Crowns",
    collection_intro:
      "Drama and dance crowns, kireedam and mukut for human performers in Bharatanatyam, Kuchipudi, mythological plays and deity or royal stage roles. Choose by height, front width, material, color and stage character.",
    size_fit_intro:
      "For drama and dance crowns, Height means vertical crown height and Width means the front/head width. If a product uses L x W x D, treat L as crown height. Check crown height, front width, depth, hairstyle, bun size, pins, tying method and movement comfort before ordering.",
    faq_family: "dance_crown",
    collection_role: "dance_accessory",
    deity_first_enabled: "false",
    shopping_path_label: "Drama Crowns",
    parent_menu_handles: "bharatanatyam-jewellery",
    regional_keyword_cluster: REGIONAL_NAMES
  }
};

const RELATED_COLLECTION_HANDLES = [
  "bharatanatyam-jewellery",
  "bharatanatyam-jewellery-sets",
  "bharatanatyam-dance-necklace-long-and-short",
  "bharatanatyam-dance-accessories-flower-hair-head-set-maang-tikka-mattal-makeup",
  "bharatanatyam-hair-accessories"
];

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
          id legacyResourceId handle title sortOrder
          products(first: 50, after: $after) {
            pageInfo { hasNextPage endCursor }
            nodes {
              id legacyResourceId handle title descriptionHtml productType status totalInventory tags templateSuffix
              seo { title description }
              images(first: 30) { nodes { id altText url } }
              variants(first: 80) {
                nodes { id legacyResourceId title sku barcode inventoryQuantity selectedOptions { name value } }
              }
              metafields(first: 80) { nodes { namespace key value type } }
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

function sku(product) {
  return product.variants.nodes.find((variant) => variant.sku)?.sku || "";
}

function skuNumber(product) {
  const match = sku(product).match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function materialFor(product) {
  const code = sku(product).toUpperCase();
  const number = skuNumber(product);
  if (/^BDC[1-4]$/.test(code)) return "Brass with Gold Plating and stone work";
  if (/^BDC(?:[5-9]|10)$/.test(code)) return "Cardboard";
  if (/^BDC(?:1[1-9]|[2-3][0-9]|4[0-2])$/.test(code)) return "Cardboard with kundan stones";
  if (/^DGC(?:249|250|251|252)$/.test(code)) return "Cardboard";
  if (number !== null && number >= 154 && number <= 162 && code.startsWith("DGC")) return "Cardboard";
  return "";
}

function isCombo(product) {
  return sku(product).toUpperCase() === "DGC024";
}

function titleFor(product) {
  const code = sku(product).toUpperCase();
  if (code === "DGC024") return "Drama Crown Combo with Shanku Chakra and Earrings DGC024";
  if (code.startsWith("BDC")) {
    const hint = roleHint(product);
    return `${hint ? `${hint} ` : ""}Bharatanatyam Drama Crown ${code}`.replace(/\s+/g, " ").trim();
  }
  if (code.startsWith("DGC")) {
    const style = cleanCrownStyle(styleValue(product));
    const stylePart = style && !/default/i.test(style) ? `${style} ` : "";
    return `Drama Dance ${stylePart}Crown ${code}`.replace(/\s+/g, " ").trim();
  }
  return product.title;
}

function styleValue(product) {
  const values = product.variants.nodes.flatMap((variant) => variant.selectedOptions);
  const style = values.find((option) => /style/i.test(option.name))?.value || "";
  return style.replace(/\s*Crown$/i, " Crown").trim();
}

function cleanCrownStyle(value) {
  return String(value || "")
    .replace(/\s*Crown$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function roleHint(product) {
  const code = sku(product).toUpperCase();
  const title = product.title;
  const hints = [
    [/BDC1\b|nagaraja|naga/i, "Nagaraja Naga"],
    [/BDC2\b|god.?goddess/i, "God Goddess"],
    [/BDC3\b|mahapaksha/i, "God Goddess Mahapaksha"],
    [/BDC4\b|mahakireedam/i, "God Goddess Mahakireedam"],
    [/balaji/i, "Balaji"],
    [/goddess/i, "Goddess"],
    [/peacock/i, "Peacock"],
    [/lotus/i, "Lotus"],
    [/kundan/i, "Kundan"],
    [/temple/i, "Temple Style"]
  ];
  return hints.find(([pattern]) => pattern.test(`${code} ${title}`))?.[1] || "";
}

function selectedSize(product) {
  const options = product.variants.nodes.flatMap((variant) => variant.selectedOptions);
  const byName = (name) => options.find((option) => option.name.toLowerCase() === name)?.value || "";
  const combined = options.find((option) => /size in inches/i.test(option.name))?.value || "";
  if (combined) return parseSizeParts(combined);
  return {
    height: parseNumber(byName("height")),
    width: parseNumber(byName("width")),
    depth: parseNumber(byName("depth"))
  };
}

function parseNumber(value) {
  const match = String(value || "").match(/[\d.]+/);
  return match ? match[0] : "";
}

function parseSizeParts(value) {
  const parts = String(value || "").match(/[\d.]+/g) || [];
  return {
    height: parts[0] || "",
    width: parts[1] || "",
    depth: parts[2] || ""
  };
}

function sizeLabel(product) {
  const size = selectedSize(product);
  const parts = [];
  if (size.height) parts.push(`height ${size.height} in`);
  if (size.width) parts.push(`front width ${size.width} in`);
  if (size.depth) parts.push(`depth ${size.depth} in`);
  return parts.length ? `Selected size shows ${parts.join(", ")}.` : "Check the product photos and measurement images for size.";
}

function fitNotes(product) {
  return `${sizeLabel(product)} Match the crown with the performer's head placement, hairstyle or bun size, costume headgear, tying method and movement comfort. These crowns are for human performers, including Bharatanatyam, Kuchipudi, mythological plays and deity or royal stage roles.`;
}

function includedItems(product) {
  if (isCombo(product)) return ["One drama crown", "Shanku Chakra and earrings combo"];
  return ["One drama crown"];
}

function productDescription(product, title, material) {
  const materialLine = material ? `<li>Material: ${material}.</li>` : "<li>Material: confirm from product photos or contact Golden Collections before ordering.</li>";
  const included = isCombo(product)
    ? "This product includes one drama crown with Shanku Chakra and earrings combo, made for stage use."
    : "Each product includes one drama or dance crown for stage use.";
  return [
    `<p>${title} is a drama and dance crown for human performers in Bharatanatyam, Kuchipudi, mythological plays and deity or royal stage roles.</p>`,
    "<ul>",
    `<li>${included}</li>`,
    materialLine,
    `<li>${sizeLabel(product)}</li>`,
    "<li>Height means vertical crown height and Width means front/head width. If a product uses L x W x D, L means crown height.</li>",
    "<li>Check hairstyle, bun size, pins, tying method, role costume and stage movement comfort before ordering.</li>",
    "</ul>",
    "<h3>Fit guidance</h3>",
    "<p>Drama crowns are not sized as deity-idol crowns. They are stage headgear for adult unisex performers. Use product photos and measurement images, and contact Golden Collections on WhatsApp if you need help matching a crown to a role or performer.</p>"
  ].join("");
}

function seoTitleFor(title) {
  return title.length <= 68 ? title : title.slice(0, 65).trim() + "...";
}

function seoDescriptionFor(product, title) {
  const material = materialFor(product);
  const materialPhrase = material ? `${material} ` : "";
  return `Shop ${title}, one ${materialPhrase}stage crown for Bharatanatyam, Kuchipudi and mythological plays. Adult unisex; check crown height and width.`;
}

function tagsFor(product, material) {
  const code = sku(product).toUpperCase();
  const tags = [
    "Drama Crown",
    "Dance Crown",
    "Bharatanatyam Crown",
    "Kuchipudi Crown",
    "Stage Crown",
    "Performance Headgear",
    "Mythological Play Crown",
    "Kireedam",
    "Kreedam",
    "Mukut",
    "Adult Unisex",
    "Human Performance Crown",
    "Golden Collections"
  ];
  if (material) tags.push(material);
  if (isCombo(product)) tags.push("Shanku Chakra and Earrings Combo");
  if (styleValue(product)) tags.push(styleValue(product));
  if (code) tags.push(code);
  return [...new Set(tags)].slice(0, 250);
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

async function collectionIdsByHandle(handles) {
  const ids = [];
  for (const handle of handles) {
    const data = await gql(
      `query CollectionId($handle: String!) {
        collectionByHandle(handle: $handle) { id handle title }
      }`,
      { handle }
    );
    if (data.collectionByHandle?.id) ids.push(data.collectionByHandle.id);
    else console.warn(`Related collection not found: ${handle}`);
  }
  return ids;
}

async function collectionMetafields(collection) {
  const relatedCollectionIds = await collectionIdsByHandle(RELATED_COLLECTION_HANDLES);
  return [
    metafield(collection.id, "custom", "display_title", "single_line_text_field", COLLECTION_UPDATE.metafields.display_title),
    metafield(collection.id, "custom", "collection_intro", "multi_line_text_field", COLLECTION_UPDATE.metafields.collection_intro),
    metafield(collection.id, "custom", "size_fit_intro", "multi_line_text_field", COLLECTION_UPDATE.metafields.size_fit_intro),
    metafield(collection.id, "custom", "faq_family", "single_line_text_field", COLLECTION_UPDATE.metafields.faq_family),
    metafield(collection.id, "custom", "collection_role", "single_line_text_field", COLLECTION_UPDATE.metafields.collection_role),
    metafield(collection.id, "custom", "deity_first_enabled", "boolean", COLLECTION_UPDATE.metafields.deity_first_enabled),
    metafield(collection.id, "custom", "shopping_path_label", "single_line_text_field", COLLECTION_UPDATE.metafields.shopping_path_label),
    metafield(collection.id, "custom", "parent_menu_handles", "single_line_text_field", COLLECTION_UPDATE.metafields.parent_menu_handles),
    metafield(collection.id, "custom", "regional_keyword_cluster", "list.single_line_text_field", JSON.stringify(COLLECTION_UPDATE.metafields.regional_keyword_cluster)),
    metafield(collection.id, "custom", "subcollections", "list.collection_reference", JSON.stringify(relatedCollectionIds)),
    metafield(collection.id, "custom", "related_collection_refs", "list.collection_reference", JSON.stringify(relatedCollectionIds))
  ];
}

function productMetafields(product) {
  const material = materialFor(product);
  const size = selectedSize(product);
  const inputs = [
    metafield(product.id, "custom", "range_type", "single_line_text_field", "Bharatanatyam / Dance"),
    metafield(product.id, "custom", "ornament_type", "single_line_text_field", "Drama Crown / Dance Kireedam / Stage Mukut"),
    metafield(product.id, "custom", "placement", "single_line_text_field", "Head"),
    metafield(product.id, "custom", "compatibility_class", "single_line_text_field", "Human Performance"),
    metafield(product.id, "custom", "component_count", "number_integer", "1"),
    metafield(product.id, "custom", "set_items_included", "list.single_line_text_field", JSON.stringify(includedItems(product))),
    metafield(product.id, "custom", "regional_names", "list.single_line_text_field", JSON.stringify(REGIONAL_NAMES)),
    metafield(product.id, "custom", "fit_notes", "multi_line_text_field", fitNotes(product)),
    metafield(product.id, "custom", "size_confidence", "single_line_text_field", size.height || size.width || size.depth ? "Variant measurement" : "Photo check"),
    metafield(product.id, "mm-google-shopping", "google_product_category", "string", GPC_COSTUME_ACCESSORY),
    metafield(product.id, "mc-facebook", "google_product_category", "string", GPC_COSTUME_ACCESSORY),
    metafield(product.id, "mm-google-shopping", "condition", "string", "new"),
    metafield(product.id, "mm-google-shopping", "custom_product", "boolean", "true"),
    metafield(product.id, "mm-google-shopping", "age_group", "string", "adult"),
    metafield(product.id, "mm-google-shopping", "gender", "string", "unisex")
  ];
  if (material) inputs.push(metafield(product.id, "custom", "material", "single_line_text_field", material));
  if (size.height) inputs.push(metafield(product.id, "custom", "ornament_height_in", "number_decimal", size.height));
  if (size.width) inputs.push(metafield(product.id, "custom", "ornament_width_in", "number_decimal", size.width));
  if (size.depth) inputs.push(metafield(product.id, "custom", "ornament_depth_in", "number_decimal", size.depth));
  if (styleValue(product)) inputs.push(metafield(product.id, "custom", "crown_style", "single_line_text_field", styleValue(product)));
  return inputs;
}

async function updateProduct(product) {
  const material = materialFor(product);
  const title = titleFor(product);
  const seoDescription = seoDescriptionFor(product, title);
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
        productType: "Drama Crowns",
        templateSuffix: "deity-lite",
        descriptionHtml: productDescription(product, title, material),
        tags: tagsFor(product, material),
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
    const alt = `${title} drama dance crown image ${index + 1}`;
    await rest(`/products/${product.legacyResourceId}/images/${imageId}.json`, {
      method: "PUT",
      body: JSON.stringify({ image: { id: Number(imageId), alt } })
    });
  }
}

async function normalizeBarcodes(products) {
  for (const product of products) {
    for (const variant of product.variants.nodes) {
      if (!variant.sku || variant.barcode === variant.sku) continue;
      if (!APPLY) {
        console.log(`[DRY VARIANT BARCODE] ${variant.sku}`);
        continue;
      }
      await rest(`/variants/${variant.legacyResourceId}.json`, {
        method: "PUT",
        body: JSON.stringify({ variant: { id: Number(variant.legacyResourceId), barcode: variant.sku } })
      });
    }
  }
}

function groupRank(product) {
  if (product.status === "ACTIVE" && product.totalInventory > 0 && product.images.nodes.length > 0) return 0;
  if (product.status === "ACTIVE" && product.images.nodes.length > 0) return 1;
  return 2;
}

async function reorderProducts(collection, products) {
  const ordered = products
    .map((product, originalIndex) => ({ ...product, originalIndex }))
    .sort((a, b) => groupRank(a) - groupRank(b) || a.originalIndex - b.originalIndex);
  const moves = ordered
    .slice()
    .reverse()
    .map((product) => ({ id: product.id, newPosition: "0" }));
  if (!APPLY) {
    console.log(`[DRY REORDER] ${moves.length}`);
    return;
  }
  const data = await gql(
    `mutation ReorderCollection($id: ID!, $moves: [MoveInput!]!) {
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
  console.log(`Reorder job: ${job.id}; done=${job.done}`);
  if (!job.done) await waitForJob(job.id);
}

async function waitForJob(jobId) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const data = await gql(`query Job($id: ID!) { job(id: $id) { id done } }`, { id: jobId });
    if (data.job?.done) return;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error(`Reorder job did not finish: ${jobId}`);
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  const { collection, products } = await fetchCollectionAndProducts();
  console.log(`Collection ${collection.handle}: products=${products.length}; active=${products.filter((p) => p.status === "ACTIVE").length}`);
  console.log(`DGC024 material remains ${materialFor(products.find((p) => sku(p).toUpperCase() === "DGC024")) || "unconfirmed"}.`);

  await updateCollection(collection);
  await setMetafields(await collectionMetafields(collection));
  await setMetafields(products.flatMap(productMetafields));
  for (const product of products) await updateProduct(product);
  await normalizeBarcodes(products);
  await reorderProducts(collection, products);
  console.log("Drama dance crowns confirmed-field pass complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
