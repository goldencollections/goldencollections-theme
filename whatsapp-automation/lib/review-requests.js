import { sendTemplateMessage } from "./whatsapp.js";
import { supabase } from "./supabase.js";

export async function processDueReviewRequests(config, now = new Date().toISOString()) {
  const { data: dueRows, error } = await supabase()
    .from("review_requests")
    .select("*")
    .eq("status", "pending")
    .lte("due_at", now)
    .limit(25);

  if (error) throw error;

  const results = [];
  for (const row of dueRows || []) {
    const optOut = await supabase().from("whatsapp_opt_outs").select("phone").eq("phone", row.phone).maybeSingle();
    if (optOut.data) {
      await supabase()
        .from("review_requests")
        .update({ status: "opted_out", opt_out_at: now, cancelled_at: now })
        .eq("id", row.id);
      results.push({ id: row.id, skipped: "opted_out" });
      continue;
    }

    try {
      const name = row.customer_name || "there";
      const orderName = row.order_name || row.shopify_order_id || "your order";
      const reviewUrl = row.review_url || config.googleReviewUrl;
      const sendResult = await sendTemplateMessage({
        to: row.phone,
        templateName: row.template_name || config.reviewRequestTemplateName,
        languageCode: "en",
        bodyParameters: [name, orderName, reviewUrl]
      });
      const messageId = sendResult.messages?.[0]?.id || null;
      await supabase()
        .from("review_requests")
        .update({
          status: sendResult.dry_run ? "dry_run" : "sent",
          sent_at: now,
          message_id: messageId,
          last_error: null
        })
        .eq("id", row.id);
      results.push({ id: row.id, status: sendResult.dry_run ? "dry_run" : "sent" });
    } catch (sendError) {
      await supabase()
        .from("review_requests")
        .update({ status: "error", last_error: sendError.message })
        .eq("id", row.id);
      results.push({ id: row.id, status: "error", error: sendError.message });
    }
  }

  return results;
}

export async function suppressReviewRequest(payload) {
  const selectors = [
    ["shopify_order_id", clean(payload.shopify_order_id)],
    ["order_name", clean(payload.order_name)],
    ["phone", clean(payload.phone)]
  ].filter(([, value]) => value);

  if (!selectors.length) {
    const error = new Error("Provide shopify_order_id, order_name, or phone");
    error.statusCode = 400;
    throw error;
  }

  const now = new Date().toISOString();
  const reason = clean(payload.reason) || "Manual review request suppression";
  const updated = new Map();

  for (const [field, value] of selectors) {
    const { data, error } = await supabase()
      .from("review_requests")
      .update({
        status: "cancelled",
        cancelled_at: now,
        last_error: reason
      })
      .eq(field, value)
      .in("status", ["awaiting_delivery", "pending", "error"])
      .select("id,order_name,shopify_order_id,phone,status,cancelled_at");

    if (error) throw error;
    for (const row of data || []) updated.set(row.id, row);
  }

  return [...updated.values()];
}

export async function markReviewRequestDelivered({ orderId, phone, customerName, config, now = new Date().toISOString() }) {
  if (!orderId) return { ok: false, skipped: "missing_order_id" };

  const dueAt = new Date(new Date(now).getTime() + config.reviewRequestDelayHours * 60 * 60 * 1000).toISOString();
  const baseUpdate = {
    delivered_at: now,
    due_at: dueAt,
    review_url: config.googleReviewUrl,
    template_name: config.reviewRequestTemplateName,
    status: "pending",
    last_error: null,
  };

  const existing = await supabase()
    .from("review_requests")
    .select("id,phone,status")
    .eq("shopify_order_id", orderId)
    .maybeSingle();

  if (existing.error) return { ok: false, error: existing.error.message };

  if (existing.data) {
    const update = {
      ...baseUpdate,
      phone: existing.data.phone || phone,
    };
    if (existing.data.status !== "awaiting_delivery" && existing.data.status !== "error") {
      delete update.status;
      delete update.due_at;
    }

    const { error } = await supabase()
      .from("review_requests")
      .update(update)
      .eq("id", existing.data.id);

    return error ? { ok: false, error: error.message } : { ok: true, action: "updated" };
  }

  if (!phone) return { ok: false, skipped: "missing_phone" };

  const { error } = await supabase()
    .from("review_requests")
    .insert({
      ...baseUpdate,
      shopify_order_id: orderId,
      phone,
      customer_name: customerName,
      source: "tracking_provider"
    });

  return error ? { ok: false, error: error.message } : { ok: true, action: "created" };
}

export async function scheduleReviewRequestAfterFulfillment({ orderId, phone, customerName, config, now = new Date().toISOString(), isInternational = false }) {
  if (!orderId) return { ok: false, skipped: "missing_order_id" };

  const delayDays = isInternational ? config.reviewRequestInternationalDelayDays : config.reviewRequestDomesticDelayDays;
  const dueAt = new Date(new Date(now).getTime() + delayDays * 24 * 60 * 60 * 1000).toISOString();
  const baseUpdate = {
    due_at: dueAt,
    review_url: config.googleReviewUrl,
    template_name: config.reviewRequestTemplateName,
    status: "pending",
    last_error: null,
    source: isInternational ? "shopify_fulfillment_international_timed" : "shopify_fulfillment_domestic_timed"
  };

  const existing = await supabase()
    .from("review_requests")
    .select("id,phone,status")
    .eq("shopify_order_id", orderId)
    .maybeSingle();

  if (existing.error) return { ok: false, error: existing.error.message };

  if (existing.data) {
    if (existing.data.status !== "awaiting_delivery" && existing.data.status !== "error") {
      return { ok: true, skipped: `already_${existing.data.status}` };
    }

    const { error } = await supabase()
      .from("review_requests")
      .update({
        ...baseUpdate,
        phone: existing.data.phone || phone
      })
      .eq("id", existing.data.id);

    return error ? { ok: false, error: error.message } : { ok: true, action: "scheduled", due_at: dueAt, delay_days: delayDays };
  }

  if (!phone) return { ok: false, skipped: "missing_phone" };

  const { error } = await supabase()
    .from("review_requests")
    .insert({
      ...baseUpdate,
      shopify_order_id: orderId,
      phone,
      customer_name: customerName,
    });

  return error ? { ok: false, error: error.message } : { ok: true, action: "created", due_at: dueAt, delay_days: delayDays };
}

function clean(value) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value).trim();
  return text || null;
}
