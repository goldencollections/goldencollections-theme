# Shipping and Delivery Workflow

Last updated: 2026-05-16

## Status

Golden Collections currently uses India Post for shipping.

Owner-confirmed on 2026-05-16:

- India Post is the current shipping carrier.
- Golden Collections does not plan to use the official India Post API right now.
- A future move to Shiprocket is possible, but not the current path.

## Current Approach

Use the practical no-API India Post workflow:

1. Shopify remains the source for fulfillment and tracking-number entry.
2. Codex captures fulfillment webhooks from Shopify.
3. The automation app normalizes the tracking number.
4. If the tracking number looks like India Post / Speed Post, it generates the official India Post tracking URL.
5. Shipment state is stored in Supabase for later WhatsApp/email support and review timing.

This avoids unofficial India Post scraping and keeps the workflow stable until a shipping aggregator or official API is available.

## Deployed Automation

Vercel app:

- `https://whatsapp-automation-three-beta.vercel.app`

New Shopify webhook endpoint:

- `https://whatsapp-automation-three-beta.vercel.app/api/shopify/fulfillments`

Shopify webhooks created on 2026-05-16:

- `fulfillments/create`
- `fulfillments/update`

New code:

- `whatsapp-automation/lib/india-post.js`
- `whatsapp-automation/api/shopify/fulfillments.js`
- `whatsapp-automation/supabase/migrations/004_shipping_tracking.sql`

New Supabase table:

- `shipment_events`

New fields added to `checkout_automations`:

- `shopify_order_id`
- `order_name`
- `shipment_tracking_number`
- `shipment_carrier`
- `shipment_tracking_url`
- `shipment_status`
- `shipped_at`
- `delivered_at`

## India Post Tracking URL

The app generates links in this format:

`https://www.indiapost.gov.in/_layouts/15/DOP.Portal.Tracking/TrackConsignment.aspx?Artical=<TRACKING_NUMBER>`

Example pattern recognized as India Post:

- Two letters, nine digits, `IN`
- Example format: `EW123456789IN`

## Monitoring

The existing protected monitor endpoint now includes a `shipments` section:

`https://whatsapp-automation-three-beta.vercel.app/api/monitor/whatsapp-summary?days=7`

It reports:

- total shipment rows
- carrier counts
- status counts
- India Post tracking links captured
- delivered count
- delivery issue count
- recent shipment rows

Initial deployed monitor test on 2026-05-16 returned safely with zero shipment rows, which is expected before new fulfillment webhooks arrive.

## Future Automations

Once WhatsApp phone verification is complete and owner approves live sends, shipping data can power:

- tracking shared message
- delivery delay support
- failed-delivery / NDR support
- post-delivery review request after 48 hours
- event-date risk warning for dance/deity urgent orders

Implementation note on 2026-05-16: the post-delivery review request path now exists in `whatsapp-automation` through `review_requests` and `/api/cron/process-review-requests`. Keep it in dry-run until phone registration, owner approval, and one dry-run monitor check are complete.

Delivery-source audit on 2026-05-16: `knowledge-base/outputs/whatsapp-review-trigger-delivery-source-audit-2026-05-16.md`.

Owner clarified on 2026-05-17 that India Post delivery is checked manually on the India Post website, and Shopify fulfillment does not reliably mean customer delivery. Staff should not be expected to manually tag every order for review automation.

The active no-manual-step review trigger is therefore fulfillment-age based:

- Domestic orders: send the review request 7 days after Shopify fulfillment.
- International orders: send the review request 10 days after Shopify fulfillment.
- This does not require India Post API, Shiprocket, Ship24, TrackCourier, or staff tagging.
- A signed fake-fulfillment test on 2026-05-17 confirmed domestic due date = 7 days and international due date = 10 days. Fake rows were deleted after verification.

External tracking provider remains a future upgrade, not the active plan:

- Shopify fulfillment captures the India Post / Speed Post tracking number.
- The automation can poll a tracking provider for delivery status.
- When the provider returns delivered, the system marks the shipment delivered and schedules the neutral Google review request after the configured delay.
- Ship24 support was added behind env vars: `TRACKING_PROVIDER=ship24` and `SHIP24_API_KEY`.
- Production deploy confirmed the tracking poller is currently disabled until an API key is configured.

Manual Shopify tags remain only as emergency overrides:

- Add `review-ready` only after India Post shows delivered. This marks the matching review request as delivered and schedules the neutral Google review WhatsApp request after the configured delay, default 48 hours.
- Add `no-review-request` for support issues, replacement cases, delays, refunds, unhappy customers, or any order that should not receive an automated review request.
- `orders/updated` webhook is registered to `https://whatsapp-automation-three-beta.vercel.app/api/shopify/orders`, so tag changes reach the automation.
- A signed fake-order webhook test confirmed `review-ready` creates a pending review request with `gc_post_purchase_review_neutral_v1`; the fake row was deleted after verification.

Do not enable additional live shipping automations automatically yet. Start with monitoring and manual support visibility.

## Future Shiprocket Upgrade

If Golden Collections moves to Shiprocket later, replace the no-API India Post status model with Shiprocket API polling/webhooks for:

- AWB
- courier
- pickup status
- in-transit events
- out for delivery
- NDR / failed delivery reason
- delivered timestamp
- RTO risk

Keep Shopify order and fulfillment IDs as the common join keys.
