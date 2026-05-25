# Deity Agent-Commerce Stability Check

Created: 2026-05-19

Scope: post-cleanup stability verification for Golden Collections deity agent-commerce categories after Shopify/UCP reindexing. This pass did not make Shopify product-data changes.

## Executive Result

Top-3 discovery remains stable for all priority categories. The only new discovery regression is crown top-10 depth: `Balaji crown for idol` now has Balaji/Vishnu crowns in ranks 1-4, but deity earrings occupy ranks 5-10. This drops crowns from the final report's 40/40 top-10 to 34/40 top-10 while preserving 12/12 top-3.

Cart and checkout creation were verified for one representative available selected variant, DSN217. UCP cart creation returned a cart id, INR totals, image URL, and continue URL; UCP checkout creation from that cart returned a checkout id. No payment was completed and no order was placed.

## Retested UCP Scorecards

| Category | Stability scorecard | Final report | Stability result | Regression |
| --- | --- | ---: | ---: | --- |
| Crowns | `tmp/crown-ucp-sprint/ucp-baseline.json` | 12/12 top-3, 40/40 top-10 | 12/12 top-3, 34/40 top-10 | Yes: Balaji crown top-10 leakage to DGE earrings |
| Short harams | `tmp/deity-short-necklace-ucp-sprint/ucp-baseline.json` | 12/12, 40/40 | 12/12, 40/40 | No |
| Long harams | `tmp/deity-long-haram-ucp-sprint/ucp-baseline.json` | 12/12, 40/40 | 12/12, 40/40 | No |
| Waist belts / vaddanam | `tmp/deity-waist-belt-ucp-sprint/ucp-stability-2026-05-19.json` | 12/12, 40/40 | 12/12, 40/40 | No |
| Earrings / Karna Pathakam | `tmp/deity-earrings-ucp-sprint/ucp-stability-2026-05-19.json` | 9/12, 22/40 | 9/12, 22/40 | No; jhumki remains truth-blocked |
| Hastham / Padam | `tmp/hastham-padam-ucp-sprint/ucp-stability-2026-05-19.json` | 12/12, 35/40 | 12/12, 35/40 | No |
| Varalakshmi faces | `tmp/varalakshmi-face-ucp-sprint/ucp-stability-2026-05-19.json` | 12/12, 39/40 | 12/12, 39/40 | No |

## get_product And Variant Availability

Fresh evidence:

- `tmp/ucp-product-evidence/product-evidence-stability-2026-05-19.md`
- `tmp/ucp-product-evidence/product-evidence-stability-2026-05-19.json`

The pass checked 28 selected top-result variants. All 28 returned get_product data without collector errors, and all 28 had at least one media item.

Selected-variant availability issues found in the fresh get_product pass:

| Category | Selected result | Variant | Issue |
| --- | --- | --- | --- |
| Earrings | DGE013 | `gid://shopify/ProductVariant/49956118266154` | selected size/color/style currently unavailable |
| Earrings | DGE009 | `gid://shopify/ProductVariant/49902850670890` | selected size/color/style currently unavailable |
| Hastham / Padam | VHL013 | `gid://shopify/ProductVariant/49938260984106` | selected size/color/style currently unavailable |

Shopify Admin availability cross-check also confirmed representative available variants for cart readiness: DGC054, DSN217, DLN139, DWB-007, DGE007, VHL019, and VDF-052 are active and available for sale. The same Admin check confirmed DGE009, DGE013, VHL013, and the previously flagged VDF031 selected variants are unavailable.

## Cart And Checkout Readiness

Evidence file:

- `tmp/ucp-cart-checkout-readiness/stability-2026-05-19.json`

Representative available variant tested:

- DSN217, `gid://shopify/ProductVariant/48924974580010`

Result:

- UCP `cart create`: ok
- Cart line item: DSN217, quantity 1, INR 30300 total
- UCP `checkout create` from cart: ok
- Checkout id returned
- Payment completion was not attempted
- No order was placed

Unavailable selected variants were not used for cart/checkout tests.

## Expanded Revenue Baseline

Evidence files:

- `tmp/ucp-revenue-baseline/ucp-revenue-baseline.md`
- `tmp/ucp-revenue-baseline/ucp-revenue-baseline.json`
- `tmp/ucp-revenue-baseline/ucp-revenue-baseline.csv`

The baseline was extended to include waist belts, earrings, hastham/padam, and Varalakshmi face winners.

Summary for the 90-day window ending 2026-05-19:

- Target SKUs: 129
- Shopify orders scanned: 468
- Target SKU orders: 41
- Target SKU quantity: 49
- Target SKU revenue: INR 105,107
- GA4 property: 387291046
- GA4 matched item rows: 50
- GA4 matched item views: 2,832
- GA4 matched add-to-carts: 182
- GA4 matched items purchased: 25
- GA4 matched item revenue: INR 63,345

## Blockers And Follow-Up

- Crown regression: Balaji crown top-10 now contains DGE earrings at ranks 5-10. Top-3 is still clean, so this is a depth regression rather than a top-result failure. Do not change product data unless a truthful Balaji-crown disambiguation fix is identified.
- Deity jhumki: DGE201 and DGE202 remain draft / zero-inventory blockers. Do not force the `jhumki for god idol` prompt into Karna Pathakam products.
- Unavailable selected variants: DGE009, DGE013, and VHL013 are current selected top-result availability issues; VDF031 remains a known unavailable selected variant from the earlier representative pass.
- Product photos: no missing media was found in the 28 fresh get_product records. Separate proof-photo gaps remain for Anil crown measurement evidence.
- Anil crown proof photos: priority crown SKUs still need ruler/tape proof images before stronger measurement claims are added.

## Decision

The cleanup is stable for top-3 agent-commerce discovery, representative product evaluation, and cart/checkout creation for an available selected variant. The stability pass does not justify broad new product-data edits. The actionable regressions are limited to crown top-10 depth and selected-variant availability cleanup or merchandising decisions for the unavailable variants.
