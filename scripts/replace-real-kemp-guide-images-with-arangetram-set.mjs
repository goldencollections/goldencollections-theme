import fs from "fs";
import path from "path";

const root = process.cwd();
const env = Object.fromEntries(
  fs.readFileSync(path.join(root, "env"), "utf8")
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
const ARTICLE_ID = "616345633066";
const PACKAGE_PATH = path.join(root, "blog-system", "outputs", "shopify-ready", "2026-05-13-real-kemp-jewellery-guide-shopify-package.md");
const HERO_LOCAL = path.join(root, "Blog Images", "gc-real-kemp-arangetram-set-bks001-2026.jpg");

const replacementImages = [
  {
    oldSlug: "gc-real-kemp-jewellery-guide-2026",
    url: "https://cdn.shopify.com/s/files/1/0764/9224/3242/files/gc-bks001-real-kemp-bharatanatyam-dance-set.jpg?v=1778668215",
    alt: "BKS001 real kemp Bharatanatyam dance jewellery set from Golden Collections",
  },
  {
    oldSlug: "gc-real-kemp-stones-detail-2026",
    url: "https://cdn.shopify.com/s/files/1/0764/9224/3242/files/gc-real-kemp-long-haram-arangetram-bks001.jpg?v=1778668215",
    alt: "Real kemp long haram necklace for Bharatanatyam arangetram BKS001",
  },
  {
    oldSlug: "gc-real-kemp-components-planning-2026",
    url: "https://cdn.shopify.com/s/files/1/0764/9224/3242/files/gc-real-kemp-vaddanam-oddiyanam-arangetram-bks001.jpg?v=1778668215",
    alt: "Real kemp vaddanam oddiyanam waist belt for Bharatanatyam arangetram BKS001",
  },
];

if (!SHOP || !TOKEN) throw new Error("Missing Shopify credentials in env");

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
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`REST ${options.method || "GET"} ${pathname} HTTP ${res.status}: ${text}`);
  return json;
}

function replaceFigureBySlug(body, { oldSlug, url, alt }) {
  const escapedSlug = oldSlug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const figurePattern = new RegExp(`<figure><img src="[^"]*${escapedSlug}[^"]*"[^>]*></figure>`, "g");
  const figureHtml = `<figure><img src="${url}" alt="${alt}" loading="lazy"></figure>`;
  if (figurePattern.test(body)) {
    return body.replace(figurePattern, figureHtml);
  }
  const imgPattern = new RegExp(`src="[^"]*${escapedSlug}[^"]*" alt="[^"]*"`, "g");
  return body.replace(imgPattern, `src="${url}" alt="${alt}"`);
}

function updateSchemaImages(body) {
  return body.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (full, jsonText) => {
    let schema;
    try {
      schema = JSON.parse(jsonText);
    } catch {
      return full;
    }
    const graph = Array.isArray(schema["@graph"]) ? schema["@graph"] : [];
    const blogPosting = graph.find((node) => node["@type"] === "BlogPosting");
    if (!blogPosting) return full;
    blogPosting.image = replacementImages.map((image) => image.url);
    return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
  });
}

function updatePackageFile(articleImageUrl) {
  let pkg = fs.readFileSync(PACKAGE_PATH, "utf8");
  pkg = pkg
    .replace(/Shopify featured image: `[^`]+`/, `Shopify featured image: \`${articleImageUrl}\``)
    .replace(
      /\| Hero \/ article featured image \| `[^`]+` \|/,
      `| Hero / article featured image | \`${replacementImages[0].url}\` |`
    )
    .replace(
      /\| Materials section inline image \| `[^`]+` \|/,
      `| Materials section inline image | \`${replacementImages[1].url}\` |`
    )
    .replace(
      /\| Components section inline image \| `[^`]+` \|/,
      `| Components section inline image | \`${replacementImages[2].url}\` |`
    );
  if (!pkg.includes("Replaced the AI-generated editorial images with the image set used for the arangetram real kemp blog")) {
    pkg += [
      "",
      "2026-05-13 image correction:",
      "",
      "- Replaced the AI-generated editorial images with the image set used for the arangetram real kemp blog.",
      "- Updated the live article body image URLs, BlogPosting schema image URLs, and Shopify article featured image.",
      "- The generated AI images remain in Shopify Files/workspace history but are no longer referenced by the live article.",
      "",
    ].join("\n");
  }
  fs.writeFileSync(PACKAGE_PATH, pkg);
}

const current = await rest(`/blogs/${BLOG_ID}/articles/${ARTICLE_ID}.json`);
let body = current.article.body_html || "";
for (const image of replacementImages) {
  body = replaceFigureBySlug(body, image);
}
body = updateSchemaImages(body);

const heroAttachment = fs.readFileSync(HERO_LOCAL).toString("base64");
const updated = await rest(`/blogs/${BLOG_ID}/articles/${ARTICLE_ID}.json`, {
  method: "PUT",
  body: JSON.stringify({
    article: {
      id: ARTICLE_ID,
      title: current.article.title,
      handle: current.article.handle,
      body_html: body,
      summary_html: current.article.summary_html,
      tags: current.article.tags,
      author: current.article.author,
      published: true,
      published_at: current.article.published_at,
      image: {
        attachment: heroAttachment,
        filename: "gc-real-kemp-arangetram-set-bks001-2026.jpg",
        alt: "Real kemp Bharatanatyam jewellery set for arangetram with long haram short necklace vaddanam and matching ornaments",
      },
    },
  }),
});

updatePackageFile(updated.article.image?.src || "");

console.log(JSON.stringify({
  articleId: updated.article.id,
  handle: updated.article.handle,
  featuredImage: updated.article.image?.src || null,
  bodyContainsOldAiSlugs: replacementImages.some((image) => updated.article.body_html.includes(image.oldSlug)),
  bodyContainsReplacementUrls: replacementImages.every((image) => updated.article.body_html.includes(image.url)),
}, null, 2));
