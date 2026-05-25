import { supabase } from "../lib/supabase.js";
import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();

const status = process.argv[2] || "needs_review";
const { data, error } = await supabase()
  .from("support_email_drafts")
  .select("id,status,classification,to_email,draft_subject,created_at,last_error")
  .eq("status", status)
  .order("created_at", { ascending: false })
  .limit(25);

if (error) throw error;

console.log(JSON.stringify({ status, count: data.length, drafts: data }, null, 2));
