import fs from "node:fs";
import path from "node:path";

export const root = process.cwd();

export function readEnv() {
  const envPath = path.join(root, "env");
  if (!fs.existsSync(envPath)) throw new Error("Missing local env file");

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

export function requireMetaEnv() {
  const env = readEnv();
  const accessToken = env.META_ACCESS_TOKEN || env.WHATSAPP_ACCESS_TOKEN;
  const appId = env.META_APP_ID || "887425463811453";
  const appSecret = env.META_APP_SECRET || env.WHATSAPP_APP_SECRET;
  const graphApiVersion = env.META_GRAPH_API_VERSION || env.WHATSAPP_GRAPH_API_VERSION || "v23.0";
  const businessId = env.META_BUSINESS_ID || "616419604506500";
  const catalogId = env.META_CATALOG_ID || env.GOLDEN_WHATSAPP_CATALOG_ID || "";

  const missing = [];
  if (!accessToken) missing.push("META_ACCESS_TOKEN or WHATSAPP_ACCESS_TOKEN");
  if (!appSecret) missing.push("META_APP_SECRET or WHATSAPP_APP_SECRET");
  if (missing.length) throw new Error(`Missing Meta env keys: ${missing.join(", ")}`);

  return { env, accessToken, appId, appSecret, graphApiVersion, businessId, catalogId };
}

export async function metaApi(pathname, params = {}, options = {}) {
  const { accessToken, graphApiVersion } = requireMetaEnv();
  const cleanPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const url = new URL(`https://graph.facebook.com/${graphApiVersion}${cleanPath}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }

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
    const metaMessage = json?.error?.message || text || res.statusText;
    const code = json?.error?.code ? ` code=${json.error.code}` : "";
    const subcode = json?.error?.error_subcode ? ` subcode=${json.error.error_subcode}` : "";
    throw new Error(`Meta Graph API ${options.method || "GET"} ${cleanPath} HTTP ${res.status}${code}${subcode}: ${redact(metaMessage)}`);
  }

  return json;
}

export async function safeMetaApi(label, pathname, params = {}, options = {}) {
  try {
    return { label, ok: true, data: await metaApi(pathname, params, options) };
  } catch (error) {
    return { label, ok: false, error: redact(error.message) };
  }
}

export function redact(value) {
  return String(value)
    .replace(/EA[A-Za-z0-9_-]{20,}/g, "[REDACTED_TOKEN]")
    .replace(/access_token=[^&\s"]+/g, "access_token=[REDACTED]");
}
