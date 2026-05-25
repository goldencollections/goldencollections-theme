import { extractShipmentFromFulfillment } from "../../lib/india-post.js";
import { sendJson, readRawBody } from "../../lib/http.js";
import { normalizePhone } from "../../lib/phone.js";
import { verifyShopifyWebhook } from "../../lib/signatures.js";
import { supabase } from "../../lib/supabase.js";
import { getConfig } from "../../lib/config.js";
import { markReviewRequestDelivered, scheduleReviewRequestAfterFulfillment } from "../../lib/review-requests.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });

  const rawBody = await readRawBody(req);
  if (!verifyShopifyWebhook(rawBody, req.headers["x-shopify-hmac-sha256"])) {
    return sendJson(res, 401, { error: "Invalid Shopify signature" });
  }

  const payload = JSON.parse(rawBody.toString("utf8"));
  const shipment = extractShipmentFromFulfillment(payload);
  if (!shipment.tracking_number) {
    return sendJson(res, 200, { ok: true, skipped: "missing_tracking_number" });
  }

  const orderId = payload.order_id ? String(payload.order_id) : null;
  const status = normalizeShipmentStatus(payload.shipment_status || payload.status);
  const now = new Date().toISOString();
  const phone = normalizePhone(payload.destination?.phone || payload.receipt?.phone);
  const config = getConfig();
  const isInternational = isInternationalDestination(payload.destination);
  const reviewRequest = status === "delivered"
    ? await markReviewRequestDelivered({
      orderId,
      phone,
      customerName: payload.destination?.first_name || payload.destination?.name || null,
      config,
      now
    })
    : await scheduleReviewRequestAfterFulfillment({
      orderId,
      phone,
      customerName: payload.destination?.first_name || payload.destination?.name || null,
      config,
      now,
      isInternational
    });

  const record = {
    shopify_order_id: orderId,
    shopify_fulfillment_id: payload.id ? String(payload.id) : null,
    tracking_number: shipment.tracking_number,
    carrier: shipment.carrier,
    tracking_url: shipment.tracking_url,
    shopify_tracking_url: shipment.shopify_tracking_url,
    status,
    status_updated_at: now,
    delivered_at: status === "delivered" ? now : null,
    raw_payload: payload,
  };

  const { error } = await supabase()
    .from("shipment_events")
    .upsert(record, { onConflict: "tracking_number" });

  if (error) return sendJson(res, 500, { error: error.message });

  if (orderId || phone) {
    const query = supabase()
      .from("checkout_automations")
      .update({
        shipment_tracking_number: shipment.tracking_number,
        shipment_carrier: shipment.carrier,
        shipment_tracking_url: shipment.tracking_url,
        shipment_status: status,
        shipped_at: now,
        delivered_at: status === "delivered" ? now : null,
      });

    if (orderId) {
      await query.eq("shopify_order_id", orderId);
    } else if (phone) {
      await query.eq("phone", phone);
    }
  }

  return sendJson(res, 200, {
    ok: true,
    tracking_number: shipment.tracking_number,
    carrier: shipment.carrier,
    tracking_url: shipment.tracking_url,
    status,
    review_timing: isInternational ? "international_10_days_after_fulfillment" : "domestic_7_days_after_fulfillment",
    review_request: reviewRequest,
  });
}

function normalizeShipmentStatus(value) {
  const status = String(value || "fulfilled").toLowerCase().replace(/\s+/g, "_");
  if (status.includes("deliver")) return "delivered";
  if (status.includes("out_for_delivery")) return "out_for_delivery";
  if (status.includes("failure") || status.includes("failed")) return "delivery_issue";
  if (status.includes("transit")) return "in_transit";
  return status || "fulfilled";
}

function isInternationalDestination(destination = {}) {
  const countryCode = String(destination.country_code || destination.countryCode || destination.country || "").trim().toUpperCase();
  if (!countryCode) return false;
  return countryCode !== "IN" && countryCode !== "INDIA";
}
