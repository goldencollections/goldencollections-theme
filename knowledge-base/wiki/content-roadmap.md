# Content And GEO Roadmap

Backlinks: [[business-entity.md]], [[search-entity-map.md]], [[open-questions.md]], [[deity-compatibility-model.md]]

## Immediate Technical Fixes

- Entity cleanup status on 2026-05-16: closed for public storefront and AI-facing files. Final strict spot-check of Home, About, Glossary, Knowledge Hub, Anil Tunk, `llms.txt`, `llms-full.txt`, and `agents.md` found no public old Gmail, Ashok/Lakshman founder conflict, `Golden Collections founded/established/started in 1961`, or stale glossary "crafting since 1961" sentence. Remaining admin caveat: Shopify Admin API still reports `shop.email` as `goldencollections9@gmail.com`; this is documented in [[business-entity.md]] as non-public unless changed manually in Shopify Admin.
- Social Content Studio status on 2026-05-22: raw content should enter through the Social Command Center as an intake card before it becomes a publishable post package. The default flow is raw material -> Codex/Hermes review and cut plan -> owner/Hermes-mobile approval -> board-controlled publishing. Hermes may recommend and prepare drafts, but must not publish, schedule, boost, or alter website content without owner approval and live gates.
- Keep all Organization/LocalBusiness schema aligned to Golden Collections, not old brand data.
- Remove public legacy-origin, unsupported certificate, and incorrect plating claims that conflict with owner-confirmed facts.
- Audit old-brand references and decide whether each page should be removed, redirected, or rewritten for Golden Collections.
- Make schema claims match public page content exactly.
- Add or improve `FAQPage` schema only where the same FAQ is visible on the page.
- Build internal links from glossary terms to collection/product pages and from collection pages back to glossary definitions.
- Build deity compatibility fields around deity, idol size, and ornament/accessory type.

## High-Impact Pages

1. `Real Kemp Jewellery: Meaning, Materials, Uses, and Buying Guide`
2. `Complete Bharatanatyam Jewellery Set: 12-15 Ornaments Explained`
3. `Bharatanatyam Jewellery Size Guide for Kids, Teens, and Adults`
4. `Deity Jewellery Size Guide by Idol Height`
5. `Varalakshmi Vratham Alankaram Checklist`
6. `Kemp Black Jewellery for Bharatanatyam and Kuchipudi`
7. `Temple Jewellery Glossary: Nethi Chutti, Mattal, Oddiyanam, Vanki, Rakodi`
8. `Real Kemp Jewellery vs Regular Bharatanatyam Jewellery`
9. `Deity Jewellery Regional Names and Compatibility Guide`

### Bharatanatyam Authority Sprint Status

Status on 2026-05-20: full ecosystem audit completed. Authoritative audit report: `knowledge-base/outputs/bharatanatyam-ecosystem-audit-2026-05-20.md`.

Key findings:

- Bharatanatyam/Kuchipudi is a strong raw category: 49 matched collections, 793 mapped products, 767 active products, and zero active no-image products in the refined audit.
- The main weakness is not lack of inventory or lack of content. It is category-level decision architecture: buyers, Google, and UCP agents need clearer separation between complete sets, individual components, kids sets, regular range, real kemp, black kemp, and arangetram/performance intent.
- Search Console shows the homepage winning too much of the main Bharatanatyam demand. `/collections/bharatanatyam-jewellery` and `/collections/bharatanatyam-jewellery-sets` should be strengthened as the canonical buyer paths for `bharatanatyam jewellery` and `bharatanatyam jewellery set`.
- UCP baseline is promising but not finished. Waist belt/vaddanam and ghungroo/salangai are clean; broad `Bharatanatyam jewellery set` and `black kemp Bharatanatyam jewellery` still leak adjacent component results.
- Real kemp content is ahead of the rest. The still-missing guide priorities are the complete Bharatanatyam set component guide, kids/teens/adults size guide, and black kemp buying guide.

Recommended next goal: complete the Bharatanatyam authority sprint by hardening top products, Merchant fields, product roles, collection/internal-link paths, UCP prompt stability, and the missing buyer-decision guides without creating unsupported AI slop.

Owner confirmation on 2026-05-24:

- Regular Bharatanatyam/Kuchipudi public copy should say `gold plated`; do not publish a regular-range plating thickness.
- Kids dance jewellery means girls around 5-9 years. Adult/standard means 10 years and above.
- Kids and adult/standard dance sets use the same component types, but kids sets are scaled down and adult/standard sets are scaled up.
- Size messaging for dance sets should focus on choosing kids vs standard/adult; do not create separate teen/adult size claims without product-specific confirmed data.

### Dance Community Proof Assets

Status on 2026-05-22: first BITS Pilani Hyderabad / Aakara sponsorship proof package recorded. Source plan: `knowledge-base/outputs/bits-pilani-pearl26-aakara-sponsorship-use-plan-2026-05-21.md`. Follow-up source note: `knowledge-base/raw/bits-pilani-pearl26-aakara-instagram-followup-2026-05-22.md`.

Verified from MoU: Golden Collections / Anil Tunk was Party 2 for an association with Student Union, BITS Pilani Hyderabad at Pearl '26. Deliverables included playing Golden Collections advertisements during Aakara finals/inaugural performances, displaying a banner during Aakara rounds, adding the Golden Collections logo to participant certificates, Pearl/Swaranjali Instagram posting, and Golden Collections providing gift items worth Rs. 20,000 for Aakara winners.

Owner-provided external link: `https://www.instagram.com/reel/DU5ds_CjWAH/?igsh=NGtncTk4OTV6aHAw`. Separate thank-you post is not confirmed. Award-distribution photo with Anil Tunk is expected later, but no public placeholder should be created before the actual photo is available and reviewed.

Long-term placement rule: do not create a new page for every event, reel, sponsorship, or proof asset. Use a proof library model. Substantial assets with real evidence and buyer relevance can become one factual case-study article. Smaller assets should become proof cards or sections on existing Bharatanatyam/Kuchipudi collections, Anil Tunk authority, relevant guides, or a central proof hub. Never imply BITS endorsement, official supplier status, or certification unless separately confirmed in writing.

### Real Kemp Pillar Status

Status on 2026-05-16: published at `/blogs/jewellery-guides/real-kemp-jewellery-guide` and owner confirmations are complete.

Owner confirmed:

- Real kemp pieces feel noticeably heavier in hand than similar-size regular alloy-metal dance jewellery pieces.
- Golden Collections' regular range should be called `regular Bharatanatyam/Kuchipudi jewellery`, not `imitation kemp`.
- Black kemp may be mentioned once as a related range with a link to `/collections/kemp-black-jewellery`.
- Keep the conservative heritage/history approach for this page.

Implementation note: Shopify Admin body was updated on 2026-05-16 to make the weight claim more precise and hands-on: "In Anil Tunk's hands-on experience..." Immediate storefront fetches still showed Shopify's cached older sentence, so the exact replacement was also added to the article rendering path as a safe exact-string fallback.

Activation note on 2026-05-16: `/collections/kemp-jewellery` was updated in Shopify Admin with two collection-description links: one to `/blogs/jewellery-guides/real-kemp-jewellery-guide` and one to `/blogs/jewellery-guides/real-kemp-jewellery-for-arangetram`. Live storefront verification returned 200, both links present, and no Liquid error.

Search Console status checked on 2026-05-16:

- `/blogs/jewellery-guides/real-kemp-jewellery-guide`: Submitted and indexed.
- `/blogs/jewellery-guides/real-kemp-jewellery-for-arangetram`: Submitted and indexed.
- `/blogs/jewellery-guides/hanuman-jayanti-alankaram-sri-vijaya-vinayaka-swamy-temple-malkajgiri-2026`: Submitted and indexed.
- `/pages/temple-alankaram-proof`: Submitted and indexed.
- `/blogs/jewellery-guides/varalakshmi-alankaram-checklist-2026`: Submitted and indexed; last crawl reported by URL Inspection API on 2026-05-14.
- `/collections/kemp-jewellery`: Submitted and indexed; last crawl reported by URL Inspection API on 2026-05-16 before the collection-description link update.

Indexing API submission still returns `ACCESS_TOKEN_SCOPE_INSUFFICIENT`, but URL Inspection confirms these four authority URLs are indexed.

### Regular Dance Range Terminology Cleanup

Status on 2026-05-16: completed for the broad live product-description issue.

- Product claim audit found 135 Shopify product descriptions using the repeated sentence "this piece is from the regular imitation kemp dance range."
- Owner-confirmed terminology is `regular Bharatanatyam/Kuchipudi jewellery`, not `imitation kemp`.
- Bulk rewrite applied to all 135 products.
- Verification query for the old sentence returned 0 products.
- Local generator scripts were updated so future product-copy runs use `regular Bharatanatyam/Kuchipudi dance jewellery range` and `Kemp-style stone work` instead of the disallowed wording.

### Proof Block Placement

Status on 2026-05-16: first safe text-only proof placements were added and uploaded to the live theme.

Published placements use only the approved factual wording: Golden Collections deity jewellery was used for Hanuman Jayanti alankaram at Sri Vijaya Vinayaka Swamy Temple, Malkajgiri, coordinated with Ayyagaru Ram Sharma.

Updated surfaces:

- Anil Tunk page: added a guide-grid card linking to the Hanuman proof story.
- Fit-process page: added a real fit example block for Hanuman Jayanti temple alankaram.
- Measurement guide: added a real-example card explaining what measurements/photos the proof story demonstrates.
- Deity crown guide: added a crown-fit lesson tied to the Hanuman proof story.
- Knowledge Hub: added Real Alankaram Proof Stories as an authority path.
- Homepage proof section and proof hub copy were broadened from temple-only wording toward alankaram proof stories, so future Varalakshmi/home/festival examples can fit without forcing non-temple wording.

Note: immediate full-page storefront fetches showed Shopify cache lag on some homepage/proof-section copy, but Shopify section rendering returned the updated proof section copy.

### Anil Half Crown Fit Video

Status on 2026-05-20: first Anil Tunk practical fit video prepared for website and social reuse.

- Video topic: Anil demonstrates how to compare deity face/crown-area width with a half crown, while keeping eyes, tilak and facial details visible.
- Use this as buyer fit guidance, not as a guaranteed fit promise.
- Primary website placements should stay on existing authority/buyer-help pages: `/pages/how-to-measure-idol-for-deity-jewellery`, `/pages/how-golden-collections-checks-deity-jewellery-fit`, `/pages/anil-tunk`, and `/pages/deity-crown-mukut-kireedam-size-guide`.
- Do not create a new page for every short proof video. Add new videos to the relevant guide/fit/proof hub first, then link from related collections only where the video helps the buyer choose.
- Social pack prepared at `knowledge-base/outputs/deity-half-crown-fit-video-social-pack-2026-05-20.md`.
- Website implementation uses reusable section `sections/gc-anil-fit-video.liquid` with MP4 embed and `VideoObject` schema.

### Anil Full Crown Fit Video

Status on 2026-05-21: Anil Tunk full crown fit video prepared, captioned and uploaded to Shopify Files.

- Video topic: Anil demonstrates full crown fit by measuring idol head width, checking hair/bun shape, crown opening, crown depth/height and final face visibility after placement.
- Shopify video URL: `https://cdn.shopify.com/videos/c/vp/843da248524b4a018ea6e2565590d188/843da248524b4a018ea6e2565590d188.SD-480p-0.9Mbps-84624555.mp4`.
- Shopify poster URL: `https://cdn.shopify.com/s/files/1/0764/9224/3242/files/preview_images/843da248524b4a018ea6e2565590d188.thumbnail.0000000000.jpg?v=1779361157`.
- Use this as buyer fit guidance, not as a guaranteed fit promise.
- Primary website placements should stay on existing authority/buyer-help pages: `/pages/deity-crown-mukut-kireedam-size-guide`, `/pages/how-golden-collections-checks-deity-jewellery-fit`, and `/pages/anil-tunk`.
- Do not create a new page for this video alone. Add it to the relevant crown/fit guidance path and link from related crown collections only where it helps the buyer choose.
- Social pack prepared at `knowledge-base/outputs/deity-full-crown-fit-video-social-pack-2026-05-21.md`.

### Homepage Video Banner Fix

Status on 2026-05-16: fixed in live theme asset.

- Root cause: homepage `video-banner` section had `video_url_1` but no poster image, while `sections/video-banner.liquid` called `image_url` on blank poster settings inside JavaScript.
- Fix: guard poster URL generation for `poster_image_1`, `poster_image_2`, and `poster_image_3`; JSON-escape video URLs and poster URLs.
- Live theme asset `sections/video-banner.liquid` was uploaded and section rendering verified clean with no Liquid error.
- Note: full homepage HTML may show old cached output briefly, but the live section endpoint and theme asset are clean.

### Varalakshmi Proof Outreach

Status on 2026-05-16: outreach package and candidate tracker prepared; no external messages sent automatically.

- Created proof pipeline package: `knowledge-base/outputs/varalakshmi-proof-pipeline-2026-05-16.md`.
- Created outreach usage note: `knowledge-base/outputs/varalakshmi-proof-outreach-usage-2026-05-16.md`.
- Created tracker: `knowledge-base/outputs/varalakshmi-proof-outreach-tracker-2026-05-16.csv`.
- Read-only Shopify order scan identified four review-before-messaging candidates and saved the source scan to `tmp/varalakshmi-proof-outreach-2026-05-16/order-candidate-scan.json`.
- Do not message candidates automatically. Use only opted-in or existing relationship channels, capture written permission, and confirm exact approved name/location wording before any public use.

### Varalakshmi Alankaram Examples Page

Status on 2026-05-16: built and published.

Permission note: owner confirmed permissions are clean for the discussed Varalakshmi video set. Record: `knowledge-base/raw/varalakshmi-video-permissions-2026-05-16.md`.

Build as an evergreen static page, not a dated blog post:

- Published URL: `/pages/varalakshmi-alankaram-examples`
- Page framing: `Varalakshmi Alankaram Examples and Jewellery Fit Notes`
- Primary videos: `uYTUVqBA1BU`, `lMeVQIR6Hjw`, `6CyaMiZmGXs`
- Use `VideoObject` schema for each embedded YouTube video.
- Make the page substance practical fit observations, not just embedded videos: crown height, face visibility, haram length, stone visibility, saree drape, layering, and home-pooja/display suitability.
- Use honest wording such as "previous Golden Collections Varalakshmi alankaram examples shared with permission."
- Do not call this page a temple proof story, and do not imply endorsement, priest approval, or a 2026 event date for older videos.

Implementation notes:

- Live page uses three embedded YouTube videos and visible fit notes for crown scale, face visibility, haram length, stone visibility, saree drape, layering, and home-pooja/display suitability.
- Added page-specific Open Graph and Twitter image override using `https://img.youtube.com/vi/uYTUVqBA1BU/maxresdefault.jpg` so WhatsApp/social sharing uses a Varalakshmi visual instead of the store logo.
- Added visible seven-question FAQ and matching `FAQPage` schema. Note: Google FAQ rich results are deprecated/limited, but visible Q&A remains useful for buyers and AI answer extraction.
- Added internal links from Knowledge Hub, Anil Tunk page, Lakshmi/Varalakshmi compatibility page, fit-process page, Varalakshmi checklist guide, proof/examples hub, and the Varalakshmi collection hero.
- `/collections/varalakshmi-deity-jewellery` was updated with a visible dark CTA linking to the examples page because the collection's existing SEO description is not rendered as a visible link by the deity-first collection template.
- Storefront validation passed: page returns content, no Liquid error, all three video IDs are present, and `VideoObject` schema is present.
- Search Console URL Inspection on 2026-05-16 after FAQ/OG update initially reported the new page as `URL is unknown to Google`; owner later requested indexing manually. Recheck on 2026-05-16 returned `Submitted and indexed`, `INDEXING_ALLOWED`, fetch successful, with last crawl `2026-05-16T16:23:07Z`. Collection is also `Submitted and indexed`.
- Attempted YouTube metadata update for `6CyaMiZmGXs`, but the current token lacks the required YouTube update scope. Update the hashtag-only title manually in YouTube Studio or re-authorize with a broader YouTube scope before treating the YouTube-side metadata task as closed.

### Anil Tunk LinkedIn Entity Profile

Status on 2026-05-16: live profile updated at `https://www.linkedin.com/in/anil-tunk-35764388/`.

Completed:

- Public headline updated to `Founder at Golden Collections | Deity Jewellery, Alankaram and Bharatanatyam Jewellery Guidance`.
- Visible old conflict language removed from the profile top card, including the prior "64-Year Secunderabad Legacy" framing and old founder references.
- First authority post published from Anil's profile introducing Golden Collections, deity jewellery, alankaram guidance, dance jewellery fit, and the Anil Tunk authority page.
- LinkedIn URL added to the Golden Collections entity records and Anil Tunk authority page/schema as a maintained external profile.
- 2026-05-16 verification: public profile photo, Golden Collections banner, headline, website link, About card, Activity/posts and Founder experience are visible. The global Organization schema `sameAs` LinkedIn URL was updated from the stale Golden Collections profile URL to Anil's live LinkedIn profile.

Follow-up:

- Optional cleanup: LinkedIn still shows an older `Managing Partner` experience from 2011 with "64-year-old heritage jewellery house" language. This can remain as family heritage context if Anil wants, but it should not be used on Golden Collections website/schema as the store founding date. Best polish is to shorten that entry so it clearly refers to family heritage, not Golden Collections founding.

Purpose: create a clean external entity-trust profile for Anil Tunk as founder/public leader of Golden Collections. This should support Google/LLM entity consistency, author credibility, future media/partner outreach, and professional trust for temple committees, dance teachers, customers, and collaborators.

Profile package prepared: `knowledge-base/outputs/anil-tunk-linkedin-profile-package-2026-05-16.md`.

Recommended approach:

- Create or update a real LinkedIn profile for Anil Tunk only if Anil approves and controls it.
- Use the same entity facts everywhere: founder/public leader of Golden Collections, established in 2012, Secunderabad/Hyderabad, specialist in deity jewellery, Hindu idol alankaram, Bharatanatyam jewellery, Kuchipudi jewellery, and real kemp temple jewellery.
- Mention family jewellery tradition since 1961 only as heritage context, not as Golden Collections' founding date.
- Link to `/pages/anil-tunk`, `/pages/golden-collections-knowledge-hub`, and the Golden Collections website.
- Do not overclaim credentials, temple endorsement, certifications, or official supplier status.
- Posting frequency can stay light: proof stories, guide launches, practical fit/process notes, festival preparation reminders, and real customer/temple examples with permission.
- After the live LinkedIn URL exists, add it to the Anil Tunk authority page and Golden Collections entity records.

## Product Page Improvements

Each important product should answer:

- What is this ornament called, including regional names?
- Who is it for: dancer, deity, bride, temple, festival?
- Which set/component does it complete?
- Size, fit, idol height compatibility, or dancer age guidance.
- Material/range: normal premium range or real kemp range.
- For real kemp, use customer-friendly wording: Kemp stones or Kempu stones.
- Care instructions.
- Shipping/returns/customization clarity.

Implementation status on 2026-05-16:

- `product.deity` fit panels now use stronger buyer-facing copy: `Ask Anil on WhatsApp`, direct size guide, fit-process link, crown guide when relevant, and a compact `Suggested for` field using deity/compatibility data.
- `product.deity-lite` pages now show an above-fold size-help block with `Size Help`, `Fit Process`, crown guide when relevant, and `Ask Anil` WhatsApp CTA.
- Validation passed on a live deity earring product: the product page rendered `Deity jewellery size help`, `Ask Anil`, and `Fit Process`.

## Collection Page Improvements

Each collection page should include:

- One clear H1 matching customer language.
- Short buying guide above or below products.
- Visible FAQ section with 4-6 specific questions.
- Internal links to related collections and glossary terms.
- Schema that supports `CollectionPage`, `ItemList`, and visible FAQ where appropriate.

Implementation status on 2026-05-16:

- Deity-first collection pages now include a dark premium `Fit help before ordering` block with `Ask Anil on WhatsApp`, measurement guide, fit-process page, and proof/example links. Varalakshmi-family pages link to the Varalakshmi examples page; other deity pages link to the proof/examples hub.
- Ornament-first deity collections now include a similar `Fit help before ordering` block inside the FAQ/footer section, linking to WhatsApp, the measurement guide, fit process and proof/examples hub.
- Bharatanatyam/real-kemp collection templates now include an `Ask Anil before choosing the final set` block with WhatsApp, real kemp guide, arangetram guide and Anil profile links.
- The live Hanuman/Anjaneya deity collection was visually verified with product grid, fit-help block, regional terms and internal links rendering correctly. Some public storefront fetches can lag on cached ornament/dance collection HTML; Shopify theme asset reads confirmed the updated section code is live.

### Current Deity Collection Template Decision

For existing deity category collections, keep the shopping experience simple and avoid duplicate navigation.

Do:

- Use one deity collection template for the existing deity collections.
- Show breadcrumb, H1, short intro, product count, and trust/fit signals near the top.
- Keep measured-size guidance, quality checked, WhatsApp fit help, and shipping confidence visible.
- Use the existing category node/subcollection circles below the hero for collection-specific navigation.
- Keep product grid, filters, FAQ, and size guide focused on the current collection.

Do not:

- Add a global `Shop this deity by ornament` strip to these current collection pages when subcollection circles already exist below.
- Mix current ornament/category navigation with the future deity-first navigation model.
- Add navigation that makes customers wonder whether they are browsing a deity, an ornament type, or all deity products.

## Deity-Based Collection Architecture

Future navigation should support deity-first shopping, then ornament-type browsing inside each deity.

Example customer path:

1. Shop by Deity.
2. Choose `Amman`.
3. See subcollection circles for `Mukut/Crown`, `Necklace`, `Long Haram`, `Earrings`, `Vaddanam/Waist Belt`, `Nose Ring`, `Hands and Legs`, `Tilak/Bindi`, `Accessories`, and `Full Alankaram`.

This same pattern should later exist for Varalakshmi/Lakshmi/Amman, Balaji/Vishnu/Perumal, Krishna/Radha Krishna, Ganesha, Shiva, Durga/Devi, Murugan/Subramanya, Ayyappa, and Hanuman.

Implementation should use Shopify custom data where possible:

- Deity metaobjects define the deity group and aliases.
- Ornament type metaobjects define product families.
- Product metafields connect each product to deity groups and ornament types.
- Collection templates use these fields to show easy subcollection circles and internal links.

This should not replace the current ornament-first collections; it should add a second browsing path for customers who begin with the deity name.

Owner-confirmed refinement: deity-first pages should likely use a separate template from the current deity category template. Products should be selected by deity compatibility fields, and `General/Common` products should also appear where size and placement are suitable.

Implementation status on 2026-05-16:

- `/collections/shop-by-deity` root collection is live with deity cards.
- Pilot deity-first collections are live and populated from product deity compatibility fields without pruning existing collections:
  - `/collections/varalakshmi-lakshmi-amman-deity-jewellery` - 571 products
  - `/collections/lakshmi-amman-deity-jewellery` - 571 products
  - `/collections/balaji-venkateswara-deity-jewellery` - 310 products
  - `/collections/krishna-deity-jewellery` - 122 products
  - `/collections/ganesh-deity-jewellery` - 207 products
  - `/collections/hanuman-anjaneya-deity-jewellery` - 206 products
  - `/collections/shiva-deity-jewellery` - 213 products
  - `/collections/durga-deity-jewellery` - 327 products
- Hanuman/Anjaneya was added to the deity collection config and the Shop by Deity root template.
- `scripts/sync-deity-collections.mjs` now paginates existing collects and throttles/retries Admin API collect additions to avoid Shopify 429 failures during future additive syncs.

## GEO / LLM Answer Strategy

Answer engines need stable facts, repeated consistently. Golden Collections should publish concise source-of-truth pages for:

- About Golden Collections
- Heritage and craftsmanship
- Real kemp explanation
- Deity jewellery size guide
- Bharatanatyam set components
- FAQ
- Glossary

These pages should be written in direct answer style, because ChatGPT, Perplexity, Gemini, and Google AI Overviews often pull concise definitions, lists, comparisons, and FAQs.

### Google AI Search Optimization Checklist

Source: `knowledge-base/outputs/google-ai-search-optimization-todo-2026-05-16.md`

Google's current guidance says generative AI visibility in Google Search is still grounded in normal Search fundamentals: crawlable indexed pages, helpful first-hand content, clear technical structure, product/business data, good page experience, and useful images/video. Do not treat AEO/GEO as a separate hack for Google Search.

Priority Golden Collections tasks:

- Add first-hand proof to the fit-process, Anil Tunk, measurement, crown and deity compatibility pages: Anil measuring idols, real fit examples, customer-permission alankaram examples, and process captions.
- Add video where it helps buying decisions: idol measurement, Varalakshmi crown fit, Balaji namam/shanku chakra/crown fit, Ganesha crown fit, and short haram vs long haram.
- Connect authority guides back into high-intent product and collection pages with visible fit-help blocks and internal links.
- Improve Merchant Center and product data quality: titles, descriptions, product types, availability, price/image consistency, and product structured data where visible.
- Keep `llms.txt` and `agents.md` accurate for non-Google AI systems, but do not overvalue them for Google AI Search because Google says special AI text files are not required.
- Avoid creating thin pages for every keyword variation. Expand existing pages or create new pages only when there is distinct buyer value, fit guidance, media, FAQs, and product links.
- Monitor indexing and Search Console queries for the Knowledge Hub, deity compatibility pages, glossary and fit-process page before deciding the next content expansion.

Next best action: add first-hand visual proof to `/pages/how-golden-collections-checks-deity-jewellery-fit` and `/pages/anil-tunk`, then embed the first measurement video when available.

### Google Search Agents / Universal Cart Update

Source: `knowledge-base/raw/google-search-agents-agentic-commerce-2026-05-20.md`

Google announced Search information agents and Universal Cart at Google I/O 2026. This reinforces the existing roadmap rather than changing it into a bulk-content plan.

Implications for Golden Collections:

- Product and Merchant Center hygiene are now marketing infrastructure. Keep Google-visible titles, prices, availability, image links, product categories, variant data, and custom-product handling clean.
- Collection pages should become agent-readable buyer paths for high-value intents: Bharatanatyam jewellery sets, kids Bharatanatyam jewellery, real kemp, deity crowns, deity necklaces, Varalakshmi alankaram, deity size/fit, and temple-proof examples.
- Content should be written for buyer tasks that an agent might monitor or compare: `find Varalakshmi alankaram items before the festival`, `choose a deity crown for idol height`, `buy a Bharatanatyam jewellery set for arangetram`, `compare real kemp and regular dance jewellery`, and `find fast India delivery for dance jewellery`.
- Social and video repurposing should use consistent entity/product terms and links, because Google's Search agents explicitly monitor blogs, news sites, and social posts.
- Do not create thin alert-style pages for every possible agent prompt. Expand or create pages only when Golden Collections can provide real product data, fit guidance, proof media, FAQs, and useful shopping paths.

Priority action remains first-hand proof plus money-page clarity:

1. Capture and publish deity fit proof with Anil measuring idols and showing ornament placement.
2. Continue hardening Bharatanatyam collection/product paths so Google and agents route dance-jewellery demand to the right pages instead of overusing the homepage.
3. Keep Varalakshmi pages, examples, products, and Merchant data fresh during the May-August seasonal window.

### Dance Community Proof Asset: Aakara at Pearl 26

Source files:

- Strategy note: `knowledge-base/outputs/bits-pilani-pearl26-aakara-sponsorship-use-plan-2026-05-21.md`
- Media package: `knowledge-base/outputs/bits-pilani-pearl26-aakara-sponsorship-media-assets-2026-05-22.md`
- Owner-supplied Instagram link note: `knowledge-base/raw/bits-pilani-pearl26-aakara-instagram-followup-2026-05-22.md`

Implementation status on 2026-05-22:

- Published article: `/blogs/jewellery-guides/golden-collections-sponsors-aakara-pearl-26-bits-pilani-hyderabad`
- Article topic: Golden Collections sponsored Aakara at Pearl 26, BITS Pilani Hyderabad Campus, with Bharatanatyam/Kuchipudi jewellery sponsor media shown during Aakara programming and gift items provided for Aakara winners.
- The existing dance collection hub now links to this proof story from relevant dance collection experiences.
- The article's middle sections were tightened on 2026-05-22 so the copy stays event-specific and connects the auditorium proof to stage-fit buyer guidance without unsupported event details.
- Do not create extra public placeholders for the pending award-distribution photo with Anil Tunk. Review and add it later only when the real asset is available.

Safe wording:

`Golden Collections sponsored Aakara at Pearl 26, BITS Pilani Hyderabad Campus, with Bharatanatyam and Kuchipudi jewellery sponsor media shown during Aakara programming and gift items provided for the winners.`

Do not use endorsement or supplier-status claims. This is factual dance-community sponsorship proof, not an institutional endorsement claim.

Long-term placement rule:

- Substantial proof assets can become one blog/case-study article when there is real evidence, buyer relevance, and permission-safe media.
- Smaller proof assets should become cards or references inside existing collection pages, Anil authority pages, social posts, and proof hubs.
- Avoid creating thin event pages for every photo, reel, certificate, or short video.

### Temple Proof Asset: Hanuman Jayanti 2026

Owner-confirmed permission exists for the Sri Vijaya Vinayaka Swamy Temple Hanuman Jayanti 2026 alankaram assets. Use this as the first major temple proof case study.

Source files:

- Permission note: `knowledge-base/raw/temple-hanuman-jayanti-alankaram-permission-2026-05-16.md`
- Blog package: `blog-system/outputs/shopify-ready/2026-05-16-hanuman-jayanti-alankaram-sri-vijaya-vinayaka-swamy-temple-shopify-package.md`
- Repurpose package: `blog-system/outputs/repurpose/2026-05-16-hanuman-jayanti-alankaram-sri-vijaya-vinayaka-swamy-temple-repurpose.md`

Safe required wording:

"Golden Collections deity jewellery was used for Hanuman Jayanti alankaram at Sri Vijaya Vinayaka Swamy Temple, Malkajgiri, coordinated with Ayyagaru Ram Sharma."

Do not use endorsement language such as official supplier, temple-approved, endorsed, certified, preferred supplier, or priest-approved unless separately confirmed in writing.

Implementation status on 2026-05-16:

- The Hanuman Jayanti case study is published at `/blogs/jewellery-guides/hanuman-jayanti-alankaram-sri-vijaya-vinayaka-swamy-temple-malkajgiri-2026`.
- The article is tagged `temple alankaram proof` so it can feed proof-story surfaces.
- A proof hub page exists at `/pages/temple-alankaram-proof`.
- The homepage has a `gc-proof-stories-hub` section that displays future articles carrying the `temple alankaram proof` tag.
- Main menu visibility: `Blogs > Temple Alankaram Proof`.
- Post-publish technical fixes completed: article video has poster image, article SEO title includes Malkajgiri/Secunderabad, article outputs `VideoObject` schema, and proof hub Open Graph image uses the Hanuman alankaram photo instead of the logo.
- 2026-05-16: Additional temple-permission photos were added to the Hanuman Jayanti case study with SEO-safe filenames and descriptive alt text; the page now includes a stronger floral final alankaram image, a full-body jewellery fit view, and a crown/kavacham detail image.
- Search Console API inspection on 2026-05-16 reported both the article and proof hub as `URL is unknown to Google`. API-based indexing submission was blocked by insufficient OAuth scope. Owner confirmed manual Search Console request indexing was completed for both URLs:
  - `/blogs/jewellery-guides/hanuman-jayanti-alankaram-sri-vijaya-vinayaka-swamy-temple-malkajgiri-2026`
  - `/pages/temple-alankaram-proof`

## Deity Compatibility Model

Each deity collection/page should classify products as:

- Deity-specific.
- Multi-deity compatible.
- Common/general alankaram accessory.

This should be paired with regional names so a customer searching for mukut, kireedam, vaddanam, oddiyanam, namam, thiruman, or tilak can land on the correct product family.

## Knowledge Base Maintenance

Weekly:

- Add new raw source notes for new products, collections, competitor observations, and customer questions.
- Update one wiki article when a fact changes.
- Add backlinks between related terms.

Monthly:

- Run a brand/entity consistency audit.
- Run a stale-content audit for festival years.
- Review Search Console queries and convert recurring searches into FAQ/glossary entries.

Quarterly:

- Refresh size guides, real kemp proof points, and best-selling product clusters.
- Re-check schema with Google Rich Results Test and Schema.org validator.
