import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { requireWhatsappEnv, root, verifyMetaSignature } from "./whatsapp-lib.mjs";

const { verifyToken } = requireWhatsappEnv();
const port = Number(process.env.WHATSAPP_WEBHOOK_PORT || 3004);
const outputPath = path.join(root, "tmp", "whatsapp-webhook-events.jsonl");

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

function writeJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://localhost:${port}`);

  if (req.method === "GET" && url.pathname === "/whatsapp/webhook") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === verifyToken && challenge) {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(challenge);
      return;
    }
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Forbidden");
    return;
  }

  if (req.method === "POST" && url.pathname === "/whatsapp/webhook") {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const rawBody = Buffer.concat(chunks);
      const signature = req.headers["x-hub-signature-256"];
      const signatureOk = verifyMetaSignature(rawBody, Array.isArray(signature) ? signature[0] : signature);
      const event = {
        received_at: new Date().toISOString(),
        signatureOk,
        body: JSON.parse(rawBody.toString("utf8") || "{}"),
      };
      fs.appendFileSync(outputPath, `${JSON.stringify(event)}\n`);
      writeJson(res, 200, { ok: true });
    });
    return;
  }

  writeJson(res, 404, { error: "Not found" });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`WhatsApp webhook server listening at http://127.0.0.1:${port}/whatsapp/webhook`);
  console.log(`Events will be appended to ${outputPath}`);
});
