# Search Console And Merchant Priority Action Plan - 2026-05-16

Source workflow pages:

- `knowledge-base/wiki/search-console-workflow.md`
- `knowledge-base/wiki/merchant-center-workflow.md`
- `knowledge-base/wiki/content-roadmap.md`
- `knowledge-base/wiki/collection-optimization-playbook.md`
- `knowledge-base/wiki/business-entity.md`
- `knowledge-base/wiki/open-questions.md`

Source data:

- `tmp/search-console-page2-goldmine.json`
- `tmp/merchant-product-issues.csv`
- `tmp/merchant-current-blocker-audit.json`
- `knowledge-base/outputs/merchant-center-diagnostics-2026-05-14.md`

## Guardrails

- This is an execution plan, not a new source of truth. Stable facts stay in the wiki.
- Do not create duplicate pages for every query variation.
- Do not add query terms to pages where the intent does not belong.
- Do not contradict owner-confirmed facts: Golden Collections started in 2012, Anil Tunk is founder/public leader, the public email is `support@goldencollections.com`, certificate claims are not supported, and family heritage since 1961 is heritage context only.
- Keep uncertain product facts out of public copy until owner confirms them, especially regular dance jewellery plating thickness and kids/teen/adult size rules.

## Executive Summary

The Search Console export covers `906` query-page opportunities from `2026-02-10` to `2026-05-11`, across `234` normalized pages, with `93,036` impressions and `476` clicks.

The biggest immediate SEO opportunity is not more new content. It is routing existing demand into the right money pages, improving the pages already near positions `8-15`, and cleaning feed blockers that limit product visibility.

The first execution wave should combine:

1. Search Console near-page-2 collection/product improvements from the position `8-25` export.
2. Merchant Center blocker cleanup.
3. First-hand proof additions to authority pages after page targeting is clean.

## Wave 1: Search Console Money Pages

### 1. Homepage / root URL

Current signal:

- Normalized page: `https://www.goldencollections.com/`
- Position `8-25` rows: `171`
- Impressions: `17,139`
- Clicks: `184`
- CTR: `1.07%`
- Average position: `10.25`
- Top query themes: `bharatanatyam jewellery`, `bharatanatyam jewellery set`, `bharatanatyam jewellery sets wholesale`, `dance jewellery`, `bharatanatyam ornaments`, `bharatanatyam makeup kit`, plus some deity/kemp spillover.

Decision:

- Do not turn the homepage into a duplicate Bharatanatyam collection page.
- Use the homepage as a routing and entity hub.

Actions:

- Strengthen visible links from the homepage to the correct canonical shopping paths:
  - `/collections/bharatanatyam-jewellery`
  - `/collections/bharatanatyam-jewellery-sets`
  - `/collections/deity-god-jewellery` or the current deity root path
  - `/collections/kemp-jewellery`
  - `/pages/golden-collections-knowledge-hub`
- Ensure homepage title/meta can carry the broad entity offer without stuffing exact query variants.
- Confirm the non-www root signals consolidate to `www` through canonical/redirect behavior before making any separate non-www decisions.

### 2. Bharatanatyam jewellery sets collection

Current signal:

- Page: `https://www.goldencollections.com/collections/bharatanatyam-jewellery-sets`
- Impressions: `2,442`
- Clicks: `23`
- CTR: `0.94%`
- Average position: `9.96`
- Top query themes: `zara bharatanatyam jewellery`, `bharatanatyam dress and jewellery`, `dance ornaments`, `bharatanatyam costume and jewellery`, `araku set`, `araku jewellery`.

Decision:

- This is a valid Wave 1 collection target.
- Do not add deity-jewellery wording just because a few deity queries spill into this page. Route deity intent to deity pages instead.

Actions:

- Review collection H1, intro, SEO title, SEO description, FAQ, and internal links against the collection optimization playbook.
- Make the collection clearly answer complete set, costume coordination, regular stage use, school programs, dance institute use, arangetram preparation, and product selection.
- Link to the kids collection where relevant, but do not claim separate kids/adult size rules beyond confirmed facts.
- Add glossary/internal links for nethi chutti, mattal, oddiyanam/vaddanam, vanki, rakodi, ghungroo/salangai where visible and natural.

### 3. Kemp jewellery collection

Current signal:

- Page: `https://www.goldencollections.com/collections/kemp-jewellery`
- Impressions: `2,319`
- Clicks: `33`
- CTR: `1.42%`
- Average position: `9.73`
- Top query themes: `kempu jewellery`, `kemp set jewellery`, `kempu jewellery set`, `kemp stone jewellery set`, `kempu stone jewellery`, `kemp set`.

Decision:

- This is a high-confidence Wave 1 target because it aligns with owner-confirmed real kemp facts and existing published guides.

Actions:

- Keep `Kemp stones` / `Kempu stones` customer-facing wording.
- Preserve the distinction between regular Bharatanatyam/Kuchipudi jewellery and premium real kemp; do not use `imitation kemp`.
- Ensure visible links to:
  - `/blogs/jewellery-guides/real-kemp-jewellery-guide`
  - `/blogs/jewellery-guides/real-kemp-jewellery-for-arangetram`
  - `/collections/kemp-black-jewellery` or the current black kemp collection if available.
- Add or strengthen visible FAQ around kemp/kempu naming, set selection, dance use, care, and premium range expectations.

### 4. Deity necklaces: long harams, short necklaces, and parent necklace path

Current signal:

- Long harams page: `https://www.goldencollections.com/collections/deity-long-harams`
  - Impressions: `1,023`
  - CTR: `0.88%`
  - Average position: `10.29`
  - Themes: `god accessories`, `jewellery for durga idol`, `gold temple haram`, `hindu god necklace`, `god jewellery`, `temple jewellery haram`.
- Short necklaces page: `https://www.goldencollections.com/collections/deity-short-harams`
  - Impressions: `684`
  - CTR: `0.88%`
  - Average position: `11.29`
  - Themes: `hindu necklace`, `god jewelry`, `god jewellery design`, `idol jewellery`.

Decision:

- Do not make long harams and short necklaces compete for the same broad `god jewellery` language.
- Use the parent deity necklace path as the broad internal explanation where possible, then keep short/long pages specific to placement and fit.

Actions:

- Confirm whether `/collections/deity-necklace` is the best canonical broad path for `deity necklace / god jewellery necklace` intent.
- Add visible cross-links:
  - parent necklace collection to short and long pages
  - short page to long page
  - both pages to measurement guide and fit-process page
- Clarify fit:
  - short necklaces: neck / upper chest
  - long harams: lower chest / body / dress drape
- Preserve the playbook decision not to use `short haram` as public terminology when `short necklace` is more accurate.

### 5. Deity crowns

Current signal:

- Page: `https://www.goldencollections.com/collections/deity-crowns`
- Impressions: `891`
- Clicks: `6`
- CTR: `0.67%`
- Average position: `9.49`
- Top query themes: `gold crown`, `greedam`, `goddess crown`, `gold mukut design`, `gold crown price`, `murugan kireedam for kids`, `god mukut`.

Decision:

- This is a Wave 1 target, but it needs careful language because generic `gold crown` and `mukut for men` can drift away from deity-idol intent.

Actions:

- Strengthen deity-specific language: crown / mukut / kireedam / kirita for Hindu god and goddess idols.
- Add fit links to the deity crown size guide and idol measurement guide.
- Add visible regional-name support, including `kireedam`, misspelling-aware copy only where natural, and `mukut`.
- Do not imply all crowns fit all idols; use the existing General/Common compatibility and measurement rules.

### 6. Bharatanatyam ghungroo / salangai

Current signal:

- Page: `https://www.goldencollections.com/collections/bharatanatyam-ghungroo`
- Impressions: `1,744`
- Clicks: `8`
- CTR: `0.46%`
- Average position: `9.37`
- Top query themes: `chilanga price`, `belt ghungroo`, `bharatanatyam anklets name`, `chilanka online purchase`, `ghungroo payal for dance`, `bharatanatyam gejje in english`.

Decision:

- This is a good Wave 1 product-family page because regional names are driving impressions.

Actions:

- Add natural regional naming: ghungroo, salangai, chilanka/chilanga, gejje.
- Explain use cases: Bharatanatyam, Kuchipudi, Kathak only if products genuinely fit those dance forms.
- Add product selection guidance around line count, bell count, comfort, school/class/stage use.
- Link to Bharatanatyam jewellery hub and relevant dance accessory pages.

### 7. Kids Bharatanatyam jewellery

Current signal:

- Current ranking page: `https://www.goldencollections.com/products/enchanting-bharatanatyam-jewellery-set-for-kids-little-gopika`
- Impressions: `3,365`
- Clicks: `1`
- CTR: `0.03%`
- Average position: `13.00`
- Top query theme: `kids jewellery set`.

Decision:

- Do not over-optimize one Little Gopika product for all generic kids jewellery intent.
- Treat this as a sign that the kids Bharatanatyam collection path needs stronger targeting and internal links.

Actions:

- Review the existing kids collection handle used by scripts: `bharatnatyam-dance-jewellery-kids-collection`.
- If the collection is live and appropriate, strengthen it as the target for kids dance jewellery set intent.
- Link the Little Gopika product back to that collection and to a kids Bharatanatyam fit/buying guide area.
- Do not publish separate kids/teen/adult sizing claims until the open question is answered.

## Watchlist: High-Impression But Not Wave 1

### One gram gold pages

Current signal:

- `gold-plated-necklace-design-1-gram-gold-jewellery-cost-gcn-001`
  - Impressions: `13,178`
  - CTR: `0.02%`
  - Average position: `9.69`
- `one-gram-gold-jewellery-online-shopping-goldencollections-gcn-110`
  - Impressions: `8,240`
  - CTR: `0.01%`
  - Average position: `15.24`

Decision:

- High impressions, but not first-wave because the current Golden Collections priority pillars are Bharatanatyam, real kemp, deity jewellery, and Varalakshmi.
- Do not let generic `gold jewellery online` distract from the specialist positioning unless Shopify data confirms this category is active, profitable, and strategically wanted.

Actions:

- Later audit product availability, category fit, margin, and Merchant status.
- If worth pursuing, build one clean collection/category route rather than optimizing isolated product pages against broad gold-jewellery terms.

## External SEO Guidance Applied

Neil Patel / NP Digital sources checked on 2026-05-16:

- `https://neilpatel.com/blog/how-to-win-in-ai-overviews/`
- `https://neilpatel.com/blog/entity-based-seo/`
- `https://neilpatel.com/blog/answer-engine-optimization/`
- `https://neilpatel.com/blog/seo-for-shopify/`
- `https://x.com/neilpatel` opened, but no usable post text was available in the local environment, so it was not used as evidence.

Actionable takeaways for Golden Collections:

- Build first-hand proof media next: Anil measuring idols, deity ornament fit checks, Varalakshmi crown/haram examples, Balaji/Ganesha/Amman sizing clips, and Bharatanatyam set component demos. This supports AI Overviews, buyer trust, and the wiki's existing proof roadmap better than more thin SEO pages.
- Strengthen entity consistency beyond the site: keep founder, start year, Secunderabad/India context, public email, and specialist categories consistent across LinkedIn, YouTube descriptions, Google Business Profile, supplier/partner mentions, dance-teacher mentions, temple/cultural organization mentions, and relevant directories.
- Add answer-first modules only to existing money/support pages: deity fit process, idol measurement guide, Varalakshmi examples, real kemp guide, Bharatanatyam set guide, and deity compatibility pages. Do not create one page per keyword variation.
- Use search-everywhere distribution for visual proof: YouTube Shorts, Instagram, Pinterest, and product/collection descriptions should reuse the same canonical anchors and language for `Varalakshmi crown size`, `Balaji namam fit`, `Bharatanatyam jewellery set pieces`, `nethi chutti`, `mattal`, `oddiyanam/vaddanam`, and ghungroo regional terms.
- Capture demand that zero-click search may not send to Shopify: WhatsApp fit-help opt-ins, Varalakshmi preparation reminders, dance teacher/institute bulk-order lists, and permissioned post-purchase alankaram proof.
- Keep Merchant/product data cleanup as a business growth lever, not a technical afterthought: product type, deity compatibility, ornament type, regional aliases, size/idol-height fields, availability, image consistency, reviews, and policy-safe descriptions are purchase-decision data.

## Merchant Center Wave 1

Merchant issue CSV confirms the wiki's blocker order. Use Shopify/feed-source cleanup before any Merchant API product writes.

Latest read-only refresh on 2026-05-16:

- Products read: `5,658`
- Product issue rows exported: `14,827`
- Aggregate status rows: `188`
- Account-level issues: `0`
- Current blocker audit files:
  - `tmp/merchant-current-blocker-audit.json`
  - `tmp/merchant-current-blocker-audit.csv`

No Merchant product writes were performed during this refresh.

### Blocker 1: Missing image link

- Issue: `item_missing_required_attribute`
- Severity: `DISAPPROVED`
- Attribute: `image link`
- Current blocker audit rows: `117`
- Current breakdown: `107` draft products without images and `10` stale variant offers.

Action:

- Treat as feed-source cleanup, not bulk image assignment.
- Remove stale/draft/no-image offers from active feed where possible.
- Keep no-image draft products out of Merchant surfaces until real images exist.

### Blocker 2: Landing page unavailable

- Issue: `landing_page_error`
- Severity: `DISAPPROVED`
- Attribute: `link`
- Current blocker audit rows: `27`
- Current breakdown: `27` draft products still in the feed.

Action:

- Remove stale/non-live offers from feed source.
- Do not rewrite live pages for offers whose landing pages are unavailable because the products are draft or stale.

### Blocker 3: Price and availability sync

- `price_updated`: `299` unique offers in the current Merchant issue grouping.
- `availability_updated`: `75` unique offers in the current Merchant issue grouping.
- Hard `price_mismatch`: `2` current offers; the audit classifies these as Merchant price matching current Shopify or requiring currency/feed-source review rather than a safe blind local edit.
- Availability audit breakdown: `73` stale variant offers and `2` offers needing availability sync review.

Action:

- Compare feed values against Shopify source values.
- Fix source sync behavior before rewriting product copy.

### Blocker 4: Apparel-style attributes

- Missing/invalid `gender`, `age group`, and `color` appear across many offers.
- This likely comes from Google product category/product type expectations on dance jewellery and accessories.

Action:

- Handle after disapprovals.
- Use accurate values only; do not invent attributes.
- For dance jewellery, age group/gender may be appropriate when product family supports it.
- For deity/pooja products, avoid inappropriate age/gender fields and use religious/ceremonial category logic already recorded in the collection playbook.

## Execution Order

1. Confirm canonical/root behavior for `goldencollections.com` vs `www.goldencollections.com`.
2. Work the first five Search Console targets in this order:
   - homepage routing
   - Bharatanatyam jewellery sets collection
   - kemp jewellery collection
   - deity necklace parent/short/long internal path
   - deity crowns collection
3. In parallel, clean Merchant disapproved stale offers:
   - missing image link
   - landing page unavailable
   - hard price mismatch
4. Then work ghungroo/salangai and kids Bharatanatyam collection.
5. After page targeting is clean, add first-hand proof media to the fit-process and Anil pages.

## Progress Log

- 2026-05-16: Confirmed `https://goldencollections.com/` redirects to `https://www.goldencollections.com/` with Shopify canonical host redirection, and the www homepage returns `200 OK`.
- 2026-05-16: Started homepage routing without adding a duplicate section: added a concise category-path intro to the existing homepage category section, connected the existing hero CTA to `shopify://collections/bharatanatyam-jewellery`, and added a Knowledge Hub link to the existing trust card.
- 2026-05-16: Parsed `templates/index.json` successfully after stripping the Shopify header comment. `shopify theme check --path . --output json` still fails on pre-existing tmp JSON, locale translation, and section schema issues; it did not flag `templates/index.json`.
- 2026-05-16: Removed or softened unsupported homepage claims around sourcing, named payment gateways, and guide adoption by top dancers/temple authorities. Updated the kemp answer-engine wording to compare premium real kemp with regular Bharatanatyam/Kuchipudi jewellery instead of using `imitation kemp` as customer-facing terminology.
- 2026-05-16: Strengthened the Bharatanatyam jewellery sets path by adding a `dance_set`-only "Complete the set" internal-link cluster in `sections/dance-collection-footer-organized.liquid`. All added destination URLs returned `200 OK`, and Theme Check reported no entry for the edited section after switching collection links to `routes.collections_url`.
- 2026-05-16: Tightened real kemp theme wording from `regular dance jewellery` to `regular Bharatanatyam/Kuchipudi jewellery` in the dance hub/footer sections. Live `/collections/kemp-jewellery` already has a correct canonical, no `imitation kemp` text, and visible real-kemp guide links through navigation.
- 2026-05-16: Checked live deity necklace, deity long haram, deity short haram, and deity crowns pages. The target cross-links and guide links already resolve on those pages, so no extra duplicate routing block was added.
- 2026-05-16: Applied live Shopify collection SEO for `bharatanatyam-ghungroo` and `bharatnatyam-dance-jewellery-kids-collection` through `scripts/update-dance-collections-seo.mjs --apply`. The script updated collection copy/metafields only; products, collection rules, inventory, and sales channels were not modified.
- 2026-05-16: Softened kids Bharatanatyam fit wording to rely on product photos, measurements, comfort, costume direction, and teacher requirements instead of unconfirmed kids/adult size rules. Added ghungroo regional terms in local theme/script copy: `salangai`, `chilanka`, `chilanga`, and `gejje`. Cache-busted live fetch now confirms the kids wording no longer exposes `Choose lighter` / `age-appropriate`; ghungroo live HTML still exposes `ghungroo`, `salangai`, and `chilanka`, but not `chilanga` / `gejje` until the relevant theme/copy path is deployed or synced.
- 2026-05-16: Removed duplicate dance collection JSON-LD by keeping the organized footer's `dance-collection-schema-v2` and stopping `main-collection-product-grid` from also emitting the older dance schema. Removed duplicate deity FAQ structured data by keeping FAQ JSON-LD with the visible `ornament-collection-footer` FAQ.
- 2026-05-16: Standardized remaining local `#website` schema references checked in this pass to the canonical `https://www.goldencollections.com/#website`.
- 2026-05-16: Refreshed Merchant diagnostics and generated `tmp/merchant-current-blocker-audit.json` / `.csv`. The audit shows the active blockers require feed-source decisions: draft/no-image products, stale variant offers, draft products still in the feed, and price/availability sync review. Merchant API product writes remain blocked until the active feed source behavior is confirmed.

## Verification Checklist

For each changed page:

- Read Shopify data back.
- Verify rendered storefront text.
- Parse JSON-LD.
- Confirm visible FAQ matches FAQPage schema if present.
- Confirm links point to the intended canonical page.
- Recheck Search Console indexing where needed.
- Log follow-up in the relevant existing wiki or output file instead of creating a duplicate roadmap.
