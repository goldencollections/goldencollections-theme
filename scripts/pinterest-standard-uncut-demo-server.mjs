import crypto from "crypto";
import fs from "fs";
import http from "http";
import path from "path";

const root = process.cwd();
const envPath = path.join(root, "env");
const tmpDir = path.join(root, "tmp");
const tokenPath = path.join(tmpDir, "pinterest-token.json");
const sandboxTokenPath = path.join(tmpDir, "pinterest-sandbox-token.txt");
const resultPath = path.join(tmpDir, "pinterest-uncut-demo-result.json");
const authUrlPath = path.join(tmpDir, "pinterest-uncut-auth-url.txt");
const port = Number(process.env.PINTEREST_DEMO_PORT || 3000);
const redirectUri = `http://localhost:${port}/pinterest/callback`;
const state = crypto.randomBytes(16).toString("hex");
const scopes = ["boards:read", "boards:write", "pins:read", "pins:write", "user_accounts:read"];

function readEnv() {
  if (!fs.existsSync(envPath)) throw new Error("Missing env file.");
  return Object.fromEntries(
    fs.readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      })
  );
}

const env = readEnv();
const clientId = env.PINTEREST_APP_ID;
const clientSecret = env.PINTEREST_APP_SECRET;

if (!clientId || !clientSecret) {
  throw new Error("Missing PINTEREST_APP_ID or PINTEREST_APP_SECRET in env.");
}

fs.mkdirSync(tmpDir, { recursive: true });

const authUrl = new URL("https://www.pinterest.com/oauth/");
authUrl.searchParams.set("client_id", clientId);
authUrl.searchParams.set("redirect_uri", redirectUri);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", scopes.join(","));
authUrl.searchParams.set("state", state);
fs.writeFileSync(authUrlPath, authUrl.toString());

function html(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>
  :root { --bg:#f8f5ef; --ink:#191714; --muted:#665f55; --line:#ded6ca; --panel:#fffdf8; --red:#bd081c; --green:#087857; --blue:#1d4ed8; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font-family:Arial, Helvetica, sans-serif; }
  main { max-width:1120px; margin:0 auto; padding:36px 42px; }
  header { border-bottom:2px solid var(--line); padding-bottom:18px; margin-bottom:22px; }
  h1 { margin:0 0 8px; font-size:34px; line-height:1.12; }
  h2 { margin:22px 0 10px; font-size:22px; }
  p, li { font-size:17px; line-height:1.42; }
  .muted { color:var(--muted); }
  .panel { background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:18px 20px; margin:16px 0; }
  .grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .ok { color:var(--green); font-weight:700; }
  .warn { color:var(--red); font-weight:700; }
  .pill { display:inline-block; border-radius:999px; padding:6px 10px; background:#eee6da; font-weight:700; font-size:14px; }
  a.button, button { display:inline-block; border:0; border-radius:6px; padding:12px 16px; background:var(--red); color:white; font-weight:700; font-size:16px; text-decoration:none; cursor:pointer; }
  a.secondary { background:var(--blue); }
  code { background:#f0e8dc; border:1px solid #dfd2c1; border-radius:5px; padding:2px 5px; }
  pre { white-space:pre-wrap; word-break:break-word; background:#1f2937; color:#f9fafb; padding:14px; border-radius:8px; font-size:14px; line-height:1.35; max-height:360px; overflow:auto; }
  .small { font-size:14px; }
</style>
</head>
<body><main>${body}</main></body>
</html>`;
}

function send(res, title, body) {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html(title, body));
}

function sendJson(res, payload, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload, null, 2));
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

async function pinterest(baseUrl, token, pathname, options = {}) {
  const res = await fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }
  }
  return { ok: res.ok, status: res.status, json };
}

function productionToken() {
  const tokenJson = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
  if (!tokenJson.access_token) throw new Error("Production token file has no access token.");
  return tokenJson.access_token;
}

function sandboxToken() {
  if (!fs.existsSync(sandboxTokenPath)) throw new Error("Missing tmp/pinterest-sandbox-token.txt.");
  return fs.readFileSync(sandboxTokenPath, "utf8").trim();
}

async function runApiCheck() {
  const prodBase = "https://api.pinterest.com/v5";
  const sandboxBase = "https://api-sandbox.pinterest.com/v5";
  const prodToken = productionToken();
  const sandToken = sandboxToken();

  const productionBoards = await pinterest(prodBase, prodToken, "/boards?page_size=25");
  const prodBoardItems = productionBoards.json?.items || [];
  const productionCreateAttempt = prodBoardItems[0]
    ? await pinterest(prodBase, prodToken, "/pins", {
        method: "POST",
        body: JSON.stringify({
          board_id: prodBoardItems[0].id,
          title: "Golden Collections Trial Restriction Demo",
          description: "This production create attempt is expected to be blocked under Trial access.",
          link: "https://www.goldencollections.com/blogs/jewellery-guides/real-kemp-jewellery-guide",
          media_source: {
            source_type: "image_url",
            url: "https://cdn.shopify.com/s/files/1/0764/9224/3242/articles/gc-real-kemp-arangetram-set-bks001-2026.jpg?v=1778696580",
          },
        }),
      })
    : null;

  let sandboxBoards = await pinterest(sandboxBase, sandToken, "/boards?page_size=25");
  let sandboxBoard = sandboxBoards.json?.items?.[0] || null;
  if (!sandboxBoard) {
    const createdBoard = await pinterest(sandboxBase, sandToken, "/boards", {
      method: "POST",
      body: JSON.stringify({
        name: "Golden Collections API Demo",
        description: "Sandbox-only board for Pinterest API review demo.",
        privacy: "PUBLIC",
      }),
    });
    if (!createdBoard.ok) throw new Error(`Sandbox board create failed: ${JSON.stringify(createdBoard.json)}`);
    sandboxBoard = createdBoard.json;
    sandboxBoards = await pinterest(sandboxBase, sandToken, "/boards?page_size=25");
  }

  const createPin = await pinterest(sandboxBase, sandToken, "/pins", {
    method: "POST",
    body: JSON.stringify({
      board_id: sandboxBoard.id,
      title: `Real Kemp Jewellery Guide - API Demo ${new Date().toISOString().slice(0, 19)}Z`,
      description: "Continuous uncut Golden Collections sandbox Pin demo for Pinterest API review.",
      link: "https://www.goldencollections.com/blogs/jewellery-guides/real-kemp-jewellery-guide",
      media_source: {
        source_type: "image_url",
        url: "https://cdn.shopify.com/s/files/1/0764/9224/3242/articles/gc-real-kemp-arangetram-set-bks001-2026.jpg?v=1778696580",
      },
    }),
  });

  const result = {
    productionBoards: {
      ok: productionBoards.ok,
      status: productionBoards.status,
      count: prodBoardItems.length,
      sample: prodBoardItems.slice(0, 3).map((board) => ({ id: board.id, name: board.name })),
    },
    productionCreateAttempt: productionCreateAttempt
      ? {
          ok: productionCreateAttempt.ok,
          status: productionCreateAttempt.status,
          error: productionCreateAttempt.ok ? null : productionCreateAttempt.json,
        }
      : null,
    sandboxBoards: {
      ok: sandboxBoards.ok,
      status: sandboxBoards.status,
      count: sandboxBoards.json?.items?.length || 0,
      board: { id: sandboxBoard.id, name: sandboxBoard.name },
    },
    sandboxCreatePin: {
      ok: createPin.ok,
      status: createPin.status,
      id: createPin.json?.id || null,
      url: createPin.json?.id ? `https://www.pinterest.com/pin/${createPin.json.id}/` : null,
      destinationUrl: createPin.json?.link || null,
      error: createPin.ok ? null : createPin.json,
    },
    security: {
      tokensDisplayed: false,
      secretsDisplayed: false,
    },
  };
  fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
  return result;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://localhost:${port}`);

    if (url.pathname === "/" || url.pathname === "/demo") {
      send(res, "Pinterest Uncut API Demo", `
        <header>
          <h1>Golden Collections Pinterest API Demo</h1>
          <p class="muted">Continuous recording: OAuth consent, callback/code, server-side token exchange, live API checks, sandbox Pin creation, and created Pin page.</p>
        </header>
        <div class="panel">
          <p><span class="pill">App ID ${clientId}</span> <span class="pill">Redirect ${redirectUri}</span></p>
          <p>No access tokens, refresh tokens, or app secrets are displayed on this page.</p>
          <a class="button" id="oauth-link" href="${authUrl.toString()}">Open Pinterest OAuth authorization</a>
        </div>
        <div class="grid">
          <div class="panel"><h2>What this recording will show</h2><ol><li>Give access screen</li><li>Callback with authorization code in URL</li><li>Server-side token exchange</li><li>Live Pinterest API calls</li><li>Created Pin on Pinterest</li></ol></div>
          <div class="panel"><h2>Security</h2><ul><li>Token exchange happens on the local server.</li><li>Tokens are saved locally but never printed.</li><li>Only sanitized API statuses are shown.</li></ul></div>
        </div>
      `);
      return;
    }

    if (url.pathname === "/pinterest/callback") {
      const callbackUrl = `http://localhost:${port}${req.url || ""}`;
      const error = url.searchParams.get("error");
      if (error) throw new Error(`${error}: ${url.searchParams.get("error_description") || ""}`);
      if (url.searchParams.get("state") !== state) throw new Error("State mismatch. Restart the demo server.");
      const code = url.searchParams.get("code");
      if (!code) throw new Error("Missing authorization code.");
      const token = await exchangeCode(code);
      fs.writeFileSync(tokenPath, JSON.stringify({
        ...token,
        obtained_at: new Date().toISOString(),
        expires_at: token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : null,
        scope_requested: scopes,
      }, null, 2));
      send(res, "Pinterest OAuth Callback Complete", `
        <header>
          <h1>OAuth callback received</h1>
          <p class="muted">The browser was redirected to localhost with an authorization code. The code has now been exchanged server-side for an access token.</p>
        </header>
        <div class="panel">
          <p><span class="ok">Server-side token exchange complete.</span></p>
          <p>Redirect URL received by local server:</p>
          <pre>${callbackUrl}</pre>
          <p>Authorization code from callback:</p>
          <pre>${code}</pre>
          <p>Token saved locally for API calls. Token value is not shown.</p>
          <button id="run-api">Run live API checks and create sandbox Pin</button>
        </div>
        <div class="panel">
          <h2>Live API results</h2>
          <pre id="api-output">Waiting to run API checks...</pre>
          <p id="pin-link"></p>
        </div>
        <script>
          document.getElementById("run-api").addEventListener("click", async () => {
            const output = document.getElementById("api-output");
            output.textContent = "Running production board list, production Trial create check, and sandbox Pin creation...";
            const response = await fetch("/run-api-check", { method: "POST" });
            const json = await response.json();
            output.textContent = JSON.stringify(json, null, 2);
            if (json.sandboxCreatePin && json.sandboxCreatePin.url) {
              document.getElementById("pin-link").innerHTML = '<a class="button secondary" id="open-pin" href="' + json.sandboxCreatePin.url + '">Open created Pin on Pinterest</a>';
            }
          });
        </script>
      `);
      return;
    }

    if (url.pathname === "/run-api-check") {
      const result = await runApiCheck();
      sendJson(res, result);
      return;
    }

    if (url.pathname === "/last-result") {
      if (!fs.existsSync(resultPath)) {
        sendJson(res, { error: "No result recorded yet." }, 404);
        return;
      }
      sendJson(res, JSON.parse(fs.readFileSync(resultPath, "utf8")));
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  } catch (error) {
    send(res, "Pinterest Demo Error", `
      <header><h1>Demo error</h1></header>
      <div class="panel"><p class="warn">${String(error.message || error)}</p></div>
      <pre>${String(error.stack || error)}</pre>
    `);
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Demo: http://127.0.0.1:${port}/demo`);
  console.log(`OAuth: ${authUrl.toString()}`);
});
