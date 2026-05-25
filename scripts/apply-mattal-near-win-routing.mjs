import { readEnv } from "./meta-lib.mjs";

const APPLY = process.argv.includes("--apply");
const PRODUCT_HANDLE = "bharatanatyam-kemp-matil-temple-jewelry-ear-chain-bbm-019";
const KEMP_COLLECTION_HANDLE = "kemp-mattal-ear-chains";
const REGULAR_COLLECTION_HANDLE = "mattal-matil-bharatanatyam-dance";

const env = readEnv();
const shop = env.SHOPIFY_STORE_DOMAIN;
const token = env.SHOPIFY_ADMIN_TOKEN;
const apiVersion = env.SHOPIFY_API_VERSION || "2025-10";

if (!shop || !token) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN");
}

const regionalNames = [
  "mattal",
  "matil",
  "mattel",
  "ear mattal",
  "ear chain mattal",
  "mattal ear chain",
  "earrings mattal",
  "Bharatanatyam mattal",
  "Kuchipudi mattal",
  "kemp mattal",
  "real kemp mattal",
  "temple jewellery ear chain",
  "Bharatanatyam jewellery",
  "Kuchipudi jewellery",
  "classical dance jewellery",
  "arangetram jewellery",
];

const updates = {
  product: {
    title: "Real Kemp Ear Mattal for Bharatanatyam and Kuchipudi BBM019",
    seo: {
      title: "Real Kemp Ear Mattal & Mattal Ear Chain BBM019",
      description:
        "Shop real kemp ear mattal / mattal ear chain for Bharatanatyam and Kuchipudi stage use, arangetram styling and premium classical dance looks.",
    },
  },
  collections: {
    [KEMP_COLLECTION_HANDLE]: {
      seo: {
        title: "Real Kemp Ear Mattal & Mattal Ear Chains",
        description:
          "Shop real kemp ear mattal, mattal ear chains and matil/mattel styles for Bharatanatyam and Kuchipudi stage, arangetram and bridal classical looks.",
      },
      intro:
        "Real Kemp ear mattal and mattal ear chains for premium Bharatanatyam and Kuchipudi stage styling, arangetram ceremonies and long-term classical performance use.",
      fit:
        "Match mattal length with hairstyle, ear position, earring drop and side-hair support so the ear chain sits comfortably without pulling during performance.",
    },
    [REGULAR_COLLECTION_HANDLE]: {
      seo: {
        title: "Bharatanatyam Mattal & Ear Chains",
        description:
          "Shop Bharatanatyam mattal, matil and ear-chain styles for classical dance costumes. Choose by earring support, hairstyle placement, comfort and finish.",
      },
      intro:
        "Bharatanatyam ear mattal, matil and ear-chain styles for supporting earrings and completing the classical dance temple jewellery stage look.",
      fit:
        "Match mattal length with hairstyle, ear position and earring drop so the ear chain sits comfortably without pulling during performance.",
    },
  },
};

const current = await loadCurrent();
const product = current.product;
if (!product) throw new Error(`Missing product ${PRODUCT_HANDLE}`);

const kempCollection = current.kempCollection;
const regularCollection = current.regularCollection;
if (!kempCollection) throw new Error(`Missing collection ${KEMP_COLLECTION_HANDLE}`);
if (!regularCollection) throw new Error(`Missing collection ${REGULAR_COLLECTION_HANDLE}`);

const changes = {
  product: {
    handle: product.handle,
    currentTitle: product.title,
    nextTitle: updates.product.title,
    currentSeo: product.seo,
    nextSeo: updates.product.seo,
    currentCollections: product.collections.nodes.map((item) => item.handle),
    alreadyInKempMattalCollection: product.collections.nodes.some((item) => item.handle === KEMP_COLLECTION_HANDLE),
    nextRegionalNames: regionalNames,
  },
  collections: [
    summarizeCollection(kempCollection, updates.collections[KEMP_COLLECTION_HANDLE]),
    summarizeCollection(regularCollection, updates.collections[REGULAR_COLLECTION_HANDLE]),
  ],
};

if (APPLY) {
  await updateProduct(product);
  await setProductMetafields(product);
  await updateCollection(kempCollection, updates.collections[KEMP_COLLECTION_HANDLE]);
  await updateCollection(regularCollection, updates.collections[REGULAR_COLLECTION_HANDLE]);
}

console.log(JSON.stringify({ apply: APPLY, changes }, null, 2));

function summarizeCollection(collection, next) {
  return {
    handle: collection.handle,
    title: collection.title,
    currentSeo: collection.seo,
    nextSeo: next.seo,
    currentRegionalKeywordCluster: collection.metafields.nodes.find((item) => item.key === "regional_keyword_cluster")?.value || "",
    nextRegionalKeywordCluster: regionalNames,
  };
}

async function loadCurrent() {
  return gql(`
    query MattalNearWinCurrent {
      product: productByHandle(handle: "${PRODUCT_HANDLE}") {
        id
        title
        handle
        descriptionHtml
        seo { title description }
        collections(first: 20) { nodes { id title handle } }
      }
      kempCollection: collectionByHandle(handle: "${KEMP_COLLECTION_HANDLE}") {
        id
        title
        handle
        descriptionHtml
        seo { title description }
        metafields(first: 20, namespace: "custom") { nodes { key type value } }
      }
      regularCollection: collectionByHandle(handle: "${REGULAR_COLLECTION_HANDLE}") {
        id
        title
        handle
        descriptionHtml
        seo { title description }
        metafields(first: 20, namespace: "custom") { nodes { key type value } }
      }
    }
  `);
}

async function updateProduct(product) {
  const data = await gql(
    `mutation ProductUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        userErrors { field message }
      }
    }`,
    {
      input: {
        id: product.id,
        title: updates.product.title,
        descriptionHtml: productDescription(),
        seo: updates.product.seo,
      },
    },
  );
  const errors = data.productUpdate.userErrors || [];
  if (errors.length) throw new Error(`productUpdate ${product.handle}: ${JSON.stringify(errors)}`);
}

async function updateCollection(collection, next) {
  const data = await gql(
    `mutation CollectionUpdate($input: CollectionInput!) {
      collectionUpdate(input: $input) {
        userErrors { field message }
      }
    }`,
    {
      input: {
        id: collection.id,
        descriptionHtml: collectionDescription(next),
        seo: next.seo,
      },
    },
  );
  const errors = data.collectionUpdate.userErrors || [];
  if (errors.length) throw new Error(`collectionUpdate ${collection.handle}: ${JSON.stringify(errors)}`);

  await setMetafields([
    metafield(collection.id, "custom", "collection_intro", "multi_line_text_field", next.intro),
    metafield(collection.id, "custom", "size_fit_intro", "multi_line_text_field", next.fit),
    metafield(collection.id, "custom", "regional_keyword_cluster", "list.single_line_text_field", JSON.stringify(regionalNames)),
  ]);
}

async function setProductMetafields(product) {
  await setMetafields([
    metafield(product.id, "custom", "regional_names", "list.single_line_text_field", JSON.stringify(regionalNames)),
    metafield(
      product.id,
      "dance",
      "fit_notes",
      "multi_line_text_field",
      "Check ear-chain length, earring weight and side-hair placement so the ear mattal can be secured comfortably through a performance.",
    ),
    metafield(
      product.id,
      "dance",
      "size_notes",
      "multi_line_text_field",
      "Mattal fit is judged by chain length, earring placement, hairstyle support and whether the ear chain sits without pulling.",
    ),
  ]);
}

async function setMetafields(metafields) {
  const data = await gql(
    `mutation SetMetafields($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        userErrors { field message code }
      }
    }`,
    { metafields },
  );
  const errors = data.metafieldsSet.userErrors || [];
  if (errors.length) throw new Error(`metafieldsSet: ${JSON.stringify(errors)}`);
}

function metafield(ownerId, namespace, key, type, value) {
  return { ownerId, namespace, key, type, value: String(value) };
}

function productDescription() {
  return `
<p>Real kemp ear mattal / mattal ear chain for Bharatanatyam and Kuchipudi stage use, arangetram planning, senior performance and bridal classical styling. Use this piece beside the hairstyle when the dancer needs ear-chain support and a more complete temple jewellery side profile.</p>
<ul>
  <li>Check ear-chain length, earring weight and side-hair placement so the mattal can be secured comfortably through a performance.</li>
  <li>Regional names customers may use include mattal, matil, mattel, ear mattal, ear chain mattal and mattal ear chain.</li>
  <li>Real kemp is the premium Golden Collections range and should be matched carefully by stone color, finish, scale and the teacher's required component list.</li>
  <li>Material: real kemp stones with brass or copper base and high gold plating in the Golden Collections real kemp range.</li>
  <li>Keep away from water, perfume, sweat and harsh chemicals. After use, wipe gently with a soft dry cloth and store matching pieces separately in a dry box or pouch.</li>
</ul>
`.trim();
}

function collectionDescription(next) {
  return `<p>${next.intro}</p><p>${next.fit}</p>`;
}

async function gql(query, variables = {}) {
  const res = await fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) {
    throw new Error(`Shopify GraphQL error: ${JSON.stringify(json.errors || json)}`);
  }
  return json.data;
}
