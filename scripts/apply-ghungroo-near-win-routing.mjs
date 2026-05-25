import { readEnv } from "./meta-lib.mjs";

const APPLY = process.argv.includes("--apply");
const PRODUCT_CONFIGS = [
  {
    handle: "50-bells-ghungroo-kathak-dance-performance",
    title: "Bharatanatyam and Kathak Ghungroo Salangai 50 Bells BDG-020",
    seoTitle: "Bharatanatyam & Kathak Ghungroo 50 Bells | Salangai",
    seoDescription:
      "Shop 50-bell ghungroo/salangai for Bharatanatyam, Kuchipudi and Kathak practice, class and stage use. Choose by strap comfort, sound and teacher preference.",
    bellCount: 50,
  },
  {
    handle: "100-bells-ghungroo-kathak-dance-performance",
    title: "Bharatanatyam and Kathak Ghungroo Salangai 100 Bells BDG-021",
    seoTitle: "Bharatanatyam & Kathak Ghungroo 100 Bells | Salangai",
    seoDescription:
      "Shop 100-bell ghungroo/salangai for Bharatanatyam, Kuchipudi and Kathak practice, class and stage use. Choose by strap comfort, sound and teacher preference.",
    bellCount: 100,
  },
];

const GHUNGROO_COLLECTION_HANDLE = "bharatanatyam-ghungroo";
const env = readEnv();
const shop = env.SHOPIFY_STORE_DOMAIN;
const token = env.SHOPIFY_ADMIN_TOKEN;
const apiVersion = env.SHOPIFY_API_VERSION || "2025-10";

if (!shop || !token) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN");
}

const regionalNames = [
  "ghungroo",
  "ghunghroo",
  "salangai",
  "chilanka",
  "chilanga",
  "gejje",
  "ankle bells",
  "dance anklets",
  "Kathak ghungroo",
  "Bharatanatyam ghungroo",
  "Kuchipudi ghungroo",
];

const current = await loadCurrent();
const collection = current.collectionByHandle;
if (!collection) throw new Error(`Missing collection ${GHUNGROO_COLLECTION_HANDLE}`);

const products = PRODUCT_CONFIGS.map((config, index) => {
  const product = current[`product${index}`];
  if (!product) throw new Error(`Missing product ${config.handle}`);
  return { config, product };
});

const changes = {
  collection: {
    handle: collection.handle,
    title: collection.title,
    currentSeo: collection.seo,
    nextSeo: {
      title: "Bharatanatyam Ghungroo, Salangai & Chilanka",
      description:
        "Shop ghungroo/salangai ankle bells for Bharatanatyam, Kuchipudi and Kathak practice, class and stage use. Choose by bell count, strap comfort and sound.",
    },
    regionalKeywordCluster: regionalNames,
  },
  products: products.map(({ config, product }) => ({
    handle: product.handle,
    currentTitle: product.title,
    nextTitle: config.title,
    currentCollections: product.collections.nodes.map((item) => item.handle),
    alreadyInGhungrooCollection: product.collections.nodes.some((item) => item.handle === GHUNGROO_COLLECTION_HANDLE),
    nextDanceForms: ["Bharatanatyam", "Kuchipudi", "Kathak"],
    bellCount: config.bellCount,
  })),
};

if (APPLY) {
  await updateCollection(collection);
  for (const { config, product } of products) {
    await updateProduct(product, config);
    await setProductMetafields(product, config);
  }
}

console.log(JSON.stringify({ apply: APPLY, changes }, null, 2));

async function loadCurrent() {
  const productQueries = PRODUCT_CONFIGS.map(
    (config, index) => `product${index}: productByHandle(handle: "${config.handle}") {
      id
      title
      handle
      productType
      descriptionHtml
      seo { title description }
      collections(first: 20) { nodes { id title handle } }
    }`,
  ).join("\n");

  return gql(`
    query GhungrooNearWinCurrent {
      collectionByHandle(handle: "${GHUNGROO_COLLECTION_HANDLE}") {
        id
        title
        handle
        descriptionHtml
        seo { title description }
      }
      ${productQueries}
    }
  `);
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
        seo: changes.collection.nextSeo,
      },
    },
  );
  const errors = data.collectionUpdate.userErrors || [];
  if (errors.length) throw new Error(`collectionUpdate ${collection.handle}: ${JSON.stringify(errors)}`);

  await setMetafields([
    {
      ownerId: collection.id,
      namespace: "custom",
      key: "regional_keyword_cluster",
      type: "list.single_line_text_field",
      value: JSON.stringify(regionalNames),
    },
  ]);
}

async function updateProduct(product, config) {
  const data = await gql(
    `mutation ProductUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        userErrors { field message }
      }
    }`,
    {
      input: {
        id: product.id,
        title: config.title,
        descriptionHtml: productDescription(config),
        seo: {
          title: config.seoTitle,
          description: config.seoDescription,
        },
      },
    },
  );
  const errors = data.productUpdate.userErrors || [];
  if (errors.length) throw new Error(`productUpdate ${product.handle}: ${JSON.stringify(errors)}`);
}

async function setProductMetafields(product, config) {
  await setMetafields([
    {
      ownerId: product.id,
      namespace: "dance",
      key: "dance_form_suitable",
      type: "list.single_line_text_field",
      value: JSON.stringify(["Bharatanatyam", "Kuchipudi", "Kathak"]),
    },
    {
      ownerId: product.id,
      namespace: "dance",
      key: "size_notes",
      type: "multi_line_text_field",
      value: `Choose this ${config.bellCount}-bell ghungroo/salangai by teacher preference, dancer level, ankle comfort and sound needed for Bharatanatyam, Kuchipudi or Kathak practice and stage use. Check product photos and straps before ordering.`,
    },
    {
      ownerId: product.id,
      namespace: "dance",
      key: "fit_notes",
      type: "multi_line_text_field",
      value: `Use these ${config.bellCount}-bell ankle bells for classical dance footwork when the teacher or dancer wants this bell count. Check strap comfort, fastening and sound before performance use.`,
    },
    {
      ownerId: product.id,
      namespace: "custom",
      key: "regional_names",
      type: "list.single_line_text_field",
      value: JSON.stringify(regionalNames),
    },
    {
      ownerId: product.id,
      namespace: "global",
      key: "title_tag",
      type: "single_line_text_field",
      value: config.seoTitle,
    },
    {
      ownerId: product.id,
      namespace: "global",
      key: "description_tag",
      type: "multi_line_text_field",
      value: config.seoDescription,
    },
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

function productDescription(config) {
  return `
<p>${config.bellCount}-bell ghungroo / salangai ankle bells for Bharatanatyam, Kuchipudi and Kathak practice, class and stage use. Choose this bell count when it matches the teacher's guidance, dancer level and sound needed for footwork.</p>
<ul>
  <li>Use for classical dance practice, class and stage performance based on teacher preference.</li>
  <li>Compare strap comfort, fastening style and bell sound before ordering.</li>
  <li>Regional names customers may use include ghungroo, ghunghroo, salangai, chilanka, chilanga and gejje.</li>
  <li>Keep ghungroo dry after use. Wipe bells and straps, allow sweat to dry fully, and store in a pouch away from moisture.</li>
</ul>
`.trim();
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
