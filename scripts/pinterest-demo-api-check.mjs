import fs from "fs";
import path from "path";

const root = process.cwd();
const mode = process.argv[2] || "production";
const tokenPath = mode === "sandbox"
  ? path.join(root, "tmp", "pinterest-sandbox-token.txt")
  : path.join(root, "tmp", "pinterest-token.json");

if (!fs.existsSync(tokenPath)) {
  throw new Error(`Missing ${path.relative(root, tokenPath)}.`);
}

const tokenText = fs.readFileSync(tokenPath, "utf8").trim();
const token = tokenPath.endsWith(".json") ? JSON.parse(tokenText).access_token : tokenText;
if (!token) throw new Error("Pinterest token file has no access token.");

const baseUrl = mode === "sandbox" ? "https://api-sandbox.pinterest.com/v5" : "https://api.pinterest.com/v5";

async function pinterest(pathname, options = {}) {
  const res = await fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
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
  return { ok: res.ok, status: res.status, json };
}

const boards = await pinterest("/boards?page_size=25");
let boardItems = boards.json?.items || [];
let demoBoard = boardItems[0] || null;

if (mode === "sandbox" && process.argv.includes("--ensure-board") && !demoBoard) {
  const createdBoard = await pinterest("/boards", {
    method: "POST",
    body: JSON.stringify({
      name: "Golden Collections API Demo",
      description: "Sandbox-only board for Pinterest API review demo.",
      privacy: "PUBLIC",
    }),
  });
  if (!createdBoard.ok) {
    throw new Error(`Could not create sandbox board: ${JSON.stringify(createdBoard.json)}`);
  }
  demoBoard = createdBoard.json;
  const refreshedBoards = await pinterest("/boards?page_size=25");
  boardItems = refreshedBoards.json?.items || [demoBoard];
}

let createPin = null;
if (process.argv.includes("--create-pin") && demoBoard) {
  createPin = await pinterest("/pins", {
    method: "POST",
    body: JSON.stringify({
      board_id: demoBoard.id,
      title: "Real Kemp Jewellery Guide",
      description: "Owner-approved Golden Collections guide Pin demo for Pinterest API review.",
      link: "https://www.goldencollections.com/blogs/jewellery-guides/real-kemp-jewellery-guide",
      media_source: {
        source_type: "image_url",
        url: "https://cdn.shopify.com/s/files/1/0764/9224/3242/articles/gc-real-kemp-arangetram-set-bks001-2026.jpg?v=1778696580",
      },
    }),
  });
}

const output = {
  mode,
  baseUrl,
  boards: {
    ok: boards.ok,
    status: boards.status,
    count: boardItems.length,
    sample: boardItems.slice(0, 5).map((board) => ({
      id: board.id,
      name: board.name,
      url: board.url || null,
    })),
    error: boards.ok ? null : boards.json,
  },
  createPin: createPin
    ? {
        ok: createPin.ok,
        status: createPin.status,
        id: createPin.json?.id || null,
        url: createPin.json?.id ? `https://www.pinterest.com/pin/${createPin.json.id}/` : null,
        destinationUrl: createPin.json?.link || null,
        error: createPin.ok ? null : createPin.json,
      }
    : null,
};

console.log(JSON.stringify(output, null, 2));
