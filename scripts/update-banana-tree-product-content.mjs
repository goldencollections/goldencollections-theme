import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const ENV_FILE = "env";
const HANDLE = "banana-tree-banana-bunches-for-pooja-varamahalakshmi-vratham";
const env = Object.fromEntries(fs.readFileSync(ENV_FILE, "utf8").split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith("#")).map(l => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const GQL = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;
const REST = `https://${SHOP}/admin/api/${API_VERSION}`;

const cleanTags = [
  "artificial banana tree",
  "banana bunch for pooja",
  "banana tree for pooja",
  "plantain tree decoration",
  "pooja decoration",
  "south indian pooja decoration",
  "temple decoration",
  "varalakshmi pooja",
  "varalakshmi vratham",
  "varamahalakshmi"
];

const productContent = {
  "artificial-banana-tree-pair-for-varalakshmi-vratham-and-pooja-vbt-001": {
    title: "Artificial Banana Tree Pair for Varalakshmi Vratham and Pooja VBT-001",
    seoTitle: "Artificial Banana Tree Pair for Varalakshmi Pooja",
    seoDescription: "Shop a 19 inch artificial banana tree pair for Varalakshmi Vratham, Lakshmi Pooja, home altar, doorway and mandapam decoration.",
    tags: [...cleanTags, "banana tree pair", "19 inch banana tree"],
    intro: "Artificial banana tree pair for Varalakshmi Vratham, Lakshmi Pooja and traditional pooja decoration.",
    bullets: [
      "Use beside the kalasam, deity idol, home altar, doorway or mandapam setup.",
      "Variant size shown in Shopify: 19 Inches.",
      "Reusable decor option when fresh banana stems are difficult to source."
    ],
    size: "Check the product photos and measurement views, then compare the 19 inch height with the space available in your pooja setup."
  },
  "banana-tree-for-varalakshmi-statue-pooja-decoration": {
    title: "Banana Tree for Varalakshmi Statue | Pooja Decoration",
    handle: "banana-tree-for-varalakshmi-statue-pooja-decoration",
    seoTitle: "Banana Tree for Varalakshmi Statue | Pooja Decor",
    seoDescription: "Shop a 12 inch banana tree pair for Varalakshmi statue, Lakshmi Pooja, temple setup and festive altar decoration.",
    tags: [...cleanTags, "banana tree", "varalakshmi statue decor"],
    intro: "Banana tree decor for Varalakshmi statue, Lakshmi Pooja and festive altar decoration.",
    bullets: [
      "Use beside the deity idol, kalasam, pooja mandapam or home temple display.",
      "Works as a traditional South Indian pooja decoration accent.",
      "Product photos show the actual piece for visual comparison before ordering."
    ],
    size: "Compare the 12 inch height with your idol, altar and available pooja space before ordering."
  },
  "banana-bunch-set-foam-varalakshmi-pooja": {
    title: "Banana Bunch Set of 2 - Foam Bananas for Varalakshmi Pooja VBT-007",
    imageAltBase: "Artificial banana set and banana bunch for Varalakshmi Pooja decoration",
    seoTitle: "Banana Bunch Set of 2 for Varalakshmi Pooja",
    seoDescription: "Shop a 6 inch set of 2 foam banana bunches for Varalakshmi Vratham, Lakshmi Pooja, Golu and festive mandapam decoration.",
    tags: [...cleanTags, "banana bunch", "foam banana bunch", "golu decoration", "set of 2"],
    intro: "Set of 2 foam banana bunches for Varalakshmi Vratham, Lakshmi Pooja, Golu and festive pooja decoration.",
    bullets: [
      "Set includes 2 banana bunches.",
      "Confirmed height: 6 inches.",
      "Useful for pooja mandapam, altar, home temple and festival decoration."
    ],
    size: "Check the product photos and compare the 6 inch height with your altar, mandapam or display area before ordering."
  },
  "deity-coconut-tree-traditional-decoration-for-puja-temples-dac-001": {
    title: "Deity Coconut Tree Decoration for Puja and Temples DAC-001",
    seoTitle: "Deity Coconut Tree Decoration for Puja and Temples",
    seoDescription: "Shop deity coconut tree decor for puja, temples, home altar and festive mandapam decoration. Available in multiple size variants.",
    tags: ["coconut tree decor", "deity accessories tree", "pooja decoration", "temple decoration", "mandapam decoration", "home altar decor", "south indian pooja decoration"],
    intro: "Single-piece deity coconut tree ornament with metal and stone work for puja, temple displays, home altar setups and festive mandapam decor.",
    bullets: [
      "Choose from size variants 4.5 x 3, 6 x 3, 9 x 3.5 or 12 x 3.5 inches.",
      "Use beside deity idols, kalasam setups, temple displays or pooja decor arrangements.",
      "Single-piece ornament with metal and stone work."
    ],
    size: "Select the size variant that matches your available height and width. Review the measurement photos before ordering."
  },
  "varalakshmi-vratham-artificial-banana-set-for-pooja-decoration-vbt-006": {
    title: "Varalakshmi Vratham Artificial Banana Set for Pooja Decoration VBT-006",
    imageAltBase: "Artificial banana set and banana bunch for Varalakshmi Pooja decoration",
    seoTitle: "Artificial Banana Set for Varalakshmi Pooja VBT-006",
    seoDescription: "Shop a 7 inch artificial banana set for Varalakshmi Vratham, Lakshmi Pooja, home temple and festive pooja decoration.",
    tags: [...cleanTags, "artificial banana set", "7 inch banana set"],
    intro: "Artificial banana set for Varalakshmi Vratham, Lakshmi Pooja and festive pooja decoration.",
    bullets: [
      "Confirmed height: 7 inches.",
      "Use for home temple, kalasam, deity idol, altar or mandapam decoration.",
      "Reusable decor option for annual pooja and festival setups."
    ],
    size: "Check the product photos and compare the 7 inch height with your altar, kalasam or mandapam placement before ordering."
  },
  "artificial-hanging-banana-set-for-vratham-and-pooja-decoration-vbt-005": {
    title: "Artificial Hanging Banana Set for Vratham and Pooja Decoration VBT-005",
    seoTitle: "Artificial Hanging Banana Set for Pooja Decoration",
    seoDescription: "Shop a 9 inch artificial hanging banana set for Vratham, Varalakshmi Pooja, home altar and festive mandapam decoration.",
    tags: [...cleanTags, "hanging banana set", "9 inch hanging banana set"],
    intro: "Artificial hanging banana set for Vratham, Varalakshmi Pooja and festive altar decoration.",
    bullets: [
      "Confirmed height: 9 inches.",
      "Use for pooja mandapam, doorway, altar or festival backdrop decoration.",
      "Suitable when you want a hanging banana bunch style rather than a standing tree piece."
    ],
    size: "Confirm the 9 inch height, hanging placement and available display space using the product photos before ordering."
  },
  "decorative-artificial-banana-bunch-for-vratham-and-pooja-vbt-004": {
    title: "Decorative Artificial Banana Bunch for Vratham and Pooja VBT-004",
    seoTitle: "Artificial Banana Bunch for Vratham and Pooja",
    seoDescription: "Shop an 8 inch decorative artificial banana bunch pair for Vratham, Varalakshmi Pooja, altar and festive mandapam decoration.",
    tags: [...cleanTags, "artificial banana bunch", "8 inch banana bunch"],
    intro: "Decorative artificial banana bunch for Vratham, Varalakshmi Pooja and festive pooja decoration.",
    bullets: [
      "Confirmed height: 8 inches.",
      "Use near the kalasam, deity idol, altar or mandapam display.",
      "A reusable alternative to fresh banana bunch decor."
    ],
    size: "Compare the 8 inch height with your pooja setup and confirm the display space before ordering."
  },
  "traditional-banana-tree-decoration-for-varalakshmi-vratham-vbt-003": {
    title: "Traditional Banana Tree Decoration for Varalakshmi Vratham VBT-003",
    seoTitle: "Traditional Banana Tree for Varalakshmi Vratham",
    seoDescription: "Shop a 13 inch traditional artificial banana tree decoration for Varalakshmi Vratham, Lakshmi Pooja and home altar setup.",
    tags: [...cleanTags, "traditional banana tree", "13 inch banana tree"],
    intro: "Traditional artificial banana tree decoration for Varalakshmi Vratham, Lakshmi Pooja and home altar setup.",
    bullets: [
      "Variant size shown in Shopify: 13 Inches.",
      "Use beside the kalasam, deity idol, mandapam or home temple display.",
      "Good for compact pooja spaces that need a traditional banana tree accent."
    ],
    size: "Compare the 13 inch height and product photos with the space beside your idol, kalasam or altar before ordering."
  },
  "varalakshmi-vratham-with-an-artificial-banana-tree-decoration-vbt-002": {
    title: "Artificial Banana Tree Decoration for Varalakshmi Vratham VBT-002",
    seoTitle: "Artificial Banana Tree for Varalakshmi Vratham",
    seoDescription: "Shop a 16 inch artificial banana tree decoration for Varalakshmi Vratham, Lakshmi Pooja, home temple and mandapam setup.",
    tags: [...cleanTags, "artificial banana tree", "16 inch banana tree"],
    intro: "Artificial banana tree decoration for Varalakshmi Vratham, Lakshmi Pooja and festive pooja setup.",
    bullets: [
      "Variant size shown in Shopify: 16 Inches.",
      "Use beside the kalasam, deity idol, altar, doorway or mandapam setup.",
      "Reusable decor option for traditional festival arrangements."
    ],
    size: "Compare the 16 inch height and product photos with your pooja setup before ordering."
  }
};

function descriptionHtml(item) {
  return [
    `<p>${item.intro}</p>`,
    `<h3>Best used for</h3>`,
    `<ul>${item.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>`,
    `<h3>Size and placement guidance</h3>`,
    `<p>${item.size}</p>`
  ].join("\n");
}

async function gql(query, variables = {}) {
  const res = await fetch(GQL, { method: "POST", headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN }, body: JSON.stringify({ query, variables }) });
  const body = await res.json();
  if (body.errors) throw new Error(JSON.stringify(body.errors));
  return body.data;
}

async function rest(path, options = {}) {
  const res = await fetch(`${REST}${path}`, { ...options, headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN, ...(options.headers || {}) } });
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(`${options.method || "GET"} ${path}: ${res.status} ${text}`);
  return body;
}

async function fetchProducts() {
  const data = await gql(`query($q:String!){ collections(first:1, query:$q){ nodes{ products(first:30){nodes{ id legacyResourceId handle title images(first:10){nodes{id altText}} } } } } }`, { q: `handle:${HANDLE}` });
  return data.collections.nodes[0].products.nodes;
}

async function main() {
  const products = await fetchProducts();
  for (const product of products) {
    const item = productContent[product.handle];
    if (!item) {
      console.log(`[SKIP] No content map for ${product.handle}`);
      continue;
    }
    console.log(`\n${APPLY ? "[UPDATE]" : "[DRY]"} ${product.handle}`);
    console.log(`Title: ${product.title} -> ${item.title}`);
    console.log(`SEO: ${item.seoTitle} | ${item.seoDescription}`);
    console.log(`Tags: ${item.tags.join(", ")}`);
    if (!APPLY) continue;

    const update = await gql(`mutation ProductUpdate($input: ProductInput!) { productUpdate(input: $input) { product { id handle title seo { title description } } userErrors { field message } } }`, {
      input: {
        id: product.id,
        title: item.title,
        descriptionHtml: descriptionHtml(item),
        tags: item.tags,
        seo: { title: item.seoTitle, description: item.seoDescription },
        ...(item.handle ? { handle: item.handle, redirectNewHandle: true } : {})
      }
    });
    const errors = update.productUpdate.userErrors || [];
    if (errors.length) throw new Error(`productUpdate ${product.handle}: ${JSON.stringify(errors)}`);

    const productId = product.legacyResourceId;
    for (let index = 0; index < product.images.nodes.length; index++) {
      const image = product.images.nodes[index];
      const imageId = image.id.split("/").pop();
      const alt = `${item.imageAltBase || item.title} - image ${index + 1}`;
      await rest(`/products/${productId}/images/${imageId}.json`, {
        method: "PUT",
        body: JSON.stringify({ image: { id: Number(imageId), alt } })
      });
    }
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
