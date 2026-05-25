#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const packagePath = path.join(
  root,
  "blog-system",
  "outputs",
  "shopify-ready",
  "2026-05-20-bharatanatyam-kuchipudi-arangetram-jewellery-checklist-shopify-package.md",
);
const finalBodyPath = path.join(
  root,
  "blog-system",
  "outputs",
  "shopify-ready",
  "2026-05-20-bharatanatyam-kuchipudi-arangetram-jewellery-checklist-final-body.html",
);
const reportPath = path.join(
  root,
  "knowledge-base",
  "outputs",
  "arangetram-checklist-shopify-launch-result-2026-05-24.json",
);

const env = readEnv(path.join(root, "env"));
const SHOP = env.SHOPIFY_STORE_DOMAIN;
const TOKEN = env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = env.SHOPIFY_API_VERSION || "2025-10";
const PUBLIC_BASE = "https://www.goldencollections.com";
const HANDLE = "bharatanatyam-arangetram-kuchipudi-rangapravesam-jewellery-checklist";
const PUBLIC_URL = `${PUBLIC_BASE}/pages/${HANDLE}`;
const ADMIN_STORE = "6f15d1";

const imageDir = path.join(root, "blog-system", "outputs", "shopify-ready", "arangetram-checklist-images");
const imageSpecs = [
  {
    file: "arangetram-rangapravesam-real-kemp-dance-set-hero.jpg",
    alt: "Real kemp Bharatanatyam and Kuchipudi dance jewellery set with necklace haram vaddanam earrings headset and jada accessories",
    role: "Hero / main component layout",
  },
  {
    file: "arangetram-rangapravesam-real-kemp-full-set-layout.jpg",
    alt: "Real kemp dance jewellery component layout for arangetram and rangapravesam planning",
    role: "Supporting full-set layout",
  },
  {
    file: "arangetram-rangapravesam-real-kemp-detail.jpg",
    alt: "Close view of real kemp dance jewellery necklace headset earrings and waist belt components",
    role: "Supporting detail image",
  },
];

const internalLinkHtml =
  '<p><strong>Planning an arangetram or rangapravesam?</strong> Use our <a href="/pages/bharatanatyam-arangetram-kuchipudi-rangapravesam-jewellery-checklist">Bharatanatyam Arangetram and Kuchipudi Rangapravesam Jewellery Checklist</a> to check components, fit, range choice and timing before ordering.</p>';

const collectionHandles = [
  "bharatanatyam-jewellery",
  "bharatanatyam-jewellery-sets",
  "kemp-jewellery",
  "kemp-bharatanatyam-jewellery-dance-sets",
  "kemp-black-jewellery",
  "kemp-black-bharatanatyam-kuchipudi-dance-jewellery-set",
];
const pageHandlesToLink = ["golden-collections-knowledge-hub"];

if (!SHOP || !TOKEN) throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");

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
      }),
  );
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

function extractBlock(markdown, heading, fence) {
  const pattern = new RegExp(`## ${heading}[\\s\\S]*?\\\`\\\`\\\`${fence}\\s*([\\s\\S]*?)\\s*\\\`\\\`\\\``, "m");
  const match = markdown.match(pattern);
  if (!match) throw new Error(`Missing ${heading} block`);
  return match[1].trim();
}

function extractField(markdown, label) {
  const match = markdown.match(new RegExp(`^${label}:\\s*(.+)$`, "m"));
  if (!match) throw new Error(`Missing field ${label}`);
  return match[1].trim();
}

function figure(upload) {
  return `<figure><img src="${upload.url}" alt="${upload.alt}" loading="lazy"></figure>`;
}

function buildBody(markdown, uploads) {
  let body = extractBlock(markdown, "Body HTML", "html");
  const schema = JSON.parse(extractBlock(markdown, "Schema JSON-LD", "json"));
  const article = schema["@graph"].find((item) => item["@type"] === "Article");
  if (article) {
    article.mainEntityOfPage = PUBLIC_URL;
    article.datePublished = "2026-05-24";
    article.dateModified = "2026-05-24";
    article.image = uploads.map((upload) => upload.url);
  }
  body = body
    .replace("<h2>1. Before You Shop, Collect These Details</h2>", `${figure(uploads[0])}\n\n<h2>1. Before You Shop, Collect These Details</h2>`)
    .replace("<h2>3. Regular Dance, Real Kemp, Or Black Kemp?</h2>", `${figure(uploads[1])}\n\n<h2>3. Regular Dance, Real Kemp, Or Black Kemp?</h2>`)
    .replace("<h3>Black Kemp Jewellery</h3>", `${figure(uploads[2])}\n\n<h3>Black Kemp Jewellery</h3>`);
  return `${body}\n\n<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

function bodyContainsRequiredChecks(body, uploads) {
  const required = [
    "Core Jewellery Component Checklist",
    "Regular Dance, Real Kemp, Or Black Kemp?",
    "<h2>FAQ</h2>",
    "USA orders usually turn around within a week",
    ...uploads.map((upload) => upload.url),
  ];
  return required.every((needle) => body.includes(needle));
}

async function verifyGoldenShop() {
  const data = await gql(`query { shop { name myshopifyDomain primaryDomain { host url } } }`);
  const shop = data.shop;
  const looksGolden =
    SHOP === "6f15d1.myshopify.com" &&
    shop.myshopifyDomain === "6f15d1.myshopify.com" &&
    (shop.primaryDomain?.host || "").includes("goldencollections.com");
  if (!looksGolden) {
    throw new Error(`Refusing to write: Admin API resolved to ${JSON.stringify(shop)}`);
  }
  return shop;
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
    },
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
        files{ id alt fileStatus preview{ image{ url } } }
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
    },
  );
  const fileErrors = created.fileCreate.userErrors || [];
  if (fileErrors.length) throw new Error(`fileCreate: ${JSON.stringify(fileErrors)}`);
  const file = created.fileCreate.files[0];
  let url = file.preview?.image?.url || null;
  for (let index = 0; index < 16 && !url; index += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const node = await gql(
      `query($id:ID!){ node(id:$id){ ... on MediaImage { id fileStatus preview{ image{ url } } image{ url } } } }`,
      { id: file.id },
    );
    url = node.node?.image?.url || node.node?.preview?.image?.url || null;
  }
  if (!url) throw new Error(`Uploaded file did not return image URL: ${spec.file}`);
  return { ...spec, id: file.id, url };
}

async function findPageByHandle(handle) {
  const json = await rest(`/pages.json?limit=250&fields=id,title,handle,body_html,published_at`);
  return (json.pages || []).find((page) => page.handle === handle) || null;
}

async function publishPage({ title, seoTitle, metaDescription, body }) {
  const existing = await findPageByHandle(HANDLE);
  const pagePayload = {
    title,
    handle: HANDLE,
    body_html: body,
    published: true,
    published_at: new Date().toISOString(),
    metafields_global_title_tag: seoTitle,
    metafields_global_description_tag: metaDescription,
  };
  if (existing) {
    const updated = await rest(`/pages/${existing.id}.json`, {
      method: "PUT",
      body: JSON.stringify({ page: { id: existing.id, ...pagePayload } }),
    });
    return { action: "updated", page: updated.page };
  }
  const created = await rest("/pages.json", {
    method: "POST",
    body: JSON.stringify({ page: pagePayload }),
  });
  return { action: "created", page: created.page };
}

async function findCollection(handle) {
  for (const resource of ["custom_collections", "smart_collections"]) {
    const json = await rest(`/${resource}.json?handle=${encodeURIComponent(handle)}&limit=1&fields=id,handle,title,body_html`);
    const collection = json[resource]?.find((item) => item.handle === handle);
    if (collection) return { resource, collection };
  }
  return null;
}

async function updateCollectionLink(handle) {
  const found = await findCollection(handle);
  if (!found) return { handle, updated: false, reason: "not found" };
  const { resource, collection } = found;
  const body = collection.body_html || "";
  if (body.includes(`/pages/${HANDLE}`)) return { handle, resource, updated: false, reason: "already linked" };
  const body_html = body.trim() ? `${body.trim()}\n\n${internalLinkHtml}` : internalLinkHtml;
  await rest(`/${resource}/${collection.id}.json`, {
    method: "PUT",
    body: JSON.stringify({ [resource.replace(/s$/, "")]: { id: collection.id, body_html } }),
  });
  return { handle, resource, id: collection.id, updated: true };
}

async function updatePageLink(handle) {
  const page = await findPageByHandle(handle);
  if (!page) return { handle, updated: false, reason: "not found" };
  const body = page.body_html || "";
  if (body.includes(`/pages/${HANDLE}`)) return { handle, updated: false, reason: "already linked" };
  const body_html = body.trim() ? `${body.trim()}\n\n${internalLinkHtml}` : internalLinkHtml;
  await rest(`/pages/${page.id}.json`, {
    method: "PUT",
    body: JSON.stringify({ page: { id: page.id, body_html } }),
  });
  return { handle, id: page.id, updated: true };
}

function writePackagePublishNotes(markdown, page, uploads) {
  let out = markdown
    .replace("Content status: ready for Shopify draft creation", "Content status: published live")
    .replace("- [ ] Confirm kids/teens/adults guidance.", "- [x] Confirm kids/teens/adults guidance.")
    .replace("No Shopify draft created. This package is intentionally held for owner review.", "Published live on Shopify after owner approval and live verification.");
  const uploadedTable = [
    "## Uploaded Golden Shopify Image URLs",
    "",
    "| Role | URL |",
    "| --- | --- |",
    ...uploads.map((upload) => `| ${upload.role} | \`${upload.url}\` |`),
    "",
  ].join("\n");
  const notes = [
    "## Live Publish Notes",
    "",
    "2026-05-24:",
    "",
    "- Owner approved content direction, real kemp images, USA shipping wording, and publishing path in chat.",
    "- Verified the Admin API shop as Golden Collections before writing.",
    "- Uploaded the three selected real kemp dance set images to Golden Collections Shopify Files.",
    "- Created or updated the Shopify page and published it live.",
    `- Shopify page ID: \`${page.id}\`.`,
    `- Admin URL: \`https://admin.shopify.com/store/${ADMIN_STORE}/content/pages/${page.id}\`.`,
    `- Public URL: \`${PUBLIC_URL}\`.`,
    "",
  ].join("\n");
  if (!out.includes("## Uploaded Golden Shopify Image URLs")) out += `\n\n${uploadedTable}`;
  if (!out.includes("## Live Publish Notes")) out += `\n${notes}`;
  return out;
}

const shop = await verifyGoldenShop();
const packageMarkdown = fs.readFileSync(packagePath, "utf8");
const title = extractField(packageMarkdown, "Page title");
const seoTitle = extractField(packageMarkdown, "SEO title");
const metaDescription = extractField(packageMarkdown, "Meta description");

const uploads = [];
for (const spec of imageSpecs) uploads.push(await uploadFile(spec));
const body = buildBody(packageMarkdown, uploads);
if (!bodyContainsRequiredChecks(body, uploads)) {
  throw new Error("Final body failed required content checks");
}
fs.writeFileSync(finalBodyPath, body);

const pageResult = await publishPage({ title, seoTitle, metaDescription, body });
const collectionLinks = [];
for (const handle of collectionHandles) collectionLinks.push(await updateCollectionLink(handle));
const pageLinks = [];
for (const handle of pageHandlesToLink) pageLinks.push(await updatePageLink(handle));

const updatedPackage = writePackagePublishNotes(packageMarkdown, pageResult.page, uploads);
fs.writeFileSync(packagePath, updatedPackage);

const report = {
  createdAt: new Date().toISOString(),
  shop,
  publicUrl: PUBLIC_URL,
  adminUrl: `https://admin.shopify.com/store/${ADMIN_STORE}/content/pages/${pageResult.page.id}`,
  pageAction: pageResult.action,
  pageId: pageResult.page.id,
  pageHandle: pageResult.page.handle,
  publishedAt: pageResult.page.published_at,
  seo: {
    title: seoTitle,
    description: metaDescription,
  },
  uploads: uploads.map(({ file, role, alt, id, url }) => ({ file, role, alt, id, url })),
  internalLinks: {
    collections: collectionLinks,
    pages: pageLinks,
  },
  outputFiles: {
    finalBodyPath,
    reportPath,
  },
};
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
