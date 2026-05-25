import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const APPLY = process.argv.includes("--apply");
const PUBLISH = process.argv.includes("--publish");
const root = process.cwd();
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(root, "env"), "utf8")
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
const BLOG_ID = "123654963498";
const BLOG_HANDLE = "jewellery-guides";
const HANDLE = "golden-collections-sponsors-aakara-pearl-26-bits-pilani-hyderabad";
const PUBLIC_URL = `https://www.goldencollections.com/blogs/${BLOG_HANDLE}/${HANDLE}`;
const ADMIN_STORE = "6f15d1";
const sourceDir = path.join("C:", "Users", "hp", "Downloads", "WhatsApp Unknown 2026-05-21 at 6.15.34 PM");
const tmpDir = path.join(root, "tmp", "bits-pilani-event-review");
const packagePath = path.join(
  root,
  "blog-system",
  "outputs",
  "shopify-ready",
  "2026-05-22-bits-pilani-pearl26-aakara-sponsorship-proof-shopify-package.md"
);
const snapshotPath = path.join(root, "blog-system", "knowledge-snapshot.md");
const reportPath = path.join(root, "tmp", "bits-pilani-event-review", "shopify-article-result.json");

if (!SHOP || !TOKEN) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
}

const articleMeta = {
  title: "Golden Collections Sponsors Aakara at Pearl '26, BITS Pilani Hyderabad Campus",
  seoTitle: "Golden Collections Sponsors Aakara at Pearl '26 | BITS Pilani Hyderabad",
  metaDescription:
    "Golden Collections sponsored Aakara at Pearl '26, BITS Pilani Hyderabad Campus, supporting classical dance students with a Bharatanatyam and Kuchipudi jewellery presence.",
  excerpt:
    "Golden Collections supported Aakara at Pearl '26, BITS Pilani Hyderabad Campus, with a Bharatanatyam and Kuchipudi jewellery promo shown in the auditorium and gift items worth Rs. 20,000 provided for Aakara winners.",
  tags:
    "dance community proof, Bharatanatyam jewellery, Kuchipudi jewellery, classical dance jewellery, Aakara, Pearl 26, BITS Pilani Hyderabad, Golden Collections, Anil Tunk, jewellery guides",
};

const imageSpecs = [
  {
    role: "Featured auditorium performance image",
    file: "WhatsApp Image 2026-05-21 at 4.40.52 PM (2).jpeg",
    filename: "golden-collections-aakara-pearl26-bits-pilani-hyderabad-bharatanatyam-performance-screen.jpg",
    alt:
      "Bharatanatyam dancer performing at Aakara during Pearl 26 with the Golden Collections dance jewellery sponsor screen visible at BITS Pilani Hyderabad Campus.",
    caption:
      "Aakara performance setting at Pearl '26, with the Golden Collections dance jewellery sponsor screen visible in the auditorium.",
  },
  {
    role: "Auditorium wide proof image",
    file: "WhatsApp Image 2026-05-21 at 4.40.52 PM.jpeg",
    filename: "golden-collections-aakara-pearl26-bits-pilani-hyderabad-auditorium-wide-view.jpg",
    alt:
      "Wide auditorium view from Aakara at Pearl 26, BITS Pilani Hyderabad Campus, with Golden Collections sponsor screen visible.",
    caption:
      "Wide auditorium view from Aakara at Pearl '26, BITS Pilani Hyderabad Campus, showing the event context.",
  },
  {
    role: "Sponsor screen close image",
    file: "WhatsApp Image 2026-05-21 at 4.40.51 PM (1).jpeg",
    filename: "golden-collections-aakara-pearl26-bits-pilani-hyderabad-sponsor-screen-closeup.jpg",
    alt:
      "Close view of Golden Collections sponsor advertisement shown during Aakara at Pearl 26, BITS Pilani Hyderabad Campus.",
    caption:
      "Close view of the Golden Collections advertisement played in the auditorium during the Aakara programming.",
  },
  {
    role: "Auditorium context image",
    file: "WhatsApp Image 2026-05-21 at 4.40.52 PM (1).jpeg",
    filename: "golden-collections-aakara-pearl26-bits-pilani-hyderabad-auditorium-screen.jpg",
    alt:
      "Golden Collections advertisement displayed in the auditorium during Aakara at Pearl 26, BITS Pilani Hyderabad Campus.",
    caption:
      "Auditorium context from Aakara at Pearl '26 with the Golden Collections sponsor screen visible.",
  },
];

const videoSpecs = [
  {
    role: "Captioned 25 second proof clip",
    file: path.join(tmpDir, "golden-collections-aakara-pearl26-bits-pilani-hyderabad-proof-25s.mp4"),
    filename: "golden-collections-aakara-pearl26-bits-pilani-hyderabad-proof-25s.mp4",
    alt:
      "Golden Collections dance jewellery advertisement being played during Aakara at Pearl 26, BITS Pilani Hyderabad Campus.",
  },
];

async function rest(pathname, options = {}) {
  const res = await fetch(`https://${SHOP}/admin/api/${API_VERSION}${pathname}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN,
      ...(options.headers || {}),
    },
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
  const res = await fetch(`https://${SHOP}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}: ${text}`);
  const json = JSON.parse(text);
  if (json.errors) throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  return json.data;
}

function contentType(filename) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".mp4")) return "video/mp4";
  return "image/jpeg";
}

function sourcePath(spec) {
  return spec.file.includes(":") || path.isAbsolute(spec.file) ? spec.file : path.join(sourceDir, spec.file);
}

async function uploadFile(spec, type) {
  const fullPath = sourcePath(spec);
  const stats = fs.statSync(fullPath);
  const mimeType = contentType(spec.filename);
  const staged = await gql(
    `mutation($input:[StagedUploadInput!]!){
      stagedUploadsCreate(input:$input){
        stagedTargets{ url resourceUrl parameters{ name value } }
        userErrors{ field message }
      }
    }`,
    {
      input: [
        {
          resource: type === "video" ? "VIDEO" : "FILE",
          filename: spec.filename,
          mimeType,
          fileSize: String(stats.size),
          httpMethod: "POST",
        },
      ],
    }
  );
  const uploadErrors = staged.stagedUploadsCreate.userErrors || [];
  if (uploadErrors.length) throw new Error(`stagedUploadsCreate ${spec.filename}: ${JSON.stringify(uploadErrors)}`);
  const target = staged.stagedUploadsCreate.stagedTargets[0];
  const form = new FormData();
  for (const param of target.parameters) form.append(param.name, param.value);
  form.append("file", new Blob([fs.readFileSync(fullPath)], { type: mimeType }), spec.filename);
  const upload = await fetch(target.url, { method: "POST", body: form });
  const uploadText = await upload.text();
  if (!upload.ok) throw new Error(`Staged upload failed ${spec.filename} ${upload.status}: ${uploadText}`);

  const created = await gql(
    `mutation($files:[FileCreateInput!]!){
      fileCreate(files:$files){
        files{
          id
          alt
          fileStatus
          ... on MediaImage { image{ url } preview{ image{ url } } }
          ... on Video { preview{ image{ url } } sources{ url mimeType format width height } }
        }
        userErrors{ field message }
      }
    }`,
    {
      files: [
        {
          alt: spec.alt,
          contentType: type === "video" ? "VIDEO" : "IMAGE",
          originalSource: target.resourceUrl,
        },
      ],
    }
  );
  const fileErrors = created.fileCreate.userErrors || [];
  if (fileErrors.length) throw new Error(`fileCreate ${spec.filename}: ${JSON.stringify(fileErrors)}`);
  const file = created.fileCreate.files[0];
  let url = file.image?.url || file.preview?.image?.url || file.sources?.[0]?.url || null;
  let posterUrl = file.preview?.image?.url || null;
  for (let index = 0; index < 16 && !url; index += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const node = await gql(
      `query($id:ID!){
        node(id:$id){
          ... on MediaImage { fileStatus image{ url } preview{ image{ url } } }
          ... on Video { fileStatus preview{ image{ url } } sources{ url mimeType format width height } }
        }
      }`,
      { id: file.id }
    );
    url = node.node?.image?.url || node.node?.preview?.image?.url || node.node?.sources?.[0]?.url || null;
    posterUrl = node.node?.preview?.image?.url || posterUrl;
  }
  if (!url) throw new Error(`Uploaded file did not return URL: ${spec.filename}`);
  return { ...spec, id: file.id, url, posterUrl, type };
}

function imageFigure(upload) {
  return [
    `<figure class="gc-dance-proof__figure">`,
    `<img src="${upload.url}" alt="${upload.alt}" loading="lazy">`,
    `<figcaption>${upload.caption}</figcaption>`,
    `</figure>`,
  ].join("");
}

function videoFigure(upload) {
  const poster = upload.posterUrl ? ` poster="${upload.posterUrl}"` : "";
  return [
    `<figure class="gc-dance-proof__figure gc-dance-proof__video">`,
    `<video controls playsinline preload="metadata"${poster} aria-label="${upload.alt}">`,
    `<source src="${upload.url}" type="video/mp4">`,
    `</video>`,
    `<figcaption>Captioned proof clip from the Golden Collections sponsor advertisement played during Aakara at Pearl '26.</figcaption>`,
    `</figure>`,
  ].join("");
}

function articleBody(imageUploads, videoUploads) {
  const hero = imageUploads[0];
  const wide = imageUploads[1];
  const screen = imageUploads[2];
  const context = imageUploads[3];
  const video = videoUploads[0];
  return `
<style>
  .gc-dance-proof { background:#fff8ea; color:#21180d; font-size:1.12rem; line-height:1.72; }
  .gc-dance-proof p, .gc-dance-proof li { color:#33281d; font-size:1.12rem; line-height:1.72; }
  .gc-dance-proof a { color:#8b1c1c; text-underline-offset:.22em; }
  .gc-dance-proof h2, .gc-dance-proof h3 { color:#1f170d; line-height:1.18; margin-top:2rem; }
  .gc-dance-proof h2 { font-size:clamp(1.85rem,3vw,2.65rem); }
  .gc-dance-proof h3 { font-size:clamp(1.35rem,2vw,1.75rem); }
  .gc-dance-proof__note { background:#fffaf2; border-left:4px solid #c9972a; border-radius:8px; box-shadow:0 2px 8px rgba(26,14,4,.08); margin:1.15rem 0 1.6rem; padding:1.15rem 1.25rem; }
  .gc-dance-proof__note p { margin:0; }
  .gc-dance-proof__grid { display:grid; gap:1rem; margin:1.2rem 0; }
  .gc-dance-proof__card { background:#fffdf8; border:1px solid rgba(151,99,16,.16); border-radius:8px; padding:1rem; }
  .gc-dance-proof__card strong { color:#21180d; display:block; font-size:1.16rem; line-height:1.25; margin-bottom:.25rem; }
  .gc-dance-proof__figure { margin:1.6rem 0; }
  .gc-dance-proof__figure img, .gc-dance-proof__figure video { background:#1a0e05; border-radius:8px; display:block; height:auto; max-height:78vh; object-fit:contain; width:100%; }
  .gc-dance-proof__figure figcaption { color:#6f6254; font-size:1rem; line-height:1.5; margin-top:.55rem; }
  .gc-dance-proof__cta { background:#241508; border-radius:8px; color:#fff6e8; display:grid; gap:.8rem; margin:1.6rem 0; padding:1.2rem; }
  .gc-dance-proof__cta p { color:rgba(255,246,232,.86); margin:0; }
  .gc-dance-proof__cta a { background:#fff6e8; border-radius:6px; color:#8b1c1c; display:inline-flex; font-weight:800; justify-content:center; padding:.72rem .95rem; text-decoration:none; }
  @media (min-width: 750px) {
    .gc-dance-proof__grid { grid-template-columns:repeat(3,minmax(0,1fr)); }
    .gc-dance-proof__cta { align-items:center; grid-template-columns:minmax(0,1fr) auto; }
  }
</style>
<div class="gc-dance-proof">
  <div class="gc-dance-proof__note">
    <p><strong>Golden Collections sponsored Aakara at Pearl '26, BITS Pilani Hyderabad Campus.</strong> Anil Tunk represented Golden Collections in this association, and Golden Collections provided gift items worth Rs. 20,000 for Aakara competition winners.</p>
  </div>

  ${imageFigure(hero)}

  <h2>What Happened At Aakara</h2>
  <p>Aakara was part of Pearl '26 at BITS Pilani Hyderabad Campus. As part of the sponsorship association, the Golden Collections Bharatanatyam and Kuchipudi jewellery advertisement was played in the auditorium during Aakara finals and inaugural performance programming.</p>
  <p>The association also included Golden Collections branding during Aakara activities and gift items for the competition winners. This was a dance-community sponsorship, stated only as a factual event association without any institutional endorsement claim.</p>

  <div class="gc-dance-proof__grid" aria-label="Aakara sponsorship facts">
    <div class="gc-dance-proof__card">
      <strong>Event context</strong>
      <span>Pearl '26 at BITS Pilani Hyderabad Campus, through the Aakara classical dance competition setting.</span>
    </div>
    <div class="gc-dance-proof__card">
      <strong>Golden Collections role</strong>
      <span>Sponsor association represented by Anil Tunk, founder and public leader of Golden Collections.</span>
    </div>
    <div class="gc-dance-proof__card">
      <strong>Winner support</strong>
      <span>Gift items worth Rs. 20,000 were provided by Golden Collections for Aakara competition winners.</span>
    </div>
  </div>

  ${imageFigure(wide)}

  <h2>Why This Matters For Classical Dance Jewellery</h2>
  <p>This proof matters because the Golden Collections dance-jewellery message was shown inside the actual Aakara auditorium setting at Pearl '26, not only on a product page or social feed. The photos show the sponsor screen in the same performance environment where dancers, parents, teachers and event audiences judge costume scale, jewellery visibility and stage presence.</p>
  <p>That makes the sponsorship useful evidence for Golden Collections' Bharatanatyam and Kuchipudi work: the brand is connected to real classical dance programming, while the public claim remains limited to the documented event association and winner-gift support.</p>

  ${imageFigure(screen)}

  <h2>What Buyers Can Take From This</h2>
  <p>A sponsorship proof story should not replace product-level fit checks, but it does show why dance jewellery has to be judged in a stage context. Pieces that look good in a close product photo still need to work with costume color, lighting, face framing and movement.</p>
  <p>For buyers, the practical path is to choose by performance role first: complete dance sets for the full look, short necklace and long haram for upper-body balance, earrings and mattal for face framing, and waist belt or vaddanam for costume proportion. Golden Collections uses those buyer paths when helping dancers and parents compare regular Bharatanatyam/Kuchipudi jewellery, real kemp jewellery and accessories.</p>

  ${context ? imageFigure(context) : ""}
  ${video ? videoFigure(video) : ""}

  <h2>Related Golden Collections Paths</h2>
  <ul>
    <li><a href="/collections/bharatanatyam-jewellery">Bharatanatyam jewellery</a> for collection-level browsing.</li>
    <li><a href="/collections/bharatanatyam-jewellery-sets">Bharatanatyam jewellery sets</a> for complete stage looks.</li>
    <li><a href="/collections/kemp-jewellery">Kemp jewellery</a> and <a href="/blogs/jewellery-guides/real-kemp-jewellery-guide">the real kemp buying guide</a> for premium temple jewellery styling.</li>
    <li><a href="/blogs/jewellery-guides/real-kemp-jewellery-for-arangetram">Real kemp jewellery for arangetram</a> for performance planning.</li>
    <li><a href="/pages/anil-tunk">Anil Tunk</a> for Golden Collections founder and fit-guidance context.</li>
  </ul>

  <h2>External Event Proof</h2>
  <p>The public Instagram reel supplied for this Aakara/Pearl '26 context is here: <a href="https://www.instagram.com/reel/DU5ds_CjWAH/?igsh=NGtncTk4OTV6aHAw" target="_blank" rel="noopener">Instagram reel</a>.</p>

  <div class="gc-dance-proof__cta">
    <p>Planning jewellery for a Bharatanatyam, Kuchipudi or arangetram performance? Start with the collection path, then ask Golden Collections if you need help comparing set completeness, finish and dancer scale.</p>
    <a href="/collections/bharatanatyam-jewellery">Shop Bharatanatyam jewellery</a>
  </div>
</div>
${schemaJson(imageUploads, videoUploads)}
`.trim();
}

function schemaJson(imageUploads, videoUploads) {
  const graph = [
    {
      "@type": "BlogPosting",
      "@id": `${PUBLIC_URL}#article`,
      mainEntityOfPage: PUBLIC_URL,
      headline: articleMeta.title,
      description: articleMeta.metaDescription,
      author: { "@type": "Person", name: "Anil Tunk", url: "https://www.goldencollections.com/pages/anil-tunk" },
      publisher: { "@type": "Organization", name: "Golden Collections", url: "https://www.goldencollections.com/" },
      dateCreated: "2026-05-22",
      dateModified: "2026-05-22",
      about: [
        "Bharatanatyam jewellery",
        "Kuchipudi jewellery",
        "classical dance jewellery",
        "Aakara",
        "Pearl 26",
        "BITS Pilani Hyderabad Campus",
        "Golden Collections",
      ],
      image: imageUploads.map((upload) => upload.url),
    },
  ];
  if (videoUploads[0]) {
    graph.push({
      "@type": "VideoObject",
      "@id": `${PUBLIC_URL}#aakara-proof-video`,
      name: "Golden Collections at Aakara, Pearl 26",
      description: videoUploads[0].alt,
      contentUrl: videoUploads[0].url,
      thumbnailUrl: [videoUploads[0].posterUrl || imageUploads[0]?.url].filter(Boolean),
      uploadDate: "2026-05-22",
      publisher: { "@type": "Organization", name: "Golden Collections", url: "https://www.goldencollections.com/" },
    });
  }
  return `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph })}</script>`;
}

async function findExistingArticle() {
  const json = await rest(`/blogs/${BLOG_ID}/articles.json?limit=250&fields=id,handle,title,published_at`);
  return (json.articles || []).find((article) => article.handle === HANDLE) || null;
}

async function setSeoMetafields(articleId) {
  const ownerId = `gid://shopify/Article/${articleId}`;
  const data = await gql(
    `mutation($metafields:[MetafieldsSetInput!]!){
      metafieldsSet(metafields:$metafields){ userErrors{ field message } }
    }`,
    {
      metafields: [
        { ownerId, namespace: "global", key: "title_tag", type: "single_line_text_field", value: articleMeta.seoTitle },
        {
          ownerId,
          namespace: "global",
          key: "description_tag",
          type: "single_line_text_field",
          value: articleMeta.metaDescription,
        },
      ],
    }
  );
  const errors = data.metafieldsSet.userErrors || [];
  if (errors.length) throw new Error(`metafieldsSet: ${JSON.stringify(errors)}`);
}

function writePackage(article, uploads, bodySha) {
  const lines = [
    "# Shopify Package: Aakara Pearl '26 Sponsorship Proof",
    "",
    `Content status: Shopify article ${PUBLISH ? "published" : "drafted"}`,
    `Blog title: ${articleMeta.title}`,
    `SEO title: ${articleMeta.seoTitle}`,
    `Meta description: ${articleMeta.metaDescription}`,
    `Excerpt: ${articleMeta.excerpt}`,
    `Suggested handle: \`${HANDLE}\``,
    `Public URL: \`${PUBLIC_URL}\``,
    `Shopify article ID: \`${article.id}\``,
    `Shopify article status: ${article.published_at ? "published" : "draft"}`,
    `Shopify admin URL: \`https://admin.shopify.com/store/${ADMIN_STORE}/content/articles/${article.id}\``,
    `Rendered body SHA-256: \`${bodySha}\``,
    "",
    "## Uploaded Media",
    "",
    "| Type | Role | Filename | Alt | URL |",
    "| --- | --- | --- | --- | --- |",
    ...uploads.map((upload) => `| ${upload.type} | ${upload.role} | \`${upload.filename}\` | ${upload.alt} | \`${upload.url}\` |`),
    "",
    "## Guardrails",
    "",
    "- Factual sponsorship/association wording only.",
    "- No BITS endorsement, supplier-status, preferred supplier, certified partner or approved-brand claim.",
    "- No award-distribution photo placeholder. Add that asset later only after the actual image is available and reviewed.",
    "- This is one substantial proof article, not a new proof page for every event asset.",
    "",
  ];
  fs.writeFileSync(packagePath, lines.join("\n"));
}

function updateSnapshot(article) {
  let snapshot = fs.readFileSync(snapshotPath, "utf8");
  if (snapshot.includes(`Handle: \`${HANDLE}\``)) return;
  const entry = [
    "",
    `- Title: \`${articleMeta.title}\``,
    `- Handle: \`${HANDLE}\``,
    `- Shopify ID: \`${article.id}\``,
    "- Content type: blog post",
    "- Blog: `Golden Collections Jewellery Guides`",
    "- Blog handle: `jewellery-guides`",
    `- Status: ${article.published_at ? "published" : "draft"}`,
    "- Date created: 2026-05-22",
    "- Topic cluster: Bharatanatyam jewellery, Kuchipudi jewellery, dance community proof, Aakara, Pearl 26",
    "- Primary angle: dance-community sponsorship proof case study",
    "",
  ].join("\n");
  const marker = "When future Shopify drafts are created through this system, append the same fields here.";
  snapshot = snapshot.includes(marker) ? snapshot.replace(marker, `${entry}\n${marker}`) : `${snapshot}\n${entry}`;
  fs.writeFileSync(snapshotPath, snapshot);
}

if (!APPLY) {
  console.log(JSON.stringify({ mode: "dry-run", publish: PUBLISH, handle: HANDLE, images: imageSpecs, videos: videoSpecs }, null, 2));
  process.exit(0);
}

const imageUploads = [];
for (const spec of imageSpecs) imageUploads.push(await uploadFile(spec, "image"));

const videoUploads = [];
for (const spec of videoSpecs) {
  try {
    videoUploads.push(await uploadFile(spec, "video"));
  } catch (error) {
    console.error(`Video upload skipped: ${error.message}`);
  }
}

const bodyHtml = articleBody(imageUploads, videoUploads);
const bodySha = crypto.createHash("sha256").update(bodyHtml).digest("hex");
const existing = await findExistingArticle();
const heroAttachment = fs.readFileSync(sourcePath(imageSpecs[0])).toString("base64");
const payload = {
  article: {
    title: articleMeta.title,
    handle: HANDLE,
    body_html: bodyHtml,
    summary_html: articleMeta.excerpt,
    tags: articleMeta.tags,
    author: "Anil Tunk",
    published: PUBLISH,
    image: {
      attachment: heroAttachment,
      filename: imageSpecs[0].filename,
      alt: imageSpecs[0].alt,
    },
  },
};

let article;
if (existing) {
  const updated = await rest(`/blogs/${BLOG_ID}/articles/${existing.id}.json`, {
    method: "PUT",
    body: JSON.stringify({ article: { id: existing.id, ...payload.article } }),
  });
  article = updated.article;
} else {
  const created = await rest(`/blogs/${BLOG_ID}/articles.json`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  article = created.article;
}

await setSeoMetafields(article.id);
writePackage(article, [...imageUploads, ...videoUploads], bodySha);
updateSnapshot(article);
fs.writeFileSync(
  reportPath,
  JSON.stringify(
    {
      articleId: article.id,
      handle: article.handle,
      status: article.published_at ? "published" : "draft",
      adminUrl: `https://admin.shopify.com/store/${ADMIN_STORE}/content/articles/${article.id}`,
      publicUrl: PUBLIC_URL,
      featuredImage: article.image?.src || null,
      uploaded: [...imageUploads, ...videoUploads].map(({ type, role, filename, alt, url, posterUrl }) => ({
        type,
        role,
        filename,
        alt,
        url,
        posterUrl,
      })),
      bodySha256: bodySha,
    },
    null,
    2
  )
);

console.log(fs.readFileSync(reportPath, "utf8"));
