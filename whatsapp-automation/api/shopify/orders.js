import { sendJson, readRawBody } from "../../lib/http.js";
import { normalizePhone } from "../../lib/phone.js";
import { verifyShopifyWebhook } from "../../lib/signatures.js";
import { supabase } from "../../lib/supabase.js";
import { getConfig } from "../../lib/config.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });

  const rawBody = await readRawBody(req);
  if (!verifyShopifyWebhook(rawBody, req.headers["x-shopify-hmac-sha256"])) {
    return sendJson(res, 401, { error: "Invalid Shopify signature" });
  }

  const order = JSON.parse(rawBody.toString("utf8"));
  const phone = normalizePhone(order.phone || order.shipping_address?.phone || order.billing_address?.phone);
  const checkoutToken = order.checkout_token || null;
  const orderId = order.id ? String(order.id) : null;
  const config = getConfig();
  const now = new Date().toISOString();
  const tags = normalizeTags(order.tags);
  const orderUpdate = {
    status: "ordered",
    ordered_at: now,
    cancelled_at: now,
    shopify_order_id: orderId,
    order_name: order.name || null
  };

  if (checkoutToken) {
    await supabase()
      .from("checkout_automations")
      .update(orderUpdate)
      .eq("checkout_token", checkoutToken)
      .in("status", ["pending", "dry_run", "sent", "error"]);
  }

  if (phone) {
    await supabase()
      .from("checkout_automations")
      .update(orderUpdate)
      .eq("phone", phone)
      .in("status", ["pending", "dry_run", "sent", "error"]);
  }

  if (orderId && phone) {
    try {
      await upsertReviewRequest({ order, orderId, phone, config, tags, now });
    } catch (error) {
      return sendJson(res, 500, { error: error.message });
    }
  }

  return sendJson(res, 200, { ok: true });
}

async function upsertReviewRequest({ order, orderId, phone, config, tags, now }) {
  const customerName = order.customer?.first_name || order.shipping_address?.first_name || null;
  const existing = await supabase()
    .from("review_requests")
    .select("id,status")
    .eq("shopify_order_id", orderId)
    .maybeSingle();

  if (existing.error) throw existing.error;

  if (existing.data) {
    const { error } = await supabase()
      .from("review_requests")
      .update({
        order_name: order.name || null,
        phone,
        customer_name: customerName,
        review_url: config.googleReviewUrl,
        template_name: config.reviewRequestTemplateName
      })
      .eq("id", existing.data.id);
    if (error) throw error;
  } else {
    const { error } = await supabase()
      .from("review_requests")
      .insert({
        shopify_order_id: orderId,
        order_name: order.name || null,
        phone,
        customer_name: customerName,
        review_url: config.googleReviewUrl,
        template_name: config.reviewRequestTemplateName,
        status: "awaiting_delivery",
        source: "shopify_order"
      });
    if (error) throw error;
  }

  if (tags.has("no-review-request")) {
    const { error } = await supabase()
      .from("review_requests")
      .update({
        status: "cancelled",
        cancelled_at: now,
        last_error: "Manual no-review-request Shopify tag"
      })
      .eq("shopify_order_id", orderId)
      .in("status", ["awaiting_delivery", "pending", "error"]);
    if (error) throw error;
    return;
  }

  if (tags.has("review-ready")) {
    const dueAt = new Date(new Date(now).getTime() + config.reviewRequestDelayHours * 60 * 60 * 1000).toISOString();
    const { error } = await supabase()
      .from("review_requests")
      .update({
        delivered_at: now,
        due_at: dueAt,
        status: "pending",
        last_error: null
      })
      .eq("shopify_order_id", orderId)
      .in("status", ["awaiting_delivery", "error"]);
    if (error) throw error;
  }
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) return new Set(tags.map(normalizeTag).filter(Boolean));
  return new Set(String(tags || "").split(",").map(normalizeTag).filter(Boolean));
}

function normalizeTag(tag) {
  return String(tag || "").trim().toLowerCase();
}
