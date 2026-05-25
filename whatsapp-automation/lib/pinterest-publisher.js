import fs from "node:fs";
import path from "node:path";

const TOKEN_FILE = "pinterest-token.json";

export async function publishPinterestVariant({ variant, packageRow, boardId = "", boardName = "" }) {
  if (variant.asset_type && variant.asset_type !== "image") {
    throw new Error("Pinterest board publishing currently supports image Pins. Video Pins need the Pinterest media upload flow.");
  }
  if (!variant.asset_url || !/^https?:\/\//i.test(variant.asset_url)) {
    throw new Error("Pinterest image Pins require a public image URL in asset_url.");
  }

  const board = await resolvePinterestBoard({
    boardId: boardId || variant.metadata?.pinterest_board_id || "",
    boardName: boardName || variant.metadata?.pinterest_board_name || "",
  });
  const payload = {
    board_id: board.id,
    title: truncate(variant.metadata?.pinterest_title || packageRow.title || "Golden Collections", 100),
    description: truncate(variant.caption || "", 500),
    link: variant.destination_url || packageRow.destination_url || "https://www.goldencollections.com/",
    media_source: {
      source_type: "image_url",
      url: variant.asset_url,
      is_standard: true,
    },
  };

  const pin = await pinterestApi("/pins", { method: "POST", body: JSON.stringify(payload) });
  const pinUrl = pin.link || pin.url || (pin.id ? `https://www.pinterest.com/pin/${pin.id}/` : null);
  return {
    id: pin.id || null,
    url: pinUrl,
    board: { id: board.id, name: board.name, url: board.url || null },
    payload,
    response: pin,
  };
}

async function resolvePinterestBoard({ boardId, boardName }) {
  const boards = await listPinterestBoards();
  if (!boards.length) throw new Error("No Pinterest boards returned for this account.");
  if (boardId) {
    const board = boards.find((item) => item.id === boardId);
    if (board) return board;
    throw new Error(`Pinterest board_id was not found for this account: ${boardId}`);
  }
  if (boardName) {
    const wanted = normalize(boardName);
    const board = boards.find((item) => normalize(item.name) === wanted) || boards.find((item) => normalize(item.name).includes(wanted));
    if (board) return board;
    throw new Error(`Pinterest board name was not found for this account: ${boardName}`);
  }

  const preferredNames = [
    "Real Kemp Jewellery",
    "Kemp Jewellery",
    "Temple Jewellery",
    "Bharatanatyam Dance Jewellery",
    "Bharatanatyam Jewellery Set",
    "Golden Collections Jewellery Guides",
    "Jewellery Guides",
  ];
  return boards.find((item) => preferredNames.some((name) => normalize(item.name) === normalize(name)))
    || boards.find((item) => preferredNames.some((name) => normalize(item.name).includes(normalize(name))))
    || boards[0];
}

async function listPinterestBoards() {
  const boards = [];
  let bookmark = null;
  do {
    const params = new URLSearchParams({ page_size: "100" });
    if (bookmark) params.set("bookmark", bookmark);
    const data = await pinterestApi(`/boards?${params}`);
    boards.push(...(data.items || []));
    bookmark = data.bookmark || null;
  } while (bookmark);
  return boards;
}

async function pinterestApi(pathname, options = {}) {
  const accessToken = getAccessToken();
  const res = await fetch(`https://api.pinterest.com/v5${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  const json = parseJsonOrText(text);
  if (!res.ok) {
    throw new Error(`Pinterest API ${options.method || "GET"} ${pathname} HTTP ${res.status}: ${text}`);
  }
  return json;
}

function getAccessToken() {
  const tokenFile = findTokenFile();
  const token = JSON.parse(fs.readFileSync(tokenFile, "utf8"));
  if (!token.access_token) throw new Error("Pinterest token file has no access_token.");
  if (token.expires_at && Date.parse(token.expires_at) <= Date.now()) {
    throw new Error("Pinterest token is expired. Rerun Pinterest OAuth.");
  }
  return token.access_token;
}

function findTokenFile() {
  const candidates = [
    path.join(process.cwd(), "tmp", TOKEN_FILE),
    path.join(process.cwd(), "..", "tmp", TOKEN_FILE),
  ];
  const file = candidates.find((candidate) => fs.existsSync(candidate));
  if (!file) throw new Error(`Missing ${TOKEN_FILE}. Run Pinterest OAuth first.`);
  return file;
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function parseJsonOrText(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function truncate(value, length) {
  const text = String(value || "");
  return text.length > length ? text.slice(0, length - 1).trimEnd() : text;
}
