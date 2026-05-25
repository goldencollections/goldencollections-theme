import { ImapFlow } from "imapflow";
import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();

const config = {
  address: process.env.GMAIL_ADDRESS || "goldencollections9@gmail.com",
  host: process.env.GMAIL_IMAP_HOST || "imap.gmail.com",
  port: Number(process.env.GMAIL_IMAP_PORT || 993),
  secure: process.env.GMAIL_IMAP_SECURE !== "false",
  password: process.env.GMAIL_APP_PASSWORD,
};

if (!config.address || !config.password) {
  throw new Error("Missing GMAIL_ADDRESS or GMAIL_APP_PASSWORD.");
}

if (/^REPLACE_IN_DOPPLER/i.test(config.password)) {
  throw new Error("GMAIL_APP_PASSWORD is still the placeholder value.");
}

const client = new ImapFlow({
  host: config.host,
  port: config.port,
  secure: config.secure,
  auth: {
    user: config.address,
    pass: config.password,
  },
  logger: false,
});

await client.connect();
try {
  const lock = await client.getMailboxLock("INBOX", { readOnly: true });
  try {
    const status = await client.status("INBOX", { messages: true, unseen: true });
    console.log(JSON.stringify({
      ok: true,
      address: config.address,
      host: config.host,
      inbox: {
        messages: status.messages,
        unseen: status.unseen,
      },
    }, null, 2));
  } finally {
    lock.release();
  }
} finally {
  await client.logout().catch(() => {});
}
