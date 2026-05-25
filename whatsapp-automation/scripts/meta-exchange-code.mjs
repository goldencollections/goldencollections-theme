import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();

const positional = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const redirectUri = argValue("--redirect") || process.env.META_REDIRECT_URI || "https://www.goldencollections.com/meta/callback";
const input = argValue("--code") || argValue("--url") || positional[0] || process.env.META_OAUTH_CODE || process.env.META_OAUTH_CALLBACK_URL || "";
if (!input) {
  throw new Error("Provide --code CODE or --url FULL_CALLBACK_URL from the browser address bar.");
}

process.env.META_REDIRECT_URI = redirectUri;
const { exchangeMetaPublishingCode } = await import("../lib/meta-publisher.js");
const code = extractCode(input);
const saved = await exchangeMetaPublishingCode(code);

console.log(JSON.stringify({
  ok: true,
  redirect_uri: redirectUri,
  saved,
}, null, 2));

function extractCode(inputValue) {
  const value = String(inputValue || "").trim();
  if (!value) throw new Error("Missing OAuth code.");
  if (!/^https?:\/\//i.test(value)) return value;
  const url = new URL(value);
  const error = url.searchParams.get("error");
  if (error) throw new Error(`${error}: ${url.searchParams.get("error_description") || ""}`.trim());
  const code = url.searchParams.get("code");
  if (!code) throw new Error("Callback URL does not contain a code query parameter.");
  return code;
}

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : "";
}
