#!/usr/bin/env node
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const ENV_FILE = getArg("--env") || "env";

const env = readEnv(ENV_FILE);
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;

if (!SHOP || !TOKEN) {
  console.error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN");
  process.exit(1);
}

const pilot = [
  {
    handle: "varalakshmi-deity-jewellery",
    role: "festival",
    deity: "varalakshmi-lakshmi-amman",
    faq: "varalakshmi",
    intro:
      "Varalakshmi, Lakshmi and Amman alankaram jewellery and decoration selected for Vratham setup, deity size, ornament type and placement.",
    fit:
      "Start with idol or doll height, then check face width, crown space, hands and legs placement, garland drop and decoration area before ordering.",
    regional: ["Varalakshmi", "Vara Lakshmi", "Varamahalakshmi", "Amman", "Lakshmi", "Thayar", "alankaram"],
    subcollections: [
      "vara-lakshmi-dolls",
      "varalakshmi-doll-faces",
      "hands-legs-for-varalakshmi-idol",
      "vagamalai-thomala",
      "deity-crowns-1",
      "deity-necklace",
      "waist-belt-vaddanam-jewellery-for-hindu-gods-goddess-1",
      "deity-accessories-nose-rings-mustache-weapons-taira"
    ],
    priority: 10
  },
  {
    handle: "vara-lakshmi-dolls",
    role: "festival",
    deity: "varalakshmi-lakshmi-amman",
    ornament: "full-alankaram-idol-set",
    faq: "varalakshmi",
    intro: "Varamahalakshmi and Amman dolls, idols and pooja decoration pieces for festive alankaram setup.",
    fit: "Check total idol or doll height, base width, face/crown placement and pooja mandir space before choosing a setup.",
    regional: ["Varamahalakshmi", "Varalakshmi doll", "Amman doll", "Lakshmi idol", "pooja decoration"],
    priority: 20
  },
  {
    handle: "varalakshmi-doll-faces",
    role: "festival",
    deity: "varalakshmi-lakshmi-amman",
    ornament: "face-idol-decoration",
    faq: "varalakshmi",
    intro: "Varalakshmi idol faces for Amman, Lakshmi and Devi alankaram, selected by face size and crown pairing.",
    fit: "Measure face width, forehead area and available crown height before pairing a face with crowns, hands, legs and garlands.",
    regional: ["Varalakshmi face", "Ammavaru face", "Amman face", "Lakshmi face", "Devi face"],
    priority: 30
  },
  {
    handle: "hands-legs-for-varalakshmi-idol",
    role: "festival",
    deity: "varalakshmi-lakshmi-amman",
    ornament: "hands-legs-hastham-padam",
    faq: "varalakshmi",
    intro: "Hands and legs for Varalakshmi, Lakshmi and Amman idol or doll alankaram.",
    fit: "Check doll height, hand placement, leg placement and dress width so hastham and padam sit naturally.",
    regional: ["hands", "legs", "hastham", "padam", "ashtapatham", "Varalakshmi hands"],
    priority: 40
  },
  {
    handle: "vagamalai-thomala",
    role: "festival",
    deity: "varalakshmi-lakshmi-amman",
    ornament: "general-accessories",
    faq: "varalakshmi",
    intro: "Vagamalai, thomala and bhujalu accessories for Varalakshmi and Amman festive alankaram.",
    fit: "Check idol height, shoulder width, garland drop and dress volume before choosing vagamalai or thomala pieces.",
    regional: ["vagamalai", "thomala", "bhujalu", "garland", "Amman alankaram"],
    priority: 50
  },
  {
    handle: "deity-crowns-1",
    role: "ornament_first",
    ornament: "crown-mukut-kireedam",
    crownStandard: "open-back-crown-fit-check",
    faq: "crown",
    intro: "Deity crowns, mukut and kireedam for Hindu god and goddess idols, selected by idol height, head width and crown shape.",
    fit:
      "For crowns, idol height alone is not enough. Check head or face width, crown inner width, crown height, depth, arc or circumference and fastening method.",
    regional: ["crown", "mukut", "kireedam", "kireetam", "kirita", "god crown"],
    priority: 60
  },
  {
    handle: "deity-necklace",
    role: "ornament_first",
    faq: "necklace",
    intro: "Deity necklaces and harams for god and goddess idol alankaram, selected by idol height, chest width and drop length.",
    fit: "Check idol height, neck or chest width, necklace drop and dress drape before choosing a deity necklace.",
    regional: ["deity necklace", "haram", "haar", "mala", "malai", "god jewellery"],
    priority: 70
  },
  {
    handle: "deity-short-harams",
    role: "ornament_first",
    ornament: "short-haram-necklace",
    faq: "necklace",
    intro: "Short harams and short deity necklaces for the neck or upper chest area of god and goddess idols.",
    fit: "Measure the idol neck or upper chest area and compare with the short necklace width and drop before ordering.",
    regional: ["short necklace", "haar", "mala", "deity necklace"],
    priority: 80
  },
  {
    handle: "deity-long-harams",
    role: "ornament_first",
    ornament: "long-haram",
    faq: "necklace",
    intro: "Long harams for deity idols when the jewellery should fall lower across the body, dress or chest.",
    fit: "Check idol height, chest width, dress drape and haram drop length before choosing a long haram.",
    regional: ["long haram", "long necklace", "haar", "mala", "malai"],
    priority: 90
  },
  {
    handle: "waist-belt-vaddanam-jewellery-for-hindu-gods-goddess-1",
    role: "ornament_first",
    ornament: "vaddanam-waist-belt",
    faq: "waist",
    intro: "Deity waist belts, vaddanam and oddiyanam for Hindu god and goddess idol alankaram.",
    fit: "Measure the idol waist or dress width where the belt will sit. Sitting posture and wide draping can change vaddanam fit.",
    regional: ["vaddanam", "oddiyanam", "waist belt", "kamarband", "kati sutra"],
    priority: 100
  },
  {
    handle: "deity-accessories-nose-rings-mustache-weapons-taira",
    role: "accessory",
    ornament: "general-accessories",
    faq: "accessory",
    intro: "Small deity accessories including nose rings, taira, weapons, moustache pieces and ornament details for idol alankaram.",
    fit: "For small accessories, match the deity symbol and placement first, then check the measured product size against the idol face or body.",
    regional: ["deity accessories", "alankaram accessories", "taira", "weapons", "mustache", "idol accessories"],
    priority: 110
  },
  {
    handle: "buy-stone-nathu-bullaku-nose-rings-for-goddess-amman-jewelry",
    role: "ornament_first",
    ornament: "nose-ring-nath-bullaku",
    faq: "accessory",
    intro: "Deity nose rings, nath and bullaku for Amman, Lakshmi, Devi and goddess idol alankaram.",
    fit: "Measure the idol nose and face area carefully because small nose ornaments change proportion quickly.",
    regional: ["nose ring", "nath", "naath", "bullaku", "bullak", "Amman jewellery"],
    priority: 120
  }
];

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

async function gql(query, variables = {}) {
  const res = await fetch(ENDPOINT, {
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

async function metaobjectId(type, handle) {
  const data = await gql(
    `query Metaobject($handle: MetaobjectHandleInput!) {
      metaobjectByHandle(handle: $handle) { id handle type displayName }
    }`,
    { handle: { type, handle } }
  );
  return data.metaobjectByHandle?.id || null;
}

async function collectionId(handle) {
  const data = await gql(
    `query Collection($query: String!) {
      collections(first: 1, query: $query) { nodes { id handle title } }
    }`,
    { query: `handle:${handle}` }
  );
  return data.collections.nodes[0]?.id || null;
}

function mf(ownerId, key, type, value) {
  return { ownerId, namespace: "custom", key, type, value: String(value) };
}

async function setMetafields(metafields) {
  const mutation = `
    mutation SetMetafields($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { id key type value }
        userErrors { field message code }
      }
    }
  `;
  const data = await gql(mutation, { metafields });
  const errors = data.metafieldsSet.userErrors || [];
  if (errors.length) throw new Error(`metafieldsSet: ${JSON.stringify(errors)}`);
  return data.metafieldsSet.metafields;
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  const deityId = await metaobjectId("deity_group", "varalakshmi-lakshmi-amman");
  if (!deityId) throw new Error("Missing deity_group:varalakshmi-lakshmi-amman");

  for (const row of pilot) {
    const ownerId = await collectionId(row.handle);
    if (!ownerId) {
      console.warn(`[MISSING COLLECTION] ${row.handle}`);
      continue;
    }

    const metafields = [
      mf(ownerId, "collection_role", "single_line_text_field", row.role),
      mf(ownerId, "deity_first_enabled", "boolean", "true"),
      mf(ownerId, "faq_family", "single_line_text_field", row.faq),
      mf(ownerId, "collection_intro", "multi_line_text_field", row.intro),
      mf(ownerId, "size_fit_intro", "multi_line_text_field", row.fit),
      mf(ownerId, "regional_keyword_cluster", "list.single_line_text_field", JSON.stringify(row.regional)),
      mf(ownerId, "sort_priority", "number_integer", row.priority)
    ];

    if (row.deity) metafields.push(mf(ownerId, "primary_deity_ref", "metaobject_reference", deityId));
    if (row.ornament) {
      const ornamentId = await metaobjectId("deity_ornament_type", row.ornament);
      if (!ornamentId) throw new Error(`Missing deity_ornament_type:${row.ornament}`);
      metafields.push(mf(ownerId, "ornament_type_ref", "metaobject_reference", ornamentId));
    }
    if (row.crownStandard) {
      const crownId = await metaobjectId("deity_crown_size_standard", row.crownStandard);
      if (!crownId) throw new Error(`Missing deity_crown_size_standard:${row.crownStandard}`);
      metafields.push(mf(ownerId, "crown_size_standard_ref", "metaobject_reference", crownId));
    }
    if (row.subcollections?.length) {
      const ids = [];
      for (const handle of row.subcollections) {
        const id = await collectionId(handle);
        if (id) ids.push(id);
        else console.warn(`[MISSING SUBCOLLECTION] ${row.handle} -> ${handle}`);
      }
      if (ids.length) metafields.push(mf(ownerId, "subcollections", "list.collection_reference", JSON.stringify(ids)));
    }

    if (!APPLY) {
      console.log(`[DRY-RUN MAP] ${row.handle} fields=${metafields.map((field) => field.key).join(",")}`);
      continue;
    }

    await setMetafields(metafields);
    console.log(`[MAPPED] ${row.handle}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
