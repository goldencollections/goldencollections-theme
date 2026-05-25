# Deity Agent-Commerce Final Evidence Report

Created: 2026-05-19

Scope: priority Golden Collections deity fit-sensitive categories already selected by UCP leakage, fit anxiety, stock/commercial value, and available truthful Shopify product data.

This report closes the current priority UCP sprint set for:

- crowns / mukut / kireedam
- deity short harams / short necklaces
- deity long harams / long necklaces
- deity vaddanam / waist belts
- deity earrings / Karna Pathakam
- Varalakshmi / goddess hastham-padam / hands-legs
- Varalakshmi / goddess doll faces / mugham

## Completion Standard Used

A category is agent-commerce ready for this sprint only when:

1. UCP / Shopify Catalog scorecards show clean top-3 results for the target buying prompts, or a blocker is documented because no truthful product-data fix remains.
2. Top-10 results are inspected and remaining leakage is documented.
3. Top winning products are checked with UCP `catalog get_product` for the product-evaluation layer: title, URL, media, collections, options, selected variant, and price range.
4. Product truth is preserved: no fake products, no no-image products, no future/draft products promoted, and no unsupported fit/material/style claims.
5. Revenue and measurement follow-up has a baseline plan or baseline file.

Important boundary: this sprint verifies UCP discovery and product-evaluation readiness. It does not yet verify UCP cart creation, checkout creation, shipping/payment negotiation, escalation handoff, or post-purchase order monitoring.

## Category Scorecard

| Category | Final scorecard | Top 3 | Top 10 | Status |
| --- | --- | ---: | ---: | --- |
| Crowns | `tmp/crown-ucp-sprint/ucp-baseline.json` | 12/12 | 40/40 | Clean top 3 and top 10. Some high-ranking crowns still need stronger measurement proof images. |
| Short harams | `tmp/deity-short-necklace-ucp-sprint/ucp-baseline.json` | 12/12 | 40/40 | Clean top 3 and top 10. |
| Long harams | `tmp/deity-long-haram-ucp-sprint/ucp-baseline.json` | 12/12 | 40/40 | Clean top 3 and top 10. |
| Waist belts / vaddanam | `tmp/deity-waist-belt-ucp-sprint/ucp-final.json` | 12/12 | 40/40 | Clean top 3 and top 10 after Varalakshmi-vaddanam disambiguation. |
| Earrings / Karna Pathakam | `tmp/deity-earrings-ucp-sprint/ucp-after-collection-cleanup-strict.json` | 9/12 | 22/40 | Broad earring prompts clean top 3. Strict `jhumki for god idol` remains blocked by product truth. |
| Hastham / Padam | `tmp/hastham-padam-ucp-sprint/ucp-final-after-description-sync.json` | 12/12 | 35/40 | Clean top 3. Top-10 depth remains shallow for `goddess hands legs with size`. |
| Varalakshmi faces | `tmp/varalakshmi-face-ucp-sprint/ucp-final-after-doll-face-refinement.json` | 12/12 | 39/40 | Clean top 3. One full-idol top-10 result remains for `Varalakshmi face for doll`. |

Note: some older sprint scripts write final/current score snapshots to files named `ucp-baseline.json`. Use the score values and timestamps inside the files, not the filename alone, when interpreting final status.

## get_product Evidence

Batch evidence file:

- `tmp/ucp-product-evidence/product-evidence-2026-05-19.md`
- `tmp/ucp-product-evidence/product-evidence-2026-05-19.json`

UCP `catalog get_product --refresh` was run for representative top winners across all priority categories. The batch checked 28 winning product/variant records across:

- crowns: DGC054, DGC269, DGC267, DGC272
- short harams: DSN217, DSN216, DSN061, DSN089
- long harams: DLN139, DLN058, DLN028, DLN055
- waist belts: DWB-007, DWB-028, DWB-012, DWB-006
- earrings: DGE009, DGE007, DGE013, DGE005
- hastham/padam: VHL019, VHL022, VHL026, VHL013
- Varalakshmi faces: VDF052, VDF026, VDF049, VDF031

Sanity checks from the evidence file:

- No checked `get_product` record had an empty product title.
- No checked `get_product` record had an empty product URL.
- No checked `get_product` record had `mediaCount: 0`.
- The checked products returned category-relevant collection membership and option/price data.

Variant caveat:

- The original evidence collector checked that titles, URLs, media, collections, options and price ranges were present. It did not initially flag whether the selected variant returned by UCP search was itself currently available within `get_product`.
- Follow-up review found selected-variant availability issues in the representative evidence for `DGE009`, `DGE013`, `VHL013`, and `VDF031`: the selected option values exist in `get_product`, but are marked unavailable while other variants on the product remain available.
- This does not invalidate the category discovery cleanup, but it does mean the next stability/revenue pass should include variant availability checks before declaring cart/checkout readiness.
- `scripts/ucp-product-evidence-report.mjs` has been updated to surface selected availability issues in repeat runs.

## Product Truth And Blockers

### Deity Jhumki Blocker

`jhumki for god idol` is not clean and should not be forced.

Evidence:

- Strict UCP score: top 3 `0/3`, top 10 `0/10`.
- `tmp/deity-earrings-ucp-sprint/jhumki-product-inventory-check.json` shows deity jhumki candidates `DGE201` and `DGE202`, but both are draft and zero-inventory.
- Active catalog jhumki products are Bharatanatyam/Kemp human dance earrings, not deity idol earrings.
- Current active deity earring winners are Karna Pathakam / deity earrings, not confirmed deity jhumki.

Required owner/catalog decision:

- Activate real deity jhumki products only if images, inventory, pricing, size/fit data, and owner confirmation exist.
- If any active DGE products are genuinely jhumki/jhumka styles, Anil must confirm the exact SKUs before public title/metafield changes.
- Until then, keep `jhumki for god idol` as a documented blocker.

### Crown Measurement Proof Gap

Crowns are UCP-clean, but several high-ranking crown SKUs are still Tier 1 for proof.

Best owner task already documented in `knowledge-base/outputs/proof-capture-review-ucp-revenue-operational-brief-2026-05-19.md`:

- Capture ruler/tape proof for priority crown SKUs such as DGC269, DGC267, DGC272, DGC263, DGC255, DGC259, and DGC270.
- Do not add stronger measurement claims until those photos exist or current images are visually reviewed.

### Top-10 Depth Gaps

These do not block top-3 readiness, but they should remain on the backlog:

- Hastham/Padam: `goddess hands legs with size` is top 3 clean but only top 10 `5/10`.
- Varalakshmi faces: `Varalakshmi face for doll` has one full-idol result in top 10.
- Earrings: strict jhumki is blocked as above.

## Shopify Product Data Changes Made During The Sprint Set

The sprint set used separate explicit apply scripts and recorded applied files, including:

- crown measurement alt and non-crown disambiguation files under `tmp/crown-ucp-sprint/`
- short-haram synonym/title/description/measurement-alt files under `tmp/deity-short-necklace-ucp-sprint/`
- long-haram measurement-alt files under `tmp/deity-long-haram-ucp-sprint/`
- waist-belt measurement-alt and Varalakshmi-vaddanam disambiguation files under `tmp/deity-waist-belt-ucp-sprint/`
- earrings title, collection, measurement-alt, face/description cleanup files under `tmp/deity-earrings-ucp-sprint/`
- hastham/padam title, description, and measurement-alt files under `tmp/hastham-padam-ucp-sprint/`
- Varalakshmi face title/description/disambiguation files under `tmp/varalakshmi-face-ucp-sprint/`

All changes were constrained to existing product/collection truth: titles, descriptions, regional names, fit notes, collection copy, and alt text were only strengthened where product category, SKU, inventory/status, visible image evidence, or owner-confirmed model rules supported the wording.

## Revenue And Measurement Baseline

Existing baseline:

- `tmp/ucp-revenue-baseline/ucp-revenue-baseline.md`
- `tmp/ucp-revenue-baseline/ucp-revenue-baseline.json`
- `tmp/ucp-revenue-baseline/ucp-revenue-baseline.csv`

Baseline summary:

- Window: last 90 days ending 2026-05-19.
- Shopify orders scanned: 467.
- Target SKU orders: 17.
- Target SKU quantity: 20.
- Target SKU revenue: INR 38,110.
- GA4 matched item rows: 24.
- GA4 matched item views: 1,337.
- GA4 matched add-to-carts: 81.
- GA4 matched items purchased: 8.
- GA4 matched item revenue: INR 11,624.

Baseline caveat:

- This baseline was captured immediately after the first UCP cleanup and should be treated as a post-change starting line, not proof of revenue lift.
- The current baseline file covers the original target SKU set, mainly crowns, short harams and long harams. It does not yet cover the later waist-belt, earring, hastham/padam and Varalakshmi-face sprint winners.
- Before making category-level revenue claims for the full priority set, extend the baseline SKU groups to include waist belts, earrings, hastham/padam and Varalakshmi faces.

Follow-up tracking windows:

- 7 days after sprint: early add-to-cart and WhatsApp fit-help read.
- 14 days after sprint: main add-to-cart, orders, and revenue read.
- 30 days after sprint: seasonal read for Varalakshmi/Balaji-sensitive products.

Minimal KPI set:

- UCP top-3 correctness by prompt group.
- Count of top winners with visible/labelled measurement proof.
- GA4 add-to-cart events for target SKUs/pages.
- WhatsApp/manual fit-help questions by category.
- Shopify/GA4 orders and revenue for target SKUs.

## Final Decision

The current priority deity fit-sensitive category set is ready for agent-commerce discovery at the top-3 prompt-result level, with truthful blockers documented.

Do not keep editing product wording just to chase the strict jhumki prompt. The defensible next work is measurement/proof capture for Tier 1 crowns and post-sprint revenue/fit-help measurement, not more speculative catalog wording.
