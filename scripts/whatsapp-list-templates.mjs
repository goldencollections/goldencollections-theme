import fs from "node:fs";
import path from "node:path";
import { requireWhatsappEnv, root, whatsappApi } from "./whatsapp-lib.mjs";

const { businessAccountId } = requireWhatsappEnv();
const outputPath = path.join(root, "tmp", "whatsapp-message-templates.json");

const templates = [];
let nextPath = `/${businessAccountId}/message_templates?fields=name,status,category,language,components&limit=100`;

while (nextPath) {
  const data = await whatsappApi(nextPath);
  templates.push(...(data.data || []));
  const next = data.paging?.next || null;
  nextPath = next ? next.replace(/^https:\/\/graph\.facebook\.com\/v[0-9.]+/, "") : null;
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify({ created_at: new Date().toISOString(), businessAccountId, templates }, null, 2));

console.log(
  JSON.stringify(
    {
      outputPath,
      businessAccountId,
      templateCount: templates.length,
      templates: templates.map((template) => ({
        name: template.name,
        status: template.status,
        category: template.category,
        language: template.language,
        componentTypes: (template.components || []).map((component) => component.type),
      })),
    },
    null,
    2,
  ),
);
