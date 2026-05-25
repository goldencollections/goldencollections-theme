import fs from "fs";
import http from "http";
import path from "path";
import crypto from "crypto";
import { requireGoogleEnv, root, saveToken } from "./google-gbp-lib.mjs";

const { clientId, clientSecret, redirectUri } = requireGoogleEnv();
const logPath = path.join(root, "tmp", "google-gbp-oauth.log");
const authUrlPath = path.join(root, "tmp", "google-gbp-auth-url.txt");

fs.mkdirSync(path.dirname(logPath), { recursive: true });

const state = crypto.randomBytes(16).toString("hex");
const scopes = ["https://www.googleapis.com/auth/business.manage"];
const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", clientId);
authUrl.searchParams.set("redirect_uri", redirectUri);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", scopes.join(" "));
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent");
authUrl.searchParams.set("state", state);

function log(message) {
  fs.appendFileSync(logPath, `${new Date().toISOString()} ${message}\n`);
}

async function exchangeCode(code) {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Token exchange failed HTTP ${res.status}: ${text}`);
  return JSON.parse(text);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", redirectUri);
    if (url.pathname !== new URL(redirectUri).pathname) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const error = url.searchParams.get("error");
    if (error) {
      const message = `${error}: ${url.searchParams.get("error_description") || ""}`;
      log(`OAuth error ${message}`);
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end(`Google authorization failed: ${message}`);
      server.close();
      return;
    }

    if (url.searchParams.get("state") !== state) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("State mismatch. Refusing token exchange.");
      server.close();
      return;
    }

    const code = url.searchParams.get("code");
    if (!code) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("Missing code");
      return;
    }

    const token = await exchangeCode(code);
    saveToken(token);
    log("Google OAuth token saved to tmp/google-gbp-token.json");
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Google Business Profile authorization complete. You can close this tab.");
    server.close();
  } catch (error) {
    log(`Callback failure ${error.stack || error.message}`);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end(`Google OAuth callback failed: ${error.message}`);
    server.close();
  }
});

const listenUrl = new URL(redirectUri);
const port = Number(listenUrl.port || (listenUrl.protocol === "https:" ? 443 : 80));
const host = listenUrl.hostname;

server.listen(port, host, () => {
  fs.writeFileSync(authUrlPath, authUrl.toString());
  log(`Open this URL: ${authUrl.toString()}`);
  console.log(authUrl.toString());
});
