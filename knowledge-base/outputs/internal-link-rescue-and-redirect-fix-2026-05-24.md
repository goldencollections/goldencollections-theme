# Internal Link Rescue and Redirect Fix - 2026-05-24

## Scope

Implemented the next small GSC cleanup sprint after the clean product URL extract.

Goals:

- Strengthen internal links to active, in-stock products from the clean `Crawled - currently not indexed` sample.
- Avoid pushing DLN103 and other out-of-stock products.
- Fix the confirmed bad redirect patterns: DGC279 falling to homepage, and two short-necklace URLs redirecting to out-of-stock long-necklace product handles.

No product inventory, product status, canonical tags, robots rules, or noindex rules were changed.

## Internal Links Added

Updated Shopify `custom.collection_intro` metafields for these collections:

| Source collection | Added links |
|---|---|
| `bharatanatyam-hair-accessories` | `BHA-011` metal pins, `BHA-008` bobby pins |
| `bharatanatyam-makeup-hair-essentials` | `BHA-008` bobby pins, `BHA-011` metal pins |
| `bharatanatyam-jewellery-sets` | `BDS-017` Bharatanatyam dance jewellery set |
| `bharatanatyam-long-necklace` | existing `BLN-028`, plus `BLN-026` and `BLN-012` |
| `hands-legs-for-varalakshmi-idol` | `VHL027` deity hastham |
| `deity-short-harams` | existing `DSN062`, plus `DSN056` |

Reasoning:

- All newly linked products are active and in stock.
- The source collections are directly relevant to the product type.
- Copy was kept short and shopper-facing, using natural anchor text rather than keyword stuffing.

## Redirects Fixed

| Old path | Previous behavior | New target | Status |
|---|---|---|---|
| `/products/andal-hair-crown-for-pooja-and-vratham-goldencollections-dgc-279` | Draft product fell through to homepage | `/collections/deity-hair-crown` | Created URL redirect |
| `/products/short-necklaces-for-women-beads-fashion-jewellery-necklace-gcn-145` | Redirected to out-of-stock `long-necklaces...gcn-145` product | `/collections/short-necklace` | Updated URL redirect |
| `/products/south-indian-style-short-necklace-necklaces-in-style-now-gcn-126` | Redirected to out-of-stock `south-indian-style-long...gcn-126` product | `/collections/short-necklace` | Updated URL redirect |

Notes:

- DGC279 is a draft product with stock in Shopify, but it is not live. Redirecting the old public URL to `deity-hair-crown` is safer than letting it resolve to the homepage.
- The two necklace targets are out of stock and semantically awkward because the old URL says short necklace while the live target handle/title says long necklace. The broader fashion necklace collection is the safer target until those products are reviewed/restocked.

## Verification

Saved evidence:

- Preflight state: `tmp/internal-link-sprint-2/preflight-shopify-state.json`
- Apply result: `tmp/internal-link-sprint-2/apply-result.json`
- Live verification: `tmp/internal-link-sprint-2/live-verification-v2.json`

Redirect verification:

- DGC279 now redirects to `https://www.goldencollections.com/collections/deity-hair-crown`. Live response currently returns `302`, likely because Shopify still has a draft product route for that handle, but it no longer falls through to the homepage.
- GCN145 short-necklace URL now returns `301` to `/collections/short-necklace`.
- GCN126 short-necklace URL now returns `301` to `/collections/short-necklace`.

Internal-link verification:

- Shopify Admin confirms all six collection intro metafields contain the intended links.
- Live section rendering immediately confirmed the new links for:
  - `bharatanatyam-hair-accessories`
  - `bharatanatyam-makeup-hair-essentials`
  - `bharatanatyam-jewellery-sets`
  - `hands-legs-for-varalakshmi-idol`
- Live section rendering still showed cached older intro text for:
  - `bharatanatyam-long-necklace`
  - `deity-short-harams`
- Translation check found no stale Shopify translations for those two metafields, so the likely issue is storefront/section cache lag, not a data mismatch.

## Not Changed

- DLN103 was not promoted because it is active but out of stock.
- Other out-of-stock clean product URLs were not promoted.
- DGC287 was reviewed but not changed in this sprint. It redirects from an old Andal/Amman-like URL to the same active SKU family `DGC287`, now titled as a Balaji/Vishnu Vaira Mudi crown. This still deserves product-owner review, but it is less clearly wrong than the homepage and short-to-long out-of-stock patterns fixed here.

## Next Step

Recheck the two cached sections after Shopify/CDN refresh, then rerun URL Inspection later after Google recrawls. Do not expect GSC coverage state to change immediately from these edits.
