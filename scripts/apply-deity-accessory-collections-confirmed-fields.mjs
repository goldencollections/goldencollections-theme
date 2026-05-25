#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const ENV_FILE = "env";
const GPC_RELIGIOUS_ITEMS = "97";
const GPC_BELTS = "169";
const GPC_PENDANTS = "192";

const DEITY_HANDLES = {
  multi: "multi-deity",
  varalakshmi: "varalakshmi-lakshmi-amman",
  vishnu: "balaji-vishnu-perumal",
  krishna: "krishna-radha-krishna",
  ganesha: "ganesha-ganapati-vinayaka",
  shiva: "shiva-mahadev",
  durga: "durga-devi-amman-parvati",
  murugan: "murugan-subramanya",
  hanuman: "hanuman-anjaneya"
};

const ORNAMENT_HANDLES = {
  waist: "vaddanam-waist-belt",
  nose: "nose-ring-nath-bullaku",
  tilak: "tilak-namam-thiruman",
  arch: "arch-prabhavali",
  accessory: "general-accessories"
};

const COLLECTIONS = [
  {
    key: "eyes",
    handle: "deity-eyes-for-god-idols-statues",
    title: "Deity Eyes",
    displayTitle: "Deity Eyes",
    shoppingLabel: "Eyes",
    productType: "Deity Eyes",
    ornament: "Deity Eyes / Netra / Chakshu",
    ornamentRef: "accessory",
    placement: "Eyes / face",
    material: "Alloy",
    componentCount: 2,
    included: "Pair of deity eyes as shown in photos",
    gpc: GPC_RELIGIOUS_ITEMS,
    regionals: ["Deity Eyes", "Netra", "Chakshu", "God eyes", "Goddess eyes", "Idol eyes", "Alankaram eyes"],
    intro:
      "Shop deity eyes, also called Netra or Chakshu, for god and goddess idol alankaram. Choose by eye width, front scale, color, face size and the look shown in the product photos.",
    fit:
      "For deity eyes, compare the eye width and front scale with the idol face. Size in cms is kept in fit notes; use the photos and variant size before ordering.",
    productTitle: (product) => `Deity Netra Eyes for God and Goddess Idols ${code(product)}`,
    primary: "multi",
    compatible: ["multi"],
    compatibleNames: ["All god and goddess idols"],
    compatibilityClass: "Multi-Deity"
  },
  {
    key: "waist",
    handle: "waist-belt-vaddanam-jewellery-for-hindu-gods-goddess-1",
    title: "Deity Waist Belts",
    displayTitle: "Deity Waist Belts",
    shoppingLabel: "Waist Belts",
    productType: "Deity Waist Belt",
    ornament: "Vaddanam / Oddiyanam / Waist Belt",
    ornamentRef: "waist",
    placement: "Waist / hip / dress",
    material: "Alloy metal with stone work",
    componentCount: 1,
    included: "One deity waist belt / vaddanam as shown in photos",
    gpc: GPC_BELTS,
    regionals: ["Vaddanam", "Oddiyanam", "Waist Belt", "Kamarband", "Kati Sutra", "Deity waist ornament", "Goddess waist belt"],
    intro:
      "Shop deity waist belts, Vaddanam and Oddiyanam for god and goddess idol alankaram. Choose by belt length across the waist, vertical height, stone color, idol posture and dress volume.",
    fit:
      "For waist belts, Length means belt length across the idol waist. Height means the vertical belt height. For L x W sizes, treat the first value as belt length/across waist and the second as vertical height/front width.",
    productTitle: (product) => `Deity Vaddanam Waist Belt with Stone Work ${code(product)}`,
    primary: "multi",
    compatible: ["multi"],
    compatibleNames: ["All god and goddess idols"],
    compatibilityClass: "Multi-Deity"
  },
  {
    key: "arch",
    handle: "god-goddess-arch",
    title: "Deity Arches for Crowns",
    displayTitle: "Deity Arches",
    shoppingLabel: "Arch for Crown",
    productType: "Deity Accessories- Deity Arch",
    ornament: "Arch / Prabhavali",
    ornamentRef: "arch",
    placement: "Behind crown / head / backdrop",
    material: "Alloy metal with stone work",
    componentCount: 1,
    included: "One deity arch / prabhavali as shown in photos",
    gpc: GPC_RELIGIOUS_ITEMS,
    regionals: ["Arch", "Prabhavali", "Deity arch", "God arch", "Goddess arch", "Crown arch", "Alankaram arch"],
    intro:
      "Shop deity arches and Prabhavali-style crown backdrops for god and goddess idols. Choose by height, front width, crown clearance, stone color and the idol head area.",
    fit:
      "For deity arches, L or Height means vertical arch height and W means front width. Compare crown height, head width, backdrop space and nearby jewellery before ordering.",
    productTitle: (product) => `Deity Arch Prabhavali for God and Goddess Idols ${code(product)}`,
    primary: "multi",
    compatible: ["multi"],
    compatibleNames: ["All god and goddess idols"],
    compatibilityClass: "Multi-Deity"
  },
  {
    key: "pustal",
    handle: "deity-god-pustal-tadu-thali-kasulaperu",
    title: "Deity Pustal Tadu and Thali",
    displayTitle: "Deity Pustal Tadu",
    shoppingLabel: "Pustal Tadu",
    productType: "Deity God Pustal Tadu Thali",
    ornament: "Pustal Tadu / Thali / Kasulaperu",
    ornamentRef: "accessory",
    placement: "Neck / chest",
    material: "Copper metal with gold plating and stone work",
    componentCount: 1,
    included: "One deity Pustal Tadu / Thali chain as shown in photos",
    gpc: GPC_RELIGIOUS_ITEMS,
    regionals: ["Pustal Tadu", "Pustal Thadu", "Thali", "Mangalsutra", "Mangal Sutram", "Kasulaperu", "Ammavaru Potu"],
    intro:
      "Shop deity Pustal Tadu, Thali, Mangalsutra and Kasulaperu-style ornaments for goddess and deity idol alankaram. Choose by length, front width, stone color and chest placement.",
    fit:
      "For Pustal Tadu, L or Height means the vertical length/drop and W means front width. Compare the selected size with the idol neck, chest and dress volume.",
    productTitle: (product) => `Deity Pustal Tadu Thali Chain with Stone Work ${code(product)}`,
    primary: "multi",
    compatible: ["multi"],
    compatibleNames: ["All god and goddess idols"],
    compatibilityClass: "Multi-Deity"
  },
  {
    key: "pendants",
    handle: "god-deity-pendants",
    title: "Deity Pendants and Lockets",
    displayTitle: "Deity Pendants",
    shoppingLabel: "Pendants",
    productType: "Deity Pendant",
    ornament: "Pendant / Locket",
    ornamentRef: "accessory",
    placement: "Neck / chest / garland center",
    material: "Alloy metal with gold plating and stone work",
    componentCount: 1,
    included: "One deity pendant / locket as shown in photos",
    gpc: GPC_PENDANTS,
    regionals: ["Pendant", "Locket", "Deity pendant", "God pendant", "Temple jewellery pendant", "Alankaram locket"],
    intro:
      "Shop deity pendants and lockets for god and goddess idol jewellery, garland centers and chest alankaram. Choose by height, front width, stone color, deity design and placement.",
    fit:
      "For deity pendants, L or Height means vertical pendant height and W means front width. Compare with the idol chest, garland center and nearby necklaces before ordering.",
    productTitle: (product) =>
      /venkates|balaji|vishnu|tirupati/i.test(signal(product))
        ? `Balaji Venkateshwara Deity Pendant Locket ${code(product)}`
        : `Deity Pendant Locket with Stone Work ${code(product)}`,
    primary: (product) => (/venkates|balaji|vishnu|tirupati/i.test(signal(product)) ? "vishnu" : "multi"),
    compatible: (product) => (/venkates|balaji|vishnu|tirupati/i.test(signal(product)) ? ["vishnu", "multi"] : ["multi"]),
    compatibleNames: (product) =>
      /venkates|balaji|vishnu|tirupati/i.test(signal(product))
        ? ["Balaji / Vishnu / Venkateswara / Perumal", "All god and goddess idols when the size and design fit"]
        : ["All god and goddess idols"],
    compatibilityClass: (product) => (/venkates|balaji|vishnu|tirupati/i.test(signal(product)) ? "Deity Specific + Multi-Deity by fit" : "Multi-Deity")
  },
  {
    key: "nose",
    handle: "buy-stone-nathu-bullaku-nose-rings-for-goddess-amman-jewelry",
    title: "Deity Nose Rings",
    displayTitle: "Deity Nose Rings",
    shoppingLabel: "Nose Rings",
    productType: "Deity Accessories- Nose Rings",
    ornament: "Nose Ring / Nath / Bullaku",
    ornamentRef: "nose",
    placement: "Nose / face",
    material: "Alloy metal with stone work",
    componentCount: 1,
    included: "One deity nose ring / Nath / Bullaku as shown in photos",
    gpc: GPC_RELIGIOUS_ITEMS,
    regionals: ["Nose Ring", "Nath", "Nathu", "Bullaku", "Bullak", "Mukkuthi", "Amman nose ring", "Goddess nose ornament"],
    intro:
      "Shop deity nose rings, Nath and Bullaku ornaments for goddess, Amman, Lakshmi and Devi idol alankaram. Choose by nose placement, height, front width and face scale.",
    fit:
      "For nose rings, L or Height means vertical height/length and W means front width. Compare the nose ornament with the idol face, nose area, earrings and nearby jewellery.",
    productTitle: (product) => `Goddess Nath Bullaku Nose Ring with Stone Work ${code(product)}`,
    primary: "varalakshmi",
    compatible: ["varalakshmi", "durga"],
    compatibleNames: ["Varalakshmi / Lakshmi / Amman", "Durga / Devi / Amman / Parvati"],
    compatibilityClass: "Goddess Specific"
  },
  {
    key: "mustache",
    handle: "buy-god-mustache-jewellery-deity-mustache-accessories-for-idols",
    title: "Deity Mustache",
    displayTitle: "Deity Mustache",
    shoppingLabel: "Mustache",
    productType: "Deity Accessories- Mustache",
    ornament: "Mustache",
    ornamentRef: "accessory",
    placement: "Face / upper lip",
    material: "Alloy metal with stone work",
    componentCount: 1,
    included: "One deity mustache ornament as shown in photos",
    gpc: GPC_RELIGIOUS_ITEMS,
    regionals: ["Mustache", "Moustache", "God mustache", "Swamy mustache", "Deity face ornament"],
    intro:
      "Shop deity mustache ornaments for god and male-deity idol alankaram. Choose by mustache length, face width, stone color and the expression shown in photos.",
    fit:
      "For mustache ornaments, Height or Length means the measured mustache length/height shown in the variant. Compare it with the idol face and upper-lip area.",
    productTitle: (product) => `God Idol Mustache Ornament with Stone Work ${code(product)}`,
    primary: "multi",
    compatible: ["multi"],
    compatibleNames: ["God and male-deity idols when the face size fits"],
    compatibilityClass: "God / Male-Deity Specific"
  },
  {
    key: "weapons",
    handle: "god-goddess-weapons",
    title: "Deity Weapons and Symbols",
    displayTitle: "Deity Weapons",
    shoppingLabel: "Weapons",
    productType: "Deity Accessories- Weapons",
    ornament: "Weapon / Astra / Symbol",
    ornamentRef: "accessory",
    placement: "Hands / side placement / alankaram",
    material: "Alloy metal with stone work",
    componentCount: (product) => weaponComponent(product),
    included: (product) => weaponIncluded(product),
    gpc: GPC_RELIGIOUS_ITEMS,
    regionals: ["Deity weapons", "Astra", "Trishul", "Vel", "Veena", "Gada", "Sword", "Talwar", "Bansuri", "Shanku Chakra", "Alankaram weapon"],
    intro:
      "Shop deity weapons, Astra and sacred symbols for god and goddess idol alankaram, including Trishul, Vel, Veena, Gada, Sword, Bow and Arrow, Lotus, Parrot, Flute and Shatagopam styles.",
    fit:
      "For deity weapons, L or Height means vertical weapon height/length and W means front width. For H x W x D labels, use Height x Width x Depth and compare hand placement, side clearance and idol scale.",
    productTitle: (product) => weaponTitle(product),
    primary: (product) => weaponDeities(product).primary,
    compatible: (product) => weaponDeities(product).refs,
    compatibleNames: (product) => weaponDeities(product).names,
    compatibilityClass: (product) => weaponDeities(product).className
  },
  {
    key: "taira",
    handle: "buy-deity-taira-idol-sacred-taira-statues-for-pooja-and-worship",
    title: "Deity Taira",
    displayTitle: "Deity Taira",
    shoppingLabel: "Taira",
    productType: "Deity Accessories- Taira",
    ornament: "Taira / Turai Head Ornament",
    ornamentRef: "accessory",
    placement: "Head / crown side / hair decoration",
    material: "Alloy metal with stone work",
    componentCount: 1,
    included: "One deity Taira / Turai head ornament as shown in photos",
    gpc: GPC_RELIGIOUS_ITEMS,
    draftSkuKeys: new Set(["GDT004", "GDT007", "GDT012"]),
    regionals: ["Taira", "Turai", "Deity Taira", "God Taira", "Head ornament", "Crown side ornament", "Alankaram headpiece"],
    intro:
      "Shop deity Taira and Turai head ornaments for god and goddess idol alankaram. Choose by height, front width, crown placement, stone color and head or side-crown clearance.",
    fit:
      "For Taira, L or Height means vertical ornament height/length and W means front width. Compare with the idol head, crown side, hair area and nearby jewellery.",
    productTitle: (product) => `Deity Taira Turai Head Ornament with Stone Work ${code(product)}`,
    primary: "multi",
    compatible: ["multi"],
    compatibleNames: ["All god and goddess idols"],
    compatibilityClass: "Multi-Deity"
  },
  {
    key: "bindi",
    handle: "deity-bindi-tilak-thiruman",
    title: "Deity Bindi, Tilak and Thiruman",
    displayTitle: "Deity Bindi and Tilak",
    shoppingLabel: "Bindi / Tilak",
    productType: "Deity Accessories- Tilak",
    ornament: "Bindi / Tilak / Namam / Thiruman",
    ornamentRef: "tilak",
    placement: "Forehead",
    material: "Alloy metal with stone work",
    componentCount: 1,
    included: "One deity forehead Bindi / Tilak / Namam / Thiruman as shown in photos",
    gpc: GPC_RELIGIOUS_ITEMS,
    regionals: ["Bindi", "Tilak", "Thiruman", "Namam", "Balaji Namam", "Vishnu Namam", "Tripund", "Vibhuti Pattai", "Shiva Namam"],
    intro:
      "Shop deity Bindi, Tilak, Namam and Thiruman forehead ornaments for Balaji, Vishnu, Venkateswara, Perumal, Shiva and goddess idol alankaram. Choose by forehead height, front width, deity symbol and face scale.",
    fit:
      "For Bindi, Tilak, Namam and Thiruman, L or Height means vertical forehead ornament height and W means front width. Balaji/Vishnu Namam is Vishnu-family specific; Tripund or Shiva Namam is Shiva-specific.",
    productTitle: (product) =>
      /shanker|shankar|shiva|tripund|vibuthi|vibhuti|mahakal/i.test(signal(product))
        ? `Shiva Tripund Tilak Bindi with Stone Work ${code(product)}`
        : `Balaji Vishnu Namam Thiruman Tilak with Stone Work ${code(product)}`,
    primary: (product) => (/shanker|shankar|shiva|tripund|vibuthi|vibhuti|mahakal/i.test(signal(product)) ? "shiva" : "vishnu"),
    compatible: (product) => (/shanker|shankar|shiva|tripund|vibuthi|vibhuti|mahakal/i.test(signal(product)) ? ["shiva"] : ["vishnu"]),
    compatibleNames: (product) =>
      /shanker|shankar|shiva|tripund|vibuthi|vibhuti|mahakal/i.test(signal(product))
        ? ["Shiva / Mahadev"]
        : ["Balaji / Vishnu / Venkateswara / Perumal"],
    compatibilityClass: "Deity Specific"
  },
  {
    key: "shanku",
    handle: "stone-shankh-chakra-gold-plated-shanku-chakra-for-vishnu-and-perumal",
    title: "Deity Shanku Chakra",
    displayTitle: "Deity Shanku Chakra",
    shoppingLabel: "Shanku Chakra",
    productType: "Deity Accessories- Shankha Chakra",
    ornament: "Shanku Chakra / Shankha Chakra",
    ornamentRef: "accessory",
    placement: "Hands / sides / Vishnu alankaram",
    material: "Alloy metal with stone work",
    componentCount: 2,
    included: "Pair of Shanku and Chakra ornaments as shown in photos",
    gpc: GPC_RELIGIOUS_ITEMS,
    regionals: ["Shanku Chakra", "Shankha Chakra", "Shankh Chakra", "Sankha Chakram", "Conch Chakra", "Vishnu symbols", "Balaji Shanku Chakra"],
    intro:
      "Shop deity Shanku Chakra and Shankha Chakra pairs for Balaji, Vishnu, Venkateswara and Perumal idol alankaram. Choose by height, front width, stone color and hand or side placement.",
    fit:
      "For Shanku Chakra pairs, L or Height means vertical height/length and W means front width. Match the pair to Vishnu-family idol hand or side placement.",
    productTitle: (product) => `Vishnu Shanku Chakra Pair with Stone Work ${code(product)}`,
    primary: "vishnu",
    compatible: ["vishnu"],
    compatibleNames: ["Balaji / Vishnu / Venkateswara / Perumal"],
    compatibilityClass: "Deity Specific"
  }
];

const env = readEnv(ENV_FILE);
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const GRAPHQL_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;
const REST_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}`;

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

async function rest(path, options = {}) {
  const res = await fetch(`${REST_ENDPOINT}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN,
      ...(options.headers || {})
    }
  });
  const textBody = await res.text();
  const body = textBody ? JSON.parse(textBody) : {};
  if (!res.ok) throw new Error(`REST ${options.method || "GET"} ${path}: ${res.status} ${textBody}`);
  return body;
}

function metafield(ownerId, namespace, key, type, value) {
  return { ownerId, namespace, key, type, value: String(value) };
}

async function fetchCollectionAndProducts(handle) {
  const products = [];
  let collection = null;
  let after = null;
  do {
    const data = await gql(
      `query Products($handle: String!, $after: String) {
        collectionByHandle(handle: $handle) {
          id legacyResourceId handle title sortOrder productsCount { count } seo { title description }
          metafields(first: 100) { nodes { namespace key value type } }
          products(first: 100, after: $after) {
            pageInfo { hasNextPage endCursor }
            nodes {
              id legacyResourceId handle title descriptionHtml productType status totalInventory tags templateSuffix
              seo { title description }
              images(first: 60) { nodes { id altText url } }
              variants(first: 100) {
                nodes { id legacyResourceId title sku barcode inventoryQuantity selectedOptions { name value } }
              }
              metafields(first: 100) { nodes { namespace key value type } }
            }
          }
        }
      }`,
      { handle, after }
    );
    collection = data.collectionByHandle;
    if (!collection) throw new Error(`Collection not found: ${handle}`);
    products.push(...collection.products.nodes);
    after = collection.products.pageInfo.hasNextPage ? collection.products.pageInfo.endCursor : null;
  } while (after);
  return { collection, products };
}

async function fetchMetaobjectRefs(type, handles) {
  const refs = {};
  for (const [key, handle] of Object.entries(handles)) {
    const data = await gql(
      `query Metaobject($handle: MetaobjectHandleInput!) {
        metaobjectByHandle(handle: $handle) { id handle fields { key value } }
      }`,
      { handle: { type, handle } }
    );
    if (data.metaobjectByHandle) refs[key] = data.metaobjectByHandle;
  }
  return refs;
}

function mf(nodes, namespace, key) {
  return nodes.find((node) => node.namespace === namespace && node.key === key)?.value || "";
}

function normalizeSku(value) {
  return String(value || "").replace(/\s+/g, "").replace(/-/g, "").toUpperCase();
}

function sku(product) {
  const fromVariant = product.variants.nodes.find((variant) => variant.sku)?.sku || "";
  const fromTitle = product.title.match(/\b[A-Z]{2,5}-?\d{3}\b/i)?.[0] || "";
  const fromHandle = product.handle.match(/\b[a-z]{2,5}-?\d{3}\b/i)?.[0] || "";
  return String(fromVariant || fromTitle || fromHandle || "").replace(/\s+/g, "");
}

function skuKey(product) {
  return normalizeSku(sku(product));
}

function code(product) {
  const raw = sku(product);
  const match = raw.match(/^([A-Za-z]+)-?(\d{3})(?:-\d+)?$/);
  if (match) return `${match[1].toUpperCase()}-${match[2]}`;
  return raw || product.handle;
}

function text(product) {
  return [
    product.title,
    product.productType,
    product.handle,
    product.tags.join(" "),
    product.variants.nodes.flatMap((variant) => variant.selectedOptions.map((option) => `${option.name} ${option.value}`)).join(" ")
  ].join(" ");
}

function signal(product) {
  return [
    product.title,
    product.productType,
    product.handle,
    product.variants.nodes.flatMap((variant) => variant.selectedOptions.map((option) => `${option.name} ${option.value}`)).join(" ")
  ].join(" ");
}

function unique(values) {
  return [...new Set(values.filter((value) => value !== "" && value !== null && value !== undefined))];
}

function optionValues(product, pattern) {
  return unique(
    product.variants.nodes.flatMap((variant) =>
      variant.selectedOptions.filter((option) => pattern.test(option.name)).map((option) => String(option.value || "").trim())
    )
  );
}

function styleValues(product) {
  return optionValues(product, /style/i).filter((value) => !/^default title$/i.test(value));
}

function colorValues(product) {
  return optionValues(product, /colou?r/i).filter((value) => !/^default|na$/i.test(value));
}

function parseNumbers(value) {
  return String(value || "")
    .replace(/[X×]/g, "x")
    .match(/\d+(?:\.\d+)?/g)
    ?.map(Number) || [];
}

function fmt(value) {
  return Number(value).toString();
}

function single(values) {
  const clean = unique(values.map((value) => Number(value)).filter((value) => Number.isFinite(value))).sort((a, b) => a - b);
  return clean.length === 1 ? clean[0] : null;
}

function dims(product, config) {
  const inchPairs = [];
  const cmPairs = [];
  const inchTriples = [];
  const heightValues = [];
  const widthValues = [];
  const depthValues = [];
  const cmOnlyNotes = [];

  for (const variant of product.variants.nodes) {
    for (const option of variant.selectedOptions) {
      const name = String(option.name || "");
      const value = String(option.value || "");
      const numbers = parseNumbers(value);
      if (!numbers.length) continue;

      if (/cms?|centimeter/i.test(name)) {
        cmOnlyNotes.push(`${value} cm`);
        if (numbers.length >= 2) cmPairs.push(numbers.slice(0, 2));
        continue;
      }

      if (/h\s*x\s*w\s*x\s*d|size.*h/i.test(name) && numbers.length >= 3) {
        inchTriples.push(numbers.slice(0, 3));
        heightValues.push(numbers[0]);
        widthValues.push(numbers[1]);
        depthValues.push(numbers[2]);
        continue;
      }

      if (/size/i.test(name) && numbers.length >= 2) {
        inchPairs.push(numbers.slice(0, 2));
        if (config.key === "waist") {
          widthValues.push(numbers[0]);
          heightValues.push(numbers[1]);
        } else {
          heightValues.push(numbers[0]);
          widthValues.push(numbers[1]);
        }
        continue;
      }

      if (/length/i.test(name)) {
        if (config.key === "waist") widthValues.push(numbers[0]);
        else heightValues.push(numbers[0]);
        continue;
      }

      if (/height/i.test(name)) {
        heightValues.push(numbers[0]);
        continue;
      }

      if (/width/i.test(name)) {
        widthValues.push(numbers[0]);
      }
    }
  }

  return {
    height: single(heightValues),
    width: single(widthValues),
    depth: single(depthValues),
    inchPairs: unique(inchPairs.map((pair) => pair.map(fmt).join(" x "))),
    inchTriples: unique(inchTriples.map((triple) => triple.map(fmt).join(" x "))),
    cmPairs: unique(cmPairs.map((pair) => pair.map(fmt).join(" x "))),
    cmOnlyNotes: unique(cmOnlyNotes)
  };
}

function measurementSummary(product, config) {
  const d = dims(product, config);
  const pieces = [];
  if (d.height) pieces.push(config.key === "waist" ? `vertical belt height ${fmt(d.height)} in` : `height/length ${fmt(d.height)} in`);
  if (d.width) pieces.push(config.key === "waist" ? `belt length across waist ${fmt(d.width)} in` : `front width ${fmt(d.width)} in`);
  if (d.depth) pieces.push(`depth ${fmt(d.depth)} in`);
  if (d.inchPairs.length > 1 || d.inchTriples.length > 1) {
    pieces.push(`multiple inch size variants: ${[...d.inchPairs, ...d.inchTriples].slice(0, 10).join(", ")}`);
  }
  if (d.cmPairs.length || d.cmOnlyNotes.length) {
    pieces.push(`cm size labels: ${unique([...d.cmPairs.map((pair) => `${pair} cm`), ...d.cmOnlyNotes]).join(", ")}`);
  }
  return pieces.join("; ");
}

function sizeConfidence(product, config) {
  const d = dims(product, config);
  if (d.height || d.width || d.depth) return "Variant measurement confirmed";
  if (d.inchPairs.length || d.inchTriples.length) return "Multiple variant measurements confirmed";
  if (d.cmPairs.length || d.cmOnlyNotes.length) return "Variant size in cm kept in fit notes";
  return "Check product photos";
}

function fitNotes(product, config) {
  const summary = measurementSummary(product, config);
  const color = colorValues(product).length ? ` Available stone/color options include ${colorValues(product).slice(0, 6).join(", ")}.` : "";
  return `${config.fit}${summary ? ` Confirmed size detail: ${summary}.` : ""}${color}`.trim();
}

function compatibleConfig(config, product) {
  const primaryKey = typeof config.primary === "function" ? config.primary(product) : config.primary;
  const compatKeys = typeof config.compatible === "function" ? config.compatible(product) : config.compatible;
  const compatNames = typeof config.compatibleNames === "function" ? config.compatibleNames(product) : config.compatibleNames;
  const className = typeof config.compatibilityClass === "function" ? config.compatibilityClass(product) : config.compatibilityClass;
  return { primaryKey, compatKeys, compatNames, className };
}

function productTitle(product, config) {
  return config.productTitle(product).replace(/\s+/g, " ").trim();
}

function seoTitle(title) {
  return `${title} | Golden Collections`.slice(0, 70);
}

function seoDescription(product, config) {
  const title = productTitle(product, config);
  const deity = compatibleConfig(config, product).compatNames[0] || "deity idols";
  return `Shop ${title} for ${deity}. Check material, included pieces, size guidance, placement and product photos before ordering.`.slice(0, 200);
}

function productDescription(product, config) {
  const title = productTitle(product, config);
  const included = valueFor(config.included, product);
  const compatible = compatibleConfig(config, product).compatNames.join(", ");
  return [
    `<p>${title} is a deity alankaram accessory for pooja, temple decoration and home idol dressing.</p>`,
    `<p><strong>Material:</strong> ${config.material}.</p>`,
    `<p><strong>Included:</strong> ${included}.</p>`,
    `<p><strong>Compatibility:</strong> ${compatible}. Always choose by exact size, posture and placement.</p>`,
    `<p><strong>Fit guidance:</strong> ${fitNotes(product, config)}</p>`,
    "<p>Use the product photos to compare front scale, stone color, placement clearance and nearby jewellery before ordering.</p>"
  ].join("");
}

function tagsFor(product, config) {
  const compat = compatibleConfig(config, product).compatNames;
  return unique([
    ...config.regionals,
    config.ornament,
    config.shoppingLabel,
    ...compat,
    ...styleValues(product),
    ...colorValues(product),
    code(product),
    "Deity Alankaram",
    "Pooja Accessory",
    "Golden Collections"
  ]).slice(0, 250);
}

function collectionDescription(config) {
  return [
    `<p>${config.intro}</p>`,
    `<p>${config.fit} Material is ${config.material}. Use the product photos, selected variant and measured placement area before ordering.</p>`
  ].join("");
}

function collectionMetafields(collection, config, refs) {
  const relatedIds = COLLECTIONS.filter((item) => item.handle !== config.handle)
    .map((item) => refs.collections[item.handle]?.id)
    .filter(Boolean)
    .slice(0, 8);
  const deityIds = unique(["multi", "varalakshmi", "vishnu", "shiva", "durga"].map((key) => refs.deities[key]?.id));
  const ornamentRef = refs.ornaments[config.ornamentRef || "accessory"]?.id;
  const inputs = [
    metafield(collection.id, "custom", "display_title", "single_line_text_field", config.displayTitle),
    metafield(collection.id, "custom", "collection_intro", "multi_line_text_field", config.intro),
    metafield(collection.id, "custom", "size_fit_intro", "multi_line_text_field", config.fit),
    metafield(collection.id, "custom", "faq_family", "single_line_text_field", "accessory"),
    metafield(collection.id, "custom", "collection_role", "single_line_text_field", "ornament_first"),
    metafield(collection.id, "custom", "deity_first_enabled", "boolean", "true"),
    metafield(collection.id, "custom", "shopping_path_label", "single_line_text_field", config.shoppingLabel),
    metafield(collection.id, "custom", "parent_menu_handles", "single_line_text_field", "deity-collection-circles"),
    metafield(collection.id, "custom", "regional_keyword_cluster", "list.single_line_text_field", JSON.stringify(config.regionals))
  ];
  if (deityIds.length) inputs.push(metafield(collection.id, "custom", "deity_group_refs", "list.metaobject_reference", JSON.stringify(deityIds)));
  if (ornamentRef) {
    inputs.push(metafield(collection.id, "custom", "ornament_type_ref", "metaobject_reference", ornamentRef));
    inputs.push(metafield(collection.id, "custom", "ornament_type_refs", "list.metaobject_reference", JSON.stringify([ornamentRef])));
  }
  if (relatedIds.length) inputs.push(metafield(collection.id, "custom", "related_collection_refs", "list.collection_reference", JSON.stringify(relatedIds)));
  return inputs;
}

function productMetafields(product, config, refs) {
  const d = dims(product, config);
  const compat = compatibleConfig(config, product);
  const deityRefIds = unique(compat.compatKeys.map((key) => refs.deities[key]?.id));
  const ornamentRef = refs.ornaments[config.ornamentRef || "accessory"]?.id;
  const inputs = [
    metafield(product.id, "custom", "range_type", "single_line_text_field", "Deity Alankaram Accessory"),
    metafield(product.id, "custom", "ornament_type", "single_line_text_field", config.ornament),
    metafield(product.id, "custom", "placement", "single_line_text_field", config.placement),
    metafield(product.id, "custom", "material", "single_line_text_field", config.material),
    metafield(product.id, "custom", "compatibility_class", "single_line_text_field", compat.className),
    metafield(product.id, "custom", "compatible_deities", "list.single_line_text_field", JSON.stringify(compat.compatNames)),
    metafield(product.id, "custom", "fit_notes", "multi_line_text_field", fitNotes(product, config)),
    metafield(product.id, "custom", "size_confidence", "single_line_text_field", sizeConfidence(product, config)),
    metafield(product.id, "custom", "component_count", "number_integer", String(valueFor(config.componentCount, product))),
    metafield(product.id, "custom", "set_items_included", "list.single_line_text_field", JSON.stringify([valueFor(config.included, product)])),
    metafield(product.id, "custom", "regional_names", "list.single_line_text_field", JSON.stringify(config.regionals)),
    metafield(product.id, "mm-google-shopping", "google_product_category", "string", config.gpc),
    metafield(product.id, "mc-facebook", "google_product_category", "string", config.gpc),
    metafield(product.id, "mm-google-shopping", "condition", "string", "new"),
    metafield(product.id, "mm-google-shopping", "custom_product", "boolean", "true")
  ];
  if (ornamentRef) inputs.push(metafield(product.id, "custom", "ornament_type_ref", "metaobject_reference", ornamentRef));
  if (refs.deities[compat.primaryKey]?.id) inputs.push(metafield(product.id, "custom", "primary_deity_ref", "metaobject_reference", refs.deities[compat.primaryKey].id));
  if (deityRefIds.length) inputs.push(metafield(product.id, "custom", "compatible_deity_refs", "list.metaobject_reference", JSON.stringify(deityRefIds)));
  if (d.height) inputs.push(metafield(product.id, "custom", "ornament_height_in", "number_decimal", String(d.height)));
  if (d.width) inputs.push(metafield(product.id, "custom", "ornament_width_in", "number_decimal", String(d.width)));
  if (d.depth) inputs.push(metafield(product.id, "custom", "ornament_depth_in", "number_decimal", String(d.depth)));
  return inputs;
}

function valueFor(value, product) {
  return typeof value === "function" ? value(product) : value;
}

function weaponComponent(product) {
  const ctx = signal(product);
  if (/bow and arrow|vil ambu|parashu vajra|shank.?chakra|shanku|chakra/i.test(ctx)) return 2;
  return 1;
}

function weaponIncluded(product) {
  const ctx = signal(product);
  if (/bow and arrow|vil ambu/i.test(ctx)) return "One bow and arrow deity weapon pair as shown in photos";
  if (/parashu vajra/i.test(ctx)) return "One Parashu and Vajra deity weapon pair as shown in photos";
  if (/durga hands|weapon hands/i.test(ctx)) return "One deity weapon hands ornament set as shown in photos";
  return "One deity weapon or sacred symbol ornament as shown in photos";
}

function weaponTitle(product) {
  const ctx = signal(product);
  const c = code(product);
  if (/parrot/i.test(ctx)) return `Goddess Parrot Hand Ornament with Stone Work ${c}`;
  if (/durga hands|weapon hands/i.test(ctx)) return `Durga Devi Weapon Hands with Stone Work ${c}`;
  if (/trishul|thiri|soolam/i.test(ctx)) return `Trishul Weapon for Shiva Amman Idol ${c}`;
  if (/veena|veenai/i.test(ctx)) return `Saraswati Veena Deity Instrument with Stone Work ${c}`;
  if (/murugan|vel/i.test(ctx) && /flag|seval/i.test(ctx)) return `Murugan Seval Kodi Flag Ornament ${c}`;
  if (/murugan|vel/i.test(ctx)) return `Murugan Vel Weapon Ornament with Stone Work ${c}`;
  if (/sword|talwar/i.test(ctx)) return `Deity Sword Talwar Weapon with Stone Work ${c}`;
  if (/gada|mace/i.test(ctx)) return `Hanuman Gada Mace Weapon with Stone Work ${c}`;
  if (/flute|bansuri|bansi/i.test(ctx)) return `Krishna Bansuri Flute Ornament with Stone Work ${c}`;
  if (/lotus/i.test(ctx)) return `Lakshmi Lotus Hand Ornament with Stone Work ${c}`;
  if (/parashu|vajra/i.test(ctx)) return `Parashu Vajra Deity Weapon Pair ${c}`;
  if (/shatagopam/i.test(ctx)) return `Vishnu Shatagopam Ornament with Stone Work ${c}`;
  if (/bow and arrow|vil ambu/i.test(ctx)) return `Bow and Arrow Deity Weapon Pair ${c}`;
  return `Deity Weapon Astra Ornament with Stone Work ${c}`;
}

function weaponDeities(product) {
  const ctx = signal(product);
  if (/veena|veenai/i.test(ctx)) {
    return { primary: "durga", refs: ["durga", "ganesha"], names: ["Saraswati / Devi", "Ganesha where the product style is selected for that setup"], className: "Deity Specific" };
  }
  if (/murugan|vel|seval/i.test(ctx)) {
    return { primary: "murugan", refs: ["murugan"], names: ["Murugan / Subramanya / Kartikeya / Skanda"], className: "Deity Specific" };
  }
  if (/gada|mace/i.test(ctx)) {
    return { primary: "hanuman", refs: ["hanuman"], names: ["Hanuman / Anjaneya"], className: "Deity Specific" };
  }
  if (/flute|bansuri|bansi/i.test(ctx)) {
    return { primary: "krishna", refs: ["krishna"], names: ["Krishna / Radha Krishna"], className: "Deity Specific" };
  }
  if (/shatagopam/i.test(ctx)) {
    return { primary: "vishnu", refs: ["vishnu"], names: ["Balaji / Vishnu / Venkateswara / Perumal"], className: "Deity Specific" };
  }
  if (/trishul|thiri|soolam/i.test(ctx)) {
    return { primary: "shiva", refs: ["shiva", "durga"], names: ["Shiva / Mahadev", "Durga / Devi / Amman / Parvati"], className: "Deity Specific" };
  }
  if (/sword|talwar|durga|devi|amman|parrot|lotus|mata/i.test(ctx)) {
    return { primary: "durga", refs: ["durga", "varalakshmi"], names: ["Durga / Devi / Amman / Parvati", "Varalakshmi / Lakshmi / Amman"], className: "Goddess Specific" };
  }
  return { primary: "multi", refs: ["multi"], names: ["God and goddess idols when the symbol and size fit"], className: "Multi-Deity by style" };
}

async function setMetafields(inputs) {
  for (let index = 0; index < inputs.length; index += 20) {
    const chunk = inputs.slice(index, index + 20).filter((input) => input.value !== "undefined" && input.value !== "");
    if (!chunk.length) continue;
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
  if (!APPLY) {
    console.log(`[DRY COLLECTION] ${collection.title} -> ${config.title}`);
  } else {
    const data = await gql(
      `mutation CollectionUpdate($input: CollectionInput!) {
        collectionUpdate(input: $input) { userErrors { field message } }
      }`,
      {
        input: {
          id: collection.id,
          title: config.title,
          descriptionHtml: collectionDescription(config),
          templateSuffix: "deity-ornament-default",
          sortOrder: "MANUAL",
          seo: {
            title: `${config.title} for God and Goddess Idols | Golden Collections`.slice(0, 70),
            description: `${config.intro} ${config.fit}`.replace(/\s+/g, " ").slice(0, 320)
          }
        }
      }
    );
    const errors = data.collectionUpdate.userErrors || [];
    if (errors.length) throw new Error(`collectionUpdate ${config.handle}: ${JSON.stringify(errors)}`);
  }
  await setMetafields(collectionMetafields(collection, config, refs));
}

async function updateProduct(product, config, refs) {
  const title = productTitle(product, config);
  if (!APPLY) {
    console.log(`[DRY PRODUCT] ${config.handle} ${product.handle}: ${product.title} -> ${title}`);
    return;
  }
  const data = await gql(
    `mutation ProductUpdate($input: ProductInput!) {
      productUpdate(input: $input) { userErrors { field message } }
    }`,
    {
      input: {
        id: product.id,
        title,
        productType: config.productType,
        templateSuffix: "deity-lite",
        descriptionHtml: productDescription(product, config),
        tags: tagsFor(product, config),
        seo: {
          title: seoTitle(title),
          description: seoDescription(product, config)
        }
      }
    }
  );
  const errors = data.productUpdate.userErrors || [];
  if (errors.length) throw new Error(`productUpdate ${product.handle}: ${JSON.stringify(errors)}`);
  await updateImageAlts(product, title, config);
}

async function updateImageAlts(product, title, config) {
  for (const [index, image] of product.images.nodes.entries()) {
    const imageId = image.id.split("/").pop();
    const alt = `${title} ${config.shoppingLabel} deity alankaram image ${index + 1}`;
    await rest(`/products/${product.legacyResourceId}/images/${imageId}.json`, {
      method: "PUT",
      body: JSON.stringify({ image: { id: Number(imageId), alt } })
    });
  }
}

async function draftProducts(products, config) {
  const targets = products.filter((product) => product.status === "ACTIVE" && config.draftSkuKeys?.has(skuKey(product)));
  if (!targets.length) return;
  if (!APPLY) {
    console.log(`[DRY DRAFT] ${config.handle}: ${targets.map((product) => code(product)).join(", ")}`);
    return;
  }
  for (const product of targets) {
    await rest(`/products/${product.legacyResourceId}.json`, {
      method: "PUT",
      body: JSON.stringify({ product: { id: Number(product.legacyResourceId), status: "draft" } })
    });
  }
  console.log(`Drafted ${targets.length} zero-image products in ${config.handle}.`);
}

async function deleteWrongGoogleFields(products) {
  const identifiers = products.flatMap((product) => [
    { ownerId: product.id, namespace: "mm-google-shopping", key: "age_group" },
    { ownerId: product.id, namespace: "mm-google-shopping", key: "gender" }
  ]);
  if (!identifiers.length) return;
  if (!APPLY) {
    console.log(`[DRY DELETE] ${identifiers.length} age/gender metafields`);
    return;
  }
  const data = await gql(
    `mutation DeleteMetafields($metafields: [MetafieldIdentifierInput!]!) {
      metafieldsDelete(metafields: $metafields) { userErrors { field message } }
    }`,
    { metafields: identifiers }
  );
  const errors = data.metafieldsDelete.userErrors || [];
  if (errors.length) throw new Error(`metafieldsDelete: ${JSON.stringify(errors)}`);
}

async function updateVariantSkuBarcodes(products) {
  let updated = 0;
  for (const product of products) {
    for (const variant of product.variants.nodes) {
      const targetSku = variant.sku || sku(product);
      if (!targetSku || (variant.sku === targetSku && variant.barcode === targetSku)) continue;
      if (APPLY) {
        await rest(`/variants/${variant.legacyResourceId}.json`, {
          method: "PUT",
          body: JSON.stringify({ variant: { id: Number(variant.legacyResourceId), sku: targetSku, barcode: targetSku } })
        });
      }
      updated += 1;
    }
  }
  console.log(`${APPLY ? "Updated" : "Would update"} ${updated} variant SKU/barcodes.`);
}

function sortBucket(product, config) {
  if (config.draftSkuKeys?.has(skuKey(product))) return 4;
  if (product.status === "ACTIVE" && product.images.nodes.length > 0 && product.totalInventory > 0) return 0;
  if (product.status === "ACTIVE" && product.images.nodes.length > 0) return 1;
  if (product.status === "ACTIVE") return 2;
  return 3;
}

async function reorderCollection(collection, products, config) {
  const ordered = [...products].sort((a, b) => sortBucket(a, config) - sortBucket(b, config));
  const moves = ordered.map((product, index) => ({ id: product.id, newPosition: String(index) }));
  if (!APPLY) {
    console.log(`[DRY REORDER] ${config.handle}: ${moves.length} products, first 6: ${ordered.slice(0, 6).map((product) => code(product)).join(", ")}`);
    return;
  }
  const data = await gql(
    `mutation Reorder($id: ID!, $moves: [MoveInput!]!) {
      collectionReorderProducts(id: $id, moves: $moves) { job { id done } userErrors { field message } }
    }`,
    { id: collection.id, moves }
  );
  const errors = data.collectionReorderProducts.userErrors || [];
  if (errors.length) throw new Error(`collectionReorderProducts ${config.handle}: ${JSON.stringify(errors)}`);
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

async function fetchCollectionRefs() {
  const refs = {};
  for (const config of COLLECTIONS) {
    const data = await gql(`query Collection($handle: String!) { collectionByHandle(handle: $handle) { id handle title } }`, { handle: config.handle });
    if (data.collectionByHandle) refs[config.handle] = data.collectionByHandle;
  }
  return refs;
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  const refs = {
    deities: await fetchMetaobjectRefs("deity_group", DEITY_HANDLES),
    ornaments: await fetchMetaobjectRefs("deity_ornament_type", ORNAMENT_HANDLES),
    collections: await fetchCollectionRefs()
  };

  const summaries = [];
  for (const config of COLLECTIONS) {
    const { collection, products } = await fetchCollectionAndProducts(config.handle);
    await draftProducts(products, config);
    const activeProducts = products.filter((product) => product.status === "ACTIVE" && !config.draftSkuKeys?.has(skuKey(product)));
    console.log(`\n${config.handle}: total=${products.length}, active_to_update=${activeProducts.length}, draft_skipped=${products.length - activeProducts.length}`);
    await updateCollection(collection, config, refs);
    await setMetafields(activeProducts.flatMap((product) => productMetafields(product, config, refs)));
    for (const product of activeProducts) await updateProduct(product, config, refs);
    await deleteWrongGoogleFields(activeProducts);
    await updateVariantSkuBarcodes(activeProducts);
    await reorderCollection(collection, products, config);
    summaries.push({ handle: config.handle, total: products.length, updated: activeProducts.length });
  }

  console.log("\nSummary:");
  for (const row of summaries) console.log(`${row.handle}: updated active products=${row.updated}, total collection products=${row.total}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
