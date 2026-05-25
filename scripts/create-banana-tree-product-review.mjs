import fs from "node:fs";
import path from "node:path";

const ENV_FILE = "env";
const COLLECTION_HANDLE = "banana-tree-banana-bunches-for-pooja-varamahalakshmi-vratham";
const OUTPUT = "tmp/reviews/banana-tree-product-field-review.csv";

const env = readEnv(ENV_FILE);
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const GRAPHQL_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;

if (!SHOP || !TOKEN) {
  console.error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN");
  process.exit(1);
}

const COMMON_REGIONAL_NAMES = [
  "banana tree for pooja",
  "artificial banana tree",
  "plantain tree decoration",
  "vazhai maram",
  "vazhamaram",
  "Varalakshmi banana tree",
  "Varalakshmi Vratham decoration",
  "Vara Mahalakshmi Vratam decor",
  "Varamahalakshmi Habba decoration"
];

const proposals = {
  "artificial-banana-tree-pair-for-varalakshmi-vratham-and-pooja-vbt-001": {
    ornament_type: "Banana tree pooja decor",
    compatibility_class: "Festival Specific",
    placement: "Beside kalasam, deity idol, home altar, doorway or mandapam",
    fit_notes:
      "Compare the 19 inch height with the space beside your kalasam, idol, altar, doorway or mandapam before ordering.",
    component_count: "2",
    set_items_included: "2 artificial banana trees",
    ornament_height_in: "19",
    regional_names: [...COMMON_REGIONAL_NAMES, "banana tree pair", "plantain tree pair"],
    material: "Foam and plastic",
    owner_confirmation_needed: "Exact height is from variant size; confirm product image dimensions if more are needed."
  },
  "banana-tree-for-varalakshmi-statue-pooja-decoration": {
    ornament_type: "Banana tree pooja decor",
    compatibility_class: "Festival Specific",
    placement: "Beside Varalakshmi statue, kalasam, altar, home temple or pooja mandapam",
    fit_notes: "Compare the 12 inch height with your idol, altar and available pooja space before ordering.",
    component_count: "2",
    set_items_included: "Pair",
    ornament_height_in: "12",
    regional_names: [...COMMON_REGIONAL_NAMES, "banana tree for Varalakshmi statue"],
    material: "Foam and plastic",
    owner_confirmation_needed: "SKU changed from DJ-hands-legs-004 to VBT-008. Height confirmed by owner."
  },
  "banana-bunch-set-foam-varalakshmi-pooja": {
    ornament_type: "Banana bunch pooja decor",
    compatibility_class: "Festival Specific",
    placement: "Pooja mandapam, altar, home temple, Golu or festive display",
    fit_notes: "Compare the 6 inch height with your altar, mandapam or display area before ordering.",
    component_count: "2",
    set_items_included: "2 foam banana bunches",
    ornament_height_in: "6",
    regional_names: [
      "banana bunch for pooja",
      "foam banana bunch",
      "artificial banana bunch",
      "banana bunch for Golu",
      "Varalakshmi banana bunch",
      "pooja banana bunch"
    ],
    material: "Foam and plastic",
    owner_confirmation_needed: "Height confirmed by owner."
  },
  "deity-coconut-tree-traditional-decoration-for-puja-temples-dac-001": {
    ornament_type: "Coconut tree pooja decor",
    compatibility_class: "General/Common",
    placement: "Beside deity idols, kalasam setup, home altar, temple display or mandapam",
    fit_notes:
      "Choose the size variant based on the available height and width in your pooja setup; confirm variant dimensions in product photos.",
    component_count: "1",
    set_items_included: "Single coconut tree ornament",
    ornament_height_in: "",
    regional_names: ["coconut tree decor", "deity coconut tree", "pooja coconut tree", "temple coconut tree"],
    material: "Metal and stone work",
    owner_confirmation_needed: "Material and single-piece count confirmed by owner."
  },
  "varalakshmi-vratham-artificial-banana-set-for-pooja-decoration-vbt-006": {
    ornament_type: "Artificial banana set pooja decor",
    compatibility_class: "Festival Specific",
    placement: "Home temple, kalasam, deity idol, altar or mandapam",
    fit_notes: "Compare the 7 inch height with your altar, kalasam or mandapam placement before ordering.",
    component_count: "2",
    set_items_included: "Pair",
    ornament_height_in: "7",
    regional_names: [...COMMON_REGIONAL_NAMES, "artificial banana set", "Varalakshmi banana set"],
    material: "Foam and plastic",
    owner_confirmation_needed: "Height confirmed by owner."
  },
  "artificial-hanging-banana-set-for-vratham-and-pooja-decoration-vbt-005": {
    ornament_type: "Hanging banana pooja decor",
    compatibility_class: "Festival Specific",
    placement: "Doorway, pooja mandapam, altar or festival backdrop",
    fit_notes: "Confirm the 9 inch height, hanging placement and available display space using the product photos before ordering.",
    component_count: "2",
    set_items_included: "Pair",
    ornament_height_in: "9",
    regional_names: ["hanging banana set", "artificial hanging banana", "banana bunch for pooja", "Varalakshmi decor"],
    material: "Foam and plastic",
    owner_confirmation_needed: "Height confirmed by owner."
  },
  "decorative-artificial-banana-bunch-for-vratham-and-pooja-vbt-004": {
    ornament_type: "Artificial banana bunch pooja decor",
    compatibility_class: "Festival Specific",
    placement: "Near kalasam, deity idol, altar or mandapam display",
    fit_notes: "Compare the 8 inch height with your pooja setup and confirm display space before ordering.",
    component_count: "2",
    set_items_included: "Pair",
    ornament_height_in: "8",
    regional_names: ["artificial banana bunch", "banana bunch for pooja", "pooja banana bunch", "Varalakshmi decor"],
    material: "Foam and plastic",
    owner_confirmation_needed: "Height confirmed by owner."
  },
  "traditional-banana-tree-decoration-for-varalakshmi-vratham-vbt-003": {
    ornament_type: "Banana tree pooja decor",
    compatibility_class: "Festival Specific",
    placement: "Beside kalasam, deity idol, mandapam or home temple display",
    fit_notes: "Compare the 13 inch height with the space beside your idol, kalasam or altar before ordering.",
    component_count: "2",
    set_items_included: "Pair",
    ornament_height_in: "13",
    regional_names: [...COMMON_REGIONAL_NAMES, "traditional banana tree", "13 inch banana tree"],
    material: "Foam and plastic",
    owner_confirmation_needed: "Exact height is from variant size; confirm product image dimensions if more are needed."
  },
  "varalakshmi-vratham-with-an-artificial-banana-tree-decoration-vbt-002": {
    ornament_type: "Banana tree pooja decor",
    compatibility_class: "Festival Specific",
    placement: "Beside kalasam, deity idol, altar, doorway or mandapam",
    fit_notes: "Compare the 16 inch height with your pooja setup before ordering.",
    component_count: "2",
    set_items_included: "Pair",
    ornament_height_in: "16",
    regional_names: [...COMMON_REGIONAL_NAMES, "16 inch banana tree"],
    material: "Foam and plastic",
    owner_confirmation_needed: "Exact height is from variant size; confirm product image dimensions if more are needed."
  }
};

const columns = [
  "approval_status",
  "owner_notes",
  "handle",
  "title_current",
  "sku_values",
  "barcode_values_current",
  "barcode_google_guidance",
  "product_type_current",
  "shopify_category_current",
  "google_category_current",
  "google_category_proposed",
  "google_condition_current",
  "google_condition_proposed",
  "google_custom_product_current",
  "google_custom_product_proposed",
  "google_age_group_current",
  "google_age_group_proposed",
  "google_gender_current",
  "google_gender_proposed",
  "seo_title_current",
  "seo_description_current",
  "metafield_ornament_type_proposed",
  "metafield_compatibility_class_proposed",
  "metafield_placement_proposed",
  "metafield_fit_notes_proposed",
  "metafield_component_count_proposed",
  "metafield_set_items_included_proposed",
  "metafield_ornament_height_in_proposed",
  "metafield_material_proposed",
  "metafield_regional_names_proposed",
  "metafield_size_confidence_proposed",
  "metafield_range_type_proposed",
  "template_faq_family_proposed",
  "owner_confirmation_needed",
  "confidence_notes"
];

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

function metafieldMap(product) {
  return Object.fromEntries(product.metafields.nodes.map((field) => [`${field.namespace}.${field.key}`, field.value]));
}

function csvValue(value) {
  const text = Array.isArray(value) ? value.join(" | ") : String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function row(product) {
  const proposed = proposals[product.handle] || {};
  const mf = metafieldMap(product);
  const skuValues = product.variants.nodes.map((variant) => variant.sku).filter(Boolean);
  const barcodeValues = product.variants.nodes.map((variant) => variant.barcode).filter(Boolean);
  const googleCategoryCurrent =
    mf["mm-google-shopping.google_product_category"] || mf["mc-facebook.google_product_category"] || "";

  return {
    approval_status: "",
    owner_notes: "",
    handle: product.handle,
    title_current: product.title,
    sku_values: skuValues,
    barcode_values_current: barcodeValues,
    barcode_google_guidance:
      "Keep Shopify SKU/barcode for internal operations, but do not treat internal SKU as GTIN in Google feed.",
    product_type_current: product.productType,
    shopify_category_current: product.category?.fullName || "",
    google_category_current: googleCategoryCurrent,
    google_category_proposed: "97 - Religious & Ceremonial > Religious Items",
    google_condition_current: mf["mm-google-shopping.condition"] || "",
    google_condition_proposed: "new",
    google_custom_product_current: mf["mm-google-shopping.custom_product"] || "",
    google_custom_product_proposed: "true",
    google_age_group_current: mf["mm-google-shopping.age_group"] || "",
    google_age_group_proposed: "",
    google_gender_current: mf["mm-google-shopping.gender"] || "",
    google_gender_proposed: "",
    seo_title_current: product.seo?.title || mf["global.title_tag"] || "",
    seo_description_current: product.seo?.description || mf["global.description_tag"] || "",
    metafield_ornament_type_proposed: proposed.ornament_type || "",
    metafield_compatibility_class_proposed: proposed.compatibility_class || "",
    metafield_placement_proposed: proposed.placement || "",
    metafield_fit_notes_proposed: proposed.fit_notes || "",
    metafield_component_count_proposed: proposed.component_count || "",
    metafield_set_items_included_proposed: proposed.set_items_included || "",
    metafield_ornament_height_in_proposed: proposed.ornament_height_in || "",
    metafield_material_proposed: proposed.material || "",
    metafield_regional_names_proposed: proposed.regional_names || "",
    metafield_size_confidence_proposed: proposed.ornament_height_in
      ? "Variant size confirmed; exact product image still recommended"
      : "Check product image / owner confirmation needed",
    metafield_range_type_proposed: "Deity",
    template_faq_family_proposed: product.handle.includes("coconut") ? "pooja_decor" : "banana_decor",
    owner_confirmation_needed: proposed.owner_confirmation_needed || "Review before applying.",
    confidence_notes:
      "Google category and custom-product recommendation based on product type/category. Metafields are proposed from title, variants, collection context and existing description; blank means not confirmed."
  };
}

async function main() {
  const data = await gql(
    `query CollectionProducts($handle: String!) {
      collectionByHandle(handle: $handle) {
        products(first: 30) {
          nodes {
            handle
            title
            productType
            category { fullName }
            seo { title description }
            metafields(first: 100) { nodes { namespace key type value } }
            variants(first: 20) { nodes { sku barcode } }
          }
        }
      }
    }`,
    { handle: COLLECTION_HANDLE }
  );

  const products = data.collectionByHandle?.products?.nodes || [];
  const lines = [columns.map(csvValue).join(",")];
  for (const product of products) {
    const dataRow = row(product);
    lines.push(columns.map((column) => csvValue(dataRow[column])).join(","));
  }

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, `${lines.join("\n")}\n`, "utf8");
  console.log(`Wrote ${products.length} review rows to ${OUTPUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
