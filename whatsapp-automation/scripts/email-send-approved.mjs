import { ensureSupportEmailSignature } from "../lib/email-classify.js";
import { getEmailConfig } from "../lib/email-config.js";
import { sendSupportEmail } from "../lib/email-smtp.js";
import { supabase } from "../lib/supabase.js";
import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();

const draftId = process.argv[2];
const confirm = process.argv.includes("--confirm-send");
if (!draftId) throw new Error("Usage: node scripts/email-send-approved.mjs <draft_id> --confirm-send");
if (!confirm) throw new Error("Refusing to send without --confirm-send");

const config = getEmailConfig({ requireMailbox: true });
if (!config.sendEnabled || config.dryRun) {
  throw new Error("Refusing to send while SUPPORT_EMAIL_SEND_ENABLED is not true or SUPPORT_EMAIL_DRY_RUN is not false.");
}

const { data: draft, error: draftError } = await supabase()
  .from("support_email_drafts")
  .select("*")
  .eq("id", draftId)
  .single();
if (draftError) throw draftError;
if (draft.status !== "approved") throw new Error(`Draft status must be approved, got ${draft.status}`);

const { data: message, error: messageError } = await supabase()
  .from("support_email_messages")
  .select("*")
  .eq("id", draft.message_id)
  .single();
if (messageError) throw messageError;

const sent = await sendSupportEmail(config, {
  to: draft.to_email,
  subject: draft.draft_subject,
  text: ensureSupportEmailSignature(draft.draft_body),
  inReplyTo: message.message_id,
  references: message.thread_key,
});

await supabase()
  .from("support_email_drafts")
  .update({ status: "sent", sent_at: new Date().toISOString(), smtp_message_id: sent.messageId || null, last_error: null })
  .eq("id", draftId);

console.log(JSON.stringify({ sent: true, draft_id: draftId, smtp_message_id: sent.messageId || null }, null, 2));
