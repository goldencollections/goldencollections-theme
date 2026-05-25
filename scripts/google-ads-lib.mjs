import fs from "fs";
import path from "path";

export const root = process.cwd();
export const tokenPath = path.join(root, "tmp", "google-ads-token.json");

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
        return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, "")];
      }),
  );
}

export function requireAdsEnv({ requireDeveloperToken = false } = {}) {
  const env = readEnv();
  const clientId = env.GOOGLE_ADS_CLIENT_ID || env.GOOGLE_GBP_CLIENT_ID;
  const clientSecret = env.GOOGLE_ADS_CLIENT_SECRET || env.GOOGLE_GBP_CLIENT_SECRET;
  const redirectUri = env.GOOGLE_ADS_REDIRECT_URI || env.GOOGLE_GBP_REDIRECT_URI || "http://localhost:3001/google/callback";
  const developerToken = env.GOOGLE_ADS_DEVELOPER_TOKEN || null;
  const customerId = (env.GOOGLE_ADS_CUSTOMER_ID || "").replaceAll("-", "");
  const loginCustomerId = (env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || "").replaceAll("-", "");

  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_ADS_CLIENT_ID/GOOGLE_ADS_CLIENT_SECRET or reusable GOOGLE_GBP_CLIENT_ID/GOOGLE_GBP_CLIENT_SECRET in env");
  }

  if (requireDeveloperToken && !developerToken) {
    throw new Error("Missing GOOGLE_ADS_DEVELOPER_TOKEN in env. Google Ads API calls require a developer token from the Google Ads API Center.");
  }

  return { env, clientId, clientSecret, redirectUri, developerToken, customerId, loginCustomerId };
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
  const { clientId, clientSecret } = requireAdsEnv();
  if (!fs.existsSync(tokenPath)) {
    throw new Error("Missing tmp/google-ads-token.json. Run google-ads-oauth-callback.mjs and authorize first.");
  }

  const token = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
  const now = Math.floor(Date.now() / 1000);
  if (token.access_token && token.expires_at && token.expires_at > now) {
    return token.access_token;
  }

  if (!token.refresh_token) {
    throw new Error("Google Ads token expired and no refresh_token was saved. Rerun OAuth with prompt=consent.");
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
    throw new Error(`Google Ads token refresh failed HTTP ${res.status}: ${text}`);
  }

  const refreshed = JSON.parse(text);
  saveToken({ ...token, ...refreshed, refresh_token: token.refresh_token });
  return refreshed.access_token;
}

export async function googleAdsApi(pathname, options = {}) {
  const { developerToken, loginCustomerId } = requireAdsEnv({ requireDeveloperToken: true });
  const accessToken = await getAccessToken();
  const res = await fetch(`https://googleads.googleapis.com${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "developer-token": developerToken,
      ...(loginCustomerId ? { "login-customer-id": loginCustomerId } : {}),
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
    throw new Error(`Google Ads API ${options.method || "GET"} ${pathname} HTTP ${res.status}: ${text}`);
  }

  return json;
}
