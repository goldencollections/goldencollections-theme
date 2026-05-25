# GSC Crawled Not Indexed Clean Product Extract - 2026-05-24

## Scope

Used Chrome-authenticated Google Search Console UI plus the Search Console URL Inspection API to refresh the `Crawled - currently not indexed` sample for Golden Collections.

This was a read/validate pass after the internal-link and redirect sprint. No product data, no robots rules, no noindex rules, and no bulk redirects were changed in this pass.

## Evidence Files

- UI extract: `tmp/gsc-page-indexing-extract-2026-05-24/gsc-crawled-currently-not-indexed-examples-visible.json`
- Clean product URL list: `tmp/gsc-page-indexing-extract-2026-05-24/clean-product-urls.csv`
- Live + Shopify audit: `tmp/gsc-page-indexing-extract-2026-05-24/clean-products-live-shopify-audit.json`
- URL Inspection results: `tmp/gsc-page-indexing-extract-2026-05-24/clean-products-gsc-url-inspection.json`
- URL Inspection summary CSV: `tmp/gsc-page-indexing-extract-2026-05-24/clean-products-gsc-url-inspection-summary.csv`

## Headline Findings

- GSC UI exposed 1,000 example URLs from the drilldown.
- Only 27 were clean product URLs.
- 948 were parameterized product URLs (`pr_*`, `variant`, `currency`, `_pos`, `_psq`, etc.).
- Search Console API auth is working again.
- Of the 27 clean product URLs, URL Inspection reports:
  - 26: `Crawled - currently not indexed`
  - 1: `Submitted and indexed`
- Live/Shopify state for the same 27:
  - 18 active products resolving to themselves
  - 8 old product URLs redirecting to another live page
  - 1 draft product redirecting to the homepage

## Already Completed

- Strengthened internal links to:
  - BLN028 from `bharatanatyam-long-necklace`
  - BMT032 from `bharatanatyam-maang-tikka-matil`
  - DSN062 from `deity-short-harams`
  - GDW004 from `hanuman-anjaneya-deity-jewellery`
- Added the collection intro rendering needed for those links on the deployed collection templates.
- Fixed the semantically wrong redirect:
  - `/products/goddess-lakshmi-doll-face`
  - now redirects to `/collections/varalakshmi-doll-faces`
  - previously redirected to a Vishnu/Balaji face product.
- Left DLN103 alone because it is active but out of stock.

## Prioritized Clean Product Candidates

These are active, in-stock, self-resolving product URLs still appearing in the clean `Crawled - currently not indexed` sample. Prioritize by stock, category fit, and business value.

| Priority | Handle | Stock | Current GSC state | Recommended next action |
|---:|---|---:|---|---|
| 1 | `metal-pins-for-every-task-find-the-perfect-fastener-here` | 894 | Crawled, not indexed | Strengthen from Bharatanatyam hair/makeup/accessory collections with shopper-use anchor text. |
| 2 | `keep-your-hairstyle-in-place-with-bobby-pins-shop-now` | 595 | Crawled, not indexed | Strengthen from hair accessory and dance hairstyle pages/collections. |
| 3 | `authentic-bharatanatyam-long-harams-bln-028` | 103 | Crawled, not indexed | Already strengthened; next step is wait for recrawl and inspect after Google updates. |
| 4 | `bharatanatyam-classical-dance-jewelry-set-goldencollections-bds-017` | 45 | Crawled, not indexed | Link from Bharatanatyam jewellery sets and arangetram/beginner set context. |
| 5 | `long-necklace-traditional-elegance-for-your-performance-bln-026` | 41 | Crawled, not indexed | Add as an alternate/related long haram next to BLN028. |
| 6 | `maroon-and-green-pearls-bharatanatyam-long-necklace-bln-012` | 6 | Crawled, not indexed | Add as a specific color/material variant in long haram collection copy. |
| 7 | `gold-plated-hastham-for-deity-divine-hand-accessories-vhl-027` | 3 | Crawled, not indexed | Strengthen from Varalakshmi and deity hands/legs collection context. |
| 8 | `traditional-indian-deity-accessories-goldencollections-dsn-056` | 2 | Crawled, not indexed | Link from deity short haram and Balaji/Varalakshmi compatibility context. |
| 9 | `divine-goddess-lakshmi-jewellery-deity-short-haram-dsn-062` | 1 | Crawled, not indexed | Already strengthened; hold further promotion unless restocked or high margin justifies it. |
| 10 | `deity-goddess-jewellery-graceful-charms-goldencollections` | 1 | Crawled, not indexed | Consider after stock review; title/handle could use cleanup in a separate product SEO pass. |
| 11 | `radiant-deity-god-jewelry-goldencollections` | 1 | Crawled, not indexed | Low-stock and vague handle/title; review product naming before pushing. |
| 12 | `ornate-temple-deity-short-necklace-dsn-125` | 1 | Crawled, not indexed | Consider after stock review; likely useful for deity short haram cluster. |

`elegant-jewellery-for-goddess-goldencollections-dsn-036` is active, in stock, and already `Submitted and indexed`, so it does not need the same rescue treatment.

## Do Not Prioritize Yet

These are active but out of stock and should not be pushed for indexing unless restocked or intentionally kept as reference pages:

- `enchanting-divine-long-haram-limited-edition-dln-103`
- `hindu-goddess-waist-belt-graceful-adornments-for-worship-dwb-024`
- `traditional-amman-stone-short-haram-dsn-121`
- `temple-deity-short-haram-authentic-design-dsn-098`
- `ornate-god-goddess-short-haram-dsn-094`

## Redirect Review Queue

These are old clean product URLs in the GSC sample that no longer behave like active product URLs.

Good/handled:

- `goddess-lakshmi-doll-face` -> `/collections/varalakshmi-doll-faces`; fixed and now semantically appropriate.
- `nyra-red-alta-pen-for-bharatanatyam-kuchipudi-dance-quick-dry-double-sided-pack-of-3` -> `nyra-red-alta-pen-bharatanatyam-kuchipudi-arangetram`; likely appropriate.
- Non-www `bharatanatyam-temple-jewelry-set` -> `traditional-bharatanatyam-dance-jewellery-set`; likely appropriate.

Needs owner/product review before changing:

- `gold-plated-round-andal-crown-kireetam-for-amman-alankaram-dgc-287` -> `vaira-mudi-perumal-crown-kireedam-dgc-287`; possibly mismatched because the old URL says Andal/Amman and the target says Perumal/Vaira Mudi.
- `short-necklaces-for-women-beads-fashion-jewellery-necklace-gcn-145` -> `long-necklaces-for-women-beads-fashion-jewellery-necklace-gcn-145`; suspicious short-to-long mismatch.
- `south-indian-style-short-necklace-necklaces-in-style-now-gcn-126` -> `south-indian-style-long-necklace-necklaces-in-style-now-gcn-126`; suspicious short-to-long mismatch.
- `pearl-necklace-set-trending-gold-necklaces-2024-gcn-035` -> `lakshmi-necklace-set-trending-gold-necklaces-2024-gcn-035`; likely fine if same SKU, but confirm.
- `crystal-beads-necklace-mutyala-haram-one-gram-gold-gcn-062` -> `bridal-necklace-wedding-haram-one-gram-gold-gcn-062`; likely fine if same SKU, but confirm.
- `andal-hair-crown-for-pooja-and-vratham-goldencollections-dgc-279` is a draft product and currently redirects to the homepage. This is the worst remaining redirect pattern in the clean sample. Decide whether to publish/restock it, redirect it to the closest deity crown/hair crown collection, or keep it unavailable without pushing it.

## Parameter URL Finding

The biggest crawl-waste pattern is not clean product URLs. It is parameterized product URLs:

- 948 of 1,000 visible GSC examples are product URLs with parameters.
- The top repeated normalized products include GDW004, BMT032, BLN001, DGC080, BLN008, BMT009, and VDF004.
- The deployed product-card and predictive-search URL cleanups should reduce new internal emissions, but old discovered URLs will remain in GSC until Google recrawls and consolidates.

Recommended follow-up: run a separate P1b validation focused on collection, recommendation, search, and predictive-search surfaces to prove no crawlable product links still emit `pr_*`, `variant`, `currency`, `_pos`, `_psq`, `_ss`, or `_v` parameters.

## Next Best Step

Run a small implementation sprint for the top in-stock rescue candidates:

1. Strengthen internal links for metal pins, bobby pins, BDS017, BLN026, BLN012, VHL027, and DSN056 from their strongest relevant collections.
2. Keep BLN028, BMT032, DSN062, and GDW004 in the monitoring set because they were already strengthened.
3. Do not push DLN103 or other out-of-stock items until restocked.
4. Review and fix only confirmed semantically bad redirects, starting with DGC279 homepage redirect and the short-to-long necklace redirects.
5. Re-run URL Inspection after Google recrawls; do not expect the URL Inspection state to change immediately after internal-link edits.
