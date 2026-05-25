import crypto from "node:crypto";
import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();

const positional = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const redirectUri = argValue("--redirect") || positional[0] || process.env.META_REDIRECT_URI || "https://www.goldencollections.com/meta/callback";
const configId = argValue("--config-id") || positional[1] || process.env.META_LOGIN_CONFIG_ID || process.env.FACEBOOK_LOGIN_CONFIG_ID || "";
process.env.META_REDIRECT_URI = redirectUri;
if (configId) process.env.META_LOGIN_CONFIG_ID = configId;

const { buildMetaAuthUrl } = await import("../lib/meta-publisher.js");

const state = argValue("--state") || crypto.randomBytes(16).toString("hex");
const { authUrl, scopes, configId: resolvedConfigId } = buildMetaAuthUrl({ state });

console.log(JSON.stringify({
  ok: true,
  redirect_uri: redirectUri,
  state,
  config_id: resolvedConfigId || null,
  scopes,
  auth_url: authUrl.toString(),
}, null, 2));

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : "";
}
