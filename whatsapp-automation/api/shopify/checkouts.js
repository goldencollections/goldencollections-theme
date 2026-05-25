import { classifyCart, cartSummary } from "../../lib/classify-cart.js";
import { getConfig } from "../../lib/config.js";
import { sendJson, readRawBody } from "../../lib/http.js";
import { normalizePhone } from "../../lib/phone.js";
import { verifyShopifyWebhook } from "../../lib/signatures.js";
import { supabase } from "../../lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });

  const rawBody = await readRawBody(req);
  if (!verifyShopifyWebhook(rawBody, req.headers["x-shopify-hmac-sha256"])) {
    return sendJson(res, 401, { error: "Invalid Shopify signature" });
  }

  const checkout = JSON.parse(rawBody.toString("utf8"));
  const phone = normalizePhone(checkout.phone || checkout.shipping_address?.phone || checkout.billing_address?.phone);
  if (!phone) return sendJson(res, 200, { ok: true, skipped: "missing_phone" });

  const config = getConfig();
  const classification = classifyCart(checkout);
  const now = new Date();
  const dueAt = new Date(now.getTime() + config.abandonedCheckoutDelayMinutes * 60 * 1000);
  const record = {
    shopify_checkout_id: checkout.id ? String(checkout.id) : checkout.token || checkout.cart_token,
    checkout_token: checkout.token || checkout.cart_token || null,
    phone,
    email: checkout.email || null,
    customer_name: checkout.customer?.first_name || checkout.shipping_address?.first_name || null,
    checkout_url: checkout.abandoned_checkout_url || checkout.web_url || checkout.checkout_url || null,
    cart: {
      summary: cartSummary(checkout),
      total_price: checkout.total_price,
      currency: checkout.currency,
      line_items: checkout.line_items || [],
      classification_reason: classification.reason
    },
    cart_classification: classification.cart_classification,
    template_name: classification.template_name,
    status: "pending",
    abandon_detected_at: now.toISOString(),
    due_at: dueAt.toISOString()
  };

  const { error } = await supabase()
    .from("checkout_automations")
    .upsert(record, { onConflict: "shopify_checkout_id" });

  if (error) return sendJson(res, 500, { error: error.message });
  return sendJson(res, 200, { ok: true, status: record.status, due_at: record.due_at, template_name: record.template_name });
}
