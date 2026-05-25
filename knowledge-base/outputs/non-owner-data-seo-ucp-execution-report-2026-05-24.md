# Non-Owner-Data SEO/UCP Execution Report

Date: 2026-05-24  
Updated: 2026-05-25 with owner-confirmed Varalakshmi face materials.

Scope: Complete all SEO/GEO/AEO/UCP and UCP-related work that does not require new owner product facts. Deity compatibility sheet work is intentionally excluded until owner data is provided.

## Completed

### Theme And Schema

- Published scoped theme fixes to main theme `shopifyaitool` / `186459816234`.
- Fixed social/entity source data:
  - corrected Facebook URL typo from `goldencolletions` to `goldencollections`
  - added X/Twitter profile `https://x.com/GCJewellery`
  - aligned live schema entity IDs toward canonical `https://www.goldencollections.com/#organization` and `#website`
- Updated rich-text heading rendering so rich-text blocks configured as `h1` emit semantic `<h1>`.
- Cleaned the default collection template so the built-in collection banner is the only default collection H1.
- Hardened product breadcrumbs and product breadcrumb schema so stale/string metafields cannot output blank collection breadcrumb items.
- Added a scoped publish script: `scripts/publish-seo-ucp-theme-fixes.mjs`.

Validation:

- Shopify JSON templates parsed after stripping Shopify generated comment headers.
- Script syntax check passed for:
  - `scripts/publish-seo-ucp-theme-fixes.mjs`
  - `scripts/apply-varalakshmi-hands-legs-confirmed-fields.mjs`
- Main theme asset reads confirmed corrected source assets are live.

Storefront caveat:

- Some public storefront fetches still returned older cached HTML for specific collection pages after deploy, especially real/black kemp and intermittent Varalakshmi collection responses. Live theme assets are corrected; re-fetch later before declaring rendered cache fully propagated.

### Real Kemp

- Ran real kemp previews:
  - `tmp/real-kemp/content-preview.json`
  - `tmp/real-kemp/parent-rule-preview.json`
  - `tmp/real-kemp/kemp-mattal-legacy-preview.json`
  - `tmp/kemp-matching/matching-product-refs-preview.json`
- Applied safe real kemp updates:
  - parent collection rule/tag cleanup
  - mattal legacy collection cleanup
  - product content pass with `--skip-updated`
  - matching product references for real and black kemp
- Verification result:
  - `node scripts/apply-real-kemp-products-content.mjs --verify`
  - 192 products checked
  - 0 verify issues

### Varalakshmi

- Applied Varalakshmi dolls/full-set confirmed fields:
  - 165 products
  - collection updated
  - 157 active, 8 draft, 0 zero-image
  - 0 variant barcode changes
- Fixed the hands/legs script SKU parser so product-level codes like `VHL013`, `DJhandslegs010`, and `DJhandslegs011` are preserved correctly.
- Applied Varalakshmi hands/legs confirmed fields:
  - 35 active products updated
  - collection now 35 active, 3 draft
  - 0 variant SKU/barcode changes
- Face refinement scripts had 0 updates:
  - face title disambiguation
  - face description sync
  - face doll-title refinement

2026-05-25 owner-material update:

- Owner confirmed `VDF057` material is `Brass`.
- Owner corrected `VDF0311` to `VDF031_1` and confirmed material is `Fiber`.
- Applied `apply-varalakshmi-doll-faces-confirmed-fields.mjs --apply`:
  - 54 active face products updated
  - 15 draft products skipped
  - 0 variant SKU/barcode changes
- Verified live Shopify Admin fields:
  - `VDF057` title `Varalakshmi Ammavaru Deity Face VDF057`, material `Brass`
  - `VDF031_1` title `Kali Matha Face for Pooja VDF031_1`, material `Fiber`
- Applied face/UCP disambiguation follow-ups:
  - 47 face title updates
  - 54 face fit-note cleanups from `earring clearance` to `side ornament clearance`
  - 54 face description cleanups from earring-heavy wording to side-ornament wording
  - 9 earring descriptions cleaned from `broad face` to `wide side area`
  - 82 crown products had the misleading legacy `varalaxmifaces` tag removed
  - `VVD137` full idol clarification changed to avoid `face/mugham` keyword capture while still saying it is a complete setup

Still skipped:

- `apply-varalakshmi-waist-belt-disambiguation.mjs` remains skipped until product-level deity compatibility is confirmed.

### Measurement Proof Workflow

- Ran fresh measurement readiness audit:
  - output: `knowledge-base/outputs/shopify-product-proof-measurement-readiness-audit-2026-05-24.md`
  - active products audited: 1,784
  - with measurement metafields: 1,587
  - with measurement image signals: 117
  - with description signals: 1,234
  - with any signal: 1,613
  - missing all signals: 171
- Created workflow:
  - `knowledge-base/outputs/measurement-proof-surfacing-workflow-2026-05-24.md`
- Updated proof shot list:
  - `knowledge-base/ops/proof-asset-shot-list.md`
  - current priority crown proof queue: `DGC269`, `DGC267`, `DGC272`, `DGC263`, `DGC255`, `DGC259`, `DGC270`

### UCP Validation

Completed read-only UCP checks:

- Bharatanatyam ecosystem:
  - output: `tmp/bharatanatyam-ecosystem-audit/bharatanatyam-ucp-2026-05-24-post.md`
  - top 3: 24/27
  - top 10: 75/90
- Varalakshmi face:
  - output: `tmp/varalakshmi-face-ucp-sprint/ucp-2026-05-24-post.md`
  - top 3: 12/12
  - top 10: 39/40
- Varalakshmi face after 2026-05-25 material and disambiguation pass:
  - output: `tmp/varalakshmi-face-ucp-sprint/ucp-2026-05-25-final-after-crown-tag-cleanup.md`
  - top 3: 10/12
  - top 10: 38/40
  - recovered from temporary `29/40` after material/title changes by cleaning earring and crown face-query collisions
  - remaining strays: `VVD137` full idol for `Varalakshmi face for doll`, and `DGC054` crown for `goddess face with size`
  - do not force these out with false product wording; retest after UCP reindexing and strengthen face collection/product links only with truthful copy
- Hastham/padam:
  - output: `tmp/hastham-padam-ucp-sprint/ucp-2026-05-24-post.md`
  - top 3: 9/12
  - top 10: 34/40
  - weak prompt: `goddess hands legs with size`
- Deity crowns:
  - output: `tmp/crown-ucp-sprint/ucp-baseline.json`
  - top 3: 10/12
  - top 10: 38/40
- Deity short necklaces:
  - output: `tmp/deity-short-necklace-ucp-sprint/ucp-baseline.json`
  - top 3: 12/12
  - top 10: 40/40
- Deity long harams:
  - output: `tmp/deity-long-haram-ucp-sprint/ucp-baseline.json`
  - top 3: 12/12
  - top 10: 40/40

### Merchant/UCP Data Quality

- Merchant diagnostics command ran against account `767542510`.
- Blocked by expired/revoked Merchant OAuth refresh token:
  - output: `tmp/merchant-diagnostics.json`
  - aggregate statuses, account issues, and product sample could not be read until OAuth is refreshed.

## Remaining Owner Data Gates

Do not fill by inference:

- deity compatibility sheet by SKU/product handle
- `primary deity`, `also fits`, `broad-use`, `not for`, `size note`, `special symbol`
- crown/idol fit claims without proof photos or owner confirmation
- product-specific deity waist-belt compatibility
- customer/home/temple proof usage without permission and approved wording

## Recommended Next Owner Input

1. Provide the deity compatibility sheet.
2. Capture the seven crown measurement proof SKUs.
3. Refresh Merchant OAuth token so diagnostics can run.

After those inputs, the next automation pass can safely complete deity-specific collections, crown proof alt/schema reinforcement, and Merchant issue remediation.
