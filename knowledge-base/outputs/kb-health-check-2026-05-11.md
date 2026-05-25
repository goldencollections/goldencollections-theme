# Knowledge Base Health Check - 2026-05-11

Scope:

- `knowledge-base/README.md`
- `knowledge-base/wiki/*.md`
- `knowledge-base/raw/*.md`
- `knowledge-base/outputs/*.md`
- `custom-data/README.md`

## Summary

The Golden Collections knowledge base is already in a strong raw/wiki/outputs shape. It has a useful separation between owner-confirmed facts, raw research, compiled wiki pages, and generated outputs. The biggest gap was navigability: there was no central wiki index. This health check adds that missing entry point through `knowledge-base/wiki/index.md`.

Overall status: good foundation, ready for weekly operating briefs after a light cleanup pass.

## What Looks Healthy

- The KB has a clear source rule: do not publish uncertain claims and mark unconfirmed claims as `Needs confirmation`.
- Owner-confirmed facts are compiled into stable wiki pages, especially `business-entity.md`, `real-kemp-jewellery.md`, and `open-questions.md`.
- SEO/GEO strategy is not generic. It is grounded in Golden Collections' actual catalog depth: Bharatanatyam, real kemp, deity jewellery, Varalakshmi, regional names, and size/compatibility guidance.
- The deity compatibility model is unusually strong for ecommerce SEO because it maps deity, idol size, and ornament/accessory type.
- Shopify custom data work is connected to SEO/GEO goals instead of being treated as isolated admin data.
- The roadmap correctly prioritizes page structure, schema consistency, visible FAQ alignment, internal links, and source-of-truth pages.

## Issues And Risks

### 1. Missing central index

Status: fixed in this pass.

Before this health check, the KB required readers to start from the README or manually inspect files. `knowledge-base/wiki/index.md` now gives future Codex sessions and Obsidian users a compact map of the wiki, raw sources, outputs, and operating workflow.

### 2. README did not include the new index

Status: fixed in this pass.

The README's "Current Wiki" list now includes `[[wiki/index.md]]` so the entry point is visible before individual topic pages.

### 3. Answered questions remain mixed with open questions in an output file

Status: needs cleanup.

`knowledge-base/outputs/questions-for-owner-after-research-2026-05-02.md` contains many answered items plus a few still-open questions. This is acceptable as a historical output, but ongoing operation should rely on `wiki/open-questions.md` as the active open-question source.

Recommended action:

- Leave the historical output unchanged.
- Treat `wiki/open-questions.md` as the current active list.
- When new owner answers arrive, update `wiki/open-questions.md` and the relevant topic page.

### 4. Remaining owner questions need operational priority

Status: active.

Current highest-value unresolved questions:

- Can regular Bharatanatyam/Kuchipudi jewellery publish a plating thickness range, or should public copy only say gold plated?
- Do kids, teen, and adult dance sets use different size rules, or mostly the same components scaled down/up?
- Which product families create the most support questions around sizing?

Why this matters:

- These questions affect product copy, size guides, schema claims, and support-reduction content.

### 5. Theme/schema cleanup claims need verification against current code

Status: needs verification before marking complete.

The wiki says old brand data, certificate language, unsupported origin claims, and incorrect plating claims should be removed. Some cleanup may already be in progress in the working tree, but this health check did not verify every theme template or live page.

Recommended action:

- Run a theme-level search for old brand references, certificate claims, unsupported origin claims, and non-approved email addresses.
- Verify rendered schema for Organization/LocalBusiness, Product, CollectionPage, ItemList, BreadcrumbList, and visible FAQ alignment.

### 6. Catalog hygiene issues are captured but not yet converted into a tracking artifact

Status: needs output or issue list.

Raw research mentions:

- Draft Varalakshmi products with placeholder-like prices and missing media.
- Zero or negative inventory active products.
- Product/range ambiguity at SKU level.

Owner decisions now clarify that zero/negative active products can remain live for SEO/GEO unless there is another operational reason to hide them. Draft placeholder products still need a separate cleanup decision.

Recommended action:

- Create a future `outputs/catalog-hygiene-review-YYYY-MM-DD.md` when Shopify product data is available.

### 7. Backlink coverage is good but not complete

Status: minor improvement.

Existing wiki pages contain backlink lines, and the new index links to all major pages. Future pages should follow the same pattern.

Recommended action:

- When a new wiki page is created, add it to `wiki/index.md`.
- Add a `Backlinks:` line to every new wiki page.
- Consider adding `[[index.md]]` to future pages, but do not rewrite all existing pages just for this.

## Recommended Next Actions

1. Use `wiki/index.md` as the starting point for all future SEO/GEO work.
2. Create the first weekly operating brief in `knowledge-base/outputs/weekly-brief-2026-05-11.md` after deciding what new data to include.
3. Run a theme/schema verification pass for old claims, certificate language, email consistency, and structured data alignment.
4. Ask the owner the three remaining open questions in `wiki/open-questions.md`.
5. When new Search Console data is available, add it to `knowledge-base/raw/` and produce a page-2 opportunity report in `knowledge-base/outputs/`.

## Suggested Weekly Brief Inputs

Use whatever is available each week:

- Google Search Console query export.
- Google Search Console page export.
- Shopify top products and collections.
- Shopify product data for draft, zero-stock, and negative-inventory items.
- Competitor URLs or keyword exports.
- Merchant Center issues.
- Recent customer questions from WhatsApp/email.
- Theme changes since the previous brief.

## Suggested Weekly Brief Output

Recommended file pattern:

`knowledge-base/outputs/weekly-brief-YYYY-MM-DD.md`

Recommended sections:

- Executive summary.
- What changed.
- Top SEO opportunities.
- Theme/schema issues.
- Product/collection priorities.
- Content or glossary opportunities.
- Owner decisions needed.
- Actions Codex can implement directly.
- Measurements to check next week.
