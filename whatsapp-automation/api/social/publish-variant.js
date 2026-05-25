import { isCronAuthorized } from "../../lib/auth.js";
import { requireEnv } from "../../lib/config.js";
import { sendJson, readRawBody } from "../../lib/http.js";
import { publishVariant } from "../../lib/social-command-center.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { ok: false, error: "Method not allowed" });

  const config = { cronSecret: requireEnv("CRON_SECRET") };
  if (!isCronAuthorized(req, config)) return sendJson(res, 401, { ok: false, error: "Unauthorized" });

  try {
    const contentType = req.headers["content-type"] || "";
    const raw = (await readRawBody(req)).toString("utf8");
    const body = contentType.includes("application/json")
      ? JSON.parse(raw || "{}")
      : Object.fromEntries(new URLSearchParams(raw));
    const result = await publishVariant({
      variantId: body.variant_id,
      actor: body.actor || "owner",
      youtubePrivacyStatus: body.youtube_privacy_status,
      pinterestBoardId: body.pinterest_board_id,
      pinterestBoardName: body.pinterest_board_name,
      instagramMediaType: body.instagram_media_type,
      instagramAccountId: body.instagram_account_id,
      instagramUsername: body.instagram_username,
      facebookPostType: body.facebook_post_type,
    });

    if (body.redirect) {
      res.statusCode = 303;
      res.setHeader("Location", body.redirect);
      res.end();
      return;
    }

    return sendJson(res, result.ok ? 200 : 409, result);
  } catch (error) {
    return sendJson(res, 500, { ok: false, error: error.message });
  }
}
