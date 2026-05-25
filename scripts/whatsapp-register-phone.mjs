import fs from "node:fs";
import path from "node:path";
import { requireWhatsappEnv, root, whatsappApi } from "./whatsapp-lib.mjs";

const { env, phoneNumberId } = requireWhatsappEnv();
const confirm = process.argv.includes("--confirm-register");
const pinArgIndex = process.argv.findIndex((arg) => arg === "--pin");
const pin = pinArgIndex >= 0 ? process.argv[pinArgIndex + 1] : process.env.WHATSAPP_REGISTER_PIN || env.WHATSAPP_REGISTER_PIN;

if (!confirm) {
  throw new Error("Refusing to register phone number without --confirm-register.");
}

if (!pin || !/^\d{6}$/.test(pin)) {
  throw new Error("Missing 6-digit registration PIN. Pass --pin 123456 or set WHATSAPP_REGISTER_PIN in env.");
}

const outputPath = path.join(root, "tmp", "whatsapp-register-phone-result.json");
const result = await whatsappApi(`/${phoneNumberId}/register`, {
  method: "POST",
  body: JSON.stringify({
    messaging_product: "whatsapp",
    pin,
  }),
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(
  outputPath,
  JSON.stringify(
    {
      created_at: new Date().toISOString(),
      phoneNumberId,
      result,
    },
    null,
    2,
  ),
);

console.log(JSON.stringify({ outputPath, phoneNumberId, result }, null, 2));
