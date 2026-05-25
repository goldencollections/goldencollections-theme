import { isCronAuthorized } from "../../lib/auth.js";
import { requireEnv } from "../../lib/config.js";
import { sendJson, readRawBody } from "../../lib/http.js";
import {
  getSocialSafety,
  createContentIntakePackage,
  inferPlatformConnections,
  listPlatformConnections,
  listPostPackages,
  refreshPlatformConnections,
  seedImg3289Package,
  seedRealKempPinterestPackage,
  toHermesSummary,
  publishVariant,
  updatePackageStatus,
  updateVariantStatus,
} from "../../lib/social-command-center.js";

export default async function handler(req, res) {
  const config = { cronSecret: requireEnv("CRON_SECRET") };
  if (!isCronAuthorized(req, config)) {
    if (wantsJson(req)) return sendJson(res, 401, { ok: false, error: "Unauthorized" });
    return sendHtml(res, 401, "<h1>Unauthorized</h1>");
  }

  try {
    if (req.method === "POST") return handlePost(req, res);
    if (req.method !== "GET") return sendHtml(res, 405, "<h1>Method not allowed</h1>");

    const url = new URL(req.url, "https://goldencollections.local");
    const format = url.searchParams.get("format") || "html";
    const refresh = url.searchParams.get("refresh") === "1";
    const debug = url.searchParams.get("debug") === "1";
    const token = url.searchParams.get("token") || "";
    const dashboard = await loadSocialDashboard({ refresh });

    if (format === "json") return sendJson(res, 200, dashboard);
    return sendHtml(res, 200, renderDashboard(dashboard, { token, debug }));
  } catch (error) {
    if (wantsJson(req)) return sendJson(res, 500, { ok: false, error: error.message });
    return sendHtml(res, 500, renderError(error));
  }
}

async function handlePost(req, res) {
  const form = new URLSearchParams((await readRawBody(req)).toString("utf8"));
  const action = form.get("action");
  const token = form.get("token") || "";
  const redirect = `/api/monitor/social-command-center${token ? `?token=${encodeURIComponent(token)}` : ""}`;

  if (action === "refresh_connections") {
    await refreshPlatformConnections();
  } else if (action === "seed_img3289") {
    await seedImg3289Package();
  } else if (action === "seed_pinterest_real_kemp") {
    await seedRealKempPinterestPackage();
  } else if (action === "create_content_intake") {
    await createContentIntakePackage({
      title: form.get("title"),
      sourceType: form.get("source_type"),
      sourceUrl: form.get("source_url"),
      destinationUrl: form.get("destination_url"),
      contentLane: form.get("content_lane"),
      permissionStatus: form.get("permission_status"),
      notes: form.get("notes"),
      createdBy: "owner",
    });
  } else if (action === "approve_package") {
    await updatePackageStatus({ packageId: form.get("package_id"), status: "owner_approved", actor: "owner" });
  } else if (action === "hold_package") {
    await updatePackageStatus({
      packageId: form.get("package_id"),
      status: "blocked",
      actor: "owner",
      heldReason: form.get("held_reason") || "Held from command center",
    });
  } else if (action === "approve_variant") {
    await updateVariantStatus({ variantId: form.get("variant_id"), status: "owner_approved", actor: "owner" });
  } else if (action === "hold_variant") {
    await updateVariantStatus({
      variantId: form.get("variant_id"),
      status: "blocked",
      actor: "owner",
      lastError: form.get("held_reason") || "Held from command center",
    });
  } else if (action === "mark_posted") {
    await updateVariantStatus({
      variantId: form.get("variant_id"),
      status: "scheduled_or_posted",
      actor: "owner",
      publishResultUrl: form.get("publish_result_url") || null,
    });
  } else if (action === "publish_variant") {
    await publishVariant({
      variantId: form.get("variant_id"),
      actor: "owner",
      youtubePrivacyStatus: form.get("youtube_privacy_status") || "private",
      pinterestBoardId: form.get("pinterest_board_id") || "",
      pinterestBoardName: form.get("pinterest_board_name") || "",
      instagramMediaType: form.get("instagram_media_type") || "",
      instagramAccountId: form.get("instagram_account_id") || "",
      instagramUsername: form.get("instagram_username") || "",
      facebookPostType: form.get("facebook_post_type") || "",
    });
  } else {
    throw new Error(`Unknown social action: ${action || "(empty)"}`);
  }

  res.statusCode = 303;
  res.setHeader("Location", redirect);
  res.end();
}

async function loadSocialDashboard({ refresh = false } = {}) {
  const [connections, packages] = await Promise.all([
    refresh ? listPlatformConnections({ refresh }) : Promise.resolve(inferPlatformConnections()),
    listPostPackages({ limit: 30 }),
  ]);
  const hermes = toHermesSummary({ connections, packages });
  const attention = buildAttention({ connections, packages });
  return {
    ok: true,
    generated_at: new Date().toISOString(),
    safety: getSocialSafety(),
    verdict: buildVerdict(attention),
    attention,
    connections,
    packages,
    hermes,
  };
}

function buildAttention({ connections, packages }) {
  const blockedConnections = connections.filter((row) => row.blocker || !row.can_publish_now);
  const draftReady = packages.flatMap((pkg) =>
    pkg.variants
      .filter((variant) => variant.status === "draft_ready")
      .map((variant) => ({ package_id: pkg.id, title: pkg.title, platform: variant.platform, variant_id: variant.id }))
  );
  const ownerApproved = packages.flatMap((pkg) =>
    pkg.variants
      .filter((variant) => variant.status === "owner_approved")
      .map((variant) => ({ package_id: pkg.id, title: pkg.title, platform: variant.platform, variant_id: variant.id }))
  );
  const blockedVariants = packages.flatMap((pkg) =>
    pkg.variants
      .filter((variant) => variant.status === "blocked")
      .map((variant) => ({ package_id: pkg.id, title: pkg.title, platform: variant.platform, variant_id: variant.id, error: variant.last_error }))
  );

  return {
    blocked_connections: blockedConnections.length,
    draft_ready_variants: draftReady.length,
    owner_approved_variants: ownerApproved.length,
    blocked_variants: blockedVariants.length,
    drafts: draftReady.slice(0, 12),
    ready_for_manual_posting: ownerApproved.slice(0, 12),
    blocked: blockedVariants.slice(0, 12),
  };
}

function buildVerdict(attention) {
  if (attention.owner_approved_variants > 0) return "Approved social drafts are waiting for manual/API posting.";
  if (attention.draft_ready_variants > 0) return "Draft social packages are ready for owner review.";
  return "No social packages are queued yet. Seed or create a package to begin.";
}

function renderDashboard(dashboard, { token = "", debug = false } = {}) {
  const tokenInput = token ? `<input type="hidden" name="token" value="${escapeHtml(token)}">` : "";
  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : "";
  const jsonUrl = `/api/monitor/social-command-center?format=json${token ? `&token=${encodeURIComponent(token)}` : ""}`;
  const hermesUrl = `/api/social/hermes-status${token ? `?token=${encodeURIComponent(token)}` : ""}`;
  const packagesHtml = dashboard.packages.length
    ? dashboard.packages.map((pkg) => renderPackage(pkg, { tokenInput, token })).join("")
    : `<section class="empty"><h2>No post packages yet</h2><p>Start with the prepared IMG_3289 video package, or let Hermes create a new package from an approved idea.</p></section>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Golden Collections Social Command Center</title>
  <style>${styles()}</style>
</head>
<body>
  <main class="shell">
    <header class="hero">
      <div>
        <p class="eyebrow">Golden Collections</p>
        <h1>Content Studio</h1>
        <p class="verdict">${escapeHtml(dashboard.verdict)}</p>
      </div>
      <div class="hero-actions">
        <a class="button" href="${escapeHtml(jsonUrl)}">JSON</a>
        <a class="button" href="${escapeHtml(hermesUrl)}">Hermes</a>
        <form method="post">
          ${tokenInput}
          <input type="hidden" name="action" value="refresh_connections">
          <button class="button" type="submit">Refresh Status</button>
        </form>
      </div>
    </header>

    <section class="safety">
      ${renderSafetyPill("Live publishing", dashboard.safety.live_publishing_enabled)}
      ${renderSafetyPill("Dry run", dashboard.safety.dry_run, true)}
      ${renderSafetyPill("Owner approval", dashboard.safety.require_owner_approval, true)}
      ${renderSafetyPill("Hermes publish", dashboard.safety.hermes_publish_allowed)}
    </section>

    ${renderWorkflow()}
    ${renderIntakeForm({ tokenInput })}
    ${renderAccountRouting()}

    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>Connection Health</h2>
          <p>See what is ready, what is blocked, and exactly what to fix next.</p>
        </div>
      </div>
      <div class="connection-grid">
        ${dashboard.connections.map(renderConnection).join("")}
      </div>
    </section>

    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>Post Packages</h2>
          <p>Review the asset, caption, hashtags, and platform choice before anything goes public.</p>
        </div>
        ${debug ? renderSeedTools({ tokenInput }) : ""}
      </div>
      ${packagesHtml}
    </section>
  </main>
</body>
</html>`;
}

function renderSeedTools({ tokenInput }) {
  return `<div class="seed-tools">
    <form method="post">
      ${tokenInput}
      <input type="hidden" name="action" value="seed_img3289">
      <button class="button" type="submit">Seed IMG_3289</button>
    </form>
    <form method="post">
      ${tokenInput}
      <input type="hidden" name="action" value="seed_pinterest_real_kemp">
      <button class="button" type="submit">Seed Pinterest Test</button>
    </form>
  </div>`;
}

function renderWorkflow() {
  return `<section class="workflow" aria-label="Content workflow">
    <div class="step">
      <span>1</span>
      <div><strong>Add raw material</strong><p>Drive folder, local path, product shoot, event photos, staff video, or notes.</p></div>
    </div>
    <div class="step">
      <span>2</span>
      <div><strong>Review and cut plan</strong><p>Codex/Hermes decides what becomes Shorts, Reels, YouTube, website, blog, or hold.</p></div>
    </div>
    <div class="step">
      <span>3</span>
      <div><strong>Approve and publish</strong><p>You approve on this board or through Hermes/mobile before anything goes public.</p></div>
    </div>
  </section>`;
}

function renderIntakeForm({ tokenInput }) {
  return `<section class="panel compact-panel">
    <div class="panel-head">
      <div>
        <h2>New Content Request</h2>
        <p>Use this when you have raw photos, videos, documents, event material, or a new idea.</p>
      </div>
    </div>
    <form class="intake-form" method="post">
      ${tokenInput}
      <input type="hidden" name="action" value="create_content_intake">
      <label>Title
        <input name="title" placeholder="Example: Aayagaru visit photos, 30-min staff video, new kemp shoot" required>
      </label>
      <label>Content type
        <select name="content_lane">
          <option value="general">General jewellery / store</option>
          <option value="deity">Deity jewellery only</option>
          <option value="bharatanatyam_kemp">Bharatanatyam, kemp, black kemp</option>
          <option value="event">Event or sponsorship</option>
          <option value="product">Product shoot</option>
          <option value="review">Customer proof / review</option>
        </select>
      </label>
      <label>Where is the raw material?
        <select name="source_type">
          <option value="drive_folder">Google Drive folder</option>
          <option value="local_folder">Local folder</option>
          <option value="video">Single video</option>
          <option value="photos">Photos</option>
          <option value="manual_note">Idea / notes only</option>
        </select>
      </label>
      <label class="wide">Link or path
        <input name="source_url" placeholder="Paste Drive folder link, file path, Shopify URL, or leave blank for now">
      </label>
      <label>Permission
        <select name="permission_status">
          <option value="owner_owned">Owner-owned content</option>
          <option value="staff_internal">Staff/internal content</option>
          <option value="customer_permission_needed">Customer permission needed</option>
          <option value="unknown">Not sure yet</option>
        </select>
      </label>
      <label>Website/product link
        <input name="destination_url" placeholder="Optional URL to product, blog, or collection">
      </label>
      <label class="wide">What do you want from it?
        <textarea name="notes" rows="3" placeholder="Example: suggest shorts, long YouTube video, website story, captions, or what should not be posted"></textarea>
      </label>
      <button class="button primary" type="submit">Create Intake Card</button>
    </form>
  </section>`;
}

function renderAccountRouting() {
  return `<section class="route-strip" aria-label="Instagram account routing">
    <strong>Account routing</strong>
    <span>Main: every jewellery post goes to goldencollections_gbs.</span>
    <span>Deity-only: also send deity content to deity_jewellery.</span>
    <span>Dance/kemp: also send Bharatanatyam, kemp, and black kemp to bharatanatyamjewellery.</span>
  </section>`;
}

function renderConnection(row) {
  const readyText = row.can_publish_now ? "Ready to publish" : "Not ready";
  return `<article class="connection">
    <div class="row">
      <h3>${escapeHtml(row.display_name)}</h3>
      <span class="status ${statusClass(row.publishing_status)}">${escapeHtml(humanStatus(row.publishing_status))}</span>
    </div>
    <p class="readiness ${row.can_publish_now ? "ready" : "not-ready"}">${readyText}</p>
    <dl>
      <div><dt>Connected</dt><dd>${escapeHtml(humanStatus(row.connection_status))}</dd></div>
      <div><dt>Fix By</dt><dd>${escapeHtml(humanOwner(row.issue_owner))}</dd></div>
    </dl>
    ${row.blocker ? `<div class="note bad-note"><strong>Blocker</strong><p>${escapeHtml(row.blocker)}</p></div>` : ""}
    ${row.next_action ? `<div class="note"><strong>Next step</strong><p>${escapeHtml(row.next_action)}</p></div>` : ""}
  </article>`;
}

function renderPackage(pkg, { tokenInput, token = "" }) {
  if (pkg.metadata?.workflow_stage === "content_intake" || !pkg.variants.length) {
    return renderIntakePackage(pkg, { tokenInput, token });
  }
  return `<article class="package" id="package-${escapeHtml(pkg.id)}">
    <div class="package-head">
      <div>
        <div class="row start">
          <h3>${escapeHtml(pkg.title)}</h3>
          <span class="status ${statusClass(pkg.status)}">${escapeHtml(pkg.status)}</span>
        </div>
        <p>${escapeHtml(pkg.why_now || "No timing note yet.")}</p>
      </div>
      <div class="score">${Number(pkg.priority_score || 0).toFixed(0)}</div>
    </div>
    <div class="approval-note">${escapeHtml(pkg.approval_notes || "Approval notes not set.")}</div>
    <div class="variant-table" role="table" aria-label="Platform variants">
      <div class="variant-head" role="row">
        <span>Platform</span><span>Status</span><span>Copy</span><span>Manual Pack</span><span>Actions</span>
      </div>
      ${pkg.variants.map((variant) => renderVariant(variant, { tokenInput, token })).join("")}
    </div>
  </article>`;
}

function renderIntakePackage(pkg, { tokenInput, token = "" }) {
  const routePlan = pkg.metadata?.route_plan || {};
  const accounts = Array.isArray(routePlan.instagram_accounts) ? routePlan.instagram_accounts.join(", ") : "goldencollections_gbs";
  return `<article class="package intake-card" id="package-${escapeHtml(pkg.id)}">
    <div class="package-head">
      <div>
        <div class="row start">
          <h3>${escapeHtml(pkg.title)}</h3>
          <span class="status ${statusClass(pkg.status)}">${escapeHtml(humanStatus(pkg.status))}</span>
        </div>
        <p>${escapeHtml(pkg.why_now || "Raw content is waiting for review.")}</p>
      </div>
      <div class="score">${Number(pkg.priority_score || 0).toFixed(0)}</div>
    </div>
    <div class="intake-grid">
      <div><strong>Raw material</strong><p>${escapeHtml(pkg.source_url || "Add Drive link or local path when ready.")}</p></div>
      <div><strong>Recommended account route</strong><p>${escapeHtml(accounts)}</p></div>
      <div><strong>Permission</strong><p>${escapeHtml(humanStatus(pkg.metadata?.permission_status || "owner_owned"))}</p></div>
      <div><strong>Next decision</strong><p>Review the raw content, choose usable moments, then create final platform drafts.</p></div>
    </div>
    ${pkg.metadata?.raw_notes ? `<div class="approval-note">${escapeHtml(pkg.metadata.raw_notes)}</div>` : ""}
    <div class="intake-actions">
      <a class="button" href="/api/social/hermes-status${token ? `?token=${encodeURIComponent(token)}` : ""}">Hermes JSON</a>
      <form method="post">
        ${tokenInput}
        <input type="hidden" name="action" value="hold_package">
        <input type="hidden" name="package_id" value="${escapeHtml(pkg.id)}">
        <input type="hidden" name="held_reason" value="Held during content intake review">
        <button type="submit">Hold</button>
      </form>
    </div>
  </article>`;
}

function renderVariant(variant, { tokenInput, token = "" }) {
  const hashtags = Array.isArray(variant.hashtags) ? variant.hashtags.join(" ") : "";
  const result = variant.publish_result_url
    ? `<a href="${escapeHtml(variant.publish_result_url)}">Published link</a>`
    : "";
  const error = variant.last_error ? `<div class="row-error"><strong>Last issue</strong>${escapeHtml(variant.last_error)}</div>` : "";
  const packUrl = `/api/social/manual-pack?variant_id=${encodeURIComponent(variant.id)}${token ? `&token=${encodeURIComponent(token)}` : ""}`;
  return `<div class="variant-row" role="row">
    <div class="platform">${escapeHtml(variantPlatformLabel(variant))}${renderRouteSubline(variant)}</div>
    <div><span class="status ${statusClass(variant.status)}">${escapeHtml(variant.status)}</span>${result}${error}</div>
    <div>
      <p class="copy">${escapeHtml(variant.caption)}</p>
      ${hashtags ? `<p class="tags">${escapeHtml(hashtags)}</p>` : ""}
      ${variant.asset_url ? `<p class="asset">${escapeHtml(variant.asset_url)}</p>` : ""}
    </div>
    <details>
      <summary>Open</summary>
      <pre>${escapeHtml(variant.manual_pack || "")}</pre>
    </details>
    <div class="actions">
      <a class="mini-link" href="${escapeHtml(packUrl)}">Manual pack</a>
      <form method="post">
        ${tokenInput}
        <input type="hidden" name="action" value="approve_variant">
        <input type="hidden" name="variant_id" value="${escapeHtml(variant.id)}">
        <button type="submit">Approve</button>
      </form>
      <form method="post">
        ${tokenInput}
        <input type="hidden" name="action" value="hold_variant">
        <input type="hidden" name="variant_id" value="${escapeHtml(variant.id)}">
        <button type="submit">Hold</button>
      </form>
      <form method="post">
        ${tokenInput}
        <input type="hidden" name="action" value="publish_variant">
        <input type="hidden" name="variant_id" value="${escapeHtml(variant.id)}">
        ${variant.platform === "youtube" ? renderYouTubePrivacySelect(variant) : ""}
        ${variant.platform === "pinterest" ? renderPinterestBoardFields(variant) : ""}
        ${variant.platform === "instagram" ? renderInstagramFields(variant) : ""}
        ${variant.platform === "facebook" ? renderFacebookFields(variant) : ""}
        <button type="submit">Publish / Pack</button>
      </form>
      <form method="post" class="posted-form">
        ${tokenInput}
        <input type="hidden" name="action" value="mark_posted">
        <input type="hidden" name="variant_id" value="${escapeHtml(variant.id)}">
        <input name="publish_result_url" placeholder="Published URL" required>
        <button type="submit">Mark Posted</button>
      </form>
    </div>
  </div>`;
}

function renderYouTubePrivacySelect(variant) {
  const current = variant.metadata?.visibility_default || "private";
  return `<label class="field-label" for="youtube-privacy-${escapeHtml(variant.id)}">Visibility</label>
        <select id="youtube-privacy-${escapeHtml(variant.id)}" name="youtube_privacy_status">
          ${["private", "unlisted", "public"].map((value) => `<option value="${value}"${current === value ? " selected" : ""}>${value}</option>`).join("")}
        </select>`;
}

function renderPinterestBoardFields(variant) {
  const boardId = variant.metadata?.pinterest_board_id || "";
  const boardName = variant.metadata?.pinterest_board_name || "";
  return `<label class="field-label" for="pinterest-board-name-${escapeHtml(variant.id)}">Board name</label>
        <input id="pinterest-board-name-${escapeHtml(variant.id)}" name="pinterest_board_name" value="${escapeHtml(boardName)}" placeholder="Board name">
        <input name="pinterest_board_id" value="${escapeHtml(boardId)}" placeholder="Board ID, optional">`;
}

function renderInstagramFields(variant) {
  const current = String(variant.metadata?.instagram_media_type || (variant.asset_type === "video" ? "REELS" : "IMAGE")).toUpperCase();
  const currentUsername = normalizeInstagramUsername(variant.metadata?.instagram_username || "");
  const accounts = [
    ["goldencollections_gbs", "goldencollections_gbs - main/all jewellery"],
    ["deity_jewellery", "deity_jewellery - deity only"],
    ["bharatanatyamjewellery", "bharatanatyamjewellery - dance/kemp"],
  ];
  return `<label class="field-label" for="instagram-media-type-${escapeHtml(variant.id)}">Instagram type</label>
        <select id="instagram-media-type-${escapeHtml(variant.id)}" name="instagram_media_type">
          ${["REELS", "IMAGE", "STORIES"].map((value) => `<option value="${value}"${current === value ? " selected" : ""}>${value}</option>`).join("")}
        </select>
        <label class="field-label" for="instagram-username-${escapeHtml(variant.id)}">Instagram account</label>
        <select id="instagram-username-${escapeHtml(variant.id)}" name="instagram_username">
          ${accounts.map(([value, label]) => `<option value="${value}"${currentUsername === value ? " selected" : ""}>${escapeHtml(label)}</option>`).join("")}
        </select>`;
}

function renderFacebookFields(variant) {
  const current = String(variant.metadata?.facebook_post_type || variant.asset_type || "feed").toLowerCase();
  return `<label class="field-label" for="facebook-post-type-${escapeHtml(variant.id)}">Facebook type</label>
        <select id="facebook-post-type-${escapeHtml(variant.id)}" name="facebook_post_type">
          ${["feed", "photo", "video"].map((value) => `<option value="${value}"${current === value ? " selected" : ""}>${value}</option>`).join("")}
        </select>`;
}

function renderSafetyPill(label, value, goodWhenTrue = false) {
  const good = goodWhenTrue ? value : !value;
  return `<div class="pill ${good ? "safe" : "warn"}"><span>${escapeHtml(label)}</span><strong>${value ? "On" : "Off"}</strong></div>`;
}

function platformLabel(platform) {
  const labels = {
    google_business_profile: "Google Business Profile",
    x: "X",
  };
  return labels[platform] || platform.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function variantPlatformLabel(variant) {
  const base = platformLabel(variant.platform);
  if (variant.platform === "instagram" && variant.metadata?.instagram_username) {
    return `${base} - ${normalizeInstagramUsername(variant.metadata.instagram_username)}`;
  }
  return base;
}

function renderRouteSubline(variant) {
  const route = variant.metadata?.account_route;
  const labels = {
    main_all_jewellery: "Receives all jewellery posts",
    deity_only: "Only deity/alankaram posts",
    bharatanatyam_kemp_only: "Only dance/kemp posts",
  };
  return labels[route] ? `<span class="route-subline">${escapeHtml(labels[route])}</span>` : "";
}

function normalizeInstagramUsername(value) {
  return String(value || "").trim().replace(/^@+/, "").toLowerCase();
}

function humanStatus(status) {
  const labels = {
    connected: "Connected",
    needs_auth: "Needs login",
    token_expired: "Login expired",
    permission_missing: "Permission needed",
    api_access_pending: "API access pending",
    quota_or_credits_blocked: "Credits blocked",
    owner_approval_required: "Approval needed",
    dry_run_only: "Dry run only",
    ready_to_publish: "Ready",
    failed_last_publish: "Last publish failed",
    draft_ready: "Draft ready",
    intake_received: "Needs review",
    owner_approved: "Approved",
    scheduled_or_posted: "Posted",
    blocked: "Blocked",
    owner_owned: "Owner-owned",
    staff_internal: "Staff/internal",
    customer_permission_needed: "Customer permission needed",
    unknown: "Unknown",
  };
  return labels[status] || String(status || "").replace(/_/g, " ");
}

function humanOwner(owner) {
  const labels = {
    owner: "Owner",
    provider: "Platform",
    system: "System",
  };
  return labels[owner] || humanStatus(owner || "owner");
}

function statusClass(status) {
  if (["ready_to_publish", "owner_approved", "connected", "scheduled_or_posted"].includes(status)) return "good";
  if (["blocked", "permission_missing", "api_access_pending", "quota_or_credits_blocked", "failed_last_publish"].includes(status)) return "bad";
  return "wait";
}

function wantsJson(req) {
  const url = new URL(req.url, "https://goldencollections.local");
  return url.searchParams.get("format") === "json" || req.headers.accept?.includes("application/json");
}

function sendHtml(res, statusCode, html) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(html);
}

function renderError(error) {
  return `<!doctype html><html><body><h1>Social command center error</h1><pre>${escapeHtml(error.message)}</pre></body></html>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function styles() {
  return `
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #202124; background: #f6f4ef; }
    * { box-sizing: border-box; }
    body { margin: 0; }
    .shell { width: min(1180px, calc(100% - 28px)); margin: 0 auto; padding: 22px 0 48px; }
    .hero { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; padding: 18px 0 20px; }
    .eyebrow { margin: 0 0 4px; text-transform: uppercase; letter-spacing: .08em; font-size: 12px; color: #6b6357; }
    h1, h2, h3, p { margin-top: 0; }
    h1 { margin-bottom: 8px; font-size: clamp(30px, 4vw, 48px); line-height: 1; }
    h2 { margin-bottom: 4px; font-size: 22px; }
    h3 { margin-bottom: 0; font-size: 18px; }
    .verdict { max-width: 680px; margin: 0; font-size: 17px; color: #4a433b; }
    .hero-actions, .panel-head, .row, .actions, .safety { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .hero-actions { justify-content: flex-end; }
    .seed-tools { display: flex; gap: 10px; flex-wrap: wrap; }
    .button, button { border: 1px solid #b8ad9d; background: #fff; color: #241f1a; border-radius: 6px; padding: 9px 12px; font: inherit; text-decoration: none; cursor: pointer; }
    .button.primary, button[type="submit"]:first-child { background: #23201c; border-color: #23201c; color: #fff; }
    .panel, .empty { background: #fff; border: 1px solid #dfd6c8; border-radius: 8px; padding: 18px; margin: 16px 0; }
    .compact-panel { padding: 16px; }
    .panel-head { justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .panel-head p, .package p { color: #6b6357; }
    .workflow { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin: 12px 0 16px; }
    .step { display: flex; gap: 12px; align-items: flex-start; border: 1px solid #dfd6c8; border-radius: 8px; padding: 14px; background: #fff; }
    .step span { flex: 0 0 28px; width: 28px; height: 28px; display: grid; place-items: center; border-radius: 999px; background: #23201c; color: #fff; font-weight: 800; }
    .step strong { display: block; margin-bottom: 4px; }
    .step p { margin: 0; color: #6b6357; font-size: 14px; line-height: 1.35; }
    .intake-form { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    .intake-form label { display: grid; gap: 6px; font-size: 13px; font-weight: 800; color: #4d443a; }
    .intake-form input, .intake-form select, .intake-form textarea { width: 100%; border: 1px solid #cfc3b4; border-radius: 6px; padding: 10px; font: inherit; background: #fff; color: #241f1a; }
    .intake-form textarea { resize: vertical; min-height: 84px; }
    .intake-form .wide { grid-column: span 2; }
    .intake-form button { align-self: end; min-height: 43px; }
    .route-strip { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 14px 0; padding: 10px 12px; border: 1px solid #dfd6c8; border-radius: 8px; background: #fffaf0; color: #4d443a; }
    .route-strip strong { margin-right: 4px; color: #241f1a; }
    .route-strip span { padding: 4px 8px; border-radius: 999px; background: #fff; border: 1px solid #eadfce; font-size: 13px; }
    .safety { margin-bottom: 14px; }
    .pill { min-width: 155px; display: flex; justify-content: space-between; gap: 8px; border-radius: 6px; padding: 9px 11px; border: 1px solid; background: #fff; }
    .pill.safe { border-color: #b8d6be; color: #245a31; }
    .pill.warn { border-color: #ecc7a0; color: #87520c; }
    .connection-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(250px, 100%), 1fr)); gap: 12px; }
    .connection { min-width: 0; border: 1px solid #ebe3d6; border-radius: 8px; padding: 14px; background: #fffdf9; }
    .connection dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin: 10px 0; }
    dt { font-size: 12px; color: #817769; }
    dd { margin: 2px 0 0; font-weight: 650; }
    .status { display: inline-flex; align-items: center; max-width: 100%; border-radius: 999px; padding: 4px 8px; font-size: 12px; font-weight: 700; overflow-wrap: anywhere; white-space: normal; }
    .status.good { background: #e7f5e9; color: #236333; }
    .status.wait { background: #fff4db; color: #75510a; }
    .status.bad { background: #fde7e4; color: #9b2d20; }
    .readiness { margin: 10px 0 0; font-weight: 800; }
    .readiness.ready { color: #236333; }
    .readiness.not-ready { color: #8d2d22; }
    .note { margin-top: 10px; padding: 10px; border-radius: 6px; background: #f8f5ef; color: #4d443a; overflow-wrap: anywhere; }
    .note strong { display: block; margin-bottom: 4px; font-size: 12px; color: #6b6357; text-transform: uppercase; letter-spacing: .04em; }
    .note p { margin: 0; }
    .bad-note { background: #fff0ee; color: #8d2d22; }
    .package { border-top: 1px solid #eee4d7; padding-top: 18px; margin-top: 18px; }
    .package:first-of-type { border-top: 0; padding-top: 0; margin-top: 0; }
    .package-head { display: flex; justify-content: space-between; gap: 14px; align-items: flex-start; }
    .row.start { align-items: flex-start; }
    .score { width: 54px; height: 54px; display: grid; place-items: center; border-radius: 8px; border: 1px solid #d8cbb9; font-weight: 800; font-size: 22px; background: #fffaf0; }
    .approval-note { margin: 10px 0 14px; padding: 10px 12px; border-left: 3px solid #8a6d3b; background: #fff8e8; color: #5b4930; }
    .intake-card { background: #fffdf9; border: 1px solid #e5dccf; border-radius: 8px; padding: 16px; }
    .intake-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin: 14px 0; }
    .intake-grid > div { min-width: 0; padding: 12px; border-radius: 8px; background: #f8f5ef; }
    .intake-grid strong { display: block; margin-bottom: 6px; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: #6b6357; }
    .intake-grid p { margin: 0; color: #2c2721; overflow-wrap: anywhere; }
    .intake-actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .intake-actions form { margin: 0; }
    .variant-table { border: 1px solid #e5dccf; border-radius: 8px; overflow: hidden; }
    .variant-head, .variant-row { display: grid; grid-template-columns: 135px 150px minmax(260px, 1.3fr) minmax(180px, .7fr) 190px; gap: 0; }
    .variant-head { background: #f3eee5; font-weight: 800; color: #52483d; }
    .variant-head span, .variant-row > div, .variant-row > details { padding: 12px; border-top: 1px solid #eee4d7; }
    .variant-head span { border-top: 0; }
    .copy { white-space: pre-wrap; color: #2c2721; }
    .tags, .asset { font-size: 12px; overflow-wrap: anywhere; }
    .platform { font-weight: 800; }
    .route-subline { display: block; margin-top: 6px; font-size: 12px; line-height: 1.25; font-weight: 650; color: #6b6357; }
    .row-error { margin-top: 8px; padding: 8px; border-radius: 6px; background: #fff0ee; color: #8d2d22; font-size: 12px; line-height: 1.35; overflow-wrap: anywhere; }
    .row-error strong { display: block; margin-bottom: 3px; text-transform: uppercase; letter-spacing: .04em; color: #7d271d; }
    details pre { white-space: pre-wrap; overflow-wrap: anywhere; background: #f8f5ef; border-radius: 6px; padding: 10px; }
    .actions { align-items: flex-start; }
    .actions form { width: 100%; }
    .actions button, .actions input, .actions select { width: 100%; margin-bottom: 6px; }
    .actions input, .actions select { border: 1px solid #cfc3b4; border-radius: 6px; padding: 8px; font: inherit; background: #fff; }
    .field-label { display: block; margin: 0 0 4px; font-size: 12px; font-weight: 800; color: #6b6357; }
    .mini-link { display: block; width: 100%; text-align: center; border: 1px solid #cfc3b4; border-radius: 6px; padding: 8px; margin-bottom: 6px; color: #2f2922; text-decoration: none; background: #fff; }
    @media (max-width: 860px) {
      .hero, .package-head { display: block; }
      .hero-actions { justify-content: flex-start; margin-top: 14px; }
      .workflow, .intake-form, .intake-grid { grid-template-columns: 1fr; }
      .intake-form .wide { grid-column: auto; }
      .variant-head { display: none; }
      .variant-row { display: block; padding: 10px 0; }
      .variant-row > div, .variant-row > details { border-top: 1px solid #eee4d7; }
      .connection dl { grid-template-columns: 1fr; }
    }
  `;
}
