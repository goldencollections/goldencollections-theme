import fs from "fs";
import path from "path";

export const root = process.cwd();
export const tokenPath = path.join(root, "tmp", "youtube-token.json");

export function readEnv() {
  const envPath = path.join(root, "env");
  if (!fs.existsSync(envPath)) {
    throw new Error("Missing local env file");
  }

  return Object.fromEntries(
    fs.readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}

export function requireYouTubeEnv() {
  const env = readEnv();
  const clientId = env.YOUTUBE_CLIENT_ID || env.GOOGLE_GBP_CLIENT_ID;
  const clientSecret = env.YOUTUBE_CLIENT_SECRET || env.GOOGLE_GBP_CLIENT_SECRET;
  const redirectUri = env.YOUTUBE_REDIRECT_URI || "http://localhost:3002/youtube/callback";

  if (!clientId || !clientSecret) {
    throw new Error("Missing YOUTUBE_CLIENT_ID/YOUTUBE_CLIENT_SECRET or reusable GOOGLE_GBP_CLIENT_ID/GOOGLE_GBP_CLIENT_SECRET in env");
  }

  return { env, clientId, clientSecret, redirectUri };
}

export function saveToken(token) {
  fs.mkdirSync(path.dirname(tokenPath), { recursive: true });
  const now = Math.floor(Date.now() / 1000);
  fs.writeFileSync(
    tokenPath,
    JSON.stringify(
      {
        ...token,
        obtained_at: now,
        expires_at: token.expires_in ? now + token.expires_in - 60 : null,
      },
      null,
      2,
    ),
  );
}

export async function getAccessToken() {
  const { clientId, clientSecret } = requireYouTubeEnv();
  if (!fs.existsSync(tokenPath)) {
    throw new Error("Missing tmp/youtube-token.json. Run youtube-oauth-callback.mjs and authorize first.");
  }

  const token = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
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
  if (!res.ok) {
    throw new Error(`YouTube token refresh failed HTTP ${res.status}: ${text}`);
  }

  const refreshed = JSON.parse(text);
  saveToken({ ...token, ...refreshed, refresh_token: token.refresh_token });
  return refreshed.access_token;
}

export async function youtubeApi(url, options = {}) {
  const accessToken = await getAccessToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
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
    throw new Error(`YouTube API ${options.method || "GET"} ${url} HTTP ${res.status}: ${text}`);
  }

  return json;
}

export function expectedYouTubeChannel(env = readEnv()) {
  return {
    id: env.YOUTUBE_EXPECTED_CHANNEL_ID || "",
    customUrl: env.YOUTUBE_EXPECTED_CUSTOM_URL || "@Goldencollections",
    title: env.YOUTUBE_EXPECTED_CHANNEL_TITLE || "",
  };
}

export async function getMyYouTubeChannels() {
  const url = "https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&mine=true";
  const result = await youtubeApi(url);
  return result.items || [];
}

export async function assertExpectedYouTubeChannel() {
  const expected = expectedYouTubeChannel();
  const channels = await getMyYouTubeChannels();
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

function normalizeHandle(value) {
  if (!value) return "";
  const clean = String(value).trim().toLowerCase();
  return clean.startsWith("@") ? clean : `@${clean}`;
}
