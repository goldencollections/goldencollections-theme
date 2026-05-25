# Merchant Feed Cleanup Triage - 2026-05-17

Status: targeted Merchant cleanup applied after read-only Shopify verification. No Shopify product edits, theme edits, feed setting changes, or live product unpublishing were performed.

## Executive Summary

Golden Collections does not have an account-level Merchant Center problem right now. The major feed hygiene blockers have been cleaned up: draft products, no-image products, stale variant offers, and stale price-mismatch variant records are no longer showing as hard blocker groups.

The cleanup removed invalid Merchant product inputs only after Shopify confirmed they were draft/not published to Google or stale variant IDs that no longer exist. Final verification reduced the hard blocker audit from `221` rows to `2` rows, and both remaining rows are `NOT_IMPACTED` availability-sync notices for products that Shopify also shows as out of stock.

## Fresh Diagnostics

Read-only refresh run on 2026-05-17:

- Merchant account: `767542510`
- Products read: `5,658`
- Product issue rows: `14,822`
- Aggregate status rows: `188`
- Account-level issues: `0`

Final verification after cleanup:

- Products read: `5,459`
- Product issue rows: `12,767`
- Hard blocker audit rows: `2`
- Missing-image, landing-page draft, stale variant, and price-mismatch blocker rows: `0`

Generated files:

- `tmp/merchant-diagnostics.json`
- `tmp/merchant-product-issues.json`
- `tmp/merchant-product-issues.csv`
- `tmp/merchant-current-blocker-audit.json`
- `tmp/merchant-current-blocker-audit.csv`
- `tmp/merchant-triage-summary-2026-05-17.json`
- `tmp/shopify-google-publication-blocker-audit-2026-05-17.json`
- `tmp/merchant-invalid-feed-offer-delete-2026-05-17-dry-run.json`
- `tmp/merchant-invalid-feed-offer-delete-2026-05-17-applied.json`

## Initial Hard Blocker Classification

Initial blocker audit classified `221` unique rows across the most important issue families:

| Family | Classification | Count | Meaning |
| --- | --- | ---: | --- |
| Missing image link | `draft_product_without_images` | 107 | Draft Shopify products with no images are still reaching Merchant. |
| Missing image link | `stale_variant_offer` | 10 | Merchant has old variant offers that no longer exist in Shopify. |
| Landing page unavailable | `draft_product_in_feed` | 27 | Draft products are still in the feed and Google cannot crawl a live product page. |
| Price mismatch | `merchant_price_matches_current_shopify_or_needs_currency_check` | 2 | Not safe for blind edits; likely feed/currency/resync review. |
| Availability updated | `stale_variant_offer` | 73 | Merchant has stale variant offers for availability checks. |
| Availability updated | `availability_sync_review` | 2 | Compare Shopify inventory policy and feed availability before any write. |

Final blocker audit after cleanup classified `2` rows:

| Family | Classification | Count | Meaning |
| --- | --- | ---: | --- |
| Availability updated | `availability_sync_review` | 2 | `NOT_IMPACTED` notices; both products are active on Google and Shopify inventory is `0` with deny policy. |

## Shopify Google Publication Check

Read-only Shopify Admin GraphQL check on 2026-05-17:

- Targeted blocker rows checked against Shopify Google & YouTube publication: `221`
- Unique Shopify products checked: `182`
- Shopify products found: `182`
- Draft rows currently published to Google & YouTube in Shopify: `0`
- Rows currently published to Google & YouTube in Shopify: `86`
- Stale variant rows where the variant no longer exists in Shopify: `83`

Meaning:

- The `107` draft/no-image rows and `27` draft landing-page rows are not currently published to Google & YouTube in Shopify. This points to Merchant/feed-source stale data, not a safe Shopify product unpublish task.
- `82` stale variant rows belong to products that are still legitimately published to Google & YouTube, but the specific Merchant offer variant no longer exists in Shopify. Product-level unpublishing would be too broad and could remove valid live products.
- The safest cleanup path remains feed-source resync/removal of stale offers, not product edits.

## Applied Cleanup

Merchant API cleanup used Google's `productInputs.delete` method only for rows that passed the local safety checks:

- Draft/no-image or draft landing-page offers where Shopify status was `DRAFT` and `publishedOnGoogleYouTube` was `false`
- Stale variant offers where Shopify confirmed the variant ID no longer exists

Applied result:

- First apply pass: `195` invalid Merchant product inputs deleted; `1` draft/no-image row failed because Google said the item did not belong to the listed data source.
- Immediate Merchant refresh after deletion: product count dropped from `5,658` to `5,495`; issue rows dropped from `14,822` to `13,122`.
- Hard blocker audit dropped from `221` rows to `38` rows.
- A second cleanup pass on the remaining `34` invalid rows returned `NOT_FOUND` for the stale variant product inputs and the same data-source mismatch for the one draft/no-image row.
- Final refresh after Google processed more of the deletes: product count dropped to `5,459`; issue rows dropped to `12,767`; hard blocker audit dropped to `2` rows.
- Additional focused check confirmed the remaining price-mismatch offer points to old variant `47467223777578`, while Shopify product `8420123148586` now has one live variant `49938261279018`; the old Merchant product input was deleted and may need Google processing time before the issue disappears.
- Additional focused cleanup removed the remaining draft/no-image normal product input and confirmed the local product input had already been deleted.
- Remaining blocker rows: `2` availability review rows.
- Missing-image blockers are now `0`, landing-page blockers are `0`, stale variant blockers are `0`, and price-mismatch blockers are `0` in the current blocker audit.

Do not repeat broad delete attempts without rerunning the diagnostics first.

## Priority Fix Order

### 1. Monitor The Two Availability Sync Notices

Why:

- Only `2` non-stale availability notices remain.
- Both are `NOT_IMPACTED`, not hard disapprovals.
- Shopify product variants show inventory quantity `0` and inventory policy `deny`, and Merchant availability is also `OUT_OF_STOCK`.

Owner/feed-source action:

- Leave product data alone unless the products should actually be sold again.
- If restocking, update Shopify inventory first and let the Google feed resync.
- Recheck diagnostics later to confirm the notices age out.

### 2. Keep Stale Variant Offers At Zero

Why:

- Stale variant blockers dropped from `83` rows to `0`.
- These were old Merchant offer IDs, not live product copy problems.

Owner/feed-source action:

- Monitor the next diagnostics run.
- If stale variants reappear, fix the feed source or resync; do not unpublish active parent products.

### 3. Keep Draft/No-Image And Price-Mismatch Rows At Zero

Why:

- Draft/no-image blockers are now `0`.
- Landing-page draft blockers are now `0`.
- Price-mismatch blockers are now `0`.

Owner/feed-source action:

- Confirm Shopify Google & YouTube stays configured to exclude draft/unpublished/no-image products.
- Re-run the blocker audit before any future Merchant API delete pass.

## Later Optimizations

These affect quality/demotion more than immediate hard disapproval:

- Missing `age_group`: about `433` unique offers.
- Missing `gender`: about `417` unique offers.
- Missing `color`: about `311` unique offers.
- Invalid `age_group`: about `106` unique offers.
- Invalid `gender`: about `92` unique offers.
- Price updated: about `223` unique offers.
- Availability updated: `2` unique offers.

Recommendation:

- Handle age/gender/color after hard blockers.
- Do not invent attributes for deity/pooja products.
- For Bharatanatyam/Kuchipudi dance jewellery, use accurate product-family logic only where the product type supports it.

## Policy Review Watchlist

Some policy disapprovals appear likely to be false positives or wording/category mismatches, especially around deity crowns and religious products. Examples include:

- `local_requirements_policy_violation`: `10` unique offers
- `identity_and_belief_policy_violation`: `9` unique offers
- `alcohol_policy_violation`: `3` unique offers
- `legal_restrictions_policy_violation`: `3` unique offers
- `guns_parts_policy_violation`: `1` unique offer
- `tobacco_policy_violation`: `1` unique offer
- `live_animals_policy_violation`: `3` unique offers
- `non_product_data`: `1` unique offer

Recommendation:

- Do not bulk rewrite product titles blindly.
- Review affected products one by one for accidental words, category mismatch, or image/content ambiguity.
- If products are clearly compliant religious/deity jewellery items, prepare review requests or feed/category corrections after hard feed blockers are cleaner.

## What Not To Do

- Do not use Merchant API product writes yet.
- Do not add fake/placeholder images to draft products.
- Do not publish draft/no-image products just to remove Merchant errors.
- Do not rewrite live product pages for stale variant offers.
- Do not invent age/gender/color attributes where they do not fit the product.
- Do not treat policy false positives as proof that the products themselves are unsafe.

## Best Next Action

Open Shopify Google & YouTube channel/feed settings and confirm whether draft/unpublished/no-image products are excluded from Google surfaces. Then trigger or request a feed resync.

After resync, rerun:

```powershell
node scripts\merchant-export-product-issues.mjs 767542510
node scripts\merchant-audit-current-blockers.mjs
node scripts\merchant-audit-google-publication-blockers.mjs
```

Post-cleanup success target for the next pass:

- missing-image draft/no-image blockers stay at `0`
- landing-page draft blockers stay at `0`
- stale variant offers stay at `0`
- price review rows stay at `0`
- availability review rows reduced from `2` if Google ages them out, or remain harmless while products are truly out of stock
