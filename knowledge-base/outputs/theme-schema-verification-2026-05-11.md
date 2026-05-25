# Theme And Schema Verification - 2026-05-11

Scope:

- `layout/`
- `sections/`
- `snippets/`
- `templates/`
- `config/`
- `locales/`
- `assets/` text files

Purpose:

Verify the current Shopify theme against the Golden Collections knowledge base source rule:

- Use `support@goldencollections.com` as the only public email.
- Keep Organization/LocalBusiness schema aligned to Golden Collections.
- Remove old-brand, unsupported certificate, unsupported origin, and incorrect plating claims.
- Make schema claims match confirmed facts and visible page content where practical.

## Summary

The theme is mostly aligned with the current knowledge base. No rogue public email addresses were found in the scanned theme surfaces. Organization and FAQ copy generally use owner-confirmed Golden Collections facts.

One high-priority schema issue was found and fixed in this pass: the global product JSON-LD marked all product offers with INR 0 shipping to India, which conflicted with the KB fact that India courier shipping is free only above INR 499 and international shipping is calculated at checkout.

## Checks Run

Searches covered:

- Email patterns: `support@`, `gmail`, `contact@`, `info@`, and general email regex.
- Trust/claim terms: `certificate`, `certified`, `authenticity`, `heritage`, `legacy`, `origin`, `founder`, `plating`, `micron`, `24 carat`, `artisan`, `handcrafted`.
- Old-brand terms: `Feelori`, old/previous brand phrases, and Golden Collections spelling variants.
- Structured data terms: `schema.org`, `application/ld+json`, `Organization`, `LocalBusiness`, `Product`, `BreadcrumbList`, `FAQPage`, `CollectionPage`, and `ItemList`.

## Findings

### P1 - Product schema stated free INR shipping for all products

File: `sections/main-product.liquid`

Evidence:

- Before this pass, the global product `Offer` schema included:
  - `shippingDetails`
  - `shippingRate.value`: `0`
  - `currency`: `INR`
  - `shippingDestination.addressCountry`: `IN`

Why it matters:

- The KB says India courier shipping is free above INR 499.
- International delivery is charged at checkout.
- A universal free-shipping schema claim may misrepresent the offer and create structured-data inconsistency.

Recommended fix:

- Remove `shippingDetails` from the global product schema unless the theme can express the exact free-shipping threshold and destination accurately.
- If shipping schema is kept, model the INR 499 threshold correctly and avoid implying universal free shipping.

Status: fixed in code by removing the universal `shippingDetails` block. Still needs rendered JSON-LD validation.

### P2 - Global product schema used broad "Authentic" and "Handcrafted Heritage" language

File: `sections/main-product.liquid`

Evidence:

- Before this pass, product schema description started with `Authentic ... heritage jewelry`.
- Before this pass, `additionalProperty` included `Authenticity` with value `Handcrafted Heritage`.

Why it matters:

- The KB allows safe public claims such as handcrafted, hand-finished, handmade, artisan-made, temple craft, and Hyderabad atelier.
- However, the word `Authenticity` and generic `Authentic ... heritage jewelry` can be too broad across every product, especially deity decor, accessories, or products without detailed product-level proof.

Recommended fix:

- Replace the generic prefix with product/category-specific descriptions.
- Prefer KB-safe wording such as `quality-checked traditional jewellery` or use product descriptions/metafields without adding broad authenticity claims.

Status: partially fixed in code. The global prefix now uses `Traditional ... from Golden Collections`, and the generic `Authenticity` property was removed. Still needs rendered JSON-LD validation.

### P2 - Main product schema may duplicate deity product schema on deity templates

Files:

- `sections/main-product.liquid`
- `snippets/deity-product-schema.liquid`

Evidence:

- `sections/main-product.liquid` renders `deity-product-schema` around line 1045.
- The same section also emits a global Product graph later around line 2594 onward.
- `snippets/deity-product-schema.liquid` emits a Product node using the same product `@id`.

Why it matters:

- Multiple JSON-LD blocks can be valid when they share stable `@id` values, but this should be tested on rendered deity product pages.
- If the global Product node contains generic claims and the deity Product node contains deity-specific claims, Google may receive mixed signals.

Recommended fix:

- Render a deity product page and validate the merged graph.
- Consider making the global schema skip or simplify product details for `product.template_suffix contains 'deity'`, letting `deity-product-schema` own deity-specific properties.

Status: needs rendered-page validation before changing.

### P3 - `organization-schema.liquid` appears aligned but may be unused

File: `snippets/organization-schema.liquid`

Evidence:

- The snippet contains Organization and JewelryStore schema with Golden Collections facts, owner-confirmed email, address, phone, founder, and 2012 founding date.
- Search did not find an active render call for `organization-schema`.
- `layout/theme.liquid` already emits a LocalBusiness schema block.

Why it matters:

- If unused, the snippet is harmless but can become stale.
- If later rendered in addition to `layout/theme.liquid`, it may duplicate organization/local business data.

Recommended fix:

- Either keep it as a reference snippet and update only when the main schema changes, or decide on one canonical organization schema source.

Status: low risk.

### P3 - `Feelori` remains in internal section/class names

Files:

- `sections/feelori-mega-menu.liquid`
- `assets/feelori-mega-menu.js`
- `assets/custom-styles.css`
- `config/settings_data.json`

Evidence:

- `Feelori` appears mostly in section names, CSS classes, JS IDs, comments, and variable names.
- Public visible menu text appears to use Golden Collections navigation, not old-brand copy.

Why it matters:

- This is not currently a public SEO/entity issue if it remains internal.
- Renaming classes/files would be a larger refactor and could break menu behavior.

Recommended fix:

- Do not rename as part of SEO cleanup unless there is a separate engineering reason.
- If the menu is rebuilt later, choose Golden Collections class/file names.

Status: informational.

## Positive Results

- No non-approved public email addresses were found in the scanned theme surfaces.
- `support@goldencollections.com` is present in `layout/theme.liquid`, `snippets/organization-schema.liquid`, and `config/settings_data.json`.
- FAQ schema in `sections/page-faq.liquid` uses owner-confirmed facts for founder, address, shipping regions, materials, and return-policy direction.
- Homepage copy in `templates/index.json` uses the corrected founder/2012/partner-artisan/quality-check framing.
- No explicit public certificate claim was found in the scanned theme surfaces.
- Deity product and collection schema are aligned with the compatibility model: deity, ornament type, placement, idol-size guidance, measured product images, and fit caveats.

## Verification Notes

- `shopify theme check --output=json` reported no offenses for `sections/main-product.liquid` after the schema edits.
- Full `shopify theme check` still fails because of pre-existing unrelated issues elsewhere in the repo, including missing `snippets/icon-arrow.liquid`, missing locale translations, backup-file warnings, and unrelated section warnings.
- `git diff --check` passed for the files changed in this pass.
- A text search confirmed `sections/main-product.liquid` no longer contains `shippingDetails`, `Authenticity`, or `Handcrafted Heritage`.
- A Shopify development theme preview was started for rendered validation at `http://127.0.0.1:9292` with preview theme id `187012841770`; this did not publish the live theme.
- Rendered validation was blocked because all representative local preview requests returned `401`. Shopify CLI warned that Admin API token previews have missing features for password-protected storefronts. A Theme Access password or storefront password is needed for local rendered validation.
- The local Shopify dev server was stopped after the blocked validation attempt.

## Recommended Next Actions

1. Get a Theme Access password or storefront password so local preview requests can render the password-protected store.
2. Render and validate one normal product page and one deity product page with Google Rich Results Test or Schema.org validator.
3. Render and validate one normal collection page and one deity collection page.
4. Check whether the global Product schema and deity Product schema merge cleanly on deity templates.
5. Decide whether to address the unrelated full-theme-check failures as a separate cleanup task.
6. After validation, update this report or create a follow-up implementation note.

## Suggested Validation Pages

Use representative pages:

- One regular Bharatanatyam product.
- One real kemp product.
- One deity jewellery product using `product.deity` or `product.deity-lite`.
- One normal collection.
- One deity collection.
- FAQ page.
