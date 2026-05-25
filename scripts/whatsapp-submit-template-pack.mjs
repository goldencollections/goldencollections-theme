import fs from "node:fs";
import path from "node:path";
import { requireWhatsappEnv, whatsappApi } from "./whatsapp-lib.mjs";

const { businessAccountId, env, phoneNumberId } = requireWhatsappEnv();
const confirm = process.argv.includes("--confirm-submit");
const dryRun = process.argv.includes("--dry-run");
const onlyIndex = process.argv.findIndex((arg) => arg === "--only");
const only = onlyIndex >= 0 ? new Set(process.argv[onlyIndex + 1].split(",").map((name) => name.trim()).filter(Boolean)) : null;
const packPath = path.join(process.cwd(), "knowledge-base", "outputs", "whatsapp-template-pack-2026-05-15.json");

const pack = JSON.parse(fs.readFileSync(packPath, "utf8"));
const templates = only ? pack.templates.filter((template) => only.has(template.name)) : pack.templates;

if (!templates.length) {
  throw new Error("No matching templates to submit.");
}

const phoneNumber = await whatsappApi(
  `/${phoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating,platform_type,code_verification_status,name_status`,
);
const businessAccount = await whatsappApi(`/${businessAccountId}?fields=id,name,currency,timezone_id`);
const expectedDisplayPhone = env.WHATSAPP_EXPECTED_DISPLAY_PHONE;
const phoneMismatch = expectedDisplayPhone && phoneNumber.display_phone_number !== expectedDisplayPhone;
const preflight = {
  businessAccountId,
  businessAccountName: businessAccount.name,
  phoneNumberId,
  displayPhoneNumber: phoneNumber.display_phone_number,
  verifiedName: phoneNumber.verified_name,
  nameStatus: phoneNumber.name_status,
  codeVerificationStatus: phoneNumber.code_verification_status,
  expectedDisplayPhone: expectedDisplayPhone || null,
  phoneMismatch: Boolean(phoneMismatch),
  templateCount: templates.length,
  templateNames: templates.map((template) => template.name),
};

if (phoneMismatch) {
  throw new Error(
    `Configured WhatsApp phone mismatch: env WHATSAPP_EXPECTED_DISPLAY_PHONE is ${expectedDisplayPhone}, but Graph API returned ${phoneNumber.display_phone_number}.`,
  );
}

if (dryRun) {
  console.log(JSON.stringify({ dryRun: true, preflight }, null, 2));
  process.exit(0);
}

if (!confirm) {
  throw new Error("Refusing to submit WhatsApp templates without --confirm-submit. Use --dry-run to preflight without submitting.");
}

const results = [];
for (const template of templates) {
  try {
    const result = await whatsappApi(`/${businessAccountId}/message_templates`, {
      method: "POST",
      body: JSON.stringify(template),
    });
    results.push({ name: template.name, ok: true, result });
  } catch (error) {
    results.push({ name: template.name, ok: false, error: error.message });
  }
}

console.log(JSON.stringify({ submitted_at: new Date().toISOString(), preflight, results }, null, 2));
