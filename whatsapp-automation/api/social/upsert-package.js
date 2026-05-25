import { isCronAuthorized } from "../../lib/auth.js";
import { requireEnv } from "../../lib/config.js";
import { sendJson, readRawBody } from "../../lib/http.js";
import { logSocialEvent } from "../../lib/social-command-center.js";
import { supabase } from "../../lib/supabase.js";

export default async function handler(req, res) {
  if (!["POST", "PUT"].includes(req.method)) return sendJson(res, 405, { ok: false, error: "Method not allowed" });

  const config = { cronSecret: requireEnv("CRON_SECRET") };
  if (!isCronAuthorized(req, config)) return sendJson(res, 401, { ok: false, error: "Unauthorized" });

  try {
    const body = JSON.parse((await readRawBody(req)).toString("utf8") || "{}");
    const result = await upsertPackage(body);
    return sendJson(res, 200, { ok: true, ...result });
  } catch (error) {
    return sendJson(res, 500, { ok: false, error: error.message });
  }
}

async function upsertPackage(body) {
  if (!body.title) throw new Error("Missing title");
  const variants = Array.isArray(body.variants) ? body.variants : [];
  const db = supabase();

  let existingId = body.id || null;
  if (!existingId && body.source_ref) {
    const existing = await db
      .from("social_post_packages")
      .select("id")
      .eq("source_ref", body.source_ref)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing.error && existing.error.code !== "PGRST116") throw existing.error;
    existingId = existing.data?.id || null;
  }

  const packagePayload = {
    title: body.title,
    source_type: body.source_type || "hermes",
    source_ref: body.source_ref || null,
    source_url: body.source_url || null,
    destination_url: body.destination_url || null,
    status: body.status || "draft_ready",
    priority_score: Number(body.priority_score || 0),
    why_now: body.why_now || null,
    approval_notes: body.approval_notes || null,
    created_by: body.created_by || "hermes",
    metadata: body.metadata || {},
  };

  const packageResult = existingId
    ? await db.from("social_post_packages").update(packagePayload).eq("id", existingId).select("id").single()
    : await db.from("social_post_packages").insert(packagePayload).select("id").single();
  if (packageResult.error) throw packageResult.error;

  const packageId = packageResult.data.id;
  if (variants.length) {
    if (existingId) {
      const deleteResult = await db.from("social_post_variants").delete().eq("package_id", packageId);
      if (deleteResult.error) throw deleteResult.error;
    }

    const rows = variants.map((variant) => ({
      package_id: packageId,
      platform: requireField(variant, "platform"),
      status: variant.status || "draft_ready",
      caption: variant.caption || "",
      hashtags: Array.isArray(variant.hashtags) ? variant.hashtags : [],
      destination_url: variant.destination_url || body.destination_url || null,
      asset_url: variant.asset_url || null,
      asset_type: variant.asset_type || null,
      manual_pack: variant.manual_pack || null,
      metadata: variant.metadata || {},
    }));
    const variantResult = await db.from("social_post_variants").insert(rows);
    if (variantResult.error) throw variantResult.error;
  }

  await logSocialEvent({
    package_id: packageId,
    event_type: existingId ? "package_updated" : "package_created",
    actor: body.created_by || "hermes",
    payload: { source_ref: body.source_ref || null, variants: variants.length },
  });

  return { id: packageId, created: !existingId, variants: variants.length };
}

function requireField(row, key) {
  if (!row?.[key]) throw new Error(`Missing variant ${key}`);
  return row[key];
}
