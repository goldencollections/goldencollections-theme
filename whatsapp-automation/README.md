# Golden Collections WhatsApp Automation

Small Vercel + Supabase app for safe WhatsApp automation.

## First Automations

Abandoned checkout:

1. Shopify sends checkout webhook to Vercel.
2. Vercel stores the checkout in Supabase.
3. An external scheduler checks due checkouts.
4. The app sends one WhatsApp template after the configured delay.
5. If the customer orders, replies, or opts out, automation stops.

Post-delivery Google review request:

1. Shopify sends an order webhook to Vercel.
2. Vercel creates a `review_requests` row in Supabase.
3. Shopify fulfillment webhooks update the row when the shipment is delivered.
4. An external scheduler checks due review requests after the configured delay.
5. The app sends `gc_post_purchase_review_neutral_v1` with the Golden Collections Google review link, unless the customer opted out.

## Important Defaults

- One abandoned checkout message only.
- Default delay: `120` minutes.
- Default post-delivery review delay: `48` hours.
- Size-sensitive carts get `gc_abandoned_checkout_size_help_v1`.
- Other carts get `gc_abandoned_checkout_help_v1`.
- Review requests use `gc_post_purchase_review_neutral_v1`.
- Live sending requires `WHATSAPP_AUTOMATION_ENABLED=true`.
- Dry-run mode is on unless `WHATSAPP_DRY_RUN=false`.

## Required Environment Variables

Vercel:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SHOPIFY_WEBHOOK_SECRET`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_APP_SECRET`
- `CRON_SECRET`

Optional:

- `WHATSAPP_GRAPH_API_VERSION` default `v23.0`
- `ABANDONED_CHECKOUT_DELAY_MINUTES` default `120`
- `REVIEW_REQUEST_DELAY_HOURS` default `48`
- `GOOGLE_REVIEW_URL` default `https://g.page/r/CbA6KqXz4_UpEAE/review`
- `REVIEW_REQUEST_TEMPLATE_NAME` default `gc_post_purchase_review_neutral_v1`
- `WHATSAPP_AUTOMATION_ENABLED` default `false`
- `WHATSAPP_DRY_RUN` default `true`

## Shopify Webhooks

Create webhooks that point to the deployed Vercel URL:

- `checkouts/create` -> `/api/shopify/checkouts`
- `checkouts/update` -> `/api/shopify/checkouts`
- `orders/create` -> `/api/shopify/orders`
- `fulfillments/create` -> `/api/shopify/fulfillments`
- `fulfillments/update` -> `/api/shopify/fulfillments`

Fulfillment webhooks capture India Post / Speed Post tracking numbers from Shopify and generate official India Post tracking links. The app does not call or scrape India Post.

## WhatsApp Webhook

Set Meta webhook callback to:

- `/api/whatsapp/webhook`

Subscribe to:

- `messages`

## Supabase

Apply:

- `supabase/migrations/001_whatsapp_automation.sql`
- `supabase/migrations/004_shipping_tracking.sql`
- `supabase/migrations/005_support_email_automation.sql`
- `supabase/migrations/006_review_request_automation.sql`

## Scheduler Note

The current Vercel account is on Hobby, where Vercel Cron only supports daily schedules. For the first version, Supabase `pg_cron` is used as the external scheduler to call this every 10 minutes:

`GET /api/cron/process-abandoned-checkouts`

Post-delivery review requests can use the same scheduler interval:

`GET /api/cron/process-review-requests`

with header:

`Authorization: Bearer <CRON_SECRET>`

The scheduler secret is stored locally in `.env.scheduler.local`, which is ignored by git.

## Monitoring

Use the protected monitor endpoint for the 7-day review:

`GET /api/monitor/whatsapp-summary?days=7`

with header:

`Authorization: Bearer <CRON_SECRET>`

Review these before enabling additional flows:

- sends or dry-runs
- replies
- orders recovered
- opt-outs
- complaint-like replies
- errors
- manual handoff load
- shipment tracking links captured
- delivery issues
- review request sends or dry-runs

## Support Email Automation

The app can connect `support@goldencollections.com` through GoDaddy/Titan IMAP and SMTP without moving the mailbox to Microsoft 365.

Safe operating model:

- IMAP reads recent inbox messages.
- The app classifies each message and creates a draft reply in Supabase.
- Generated drafts use the Golden Collections support signature by default.
- Display and send paths normalize older drafts to the current support signature before use.
- Sending is disabled unless `SUPPORT_EMAIL_SEND_ENABLED=true` and `SUPPORT_EMAIL_DRY_RUN=false`.
- Drafts should be reviewed before any real send.

GoDaddy Professional Email defaults:

- IMAP: `imap.secureserver.net`, port `993`, SSL on.
- SMTP: `smtpout.secureserver.net`, port `465`, SSL on.

Required email env vars:

- `SUPPORT_EMAIL_USERNAME=support@goldencollections.com`
- `SUPPORT_EMAIL_PASSWORD`

Useful safety env vars:

- `SUPPORT_EMAIL_AUTOMATION_ENABLED=false`
- `SUPPORT_EMAIL_SEND_ENABLED=false`
- `SUPPORT_EMAIL_DRY_RUN=true`
- `SUPPORT_EMAIL_SIGNATURE` optional, supports `\n` line breaks

Default draft signature:

```text
Warm regards,
Golden Collections Support
Golden Collections
Bharatanatyam, Kuchipudi and Deity Jewellery
https://www.goldencollections.com/
support@goldencollections.com
WhatsApp: +91 7337294499
```

Protected endpoints:

- `GET /api/cron/ingest-support-email`
- `GET /api/monitor/email-summary?days=7`
- `GET /api/monitor/support-inbox`
- `GET /api/monitor/support-inbox?view=dashboard&days=7`
- `POST /api/email/approve-send`

The dashboard view is the owner-facing daily command center. It shows:

- automation status and safety flags
- what needs owner attention
- priority support email drafts
- same-day brief
- recent email, WhatsApp, shipment, and review-request context
- action buttons to check support email, process checkout messages, open drafts, and process review requests when the table exists

Email send actions are intentionally gated:

- If `SUPPORT_EMAIL_SEND_ENABLED=false` or `SUPPORT_EMAIL_DRY_RUN=true`, the inbox shows copy/manual-reply actions only.
- The `Approve and send` button appears only when support email live sending is enabled.

Local checks:

- `npm run email:check`
- `npm run email:ingest`
- `npm run email:ingest:apply`
- `npm run email:drafts`

## Social Command Center

The app also includes an internal draft-first social approval surface. It does not publish live social content by default.

Apply:

- `supabase/migrations/007_social_command_center.sql`

Protected endpoints:

- `GET /api/monitor/social-command-center`
- `GET /api/monitor/social-command-center?format=json`
- `GET /api/social/hermes-status`
- `POST /api/social/upsert-package`
- `GET /api/social/manual-pack?variant_id=...`
- `POST /api/social/publish-variant`

Owner workflow:

1. Refresh connection health.
2. Create or seed a post package.
3. Review each platform variant: asset, caption, hashtags, destination URL, and blocker.
4. Approve only the exact platform variants that should move forward.
5. Use the manual pack or later platform-specific publisher to post.
6. Paste the published URL back with `Mark Posted`.

Safe defaults:

- `SOCIAL_LIVE_PUBLISHING_ENABLED=false`
- `SOCIAL_REQUIRE_OWNER_APPROVAL=true`
- `SOCIAL_DRY_RUN=true`
- `HERMES_SOCIAL_PUBLISH_ALLOWED=false`

Hermes should read `/api/social/hermes-status` and treat it as authoritative. Hermes may draft and recommend social posts, but should not publish, schedule, boost, send, or change website content unless owner approval and live gates are both present.

`POST /api/social/publish-variant` is a gated publish attempt. With the safe defaults above, it does not post publicly; it records a blocked publish event and returns a manual pack with exact copy, hashtags, link, and asset reference. Platform-specific live adapters should be added one at a time only after credentials, provider access, and owner-approved gates are confirmed.

Local check:

- `npm run social:check`

Local preview:

- `npm run dev`
- Open `http://127.0.0.1:3025/api/monitor/social-command-center?token=<CRON_SECRET>`

Vercel preview, if needed:

- `npm run dev:vercel`
