export function getEmailConfig({ requireMailbox = false } = {}) {
  const config = {
    address: process.env.SUPPORT_EMAIL_ADDRESS || "support@goldencollections.com",
    from: process.env.SUPPORT_EMAIL_FROM || "Golden Collections Support <support@goldencollections.com>",
    imap: {
      host: process.env.SUPPORT_EMAIL_IMAP_HOST || "imap.secureserver.net",
      port: Number(process.env.SUPPORT_EMAIL_IMAP_PORT || 993),
      secure: process.env.SUPPORT_EMAIL_IMAP_SECURE !== "false",
      user: process.env.SUPPORT_EMAIL_USERNAME,
      pass: process.env.SUPPORT_EMAIL_PASSWORD,
    },
    smtp: {
      host: process.env.SUPPORT_EMAIL_SMTP_HOST || "smtpout.secureserver.net",
      port: Number(process.env.SUPPORT_EMAIL_SMTP_PORT || 465),
      secure: process.env.SUPPORT_EMAIL_SMTP_SECURE !== "false",
      user: process.env.SUPPORT_EMAIL_USERNAME,
      pass: process.env.SUPPORT_EMAIL_PASSWORD,
    },
    sentMailbox: process.env.SUPPORT_EMAIL_SENT_MAILBOX || "Sent",
    saveSentCopy: process.env.SUPPORT_EMAIL_SAVE_SENT_COPY !== "false",
    ingestLimit: Number(process.env.SUPPORT_EMAIL_INGEST_LIMIT || 25),
    automationEnabled: process.env.SUPPORT_EMAIL_AUTOMATION_ENABLED === "true",
    sendEnabled: process.env.SUPPORT_EMAIL_SEND_ENABLED === "true",
    dryRun: process.env.SUPPORT_EMAIL_DRY_RUN !== "false",
  };

  const missing = missingEmailConfig(config);
  if (requireMailbox && missing.length) {
    throw new Error(`Missing support email env keys: ${missing.join(", ")}`);
  }

  return {
    ...config,
    configured: missing.length === 0,
    missing,
  };
}

export function missingEmailConfig(config = getEmailConfig()) {
  const missing = [];
  if (!config.address) missing.push("SUPPORT_EMAIL_ADDRESS");
  if (!config.imap.host) missing.push("SUPPORT_EMAIL_IMAP_HOST");
  if (!config.imap.port) missing.push("SUPPORT_EMAIL_IMAP_PORT");
  if (!config.smtp.host) missing.push("SUPPORT_EMAIL_SMTP_HOST");
  if (!config.smtp.port) missing.push("SUPPORT_EMAIL_SMTP_PORT");
  if (!config.imap.user) missing.push("SUPPORT_EMAIL_USERNAME");
  if (!config.imap.pass) missing.push("SUPPORT_EMAIL_PASSWORD");
  return missing;
}
