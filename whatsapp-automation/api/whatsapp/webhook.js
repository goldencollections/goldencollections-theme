import { getConfig } from "../../lib/config.js";
import { sendJson, readRawBody } from "../../lib/http.js";
import { normalizePhone } from "../../lib/phone.js";
import { verifyMetaSignature } from "../../lib/signatures.js";
import { supabase } from "../../lib/supabase.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const url = new URL(req.url, "https://goldencollections.local");
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === getConfig().whatsappVerifyToken && challenge) {
      res.statusCode = 200;
      res.end(challenge);
      return;
    }
    return sendJson(res, 403, { error: "Forbidden" });
  }

  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });

  const rawBody = await readRawBody(req);
  if (!verifyMetaSignature(rawBody, req.headers["x-hub-signature-256"])) {
    return sendJson(res, 401, { error: "Invalid Meta signature" });
  }

  const payload = JSON.parse(rawBody.toString("utf8") || "{}");
  const events = extractMessageEvents(payload);
  const now = new Date().toISOString();

  for (const event of events) {
    await supabase().from("whatsapp_events").insert({
      event_type: event.type,
      phone: event.phone,
      wa_message_id: event.messageId,
      payload: event.raw
    });

    if (event.phone && event.type === "inbound_message") {
      const text = event.text || "";
      if (/^\s*(stop|unsubscribe|opt\s*out)\s*$/i.test(text)) {
        await supabase().from("whatsapp_opt_outs").upsert({
          phone: event.phone,
          opted_out_at: now,
          source: "whatsapp_reply",
          raw_text: text
        });
        await supabase()
          .from("checkout_automations")
          .update({ status: "opted_out", opt_out_at: now, cancelled_at: now })
          .eq("phone", event.phone)
          .in("status", ["pending", "dry_run", "error"]);
      } else {
        await supabase()
          .from("checkout_automations")
          .update({ status: "human_handoff", replied_at: now, cancelled_at: now })
          .eq("phone", event.phone)
          .in("status", ["pending", "dry_run", "error", "sent"]);
      }
    }
  }

  return sendJson(res, 200, { ok: true, events: events.length });
}

function extractMessageEvents(payload) {
  const out = [];
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      for (const message of value.messages || []) {
        out.push({
          type: "inbound_message",
          phone: normalizePhone(message.from),
          messageId: message.id,
          text: message.text?.body || "",
          raw: message
        });
      }
      for (const status of value.statuses || []) {
        out.push({
          type: `message_${status.status || "status"}`,
          phone: normalizePhone(status.recipient_id),
          messageId: status.id,
          raw: status
        });
      }
    }
  }
  return out;
}
