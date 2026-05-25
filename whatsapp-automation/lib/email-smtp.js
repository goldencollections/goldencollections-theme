import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";

export async function sendSupportEmail(config, { to, subject, text, inReplyTo, references }) {
  const message = {
    from: config.from,
    to,
    subject,
    text,
    inReplyTo: inReplyTo || undefined,
    references: references || undefined,
  };

  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });

  const sent = await transporter.sendMail(message);

  if (config.saveSentCopy !== false) {
    await appendSentCopy(config, message, sent).catch((error) => {
      sent.sentCopyError = error.message;
    });
  }

  return sent;
}

async function appendSentCopy(config, message, sent) {
  const raw = await buildRawMessage({ ...message, messageId: sent.messageId });
  const client = new ImapFlow({
    host: config.imap.host,
    port: config.imap.port,
    secure: config.imap.secure,
    auth: {
      user: config.imap.user,
      pass: config.imap.pass,
    },
    logger: false,
  });

  await client.connect();
  try {
    await client.append(config.sentMailbox || "Sent", raw, ["\\Seen"], new Date());
  } finally {
    await client.logout().catch(() => {});
  }
}

async function buildRawMessage(message) {
  const transporter = nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
    newline: "unix",
  });
  const compiled = await transporter.sendMail(message);
  return compiled.message;
}
