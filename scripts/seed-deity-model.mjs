#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const APPLY = process.argv.includes("--apply");
const ENV_FILE = getArg("--env") || "env";
const DATA_DIR = getArg("--data-dir") || "custom-data";

const env = readEnv(ENV_FILE);
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;

if (!SHOP || !TOKEN) {
  console.error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN");
  process.exit(1);
}

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

function readJsonl(file) {
  return fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
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

function fieldsToObject(row) {
  return Object.fromEntries(row.metaobject.fields.map((field) => [field.key, field.value]));
}

function objectToFieldInputs(fields) {
  return Object.entries(fields)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([key, value]) => ({ key, value: String(value) }));
}

function withCommon(fields, handle, index) {
  return {
    ...fields,
    slug: fields.slug || handle,
    status: fields.status || "active",
    sort_priority: fields.sort_priority || String((index + 1) * 10)
  };
}

function enrichDeityGroup(row, index) {
  const handle = row.handle.handle;
  const fields = fieldsToObject(row);
  return {
    handle: row.handle,
    fields: withCommon(
      {
        ...fields,
        collection_intro:
          fields.collection_intro ||
          fields.seo_intro ||
          `${fields.name} alankaram jewellery and accessories selected by deity, ornament type and idol size.`
      },
      handle,
      index
    )
  };
}

function enrichOrnamentType(row, index) {
  const handle = row.handle.handle;
  const fields = fieldsToObject(row);
  const labels = {
    "crown-mukut-kireedam": ["crown", "crown"],
    "short-haram-necklace": ["short-haram", "short-haram"],
    "long-haram": ["long-haram", "long-haram"],
    "vaddanam-waist-belt": ["vaddanam", "vaddanam"],
    earrings: ["earrings", "earrings"],
    "nose-ring-nath-bullaku": ["nose-ring", "nose-ring"],
    "hands-legs-hastham-padam": ["hands-legs", "hands-legs"],
    "tilak-namam-thiruman": ["tilak", "tilak"],
    "arch-prabhavali": ["arch", "arch"],
    "general-accessories": ["accessories", "accessories"]
  };
  const [label, suffix] = labels[handle] || [handle, handle];
  return {
    handle: row.handle,
    fields: withCommon(
      {
        ...fields,
        sizing_standard: fields.sizing_standard || (handle === "crown-mukut-kireedam" ? "crown" : "measured-ornament"),
        deity_first_label: fields.deity_first_label || label,
        collection_handle_suffix: fields.collection_handle_suffix || suffix,
        fit_notes:
          fields.fit_notes ||
          "Confirm idol height, placement and measured product dimensions before ordering."
      },
      handle,
      index
    )
  };
}

function extraOrnamentTypes() {
  return [
    {
      handle: { type: "deity_ornament_type", handle: "face-idol-decoration" },
      fields: {
        name: "Face / Idol Decoration",
        aliases: JSON.stringify(["Face", "Idol Face", "Ammavaru Face", "Varalakshmi Face", "Devi Face"]),
        placement: "Face / Forehead",
        fit_measurement_needed: "true",
        seo_definition: "A deity face or mask decoration used for Varalakshmi, Lakshmi, Amman and Devi alankaram.",
        slug: "face-idol-decoration",
        status: "active",
        sizing_standard: "measured-face-decoration",
        deity_first_label: "faces",
        collection_handle_suffix: "faces",
        fit_notes: "Confirm idol or doll face width, forehead placement and crown pairing before ordering.",
        sort_priority: "110"
      }
    },
    {
      handle: { type: "deity_ornament_type", handle: "full-alankaram-idol-set" },
      fields: {
        name: "Full Alankaram / Idol with Jewellery Set",
        aliases: JSON.stringify(["Full jewellery set", "Idol with jewellery", "Full alankaram", "Decoration set"]),
        placement: "Full idol",
        fit_measurement_needed: "true",
        seo_definition: "A complete deity idol or alankaram set with jewellery and decoration pieces.",
        slug: "full-alankaram-idol-set",
        status: "active",
        sizing_standard: "multi-component",
        deity_first_label: "full-alankaram",
        collection_handle_suffix: "full-alankaram",
        fit_notes: "Check idol height, included components, crown/face fit and decoration placement before ordering.",
        sort_priority: "120"
      }
    },
    {
      handle: { type: "deity_ornament_type", handle: "pooja-decor-banana-tree" },
      fields: {
        name: "Pooja Decor / Banana Tree Decor",
        aliases: JSON.stringify([
          "Pooja Decor",
          "Banana Tree Decor",
          "Plantain Tree Decor",
          "Banana Bunch Decor",
          "Kalasam Decor",
          "Mandapam Decor"
        ]),
        placement: "Kalasam / altar / doorway / mandapam",
        fit_measurement_needed: "true",
        seo_definition:
          "Reusable pooja decoration pieces such as artificial banana trees, banana bunches and coconut tree decor used around kalasam, deity idol, altar, doorway or mandapam setups.",
        slug: "pooja-decor-banana-tree",
        status: "active",
        sizing_standard: "decor-placement-size",
        deity_first_label: "pooja-decor",
        collection_handle_suffix: "pooja-decor",
        fit_notes:
          "Choose by product height, width, set quantity and placement space. Compare product measurement photos with the kalasam, altar, doorway or mandapam area before ordering.",
        sort_priority: "130"
      }
    }
  ];
}

function enrichSizeProfile(row, index) {
  const handle = row.handle.handle;
  return {
    handle: row.handle,
    fields: withCommon(fieldsToObject(row), handle, index)
  };
}

function crownStandards() {
  return [
    {
      handle: { type: "deity_crown_size_standard", handle: "open-back-crown-fit-check" },
      fields: {
        label: "Open-back crown fit check",
        slug: "open-back-crown-fit-check",
        status: "active",
        crown_style: "Open back / half crown",
        measuring_points:
          "Measure idol height, head or face width, available height above the head, crown inner width, crown height, crown depth, and arc length.",
        fit_caveats:
          "Open-back crowns depend more on inner width, arc length and fastening than full circumference. Hair, face width, side ornaments and crown angle can change fit.",
        confidence: "Measurement standard",
        sort_priority: "10"
      }
    },
    {
      handle: { type: "deity_crown_size_standard", handle: "full-round-crown-fit-check" },
      fields: {
        label: "Full-round crown fit check",
        slug: "full-round-crown-fit-check",
        status: "active",
        crown_style: "Full round crown",
        measuring_points:
          "Measure idol height, head circumference, head diameter or width, crown inner circumference, crown inner width, height and depth.",
        fit_caveats:
          "Full-round crowns need circumference or inner diameter confirmation. A same-height idol may still have a different head shape or hairstyle.",
        confidence: "Measurement standard",
        sort_priority: "20"
      }
    },
    {
      handle: { type: "deity_crown_size_standard", handle: "hair-crown-fit-check" },
      fields: {
        label: "Hair crown fit check",
        slug: "hair-crown-fit-check",
        status: "active",
        crown_style: "Hair crown / back-head crown",
        measuring_points:
          "Measure idol height, head or hair width, back-head placement area, crown outer width, crown height and fastening method.",
        fit_caveats:
          "Hair crowns depend on the idol hair style and back-head placement area. Use product images and WhatsApp size help for unusual idol shapes.",
        confidence: "Measurement standard",
        sort_priority: "30"
      }
    }
  ];
}

async function upsert(row) {
  const mutation = `
    mutation UpsertMetaobject($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
      metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
        metaobject { id handle type displayName }
        userErrors { field message code }
      }
    }
  `;
  const variables = {
    handle: row.handle,
    metaobject: { fields: objectToFieldInputs(row.fields) }
  };

  if (!APPLY) {
    console.log(`[DRY-RUN UPSERT] ${row.handle.type}:${row.handle.handle}`);
    return null;
  }

  const data = await gql(mutation, variables);
  const errors = data.metaobjectUpsert.userErrors || [];
  if (errors.length) throw new Error(`Upsert ${row.handle.type}:${row.handle.handle}: ${JSON.stringify(errors)}`);
  return data.metaobjectUpsert.metaobject;
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");

  const rows = [
    ...readJsonl(path.join(DATA_DIR, "seed-deity-groups.jsonl")).map(enrichDeityGroup),
    ...readJsonl(path.join(DATA_DIR, "seed-ornament-types.jsonl")).map(enrichOrnamentType),
    ...extraOrnamentTypes(),
    ...readJsonl(path.join(DATA_DIR, "seed-size-profiles.jsonl")).map(enrichSizeProfile),
    ...crownStandards()
  ];

  for (const row of rows) {
    const result = await upsert(row);
    if (result) console.log(`[UPSERTED] ${result.type}:${result.handle}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
