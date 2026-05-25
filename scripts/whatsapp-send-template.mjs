import fs from "node:fs";
import path from "node:path";
import { requireWhatsappEnv, root, whatsappApi } from "./whatsapp-lib.mjs";

const { env, phoneNumberId } = requireWhatsappEnv();
const recipient = process.argv[2] || env.WHATSAPP_TEST_RECIPIENT_PHONE;
const templateName = process.argv[3] || env.WHATSAPP_TEST_TEMPLATE_NAME || "hello_world";
const languageCode = process.argv[4] || env.WHATSAPP_TEST_TEMPLATE_LANGUAGE || "en_US";

if (!recipient) {
  throw new Error("Missing recipient phone number. Pass it as the first argument or set WHATSAPP_TEST_RECIPIENT_PHONE in env.");
}

const outputPath = path.join(root, "tmp", "whatsapp-send-template-result.json");
const payload = {
  messaging_product: "whatsapp",
  to: recipient.replace(/^\+/, ""),
  type: "template",
  template: {
    name: templateName,
    language: { code: languageCode },
  },
};

const result = await whatsappApi(`/${phoneNumberId}/messages`, {
  method: "POST",
  body: JSON.stringify(payload),
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(
  outputPath,
  JSON.stringify(
    {
      created_at: new Date().toISOString(),
      recipientMasked: payload.to.replace(/.(?=.{4})/g, "*"),
      templateName,
      languageCode,
      result,
    },
    null,
    2,
  ),
);

console.log(
  JSON.stringify(
    {
      outputPath,
      recipientMasked: payload.to.replace(/.(?=.{4})/g, "*"),
      templateName,
      languageCode,
      messageId: result.messages?.[0]?.id,
      status: result.messages?.[0]?.message_status || null,
    },
    null,
    2,
  ),
);
