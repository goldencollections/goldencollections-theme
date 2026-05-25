# Deity Earrings UCP Sprint Report

Created: 2026-05-19

Scope: deity earrings / Karna Pathakam products after the waist-belt sprint. This category was selected next because the 2026-05-19 next-category baseline showed severe UCP leakage:

- `deity earrings for idol`: top 3 `0/3`, top 10 `2/10`
- `jhumki for god idol`: top 3 `0/3`, top 10 `0/10`
- `goddess earrings with size`: top 3 `3/3`, top 10 `8/10`
- `Balaji earrings for idol`: top 3 `0/3`, top 10 `0/10`

## Truth Guardrails

- Do not rename Karna Pathakam products as jhumki unless the product is visibly and owner-confirmed as jhumki/jhumka.
- Do not promote draft/no-inventory deity jhumki products.
- Do not use future/no-image products to make UCP prompts pass.
- Measurement/proof copy was limited to products whose reviewed product images showed ruler/tape evidence.

## Fixes Applied

Applied Shopify catalog/product data updates already recorded in:

- `tmp/deity-earrings-ucp-sprint/applied-deity-earrings-title-disambiguation.json`
- `tmp/deity-earrings-ucp-sprint/applied-earrings-measurement-alt-updates.json`
- `tmp/deity-earrings-ucp-sprint/applied-face-earring-query-disambiguation.json`
- `tmp/deity-earrings-ucp-sprint/applied-face-description-earring-disambiguation.json`
- `tmp/deity-earrings-ucp-sprint/applied-deity-earrings-collection-description-cleanup.json`

The applied changes were product-truth preserving:

- In-stock DGE earrings were clarified as `Karna Pathakam Earrings for Balaji / God Idol` or `Lakshmi / Amman ... for Goddess Idol` where catalog data supported that direction.
- Measurement-image alt text was improved only for reviewed DGE images with visible ruler/tape proof.
- Deity face products were cleaned so fit copy says `side ornament clearance` / `side ornament area` rather than leaking the word `earring` into face products.
- The Deity Earrings collection description was cleaned from `idol ear and face area` / `face width` to `idol ear and side ornament area` / `side clearance`. A refreshed UCP `get_product` check for DGE007 confirmed the cleaned collection wording is visible through Shopify Catalog.

## Current UCP Verification

Current retest file:

- `tmp/deity-earrings-ucp-sprint/ucp-after-collection-cleanup-strict.md`
- `tmp/deity-earrings-ucp-sprint/ucp-after-collection-cleanup-strict.json`

Current score:

| Prompt | Top 3 | Top 10 | Status |
| --- | ---: | ---: | --- |
| deity earrings for idol | 3/3 | 9/10 | Clean top 3 |
| jhumki for god idol | 0/3 | 0/10 | Blocked; no active true deity jhumki winners |
| goddess earrings with size | 3/3 | 7/10 | Clean top 3 |
| Balaji earrings for idol | 3/3 | 6/10 | Clean top 3 |

Strict jhumki top 3 score: `0/3`.

The broad deity earrings UCP result is now clean for the money prompts except strict jhumki. The jhumki prompt still leaks to Balaji idol, mustache, Surya/Moon, and vaddanam results before one Karna Pathakam earring appears at rank 10; that earring is intentionally not counted as jhumki.

## get_product Checks

UCP `catalog get_product` checks were run against top winning products after retest:

| Product | UCP evidence |
| --- | --- |
| DGE009 | Title: `Deity Karna Pathakam Earrings for Balaji / God Idol DGE009`; URL returned; option size values include `1.5 x 1`, `2 x 1`, `2.25 x 1.5`, `2.5 x 1.5` available; collection includes `deity-earrings-for-god-idols-statues`; price range INR 243-383. |
| DGE007 | Title: `Deity Karna Pathakam Earrings for Balaji / God Idol DGE007`; URL returned; `0.75 x 1` and `1 x 1` size options available; collection includes `deity-earrings-for-god-idols-statues`; price range INR 123-143. |
| DGE013 | Title: `Deity Gold Plated Karna Pathakam Earrings for Balaji / God Idol DGE013`; URL returned; larger size options `4 x 2.25`, `4.5 x 2.75`, `5.5 x 3.25` available; collection includes `deity-earrings-for-god-idols-statues`; price range INR 853-2253. |
| DGE005 | Title: `Lakshmi / Amman Karna Pathakam Earrings for Goddess Idol DGE005`; URL returned; `1.25 x 1.5` and `1.5 x 1.5` size options available; collection includes `deity-earrings-for-god-idols-statues`; price range INR 193-233. |

## Blocker

`jhumki for god idol` should not be forced today.

Evidence:

- `tmp/deity-earrings-ucp-sprint/jhumki-product-inventory-check.json` shows two deity jhumki products, `DGE201` and `DGE202`, but both are `DRAFT` with `0` inventory.
- Active jhumki products in the catalog are Bharatanatyam/Kemp human dance earrings, not deity idol earrings.
- Current winning DGE products are Karna Pathakam / deity earrings, not confirmed deity jhumki.

Owner/catalog decision needed:

1. If DGE201/DGE202 are real sellable deity jhumki products, add images, inventory, pricing, truthful size/fit data, and activate them.
2. If some current DGE products are actually jhumki/jhumka styles, Anil should confirm which SKUs and the public title/metafields can then be updated.
3. If Golden Collections does not currently sell deity jhumki, leave the prompt as a documented gap and avoid deceptive wording.

## Revenue And Measurement Baseline

Track the deity earrings prompt group as a post-sprint business loop:

- UCP top 3 correctness: broad earrings prompts `9/9`; strict jhumki `0/3`.
- Top winning products with measurement/proof alt updates: DGE003, DGE004, DGE005, DGE007, DGE009, DGE010, DGE011, DGE013.
- Product URLs to monitor: DGE009, DGE007, DGE013, DGE005, DGE004, DGE003, DGE010, DGE011.
- Baseline window: 7 days before 2026-05-19.
- Early read: 7 days after 2026-05-19.
- Main read: 14 days after 2026-05-19.
- Metrics: add-to-cart events, WhatsApp fit-help questions mentioning earrings/Karna Pathakam/Balaji earrings, orders, and revenue for the listed DGE products.

## Next Category

Fresh UCP retests were run after documenting the earrings blocker:

| Category | Evidence file | Top 3 | Top 10 | Decision |
| --- | --- | ---: | ---: | --- |
| Hastham / Padam | `tmp/hastham-padam-ucp-sprint/ucp-current-baseline.md` | 12/12 | 35/40 | Clean top 3; do not force changes now. |
| Varalakshmi faces | `tmp/varalakshmi-face-ucp-sprint/ucp-current-baseline.md` | 12/12 | 39/40 | Clean top 3; one top-10 leakage to a full idol set, not urgent. |

Because both current candidate categories are already clean in top 3, the next work should either:

1. Use fresh UCP baselines for another fit-sensitive category not yet cleared, or
2. Move to product proof/revenue measurement for the already-clean top-3 categories before making more Shopify wording changes.
