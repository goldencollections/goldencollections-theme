# WhatsApp Template Pack - Golden Collections

Created: 2026-05-15

Purpose: replace generic/generated WhatsApp templates with reusable Golden Collections templates for abandoned checkout, support, fit guidance, product education, seasonal marketing, and post-purchase workflows.

Current status: draft pack only. Do not submit or send until owner approves the wording and audience rules.

## Operating Rules

- Use `MARKETING` only for opted-in customers or audiences where Golden Collections has a valid WhatsApp marketing basis.
- Use `UTILITY` only when the message is connected to a customer action, order, support request, fit request, review request, delivery issue, or service update.
- Avoid discounts as the default abandoned checkout tactic. Golden Collections should lead with fit help, trust, stock, shipping, and specialist guidance.
- Keep marketing messages sparse. WhatsApp is a high-trust channel; overuse will hurt brand trust.
- Use the customer name only when it is reliable.
- For body variables, integrations should pass real values and not leave placeholders visible.
- For marketing templates, include an opt-out path such as `Reply STOP to opt out`.

## Recommended Initial Submission Set

Submit these first after owner review:

1. `gc_abandoned_checkout_help_v1`
2. `gc_abandoned_checkout_size_help_v1`
3. `gc_deity_measurement_request_v1`
4. `gc_real_kemp_consultation_v1`
5. `gc_real_kemp_inquiry_followup_v1`
6. `gc_arangetram_planning_help_v1`
7. `gc_varalakshmi_seasonal_ready_v1`
8. `gc_post_purchase_review_neutral_v1`
9. `gc_shipping_delay_support_v1`

These cover the highest-value flows without turning WhatsApp into a generic broadcast tool.

## Template Drafts

### 1. Abandoned Checkout - Helpful Reminder

Name: `gc_abandoned_checkout_help_v1`

Category: `MARKETING`

Use: first abandoned checkout message, ideally 1 to 3 hours after abandonment.

Body:

Hi {{1}}, you left {{2}} in your Golden Collections cart.

If you are unsure about size, delivery date, or matching pieces, reply here and we will help before you order.

Checkout link: {{3}}. Reply here if you need help.

Footer: `Golden Collections | Reply STOP to opt out`

Buttons:

- `Need help`
- `Still interested`

### 2. Abandoned Checkout - Size/Fit Help

Name: `gc_abandoned_checkout_size_help_v1`

Category: `MARKETING`

Use: second abandoned checkout message when the cart includes deity, dance, real kemp, or size-sensitive products.

Body:

Hi {{1}}, many customers pause because they want to confirm fit before ordering {{2}}.

Send us the product link or your size question here. For deity jewellery, idol height and a front photo help us guide you better.

Cart link: {{3}}. Reply here if you want us to check fit.

Footer: `Golden Collections | Reply STOP to opt out`

Buttons:

- `Check size`
- `Ask delivery`

### 3. Abandoned Checkout - Final Gentle Reminder

Name: `gc_abandoned_checkout_final_v1`

Category: `MARKETING`

Use: final abandoned checkout reminder, no more than once per cart sequence.

Body:

Hi {{1}}, a gentle reminder from Golden Collections.

Your cart with {{2}} is still available. If you need help choosing the right set or confirming delivery, just reply here.

Cart link: {{3}}. We are here if you need support.

Footer: `Golden Collections | Reply STOP to opt out`

Buttons:

- `Complete order`
- `Need support`

### 4. Deity Jewellery Measurement Request

Name: `gc_deity_measurement_request_v1`

Category: `UTILITY`

Use: customer asked about deity jewellery fit or sent a product inquiry.

Body:

Hi {{1}}, to help check fit for {{2}}, please send:

1. Idol height
2. Face or head width
3. A clear front photo of the idol

Idol posture and crown style can affect fit, so these details help us suggest the safest option.

Footer: `Golden Collections support`

Buttons:

- `Send photo`
- `Ask question`

### 5. Real Kemp Consultation

Name: `gc_real_kemp_consultation_v1`

Category: `MARKETING`

Use: proactive opted-in campaign or retargeting for buyers who showed interest in real kemp jewellery but did not ask a direct support question.

Body:

Hi {{1}}, choosing real kemp jewellery is easier when we know the use case.

Tell us if you are buying for Bharatanatyam, Kuchipudi, bridal wear, or a traditional function. We can help compare weight, components, budget, and delivery timing.

See the range here: {{2}}. Reply if you want help choosing.

Footer: `Golden Collections | Reply STOP to opt out`

Buttons:

- `Ask about real kemp`
- `Need full set`

### 6. Real Kemp Inquiry Follow-Up

Name: `gc_real_kemp_inquiry_followup_v1`

Category: `UTILITY`

Use: reactive follow-up after a customer has already asked about real kemp jewellery.

Body:

Hi {{1}}, following up on your real kemp jewellery enquiry.

To guide you better, please tell us whether you need it for Bharatanatyam, Kuchipudi, bridal wear, or a traditional function. We can help with weight, components, budget, and delivery timing.

Footer: `Golden Collections support`

Buttons:

- `Share use case`
- `Talk to support`

### 7. Arangetram Planning Help

Name: `gc_arangetram_planning_help_v1`

Category: `MARKETING`

Use: parents/dancers who viewed arangetram or Bharatanatyam set pages.

Body:

Hi {{1}}, planning jewellery for an arangetram?

Golden Collections can help you check the key pieces: short necklace, long haram, headset, earrings, vanki, oddiyanam, jada pieces, and accessories.

Guide link: {{2}}. Reply here if you need checklist help.

Footer: `Golden Collections | Reply STOP to opt out`

Buttons:

- `Need checklist`
- `Ask set question`

### 8. Varalakshmi Seasonal Reminder

Name: `gc_varalakshmi_seasonal_ready_v1`

Category: `MARKETING`

Use: Varalakshmi season campaign, May to August.

Body:

Hi {{1}}, Varalakshmi season pieces are easier to choose early, especially faces, hands and legs, crowns, harams, vaddanam, and decor accessories.

If you are preparing an alankaram setup, reply with your idol size and we can help you shortlist.

Shop link: {{2}}. Reply here for fit guidance.

Footer: `Golden Collections | Reply STOP to opt out`

Buttons:

- `Need fit help`
- `View collection`

### 9. New Arrival Showcase

Name: `gc_new_arrival_category_v1`

Category: `MARKETING`

Use: controlled new-arrivals campaign by category.

Body:

Hi {{1}}, new {{2}} pieces are now available at Golden Collections.

If you want help choosing by size, use case, or delivery timeline, reply here and our team will guide you.

Collection link: {{3}}. Reply here for help choosing.

Footer: `Golden Collections | Reply STOP to opt out`

Buttons:

- `View new arrivals`
- `Ask for help`

### 10. Back In Stock Interest

Name: `gc_back_in_stock_interest_v1`

Category: `MARKETING`

Use: customer previously asked about an unavailable item or category.

Body:

Hi {{1}}, the {{2}} you were interested in is available again at Golden Collections.

You can check it here: {{3}}

If you want us to confirm size, finish, or delivery before ordering, reply here.

Footer: `Golden Collections | Reply STOP to opt out`

Buttons:

- `Check product`
- `Need help`

### 11. Post-Purchase Review Request

Name: `gc_post_purchase_review_neutral_v1`

Category: `UTILITY`

Use: after confirmed delivery.

Default timing: send 48 hours after delivery confirmation. Use manual override for event-proximity orders:

- Same day or next day for dance jewellery when the customer confirms it is for an immediate performance or arangetram.
- Three to four days after delivery for deity/Varalakshmi items purchased before a festival setup, unless the customer asks for support earlier.

Body:

Hi {{1}}, we hope your Golden Collections order {{2}} reached safely.

Your honest feedback helps other customers and helps us improve.

Review link: {{3}}. Reply here if you need support.

Footer: `Thank you for choosing Golden Collections`

Buttons:

- `Give feedback`
- `Need support`

### 12. Shipping Delay Support

Name: `gc_shipping_delay_support_v1`

Category: `UTILITY`

Use: order support when dispatch/delivery needs clarification.

Body:

Hi {{1}}, update for your Golden Collections order {{2}}:

{{3}}

If you need help with delivery timing or address details, reply here and we will assist.

Footer: `Golden Collections support`

Buttons:

- `Get update`
- `Contact support`

### 13. Product Fit Follow-Up

Name: `gc_product_fit_followup_v1`

Category: `UTILITY`

Use: after a support conversation where the team needs missing details.

Body:

Hi {{1}}, we can help you choose the right {{2}}, but we still need one detail:

{{3}}

Please reply here with the information and we will guide you.

Footer: `Golden Collections support`

Buttons:

- `Send details`
- `Talk to support`

### 14. Dance Institute / Bulk Order Help

Name: `gc_dance_institute_bulk_help_v1`

Category: `MARKETING`

Use: dance teachers/institutions or customers who asked about multiple sets.

Body:

Hi {{1}}, Golden Collections can help with {{2}} for dance students, institutions, or stage programs.

Reply with the number of sets, age group, jewellery type, and required date. We will help with options and availability.

Footer: `Golden Collections | Reply STOP to opt out`

Buttons:

- `Send requirement`
- `Ask availability`

### 15. Guide / Education Release

Name: `gc_guide_release_category_v1`

Category: `MARKETING`

Use: content-led campaign for opted-in customers, especially SEO/GEO pillar guides.

Body:

Hi {{1}}, we published a Golden Collections guide on {{2}}.

It may help you choose the right jewellery before ordering, especially if you are comparing size, material, use case, or care.

Read here: {{3}}. Reply here if you have a question.

Footer: `Golden Collections | Reply STOP to opt out`

Buttons:

- `Read guide`
- `Ask a question`

## Suggested Automation Mapping

- Shopify abandoned checkout event -> `gc_abandoned_checkout_help_v1`
- Shopify abandoned checkout + size-sensitive cart -> `gc_abandoned_checkout_size_help_v1`
- Abandoned checkout first message -> send at 1 to 3 hours after checkout abandonment.
- Abandoned checkout second message -> send at 6 to 8 hours only if no order, no reply, no support handoff, and customer has not opted out.
- Abandoned checkout final reminder -> send at 20 to 24 hours only if still no order, no reply, no support handoff, and customer has not opted out.
- Size-sensitive abandoned checkout rule -> use the size-help version instead of the general version when the cart includes deity jewellery, crowns, harams, vaddanam, Varalakshmi items, real kemp, full dance sets, kids dance sets, or products tagged as fit-sensitive.
- Deity product inquiry -> `gc_deity_measurement_request_v1`
- Real kemp page/cart interest from opted-in audience -> `gc_real_kemp_consultation_v1`
- Real kemp direct enquiry or support follow-up -> `gc_real_kemp_inquiry_followup_v1`
- Arangetram guide/page interest -> `gc_arangetram_planning_help_v1`
- Varalakshmi season audience -> `gc_varalakshmi_seasonal_ready_v1`
- Delivered order -> `gc_post_purchase_review_neutral_v1`, default 48 hours after delivery confirmation.
- Support ticket/order delay -> `gc_shipping_delay_support_v1`

## Template Justification

### `gc_abandoned_checkout_help_v1`

Why it exists: this is the default cart-recovery message for carts where the main barrier is likely normal hesitation: delivery, trust, payment timing, or needing a final nudge.

Customer problem solved: reminds the customer without sounding like a discount push. It offers human help, which fits Golden Collections because many products are considered purchases rather than impulse buys.

When to use: abandoned carts that do not contain deity-fit, real kemp, kids dance, full dance set, or other size-sensitive products.

Why it should be `MARKETING`: it is a cart recovery message intended to complete a purchase.

Guardrail: send once per cart sequence unless the customer replies. Do not combine with the size-help version for the same first reminder.

### `gc_abandoned_checkout_size_help_v1`

Why it exists: Golden Collections sells products where customers often hesitate because they are unsure about fit, size, matching components, or suitability.

Customer problem solved: reframes abandonment as a support moment. For deity jewellery, idol height and photos are genuinely useful; for dance jewellery, age, dancer comfort, components, and event timeline can matter.

When to use: abandoned carts containing deity jewellery, crowns, harams, vaddanam, Varalakshmi items, real kemp, full dance sets, kids dance sets, or products tagged as fit-sensitive.

Why it should be `MARKETING`: it is still cart recovery, but the wording is assistance-led.

Guardrail: trigger from product/category/metafield signals, not from guesswork. Stop automation if the customer replies.

### `gc_abandoned_checkout_final_v1`

Why it exists: gives one final soft reminder without pressure, discounting, or excessive frequency.

Customer problem solved: customers often intend to return later but forget. This gives a final opportunity to complete or ask for help.

When to use: only after no reply/click/order from the first abandoned checkout message, typically 20 to 24 hours later.

Why it should be `MARKETING`: it is a purchase reminder.

Guardrail: use no more than once per abandoned cart sequence. Do not use for customers who already replied, ordered, or opted out.

### `gc_deity_measurement_request_v1`

Why it exists: deity jewellery fit is one of Golden Collections' most important support problems because idol size, posture, face width, and ornament placement can change the correct recommendation.

Customer problem solved: replaces vague back-and-forth with a clear checklist: idol height, face/head width, and front photo.

When to use: after a customer asks about deity jewellery sizing, fit, crowns, harams, vaddanam, hands/legs, faces, or deity accessories.

Why it should be `UTILITY`: it responds to a customer support or product-fit request.

Guardrail: do not overpromise exact fit from a photo; keep the language as guidance and "safest option."

### `gc_real_kemp_consultation_v1`

Why it exists: real kemp is high-value and has decision complexity: use case, weight, components, finish, budget, and delivery timing. This variant is for proactive opted-in marketing or retargeting.

Customer problem solved: moves the buyer from "which set is real/good?" to a guided consultation based on Bharatanatyam, Kuchipudi, bridal, or function use.

When to use: opted-in customers who browsed real kemp pages, abandoned a real kemp cart without a support conversation, or joined a segment where real kemp education is relevant.

Why it should be `MARKETING`: it promotes the range and can lead to a purchase.

Guardrail: avoid certificate claims and unsupported heritage claims. Use KB-confirmed real kemp facts only. Do not use this template as the first reply to a customer enquiry; use the utility follow-up variant instead.

### `gc_real_kemp_inquiry_followup_v1`

Why it exists: a customer who already asked about real kemp needs a service follow-up, not a promotional range message.

Customer problem solved: gathers the real buying context: Bharatanatyam, Kuchipudi, bridal wear, traditional function, weight, components, budget, and delivery timing.

When to use: after a direct real kemp enquiry, an abandoned real kemp support conversation, or a manual support follow-up.

Why it should be `UTILITY`: it is tied to an existing customer enquiry and does not include a promotional collection link.

Guardrail: use only when a real customer enquiry exists. If sending proactively to a segment, use the marketing variant.

### `gc_arangetram_planning_help_v1`

Why it exists: arangetram buyers often need a complete-set checklist and may be parents buying under event pressure.

Customer problem solved: reduces uncertainty around components such as short necklace, long haram, headset, earrings, vanki, oddiyanam, jada pieces, and accessories.

When to use: opted-in customers who visit arangetram/dance set content, ask for full Bharatanatyam sets, or abandon carts with multiple dance components.

Why it should be `MARKETING`: it promotes assistance and content around a purchase journey.

Guardrail: use as a planning prompt, not as a blanket promotion to all customers.

### `gc_varalakshmi_seasonal_ready_v1`

Why it exists: Varalakshmi is a known seasonal priority for Golden Collections, especially May through August.

Customer problem solved: encourages early preparation for faces, hands/legs, crowns, harams, vaddanam, and decor accessories before festival timing becomes urgent.

When to use: opted-in Varalakshmi/Lakshmi/Amman audience during May-August or customers who previously bought/browsed Varalakshmi products.

Why it should be `MARKETING`: it is a seasonal campaign.

Guardrail: keep seasonal frequency low and stop if the customer opts out or replies with a support question.

### `gc_new_arrival_category_v1`

Why it exists: Golden Collections needs a reusable new-arrival template by category without creating one-off template names for every collection.

Customer problem solved: tells interested customers that a category they care about has new options and offers guidance by size/use case/delivery.

When to use: opted-in segments by category, such as Bharatanatyam, deity jewellery, Varalakshmi, real kemp, or black kemp.

Why it should be `MARKETING`: it announces products.

Guardrail: use only for relevant segments, not the whole list. The variable `{{2}}` must be a clear category, not clickbait.

### `gc_back_in_stock_interest_v1`

Why it exists: customers who ask about unavailable products are high-intent. A back-in-stock message is more useful than a generic campaign.

Customer problem solved: tells the customer the item/category they wanted is available again and invites fit/delivery confirmation.

When to use: customer previously requested a product/category notification, waitlist, or support follow-up.

Why it should be `MARKETING`: it is product availability promotion unless tied to a direct support promise.

Guardrail: use only when the customer's interest is known. Do not send as a broad broadcast.

### `gc_post_purchase_review_neutral_v1`

Why it exists: Golden Collections needs stronger trust and EEAT-style external proof from real buyers, especially for dance and deity categories.

Customer problem solved: gives satisfied customers an easy path to help other buyers choose.

When to use: 48 hours after confirmed delivery as the default. Use same-day/next-day manual override for event-proximity dance orders and three to four days for deity/Varalakshmi items bought before a festival setup.

Why it should be `UTILITY`: it follows a completed order and is service/feedback related.

Guardrail: do not ask for only positive reviews. The older `gc_post_purchase_review_v1` wording said "If the jewellery looked good..." and should not be used for live automation. Use the neutral replacement template above so the same message invites honest feedback and also gives a support path.

### `gc_shipping_delay_support_v1`

Why it exists: shipping and delivery clarity prevents anxiety and reduces repeated support queries.

Customer problem solved: gives a structured order update and an immediate support path.

When to use: delayed dispatch, courier issue, address clarification, festival/event deadline risk, or any order-specific delivery update.

Why it should be `UTILITY`: it is about an existing order.

Guardrail: variable `{{3}}` must be factual and order-specific. Do not use vague promises.

### `gc_product_fit_followup_v1`

Why it exists: support conversations often stall because one key detail is missing.

Customer problem solved: asks for exactly one missing detail and keeps the conversation easy.

When to use: after customer inquiry when fit guidance needs idol height, face width, dancer age, event date, product link, or delivery location.

Why it should be `UTILITY`: it continues an active support/product-fit request.

Guardrail: use a clear, single missing detail in `{{3}}`; avoid long lists here because the deity-specific template already handles the full measurement checklist.

### `gc_dance_institute_bulk_help_v1`

Why it exists: dance teachers/institutions can create larger orders and need a different flow from single-product shoppers.

Customer problem solved: collects the information needed to quote or recommend options: set count, age group, jewellery type, and required date.

When to use: opted-in dance teachers, institutions, or customers who ask about multiple sets.

Why it should be `MARKETING`: it promotes bulk/institutional purchasing.

Guardrail: do not send broadly; use only when the person has shown institutional/bulk interest.

### `gc_guide_release_category_v1`

Why it exists: Golden Collections is building authority content for SEO/GEO. WhatsApp can amplify guides to interested customers without sounding like a hard sell.

Customer problem solved: gives buyers education before purchase, especially for confusing categories like real kemp, deity sizing, and arangetram components.

When to use: opted-in audiences whose interest matches the guide topic.

Why it should be `MARKETING`: content promotion can still influence purchase behavior.

Guardrail: send only high-value guides, not every blog post. Keep the topic in `{{2}}` specific and useful.

## Files

Submission-ready payload draft:

- `knowledge-base/outputs/whatsapp-template-pack-2026-05-15.json`

Submission helper:

- `scripts/whatsapp-submit-template-pack.mjs`
