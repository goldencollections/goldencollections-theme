import { inspectMetaPublishingConnection, readMetaPublishingHealth } from "../lib/meta-publisher.js";
import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();

try {
  const report = await inspectMetaPublishingConnection();
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.log(JSON.stringify({
    ok: false,
    checked_at: new Date().toISOString(),
    health: readMetaPublishingHealth(),
    error: error.message,
  }, null, 2));
  process.exitCode = 1;
}
