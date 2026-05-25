# Merchant Center Workflow

Backlinks: [[index.md]], [[business-entity.md]], [[collection-optimization-playbook.md]], [[product-upload-workflow.md]], [[search-console-workflow.md]]

Last updated: 2026-05-16

## Purpose

This page records the Golden Collections Google Merchant Center / Merchant API integration plan and operating workflow.

Use this page before changing product feeds, diagnosing Google Merchant Center disapprovals, editing Google-visible product titles, changing product image feed rules, or automating Merchant Center checks from Codex.

## Current Status

As of 2026-05-14:

- Merchant Center is the next priority integration after Search Console because it directly affects ecommerce product visibility in Google surfaces.
- Merchant OAuth has been prepared locally through Codex scripts.
- Merchant OAuth reuses the existing Google OAuth client if Merchant-specific keys are not present.
- The local OAuth callback completed and saved a Merchant token under `tmp/`.
- Merchant API is enabled in Google Cloud project `812052515128`.
- Merchant Center account found from the logged-in UI:

```text
Golden Collections / 767542510
```

- Google Cloud project `812052515128` has been registered with Merchant account `767542510`.
- Account listing works through the Merchant API.
- Product diagnostics read works through the Merchant API.
- First diagnostic export found no account-level issues and several product/feed quality issues that need prioritized cleanup.

## Strategy

The correct sequence is:

1. Read diagnostics first.
2. Fix feed quality second.
3. Automate updates third.

Do not start by pushing product data blindly. First understand what Merchant Center is already receiving, which products are disapproved or limited, and whether the issue is image quality, title quality, price/availability mismatch, destination policy, missing identifiers, shipping/tax, or account-level settings.

## Why This Matters

For Golden Collections, Merchant Center is more commercially important than posting everywhere because it affects product eligibility and presentation in:

- Google free listings.
- Google Shopping surfaces.
- Google Merchant Center diagnostics.
- Product image/title quality used by Google.
- Potential paid Shopping campaigns if ads are used later.

Merchant Center work should be treated as product visibility infrastructure, not a social posting channel.

Google's 2026 Search agents, Universal Cart, and UCP direction make this even more important. Agentic shopping depends on reliable product identity, price, availability, variants, images, shipping/return facts, and category data. Treat Merchant Center hygiene as agentic commerce readiness, not only free-listing cleanup.

Official Google references:

- Merchant API overview: `https://developers.google.com/merchant/api/overview`
- Merchant API authorization: `https://developers.google.com/merchant/api/guides/authorization/overview`
- Merchant products guide: `https://developers.google.com/merchant/api/guides/products/overview`
- Google Universal Cart announcement: `https://blog.google/products-and-platforms/products/shopping/google-shopping-cart/`
- Google UCP update: `https://blog.google/products-and-platforms/products/shopping/ucp-updates/`
- Shopify UCP architecture note: `https://shopify.engineering/ucp`

## Credentials And Secret Handling

Merchant OAuth uses the local environment file:

```text
C:\goldencollections-theme\env
```

Preferred Merchant-specific keys:

```text
MERCHANT_CENTER_CLIENT_ID
MERCHANT_CENTER_CLIENT_SECRET
MERCHANT_CENTER_REDIRECT_URI
MERCHANT_CENTER_ACCOUNT_ID
```

Fallback behavior:

- If Merchant-specific OAuth keys are missing, scripts reuse `GOOGLE_GBP_CLIENT_ID`, `GOOGLE_GBP_CLIENT_SECRET`, and `GOOGLE_GBP_REDIRECT_URI`.
- Default redirect URI is the existing Google callback:

```text
http://localhost:3001/google/callback
```

Security rules:

- Never paste actual client secret, refresh token, or access token values into the wiki, Git commits, chat summaries, screenshots, or public docs.
- Treat `env`, `.env`, OAuth token files, and Merchant OAuth logs as local-only secret/runtime files.
- OAuth token files are generated under `tmp/` and should not be committed.

## OAuth Configuration

Required OAuth scope:

```text
https://www.googleapis.com/auth/content
```

This scope is used for Merchant Center / Content API style access.

## Local Scripts

OAuth callback and token generation:

```text
C:\goldencollections-theme\scripts\merchant-oauth-callback.mjs
```

Shared Merchant helper:

```text
C:\goldencollections-theme\scripts\merchant-lib.mjs
```

List accessible Merchant accounts:

```text
C:\goldencollections-theme\scripts\merchant-list-accounts.mjs
```

Register the Google Cloud project with Merchant Center:

```text
C:\goldencollections-theme\scripts\merchant-register-gcp.mjs
```

Read diagnostics and sample product data:

```text
C:\goldencollections-theme\scripts\merchant-diagnostics-read.mjs
```

Export product-level issue rows:

```text
C:\goldencollections-theme\scripts\merchant-export-product-issues.mjs
```

Summarize diagnostics into a KB output:

```text
C:\goldencollections-theme\scripts\merchant-summarize-diagnostics.mjs
```

Runtime outputs:

```text
C:\goldencollections-theme\tmp\merchant-token.json
C:\goldencollections-theme\tmp\merchant-auth-url.txt
C:\goldencollections-theme\tmp\merchant-registration.json
C:\goldencollections-theme\tmp\merchant-accounts.json
C:\goldencollections-theme\tmp\merchant-diagnostics.json
C:\goldencollections-theme\tmp\merchant-product-issues.json
C:\goldencollections-theme\tmp\merchant-product-issues.csv
```

First diagnostics report:

```text
C:\goldencollections-theme\knowledge-base\outputs\merchant-center-diagnostics-2026-05-14.md
```

## Operating Workflow

For diagnostics:

1. Confirm `merchantapi.googleapis.com` is enabled in Google Cloud.
2. Run Merchant OAuth if `tmp/merchant-token.json` is missing or expired.
3. Run the account listing script.
4. Identify the Golden Collections Merchant account ID.
5. Set `MERCHANT_CENTER_ACCOUNT_ID` locally or pass the account ID to the diagnostics script.
6. Run the diagnostics script.
7. Export product-level issue rows.
8. Save the output and summarize account issues, product issues, and sample product feed quality.

Commands:

```powershell
node scripts\merchant-oauth-callback.mjs
node scripts\merchant-register-gcp.mjs 767542510 goldencollections9@gmail.com
node scripts\merchant-list-accounts.mjs
node scripts\merchant-diagnostics-read.mjs <merchantAccountId>
node scripts\merchant-export-product-issues.mjs <merchantAccountId>
node scripts\merchant-summarize-diagnostics.mjs
```

For feed quality fixes:

1. Prioritize account-level issues first.
2. Prioritize product disapprovals and limited-visibility issues before general optimization.
3. Compare Merchant product title, product URL, price, availability, and image URL with Shopify.
4. Fix source data in Shopify or the active feed source wherever possible.
5. Use clean non-watermarked Merchant images when Google requires it; keep owner-preferred watermarked storefront images separate where possible.
6. Do not change product names purely for keywords if it damages shopper clarity.

For automation:

1. Create a repeatable diagnostics export first.
2. Add a summarized report that groups issues by type and affected product count.
3. Add alerting or periodic checks only after the export format is stable.
4. Automate product/feed updates only for safe, reversible fields with clear source-of-truth rules.

## Image Feed Rule

Golden Collections prefers watermarked storefront product images, but Merchant Center main image rules are stricter.

The existing product workflow records the rule:

- Merchant Center should receive a clean, non-watermarked main image wherever the feed setup allows it.
- Storefront images can keep the owner-preferred watermark strategy.
- Do not replace all storefront images only to satisfy Merchant Center if a feed-level image override is available.

See [[product-upload-workflow.md]] for the detailed Google Merchant Center Image Feed Rule.

## Source Of Truth Rules

Initial source of truth:

- Shopify remains the product catalog source of truth.
- Merchant Center diagnostics is the quality and eligibility signal.
- Codex should not use the Merchant API to overwrite product data until the current feed source is understood.
- Future UCP or Universal Cart reporting, if exposed in Merchant Center or Shopify, should be treated as a downstream commerce signal, not as the source of truth for product facts.

Fields to treat carefully:

- Product title.
- Description.
- Price.
- Availability.
- Product image URL.
- GTIN / MPN / brand identifiers.
- Product type and Google product category.
- Shipping and return policy settings.

## First Blockers

First Merchant API read attempts on 2026-05-14:

- OAuth token: created successfully.
- Initial API request: `GET https://merchantapi.googleapis.com/accounts/v1/accounts?pageSize=500`.
- Initial result: HTTP `403` with `SERVICE_DISABLED`.
- Fix: owner enabled `Merchant API` in Google Cloud project `812052515128`.
- Next result: HTTP `401` with `GCP_NOT_REGISTERED`.
- Fix: `merchant-register-gcp.mjs` registered project `812052515128` with Merchant account `767542510`.
- Result: account listing and diagnostics now work.

## First Diagnostics Summary

First completed diagnostic pass on 2026-05-14:

- Merchant account: `767542510` / Golden Collections.
- Products read: `5659`.
- Product issue rows exported: `17063`.
- Aggregate status rows: `188`.
- Account-level issues: `0`.
- Script errors: `0`.

Highest-priority issue families:

- `DISAPPROVED:item_missing_required_attribute` / missing `image_link`: 112 unique offers.
- `DISAPPROVED:landing_page_error` / product page unavailable: 22 unique offers.
- `DISAPPROVED:price_mismatch`: 3 unique offers.
- `NOT_IMPACTED:price_updated`: 290 unique offers, indicating feed/store price sync differences.
- `NOT_IMPACTED:availability_updated`: 74 unique offers, indicating feed/store availability sync differences.
- `DEMOTED:missing_item_attribute_for_product_type` / missing `age_group`: 654 unique offers.
- Image quality/size issues are present and should be handled after blocking disapprovals.

Missing-image deep dive:

- All 112 missing-image offers were audited against Shopify.
- 102 are draft Shopify products with zero product images.
- 10 are active Shopify products where the Merchant offer points to a variant ID that no longer exists in Shopify.
- 0 were simple "variant exists but image is unassigned" fixes.
- Treat this as stale/feed-source cleanup, not bulk image assignment.

Product-page-unavailable deep dive:

- All 22 `landing_page_error` offers were audited against Shopify.
- 15 are draft Shopify products.
- 7 are not in the normal Shopify feed ID shape and appear to be stale/non-Shopify Merchant items.
- Treat this as stale/feed-source cleanup before rewriting live product pages.

The full report is here:

```text
C:\goldencollections-theme\knowledge-base\outputs\merchant-center-diagnostics-2026-05-14.md
```

## Latest Diagnostics Refresh - 2026-05-16

Read-only refresh on 2026-05-16:

- Merchant account: `767542510` / Golden Collections.
- Products read: `5658`.
- Product issue rows exported: `14827`.
- Aggregate status rows: `188`.
- Account-level issues: `0`.
- Current blocker audit:
  - `C:\goldencollections-theme\tmp\merchant-current-blocker-audit.json`
  - `C:\goldencollections-theme\tmp\merchant-current-blocker-audit.csv`

Current blocker audit summary:

- Missing image link: `107` draft products without images and `10` stale variant offers.
- Landing page unavailable: `27` draft products still in the feed.
- Price mismatch: `2` current offers; current Shopify values appear to match or need currency/feed-source review before any write.
- Availability updated: `73` stale variant offers and `2` offers needing availability sync review.

No Merchant product writes were performed. Treat these as feed-source cleanup and Shopify Google channel/sync issues unless the owner explicitly confirms a different Merchant source of truth.

## Latest Diagnostics Refresh - 2026-05-17

Read-only refresh on 2026-05-17:

- Merchant account: `767542510` / Golden Collections.
- Products read: `5658`.
- Product issue rows exported: `14822`.
- Aggregate status rows: `188`.
- Account-level issues: `0`.
- Current blocker audit:
  - `C:\goldencollections-theme\tmp\merchant-current-blocker-audit.json`
  - `C:\goldencollections-theme\tmp\merchant-current-blocker-audit.csv`
- Triage summary:
  - `C:\goldencollections-theme\tmp\merchant-triage-summary-2026-05-17.json`
- Shopify Google & YouTube publication check:
  - `C:\goldencollections-theme\tmp\shopify-google-publication-blocker-audit-2026-05-17.json`
- Owner-facing report:
  - `C:\goldencollections-theme\knowledge-base\outputs\merchant-feed-cleanup-triage-2026-05-17.md`

Current blocker audit summary:

- Missing image link: `107` draft products without images and `10` stale variant offers.
- Landing page unavailable: `27` draft products still in the feed.
- Price mismatch: `2` current offers requiring currency/feed-source review before any write.
- Availability updated: `73` stale variant offers and `2` offers needing availability sync review.
- Shopify Google & YouTube publication check: `0` draft blocker rows are currently published to Google in Shopify; `83` stale variant rows reference variant IDs that no longer exist in Shopify.

Targeted Merchant cleanup was then applied using `productInputs.delete` only for draft/not-Google-published offers and stale variant IDs that no longer exist in Shopify. No Shopify product edits or product unpublishing were performed.

Immediate post-cleanup refresh:

- Product count dropped from `5658` to `5495`.
- Product issue rows dropped from `14822` to `13122`.
- Hard blocker audit dropped from `221` rows to `38` rows.
- A second cleanup pass found the remaining stale variant product inputs as `NOT_FOUND`.

Final verification refresh:

- Product count dropped further to `5459`.
- Product issue rows dropped to `12767`.
- Hard blocker audit dropped to `2` rows.
- Stale variant blockers dropped to `0`.
- Missing-image draft/no-image blockers dropped to `0`.
- Landing-page draft blockers stayed at `0`.
- Price-mismatch blockers dropped to `0`.
- Remaining rows: `2` `NOT_IMPACTED` availability-sync notices where Shopify inventory is also `0` and Merchant availability is `OUT_OF_STOCK`.
- The remaining price row was directly checked against Shopify: old variant `47467223777578` no longer exists, and live product `8420123148586` now has one variant `49938261279018`; the old Merchant product input was deleted and may need Google processing time.

Best next action is monitoring: leave the two availability notices alone unless those products should be restocked, then update Shopify inventory and let the Google feed resync.

## Next Step

Fix feed quality in this order:

1. Confirm draft/no-image/unpublished products stay excluded from the active Google feed source.
2. Keep monitoring stale variant offers; current blocker audit is `0`.
3. Leave the two availability notices alone while Shopify inventory is correctly out of stock.
4. Age group/category feed values.
5. Image quality and image size improvements.
6. Likely policy false positives.

Use the product issue CSV as the working list:

```text
C:\goldencollections-theme\tmp\merchant-product-issues.csv
```

Do not use Merchant API product writes until the current Shopify Google app/feed source behavior is fully understood.
