import { getConfig } from "../../lib/config.js";
import { getEmailConfig } from "../../lib/email-config.js";
import { sendJson } from "../../lib/http.js";
import { supabase } from "../../lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return sendJson(res, 405, { error: "Method not allowed" });

  const config = getConfig();
  if (req.headers.authorization !== `Bearer ${config.cronSecret}`) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }

  const emailConfig = getEmailConfig();
  const url = new URL(req.url, "https://goldencollections.local");
  const days = Math.min(Math.max(Number(url.searchParams.get("days") || 7), 1), 30);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: messages, error: messageError }, { data: drafts, error: draftError }] = await Promise.all([
    supabase()
      .from("support_email_messages")
      .select("id,from_email,subject,status,classification,received_at,created_at")
      .gte("created_at", since)
      .order("received_at", { ascending: false })
      .limit(500),
    supabase()
      .from("support_email_drafts")
      .select("id,status,classification,to_email,created_at,approved_at,sent_at,last_error")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  if (messageError) return sendJson(res, 500, { error: messageError.message });
  if (draftError) return sendJson(res, 500, { error: draftError.message });

  return sendJson(res, 200, {
    ok: true,
    generated_at: new Date().toISOString(),
    window_days: days,
    safety: {
      configured: emailConfig.configured,
      missing: emailConfig.missing,
      automation_enabled: emailConfig.automationEnabled,
      send_enabled: emailConfig.sendEnabled,
      dry_run: emailConfig.dryRun,
    },
    messages: {
      total: (messages || []).length,
      status_counts: countBy(messages || [], "status"),
      classification_counts: countBy(messages || [], "classification"),
      recent: (messages || []).slice(0, 10),
    },
    drafts: {
      total: (drafts || []).length,
      status_counts: countBy(drafts || [], "status"),
      needs_review: (drafts || []).filter((draft) => draft.status === "needs_review").length,
      sent: (drafts || []).filter((draft) => draft.status === "sent").length,
      errors: (drafts || []).filter((draft) => draft.status === "error").length,
    },
  });
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    const value = row[key] || "unknown";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}
