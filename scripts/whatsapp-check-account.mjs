import fs from "node:fs";
import path from "node:path";
import { requireWhatsappEnv, root, whatsappApi } from "./whatsapp-lib.mjs";

const { phoneNumberId, businessAccountId } = requireWhatsappEnv();
const outputPath = path.join(root, "tmp", "whatsapp-account-check.json");
const output = {
  created_at: new Date().toISOString(),
  phoneNumberId,
  businessAccountId,
  phoneNumber: null,
  businessAccount: null,
  errors: [],
};

async function capture(key, fn) {
  try {
    output[key] = await fn();
  } catch (error) {
    output.errors.push({ key, message: error.message });
  }
}

await capture("phoneNumber", async () =>
  whatsappApi(`/${phoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating,platform_type,code_verification_status,name_status`),
);

await capture("businessAccount", async () =>
  whatsappApi(`/${businessAccountId}?fields=id,name,currency,timezone_id,message_template_namespace`),
);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(
  JSON.stringify(
    {
      outputPath,
      phoneNumberId,
      businessAccountId,
      phoneNumber: output.phoneNumber
        ? {
            id: output.phoneNumber.id,
            display_phone_number: output.phoneNumber.display_phone_number,
            verified_name: output.phoneNumber.verified_name,
            quality_rating: output.phoneNumber.quality_rating,
            platform_type: output.phoneNumber.platform_type,
            name_status: output.phoneNumber.name_status,
          }
        : null,
      businessAccount: output.businessAccount
        ? {
            id: output.businessAccount.id,
            name: output.businessAccount.name,
            currency: output.businessAccount.currency,
            timezone_id: output.businessAccount.timezone_id,
          }
        : null,
      errors: output.errors,
    },
    null,
    2,
  ),
);
