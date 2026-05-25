import { classifyEmail, draftReply, shouldIgnoreEmail } from "../../lib/email-classify.js";
import { isCronAuthorized } from "../../lib/auth.js";
import { getEmailConfig } from "../../lib/email-config.js";
import { fetchRecentSupportEmails } from "../../lib/email-imap.js";
import { getConfig } from "../../lib/config.js";
import { sendJson } from "../../lib/http.js";
import { supabase } from "../../lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
  const config = getConfig();
  if (!isCronAuthorized(req, config)) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }

  const emailConfig = getEmailConfig();
  if (!emailConfig.automationEnabled) {
    return respondAfterAction(req, res, { ok: true, skipped: "support_email_automation_disabled" });
  }
  if (!emailConfig.configured) {
    return respondAfterAction(req, res, { ok: true, skipped: "support_email_missing_config", missing: emailConfig.missing });
  }

  const messages = await fetchRecentSupportEmails(emailConfig);
  const results = [];

  for (const message of messages) {
    const ignored = shouldIgnoreEmail(message);
    if (ignored.ignore) {
      results.push({ provider_message_id: message.provider_message_id, skipped: ignored.reason });
      continue;
    }

    const existing = await supabase()
      .from("support_email_messages")
      .select("id")
      .eq("provider_message_id", message.provider_message_id)
      .maybeSingle();

    if (existing.data) {
      results.push({ provider_message_id: message.provider_message_id, skipped: "already_ingested" });
      continue;
    }

    const classification = classifyEmail({ subject: message.subject, text: message.plain_text });
    const { data: inserted, error: insertError } = await supabase()
      .from("support_email_messages")
      .insert({ ...message, classification, status: "new" })
      .select("id,from_email,from_name,subject,classification")
      .single();

    if (insertError) {
      results.push({ provider_message_id: message.provider_message_id, error: insertError.message });
      continue;
    }

    const draft = draftReply({
      fromName: inserted.from_name,
      classification: inserted.classification,
      subject: inserted.subject,
    });

    await supabase()
      .from("support_email_drafts")
      .insert({
        message_id: inserted.id,
        to_email: inserted.from_email,
        draft_subject: draft.subject,
        draft_body: draft.body,
        status: "needs_review",
        classification: inserted.classification,
      });

    await supabase()
      .from("support_email_events")
      .insert({ message_id: inserted.id, event_type: "ingested", payload: { classification } });

    results.push({ id: inserted.id, provider_message_id: message.provider_message_id, classification, draft: "needs_review" });
  }

  return respondAfterAction(req, res, { ok: true, fetched: messages.length, results });
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
