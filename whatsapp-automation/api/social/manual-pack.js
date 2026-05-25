import { isCronAuthorized } from "../../lib/auth.js";
import { requireEnv } from "../../lib/config.js";
import { sendJson } from "../../lib/http.js";
import { getVariantManualPack } from "../../lib/social-command-center.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return sendJson(res, 405, { ok: false, error: "Method not allowed" });

  const config = { cronSecret: requireEnv("CRON_SECRET") };
  if (!isCronAuthorized(req, config)) return sendJson(res, 401, { ok: false, error: "Unauthorized" });

  try {
    const url = new URL(req.url, "https://goldencollections.local");
    const variantId = url.searchParams.get("variant_id");
    if (!variantId) throw new Error("Missing variant_id");
    const result = await getVariantManualPack({ variantId });
    const format = url.searchParams.get("format") || "text";
    if (format === "json") return sendJson(res, 200, { ok: true, ...result });

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end(result.manual_pack);
  } catch (error) {
    return sendJson(res, 500, { ok: false, error: error.message });
  }
}
