# Golden Collections Knowledge Hub Build - 2026-05-15

## Live URL

- https://www.goldencollections.com/pages/golden-collections-knowledge-hub

## Purpose

Create one central authority page for Golden Collections entity facts, Anil Tunk author context, deity jewellery sizing, regional temple jewellery vocabulary, Bharatanatyam and Kuchipudi jewellery, real kemp guidance, and customer-facing buying guides.

## Implemented

- Added Shopify section: `sections/gc-knowledge-hub.liquid`.
- Added Shopify page template: `templates/page.golden-collections-knowledge-hub.json`.
- Added page definition to `scripts/create-authority-pages.mjs`.
- Added publish coverage to `scripts/publish-authority-theme-assets.mjs`.
- Added footer visibility link: `Golden Collections Knowledge Hub`.
- Added Anil page CTA/link to the Knowledge Hub.
- Added deity authority hub breadcrumb and CTA link back to the Knowledge Hub.
- Added SEO title/description safeguards for the Knowledge Hub in `layout/theme.liquid` and `snippets/meta-tags.liquid`.

## Entity Rules Used

- Golden Collections started in 2012 and is led by founder Anil Tunk.
- Golden Collections is based in Secunderabad/Hyderabad, Telangana, India.
- Family heritage may be described as rooted in a family jewellery tradition since 1961.
- The page avoids saying Golden Collections was founded in 1961 or that Ashok/Lakshman Tunk founded Golden Collections.
- Customer-facing email: `support@goldencollections.com`.

## Verification

- Page created in Shopify Admin API with handle `golden-collections-knowledge-hub`.
- Canonical URL renders as `/pages/golden-collections-knowledge-hub`.
- Page is present in Shopify pages sitemap.
- Preview theme render confirms the updated section asset contains:
  - `store entity remains anchored to 2012`
  - real kemp fallback image
  - corrected readable hero intro styling
- Bare public URL initially lagged behind the updated section asset due Shopify page/render cache. Main theme asset readback confirms the uploaded asset is current.

## Next Action

Once the bare public URL shows the same clean render as the preview, request indexing for:

- `https://www.goldencollections.com/pages/golden-collections-knowledge-hub`

