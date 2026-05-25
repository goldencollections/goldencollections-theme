import { isCronAuthorized } from "../../lib/auth.js";
import { getConfig } from "../../lib/config.js";
import { sendJson } from "../../lib/http.js";
import { sendTemplateMessage } from "../../lib/whatsapp.js";
import { supabase } from "../../lib/supabase.js";
import { processDueReviewRequests } from "../../lib/review-requests.js";
import { pollTrackingProvider } from "../../lib/tracking-provider.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
  const config = getConfig();
  if (!isCronAuthorized(req, config)) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }

  const now = new Date().toISOString();
  const { data: dueRows, error } = await supabase()
    .from("checkout_automations")
    .select("*")
    .eq("status", "pending")
    .lte("due_at", now)
    .limit(25);

  if (error) return sendJson(res, 500, { error: error.message });

  const results = [];
  for (const row of dueRows || []) {
    const optOut = await supabase().from("whatsapp_opt_outs").select("phone").eq("phone", row.phone).maybeSingle();
    if (optOut.data) {
      await supabase()
        .from("checkout_automations")
        .update({ status: "opted_out", opt_out_at: now, cancelled_at: now })
        .eq("id", row.id);
      results.push({ id: row.id, skipped: "opted_out" });
      continue;
    }

    try {
      const name = row.customer_name || "there";
      const summary = row.cart?.summary || "items";
      const checkoutUrl = row.checkout_url || "https://www.goldencollections.com/cart";
      const sendResult = await sendTemplateMessage({
        to: row.phone,
        templateName: row.template_name,
        languageCode: "en",
        bodyParameters: [name, summary, checkoutUrl]
      });
      const messageId = sendResult.messages?.[0]?.id || null;
      await supabase()
        .from("checkout_automations")
        .update({
          status: sendResult.dry_run ? "dry_run" : "sent",
          sent_at: now,
          message_id: messageId,
          last_error: null
        })
        .eq("id", row.id);
      results.push({ id: row.id, status: sendResult.dry_run ? "dry_run" : "sent", template_name: row.template_name });
    } catch (sendError) {
      await supabase()
        .from("checkout_automations")
        .update({ status: "error", last_error: sendError.message })
        .eq("id", row.id);
      results.push({ id: row.id, status: "error", error: sendError.message });
    }
  }

  let reviewResults = [];
  let trackingResult = { enabled: false, processed: 0, results: [] };
  try {
    trackingResult = await pollTrackingProvider(config, now);
  } catch (trackingError) {
    return sendJson(res, 500, { error: trackingError.message, processed: results.length, results });
  }

  try {
    reviewResults = await processDueReviewRequests(config, now);
  } catch (reviewError) {
    return sendJson(res, 500, { error: reviewError.message, processed: results.length, results });
  }

  return respondAfterAction(req, res, {
    ok: true,
    processed: results.length,
    results,
    tracking: trackingResult,
    review_requests: {
      processed: reviewResults.length,
      results: reviewResults
    }
  });
}

function respondAfterAction(req, res, body) {
  const url = new URL(req.url, "https://goldencollections.local");
  if (url.searchParams.get("redirect") === "dashboard") {
    const token = url.searchParams.get("token");
    res.statusCode = 303;
    res.setHeader("Location", `/api/monitor/support-inbox?view=dashboard&days=7${token ? `&token=${encodeURIComponent(token)}` : ""}`);
    res.end();
    return;
  }
  return sendJson(res, 200, body);
}
