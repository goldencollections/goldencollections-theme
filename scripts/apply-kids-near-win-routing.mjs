import { readEnv } from "./meta-lib.mjs";

const APPLY = process.argv.includes("--apply");
const PRODUCT_HANDLE = "enchanting-bharatanatyam-jewellery-set-for-kids-little-gopika";
const KIDS_COLLECTION_HANDLE = "bharatnatyam-dance-jewellery-kids-collection";

const env = readEnv();
const shop = env.SHOPIFY_STORE_DOMAIN;
const token = env.SHOPIFY_ADMIN_TOKEN;
const apiVersion = env.SHOPIFY_API_VERSION || "2025-10";

if (!shop || !token) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN");
}

const keywordCluster = [
  "kids jewellery set",
  "kids jewellery sets",
  "children's jewellery set",
  "children's Bharatanatyam jewellery set",
  "kids Bharatanatyam jewellery",
  "Bharatanatyam jewellery for kids",
  "Indian dance jewellery for kids",
  "South Indian jewellery for children",
  "kids dance jewellery set",
  "young dancer jewellery",
  "Little Gopika jewellery set",
  "Bharatanatyam jewellery",
  "Kuchipudi jewellery",
  "classical dance jewellery",
];

const productSeo = {
  title: "Kids Jewellery Set for Bharatanatyam | Little Gopika",
  description:
    "Shop Little Gopika kids jewellery set for Bharatanatyam and Kuchipudi class, school programs and stage use. Check included pieces, costume fit and teacher list.",
};

const collectionUpdate = {
  seo: {
    title: "Kids Bharatanatyam Jewellery Sets",
    description:
      "Shop kids Bharatanatyam jewellery sets and children's dance jewellery for school programs, class, Kuchipudi styling and stage performances.",
  },
  intro:
    "Kids Bharatanatyam jewellery sets for young dancers, school programs, cultural events, class, Kuchipudi styling and junior stage performances.",
  fit:
    "Compare product photos, included pieces, necklace drop, waist belt length, headset placement, earring comfort, costume size and the teacher's required list before ordering.",
};

const current = await loadCurrent();
const product = current.product;
const collection = current.collection;
if (!product) throw new Error(`Missing product ${PRODUCT_HANDLE}`);
if (!collection) throw new Error(`Missing collection ${KIDS_COLLECTION_HANDLE}`);

const changes = {
  product: {
    handle: product.handle,
    currentTitle: product.title,
    nextTitle: product.title,
    currentSeo: product.seo,
    nextSeo: productSeo,
    currentCollections: product.collections.nodes.map((item) => item.handle),
    alreadyInKidsCollection: product.collections.nodes.some((item) => item.handle === KIDS_COLLECTION_HANDLE),
    currentGoogleAgeGroup: product.google.nodes.find((item) => item.key === "age_group")?.value || "",
    nextGoogleAgeGroup: "kids",
    nextRegionalNames: keywordCluster,
  },
  collection: {
    handle: collection.handle,
    currentSeo: collection.seo,
    nextSeo: collectionUpdate.seo,
    currentRegionalKeywordCluster: collection.metafields.nodes.find((item) => item.key === "regional_keyword_cluster")?.value || "",
    nextRegionalKeywordCluster: keywordCluster,
  },
};

if (APPLY) {
  await updateProduct(product);
  await setProductMetafields(product);
  await updateCollection(collection);
}

console.log(JSON.stringify({ apply: APPLY, changes }, null, 2));

async function loadCurrent() {
  return gql(`
    query KidsNearWinCurrent {
      product: productByHandle(handle: "${PRODUCT_HANDLE}") {
        id
        title
        handle
        descriptionHtml
        seo { title description }
        collections(first: 20) { nodes { id title handle } }
        google: metafields(first: 20, namespace: "mm-google-shopping") { nodes { key type value } }
      }
      collection: collectionByHandle(handle: "${KIDS_COLLECTION_HANDLE}") {
        id
        title
        handle
        descriptionHtml
        seo { title description }
        metafields(first: 30, namespace: "custom") { nodes { key type value } }
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
        descriptionHtml: productDescription(),
        seo: productSeo,
      },
    },
  );
  const errors = data.productUpdate.userErrors || [];
  if (errors.length) throw new Error(`productUpdate ${product.handle}: ${JSON.stringify(errors)}`);
}

async function updateCollection(collection) {
  const data = await gql(
    `mutation CollectionUpdate($input: CollectionInput!) {
      collectionUpdate(input: $input) {
        userErrors { field message }
      }
    }`,
    {
      input: {
        id: collection.id,
        descriptionHtml: collectionDescription(),
        seo: collectionUpdate.seo,
      },
    },
  );
  const errors = data.collectionUpdate.userErrors || [];
  if (errors.length) throw new Error(`collectionUpdate ${collection.handle}: ${JSON.stringify(errors)}`);

  await setMetafields([
    metafield(collection.id, "custom", "collection_intro", "multi_line_text_field", collectionUpdate.intro),
    metafield(collection.id, "custom", "size_fit_intro", "multi_line_text_field", collectionUpdate.fit),
    metafield(collection.id, "custom", "regional_keyword_cluster", "list.single_line_text_field", JSON.stringify(keywordCluster)),
  ]);
}

async function setProductMetafields(product) {
  await setMetafields([
    metafield(product.id, "custom", "regional_names", "list.single_line_text_field", JSON.stringify(keywordCluster)),
    metafield(product.id, "global", "title_tag", "string", productSeo.title),
    metafield(product.id, "global", "description_tag", "string", productSeo.description),
    metafield(
      product.id,
      "dance",
      "fit_notes",
      "multi_line_text_field",
      "Choose by dancer age group, costume size, comfort and teacher component list. Check product photos for included pieces and confirm any missing component before ordering for a school program, class or stage performance.",
    ),
    metafield(
      product.id,
      "dance",
      "size_notes",
      "multi_line_text_field",
      "Kids dance sets should be matched to the child's costume size, height, neckline, hairstyle and comfort. Do not assume one kids jewellery set fits every child; compare photos and measurements before ordering.",
    ),
    metafield(product.id, "mm-google-shopping", "age_group", "string", "kids"),
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
<p>Little Gopika kids jewellery set for Bharatanatyam and Kuchipudi costume planning. Use this children's dance jewellery set when the young dancer needs a coordinated regular dance look for class, school programs, dance institute performances or stage use.</p>
<ul>
  <li>Choose by dancer age group, costume size, comfort and teacher component list. Check product photos for included pieces before ordering.</li>
  <li>Kids dance sets should be matched to the child's costume size, height, neckline, hairstyle and comfort. Do not assume one kids jewellery set fits every child.</li>
  <li>For arangetram, many buyers choose premium real kemp jewellery; confirm the teacher's required component list and performance standard before ordering a regular set.</li>
  <li>Search terms customers may use include kids jewellery set, children's jewellery set, kids Bharatanatyam jewellery and Indian dance jewellery for kids.</li>
  <li>Keep away from water, perfume and sweat after use. Store each component separately in a dry box or pouch so stones, joints and gold finish are protected.</li>
</ul>
`.trim();
}

function collectionDescription() {
  return `<p>${collectionUpdate.intro}</p><p>${collectionUpdate.fit}</p>`;
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
