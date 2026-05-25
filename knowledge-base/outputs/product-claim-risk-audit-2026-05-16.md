# Golden Collections Product Claim Risk Audit

Date: 2026-05-16  
Scope: local Shopify theme/content files plus read-only Shopify Admin API scan of products, collections, pages, blogs/articles, and shop fields. No live changes made.

## Confirmed Entity Rules Used

- Golden Collections was established by Anil Tunk in 2012 in Secunderabad/Hyderabad.
- Family jewellery tradition since 1961 may be used only as heritage context.
- Do not say Golden Collections was founded/started/established in 1961.
- Do not say Ashok or Lakshman founded Golden Collections.
- Public support email should be `support@goldencollections.com`.
- Regular range terminology should be regular Bharatanatyam/Kuchipudi jewellery, not imitation kemp.
- Golden Collections does not provide certificates.

## Findings

| Priority | Source | Current text | Risk | Recommended fix |
| --- | --- | --- | --- | --- |
| P1 | Shopify Admin API, product `body_html`; 135 products matched, including 129 active and 6 draft products. Sample URLs: `https://www.goldencollections.com/products/bharatanatyam-antique-gold-necklace`, `https://www.goldencollections.com/products/bharatanatyam-long-haram-classical-dance-necklace-bln-002`, `https://www.goldencollections.com/products/gold-plated-kempu-bharatanatyam-short-necklace-bsn-015`. | "For arangetram or premium long-term use, many dancers choose real kemp jewellery; this piece is from the regular imitation kemp dance range." | Uses the disallowed term "imitation kemp" for Golden Collections regular dance jewellery. This can weaken product trust, confuse the regular vs real kemp range distinction, and create inconsistent entity signals across dance products. | Bulk replace only this repeated sentence in product descriptions. Suggested text: "For arangetram or premium long-term use, many dancers choose real kemp jewellery; this piece is from the regular Bharatanatyam/Kuchipudi dance jewellery range." For category-specific products, use "regular Bharatanatyam dance jewellery range" or "regular Kuchipudi dance jewellery range" where more accurate. |
| P2 | Shopify Admin API, `shop.email`. Local theme/schema search found public customer-facing email hardcoded as `support@goldencollections.com` in `layout/theme.liquid`, `snippets/organization-schema.liquid`, `sections/main-page.liquid`, and `config/settings_data.json`. | `goldencollections9@gmail.com` | Not found as public storefront support copy in the local theme scan, but it remains in the Shopify shop email field. Any future theme, app, feed, schema, or automation that reads `shop.email` could leak the old Gmail as a public support email. | Keep all public copy/schema on `support@goldencollections.com`. If operationally possible, manually update Shopify Admin shop email or add a code review guardrail: never use `shop.email` for public support surfaces; use the confirmed support email or `shop.contactEmail` only. |
| P3 | Local theme meta/about/knowledge surfaces: `layout/theme.liquid:29`, `layout/theme.liquid:35`, `snippets/meta-tags.liquid:10`, `snippets/meta-tags.liquid:20`, `sections/main-page.liquid:26`, `sections/gc-knowledge-hub.liquid:66`, `sections/gc-knowledge-hub.liquid:237`. Current live spot checks also show the glossary meta description uses the same pattern. | Examples: "Golden Collections is rooted in a family jewellery tradition since 1961 and was established by Anil Tunk in 2012..." and "established by Anil Tunk in 2012 and rooted in a family jewellery tradition since 1961." | The wording is mostly compliant because it separates heritage from the 2012 store establishment. However, repeated "since 1961" in meta descriptions can still create entity ambiguity if crawlers or AI systems compress the sentence poorly. | No urgent rewrite needed, but for meta descriptions prefer leading with the store entity: "Golden Collections was established by Anil Tunk in 2012 in Secunderabad/Hyderabad. The store is rooted in a family jewellery tradition since 1961..." Avoid short snippets where "Golden Collections" and "since 1961" appear without the 2012 qualifier. |

## No Risk Found In This Scan

- No public/customer-facing Ashok or Lakshman founder claim found in theme files or read-only Shopify content scan.
- No current public "Golden Collections founded/started/established in 1961" claim found in live API scan. A prior local audit artifact showed the stale glossary phrase "Golden Collections has been crafting authentic temple jewellery in Hyderabad since 1961", but current live spot check of `/pages/jewelry-glossary` did not find that phrase.
- No public old Gmail support email found in local theme/schema surfaces.
- No risky "temple-approved", "official supplier", "Shastra-compliant", or "temple supplier" claims found in products, collections, pages, or articles.
- Certificate language found in live article/package content is framed as a negative disclosure: Golden Collections does not provide certificates. No unsupported positive certificate claim was found.

## Suggested Next Step

Prioritize the 135 product descriptions using the repeated "regular imitation kemp dance range" sentence. This is the only broad live product-content issue found and is the clearest trust/SEO consistency risk.

## Completion Update - 2026-05-16

Owner had already confirmed that Golden Collections' regular range should be described as regular Bharatanatyam/Kuchipudi jewellery, not imitation kemp.

Completed after this audit:

- Added `scripts/replace-regular-imitation-kemp-product-copy.mjs` with dry-run and apply modes.
- Dry run matched exactly 135 Shopify products.
- Applied the bulk rewrite to all 135 product descriptions.
- Replacement sentence used: "For arangetram or premium long-term use, many dancers choose real kemp jewellery; this piece is from the regular Bharatanatyam/Kuchipudi dance jewellery range."
- Verification query for the old sentence returned 0 products.
- Updated local content generator scripts so future Bharatanatyam product updates do not reintroduce "regular imitation kemp dance range" or "Imitation kemp stone work" as Golden Collections range/material wording.

Trace files:

- `tmp/regular-kemp-copy-cleanup-2026-05-16/dry-run.json`
- `tmp/regular-kemp-copy-cleanup-2026-05-16/before-apply.json`
- `tmp/regular-kemp-copy-cleanup-2026-05-16/after-apply.json`
