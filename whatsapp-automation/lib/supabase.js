import { createClient } from "@supabase/supabase-js";
import { getConfig } from "./config.js";

let client;

export function supabase() {
  if (!client) {
    const config = getConfig();
    client = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: { persistSession: false }
    });
  }
  return client;
}
