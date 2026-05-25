import http from "node:http";
import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();

const port = Number(process.env.PORT || 3025);
const host = process.env.HOST || "127.0.0.1";

const routes = {
  "/api/health": "../api/health.js",
  "/api/monitor/social-command-center": "../api/monitor/social-command-center.js",
  "/api/social/hermes-status": "../api/social/hermes-status.js",
  "/api/social/manual-pack": "../api/social/manual-pack.js",
  "/api/social/post-variant": "../api/social/post-variant.js",
  "/api/social/publish-variant": "../api/social/publish-variant.js",
  "/api/social/upsert-package": "../api/social/upsert-package.js",
};

const modules = new Map();

async function getHandler(pathname) {
  const file = routes[pathname];
  if (!file) return null;
  if (!modules.has(file)) modules.set(file, await import(file));
  return modules.get(file).default;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${host}:${port}`);
    const handler = await getHandler(url.pathname);
    if (!handler) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("Not found");
      return;
    }
    await handler(req, res);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end(error.stack || error.message);
  }
});

server.listen(port, host, () => {
  console.log(`Local dev server listening at http://${host}:${port}`);
  console.log(`Social Command Center: http://${host}:${port}/api/monitor/social-command-center?token=${process.env.CRON_SECRET || "YOUR_CRON_SECRET"}`);
});
