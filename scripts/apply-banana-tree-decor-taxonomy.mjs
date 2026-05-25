#!/usr/bin/env node
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

const handles = {
  ornamentType: "pooja-decor-banana-tree",
  varalakshmi: "varalakshmi-lakshmi-amman",
  vishnu: "balaji-vishnu-perumal",
  durga: "durga-devi-amman-parvati"
};

const commonRegionalNames = [
  "banana tree for pooja",
  "artificial banana tree",
  "plantain tree decoration",
  "banana bunch for pooja",
  "pooja banana bunch",
  "vazhaikannu",
  "vazhai maram",
  "vazhamaram",
  "arati chettu",
  "baale gida",
  "Varalakshmi banana tree",
  "Varalakshmi Vratham decoration",
  "Vara Mahalakshmi Vratam decor",
  "Varamahalakshmi Habba decoration",
  "Lakshmi Pooja decoration",
  "Satyanarayan pooja decoration",
  "Satyanarayana Swamy pooja decor",
  "Narayana pooja decor"
];

const productOverrides = {
  "deity-coconut-tree-traditional-decoration-for-puja-temples-dac-001": {
    compatibleText: [
      "Varalakshmi / Lakshmi / Amman",
      "Satyanarayana / Narayana / Vishnu",
      "Durga / Devi / Amman / Parvati"
    ],
    compatibleRefs: ["varalakshmi", "vishnu", "durga"],
    compatibilityClass: "General/Common",
    regionalNames: [
      "coconut tree decor",
      "deity coconut tree",
      "pooja coconut tree",
      "temple coconut tree",
      "kalasam decor",
      "mandapam decor",
      "Satyanarayana pooja decor",
      "Lakshmi Pooja decoration"
    ]
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

function field(key, value) {
  return { key, value: String(value) };
}

function metafield(ownerId, key, type, value) {
  return { ownerId, namespace: "custom", key, type, value };
}

async function upsertPoojaDecorOrnamentType() {
  const fields = [
    field("name", "Pooja Decor / Banana Tree Decor"),
    field("slug", handles.ornamentType),
    field("status", "active"),
    field(
      "aliases",
      JSON.stringify([
        "Pooja Decor",
        "Banana Tree Decor",
        "Plantain Tree Decor",
        "Banana Bunch Decor",
        "Kalasam Decor",
        "Mandapam Decor"
      ])
    ),
    field("placement", "Kalasam / altar / doorway / mandapam"),
    field("fit_measurement_needed", "true"),
    field("sizing_standard", "decor-placement-size"),
    field("deity_first_label", "pooja-decor"),
    field("collection_handle_suffix", "pooja-decor"),
    field(
      "seo_definition",
      "Reusable pooja decoration pieces such as artificial banana trees, banana bunches and coconut tree decor used around kalasam, deity idol, altar, doorway or mandapam setups."
    ),
    field(
      "fit_notes",
      "Choose by product height, width, set quantity and placement space. Compare product measurement photos with the kalasam, altar, doorway or mandapam area before ordering."
    ),
    field("sort_priority", "130")
  ];

  if (!APPLY) {
    console.log(`[DRY-RUN UPSERT] deity_ornament_type:${handles.ornamentType}`);
    return;
  }

  const data = await gql(
    `mutation UpsertMetaobject($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
      metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
        metaobject { id handle type displayName }
        userErrors { field message code }
      }
    }`,
    {
      handle: { type: "deity_ornament_type", handle: handles.ornamentType },
      metaobject: { fields }
    }
  );
  const errors = data.metaobjectUpsert.userErrors || [];
  if (errors.length) throw new Error(`metaobjectUpsert: ${JSON.stringify(errors)}`);
  console.log(`[METAOBJECT UPSERTED] ${data.metaobjectUpsert.metaobject.displayName}`);
}

async function metaobjectId(type, handle) {
  const data = await gql(
    `query Metaobject($handle: MetaobjectHandleInput!) {
      metaobjectByHandle(handle: $handle) { id handle displayName }
    }`,
    { handle: { type, handle } }
  );
  const metaobject = data.metaobjectByHandle;
  if (!metaobject) throw new Error(`Missing ${type}:${handle}`);
  return metaobject;
}

async function getCollection() {
  const data = await gql(
    `query Collection($handle: String!) {
      collectionByHandle(handle: $handle) {
        id
        handle
        title
        products(first: 30) {
          nodes { id handle title }
        }
      }
    }`,
    { handle: COLLECTION_HANDLE }
  );
  if (!data.collectionByHandle) throw new Error(`Collection not found: ${COLLECTION_HANDLE}`);
  return data.collectionByHandle;
}

function collectionMetafields(collection, refs) {
  return [
    metafield(collection.id, "collection_role", "single_line_text_field", "festival"),
    metafield(collection.id, "deity_first_enabled", "boolean", "true"),
    metafield(collection.id, "shopping_path_label", "single_line_text_field", "Pooja Banana Tree Decor"),
    metafield(collection.id, "display_title", "single_line_text_field", "Banana Tree & Bunches"),
    metafield(collection.id, "primary_deity_ref", "metaobject_reference", refs.varalakshmi.id),
    metafield(collection.id, "deity_group_refs", "list.metaobject_reference", JSON.stringify([refs.varalakshmi.id, refs.vishnu.id])),
    metafield(collection.id, "ornament_type_ref", "metaobject_reference", refs.ornament.id),
    metafield(collection.id, "ornament_type_refs", "list.metaobject_reference", JSON.stringify([refs.ornament.id])),
    metafield(collection.id, "faq_family", "single_line_text_field", "banana_tree_decor"),
    metafield(collection.id, "regional_keyword_cluster", "list.single_line_text_field", JSON.stringify(commonRegionalNames)),
    metafield(
      collection.id,
      "size_fit_intro",
      "multi_line_text_field",
      "Choose by product height and placement. Use the measurement photos to compare with your kalasam, deity idol, altar, doorway, Satyanarayana pooja setup or mandapam space."
    )
  ];
}

function productMetafields(product, refs) {
  const override = productOverrides[product.handle] || {};
  const isCoconut = product.handle.includes("coconut");
  const inputs = [
    metafield(product.id, "range_type", "single_line_text_field", "Pooja Decor"),
    metafield(product.id, "ornament_type_ref", "metaobject_reference", refs.ornament.id),
    metafield(
      product.id,
      "compatible_deities",
      "list.single_line_text_field",
      JSON.stringify(override.compatibleText || ["Satyanarayana / Narayana / Vishnu", "Lakshmi Pooja"])
    ),
    metafield(
      product.id,
      "compatible_deity_refs",
      "list.metaobject_reference",
      JSON.stringify((override.compatibleRefs || ["vishnu"]).map((key) => refs[key].id))
    ),
    metafield(product.id, "regional_names", "list.single_line_text_field", JSON.stringify(override.regionalNames || commonRegionalNames))
  ];

  if (override.compatibilityClass) {
    inputs.push(metafield(product.id, "compatibility_class", "single_line_text_field", override.compatibilityClass));
  }

  if (!isCoconut) {
    inputs.push(metafield(product.id, "primary_deity", "single_line_text_field", "Varalakshmi / Lakshmi / Amman"));
    inputs.push(metafield(product.id, "primary_deity_ref", "metaobject_reference", refs.varalakshmi.id));
  }

  return inputs;
}

async function setMetafields(inputs) {
  if (!APPLY) {
    for (const input of inputs) {
      console.log(`[DRY-RUN METAFIELD] ${input.ownerId} ${input.namespace}.${input.key}=${input.value}`);
    }
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

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  await upsertPoojaDecorOrnamentType();

  const refs = {
    ornament: await metaobjectId("deity_ornament_type", handles.ornamentType),
    varalakshmi: await metaobjectId("deity_group", handles.varalakshmi),
    vishnu: await metaobjectId("deity_group", handles.vishnu),
    durga: await metaobjectId("deity_group", handles.durga)
  };
  const collection = await getCollection();
  const inputs = [
    ...collectionMetafields(collection, refs),
    ...collection.products.nodes.flatMap((product) => productMetafields(product, refs))
  ];

  console.log(`Collection: ${collection.title}`);
  console.log(`Products: ${collection.products.nodes.length}`);
  console.log(`Metafields: ${inputs.length}`);

  await setMetafields(inputs);
  console.log("Banana tree decor taxonomy updated.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
