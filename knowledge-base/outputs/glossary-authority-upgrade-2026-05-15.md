# Golden Collections Glossary Authority Upgrade - 2026-05-15

Status: content architecture plan and seed-entry brief.  
Owned surface: `knowledge-base/outputs/` only.  
No theme, script, template, or Shopify Admin changes made in this pass.

## Objective

Upgrade the Golden Collections glossary from a simple term list into an AEO/GEO/SEO authority layer for deity jewellery, Bharatanatyam jewellery, Kuchipudi jewellery, real kemp, and temple jewellery vocabulary.

The glossary should answer three buyer/search intents:

1. "What does this jewellery word mean?"
2. "Is this the same thing as another regional name?"
3. "Where do I shop or learn more on Golden Collections?"

## Source Context Used

- `knowledge-base/wiki/search-entity-map.md`
- `knowledge-base/wiki/real-kemp-jewellery.md`
- `knowledge-base/wiki/deity-compatibility-model.md`
- `knowledge-base/wiki/content-roadmap.md`
- `knowledge-base/wiki/shopify-custom-data-model.md`
- `custom-data/dance-product-controlled-vocabulary.md`
- `templates/page.golden-glossary.liquid`
- published real kemp blog packages in `blog-system/outputs/shopify-ready/`

## Current Glossary Surface

The live Shopify template `templates/page.golden-glossary.liquid` renders `shop.metaobjects.glossary_term.values` sorted by `term.value`.

Known displayed fields:

- `term`
- `definition`
- `image`
- `collection_link`

Current schema is only basic `WebPage`. This is acceptable for the current template, but the authority upgrade should plan richer content fields before changing Liquid.

## Priority Structure

### P0 - Foundation Terms For Existing Authority Pages

These terms should be added or upgraded first because they connect directly to existing or already-planned authority pages, product collections, and high-intent buyer questions.

| Term | Definition angle | Regional synonyms / variants | Context | Primary internal link | Secondary links |
| --- | --- | --- | --- | --- | --- |
| Real kemp jewellery | Premium South Indian temple/dance jewellery range at Golden Collections using brass/copper base, high gold plating, and Kemp/Kempu stones. | real kemp, Kempu jewellery, Kemp stone jewellery, antique kemp set | Bharatanatyam, Kuchipudi, bridal classical styling, traditional festive use | `/blogs/jewellery-guides/real-kemp-jewellery-guide` | `/collections/kemp-jewellery`, `/blogs/jewellery-guides/real-kemp-jewellery-for-arangetram` |
| Kemp stones | Red, green, or white stones used in kemp-style and real kemp jewellery. Use customer language, not advanced gem-setting claims. | Kempu stones, Kemp stone, red kemp, green kemp | Dance jewellery, temple jewellery, real kemp | `/blogs/jewellery-guides/real-kemp-jewellery-guide` | `/collections/kemp-jewellery` |
| Bharatanatyam jewellery set | Coordinated classical dance jewellery set used for performance, usually planned around teacher requirements and costume direction. | Bharatanatyam set, dance jewellery set, arangetram jewellery set | Bharatanatyam, arangetram | `/collections/bharatanatyam-jewellery` | `/collections/kemp-bharatanatyam-jewellery-dance-sets` |
| Kuchipudi jewellery | Classical dance jewellery suitable for Kuchipudi when the costume and teacher's ornament list call for temple jewellery styling. | Kuchipudi dance jewellery, Kuchipudi ornaments | Kuchipudi, real kemp, regular dance range | `/collections/bharatanatyam-jewellery` | `/collections/kemp-jewellery` |
| Deity jewellery | Jewellery and alankaram accessories for god/goddess idols, selected by deity, idol size, ornament placement, and measured product fit. | god jewellery, idol jewellery, alankaram jewellery | Deity, Varalakshmi, pooja, temple decor | `/pages/deity-jewellery-alankaram-guide` | `/pages/how-to-measure-idol-for-deity-jewellery` |
| Deity crown | Head ornament for idols; fit depends on idol height, face/head width, crown style, and placement. | mukut, kireedam, kirita, crown | Deity jewellery, Varalakshmi, Balaji, Krishna, Amman | `/pages/deity-crown-mukut-kireedam-size-guide` | `/collections/deity-crowns` |
| Vaddanam | Waist belt used for dancers and deity alankaram; meaning overlaps with oddiyanam/kamarband depending on context. | oddiyanam, kamarband, waist belt, kati sutra | Bharatanatyam, Kuchipudi, deity jewellery, real kemp | `/collections/kemp-vaddanam-waistbelt` | `/collections/deity-vaddanam-waist-belt` |
| Nethi chutti | Forehead ornament for classical dance, often searched alongside maang tikka. | maang tikka, tikka, netti chutti | Bharatanatyam, Kuchipudi, arangetram, real kemp | `/collections/bharatanatyam-headset-nethi-chutti` | `/products/kemp-maangtikka-bharatanatyam-nethi-chutti-arangetram-bbm028` |
| Mattal | Ear chain used with earrings in classical dance jewellery. | matil, mattel, ear chain | Bharatanatyam, Kuchipudi, arangetram | `/collections/bharatanatyam-earrings-mattal` | `/collections/kemp-jewellery` |
| Long haram | Longer necklace layer used for dance, real kemp, bridal classical styling, and deity chest alankaram. | long necklace, haram, mala | Bharatanatyam, Kuchipudi, deity jewellery, real kemp | `/collections/kemp-long-necklace` | `/collections/deity-long-harams` |

### P1 - Deity And Regional Compatibility Terms

These terms support deity-first browsing, regional search, and AI answer confidence. They should make compatibility caveats visible.

| Term | Definition angle | Regional synonyms / variants | Deity context | Primary internal link |
| --- | --- | --- | --- | --- |
| Alankaram | Decoration/adornment of deity idols; Golden Collections should use this for practical ornament selection, not unsupported ritual claims. | alangaram, adornment, pooja decoration | All deity groups; especially Varalakshmi/Amman | `/pages/deity-jewellery-alankaram-guide` |
| Varalakshmi alankaram | Festival-season Lakshmi/Amman decoration using face, crown, hands/legs, harams, vaddanam, flowers, banana trees, and decor where suitable. | Varalakshmi decoration, Varalakshmi Vratham alankaram, Ammavaru alankaram | Varalakshmi / Lakshmi / Amman | `/pages/varalakshmi-alankaram-guide` |
| Hastham and padam | Hands and feet accessories for Varalakshmi/Lakshmi/Amman doll or idol context; not universal across all deities. | hands and legs, hastham padam, Ammavaru hands legs | Varalakshmi / Lakshmi / Amman | `/collections/varalakshmi-hands-legs` |
| Namam | Vishnu-family forehead mark/accessory; should not be positioned as a generic deity bindi. | thiruman, tilak, Tirupati namam | Vishnu / Balaji / Venkateswara / Perumal | `/collections/deity-accessories` |
| Shanku chakra | Conch and discus symbols associated with Vishnu-family deities. | shankh chakra, conch discus | Vishnu / Balaji / Venkateswara / Perumal | `/collections/deity-accessories` |
| Tripund | Shiva-family forehead mark/accessory. | vibhuti, thiruneer, tripundra | Shiva / Mahadev | `/collections/deity-accessories` |
| Vel | Spear symbol associated with Murugan/Subramanya. | Murugan vel, Subramanya vel | Murugan / Subramanya / Kartikeya / Skanda | `/collections/deity-accessories` |
| Prabhavali | Decorative arch/backdrop around a deity idol. | arch, tiruvachi, deity arch | Deity alankaram, temple decor | `/collections/deity-accessories` |
| Thomala | Garland-style deity ornament; must be separated from fresh-flower ritual claims unless owner-confirmed. | vagamalai, mala, garland | Varalakshmi / Lakshmi / Amman; general by size if design allows | `/collections/vagamalai-thomala` |
| Lotus asana | Lotus base or seat used in deity display. | lotus peedam, lotus stand, asana | Lakshmi, Saraswati, deity decor | `/collections/deity-accessories` |

### P2 - Dance Component Terms

These entries support shopping-path clarity for parents, dancers, teachers, and diaspora buyers planning arangetram or performance sets.

| Term | Definition angle | Regional synonyms / variants | Dance context | Primary internal link |
| --- | --- | --- | --- | --- |
| Short necklace | Close neck necklace layer in dance jewellery; can overlap with addigai/padakkam language. | addigai, padakkam, short haram, short chain | Bharatanatyam, Kuchipudi, arangetram | `/collections/bharatanatyam-short-necklace` |
| Headset | Group of head ornaments for classical dance, often including nethi chutti and side/head pieces. | thalaisaman, head jewellery, head set | Bharatanatyam, Kuchipudi | `/collections/bharatanatyam-headset-nethi-chutti` |
| Surya chandra | Sun and moon head ornaments used in classical dance styling where required. | sun and moon, chandra surya | Bharatanatyam, Kuchipudi | `/collections/bharatanatyam-headset-nethi-chutti` |
| Vanki | Arm ornament used in dance and bridal classical styling. | bajuband, armlet, arm band | Bharatanatyam, Kuchipudi, bridal classical styling | `/collections/bharatanatyam-accessories` |
| Rakodi | Hair ornament used around the bun or braid area depending on set style. | jada billa, hair disc | Bharatanatyam, Kuchipudi | `/collections/bharatanatyam-hair-accessories` |
| Jada | Braid jewellery or braid accessory used in dance hair styling. | jadai, jada kuchulu, braid ornament | Bharatanatyam, Kuchipudi | `/collections/bharatanatyam-hair-accessories` |
| Salangai | Ankle bells used by classical dancers; use alongside ghungroo for broader search matching. | ghungroo, ankle bells | Bharatanatyam, Kuchipudi, dance practice/performance | `/collections/bharatanatyam-accessories` |
| Arangetram jewellery | Jewellery chosen for a dancer's debut performance, planned around teacher list, costume, comfort, and delivery timing. | arangetram set, arangetram ornaments | Bharatanatyam, sometimes Kuchipudi context | `/blogs/jewellery-guides/real-kemp-jewellery-for-arangetram` |

### P3 - Product And Range Terms

These terms reduce confusion between regular dance, real kemp, black kemp, and deity ranges.

| Term | Definition angle | Synonyms / variants | Internal link |
| --- | --- | --- | --- |
| Regular dance jewellery | Golden Collections' regular Bharatanatyam/Kuchipudi range; do not call the brand's regular range "imitation kemp" in public copy. | regular Bharatanatyam jewellery, regular Kuchipudi jewellery | `/collections/bharatanatyam-jewellery` |
| Black kemp jewellery | Darker kemp-style range for Bharatanatyam and Kuchipudi costume matching; separate from real kemp. | kemp black, black kemp set | `/collections/kemp-black-jewellery` |
| Antique gold finish | Finish direction often used in temple/dance jewellery; avoid unconfirmed material claims. | antique gold, antique finish | `/collections/kemp-jewellery` |
| Gold plated dance jewellery | Customer-facing finish description for regular dance products when stronger plating details are not owner-confirmed. | gold polish, gold finish | `/collections/bharatanatyam-jewellery` |
| Temple jewellery | South Indian style direction used in dance, real kemp, bridal classical styling, and deity ornament language. | temple ornaments, traditional temple jewellery | `/pages/golden-collections-knowledge-hub` |

## Recommended Glossary Entry Fields

The current metaobject appears to support only a compact display. For the authority upgrade, plan an expanded `glossary_term` model or a companion content draft with:

- `term`: canonical display term.
- `slug`: stable anchor/import slug.
- `definition_short`: 35-55 word direct answer for AEO.
- `definition_full`: shopper-friendly expanded explanation.
- `regional_synonyms`: alternate spellings and regional/search variants.
- `category`: deity, dance, kemp, range, material/finish, festival.
- `deity_context`: compatible deity group or caveat.
- `dance_context`: Bharatanatyam, Kuchipudi, arangetram, practice, stage.
- `buyer_warning`: one caveat, such as "not universal; check idol size".
- `primary_internal_link`: best guide or collection URL.
- `secondary_internal_links`: supporting guide, collection, or product URLs.
- `schema_about`: normalized entity names for JSON-LD `about`/`mentions`.
- `owner_confirmation`: confirmed, needs owner confirmation, or inferred from KB.
- `last_reviewed`: date.

## Internal Linking Rules

Use glossary entries as authority bridges, not isolated definitions.

- Every P0 glossary entry should link to one money page or published guide.
- Every relevant product/collection page should link back to one glossary or guide definition when the term may confuse buyers.
- Use anchor text that matches the shopper's language: "mukut/kireedam size guide", "real kemp jewellery guide", "nethi chutti", "vaddanam/oddiyanam".
- Do not create circular link blocks with every term on every page.
- For deity products, only link compatibility terms when the symbol or ornament truly applies to that deity group.
- For dance products, keep Bharatanatyam/Kuchipudi and arangetram context separated from deity alankaram context unless the product range truly overlaps.

## Schema Recommendations

### Current Glossary Page

Keep the existing `WebPage` JSON-LD until the page content supports richer markup. Add richer schema only after the visible glossary entries expose the same facts.

Recommended future graph:

- `WebPage` for `/pages/jewelry-glossary`.
- `BreadcrumbList` if the page has visible breadcrumb navigation.
- `DefinedTermSet` for the glossary page.
- `DefinedTerm` for each visible glossary entry, using:
  - `name`
  - `description`
  - `alternateName`
  - `url` with term anchor
  - `inDefinedTermSet`

### FAQ Schema

Use `FAQPage` only if visible FAQs are added to the glossary or term pages. Do not add FAQ schema for hidden or metaobject-only data.

Suggested visible FAQ topics:

- What is the difference between kemp jewellery and real kemp jewellery?
- Are mukut, kireedam, and crown the same for deity jewellery?
- What jewellery is included in a Bharatanatyam set?
- Is vaddanam the same as oddiyanam?
- How do I choose deity jewellery size for an idol?

### Product And Collection Schema Alignment

- Product schema can use `alternateName` for regional names already present in product metafields.
- Collection pages should use visible copy plus `CollectionPage` and `ItemList` where supported.
- Avoid adding glossary-only synonyms into product schema unless they are visible or already present in product metadata.

## AEO/GEO Editorial Rules

- Put a direct answer in the first sentence of every definition.
- Use regional names naturally in the definition, not as keyword lists.
- Distinguish dance use, deity use, and bridal/festive use when the same term appears in multiple contexts.
- Mark deity-specific symbols clearly: namam/thiruman and shanku chakra are Vishnu-family; tripund/vibhuti is Shiva-family; vel is Murugan/Subramanya.
- Do not say broad accessories are universal. Use "general/common when size and placement fit."
- Use "Kemp stones" or "Kempu stones" for public real kemp copy.
- Do not call Golden Collections' regular dance range "imitation kemp".
- Do not invent ritual claims, gemstone claims, certificate claims, or compatibility rules.

## Implementation Roadmap

### Phase 1 - Content Seeding

1. Add or update P0 terms in Shopify `glossary_term` metaobjects.
2. Use `definition_short` style copy even if the current field is only `definition`.
3. Add `collection_link` to the single best destination for each term.
4. Use real product/collection images only where the image clearly represents the term.

### Phase 2 - Link Strengthening

1. Link the Knowledge Hub to `/pages/jewelry-glossary`.
2. Link the real kemp guide to the glossary terms for real kemp, Kemp stones, vaddanam, nethi chutti, mattal, and long haram.
3. Link deity authority pages to crown/mukut/kireedam, alankaram, namam, shanku chakra, hastham/padam, thomala, and vaddanam definitions.
4. Link Bharatanatyam collection support copy to headset, nethi chutti, mattal, vaddanam, rakodi, jada, and salangai definitions.

### Phase 3 - Data Model Upgrade

1. Decide whether `glossary_term` should gain fields for synonyms, category, context, and schema data.
2. If yes, update metaobject definitions first, then adapt `page.golden-glossary.liquid` in a separate implementation task.
3. Render visible synonyms and context blocks before adding `DefinedTerm` JSON-LD.
4. Validate with Schema.org validator and Google Rich Results Test.

### Phase 4 - Answer Engine Refinement

1. Convert recurring Google Search Console queries into glossary entries or FAQs.
2. Add term anchors so AI/search citations can point to a stable sub-section.
3. Review glossary entries quarterly for stale terms, unsupported claims, and missing regional variants.
4. Add owner-confirmed notes where real customer questions reveal regional spellings or compatibility confusion.

## Immediate Next Entries To Draft

Use the companion draft file:

- `knowledge-base/outputs/glossary-authority-seed-entries-2026-05-15.jsonl`

It is intentionally a content/import draft, not a new source of truth. The stable source remains the wiki plus owner-confirmed Shopify product and collection data.

