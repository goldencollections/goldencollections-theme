import { loadLocalEnv } from "./load-local-env.mjs";
import { inferPlatformConnections, getSocialSafety } from "../lib/social-command-center.js";

loadLocalEnv();

const rows = inferPlatformConnections();

console.log(JSON.stringify({
  ok: true,
  generated_at: new Date().toISOString(),
  safety: getSocialSafety(),
  connections: rows.map((row) => ({
    platform: row.platform,
    connection_status: row.connection_status,
    publishing_status: row.publishing_status,
    can_publish_now: row.can_publish_now,
    blocker: row.blocker,
    next_action: row.next_action,
  })),
}, null, 2));
