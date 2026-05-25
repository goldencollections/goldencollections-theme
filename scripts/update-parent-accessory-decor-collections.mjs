#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const ENV_FILE = "env";
const HANDLE_FILTER = new Set(
  process.argv
    .filter((arg) => arg.startsWith("--handle="))
    .map((arg) => arg.slice("--handle=".length))
);

const COLLECTIONS = [
  {
    handle: "deity-accessories-nose-rings-mustache-weapons-taira",
    title: "Deity Accessories",
    displayTitle: "Deity Accessories",
    seoTitle: "Deity Accessories for God and Goddess Idols",
    seoDescription:
      "Shop deity accessories for idol alankaram, including nose rings, mustache, weapons, Taira, Bindi, Tilak, Shanku Chakra, eyes and arch pieces.",
    intro:
      "Shop small deity accessories for god and goddess idol alankaram, including nose rings, mustache ornaments, deity weapons, Taira headpieces, Bindi, Tilak, Thiruman, Shanku Chakra, eyes and arch pieces. Choose by deity symbol, placement, front size, material, included pieces and product photos.",
    fit:
      "For small deity accessories, match deity compatibility and placement first. Then compare the measured height, width, cm label or product photo scale with the idol face, forehead, hands, head, crown side or body area before ordering.",
    faqFamily: "accessory",
    role: "accessory",
    shoppingPathLabel: "Accessories",
    parentMenu: "deity-collection-circles",
    regionals: [
      "deity accessories",
      "god idol accessories",
      "goddess idol accessories",
      "alankaram accessories",
      "pooja idol accessories",
      "deity weapons",
      "deity nose ring",
      "deity mustache",
      "deity taira",
      "deity tilak",
      "Shanku Chakra",
      "Netra",
      "Prabhavali"
    ],
    subcollections: [
      "deity-eyes-for-god-idols-statues",
      "waist-belt-vaddanam-jewellery-for-hindu-gods-goddess-1",
      "god-goddess-arch",
      "deity-god-pustal-tadu-thali-kasulaperu",
      "god-deity-pendants",
      "buy-stone-nathu-bullaku-nose-rings-for-goddess-amman-jewelry",
      "buy-god-mustache-jewellery-deity-mustache-accessories-for-idols",
      "god-goddess-weapons",
      "buy-deity-taira-idol-sacred-taira-statues-for-pooja-and-worship",
      "deity-bindi-tilak-thiruman",
      "stone-shankh-chakra-gold-plated-shanku-chakra-for-vishnu-and-perumal"
    ],
    related: [
      "deity-necklace",
      "deity-crowns",
      "deity-earrings-for-god-idols-statues",
      "sacred-sanctum-decor"
    ]
  },
  {
    handle: "sacred-sanctum-decor",
    title: "Deity Decorative Items",
    displayTitle: "Decorative Items",
    seoTitle: "Deity Decorative Items for Pooja and Alankaram",
    seoDescription:
      "Shop deity decorative items for pooja setups, including banana trees, banana bunches, Lotus Asana, Peedam and coconut stands for kalasam and mandapam decor.",
    intro:
      "Shop deity decorative items for pooja, home temple, kalasam, mandapam and festive alankaram setups. This collection brings together reusable banana trees and banana bunches, Lotus Asana / Kamal Aasan, Peedam-style supports and coconut stands for Varalakshmi Vratham, Lakshmi Pooja, Satyanarayana Pooja and deity altar decoration.",
    fit:
      "For decorative items, compare the product height, length, width, base support and placement with your kalasam, idol, mandapam, altar shelf or pooja room space. Stands and Peedam items should be checked against the idol or coconut base size before ordering.",
    faqFamily: "decor",
    role: "decor",
    shoppingPathLabel: "Decor",
    parentMenu: "deity-collection-circles",
    regionals: [
      "deity decorative items",
      "pooja decor",
      "mandapam decor",
      "kalasam decor",
      "banana tree for pooja",
      "banana bunches",
      "Lotus Asana",
      "Kamal Aasan",
      "Thamarai Peedam",
      "Padma Peetam",
      "coconut stand",
      "Kalasam stand",
      "Varalakshmi decor"
    ],
    subcollections: [
      "banana-tree-banana-bunches-for-pooja-varamahalakshmi-vratham",
      "lotus-asana-deity-peedam-kamal-aasan",
      "coconut-stand"
    ],
    related: [
      "vara-lakshmi-dolls",
      "varalakshmi-doll-faces",
      "hands-legs-for-varalakshmi-idol",
      "vagamalai-thomala",
      "deity-accessories-nose-rings-mustache-weapons-taira"
    ]
  },
  {
    handle: "lotus-asana-deity-peedam-kamal-aasan",
    title: "Lotus Asana and Deity Peedam",
    displayTitle: "Lotus Asana",
    seoTitle: "Lotus Asana and Deity Peedam for Idol Alankaram",
    seoDescription:
      "Shop Lotus Asana, Kamal Aasan, Thamarai Peedam and Padma Peetam for Varalakshmi, Lakshmi, Devi and deity idol alankaram. Choose by length and base fit.",
    intro:
      "Shop Lotus Asana, Kamal Aasan, Thamarai Peedam and Padma Peetam for deity idol alankaram and pooja decor. These lotus-style supports are used below or behind Varalakshmi, Lakshmi, Devi and goddess idol setups when the base size and placement fit.",
    fit:
      "For Lotus Asana and Peedam items, the current Length option means the measured length across the lotus support. Compare that length with the idol base, dress spread, kalasam area and altar depth before ordering.",
    faqFamily: "decor",
    role: "decor",
    shoppingPathLabel: "Lotus Asana",
    parentMenu: "deity-collection-circles",
    regionals: [
      "Lotus Asana",
      "Kamal Aasan",
      "Thamarai Peedam",
      "Padma Peetam",
      "Lotus Peedam",
      "Lotus stand",
      "Deity Peedam",
      "Varalakshmi lotus",
      "Lakshmi lotus asana"
    ],
    related: [
      "sacred-sanctum-decor",
      "banana-tree-banana-bunches-for-pooja-varamahalakshmi-vratham",
      "coconut-stand",
      "vara-lakshmi-dolls"
    ]
  },
  {
    handle: "coconut-stand",
    title: "Coconut Stand for Pooja",
    displayTitle: "Coconut Stand",
    seoTitle: "Coconut Stand for Pooja and Kalasam Decoration",
    seoDescription:
      "Shop coconut stands and kalasam support stands for Varalakshmi Pooja, Lakshmi Pooja, temple rituals and home mandapam decoration. Choose by length, width and support style.",
    intro:
      "Shop coconut stands and kalasam support stands for Varalakshmi Pooja, Lakshmi Pooja, home temple rituals and mandapam decoration. Choose by support style, length, width, coconut or kalasam base fit and the product photos.",
    fit:
      "For coconut stands, Length means the measured stand length or vertical stem length shown by the variant. Width means the front/base width where provided. Compare the stand with your coconut, kalasam, flower decoration and pooja space before ordering.",
    faqFamily: "decor",
    role: "decor",
    shoppingPathLabel: "Stand",
    parentMenu: "deity-collection-circles",
    regionals: [
      "coconut stand",
      "Kalasam stand",
      "pooja coconut support",
      "coconut holder",
      "Varalakshmi coconut stand",
      "Lakshmi Pooja stand",
      "mandapam stand",
      "flower stand stick"
    ],
    related: [
      "sacred-sanctum-decor",
      "banana-tree-banana-bunches-for-pooja-varamahalakshmi-vratham",
      "lotus-asana-deity-peedam-kamal-aasan",
      "vara-lakshmi-dolls"
    ]
  }
];

const env = readEnv(ENV_FILE);
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const GRAPHQL_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;

if (!SHOP || !TOKEN) {
  console.error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
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

function metafield(ownerId, namespace, key, type, value) {
  return { ownerId, namespace, key, type, value: String(value) };
}

async function collectionByHandle(handle) {
  const data = await gql(
    `query Collection($handle: String!) {
      collectionByHandle(handle: $handle) {
        id handle title sortOrder products(first: 250) { nodes { id status totalInventory images(first: 1) { nodes { id } } } }
      }
    }`,
    { handle }
  );
  return data.collectionByHandle;
}

async function collectionRefs(handles) {
  const refs = {};
  for (const handle of handles) {
    const collection = await collectionByHandle(handle);
    if (collection) refs[handle] = collection;
  }
  return refs;
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

async function updateCollection(collection, config, refs) {
  const descriptionHtml = `<p>${config.intro}</p><p>${config.fit}</p>`;
  if (!APPLY) {
    console.log(`[DRY COLLECTION] ${collection.handle}: ${collection.title} -> ${config.title}`);
  } else {
    const data = await gql(
      `mutation CollectionUpdate($input: CollectionInput!) {
        collectionUpdate(input: $input) { userErrors { field message } }
      }`,
      {
        input: {
          id: collection.id,
          title: config.title,
          descriptionHtml,
          templateSuffix: "deity-ornament-default",
          sortOrder: "MANUAL",
          seo: {
            title: config.seoTitle,
            description: config.seoDescription
          }
        }
      }
    );
    const errors = data.collectionUpdate.userErrors || [];
    if (errors.length) throw new Error(`collectionUpdate ${collection.handle}: ${JSON.stringify(errors)}`);
  }

  const subcollectionIds = (config.subcollections || []).map((handle) => refs[handle]?.id).filter(Boolean);
  const relatedIds = (config.related || []).map((handle) => refs[handle]?.id).filter(Boolean);
  const fields = [
    metafield(collection.id, "custom", "display_title", "single_line_text_field", config.displayTitle),
    metafield(collection.id, "custom", "collection_intro", "multi_line_text_field", config.intro),
    metafield(collection.id, "custom", "size_fit_intro", "multi_line_text_field", config.fit),
    metafield(collection.id, "custom", "faq_family", "single_line_text_field", config.faqFamily),
    metafield(collection.id, "custom", "collection_role", "single_line_text_field", config.role),
    metafield(collection.id, "custom", "deity_first_enabled", "boolean", "true"),
    metafield(collection.id, "custom", "shopping_path_label", "single_line_text_field", config.shoppingPathLabel),
    metafield(collection.id, "custom", "parent_menu_handles", "single_line_text_field", config.parentMenu),
    metafield(collection.id, "custom", "regional_keyword_cluster", "list.single_line_text_field", JSON.stringify(config.regionals))
  ];
  if (subcollectionIds.length) fields.push(metafield(collection.id, "custom", "subcollections", "list.collection_reference", JSON.stringify(subcollectionIds)));
  if (relatedIds.length) fields.push(metafield(collection.id, "custom", "related_collection_refs", "list.collection_reference", JSON.stringify(relatedIds)));
  await setMetafields(fields);
}

function sortBucket(product) {
  if (product.status === "ACTIVE" && product.images.nodes.length > 0 && product.totalInventory > 0) return 0;
  if (product.status === "ACTIVE" && product.images.nodes.length > 0) return 1;
  if (product.status === "ACTIVE") return 2;
  return 3;
}

async function reorder(collection) {
  const ordered = [...collection.products.nodes].sort((a, b) => sortBucket(a) - sortBucket(b));
  const moves = ordered.map((product, index) => ({ id: product.id, newPosition: String(index) }));
  if (!moves.length) return;
  if (!APPLY) {
    console.log(`[DRY REORDER] ${collection.handle}: ${moves.length} products`);
    return;
  }
  const data = await gql(
    `mutation Reorder($id: ID!, $moves: [MoveInput!]!) {
      collectionReorderProducts(id: $id, moves: $moves) { job { id done } userErrors { field message } }
    }`,
    { id: collection.id, moves }
  );
  const errors = data.collectionReorderProducts.userErrors || [];
  if (errors.length) throw new Error(`collectionReorderProducts ${collection.handle}: ${JSON.stringify(errors)}`);
  const job = data.collectionReorderProducts.job;
  if (job && !job.done) await waitForJob(job.id);
}

async function waitForJob(jobId) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const data = await gql(`query Job($id: ID!) { job(id: $id) { id done } }`, { id: jobId });
    if (data.job?.done) return;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error(`Timed out waiting for job ${jobId}`);
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  const allRefHandles = [...new Set(COLLECTIONS.flatMap((config) => [config.handle, ...(config.subcollections || []), ...(config.related || [])]))];
  const refs = await collectionRefs(allRefHandles);
  for (const config of COLLECTIONS.filter((item) => !HANDLE_FILTER.size || HANDLE_FILTER.has(item.handle))) {
    const collection = refs[config.handle];
    if (!collection) throw new Error(`Collection not found: ${config.handle}`);
    await updateCollection(collection, config, refs);
    await reorder(collection);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
