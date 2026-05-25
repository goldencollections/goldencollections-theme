import { getConfig } from "./config.js";

export async function sendTemplateMessage({ to, templateName, languageCode = "en", bodyParameters = [] }) {
  const config = getConfig();
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components: [
        {
          type: "body",
          parameters: bodyParameters.map((text) => ({ type: "text", text: String(text || "") }))
        }
      ]
    }
  };

  if (!config.automationEnabled || config.dryRun) {
    return { dry_run: true, payload: redactPayload(payload) };
  }

  const response = await fetch(
    `https://graph.facebook.com/${config.whatsappGraphApiVersion}/${config.whatsappPhoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.whatsappAccessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  );
  const text = await response.text();
  const json = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(`WhatsApp send failed ${response.status}: ${text}`);
  }
  return json;
}

function redactPayload(payload) {
  return {
    ...payload,
    to: payload.to.replace(/.(?=.{4})/g, "*")
  };
}
