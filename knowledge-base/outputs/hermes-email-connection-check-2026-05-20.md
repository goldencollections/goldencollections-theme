# Hermes Email Connection Check - 2026-05-20

## Goal

Connect Hermes safely to Golden Collections email context:

- `support@goldencollections.com` through Titan/GoDaddy support mailbox
- `goldencollections9@gmail.com` as admin-only Gmail context

## Result

Support mailbox is now connected for read-only ingest and draft creation after the owner corrected the password in Doppler.

## What Works

The existing support-email pipeline exists in `whatsapp-automation`:

- IMAP read support
- SMTP send support behind safety flags
- Supabase storage for support messages and drafts
- dashboard/monitor endpoints
- draft-first customer replies

Doppler project `gc-whatsapp-automation` / `prd` has the required support email keys present:

- `SUPPORT_EMAIL_USERNAME`
- `SUPPORT_EMAIL_PASSWORD`
- `SUPPORT_EMAIL_AUTOMATION_ENABLED`
- `SUPPORT_EMAIL_SEND_ENABLED`
- `SUPPORT_EMAIL_DRY_RUN`

The config check passes and safety flags are conservative:

- automation disabled
- sending disabled
- dry-run enabled

## Previous Blocker

Read-only IMAP ingest failed with `AUTHENTICATIONFAILED`.

Tested hosts:

- `imap.secureserver.net`
- `imap.titan.email`

Resolved on 2026-05-20 after the owner corrected the saved mailbox password in Doppler.

## Verification After Fix

- `npm run email:check` passed.
- `npm run email:ingest` fetched 10 recent messages in read-only mode.
- System emails from Shopify, GoDaddy, and OpenAI were skipped.
- `npm run email:ingest:apply` stored non-system messages and created draft replies for review.
- A direct Supabase draft check found 3 `needs_review` drafts total.
- Sending remains disabled and dry-run remains enabled.

## Gmail Position

`goldencollections9@gmail.com` should be connected only as admin/read-only context if needed.

Do not use this Gmail address in:

- customer support signatures
- public site copy
- schema
- public AI files
- customer-facing email drafts

## Gmail Verification

Completed on 2026-05-20:

- Owner created and stored a Gmail app password in Doppler project `gc-hermes-agent` / `prd`.
- Added `whatsapp-automation/scripts/gmail-imap-check.mjs`.
- Added `npm run gmail:check`.
- Read-only IMAP check succeeded against `imap.gmail.com`.
- The test only checked inbox counts and did not read message bodies.
- Added VPS script `/home/hermes/.hermes/scripts/gc_mail_summary.py` for Hermes Telegram email status checks. It reads recent headers only and does not mark messages read or send email.

## Recommendation

Do not give Hermes raw broad email power.

Use this model:

1. Support-email app ingests mail.
2. Drafts are stored for review.
3. Hermes summarizes/drafts/flags.
4. Owner approves manually.
5. Live sending remains off until a separate approval.

## Next Owner Action

For support email, decide later whether to enable scheduled ingest. Do not enable live sending yet.

For Gmail, keep access admin-only/read-only at first. Do not use it for public support or customer-facing drafts unless owner explicitly approves a narrow use case.
