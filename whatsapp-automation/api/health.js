import { sendJson } from "../lib/http.js";

export default function handler(req, res) {
  return sendJson(res, 200, { ok: true, service: "golden-whatsapp-automation" });
}
