import fs from "fs";
import path from "path";
import crypto from "crypto";

const APPLY = process.argv.includes("--apply");
const root = process.cwd();
const envText = fs.readFileSync(path.join(root, "env"), "utf8");
const env = Object.fromEntries(
  envText
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
const HANDLE = "hanuman-jayanti-alankaram-sri-vijaya-vinayaka-swamy-temple-malkajgiri-2026";
const PUBLIC_URL = `https://www.goldencollections.com/blogs/${BLOG_HANDLE}/${HANDLE}`;
const ADMIN_STORE = "6f15d1";

const packagePath = path.join(
  root,
  "blog-system",
  "outputs",
  "shopify-ready",
  "2026-05-16-hanuman-jayanti-alankaram-sri-vijaya-vinayaka-swamy-temple-shopify-package.md"
);
const snapshotPath = path.join(root, "blog-system", "knowledge-snapshot.md");
const mediaDir = path.join(root, "Blog Images", "Hanuman Jayanti");

const imageSpecs = [
  {
    file: "WhatsApp Image 2026-05-16 at 12.03.36 PM.jpeg",
    role: "Featured image / final temple alankaram",
    alt: "Hanuman Jayanti alankaram at Sri Vijaya Vinayaka Swamy Temple Malkajgiri with Golden Collections deity jewellery",
    insertBefore: "<h2>Why This Hanuman Jayanti Example Matters</h2>",
  },
  {
    file: "WhatsApp Image 2026-05-16 at 12.03.36 PM (1).jpeg",
    role: "Close-up crown and deity jewellery detail",
    alt: "Close-up of Hanuman crown and deity jewellery used for Hanuman Jayanti alankaram",
    insertBefore: "<h3>Crown Or Kireedam Fit</h3>",
  },
  {
    file: "WhatsApp Image 2026-05-16 at 12.03.49 PM.jpeg",
    role: "Preparation context image",
    alt: "Preparation setting before Hanuman Jayanti alankaram at Sri Vijaya Vinayaka Swamy Temple",
    insertBefore: "<h2>Temple And Occasion</h2>",
  },
  {
    file: "WhatsApp Image 2026-05-16 at 12.03.51 PM.jpeg",
    role: "Temple preparation image",
    alt: "Temple preparation before Hanuman Jayanti alankaram in Malkajgiri Secunderabad",
    insertBefore: "<h2>What Buyers Can Learn From This Example</h2>",
  },
];

const videoSpecs = [
  {
    file: "WhatsApp Video 2026-05-16 at 12.03.48 PM.mp4",
    role: "Vertical social video candidate",
    alt: "Hanuman Jayanti 2026 alankaram video at Sri Vijaya Vinayaka Swamy Temple Malkajgiri",
  },
];

if (!SHOP || !TOKEN) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
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

function extractBlock(markdown, heading, fence = "html") {
  const pattern = new RegExp(`## ${heading}\\s+\\\`\\\`\\\`${fence}\\s*([\\s\\S]*?)\\s*\\\`\\\`\\\``, "m");
  const match = markdown.match(pattern);
  if (!match) throw new Error(`Missing ${heading} block`);
  return match[1].trim();
}

function extractField(markdown, label) {
  const match = markdown.match(new RegExp(`^${label}:\\s*(.+)$`, "m"));
  if (!match) throw new Error(`Missing field ${label}`);
  return match[1].trim();
}

function contentType(filename) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".mp4")) return "video/mp4";
  return "image/jpeg";
}

function isVideo(filename) {
  return filename.toLowerCase().endsWith(".mp4");
}

async function uploadFile(spec) {
  const fullPath = path.join(mediaDir, spec.file);
  const stats = fs.statSync(fullPath);
  const mimeType = contentType(spec.file);
  const video = isVideo(spec.file);
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
          resource: video ? "VIDEO" : "FILE",
          filename: spec.file,
          mimeType,
          fileSize: String(stats.size),
          httpMethod: "POST",
        },
      ],
    }
  );
  const uploadErrors = staged.stagedUploadsCreate.userErrors || [];
  if (uploadErrors.length) throw new Error(`stagedUploadsCreate ${spec.file}: ${JSON.stringify(uploadErrors)}`);
  const target = staged.stagedUploadsCreate.stagedTargets[0];
  const form = new FormData();
  for (const param of target.parameters) form.append(param.name, param.value);
  form.append("file", new Blob([fs.readFileSync(fullPath)], { type: mimeType }), spec.file);
  const upload = await fetch(target.url, { method: "POST", body: form });
  const uploadText = await upload.text();
  if (!upload.ok) throw new Error(`Staged upload failed ${spec.file} ${upload.status}: ${uploadText}`);

  const created = await gql(
    `mutation($files:[FileCreateInput!]!){
      fileCreate(files:$files){
        files{
          id
          alt
          fileStatus
          ... on MediaImage { preview{ image{ url } } image{ url } }
          ... on Video { preview{ image{ url } } sources{ url mimeType format width height } }
          ... on GenericFile { url }
        }
        userErrors{ field message }
      }
    }`,
    {
      files: [
        {
          alt: spec.alt,
          contentType: video ? "VIDEO" : "IMAGE",
          originalSource: target.resourceUrl,
        },
      ],
    }
  );
  const fileErrors = created.fileCreate.userErrors || [];
  if (fileErrors.length) throw new Error(`fileCreate ${spec.file}: ${JSON.stringify(fileErrors)}`);
  const file = created.fileCreate.files[0];
  let url = file.image?.url || file.preview?.image?.url || file.url || file.sources?.[0]?.url || null;
  for (let index = 0; index < 16 && !url; index += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const node = await gql(
      `query($id:ID!){
        node(id:$id){
          ... on MediaImage { id fileStatus preview{ image{ url } } image{ url } }
          ... on Video { id fileStatus preview{ image{ url } } sources{ url mimeType format width height } }
          ... on GenericFile { id fileStatus url }
        }
      }`,
      { id: file.id }
    );
    url = node.node?.image?.url || node.node?.preview?.image?.url || node.node?.url || node.node?.sources?.[0]?.url || null;
  }
  if (!url) throw new Error(`Uploaded file did not return URL: ${spec.file}`);
  return { ...spec, id: file.id, url, type: video ? "video" : "image" };
}

function imageFigure(upload, caption) {
  return [
    `<figure class="gc-temple-figure">`,
    `<img src="${upload.url}" alt="${upload.alt}" loading="lazy">`,
    caption ? `<figcaption>${caption}</figcaption>` : "",
    `</figure>`,
  ].filter(Boolean).join("");
}

function videoFigure(upload, posterUrl = "") {
  const posterAttribute = posterUrl ? ` poster="${posterUrl}"` : "";
  return [
    `<figure class="gc-temple-figure gc-temple-video">`,
    `<video controls preload="metadata" playsinline${posterAttribute} style="width:100%;height:auto;border-radius:8px;">`,
    `<source src="${upload.url}" type="video/mp4">`,
    `</video>`,
    `<figcaption>Hanuman Jayanti 2026 alankaram video at Sri Vijaya Vinayaka Swamy Temple, shared with permission.</figcaption>`,
    `</figure>`,
  ].join("");
}

function addArticleDesign(bodyHtml) {
  return [
    `<style>
      .gc-temple-proof { background:#fdf6ec; color:#1f170d; font-size:1.12rem; line-height:1.72; }
      .gc-temple-proof p, .gc-temple-proof li { color:#33281d; font-size:1.12rem; line-height:1.72; }
      .gc-temple-proof ul, .gc-temple-proof ol { margin:1rem 0 1.35rem; padding-left:1.35rem; }
      .gc-temple-proof li::marker { color:#c9972a; }
      .gc-temple-proof .gc-proof-note { background:#fffaf2; border-left:4px solid #c9972a; border-radius:8px; padding:1.15rem 1.25rem; margin:1.15rem 0 1.6rem; box-shadow:0 2px 8px rgba(26,14,4,.08); }
      .gc-temple-proof .gc-proof-note p { margin:0; }
      .gc-temple-proof .gc-proof-note strong { color:#8b1c1c; }
      .gc-temple-proof .gc-temple-figure { margin:1.6rem 0; }
      .gc-temple-proof .gc-temple-figure img, .gc-temple-proof .gc-temple-figure video { background:#1a0e05; border-radius:8px; display:block; height:min(78vh, 860px) !important; object-fit:contain; width:100%; }
      .gc-temple-proof .gc-temple-figure figcaption { color:#6f6254; font-size:1rem; line-height:1.5; margin-top:.55rem; }
      .gc-temple-proof h2, .gc-temple-proof h3 { color:#1f170d; line-height:1.18; margin-top:2rem; }
      .gc-temple-proof h2 { font-size:clamp(1.8rem,3vw,2.6rem); }
      .gc-temple-proof h3 { font-size:clamp(1.35rem,2vw,1.75rem); }
      @media (max-width: 749px) {
        .gc-temple-proof { font-size:1.08rem; line-height:1.68; }
        .gc-temple-proof p, .gc-temple-proof li { font-size:1.08rem; line-height:1.68; }
        .gc-temple-proof .gc-proof-note { padding:1rem; }
        .gc-temple-proof .gc-temple-figure img, .gc-temple-proof .gc-temple-figure video { height:min(70vh, 540px) !important; }
      }
    </style>`,
    `<div class="gc-temple-proof">`,
    bodyHtml.replace(
      "<p><strong>Golden Collections deity jewellery was used",
      `<div class="gc-proof-note"><p><strong>Golden Collections deity jewellery was used`
    ).replace(
      "coordinated with Ayyagaru Ram Sharma.</strong></p>",
      "coordinated with Ayyagaru Ram Sharma.</strong></p></div>"
    ),
    `</div>`,
  ].join("\n");
}

function insertMedia(bodyHtml, imageUploads, videoUploads) {
  let out = bodyHtml;
  const captions = [
    "Final Hanuman Jayanti alankaram at Sri Vijaya Vinayaka Swamy Temple, Malkajgiri.",
    "Close-up of the crown, face and deity jewellery details.",
    "Temple preparation context before the final alankaram.",
    "Preparation context showing why placement and fit matter before final decoration.",
  ];
  imageUploads.forEach((upload, index) => {
    if (out.includes(upload.insertBefore)) {
      out = out.replace(upload.insertBefore, `${imageFigure(upload, captions[index])}\n\n${upload.insertBefore}`);
    }
  });
  if (videoUploads[0] && out.includes("<h2>FAQ</h2>")) {
    out = out.replace("<h2>FAQ</h2>", `${videoFigure(videoUploads[0], imageUploads[0]?.url || "")}\n\n<h2>FAQ</h2>`);
  }
  return out;
}

function schemaJson(imageUrls, videoUrl) {
  const graph = [
    {
      "@type": "BlogPosting",
      "@id": `${PUBLIC_URL}#article`,
      "mainEntityOfPage": PUBLIC_URL,
      "headline": "Hanuman Jayanti Alankaram at Sri Vijaya Vinayaka Swamy Temple, Malkajgiri",
      "description": "A real Hanuman Jayanti 2026 alankaram at Sri Vijaya Vinayaka Swamy Temple, Malkajgiri, where Golden Collections deity jewellery was used.",
      "author": { "@type": "Person", "name": "Anil Tunk", "url": "https://www.goldencollections.com/pages/anil-tunk" },
      "publisher": { "@type": "Organization", "name": "Golden Collections", "url": "https://www.goldencollections.com/" },
      "dateCreated": "2026-05-16",
      "dateModified": "2026-05-16",
      "about": ["Hanuman Jayanti", "deity jewellery", "Hanuman alankaram", "Sri Vijaya Vinayaka Swamy Temple", "Golden Collections"],
      "image": imageUrls,
    },
    {
      "@type": "FAQPage",
      "@id": `${PUBLIC_URL}#faq`,
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What jewellery is used for Hanuman alankaram?",
          "acceptedAnswer": { "@type": "Answer", "text": "Hanuman alankaram may include a crown or kireedam, chest ornamentation, kavacham-style body coverage, garlands, arch or prabhavali framing, and deity-specific accessories depending on the idol and tradition." },
        },
        {
          "@type": "Question",
          "name": "How should a Hanuman crown fit?",
          "acceptedAnswer": { "@type": "Answer", "text": "A Hanuman crown should match the head width, crown height space and altar clearance while keeping the face and eyes visible. Do not choose only by design." },
        },
        {
          "@type": "Question",
          "name": "Can one Hanuman jewellery set fit every idol?",
          "acceptedAnswer": { "@type": "Answer", "text": "No. Fit depends on idol size, posture, head shape, chest width, hand position and altar space. Treat each idol as a separate fit decision." },
        },
      ],
    },
  ];
  if (videoUrl) {
    graph.push({
      "@type": "VideoObject",
      "@id": `${PUBLIC_URL}#video`,
      "name": "Hanuman Jayanti 2026 Alankaram at Sri Vijaya Vinayaka Swamy Temple, Malkajgiri",
      "description": "Hanuman Jayanti 2026 alankaram video at Sri Vijaya Vinayaka Swamy Temple, Malkajgiri, shared with permission.",
      "contentUrl": videoUrl,
      "thumbnailUrl": imageUrls.slice(0, 1),
      "uploadDate": "2026-05-16",
      "publisher": { "@type": "Organization", "name": "Golden Collections", "url": "https://www.goldencollections.com/" },
    });
  }
  return `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph })}</script>`;
}

async function findExistingArticle() {
  const json = await rest(`/blogs/${BLOG_ID}/articles.json?limit=250&fields=id,handle,title,published_at`);
  return (json.articles || []).find((article) => article.handle === HANDLE) || null;
}

async function setSeoMetafields(articleId, seoTitle, metaDescription) {
  const ownerId = `gid://shopify/Article/${articleId}`;
  const data = await gql(
    `mutation($metafields:[MetafieldsSetInput!]!){
      metafieldsSet(metafields:$metafields){
        userErrors{ field message }
      }
    }`,
    {
      metafields: [
        { ownerId, namespace: "global", key: "title_tag", type: "single_line_text_field", value: seoTitle },
        { ownerId, namespace: "global", key: "description_tag", type: "single_line_text_field", value: metaDescription },
      ],
    }
  );
  const errors = data.metafieldsSet.userErrors || [];
  if (errors.length) throw new Error(`metafieldsSet: ${JSON.stringify(errors)}`);
}

function updatePackage(markdown, article, uploads, videoUploads, bodySha) {
  const uploaded = [
    "## Uploaded Media URLs",
    "",
    "| Type | Role | File | URL |",
    "| --- | --- | --- | --- |",
    ...uploads.map((upload) => `| ${upload.type} | ${upload.role} | \`${upload.file}\` | \`${upload.url}\` |`),
    ...videoUploads.map((upload) => `| ${upload.type} | ${upload.role} | \`${upload.file}\` | \`${upload.url}\` |`),
    "",
  ].join("\n");
  const notes = [
    "## Draft Creation Notes",
    "",
    "2026-05-16:",
    "",
    "- Owner requested creation of the Shopify draft after confirming temple permission.",
    "- Tone updated to say Golden Collections was fortunate to be entrusted with the responsibility and to thank the temple and Ayyagaru Ram Sharma for support during measurements.",
    "- Uploaded usable images to Shopify Files and inserted them into the article body.",
    videoUploads.length ? "- Uploaded the vertical video to Shopify Files and embedded it in the draft body." : "- Video upload/embed was not completed; use the repurpose package for video posting.",
    "- Created or updated the Shopify article as a draft, not live published.",
    `- Shopify article ID: \`${article.id}\`.`,
    `- Admin URL: \`https://admin.shopify.com/store/${ADMIN_STORE}/content/articles/${article.id}\`.`,
    `- Public URL after publish: \`${PUBLIC_URL}\`.`,
    `- Rendered body SHA-256: \`${bodySha}\`.`,
    "",
  ].join("\n");
  let out = markdown
    .replace("Content status: package prepared, not posted to Shopify", "Content status: Shopify draft created")
    .replace("Owner approved: no", "Owner approved: no")
    .replace("Suggested handle: `hanuman-jayanti-alankaram-sri-vijaya-vinayaka-swamy-temple-malkajgiri-2026`", `Suggested handle: \`hanuman-jayanti-alankaram-sri-vijaya-vinayaka-swamy-temple-malkajgiri-2026\`  \nShopify blog ID: \`${BLOG_ID}\`  \nShopify article ID: \`${article.id}\`  \nShopify article status: draft  \nShopify admin URL: \`https://admin.shopify.com/store/${ADMIN_STORE}/content/articles/${article.id}\`  \nShopify featured image: \`${article.image?.src || uploads[0]?.url || ""}\``);
  if (!out.includes("## Uploaded Media URLs")) out += `\n\n${uploaded}`;
  if (!out.includes("## Draft Creation Notes")) out += `\n${notes}`;
  return out;
}

function updateSnapshot(articleId) {
  let snapshot = fs.readFileSync(snapshotPath, "utf8");
  if (snapshot.includes(`Handle: \`${HANDLE}\``)) return;
  const entry = [
    "",
    "- Title: `Hanuman Jayanti Alankaram at Sri Vijaya Vinayaka Swamy Temple, Malkajgiri`",
    `- Handle: \`${HANDLE}\``,
    `- Shopify ID: \`${articleId}\``,
    "- Content type: blog post",
    "- Blog: `Golden Collections Jewellery Guides`",
    "- Blog handle: `jewellery-guides`",
    "- Status: draft",
    "- Date created: 2026-05-16",
    "- Topic cluster: deity jewellery, Hanuman alankaram, temple proof, Hanuman Jayanti",
    "- Primary angle: temple proof case study",
    "",
  ].join("\n");
  const marker = "When future Shopify drafts are created through this system, append the same fields here.";
  snapshot = snapshot.includes(marker) ? snapshot.replace(marker, `${entry}\n${marker}`) : `${snapshot}\n${entry}`;
  fs.writeFileSync(snapshotPath, snapshot);
}

const packageMarkdown = fs.readFileSync(packagePath, "utf8");
const rawBody = extractBlock(packageMarkdown, "Body HTML", "html");
const title = extractField(packageMarkdown, "Blog title");
const seoTitle = extractField(packageMarkdown, "SEO title");
const metaDescription = extractField(packageMarkdown, "Meta description");
const excerpt = extractField(packageMarkdown, "Excerpt");
const tags = extractField(packageMarkdown, "Tags");

if (!APPLY) {
  console.log(JSON.stringify({ mode: "dry-run", handle: HANDLE, mediaDir, imageSpecs, videoSpecs }, null, 2));
  process.exit(0);
}

const imageUploads = [];
for (const spec of imageSpecs) imageUploads.push(await uploadFile(spec));

const videoUploads = [];
for (const spec of videoSpecs) {
  try {
    videoUploads.push(await uploadFile(spec));
  } catch (error) {
    console.error(`Video upload skipped: ${error.message}`);
  }
}

const bodyWithMedia = addArticleDesign(insertMedia(rawBody, imageUploads, videoUploads));
const fullBody = `${bodyWithMedia}\n\n${schemaJson(imageUploads.map((upload) => upload.url), videoUploads[0]?.url || null)}`;
const bodySha = crypto.createHash("sha256").update(fullBody).digest("hex");
const heroAttachment = fs.readFileSync(path.join(mediaDir, imageSpecs[0].file)).toString("base64");
const existing = await findExistingArticle();
const articlePayload = {
  article: {
    title,
    handle: HANDLE,
    body_html: fullBody,
    summary_html: excerpt,
    tags,
    author: "Anil Tunk",
    published: false,
    image: {
      attachment: heroAttachment,
      filename: "hanuman-jayanti-alankaram-sri-vijaya-vinayaka-swamy-temple-2026.jpeg",
      alt: imageSpecs[0].alt,
    },
  },
};

let article;
if (existing) {
  const updated = await rest(`/blogs/${BLOG_ID}/articles/${existing.id}.json`, {
    method: "PUT",
    body: JSON.stringify({ article: { id: existing.id, ...articlePayload.article } }),
  });
  article = updated.article;
} else {
  const created = await rest(`/blogs/${BLOG_ID}/articles.json`, {
    method: "POST",
    body: JSON.stringify(articlePayload),
  });
  article = created.article;
}

await setSeoMetafields(article.id, seoTitle, metaDescription);
updateSnapshot(article.id);
const updatedPackage = updatePackage(packageMarkdown, article, imageUploads, videoUploads, bodySha);
fs.writeFileSync(packagePath, updatedPackage);

console.log(JSON.stringify({
  articleId: article.id,
  handle: article.handle,
  status: article.published_at ? "published" : "draft",
  adminUrl: `https://admin.shopify.com/store/${ADMIN_STORE}/content/articles/${article.id}`,
  publicUrlAfterPublish: PUBLIC_URL,
  featuredImage: article.image?.src || null,
  uploadedImages: imageUploads.map(({ file, role, url }) => ({ file, role, url })),
  uploadedVideos: videoUploads.map(({ file, role, url }) => ({ file, role, url })),
  bodySha256: bodySha,
}, null, 2));
