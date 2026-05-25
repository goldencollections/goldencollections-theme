# Hastham Padam UCP Sprint Report

Created: 2026-05-19

Scope: Varalakshmi / goddess hastham, padam, hands and legs products.

## Priority Rationale

This category is fit-sensitive and seasonally important for Varalakshmi/Lakshmi/Amman setups. It was selected after deity earrings because a sprint already existed and the baseline showed one remaining high-value leak:

- `Varalakshmi hands and legs`: top 3 `3/3`, top 10 `10/10`
- `hastham padam for idol`: top 3 `3/3`, top 10 `10/10`
- `goddess hands legs with size`: top 3 `2/3`, top 10 `6/10`
- `Varalakshmi hastham padam for pooja`: top 3 `3/3`, top 10 `10/10`

## Truth Guardrails

- Do not treat Balaji/Vishnu folded hastham as generic Varalakshmi hands/legs in product copy.
- Do not claim a hands-and-legs set when the product is hands-only.
- Measurement alt updates were limited to reviewed product images with visible ruler/tape or a measurement-labelled image.
- Fit wording stays caveated around idol body, arm placement, leg placement, saree/dress width, jewellery, backdrop, and overall posture.

## Shopify Data Fixes Applied

Applied files:

- `tmp/hastham-padam-ucp-sprint/applied-hastham-padam-title-disambiguation.json`
- `tmp/hastham-padam-ucp-sprint/applied-hastham-padam-measurement-alt.json`
- `tmp/hastham-padam-ucp-sprint/applied-hastham-padam-description-title-sync.json`

The changes were product-truth preserving:

- In-stock Varalakshmi/Goddess products received clearer `Hands Legs Hastham Padam for Goddess Idol` or `Hastham and Padam for Varalakshmi / Goddess Idol` titles where the product data supported that wording.
- Balaji/Vishnu folded hastham remained Balaji/Vishnu-specific.
- Measurement-image alt text was updated only for approved image positions in the visual-check set.
- Product descriptions were synced to the new titles so UCP sees the same product identity across title and description.

## UCP Scorecard

Baseline file:

- `tmp/hastham-padam-ucp-sprint/ucp-baseline.md`
- `tmp/hastham-padam-ucp-sprint/ucp-baseline.json`

Final retest file:

- `tmp/hastham-padam-ucp-sprint/ucp-final-after-description-sync.md`
- `tmp/hastham-padam-ucp-sprint/ucp-final-after-description-sync.json`

Final score:

| Prompt | Top 3 | Top 10 | Status |
| --- | ---: | ---: | --- |
| Varalakshmi hands and legs | 3/3 | 10/10 | Clean top 3 |
| hastham padam for idol | 3/3 | 10/10 | Clean top 3 |
| goddess hands legs with size | 3/3 | 5/10 | Clean top 3; top 10 still shallow |
| Varalakshmi hastham padam for pooja | 3/3 | 10/10 | Clean top 3 |

Overall final: top 3 `12/12`; top 10 `35/40`.

## get_product Checks

UCP `catalog get_product --refresh` checks were run against top winners:

| Product | Variant checked | Evidence from get_product |
| --- | --- | --- |
| `VHL019` | `gid://shopify/ProductVariant/49938237718826` | Live product, selected variant available, SKU returned, `11.5 x 3.25` L x W size, image media, Varalakshmi/Goddess hastham padam copy, and collection membership in `hands-legs-for-varalakshmi-idol`. |
| `VHL022` | `gid://shopify/ProductVariant/50018072199466` | Live product, selected variant available, SKU returned, `6 x 2` L x W size, multiple color options available, image media, and collection membership. |
| `VHL026` | `gid://shopify/ProductVariant/50018362982698` | Live product, selected variant available, SKU returned, `8.5 x 2.5` L x W size, Pink/White options, image media, and collection membership. |
| `VHL013` | `gid://shopify/ProductVariant/49938260984106` | Live Balaji/Vishnu folded hastham product, selected `3 x 2 cm` option unavailable, but `4 x 3 cm` option available. Product remains valid but should not be treated as generic Varalakshmi hands/legs. |
| `VHL018` | `gid://shopify/ProductVariant/48924855238954` | Live product, selected variant available, SKU returned, has measurement-labelled image alt text, hastham/padam description, and collection membership. |

## Remaining Gaps

- `goddess hands legs with size` has clean top 3 but only `5/10` top-10 correctness. This is acceptable for immediate top-3 readiness, but top-10 depth can be improved later by increasing real, image-backed hands/legs products or strengthening existing safe metadata.
- `VHL013` is a valid Balaji/Vishnu folded hastham result for generic `hastham padam for idol`, but it should not be positioned as Varalakshmi/Goddess hands and legs.
- Some product media still returns only one UCP media image even when Shopify has more images. Keep measurement-image alt work tied to visually reviewed images and do not assume every UCP-visible image is measurement proof.

## Revenue And Measurement Baseline

Track this prompt group with:

- UCP top 3 correctness for the four prompts above.
- Count of top winners with measurement-labelled image proof.
- GA4 add-to-cart events for `VHL019`, `VHL022`, `VHL026`, `VHL013`, `VHL018`, `VHL021`, `VHL023`, and `VHL024`.
- WhatsApp/manual fit-help questions mentioning hand direction, leg placement, saree/dress width, and idol posture.
- Orders and revenue for these SKUs over 7-day and 14-day windows after 2026-05-19.

## Next Action

This category is clean for top-3 UCP. Revisit top-10 depth after higher-leakage categories are handled or after new product photos/stock are available.
