# Weekly Operating Brief - 2026-05-11

Backlinks: [[../wiki/index.md]], [[../wiki/content-roadmap.md]], [[../wiki/open-questions.md]], [[../wiki/collection-optimization-playbook.md]]

## Executive Summary

This week moved Golden Collections' AI/SEO workflow from chat-only discussion into durable repo artifacts. The knowledge base now has a central index, a health check, and a theme/schema verification report. A narrow schema fix was also made locally in the Shopify theme to avoid misleading free-shipping and broad authenticity claims in product JSON-LD.

Nothing has been pushed to Shopify from this session. The Shopify theme changes are local and should be rendered/validated before deployment.

## What Changed

- Created `knowledge-base/wiki/index.md` as the main entry point for future SEO/GEO work.
- Created `knowledge-base/outputs/kb-health-check-2026-05-11.md`.
- Created `knowledge-base/outputs/theme-schema-verification-2026-05-11.md`.
- Updated `knowledge-base/README.md` and `knowledge-base/wiki/index.md` so new outputs are discoverable.
- Updated `sections/main-product.liquid` locally:
  - Removed universal `shippingDetails` from global Product `Offer` schema.
  - Replaced broad `Authentic ... heritage jewelry` schema description prefix with safer `Traditional ... from Golden Collections` wording.
  - Removed generic `Authenticity: Handcrafted Heritage` additional property.

## Top SEO/GEO Takeaways

- The KB structure is strong: `raw/`, `wiki/`, and `outputs/` are working as intended.
- Golden Collections' best SEO moat remains catalog depth plus cultural specificity: Bharatanatyam, real kemp, deity jewellery, Varalakshmi, regional names, and size/compatibility guidance.
- The deity compatibility model is a major differentiator because it connects deity, idol size, ornament type, placement, and fit confidence.
- Collection optimization should follow `knowledge-base/wiki/collection-optimization-playbook.md`: optimize the collection and every product in it, not just the collection page.
- For answer engines, stable repeated facts across schema, visible copy, glossary, FAQ, About, and product/collection pages matter more than generic blog volume.

## Theme And Schema Status

Positive:

- No rogue public email addresses were found in scanned theme surfaces.
- `support@goldencollections.com` appears in the expected public/schema locations.
- FAQ schema uses owner-confirmed facts for founder, address, shipping regions, materials, and return-policy direction.
- No explicit public certificate claim was found in scanned theme surfaces.

Fixed locally:

- Product schema no longer states INR 0 shipping for all products.
- Product schema no longer adds generic `Authenticity: Handcrafted Heritage`.

Still needs validation:

- Render one normal product page and one deity product page.
- Validate JSON-LD with Google Rich Results Test or Schema.org validator.
- Check whether global Product schema and deity Product schema merge cleanly on deity templates.
- Render one normal collection and one deity collection.
- Current blocker: the development theme preview returned `401` for representative product, collection, and FAQ pages because the storefront is password-protected and the Admin API token cannot bypass that Shopify CLI limitation. A Theme Access password or storefront password is needed.

## Current Risks

- Full `shopify theme check` still fails because of pre-existing unrelated issues:
  - Missing `snippets/icon-arrow.liquid`.
  - Missing locale translations.
  - Backup-file warnings.
  - Unrelated section warnings.
- Deity product pages may emit both global product schema and deity product schema. This may be fine if the graph merges cleanly, but it needs rendered-page validation.
- A development theme preview was created/updated for validation with preview theme id `187012841770`; it was not published live. The local dev server was stopped after the blocked validation attempt.
- Some historical output files still mix answered and open questions. Operationally, use `knowledge-base/wiki/open-questions.md` as the current active list.
- Catalog hygiene issues still need a dedicated review when Shopify product data is available, especially draft placeholder products, missing media, and product/range ambiguity.

## Owner Decisions Needed

From `knowledge-base/wiki/open-questions.md`:

1. For regular Bharatanatyam/Kuchipudi jewellery, can public copy include a plating thickness range, or should it only say gold plated?
2. Do kids, teen, and adult dance sets use different size rules, or mostly the same components scaled down/up?
3. Which product families create the most support questions around sizing?

These affect product copy, size guides, structured data, FAQ content, and support-reduction work.

## Actions Codex Can Implement Directly

1. Get a Theme Access password or storefront password, then render and validate product/collection JSON-LD before pushing the local schema change to Shopify.
2. Fix the unrelated full-theme-check blocker for missing `snippets/icon-arrow.liquid` if it is still relevant to the active theme.
3. Create a catalog hygiene review output once Shopify product export or Admin API read-back data is available.
4. Start a Search Console page-2 opportunity report once query/page exports are added to `knowledge-base/raw/`.
5. Use `collection-optimization-playbook.md` for the next collection pass, especially deity short harams or Varalakshmi/banana tree decor.

## Recommended Next Week Priority

1. Validate the local schema fix on rendered product pages.
2. Decide whether to push the schema fix to Shopify after validation.
3. Ask and record the three owner answers in `wiki/open-questions.md`.
4. Pick one collection for a full optimization pass using the collection playbook.
5. Add fresh Search Console exports to `knowledge-base/raw/` if available.

## Measurements To Check Next

After deployment or content changes:

- Rich Results / Schema.org validation status.
- Google Search Console impressions, CTR, and average position for affected pages.
- Product/collection crawl and indexing status.
- Merchant Center warnings or disapprovals, if feed changes are involved.
- Customer support questions around sizing and compatibility.

## Notes

This brief follows the "work in the open" principle: useful decisions, findings, and next steps should be filed back into the KB so future Codex sessions can continue from source artifacts instead of relying on chat memory.
