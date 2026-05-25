import fs from "fs";
import path from "path";

const root = process.cwd();
const tokenPath = path.join(root, "tmp", "pinterest-token.json");
const packagePath = path.join(root, "blog-system", "outputs", "repurpose", "2026-05-13-real-kemp-jewellery-guide-repurpose.md");
const outputPath = path.join(root, "tmp", "pinterest-real-kemp-pin-result.json");

if (!fs.existsSync(tokenPath)) {
  throw new Error("Missing tmp/pinterest-token.json. Run pinterest-oauth-callback.mjs and authorize first.");
}

const token = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
const accessToken = token.access_token;
if (!accessToken) throw new Error("Pinterest token file has no access_token");

function section(markdown, heading) {
  const match = markdown.match(new RegExp(`## ${heading}\\s+([\\s\\S]*?)(?=\\n## |$)`, "m"));
  return match ? match[1].trim() : "";
}

async function pinterest(pathname, options = {}) {
  const res = await fetch(`https://api.pinterest.com/v5${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
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
  if (!res.ok) {
    throw new Error(`Pinterest API ${options.method || "GET"} ${pathname} HTTP ${res.status}: ${text}`);
  }
  return json;
}

async function listBoards() {
  const boards = [];
  let bookmark = null;
  do {
    const params = new URLSearchParams({ page_size: "100" });
    if (bookmark) params.set("bookmark", bookmark);
    const data = await pinterest(`/boards?${params}`);
    boards.push(...(data.items || []));
    bookmark = data.bookmark || null;
  } while (bookmark);
  return boards;
}

const markdown = fs.readFileSync(packagePath, "utf8");
const pinSection = section(markdown, "Pinterest Pin Description");
const description = pinSection.replace(/\n\nLink:\s*https?:\/\/\S+\s*$/i, "").trim();
const link = "https://www.goldencollections.com/blogs/jewellery-guides/real-kemp-jewellery-guide";
const imageUrl = "https://cdn.shopify.com/s/files/1/0764/9224/3242/articles/gc-real-kemp-arangetram-set-bks001-2026.jpg?v=1778696580";
const title = "Real Kemp Jewellery Guide";

const boards = await listBoards();
if (!boards.length) {
  throw new Error("No Pinterest boards returned for this account.");
}

const preferredNames = [
  "Real Kemp Jewellery",
  "Kemp Jewellery",
  "Temple Jewellery",
  "Bharatanatyam Jewellery",
  "Golden Collections Jewellery Guides",
  "Jewellery Guides",
];
const board =
  boards.find((item) => preferredNames.some((name) => item.name?.toLowerCase() === name.toLowerCase())) ||
  boards.find((item) => preferredNames.some((name) => item.name?.toLowerCase().includes(name.toLowerCase()))) ||
  boards[0];

const payload = {
  board_id: board.id,
  title,
  description,
  link,
  media_source: {
    source_type: "image_url",
    url: imageUrl,
  },
};

const pin = await pinterest("/pins", {
  method: "POST",
  body: JSON.stringify(payload),
});

const result = {
  created_at: new Date().toISOString(),
  board: { id: board.id, name: board.name, url: board.url || null },
  payload,
  pin,
};
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

console.log(JSON.stringify({
  board: result.board,
  pinId: pin.id,
  pinUrl: pin.link || pin.url || null,
  outputPath,
}, null, 2));
