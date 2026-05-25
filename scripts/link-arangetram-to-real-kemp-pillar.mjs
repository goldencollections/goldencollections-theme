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
const ARTICLE_ID = "616340980010";
const PILLAR_URL = "https://www.goldencollections.com/blogs/jewellery-guides/real-kemp-jewellery-guide";
const packagePath = path.join(root, "blog-system", "outputs", "shopify-ready", "2026-05-13-real-kemp-jewellery-arangetram-shopify-package.md");

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

const current = await rest(`/blogs/${BLOG_ID}/articles/${ARTICLE_ID}.json`);
const article = current.article;
let body = article.body_html || "";
if (!body.includes(PILLAR_URL)) {
  const insertion =
    `<p>If you are still comparing the basic meaning, materials and range difference, read the parent guide: <a href="${PILLAR_URL}">Real Kemp Jewellery: Meaning, Materials, Uses, and Buying Guide</a>.</p>`;
  const anchor = "<h2>When Real Kemp Makes Sense for Arangetram</h2>";
  if (body.includes(anchor)) {
    body = body.replace(anchor, `${insertion}\n\n${anchor}`);
  } else {
    body = `${insertion}\n\n${body}`;
  }
  const updated = await rest(`/blogs/${BLOG_ID}/articles/${ARTICLE_ID}.json`, {
    method: "PUT",
    body: JSON.stringify({
      article: {
        id: ARTICLE_ID,
        title: article.title,
        handle: article.handle,
        body_html: body,
        summary_html: article.summary_html,
        tags: article.tags,
        author: article.author,
        published: true,
        published_at: article.published_at,
      },
    }),
  });
  article.body_html = updated.article.body_html;
} else {
  const updated = await rest(`/blogs/${BLOG_ID}/articles/${ARTICLE_ID}.json`, {
    method: "PUT",
    body: JSON.stringify({
      article: {
        id: ARTICLE_ID,
        title: article.title,
        handle: article.handle,
        body_html: body,
        summary_html: article.summary_html,
        tags: article.tags,
        author: article.author,
        published: true,
        published_at: article.published_at,
      },
    }),
  });
  article.body_html = updated.article.body_html;
}

let pkg = fs.readFileSync(packagePath, "utf8");
if (!pkg.includes("Linked arangetram child article back to the real kemp pillar")) {
  pkg += `\n\n2026-05-13 internal-link update:\n\n- Linked arangetram child article back to the real kemp pillar: \`${PILLAR_URL}\`.\n`;
  fs.writeFileSync(packagePath, pkg);
}

console.log(JSON.stringify({
  articleId: ARTICLE_ID,
  handle: article.handle,
  containsPillarLink: article.body_html.includes(PILLAR_URL),
  publicUrl: "https://www.goldencollections.com/blogs/jewellery-guides/real-kemp-jewellery-for-arangetram",
}, null, 2));
