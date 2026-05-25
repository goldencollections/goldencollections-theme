import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { buildMetaAuthUrl, exchangeMetaPublishingCode } from "../lib/meta-publisher.js";
import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();

const redirectUri = process.env.META_REDIRECT_URI || "http://localhost:3000/meta/callback";
const listenUrl = new URL(redirectUri);
const port = Number(listenUrl.port || (listenUrl.protocol === "https:" ? 443 : 80));
const host = listenUrl.hostname;
const state = crypto.randomBytes(16).toString("hex");
const { authUrl, scopes } = buildMetaAuthUrl({ state });
const tmpDir = path.resolve(process.cwd(), "..", "tmp");
const authUrlPath = path.join(tmpDir, "meta-auth-url.txt");
const logPath = path.join(tmpDir, "meta-oauth.log");

fs.mkdirSync(tmpDir, { recursive: true });

function log(message) {
  fs.appendFileSync(logPath, `${new Date().toISOString()} ${message}\n`);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", redirectUri);
    if (url.pathname !== listenUrl.pathname) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const error = url.searchParams.get("error");
    if (error) {
      const message = `${error}: ${url.searchParams.get("error_description") || ""}`;
      log(`OAuth error ${message}`);
      res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(`Meta authorization failed: ${message}`);
      server.close();
      return;
    }

    if (url.searchParams.get("state") !== state) {
      res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("State mismatch. Please restart the Meta OAuth helper.");
      server.close();
      return;
    }

    const code = url.searchParams.get("code");
    if (!code) {
      res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Missing authorization code.");
      server.close();
      return;
    }

    const saved = await exchangeMetaPublishingCode(code);
    log(`Meta publishing token saved for Page ${saved.page_name || saved.page_id}`);
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h1>Meta publishing authorization complete</h1><p>You can close this tab and return to Codex.</p>");
    server.close();
  } catch (error) {
    log(`Callback error ${error.stack || error.message}`);
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(`Meta authorization failed: ${error.message}`);
    server.close();
  }
});

server.listen(port, host, () => {
  fs.writeFileSync(authUrlPath, authUrl.toString());
  log(`Requested scopes: ${scopes.join(", ")}`);
  log(`Open this URL: ${authUrl.toString()}`);
  console.log(authUrl.toString());
});
