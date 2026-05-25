import { isCronAuthorized } from "../../lib/auth.js";
import { getConfig } from "../../lib/config.js";
import { sendJson, readRawBody } from "../../lib/http.js";
import { processDueReviewRequests, suppressReviewRequest } from "../../lib/review-requests.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
  const config = getConfig();
  if (!isCronAuthorized(req, config)) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }

  if (req.method === "POST") {
    const rawBody = await readRawBody(req);
    if (rawBody.length) {
      let payload;
      try {
        payload = JSON.parse(rawBody.toString("utf8"));
      } catch {
        return sendJson(res, 400, { error: "Body must be valid JSON" });
      }
      if (payload.action === "suppress") {
        try {
          const rows = await suppressReviewRequest(payload);
          return sendJson(res, 200, { ok: true, suppressed: rows.length, rows });
        } catch (error) {
          return sendJson(res, error.statusCode || 500, { error: error.message });
        }
      }
    }
  }

  const now = new Date().toISOString();
  let results;
  try {
    results = await processDueReviewRequests(config, now);
  } catch (error) {
    return sendJson(res, 500, { error: error.message });
  }

  return respondAfterAction(req, res, { ok: true, processed: results.length, results });
}

function respondAfterAction(req, res, body) {
  const url = new URL(req.url, "https://goldencollections.local");
  if (url.searchParams.get("redirect") === "dashboard") {
    const token = url.searchParams.get("token");
    res.statusCode = 303;
    res.setHeader("Location", `/api/monitor/support-inbox?view=dashboard&days=7${token ? `&token=${encodeURIComponent(token)}` : ""}`);
    res.end();
    return;
  }
  return sendJson(res, 200, body);
}
