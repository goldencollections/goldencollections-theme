# IMG_3289 Website Asset Plan - 2026-05-20

Source inputs:

- `knowledge-base/outputs/golden-collections-img3289-video-delivery-report-2026-05-20.md`
- `knowledge-base/outputs/real-store-product-explanation-video-placement-brief-2026-05-20.md`
- `knowledge-base/wiki/retrieval-ready-seo-strategy.md`
- `knowledge-base/wiki/search-entity-map.md`
- `knowledge-base/wiki/collection-optimization-playbook.md`

## Decision

Use one short website cut as a proof-led product education asset. Do not create a standalone video page or a chain of new thin pages.

Primary asset:

- Video: `tmp/gc-promotion-img3289/exports/website-cut-golden-collections-store-product-guide-85s-2026-05-20.mp4`
- Duration: `PT1M25S`
- Format: vertical MP4, 720x1280, audio normalized/limited, source location metadata stripped
- Poster: use the matching poster from `tmp/gc-promotion-img3289/posters/`
- Publish status: not published; requires owner approval before website use

Do not use the original `G:\My Drive\GC Promotion video\IMG_3289.MOV` on the website. It is too long/heavy and should remain a source/review file.

## Website Placement

Place the 85-second cut first on:

- `/pages/how-golden-collections-checks-deity-jewellery-fit`

Reason: this page best matches the video's practical buyer-help role: in-store product explanation, deity jewellery selection, and "ask before ordering" fit guidance. It supports retrieval-ready SEO/AEO/GEO because it adds first-hand store expertise to an existing authority page rather than creating new page sprawl.

Placement guidance:

- Add one constrained vertical media block near the fit-help/proof section, not as a hero takeover.
- Pair it with a short visible caption and nearby links to deity crowns, deity necklaces, deity long harams, deity accessories, and the deity alankaram guide where relevant.
- Lazy-load the video or embed to protect mobile performance.
- If self-hosted on Shopify, use the uploaded Shopify file URL as `contentUrl`; if YouTube is used later, use the YouTube `embedUrl`.

Secondary placements after the first page is live:

- `/pages/anil-tunk`: use only if the presenter is confirmed as Anil or the copy is adjusted to "Golden Collections store guidance."
- `/pages/deity-jewellery-alankaram-guide`: use as a category overview if the spoken content aligns with multiple deity jewellery families.
- Selected collection pages: use a poster/link or one compact "Need help choosing?" block, not repeated full embeds across every collection.

## Title And Visible Copy

Recommended video title:

`Golden Collections Deity Jewellery Store Guide`

Recommended visible caption:

`A short in-store guide from Golden Collections showing deity jewellery categories and how customers can ask for fit help before ordering.`

Recommended concise description for page/schema:

`Golden Collections explains deity jewellery product categories in store, including crowns, necklaces, harams, accessories, and fit-help steps for choosing alankaram ornaments before ordering.`

Avoid claims about exact materials, prices, availability, temple approval, certificates, guarantees, or universal fit unless confirmed from live product data or owner review.

## Accessibility Metadata

Poster alt text:

`Presenter inside Golden Collections explaining deity jewellery products with crowns and alankaram ornaments displayed on store shelves.`

Video aria label:

`Video explaining Golden Collections deity jewellery product categories and how customers can ask for fit guidance before ordering.`

Caption/transcript requirement:

- Create captions before publishing. The website implementation is not complete without captions.
- Preferred caption file name: `golden-collections-deity-jewellery-store-explanation-transcript-2026-05-20.vtt`
- Use a short transcript below or near the video only if it is reviewed for product-claim accuracy.
- Mark any uncertain spoken claim as excluded or owner-review required before it appears in captions, transcript, schema, or page copy.

## SEO/AEO/GEO Guidance

Use the video as first-hand evidence, not as generic content.

Entity terms to include naturally where true:

- Golden Collections
- deity jewellery
- god jewellery
- alankaram
- deity crown / mukut / kireedam
- deity necklace
- long haram / haar / mala / malai
- deity accessories
- Varalakshmi / Lakshmi / Amman where the page context supports it
- fit guidance before ordering

Internal links should point to existing buying/help paths, such as:

- `/pages/deity-jewellery-alankaram-guide`
- `/collections/deity-crowns-1` or the current active deity crown collection path
- `/collections/deity-necklace`
- `/collections/deity-short-harams`
- `/collections/deity-long-harams`
- `/collections/deity-accessories-nose-rings-mustache-weapons-taira`
- `/collections/varalakshmi-deity-jewellery`

Do not add keyword-stuffed paragraphs. Keep the page section factual, short, and aligned with visible product guidance.

## Schema Guidance

Add `VideoObject` schema only on the page where the video is visibly embedded.

Minimum fields:

- `@type`: `VideoObject`
- `name`: `Golden Collections Deity Jewellery Store Guide`
- `description`: match the visible caption/description
- `thumbnailUrl`: final uploaded poster URL
- `uploadDate`: actual website/YouTube publish date, not the filming date unless confirmed
- `duration`: `PT1M25S`
- `contentUrl`: final Shopify-hosted MP4 URL if self-hosted
- `embedUrl`: final YouTube embed URL if YouTube-hosted
- `publisher`: Golden Collections organization entity
- `transcript`: include only after captions/transcript are owner-reviewed

Do not add `VideoObject` schema for link-only cards. Do not duplicate the same `VideoObject` across many collection pages unless the video is actually embedded there and the page context justifies it.

## What Not To Create

- No standalone page only for `IMG_3289`.
- No one-page-per-short video library.
- No full 9:52 website embed.
- No homepage hero takeover.
- No repeated full video embeds across every deity collection.
- No schema for pages that only link to the video.
- No product, price, material, guarantee, temple-approval, or availability claims pulled from the audio without owner confirmation.
- No AI-only hidden transcript page or separate answer-engine page.

## Implementation Readiness

Ready for implementation after:

1. Owner approves the 85-second website cut and poster.
2. Captions/transcript are created and checked against the audio.
3. Final hosted MP4/poster URLs are available.
4. The target page section copy and schema use the same title, description, duration, and accessibility text.

No Shopify theme files were edited for this plan.
