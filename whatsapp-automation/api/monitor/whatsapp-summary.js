import { getConfig } from "../../lib/config.js";
import { sendJson } from "../../lib/http.js";
import { supabase } from "../../lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return sendJson(res, 405, { error: "Method not allowed" });

  const config = getConfig();
  if (req.headers.authorization !== `Bearer ${config.cronSecret}`) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }

  const url = new URL(req.url, "https://goldencollections.local");
  const days = Math.min(Math.max(Number(url.searchParams.get("days") || 7), 1), 30);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: automations, error: automationError },
    { data: events, error: eventError },
    { data: optOuts, error: optOutError },
    { data: shipments, error: shipmentError },
    { data: reviewRequests, error: reviewRequestError },
  ] =
    await Promise.all([
      supabase()
        .from("checkout_automations")
        .select("id,status,template_name,cart_classification,abandon_detected_at,due_at,sent_at,ordered_at,replied_at,opt_out_at,cancelled_at,shipment_status,shipment_carrier,shipment_tracking_number,last_error")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase()
        .from("whatsapp_events")
        .select("event_type,phone,wa_message_id,payload,created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase()
        .from("whatsapp_opt_outs")
        .select("phone,opted_out_at,source")
        .gte("opted_out_at", since)
        .order("opted_out_at", { ascending: false })
        .limit(1000),
      supabase()
        .from("shipment_events")
        .select("tracking_number,carrier,status,tracking_url,status_updated_at,delivered_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase()
        .from("review_requests")
        .select("id,status,template_name,due_at,delivered_at,sent_at,order_name,last_error")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1000)
    ]);

  if (automationError) return sendJson(res, 500, { error: automationError.message });
  if (eventError) return sendJson(res, 500, { error: eventError.message });
  if (optOutError) return sendJson(res, 500, { error: optOutError.message });
  if (shipmentError) return sendJson(res, 500, { error: shipmentError.message });
  const reviewRequestsUnavailable = isMissingTableError(reviewRequestError);
  if (reviewRequestError && !reviewRequestsUnavailable) return sendJson(res, 500, { error: reviewRequestError.message });

  const rows = automations || [];
  const eventRows = events || [];
  const shipmentRows = shipments || [];
  const reviewRows = reviewRequestsUnavailable ? [] : (reviewRequests || []);
  const statusCounts = countBy(rows, "status");
  const templateCounts = countBy(rows, "template_name");
  const classificationCounts = countBy(rows, "cart_classification");
  const eventCounts = countBy(eventRows, "event_type");
  const shipmentStatusCounts = countBy(shipmentRows, "status");
  const shipmentCarrierCounts = countBy(shipmentRows, "carrier");
  const reviewRequestStatusCounts = countBy(reviewRows, "status");
  const inboundMessages = eventRows.filter((event) => event.event_type === "inbound_message");
  const complaintLikeReplies = inboundMessages.filter((event) => complaintPattern.test(event.payload?.text?.body || ""));

  return sendJson(res, 200, {
    ok: true,
    generated_at: new Date().toISOString(),
    window_days: days,
    safety: {
      automation_enabled: config.automationEnabled,
      dry_run: config.dryRun
    },
    automations: {
      total: rows.length,
      status_counts: statusCounts,
      template_counts: templateCounts,
      cart_classification_counts: classificationCounts,
      pending_due_now: rows.filter((row) => row.status === "pending" && row.due_at && new Date(row.due_at) <= new Date()).length,
      sent_or_dry_run: rows.filter((row) => row.status === "sent" || row.status === "dry_run").length,
      ordered: rows.filter((row) => row.status === "ordered").length,
      human_handoff: rows.filter((row) => row.status === "human_handoff").length,
      opted_out: rows.filter((row) => row.status === "opted_out").length,
      errors: rows.filter((row) => row.status === "error").length
    },
    whatsapp_events: {
      total: eventRows.length,
      event_counts: eventCounts,
      inbound_replies: inboundMessages.length,
      complaint_like_replies: complaintLikeReplies.length,
      opt_outs: (optOuts || []).length,
      recent: eventRows.slice(0, 20).map(summarizeWhatsappEvent)
    },
    shipments: {
      total: shipmentRows.length,
      status_counts: shipmentStatusCounts,
      carrier_counts: shipmentCarrierCounts,
      india_post_tracking_links: shipmentRows.filter((row) => row.carrier === "India Post" && row.tracking_url).length,
      delivered: shipmentRows.filter((row) => row.status === "delivered").length,
      delivery_issues: shipmentRows.filter((row) => row.status === "delivery_issue").length,
      recent: shipmentRows.slice(0, 10)
    },
    review_requests: {
      unavailable: reviewRequestsUnavailable,
      unavailable_reason: reviewRequestsUnavailable ? reviewRequestError.message : null,
      total: reviewRows.length,
      status_counts: reviewRequestStatusCounts,
      pending_due_now: reviewRows.filter((row) => row.status === "pending" && row.due_at && new Date(row.due_at) <= new Date()).length,
      sent_or_dry_run: reviewRows.filter((row) => row.status === "sent" || row.status === "dry_run").length,
      errors: reviewRows.filter((row) => row.status === "error").length,
      recent: reviewRows.slice(0, 10)
    },
    review_notes: [
      "Keep live sends off until phone registration and owner approval.",
      "Review requests should run after delivery plus the configured delay, default 48 hours.",
      "After live launch, review replies, opt-outs, complaint-like replies, orders recovered, review request sends, and manual handoff load before adding more flows."
    ]
  });
}

function isMissingTableError(error) {
  return Boolean(error?.message && /review_requests|schema cache|could not find the table/i.test(error.message));
}

const complaintPattern = /\b(complaint|bad|wrong|damaged|broken|refund|return|angry|not happy|poor|issue|problem)\b/i;

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    const value = row[key] || "unknown";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function summarizeWhatsappEvent(event) {
  return {
    created_at: event.created_at,
    event_type: event.event_type,
    phone: maskPhone(event.phone),
    wa_message_id: event.wa_message_id,
    status: event.payload?.status || null,
    text: event.event_type === "inbound_message" ? event.payload?.text?.body || "" : null,
    errors: (event.payload?.errors || []).map((error) => ({
      code: error.code,
      title: error.title,
      message: error.message,
      details: error.error_data?.details || error.details || null
    }))
  };
}

function maskPhone(phone) {
  return phone ? String(phone).replace(/.(?=.{4})/g, "*") : null;
}
