import fs from "node:fs";
import path from "node:path";

const TOKEN_FILE = "meta-publishing-token.json";
const DEFAULT_GRAPH_VERSION = "v23.0";

export async function publishMetaVariant({
  variant,
  packageRow,
  instagramMediaType = "",
  facebookPostType = "",
  instagramAccountId = "",
  instagramUsername = "",
}) {
  if (variant.platform === "facebook") {
    return publishFacebookVariant({ variant, packageRow, facebookPostType });
  }
  if (variant.platform === "instagram") {
    return publishInstagramVariant({ variant, packageRow, instagramMediaType, instagramAccountId, instagramUsername });
  }
  throw new Error(`Meta publisher does not support platform: ${variant.platform}`);
}

export function readMetaPublishingHealth(now = new Date()) {
  const token = readTokenIfPresent();
  const systemTokenVisible = hasAnyEnv(["META_ACCESS_TOKEN", "WHATSAPP_ACCESS_TOKEN"]);
  if (!token) {
    return {
      connected: systemTokenVisible,
      publishing_token_status: "missing",
      page_ready: false,
      instagram_ready: false,
      page_id: process.env.META_FACEBOOK_PAGE_ID || "",
      page_name: "",
      instagram_user_id: process.env.META_INSTAGRAM_USER_ID || "",
      instagram_username: "",
      scopes: [],
      blockers: ["Meta publishing OAuth token is missing."],
    };
  }

  const expiresMs = token.expires_at ? Date.parse(token.expires_at) : null;
  const expired = Number.isFinite(expiresMs) ? expiresMs <= now.getTime() : false;
  const scopes = Array.isArray(token.scopes) ? token.scopes : [];
  const pageReady = Boolean(token.page_access_token && token.page_id && hasScopes(scopes, facebookRequiredScopes()));
  const instagramReady = Boolean(
    token.page_access_token
      && token.instagram_business_account?.id
      && hasScopes(scopes, instagramRequiredScopes()),
  );
  const instagramAccounts = Array.isArray(token.instagram_accounts) && token.instagram_accounts.length
    ? token.instagram_accounts
    : token.instagram_business_account
      ? [{ ...token.instagram_business_account, page_id: token.page_id, page_name: token.page_name }]
      : [];
  const blockers = [];
  if (expired) blockers.push("Meta publishing OAuth token is expired.");
  if (!pageReady) blockers.push(`Facebook Page publishing requires ${facebookRequiredScopes().join(", ")}.`);
  if (!instagramReady) blockers.push(`Instagram publishing requires ${instagramRequiredScopes().join(", ")} and a linked professional Instagram account.`);

  return {
    connected: true,
    publishing_token_status: expired ? "expired" : "valid",
    page_ready: pageReady && !expired,
    instagram_ready: instagramReady && !expired,
    page_id: token.page_id || "",
    page_name: token.page_name || "",
    instagram_user_id: token.instagram_business_account?.id || "",
    instagram_username: token.instagram_business_account?.username || "",
    instagram_accounts: instagramAccounts.map((account) => ({
      id: account.id,
      username: account.username,
      name: account.name,
      page_id: account.page_id,
      page_name: account.page_name,
    })),
    scopes,
    blockers,
  };
}

export async function inspectMetaPublishingConnection() {
  const token = requirePublishingToken();
  const debug = await metaApi("/debug_token", {
    input_token: token.access_token,
    access_token: `${requireMetaAppEnv().appId}|${requireMetaAppEnv().appSecret}`,
  }, { useAppToken: true });
  const accounts = await metaApi("/me/accounts", {
    fields: "id,name,access_token,permissions,instagram_business_account{id,username,name}",
    limit: 50,
  });

  const selectedPage = selectPage(accounts.data || [], token.page_id || process.env.META_FACEBOOK_PAGE_ID || "");
  const summary = {
    token_valid: Boolean(debug?.data?.is_valid),
    token_type: debug?.data?.type || null,
    expires_at: debug?.data?.expires_at || 0,
    scopes: debug?.data?.scopes || [],
    pages: (accounts.data || []).map((page) => ({
      id: page.id,
      name: page.name,
      has_page_token: Boolean(page.access_token),
      permissions: page.permissions || [],
      instagram_business_account: page.instagram_business_account || null,
    })),
    instagram_accounts: instagramAccountsFromPages(accounts.data || []),
    selected_page: selectedPage ? {
      id: selectedPage.id,
      name: selectedPage.name,
      has_page_token: Boolean(selectedPage.access_token),
      instagram_business_account: selectedPage.instagram_business_account || null,
    } : null,
  };

  return {
    ok: true,
    checked_at: new Date().toISOString(),
    health: readMetaPublishingHealth(),
    summary,
  };
}

export function buildMetaAuthUrl({ state }) {
  const { appId, redirectUri } = requireMetaAppEnv();
  const configId = process.env.META_LOGIN_CONFIG_ID || process.env.FACEBOOK_LOGIN_CONFIG_ID || "";
  const scopes = [...new Set([...facebookRequiredScopes(), ...instagramRequiredScopes()])];
  const authUrl = new URL(`https://www.facebook.com/${graphVersion()}/dialog/oauth`);
  authUrl.searchParams.set("client_id", appId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  if (configId) {
    authUrl.searchParams.set("config_id", configId);
    authUrl.searchParams.set("override_default_response_type", "true");
  } else {
    authUrl.searchParams.set("scope", scopes.join(","));
  }
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("auth_type", "rerequest");
  return { authUrl, scopes, configId };
}

export async function exchangeMetaPublishingCode(code) {
  const { appId, appSecret, redirectUri } = requireMetaAppEnv();
  const shortLived = await metaApi("/oauth/access_token", {
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  }, { noAuth: true });

  const longLived = await metaApi("/oauth/access_token", {
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortLived.access_token,
  }, { noAuth: true });

  const token = {
    access_token: longLived.access_token || shortLived.access_token,
    token_type: longLived.token_type || shortLived.token_type || "bearer",
    expires_in: longLived.expires_in || shortLived.expires_in || null,
    obtained_at: new Date().toISOString(),
    expires_at: longLived.expires_in
      ? new Date(Date.now() + Number(longLived.expires_in) * 1000).toISOString()
      : null,
  };

  const accounts = await metaApi("/me/accounts", {
    fields: "id,name,access_token,permissions,instagram_business_account{id,username,name}",
    limit: 50,
  }, { accessToken: token.access_token });
  const selectedPage = selectPage(accounts.data || [], process.env.META_FACEBOOK_PAGE_ID || "");
  if (!selectedPage) throw new Error("Meta OAuth succeeded, but no Facebook Page was returned for this user.");
  const instagramAccounts = instagramAccountsFromPages(accounts.data || []);

  const saved = {
    ...token,
    scopes: [...new Set([...facebookRequiredScopes(), ...instagramRequiredScopes()])],
    page_id: selectedPage.id,
    page_name: selectedPage.name,
    page_access_token: selectedPage.access_token,
    page_permissions: selectedPage.permissions || [],
    instagram_business_account: selectedPage.instagram_business_account || null,
    instagram_accounts: instagramAccounts,
    authorized_pages: (accounts.data || []).map((page) => ({
      id: page.id,
      name: page.name,
      has_page_access_token: Boolean(page.access_token),
      instagram_business_account: page.instagram_business_account || null,
    })),
  };
  savePublishingToken(saved);
  return redactTokenForDisplay(saved);
}

async function publishFacebookVariant({ variant, packageRow, facebookPostType }) {
  const token = requirePublishingToken();
  const pageId = token.page_id || process.env.META_FACEBOOK_PAGE_ID;
  if (!pageId || !token.page_access_token) throw new Error("Meta publishing token is missing a Facebook Page access token.");

  const assetType = String(variant.asset_type || "").toLowerCase();
  const desiredType = String(facebookPostType || variant.metadata?.facebook_post_type || assetType || "feed").toLowerCase();
  const message = buildCaption(variant);

  if (desiredType === "video" || assetType === "video") {
    const payload = await buildVideoUploadPayload({ variant, packageRow, description: message });
    const video = await metaApi(`/${pageId}/videos`, payload.params, {
      method: "POST",
      accessToken: token.page_access_token,
      body: payload.body,
      headers: payload.headers,
    });
    return {
      id: video.id || null,
      url: video.id ? `https://www.facebook.com/${pageId}/videos/${video.id}/` : null,
      mode: "facebook_video",
      response: video,
    };
  }

  if (desiredType === "photo" || desiredType === "image" || assetType === "image") {
    const payload = await buildPhotoUploadPayload({ variant, caption: message });
    const photo = await metaApi(`/${pageId}/photos`, payload.params, {
      method: "POST",
      accessToken: token.page_access_token,
      body: payload.body,
      headers: payload.headers,
    });
    return {
      id: photo.post_id || photo.id || null,
      url: photo.post_id ? `https://www.facebook.com/${photo.post_id}` : null,
      mode: "facebook_photo",
      response: photo,
    };
  }

  const feed = await metaApi(`/${pageId}/feed`, {
    message,
    link: variant.destination_url || packageRow.destination_url || undefined,
  }, { method: "POST", accessToken: token.page_access_token });
  return {
    id: feed.id || null,
    url: feed.id ? `https://www.facebook.com/${feed.id}` : null,
    mode: "facebook_feed",
    response: feed,
  };
}

async function publishInstagramVariant({ variant, packageRow, instagramMediaType, instagramAccountId, instagramUsername }) {
  const token = requirePublishingToken();
  const target = resolveInstagramTarget({ token, variant, instagramAccountId, instagramUsername });
  const igUserId = target?.id || process.env.META_INSTAGRAM_USER_ID;
  if (!igUserId) throw new Error("Meta publishing token is missing a linked Instagram professional account.");
  if (!variant.asset_url || !/^https?:\/\//i.test(variant.asset_url)) {
    throw new Error("Instagram API publishing requires a public HTTPS image/video URL. Upload the approved media to Shopify Files/CDN, paste that CDN URL into the variant asset_url, then retry from the board.");
  }

  const assetType = String(variant.asset_type || "").toLowerCase();
  const mediaType = String(instagramMediaType || variant.metadata?.instagram_media_type || (assetType === "video" ? "REELS" : "IMAGE")).toUpperCase();
  const params = {
    caption: buildCaption(variant),
  };
  if (mediaType === "REELS" || mediaType === "VIDEO") {
    params.media_type = "REELS";
    params.video_url = variant.asset_url;
    params.share_to_feed = variant.metadata?.share_to_feed === false ? "false" : "true";
  } else if (mediaType === "STORIES") {
    params.media_type = "STORIES";
    params.image_url = variant.asset_url;
  } else {
    params.image_url = variant.asset_url;
  }

  const container = await metaApi(`/${igUserId}/media`, params, {
    method: "POST",
    accessToken: token.page_access_token,
  });
  if (!container.id) throw new Error("Instagram media container was not created.");

  await waitForInstagramContainer(container.id, token.page_access_token);
  const published = await metaApi(`/${igUserId}/media_publish`, { creation_id: container.id }, {
    method: "POST",
    accessToken: token.page_access_token,
  });
  const permalink = published.id
    ? await metaApi(`/${published.id}`, { fields: "id,permalink" }, { accessToken: token.page_access_token }).catch(() => null)
    : null;
  return {
    id: published.id || null,
    url: permalink?.permalink || null,
    mode: "instagram_media",
    container_id: container.id,
    target_account: target ? { id: target.id, username: target.username, page_id: target.page_id, page_name: target.page_name } : null,
    response: published,
  };
}

function resolveInstagramTarget({ token, variant, instagramAccountId, instagramUsername }) {
  const accounts = Array.isArray(token.instagram_accounts) && token.instagram_accounts.length
    ? token.instagram_accounts
    : token.instagram_business_account
      ? [{ ...token.instagram_business_account, page_id: token.page_id, page_name: token.page_name }]
      : [];
  const wantedId = instagramAccountId || variant.metadata?.instagram_account_id || "";
  const wantedUsername = normalizeUsername(instagramUsername || variant.metadata?.instagram_username || "");
  if (wantedId) return accounts.find((account) => account.id === wantedId) || { id: wantedId, username: wantedUsername || "" };
  if (wantedUsername) return accounts.find((account) => normalizeUsername(account.username) === wantedUsername) || null;
  return accounts[0] || token.instagram_business_account || null;
}

async function waitForInstagramContainer(containerId, accessToken) {
  const attempts = Number(process.env.META_INSTAGRAM_CONTAINER_POLL_ATTEMPTS || 20);
  const delayMs = Number(process.env.META_INSTAGRAM_CONTAINER_POLL_DELAY_MS || 5000);
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const status = await metaApi(`/${containerId}`, { fields: "status_code,status" }, { accessToken });
    if (status.status_code === "FINISHED") return status;
    if (["ERROR", "EXPIRED"].includes(status.status_code)) {
      throw new Error(`Instagram container processing failed: ${status.status_code} ${status.status || ""}`.trim());
    }
    await sleep(delayMs);
  }
  throw new Error("Instagram media container did not finish processing before timeout.");
}

async function buildVideoUploadPayload({ variant, packageRow, description }) {
  const params = {
    description,
    title: truncate(variant.metadata?.facebook_title || packageRow.title || "Golden Collections Video", 255),
    published: "true",
  };
  if (/^https?:\/\//i.test(variant.asset_url || "")) {
    return { params: { ...params, file_url: variant.asset_url }, body: undefined, headers: {} };
  }
  const file = resolveLocalAsset(variant.asset_url);
  const form = new FormData();
  for (const [key, value] of Object.entries(params)) form.set(key, value);
  form.set("source", new Blob([fs.readFileSync(file)], { type: contentTypeFor(file) }), path.basename(file));
  return { params: {}, body: form, headers: {} };
}

async function buildPhotoUploadPayload({ variant, caption }) {
  const params = { caption, published: "true" };
  if (/^https?:\/\//i.test(variant.asset_url || "")) {
    return { params: { ...params, url: variant.asset_url }, body: undefined, headers: {} };
  }
  const file = resolveLocalAsset(variant.asset_url);
  const form = new FormData();
  form.set("caption", caption);
  form.set("published", "true");
  form.set("source", new Blob([fs.readFileSync(file)], { type: contentTypeFor(file) }), path.basename(file));
  return { params: {}, body: form, headers: {} };
}

async function metaApi(pathname, params = {}, options = {}) {
  const cleanPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const url = new URL(`https://graph.facebook.com/${graphVersion()}${cleanPath}`);
  const method = options.method || "GET";
  const hasFormBody = options.body instanceof FormData;
  const body = options.body || (method === "GET" || hasFormBody ? undefined : new URLSearchParams(cleanParams(params)));

  if (method === "GET" || hasFormBody) {
    for (const [key, value] of Object.entries(cleanParams(params))) url.searchParams.set(key, String(value));
  }

  const token = options.accessToken || (!options.noAuth && !options.useAppToken ? requirePublishingToken().access_token : "");
  const res = await fetch(url, {
    method,
    body,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body instanceof URLSearchParams ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  const json = parseJsonOrText(text);
  if (!res.ok) {
    const message = json?.error?.message || text || res.statusText;
    const code = json?.error?.code ? ` code=${json.error.code}` : "";
    const subcode = json?.error?.error_subcode ? ` subcode=${json.error.error_subcode}` : "";
    throw new Error(`Meta Graph API ${method} ${cleanPath} HTTP ${res.status}${code}${subcode}: ${redact(message)}`);
  }
  return json;
}

function requireMetaAppEnv() {
  const appId = process.env.META_APP_ID || process.env.WHATSAPP_APP_ID || "887425463811453";
  const appSecret = process.env.META_APP_SECRET || process.env.WHATSAPP_APP_SECRET;
  const redirectUri = process.env.META_REDIRECT_URI || "http://localhost:3000/meta/callback";
  if (!appId || !appSecret) throw new Error("Missing META_APP_ID/META_APP_SECRET for Meta publishing OAuth.");
  return { appId, appSecret, redirectUri };
}

function requirePublishingToken() {
  const token = readTokenIfPresent();
  if (!token?.access_token) throw new Error(`Missing ${TOKEN_FILE}. Run Meta publishing OAuth first.`);
  if (token.expires_at && Date.parse(token.expires_at) <= Date.now()) {
    throw new Error("Meta publishing OAuth token is expired. Re-run Meta publishing OAuth.");
  }
  return token;
}

function readTokenIfPresent() {
  const file = findTokenFile();
  if (!file) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function findTokenFile() {
  return tokenCandidates().find((candidate) => fs.existsSync(candidate)) || null;
}

function tokenCandidates() {
  return [
    path.join(process.cwd(), "tmp", TOKEN_FILE),
    path.join(process.cwd(), "..", "tmp", TOKEN_FILE),
  ];
}

function savePublishingToken(token) {
  const file = tokenCandidates()[0];
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(token, null, 2));
}

function selectPage(pages, wantedPageId) {
  if (wantedPageId) {
    const found = pages.find((page) => page.id === wantedPageId);
    if (found) return found;
  }
  return pages.find((page) => /golden collections/i.test(page.name || "")) || pages[0] || null;
}

function instagramAccountsFromPages(pages) {
  return (pages || [])
    .filter((page) => page.instagram_business_account?.id)
    .map((page) => ({
      ...page.instagram_business_account,
      page_id: page.id,
      page_name: page.name,
      has_page_access_token: Boolean(page.access_token),
    }));
}

function facebookRequiredScopes() {
  return ["pages_show_list", "pages_read_engagement", "pages_manage_posts"];
}

function instagramRequiredScopes() {
  return ["instagram_basic", "instagram_content_publish", "pages_show_list", "pages_read_engagement"];
}

function hasScopes(actual, required) {
  return required.every((scope) => actual.includes(scope));
}

function hasAnyEnv(keys) {
  return keys.some((key) => Boolean(process.env[key]));
}

function normalizeUsername(value) {
  return String(value || "").trim().replace(/^@/, "").toLowerCase();
}

function cleanParams(params) {
  return Object.fromEntries(
    Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
}

function buildCaption(variant) {
  const tags = Array.isArray(variant.hashtags) && variant.hashtags.length ? `\n\n${variant.hashtags.join(" ")}` : "";
  const link = variant.destination_url ? `\n\n${variant.destination_url}` : "";
  return `${variant.caption || ""}${tags}${variant.platform === "facebook" ? link : ""}`.trim();
}

function resolveLocalAsset(assetUrl) {
  if (!assetUrl) throw new Error("Meta variant is missing asset_url.");
  const candidates = [];
  if (path.isAbsolute(assetUrl)) candidates.push(assetUrl);
  candidates.push(path.resolve(process.cwd(), assetUrl));
  candidates.push(path.resolve(process.cwd(), "..", assetUrl));
  const file = candidates.find((candidate) => fs.existsSync(candidate));
  if (!file) throw new Error(`Meta asset file not found. Tried: ${candidates.join(", ")}`);
  return file;
}

function contentTypeFor(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".mov") return "video/quicktime";
  if (ext === ".webm") return "video/webm";
  if ([".jpg", ".jpeg"].includes(ext)) return "image/jpeg";
  if (ext === ".png") return "image/png";
  return "video/mp4";
}

function graphVersion() {
  return process.env.META_GRAPH_API_VERSION || process.env.WHATSAPP_GRAPH_API_VERSION || DEFAULT_GRAPH_VERSION;
}

function truncate(value, length) {
  const text = String(value || "");
  return text.length > length ? text.slice(0, length - 1).trimEnd() : text;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseJsonOrText(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function redactTokenForDisplay(token) {
  return {
    saved: true,
    page_id: token.page_id,
    page_name: token.page_name,
    has_page_access_token: Boolean(token.page_access_token),
    instagram_business_account: token.instagram_business_account,
    instagram_accounts: (token.instagram_accounts || []).map((account) => ({
      id: account.id,
      username: account.username,
      name: account.name,
      page_id: account.page_id,
      page_name: account.page_name,
    })),
    scopes: token.scopes,
    expires_at: token.expires_at,
  };
}

function redact(value) {
  return String(value)
    .replace(/EA[A-Za-z0-9_-]{20,}/g, "[REDACTED_TOKEN]")
    .replace(/access_token=[^&\s"]+/g, "access_token=[REDACTED]");
}
