import { isCronAuthorized } from "../../lib/auth.js";
import { requireEnv } from "../../lib/config.js";
import { sendJson } from "../../lib/http.js";
import { listPlatformConnections, listPostPackages, toHermesSummary } from "../../lib/social-command-center.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return sendJson(res, 405, { ok: false, error: "Method not allowed" });

  const config = { cronSecret: requireEnv("CRON_SECRET") };
  if (!isCronAuthorized(req, config)) return sendJson(res, 401, { ok: false, error: "Unauthorized" });

  try {
    const url = new URL(req.url, "https://goldencollections.local");
    const refresh = url.searchParams.get("refresh") === "1";
    const [connections, packages] = await Promise.all([
      listPlatformConnections({ refresh }),
      listPostPackages({ limit: 30 }),
    ]);
    return sendJson(res, 200, toHermesSummary({ connections, packages }));
  } catch (error) {
    return sendJson(res, 500, { ok: false, error: error.message });
  }
}
