import fs from "fs";
import path from "path";
import crypto from "crypto";

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
const HANDLE = "real-kemp-jewellery-guide";
const PUBLIC_URL = `https://www.goldencollections.com/blogs/${BLOG_HANDLE}/${HANDLE}`;
const ADMIN_STORE = "6f15d1";

if (!SHOP || !TOKEN) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
}

const pkgPath = path.join(root, "blog-system", "outputs", "shopify-ready", "2026-05-13-real-kemp-jewellery-guide-shopify-package.md");
const snapshotPath = path.join(root, "blog-system", "knowledge-snapshot.md");
const imageDir = path.join(root, "tmp", "blog-images-real-kemp-guide");

const imageSpecs = [
  {
    file: "gc-real-kemp-jewellery-guide-2026.png",
    alt: "AI-assisted editorial image of real kemp jewellery set with Kemp stones and temple jewellery motifs from Golden Collections",
    role: "Hero / article featured image",
  },
  {
    file: "gc-real-kemp-stones-detail-2026.png",
    alt: "AI-assisted close up of real kemp jewellery with red and green Kemp stones",
    role: "Materials section inline image",
  },
  {
    file: "gc-real-kemp-components-planning-2026.png",
    alt: "AI-assisted real kemp jewellery components for Bharatanatyam and Kuchipudi set planning",
    role: "Components section inline image",
  },
];

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
  return filename.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
}

async function uploadFile(spec) {
  const fullPath = path.join(imageDir, spec.file);
  const stats = fs.statSync(fullPath);
  const mimeType = contentType(spec.file);
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
          resource: "FILE",
          filename: spec.file,
          mimeType,
          fileSize: String(stats.size),
          httpMethod: "POST",
        },
      ],
    }
  );
  const uploadErrors = staged.stagedUploadsCreate.userErrors || [];
  if (uploadErrors.length) throw new Error(`stagedUploadsCreate: ${JSON.stringify(uploadErrors)}`);
  const target = staged.stagedUploadsCreate.stagedTargets[0];
  const form = new FormData();
  for (const param of target.parameters) form.append(param.name, param.value);
  const bytes = fs.readFileSync(fullPath);
  form.append("file", new Blob([bytes], { type: mimeType }), spec.file);
  const upload = await fetch(target.url, { method: "POST", body: form });
  const uploadText = await upload.text();
  if (!upload.ok) throw new Error(`Staged upload failed ${upload.status}: ${uploadText}`);

  const created = await gql(
    `mutation($files:[FileCreateInput!]!){
      fileCreate(files:$files){
        files{
          id
          alt
          fileStatus
          preview{ image{ url } }
        }
        userErrors{ field message }
      }
    }`,
    {
      files: [
        {
          alt: spec.alt,
          contentType: "IMAGE",
          originalSource: target.resourceUrl,
        },
      ],
    }
  );
  const fileErrors = created.fileCreate.userErrors || [];
  if (fileErrors.length) throw new Error(`fileCreate: ${JSON.stringify(fileErrors)}`);
  const file = created.fileCreate.files[0];
  let url = file.preview?.image?.url || null;
  for (let index = 0; index < 12 && !url; index += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const node = await gql(
      `query($id:ID!){ node(id:$id){ ... on MediaImage { id fileStatus preview{ image{ url } } image{ url } } } }`,
      { id: file.id }
    );
    url = node.node?.image?.url || node.node?.preview?.image?.url || null;
  }
  if (!url) throw new Error(`Uploaded file did not return image URL: ${spec.file}`);
  return { ...spec, id: file.id, url };
}

function insertImages(bodyHtml, uploads) {
  const figure = (upload) =>
    `<figure><img src="${upload.url}" alt="${upload.alt}" loading="lazy"></figure>`;
  return bodyHtml
    .replace("<p>If you are shopping", `${figure(uploads[0])}\n\n<p>If you are shopping`)
    .replace("<h2>What Materials Are Used in Real Kemp Jewellery?</h2>", `${figure(uploads[1])}\n\n<h2>What Materials Are Used in Real Kemp Jewellery?</h2>`)
    .replace("<h2>Common Real Kemp Components to Plan</h2>", `${figure(uploads[2])}\n\n<h2>Common Real Kemp Components to Plan</h2>`);
}

function addSchema(bodyHtml, schemaJson, imageUrls) {
  const schema = JSON.parse(schemaJson);
  const blogPosting = schema["@graph"].find((item) => item["@type"] === "BlogPosting");
  blogPosting.mainEntityOfPage = PUBLIC_URL;
  blogPosting.datePublished = "2026-05-13";
  blogPosting.dateModified = "2026-05-13";
  blogPosting.image = imageUrls;
  return `${bodyHtml}\n\n<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
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
        metafields{ id namespace key value }
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

function updatePackage(markdown, article, uploads) {
  const uploadedTable = [
    "## Uploaded Image URLs",
    "",
    "| Role | URL |",
    "| --- | --- |",
    ...uploads.map((upload) => `| ${upload.role} | \`${upload.url}\` |`),
    "",
  ].join("\n");
  const notes = [
    "## Publish Attempt Notes",
    "",
    "2026-05-13:",
    "",
    "- Owner explicitly requested live Shopify publishing in chat on 2026-05-13.",
    "- Generated three AI-assisted editorial images with the built-in image generation tool.",
    "- Copied generated assets into `tmp/blog-images-real-kemp-guide/` with SEO filenames.",
    "- Uploaded AI-assisted editorial images to Shopify Files.",
    "- Inserted hero and inline images into the Shopify body HTML with descriptive alt text.",
    "- Added uploaded image URLs to BlogPosting schema.",
    "- Created or updated the Shopify article and published it live.",
    `- Shopify article ID: \`${article.id}\`.`,
    `- Admin URL: \`https://admin.shopify.com/store/${ADMIN_STORE}/content/articles/${article.id}\`.`,
    `- Public URL: \`${PUBLIC_URL}\`.`,
    "",
  ].join("\n");
  let out = markdown
    .replace("Owner approved: no", "Owner approved: yes")
    .replace("Content status: ready for owner review", "Content status: published live")
    .replace("Content type: blog post now; future evergreen page candidate", "Content type: blog post");
  if (!out.includes("Shopify blog ID:")) {
    out = out.replace("Shopify blog handle: `jewellery-guides`", "Shopify blog handle: `jewellery-guides`  \nShopify blog ID: `123654963498`");
  }
  if (!out.includes("Shopify article ID:")) {
    out = out.replace("Suggested handle: `real-kemp-jewellery-guide`", `Suggested handle: \`real-kemp-jewellery-guide\`  \nShopify article ID: \`${article.id}\`  \nShopify article status: published  \nShopify admin URL: \`https://admin.shopify.com/store/${ADMIN_STORE}/content/articles/${article.id}\`  \nPublic URL: \`${PUBLIC_URL}\`  \nShopify featured image: \`${article.image?.src || uploads[0].url}\``);
  }
  if (!out.includes("## Uploaded Image URLs")) out += `\n\n${uploadedTable}`;
  if (!out.includes("## Publish Attempt Notes")) out += `\n${notes}`;
  return out;
}

function updateSnapshot(articleId) {
  let snapshot = fs.readFileSync(snapshotPath, "utf8");
  if (snapshot.includes("Handle: `real-kemp-jewellery-guide`")) return;
  const entry = [
    "",
    "- Title: `Real Kemp Jewellery: Meaning, Materials, Uses, and Buying Guide`",
    "- Handle: `real-kemp-jewellery-guide`",
    `- Shopify ID: \`${articleId}\``,
    "- Content type: blog post",
    "- Blog: `Golden Collections Jewellery Guides`",
    "- Blog handle: `jewellery-guides`",
    "- Status: published",
    "- Date created: 2026-05-13",
    "- Date published: 2026-05-13",
    "- Topic cluster: real kemp jewellery, kemp jewellery, Bharatanatyam jewellery, Kuchipudi jewellery",
    "- Primary angle: explainer combined with buying guide",
    "",
  ].join("\n");
  const marker = "When future Shopify drafts are created through this system, append the same fields here.";
  if (snapshot.includes(marker)) {
    snapshot = snapshot.replace(marker, `${entry}\n${marker}`);
  } else {
    snapshot += `\n${entry}`;
  }
  fs.writeFileSync(snapshotPath, snapshot);
}

const packageMarkdown = fs.readFileSync(pkgPath, "utf8");
const body = extractBlock(packageMarkdown, "Body HTML", "html");
const schema = extractBlock(packageMarkdown, "Schema JSON-LD", "json");
const title = extractField(packageMarkdown, "Blog or page title");
const seoTitle = extractField(packageMarkdown, "SEO title");
const metaDescription = extractField(packageMarkdown, "Meta description");
const excerpt = extractField(packageMarkdown, "Excerpt");
const tags = extractField(packageMarkdown, "Tags");

const uploads = [];
for (const spec of imageSpecs) {
  uploads.push(await uploadFile(spec));
}

const fullBody = addSchema(insertImages(body, uploads), schema, uploads.map((upload) => upload.url));
const heroAttachment = fs.readFileSync(path.join(imageDir, imageSpecs[0].file)).toString("base64");
const existing = await findExistingArticle();
const articlePayload = {
  article: {
    title,
    handle: HANDLE,
    body_html: fullBody,
    summary_html: excerpt,
    tags,
    author: "Anil Tunk",
    published: true,
    published_at: "2026-05-13T00:00:00+05:30",
    image: {
      attachment: heroAttachment,
      filename: imageSpecs[0].file,
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

const updatedPackage = updatePackage(packageMarkdown, article, uploads);
fs.writeFileSync(pkgPath, updatedPackage);
updateSnapshot(article.id);

const result = {
  articleId: article.id,
  handle: article.handle,
  publishedAt: article.published_at,
  publicUrl: PUBLIC_URL,
  adminUrl: `https://admin.shopify.com/store/${ADMIN_STORE}/content/articles/${article.id}`,
  image: article.image?.src || null,
  uploads: uploads.map(({ file, role, url }) => ({ file, role, url })),
  packageSha256: crypto.createHash("sha256").update(updatedPackage).digest("hex"),
};

console.log(JSON.stringify(result, null, 2));
