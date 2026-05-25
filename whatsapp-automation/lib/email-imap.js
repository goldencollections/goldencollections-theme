import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

export async function fetchRecentSupportEmails(config) {
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
    const lock = await client.getMailboxLock("INBOX", { readOnly: true });
    try {
      const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const uids = await client.search({ since });
      const selected = uids.slice(-config.ingestLimit);
      if (!selected.length) return [];

      const messages = [];

      for await (const message of client.fetch(selected, { uid: true, envelope: true, source: true, flags: true })) {
        const parsed = await simpleParser(message.source);
        messages.push(toSupportEmail(message, parsed));
      }

      return messages.sort((a, b) => new Date(a.received_at) - new Date(b.received_at));
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
}

function toSupportEmail(message, parsed) {
  const from = parsed.from?.value?.[0] || {};
  const providerMessageId = parsed.messageId || `imap:${message.uid}`;
  return {
    mailbox: "INBOX",
    provider_message_id: providerMessageId,
    imap_uid: message.uid,
    message_id: parsed.messageId || null,
    thread_key: parsed.inReplyTo || parsed.references?.[0] || parsed.messageId || providerMessageId,
    from_email: from.address || "",
    from_name: from.name || "",
    to_email: parsed.to?.text || "",
    subject: parsed.subject || "",
    received_at: (parsed.date || new Date()).toISOString(),
    plain_text: (parsed.text || "").slice(0, 20000),
    html_text: (parsed.html || "").slice(0, 50000),
    raw_headers: Object.fromEntries(parsed.headers || []),
  };
}
