# Real Store Product Explanation Video Placement Brief

Date: 2026-05-20

Source video: `G:\My Drive\GC Promotion video\IMG_3289.MOV`

Source status: local file exists. Parent context says the asset is a 9:52 vertical 4K iPhone store video with a presenter explaining products while deity jewellery, crown, and ornament shelves are visible.

## Recommendation

Use this as a trust and product-education asset across existing authority, fit-help, and collection surfaces. Do not create a new standalone page just for this video.

The website should use a 45-90 second edited cut as the primary embed. The full 9:52 version can be uploaded to YouTube after owner approval and embedded only on one or two deep authority surfaces where a long watch makes sense.

## Best Website Placements

### Primary placements

1. `/pages/anil-tunk`
   - Use the 45-90 second cut as a founder/store expertise proof block.
   - Position it as Anil or Golden Collections explaining deity jewellery categories and fit-aware buying, not as a sales ad.
   - Link onward to measurement, fit-process, deity crown guide, and proof hub.

2. `/pages/how-golden-collections-checks-deity-jewellery-fit`
   - Use the 45-90 second cut if the spoken content includes practical guidance on choosing products, comparing sizes, or asking for photos/measurements.
   - This is the strongest existing page for first-hand explanation because it already supports the "fit guidance before ordering" story.

3. `/pages/deity-jewellery-alankaram-guide`
   - Use the short cut as a category overview if the footage covers multiple deity ornament families such as crowns, necklaces, earrings, vaddanam, accessories, Varalakshmi items, or alankaram setup pieces.
   - Add a short visible caption explaining that the video shows Golden Collections' in-store deity jewellery range and practical selection guidance.

4. `/pages/golden-collections-knowledge-hub`
   - Add a compact card or media row linking to the video-bearing page, not necessarily a second full embed.
   - Keep the hub as a routing surface so it does not become a heavy video gallery.

### Collection surfaces

Use the short cut or a poster/link on high-intent collection pages where the video helps shoppers understand the product family:

- `/collections/shop-by-deity`
- `/collections/deity-crowns-1` or the active deity crown collection path used by the storefront
- `/collections/deity-necklace`
- `/collections/deity-short-harams`
- `/collections/deity-long-harams`
- `/collections/deity-accessories-nose-rings-mustache-weapons-taira`
- `/collections/varalakshmi-deity-jewellery`
- `/collections/varalakshmi-lakshmi-amman-deity-jewellery`

Collection usage should be light: one compact "Need help choosing?" video/help block near fit help or below the collection intro. Avoid embedding the long YouTube video directly in collection grids because it can slow the shopping path and distract from products.

### Lower-priority placements

- Homepage: use only a lightweight poster/link or 15-30 second teaser if the homepage proof section is broadened from temple-only proof to general alankaram/product guidance. Do not make the full long video a homepage hero.
- `/pages/temple-alankaram-proof`: use only if the visible copy is broadened to "alankaram proof stories" or "store guidance and proof." Do not force a general store video into temple-proof wording.

## Short Cut vs Long YouTube Embed

### Use a 45-90 second cut for the website

Best purpose:

- Store credibility.
- Product category overview.
- "Ask before ordering" fit-help behavior.
- Reusable proof on Anil, fit-process, deity guide, and collection pages.

Suggested edit:

- 9:16 vertical.
- 45-90 seconds.
- Captioned.
- Start with the presenter and product shelves visible in the first 2-3 seconds.
- Keep only the clearest product explanation moments.
- Add a simple end card or caption: "For deity jewellery fit help, send deity photo, product link, and measurements to Golden Collections."

### Use the full 9:52 YouTube embed sparingly

Best purpose:

- Long-form trust asset.
- YouTube search and social proof.
- Optional deeper watch for buyers who want to understand the store/product range.

Recommended embed locations after owner approval:

- `/pages/anil-tunk`, below the short cut or in a "Watch the full store explanation" section.
- `/pages/how-golden-collections-checks-deity-jewellery-fit`, only if the full video contains enough real selection guidance.

Do not embed the full long video on every collection page. Use collection links to the main authority page instead.

## Schema Guidance

Add `VideoObject` schema only on pages where the video is visibly embedded.

Minimum fields:

- `@type`: `VideoObject`
- `name`: concise, product-specific title.
- `description`: match the visible page caption.
- `thumbnailUrl`: final poster image URL.
- `uploadDate`: actual published/uploaded date, not the filming date unless confirmed.
- `duration`: exact duration of the edited cut or YouTube video.
- `contentUrl`: direct MP4 URL for self-hosted Shopify video, if used.
- `embedUrl`: YouTube embed URL, if YouTube is used.
- `publisher`: Golden Collections organization entity.

Do not add video schema for a link-only card. Do not duplicate multiple `VideoObject` blocks for the same video across many collection pages unless the video is actually embedded there and the page context justifies it.

## File Naming Guidance

Use descriptive, date-stamped filenames:

- Short website cut: `golden-collections-deity-jewellery-store-explanation-anil-tunk-2026-05-20.mp4`
- Poster: `golden-collections-deity-jewellery-store-explanation-poster-2026-05-20.jpg`
- YouTube upload/source export: `golden-collections-deity-jewellery-store-and-product-guide-full-2026-05-20.mp4`
- Captions/transcript: `golden-collections-deity-jewellery-store-explanation-transcript-2026-05-20.vtt`

If the presenter is not Anil, remove `anil-tunk` from the filename and metadata.

## Alt Text And Accessibility

Poster alt text:

`Presenter inside Golden Collections explaining deity jewellery products with crowns and alankaram ornaments displayed on store shelves.`

Accessible label:

`Video explaining Golden Collections deity jewellery product categories and how customers can ask for fit guidance before ordering.`

Create captions before publishing. If captions are not ready, do not treat the website video implementation as complete.

## Risks And Guardrails

- Performance: the 9:52 vertical 4K source is too heavy for direct website embedding. Export a compressed web cut and lazy-load embeds.
- Page sprawl: do not create one page per video. Use existing authority pages, fit guides, proof hubs, and high-intent collections.
- Claim risk: review spoken audio before publishing. Remove or caption around unsupported claims about material, plating, certificates, universal fit, official temple approval, or guaranteed results.
- Fit risk: frame the video as guidance, not a promise that any product will fit every idol.
- Privacy risk: check whether customers, phone screens, order details, private photos, or third-party identities appear in the footage.
- Religious/endorsement risk: avoid wording like temple-approved, priest-approved, certified, official supplier, or ritual authority unless separately confirmed in writing.
- Inventory risk: if specific products are shown, avoid dated price/availability claims in permanent page copy.
- Schema risk: only use `VideoObject` where the video is visible, and keep schema text aligned with visible captions.
- Mobile UX risk: vertical video fits mobile well but can dominate desktop pages. Use a constrained media block, not a full-page takeover.

## Decision

Proceed with one strong short website cut first, then optionally publish the full version on YouTube after owner approval. The video should strengthen existing buyer-help and authority paths, especially Anil, deity fit process, deity guide, and selected deity collection fit-help blocks, without expanding the site into endless thin video pages.
