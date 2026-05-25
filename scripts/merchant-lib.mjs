import fs from "fs";
import path from "path";

export const root = process.cwd();
export const tokenPath = path.join(root, "tmp", "merchant-token.json");

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

export function requireMerchantEnv() {
  const env = readEnv();
  const clientId = env.MERCHANT_CENTER_CLIENT_ID || env.GOOGLE_GBP_CLIENT_ID;
  const clientSecret = env.MERCHANT_CENTER_CLIENT_SECRET || env.GOOGLE_GBP_CLIENT_SECRET;
  const redirectUri = env.MERCHANT_CENTER_REDIRECT_URI || env.GOOGLE_GBP_REDIRECT_URI || "http://localhost:3001/google/callback";

  if (!clientId || !clientSecret) {
    throw new Error("Missing MERCHANT_CENTER_CLIENT_ID/MERCHANT_CENTER_CLIENT_SECRET or reusable GOOGLE_GBP_CLIENT_ID/GOOGLE_GBP_CLIENT_SECRET in env");
  }

  return { env, clientId, clientSecret, redirectUri };
}

export function getMerchantAccountId() {
  const env = readEnv();
  return env.MERCHANT_CENTER_ACCOUNT_ID || null;
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
  const { clientId, clientSecret } = requireMerchantEnv();
  if (!fs.existsSync(tokenPath)) {
    throw new Error("Missing tmp/merchant-token.json. Run merchant-oauth-callback.mjs and authorize first.");
  }

  const token = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
  const now = Math.floor(Date.now() / 1000);
  if (token.access_token && token.expires_at && token.expires_at > now) {
    return token.access_token;
  }

  if (!token.refresh_token) {
    throw new Error("Merchant token expired and no refresh_token was saved. Rerun OAuth with prompt=consent.");
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
    throw new Error(`Merchant token refresh failed HTTP ${res.status}: ${text}`);
  }

  const refreshed = JSON.parse(text);
  saveToken({ ...token, ...refreshed, refresh_token: token.refresh_token });
  return refreshed.access_token;
}

export async function merchantApi(url, options = {}) {
  const accessToken = await getAccessToken();
  const res = await fetch(url, {
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
    throw new Error(`Merchant API ${options.method || "GET"} ${url} HTTP ${res.status}: ${text}`);
  }

  return json;
}

export async function listAll(url, arrayKey) {
  const items = [];
  let pageToken = null;
  do {
    const current = new URL(url);
    if (pageToken) current.searchParams.set("pageToken", pageToken);
    const data = await merchantApi(current.toString());
    items.push(...(data[arrayKey] || []));
    pageToken = data.nextPageToken || null;
  } while (pageToken);
  return items;
}
