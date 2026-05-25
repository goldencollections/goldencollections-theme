import fs from "fs";
import http from "http";
import path from "path";
import crypto from "crypto";

const root = process.cwd();
const env = Object.fromEntries(
  fs.readFileSync(path.join(root, "env"), "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    })
);

const clientId = env.PINTEREST_APP_ID;
const clientSecret = env.PINTEREST_APP_SECRET;
const redirectUri = env.PINTEREST_REDIRECT_URI || "http://localhost:3000/pinterest/callback";
const tokenPath = path.join(root, "tmp", "pinterest-token.json");
const logPath = path.join(root, "tmp", "pinterest-oauth.log");

if (!clientId || !clientSecret) {
  throw new Error("Missing PINTEREST_APP_ID or PINTEREST_APP_SECRET in env");
}

fs.mkdirSync(path.dirname(tokenPath), { recursive: true });
const state = crypto.randomBytes(16).toString("hex");
const scopes = ["boards:read", "boards:write", "pins:read", "pins:write", "user_accounts:read"];
const authUrl = new URL("https://www.pinterest.com/oauth/");
authUrl.searchParams.set("client_id", clientId);
authUrl.searchParams.set("redirect_uri", redirectUri);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", scopes.join(","));
authUrl.searchParams.set("state", state);

function log(message) {
  fs.appendFileSync(logPath, `${new Date().toISOString()} ${message}\n`);
}

async function exchangeCode(code) {
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
  const res = await fetch("https://api.pinterest.com/v5/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
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
      res.end(`Pinterest authorization failed: ${message}`);
      server.close();
      return;
    }
    if (url.searchParams.get("state") !== state) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("State mismatch. Please restart the OAuth helper.");
      server.close();
      return;
    }
    const code = url.searchParams.get("code");
    if (!code) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("Missing authorization code.");
      server.close();
      return;
    }
    const token = await exchangeCode(code);
    const saved = {
      ...token,
      obtained_at: new Date().toISOString(),
      expires_at: token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : null,
      scope_requested: scopes,
    };
    fs.writeFileSync(tokenPath, JSON.stringify(saved, null, 2));
    log(`Token saved to ${tokenPath}`);
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<h1>Pinterest authorization complete</h1><p>You can close this tab and return to Codex.</p>");
    server.close();
  } catch (error) {
    log(`Callback error ${error.stack || error.message}`);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end(`Pinterest authorization failed: ${error.message}`);
    server.close();
  }
});

server.listen(new URL(redirectUri).port || 80, "127.0.0.1", () => {
  fs.writeFileSync(path.join(root, "tmp", "pinterest-auth-url.txt"), authUrl.toString());
  log(`Open this URL: ${authUrl.toString()}`);
  console.log(authUrl.toString());
});
