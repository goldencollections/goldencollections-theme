# Titan Support Email Codex Send Readiness

Date: 2026-05-24
Status: Ready for owner-approved Codex sending. No outreach emails sent.

## Result

Codex can now use the Titan/GoDaddy mailbox path for `support@goldencollections.com` through the local `whatsapp-automation` app.

Verified:

- Sender identity: `Golden Collections Support <support@goldencollections.com>`
- SMTP host: `smtpout.secureserver.net`
- SMTP port: `465`
- SMTP secure: `true`
- Doppler credentials available in `gc-whatsapp-automation` / `prd`
- SMTP login verification passed
- Outreach CSV dry-run selected individual recipients correctly

## Safety Model

Permanent Doppler safety flags remain conservative:

```text
SUPPORT_EMAIL_SEND_ENABLED=false
SUPPORT_EMAIL_DRY_RUN=true
```

For an owner-approved send, Codex can use a temporary per-command override:

```powershell
$env:SUPPORT_EMAIL_SEND_ENABLED='true'
$env:SUPPORT_EMAIL_DRY_RUN='false'
doppler run --preserve-env --project gc-whatsapp-automation --config prd -- npm run email:outreach -- --row 1 --send --confirm-send
Remove-Item Env:\SUPPORT_EMAIL_SEND_ENABLED
Remove-Item Env:\SUPPORT_EMAIL_DRY_RUN
```

This avoids permanently enabling live send buttons or background automation.

## Outreach Script

Added:

```text
whatsapp-automation/scripts/outreach-send-batch.mjs
```

Added npm script:

```text
npm run email:outreach
```

Default behavior is dry-run only. It prints the selected recipient and subject but does not send.

Live sending requires all of these:

- `SUPPORT_EMAIL_SEND_ENABLED=true`
- `SUPPORT_EMAIL_DRY_RUN=false`
- `--send`
- `--confirm-send`

## Batch CSV

The script reads:

```text
knowledge-base/outputs/usa-dance-school-outreach-first-15-ready-2026-05-24.csv
```

It sends one email per row. It never places all schools in one To/Cc list.

Useful dry-run commands:

```powershell
doppler run --project gc-whatsapp-automation --config prd -- npm run email:outreach -- --limit 2
doppler run --project gc-whatsapp-automation --config prd -- npm run email:outreach -- --row 1
```

Owner-approved live-send pattern:

```powershell
$env:SUPPORT_EMAIL_SEND_ENABLED='true'
$env:SUPPORT_EMAIL_DRY_RUN='false'
doppler run --preserve-env --project gc-whatsapp-automation --config prd -- npm run email:outreach -- --row 1 --send --confirm-send
Remove-Item Env:\SUPPORT_EMAIL_SEND_ENABLED
Remove-Item Env:\SUPPORT_EMAIL_DRY_RUN
```

For the first real test, send only row 1 or a dedicated self-test row, then verify delivery, sender display, spam placement, and reply handling before sending the rest.

## First Approved Outreach Send

Owner approved row 1 on 2026-05-24.

Sent:

- Date/time: 2026-05-24 20:24 IST
- From: `Golden Collections Support <support@goldencollections.com>`
- To: `akdatlanta@gmail.com`
- Target: Academy of Kuchipudi Dance Atlanta
- Subject: `Teacher-first rangapravesam jewellery checklist`
- SMTP message ID: `<b990d1f9-c439-40f8-66bf-5f9615ed5232@goldencollections.com>`

Tracker updated:

```text
knowledge-base/outputs/usa-dance-school-outreach-first-15-ready-2026-05-24.csv
```

Row 1 is marked `sent`; reply status is `pending`.

## First Batch Completion

Owner approved sending the remaining 14 outreach emails on 2026-05-25.

Sent:

- Rows: 2-15
- Date/time: 2026-05-25 12:48 IST
- From: `Golden Collections Support <support@goldencollections.com>`
- Method: controlled Titan SMTP `npm run email:outreach -- --send --confirm-send`
- Result: all 14 selected rows sent successfully

The CSV tracker now shows all 15 rows as `sent`, with reply status `pending`.

Titan Sent-folder verification found all 15 outreach messages present:

- Expected outreach Sent copies: 15
- Found outreach Sent copies: 15
- Missing: 0
