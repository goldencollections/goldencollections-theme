# WhatsApp Business Workflow

Last updated: 2026-05-20

## Status

WhatsApp Business Platform / Cloud API is connected locally for Golden Collections.

Read tests succeeded from Codex on 2026-05-15:

- WhatsApp Business Account ID: `3940842346203258`
- WhatsApp Business Account name: `Golden Collections`
- Currency: `INR`
- Phone number ID: `928653673672804`
- Display phone number: `+91 63098 75444`
- Verified name: `Golden Collections`
- Name status: `APPROVED`
- Quality rating returned by API after registration: `GREEN`
- Platform type after registration: `CLOUD_API`
- Template inventory read succeeded: `178` templates found
- Template status mix: `176` approved, `2` rejected
- Template category mix: `119` utility, `58` marketing, `1` authentication

Outbound test on 2026-05-15 reached Meta but failed before delivery:

- Template attempted: `chat_start_1743072465482`
- Language: `en`
- Result: blocked by Meta with `(#133010) Account not registered`
- Meaning: the WhatsApp Business Account and phone number are readable, but this phone number is not yet registered/activated for Cloud API message sending.

Phone ownership and Cloud API registration completed on 2026-05-19:

- SMS verification code request returned `success: true`.
- SMS verification submission returned `success: true`.
- Cloud API phone registration returned `success: true`.
- Post-registration account check returned `quality_rating: GREEN` and `platform_type: CLOUD_API`.
- Do not store the 6-digit Cloud API two-step PIN in this wiki or repository.

Live delivery test on 2026-05-19:

- Two business-initiated template sends to the owner test number were accepted by the API but not delivered.
- Webhook status events later marked both as `message_failed`.
- Meta error: `131042 Business eligibility payment issue`.
- Error details: `Message failed to send because there were one or more errors related to your payment method.`
- A user-initiated `Hi` from the same test number was captured by the webhook.
- A plain text session reply inside the 24-hour customer-service window was sent, delivered, and read.
- Meaning: Cloud API registration, inbound webhook capture, and free service replies work. Paid template delivery is blocked by WABA billing/payment setup.

Billing retest on 2026-05-20 after adding WhatsApp Business Account payment/tax details:

- Golden Collections WABA showed a Visa payment method in Meta Billing.
- Cloud API phone remained healthy: `CONNECTED`, `LIVE`, `VERIFIED`, name `APPROVED`, quality `GREEN`, throughput `STANDARD`.
- Plain service-window reply to owner test number `9967680579` was sent, delivered, and read.
- Utility template `gc_deity_measurement_request_v1` to `9967680579` was also sent, delivered, and read while the owner had an open service conversation.
- Business-initiated utility template to `9849713635` still failed asynchronously after Meta initially returned `accepted`.
- Webhook failure reason: `131042 Business eligibility payment issue`.
- Meaning: Cloud API, webhook, and service-window sending work. Paid business-initiated template delivery is still blocked by Meta billing/payment eligibility. Do not enable abandoned checkout live sends until a business-initiated template to a number without an open service window is delivered/read.
- Meta UI caveat: Billing pages may route to the ad account/payment account `Golden Collections New SD` / `540991118485527` under business `3689950307928289`. That is not the WABA currently throwing the WhatsApp template-send failure. The WhatsApp billing check must be for WABA `Golden Collections` / `3940842346203258` under the correct business portfolio.

## Local Credentials

Credentials are stored locally in `C:\goldencollections-theme\env`.

Expected env keys:

- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_APP_SECRET`
- Optional: `WHATSAPP_GRAPH_API_VERSION`
- Optional test-only send keys: `WHATSAPP_TEST_RECIPIENT_PHONE`, `WHATSAPP_TEST_TEMPLATE_NAME`, `WHATSAPP_TEST_TEMPLATE_LANGUAGE`

Never store token, app secret, or verify token values in this wiki.

## Scripts

- `scripts/whatsapp-lib.mjs` - shared env loading, Graph API helper, and webhook signature verification.
- `scripts/whatsapp-check-account.mjs` - reads the connected WABA and phone number metadata.
- `scripts/whatsapp-list-templates.mjs` - exports WhatsApp message templates from the WABA.
- `scripts/whatsapp-send-template.mjs` - sends one approved template to an explicit test recipient only.
- `scripts/whatsapp-webhook-server.mjs` - local webhook verification and event receiver for future Meta webhook setup.
- `scripts/whatsapp-register-phone.mjs` - guarded Cloud API phone registration helper. Requires `--confirm-register` and a 6-digit registration PIN supplied by `--pin`, temporary `WHATSAPP_REGISTER_PIN`, or local env.

Generated private outputs are ignored under `tmp/`:

- `tmp/whatsapp-account-check.json`
- `tmp/whatsapp-message-templates.json`
- `tmp/whatsapp-send-template-result.json`
- `tmp/whatsapp-webhook-events.jsonl`
- `tmp/whatsapp-register-phone-result.json`

## Safe Operating Rules

- Read account/template diagnostics first.
- Do not send WhatsApp messages unless the owner has given an explicit recipient and approved the template/message purpose.
- Prefer utility templates for order, shipping, delivery, exchange, refund, fit-help, and support workflows.
- Treat marketing templates carefully: use only for opted-in customers and campaign lists that comply with WhatsApp/Meta policy.
- Do not automate bulk broadcasts from Codex without a reviewed audience source, opt-in basis, frequency cap, and unsubscribe handling.
- Keep outbound messages useful and narrow; WhatsApp is a high-trust channel, not a generic posting feed.
- Use approved templates for business-initiated messages outside the 24-hour customer-service window.
- Future webhook setup requires a public HTTPS callback URL in the Meta app. The local receiver is ready, but localhost alone is not enough for production webhook delivery.

## Business Use Cases

Most valuable Golden Collections uses:

- Inbound lead triage: classify questions into Bharatanatyam, Kuchipudi, real kemp, deity jewellery, Varalakshmi, shipping, availability, size/fit, order status, and returns.
- Fit assistance: ask for idol size, deity type, ornament type, and measurement photos before recommending deity jewellery.
- Arangetram planning: guide parents through set components, timing, dancer age/comfort, real kemp versus regular dance jewellery, and dispatch timeline.
- Real kemp trust support: answer material, weight, plating, care, and authenticity questions using the real kemp wiki facts.
- Post-purchase review requests: use existing approved review/feedback utility templates where appropriate.
- Order support: shipment, packed, out-for-delivery, delivery issue, exchange, refund, and NDR workflows.
- Content amplification with care: only send owner-approved, opt-in marketing templates for major guide launches, festival collections, or new arrivals.

## Recommended Next Steps

1. Fix Meta WhatsApp Business Account billing/payment setup for WABA `3940842346203258`.
2. Retry one owner-controlled paid template after the payment issue is resolved.
3. Keep production review automation disabled/dry-run until paid template delivery, delivery trigger verification, and manual suppression rules are approved.
4. Choose 5 to 10 approved templates that Codex is allowed to use for support/testing and document them here.
5. Set up a public HTTPS webhook endpoint for inbound message capture.
6. Add a lightweight classifier that turns inbound WhatsApp messages into structured lead types.
7. Connect classifier outputs to Shopify product/category recommendations and the deity compatibility model.

## Template Pack

Draft reusable Golden Collections template pack created on 2026-05-15:

- `knowledge-base/outputs/whatsapp-template-pack-2026-05-15.md`
- `knowledge-base/outputs/whatsapp-template-pack-2026-05-15.json`
- Submission helper: `scripts/whatsapp-submit-template-pack.mjs`
- Submission output files:
  - `tmp/whatsapp-template-submit-2026-05-15.json`
  - `tmp/whatsapp-template-resubmit-2026-05-15.json`

Owner approved submission on 2026-05-15 and the pack was submitted to Meta.

Initial submission note:

- Meta rejected 9 templates because template bodies ended with a variable.
- The MD and JSON pack were updated so variables no longer appear at the start or end of the body/line.
- The 9 failed templates were resubmitted successfully and returned `PENDING`.

Template cleanup and current review status after 2026-05-16 check:

- Full template backup before deletion: `tmp/whatsapp-template-backup-before-delete-20260516-114826.json`
- Old/legacy template cleanup result: all 178 non-pack template names removed from Meta.
- Final inventory output: `tmp/whatsapp-template-final-inventory-20260516-115713.json`
- Final Meta inventory count: 15 templates, all from the Golden Collections 2026 pack.
- `APPROVED`: `gc_abandoned_checkout_help_v1`, `gc_abandoned_checkout_size_help_v1`, `gc_abandoned_checkout_final_v1`, `gc_real_kemp_consultation_v1`, `gc_real_kemp_inquiry_followup_v1`, `gc_arangetram_planning_help_v1`, `gc_varalakshmi_seasonal_ready_v1`, `gc_new_arrival_category_v1`, `gc_back_in_stock_interest_v1`, `gc_post_purchase_review_v1`, `gc_shipping_delay_support_v1`, `gc_product_fit_followup_v1`, `gc_dance_institute_bulk_help_v1`, `gc_guide_release_category_v1`
- `PENDING`: `gc_deity_measurement_request_v1`
- Meta recategorized `gc_real_kemp_inquiry_followup_v1` and `gc_post_purchase_review_v1` as `MARKETING`; do not assume their intended JSON category is the final Meta category.
- 2026-05-16 review-flow update: do not use `gc_post_purchase_review_v1` for live automation because its "If the jewellery looked good..." wording can read like a positive-review nudge. Submit and use neutral replacement `gc_post_purchase_review_neutral_v1` before live review requests.

Submitted template names:

- `gc_abandoned_checkout_help_v1`
- `gc_abandoned_checkout_size_help_v1`
- `gc_abandoned_checkout_final_v1`
- `gc_deity_measurement_request_v1`
- `gc_real_kemp_consultation_v1`
- `gc_real_kemp_inquiry_followup_v1`
- `gc_arangetram_planning_help_v1`
- `gc_varalakshmi_seasonal_ready_v1`
- `gc_new_arrival_category_v1`
- `gc_back_in_stock_interest_v1`
- `gc_post_purchase_review_neutral_v1`
- `gc_shipping_delay_support_v1`
- `gc_product_fit_followup_v1`
- `gc_dance_institute_bulk_help_v1`
- `gc_guide_release_category_v1`

Abandoned checkout timing rules:

- First message: 1 to 3 hours after abandonment.
- Second message: 6 to 8 hours only if no order, no reply, no support handoff, and no opt-out.
- Final reminder: 20 to 24 hours only if still no order, no reply, no support handoff, and no opt-out.
- Use the size-help abandoned checkout template instead of the general version when cart contents indicate fit or size uncertainty.

Post-purchase review timing:

- Default: 48 hours after delivery confirmation.
- Manual override: same day/next day for event-proximity dance orders; three to four days for deity/Varalakshmi festival-prep orders.
- Implementation status on 2026-05-16: a guarded post-delivery review request pipeline was added to `whatsapp-automation`. Shopify order webhooks create `review_requests`, fulfillment webhooks set `delivered_at` and `due_at`, and `/api/cron/process-review-requests` sends the configured neutral review template after the configured delay. Live sending remains protected by `WHATSAPP_AUTOMATION_ENABLED` and `WHATSAPP_DRY_RUN`.
- Delivery-source audit on 2026-05-16: `knowledge-base/outputs/whatsapp-review-trigger-delivery-source-audit-2026-05-16.md`. Do not build a second review automation. Current delivery source is Shopify fulfillment webhooks; Shiprocket is not active. Because India Post is current and no India Post API is planned, keep review requests in dry-run until a real Shopify fulfillment payload confirms that true `delivered` shipment status is available, migration `006_review_request_automation.sql` is applied, the monitor reports `review_requests`, and manual suppression rules are in place.
- Style guide draft for owner-approved Google review replies: `knowledge-base/outputs/google-review-reply-style-guide-2026-05-16.md`.

Configured API sender note:

- Current Cloud API phone number from Meta is `+91 63098 75444`.
- Public KB contact number is `+91 7337294499`.
- Templates are created on the WABA, but outbound sends use the configured phone number ID. Before production automation, owner should confirm whether customer-facing WhatsApp automation should send from `+91 63098 75444` or whether the public WhatsApp number should be connected/migrated.

## Confirmed WhatsApp Number Migration Plan

Owner-confirmed on 2026-05-15: Golden Collections will gradually migrate WhatsApp customer communication toward the Cloud API/bot number.

### Phase 1 - Current

- Bot/API number `+91 63098 75444` handles WhatsApp API automated sends.
- Existing support/public WhatsApp number `+91 7337294499` continues as public contact and manual support.
- Human agents must also monitor and manually reply on the bot/API number so no customer reply goes unanswered.
- Customers replying to automated messages on the bot/API number is acceptable.
- Do not change template footers yet.

Operational requirement for Phase 1:

- The team must be able to see which bot-number conversations started from automated sends versus customer-initiated messages.
- If a third-party inbox such as Interakt, Wati, or similar is used, verify that the inbox labels automated sends, inbound replies, and manual replies clearly.
- Manual agents should avoid replying mid-automation unless the customer has replied or support handoff is triggered.

### Phase 2 - Gradual

- Once the bot/API number becomes familiar to customers and manual coverage is stable, begin directing new customers to `+91 63098 75444` for WhatsApp contact.
- Progressively update public-facing references: website, footer, Google Business Profile, social profiles, ads, and email/SMS templates.
- Revisit WhatsApp template footer wording in this phase if needed.

### Phase 3 - Full Migration

- Bot/API number `+91 63098 75444` becomes the single WhatsApp contact for both automated and manual support.
- `+91 7337294499` is retired from public WhatsApp use or kept as internal-only.

## Automation Architecture

Owner-approved direction on 2026-05-15: build the first WhatsApp automation with Vercel plus Supabase.

Local app folder:

- `whatsapp-automation/`

Responsibilities:

- Vercel hosts Shopify webhook endpoints, WhatsApp webhook endpoint, and the abandoned-checkout processor.
- Because the current Vercel account is on Hobby, use an external scheduler such as cron-job.org to call the processor every 10 minutes. Vercel Cron can be used later after a Pro upgrade.
- Supabase stores checkout/message state so automation can avoid duplicate sends and stop when a customer orders, replies, or opts out.
- Shopify provides checkout/order events.
- WhatsApp Cloud API sends approved templates from the bot/API number.
- Manual agents monitor and reply on the bot/API number during Phase 1 migration.

First automation:

- One abandoned checkout WhatsApp message only.
- Default send time: about 2 hours after abandonment.
- Size-sensitive carts use `gc_abandoned_checkout_size_help_v1`.
- General carts use `gc_abandoned_checkout_help_v1`.
- Stop if the customer orders, replies, is handed to human support, or opts out.

Created files:

- `whatsapp-automation/README.md`
- `whatsapp-automation/vercel.json`
- `whatsapp-automation/api/shopify/checkouts.js`
- `whatsapp-automation/api/shopify/orders.js`
- `whatsapp-automation/api/whatsapp/webhook.js`
- `whatsapp-automation/api/cron/process-abandoned-checkouts.js`
- `whatsapp-automation/supabase/migrations/001_whatsapp_automation.sql`

Deployment status as of 2026-05-15:

- Supabase project created: `golden-whatsapp-automation`.
- Supabase project ref: `yzfdenpwtpozdeppuxmk`.
- Supabase project URL: `https://yzfdenpwtpozdeppuxmk.supabase.co`.
- Region selected during setup: Northeast Asia / Seoul (`ap-northeast-2`). This is acceptable for the lightweight webhook/state workload, but create a new India/Mumbai project before production if India data locality becomes a hard requirement.
- Supabase migration applied and confirmed with tables:
  - `checkout_automations`
  - `whatsapp_events`
  - `whatsapp_opt_outs`
- Vercel project deployed from `whatsapp-automation/`.
- Production alias: `https://whatsapp-automation-three-beta.vercel.app`.
- Health check passed at `https://whatsapp-automation-three-beta.vercel.app/api/health`.
- Vercel production env vars have been configured for Supabase, WhatsApp Cloud API, Shopify webhook verification, and safe automation defaults.
- Current safety defaults: `WHATSAPP_AUTOMATION_ENABLED=false` and `WHATSAPP_DRY_RUN=true`.
- Shopify webhooks created:
  - `checkouts/create` -> `https://whatsapp-automation-three-beta.vercel.app/api/shopify/checkouts`
  - `checkouts/update` -> `https://whatsapp-automation-three-beta.vercel.app/api/shopify/checkouts`
  - `orders/create` -> `https://whatsapp-automation-three-beta.vercel.app/api/shopify/orders`
- Meta WhatsApp webhook callback configured:
  - `https://whatsapp-automation-three-beta.vercel.app/api/whatsapp/webhook`
- Meta app subscription verified for `whatsapp_business_account` fields:
  - `messages`
  - `message_template_status_update`
  - `account_alerts`
- Webhook verification check passed: the Vercel endpoint echoed Meta's challenge correctly.

Required before live use:

- WhatsApp phone verification/registration must be completed for the API/bot number before real sends will work.
- WhatsApp templates must be submitted and approved before the new template names can be used.
- External scheduling is configured through Supabase `pg_cron` while Vercel is on Hobby. Do not add a duplicate cron-job.org scheduler unless the Supabase scheduler is intentionally disabled first.
- `WHATSAPP_AUTOMATION_ENABLED=true` and `WHATSAPP_DRY_RUN=false` should only be set after owner approval, phone registration, template approval, and at least one dry-run processor test.

Scheduler and monitoring update on 2026-05-16:

- Supabase `pg_cron` and `pg_net` extensions were enabled so Supabase can act as the external scheduler while Vercel remains on Hobby.
- Scheduler job created: `golden_whatsapp_abandoned_checkout_processor`.
- Schedule: every 10 minutes.
- Active target after Vercel account migration: `https://whatsapp-automation-three-beta.vercel.app/api/cron/process-abandoned-checkouts`.
- Supabase `pg_cron` job was verified after migration with `uses_new_url = true` and `uses_old_url = false`.
- Scheduler secret was rotated and stored locally in ignored file `whatsapp-automation/.env.scheduler.local`.
- Processor dry-run test passed after adding service-role grants.
- Added migration files:
  - `whatsapp-automation/supabase/migrations/002_grant_service_role_access.sql`
  - `whatsapp-automation/supabase/migrations/003_enable_scheduler_extensions.sql`
- Added protected monitoring endpoint: `https://whatsapp-automation-three-beta.vercel.app/api/monitor/whatsapp-summary?days=7`.
- Initial monitor endpoint test passed with safe state: automation disabled and dry-run enabled.
- Added a Codex daily heartbeat monitor for 7 days named `WhatsApp Automation 7-Day Monitor`.
- Fixed recovery tracking so Shopify orders can mark checkout automation rows as `ordered` even after a WhatsApp message has already been sent.

Vercel account migration update on 2026-05-16:

- Project moved to `goldencollections9-3239's projects`.
- New project ID: `prj_hc8RNlZs9T3bNtDDuDZckHlHur1i`.
- New production alias: `https://whatsapp-automation-three-beta.vercel.app`.
- Shopify webhooks were updated and verified for `checkouts/create`, `checkouts/update`, `orders/create`, `fulfillments/create`, and `fulfillments/update`.
- Meta WhatsApp app subscription was updated and verified for `whatsapp_business_account`.
- Supabase `pg_cron` abandoned checkout processor was updated and verified to call the new Vercel URL.
- Protected WhatsApp and email monitor endpoints pass on the new URL.
- `review_requests` table was pending during the account migration. It was activated later on 2026-05-16; see the post-delivery Google review update below.

Post-delivery Google review update on 2026-05-16:

- Neutral review template approved by Meta: `gc_post_purchase_review_neutral_v1`.
- Do not use the older `gc_post_purchase_review_v1` for live review automation because the wording can read like a positive-review nudge.
- Supabase migration `006_review_request_automation.sql` has been applied; `review_requests` is active and the protected monitor reports it as available.
- WhatsApp automation was redeployed to production after adding `.vercelignore` so local `.env*` files are excluded from deployment uploads.
- Production monitor confirmed safe state after deploy: automation disabled and dry-run enabled.
- Production review processor dry-run passed with zero rows processed.
- Manual suppression is available through the protected review processor endpoint by POSTing `action: "suppress"` with `shopify_order_id`, `order_name`, or `phone`; a no-op production check returned successfully.
- The existing Supabase-scheduled abandoned-checkout processor now also runs due review requests, avoiding another Vercel function and another cron job.
- Keep review sends disabled until a real fulfillment webhook confirms true delivery timing and owner approves a small live pilot.

## Official References

- WhatsApp Cloud API: `https://developers.facebook.com/docs/whatsapp/cloud-api/`
- Message templates: `https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates/`
- Webhooks: `https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/`
