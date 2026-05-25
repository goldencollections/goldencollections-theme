#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const ENV_FILE = getArg("--env") || "env";
const HANDLE = "banana-tree-banana-bunches-for-pooja-varamahalakshmi-vratham";

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

const update = {
  title: "Banana Tree & Banana Bunches for Pooja",
  body_html:
    "<p>Decorate your Varalakshmi Vratham, Lakshmi Pooja or temple mandapam with reusable artificial banana trees, banana bunches and coconut tree decor. These South Indian pooja decoration pieces are used beside the kalasam, deity idol, doorway, mandapam or altar to create an auspicious festive setup without needing fresh banana stems. Choose by height, width, style and placement; product pages show measurement photos so you can compare with your pooja space before ordering.</p>",
  seo_title: "Banana Tree & Bunches for Pooja | Varalakshmi Decor",
  seo_description:
    "Shop artificial banana tree pairs and banana bunches for Varalakshmi Vratham, Lakshmi Pooja, temple rituals and wedding mandapam decor. India & worldwide shipping.",
  metafields: {
    display_title: "Banana Tree & Bunches",
    collection_intro:
      "Decorate your Varalakshmi Vratham, Lakshmi Pooja or temple mandapam with reusable artificial banana trees, banana bunches and coconut tree decor. These South Indian pooja decoration pieces are used beside the kalasam, deity idol, doorway, mandapam or altar to create an auspicious festive setup without needing fresh banana stems. Choose by height, width, style and placement; product pages show measurement photos so you can compare with your pooja space before ordering.",
    size_fit_intro:
      "Measure the space beside your idol, kalasam, altar, doorway or mandapam. Compare product height, width, quantity and placement style with the measurement photos before ordering.",
    faq_family: "banana_tree_decor",
    regional_keyword_cluster: [
      "banana tree for pooja",
      "artificial banana tree",
      "banana bunch for pooja",
      "plantain tree decoration",
      "vazhai maram",
      "vazhamaram",
      "Varalakshmi banana tree",
      "Varalakshmi Vratham decoration",
      "Vara Mahalakshmi Vratam decor",
      "Varamahalakshmi Habba decoration"
    ]
  }
};

function getArg(flag) {
  const i = process.argv.indexOf(flag);
  if (i === -1 || i + 1 >= process.argv.length) return null;
  return process.argv[i + 1];
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
        return [line.slice(0, index), line.slice(index + 1)];
      })
  );
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

async function findCollection(handle) {
  const custom = await rest(`/custom_collections.json?handle=${encodeURIComponent(handle)}&limit=1`);
  if (custom.custom_collections?.[0]) return { kind: "custom_collection", collection: custom.custom_collections[0] };

  const smart = await rest(`/smart_collections.json?handle=${encodeURIComponent(handle)}&limit=1`);
  if (smart.smart_collections?.[0]) return { kind: "smart_collection", collection: smart.smart_collections[0] };

  return null;
}

function collectionGid(id) {
  return `gid://shopify/Collection/${id}`;
}

function metafield(ownerId, key, type, value) {
  return { ownerId, namespace: "custom", key, type, value };
}

async function updateCollection(kind, collection) {
  if (!APPLY) {
    console.log(`[DRY-RUN COLLECTION UPDATE] ${kind} ${collection.id} ${HANDLE}`);
    return;
  }

  const data = await gql(
    `mutation CollectionUpdate($input: CollectionInput!) {
      collectionUpdate(input: $input) {
        collection { id handle title descriptionHtml templateSuffix seo { title description } }
        userErrors { field message }
      }
    }`,
    {
      input: {
        id: collectionGid(collection.id),
        title: update.title,
        descriptionHtml: update.body_html,
        templateSuffix: "deity-ornament-default",
        seo: {
          title: update.seo_title,
          description: update.seo_description
        }
      }
    }
  );
  const errors = data.collectionUpdate.userErrors || [];
  if (errors.length) throw new Error(`collectionUpdate: ${JSON.stringify(errors)}`);
  console.log(`[COLLECTION UPDATED] ${data.collectionUpdate.collection.handle}`);
}

async function setMetafields(collectionId) {
  const ownerId = collectionGid(collectionId);
  const inputs = [
    metafield(ownerId, "display_title", "single_line_text_field", update.metafields.display_title),
    metafield(ownerId, "collection_intro", "multi_line_text_field", update.metafields.collection_intro),
    metafield(ownerId, "size_fit_intro", "multi_line_text_field", update.metafields.size_fit_intro),
    metafield(ownerId, "faq_family", "single_line_text_field", update.metafields.faq_family),
    metafield(
      ownerId,
      "regional_keyword_cluster",
      "list.single_line_text_field",
      JSON.stringify(update.metafields.regional_keyword_cluster)
    )
  ];

  if (!APPLY) {
    console.log(`[DRY-RUN METAFIELDS] ${inputs.map((field) => field.key).join(", ")}`);
    return;
  }

  const data = await gql(
    `mutation SetMetafields($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { id namespace key type value }
        userErrors { field message code }
      }
    }`,
    { metafields: inputs }
  );
  const errors = data.metafieldsSet.userErrors || [];
  if (errors.length) throw new Error(`metafieldsSet: ${JSON.stringify(errors)}`);
  console.log(`[METAFIELDS UPDATED] ${HANDLE}`);
}

async function main() {
  const found = await findCollection(HANDLE);
  if (!found) throw new Error(`Collection not found: ${HANDLE}`);

  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  console.log(`Collection: ${found.kind} ${found.collection.id} ${found.collection.handle}`);

  await updateCollection(found.kind, found.collection);
  await setMetafields(found.collection.id);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
