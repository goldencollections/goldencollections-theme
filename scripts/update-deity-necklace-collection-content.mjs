import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const ENV_FILE = "env";
const COLLECTION_HANDLE = "deity-necklace";

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

const UPDATE = {
  title: "Deity Necklaces",
  bodyHtml:
    "<p>Shop deity necklaces for Hindu god and goddess idol alankaram, including short necklaces for neck or upper-chest placement and long harams for lower chest, body or dress drape. Choose by product Length x Width, idol height, placement, step style, color and measurement photos.</p><p>Short necklaces sit closer to the idol neck or upper chest. Long harams fall lower for a fuller alankaram look. Chest Necklace and Chest Long Haram styles are suitable only for Venkateshwara, Balaji, Vishnu, Perumal and goddess idols. Review each product's measurement photos before ordering.</p>",
  seoTitle: "Deity Necklaces for Idols | Short Necklace & Long Haram",
  seoDescription:
    "Shop deity necklaces for god and goddess idols, including short necklaces and long harams. Choose by Length x Width, idol size, placement and measured photos.",
  metafields: {
    display_title: "Deity Necklaces",
    collection_intro:
      "Deity short necklaces and long harams for Hindu god and goddess idol alankaram. Browse both necklace placements together, then use each product's measurement photos to compare Length x Width with the idol neck, chest, body or dress placement.",
    size_fit_intro:
      "Choose short necklaces for neck or upper-chest placement and long harams for lower chest, body or dress drape. Compare product Length x Width with idol height, chest width and dress placement before ordering.",
    faq_family: "necklace",
    collection_role: "ornament_first",
    deity_first_enabled: "true",
    shopping_path_label: "Short Necklace / Long Haram",
    regional_keyword_cluster: [
      "deity necklace",
      "deity short necklace",
      "deity long haram",
      "deity long necklace",
      "short necklace for god idol",
      "long haram for god idol",
      "long necklace for god idol",
      "short necklace for goddess idol",
      "long haram for goddess idol",
      "idol necklace",
      "god necklace",
      "goddess necklace",
      "haram",
      "haar",
      "mala",
      "malai",
      "alankaram necklace",
      "temple deity necklace",
      "swamy alankaram necklace",
      "amman necklace",
      "ammavaru necklace",
      "lakshmi necklace",
      "venkateshwara necklace",
      "balaji long haram",
      "vishnu long haram"
    ]
  }
};

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

async function fetchCollection() {
  const data = await gql(
    `query Collection($handle: String!) {
      collectionByHandle(handle: $handle) {
        id
        handle
        title
        productsCount { count }
      }
    }`,
    { handle: COLLECTION_HANDLE }
  );
  if (!data.collectionByHandle) throw new Error(`Missing collection ${COLLECTION_HANDLE}`);
  return data.collectionByHandle;
}

async function updateCollection(collection) {
  if (!APPLY) {
    console.log(`[DRY COLLECTION] ${collection.title} -> ${UPDATE.title}`);
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
        title: UPDATE.title,
        descriptionHtml: UPDATE.bodyHtml,
        templateSuffix: "deity-ornament-default",
        seo: {
          title: UPDATE.seoTitle,
          description: UPDATE.seoDescription
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
  const data = await gql(
    `mutation SetMetafields($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        userErrors { field message code }
      }
    }`,
    { metafields: inputs }
  );
  const errors = data.metafieldsSet.userErrors || [];
  if (errors.length) throw new Error(`metafieldsSet: ${JSON.stringify(errors)}`);
}

function collectionMetafields(collection) {
  return [
    metafield(collection.id, "custom", "display_title", "single_line_text_field", UPDATE.metafields.display_title),
    metafield(collection.id, "custom", "collection_intro", "multi_line_text_field", UPDATE.metafields.collection_intro),
    metafield(collection.id, "custom", "size_fit_intro", "multi_line_text_field", UPDATE.metafields.size_fit_intro),
    metafield(collection.id, "custom", "faq_family", "single_line_text_field", UPDATE.metafields.faq_family),
    metafield(collection.id, "custom", "collection_role", "single_line_text_field", UPDATE.metafields.collection_role),
    metafield(collection.id, "custom", "deity_first_enabled", "boolean", UPDATE.metafields.deity_first_enabled),
    metafield(collection.id, "custom", "shopping_path_label", "single_line_text_field", UPDATE.metafields.shopping_path_label),
    metafield(
      collection.id,
      "custom",
      "regional_keyword_cluster",
      "list.single_line_text_field",
      JSON.stringify(UPDATE.metafields.regional_keyword_cluster)
    )
  ];
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  const collection = await fetchCollection();
  console.log(`Collection: ${collection.title}; products=${collection.productsCount.count}`);
  await updateCollection(collection);
  await setMetafields(collectionMetafields(collection));
  console.log("Deity necklace parent collection content update complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
