# Bharatanatyam Ecosystem Audit - SEO, GEO/AEO, UCP And Customer Convenience

Generated: 2026-05-20

## Goal

Audit the full Bharatanatyam/Kuchipudi product and collection ecosystem against Golden Collections' knowledge base, retrieval-ready SEO/GEO/AEO strategy, customer convenience standards, Merchant/feed readiness, and existing blog/content assets. Identify how the category is currently faring, what is strong, what is fundamentally missing, and the next goal worth executing.

## Evidence Used

- Product and collection audit: `tmp/bharatanatyam-ecosystem-audit/bharatanatyam-ecosystem-audit.json`
- Product CSV: `tmp/bharatanatyam-ecosystem-audit/bharatanatyam-products.csv`
- Collection CSV: `tmp/bharatanatyam-ecosystem-audit/bharatanatyam-collections.csv`
- UCP prompt baseline: `tmp/bharatanatyam-ecosystem-audit/bharatanatyam-ucp-baseline-2026-05-20.md`
- UCP script: `scripts/bharatanatyam-ucp-readiness-check.mjs`
- Search Console page-two opportunity pull: `tmp/search-console-page2-goldmine.json`
- Strategy standard: `knowledge-base/wiki/retrieval-ready-seo-strategy.md`
- Business facts: `knowledge-base/wiki/business-entity.md`
- Real kemp terminology: `knowledge-base/wiki/real-kemp-jewellery.md`
- Dance controlled vocabulary: `custom-data/dance-product-controlled-vocabulary.md`
- Dance metafield definitions: `custom-data/dance-product-metafield-definitions.json`
- Content roadmap: `knowledge-base/wiki/content-roadmap.md`
- Published blog packages checked: `blog-system/outputs/shopify-ready/2026-05-13-real-kemp-jewellery-guide-shopify-package.md` and `blog-system/outputs/shopify-ready/2026-05-13-real-kemp-jewellery-arangetram-shopify-package.md`

## Executive View

Bharatanatyam is not a weak category. It is one of the strongest raw assets in the business: 49 matched collection pages, 793 mapped products, 767 active products, zero active no-image products, and a mostly built dance-specific metafield system.

The fundamental missing piece is not "more AI content." The missing piece is category-level decision architecture: buyers, Google, and agents need clearer separation between complete sets, individual components, kids sets, regular range, real kemp, black kemp, and performance-use intent. The product truth exists, but it is not consistently expressed in the fields and pages that retrieval systems and customers use first.

The next goal should not be broad content generation. It should be a Bharatanatyam authority sprint focused on the main shopping paths: complete sets, kids sets, short necklaces, long harams, black kemp, real kemp/arangetram, ghungroo, mattal, and waist belts.

## What Is Strong

### 1. Collection Foundation

The refined audit matched 49 dance ecosystem collections. All matched collections passed the structured collection checks in the local audit:

- Collection intro present.
- Size/fit intro present.
- Regional keyword coverage present.
- FAQ family signal present.

Live checks also returned 200 status, canonical URLs, and good meta titles/descriptions for key pages:

- `/collections/bharatanatyam-jewellery`
- `/collections/bharatanatyam-jewellery-sets`
- `/collections/kemp-jewellery`
- `/collections/kemp-black-jewellery`
- `/collections/bharatanatyam-ghungroo`
- `/collections/mattal-matil-bharatanatyam-dance`

This means the base collection layer is usable. We are not starting from an empty category.

### 2. Product Depth

The Shopify audit found:

| Metric | Count |
| --- | ---: |
| Products matched | 793 |
| Active products | 767 |
| Active products with no images | 0 |
| Active products with full dance core fields | 734 |
| Active products missing dance core fields | 33 |
| Active products with measurement/scale alt wording | 86 |
| Active products with duplicate image alt text | 6 |
| Active products with blank image alt text | 14 |
| Active products with complete custom trust pack | 2 |

The category has breadth across real kemp, regular dance sets, hair accessories, short necklaces, mattal, long harams, black kemp, earrings, waist belts, ghungroo/salangai, kids dance, and supporting components.

### 3. Terminology Discipline Exists

The knowledge base already locks the most important terminology:

- Use `regular Bharatanatyam/Kuchipudi jewellery`, not `imitation kemp`.
- Keep real kemp separate from regular dance jewellery.
- Keep black kemp as a separate shopping path.
- Use regular dance vocabulary: short necklace, long haram, nethi chutti, mattal/matil, vaddanam/oddiyanam, rakodi, jada, ghungroo/salangai.

This is exactly the kind of non-slop standard that should make the category stronger in SEO and AI retrieval.

### 4. Real Kemp Content Is Ahead Of The Rest

The real kemp pillar and arangetram guide are the strongest content assets in the dance ecosystem. They already explain material differences, price range, use cases, arangetram planning, and the distinction between real kemp and regular Bharatanatyam/Kuchipudi jewellery.

That is good. But it also exposes the gap: regular Bharatanatyam set planning and size guidance do not yet have the same strong public guide layer.

## What Is Fundamentally Missing

### 1. Google Is Often Ranking The Homepage For Core Bharatanatyam Intent

Search Console shows the homepage receiving much of the main Bharatanatyam search demand:

| Page | Impressions | Clicks | Top query examples |
| --- | ---: | ---: | --- |
| Homepage | 12,410 | 154 | `bharatanatyam jewellery`, `bharatanatyam jewellery set`, `bharatanatyam jewellery sets wholesale` |
| `/collections/bharatanatyam-jewellery` | 600 | 12 | `bharatanatyam jewellery`, `dance ornaments` |
| `/collections/bharatanatyam-jewellery-sets` | 2,059 | 21 | `bharatanatyam dress and jewellery`, `zara bharatanatyam jewellery` |

Honest read: Google understands Golden Collections has Bharatanatyam authority, but the main Bharatanatyam collection hub is not yet winning the main query strongly enough. The category authority is diffused through the homepage, products, and multiple collections instead of being concentrated into a clear buyer journey.

This is an SEO issue and a customer convenience issue.

### 2. Product Retrieval Is Good, But Not Legendary Yet

UCP baseline across nine Bharatanatyam prompts produced a script-scored 23/27 top-3 and 74/90 top-10. Manual review says the real story is:

- Strong: waist belt/vaddanam and ghungroo/salangai are clean.
- Mostly strong: short necklace, long haram, mattal.
- Needs work: general `Bharatanatyam jewellery set` returns a short necklace at rank 1 and component products in the top 10.
- Needs work: `black kemp Bharatanatyam jewellery` returns some non-black or non-kemp-adjacent products in the top 10.
- Needs better intent handling: `real kemp jewellery for arangetram` returns real kemp components, but not a clean arangetram planning/set path.

This is not a disaster. It is a clear agent-commerce opportunity: product type, collection membership, titles, and descriptions need enough intent separation that an agent can tell when the buyer wants a full set versus one component.

### 3. Merchant And Feed Completeness Are Not Where They Should Be

Active products missing one or more Merchant essentials:

| Family | Active | Missing Merchant essentials |
| --- | ---: | ---: |
| real kemp | 189 | 187 |
| black kemp | 55 | 53 |
| sets | 130 | 21 |
| earrings | 42 | 20 |
| hair accessories | 68 | 16 |
| short necklaces | 61 | 9 |
| ghungroo/salangai | 22 | 8 |
| long harams | 57 | 7 |
| mattal | 58 | 6 |
| waist belts | 25 | 0 |

Also, 765 active products are missing at least one extended feed field such as color, material, size, age group, gender, or Facebook category.

The sharpest concern is real kemp and black kemp. These are high-consideration ranges, but their feed completeness is weak. That limits Shopping, Merchant Center, structured product understanding, and agent confidence.

### 4. Measurement And Fit Proof Is Uneven

Only 86 active Bharatanatyam ecosystem products have measurement/scale wording in image alt text. The strongest family is short necklaces. Several fit-sensitive families are weak:

| Family | Active | Measurement/scale alt signal |
| --- | ---: | ---: |
| short necklaces | 61 | 40 |
| real kemp | 189 | 21 |
| black kemp | 55 | 8 |
| sets | 130 | 9 |
| long harams | 57 | 0 |
| waist belts | 25 | 0 |
| mattal | 58 | 2 |
| ghungroo/salangai | 22 | 1 |

This matters because dance buyers care about comfort, stage visibility, age/size fit, and set completeness. If the proof is in the image but not expressed in alt text, metafields, and product copy, machines and many customers do not see it.

### 5. The Custom Trust Pack Is Almost Empty

Only 2 of 767 active products have the complete custom trust pack used by the retrieval-ready standard. This includes fields like brand, country of origin, HSN, product details, product FAQs, key features, and AI product intelligence.

Not every field has to be perfect on every old product immediately. But the top products and top category winners need this. It is the structured version of "real products, real guidance, real proof."

### 6. Complete Set Decision Support Is Still Thin

The content roadmap lists these as high-impact pages:

- `Complete Bharatanatyam Jewellery Set: 12-15 Ornaments Explained`
- `Bharatanatyam Jewellery Size Guide for Kids, Teens, and Adults`
- `Kemp Black Jewellery for Bharatanatyam and Kuchipudi`
- `Real Kemp Jewellery vs Regular Bharatanatyam Jewellery`

The real kemp guides exist and are strong. I did not find an equivalent published Shopify-ready package for the complete regular Bharatanatyam set guide or the kids/teens/adults size guide in the checked blog outputs.

This is the biggest customer convenience gap. A parent or teacher needs to answer:

- Do I need a full set or only missing pieces?
- What is usually included?
- What changes for kids, teens, adults, arangetram, school performance, or institute bulk buying?
- Should I choose regular, black kemp, or real kemp?
- What measurements should I check before ordering?
- Which products match each other?

That answer should not be scattered across many product pages.

### 7. Active Sold-Out And Default Variant Issues Need Cleaner Handling

The audit found 21 active products where the first/default variant is unavailable.

- 20 active products have no available variants, meaning they are effectively sold out but still active.
- 1 active product has available variants but an unavailable first/default variant: `black-plated-kemp-bangles-bharatanatyam-bjb004`.

The BJB004 case is likely fixable by variant/default option handling. The sold-out active products need merchandising logic: hide, deprioritize, add back-in-stock path, or keep only if they serve a clear long-tail/catalog purpose.

## Category Diagnosis

### SEO

Current state: strong product and collection footprint, but authority is diffused.

Main issue: Google is ranking the homepage for major Bharatanatyam terms instead of the dedicated hub strongly enough. This suggests the Bharatanatyam hub needs stronger internal-link priority, clearer set/component pathways, and perhaps a stronger collection intro/FAQ section focused on "Bharatanatyam jewellery" as the canonical buying path.

### GEO/AEO

Current state: real kemp has good answer assets; regular Bharatanatyam and black kemp do not yet have enough retrieval-ready public explainers.

Main issue: answer engines need clean extractable units for "what is included," "which size," "regular vs real kemp," "black kemp use case," and "kids vs adult dance jewellery." The current content base is too real-kemp-heavy.

### UCP / Agent Commerce

Current state: promising, not finished.

Main issue: agents can find many correct products, but broad set intent leaks into individual components. This should be fixed with truthful product type and description disambiguation, not artificial keyword stuffing.

### Customer Convenience

Current state: collections and products are usable, but the buyer still has to do too much interpretation.

Main issue: the site needs a clearer "choose by situation" journey:

- First dance program / beginner.
- Kids stage performance.
- Arangetram.
- Teacher/institute bulk requirement.
- Regular set vs black kemp vs real kemp.
- Missing component replacement.
- Size-sensitive items: waist belt, short necklace, long haram, headset, jada, ghungroo.

## Recommended Next Goal

Use this as the next Codex goal:

```text
/goal Complete the Bharatanatyam authority sprint. Use the 2026-05-20 Bharatanatyam ecosystem audit to harden the category for SEO, GEO/AEO, UCP, Merchant/feed readiness, and customer convenience. Prioritize the main buyer paths: complete Bharatanatyam jewellery sets, kids sets, regular vs real kemp vs black kemp, short necklaces, long harams, waist belts, mattal, ghungroo/salangai, and arangetram planning. Do not create AI slop or unsupported claims. First fix truthful product-data and feed issues on top active products, then produce or update only the missing guide/content assets that answer real buyer decisions. Produce before/after evidence, UCP prompt results, Search Console baseline notes, and a short owner action list.
```

## Execution Plan

### Phase 1 - Data And Retrieval Cleanup

Codex can do this.

1. Build a priority SKU set from:
   - UCP top results.
   - Search Console high-impression Bharatanatyam pages.
   - Active products in main collections.
   - Real kemp, black kemp, full sets, kids sets, and high-fit-risk components.
2. Fix truthful product-data gaps on priority products:
   - Product type and dance role.
   - Regular / real kemp / black kemp range.
   - Buyer context.
   - Performance context.
   - Placement and fit notes.
   - Size notes and measurement confidence.
   - Matching finish and stone color.
3. Fix Merchant essentials first for real kemp and black kemp, then sets and component winners.
4. Fix BJB004 unavailable first/default variant issue.
5. Produce a before/after UCP prompt scorecard for the nine baseline prompts.

### Phase 2 - Customer Convenience Pages

Codex can draft and prepare. Anil should verify product truth.

1. Create or prepare the missing guide: `Complete Bharatanatyam Jewellery Set: 12-15 Ornaments Explained`.
2. Create or prepare the missing guide: `Bharatanatyam Jewellery Size Guide for Kids, Teens, and Adults`.
3. Create or prepare a black kemp guide focused on costume matching and when to choose black kemp.
4. Strengthen internal links from:
   - Bharatanatyam hub to set guide, size guide, sets, kids sets, real kemp, black kemp, ghungroo, waist belts, mattal.
   - Product pages back to the correct guide and component collection.

### Phase 3 - Measurement And Proof Layer

Codex can audit and update metadata. Anil is needed only where the existing product proof is unclear.

1. Start with long harams, waist belts, full sets, and ghungroo.
2. Identify products with ruler/scale/fit images in image 2, 3, or 4.
3. Update only visually confirmed image alt text and size/fit copy.
4. For products without proof images, mark them as lower proof tier rather than inventing measurement confidence.

### Phase 4 - Search And Agent Monitoring

Codex can do this monthly.

1. Track UCP prompts:
   - `Bharatanatyam jewellery set`
   - `Bharatanatyam jewellery set for kids`
   - `Bharatanatyam short necklace`
   - `Bharatanatyam long haram`
   - `Bharatanatyam waist belt vaddanam`
   - `Bharatanatyam mattal ear chain`
   - `Bharatanatyam ghungroo salangai`
   - `black kemp Bharatanatyam jewellery`
   - `real kemp jewellery for arangetram`
2. Track Search Console:
   - Whether `/collections/bharatanatyam-jewellery` gains share from the homepage for `bharatanatyam jewellery`.
   - Whether `/collections/bharatanatyam-jewellery-sets` improves for `bharatanatyam jewellery set`.
   - Whether guide pages begin appearing for question and planning queries.
3. Track Shopify revenue and add-to-cart baseline for fixed priority products.

## Owner / Anil Actions

These are not large, vague content tasks. They are specific confirmations.

1. Confirm the standard full Bharatanatyam set component list Golden Collections wants to publish. Include optional vs required pieces.
2. Confirm kids / teens / adult fit guidance where Golden Collections has real experience.
3. Confirm whether black kemp is usually chosen for costume color matching, stage contrast, teacher preference, or all of these.
4. Decide handling for active sold-out dance products: keep active with back-in-stock path, hide, or deprioritize.
5. If proof images are missing for top products, shoot only the missing proof views: front, scale/ruler, and worn/placement where practical.

## Bottom Line

Golden Collections already has the rare thing: deep Bharatanatyam inventory, real category vocabulary, real kemp authority, and practical buyer knowledge.

The missing layer is not more generic SEO content. It is structured buyer guidance and product truth expressed consistently enough that Google, UCP agents, and human buyers all understand the same thing:

What is this piece, who is it for, what role does it play in the dance set, how does it fit, what does it match, and when should someone choose it over another option?

That is the next legendary move.
