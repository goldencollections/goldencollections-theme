# WhatsApp Review Trigger Delivery Source Audit

Date: 2026-05-16

Purpose: prevent duplicate or unsafe work before activating the post-delivery review request flow.

## Summary

Do not build a second review automation. A guarded review-request path already exists in `whatsapp-automation`:

- Shopify `orders/create` webhook creates a `review_requests` row with `status: awaiting_delivery`.
- Shopify `fulfillments/create` and `fulfillments/update` webhooks update shipment fields and can set `delivered_at`, `due_at`, and `status: pending`.
- `/api/cron/process-review-requests` sends the configured review template after `due_at`, unless the customer opted out.
- 2026-05-16 update: do not use older `gc_post_purchase_review_v1` for live automation because the wording can read like a positive-review nudge. Use approved neutral replacement `gc_post_purchase_review_neutral_v1`.
- Live sending remains guarded by `WHATSAPP_AUTOMATION_ENABLED` and `WHATSAPP_DRY_RUN`.

The current activation gap is delivery-signal validation and operational suppression, not missing application code.

## Current Delivery Event Source

Current source: Shopify fulfillment webhooks.

Implementation files:

- `whatsapp-automation/api/shopify/orders.js`
- `whatsapp-automation/api/shopify/fulfillments.js`
- `whatsapp-automation/api/cron/process-review-requests.js`
- `whatsapp-automation/supabase/migrations/006_review_request_automation.sql`

The fulfillment handler reads `payload.shipment_status || payload.status` and normalizes it. It treats any status containing `deliver` as delivered. When delivered, it sets:

- `review_requests.delivered_at`
- `review_requests.due_at`
- `review_requests.status = pending`

Default delay: 48 hours after delivery, via `REVIEW_REQUEST_DELAY_HOURS`.

## Current Shipping Stack

Owner-confirmed current path from `shipping-delivery-workflow.md`:

- Current carrier path: India Post / Speed Post through Shopify fulfillment tracking entry.
- No official India Post API is planned right now.
- Shiprocket is only a future possibility, not the current delivery source.

Implication: the automation should not assume a true delivery timestamp unless Shopify fulfillment payloads actually emit a delivered shipment status. Without carrier/API delivery events, review rows may safely remain `awaiting_delivery` instead of sending too early.

## Deduplication Logic

Current safeguards:

- `review_requests.shopify_order_id` is unique in migration `006_review_request_automation.sql`.
- Order webhook upserts by `shopify_order_id`.
- Fulfillment webhook updates the existing request by `shopify_order_id` when present.
- If an existing review request is no longer `awaiting_delivery` or `error`, fulfillment updates do not reset `status` or `due_at`.
- Processor only sends rows with `status = pending` and `due_at <= now`.
- Processor checks `whatsapp_opt_outs` before sending.
- After send, status becomes `dry_run` or `sent`, so the same row is not sent again by the same query.

## Failure Modes To Respect Before Live Sends

1. Shopify may report a fulfillment as fulfilled/successful without confirming customer delivery.
2. India Post delivery status is not being polled directly.
3. Fulfillment webhooks may not include customer phone in some payloads; order webhook is the safer source for phone.
4. High-value or sensitive orders may need manual review before a review request.
5. Customers with support issues, refund/replacement cases, failed delivery, or bad experience should not receive automated review requests.
6. International orders can lag or have unclear tracking state.
7. The `review_requests` migration is now applied, but dry-run processing should still be used before any live pilot.

## Required Before Enabling

Completed on 2026-05-16:

- Applied `whatsapp-automation/supabase/migrations/006_review_request_automation.sql`.
- Confirmed the monitor endpoint reports the `review_requests` table as available.
- Ran `/api/cron/process-review-requests` in production dry-run state; it processed zero due rows.
- Confirmed `gc_post_purchase_review_neutral_v1` is approved by Meta.
- Added manual suppression to the existing protected review processor endpoint without adding another Vercel function.
- Wired due review-request processing into the existing scheduled abandoned-checkout processor, so the flow has a scheduler without another cron job.

Still required:

1. Keep `WHATSAPP_AUTOMATION_ENABLED=false` and/or `WHATSAPP_DRY_RUN=true` until owner approves a controlled live test.
2. Review the first few dry-run rows after real fulfillments to confirm domestic/international classification and timing look right.

Manual suppression command shape:

POST the protected `/api/cron/process-review-requests` endpoint with JSON body `{"action":"suppress","order_name":"#1234","reason":"Support issue before review request"}`. It also accepts `shopify_order_id` or `phone`.

## 2026-05-17 Fulfillment-Age Timing Update

Owner clarified that the team manually checks India Post delivery status on the India Post website, but staff should not be expected to manually tag every order. Paid tracking APIs are also not desired right now.

Active trigger path:

- Domestic orders schedule the neutral Google review WhatsApp request 7 days after Shopify fulfillment.
- International orders schedule the neutral Google review WhatsApp request 10 days after Shopify fulfillment.
- This avoids India Post API, Shiprocket, paid tracking providers, and staff tagging.
- A signed fake-fulfillment test verified domestic and international due dates; fake rows were deleted after verification.

Future optional tracking-provider path:

- Ship24 tracking-provider polling was added behind env vars `TRACKING_PROVIDER=ship24` and `SHIP24_API_KEY`.
- The existing scheduled processor now attempts tracking-provider polling before processing due review requests.
- When a provider returns delivered, the system updates the shipment and schedules the neutral review request.
- Production check confirms tracking polling is currently disabled until an API key is configured.

Manual override remains available, but it should not be the default operating workflow:

- `orders/updated` Shopify webhook now points to the existing orders endpoint.
- Adding Shopify order tag `review-ready` marks the review request as delivered and schedules it after the configured delay.
- Adding Shopify order tag `no-review-request` cancels any unsent review request for that order.
- A signed fake-order webhook test verified `review-ready` creates a pending review request with the neutral template; the fake row was deleted after verification.

## Recommendation

Proceed with the existing review automation path only. Next technical step is delivery-event observation plus manual suppression before live sending.
