# Support Email Workflow

Status: implementation added, live sending disabled by default.

Golden Collections uses `support@goldencollections.com`, purchased through GoDaddy/Titan email. Do not assume Microsoft 365 or Outlook is available for this mailbox unless the owner later confirms a migration.

## Current Direction

Use direct IMAP/SMTP access from the `whatsapp-automation` Vercel app:

- IMAP reads recent inbox messages.
- Supabase stores support emails and generated draft replies.
- Generated replies must use the Golden Collections support signature.
- The app normalizes older draft bodies to the current support signature when displaying or sending.
- SMTP can send approved replies later, but sending must stay disabled until the owner explicitly approves live sending.
- Codex can monitor, classify, and draft replies from this system once mailbox credentials are configured.
- System emails from senders such as GoDaddy, Shopify, no-reply, do-not-reply, postmaster, mailer-daemon, and similar automated sources are skipped before draft creation.

## Safety Rules

- Never paste or commit the mailbox password.
- Read-only ingest first.
- Draft replies first; send only after approval.
- Keep `SUPPORT_EMAIL_SEND_ENABLED=false` and `SUPPORT_EMAIL_DRY_RUN=true` until a live-send test is intentionally approved.
- Treat automated replies as customer-facing support, not marketing.

## Mail Server Settings

For GoDaddy Professional Email/Titan through GoDaddy, use:

- IMAP host: `imap.secureserver.net`
- IMAP port: `993`
- IMAP secure: `true`
- SMTP host: `smtpout.secureserver.net`
- SMTP port: `465`
- SMTP secure: `true`
- Username: `support@goldencollections.com`

Titan generic settings such as `imap.titan.email` and `smtp.titan.email` may exist, but for the current GoDaddy-managed setup the GoDaddy server settings are the preferred default.

## Environment Variables

Add these in Vercel and any local private env file used for testing:

```text
SUPPORT_EMAIL_ADDRESS=support@goldencollections.com
SUPPORT_EMAIL_FROM="Golden Collections Support <support@goldencollections.com>"
SUPPORT_EMAIL_IMAP_HOST=imap.secureserver.net
SUPPORT_EMAIL_IMAP_PORT=993
SUPPORT_EMAIL_IMAP_SECURE=true
SUPPORT_EMAIL_SMTP_HOST=smtpout.secureserver.net
SUPPORT_EMAIL_SMTP_PORT=465
SUPPORT_EMAIL_SMTP_SECURE=true
SUPPORT_EMAIL_USERNAME=support@goldencollections.com
SUPPORT_EMAIL_PASSWORD=<stored-in-doppler>
SUPPORT_EMAIL_INGEST_LIMIT=25
SUPPORT_EMAIL_AUTOMATION_ENABLED=false
SUPPORT_EMAIL_SEND_ENABLED=false
SUPPORT_EMAIL_DRY_RUN=true
SUPPORT_EMAIL_SIGNATURE=<optional custom signature with \n line breaks>
```

Default Golden Collections support signature for generated drafts:

```text
Warm regards,
Golden Collections Support
Golden Collections
Bharatanatyam, Kuchipudi and Deity Jewellery
https://www.goldencollections.com/
support@goldencollections.com
WhatsApp: +91 7337294499
```

Do not use `goldencollections9@gmail.com` in customer-facing email signatures.

## App Files

In `whatsapp-automation`:

- `lib/email-config.js`
- `lib/email-imap.js`
- `lib/email-smtp.js`
- `lib/email-classify.js`
- `api/cron/ingest-support-email.js`
- `api/monitor/email-summary.js`
- `api/monitor/support-inbox.js`
- `api/email/approve-send.js`
- `scripts/email-check-config.mjs`
- `scripts/email-ingest-once.mjs`
- `scripts/email-list-drafts.mjs`
- `scripts/email-send-approved.mjs`
- `supabase/migrations/005_support_email_automation.sql`

## Database Tables

- `support_email_messages`
- `support_email_drafts`
- `support_email_events`

## Next Operating Step

Mailbox ingest is connected and tested. Keep SMTP sending disabled until a separate live-send review.

Day-to-day operating model:

1. The scheduled ingest checks `support@goldencollections.com`.
2. System emails are ignored.
3. Real customer emails are stored in Supabase.
4. Codex or the support dashboard reviews draft replies.
5. A human approves or edits the reply.
6. Only after the owner enables sending can approved replies go out through SMTP.

Protected review endpoints:

- Assistant dashboard: `/api/monitor/support-inbox?view=dashboard&days=7&token=<CRON_SECRET>`
- JSON drafts: `/api/monitor/support-inbox?status=needs_review&format=json`
- Browser inbox: `/api/monitor/support-inbox?status=needs_review&token=<CRON_SECRET>`

The assistant dashboard is the owner-facing daily command center. It should clearly show what needs attention, whether automation is live or disabled/dry-run, priority emails, today's brief, and recent context from email, WhatsApp, shipments, and review requests.

Dashboard actions:

- Check support email now.
- Process abandoned checkout WhatsApp messages now.
- Process review requests after the review-request table exists.
- Open priority support email drafts.
- Copy draft replies.
- Open the local email app with the customer address and subject.
- Show `Approve and send` only when `SUPPORT_EMAIL_SEND_ENABLED=true` and `SUPPORT_EMAIL_DRY_RUN=false`.

Do not show live send buttons while email sending is disabled or dry-run.

The browser inbox is for draft review only. It does not send email.

## Codex-Controlled Outreach Sending

Owner approved a controlled Codex send path on 2026-05-24 after a successful self-test to `tunklakshman@gmail.com` and reply verification through the Titan inbox.

For prepared outreach batches, use the local `whatsapp-automation` script:

```text
npm run email:outreach
```

Default behavior is dry-run only. Live sending requires all of these gates:

- `SUPPORT_EMAIL_SEND_ENABLED=true`
- `SUPPORT_EMAIL_DRY_RUN=false`
- `--send`
- `--confirm-send`
- explicit owner approval for the exact row or batch

Keep Doppler defaults conservative:

```text
SUPPORT_EMAIL_SEND_ENABLED=false
SUPPORT_EMAIL_DRY_RUN=true
```

For approved sends, use only temporary per-command environment overrides rather than permanently enabling live sending in Doppler. This keeps background automation and dashboard send buttons disabled.

The first approved outreach send was:

- Date/time: 2026-05-24 20:24 IST
- To: `akdatlanta@gmail.com`
- Target: Academy of Kuchipudi Dance Atlanta
- Subject: `Teacher-first rangapravesam jewellery checklist`
- SMTP message ID: `<b990d1f9-c439-40f8-66bf-5f9615ed5232@goldencollections.com>`

Outreach must continue one recipient at a time or as an explicitly approved batch. Do not place multiple schools in the same To/Cc list.

### Sent Folder Behavior

Titan SMTP delivery does not automatically save messages into Titan webmail's Sent folder. Codex patched `whatsapp-automation/lib/email-smtp.js` on 2026-05-25 so future `sendSupportEmail` calls append a copy to the IMAP `Sent` mailbox after successful SMTP delivery.

The two earlier Codex-sent messages were manually appended to `Sent` without resending:

- `tunklakshman@gmail.com`, subject `Golden Collections support email test`, message ID `<90add41c-f9af-a0dd-57b5-54b098d54cfc@goldencollections.com>`, Sent UID 3.
- `akdatlanta@gmail.com`, subject `Teacher-first rangapravesam jewellery checklist`, message ID `<b990d1f9-c439-40f8-66bf-5f9615ed5232@goldencollections.com>`, Sent UID 4.

On 2026-05-25, the owner approved sending the remaining 14 rows in the first USA dance-school outreach batch. Codex sent rows 2-15 through the controlled Titan SMTP path. The tracker now marks all 15 rows as `sent`, and Sent-folder verification found all 15 outreach message IDs present with no missing copies.

