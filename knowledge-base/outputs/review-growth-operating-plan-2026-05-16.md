# Golden Collections Review Growth Operating Plan

Date: 2026-05-16  
Status: operating recommendation; no public posting or live automation should happen without owner approval.

## Executive Decision

Use a Google-first review system.

- Google Reviews are the strongest trust layer for Golden Collections because they appear in Google Search/Maps, support local/entity trust, and are easy for buyers to recognize.
- Judge.me should be used for product-specific proof on Shopify product pages and, later, Google Shopping Product Ratings.
- Trustpilot should be maintained as a secondary seller-reputation profile, especially for international buyers, but it should not compete with Google as the first review ask.
- Google Customer Reviews can be added later through Merchant Center once checkout and Merchant Center trust work are stable.

## Platform Roles

| Platform | Role | Priority | Main Use |
| --- | --- | --- | --- |
| Google Business Profile reviews | Store and business trust | P1 | "Is Golden Collections real and reliable?" |
| Judge.me | Product-specific proof | P1/P2 | "Did this crown, haram, dance set, or deity item work for a real buyer?" |
| Trustpilot | Secondary seller reputation | P2 | International/service confidence and independent profile cleanup |
| Google Customer Reviews | Merchant Center seller-rating path | P3 | Checkout survey opt-in for store rating signals |

## Review Ask Routing

Do not ask one customer to review everywhere at once.

Default path:

1. Ask for a Google review after a successful delivery and no support issue.
2. Ask for a Judge.me product review later only when product-specific proof matters, especially for deity fit, Varalakshmi, dance sets, real kemp, or international orders.
3. Use Trustpilot only for a separate unbiased customer-invitation stream, or as a passive profile link, not as the main post-purchase ask.

Recommended timing:

- Google review: 48 hours after confirmed delivery for ordinary successful orders.
- Deity/Varalakshmi event orders: 3 to 4 days after delivery or after the pooja/festival date when known, because the useful review is about fit/use, not just parcel receipt.
- Dance performance/arangetram orders: after event use when possible; otherwise 48 to 72 hours after delivery if the customer already expressed satisfaction.
- Judge.me product review: 7 to 14 days after delivery, or after confirmed event/use date.
- Trustpilot: do not run ad hoc selective asks. Use all-customer or unbiased invitations only if the platform is actively maintained.

## Suppression Rules

Do not send automated review requests when any of these are true:

- Refund, replacement, return, wrong item, or exchange is open.
- Delivery issue, failed delivery, RTO risk, or tracking uncertainty is open.
- Customer complained on WhatsApp, email, Google, Trustpilot, Instagram, or phone.
- Order is high-value, custom, real kemp, urgent event-date, or international and has not been manually checked.
- Customer has opted out of WhatsApp or marketing messages.
- Shopify order tag includes `no-review-request` or a future support flag marks the order as suppressed.

Manual exception:

- A human can ask for a review after a support issue is genuinely resolved, but the message must be neutral and cannot ask for a positive review, review edit, or review removal.

## Google Review Message Shape

The message should ask for genuine feedback and gently prompt useful buyer details.

Good prompts:

- Which product or ornament did you order?
- Was it for deity alankaram, Varalakshmi, pooja, Bharatanatyam, Kuchipudi, or an arangetram?
- If helpful, mention idol size, dancer age/occasion, country/city, packing, delivery, video call support, or fit guidance.

Avoid:

- Any incentive, discount, free item, or compensation in exchange for a review.
- "Please give us 5 stars."
- Asking unhappy customers to change or remove reviews.
- Review gating language such as "if you are happy, leave a Google review; if not, contact us."

## Judge.me Product Review Plan

Use Judge.me for review content that belongs on product pages:

- Deity crown fit by idol height or head width.
- Short necklace/long haram fit and drape.
- Varalakshmi face/crown/hastham/padam setup feedback.
- Bharatanatyam set component quality and performance use.
- Real kemp weight, finish, comfort, and arangetram use.

Technical checks needed:

- Confirm Judge.me widgets/review lists are visible on product pages, not only present as metafields or JSON-LD.
- Confirm product aggregate rating schema is backed by visible product-review content.
- Confirm collection cards only show product ratings when real review count exists.
- Work toward at least 50 eligible product reviews before expecting Google Merchant Center Product Ratings impact.

## Trustpilot Plan

Current public profile status observed on 2026-05-16:

- `goldencollections.com` Trustpilot profile is claimed.
- TrustScore shown: 4.0.
- Review count shown: 9.
- One visible 1-star review from Ganga IT says the order was not received.

Recommended actions:

1. Verify the Ganga IT order internally before replying.
2. Post a calm public reply after owner approval.
3. Keep Trustpilot profile accurate and maintained because it is included in site `sameAs` schema.
4. Do not selectively invite only happy customers to Trustpilot.

Draft Trustpilot reply for owner approval:

Thank you for sharing this. We are sorry to hear that you did not receive your order. Please contact us with your order number at support@goldencollections.com or on WhatsApp so we can check the shipment record and help resolve this directly. We take delivery issues seriously and will review the tracking and order status with you.

## Automation Path

Do not build a second review automation.

Existing path:

- Shopify order webhooks create `review_requests`.
- Shopify fulfillment webhooks can mark delivery and set `due_at`.
- `/api/cron/process-review-requests` can send `gc_post_purchase_review_neutral_v1`.
- The older `gc_post_purchase_review_v1` wording should not be used for live automation because "If the jewellery looked good..." can read like a positive-review nudge.

Required before live use:

1. Apply `whatsapp-automation/supabase/migrations/006_review_request_automation.sql`.
2. Confirm the monitor reports `review_requests`.
3. Observe whether Shopify emits a true delivered status for current carrier flows.
4. Run the review processor in dry-run.
5. Add manual suppression before live sends.
6. Keep `WHATSAPP_AUTOMATION_ENABLED=false` or `WHATSAPP_DRY_RUN=true` until owner approves a controlled live test.

## Weekly Workflow

Every Monday:

1. Open Google Business Profile reviews.
2. Reply to every new positive review with product/use-case specificity.
3. Draft owner-approved replies for all negative or mixed reviews.
4. Check Trustpilot for new reviews.
5. Check Judge.me review volume and high-value product reviews.
6. Tag recurring themes into content ideas:
   - deity/idol fit
   - Varalakshmi setup
   - dance performance/arange tram
   - packing
   - international shipping
   - video call/support

Monthly:

1. Export or manually summarize review themes.
2. Add strongest review themes into product FAQs, collection copy, and proof-story ideas.
3. Rotate homepage review snippets only when a new review adds stronger buyer-specific detail.
4. Audit review schema and visible review widgets.

## Next Implementation Order

1. Audit Judge.me visibility and schema on live product pages.
2. Submit/approve the neutral WhatsApp review template before any live automation.
3. Verify and reply to the Trustpilot 1-star after owner approval.
4. Build a manual review-request candidate list from recent successful delivered orders.
5. Apply the review automation migration and dry-run monitor only after suppression rules are ready.
6. Use review themes to update Varalakshmi, deity fit, dance set, and real kemp content.

## Implementation Updates Made On 2026-05-16

- Product JSON-LD in `sections/main-product.liquid` now uses the same Shopify `reviews` metafields as the visible product rating block, guarded by review count greater than zero. This avoids a mismatch where invisible Judge.me metafields could create stronger review schema than the page visibly supports.
- Review automation defaults now point to `gc_post_purchase_review_neutral_v1`, not the older `gc_post_purchase_review_v1`.
- Local WhatsApp template pack wording was neutralized to ask for honest feedback, not only when jewellery "looked good".
- `gc_post_purchase_review_neutral_v1` was submitted to Meta and is approved as a Utility template.
- Supabase migration `006_review_request_automation.sql` was applied and `review_requests` now responds through the production monitor.
- The WhatsApp automation was redeployed to production with safe state confirmed: `WHATSAPP_AUTOMATION_ENABLED=false` and `WHATSAPP_DRY_RUN=true`.
- Production dry-run check for `/api/cron/process-review-requests` succeeded with zero rows processed.
- The live Shopify theme asset `sections/main-product.liquid` was updated through Admin API and verified to no longer reference Judge.me product rating schema in that asset.
- Manual suppression was added to the existing protected review processor endpoint. POST `/api/cron/process-review-requests` with `action: "suppress"` and one of `shopify_order_id`, `order_name`, or `phone` to cancel an unsent review request.
- The existing scheduled abandoned-checkout processor now also runs due review requests, so no extra Vercel function or duplicate cron job is needed. Production check processed zero abandoned-checkout rows and zero review-request rows.
- 2026-05-17 delivery-source correction: because India Post delivery is checked manually and paid tracking APIs are not desired right now, the active no-manual-step trigger is fulfillment-age based. Domestic orders are scheduled 7 days after Shopify fulfillment; international orders are scheduled 10 days after Shopify fulfillment. A signed fake-fulfillment test verified both timings and fake rows were deleted. Shopify tags remain emergency overrides only.

Still blocked before live review sends:

1. Owner approves a small live pilot before changing `WHATSAPP_AUTOMATION_ENABLED=true` and `WHATSAPP_DRY_RUN=false`.
2. Review the first few dry-run rows after real fulfillments to confirm domestic/international classification and timing look right.

## Policy Sources

- Google Business Profile review best practices: https://support.google.com/business/answer/3474122
- Google Maps fake engagement policy: https://support.google.com/contributionpolicy/answer/7400114
- Trustpilot business guidelines: https://trustpilot.zendesk.com/hc/en-us/articles/235472148--Quick-guide-to-Trustpilot-s-Guidelines-for-Businesses
- Trustpilot review invitation best practices: https://trustpilot.zendesk.com/hc/en-us/articles/207408777-Best-practices-for-creating-review-invitations
- Judge.me Google Shopping sync: https://judge.me/help/en/articles/13845576-syncing-product-reviews-to-google-shopping
- Google Merchant Center Product Ratings basics: https://support.google.com/merchants/answer/14620705
- Google Customer Reviews basics: https://support.google.com/merchants/answer/7124319
