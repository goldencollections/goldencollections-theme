import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const ENV_FILE = "env";
const COLLECTION_HANDLE = "deity-long-harams";
const QUESTIONS_FILE = "tmp/reviews/deity-long-harams-owner-questions.csv";

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

if (!SHOP || !TOKEN) {
  console.error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN");
  process.exit(1);
}

const COLLECTION_UPDATE = {
  title: "Deity Long Haram and Long Necklace",
  bodyHtml:
    "<p>Shop deity long harams and long necklaces for Hindu god and goddess idol alankaram. These ornaments are chosen when the jewellery should fall lower across the idol body, dress, chest or altar decoration area.</p><p>Compare the product Length x Width, step style, color and measurement photos with your idol before ordering. Long harams can suit different god and goddess idols when the measured length, width and placement match.</p>",
  seoTitle: "Deity Long Haram & Long Necklace for Idols",
  seoDescription:
    "Shop deity long harams and long necklaces for Hindu god and goddess idols. Choose by Length x Width, step style, color, placement and measured photos.",
  metafields: {
    display_title: "Long Haram and Long Necklace",
    collection_intro:
      "Long harams and long deity necklaces for Hindu god and goddess idols when jewellery should fall lower across the body, dress or chest area.",
    size_fit_intro:
      "Compare product Length x Width with your idol height, chest width, dress drape and the lower placement area before ordering.",
    faq_family: "necklace",
    collection_role: "ornament_first",
    deity_first_enabled: "true",
    shopping_path_label: "Long Haram / Necklace",
    regional_keyword_cluster: [
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
    ]
  }
};

function metafield(ownerId, namespace, key, type, value) {
  return { ownerId, namespace, key, type, value };
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

async function fetchCollection() {
  let after = null;
  let collection = null;
  const products = [];

  do {
    const data = await gql(
      `query Collection($after: String) {
        collectionByHandle(handle: "deity-long-harams") {
          id
          title
          handle
          products(first: 50, after: $after, sortKey: COLLECTION_DEFAULT) {
            pageInfo { hasNextPage endCursor }
            nodes {
              id
              handle
              title
              status
              totalInventory
              variants(first: 20) {
                nodes { inventoryQuantity inventoryPolicy selectedOptions { name value } }
              }
            }
          }
        }
      }`,
      { after }
    );
    if (!data.collectionByHandle) throw new Error(`Collection not found: ${COLLECTION_HANDLE}`);
    collection = data.collectionByHandle;
    products.push(...collection.products.nodes);
    after = collection.products.pageInfo.hasNextPage ? collection.products.pageInfo.endCursor : null;
  } while (after);

  return { collection, products };
}

async function fetchOrnamentRef() {
  const data = await gql(
    `query {
      metaobjectByHandle(handle: { type: "deity_ornament_type", handle: "long-haram" }) {
        id
        displayName
        handle
      }
    }`
  );
  if (!data.metaobjectByHandle) throw new Error("Missing deity_ornament_type:long-haram");
  return data.metaobjectByHandle;
}

function isAvailable(product) {
  return (
    product.status === "ACTIVE" &&
    product.variants.nodes.some((variant) => variant.inventoryPolicy === "CONTINUE" || (variant.inventoryQuantity ?? 0) > 0)
  );
}

async function updateCollection(collection, ornamentRef) {
  if (!APPLY) {
    console.log(`[DRY COLLECTION] ${collection.title} -> ${COLLECTION_UPDATE.title}`);
    return;
  }

  const updated = await gql(
    `mutation CollectionUpdate($input: CollectionInput!) {
      collectionUpdate(input: $input) {
        collection { id title seo { title description } }
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
  if (updated.collectionUpdate.userErrors.length) {
    throw new Error(`collectionUpdate: ${JSON.stringify(updated.collectionUpdate.userErrors)}`);
  }

  const fields = [
    metafield(collection.id, "custom", "display_title", "single_line_text_field", COLLECTION_UPDATE.metafields.display_title),
    metafield(collection.id, "custom", "collection_intro", "multi_line_text_field", COLLECTION_UPDATE.metafields.collection_intro),
    metafield(collection.id, "custom", "size_fit_intro", "multi_line_text_field", COLLECTION_UPDATE.metafields.size_fit_intro),
    metafield(collection.id, "custom", "faq_family", "single_line_text_field", COLLECTION_UPDATE.metafields.faq_family),
    metafield(collection.id, "custom", "collection_role", "single_line_text_field", COLLECTION_UPDATE.metafields.collection_role),
    metafield(collection.id, "custom", "deity_first_enabled", "boolean", COLLECTION_UPDATE.metafields.deity_first_enabled),
    metafield(collection.id, "custom", "shopping_path_label", "single_line_text_field", COLLECTION_UPDATE.metafields.shopping_path_label),
    metafield(collection.id, "custom", "ornament_type_ref", "metaobject_reference", ornamentRef.id),
    metafield(collection.id, "custom", "ornament_type_refs", "list.metaobject_reference", JSON.stringify([ornamentRef.id])),
    metafield(
      collection.id,
      "custom",
      "regional_keyword_cluster",
      "list.single_line_text_field",
      JSON.stringify(COLLECTION_UPDATE.metafields.regional_keyword_cluster)
    )
  ];

  const set = await gql(
    `mutation SetMetafields($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { namespace key value }
        userErrors { field message code }
      }
    }`,
    { metafields: fields }
  );
  if (set.metafieldsSet.userErrors.length) {
    throw new Error(`metafieldsSet: ${JSON.stringify(set.metafieldsSet.userErrors)}`);
  }
}

async function reorderInStockFirst(collection, products) {
  const desired = [
    ...products.filter(isAvailable),
    ...products.filter((product) => product.status === "ACTIVE" && !isAvailable(product)),
    ...products.filter((product) => product.status !== "ACTIVE")
  ];
  const moves = desired.map((product, index) => ({ id: product.id, newPosition: String(index) }));
  if (!APPLY) {
    console.log(`[DRY REORDER] ${moves.length} products; first sold-out would move after ${products.filter(isAvailable).length} in-stock products.`);
    return;
  }

  for (let index = 0; index < moves.length; index += 250) {
    const chunk = moves.slice(index, index + 250);
    const data = await gql(
      `mutation Reorder($id: ID!, $moves: [MoveInput!]!) {
        collectionReorderProducts(id: $id, moves: $moves) {
          job { id done }
          userErrors { field message }
        }
      }`,
      { id: collection.id, moves: chunk }
    );
    if (data.collectionReorderProducts.userErrors.length) {
      throw new Error(`collectionReorderProducts: ${JSON.stringify(data.collectionReorderProducts.userErrors)}`);
    }

    const jobId = data.collectionReorderProducts.job?.id;
    if (!jobId) continue;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const job = await gql(`query Job($id: ID!) { job(id: $id) { id done } }`, { id: jobId });
      if (job.job?.done) break;
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
}

function writeQuestions(products) {
  fs.mkdirSync("tmp/reviews", { recursive: true });
  const rows = [
    ["scope", "handle", "title", "question", "why_needed", "suggested_default_if_confirmed"],
    [
      "collection",
      COLLECTION_HANDLE,
      COLLECTION_UPDATE.title,
      "Is the material for deity long harams also Alloy metal with stone work?",
      "Needed before filling product material metafields across all products.",
      "Alloy metal with stone work"
    ],
    [
      "collection",
      COLLECTION_HANDLE,
      COLLECTION_UPDATE.title,
      "Are all long haram products single harams unless a product explicitly says set?",
      "Needed before filling component_count and set_items_included.",
      "Single long haram / long necklace"
    ],
    [
      "collection",
      COLLECTION_HANDLE,
      COLLECTION_UPDATE.title,
      "Does Size in Inches (L x W) mean Length x Width for long harams, same as short necklaces?",
      "Needed before filling ornament measurement metafields.",
      "Yes: first number is length, second number is width"
    ],
    [
      "collection",
      COLLECTION_HANDLE,
      COLLECTION_UPDATE.title,
      "Should Chest style long harams follow the same rule as Chest Necklace: only Venkateshwara/Balaji/Vishnu/Perumal plus goddess?",
      "Needed before assigning compatible and not-for deity refs.",
      "Yes, same chest rule as Chest Necklace"
    ],
    [
      "collection",
      COLLECTION_HANDLE,
      COLLECTION_UPDATE.title,
      "Do 1 Step, 2 Step, 3 Step and 5 Step mean necklace rows/layers for long harams?",
      "Needed for product copy, FAQ and filter language.",
      "Yes: number of necklace rows/layers"
    ]
  ];

  fs.writeFileSync(QUESTIONS_FILE, rows.map((row) => row.map(csv).join(",")).join("\n"));
  console.log(`Questions written: ${QUESTIONS_FILE}`);
  console.log(`Products reviewed for questions: ${products.length}`);
}

function csv(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  const [{ collection, products }, ornamentRef] = await Promise.all([fetchCollection(), fetchOrnamentRef()]);
  console.log(`Collection: ${collection.title}`);
  console.log(`Products attached: ${products.length}; active=${products.filter((p) => p.status === "ACTIVE").length}; in_stock=${products.filter(isAvailable).length}`);
  await updateCollection(collection, ornamentRef);
  await reorderInStockFirst(collection, products);
  writeQuestions(products);
  console.log("Deity long haram safe pass complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
