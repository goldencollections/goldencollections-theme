#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const ENV_FILE = getArg("--env") || "env";
const ONLY_HANDLES = (getArg("--handle") || "")
  .split(",")
  .map((handle) => handle.trim())
  .filter(Boolean);
const env = readEnv(ENV_FILE);
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const GRAPHQL_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;

if (!SHOP || !TOKEN) {
  console.error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
  process.exit(1);
}

const regularTop = [
  "bharatanatyam-jewellery-sets",
  "bharatanatyam-dance-necklace-long-and-short",
  "bharatanatyam-dance-accessories-flower-hair-head-set-maang-tikka-mattal-makeup",
  "bharatnatyam-dance-jewellery-kids-collection",
  "kemp-jewellery",
  "kemp-black-jewellery",
  "bharatanatyam-hair-accessories",
  "bharatanatyam-ghungroo",
  "bharatanatyam-bangles",
  "bharatanatyam-practice-sarees",
  "nattuvangam-thattu-kazhi-bharatanatyam-chembu-and-dance-plate"
];

const regularSets = [
  "bharatanatyam-jewellery-sets",
  "bharatnatyam-dance-jewellery-kids-collection",
  "bharatanatyam-dance-necklace-long-and-short",
  "bharatanatyam-dance-accessories-flower-hair-head-set-maang-tikka-mattal-makeup",
  "bharatanatyam-hair-accessories",
  "bharatanatyam-makeup-hair-essentials",
  "nattuvangam-thattu-kazhi-bharatanatyam-chembu-and-dance-plate"
];
const regularNecklaces = ["bharatanatyam-short-necklaces", "bharatanatyam-long-necklace"];
const regularAccessories = [
  "bharatanatyam-headset-jewelry",
  "bharatanatyam-maang-tikka-matil",
  "mattal-matil-bharatanatyam-dance",
  "bharatanatyam-earrings-collection",
  "bharatanatyam-waist-belts",
  "bharatanatyam-nose-pin",
  "bharatanatyam-nose-pin-collection",
  "bharatanatyam-rakodi",
  "bharatanatyam-sun-moon",
  "bharatanatyam-vanki-baju-band",
  "drama-dance-crowns"
];
const regularHair = [
  "bharatanatyam-flowers",
  "bharatanatyam-hair-buns-dance-donuts-full-half-rings",
  "bharatanatyam-hair-crowns",
  "bharatanatyam-jada-jadai-kunjalam-sets",
  "bharatanatyam-makeup-hair-essentials"
];
const kempChildren = [
  "kemp-bharatanatyam-jewellery-dance-sets",
  "kemp-short-haram",
  "kemp-long-necklace",
  "kemp-headset",
  "kemp-mang-tikka",
  "kemp-mattal-ear-chains",
  "kemp-earrings",
  "kemp-vaddanam-waistbelt",
  "kemp-accessories",
  "kemp-mattal"
];
const blackKempChildren = [
  "kemp-black-bharatanatyam-kuchipudi-dance-jewellery-set",
  "kemp-black-short-necklace",
  "kemp-black-long-haram",
  "premium-black-kemp-headsets-nethichutti",
  "kemp-black-nethi-chutti-maang-tikka",
  "kemp-black-mattal",
  "kemp-black-earrings-jhumki-jhumka",
  "black-kemp-vaddanam-temple-jewellery-oddiyanam",
  "black-kemp-bharatanatyam-accessories"
];

const baseKeywords = [
  "Bharatanatyam jewellery",
  "Bharatanatyam jewelry",
  "Kuchipudi jewellery",
  "classical dance jewellery",
  "temple jewellery for dance",
  "arangetram jewellery",
  "dance performance jewellery",
  "South Indian dance jewellery",
  "Natyam jewellery"
];

const kempKeywords = [
  ...baseKeywords,
  "real kemp jewellery",
  "kemp jewellery",
  "Kempu stones",
  "premium temple jewellery",
  "arangetram kemp jewellery"
];

const blackKempKeywords = [
  ...baseKeywords,
  "black kemp jewellery",
  "black kemp dance set",
  "black kemp necklace",
  "black kemp long haram",
  "black kemp accessories"
];

const mattalKeywords = [
  ...baseKeywords,
  "mattal",
  "matil",
  "mattel",
  "ear mattal",
  "ear chain mattal",
  "mattal ear chain",
  "earrings mattal",
  "Bharatanatyam mattal",
  "Kuchipudi mattal",
  "temple jewellery ear chain"
];

const kempMattalKeywords = [
  ...mattalKeywords,
  "kemp mattal",
  "real kemp mattal"
];

const kidsJewelleryKeywords = [
  ...baseKeywords,
  "kids jewellery set",
  "kids jewellery sets",
  "children's jewellery set",
  "children's Bharatanatyam jewellery set",
  "kids Bharatanatyam jewellery",
  "Bharatanatyam jewellery for kids",
  "Indian dance jewellery for kids",
  "South Indian jewellery for children",
  "kids dance jewellery set",
  "young dancer jewellery"
];

function getArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index + 1 >= process.argv.length) return null;
  return process.argv[index + 1];
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

function html(paragraphs) {
  return paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("");
}

function truncate(value, limit) {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit - 1).trimEnd()}`;
}

function child({
  handle,
  title,
  intro,
  fit,
  faq = "dance_accessory",
  shoppingPath = title,
  keywords = baseKeywords,
  subcollections = [],
  related = regularTop,
  templateSuffix = "dance-product-v4",
  description,
  seoTitle,
  seoDescription
}) {
  return {
    handle,
    title,
    templateSuffix,
    descriptionHtml: description || html([intro, fit]),
    seoTitle: seoTitle || truncate(`${title} | Bharatanatyam Dance Jewellery`, 70),
    seoDescription:
      seoDescription || truncate(`${intro} ${fit}`.replace(/\s+/g, " "), 155),
    metafields: {
      display_title: title,
      collection_intro: intro,
      size_fit_intro: fit,
      faq_family: faq,
      collection_role: "dance_product_collection",
      shopping_path_label: shoppingPath,
      regional_keyword_cluster: keywords,
      subcollections,
      related_collection_refs: related,
      parent_menu_handles: "bharatanatyam-collection-circles"
    }
  };
}

const configs = [
  {
    handle: "bharatanatyam-jewellery",
    title: "Bharatanatyam Jewellery",
    templateSuffix: "bharatanatyam-jewellery",
    descriptionHtml: html([
      "Shop Bharatanatyam and Kuchipudi jewellery by performance collection, including complete dance sets, short necklaces, long harams, headsets, nethi chutti, mattal, earrings, waist belts, hair accessories, ghungroo, real kemp and black kemp.",
      "Start with costume colors, dancer comfort, teacher requirements and performance type. For arangetram, many buyers begin with a complete set and then add matching jada, rakodi, flowers, salangai or role-specific accessories."
    ]),
    seoTitle: "Bharatanatyam Jewellery for Dance and Arangetram",
    seoDescription:
      "Shop Bharatanatyam and Kuchipudi jewellery collections for dance sets, short necklaces, long harams, accessories, real kemp and black kemp.",
    metafields: {
      display_title: "Bharatanatyam Jewellery",
      collection_intro:
        "Bharatanatyam and Kuchipudi jewellery collections for arangetram, stage performances, dance institutes and regular practice-to-performance needs.",
      size_fit_intro:
        "Choose by costume colors, neckline, haram drop, headset fit, waist belt length, hairstyle, dancer comfort and the teacher's required performance list.",
      faq_family: "dance_hub",
      collection_role: "dance_hub",
      shopping_path_label: "Dance Sets / Necklaces / Accessories",
      regional_keyword_cluster: baseKeywords,
      subcollections: regularTop,
      related_collection_refs: ["kemp-jewellery", "kemp-black-jewellery", "bharatanatyam-jewellery-sets"],
      parent_menu_handles: "bharatanatyam-collection-circles"
    }
  },
  {
    handle: "kemp-jewellery",
    title: "Real Kemp Jewellery",
    templateSuffix: "real-kemp",
    descriptionHtml: html([
      "Shop real kemp jewellery for Bharatanatyam, Kuchipudi, arangetram ceremonies, senior performances and premium South Indian classical styling.",
      "Real kemp is the premium path compared with regular dance jewellery. Compare full sets and individual components by finish, stone color, dancer size and whether the item will be used for arangetram, bridal classical styling or long-term stage use."
    ]),
    seoTitle: "Real Kemp Jewellery for Arangetram and Dance",
    seoDescription:
      "Shop premium real kemp jewellery for Bharatanatyam, Kuchipudi, arangetram, senior dance performances and classical temple styling.",
    metafields: {
      display_title: "Real Kemp Jewellery",
      collection_intro:
        "Premium real kemp jewellery collections for arangetram, senior Bharatanatyam and Kuchipudi performances, bridal classical styling and long-term stage use.",
      size_fit_intro:
        "Match the visible set finish first, then compare necklace drop, haram length, mattal length, headset placement, waist belt size and costume colors.",
      faq_family: "real_kemp",
      collection_role: "dance_hub",
      shopping_path_label: "Premium Kemp Sets / Components",
      regional_keyword_cluster: kempKeywords,
      subcollections: kempChildren,
      related_collection_refs: ["bharatanatyam-jewellery", "kemp-black-jewellery", "kemp-bharatanatyam-jewellery-dance-sets"],
      parent_menu_handles: "bharatanatyam-collection-circles"
    }
  },
  {
    handle: "kemp-black-jewellery",
    title: "Black Kemp Jewellery",
    templateSuffix: "black-kemp",
    descriptionHtml: html([
      "Shop black kemp jewellery for Bharatanatyam and Kuchipudi costume matching, including dance sets, short necklaces, long harams, mattal, earrings, headsets, nethi chutti, vaddanam and accessories.",
      "Black kemp is chosen when the costume needs a stronger contrast while keeping a classical temple jewellery look. Build the set by matching finish, stone color, scale and placement across the visible ornaments."
    ]),
    seoTitle: "Black Kemp Jewellery for Bharatanatyam Dance",
    seoDescription:
      "Shop black kemp jewellery for Bharatanatyam and Kuchipudi dance sets, short necklaces, long harams, mattal, headset and vaddanam.",
    metafields: {
      display_title: "Black Kemp Jewellery",
      collection_intro:
        "Black kemp jewellery collections for Bharatanatyam and Kuchipudi costume contrast, stage styling, dance sets and matching components.",
      size_fit_intro:
        "For black kemp, keep the visible set finish consistent. Compare necklace, long haram, earrings, mattal, headset and waist belt against costume color and stage lighting.",
      faq_family: "black_kemp",
      collection_role: "dance_hub",
      shopping_path_label: "Black Kemp Sets / Components",
      regional_keyword_cluster: blackKempKeywords,
      subcollections: blackKempChildren,
      related_collection_refs: ["bharatanatyam-jewellery", "kemp-jewellery", "kemp-black-bharatanatyam-kuchipudi-dance-jewellery-set"],
      parent_menu_handles: "bharatanatyam-collection-circles"
    }
  },

  child({
    handle: "bharatanatyam-jewellery-sets",
    title: "Bharatanatyam Dance Sets",
    faq: "dance_set",
    intro:
      "Complete Bharatanatyam dance sets for arangetram, stage programs, dance institute performances and coordinated classical looks.",
    fit:
      "Check included items before ordering, especially short necklace, long haram, earrings, mattal, headset, vaddanam, vanki, bangles and whether jada, rakodi, flowers or ghungroo are separate.",
    shoppingPath: "Complete Dance Sets",
    subcollections: regularSets,
    related: regularTop
  }),
  child({
    handle: "bharatnatyam-dance-jewellery-kids-collection",
    title: "Kids Bharatanatyam Jewellery",
    faq: "dance_set",
    intro:
      "Kids Bharatanatyam jewellery sets for young dancers, school programs, cultural events, class, Kuchipudi styling and junior stage performances.",
    fit:
      "Compare product photos, included pieces, necklace drop, waist belt length, headset placement, earring comfort, costume size and the teacher's required list before ordering.",
    shoppingPath: "Kids Dance Jewellery",
    keywords: kidsJewelleryKeywords,
    seoTitle: "Kids Bharatanatyam Jewellery Sets",
    seoDescription:
      "Shop kids Bharatanatyam jewellery sets and children's dance jewellery for school programs, class, Kuchipudi styling and stage performances.",
    related: regularTop
  }),
  child({
    handle: "bharatanatyam-dance-necklace-long-and-short",
    title: "Bharatanatyam Necklaces",
    faq: "dance_necklace",
    intro:
      "Shop Bharatanatyam necklaces for classical dance, including short necklace and long haram styles used for arangetram, stage programs, Kuchipudi costume matching and layered temple jewellery looks.",
    fit:
      "Use a short necklace for neckline or upper-chest framing and a long haram for lower costume balance. Match metal finish, stone color, pendant scale, blouse neckline, dancer height and costume pleats before ordering.",
    shoppingPath: "Short Necklace / Long Haram",
    keywords: [
      ...baseKeywords,
      "Bharatanatyam necklace",
      "Bharatanatyam short necklace",
      "Bharatanatyam long haram",
      "Kuchipudi necklace",
      "arangetram necklace",
      "dance long haram",
      "addigai",
      "padakkam",
      "temple jewellery necklace"
    ],
    subcollections: regularNecklaces,
    related: ["bharatanatyam-short-necklaces", "bharatanatyam-long-necklace", "bharatanatyam-jewellery-sets"],
    description: html([
      "Shop Bharatanatyam necklaces for dancers choosing short necklace and long haram layers for arangetram, stage performance, dance institute programs and Kuchipudi costume styling.",
      "A short necklace sits near the neck or upper chest and frames the face, blouse neckline and earrings. A long haram falls lower on the costume and helps balance the pleats, pendant scale and full stage proportion.",
      "For the cleanest performance look, compare the dancer age group, blouse neckline, dancer height, costume colors, metal finish, stone color and pendant scale before mixing necklace pieces from different sets."
    ]),
    seoTitle: "Bharatanatyam Necklaces: Short Necklace & Long Haram",
    seoDescription:
      "Shop Bharatanatyam short necklaces and long harams for arangetram, Kuchipudi and classical dance stage costumes. Choose by placement, finish and size.",
    templateSuffix: "dance-product-v4"
  }),
  child({
    handle: "bharatanatyam-short-necklaces",
    title: "Bharatanatyam Short Necklace",
    faq: "dance_short_necklace",
    intro:
      "Shop Bharatanatyam short necklaces for upper-chest and neckline placement in classical dance costumes, including arangetram, stage programs and Kuchipudi styling.",
    fit:
      "Compare necklace width, drop and pendant scale with the dancer's blouse neckline, earrings, mattal and long haram. Leave enough visual space between the short necklace and lower haram layer.",
    shoppingPath: "Short Necklace",
    keywords: [
      ...baseKeywords,
      "Bharatanatyam short necklace",
      "short necklace for Bharatanatyam",
      "Kuchipudi short necklace",
      "arangetram short necklace",
      "dance short necklace",
      "addigai",
      "padakkam necklace",
      "temple jewellery short necklace"
    ],
    subcollections: regularNecklaces,
    related: ["bharatanatyam-long-necklace", "bharatanatyam-dance-necklace-long-and-short", "bharatanatyam-jewellery-sets"],
    description: html([
      "Shop Bharatanatyam short necklaces for dancers who need a defined upper-chest jewellery layer for arangetram, school programs, stage performance and Kuchipudi costume styling.",
      "A short necklace frames the blouse neckline, earrings and face from stage distance. It is usually paired with a long haram for a complete layered dance look, especially for formal performances.",
      "Before ordering, compare necklace width, pendant scale, metal finish, stone color, dancer age group, blouse neckline and the space available above the long haram."
    ]),
    seoTitle: "Bharatanatyam Short Necklace for Dance Costume",
    seoDescription:
      "Shop Bharatanatyam short necklaces for arangetram, Kuchipudi and stage costumes. Choose by neckline placement, pendant scale, finish and matching long haram.",
    templateSuffix: "dance-product-v4"
  }),
  child({
    handle: "bharatanatyam-long-necklace",
    title: "Bharatanatyam Long Haram",
    faq: "dance_long_haram",
    intro:
      "Shop Bharatanatyam long harams for lower costume placement, arangetram stage styling, temple jewellery layering and Kuchipudi dance costumes.",
    fit:
      "Check how low the long haram should fall on the costume and whether it balances dancer height, pleats, pendant size, waist belt, short necklace and earrings.",
    shoppingPath: "Long Haram",
    keywords: [
      ...baseKeywords,
      "Bharatanatyam long haram",
      "long haram for Bharatanatyam",
      "Kuchipudi long haram",
      "arangetram long haram",
      "dance long haram",
      "temple jewellery haram",
      "long necklace for dance costume"
    ],
    subcollections: regularNecklaces,
    related: ["bharatanatyam-short-necklaces", "bharatanatyam-dance-necklace-long-and-short", "bharatanatyam-jewellery-sets"],
    description: html([
      "Shop Bharatanatyam long harams for dancers who need lower costume balance for arangetram, senior stage performance, dance institute programs and Kuchipudi costume styling.",
      "A long haram falls below the short necklace and helps the full costume look complete from stage distance. It should balance the pleats, pendant scale, waist belt and blouse jewellery without crowding the upper chest.",
      "Before ordering, compare the long haram drop, dancer height, costume colors, stone color, metal finish and whether it matches the existing short necklace, earrings and mattal."
    ]),
    seoTitle: "Bharatanatyam Long Haram for Dance Costume",
    seoDescription:
      "Shop Bharatanatyam long harams for arangetram, Kuchipudi and classical dance costumes. Choose by drop, stage balance, finish and matching short necklace.",
    templateSuffix: "dance-product-v4"
  }),
  child({
    handle: "bharatanatyam-dance-accessories-flower-hair-head-set-maang-tikka-mattal-makeup",
    title: "Bharatanatyam Dance Accessories",
    faq: "dance_accessory_root",
    intro:
      "Bharatanatyam dance accessories for completing the stage look, including headset, nethi chutti, mattal, earrings, waist belts, rakodi, sun and moon and dance crowns.",
    fit:
      "Match every accessory to hairstyle, costume colors, dancer age group and placement. Head, ear and waist pieces should be checked for comfort and stage stability.",
    shoppingPath: "Head / Ear / Waist Accessories",
    subcollections: regularAccessories,
    related: regularTop
  }),
  child({
    handle: "bharatanatyam-hair-accessories",
    title: "Bharatanatyam Hair Accessories",
    faq: "dance_hair",
    intro:
      "Bharatanatyam hair accessories for buns, jada, flowers, hair crowns and makeup essentials used in classical dance styling.",
    fit:
      "Choose by hairstyle first, then check bun size, jada length, rakodi placement, flower coverage and whether the dancer needs full or half hair setup.",
    shoppingPath: "Hair Accessories",
    subcollections: regularHair,
    related: ["bharatanatyam-dance-accessories-flower-hair-head-set-maang-tikka-mattal-makeup", ...regularHair]
  }),
  child({
    handle: "bharatanatyam-bangles",
    title: "Bharatanatyam Bangles",
    faq: "dance_bangles",
    intro: "Bharatanatyam bangles for completing a coordinated dance jewellery and costume look.",
    fit: "Choose bangle size by wrist measurement and comfort, especially for young dancers and long stage programs.",
    shoppingPath: "Bangles",
    related: regularAccessories
  }),
  child({
    handle: "bharatanatyam-ghungroo",
    title: "Bharatanatyam Ghungroo",
    faq: "dance_ghungroo",
    intro: "Bharatanatyam ghungroo and salangai for practice, stage performance and arangetram preparation, also searched as chilanka, chilanga and gejje.",
    fit: "Choose by dancer level, teacher preference, comfort around the ankle, fastening style and the number of bells required for the performance.",
    shoppingPath: "Ghungroo / Salangai",
    related: regularTop
  }),
  child({
    handle: "bharatanatyam-headset-jewelry",
    title: "Bharatanatyam Headset",
    faq: "dance_head",
    intro: "Bharatanatyam headsets for classical dance stage styling with nethi chutti, sun and moon and hair accessories.",
    fit: "Check forehead placement, hair parting, bun position and whether the headset matches earrings, mattal and necklace finish.",
    shoppingPath: "Headset",
    related: regularAccessories
  }),
  child({
    handle: "bharatanatyam-maang-tikka-matil",
    title: "Bharatanatyam Nethi Chutti",
    faq: "dance_head",
    intro: "Bharatanatyam nethi chutti and maang tikka pieces for forehead placement in classical dance styling.",
    fit: "Compare forehead size, center placement, hair parting and how the piece sits with headset, sun and moon and earrings.",
    shoppingPath: "Nethi Chutti / Maang Tikka",
    related: regularAccessories
  }),
  child({
    handle: "bharatanatyam-earrings-collection",
    title: "Bharatanatyam Earrings",
    faq: "dance_ear",
    intro: "Bharatanatyam earrings and jhumki styles for matching dance necklaces, mattal and stage costume sets.",
    fit: "Check earring size, weight, ear comfort and whether mattal support is needed for long programs or younger dancers.",
    shoppingPath: "Earrings / Jhumki",
    related: regularAccessories
  }),
  child({
    handle: "mattal-matil-bharatanatyam-dance",
    title: "Bharatanatyam Mattal",
    faq: "dance_ear",
    intro: "Bharatanatyam ear mattal, matil and ear-chain styles for supporting earrings and completing the classical dance temple jewellery stage look.",
    fit: "Match mattal length with hairstyle, ear position and earring drop so the ear chain sits comfortably without pulling during performance.",
    shoppingPath: "Mattal / Matil",
    keywords: mattalKeywords,
    seoTitle: "Bharatanatyam Mattal & Ear Chains",
    seoDescription:
      "Shop Bharatanatyam mattal, matil and ear-chain styles for classical dance costumes. Choose by earring support, hairstyle placement, comfort and finish.",
    related: regularAccessories
  }),
  child({
    handle: "bharatanatyam-waist-belts",
    title: "Bharatanatyam Waist Belts",
    faq: "dance_waist",
    intro: "Bharatanatyam waist belts, vaddanam and oddiyanam pieces for dance costumes and stage performances.",
    fit: "Measure around the costume waist and check adjustability, dancer comfort, pleat placement and whether the belt stays secure during movement.",
    shoppingPath: "Waist Belt / Vaddanam",
    related: regularAccessories
  }),
  child({
    handle: "bharatanatyam-flowers",
    title: "Bharatanatyam Flowers",
    faq: "dance_hair",
    intro: "Bharatanatyam flowers for classical dance hair styling, bun decoration and jada finishing.",
    fit: "Choose flowers by hairstyle, bun size, jada length and costume colors so the hair setup looks complete from stage distance.",
    shoppingPath: "Flowers",
    related: regularHair
  }),
  child({
    handle: "bharatanatyam-hair-buns-dance-donuts-full-half-rings",
    title: "Bharatanatyam Hair Buns",
    faq: "dance_hair",
    intro: "Bharatanatyam hair buns, dance donuts and full or half rings for building a clean classical hairstyle base.",
    fit: "Choose the bun or donut size by dancer hair volume, age group and whether the style needs full bun, half ring or jada support.",
    shoppingPath: "Hair Buns / Donuts",
    related: regularHair
  }),
  child({
    handle: "bharatanatyam-hair-crowns",
    title: "Bharatanatyam Hair Crowns",
    faq: "dance_crown",
    intro: "Bharatanatyam hair crowns for dance roles, hair styling and classical costume finishing.",
    fit: "Check crown width, height, hairstyle placement and whether it coordinates with headset, rakodi and flowers.",
    shoppingPath: "Hair Crowns",
    related: regularHair
  }),
  child({
    handle: "bharatanatyam-jada-jadai-kunjalam-sets",
    title: "Bharatanatyam Jada",
    faq: "dance_hair",
    intro: "Bharatanatyam jada, jadai and kunjalam sets for braid decoration and complete arangetram hair styling.",
    fit: "Choose by braid length, dancer height, hairstyle plan and how the jada coordinates with rakodi, flowers and costume colors.",
    shoppingPath: "Jada / Jadai / Kunjalam",
    related: regularHair
  }),
  child({
    handle: "bharatanatyam-makeup-hair-essentials",
    title: "Bharatanatyam Makeup and Hair Essentials",
    faq: "dance_makeup",
    intro: "Bharatanatyam makeup and hair essentials for preparing the dancer's stage look.",
    fit: "Select essentials by the teacher's list, dancer age group, hairstyle and performance timeline.",
    shoppingPath: "Makeup / Hair Essentials",
    related: regularHair
  }),
  child({
    handle: "bharatanatyam-nose-pin",
    title: "Bharatanatyam Nose Pin",
    faq: "dance_nose",
    intro: "Bharatanatyam nose pins for classical dance styling and matching temple jewellery sets.",
    fit: "Check left or right placement, dancer comfort, size and how the nose pin matches earrings and necklace finish.",
    shoppingPath: "Nose Pin",
    related: regularAccessories
  }),
  child({
    handle: "bharatanatyam-nose-pin-collection",
    title: "Bharatanatyam Nose Pin",
    faq: "dance_nose",
    intro: "Bharatanatyam nose pin collection for dancers completing a traditional stage jewellery look.",
    fit: "Compare size, side, comfort and finish before pairing with earrings, mattal and necklace pieces.",
    shoppingPath: "Nose Pin",
    related: regularAccessories
  }),
  child({
    handle: "bharatanatyam-practice-sarees",
    title: "Bharatanatyam Practice Sarees",
    faq: "dance_practice",
    intro: "Bharatanatyam practice sarees for dancers who need comfortable regular practice wear.",
    fit: "Choose by dancer height, ease of movement, teacher preference and whether the saree will be used only for practice or simple programs.",
    shoppingPath: "Practice Sarees",
    related: regularTop
  }),
  child({
    handle: "bharatanatyam-rakodi",
    title: "Bharatanatyam Rakodi",
    faq: "dance_hair",
    intro: "Bharatanatyam rakodi pieces for bun placement and classical hair ornament styling.",
    fit: "Match rakodi size with bun diameter, flowers, sun and moon pieces and the dancer's complete hair setup.",
    shoppingPath: "Rakodi",
    related: regularAccessories
  }),
  child({
    handle: "bharatanatyam-sun-moon",
    title: "Bharatanatyam Sun and Moon",
    faq: "dance_head",
    intro: "Bharatanatyam sun and moon ornaments for traditional classical dance hair and head styling.",
    fit: "Place sun and moon with the headset and bun layout in mind, then match finish and scale with the rest of the visible jewellery.",
    shoppingPath: "Sun and Moon",
    related: regularAccessories
  }),
  child({
    handle: "bharatanatyam-vanki-baju-band",
    title: "Bharatanatyam Vanki and Bajuband",
    faq: "dance_arm",
    intro: "Bharatanatyam vanki and bajuband arm ornaments for classical dance costume styling.",
    fit: "Check upper arm comfort, adjustability, costume sleeve placement and whether the finish matches the waist belt and necklaces.",
    shoppingPath: "Vanki / Bajuband",
    related: regularAccessories
  }),
  child({
    handle: "nattuvangam-thattu-kazhi-bharatanatyam-chembu-and-dance-plate",
    title: "Nattuvangam Thattu and Dance Plate",
    faq: "dance_instrument",
    intro: "Nattuvangam thattu, kazhi, chembu and dance plate pieces for Bharatanatyam performance and teaching needs.",
    fit: "Choose by teacher preference, handling comfort, sound expectation and whether the item is for class use, stage use or ceremony.",
    shoppingPath: "Nattuvangam / Dance Plate",
    related: regularTop
  }),
  child({
    handle: "drama-dance-crowns",
    title: "Drama and Dance Crowns",
    faq: "dance_crown",
    intro: "Drama and dance crowns for Bharatanatyam roles, stage productions, deity-inspired character looks and classical performance styling.",
    fit: "Check head placement, crown height, role requirement, hair support and comfort before selecting a crown for performance.",
    shoppingPath: "Drama / Dance Crowns",
    related: regularAccessories
  }),

  ...kempChildren.map((handle) => {
    const titles = {
      "kemp-bharatanatyam-jewellery-dance-sets": "Real Kemp Dance Sets",
      "kemp-short-haram": "Real Kemp Short Necklace",
      "kemp-long-necklace": "Real Kemp Long Haram",
      "kemp-headset": "Real Kemp Headset",
      "kemp-mang-tikka": "Real Kemp Nethi Chutti",
      "kemp-mattal-ear-chains": "Real Kemp Mattal Ear Chains",
      "kemp-earrings": "Real Kemp Earrings",
      "kemp-vaddanam-waistbelt": "Real Kemp Vaddanam",
      "kemp-accessories": "Real Kemp Accessories",
      "kemp-mattal": "Real Kemp Mattal"
    };
    const title = titles[handle];
    const isMattal = handle === "kemp-mattal-ear-chains" || handle === "kemp-mattal";
    return child({
      handle,
      title,
      faq: "real_kemp",
      keywords: isMattal ? kempMattalKeywords : kempKeywords,
      intro: isMattal
        ? "Real Kemp ear mattal and mattal ear chains for premium Bharatanatyam and Kuchipudi stage styling, arangetram ceremonies and long-term classical performance use."
        : `${title} for premium Bharatanatyam and Kuchipudi stage styling, arangetram ceremonies and long-term classical performance use.`,
      fit: isMattal
        ? "Match mattal length with hairstyle, ear position, earring drop and side-hair support so the ear chain sits comfortably without pulling during performance."
        : "Real kemp is a premium choice, so match finish, stone color and scale carefully. Compare placement, dancer size and existing jewellery before mixing components.",
      shoppingPath: title.replace("Real Kemp ", ""),
      seoTitle: handle === "kemp-mattal-ear-chains" ? "Real Kemp Ear Mattal & Mattal Ear Chains" : undefined,
      seoDescription: handle === "kemp-mattal-ear-chains"
        ? "Shop real kemp ear mattal, mattal ear chains and matil/mattel styles for Bharatanatyam and Kuchipudi stage, arangetram and bridal classical looks."
        : undefined,
      subcollections: kempChildren,
      related: ["kemp-jewellery", ...kempChildren.filter((item) => item !== handle)]
    });
  }),
  ...blackKempChildren.map((handle) => {
    const titles = {
      "kemp-black-bharatanatyam-kuchipudi-dance-jewellery-set": "Black Kemp Dance Sets",
      "kemp-black-short-necklace": "Black Kemp Short Necklace",
      "kemp-black-long-haram": "Black Kemp Long Haram",
      "premium-black-kemp-headsets-nethichutti": "Black Kemp Headset",
      "kemp-black-nethi-chutti-maang-tikka": "Black Kemp Nethi Chutti",
      "kemp-black-mattal": "Black Kemp Mattal",
      "kemp-black-earrings-jhumki-jhumka": "Black Kemp Earrings",
      "black-kemp-vaddanam-temple-jewellery-oddiyanam": "Black Kemp Vaddanam",
      "black-kemp-bharatanatyam-accessories": "Black Kemp Accessories"
    };
    const title = titles[handle];
    return child({
      handle,
      title,
      faq: "black_kemp",
      keywords: blackKempKeywords,
      intro: `${title} for Bharatanatyam and Kuchipudi costume contrast, stage styling and matching black kemp performance looks.`,
      fit:
        "Keep black kemp pieces consistent across necklace, long haram, earrings, mattal, headset and vaddanam. Compare costume color and stage lighting before mixing components.",
      shoppingPath: title.replace("Black Kemp ", ""),
      subcollections: blackKempChildren,
      related: ["kemp-black-jewellery", ...blackKempChildren.filter((item) => item !== handle)]
    });
  })
];

const uniqueHandles = [...new Set(configs.flatMap((config) => [
  config.handle,
  ...(config.metafields.subcollections || []),
  ...(config.metafields.related_collection_refs || [])
]))];
const targetConfigs = ONLY_HANDLES.length
  ? configs.filter((config) => ONLY_HANDLES.includes(config.handle))
  : configs;
const targetHandleSet = new Set(targetConfigs.map((config) => config.handle));
const targetRefHandles = [...new Set(targetConfigs.flatMap((config) => [
  config.handle,
  ...(config.metafields.subcollections || []),
  ...(config.metafields.related_collection_refs || [])
]))];

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

async function fetchCollections(handles) {
  const map = new Map();
  for (const handle of handles) {
    const data = await gql(
      `query CollectionByHandle($handle: String!) {
        collectionByHandle(handle: $handle) {
          id
          handle
          title
          templateSuffix
          productsCount { count }
          seo { title description }
        }
      }`,
      { handle }
    );
    if (!data.collectionByHandle) {
      console.warn(`[MISSING COLLECTION] ${handle}`);
      continue;
    }
    map.set(handle, data.collectionByHandle);
  }
  return map;
}

function refIds(handles, collectionMap, ownerHandle, key) {
  const ids = [];
  for (const handle of handles || []) {
    const collection = collectionMap.get(handle);
    if (!collection) {
      console.warn(`[MISSING REF] ${ownerHandle}.${key}: ${handle}`);
      continue;
    }
    ids.push(collection.id);
  }
  return ids;
}

function metafield(ownerId, key, type, value) {
  return { ownerId, namespace: "custom", key, type, value: String(value) };
}

function collectionMetafields(config, collectionMap) {
  const ownerId = collectionMap.get(config.handle).id;
  const fields = config.metafields;
  const subcollectionIds = refIds(fields.subcollections, collectionMap, config.handle, "subcollections");
  const relatedIds = refIds(fields.related_collection_refs, collectionMap, config.handle, "related_collection_refs");
  return [
    metafield(ownerId, "display_title", "single_line_text_field", fields.display_title),
    metafield(ownerId, "collection_intro", "multi_line_text_field", fields.collection_intro),
    metafield(ownerId, "size_fit_intro", "multi_line_text_field", fields.size_fit_intro),
    metafield(ownerId, "faq_family", "single_line_text_field", fields.faq_family),
    metafield(ownerId, "collection_role", "single_line_text_field", fields.collection_role),
    metafield(ownerId, "shopping_path_label", "single_line_text_field", fields.shopping_path_label),
    metafield(ownerId, "regional_keyword_cluster", "list.single_line_text_field", JSON.stringify(fields.regional_keyword_cluster)),
    metafield(ownerId, "subcollection_handles", "list.single_line_text_field", JSON.stringify(fields.subcollections || [])),
    metafield(ownerId, "subcollections", "list.collection_reference", JSON.stringify(subcollectionIds)),
    metafield(ownerId, "related_collection_refs", "list.collection_reference", JSON.stringify(relatedIds)),
    metafield(ownerId, "parent_menu_handles", "single_line_text_field", fields.parent_menu_handles)
  ];
}

async function updateCollection(config, collection) {
  const next = {
    title: config.title,
    descriptionHtml: config.descriptionHtml,
    templateSuffix: config.templateSuffix,
    seo: {
      title: config.seoTitle,
      description: config.seoDescription
    }
  };

  if (!APPLY) {
    console.log(
      `[DRY COLLECTION] ${config.handle}: title="${collection.title}" -> "${next.title}", template="${collection.templateSuffix || "default"}" -> "${next.templateSuffix}", products=${collection.productsCount.count}`
    );
    return;
  }

  const data = await gql(
    `mutation CollectionUpdate($input: CollectionInput!) {
      collectionUpdate(input: $input) {
        userErrors { field message }
      }
    }`,
    {
      input: {
        id: collection.id,
        ...next
      }
    }
  );
  const errors = data.collectionUpdate.userErrors || [];
  if (errors.length) throw new Error(`collectionUpdate ${config.handle}: ${JSON.stringify(errors)}`);
  console.log(`[UPDATED COLLECTION] ${config.handle}`);
}

async function setMetafields(inputs) {
  for (let index = 0; index < inputs.length; index += 20) {
    const chunk = inputs.slice(index, index + 20);
    if (!APPLY) {
      console.log(`[DRY METAFIELDS] ${chunk.length}`);
      continue;
    }
    const data = await gql(
      `mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          userErrors { field message code }
        }
      }`,
      { metafields: chunk }
    );
    const errors = data.metafieldsSet.userErrors || [];
    if (errors.length) throw new Error(`metafieldsSet: ${JSON.stringify(errors)}`);
    console.log(`[UPDATED METAFIELDS] ${chunk.length}`);
  }
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  console.log("Scope: collections only. Products, collection rules, inventory and sales channels are not modified.");
  if (ONLY_HANDLES.length) console.log(`Handle filter: ${ONLY_HANDLES.join(", ")}`);
  const collectionMap = await fetchCollections(ONLY_HANDLES.length ? targetRefHandles : uniqueHandles);
  const metafields = [];

  for (const config of targetConfigs) {
    const collection = collectionMap.get(config.handle);
    if (!collection) continue;
    await updateCollection(config, collection);
    metafields.push(...collectionMetafields(config, collectionMap));
  }

  await setMetafields(metafields);
  console.log(`${APPLY ? "Applied" : "Dry-run complete for"} ${targetConfigs.filter((config) => collectionMap.has(config.handle)).length} dance collections.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
