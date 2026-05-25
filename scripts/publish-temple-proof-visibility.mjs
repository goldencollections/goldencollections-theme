import fs from "node:fs";
import path from "node:path";

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
const REST_ENDPOINT = `https://${SHOP}/admin/api/${API_VERSION}`;

const MAIN_MENU_ID = "gid://shopify/Menu/229345394986";
const BLOG_ID = "123654963498";
const ARTICLE_ID = "616381415722";
const PROOF_TAG = "temple alankaram proof";
const PROOF_PAGE_HANDLE = "temple-alankaram-proof";
const PROOF_PAGE_TITLE = "Temple Alankaram Proof Stories";
const PROOF_PAGE_URL = `/pages/${PROOF_PAGE_HANDLE}`;

const uploadAssets = [
  "snippets/meta-tags.liquid",
  "sections/main-article.liquid",
  "sections/gc-proof-stories-hub.liquid",
  "templates/page.temple-alankaram-proof.json",
  "templates/index.json",
];

if (!SHOP || !TOKEN) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
}

async function rest(pathname, options = {}) {
  const res = await fetch(`${REST_ENDPOINT}${pathname}`, {
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
  const res = await fetch(`${REST_ENDPOINT}/graphql.json`, {
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

async function findMainTheme() {
  const json = await rest("/themes.json");
  const main = (json.themes || []).find((theme) => theme.role === "main");
  if (!main) throw new Error("No main theme found");
  return main;
}

async function putAsset(themeId, key) {
  const value = fs.readFileSync(path.join(root, key), "utf8");
  console.log(`[${APPLY ? "UPLOAD" : "DRY UPLOAD"}] ${key}`);
  if (!APPLY) return;
  await rest(`/themes/${themeId}/assets.json`, {
    method: "PUT",
    body: JSON.stringify({ asset: { key, value } }),
  });
}

function tagList(tags) {
  if (Array.isArray(tags)) return tags.map((tag) => String(tag).trim()).filter(Boolean);
  return String(tags || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

async function ensureArticleTag() {
  const json = await rest(`/blogs/${BLOG_ID}/articles/${ARTICLE_ID}.json`);
  const article = json.article;
  const tags = tagList(article.tags);
  const hasTag = tags.some((tag) => tag.toLowerCase() === PROOF_TAG);
  if (hasTag) {
    console.log(`[NOOP] Article already has tag: ${PROOF_TAG}`);
    return article;
  }
  const updatedTags = [...tags, PROOF_TAG].join(", ");
  console.log(`[${APPLY ? "UPDATE" : "DRY UPDATE"}] add article tag: ${PROOF_TAG}`);
  if (!APPLY) return { ...article, tags: updatedTags };
  const updated = await rest(`/blogs/${BLOG_ID}/articles/${ARTICLE_ID}.json`, {
    method: "PUT",
    body: JSON.stringify({ article: { id: article.id, tags: updatedTags } }),
  });
  return updated.article;
}

async function ensureProofPage() {
  const existing = await rest(`/pages.json?handle=${encodeURIComponent(PROOF_PAGE_HANDLE)}`);
  const page = (existing.pages || [])[0];
  const payload = {
    title: PROOF_PAGE_TITLE,
    handle: PROOF_PAGE_HANDLE,
    body_html:
      "<p>Real temple and deity alankaram proof stories from Golden Collections, shared with permission.</p>",
    template_suffix: "temple-alankaram-proof",
    published: true,
    metafields: [
      {
        namespace: "global",
        key: "title_tag",
        type: "single_line_text_field",
        value: "Temple Alankaram Proof Stories | Golden Collections",
      },
      {
        namespace: "global",
        key: "description_tag",
        type: "single_line_text_field",
        value:
          "Real deity jewellery and temple alankaram proof stories from Golden Collections, shared with permission and focused on fit, measurement and final alankaram.",
      },
    ],
  };

  if (page) {
    console.log(`[${APPLY ? "UPDATE" : "DRY UPDATE"}] page ${PROOF_PAGE_URL}`);
    if (!APPLY) return page;
    const updated = await rest(`/pages/${page.id}.json`, {
      method: "PUT",
      body: JSON.stringify({ page: { id: page.id, ...payload } }),
    });
    return updated.page;
  }

  console.log(`[${APPLY ? "CREATE" : "DRY CREATE"}] page ${PROOF_PAGE_URL}`);
  if (!APPLY) return { handle: PROOF_PAGE_HANDLE, admin_graphql_api_id: "dry-run-page-id" };
  const created = await rest("/pages.json", {
    method: "POST",
    body: JSON.stringify({ page: payload }),
  });
  return created.page;
}

function menuItemInput(item) {
  const input = {
    title: item.title,
    type: item.type,
  };
  if (item.id) input.id = item.id;
  if (item.resourceId) input.resourceId = item.resourceId;
  if (item.url) input.url = item.url;
  if (item.items?.length) input.items = item.items.map(menuItemInput);
  return input;
}

async function ensureMainMenuProofLink(pageResourceId) {
  const data = await gql(
    `query($id: ID!) {
      menu(id: $id) {
        id
        handle
        title
        items {
          id
          title
          type
          url
          resourceId
          items {
            id
            title
            type
            url
            resourceId
            items {
              id
              title
              type
              url
              resourceId
            }
          }
        }
      }
    }`,
    { id: MAIN_MENU_ID }
  );

  const menu = data.menu;
  const items = menu.items.map(menuItemInput);
  const blogs = items.find((item) => item.title === "Blogs");
  if (!blogs) throw new Error("Could not find Blogs menu item");
  blogs.items ||= [];

  const alreadyExists = blogs.items.some(
    (item) => item.url === PROOF_PAGE_URL || item.title.toLowerCase() === "temple alankaram proof"
  );
  if (alreadyExists) {
    console.log("[NOOP] Main menu already has Temple Alankaram Proof");
    return;
  }

  blogs.items.splice(1, 0, {
    title: "Temple Alankaram Proof",
    type: "PAGE",
    resourceId: pageResourceId,
    url: PROOF_PAGE_URL,
  });

  console.log(`[${APPLY ? "UPDATE" : "DRY UPDATE"}] main menu: add Blogs > Temple Alankaram Proof`);
  if (!APPLY) return;

  const updated = await gql(
    `mutation($id: ID!, $title: String!, $handle: String, $items: [MenuItemUpdateInput!]!) {
      menuUpdate(id: $id, title: $title, handle: $handle, items: $items) {
        menu { id handle title }
        userErrors { field message }
      }
    }`,
    { id: menu.id, title: menu.title, handle: menu.handle, items }
  );
  const errors = updated.menuUpdate.userErrors || [];
  if (errors.length) throw new Error(`menuUpdate userErrors: ${JSON.stringify(errors)}`);
}

async function main() {
  console.log(APPLY ? "MODE: APPLY" : "MODE: DRY-RUN");
  const theme = await findMainTheme();
  console.log(`Main theme: ${theme.name} (${theme.id})`);

  for (const asset of uploadAssets) {
    await putAsset(theme.id, asset);
  }

  const article = await ensureArticleTag();
  const page = await ensureProofPage();
  const pageResourceId = page.admin_graphql_api_id || page.resourceId;
  if (!pageResourceId) throw new Error("Proof page is missing admin_graphql_api_id");
  await ensureMainMenuProofLink(pageResourceId);

  console.log(
    JSON.stringify(
      {
        proofPage: `https://www.goldencollections.com${PROOF_PAGE_URL}`,
        homepageSection: "templates/index.json -> gc_proof_stories_hub",
        articleTag: PROOF_TAG,
        articleTags: article.tags,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
