import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const ENV_FILE = "env";
const COLLECTION_HANDLE = "banana-tree-banana-bunches-for-pooja-varamahalakshmi-vratham";

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

const productFields = {
  "artificial-banana-tree-pair-for-varalakshmi-vratham-and-pooja-vbt-001": {
    ornament_type: "Banana tree pooja decor",
    placement: "Beside kalasam, deity idol, home altar, doorway or mandapam",
    fit_notes:
      "Compare the 19 inch height with the space beside your kalasam, idol, altar, doorway or mandapam before ordering.",
    ornament_height_in: "19",
    regional_names: [...COMMON_REGIONAL_NAMES, "banana tree pair", "plantain tree pair"]
  },
  "banana-tree-for-varalakshmi-statue-pooja-decoration": {
    ornament_type: "Banana tree pooja decor",
    placement: "Beside Varalakshmi statue, kalasam, altar, home temple or pooja mandapam",
    fit_notes: "Compare the 12 inch height with your idol, altar and available pooja space before ordering.",
    ornament_height_in: "12",
    regional_names: [...COMMON_REGIONAL_NAMES, "banana tree for Varalakshmi statue"]
  },
  "banana-bunch-set-foam-varalakshmi-pooja": {
    ornament_type: "Banana bunch pooja decor",
    placement: "Pooja mandapam, altar, home temple, Golu or festive display",
    fit_notes: "Compare the 6 inch height with your altar, mandapam or display area before ordering.",
    ornament_height_in: "6",
    regional_names: [
      "banana bunch for pooja",
      "foam banana bunch",
      "artificial banana bunch",
      "banana bunch for Golu",
      "Varalakshmi banana bunch",
      "pooja banana bunch"
    ]
  },
  "deity-coconut-tree-traditional-decoration-for-puja-temples-dac-001": {
    ornament_type: "Coconut tree pooja decor",
    compatibility_class: "General/Common",
    material: "Metal and stone work",
    component_count: "1",
    set_items_included: ["Single coconut tree ornament"],
    placement: "Beside deity idols, kalasam setup, home altar, temple display or mandapam",
    fit_notes:
      "Choose the size variant based on the available height and width in your pooja setup; confirm variant dimensions in product photos.",
    regional_names: ["coconut tree decor", "deity coconut tree", "pooja coconut tree", "temple coconut tree"]
  },
  "varalakshmi-vratham-artificial-banana-set-for-pooja-decoration-vbt-006": {
    ornament_type: "Artificial banana set pooja decor",
    placement: "Home temple, kalasam, deity idol, altar or mandapam",
    fit_notes: "Compare the 7 inch height with your altar, kalasam or mandapam placement before ordering.",
    ornament_height_in: "7",
    regional_names: [...COMMON_REGIONAL_NAMES, "artificial banana set", "Varalakshmi banana set"]
  },
  "artificial-hanging-banana-set-for-vratham-and-pooja-decoration-vbt-005": {
    ornament_type: "Hanging banana pooja decor",
    placement: "Doorway, pooja mandapam, altar or festival backdrop",
    fit_notes: "Confirm the 9 inch height, hanging placement and available display space using the product photos before ordering.",
    ornament_height_in: "9",
    regional_names: ["hanging banana set", "artificial hanging banana", "banana bunch for pooja", "Varalakshmi decor"]
  },
  "decorative-artificial-banana-bunch-for-vratham-and-pooja-vbt-004": {
    ornament_type: "Artificial banana bunch pooja decor",
    placement: "Near kalasam, deity idol, altar or mandapam display",
    fit_notes: "Compare the 8 inch height with your pooja setup and confirm display space before ordering.",
    ornament_height_in: "8",
    regional_names: ["artificial banana bunch", "banana bunch for pooja", "pooja banana bunch", "Varalakshmi decor"]
  },
  "traditional-banana-tree-decoration-for-varalakshmi-vratham-vbt-003": {
    ornament_type: "Banana tree pooja decor",
    placement: "Beside kalasam, deity idol, mandapam or home temple display",
    fit_notes: "Compare the 13 inch height with the space beside your idol, kalasam or altar before ordering.",
    ornament_height_in: "13",
    regional_names: [...COMMON_REGIONAL_NAMES, "traditional banana tree", "13 inch banana tree"]
  },
  "varalakshmi-vratham-with-an-artificial-banana-tree-decoration-vbt-002": {
    ornament_type: "Banana tree pooja decor",
    placement: "Beside kalasam, deity idol, altar, doorway or mandapam",
    fit_notes: "Compare the 16 inch height with your pooja setup before ordering.",
    ornament_height_in: "16",
    regional_names: [...COMMON_REGIONAL_NAMES, "16 inch banana tree"]
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

function metafield(ownerId, namespace, key, type, value) {
  return { ownerId, namespace, key, type, value };
}

function confirmedMetafields(product) {
  const fields = productFields[product.handle];
  if (!fields) return [];
  const ownerId = product.id;
  const inputs = [
    metafield(ownerId, "custom", "material", "single_line_text_field", fields.material || "Foam and plastic"),
    metafield(ownerId, "custom", "component_count", "number_integer", fields.component_count || "2"),
    metafield(ownerId, "custom", "set_items_included", "list.single_line_text_field", JSON.stringify(fields.set_items_included || ["Pair"])),
    metafield(ownerId, "custom", "compatibility_class", "single_line_text_field", fields.compatibility_class || "Festival Specific"),
    metafield(ownerId, "custom", "ornament_type", "single_line_text_field", fields.ornament_type),
    metafield(ownerId, "custom", "placement", "single_line_text_field", fields.placement),
    metafield(ownerId, "custom", "fit_notes", "multi_line_text_field", fields.fit_notes),
    metafield(ownerId, "custom", "regional_names", "list.single_line_text_field", JSON.stringify(fields.regional_names)),
    metafield(ownerId, "custom", "size_confidence", "single_line_text_field", fields.ornament_height_in ? "Variant size confirmed" : "Size option confirmed; exact inches not set"),
    metafield(ownerId, "custom", "range_type", "single_line_text_field", "Pooja Decor"),
    metafield(ownerId, "mm-google-shopping", "google_product_category", "string", "97"),
    metafield(ownerId, "mc-facebook", "google_product_category", "string", "97"),
    metafield(ownerId, "mm-google-shopping", "condition", "string", "new"),
    metafield(ownerId, "mm-google-shopping", "custom_product", "boolean", "true")
  ];

  if (fields.ornament_height_in) {
    inputs.push(metafield(ownerId, "custom", "ornament_height_in", "number_decimal", fields.ornament_height_in));
  }

  return inputs;
}

async function getProducts() {
  const data = await gql(
    `query CollectionProducts($handle: String!) {
      collectionByHandle(handle: $handle) {
        products(first: 30) {
          nodes {
            id
            handle
            title
          }
        }
      }
    }`,
    { handle: COLLECTION_HANDLE }
  );
  return data.collectionByHandle?.products?.nodes || [];
}

async function setMetafields(inputs) {
  const data = await gql(
    `mutation SetMetafields($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { namespace key value type }
        userErrors { field message code }
      }
    }`,
    { metafields: inputs }
  );
  const errors = data.metafieldsSet.userErrors || [];
  if (errors.length) throw new Error(`metafieldsSet: ${JSON.stringify(errors)}`);
}

async function deleteMetafields(products) {
  const identifiers = products.flatMap((product) => [
    { ownerId: product.id, namespace: "mm-google-shopping", key: "age_group" },
    { ownerId: product.id, namespace: "mm-google-shopping", key: "gender" }
  ]);

  if (!identifiers.length) return;

  const data = await gql(
    `mutation DeleteMetafields($metafields: [MetafieldIdentifierInput!]!) {
      metafieldsDelete(metafields: $metafields) {
        deletedMetafields { ownerId namespace key }
        userErrors { field message }
      }
    }`,
    { metafields: identifiers }
  );
  const errors = data.metafieldsDelete.userErrors || [];
  if (errors.length) throw new Error(`metafieldsDelete: ${JSON.stringify(errors)}`);
}

async function main() {
  const products = await getProducts();
  const inputs = products.flatMap(confirmedMetafields);

  console.log(`${APPLY ? "APPLY" : "DRY RUN"}: ${products.length} products, ${inputs.length} metafields`);
  for (const product of products) {
    const keys = confirmedMetafields(product).map((field) => `${field.namespace}.${field.key}`);
    console.log(`${product.handle}: ${keys.join(", ")}`);
  }

  if (!APPLY) return;

  for (let i = 0; i < inputs.length; i += 25) {
    await setMetafields(inputs.slice(i, i + 25));
  }
  await deleteMetafields(products);
  console.log("Confirmed banana tree product metafields and Google fields updated.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
