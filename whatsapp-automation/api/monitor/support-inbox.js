import { isCronAuthorized } from "../../lib/auth.js";
import { getConfig } from "../../lib/config.js";
import { ensureSupportEmailSignature } from "../../lib/email-classify.js";
import { getEmailConfig } from "../../lib/email-config.js";
import { listSupportEmailDrafts } from "../../lib/email-inbox.js";
import { sendJson } from "../../lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return sendHtml(res, 405, "<h1>Method not allowed</h1>");

  const config = getConfig();
  if (!isCronAuthorized(req, config)) return sendHtml(res, 401, "<h1>Unauthorized</h1>");

  const url = new URL(req.url, "https://goldencollections.local");
  const status = url.searchParams.get("status") || "needs_review";
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 25), 1), 100);
  const format = url.searchParams.get("format") || "html";
  const view = url.searchParams.get("view") || "inbox";
  const days = Math.min(Math.max(Number(url.searchParams.get("days") || 7), 1), 30);
  const token = url.searchParams.get("token") || "";
  const emailConfig = getEmailConfig();

  try {
    if (view === "dashboard") {
      const dashboard = await loadAssistantDashboard({ config, emailConfig, days });
      if (format === "json") return sendJson(res, 200, dashboard);
      return sendHtml(res, 200, renderDashboard(dashboard, { token }));
    }

    const drafts = await listSupportEmailDrafts({ status, limit });
    if (format === "json") {
      return sendJson(res, 200, {
        ok: true,
        generated_at: new Date().toISOString(),
        status,
        count: drafts.length,
        drafts,
      });
    }
    return sendHtml(res, 200, renderInbox({ drafts, status, emailConfig, token }));
  } catch (error) {
    return sendHtml(res, 500, renderError(error));
  }
}

async function loadAssistantDashboard({ config, emailConfig, days }) {
  const now = new Date();
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const today = todayStart.toISOString();
  const db = (await import("../../lib/supabase.js")).supabase();

  const [messagesResult, draftsResult, automationsResult, eventsResult, optOutsResult, shipmentsResult, reviewRequestsResult] =
    await Promise.all([
      db
        .from("support_email_messages")
        .select("id,from_email,from_name,subject,status,classification,received_at,created_at")
        .gte("created_at", since)
        .order("received_at", { ascending: false })
        .limit(500),
      db
        .from("support_email_drafts")
        .select("id,status,classification,to_email,draft_subject,created_at,approved_at,sent_at,last_error,support_email_messages(from_email,from_name,subject,received_at)")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500),
      db
        .from("checkout_automations")
        .select("id,status,template_name,cart_classification,customer_name,email,due_at,sent_at,ordered_at,replied_at,opt_out_at,last_error,created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1000),
      db
        .from("whatsapp_events")
        .select("event_type,phone,payload,created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1000),
      db
        .from("whatsapp_opt_outs")
        .select("phone,opted_out_at,source")
        .gte("opted_out_at", since)
        .order("opted_out_at", { ascending: false })
        .limit(1000),
      db
        .from("shipment_events")
        .select("tracking_number,carrier,status,tracking_url,status_updated_at,delivered_at,created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500),
      db
        .from("review_requests")
        .select("id,status,template_name,due_at,delivered_at,sent_at,order_name,last_error,created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

  const errors = [
    ["support emails", messagesResult.error],
    ["support drafts", draftsResult.error],
    ["checkout automations", automationsResult.error],
    ["WhatsApp events", eventsResult.error],
    ["WhatsApp opt-outs", optOutsResult.error],
    ["shipments", shipmentsResult.error],
  ].filter(([, error]) => error);
  if (errors.length) {
    throw new Error(`${errors[0][0]} query failed: ${errors[0][1].message}`);
  }

  const reviewUnavailable = isMissingTableError(reviewRequestsResult.error);
  if (reviewRequestsResult.error && !reviewUnavailable) {
    throw new Error(`review requests query failed: ${reviewRequestsResult.error.message}`);
  }

  const messages = messagesResult.data || [];
  const drafts = draftsResult.data || [];
  const automations = automationsResult.data || [];
  const events = eventsResult.data || [];
  const optOuts = optOutsResult.data || [];
  const shipments = shipmentsResult.data || [];
  const reviewRequests = reviewUnavailable ? [] : (reviewRequestsResult.data || []);
  const inboundReplies = events.filter((event) => event.event_type === "inbound_message");
  const complaintLikeReplies = inboundReplies.filter((event) => complaintPattern.test(event.payload?.text?.body || ""));
  const needsReviewDrafts = drafts.filter((draft) => draft.status === "needs_review");
  const errorDrafts = drafts.filter((draft) => draft.status === "error");
  const automationErrors = automations.filter((row) => row.status === "error");
  const pendingDueNow = automations.filter((row) => row.status === "pending" && row.due_at && new Date(row.due_at) <= now);
  const reviewErrors = reviewRequests.filter((row) => row.status === "error");
  const reviewDueNow = reviewRequests.filter((row) => row.status === "pending" && row.due_at && new Date(row.due_at) <= now);

  const attention = buildAttentionItems({
    config,
    emailConfig,
    needsReviewDrafts,
    errorDrafts,
    automationErrors,
    pendingDueNow,
    inboundReplies,
    complaintLikeReplies,
    optOuts,
    reviewUnavailable,
    reviewErrors,
    reviewDueNow,
  });

  return {
    ok: true,
    generated_at: now.toISOString(),
    window_days: days,
    verdict: buildVerdict(attention),
    safety: {
      whatsapp_automation_enabled: config.automationEnabled,
      whatsapp_dry_run: config.dryRun,
      support_email_configured: emailConfig.configured,
      support_email_automation_enabled: emailConfig.automationEnabled,
      support_email_send_enabled: emailConfig.sendEnabled,
      support_email_dry_run: emailConfig.dryRun,
    },
    attention,
    priority_emails: needsReviewDrafts
      .map(toPriorityEmail)
      .sort((a, b) => b.priority_score - a.priority_score || new Date(a.received_at || a.created_at) - new Date(b.received_at || b.created_at))
      .slice(0, 12),
    today: {
      support_emails: messages.filter((row) => row.created_at >= today && row.status !== "ignored").length,
      support_drafts_needing_review: needsReviewDrafts.filter((row) => row.created_at >= today).length,
      whatsapp_sent_or_dry_run: automations.filter((row) => row.created_at >= today && ["sent", "dry_run"].includes(row.status)).length,
      whatsapp_replies: inboundReplies.filter((row) => row.created_at >= today).length,
      orders_recovered: automations.filter((row) => row.created_at >= today && row.status === "ordered").length,
      opt_outs: optOuts.filter((row) => row.opted_out_at >= today).length,
      shipments: shipments.filter((row) => row.created_at >= today).length,
    },
    period: {
      support_messages: {
        total: messages.length,
        status_counts: countBy(messages, "status"),
        classification_counts: countBy(messages, "classification"),
      },
      support_drafts: {
        total: drafts.length,
        status_counts: countBy(drafts, "status"),
        needs_review: needsReviewDrafts.length,
        errors: errorDrafts.length,
        sent: drafts.filter((draft) => draft.status === "sent").length,
      },
      whatsapp: {
        total_automations: automations.length,
        status_counts: countBy(automations, "status"),
        pending_due_now: pendingDueNow.length,
        sent_or_dry_run: automations.filter((row) => ["sent", "dry_run"].includes(row.status)).length,
        ordered: automations.filter((row) => row.status === "ordered").length,
        human_handoff: automations.filter((row) => row.status === "human_handoff").length,
        errors: automationErrors.length,
        inbound_replies: inboundReplies.length,
        complaint_like_replies: complaintLikeReplies.length,
        opt_outs: optOuts.length,
      },
      shipments: {
        total: shipments.length,
        status_counts: countBy(shipments, "status"),
        india_post_links: shipments.filter((row) => row.carrier === "India Post" && row.tracking_url).length,
      },
      review_requests: {
        unavailable: reviewUnavailable,
        total: reviewRequests.length,
        status_counts: countBy(reviewRequests, "status"),
        pending_due_now: reviewDueNow.length,
        errors: reviewErrors.length,
      },
    },
    recent_context: buildRecentContext({ messages, drafts, automations, events, shipments, reviewRequests }),
  };
}

function buildAttentionItems({
  config,
  emailConfig,
  needsReviewDrafts,
  errorDrafts,
  automationErrors,
  pendingDueNow,
  inboundReplies,
  complaintLikeReplies,
  optOuts,
  reviewUnavailable,
  reviewErrors,
  reviewDueNow,
}) {
  const items = [];
  if (!emailConfig.configured) items.push(attentionItem("critical", "Support email is not fully configured", "Add the missing mailbox env vars before relying on email automation."));
  if (!emailConfig.automationEnabled) items.push(attentionItem("high", "Support email ingest is disabled", "No new customer emails will be pulled until SUPPORT_EMAIL_AUTOMATION_ENABLED is true."));
  if (!emailConfig.sendEnabled || emailConfig.dryRun) items.push(attentionItem("medium", "Support email sending needs manual action", "Drafts can be reviewed, but the app will not send replies until live sending is explicitly enabled."));
  if (!config.automationEnabled || config.dryRun) items.push(attentionItem("medium", "WhatsApp automation is not live-sending", "Checkouts may be stored, but messages are disabled or dry-run until you enable live sending."));
  if (errorDrafts.length) items.push(attentionItem("critical", `${errorDrafts.length} email draft error${plural(errorDrafts.length)}`, "Open the support inbox and fix failed drafts first."));
  if (automationErrors.length) items.push(attentionItem("critical", `${automationErrors.length} WhatsApp automation error${plural(automationErrors.length)}`, "Check the failed automation rows before enabling more flows."));
  if (complaintLikeReplies.length) items.push(attentionItem("critical", `${complaintLikeReplies.length} complaint-like WhatsApp repl${complaintLikeReplies.length === 1 ? "y" : "ies"}`, "Handle these manually before any further automation."));
  if (inboundReplies.length) items.push(attentionItem("high", `${inboundReplies.length} WhatsApp customer repl${inboundReplies.length === 1 ? "y" : "ies"}`, "These may need human follow-up."));
  if (needsReviewDrafts.length) items.push(attentionItem("high", `${needsReviewDrafts.length} support email draft${plural(needsReviewDrafts.length)} need${needsReviewDrafts.length === 1 ? "s" : ""} review`, "Open priority emails, edit if needed, and reply manually for now."));
  if (pendingDueNow.length) items.push(attentionItem("medium", `${pendingDueNow.length} checkout automation${plural(pendingDueNow.length)} due now`, "If live send is disabled, these require your decision before the customer gets a message."));
  if (reviewUnavailable) items.push(attentionItem("medium", "Review request automation table is not active", "Apply the review request migration before enabling post-delivery review flows."));
  if (reviewErrors.length) items.push(attentionItem("high", `${reviewErrors.length} review request error${plural(reviewErrors.length)}`, "Review request automation needs attention."));
  if (reviewDueNow.length) items.push(attentionItem("medium", `${reviewDueNow.length} review request${plural(reviewDueNow.length)} due now`, "Confirm post-delivery review sends are safe before enabling this flow."));
  if (optOuts.length) items.push(attentionItem("medium", `${optOuts.length} WhatsApp opt-out${plural(optOuts.length)}`, "Respect opt-outs and watch if this increases after live launch."));
  return items.sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
}

function buildVerdict(attention) {
  if (attention.some((item) => item.severity === "critical")) return "Needs attention now";
  if (attention.some((item) => item.severity === "high")) return "Review before moving on";
  if (attention.some((item) => item.severity === "medium")) return "Stable, but action is pending";
  return "Looks calm";
}

function attentionItem(severity, title, action) {
  return { severity, title, action };
}

function toPriorityEmail(draft) {
  const message = draft.support_email_messages || {};
  const ageHours = Math.max(0, (Date.now() - new Date(message.received_at || draft.created_at).getTime()) / 36e5);
  const classificationScore = {
    return_exchange: 95,
    order_status: 90,
    deity_fit: 80,
    real_kemp: 75,
    bulk_wholesale: 70,
    general_support: 50,
  }[draft.classification] || 50;
  const priorityScore = classificationScore + Math.min(20, Math.floor(ageHours / 6));
  return {
    id: draft.id,
    priority_score: priorityScore,
    priority: priorityScore >= 90 ? "Urgent" : priorityScore >= 75 ? "High" : "Normal",
    classification: draft.classification,
    from: message.from_name || message.from_email || draft.to_email,
    subject: draft.draft_subject,
    received_at: message.received_at,
    created_at: draft.created_at,
  };
}

function buildRecentContext({ messages, drafts, automations, events, shipments, reviewRequests }) {
  const rows = [
    ...messages.filter((row) => row.status !== "ignored").slice(0, 6).map((row) => ({
      at: row.received_at || row.created_at,
      type: "Email",
      text: `${row.from_name || row.from_email || "Customer"}: ${row.subject || "No subject"}`,
    })),
    ...drafts.filter((row) => row.status === "needs_review").slice(0, 6).map((row) => ({
      at: row.created_at,
      type: "Draft",
      text: `${row.classification} reply waiting: ${row.draft_subject}`,
    })),
    ...automations.slice(0, 6).map((row) => ({
      at: row.sent_at || row.replied_at || row.ordered_at || row.created_at,
      type: "WhatsApp",
      text: `${row.status} checkout flow${row.customer_name ? ` for ${row.customer_name}` : ""}`,
    })),
    ...events.filter((row) => row.event_type === "inbound_message").slice(0, 6).map((row) => ({
      at: row.created_at,
      type: "Reply",
      text: truncate(row.payload?.text?.body || "Customer replied on WhatsApp", 120),
    })),
    ...shipments.slice(0, 5).map((row) => ({
      at: row.status_updated_at || row.created_at,
      type: "Shipment",
      text: `${row.carrier || "Carrier"} ${row.tracking_number || ""}: ${row.status || "updated"}`,
    })),
    ...reviewRequests.slice(0, 5).map((row) => ({
      at: row.sent_at || row.due_at || row.created_at,
      type: "Review",
      text: `${row.order_name || "Order"} review request: ${row.status}`,
    })),
  ];
  return rows
    .filter((row) => row.at)
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 14);
}

function renderInbox({ drafts, status, emailConfig, token }) {
  const cards = drafts.length
    ? drafts.map((draft) => renderDraftCard(draft, { emailConfig, token })).join("")
    : `<section class="empty">No drafts found for <strong>${escapeHtml(status)}</strong>.</section>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Golden Collections Support Inbox</title>
  <style>
    :root { color-scheme: light; --ink:#1f2933; --muted:#64748b; --line:#d9e2ec; --bg:#f6f8fb; --panel:#fff; --accent:#8a3ffc; }
    body { margin:0; font:14px/1.5 Arial, sans-serif; color:var(--ink); background:var(--bg); }
    header { position:sticky; top:0; z-index:1; background:var(--panel); border-bottom:1px solid var(--line); padding:18px 24px; }
    h1 { margin:0 0 4px; font-size:22px; }
    .meta { color:var(--muted); display:flex; gap:16px; flex-wrap:wrap; }
    main { max-width:1120px; margin:0 auto; padding:24px; }
    .card { background:var(--panel); border:1px solid var(--line); border-radius:8px; margin-bottom:16px; overflow:hidden; }
    .card-head { padding:16px 18px; border-bottom:1px solid var(--line); display:grid; gap:6px; }
    .subject { font-size:17px; font-weight:700; }
    .chips { display:flex; gap:8px; flex-wrap:wrap; }
    .chip { border:1px solid var(--line); border-radius:999px; padding:2px 9px; color:var(--muted); background:#fbfdff; }
    .columns { display:grid; grid-template-columns:1fr 1fr; gap:0; }
    .pane { padding:16px 18px; min-width:0; }
    .pane + .pane { border-left:1px solid var(--line); }
    h2 { margin:0 0 8px; font-size:13px; text-transform:uppercase; letter-spacing:.04em; color:var(--muted); }
    pre { white-space:pre-wrap; overflow-wrap:anywhere; margin:0; font:13px/1.5 Consolas, monospace; }
    .actions { display:flex; gap:10px; flex-wrap:wrap; padding:14px 18px; border-top:1px solid var(--line); background:#fbfdff; }
    .button { appearance:none; border:1px solid #cbd5e1; border-radius:7px; background:#fff; color:var(--ink); padding:8px 11px; font:700 13px Arial, sans-serif; cursor:pointer; text-decoration:none; }
    .button.primary { background:#1f2937; border-color:#1f2937; color:#fff; }
    .note { color:var(--muted); padding:0 18px 14px; }
    .empty { background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:24px; }
    .warning { color:#9a3412; }
    @media (max-width:800px) { .columns { grid-template-columns:1fr; } .pane + .pane { border-left:0; border-top:1px solid var(--line); } }
  </style>
</head>
<body>
  <header>
    <h1>Golden Collections Support Inbox</h1>
    <div class="meta">
      <span>Status: ${escapeHtml(status)}</span>
      <span>Drafts: ${drafts.length}</span>
      <span>Email connected: ${emailConfig.configured ? "yes" : "no"}</span>
      <span>Sending enabled: <strong class="warning">${emailConfig.sendEnabled && !emailConfig.dryRun ? "yes" : "no"}</strong></span>
    </div>
  </header>
  <main>${cards}</main>
  <script>
    document.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-copy-target]");
      if (!button) return;
      const target = document.querySelector(button.getAttribute("data-copy-target"));
      if (!target) return;
      await navigator.clipboard.writeText(target.innerText);
      const oldText = button.innerText;
      button.innerText = "Copied";
      setTimeout(() => { button.innerText = oldText; }, 1400);
    });
  </script>
</body>
</html>`;
}

function renderDashboard(dashboard, { token = "" } = {}) {
  const attention = dashboard.attention.length
    ? dashboard.attention.map(renderAttentionItem).join("")
    : `<li class="attention-item calm"><strong>No urgent action.</strong><span>The automation desk looks calm right now.</span></li>`;
  const priorityEmails = dashboard.priority_emails.length
    ? dashboard.priority_emails.map((email) => renderPriorityEmail(email, { token })).join("")
    : `<tr><td colspan="6">No support email drafts need review.</td></tr>`;
  const contextRows = dashboard.recent_context.length
    ? dashboard.recent_context.map(renderContextRow).join("")
    : `<li>No recent context in this window.</li>`;
  const tokenQuery = token ? `token=${encodeURIComponent(token)}&` : "";
  const inboxUrl = `?view=inbox&status=needs_review${token ? `&token=${encodeURIComponent(token)}` : ""}`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Golden Collections Automation Dashboard</title>
  <style>
    :root {
      color-scheme: light;
      --bg:#f4f6f8; --panel:#ffffff; --panel-2:#f9fafb; --ink:#17212b; --muted:#64748b; --line:#d8dee8;
      --green:#0f766e; --blue:#2563eb; --amber:#b45309; --red:#b91c1c; --shadow:0 12px 28px rgba(15,23,42,.08);
    }
    * { box-sizing:border-box; }
    body { margin:0; font:14px/1.5 Arial, sans-serif; color:var(--ink); background:var(--bg); }
    header { background:var(--panel); border-bottom:1px solid var(--line); padding:20px 24px; position:sticky; top:0; z-index:2; }
    .shell { max-width:1240px; margin:0 auto; }
    .top { display:flex; justify-content:space-between; gap:16px; align-items:flex-start; }
    h1 { margin:0; font-size:24px; letter-spacing:0; }
    .sub { color:var(--muted); margin-top:4px; }
    .verdict { padding:10px 14px; border-radius:8px; border:1px solid var(--line); background:var(--panel-2); font-weight:700; white-space:nowrap; }
    main { max-width:1240px; margin:0 auto; padding:22px 24px 40px; }
    .grid { display:grid; grid-template-columns:1.2fr .8fr; gap:16px; align-items:start; }
    .cards { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:12px; margin-bottom:16px; }
    .card, .panel { background:var(--panel); border:1px solid var(--line); border-radius:8px; box-shadow:var(--shadow); }
    .card { padding:14px; min-height:104px; }
    .label { color:var(--muted); font-size:12px; text-transform:uppercase; letter-spacing:.04em; }
    .metric { font-size:28px; font-weight:800; margin-top:6px; }
    .hint { color:var(--muted); margin-top:4px; font-size:13px; }
    .panel { margin-bottom:16px; overflow:hidden; }
    .panel h2 { margin:0; padding:14px 16px; font-size:16px; border-bottom:1px solid var(--line); }
    .panel-body { padding:14px 16px; }
    .attention-list, .timeline { list-style:none; margin:0; padding:0; display:grid; gap:10px; }
    .attention-item { border:1px solid var(--line); border-left-width:5px; border-radius:8px; padding:10px 12px; display:grid; gap:3px; background:#fff; }
    .attention-item span { color:var(--muted); }
    .severity-critical { border-left-color:var(--red); }
    .severity-high { border-left-color:var(--amber); }
    .severity-medium { border-left-color:var(--blue); }
    .calm { border-left-color:var(--green); }
    table { width:100%; border-collapse:collapse; }
    th, td { text-align:left; padding:10px 12px; border-bottom:1px solid var(--line); vertical-align:top; }
    th { color:var(--muted); font-size:12px; text-transform:uppercase; letter-spacing:.04em; background:var(--panel-2); }
    .pill { display:inline-block; border:1px solid var(--line); border-radius:999px; padding:2px 8px; font-size:12px; background:#fff; }
    .pill-urgent { color:var(--red); border-color:#fecaca; background:#fff5f5; }
    .pill-high { color:var(--amber); border-color:#fed7aa; background:#fff7ed; }
    .status { display:grid; grid-template-columns:1fr auto; gap:8px; padding:8px 0; border-bottom:1px solid var(--line); }
    .status:last-child { border-bottom:0; }
    .ok { color:var(--green); font-weight:700; }
    .warn { color:var(--amber); font-weight:700; }
    .stop { color:var(--red); font-weight:700; }
    .timeline li { border-bottom:1px solid var(--line); padding-bottom:9px; }
    .timeline li:last-child { border-bottom:0; padding-bottom:0; }
    .actions { display:grid; gap:10px; }
    .button { display:inline-flex; align-items:center; justify-content:center; border:1px solid #cbd5e1; border-radius:7px; background:#fff; color:var(--ink); padding:9px 11px; font:700 13px Arial, sans-serif; cursor:pointer; text-decoration:none; min-height:38px; }
    .button.primary { background:#1f2937; border-color:#1f2937; color:#fff; }
    .button.disabled { color:#94a3b8; background:#f8fafc; cursor:not-allowed; }
    form { margin:0; }
    .time { color:var(--muted); font-size:12px; }
    .type { font-weight:700; }
    a { color:var(--blue); text-decoration:none; }
    @media (max-width:960px) { .grid, .cards { grid-template-columns:1fr; } .top { display:block; } .verdict { display:inline-block; margin-top:12px; } }
  </style>
</head>
<body>
  <header>
    <div class="shell top">
      <div>
        <h1>Golden Collections Automation Dashboard</h1>
        <div class="sub">Generated ${escapeHtml(formatDate(dashboard.generated_at))}. Window: last ${dashboard.window_days} days.</div>
      </div>
      <div class="verdict">${escapeHtml(dashboard.verdict)}</div>
    </div>
  </header>
  <main>
    <section class="cards">
      ${renderMetricCard("Today Emails", dashboard.today.support_emails, `${dashboard.today.support_drafts_needing_review} drafts need review`)}
      ${renderMetricCard("WhatsApp Replies", dashboard.today.whatsapp_replies, `${dashboard.period.whatsapp.complaint_like_replies} complaint-like in window`)}
      ${renderMetricCard("Orders Recovered", dashboard.today.orders_recovered, `${dashboard.period.whatsapp.ordered} in ${dashboard.window_days} days`)}
      ${renderMetricCard("Shipments", dashboard.today.shipments, `${dashboard.period.shipments.india_post_links} India Post links captured`)}
    </section>
    <section class="grid">
      <div>
        <section class="panel">
          <h2>Needs Your Attention</h2>
          <div class="panel-body"><ul class="attention-list">${attention}</ul></div>
        </section>
        <section class="panel">
          <h2>Priority Support Emails</h2>
          <table>
            <thead><tr><th>Priority</th><th>From</th><th>Subject</th><th>Type</th><th>Received</th><th>Action</th></tr></thead>
            <tbody>${priorityEmails}</tbody>
          </table>
        </section>
      </div>
      <aside>
        <section class="panel">
          <h2>Automation Status</h2>
          <div class="panel-body">
            ${renderStatus("WhatsApp live sending", dashboard.safety.whatsapp_automation_enabled && !dashboard.safety.whatsapp_dry_run)}
            ${renderStatus("Support email ingest", dashboard.safety.support_email_configured && dashboard.safety.support_email_automation_enabled)}
            ${renderStatus("Support email live sending", dashboard.safety.support_email_send_enabled && !dashboard.safety.support_email_dry_run)}
            ${renderStatus("Review request table", !dashboard.period.review_requests.unavailable)}
          </div>
        </section>
        <section class="panel">
          <h2>Daily Brief</h2>
          <div class="panel-body">
            <p>${escapeHtml(buildDailyBriefText(dashboard))}</p>
            <p><a href="${inboxUrl}">Open support inbox drafts</a></p>
          </div>
        </section>
        <section class="panel">
          <h2>Actions</h2>
          <div class="panel-body actions">
            <a class="button primary" href="/api/cron/ingest-support-email?${tokenQuery}redirect=dashboard">Check support email now</a>
            <a class="button" href="/api/cron/process-abandoned-checkouts?${tokenQuery}redirect=dashboard">Process checkout messages now</a>
            ${dashboard.period.review_requests.unavailable
              ? `<span class="button disabled">Review requests need setup</span>`
              : `<a class="button" href="/api/cron/process-review-requests?${tokenQuery}redirect=dashboard">Process review requests now</a>`}
            <a class="button" href="${inboxUrl}">Review email drafts</a>
          </div>
        </section>
        <section class="panel">
          <h2>Recent Context</h2>
          <div class="panel-body"><ul class="timeline">${contextRows}</ul></div>
        </section>
      </aside>
    </section>
  </main>
</body>
</html>`;
}

function renderMetricCard(label, value, hint) {
  return `<article class="card"><div class="label">${escapeHtml(label)}</div><div class="metric">${escapeHtml(value)}</div><div class="hint">${escapeHtml(hint)}</div></article>`;
}

function renderAttentionItem(item) {
  return `<li class="attention-item severity-${escapeHtml(item.severity)}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.action)}</span></li>`;
}

function renderPriorityEmail(email, { token = "" } = {}) {
  const pillClass = email.priority === "Urgent" ? "pill-urgent" : email.priority === "High" ? "pill-high" : "";
  const href = `?view=inbox&status=needs_review${token ? `&token=${encodeURIComponent(token)}` : ""}#draft-${encodeURIComponent(email.id)}`;
  return `<tr>
    <td><span class="pill ${pillClass}">${escapeHtml(email.priority)}</span></td>
    <td>${escapeHtml(email.from)}</td>
    <td>${escapeHtml(email.subject)}</td>
    <td>${escapeHtml(email.classification)}</td>
    <td>${escapeHtml(formatDate(email.received_at || email.created_at))}</td>
    <td><a href="${href}">Open</a></td>
  </tr>`;
}

function renderStatus(label, enabled) {
  return `<div class="status"><span>${escapeHtml(label)}</span><strong class="${enabled ? "ok" : "warn"}">${enabled ? "Active" : "Needs action"}</strong></div>`;
}

function renderContextRow(row) {
  return `<li><div><span class="type">${escapeHtml(row.type)}</span> <span class="time">${escapeHtml(formatDate(row.at))}</span></div><div>${escapeHtml(row.text)}</div></li>`;
}

function buildDailyBriefText(dashboard) {
  const parts = [
    `${dashboard.today.support_emails} customer email${plural(dashboard.today.support_emails)} came in today`,
    `${dashboard.today.support_drafts_needing_review} draft${plural(dashboard.today.support_drafts_needing_review)} need${dashboard.today.support_drafts_needing_review === 1 ? "s" : ""} review`,
    `${dashboard.today.whatsapp_replies} WhatsApp repl${dashboard.today.whatsapp_replies === 1 ? "y" : "ies"}`,
    `${dashboard.today.orders_recovered} recovered order${plural(dashboard.today.orders_recovered)}`,
  ];
  if (!dashboard.safety.support_email_send_enabled || dashboard.safety.support_email_dry_run) {
    parts.push("email sending is still manual");
  }
  if (!dashboard.safety.whatsapp_automation_enabled || dashboard.safety.whatsapp_dry_run) {
    parts.push("WhatsApp live send is still off or dry-run");
  }
  return `${parts.join(", ")}.`;
}

function renderDraftCard(draft, { emailConfig, token = "" } = {}) {
  const message = draft.support_email_messages || {};
  const original = truncate(message.plain_text || "", 2500);
  const replyId = `reply-${draft.id}`;
  const canSend = emailConfig.sendEnabled && !emailConfig.dryRun;
  const actionUrl = `/api/email/approve-send?redirect=inbox${token ? `&token=${encodeURIComponent(token)}` : ""}`;
  return `<section class="card" id="draft-${escapeHtml(draft.id)}">
    <div class="card-head">
      <div class="subject">${escapeHtml(draft.draft_subject)}</div>
      <div class="meta">
        <span>From: ${escapeHtml(message.from_name || message.from_email || "Unknown")}</span>
        <span>To: ${escapeHtml(draft.to_email)}</span>
        <span>Received: ${escapeHtml(formatDate(message.received_at))}</span>
      </div>
      <div class="chips">
        <span class="chip">${escapeHtml(draft.status)}</span>
        <span class="chip">${escapeHtml(draft.classification)}</span>
        <span class="chip">${escapeHtml(draft.id)}</span>
      </div>
    </div>
    <div class="columns">
      <div class="pane">
        <h2>Customer Email</h2>
        <pre>${escapeHtml(original || "No plain-text body available.")}</pre>
      </div>
      <div class="pane">
        <h2>Draft Reply</h2>
        <pre id="${escapeHtml(replyId)}">${escapeHtml(ensureSupportEmailSignature(draft.draft_body || ""))}</pre>
      </div>
    </div>
    <div class="actions">
      <button class="button" type="button" data-copy-target="#${escapeHtml(replyId)}">Copy draft reply</button>
      <a class="button" href="mailto:${escapeHtml(draft.to_email)}?subject=${encodeURIComponent(draft.draft_subject)}">Open email app</a>
      ${canSend
        ? `<form method="post" action="${actionUrl}">
            <input type="hidden" name="draft_id" value="${escapeHtml(draft.id)}">
            <input type="hidden" name="approved_by" value="dashboard">
            <input type="hidden" name="require_live" value="true">
            <button class="button primary" type="submit">Approve and send</button>
          </form>`
        : `<span class="note">Live sending is off, so review/copy this reply and send manually for now.</span>`}
    </div>
  </section>`;
}

function renderError(error) {
  return `<!doctype html><html><body><h1>Support inbox error</h1><pre>${escapeHtml(error.message)}</pre></body></html>`;
}

function sendHtml(res, statusCode, html) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(html);
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    const value = row[key] || "unknown";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function severityRank(severity) {
  return { critical: 3, high: 2, medium: 1 }[severity] || 0;
}

function plural(count) {
  return count === 1 ? "" : "s";
}

function isMissingTableError(error) {
  return Boolean(error?.message && /review_requests|schema cache|could not find the table/i.test(error.message));
}

const complaintPattern = /\b(complaint|bad|wrong|damaged|broken|refund|return|angry|not happy|poor|issue|problem)\b/i;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(value, max) {
  const text = String(value || "").trim();
  return text.length > max ? `${text.slice(0, max)}\n\n[truncated]` : text;
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
}
