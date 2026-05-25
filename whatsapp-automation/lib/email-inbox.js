import { supabase } from "./supabase.js";

export async function listSupportEmailDrafts({ status = "needs_review", limit = 25 } = {}) {
  const query = supabase()
    .from("support_email_drafts")
    .select(`
      id,
      status,
      classification,
      to_email,
      draft_subject,
      draft_body,
      created_at,
      approved_at,
      sent_at,
      last_error,
      support_email_messages (
        id,
        from_email,
        from_name,
        subject,
        received_at,
        plain_text,
        status
      )
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status !== "all") query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
