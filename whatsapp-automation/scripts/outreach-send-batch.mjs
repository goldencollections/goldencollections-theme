import fs from "node:fs";
import path from "node:path";
import { getEmailConfig } from "../lib/email-config.js";
import { sendSupportEmail } from "../lib/email-smtp.js";
import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();

const DEFAULT_CSV = path.resolve(
  process.cwd(),
  "..",
  "knowledge-base",
  "outputs",
  "usa-dance-school-outreach-first-15-ready-2026-05-24.csv"
);

const args = parseArgs(process.argv.slice(2));
const csvPath = path.resolve(args.csv || DEFAULT_CSV);
const send = Boolean(args.send);
const confirm = args["confirm-send"] === true;
const limit = args.limit ? Number(args.limit) : null;
const rowNumber = args.row ? Number(args.row) : null;

if (!fs.existsSync(csvPath)) {
  throw new Error(`CSV not found: ${csvPath}`);
}

const config = getEmailConfig({ requireMailbox: true });
const rows = parseCsv(fs.readFileSync(csvPath, "utf8"));
let selected = rows.filter((row) => row.email_to_use && row.sent_status !== "sent");

if (rowNumber) {
  selected = selected.filter((row) => Number(row.sequence) === rowNumber);
}

if (limit) {
  selected = selected.slice(0, limit);
}

if (!selected.length) {
  console.log(JSON.stringify({ send, selected: 0, message: "No unsent rows with email_to_use found." }, null, 2));
  process.exit(0);
}

if (send) {
  if (!confirm) throw new Error("Refusing to send without --confirm-send.");
  if (!config.sendEnabled || config.dryRun) {
    throw new Error("Refusing to send while SUPPORT_EMAIL_SEND_ENABLED is not true or SUPPORT_EMAIL_DRY_RUN is not false.");
  }
}

const results = [];

for (const row of selected) {
  const item = {
    sequence: row.sequence,
    target_name: row.target_name,
    to: row.email_to_use,
    subject: row.email_subject,
    send,
  };

  if (send) {
    const sent = await sendSupportEmail(config, {
      to: row.email_to_use,
      subject: row.email_subject,
      text: row.email_body,
    });
    item.smtp_message_id = sent.messageId || null;
  }

  results.push(item);
}

console.log(
  JSON.stringify(
    {
      from: config.from,
      csv: csvPath,
      send,
      selected: results.length,
      safety: {
        sendEnabled: config.sendEnabled,
        dryRun: config.dryRun,
      },
      results,
    },
    null,
    2
  )
);

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      i += 1;
    }
  }
  return parsed;
}

function parseCsv(text) {
  const records = [];
  let record = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      record.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      record.push(field);
      if (record.some((value) => value.length > 0)) records.push(record);
      record = [];
      field = "";
      continue;
    }

    field += char;
  }

  record.push(field);
  if (record.some((value) => value.length > 0)) records.push(record);

  const [headers, ...data] = records;
  if (!headers) return [];

  return data.map((values) => {
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    return row;
  });
}
