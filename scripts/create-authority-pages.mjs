import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const ENV_FILE = "env";

const env = Object.fromEntries(
  fs
    .readFileSync(ENV_FILE, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    })
);

const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const GRAPHQL_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}/graphql.json`;
const REST_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}`;

if (!SHOP || !TOKEN) {
  console.error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN");
  process.exit(1);
}

const pages = [
  {
    title: "Golden Collections Knowledge Hub",
    handle: "golden-collections-knowledge-hub",
    templateSuffix: "golden-collections-knowledge-hub",
    bodyHtml:
      "<p>Golden Collections knowledge hub for entity facts, Anil Tunk author context, deity jewellery sizing, regional temple jewellery vocabulary, Bharatanatyam and Kuchipudi jewellery, and real kemp buying guidance.</p>",
    seoTitle: "Golden Collections Knowledge Hub | Anil Tunk, Deity and Dance Jewellery",
    seoDescription:
      "Central Golden Collections authority hub for Anil Tunk, deity jewellery sizing, alankaram guides, Bharatanatyam jewellery, Kuchipudi jewellery, real kemp jewellery and temple jewellery terms."
  },
  {
    title: "Anil Tunk of Golden Collections",
    handle: "anil-tunk",
    templateSuffix: "anil-tunk",
    bodyHtml:
      "<p>Anil Tunk is the founder and public leader of Golden Collections. This page uses the theme authority profile template for the full visible profile and structured data.</p>",
    seoTitle: "Anil Tunk | Founder of Golden Collections",
    seoDescription:
      "Meet Anil Tunk, founder of Golden Collections, a Hyderabad/Secunderabad specialist in deity jewellery, Hindu idol alankaram, Bharatanatyam jewellery and kemp temple jewellery."
  },
  {
    title: "Deity Jewellery and Alankaram Guides",
    handle: "deity-jewellery-alankaram-guide",
    templateSuffix: "deity-jewellery-alankaram-guide",
    bodyHtml:
      "<p>Golden Collections deity jewellery authority hub for sizing, compatibility, regional names and alankaram buying guidance.</p>",
    seoTitle: "Deity Jewellery and Alankaram Guides | Golden Collections",
    seoDescription:
      "Golden Collections guides for choosing deity crowns, harams, vaddanam, earrings, Varalakshmi alankaram items and Hindu idol ornaments by size, placement and regional name."
  },
  {
    title: "How to Measure Your Idol for Deity Jewellery",
    handle: "how-to-measure-idol-for-deity-jewellery",
    templateSuffix: "how-to-measure-idol-for-deity-jewellery",
    bodyHtml:
      "<p>Measure idol height, head or face width, crown space, chest width, haram drop and waist placement before buying deity jewellery.</p>",
    seoTitle: "How to Measure Your Idol for Deity Jewellery",
    seoDescription:
      "Measure your deity idol before buying crowns, mukut, kireedam, harams, vaddanam, earrings, tilak, namam, hands, feet, arch and alankaram accessories."
  },
  {
    title: "Deity Crown, Mukut and Kireedam Size Guide",
    handle: "deity-crown-mukut-kireedam-size-guide",
    templateSuffix: "deity-crown-mukut-kireedam-size-guide",
    bodyHtml: `
      <p><strong>Quick answer:</strong> choose a deity crown, mukut or kireedam by crown style first, then compare idol height, head or face width, crown height, depth and circumference or arc where relevant. A crown should fit the idol's head placement and visual scale; do not choose only by design or only by idol height.</p>
      <h2>Crown styles and what to measure</h2>
      <table>
        <thead>
          <tr>
            <th>Crown style</th>
            <th>Best measurements</th>
            <th>Fit warning</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Open-back / half crown</td>
            <td>Head or face width, crown height, crown depth</td>
            <td>Works only when the front width and side placement sit correctly.</td>
          </tr>
          <tr>
            <td>Full-round crown</td>
            <td>Head circumference, crown height, depth</td>
            <td>Front width alone is not enough because the crown wraps around.</td>
          </tr>
          <tr>
            <td>Tall mukut / kireedam</td>
            <td>Idol height, crown height, head width, altar height</td>
            <td>Can overpower small idols or hit the mandapam/backdrop.</td>
          </tr>
          <tr>
            <td>Hair crown / koppu style</td>
            <td>Hair or bun placement, side width, back clearance</td>
            <td>Should not be mixed with normal forehead crowns without checking style.</td>
          </tr>
        </tbody>
      </table>
      <h2>Measurement checklist before buying</h2>
      <ul>
        <li><strong>Idol height:</strong> use this to judge visual scale, especially for tall mukut or kireedam styles.</li>
        <li><strong>Head or face width:</strong> measure side to side where the crown will sit.</li>
        <li><strong>Crown height space:</strong> measure from the head to the highest available point, including mandapam or backdrop clearance.</li>
        <li><strong>Depth:</strong> check front-to-back crown depth, especially for idols with hair, trunk, ornaments or raised head shapes.</li>
        <li><strong>Circumference or arc:</strong> use circumference for full-round crowns and arc length for curved crown styles when provided.</li>
        <li><strong>Photos with tape:</strong> take a front photo and side photo with measuring tape visible before asking for fit help.</li>
      </ul>
      <h2>Deity-specific crown fit notes</h2>
      <h3>Lakshmi, Varalakshmi and Amman</h3>
      <p>Check face width, hairstyle, saree drape, hastham/padam clearance and whether the crown should sit upright, tilted or with a hair-crown look.</p>
      <h3>Balaji, Vishnu and Perumal</h3>
      <p>Check crown height with namam or thiruman, shanku chakra, shoulder ornaments and long haram placement. The crown should not block the face or deity marks.</p>
      <h3>Krishna and Radha Krishna</h3>
      <p>Check peacock feather, flute position, head angle and whether the crown is Krishna-specific or a general crown by size.</p>
      <h3>Ganesha and Ganapati</h3>
      <p>Measure head width carefully and check trunk direction, ears and seated posture. A crown that fits a narrow idol may not fit a broad Ganesha head.</p>
      <h3>General or common crowns</h3>
      <p>General crowns are not universal. Treat them as usable across many idols only when head size, crown style, placement and deity symbolism match.</p>
      <h2>Shop deity crowns by fit need</h2>
      <ul>
        <li><a href="/collections/deity-crowns-1">All deity crowns, mukut and kireedam</a></li>
        <li><a href="/collections/deity-crowns">Gold plated deity crowns</a></li>
        <li><a href="/collections/deity-stone-crowns">Deity stone crowns</a></li>
        <li><a href="/pages/how-to-measure-idol-for-deity-jewellery">How to measure your idol before choosing jewellery</a></li>
      </ul>
      <h2>FAQ</h2>
      <h3>Is mukut the same as kireedam?</h3>
      <p>Mukut, kireedam, kirita and crown are often used for similar deity head ornaments, but regional usage and crown style can differ. Always check the product photo and measurements.</p>
      <h3>Can one deity crown fit different gods and goddesses?</h3>
      <p>Some general crowns can fit different idols when the head width, crown height, depth, posture and style match. Deity-specific symbols or shapes should not be treated as universal.</p>
      <h3>What is the most important crown measurement?</h3>
      <p>For open-back crowns, head or face width is usually the most important. For full-round crowns, circumference matters. Crown height and depth should also be checked for visual scale and clearance.</p>
      <h3>Can Golden Collections help check crown size?</h3>
      <p>Yes. Share idol height, face/head width, front and side photos, and one photo with a measuring tape visible. Golden Collections can help check likely fit before ordering.</p>
      <p>This guide is part of the Golden Collections deity jewellery authority hub and is reviewed for practical fit guidance connected to Anil Tunk and Golden Collections' deity jewellery compatibility model.</p>
    `.trim(),
    seoTitle: "Deity Crown Size Guide | Mukut and Kireedam Fit",
    seoDescription:
      "Choose deity crowns, mukut and kireedam by idol height, head width, crown style, circumference, depth and placement. Golden Collections sizing guide."
  },
  {
    title: "Regional Names of Deity Jewellery",
    handle: "deity-jewellery-regional-names",
    templateSuffix: "deity-jewellery-regional-names",
    bodyHtml: `
      <h2>Why regional names matter for deity jewellery</h2>
      <p>The same deity ornament may be searched with English, Telugu, Tamil, Kannada, Hindi or Sanskrit-derived names. Golden Collections uses regional names to help devotees find the right ornament without treating every term as a separate product.</p>
      <h2>Common deity jewellery names</h2>
      <ul>
        <li><strong>Crown:</strong> mukut, kireedam, kirita, crown.</li>
        <li><strong>Waist belt:</strong> vaddanam, oddiyanam, kamarband, kati sutra.</li>
        <li><strong>Neck ornament:</strong> short necklace, haram, haar, mala, malai.</li>
        <li><strong>Shoulder garland:</strong> vagamalai, thomala, bhujalu.</li>
        <li><strong>Vishnu mark:</strong> namam, thiruman, tilak.</li>
        <li><strong>Forehead or face ornament:</strong> bindi, tilak, namam, thiruman, nose ring.</li>
      </ul>
      <h2>Deity-specific names need care</h2>
      <p>Some names are deity-specific. Shanku chakra and namam are usually Vishnu, Balaji, Venkateswara or Perumal context. Hastham and padam are common in Varalakshmi, Lakshmi and Amman doll or idol setups. Do not treat symbol-specific accessories as universal.</p>
      <h2>How to use this guide</h2>
      <p>When shopping, search by both the ornament name and the deity context. For example: Amman vaddanam, Balaji namam, Varalakshmi hastham padam, deity mukut, god idol haram or Lakshmi crown.</p>
    `.trim(),
    seoTitle: "Regional Names of Deity Jewellery | Mukut, Kireedam, Vaddanam",
    seoDescription:
      "Understand deity jewellery names such as mukut, kireedam, vaddanam, oddiyanam, thomala, namam, thiruman, haram, haar, mala and malai."
  },
  {
    title: "Short Haram vs Long Haram vs Chest Necklace for God Idols",
    handle: "short-haram-vs-long-haram-for-god-idols",
    templateSuffix: "short-haram-vs-long-haram-for-god-idols",
    bodyHtml: `
      <h2>Which deity necklace should you choose?</h2>
      <p>Choose a deity necklace by placement first. A short necklace sits near the neck or upper chest. A long haram falls lower on the idol body, saree drape or chest. A chest necklace is a placement-specific style and should be checked carefully by deity and body shape.</p>
      <h2>Short necklace</h2>
      <p>Use a short necklace when the ornament should sit close to the idol neck or upper chest. Measure neck width and upper chest width before ordering.</p>
      <h2>Long haram</h2>
      <p>Use a long haram when the idol needs a fuller vertical alankaram line. Measure from the neck to the point where the haram should end.</p>
      <h2>Chest necklace</h2>
      <p>Chest necklace styles need extra fit checks. Compare deity group, chest width, ornament width, dress volume and whether the item is meant for that idol shape.</p>
      <h2>Before ordering</h2>
      <p>Measure idol height, chest width, neck width and desired drop. Share a dressed-idol photo if the necklace will sit over a saree, vastram or garland.</p>
    `.trim(),
    seoTitle: "Short Haram vs Long Haram for God Idols | Deity Necklace Guide",
    seoDescription:
      "Compare short necklace, long haram and chest necklace placement for Hindu god and goddess idols. Measure neck, chest, drop length and dress volume."
  },
  {
    title: "Varalakshmi Alankaram Guide",
    handle: "varalakshmi-alankaram-guide",
    templateSuffix: "varalakshmi-alankaram-guide",
    bodyHtml: `
      <h2>Plan Varalakshmi alankaram by setup type</h2>
      <p>Varalakshmi alankaram differs for a full idol or doll, Amman mugham, kalasam setup or altar decoration. Decide the setup first, then choose jewellery and decor by size and placement.</p>
      <h2>Common essential items</h2>
      <ul>
        <li>Varalakshmi idol, doll, face or Amman mugham.</li>
        <li>Crown, mukut or kireedam.</li>
        <li>Short necklace, long haram or both.</li>
        <li>Hastham and padam where the setup needs hands and feet.</li>
        <li>Earrings, nose ring, vaddanam and thomala where size and space allow.</li>
      </ul>
      <h2>Setup-dependent items</h2>
      <p>Arch, lotus asana, coconut stand, banana tree decor and kalasam decor depend on altar space, family tradition and the type of setup. Shanku chakra is usually Vishnu or Balaji context and is not a normal Varalakshmi-only requirement.</p>
      <h2>Before ordering</h2>
      <p>Measure idol height, face width, crown placement, shoulder width, chest width, waist placement and altar depth. Plan early for the May-August Varalakshmi buying season.</p>
    `.trim(),
    seoTitle: "Varalakshmi Alankaram Guide | Jewellery and Decoration Items",
    seoDescription:
      "Plan Varalakshmi alankaram by setup type. Choose face, crown, hastham, padam, haram, vaddanam, thomala and decor by size and placement."
  },
  {
    title: "Lakshmi and Varalakshmi Deity Jewellery Compatibility Guide",
    handle: "lakshmi-varalakshmi-deity-jewellery-guide",
    templateSuffix: "lakshmi-varalakshmi-deity-jewellery-guide",
    bodyHtml:
      "<p>Golden Collections compatibility guide for Lakshmi, Varalakshmi and Amman jewellery, including crown, haram, hastham, padam, vaddanam and setup-specific fit checks.</p>",
    seoTitle: "Lakshmi and Varalakshmi Jewellery Compatibility Guide",
    seoDescription:
      "Choose Lakshmi, Varalakshmi and Amman deity jewellery by setup type, face width, crown placement, hastham, padam, haram, vaddanam and altar fit."
  },
  {
    title: "Balaji, Vishnu and Perumal Deity Jewellery Compatibility Guide",
    handle: "balaji-vishnu-perumal-deity-jewellery-guide",
    templateSuffix: "balaji-vishnu-perumal-deity-jewellery-guide",
    bodyHtml:
      "<p>Golden Collections compatibility guide for Balaji, Vishnu, Venkateswara and Perumal jewellery, including crown, namam, thiruman, shanku chakra and haram fit.</p>",
    seoTitle: "Balaji, Vishnu and Perumal Jewellery Compatibility Guide",
    seoDescription:
      "Choose Balaji, Vishnu and Perumal deity jewellery by crown height, namam or thiruman visibility, shanku chakra context, haram drop and idol measurements."
  },
  {
    title: "Ganesha Deity Crown and Ornament Compatibility Guide",
    handle: "ganesha-deity-crown-ornament-guide",
    templateSuffix: "ganesha-deity-crown-ornament-guide",
    bodyHtml:
      "<p>Golden Collections compatibility guide for Ganesha crowns and ornaments, focused on broad head shape, ears, trunk direction, crown depth and seated posture.</p>",
    seoTitle: "Ganesha Crown and Deity Ornament Compatibility Guide",
    seoDescription:
      "Choose Ganesha deity crowns and ornaments by head width, ear clearance, trunk direction, crown depth, seated posture and altar space."
  },
  {
    title: "Krishna Deity Jewellery Compatibility Guide",
    handle: "krishna-deity-jewellery-guide",
    templateSuffix: "krishna-deity-jewellery-guide",
    bodyHtml:
      "<p>Golden Collections compatibility guide for Krishna and Radha Krishna jewellery, including crown style, peacock feather, flute position, head angle and necklace drop.</p>",
    seoTitle: "Krishna Deity Jewellery Compatibility Guide",
    seoDescription:
      "Choose Krishna deity jewellery by crown style, peacock feather height, flute position, head angle, necklace drop, dress volume and idol posture."
  },
  {
    title: "Amman and Devi Alankaram Jewellery Compatibility Guide",
    handle: "amman-devi-alankaram-jewellery-guide",
    templateSuffix: "amman-devi-alankaram-jewellery-guide",
    bodyHtml:
      "<p>Golden Collections compatibility guide for Amman and Devi alankaram jewellery, including crown, face ornament, nose ring, haram, vaddanam and saree drape fit.</p>",
    seoTitle: "Amman and Devi Alankaram Jewellery Compatibility Guide",
    seoDescription:
      "Choose Amman and Devi alankaram jewellery by goddess form, crown placement, face ornament, nose ring, haram, vaddanam, saree drape and festival setup."
  },
  {
    title: "How Golden Collections Checks Deity Jewellery Fit",
    handle: "how-golden-collections-checks-deity-jewellery-fit",
    templateSuffix: "how-golden-collections-checks-deity-jewellery-fit",
    bodyHtml:
      "<p>Golden Collections process page explaining how Anil Tunk and the team check deity jewellery fit using deity form, idol measurements, placement photos and product dimensions.</p>",
    seoTitle: "How Golden Collections Checks Deity Jewellery Fit",
    seoDescription:
      "See how Golden Collections checks deity jewellery fit with idol measurements, photos, deity form, ornament placement, altar space and product dimensions."
  }
];

async function rest(pathname, options = {}) {
  const res = await fetch(`${REST_ENDPOINT}${pathname}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN,
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }
  }
  if (!res.ok) throw new Error(`REST ${options.method || "GET"} ${pathname} HTTP ${res.status}: ${text}`);
  return json;
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

async function findPage(handle) {
  const json = await rest(`/pages.json?handle=${encodeURIComponent(handle)}&limit=1`);
  return (json.pages || [])[0] || null;
}

async function upsertPage(definition) {
  const existing = await findPage(definition.handle);
  const payload = {
    page: {
      title: definition.title,
      handle: definition.handle,
      body_html: definition.bodyHtml,
      published: true
    }
  };
  if (definition.templateSuffix) payload.page.template_suffix = definition.templateSuffix;

  if (!APPLY) {
    console.log(`[DRY PAGE] ${existing ? "update" : "create"} ${definition.handle} -> template ${definition.templateSuffix || "default page"}`);
    return existing || { id: "DRY" };
  }

  if (existing) {
    const json = await rest(`/pages/${existing.id}.json`, {
      method: "PUT",
      body: JSON.stringify({ page: { ...payload.page, id: existing.id } })
    });
    return json.page;
  }

  const json = await rest("/pages.json", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return json.page;
}

async function setSeoMetafields(page, definition) {
  if (!APPLY) {
    console.log(`[DRY SEO] ${definition.handle}`);
    return;
  }
  const ownerId = `gid://shopify/Page/${page.id}`;
  const data = await gql(
    `mutation SetPageSeo($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        userErrors { field message code }
      }
    }`,
    {
      metafields: [
        {
          ownerId,
          namespace: "global",
          key: "title_tag",
          type: "single_line_text_field",
          value: definition.seoTitle
        },
        {
          ownerId,
          namespace: "global",
          key: "description_tag",
          type: "single_line_text_field",
          value: definition.seoDescription
        }
      ]
    }
  );
  const errors = data.metafieldsSet.userErrors || [];
  if (errors.length) throw new Error(`metafieldsSet ${definition.handle}: ${JSON.stringify(errors)}`);
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  for (const definition of pages) {
    const page = await upsertPage(definition);
    await setSeoMetafields(page, definition);
  }
  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
