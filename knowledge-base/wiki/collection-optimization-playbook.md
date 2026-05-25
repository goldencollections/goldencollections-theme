# Collection Optimization Playbook

Backlinks: [[index.md]], [[shopify-custom-data-model.md]], [[deity-compatibility-model.md]], [[search-entity-map.md]], [[content-roadmap.md]], [[retrieval-ready-seo-strategy.md]]

Last updated: 2026-05-20

## Purpose

Use this playbook for every Golden Collections collection optimization pass so the owner does not need to repeat the same requirements.

Goal: make each collection strong for shoppers, Google SEO, Merchant Center/feed quality, and answer engines such as ChatGPT, Claude, Grok and other AI agents.

Do not call a collection "done" just because the template renders or metafields are technically valid. A collection is only ready when the visible customer content, product data, schema, Google fields, and internal taxonomy are all coherent.

Operating principle: use [[retrieval-ready-seo-strategy.md]]. The collection should not be optimized for AI through slop, hidden content or fake mentions. It should make real product/category facts extractable through clear copy, product data, metafields, image alt text, Merchant fields, schema and verification.

## Default Sequence

1. Identify collection intent.
2. Research cultural, regional, product and search context where needed.
3. Decide the correct taxonomy model before editing data.
4. Update collection title, description, SEO title, SEO description and collection metafields.
5. Review every product in the collection, not only the collection page.
6. Update product titles, descriptions, SEO fields, tags and alt text when needed.
7. Fill confirmed product metafields and leave uncertain values blank.
8. Fill Google/Merchant fields only when accurate.
9. Update customer-facing FAQ and JSON-LD/schema.
10. Verify live rendered pages and Shopify data read-back.
11. Record unresolved issues, such as missing media or unknown dimensions.

## Intent Model

Classify the collection first:

- `ornament_first`: customer starts from product type, such as deity crowns, necklaces, earrings or vaddanam.
- `deity_landing`: customer starts from deity, such as Krishna, Ganesh or Varalakshmi.
- `deity_ornament`: customer wants one ornament type for one deity group.
- `festival`: collection is tied to a ritual/season, such as Varalakshmi Vratham.
- `accessory`: supporting alankaram or pooja setup items.
- `pooja_decor`: ritual decor, kalasam decor, mandapam decor, banana tree decor, coconut tree decor, lotus, stands or altar setup pieces.

Do not force pooja decor into jewellery when a cleaner `Pooja Decor` range is more truthful.

## Collection Fields

For every optimized collection, review these fields:

- `display_title`
- `collection_intro`
- `size_fit_intro`
- `faq_family`
- `regional_keyword_cluster`
- `collection_role`
- `deity_first_enabled`
- `shopping_path_label`
- `primary_deity_ref`
- `deity_group_refs`
- `ornament_type_ref`
- `ornament_type_refs`
- `size_profile_ref`
- `crown_size_standard_ref`
- `subcollections`
- `related_collection_refs`
- `sort_priority`

Use canonical reference fields when available. Keep text fields only as compatibility/public-display helpers.

## Product Fields

For every product inside the collection, review:

- `primary_deity`
- `primary_deity_ref`
- `compatible_deities`
- `compatible_deity_refs`
- `not_for_deities`
- `not_for_deity_refs`
- `compatibility_class`
- `ornament_type`
- `ornament_type_ref`
- `range_type`
- `placement`
- `regional_names`
- `material`
- `set_items_included`
- `component_count`
- `size_confidence`
- `fit_notes`
- `quality_checks`
- `idol_height_min_in`
- `idol_height_max_in`
- `ornament_height_in`
- `ornament_width_in`
- `ornament_depth_in`

For crowns, also review:

- `crown_style`
- `idol_head_width_min_in`
- `idol_head_width_max_in`
- `crown_inner_width_in`
- `crown_outer_width_in`
- `crown_inner_circumference_in`
- `crown_arc_length_in`
- `crown_size_standard_ref`

## Compatibility Classes

Use these values consistently:

- `Deity Specific`: strongly made for one deity/group.
- `Multi-Deity`: works for a known set of deities.
- `General/Common`: broadly usable when size and placement match.
- `Festival Specific`: tied to a festival or ritual season.

Do not over-claim deity fit. For broad ritual decor, use compatibility/search context rather than pretending it is made for one idol.

## Google And Merchant Fields

For each product, check:

- SKU and barcode policy.
- Google product category.
- condition.
- custom product / identifier status.
- price and availability consistency.
- product title and description clarity.
- image quality and whether measurement photos exist.

Golden Collections currently uses SKU as internal code/barcode for some products. Do not treat SKU/barcode as GTIN unless the owner confirms it is a manufacturer GTIN.

If there is no valid GTIN/MPN/brand identifier, prefer accurate custom-product handling over invented identifiers.

## Content Standard

Collection content should answer:

- What is this collection?
- Who or what is it for?
- Where is it used?
- How should the customer choose size, material, quantity or placement?
- What alternate/regional names do customers search?
- What related shopping path helps the customer next?

Product content should answer:

- What is included?
- What material is it made from?
- What size/space should be checked?
- Where is it placed?
- Which deity, ritual or setup is it suitable for?
- What should be checked in the product photos?

FAQ must be specific to the collection/product family. Avoid thin generic FAQ such as only "size and fit" if the collection is actually pooja decor, dance jewellery, kemp jewellery or festival setup.

## Retrieval-Ready Standard

For 2026 SEO/GEO/AEO and agent-commerce readiness, every priority collection should be section-level extractable:

- Intro copy should identify the collection in one direct sentence, not only in decorative language.
- Buying guidance should use specific facts: product type, placement, size/fit rule, material/finish, included pieces, deity/dance/festival context and matching path.
- Regional names should be present when truthful, but not stuffed.
- Product cards and product pages should agree with the collection language. If the collection says `short necklace`, products should not drift into `short haram` unless the owner has approved that term for the family.
- Images and alt text should prove the category where possible: full view, close-up, measurement/scale, back/closure, set components or placement.
- Wrong-type products, no-image products and future products should be removed from customer-visible collection results rather than masked with metadata.
- UCP/agent tests should be run for important collections after data changes, and retested after 48-72 hours when results change.

## Schema And GEO

Every optimized collection should have clean JSON-LD where appropriate:

- Collection/List context.
- Product schema on product pages.
- FAQPage schema where visible FAQ exists.
- Breadcrumb/schema alignment where supported by theme.
- Same factual terminology across visible copy, metafields and schema.

Product-level FAQ for deity products should be generated from confirmed metafields wherever possible, not duplicated manually across hundreds of products. The live `product.deity-lite` and legacy `product.deity` templates use the shared deity product FAQ layer to answer fit, included item/count, deity suitability, size checks, material and pre-purchase help from confirmed product data. Keep per-product `custom.product_faqs` only for truly product-specific extra questions, and do not use it as a substitute for filling material, component, placement or fit metafields.

For GEO/answer engines, include natural entity terms and regional names without stuffing. Use customer language plus canonical names:

- Example: `Crown / Mukut / Kireedam`
- Example: `Vaddanam / Oddiyanam / Waist Belt`
- Example: `Banana tree / Plantain tree / Vazhaikannu / Arati Chettu / Baale Gida / Vazhai Maram`

## Verification Standard

Before reporting "done":

- Read Shopify data back through Admin API.
- Verify reference metafields resolve to the expected metaobjects.
- Verify product count and product list.
- Check rendered page text on live or preview theme.
- Parse JSON-LD.
- Confirm no stale generic FAQ remains.
- Confirm no incorrect category language remains.
- Note media issues, missing dimensions, or unconfirmed fields.

Performance data from Google Search Console and Merchant Center comes later. For new updates, first verify crawlability, structured data, feed fields, and absence of Merchant Center disapprovals.

## Banana Tree Collection Decision Record

For `banana-tree-banana-bunches-for-pooja-varamahalakshmi-vratham`, the correct model is:

- Collection role: `festival`
- Range type: `Pooja Decor`
- Primary deity/group: `Varalakshmi / Lakshmi / Amman`
- Compatible/search context: `Satyanarayana / Narayana / Vishnu`
- Ornament type metaobject: `Pooja Decor / Banana Tree Decor`
- Banana products: `Festival Specific`
- Coconut tree decor: `General/Common`
- Regional names include `vazhaikannu`, `vazhai maram`, `vazhamaram`, `arati chettu`, `baale gida`, `Satyanarayan pooja decoration`, `Satyanarayana Swamy pooja decor`

Do not make Satyanarayana Swamy the primary deity for this collection. It is a compatible/search context.

## Deity Short Necklace Collection Decision Record

For `deity-short-harams`, the correct model is:

- Collection role: `ornament_first`
- Range type: `Deity`
- Ornament type metaobject: `Short Necklace`
- Placement: `Neck / upper chest`
- Google product category: `196` (`Apparel & Accessories > Jewelry > Necklaces`)
- FAQ family: `necklace`
- Owner-confirmed size model: `Size in Inches (L x W)` and `Length` option values mean `Length x Width`.
- Store `Length x Width` values in the available necklace measurement fields as `ornament_height_in = first number / length` and `ornament_width_in = second number / width` unless a dedicated `ornament_length_in` metafield is later created.
- Owner-confirmed step model: `1 Step`, `2 Step` and `3 Step` mean the number of necklace rows/layers in the design.
- Generic deity short necklaces: `General/Common`, suitable for multiple deity idols only when measured size and placement match.
- Owner-confirmed: generic short necklaces can be used for all god and goddess idols when size and placement fit.
- Owner-confirmed: Chest Necklace styles are only for Venkateshwara Swamy, Balaji, Vishnu, Perumal and goddess idols. Do not map Chest Necklace products to Krishna/Radha Krishna, Ganesh, Shiva, Murugan, Ayyappa or Hanuman deity paths.
- Owner-confirmed material: `Alloy metal with stone work`.
- Owner-confirmed component rule for this collection: all products are single short necklaces, including titles that previously used set/ensemble wording.
- UX rule: do not expose the exact `Size in Inches (L x W)` option filter on this collection because it creates too many exact values. Keep exact measurements on product pages/cards and use Size Help plus future grouped size buckets for filtering.
- Merchandising rule: keep active in-stock products first in the manual collection order, followed by sold-out active products, then non-active products.
- Revenue recovery rule: sold-out products should show a back-in-stock/help CTA with email capture and WhatsApp contact.
- Lakshmi, Varalakshmi, Amman or Ammavaru titles: primary group `Varalakshmi / Lakshmi / Amman`.
- Goddess or Devi titles without a specific goddess: `Multi-Deity`, compatible with goddess groups, but avoid forcing one primary deity.
- Regional names include `short necklace`, `deity necklace`, `idol necklace`, `god necklace`, `goddess necklace`, `haar`, `mala`, `malai`, `alankaram necklace`, `swamy alankaram necklace`, `ammavaru short necklace`, `amman short necklace`, and `lakshmi short necklace`.

Open owner-confirmation items before final media/content polish:

- No required data questions remain for material, component count, size model, step model or Chest Necklace deity compatibility.
- Optional later improvement: add live model photos or videos that show how to measure necklace length and width on different idol sizes.

## Deity Necklace Parent Collection Decision Record

For `deity-necklace`, the correct model is:

- Collection role: `ornament_first` parent/browse collection.
- Products are shared from the short-necklace and long-haram collections; do collection content only unless the user asks for product-level edits.
- Use `Deity Necklaces` as the collection title.
- Describe the page as a combined browse path for short necklaces and long harams.
- Correct terminology: short pieces are `short necklaces`; long pieces can be `long harams` / `long necklaces`. Do not use `short haram`, `short necklace haram`, or `necklace haram`.
- Fit guidance: choose short necklaces for neck or upper-chest placement and long harams for lower chest, body or dress drape. Compare product `Length x Width`, idol height, chest width and dress placement.
- Regional names may include `deity necklace`, `deity short necklace`, `deity long haram`, `deity long necklace`, `haram`, `haar`, `mala`, `malai`, `alankaram necklace`, deity-specific necklace phrases and long-haram phrases. Avoid short-haram phrases.
- Customer-visibility cleanup applied: active necklace products with zero Shopify images were moved to Draft (`DSN046`, `DSN045`, `DSN044`, `DSN004`, `DSN030`, `DSN037`, `DSN048`, `DSN041`, `DSN005`, `DSN025`, `DSN024-1`, `DSN068`, `DSN074`, and `DSN072`). Keep no-image necklace products out of Active until real product images are added.

## Deity Long Haram Collection Decision Record

For `deity-long-harams`, the current safe model is:

- Collection role: `ornament_first`
- Range type: `Deity`
- Ornament type metaobject: `Long Haram`
- Placement: lower chest / body / dress drape area
- Google product category: `196` (`Apparel & Accessories > Jewelry > Necklaces`)
- FAQ family: `necklace`
- UX rule: do not expose the exact `Size in Inches (L x W)` option filter on this collection because it creates too many exact values. Keep exact measurements on product pages/cards and use Size Help plus future grouped size buckets for filtering.
- Merchandising rule: keep active in-stock products first in manual collection order, followed by sold-out active products, then non-active products.
- Revenue recovery rule: sold-out products should show the same back-in-stock/help CTA with email capture and WhatsApp contact.
- Owner-confirmed material: `Alloy metal with stone work`.
- Owner-confirmed Chest style rule: Chest style long harams are only for Venkateshwara Swamy, Balaji, Vishnu, Perumal and goddess idols. Do not map Chest long harams to Krishna/Radha Krishna, Ganesh, Shiva, Murugan, Ayyappa or Hanuman deity paths.
- Owner-confirmed component rule: all products in this collection are one long haram / long necklace, including titles that say set or ensemble.
- Owner-confirmed size model: `Size in Inches (L x W)` means `Length x Width`, same as Short Necklace. `Length`-only options store the length only and require photos/customer check for width.
- Owner-confirmed step model: `1 Step`, `2 Step`, `3 Step` and `5 Step` mean the number of necklace rows/layers in the design.
- Applied confirmed product fields: material, range type, long-haram ornament type reference, placement, regional names, Google/Merchant necklace category, condition, custom-product flag, Chest compatibility/not-for refs, component fields for all products, size confidence, and available length/width measurement metafields.

## Deity Earrings Collection Decision Record

For `deity-earrings-for-god-idols-statues`, the current safe model is:

- Collection role: `ornament_first`
- Range type: `Deity`
- Ornament type metaobject: `Earrings`
- Placement: `Ears`
- Google product category: `194` (`Apparel & Accessories > Jewelry > Earrings`)
- FAQ family: `earrings`
- Regional names include `deity earrings`, `earrings for god idol`, `earrings for goddess idol`, `idol earrings`, `karna pathakam`, `karnapathakam`, `karna pathakkam`, `ear ornaments`, `ear studs`, `jhumki`, `jhumka`, `alankaram earrings`, `amman earrings`, `ammavaru earrings`, and `lakshmi earrings`.
- Size UX rule: hide exact `Size in Inches` and exact `Height` filters on the collection because the collection has many exact measurement values. Keep exact measurements on product pages/cards and use Size Help plus future grouped size buckets for filtering.
- Applied safe product fields: range type, earring ornament type reference, placement, regional names, Google/Merchant earring category, condition, custom-product flag, size confidence, available single-value height/width measurement metafields, and SKU-to-barcode normalization.
- Owner-confirmed material: regular deity earrings are `Alloy Metal with Stone work`; gold earrings are `Alloy metal with Gold Plating`.
- Owner-confirmed component rule: each product includes a pair of earrings. Use `component_count = 2` and `set_items_included = Pair of deity earrings`.
- Owner-confirmed compatibility rule: generic deity earrings are suitable for all god and goddess idols when measured ear placement and size fit.
- Owner-confirmed size model: `Size in Inches (H x W)` means Height x Width, `Height` means earring height, and `Length` variant values should also be treated as earring height for this collection.
- Applied confirmed product fields: material, component count, set items included, General/Common compatibility, all major deity compatibility refs, all product titles/descriptions/SEO, image alt text, Google/Merchant earring category, condition, custom-product flag, and removal of wrong age/gender fields.
- Product-page schema readiness: all 222 earrings products use `product.deity-lite`, including drafts, so Product JSON-LD and deity FAQ/schema can render when a product is published.
- Merchandising rule applied: collection sort is manual, with active in-stock products first, active sold-out products next, and draft/non-active products after.
- Remaining content asset gap: some earring products have no product images in Shopify. Do not claim image SEO is complete for those products until product images are added and alt text can be verified.
- Visibility rule applied: active earring products with zero Shopify images were moved to Draft. Keep no-image earrings out of customer visibility until real product photos/products are available; preserve handles, SEO fields, product metafields and `product.deity-lite` so they can be revived later without rebuilding the product data.

## Deity Gold Plated Crowns Collection Decision Record

For `deity-crowns`, the current safe model is:

- Collection role: `ornament_first`
- Range type: `Deity`
- Ornament type metaobject: `Crown / Mukut / Kireedam`
- Placement: `Head`
- Google product category: `97` (`Religious & Ceremonial > Religious Items`)
- FAQ family: `crown`
- Owner-confirmed material: deity gold plated crowns are `Brass with Gold Plating`.
- Owner-confirmed component rule: each product includes one crown only. Words like set, Sun Moon, Shanku Chakra or earrings in older titles should not be treated as included components unless the owner confirms the product actually includes those pieces.
- Owner-confirmed size model: `Size in Inches (H x W x D)` means Height x Width x Diameter/Depth. `L` in crown size options means crown height. Use product measurement photos where available; H/W/D fit is important for crown selection.
- Owner-confirmed compatibility rule: gold plated crowns can be used for all god and goddess idols when head size, crown style and placement fit. If a product title or imagery names Balaji, Vishnu, Perumal, Amman, Goddess, Andal or another deity, use that as additional search/entity context without excluding broader god/goddess compatibility.
- Crown style rule: preserve half crown, full crown, round/full round, Jwala, Vaira Mudi and Andal style signals when present. Left/right tilted crowns are Andal crowns and should be matched carefully by direction and placement.
- Collection cleanup rule applied: `Drama Crowns` were moved out of `deity-crowns` and belong under `drama-dance-crowns`. Deity hair crown/koppu products were moved out of `deity-crowns` and belong under `deity-hair-crown`.
- Visibility rule applied: active crown products with zero Shopify images were moved to Draft. Keep no-image crowns out of customer visibility until real product photos/products are available; preserve handles, SEO fields, product metafields and `product.deity-lite` so they can be revived later.
- Applied confirmed product fields: material, component count, set items included, General/Common compatibility, all major deity compatibility refs, crown style where present, available single-value H/W/D metafields, regional names, SEO title/meta description, image alt text, Google/Merchant category, condition, custom-product flag, and removal of wrong age/gender fields.

## Deity Crowns Parent Collection Decision Record

For `deity-crowns-1`, the current safe model is:

- Collection role: parent/browse collection for deity idol crowns.
- Products are selected by smart collection rules, not manual membership.
- Smart collection rules should include product types `Deity Stone Crowns`, `Deity Gold Plated Crowns`, and `Premium Deity Crowns`.
- Smart collection rules should not include `Drama Crowns` or empty/wrong-photo hair crown products.
- Subcollection circles should show `deity-crowns`, `deity-stone-crowns`, and `premium-deity-crowns`.
- Do not show `deity-hair-crown` in this parent path while all hair crown products are Draft and the owner has confirmed no valid products are available.
- Drama crowns belong under Bharatanatyam/performance navigation, not the deity crown parent.
- SEO and FAQ copy should explain deity crowns, mukut, kireedam and kirita for god and goddess idols, with fit based on H x W x D, L-as-height, idol head/face width, depth/diameter, style, tilt direction and placement.
- Merchandising rule applied: smart collection sort is manual, with active in-stock products first, active sold-out products next, then draft/non-active products.

## Deity Hair Crown Visibility Decision Record

For `deity-hair-crown`, the owner confirmed on 2026-05-11 that there are currently no valid customer-ready products in this category.

- Products `DGC-276` and `DGC-277` had wrong crown photos and should not be customer visible.
- All products attached to `deity-hair-crown` were moved to Draft: 12 total, 0 active, 12 draft after cleanup.
- Do not optimize or republish this collection until the owner provides real hair crown/koppu products and photos.
- Keep the category relationship and product records available for future revival, but treat this collection as empty for storefront merchandising.

## Drama and Dance Crowns Decision Record

For `drama-dance-crowns`, the correct model is human performance, not deity-idol ornament use.

- Collection belongs under Bharatanatyam/performance shopping paths, especially Bharatanatyam Jewellery > Dance Accessories. It should not remain in deity crown navigation.
- Product use: adult unisex human performers for Bharatanatyam, Kuchipudi, dance drama and mythological stage roles. Deity names such as Balaji or goddess can be used as stage-role/search context, but the products are not sized as idol crowns.
- Google product category: `5192` (`Apparel & Accessories > Costumes & Accessories > Costume Accessories`).
- Google feed fields: `condition = new`, `custom_product = true`, `age_group = adult`, `gender = unisex`.
- Component rule: each product has one crown. `DGC024` is a drama crown combo with Shanku Chakra and earrings; keep `component_count = 1` for the crown count and explain the combo in `set_items_included`.
- Material rules:
  - `BDC1-BDC4`: `Brass with Gold Plating and stone work`
  - `BDC5-BDC10`: `Cardboard`
  - `BDC11-BDC42`: `Cardboard with kundan stones`
  - `DGC249-DGC252`: `Cardboard`
  - `DGC154-DGC162`: `Cardboard`
  - `DGC024`: material not confirmed yet; do not fill or state a material until the owner confirms it.
- Size model: `Height` means vertical crown height, `Width` means front/head width, and `L` in `L x W x D` means crown height. Fit guidance should mention head placement, hairstyle/bun size, pins, fastening/tying method and stage movement comfort.
- Visibility rule applied: active zero-image drama crown product `DGC162` was moved to Draft. Keep active customer-visible products with real images only.
- Applied confirmed product fields: range type, performance crown ornament type, placement, materials where confirmed, component fields, regional names, fit notes, Google/Merchant costume-accessory category, adult/unisex feed fields, SKU-to-barcode normalization, SEO title/meta description, product descriptions, image alt text and in-stock-first manual ordering.
- Product and collection schema should use performance-crown wording and should not expose `Deity compatibility` labels for this collection.

## Deity Stone Crowns and Premium Crowns Decision Record

For `deity-stone-crowns`, the current safe model is:

- Collection role: `ornament_first`
- Range type: `Deity`
- Ornament type metaobject: `Crown / Mukut / Kireedam`
- Placement: `Head`
- Google product category: `97` (`Religious & Ceremonial > Religious Items`)
- FAQ family: `crown`
- Owner-confirmed material: regular deity stone crowns are `Alloy metal with Gold Plating`. Do not add `Alloy` to customer-facing product titles.
- Owner-confirmed component rule: each product includes one crown only unless the owner explicitly confirms extra included pieces.
- Owner-confirmed size model: `H x W x D` means Height x Width x Diameter/Depth. If a crown size says `L x W x D`, `L` means crown height.
- Owner-confirmed compatibility rule: stone crowns can be used for all god and goddess idols when head size, crown style and placement fit. Deity names in titles/photos can be used as entity/search context without excluding broader compatibility.
- Crown style rule: preserve half crown, full crown, round/full round, Jwala, Vaira Mudi and Andal style signals when present. Left/right tilted crowns are Andal crowns and should be matched carefully by direction and placement.
- Visibility rule: no active zero-image issue remained after audit; zero-image stone crown products were already Draft. Keep no-image crowns out of customer visibility until real product photos are available.
- Applied confirmed product fields: material, component count, set items included, General/Common compatibility, all major deity compatibility refs, crown style where present, available single-value H/W/D metafields, regional names, SEO title/meta description, image alt text, Google/Merchant category, condition, custom-product flag, and removal of wrong age/gender fields.

Premium crown split from `deity-stone-crowns`:

- New collection: `premium-deity-crowns`
- Collection role: premium crown collection under the deity jewellery/crown family.
- Products moved from `deity-stone-crowns`: `DGC018`, `DGC027`, `DGC148`.
- Owner-confirmed premium material rules:
  - `DGC027`: `Impon / Panchaloha`
  - `DGC018`: `Brass`
  - `DGC148`: `Brass`
- Premium product titles should not use `Alloy`.
- Premium collection copy may mention Impon/Panchaloha as part of the collection, but product descriptions/metafields should keep the product-specific material clear.

## Varalakshmi Idols and Dolls Decision Record

For `vara-lakshmi-dolls`, the current safe model is:

- Collection role: `festival`
- Range type: `Varalakshmi Vratham`
- Ornament/product type: `Varalakshmi Idol / Doll`
- Placement: `Pooja mandapam / kalasam area / altar`
- Google product category: `97` (`Religious & Ceremonial > Religious Items`)
- FAQ family: `varalakshmi`
- Owner-confirmed material: sponge body; plastic or wooden base on some idols, wrapped with saree; alloy metal face decorated with stones, kundan and beads; some faces include one gram gold jewellery.
- Owner-confirmed height model: product/variant `Height` means the full finished idol or doll height, including crown, hair and decoration where shown.
- Owner-confirmed included-items rule: full set styles include the visible idol body, face, jewellery pieces, saree/dress, crown and decorations shown in product photos. Do not invent exact separate piece counts beyond the visible setup unless the owner confirms them.
- Feed rule: remove age/gender fields for these pooja idols; use `condition = new`, `custom_product = true`, and Google/Merchant category `97`.
- Component rule: use `component_count = 1` as one idol/doll setup or one doll set as shown in photos, not a guessed count of every decorative piece.
- Regional names include `Varalakshmi idol`, `Varamahalakshmi doll`, `Ammavaru bommai`, `Amman doll`, `Lakshmi idol`, `Lakshmi Devi vigraham`, `Varalakshmi bommai`, `Varamahalakshmi Habba doll`, `Varalakshmi Vratham idol`, and `Lakshmi Amman idol`.
- Special ritual-context product rule: `VVD104` is a Venkateshwara/Balaji idol that may sit beside the Varalakshmi Vratham setup in some family traditions. Keep it in the Varalakshmi idols collection, but set primary deity to `Balaji / Vishnu / Venkateswara / Perumal`.
- Special set rule: `VVD098` is used for Varalakshmi pooja, Ashta Lakshmi worship and Navratri/Dasara display. Keep it in the Varalakshmi idols collection and describe it as an Ashta Lakshmi doll set shown in photos.
- Unclear height rule: if a product has no height variant or has multiple height variants, do not guess `ornament_height_in`; leave the height metafield blank and use fit notes/size confidence until the owner confirms the exact finished height.

## Varalakshmi Parent Collection Decision Record

For `varalakshmi-deity-jewellery`, the current safe model is:

- Collection title: `Varalakshmi Pooja and Deity Jewellery`
- Collection role: `festival`
- Template: `collection.deity-first`
- FAQ family: `varalakshmi`
- Shopping path label: `Varalakshmi Pooja`
- This is a parent/festival shopping path for Varalakshmi Vratham, Varamahalakshmi Vratham, Lakshmi Pooja and Amman alankaram. It may link together dolls/idol sets, decorated faces, hands and legs, Vagamalai/Thomala/Bhujalu, crowns, necklaces, small alankaram accessories and deity decor.
- Collection copy should tell customers to start with full idol/doll height, then check face height and width, crown height and width, hands and legs placement, garland drop, necklace placement and altar decoration space.
- Avoid dated SEO titles such as a specific year unless the owner intentionally creates a seasonal/year landing page.
- Merchandising rule applied: collection sort is manual, active in-stock products with images first, then active sold-out products, then active no-image products, then Draft products.
- Verification after the parent audit pass: `deity-crowns-1`, `deity-necklace`, `varalakshmi-deity-jewellery`, `sacred-sanctum-decor`, and `deity-accessories-nose-rings-mustache-weapons-taira` all had required collection metafields populated, clean collection JSON-LD with zero parse errors, and no in-stock-first merchandising order problems.

## Varalakshmi Doll Faces Decision Record

For `varalakshmi-doll-faces`, the current safe model is:

- Collection role: `festival`
- Range type: `Varalakshmi Vratham / Deity Face`
- Ornament/product type: `Deity Face / Idol Face`
- Placement: `Face / Kalasam / Idol body / Alankaram backdrop`
- Google product category: `97` (`Religious & Ceremonial > Religious Items`)
- FAQ family: `varalakshmi`
- Owner-confirmed active-only rule: ignore existing Draft products as unavailable unless the owner revives them later. Do not optimize draft product content or ask material questions for draft products.
- Visibility rule applied: unavailable active products were moved to Draft: `VL-FACE-009`, `VDF016`, `VL-FACE-006`, `VDF055`, `VL-FACE-007`, `VL-FACE-004`, `VL-FACE-010`, and `VDF008`.
- Owner-confirmed material rule: use the owner-confirmed SKU material list for active products. If material is not in the confirmed list, use material stated in the active product title or variant only; do not infer from old descriptions. Ask the owner if material is still unclear.
- Owner-confirmed material additions on 2026-05-25: `VDF057` is `Brass`; `VDF031_1` is the corrected code for the earlier `VDF0311` issue and its material is `Fiber`.
- Owner-confirmed size model: `Height`, `Length`, and `L` in `L x W` mean vertical face/setup height. `W` means front width, not thickness/depth. This was checked against sample product images with measurement rulers.
- Owner-confirmed included-items rule: each product includes one deity face setup as shown in photos, except `VDF-001`, which is an Ashta Lakshmi 8-face set.
- Special SKU rule: the no-SKU active product `gold-plated-varalakshmi-face-idol-for-puja-decoration` was assigned next collection SKU `VDF057`; SKU is also used as barcode.
- Special product wording rule: `VDF019` is a Buddha face base decorated for Varalakshmi/Ammavaru alankaram. Keep the Buddha-face-base concept clear instead of removing it.
- Deity rule: Vishnu/Balaji, Shiva, Durga and Kali face products may stay in this collection when relevant, but their primary deity refs should match the specific deity while preserving Varalakshmi/Lakshmi/Amman collection context where appropriate.
- Feed rule: remove age/gender fields for these pooja face products; use `condition = new`, `custom_product = true`, and Google/Merchant category `97`.
- Regional names include `Varalakshmi face`, `Varalakshmi doll face`, `Ammavaru face`, `Amman face`, `Lakshmi face`, `Lakshmi Devi face`, `Devi face`, `Mugam`, `Mukham`, `Alankaram face`, `Kalasam face`, and `Ammavari face`.
- Product-page schema rule: active face products use `product.deity-lite` with Product JSON-LD plus face-specific FAQPage JSON-LD covering setup fit, included items, pooja/deity use, measurement, material and size help.

### UCP / Agent Catalog Status: Varalakshmi Doll Faces

Status as of 2026-05-19:

- Shopify Global Catalog / UCP baseline was weak for face discovery: `20/40` top-10 correct and `5/12` top-3 correct across four buyer prompts.
- The worst prompt, `goddess face with size`, returned crowns before cleanup because crown pages truthfully contained `goddess` plus face-fit wording, while face pages did not consistently use `mugham`, `doll face`, and explicit face-size wording.
- Live cleanup completed:
  - 47 active in-stock face products retitled with truthful `Goddess Doll Face Mugham` wording where applicable.
  - 47 face descriptions synced to the new titles and given explicit face-size guidance: compare selected face height/length and front width with kalasam, idol body, doll setup, crown space and nearby jewellery.
  - 105 crown product descriptions/metafields changed from face-heavy crown fit wording such as `face shape` / `head or face area` to crown-specific `head profile` / `idol head area`. This keeps crown fit guidance true while reducing accidental face-query capture.
  - 9 earring descriptions changed from `ears and face area` wording to `ears and side ornament area`, so earrings remain valid for earring queries without stealing face-query intent.
  - `VVD137` full idol set received a clarification that it is a complete Varalakshmi idol/doll setup sold as a finished setup, rather than a separate replacement part.
- Final UCP result after cleanup: `39/40` top-10 correct and `12/12` top-3 correct.
- Remaining imperfection: `VVD137` still appears at rank 7 for `Varalakshmi face for doll`. This is acceptable for now because the top 6 are face/mugham products and `VVD137` is a real Varalakshmi doll/full-set product, not a fake or unrelated result.
- Do not force `VVD137` out with false wording. If further improvement is needed, strengthen separate face products and collection links rather than hiding truthful full-set content.
- 2026-05-25 material and UCP follow-up:
  - Owner confirmed `VDF057` is `Brass`, and corrected `VDF0311` to `VDF031_1` with material `Fiber`.
  - Confirmed-fields pass updated 54 active face products; 15 draft products were skipped; no variant SKU/barcode changes were needed.
  - Immediate UCP dropped to `29/40` top-10 because `goddess face with size` was captured by earring products. The recovery pass cleaned face/earring wording, removed misleading `varalaxmifaces` tags from 82 crown products, and restored final immediate UCP to `38/40` top-10 and `10/12` top-3.
  - Remaining immediate UCP strays: `VVD137` full idol for `Varalakshmi face for doll`, and `DGC054` crown for `goddess face with size`. Both are type-adjacent, not random products. Retest after UCP reindexing before making any further copy changes.
- Evidence files:
  - `tmp/varalakshmi-face-ucp-sprint/ucp-baseline.md`
  - `tmp/varalakshmi-face-ucp-sprint/ucp-final-after-doll-face-refinement.md`
  - `tmp/varalakshmi-face-ucp-sprint/applied-face-title-disambiguation.json`
  - `tmp/varalakshmi-face-ucp-sprint/applied-face-description-sync.json`
  - `tmp/varalakshmi-face-ucp-sprint/applied-crown-face-query-disambiguation.json`
  - `tmp/varalakshmi-face-ucp-sprint/applied-earring-face-query-disambiguation.json`
  - `tmp/varalakshmi-face-ucp-sprint/applied-full-idol-face-query-disambiguation.json`
  - `tmp/varalakshmi-face-ucp-sprint/applied-face-doll-title-refinement.json`
  - `tmp/varalakshmi-face-ucp-sprint/ucp-2026-05-25-final-after-crown-tag-cleanup.md`
  - `tmp/varalakshmi-face-ucp-sprint/applied-misleading-crown-face-tags.json`

## Varalakshmi Hastham and Padam Decision Record

For `hands-legs-for-varalakshmi-idol`, the current safe model is:

- Collection title: `Varalakshmi Hastham and Padam`
- Collection role: `festival`
- Range type: `Varalakshmi Vratham / Deity Hands and Legs`
- Ornament/product type: `Hastham and Padam / Deity Hands and Legs`
- Placement: `Hands / Legs / Idol body / Alankaram setup`
- Google product category: `97` (`Religious & Ceremonial > Religious Items`)
- FAQ family: `varalakshmi`
- Owner-confirmed material rules:
  - Gold plated hands/legs: `Alloy metal with gold plating`
  - Silver plated hands/legs: `Alloy metal with silver plating`
  - Stone Hastham/Padam: `Resin Stone`
  - Cloth hands/legs: `Cloth with sponge fillings`
  - White cloth VHL series: `Sponge with white cloth`
  - Yellow cloth VHL series: `Sponge with yellow cloth`
  - Lotus hands and Balaji Hastham with stones: `Alloy metal with stones`
- Owner-confirmed component rules:
  - `Hastham and Padam`, `Hastam and Padam`, `Hands and Legs`, and `Hands Legs` sets include 4 pieces: two hands and two legs.
  - `Lotus Hands`, `Balaji Hastham`, `Hastham`, `Hands Set`, and `Deity Hands Set` include 2 hands only.
  - `VHL027` is Alloy metal with gold plating and includes two deity hands only.
  - `VHL025` should be moved to Draft and not customer-visible.
- Owner-confirmed size model: `Height` means vertical hand/leg height; `Length` means vertical height/length of the hand or leg piece; `Size in Inches (L x W)` means Length/Height x front width; `W` means front width, not thickness.
- Centimeter size rule: for `Size in cms (L x W)`, keep the cm values in fit notes. Do not convert cm sizes into inch metafields unless the owner confirms a conversion policy later.
- Compatibility rule: keep Varalakshmi, Amman, Vishnu/Balaji and generic deity hand products in one collection for now. Most can be used for god or goddess idols when measured placement fits. Folded Balaji Hastham styles are especially for Balaji/Vishnu/Venkateswara/Perumal; they can be used for other god idols only when the folded-hands style fits.
- Draft rule: skip existing draft products as unavailable unless the owner revives them later.
- Feed rule: remove age/gender fields for these pooja ornament products; use `condition = new`, `custom_product = true`, and Google/Merchant category `97`.
- Regional names include `Varalakshmi hands`, `Varalakshmi legs`, `Varalakshmi hastham`, `Varalakshmi padam`, `Hastham and Padam`, `Hastam Padam`, `Ammavaru hastham`, `Amman hands`, `Lakshmi hands and legs`, `Deity hands`, `Deity legs`, `Lotus hands`, `Balaji hastham`, and `Vishnu hands`.
- Product-page schema rule: active hands/legs products use `product.deity-lite` with Product JSON-LD plus Hastham/Padam-specific FAQPage JSON-LD covering fit, included items, pooja/deity use, measurement, material and size help.

### UCP / Agent Catalog Status: Varalakshmi Hastham and Padam

Status as of 2026-05-19:

- Shopify Global Catalog / UCP baseline was already mostly relevant but still leaked crown/head-ornament products for `goddess hands legs with size`.
- Baseline score: `36/40` top-10 correct and `11/12` top-3 correct.
- Live cleanup completed:
  - 29 active in-stock hands/legs products retitled with truthful Varalakshmi/Goddess intent where applicable.
  - Hands-only products such as `VHL027` preserved as `Deity Hastham`; they were not falsely described as full Hastham/Padam sets.
  - 23 visually verified measurement-image alt updates applied only where ruler/tape or measurement-labelled proof was visible.
  - 29 descriptions synced to the new titles, and Lotus Hands products with visible hand/leg pieces were clarified as `lotus hands and legs hastham padam` where supported by the product photos.
  - Parrot hand ornaments were intentionally skipped in the Hastham/Padam proof-alt pass so they do not get pulled into hands-and-legs buyer prompts.
- Final UCP result after cleanup: `35/40` top-10 correct and `12/12` top-3 correct.
- Interpretation: the one imperfect prompt, `goddess hands legs with size`, returns only five products rather than ten after cleanup, but the visible results are correct and there is no wrong-type leakage. Do not force extra products into that prompt with artificial wording; retest after Shopify/UCP reindexing.
- Evidence files:
  - `tmp/hastham-padam-ucp-sprint/ucp-baseline.md`
  - `tmp/hastham-padam-ucp-sprint/ucp-final-after-description-sync.md`
  - `tmp/hastham-padam-ucp-sprint/applied-hastham-padam-title-disambiguation.json`
  - `tmp/hastham-padam-ucp-sprint/applied-hastham-padam-measurement-alt.json`
  - `tmp/hastham-padam-ucp-sprint/applied-hastham-padam-description-title-sync.json`
  - `tmp/hastham-padam-ucp-sprint/visual-check/contact-sheet.jpg`

## UCP / Agentic Commerce Operating Decisions

Status as of 2026-05-19:

- Treat Shopify Global Catalog / UCP as an agent-facing product discovery channel, not as a reason to publish generic AI content.
- The durable strategy is: make existing product truth machine-readable. Use real titles, product types, descriptions, metafields, image alt text, inventory status and measurement proof; do not create AI slop pages or overclaim product compatibility.
- Product discovery is tested through buyer prompts and scored by whether the top 3 and top 10 results are the correct product type.
- Current completed UCP sprint status:
  - Crowns: reached `10/10` style results in the active prompt set after crown/face disambiguation; requires 48-72 hour stability retest.
  - Short harams: reached `10/10` after removing long-haram leakage and strengthening actual DSN short-haram pages; requires 48-72 hour stability retest.
  - Long harams: reached `10/10` after long-haram disambiguation and measurement-alt hardening.
  - Waist belts / vaddanam: improved to `40/40`; top 3 `12/12`.
  - Earrings: improved from baseline but `jhumki for god idol` remains an honest product gap because `DGE201` / `DGE202` are future/no-real-product items and should not be made live without real product photos.
  - Hastham / Padam: final `35/40`, top 3 `12/12`; no wrong-type leakage.
  - Varalakshmi faces / Mugham: final `39/40`, top 3 `12/12`.
- Inventory truth decision: `DGE201` and `DGE202` must remain unavailable/not live until real products and images exist. Do not use fake product pages, placeholder images or metadata-only launches to satisfy UCP prompts.
- Measurement proof decision: many products already have ruler/tape or measurement-labelled proof in images 2, 3 or 4. Only update alt text after visual confirmation. Do not infer measurement proof from metafields alone.
- Human proof layer decision: Anil's immediate task remains a bounded capture task, not a broad content shoot: 7 crown SKUs need front height, inside width and side depth shots where relevant: `DGC269`, `DGC267`, `DGC272`, `DGC263`, `DGC255`, `DGC259`, `DGC270`.
- Revenue measurement decision: keep UCP prompt scores as a quality proxy, but connect hardened SKUs to Shopify order/revenue and GA4/WhatsApp-click baselines when available. Without revenue linkage, UCP work can look successful while only improving proxy metrics.
- Stability decision: any category marked successful should be retested 48-72 hours later because Shopify/UCP catalog results can shift after reindexing.

## Vagamalai Thomala and Bhujalu Decision Record

For `vagamalai-thomala`, the current safe model is:

- Collection title: `Vagamalai Thomala and Bhujalu`
- Collection role: `festival`
- Range type: `Varalakshmi Vratham / Deity Garland`
- Ornament/product type: `Vagamalai / Thomala / Bhujalu`
- Placement: `Shoulders / chest / idol body alankaram`
- Google product category: `97` (`Religious & Ceremonial > Religious Items`)
- FAQ family: `varalakshmi`
- Owner-confirmed material rules:
  - `DVT001`-`DVT007`: `Cloth, foam, plastic flowers, beads, stones, lace, zari and thread`
  - `DVT008`: `Alloy metal with gold plating`
- Owner-confirmed component rule: each product is a pair of Vagamalai / Thomala / Bhujalu shoulder garland decorations. Use `component_count = 2`.
- Owner-confirmed size model: variant `Height` means the vertical drop or length when the Vagamalai, Thomala or Bhujalu pair is placed on the idol.
- Unclear size rule: `DVT008` has no confirmed height; leave `ornament_height_in` blank and use fit notes/size confidence that ask the customer to check photos.
- Compatibility rule: suitable for all god and goddess idols when shoulder placement and drop fit; especially relevant for Varalakshmi, Lakshmi, Amman and Ammavaru setups.
- Feed rule: remove age/gender fields for these pooja garland products; use `condition = new`, `custom_product = true`, and Google/Merchant category `97`.
- Merchandising rule applied: collection sort is manual, active in-stock products first, then active sold-out products.
- Regional names include `Vagamalai`, `Thomala`, `Bhujalu`, `Varalakshmi Vagamalai`, `Varalakshmi Thomala`, `Amman Thomala`, `Ammavaru Thomala`, `Deity shoulder garland`, `Deity shoulder decoration`, `Alankaram garland`, `Pooja garland`, and `Flower garland for idol`.
- Product-page schema rule: active Vagamalai products use `product.deity-lite` with Product JSON-LD plus Vagamalai/Thomala-specific FAQPage JSON-LD covering fit, included pair, pooja/deity use, measurement, material and size help.

## Deity Small Accessories Decision Record

For these small deity accessory collections, the current safe model is:

- Collections completed: `deity-eyes-for-god-idols-statues`, `waist-belt-vaddanam-jewellery-for-hindu-gods-goddess-1`, `god-goddess-arch`, `deity-god-pustal-tadu-thali-kasulaperu`, `god-deity-pendants`, `buy-stone-nathu-bullaku-nose-rings-for-goddess-amman-jewelry`, `buy-god-mustache-jewellery-deity-mustache-accessories-for-idols`, `god-goddess-weapons`, `buy-deity-taira-idol-sacred-taira-statues-for-pooja-and-worship`, `deity-bindi-tilak-thiruman`, and `stone-shankh-chakra-gold-plated-shanku-chakra-for-vishnu-and-perumal`.
- Collection role: `ornament_first`; template: `collection.deity-ornament-default`; FAQ family: `accessory`.
- Active-only rule: skip existing Draft products as unavailable unless the owner revives them later.
- Visibility rule applied: active zero-image Taira products `GDT004`, `GDT007`, and `GDT012` were moved to Draft.
- Material rules confirmed by owner:
  - Eyes: `Alloy`
  - Waist belts: `Alloy metal with stone work`
  - Arch `GGA001`: `Alloy metal with stone work`
  - Pustal Tadu: `Copper metal with gold plating and stone work`
  - Pendants: `Alloy metal with gold plating and stone work`
  - Nose rings, mustache, weapons, Taira, Bindi/Tilak and Shanku Chakra: `Alloy metal with stone work`
- Component rules confirmed by owner:
  - Eyes: pair of eyes, `component_count = 2`
  - Waist belt, arch, Pustal Tadu, pendant, nose ring, mustache, Taira and Bindi/Tilak: one item, `component_count = 1`
  - Shanku Chakra: pair, `component_count = 2`
  - Weapons: infer from style; Bow and Arrow and Parashu/Vajra are pairs, most single weapons/symbols are one item, and Durga weapon hands are one weapon-hands set as shown.
- Size model confirmed by owner:
  - General `Size in Inches (L x W)`: L means vertical height/length and W means front width.
  - `Size in cms (L x W)`: keep cm values in fit notes; do not convert to inch metafields without owner confirmation.
  - Eyes `Width`: eye width only.
  - Waist belt `Length`: belt length across the idol waist; waist belt `Height`: vertical belt height; waist `L x W` means belt length/across waist x vertical height/front width.
  - Weapons `H x W x D`: Height x Width x Depth.
  - Nose ring one-value size: treat as height/length in fit notes unless a clearer measurement is confirmed.
- Compatibility rules confirmed by owner:
  - Eyes, waist belts, arch, pendants and Taira: all god and goddess idols when size and placement fit.
  - Nose rings: goddess-only.
  - Mustache: god or male-deity idol only.
  - Bindi/Tilak: Balaji/Vishnu Namam is for Balaji/Vishnu/Venkateswara/Perumal; Shanker/Shiva Namam and Tripund styles are for Shiva/Mahadev; other goddess bindis may be goddess-specific when present.
  - Shanku Chakra: Vishnu/Balaji/Venkateswara/Perumal only.
  - Weapons: map by symbol and title/style, such as Trishul for Shiva and Devi/Amman, Veena for Saraswati/Ganesha where stated, Murugan Vel/Seval Kodi for Murugan/Subramanya, Gada for Hanuman, Bansuri/Flute for Krishna, Shatagopam for Vishnu/Balaji/Perumal, Lotus/Parrot/Sword/Durga hands for goddess setups, and general deity weapons only when no specific deity signal exists.
- Canonical metaobject rule: `multi-deity` was created as `All God and Goddess Idols` so common ornaments can receive `primary_deity_ref` and `compatible_deity_refs` instead of leaving references blank.
- Feed rules: use `condition = new`, `custom_product = true`, remove wrong age/gender fields, and use Google product category `97` for religious accessories except waist belts (`169`) and pendants (`192`).
- Product-page schema rule: all active products in these collections use `product.deity-lite` with Product JSON-LD and FAQPage JSON-LD. After completion, 135 active product pages were checked and all 135 had Product JSON-LD plus FAQPage JSON-LD with zero JSON-LD parse errors.
- Product-grid UX rule applied: exact size/height/width/length filters are hidden for these accessory handles in the theme facets so noisy exact variant values do not crowd the collection filters.
- Parent collection updated: `deity-accessories-nose-rings-mustache-weapons-taira` is a broad `Deity Accessories` parent, not only nose rings/mustache/weapons/Taira. It should describe the full accessory family including Bindi/Tilak, Shanku Chakra, eyes and arch pieces, and should use `shopping_path_label = Accessories`.
- Sun/Moon Billai facts confirmed by owner:
  - `DSM001` and `DSM002` material: `Alloy metal with stone work`
  - `DSM001` Sun and Moon Billai is a pair/set of 2 pieces.
  - `DSM002` Moon Billai is one single Moon Billai piece.
  - `Size in cms (L x W)` means Length/height x front width. Keep cm values in fit notes rather than converting to inch metafields.
  - Compatibility: goddess-only, not for god idols.
- Sun/Moon Billai product cleanup completed: product content, metafields, feed fields, image alt text and Product/FAQ schema were updated and verified.

## Deity Decorative Items Decision Record

For `sacred-sanctum-decor`, the current safe model is:

- Collection title: `Deity Decorative Items`
- Collection role: `decor`
- Template: `collection.deity-ornament-default`
- Parent collection includes Banana Trees, Lotus Asana/Peedam and Coconut Stand products.
- Collection-page copy should cover reusable pooja, kalasam, mandapam and altar decor for Varalakshmi Vratham, Lakshmi Pooja, Satyanarayana Pooja and deity altar decoration.
- Collection sort should be manual with active in-stock products first.
- Banana Trees child collection is already clean from the earlier optimization.
- Lotus Asana product facts confirmed by owner:
  - `DGS-012`, `DGS-013`, `DGS-014`, and `DGS-015` material: `Cardboard with velvet cloth`.
  - Each Lotus product includes one Lotus Asana / Peedam, `component_count = 1`.
  - Variant `Length` means across/diameter of the lotus seat, not vertical height.
  - Compatibility: mainly Varalakshmi, Lakshmi, Amman and other goddess idols when base size fits.
  - Google category standardized to `97` as pooja/deity decor.
- Coconut Stand product facts confirmed by owner:
  - `DAC-002` material: `German Silver`.
  - `DAC-013` material: `German Silver`.
  - Each product includes one piece, `component_count = 1`.
  - `DAC-002`: `Length 5.5 in` means vertical stand height; `Width 4 in` means base width.
  - `DAC-013`: `Length 10.5 in` means width, not vertical height.
  - Compatibility: general pooja decor for deity setups.
- Lotus and Coconut Stand product cleanup completed: product content, metafields, feed fields, image alt text and Product/FAQ schema were updated and verified.
- Verification after Decorative Items pass: parent and child collection pages (`deity-accessories-nose-rings-mustache-weapons-taira`, `sacred-sanctum-decor`, `banana-tree-banana-bunches-for-pooja-varamahalakshmi-vratham`, `lotus-asana-deity-peedam-kamal-aasan`, `coconut-stand`) all had `3 ok / 0 bad` collection JSON-LD; 84 unique active product pages had Product JSON-LD and FAQPage JSON-LD with zero JSON-LD parse errors.
