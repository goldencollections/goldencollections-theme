import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const UPDATE_ACTIVE_CONTENT = process.argv.includes("--content");
const ENV_FILE = "env";
const COLLECTION_HANDLE = "deity-long-harams";

const env = Object.fromEntries(
  fs
    .readFileSync(ENV_FILE, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    })
);

const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const GRAPHQL_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;
const REST_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}`;

if (!SHOP || !TOKEN) {
  console.error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN");
  process.exit(1);
}

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

const REGIONAL_NAMES = [
  "deity long haram",
  "deity long necklace",
  "long haram for god idol",
  "long necklace for god idol",
  "long necklace for goddess idol",
  "deity necklace",
  "idol necklace",
  "god necklace",
  "goddess necklace",
  "haram",
  "haar",
  "mala",
  "malai",
  "long mala",
  "long haar",
  "alankaram necklace",
  "temple deity necklace",
  "swamy alankaram necklace",
  "ammavaru long haram",
  "amman long haram",
  "lakshmi long haram"
];

const CHEST_COMPATIBLE_TEXT = [
  "Balaji / Vishnu / Venkateswara / Perumal",
  "Varalakshmi / Lakshmi / Amman",
  "Durga / Devi / Amman / Parvati"
];

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

async function fetchProducts() {
  const products = [];
  let after = null;
  do {
    const data = await gql(
      `query Products($after: String) {
        collectionByHandle(handle: "deity-long-harams") {
          products(first: 50, after: $after) {
            pageInfo { hasNextPage endCursor }
            nodes {
              id
              legacyResourceId
              handle
              title
              status
              tags
              variants(first: 20) {
                nodes {
                  sku
                  selectedOptions { name value }
                }
              }
              images(first: 8) {
                nodes { id altText }
              }
            }
          }
        }
      }`,
      { after }
    );
    const conn = data.collectionByHandle.products;
    products.push(...conn.nodes);
    after = conn.pageInfo.hasNextPage ? conn.pageInfo.endCursor : null;
  } while (after);
  return products;
}

async function fetchRefs() {
  const entries = [
    ["ornament", "deity_ornament_type", "long-haram"],
    ...Object.entries(DEITY_HANDLES).map(([key, handle]) => [key, "deity_group", handle])
  ];
  const refs = {};
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

function hasStyle(product, styleName) {
  return product.variants.nodes.some((variant) =>
    variant.selectedOptions.some(
      (option) => option.name.toLowerCase() === "style" && option.value.toLowerCase() === styleName.toLowerCase()
    )
  );
}

function firstOption(product, name) {
  for (const variant of product.variants.nodes) {
    const option = variant.selectedOptions.find((item) => item.name.toLowerCase() === name.toLowerCase());
    if (option?.value) return option.value;
  }
  return "";
}

function normalizeSize(value) {
  return String(value || "")
    .trim()
    .replace(/[Ã—]/g, "x")
    .replace(/\s+/g, " ");
}

function exactSize(product) {
  const lxwValues = new Set();
  const lengthValues = new Set();
  for (const variant of product.variants.nodes) {
    for (const option of variant.selectedOptions) {
      if (/size in inches/i.test(option.name) || /^size$/i.test(option.name)) {
        const value = normalizeSize(option.value);
        if (value) lxwValues.add(value);
      } else if (/^length$/i.test(option.name)) {
        const value = normalizeSize(option.value);
        const match = value.match(/(\d+(?:\.\d+)?)/);
        if (match) lengthValues.add(match[1]);
      }
    }
  }
  if (lxwValues.size === 1) {
    const value = [...lxwValues][0];
    const match = value.match(/^(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)$/i);
    if (match) return { length: match[1], width: match[2], label: value.toUpperCase().replace(/\s*X\s*/i, " x "), source: "Length x Width" };
  }
  if (lengthValues.size === 1) {
    const length = [...lengthValues][0];
    return { length, width: null, label: `${length} inches length`, source: "Length" };
  }
  return null;
}

function firstSku(product) {
  const titleSku = product.title.match(/\bDLN[-\s]?(\d+)\b/i);
  if (titleSku) return `DLN${titleSku[1].padStart(3, "0")}`;
  return product.variants.nodes.find((variant) => variant.sku)?.sku || "";
}

function isExplicitSet(product) {
  return /\b(set|ensemble)\b/i.test(product.title);
}

function rowText(product) {
  const style = firstOption(product, "Style");
  if (/^chest$/i.test(style) || /long necklace/i.test(style)) return "";
  const match = style.match(/\b(\d+)\s*step/i);
  if (!match && /^\d+$/.test(style.trim())) return `${style.trim()} Step`;
  return match ? `${match[1]} Step` : style || "Long Haram";
}

function classifyTitle(product) {
  const title = product.title.toLowerCase();
  if (/varalakshmi/.test(title)) return "Varalakshmi";
  if (/lakshmi|amman|ammavaru/.test(title)) return "Lakshmi / Amman";
  if (/durga|devi|goddess|saraswati/.test(title)) return "Goddess";
  if (/venkateswara|balaji|vishnu|perumal/.test(title)) return "Vishnu / Balaji";
  if (/krishna|radha/.test(title)) return "Krishna";
  if (/ganesh|ganesha|ganapati|vinayaka/.test(title)) return "Ganesh";
  if (/shiva|mahadev/.test(title)) return "Shiva";
  return "Deity";
}

function titleFor(product) {
  const sku = firstSku(product);
  const deity = classifyTitle(product);
  const style = rowText(product);
  const color = firstOption(product, "Color");
  const colorText = color && !/default|title|multi/i.test(color) ? `${color} ` : "";
  const setText = isExplicitSet(product) ? " Set" : "";
  const productName = hasStyle(product, "Chest") ? `Chest Long Haram${setText}` : `Long Haram${setText}`;
  return `${deity} ${colorText}${style} ${productName}${sku ? ` ${sku}` : ""}`.replace(/\s+/g, " ").trim();
}

function productDescription(product, size) {
  const style = rowText(product);
  const color = firstOption(product, "Color") || "selected color";
  const isChest = hasStyle(product, "Chest");
  const isSet = isExplicitSet(product);
  const sizeLine = size?.width
    ? `${size.label} inch Length x Width`
    : size?.length
      ? `${size.length} inch length; check product photos for width`
      : "the selected size shown on the product page";
  return [
    isChest
      ? "<p>Chest style long haram for Venkateshwara Swamy, Balaji, Vishnu, Perumal and goddess idols. Use it when the jewellery should cover the upper chest or body area during pooja, temple, festival or home altar alankaram.</p>"
      : "<p>Deity long haram / long necklace for Hindu god and goddess idol alankaram. Use it when the necklace should fall lower across the idol body, dress or chest area.</p>",
    "<h3>How to choose</h3>",
    `<ul><li>Check the ${sizeLine}, ${color} color${style ? ` and ${style} style` : ""} before ordering.</li>${isSet ? "<li>This title indicates a set; review the product photos for the included pieces before ordering.</li>" : "<li>Includes a single long haram / long necklace unless the product title says set.</li>"}<li>Compare the long haram length and width with your idol height, chest width and dress drape.</li><li>1 Step, 2 Step, 3 Step and 5 Step refer to the number of necklace rows/layers in the design.</li><li>Review the product photos and measurement views for finish, color and scale.</li></ul>`,
    "<h3>Fit guidance</h3>",
    isChest
      ? "<p>Chest style long harams are only for Venkateshwara Swamy, Balaji, Vishnu, Perumal and goddess idols. Confirm the measured length and width against the idol chest, body and dress placement before ordering.</p>"
      : "<p>Long harams sit lower than short necklaces. If your idol has a broad chest, heavy dress drape or existing garlands, compare the measured ornament size carefully before ordering.</p>"
  ].join("\n");
}

function confirmedMetafields(product, refs) {
  const size = exactSize(product);
  const inputs = [
    metafield(product.id, "custom", "range_type", "single_line_text_field", "Deity"),
    metafield(product.id, "custom", "ornament_type", "single_line_text_field", "Long Haram / Long Necklace"),
    metafield(product.id, "custom", "ornament_type_ref", "metaobject_reference", refs.ornament.id),
    metafield(product.id, "custom", "placement", "single_line_text_field", "Lower chest / body / dress drape"),
    metafield(product.id, "custom", "material", "single_line_text_field", "Alloy metal with stone work"),
    metafield(product.id, "custom", "regional_names", "list.single_line_text_field", JSON.stringify(REGIONAL_NAMES)),
    metafield(product.id, "mm-google-shopping", "google_product_category", "string", "196"),
    metafield(product.id, "mc-facebook", "google_product_category", "string", "196"),
    metafield(product.id, "mm-google-shopping", "condition", "string", "new"),
    metafield(product.id, "mm-google-shopping", "custom_product", "boolean", "true")
  ];

  if (!isExplicitSet(product)) {
    inputs.push(metafield(product.id, "custom", "component_count", "number_integer", "1"));
    inputs.push(
      metafield(
        product.id,
        "custom",
        "set_items_included",
        "list.single_line_text_field",
        JSON.stringify(["Single long haram / long necklace"])
      )
    );
  }

  if (size) {
    inputs.push(metafield(product.id, "custom", "ornament_height_in", "number_decimal", size.length));
    if (size.width) inputs.push(metafield(product.id, "custom", "ornament_width_in", "number_decimal", size.width));
    inputs.push(
      metafield(
        product.id,
        "custom",
        "size_confidence",
        "single_line_text_field",
        size.width ? "Variant size confirmed" : "Variant length confirmed; check image for width"
      )
    );
  } else {
    inputs.push(metafield(product.id, "custom", "size_confidence", "single_line_text_field", "Check product image"));
  }

  if (!hasStyle(product, "Chest")) {
    inputs.push(
      metafield(
        product.id,
        "custom",
        "fit_notes",
        "multi_line_text_field",
        size?.width
          ? `Compare the ${size.label} inch Length x Width with the idol body, chest and dress placement before ordering. Long harams fall lower than short necklaces.`
          : "Compare the selected size and measurement photos with the idol body, chest and dress placement before ordering. Long harams fall lower than short necklaces."
      )
    );
  }

  if (hasStyle(product, "Chest")) {
    const compatibleKeys = ["vishnu", "varalakshmi", "durga"];
    const notForKeys = ["krishna", "ganesha", "shiva", "murugan", "ayyappa", "hanuman"];
    inputs.push(metafield(product.id, "custom", "compatibility_class", "single_line_text_field", "Multi-Deity"));
    inputs.push(metafield(product.id, "custom", "compatible_deities", "list.single_line_text_field", JSON.stringify(CHEST_COMPATIBLE_TEXT)));
    inputs.push(
      metafield(
        product.id,
        "custom",
        "compatible_deity_refs",
        "list.metaobject_reference",
        JSON.stringify(compatibleKeys.map((key) => refs[key].id))
      )
    );
    inputs.push(
      metafield(
        product.id,
        "custom",
        "not_for_deities",
        "list.single_line_text_field",
        JSON.stringify(notForKeys.map((key) => refs[key].displayName))
      )
    );
    inputs.push(
      metafield(
        product.id,
        "custom",
        "not_for_deity_refs",
        "list.metaobject_reference",
        JSON.stringify(notForKeys.map((key) => refs[key].id))
      )
    );
    inputs.push(
      metafield(
        product.id,
        "custom",
        "fit_notes",
        "multi_line_text_field",
        "Chest style long harams are suitable for Venkateshwara Swamy, Balaji, Vishnu, Perumal and goddess idols. Compare the product measurement photos with the idol chest, body and dress placement before ordering."
      )
    );
  }

  return inputs;
}

async function updateActiveProductContent(products) {
  const activeProducts = products.filter((product) => product.status === "ACTIVE");
  for (const product of activeProducts) {
    const size = exactSize(product);
    const title = titleFor(product);
    const isChest = hasStyle(product, "Chest");
    const seoDescription = isChest
      ? size?.width
        ? `Shop ${title} for Venkateshwara Swamy and goddess idol alankaram. Size ${size.label} inch Length x Width; compare chest placement.`
        : `Shop ${title} for Venkateshwara Swamy and goddess idol alankaram. Compare selected size, chest placement and photos.`
      : size?.width
        ? `Shop ${title} for Hindu god and goddess idol alankaram. Size ${size.label} inch Length x Width; compare body and dress placement.`
        : `Shop ${title} for Hindu god and goddess idol alankaram. Compare selected size, body placement and product photos.`;
    const tags = [
      ...new Set([
        ...product.tags.filter((tag) => !/\bshort haram\b|\bchest haram\b/i.test(tag)),
        "deity long haram",
        "deity long necklace",
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
          descriptionHtml: productDescription(product, size),
          tags,
          seo: {
            title: title.slice(0, 70),
            description: seoDescription.slice(0, 200)
          }
        }
      }
    );
    if (data.productUpdate.userErrors.length) {
      throw new Error(`productUpdate ${product.handle}: ${JSON.stringify(data.productUpdate.userErrors)}`);
    }

    await updateImageAlts(product, title);
  }
}

async function updateImageAlts(product, title) {
  if (!product.legacyResourceId || !product.images.nodes.length) return;
  for (let index = 0; index < product.images.nodes.length; index += 1) {
    const image = product.images.nodes[index];
    const imageId = image.id.split("/").pop();
    const alt = hasStyle(product, "Chest")
      ? `${title} for Venkateshwara and goddess idol chest alankaram image ${index + 1}`
      : `${title} deity long haram image ${index + 1}`;
    await rest(`/products/${product.legacyResourceId}/images/${imageId}.json`, {
      method: "PUT",
      body: JSON.stringify({ image: { id: Number(imageId), alt } })
    });
  }
}

async function setMetafields(inputs) {
  if (!APPLY) {
    console.log(`[DRY METAFIELDS] ${inputs.length}`);
    return;
  }
  for (let index = 0; index < inputs.length; index += 25) {
    const data = await gql(
      `mutation SetMetafields($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { namespace key value }
          userErrors { field message code }
        }
      }`,
      { metafields: inputs.slice(index, index + 25) }
    );
    if (data.metafieldsSet.userErrors.length) {
      throw new Error(`metafieldsSet: ${JSON.stringify(data.metafieldsSet.userErrors)}`);
    }
  }
}

async function deleteWrongGoogleFields(products) {
  const identifiers = products.flatMap((product) => [
    { ownerId: product.id, namespace: "mm-google-shopping", key: "age_group" },
    { ownerId: product.id, namespace: "mm-google-shopping", key: "gender" }
  ]);
  if (!APPLY) return;
  for (let index = 0; index < identifiers.length; index += 250) {
    const data = await gql(
      `mutation DeleteMetafields($metafields: [MetafieldIdentifierInput!]!) {
        metafieldsDelete(metafields: $metafields) {
          deletedMetafields { ownerId namespace key }
          userErrors { field message }
        }
      }`,
      { metafields: identifiers.slice(index, index + 250) }
    );
    if (data.metafieldsDelete.userErrors.length) {
      throw new Error(`metafieldsDelete: ${JSON.stringify(data.metafieldsDelete.userErrors)}`);
    }
  }
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  const [products, refs] = await Promise.all([fetchProducts(), fetchRefs()]);
  const inputs = products.flatMap((product) => confirmedMetafields(product, refs));
  console.log(`Products: ${products.length}; chest style=${products.filter((product) => hasStyle(product, "Chest")).length}; metafields=${inputs.length}`);
  await setMetafields(inputs);
  await deleteWrongGoogleFields(products);
  await updateActiveProductContent(products);
  console.log("Deity long haram confirmed fields complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
