import { getEmailConfig } from "../lib/email-config.js";
import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();

const config = getEmailConfig();

console.log(JSON.stringify({
  configured: config.configured,
  missing: config.missing,
  address: config.address,
  imap: {
    host: config.imap.host,
    port: config.imap.port,
    secure: config.imap.secure,
    usernamePresent: Boolean(config.imap.user),
    passwordPresent: Boolean(config.imap.pass),
  },
  smtp: {
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
  },
  safety: {
    automationEnabled: config.automationEnabled,
    sendEnabled: config.sendEnabled,
    dryRun: config.dryRun,
  },
}, null, 2));
