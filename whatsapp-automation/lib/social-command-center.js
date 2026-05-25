import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { supabase } from "./supabase.js";
import { publishMetaVariant, readMetaPublishingHealth } from "./meta-publisher.js";
import { publishPinterestVariant } from "./pinterest-publisher.js";
import { normalizePrivacyStatus, uploadYouTubeVariant } from "./youtube-publisher.js";

const PACKAGE_SELECT = `
  id,title,source_type,source_ref,source_url,destination_url,status,priority_score,why_now,
  approval_notes,created_by,approved_by,approved_at,held_reason,publish_after,metadata,created_at,updated_at,
  social_post_variants(
    id,package_id,platform,status,caption,hashtags,destination_url,asset_url,asset_type,manual_pack,
    publish_result_url,last_error,owner_approved_at,published_at,metadata,created_at,updated_at
  )
`;
const LOCAL_SOCIAL_STORE_PATH = path.join(process.cwd(), "tmp", "social-command-center-local.json");
const IMG3289_SOURCE_REF = "golden-collections-img3289-final-posting-plan-2026-05-20";
const MAIN_INSTAGRAM_USERNAME = "goldencollections_gbs";
const DEITY_INSTAGRAM_USERNAME = "deity_jewellery";

export const SOCIAL_STATUSES = [
  "connected",
  "needs_auth",
  "token_expired",
  "permission_missing",
  "api_access_pending",
  "quota_or_credits_blocked",
  "owner_approval_required",
  "dry_run_only",
  "ready_to_publish",
  "failed_last_publish",
];

export function getSocialSafety() {
  return {
    live_publishing_enabled: process.env.SOCIAL_LIVE_PUBLISHING_ENABLED === "true",
    require_owner_approval: process.env.SOCIAL_REQUIRE_OWNER_APPROVAL !== "false",
    dry_run: process.env.SOCIAL_DRY_RUN !== "false",
    hermes_publish_allowed: process.env.HERMES_SOCIAL_PUBLISH_ALLOWED === "true",
    pinterest_board_publishing_enabled: process.env.PINTEREST_BOARD_PUBLISHING_ENABLED === "true",
    youtube_board_publishing_enabled: process.env.YOUTUBE_BOARD_PUBLISHING_ENABLED === "true",
    youtube_review_uploads_enabled: process.env.YOUTUBE_REVIEW_UPLOADS_ENABLED === "true",
    facebook_page_publishing_enabled: process.env.FACEBOOK_PAGE_PUBLISHING_ENABLED === "true",
    instagram_publishing_enabled: process.env.INSTAGRAM_PUBLISHING_ENABLED === "true",
  };
}

export function inferPlatformConnections(now = new Date()) {
  const safety = getSocialSafety();
  const liveBlocked = !safety.live_publishing_enabled || safety.dry_run;
  const ts = now.toISOString();
  const youtubeConnected = hasAnyEnv(["YOUTUBE_CLIENT_ID", "GOOGLE_GBP_CLIENT_ID"]);
  const youtubeToken = readTokenHealth("youtube-token.json", now);
  const pinterestConnected = hasAnyEnv(["PINTEREST_APP_ID", "PINTEREST_CLIENT_ID"]);
  const pinterestToken = readTokenHealth("pinterest-token.json", now);
  const pinterestApproved = process.env.PINTEREST_STANDARD_ACCESS_APPROVED === "true";
  const gbpConnected = hasAnyEnv(["GOOGLE_GBP_CLIENT_ID"]);
  const gbpToken = readTokenHealth("google-gbp-token.json", now);
  const gbpApproved = process.env.GOOGLE_GBP_API_APPROVED === "true";
  const metaHealth = readMetaPublishingHealth(now);
  const metaConnected = metaHealth.connected || hasAnyEnv(["META_ACCESS_TOKEN", "INSTAGRAM_ACCESS_TOKEN", "FACEBOOK_PAGE_ACCESS_TOKEN", "WHATSAPP_ACCESS_TOKEN"]);
  const metaPublishingEnabled = process.env.META_CONTENT_PUBLISHING_ENABLED === "true";
  const threadsConnected = hasAnyEnv(["THREADS_ACCESS_TOKEN", "META_ACCESS_TOKEN"]);
  const threadsEnabled = process.env.THREADS_PUBLISHING_ENABLED === "true";
  const xConnected = process.env.HERMES_X_ENABLED === "true";
  const xCreditsAvailable = process.env.X_API_CREDITS_AVAILABLE === "true";
  const xWriteEnabled = ["owner_approved", "autonomous"].includes(process.env.HERMES_X_PUBLIC_WRITE_MODE || "");
  const whatsappConnected = hasAnyEnv(["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"]);

  const rows = [
    {
      platform: "youtube",
      display_name: "YouTube",
      connection_status: youtubeConnected ? (youtubeToken.expired ? "token_expired" : "connected") : "needs_auth",
      publishing_status: youtubeConnected
        ? youtubeToken.expired
          ? "token_expired"
          : process.env.YOUTUBE_EXPECTED_CHANNEL_VERIFIED === "false"
            ? "permission_missing"
          : liveBlocked ? "owner_approval_required" : "ready_to_publish"
        : "needs_auth",
      can_publish_now: youtubeConnected && !youtubeToken.expired && process.env.YOUTUBE_EXPECTED_CHANNEL_VERIFIED !== "false",
      issue_owner: "owner",
      blocker: youtubeConnected
        ? youtubeToken.expired
          ? "YouTube OAuth token is expired or revoked."
          : process.env.YOUTUBE_EXPECTED_CHANNEL_VERIFIED === "false"
            ? "Connected YouTube account has not been verified against the expected Golden Collections channel."
          : liveBlocked && !safety.youtube_board_publishing_enabled && !safety.youtube_review_uploads_enabled
            ? "Board upload is connected, but posting is still in dry-run/live-off mode."
            : null
        : "YouTube OAuth/client credentials are not visible to the automation environment.",
      next_action: youtubeConnected
        ? youtubeToken.expired
          ? "Re-authorize YouTube OAuth, then rerun the channel check."
          : safety.youtube_board_publishing_enabled
            ? "Approve the YouTube variant, choose private/unlisted/public visibility, then click Publish."
            : safety.youtube_review_uploads_enabled
              ? "Approve the YouTube variant, choose private or unlisted visibility, then click Publish."
            : "Set YOUTUBE_REVIEW_UPLOADS_ENABLED=true for board-controlled YouTube review uploads."
        : "Add YouTube OAuth credentials and refresh connection status.",
      metadata: {
        known_workflow: "Local YouTube OAuth/upload scripts exist in the root repo.",
        token_status: youtubeToken.status,
        live_gate: "SOCIAL_LIVE_PUBLISHING_ENABLED",
      },
    },
    {
      platform: "pinterest",
      display_name: "Pinterest",
      connection_status: pinterestConnected ? (pinterestToken.expired ? "token_expired" : "connected") : "needs_auth",
      publishing_status: pinterestConnected ? (pinterestApproved ? "owner_approval_required" : "api_access_pending") : "needs_auth",
      can_publish_now: pinterestConnected && pinterestApproved,
      issue_owner: "provider",
      blocker:
        !pinterestConnected
          ? "Pinterest OAuth/app credentials are not visible to the automation environment."
          : pinterestToken.expired
          ? "Pinterest OAuth token is expired or revoked."
          : pinterestApproved
          ? "Owner approval/live gate required before production Pin creation."
          : "Pinterest Standard access needs re-review. Pinterest asked for privacy-policy wording and a demo showing the full OAuth flow plus real Pinterest integration.",
      next_action:
        !pinterestConnected
          ? "Add Pinterest app credentials and refresh connection status."
          : pinterestToken.expired
          ? "Re-authorize Pinterest OAuth, then rerun board/pin checks."
          : pinterestApproved
          ? "Approve exact board, asset, caption, destination URL, then click Publish from the board."
          : "Reply with the updated Privacy Policy link, ask Pinterest to re-enable Trial, then record a new OAuth-to-Pin demo before setting PINTEREST_STANDARD_ACCESS_APPROVED=true.",
      metadata: {
        known_workflow: "Pinterest OAuth, board selection, and board-controlled Pin publishing exist; Standard access is blocked on Pinterest review.",
        token_status: pinterestToken.status,
        access_gate: "PINTEREST_STANDARD_ACCESS_APPROVED",
        review_status: "privacy_policy_updated_2026_05_24_demo_required",
      },
    },
    {
      platform: "google_business_profile",
      display_name: "Google Business Profile",
      connection_status: gbpConnected ? (gbpToken.expired ? "token_expired" : "connected") : "needs_auth",
      publishing_status: gbpConnected
        ? gbpToken.expired
          ? "token_expired"
          : gbpApproved ? "owner_approval_required" : "api_access_pending"
        : "needs_auth",
      can_publish_now: gbpConnected && gbpApproved,
      issue_owner: "provider",
      blocker:
        !gbpConnected
          ? "Google Business Profile OAuth credentials are not visible to the automation environment."
          : gbpToken.expired
          ? "Google Business Profile OAuth token is expired or revoked."
          : gbpApproved
          ? "Owner approval/live gate required before local post creation."
          : "Google Business Profile API access/quota is not marked approved.",
      next_action:
        !gbpConnected
          ? "Add Google Business Profile OAuth credentials and refresh connection status."
          : gbpToken.expired
          ? "Re-authorize Google Business Profile OAuth, then rerun account/location discovery."
          : gbpApproved
          ? "Run account/location check, approve exact post, then publish."
          : "Follow up on Google Business Profile API access/quota, then set GOOGLE_GBP_API_APPROVED=true.",
      metadata: {
        known_workflow: "GBP OAuth and a hardcoded local post publisher exist in the root repo.",
        token_status: gbpToken.status,
        access_gate: "GOOGLE_GBP_API_APPROVED",
      },
    },
    {
      platform: "instagram",
      display_name: "Instagram",
      connection_status: metaConnected ? (metaHealth.publishing_token_status === "expired" ? "token_expired" : "connected") : "needs_auth",
      publishing_status: metaConnected
        ? metaHealth.publishing_token_status === "expired"
          ? "token_expired"
          : metaHealth.instagram_ready && metaPublishingEnabled && safety.instagram_publishing_enabled
            ? "owner_approval_required"
            : "permission_missing"
        : "needs_auth",
      can_publish_now: metaConnected && metaHealth.instagram_ready && metaPublishingEnabled && safety.instagram_publishing_enabled,
      issue_owner: "owner",
      blocker:
        !metaConnected
          ? "Meta/Instagram token is not visible to the automation environment."
          : metaHealth.publishing_token_status === "expired"
          ? "Meta publishing OAuth token is expired."
          : metaHealth.instagram_ready && metaPublishingEnabled && safety.instagram_publishing_enabled
          ? "Owner approval/live gate required before Instagram publishing."
          : "Instagram publishing needs a Meta publishing OAuth token with instagram_basic, instagram_content_publish, pages_show_list, pages_read_engagement, and a linked professional Instagram account.",
      next_action: metaHealth.instagram_ready
        ? "Approve the Instagram variant, confirm media type/caption/asset, then click Publish from the board."
        : "Run Meta publishing OAuth, choose the Golden Collections Page, verify the linked Instagram professional account, then refresh status.",
      metadata: {
        known_workflow: "Meta publishing adapter uses the Instagram content publishing container flow.",
        permission_gate: "META_CONTENT_PUBLISHING_ENABLED",
        platform_gate: "INSTAGRAM_PUBLISHING_ENABLED",
        token_status: metaHealth.publishing_token_status,
        instagram_user_id: metaHealth.instagram_user_id,
        instagram_username: metaHealth.instagram_username,
      },
    },
    {
      platform: "facebook",
      display_name: "Facebook",
      connection_status: metaConnected ? (metaHealth.publishing_token_status === "expired" ? "token_expired" : "connected") : "needs_auth",
      publishing_status: metaConnected
        ? metaHealth.publishing_token_status === "expired"
          ? "token_expired"
          : metaHealth.page_ready && metaPublishingEnabled && safety.facebook_page_publishing_enabled
            ? "owner_approval_required"
            : "permission_missing"
        : "needs_auth",
      can_publish_now: metaConnected && metaHealth.page_ready && metaPublishingEnabled && safety.facebook_page_publishing_enabled,
      issue_owner: "owner",
      blocker:
        !metaConnected
          ? "Meta/Facebook token is not visible to the automation environment."
          : metaHealth.publishing_token_status === "expired"
          ? "Meta publishing OAuth token is expired."
          : metaHealth.page_ready && metaPublishingEnabled && safety.facebook_page_publishing_enabled
          ? "Owner approval/live gate required before Facebook Page publishing."
          : "Facebook Page publishing needs a Meta publishing OAuth token with pages_show_list, pages_read_engagement, and pages_manage_posts.",
      next_action: metaHealth.page_ready
        ? "Approve the Facebook variant, confirm post type/caption/asset, then click Publish from the board."
        : "Run Meta publishing OAuth, choose the Golden Collections Page, then refresh status.",
      metadata: {
        known_workflow: "Shopify sends product catalog to Facebook & Instagram; board posting uses a separate Page publishing adapter.",
        permission_gate: "META_CONTENT_PUBLISHING_ENABLED",
        platform_gate: "FACEBOOK_PAGE_PUBLISHING_ENABLED",
        token_status: metaHealth.publishing_token_status,
        page_id: metaHealth.page_id,
        page_name: metaHealth.page_name,
      },
    },
    {
      platform: "threads",
      display_name: "Threads",
      connection_status: threadsConnected ? "connected" : "needs_auth",
      publishing_status: threadsConnected ? (threadsEnabled ? "owner_approval_required" : "permission_missing") : "needs_auth",
      can_publish_now: threadsConnected && threadsEnabled,
      issue_owner: "owner",
      blocker:
        !threadsConnected
          ? "Threads/Meta token is not visible to the automation environment."
          : threadsEnabled
          ? "Owner approval/live gate required before Threads publishing."
          : "Threads publishing is not configured.",
      next_action: "Connect Threads API permissions only after Instagram/Facebook flow is stable.",
      metadata: {
        permission_gate: "THREADS_PUBLISHING_ENABLED",
      },
    },
    {
      platform: "x",
      display_name: "X",
      connection_status: xConnected ? "connected" : "needs_auth",
      publishing_status:
        xCreditsAvailable && xWriteEnabled
          ? "owner_approval_required"
          : xConnected
            ? "quota_or_credits_blocked"
            : "needs_auth",
      can_publish_now: xConnected && xCreditsAvailable && xWriteEnabled,
      issue_owner: xCreditsAvailable ? "owner" : "provider",
      blocker:
        xCreditsAvailable && xWriteEnabled
          ? "Owner approval is still required before any public X post."
          : "X API credits are not marked available, or Hermes X is not enabled.",
      next_action: "Keep read-only/draft-only until credits and owner-approved public-write gates are deliberately enabled.",
      metadata: {
        known_workflow: "Hermes xurl is staged for read-only intelligence and draft suggestions.",
        live_gate: "HERMES_X_PUBLIC_WRITE_MODE",
      },
    },
    {
      platform: "whatsapp",
      display_name: "WhatsApp",
      connection_status: whatsappConnected ? "connected" : "needs_auth",
      publishing_status: "dry_run_only",
      can_publish_now: false,
      issue_owner: "owner",
      blocker: "WhatsApp is a customer messaging channel, not a public social posting destination.",
      next_action: "Use only for owner-approved, opted-in campaigns with opt-out language.",
      metadata: {
        known_workflow: "Existing app supports WhatsApp customer automation and review requests.",
      },
    },
  ];

  return rows.map((row) => ({
    ...row,
    can_publish_now: Boolean(row.can_publish_now && platformSafetyAllowsPublishing(row, safety)),
    last_checked_at: ts,
  }));
}

export async function refreshPlatformConnections() {
  const inferred = inferPlatformConnections();
  let db;
  try {
    db = supabase();
  } catch (error) {
    if (shouldUseLocalSocialStore(error)) return inferred;
    throw error;
  }
  const { data, error } = await db
    .from("social_platform_connections")
    .upsert(inferred, { onConflict: "platform" })
    .select("*")
    .order("display_name", { ascending: true });
  if (error && shouldUseLocalSocialStore(error)) return inferred;
  if (error) throw error;
  return data || [];
}

export async function listPlatformConnections({ refresh = false } = {}) {
  if (refresh) return refreshPlatformConnections();

  let db;
  try {
    db = supabase();
  } catch {
    return inferPlatformConnections();
  }
  const { data, error } = await db
    .from("social_platform_connections")
    .select("*")
    .order("display_name", { ascending: true });
  if (error) {
    if (shouldUseLocalSocialStore(error)) return inferPlatformConnections();
    throw error;
  }
  return data?.length ? data : inferPlatformConnections();
}

export async function listPostPackages({ status, limit = 20 } = {}) {
  let db;
  try {
    db = supabase();
  } catch {
    return listLocalPostPackages({ status, limit });
  }
  let query = db
    .from("social_post_packages")
    .select(PACKAGE_SELECT)
    .order("priority_score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) {
    if (shouldUseLocalSocialStore(error)) return listLocalPostPackages({ status, limit });
    throw error;
  }
  return (data || []).map(normalizePackage);
}

export async function seedImg3289Package() {
  let db;
  try {
    db = supabase();
  } catch (error) {
    if (shouldUseLocalSocialStore(error)) return seedImg3289PackageLocal();
    throw error;
  }
  const sourceRef = "golden-collections-img3289-final-posting-plan-2026-05-20";
  const existing = await db
    .from("social_post_packages")
    .select("id")
    .eq("source_ref", sourceRef)
    .maybeSingle();
  if (existing.error && shouldUseLocalSocialStore(existing.error)) return seedImg3289PackageLocal();
  if (existing.error && !isNoRowsError(existing.error)) throw existing.error;
  if (existing.data?.id) {
    await ensureImg3289Variants({ db, packageId: existing.data.id });
    return existing.data.id;
  }

  const { data: pkg, error } = await db
    .from("social_post_packages")
    .insert({
      title: "IMG_3289 in-store product explanation",
      source_type: "video_package",
      source_ref: sourceRef,
      source_url: "G:\\My Drive\\GC Promotion video\\IMG_3289.MOV",
      destination_url: "https://www.goldencollections.com/",
      status: "draft_ready",
      priority_score: 88,
      why_now: "Proof-led store/product explanation footage is ready for owner review and platform-specific reuse.",
      approval_notes:
        "Approve exact clip, platform, caption, hashtags, destination link, and claims before any public post.",
      metadata: {
        source_doc: "knowledge-base/outputs/golden-collections-img3289-final-posting-plan-2026-05-20.md",
        asset_permission: "owner_review_required",
        claim_mode: "generic_safe_copy",
      },
    })
    .select("id")
    .single();
  if (error && shouldUseLocalSocialStore(error)) return seedImg3289PackageLocal();
  if (error) throw error;

  const variants = buildImg3289Variants(pkg.id).map((variant) => ({
    ...variant,
    metadata: variant.metadata || {},
  }));
  const variantResult = await db.from("social_post_variants").insert(variants);
  if (variantResult.error && shouldUseLocalSocialStore(variantResult.error)) return seedImg3289PackageLocal();
  if (variantResult.error) throw variantResult.error;

  await logSocialEvent({
    package_id: pkg.id,
    event_type: "package_seeded",
    actor: "system",
    payload: { source_ref: sourceRef },
  });

  return pkg.id;
}

export async function seedRealKempPinterestPackage() {
  let db;
  try {
    db = supabase();
  } catch (error) {
    if (shouldUseLocalSocialStore(error)) return seedRealKempPinterestPackageLocal();
    throw error;
  }
  const sourceRef = "real-kemp-jewellery-guide-pinterest-test-2026-05-21";
  const existing = await db.from("social_post_packages").select("id").eq("source_ref", sourceRef).maybeSingle();
  if (existing.error && shouldUseLocalSocialStore(existing.error)) return seedRealKempPinterestPackageLocal();
  if (existing.error && !isNoRowsError(existing.error)) throw existing.error;
  if (existing.data?.id) {
    await ensurePinterestRealKempVariant({ db, packageId: existing.data.id });
    return existing.data.id;
  }

  const { data: pkg, error } = await db
    .from("social_post_packages")
    .insert({
      title: "Real Kemp Jewellery guide Pinterest Pin",
      source_type: "blog_repurpose",
      source_ref: sourceRef,
      source_url: "blog-system/outputs/repurpose/2026-05-13-real-kemp-jewellery-guide-repurpose.md",
      destination_url: "https://www.goldencollections.com/blogs/jewellery-guides/real-kemp-jewellery-guide",
      status: "draft_ready",
      priority_score: 82,
      why_now: "Pinterest-friendly guide image and destination URL are ready for an owner-approved organic Pin.",
      approval_notes: "Approve the exact board, image, title, description, and destination URL before publishing.",
      metadata: { source_doc: "knowledge-base/wiki/pinterest-publishing-workflow.md", claim_mode: "guide_safe_copy" },
    })
    .select("id")
    .single();
  if (error && shouldUseLocalSocialStore(error)) return seedRealKempPinterestPackageLocal();
  if (error) throw error;

  await ensurePinterestRealKempVariant({ db, packageId: pkg.id });
  await logSocialEvent({
    package_id: pkg.id,
    event_type: "package_seeded",
    actor: "system",
    payload: { source_ref: sourceRef },
  });
  return pkg.id;
}

export async function createContentIntakePackage({
  title,
  sourceType = "drive_folder",
  sourceUrl = "",
  destinationUrl = "",
  contentLane = "general",
  permissionStatus = "owner_owned",
  notes = "",
  createdBy = "owner",
} = {}) {
  const cleanTitle = String(title || "").trim();
  if (!cleanTitle) throw new Error("Content title is required.");

  let db;
  try {
    db = supabase();
  } catch (error) {
    if (shouldUseLocalSocialStore(error)) {
      return createContentIntakePackageLocal({ title: cleanTitle, sourceType, sourceUrl, destinationUrl, contentLane, permissionStatus, notes, createdBy });
    }
    throw error;
  }

  const metadata = buildIntakeMetadata({ contentLane, permissionStatus, notes });
  const { data: pkg, error } = await db
    .from("social_post_packages")
    .insert({
      title: cleanTitle,
      source_type: sourceType || "drive_folder",
      source_ref: `content-intake-${Date.now()}`,
      source_url: sourceUrl || null,
      destination_url: destinationUrl || null,
      status: "intake_received",
      priority_score: 50,
      why_now: "Raw content is waiting for Codex/Hermes review, cut planning, and platform-specific package creation.",
      approval_notes: "No public post yet. First review the raw asset, permissions, claims, account routing, and best use.",
      created_by: createdBy,
      metadata,
    })
    .select("id")
    .single();
  if (error && shouldUseLocalSocialStore(error)) {
    return createContentIntakePackageLocal({ title: cleanTitle, sourceType, sourceUrl, destinationUrl, contentLane, permissionStatus, notes, createdBy });
  }
  if (error) throw error;

  await logSocialEvent({
    package_id: pkg.id,
    event_type: "content_intake_created",
    actor: createdBy,
    payload: metadata,
  });

  return pkg.id;
}

async function ensureImg3289Variants({ db, packageId }) {
  const existingVariants = await db
    .from("social_post_variants")
    .select("id,platform,metadata")
    .eq("package_id", packageId);
  if (existingVariants.error) throw existingVariants.error;

  const desired = buildImg3289Variants(packageId);
  const mainInstagram = desired.find((variant) => variant.platform === "instagram" && normalizeRouteUsername(variant.metadata?.instagram_username) === MAIN_INSTAGRAM_USERNAME);
  const existingRows = existingVariants.data || [];

  const genericInstagram = existingRows.find((row) => row.platform === "instagram" && !normalizeRouteUsername(row.metadata?.instagram_username));
  if (genericInstagram && mainInstagram) {
    const { package_id, status, ...patch } = mainInstagram;
    const updated = await db.from("social_post_variants").update(patch).eq("id", genericInstagram.id);
    if (updated.error) throw updated.error;
    genericInstagram.metadata = mainInstagram.metadata;
  }

  const existingKeys = new Set(existingRows.map((row) => variantRouteKey(row)));
  const missing = desired
    .filter((variant) => !existingKeys.has(variantRouteKey(variant)))
    .map((variant) => ({ ...variant, metadata: variant.metadata || {} }));
  if (!missing.length) return;

  const variantResult = await db.from("social_post_variants").insert(missing);
  if (variantResult.error) throw variantResult.error;
}

async function ensurePinterestRealKempVariant({ db, packageId }) {
  const existingVariants = await db.from("social_post_variants").select("platform").eq("package_id", packageId);
  if (existingVariants.error) throw existingVariants.error;
  const hasPinterest = (existingVariants.data || []).some((row) => row.platform === "pinterest");
  if (hasPinterest) return;
  const variantResult = await db.from("social_post_variants").insert(buildRealKempPinterestVariant(packageId));
  if (variantResult.error) throw variantResult.error;
}

export async function updateVariantStatus({ variantId, status, actor = "owner", publishResultUrl = null, lastError = null }) {
  let db;
  try {
    db = supabase();
  } catch (error) {
    if (shouldUseLocalSocialStore(error)) return updateVariantStatusLocal({ variantId, status, actor, publishResultUrl, lastError });
    throw error;
  }
  const patch = { status, last_error: lastError };
  if (status === "owner_approved") patch.owner_approved_at = new Date().toISOString();
  if (status === "scheduled_or_posted") {
    if (!publishResultUrl) throw new Error("Published URL is required before marking a variant posted.");
    patch.published_at = new Date().toISOString();
    patch.publish_result_url = publishResultUrl;
  }

  const { data, error } = await db
    .from("social_post_variants")
    .update(patch)
    .eq("id", variantId)
    .select("id,package_id,platform,status,publish_result_url")
    .single();
  if (error && shouldUseLocalSocialStore(error)) return updateVariantStatusLocal({ variantId, status, actor, publishResultUrl, lastError });
  if (error) throw error;

  await logSocialEvent({
    package_id: data.package_id,
    variant_id: data.id,
    event_type: `variant_${status}`,
    actor,
    payload: { platform: data.platform, publish_result_url: data.publish_result_url },
  });
  return data;
}

export async function updatePackageStatus({ packageId, status, actor = "owner", heldReason = null }) {
  let db;
  try {
    db = supabase();
  } catch (error) {
    if (shouldUseLocalSocialStore(error)) return updatePackageStatusLocal({ packageId, status, actor, heldReason });
    throw error;
  }
  const patch = { status, held_reason: heldReason };
  if (status === "owner_approved") {
    patch.approved_by = actor;
    patch.approved_at = new Date().toISOString();
  }
  const { data, error } = await db
    .from("social_post_packages")
    .update(patch)
    .eq("id", packageId)
    .select("id,status,title")
    .single();
  if (error && shouldUseLocalSocialStore(error)) return updatePackageStatusLocal({ packageId, status, actor, heldReason });
  if (error) throw error;

  await logSocialEvent({
    package_id: data.id,
    event_type: `package_${status}`,
    actor,
    payload: { title: data.title, held_reason: heldReason },
  });
  return data;
}

export async function publishVariant({
  variantId,
  actor = "owner",
  youtubePrivacyStatus = "private",
  pinterestBoardId = "",
  pinterestBoardName = "",
  instagramMediaType = "",
  instagramAccountId = "",
  instagramUsername = "",
  facebookPostType = "",
}) {
  const loaded = await loadVariantForPublish({ variantId });
  const { db, variant, packageRow } = loaded;

  const safety = getSocialSafety();
  const connections = await listPlatformConnections({ refresh: true });
  const connection = connections.find((row) => row.platform === variant.platform);
  const requestedYouTubePrivacy = variant.platform === "youtube"
    ? normalizePrivacyStatus(youtubePrivacyStatus || variant.metadata?.visibility_default || "private")
    : null;
  const youtubeBoardUpload = variant.platform === "youtube" && safety.youtube_board_publishing_enabled;
  const youtubeReviewUpload = variant.platform === "youtube"
    && ["private", "unlisted"].includes(requestedYouTubePrivacy)
    && (safety.youtube_review_uploads_enabled || youtubeBoardUpload);
  const youtubePlatformUpload = youtubeBoardUpload || youtubeReviewUpload;
  const metaPlatformUpload = (variant.platform === "facebook" && safety.facebook_page_publishing_enabled)
    || (variant.platform === "instagram" && safety.instagram_publishing_enabled);
  const blockers = [];

  if (variant.status !== "owner_approved") {
    blockers.push(`Variant must be owner_approved before publishing. Current status: ${variant.status}.`);
  }
  if (packageRow.status === "blocked") {
    blockers.push("Package is blocked/held.");
  }
  if (!connection) {
    blockers.push(`No connection health row found for ${variant.platform}.`);
  } else if (!connection.can_publish_now) {
    blockers.push(connection.blocker || `${connection.display_name} is not publish-ready.`);
  }
  if (!youtubePlatformUpload && !metaPlatformUpload && !safety.live_publishing_enabled) blockers.push("SOCIAL_LIVE_PUBLISHING_ENABLED is false.");
  if (!youtubePlatformUpload && !metaPlatformUpload && safety.dry_run) blockers.push("SOCIAL_DRY_RUN is true.");
  if (safety.require_owner_approval && variant.status !== "owner_approved") {
    blockers.push("Owner approval is required.");
  }

  const manualPack = buildManualPack(variant);
  if (blockers.length) {
    await logSocialEvent({
      package_id: variant.package_id,
      variant_id: variant.id,
      event_type: "publish_blocked_manual_pack_ready",
      actor,
      payload: {
        platform: variant.platform,
        blockers,
        manual_pack: manualPack,
      },
    });
    return {
      ok: false,
      mode: "manual_pack",
      platform: variant.platform,
      blockers,
      manual_pack: manualPack,
    };
  }

  if (variant.platform === "youtube") {
    try {
      const upload = await uploadYouTubeVariant({
        variant,
        packageRow,
        privacyStatus: requestedYouTubePrivacy,
      });
      if (!upload.url) throw new Error("YouTube upload completed without a video URL.");

      await updateVariantStatus({
        variantId: variant.id,
        status: "scheduled_or_posted",
        actor,
        publishResultUrl: upload.url,
      });
      await logSocialEvent({
        package_id: variant.package_id,
        variant_id: variant.id,
        event_type: "youtube_upload_completed",
        actor,
        payload: {
          platform: variant.platform,
          privacy_status: upload.privacyStatus,
          video_id: upload.id,
          url: upload.url,
          matched_channel: upload.matchedChannel,
        },
      });

      return {
        ok: true,
        mode: "youtube_upload",
        platform: variant.platform,
        privacy_status: upload.privacyStatus,
        publish_result_url: upload.url,
        youtube_video_id: upload.id,
      };
    } catch (error) {
      await updateVariantLastError({ db, variantId: variant.id, lastError: error.message });
      await logSocialEvent({
        package_id: variant.package_id,
        variant_id: variant.id,
        event_type: "youtube_upload_failed",
        actor,
        payload: { platform: variant.platform, error: error.message },
      });
      return {
        ok: false,
        mode: "publish_failed",
        platform: variant.platform,
        blockers: [error.message],
        manual_pack: manualPack,
      };
    }
  }

  if (variant.platform === "pinterest") {
    try {
      const pin = await publishPinterestVariant({
        variant,
        packageRow,
        boardId: pinterestBoardId,
        boardName: pinterestBoardName,
      });
      if (!pin.url) throw new Error("Pinterest publish completed without a Pin URL.");

      await updateVariantStatus({
        variantId: variant.id,
        status: "scheduled_or_posted",
        actor,
        publishResultUrl: pin.url,
      });
      await logSocialEvent({
        package_id: variant.package_id,
        variant_id: variant.id,
        event_type: "pinterest_pin_created",
        actor,
        payload: {
          platform: variant.platform,
          pin_id: pin.id,
          url: pin.url,
          board: pin.board,
        },
      });
      return {
        ok: true,
        mode: "pinterest_pin",
        platform: variant.platform,
        publish_result_url: pin.url,
        pinterest_pin_id: pin.id,
        board: pin.board,
      };
    } catch (error) {
      await updateVariantLastError({ db, variantId: variant.id, lastError: error.message });
      await logSocialEvent({
        package_id: variant.package_id,
        variant_id: variant.id,
        event_type: "pinterest_pin_failed",
        actor,
        payload: { platform: variant.platform, error: error.message },
      });
      return {
        ok: false,
        mode: "publish_failed",
        platform: variant.platform,
        blockers: [error.message],
        manual_pack: manualPack,
      };
    }
  }

  if (variant.platform === "facebook" || variant.platform === "instagram") {
    try {
      const published = await publishMetaVariant({
        variant,
        packageRow,
        instagramMediaType,
        instagramAccountId,
        instagramUsername,
        facebookPostType,
      });
      if (!published.url && !published.id) throw new Error("Meta publish completed without a post ID or URL.");

      await updateVariantStatus({
        variantId: variant.id,
        status: "scheduled_or_posted",
        actor,
        publishResultUrl: published.url || published.id,
      });
      await logSocialEvent({
        package_id: variant.package_id,
        variant_id: variant.id,
        event_type: "meta_post_created",
        actor,
        payload: {
          platform: variant.platform,
          mode: published.mode,
          id: published.id,
          url: published.url,
        },
      });
      return {
        ok: true,
        mode: published.mode,
        platform: variant.platform,
        publish_result_url: published.url || published.id,
        meta_post_id: published.id,
      };
    } catch (error) {
      await updateVariantLastError({ db, variantId: variant.id, lastError: error.message });
      await logSocialEvent({
        package_id: variant.package_id,
        variant_id: variant.id,
        event_type: "meta_post_failed",
        actor,
        payload: { platform: variant.platform, error: error.message },
      });
      return {
        ok: false,
        mode: "publish_failed",
        platform: variant.platform,
        blockers: [error.message],
        manual_pack: manualPack,
      };
    }
  }

  await logSocialEvent({
    package_id: variant.package_id,
    variant_id: variant.id,
    event_type: "publish_ready_live_adapter_missing",
    actor,
    payload: {
      platform: variant.platform,
      reason: "Live adapter is intentionally not wired until the platform-specific gate is implemented and tested.",
      manual_pack: manualPack,
    },
  });

  return {
    ok: false,
    mode: "live_adapter_missing",
    platform: variant.platform,
    blockers: ["Live adapter is not wired for this platform yet. Use manual pack or add a platform-specific adapter."],
    manual_pack: manualPack,
  };
}

function platformSafetyAllowsPublishing(row, safety) {
  if (row.platform === "youtube" && (safety.youtube_board_publishing_enabled || safety.youtube_review_uploads_enabled)) return true;
  if (row.platform === "pinterest" && safety.pinterest_board_publishing_enabled) return true;
  if (row.platform === "facebook" && safety.facebook_page_publishing_enabled) return true;
  if (row.platform === "instagram" && safety.instagram_publishing_enabled) return true;
  return safety.live_publishing_enabled && !safety.dry_run;
}

export async function logSocialEvent({ package_id, variant_id = null, event_type, actor = "system", payload = {} }) {
  let db;
  try {
    db = supabase();
  } catch (error) {
    if (shouldUseLocalSocialStore(error)) {
      logSocialEventLocal({ package_id, variant_id, event_type, actor, payload });
      return;
    }
    throw error;
  }
  const { error } = await db.from("social_post_events").insert({ package_id, variant_id, event_type, actor, payload });
  if (error && shouldUseLocalSocialStore(error)) return logSocialEventLocal({ package_id, variant_id, event_type, actor, payload });
  if (error) throw error;
}

export async function getVariantManualPack({ variantId }) {
  let db;
  try {
    db = supabase();
  } catch {
    return getVariantManualPackLocal({ variantId });
  }
  const { data, error } = await db
    .from("social_post_variants")
    .select("id,package_id,platform,caption,hashtags,destination_url,asset_url,asset_type,manual_pack")
    .eq("id", variantId)
    .single();
  if (error && shouldUseLocalSocialStore(error)) return getVariantManualPackLocal({ variantId });
  if (error) throw error;
  return {
    variant: data,
    manual_pack: data.manual_pack || buildManualPack(data),
  };
}

export function buildManualPack(variant) {
  const tags = Array.isArray(variant.hashtags) && variant.hashtags.length ? `\n\n${variant.hashtags.join(" ")}` : "";
  const link = variant.destination_url ? `\n\nLink: ${variant.destination_url}` : "";
  const asset = variant.asset_url ? `\nAsset: ${variant.asset_url}` : "";
  return `${variant.caption}${tags}${link}${asset}`.trim();
}

export function toHermesSummary({ connections, packages }) {
  const safety = getSocialSafety();
  const blockers = connections
    .filter((row) => !row.can_publish_now || row.blocker)
    .map((row) => ({
      platform: row.platform,
      display_name: row.display_name,
      status: row.publishing_status,
      blocker: row.blocker,
      next_action: row.next_action,
      issue_owner: row.issue_owner,
    }));

  return {
    ok: true,
    schema_version: "social-command-center.v1",
    generated_at: new Date().toISOString(),
    safety,
    allowed_actions: [
      "create_draft_package",
      "create_content_intake",
      "review_content_intake",
      "prepare_cut_plan",
      "refresh_connection_status",
      "prepare_manual_pack",
      "recommend_owner_approval",
      "record_published_url_after_owner_posts",
    ],
    forbidden_actions: [
      "publish_without_owner_approval",
      "schedule_without_owner_approval",
      "boost_or_spend",
      "send_whatsapp_marketing_without_opt_in",
      "change_website_content_from_social_queue",
    ],
    package_payload_contract: {
      endpoint: "POST /api/social/upsert-package",
      required_fields: ["title", "variants[].platform"],
      recommended_fields: [
        "source_ref",
        "source_url",
        "destination_url",
        "priority_score",
        "why_now",
        "approval_notes",
        "variants[].caption",
        "variants[].hashtags",
        "variants[].asset_url",
        "variants[].manual_pack",
      ],
    },
    instruction_for_hermes:
      "Draft and recommend social content. Do not publish, schedule, boost, send, or change website content unless owner approval and live gates are both present.",
    connections: connections.map((row) => ({
      platform: row.platform,
      display_name: row.display_name,
      connection_status: row.connection_status,
      publishing_status: row.publishing_status,
      can_publish_now: row.can_publish_now,
      blocker: row.blocker,
      next_action: row.next_action,
      last_checked_at: row.last_checked_at,
    })),
    blockers,
    top_packages: packages.slice(0, 5).map((pkg) => ({
      id: pkg.id,
      title: pkg.title,
      status: pkg.status,
      priority_score: Number(pkg.priority_score || 0),
      why_now: pkg.why_now,
      metadata: pkg.metadata,
      variants: pkg.variants.map((variant) => ({
        id: variant.id,
        platform: variant.platform,
        status: variant.status,
        destination_url: variant.destination_url,
        publish_result_url: variant.publish_result_url,
      })),
    })),
  };
}

function buildImg3289Variants(packageId) {
  const commonAsset = "tmp/gc-promotion-img3289/ready-to-review/01-post-first-green-pink-statement-set-captioned-2026-05-20.mp4";
  const commonUrl = "https://www.goldencollections.com/";
  const instagramCaption =
    "Inside Golden Collections: deity jewellery and alankaram product explanation with real store context.\n\nThis clip helps customers see deity jewellery details more clearly before choosing. For item-specific help, send us the product link, your use case, and any size/photo reference if fit matters.\n\nProduct availability, pricing, materials and delivery timelines should be confirmed before ordering.";
  const instagramBase = {
    package_id: packageId,
    platform: "instagram",
    status: "draft_ready",
    caption: instagramCaption,
    hashtags: commonTags(),
    destination_url: commonUrl,
    asset_url: commonAsset,
    asset_type: "video",
  };
  return [
    {
      ...instagramBase,
      manual_pack: "Post as Reel to the main Golden Collections Instagram account after owner approves exact clip, caption, visible details, and destination link.",
      metadata: {
        first_public_choice: true,
        content_lane: "deity",
        account_route: "main_all_jewellery",
        instagram_username: MAIN_INSTAGRAM_USERNAME,
        instagram_media_type: "REELS",
      },
    },
    {
      ...instagramBase,
      manual_pack: "Post as Reel to the Deity Jewellery Instagram account only because this clip is deity/alankaram content.",
      metadata: {
        content_lane: "deity",
        account_route: "deity_only",
        instagram_username: DEITY_INSTAGRAM_USERNAME,
        instagram_media_type: "REELS",
      },
    },
    {
      package_id: packageId,
      platform: "youtube",
      status: "draft_ready",
      caption:
        "In-store product explanation from Golden Collections.\n\nReal shelf/display context, product closeups, and practical guidance before choosing. For item-specific help, send the product link and your requirement before ordering.",
      hashtags: commonTags(),
      destination_url: commonUrl,
      asset_url: commonAsset,
      asset_type: "video",
      manual_pack: "Upload publicly after owner approves the exact clip, title, caption, visibility, and destination link.",
      metadata: { visibility_default: "public" },
    },
    {
      package_id: packageId,
      platform: "facebook",
      status: "draft_ready",
      caption:
        "Here is an in-store product explanation from Golden Collections.\n\nThe video shows jewellery/products directly from the store setting, with shelves and product display visible. It is useful for customers who want clearer product context before choosing.\n\nFor help, send the product link and your requirement to Golden Collections. Product availability, pricing, materials and delivery timelines should be confirmed for the specific item before ordering.",
      hashtags: commonTags(),
      destination_url: commonUrl,
      asset_url: commonAsset,
      asset_type: "video",
      manual_pack: "Use after Instagram approval, unless owner chooses Facebook first.",
    },
    {
      package_id: packageId,
      platform: "x",
      status: "draft_ready",
      caption:
        "In-store product explanation from Golden Collections.\n\nReal shelves, real product closeups, and practical customer-facing context before choosing.\n\nFor item-specific help, confirm the current product details before ordering.",
      hashtags: ["#GoldenCollections", "#IndianJewellery", "#TempleJewellery", "#Secunderabad"],
      destination_url: commonUrl,
      asset_url: commonAsset,
      asset_type: "video",
      manual_pack: "Use compact proof-context copy only after X credits and owner-approved gates are ready.",
    },
    {
      package_id: packageId,
      platform: "google_business_profile",
      status: "draft_ready",
      caption:
        "Golden Collections has in-store product explanation footage showing real shelf and display-table context. Customers can use this type of product view to understand details more clearly before choosing. For item-specific help, confirm product details before ordering.",
      hashtags: ["#GoldenCollections", "#Secunderabad", "#JewelleryStore"],
      destination_url: commonUrl,
      asset_url: commonAsset,
      asset_type: "video",
      manual_pack: "Use as a concise local update only after GBP API/manual posting approval.",
    },
  ];
}

function buildRealKempPinterestVariant(packageId) {
  return {
    package_id: packageId,
    platform: "pinterest",
    status: "draft_ready",
    caption:
      "Real kemp jewellery is a premium South Indian temple and dance jewellery style used for Bharatanatyam, Kuchipudi, weddings and special occasions. This Golden Collections guide explains what real kemp jewellery means, where it is used, and what buyers should check before choosing a set.",
    hashtags: ["#RealKempJewellery", "#KempJewellery", "#TempleJewellery", "#BharatanatyamJewellery", "#GoldenCollections"],
    destination_url: "https://www.goldencollections.com/blogs/jewellery-guides/real-kemp-jewellery-guide",
    asset_url: "https://cdn.shopify.com/s/files/1/0764/9224/3242/articles/gc-real-kemp-arangetram-set-bks001-2026.jpg?v=1778696580",
    asset_type: "image",
    manual_pack: "Create as an organic image Pin after owner approves the board, guide image, description, and destination URL.",
    metadata: {
      pinterest_title: "Real Kemp Jewellery Guide",
      pinterest_board_name: "Bharatanatyam Dance Jewellery",
    },
  };
}

function normalizePackage(pkg) {
  const variants = (pkg.social_post_variants || []).map((variant) => ({
    ...variant,
    manual_pack: variant.manual_pack || buildManualPack(variant),
  }));
  delete pkg.social_post_variants;
  return { ...pkg, variants };
}

function commonTags() {
  return [
    "#GoldenCollections",
    "#AnilTunk",
    "#IndianJewellery",
    "#BharatanatyamJewellery",
    "#KuchipudiJewellery",
    "#DeityJewellery",
    "#TempleJewellery",
    "#KempJewellery",
    "#AlankaramAccessories",
    "#HyderabadJewellery",
    "#Secunderabad",
  ];
}

function variantRouteKey(variant) {
  if (variant.platform === "instagram") {
    return `instagram:${normalizeRouteUsername(variant.metadata?.instagram_username || variant.instagram_username || "")}`;
  }
  return variant.platform;
}

function normalizeRouteUsername(value) {
  return String(value || "").trim().replace(/^@+/, "").toLowerCase();
}

function buildIntakeMetadata({ contentLane, permissionStatus, notes }) {
  const lane = normalizeContentLane(contentLane);
  const routePlan = buildRoutePlan(lane);
  return {
    workflow_stage: "content_intake",
    content_lane: lane,
    permission_status: permissionStatus || "owner_owned",
    raw_notes: notes || "",
    route_plan: routePlan,
    next_review_steps: [
      "Watch/read raw material and identify the best story.",
      "Mark usable moments, risks, permissions, claims, and product/category fit.",
      "Create platform variants only after the review is clear.",
      "Send the final draft to owner/Hermes approval before publishing.",
    ],
  };
}

function normalizeContentLane(value) {
  const allowed = new Set(["general", "deity", "bharatanatyam_kemp", "event", "product", "review"]);
  return allowed.has(value) ? value : "general";
}

function buildRoutePlan(lane) {
  const plans = {
    deity: {
      instagram_accounts: ["goldencollections_gbs", "deity_jewellery"],
      reason: "Deity content belongs on the main account and the deity-only account.",
    },
    bharatanatyam_kemp: {
      instagram_accounts: ["goldencollections_gbs", "bharatanatyamjewellery"],
      reason: "Bharatanatyam, dance jewellery, real kemp, imitation kemp, and black kemp go to the main and dance accounts.",
    },
    general: {
      instagram_accounts: ["goldencollections_gbs"],
      reason: "General jewellery and store content goes to the main all-jewellery account.",
    },
    event: {
      instagram_accounts: ["goldencollections_gbs"],
      reason: "Event content starts on the main account unless the product/story is clearly deity or Bharatanatyam/kemp.",
    },
    product: {
      instagram_accounts: ["goldencollections_gbs"],
      reason: "Product content starts on the main account; Codex can add a niche account after category review.",
    },
    review: {
      instagram_accounts: ["goldencollections_gbs"],
      reason: "Review/proof content starts on the main account and needs customer/privacy review first.",
    },
  };
  return plans[lane] || plans.general;
}

function hasAnyEnv(keys) {
  return keys.some((key) => Boolean(process.env[key]));
}

function readTokenHealth(filename, now = new Date()) {
  const candidates = [
    path.join(process.cwd(), "tmp", filename),
    path.join(process.cwd(), "..", "tmp", filename),
  ];
  const file = candidates.find((candidate) => fs.existsSync(candidate));
  if (!file) return { status: "missing", expired: true };

  try {
    const token = JSON.parse(fs.readFileSync(file, "utf8"));
    const expiresAt = token.expires_at;
    if (!expiresAt) return { status: token.refresh_token ? "refreshable" : "unknown", expired: false };
    const expiresMs = typeof expiresAt === "number" ? expiresAt * 1000 : Date.parse(expiresAt);
    const accessExpired = Number.isFinite(expiresMs) ? expiresMs <= now.getTime() : false;
    if (accessExpired && token.refresh_token) return { status: "refreshable", expired: false, access_expired: true };
    return { status: accessExpired ? "expired" : "valid", expired: accessExpired, access_expired: accessExpired };
  } catch {
    return { status: "unreadable", expired: true };
  }
}

export function isMissingSocialTableError(error) {
  const text = `${error?.code || ""} ${error?.message || ""}`;
  return text.includes("42P01") || text.includes("Could not find the table 'public.social_");
}

function shouldUseLocalSocialStore(error) {
  const message = String(error?.message || "");
  return isMissingSocialTableError(error)
    || message.includes("Missing required env var: SUPABASE_")
    || message.includes("JWT issued at future");
}

function isNoRowsError(error) {
  return `${error?.code || ""}` === "PGRST116";
}

async function loadVariantForPublish({ variantId }) {
  let db;
  try {
    db = supabase();
    const variantResult = await db.from("social_post_variants").select("*").eq("id", variantId).single();
    if (variantResult.error) {
      if (shouldUseLocalSocialStore(variantResult.error)) return loadVariantForPublishLocal({ variantId });
      throw variantResult.error;
    }
    const variant = {
      ...variantResult.data,
      manual_pack: variantResult.data.manual_pack || buildManualPack(variantResult.data),
    };
    const packageResult = await db.from("social_post_packages").select("*").eq("id", variant.package_id).single();
    if (packageResult.error) {
      if (shouldUseLocalSocialStore(packageResult.error)) return loadVariantForPublishLocal({ variantId });
      throw packageResult.error;
    }
    return { db, variant, packageRow: packageResult.data };
  } catch (error) {
    if (shouldUseLocalSocialStore(error)) return loadVariantForPublishLocal({ variantId });
    throw error;
  }
}

async function updateVariantLastError({ db, variantId, lastError }) {
  if (db) {
    const { error } = await db.from("social_post_variants").update({ last_error: lastError }).eq("id", variantId);
    if (!error) return;
    if (!shouldUseLocalSocialStore(error)) throw error;
  }
  const store = readLocalSocialStore();
  const variant = store.packages.flatMap((pkg) => pkg.variants).find((row) => row.id === variantId);
  if (variant) {
    variant.last_error = lastError;
    variant.updated_at = new Date().toISOString();
    writeLocalSocialStore(store);
  }
}

function seedImg3289PackageLocal() {
  const store = readLocalSocialStore();
  const sourceRef = IMG3289_SOURCE_REF;
  const existing = store.packages.find((pkg) => pkg.source_ref === sourceRef);
  if (existing) {
    if (reconcileImg3289PackageLocal(existing)) writeLocalSocialStore(store);
    return existing.id;
  }

  const now = new Date().toISOString();
  const pkg = {
    id: crypto.randomUUID(),
    title: "IMG_3289 in-store product explanation",
    source_type: "video_package",
    source_ref: sourceRef,
    source_url: "G:\\My Drive\\GC Promotion video\\IMG_3289.MOV",
    destination_url: "https://www.goldencollections.com/",
    status: "draft_ready",
    priority_score: 88,
    why_now: "Proof-led store/product explanation footage is ready for owner review and platform-specific reuse.",
    approval_notes: "Approve exact clip, platform, caption, hashtags, destination link, and claims before any public post.",
    metadata: {
      source_doc: "knowledge-base/outputs/golden-collections-img3289-final-posting-plan-2026-05-20.md",
      asset_permission: "owner_review_required",
      claim_mode: "generic_safe_copy",
    },
    created_at: now,
    updated_at: now,
  };
  pkg.variants = buildImg3289Variants(pkg.id).map((variant) => ({
    ...variant,
    id: crypto.randomUUID(),
    manual_pack: variant.manual_pack || buildManualPack(variant),
    publish_result_url: null,
    last_error: null,
    owner_approved_at: null,
    published_at: null,
    created_at: now,
    updated_at: now,
  }));
  store.packages.push(pkg);
  store.events.push(localEvent({ package_id: pkg.id, event_type: "package_seeded", actor: "system", payload: { source_ref: sourceRef } }));
  writeLocalSocialStore(store);
  return pkg.id;
}

function reconcileImg3289PackageLocal(pkg) {
  const now = new Date().toISOString();
  const desired = buildImg3289Variants(pkg.id);
  let changed = false;
  const variants = Array.isArray(pkg.variants) ? pkg.variants : [];
  pkg.variants = variants;

  const genericInstagram = variants.find((variant) => variant.platform === "instagram" && !normalizeRouteUsername(variant.metadata?.instagram_username));
  const mainInstagram = desired.find((variant) => variant.platform === "instagram" && normalizeRouteUsername(variant.metadata?.instagram_username) === MAIN_INSTAGRAM_USERNAME);
  if (genericInstagram && mainInstagram) {
    Object.assign(genericInstagram, {
      ...mainInstagram,
      id: genericInstagram.id,
      status: genericInstagram.status || mainInstagram.status,
      publish_result_url: genericInstagram.publish_result_url || null,
      last_error: genericInstagram.last_error || null,
      owner_approved_at: genericInstagram.owner_approved_at || null,
      published_at: genericInstagram.published_at || null,
      created_at: genericInstagram.created_at || now,
      updated_at: now,
    });
    changed = true;
  }

  const existingKeys = new Set(pkg.variants.map((variant) => variantRouteKey(variant)));
  for (const variant of desired) {
    if (existingKeys.has(variantRouteKey(variant))) continue;
    pkg.variants.push({
      ...variant,
      id: crypto.randomUUID(),
      manual_pack: variant.manual_pack || buildManualPack(variant),
      publish_result_url: null,
      last_error: null,
      owner_approved_at: null,
      published_at: null,
      created_at: now,
      updated_at: now,
    });
    changed = true;
  }

  if (changed) pkg.updated_at = now;
  return changed;
}

function seedRealKempPinterestPackageLocal() {
  const store = readLocalSocialStore();
  const sourceRef = "real-kemp-jewellery-guide-pinterest-test-2026-05-21";
  const existing = store.packages.find((pkg) => pkg.source_ref === sourceRef);
  if (existing) return existing.id;

  const now = new Date().toISOString();
  const pkg = {
    id: crypto.randomUUID(),
    title: "Real Kemp Jewellery guide Pinterest Pin",
    source_type: "blog_repurpose",
    source_ref: sourceRef,
    source_url: "blog-system/outputs/repurpose/2026-05-13-real-kemp-jewellery-guide-repurpose.md",
    destination_url: "https://www.goldencollections.com/blogs/jewellery-guides/real-kemp-jewellery-guide",
    status: "draft_ready",
    priority_score: 82,
    why_now: "Pinterest-friendly guide image and destination URL are ready for an owner-approved organic Pin.",
    approval_notes: "Approve the exact board, image, title, description, and destination URL before publishing.",
    metadata: { source_doc: "knowledge-base/wiki/pinterest-publishing-workflow.md", claim_mode: "guide_safe_copy" },
    created_at: now,
    updated_at: now,
  };
  pkg.variants = [{
    ...buildRealKempPinterestVariant(pkg.id),
    id: crypto.randomUUID(),
    publish_result_url: null,
    last_error: null,
    owner_approved_at: null,
    published_at: null,
    created_at: now,
    updated_at: now,
  }];
  store.packages.push(pkg);
  store.events.push(localEvent({ package_id: pkg.id, event_type: "package_seeded", actor: "system", payload: { source_ref: sourceRef } }));
  writeLocalSocialStore(store);
  return pkg.id;
}

function createContentIntakePackageLocal({ title, sourceType, sourceUrl, destinationUrl, contentLane, permissionStatus, notes, createdBy }) {
  const store = readLocalSocialStore();
  const now = new Date().toISOString();
  const metadata = buildIntakeMetadata({ contentLane, permissionStatus, notes });
  const pkg = {
    id: crypto.randomUUID(),
    title,
    source_type: sourceType || "drive_folder",
    source_ref: `content-intake-${Date.now()}`,
    source_url: sourceUrl || null,
    destination_url: destinationUrl || null,
    status: "intake_received",
    priority_score: 50,
    why_now: "Raw content is waiting for Codex/Hermes review, cut planning, and platform-specific package creation.",
    approval_notes: "No public post yet. First review the raw asset, permissions, claims, account routing, and best use.",
    created_by: createdBy || "owner",
    metadata,
    created_at: now,
    updated_at: now,
    variants: [],
  };
  store.packages.push(pkg);
  store.events.push(localEvent({ package_id: pkg.id, event_type: "content_intake_created", actor: createdBy || "owner", payload: metadata }));
  writeLocalSocialStore(store);
  return pkg.id;
}

function listLocalPostPackages({ status, limit = 20 } = {}) {
  const store = readLocalSocialStore();
  return store.packages
    .filter((pkg) => !status || pkg.status === status)
    .sort((a, b) => Number(b.priority_score || 0) - Number(a.priority_score || 0) || String(b.created_at).localeCompare(String(a.created_at)))
    .slice(0, limit)
    .map((pkg) => ({ ...pkg, variants: (pkg.variants || []).map((variant) => ({ ...variant, manual_pack: variant.manual_pack || buildManualPack(variant) })) }));
}

function updateVariantStatusLocal({ variantId, status, actor, publishResultUrl = null, lastError = null }) {
  const store = readLocalSocialStore();
  const pkg = store.packages.find((row) => row.variants?.some((variant) => variant.id === variantId));
  const variant = pkg?.variants.find((row) => row.id === variantId);
  if (!pkg || !variant) throw new Error(`Local social variant not found: ${variantId}`);
  variant.status = status;
  variant.last_error = lastError;
  variant.updated_at = new Date().toISOString();
  if (status === "owner_approved") variant.owner_approved_at = new Date().toISOString();
  if (status === "scheduled_or_posted") {
    if (!publishResultUrl) throw new Error("Published URL is required before marking a variant posted.");
    variant.published_at = new Date().toISOString();
    variant.publish_result_url = publishResultUrl;
  }
  store.events.push(localEvent({
    package_id: pkg.id,
    variant_id: variant.id,
    event_type: `variant_${status}`,
    actor,
    payload: { platform: variant.platform, publish_result_url: variant.publish_result_url },
  }));
  writeLocalSocialStore(store);
  return { id: variant.id, package_id: pkg.id, platform: variant.platform, status: variant.status, publish_result_url: variant.publish_result_url };
}

function updatePackageStatusLocal({ packageId, status, actor, heldReason = null }) {
  const store = readLocalSocialStore();
  const pkg = store.packages.find((row) => row.id === packageId);
  if (!pkg) throw new Error(`Local social package not found: ${packageId}`);
  pkg.status = status;
  pkg.held_reason = heldReason;
  pkg.updated_at = new Date().toISOString();
  if (status === "owner_approved") {
    pkg.approved_by = actor;
    pkg.approved_at = new Date().toISOString();
  }
  store.events.push(localEvent({ package_id: pkg.id, event_type: `package_${status}`, actor, payload: { title: pkg.title, held_reason: heldReason } }));
  writeLocalSocialStore(store);
  return { id: pkg.id, status: pkg.status, title: pkg.title };
}

function loadVariantForPublishLocal({ variantId }) {
  const store = readLocalSocialStore();
  const packageRow = store.packages.find((pkg) => pkg.variants?.some((variant) => variant.id === variantId));
  const variant = packageRow?.variants.find((row) => row.id === variantId);
  if (!packageRow || !variant) throw new Error(`Local social variant not found: ${variantId}`);
  return { db: null, variant: { ...variant, manual_pack: variant.manual_pack || buildManualPack(variant) }, packageRow };
}

function getVariantManualPackLocal({ variantId }) {
  const { variant } = loadVariantForPublishLocal({ variantId });
  return { variant, manual_pack: variant.manual_pack || buildManualPack(variant) };
}

function logSocialEventLocal({ package_id, variant_id = null, event_type, actor = "system", payload = {} }) {
  const store = readLocalSocialStore();
  store.events.push(localEvent({ package_id, variant_id, event_type, actor, payload }));
  writeLocalSocialStore(store);
}

function localEvent({ package_id, variant_id = null, event_type, actor = "system", payload = {} }) {
  return { id: crypto.randomUUID(), package_id, variant_id, event_type, actor, payload, created_at: new Date().toISOString() };
}

function readLocalSocialStore() {
  if (!fs.existsSync(LOCAL_SOCIAL_STORE_PATH)) return { packages: [], events: [] };
  try {
    const parsed = JSON.parse(fs.readFileSync(LOCAL_SOCIAL_STORE_PATH, "utf8"));
    return { packages: parsed.packages || [], events: parsed.events || [] };
  } catch {
    return { packages: [], events: [] };
  }
}

function writeLocalSocialStore(store) {
  fs.mkdirSync(path.dirname(LOCAL_SOCIAL_STORE_PATH), { recursive: true });
  fs.writeFileSync(LOCAL_SOCIAL_STORE_PATH, JSON.stringify(store, null, 2));
}
