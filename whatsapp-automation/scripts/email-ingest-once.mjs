import { classifyEmail, draftReply, shouldIgnoreEmail } from "../lib/email-classify.js";
import { getEmailConfig } from "../lib/email-config.js";
import { fetchRecentSupportEmails } from "../lib/email-imap.js";
import { supabase } from "../lib/supabase.js";
import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();

const apply = process.argv.includes("--apply");
const config = getEmailConfig({ requireMailbox: true });
const messages = await fetchRecentSupportEmails(config);
const results = [];

for (const message of messages) {
  const ignored = shouldIgnoreEmail(message);
  if (ignored.ignore) {
    results.push({ provider_message_id: message.provider_message_id, from: message.from_email, subject: message.subject, skipped: ignored.reason });
    continue;
  }

  const classification = classifyEmail({ subject: message.subject, text: message.plain_text });
  const draft = draftReply({ fromName: message.from_name, classification, subject: message.subject });

  if (!apply) {
    results.push({ provider_message_id: message.provider_message_id, from: message.from_email, subject: message.subject, classification, draft_subject: draft.subject });
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

  const { data: inserted, error } = await supabase()
    .from("support_email_messages")
    .insert({ ...message, classification, status: "new" })
    .select("id,from_email,from_name,subject,classification")
    .single();
  if (error) throw error;

  await supabase()
    .from("support_email_drafts")
    .insert({
      message_id: inserted.id,
      to_email: inserted.from_email,
      draft_subject: draft.subject,
      draft_body: draft.body,
      status: "needs_review",
      classification,
    });

  results.push({ id: inserted.id, provider_message_id: message.provider_message_id, classification, draft: "needs_review" });
}

console.log(JSON.stringify({ apply, fetched: messages.length, results }, null, 2));
