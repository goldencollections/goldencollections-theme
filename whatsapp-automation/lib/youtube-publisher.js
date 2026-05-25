import fs from "node:fs";
import path from "node:path";

const TOKEN_FILE = "youtube-token.json";

export async function uploadYouTubeVariant({ variant, packageRow, privacyStatus = "private" }) {
  const normalizedPrivacy = normalizePrivacyStatus(privacyStatus);
  if (variant.asset_type && variant.asset_type !== "video") {
    throw new Error(`YouTube publishing expects a video asset. Current asset_type: ${variant.asset_type}.`);
  }

  const asset = await loadVideoAsset(variant.asset_url);
  const matchedChannel = await assertExpectedYouTubeChannel();
  const metadata = buildYouTubeMetadata({ variant, packageRow, privacyStatus: normalizedPrivacy });
  const boundary = `gc_youtube_${Date.now().toString(16)}`;
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Type: ${asset.contentType}\r\n\r\n`),
    asset.buffer,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  const accessToken = await getAccessToken();
  const res = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
      "Content-Length": String(body.length),
    },
    body,
  });

  const text = await res.text();
  const json = parseJsonOrText(text);
  if (!res.ok) {
    throw new Error(`YouTube upload failed HTTP ${res.status}: ${text}`);
  }

  const id = json?.id || null;
  return {
    id,
    url: id ? `https://www.youtube.com/watch?v=${id}` : null,
    privacyStatus: normalizedPrivacy,
    matchedChannel: {
      id: matchedChannel.id,
      title: matchedChannel.snippet?.title,
      customUrl: matchedChannel.snippet?.customUrl,
    },
    metadata,
    response: json,
  };
}

export function normalizePrivacyStatus(value) {
  const privacy = String(value || "private").trim().toLowerCase();
  if (!["private", "unlisted", "public"].includes(privacy)) {
    throw new Error(`Unsupported YouTube privacy status: ${value}`);
  }
  return privacy;
}

function buildYouTubeMetadata({ variant, packageRow, privacyStatus }) {
  const variantMetadata = variant.metadata || {};
  const title = truncate(variantMetadata.youtube_title || packageRow.title || "Golden Collections Video", 100);
  const hashtags = Array.isArray(variant.hashtags) ? variant.hashtags : [];
  const description = [
    variantMetadata.youtube_description || variant.caption || "",
    hashtags.length ? hashtags.join(" ") : "",
    variant.destination_url ? `Link: ${variant.destination_url}` : "",
  ].filter(Boolean).join("\n\n").slice(0, 5000);
  const tags = (variantMetadata.youtube_tags || hashtags.map((tag) => tag.replace(/^#/, "")))
    .map((tag) => String(tag).trim())
    .filter(Boolean)
    .slice(0, 20);

  return {
    snippet: {
      title,
      description,
      tags,
      categoryId: String(variantMetadata.youtube_category_id || process.env.YOUTUBE_UPLOAD_CATEGORY_ID || "26"),
    },
    status: {
      privacyStatus,
      selfDeclaredMadeForKids: variantMetadata.youtube_made_for_kids === true,
    },
  };
}

async function loadVideoAsset(assetUrl) {
  if (!assetUrl) throw new Error("YouTube variant is missing asset_url.");
  if (/^https?:\/\//i.test(assetUrl)) {
    const res = await fetch(assetUrl);
    if (!res.ok) throw new Error(`Could not download YouTube asset HTTP ${res.status}: ${assetUrl}`);
    return {
      buffer: Buffer.from(await res.arrayBuffer()),
      contentType: res.headers.get("content-type") || contentTypeFor(assetUrl),
      source: assetUrl,
    };
  }

  const file = resolveLocalAsset(assetUrl);
  return {
    buffer: fs.readFileSync(file),
    contentType: contentTypeFor(file),
    source: file,
  };
}

function resolveLocalAsset(assetUrl) {
  const candidates = [];
  if (path.isAbsolute(assetUrl)) candidates.push(assetUrl);
  candidates.push(path.resolve(process.cwd(), assetUrl));
  candidates.push(path.resolve(process.cwd(), "..", assetUrl));

  const file = candidates.find((candidate) => fs.existsSync(candidate));
  if (!file) {
    throw new Error(`Video file not found. Tried: ${candidates.join(", ")}`);
  }
  return file;
}

function contentTypeFor(file) {
  let pathname = file;
  try {
    if (/^https?:\/\//i.test(file)) pathname = new URL(file).pathname;
  } catch {
    pathname = file;
  }
  const ext = path.extname(pathname).toLowerCase();
  if (ext === ".mov") return "video/quicktime";
  if (ext === ".webm") return "video/webm";
  return "video/mp4";
}

async function assertExpectedYouTubeChannel() {
  const expected = expectedYouTubeChannel();
  const result = await youtubeApi("https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&mine=true");
  const channels = result.items || [];
  const expectedCustom = normalizeHandle(expected.customUrl);
  const matched = channels.find((channel) => {
    const customMatches = expectedCustom && normalizeHandle(channel.snippet?.customUrl) === expectedCustom;
    const idMatches = expected.id && channel.id === expected.id;
    const titleMatches = expected.title && channel.snippet?.title === expected.title;
    return customMatches || idMatches || titleMatches;
  });

  if (!matched) {
    const connected = channels.map((channel) => ({
      id: channel.id,
      title: channel.snippet?.title,
      customUrl: channel.snippet?.customUrl,
    }));
    throw new Error(
      `Connected YouTube account does not match expected channel ${expected.customUrl || expected.id || expected.title}. ` +
        `Connected channels: ${JSON.stringify(connected)}`,
    );
  }

  return matched;
}

function expectedYouTubeChannel() {
  return {
    id: process.env.YOUTUBE_EXPECTED_CHANNEL_ID || "",
    customUrl: process.env.YOUTUBE_EXPECTED_CUSTOM_URL || "@Goldencollections",
    title: process.env.YOUTUBE_EXPECTED_CHANNEL_TITLE || "",
  };
}

async function youtubeApi(url, options = {}) {
  const accessToken = await getAccessToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  const json = parseJsonOrText(text);
  if (!res.ok) {
    throw new Error(`YouTube API ${options.method || "GET"} ${url} HTTP ${res.status}: ${text}`);
  }
  return json;
}

async function getAccessToken() {
  const { clientId, clientSecret } = requireYouTubeEnv();
  const tokenFile = findTokenFile();
  const token = JSON.parse(fs.readFileSync(tokenFile, "utf8"));
  const now = Math.floor(Date.now() / 1000);
  if (token.access_token && token.expires_at && token.expires_at > now) {
    return token.access_token;
  }

  if (!token.refresh_token) {
    throw new Error("YouTube token expired and no refresh_token was saved. Rerun OAuth with prompt=consent.");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: token.refresh_token,
    grant_type: "refresh_token",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`YouTube token refresh failed HTTP ${res.status}: ${text}`);

  const refreshed = JSON.parse(text);
  saveToken(tokenFile, { ...token, ...refreshed, refresh_token: token.refresh_token });
  return refreshed.access_token;
}

function requireYouTubeEnv() {
  const clientId = process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_GBP_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_GBP_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing YouTube OAuth client configuration.");
  }
  return { clientId, clientSecret };
}

function findTokenFile() {
  const candidates = [
    path.join(process.cwd(), "tmp", TOKEN_FILE),
    path.join(process.cwd(), "..", "tmp", TOKEN_FILE),
  ];
  const file = candidates.find((candidate) => fs.existsSync(candidate));
  if (!file) throw new Error(`Missing ${TOKEN_FILE}. Run YouTube OAuth first.`);
  return file;
}

function saveToken(file, token) {
  const now = Math.floor(Date.now() / 1000);
  fs.writeFileSync(
    file,
    JSON.stringify(
      {
        ...token,
        obtained_at: now,
        expires_at: token.expires_in ? now + token.expires_in - 60 : token.expires_at,
      },
      null,
      2,
    ),
  );
}

function normalizeHandle(value) {
  if (!value) return "";
  const clean = String(value).trim().toLowerCase();
  return clean.startsWith("@") ? clean : `@${clean}`;
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
