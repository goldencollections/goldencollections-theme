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
const ARTICLE_ID = "616381415722";
const HANDLE = "hanuman-jayanti-alankaram-sri-vijaya-vinayaka-swamy-temple-malkajgiri-2026";
const ARTICLE_URL = `https://www.goldencollections.com/blogs/jewellery-guides/${HANDLE}`;
const sourceDir = path.join(root, "Blog Images", "Hanuman Jayanti", "more images");
const packagePath = path.join(
  root,
  "blog-system",
  "outputs",
  "shopify-ready",
  "2026-05-16-hanuman-jayanti-alankaram-sri-vijaya-vinayaka-swamy-temple-shopify-package.md"
);
const roadmapPath = path.join(root, "knowledge-base", "wiki", "content-roadmap.md");
const backupDir = path.join(root, "tmp", "hanuman-new-images-2026-05-16");

const images = [
  {
    role: "Final floral Hanuman Jayanti alankaram",
    source: "WhatsApp Image 2026-05-16 at 12.02.22 PM (2).jpeg",
    filename: "hanuman-jayanti-2026-floral-alankaram-sri-vijaya-vinayaka-swamy-temple-malkajgiri.jpg",
    alt: "Hanuman Jayanti 2026 floral alankaram at Sri Vijaya Vinayaka Swamy Temple Malkajgiri with deity jewellery",
    caption:
      "Final Hanuman Jayanti 2026 floral alankaram at Sri Vijaya Vinayaka Swamy Temple, Malkajgiri, shared with permission.",
    replaceAlt:
      "Hanuman Jayanti alankaram at Sri Vijaya Vinayaka Swamy Temple Malkajgiri with Golden Collections deity jewellery",
  },
  {
    role: "Full deity jewellery fit view before floral decoration",
    source: "WhatsApp Image 2026-05-16 at 12.03.29 PM.jpeg",
    filename: "hanuman-jayanti-2026-deity-jewellery-fit-view-sri-vijaya-vinayaka-swamy-temple-malkajgiri.jpg",
    alt: "Full Hanuman deity jewellery fit view before floral decoration at Sri Vijaya Vinayaka Swamy Temple Malkajgiri",
    caption:
      "Full deity jewellery view before the flower decoration, useful for seeing crown height, kavacham scale, gada placement and arch clearance.",
    insertBefore: "<figure class=\"gc-temple-figure\"><img src=\"https://cdn.shopify.com/s/files/1/0764/9224/3242/files/WhatsApp_Image_2026-05-16_at_12.03.36_PM_1.jpg",
  },
  {
    role: "Close-up crown gada and body ornaments",
    source: "WhatsApp Image 2026-05-16 at 12.03.29 PM (2).jpeg",
    filename: "hanuman-jayanti-2026-crown-gada-body-ornaments-sri-vijaya-vinayaka-swamy-temple-malkajgiri.jpg",
    alt: "Close view of Hanuman crown gada and body ornaments during Hanuman Jayanti 2026 alankaram in Malkajgiri",
    caption:
      "Closer view showing crown height, face visibility, body ornamentation and gada placement in the Hanuman alankaram.",
    replaceAlt: "Close-up of Hanuman crown and deity jewellery used for Hanuman Jayanti alankaram",
  },
];

if (!SHOP || !TOKEN) {
  throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_TOKEN in env");
}

function ensureBackupDir() {
  fs.mkdirSync(backupDir, { recursive: true });
}

async function gql(query, variables = {}) {
  const response = await fetch(`https://${SHOP}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`GraphQL HTTP ${response.status}: ${text}`);
  const json = JSON.parse(text);
  if (json.errors) throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  return json.data;
}

async function rest(pathname, options = {}) {
  const response = await fetch(`https://${SHOP}/admin/api/${API_VERSION}${pathname}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN,
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(`REST ${options.method || "GET"} ${pathname} HTTP ${response.status}: ${text}`);
  }
  return json;
}

function mimeType(filename) {
  return filename.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
}

async function uploadImage(spec) {
  const fullPath = path.join(sourceDir, spec.source);
  const stats = fs.statSync(fullPath);
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
          filename: spec.filename,
          mimeType: mimeType(spec.filename),
          fileSize: String(stats.size),
          httpMethod: "POST",
        },
      ],
    }
  );
  const stagedErrors = staged.stagedUploadsCreate.userErrors || [];
  if (stagedErrors.length) throw new Error(`stagedUploadsCreate ${spec.filename}: ${JSON.stringify(stagedErrors)}`);

  const target = staged.stagedUploadsCreate.stagedTargets[0];
  const form = new FormData();
  for (const parameter of target.parameters) form.append(parameter.name, parameter.value);
  form.append("file", new Blob([fs.readFileSync(fullPath)], { type: mimeType(spec.filename) }), spec.filename);

  const upload = await fetch(target.url, { method: "POST", body: form });
  const uploadText = await upload.text();
  if (!upload.ok) throw new Error(`Upload failed ${spec.filename} ${upload.status}: ${uploadText}`);

  const created = await gql(
    `mutation($files:[FileCreateInput!]!){
      fileCreate(files:$files){
        files{
          id
          alt
          fileStatus
          ... on MediaImage { image{ url } preview{ image{ url } } }
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
  if (fileErrors.length) throw new Error(`fileCreate ${spec.filename}: ${JSON.stringify(fileErrors)}`);

  const file = created.fileCreate.files[0];
  let url = file.image?.url || file.preview?.image?.url || null;
  for (let attempt = 0; attempt < 12 && !url; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const data = await gql(
      `query($id:ID!){
        node(id:$id){
          ... on MediaImage { fileStatus image{ url } preview{ image{ url } } }
        }
      }`,
      { id: file.id }
    );
    url = data.node?.image?.url || data.node?.preview?.image?.url || null;
  }
  if (!url) throw new Error(`No URL returned for ${spec.filename}`);
  return { ...spec, id: file.id, url };
}

function figure(upload) {
  return [
    `<figure class="gc-temple-figure"><img src="${upload.url}" alt="${upload.alt}" loading="lazy">`,
    `<figcaption>${upload.caption}</figcaption>`,
    `</figure>`,
  ].join("\n");
}

function replaceFigureByAlt(body, oldAlt, upload) {
  const pattern = new RegExp(
    `<figure class="gc-temple-figure"><img src="[^"]+" alt="${oldAlt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}" loading="lazy">\\s*<figcaption>[\\s\\S]*?<\\/figcaption>\\s*<\\/figure>`
  );
  if (!pattern.test(body)) throw new Error(`Could not find figure with alt: ${oldAlt}`);
  return body.replace(pattern, figure(upload));
}

function insertBeforeMarker(body, marker, upload) {
  if (body.includes(upload.alt)) return body;
  const index = body.indexOf(marker);
  if (index === -1) throw new Error(`Could not find insertion marker for ${upload.filename}`);
  return `${body.slice(0, index)}${figure(upload)}\n${body.slice(index)}`;
}

function updateSchemaImages(body, uploads) {
  const match = body.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!match) return body;
  try {
    const data = JSON.parse(match[1]);
    const graph = Array.isArray(data["@graph"]) ? data["@graph"] : [];
    const article = graph.find((node) => node["@type"] === "BlogPosting");
    if (article) {
      const existing = Array.isArray(article.image) ? article.image : article.image ? [article.image] : [];
      article.image = [...new Set([...existing, ...uploads.map((upload) => upload.url)])];
      article.dateModified = "2026-05-16";
    }
    const next = `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
    return body.replace(match[0], next);
  } catch {
    return body;
  }
}

function appendPackageNote(uploads) {
  if (!fs.existsSync(packagePath)) return;
  let markdown = fs.readFileSync(packagePath, "utf8");
  const marker = "## Additional Media Update - 2026-05-16";
  const block = [
    marker,
    "",
    "Additional temple-permission images were added to the live Hanuman Jayanti article using SEO-safe Shopify filenames and descriptive alt text.",
    "",
    "| Role | SEO filename | Source file | Alt text | Shopify URL |",
    "| --- | --- | --- | --- | --- |",
    ...uploads.map(
      (upload) =>
        `| ${upload.role} | \`${upload.filename}\` | \`${upload.source}\` | ${upload.alt} | \`${upload.url}\` |`
    ),
    "",
    "- Placement: replaced the top result image with the floral final alankaram, added one full-body fit view before the crown-fit section, and replaced the earlier close-up with the stronger crown/kavacham detail image.",
    "- Guardrail retained: no endorsement, official supplier, temple-approved, certified, or priest-approved language was added.",
    "",
  ].join("\n");
  if (markdown.includes(marker)) {
    markdown = markdown.replace(new RegExp(`${marker}[\\s\\S]*?(?=\\n## |$)`), block.trimEnd());
  } else {
    markdown = `${markdown.trimEnd()}\n\n${block}`;
  }
  fs.writeFileSync(packagePath, markdown);
}

function appendRoadmapNote() {
  if (!fs.existsSync(roadmapPath)) return;
  let markdown = fs.readFileSync(roadmapPath, "utf8");
  const note =
    "- 2026-05-16: Additional temple-permission photos were added to the Hanuman Jayanti case study with SEO-safe filenames and descriptive alt text; the page now includes a stronger floral final alankaram image, a full-body jewellery fit view, and a crown/kavacham detail image.";
  if (!markdown.includes(note)) {
    markdown = markdown.replace(
      "- Post-publish technical fixes completed: article video has poster image, article SEO title includes Malkajgiri/Secunderabad, article outputs `VideoObject` schema, and proof hub Open Graph image uses the Hanuman alankaram photo instead of the logo.",
      `- Post-publish technical fixes completed: article video has poster image, article SEO title includes Malkajgiri/Secunderabad, article outputs \`VideoObject\` schema, and proof hub Open Graph image uses the Hanuman alankaram photo instead of the logo.\n${note}`
    );
    fs.writeFileSync(roadmapPath, markdown);
  }
}

if (!APPLY) {
  console.log(JSON.stringify({ mode: "dry-run", articleId: ARTICLE_ID, articleUrl: ARTICLE_URL, images }, null, 2));
  process.exit(0);
}

ensureBackupDir();
const articleResponse = await rest(`/blogs/${BLOG_ID}/articles/${ARTICLE_ID}.json`);
const article = articleResponse.article;
if (article.handle !== HANDLE) throw new Error(`Unexpected article handle: ${article.handle}`);

fs.writeFileSync(path.join(backupDir, "before-body.html"), article.body_html);

const uploads = [];
for (const spec of images) uploads.push(await uploadImage(spec));

let body = article.body_html;
body = replaceFigureByAlt(body, images[0].replaceAlt, uploads[0]);
body = insertBeforeMarker(body, images[1].insertBefore, uploads[1]);
body = replaceFigureByAlt(body, images[2].replaceAlt, uploads[2]);
body = updateSchemaImages(body, uploads);

const updated = await rest(`/blogs/${BLOG_ID}/articles/${ARTICLE_ID}.json`, {
  method: "PUT",
  body: JSON.stringify({
    article: {
      id: ARTICLE_ID,
      body_html: body,
    },
  }),
});

fs.writeFileSync(path.join(backupDir, "after-body.html"), updated.article.body_html);
fs.writeFileSync(path.join(backupDir, "uploaded-images.json"), JSON.stringify(uploads, null, 2));
appendPackageNote(uploads);
appendRoadmapNote();

console.log(
  JSON.stringify(
    {
      articleId: ARTICLE_ID,
      articleUrl: ARTICLE_URL,
      publishedAt: updated.article.published_at,
      bodySha256: crypto.createHash("sha256").update(updated.article.body_html).digest("hex"),
      backupDir,
      uploaded: uploads.map(({ role, filename, alt, url }) => ({ role, filename, alt, url })),
    },
    null,
    2
  )
);
