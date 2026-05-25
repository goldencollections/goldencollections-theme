import { isCronAuthorized } from "../../lib/auth.js";
import { getConfig } from "../../lib/config.js";
import { ensureSupportEmailSignature } from "../../lib/email-classify.js";
import { getEmailConfig } from "../../lib/email-config.js";
import { sendSupportEmail } from "../../lib/email-smtp.js";
import { sendJson, readRawBody } from "../../lib/http.js";
import { supabase } from "../../lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
  const config = getConfig();
  if (!isCronAuthorized(req, config)) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }

  const url = new URL(req.url, "https://goldencollections.local");
  const body = parseRequestBody(await readRawBody(req), req.headers["content-type"]);
  const draftId = body.draft_id;
  const requireLiveSend = body.require_live === "true" || body.require_live === true;
  if (!draftId) return sendJson(res, 400, { error: "Missing draft_id" });

  const emailConfig = getEmailConfig({ requireMailbox: true });
  const { data: draft, error: draftError } = await supabase()
    .from("support_email_drafts")
    .select("*")
    .eq("id", draftId)
    .single();
  if (draftError) return sendJson(res, 404, { error: draftError.message });

  const { data: message, error: messageError } = await supabase()
    .from("support_email_messages")
    .select("*")
    .eq("id", draft.message_id)
    .single();
  if (messageError) return sendJson(res, 404, { error: messageError.message });

  const approvedBy = body.approved_by || "codex";
  const approvedAt = new Date().toISOString();

  if (!emailConfig.sendEnabled || emailConfig.dryRun) {
    if (requireLiveSend) {
      return respondAfterAction(req, res, url, {
        ok: false,
        skipped_send: emailConfig.dryRun ? "support_email_dry_run" : "support_email_send_disabled",
        draft_id: draftId,
        to: draft.to_email,
      });
    }
    await supabase()
      .from("support_email_drafts")
      .update({ status: "approved", approved_by: approvedBy, approved_at: approvedAt })
      .eq("id", draftId);
    return respondAfterAction(req, res, url, {
      ok: true,
      dry_run: true,
      skipped_send: emailConfig.dryRun ? "support_email_dry_run" : "support_email_send_disabled",
      draft_id: draftId,
      to: draft.to_email,
    });
  }

  try {
    const sent = await sendSupportEmail(emailConfig, {
      to: draft.to_email,
      subject: draft.draft_subject,
      text: ensureSupportEmailSignature(draft.draft_body),
      inReplyTo: message.message_id,
      references: message.thread_key,
    });

    const sentAt = new Date().toISOString();
    await supabase()
      .from("support_email_drafts")
      .update({
        status: "sent",
        approved_by: approvedBy,
        approved_at: approvedAt,
        sent_at: sentAt,
        smtp_message_id: sent.messageId || null,
        last_error: null,
      })
      .eq("id", draftId);
    await supabase()
      .from("support_email_events")
      .insert({ message_id: message.id, draft_id: draftId, event_type: "sent", payload: { smtp_message_id: sent.messageId } });

    return respondAfterAction(req, res, url, { ok: true, sent: true, draft_id: draftId, smtp_message_id: sent.messageId || null });
  } catch (error) {
    await supabase()
      .from("support_email_drafts")
      .update({ status: "error", last_error: error.message })
      .eq("id", draftId);
    return sendJson(res, 500, { error: error.message });
  }
}

function parseRequestBody(rawBody, contentType = "") {
  const text = rawBody.toString("utf8");
  if (!text) return {};
  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(text));
  }
  return JSON.parse(text);
}

function respondAfterAction(req, res, url, body) {
  const redirect = url.searchParams.get("redirect");
  if (redirect === "dashboard" || redirect === "inbox") {
    const token = url.searchParams.get("token");
    const target =
      redirect === "dashboard"
        ? `/api/monitor/support-inbox?view=dashboard&days=7${token ? `&token=${encodeURIComponent(token)}` : ""}`
        : `/api/monitor/support-inbox?status=needs_review${token ? `&token=${encodeURIComponent(token)}` : ""}`;
    res.statusCode = 303;
    res.setHeader("Location", target);
    res.end();
    return;
  }
  return sendJson(res, 200, body);
}
