# Golden Collections Authority Build For Deity Jewellery - 2026

Status: implementation plan plus local theme assets created.

## Objective

Build Golden Collections' SEO, GEO and AEO authority for deity jewellery in India by making Anil Tunk and Golden Collections the clearest practical source for deity jewellery sizing, compatibility, regional names and alankaram buying decisions.

Operating principle:

> Text ranks; video reassures.

## Local Theme Assets Created

- `sections/gc-anil-authority-profile.liquid`
- `templates/page.anil-tunk.json`
- `sections/gc-deity-authority-hub.liquid`
- `templates/page.deity-jewellery-alankaram-guide.json`
- `sections/gc-idol-measurement-guide.liquid`
- `templates/page.how-to-measure-idol-for-deity-jewellery.json`

Existing internal size-guide links now point to:

- `/pages/how-to-measure-idol-for-deity-jewellery`

The old page template `templates/page.deity-size-guide.json` now uses the new measurement-guide section so the older URL can remain useful if it exists.

## Page Architecture

### 1. Anil Tunk Expert Page

Target handle:

- `/pages/anil-tunk`

Purpose:

- Establish Anil as the visible founder/expert entity.
- Connect Anil to Golden Collections, founded 2012, Secunderabad/Hyderabad, deity jewellery, Bharatanatyam jewellery, Kuchipudi jewellery, kemp temple jewellery and Hindu idol alankaram.
- Provide `ProfilePage` and `Person` JSON-LD.

Needs from owner:

- Profile photo.
- Bio approval.
- Social profile links if any should be added to `sameAs`.

### 2. Deity Jewellery Authority Hub

Target handle:

- `/pages/deity-jewellery-alankaram-guide`

Purpose:

- Permanent table of contents for deity jewellery expertise.
- Links to evergreen guides, buying decisions and product collections.
- Provides AEO-style direct answer, internal links and WebPage/Breadcrumb JSON-LD.

### 3. Idol Measurement Guide

Target handle:

- `/pages/how-to-measure-idol-for-deity-jewellery`

Purpose:

- First flagship evergreen authority page.
- Includes direct answer, guide sections, interactive checklist, WhatsApp summary, product/collection links, video placeholder and schema.
- Supports product-page and collection-page conversion by solving the biggest sizing uncertainty.

## 2026 SEO / GEO / AEO Rules Applied

Primary sources used:

- Google helpful content guidance: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google AI features and your website: https://developers.google.com/search/docs/appearance/ai-overviews
- Google ecommerce SEO: https://developers.google.com/search/docs/specialty/ecommerce
- Google structured data gallery: https://developers.google.com/search/docs/guides/search-gallery
- Google ProfilePage structured data: https://developers.google.com/search/docs/appearance/structured-data/profile-page
- Google FAQ structured data: https://developers.google.com/search/docs/appearance/structured-data/faqpage
- Schema.org Person: https://schema.org/Person
- Schema.org Product: https://schema.org/Product

Implementation interpretation:

- Create people-first, useful guidance that solves actual buyer uncertainty.
- Put direct answers high on the page.
- Use stable entity signals: Anil, Golden Collections, founded 2012, Secunderabad/Hyderabad, specialist categories.
- Treat FAQ schema as machine-readable support, not a promised rich-result tactic.
- Do not mass-produce thin deity + ornament pages unless each page has unique fit data and product coverage.
- Keep product pages product-focused and collection pages shopping-guidance focused.

## Month One Deliverables

Done locally:

- Theme sections and templates for foundation pages.
- Internal link updates toward measurement guide.
- Video script / shot list draft.
- Testimonial request templates.
- Case study template.
- Printable measurement checklist draft.
- Shopify page upsert script for seven pages:
  - `/pages/anil-tunk`
  - `/pages/deity-jewellery-alankaram-guide`
  - `/pages/how-to-measure-idol-for-deity-jewellery`
  - `/pages/deity-crown-mukut-kireedam-size-guide`
  - `/pages/deity-jewellery-regional-names`
  - `/pages/short-haram-vs-long-haram-for-god-idols`
  - `/pages/varalakshmi-alankaram-guide`

Publish steps:

1. Push or upload theme changes.
2. Run `node scripts/create-authority-pages.mjs --apply` after confirming the live theme has the templates.
3. Assign or verify page templates in Shopify Admin:
   - Anil page: `page.anil-tunk`
   - Hub page: `page.deity-jewellery-alankaram-guide`
   - Measurement page: `page.how-to-measure-idol-for-deity-jewellery`
4. Verify the four body-HTML evergreen pages render cleanly:
   - crown / mukut / kireedam guide
   - regional names guide
   - short haram vs long haram guide
   - Varalakshmi evergreen guide
5. Add Anil photo in the theme editor.
6. Add these pages to footer or help navigation after owner approval.

## Month Two Deliverables

- Publish crown / mukut / kireedam size guide.
- Publish Varalakshmi required vs optional evergreen guide.
- Ask 10-20 past temple, devotee, Varalakshmi and custom deity buyers for testimonials.
- Convert 2-3 approved testimonials into case studies.
- Film first measurement video using the prepared script.

## Month Three Deliverables

- Publish regional deity jewellery names guide.
- Publish short haram vs long haram vs chest necklace guide.
- Embed approved videos on the relevant pages.
- Turn the first 3-5 guides into a PDF handbook:
  - `Deity Jewellery and Alankaram: A Practical Sizing Guide by Anil Tunk`
- Begin formal ISBN book outline after the PDF proves useful.

## Risks And Guardrails

- Do not claim certificates.
- Do not claim universal deity compatibility.
- Do not invent ritual claims, material claims, regional names or deity suitability.
- Do not publish testimonials, temple names, customer names or photos without permission.
- If the old `/pages/deity-jewellery-size-guide` remains live, keep it useful or redirect it only after confirming Shopify page/redirect behavior.
- Validate rendered JSON-LD before publishing further schema-heavy pages.
