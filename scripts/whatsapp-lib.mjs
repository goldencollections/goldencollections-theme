import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const root = process.cwd();

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

export function requireWhatsappEnv() {
  const env = readEnv();
  const accessToken = env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID;
  const businessAccountId = env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  const verifyToken = env.WHATSAPP_VERIFY_TOKEN;
  const appSecret = env.WHATSAPP_APP_SECRET;
  const graphApiVersion = env.WHATSAPP_GRAPH_API_VERSION || "v23.0";

  const missing = [];
  if (!accessToken) missing.push("WHATSAPP_ACCESS_TOKEN");
  if (!phoneNumberId) missing.push("WHATSAPP_PHONE_NUMBER_ID");
  if (!businessAccountId) missing.push("WHATSAPP_BUSINESS_ACCOUNT_ID");
  if (!verifyToken) missing.push("WHATSAPP_VERIFY_TOKEN");
  if (!appSecret) missing.push("WHATSAPP_APP_SECRET");

  if (missing.length) {
    throw new Error(`Missing WhatsApp env keys: ${missing.join(", ")}`);
  }

  return { env, accessToken, phoneNumberId, businessAccountId, verifyToken, appSecret, graphApiVersion };
}

export async function whatsappApi(pathname, options = {}) {
  const { accessToken, graphApiVersion } = requireWhatsappEnv();
  const cleanPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const res = await fetch(`https://graph.facebook.com/${graphApiVersion}${cleanPath}`, {
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
    throw new Error(`WhatsApp Graph API ${options.method || "GET"} ${cleanPath} HTTP ${res.status}: ${text}`);
  }

  return json;
}

export function verifyMetaSignature(rawBody, signatureHeader) {
  const { appSecret } = requireWhatsappEnv();
  if (!signatureHeader) return false;
  const expected = `sha256=${crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
  if (expected.length !== signatureHeader.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
}
