# Hermes Email Access Plan

Last updated: 2026-05-20

Purpose: connect email context to Hermes without giving Hermes unsafe customer-facing send permissions.

## Accounts

### Public Support Mailbox

- Address: `support@goldencollections.com`
- Provider: GoDaddy/Titan email
- Purpose: customer support, order help, deity fit questions, real kemp enquiries, returns/exchanges, wholesale enquiries
- Public-facing: yes
- Automation path: existing `whatsapp-automation` support-email pipeline

### Admin Gmail

- Address: `goldencollections9@gmail.com`
- Purpose: admin/login/business-account context only
- Public-facing: no
- Do not use in customer support signatures, storefront copy, schema, public pages, or AI-facing public files.

## Current Status

Support email config exists in Doppler project `gc-whatsapp-automation` / `prd`.

Current safety flags:

- `SUPPORT_EMAIL_AUTOMATION_ENABLED=false`
- `SUPPORT_EMAIL_SEND_ENABLED=false`
- `SUPPORT_EMAIL_DRY_RUN=true`

This is intentional until mailbox authentication is fixed and owner approves a live operating mode.

Local config check passes.

Read-only IMAP ingest works as of 2026-05-20 after the owner corrected the mailbox password in Doppler.

Manual `email:ingest:apply` created draft records for non-system messages. Sending remains disabled.

On 2026-05-24, Codex added and tested a controlled Titan SMTP outreach sender:

- Local script: `whatsapp-automation/scripts/outreach-send-batch.mjs`
- NPM command: `npm run email:outreach`
- Sender: `Golden Collections Support <support@goldencollections.com>`
- Default mode: dry-run only
- Live send gates: temporary `SUPPORT_EMAIL_SEND_ENABLED=true`, temporary `SUPPORT_EMAIL_DRY_RUN=false`, `--send`, `--confirm-send`, and explicit owner approval

Permanent Doppler defaults should remain:

- `SUPPORT_EMAIL_SEND_ENABLED=false`
- `SUPPORT_EMAIL_DRY_RUN=true`

The first approved outreach email was sent on 2026-05-24 20:24 IST to Academy of Kuchipudi Dance Atlanta at `akdatlanta@gmail.com`, subject `Teacher-first rangapravesam jewellery checklist`, SMTP message ID `<b990d1f9-c439-40f8-66bf-5f9615ed5232@goldencollections.com>`.

Titan SMTP does not automatically create Titan webmail Sent-folder copies. On 2026-05-25, Codex patched `whatsapp-automation/lib/email-smtp.js` so future `sendSupportEmail` calls append successful sends to the IMAP `Sent` mailbox. The self-test email and first Academy outreach email were manually appended to `Sent` without resending.

On 2026-05-25, owner approved sending the remaining 14 rows in the first USA dance-school outreach batch. Codex sent rows 2-15 using the controlled Titan SMTP path. The CSV tracker marks all 15 rows as `sent`, reply status `pending`, and Titan Sent-folder verification found all 15 outreach message IDs present.

## Approved Operating Model

Hermes should not connect directly to raw mailboxes as its first integration.

Use this safer flow:

1. Mailbox ingest reads email through the existing app.
2. Supabase stores normalized messages and draft replies.
3. Hermes/Codex reviews summaries and drafts.
4. Owner reviews, edits, and approves manually.
5. Live sending stays disabled until a separate explicit approval.

## Hermes Permissions

Hermes may:

- summarize email status and blockers
- read support-email workflow docs
- review dashboard summaries or draft lists when provided by the app
- draft suggested replies for owner review
- identify repeated customer questions that should become FAQs, product copy, or fit guidance

Hermes must not:

- send emails
- enable live send flags
- change mailbox settings
- change Gmail/Titan security settings
- expose passwords, app passwords, OAuth tokens, raw customer data, or private mailbox content in Telegram
- treat `goldencollections9@gmail.com` as public support

Exception: if the owner explicitly approves a specific outreach row or batch, Codex/Hermes may use the controlled `npm run email:outreach` Titan SMTP path with temporary per-command live-send overrides. Do not permanently change Doppler send flags, and do not send to multiple schools in one To/Cc list.

## What Owner Needs To Provide

For support mailbox:

1. Confirm whether to enable scheduled ingest later by setting `SUPPORT_EMAIL_AUTOMATION_ENABLED=true`.
2. Keep `SUPPORT_EMAIL_SEND_ENABLED=false` and `SUPPORT_EMAIL_DRY_RUN=true` until a separate live-send test is approved.

To add Gmail:

Completed on 2026-05-20:

- Gmail app password was created by owner and stored in Doppler project `gc-hermes-agent` / `prd`.
- Read-only IMAP check succeeded against `imap.gmail.com`.
- Test checked mailbox counts only, not message bodies.

Keep Gmail read-only/admin-only at first.

Do not route Gmail through public customer support drafts unless owner explicitly approves a specific use case.

## Next Test After Credentials Are Fixed

Completed on 2026-05-20:

- `npm run email:check`
- `npm run email:ingest`
- `npm run email:ingest:apply`

Future manual check:

Run:

```bash
doppler run --project gc-whatsapp-automation --config prd -- npm run email:ingest
```

If the messages look safe to store, optionally run:

```bash
doppler run --project gc-whatsapp-automation --config prd -- npm run email:ingest:apply
```

Only use `email:ingest:apply` after confirming the messages look safe to store.

For Gmail read-only connectivity:

```bash
doppler run --project gc-hermes-agent --config prd -- npm run gmail:check
```

For Hermes/VPS owner status checks, use the headers-only summary script:

```bash
cd /home/hermes/.hermes
doppler run -- /home/hermes/.hermes/scripts/gc_mail_summary.py
```

This script reads recent headers only. It does not read bodies, mark messages read, or send email.
