import crypto from "node:crypto";
import { getConfig } from "./config.js";

export function verifyShopifyWebhook(rawBody, hmacHeader) {
  if (!hmacHeader) return false;
  const expected = crypto
    .createHmac("sha256", getConfig().shopifyWebhookSecret)
    .update(rawBody)
    .digest("base64");
  return timingSafeEqual(expected, hmacHeader);
}

export function verifyMetaSignature(rawBody, signatureHeader) {
  if (!signatureHeader) return false;
  const expected = `sha256=${crypto
    .createHmac("sha256", getConfig().whatsappAppSecret)
    .update(rawBody)
    .digest("hex")}`;
  return timingSafeEqual(expected, signatureHeader);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
