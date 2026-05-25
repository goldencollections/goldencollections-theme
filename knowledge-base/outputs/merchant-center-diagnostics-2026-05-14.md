# Merchant Center Diagnostics - 2026-05-14

Backlinks: [[../wiki/merchant-center-workflow.md]], [[../wiki/product-upload-workflow.md]], [[../wiki/collection-optimization-playbook.md]]

## Summary

- Merchant account: `767542510` / Golden Collections.
- Products read through Merchant API: `5659`.
- Product issue rows exported: `17063`.
- Aggregate status rows: `188`.
- Account-level issues: `0`.
- Script errors: `0`.

No account-level issue was returned by the Merchant API. The current work is product/feed quality.

## Visibility Contexts

| Context | Countries | Active Max | Disapproved Max | Expiring Max |
| --- | ---: | ---: | ---: | ---: |
| LOCAL_INVENTORY_ADS | 1 | 2659 | 13 | 0 |
| FREE_LOCAL_LISTINGS | 1 | 2659 | 13 | 0 |
| SHOPPING_ADS | 93 | 2851 | 125 | 3 |
| FREE_LISTINGS | 93 | 2852 | 133 | 3 |

## Top Product Issues

| Severity | Issue | Attribute | Unique Offers | Description |
| --- | --- | --- | ---: | --- |
| DISAPPROVED | item_missing_required_attribute | image link | 112 | Missing product image |
| DISAPPROVED | landing_page_error | link | 22 | Product page unavailable |
| DISAPPROVED | attribute_pending_review | image link | 10 | Image under review |
| DISAPPROVED | local_requirements_policy_violation |  | 9 | Local Requirements |
| DISAPPROVED | identity_and_belief_policy_violation |  | 9 | Personalized advertising: Identity and belief |
| DISAPPROVED | local_stores_lack_supported_inventory |  | 8 | Missing inventory data |
| DISAPPROVED | missing_shipping_weight | shipping weight | 8 | Missing shipping weight [shipping_weight] |
| DISAPPROVED | price_mismatch | price | 3 | Mismatched product price |
| DISAPPROVED | live_animals_policy_violation |  | 3 | Sale of live animals |
| DISAPPROVED | alcohol_policy_violation |  | 2 | Alcoholic beverages |
| DISAPPROVED | image_unwanted_overlays | image link | 2 | Promotional overlay on image |
| DISAPPROVED | legal_restrictions_policy_violation |  | 2 | Personalized advertising: legal restrictions |
| DISAPPROVED | non_product_data | title | 1 | Additional text found |
| DEMOTED | missing_item_attribute_for_product_type | age group | 654 | Missing age group |
| NOT_IMPACTED | missing_item_attribute_for_product_type | age group | 627 | Missing age group |
| NOT_IMPACTED | price_updated | price | 290 | Automatic updates: Mismatched price |
| NOT_IMPACTED | invalid_enum_value | age group | 110 | Invalid value [age_group] |
| NOT_IMPACTED | missing_potentially_required_attribute | unit pricing measure | 87 | Missing unit pricing measure |
| NOT_IMPACTED | availability_updated | availability | 74 | Automatic updates: Mismatched availability |
| NOT_IMPACTED | image_too_small_for_high_resolution | image link | 26 | Image too small for upcoming enforcement |

## Fix Priority

1. Fix disapproved products with missing product images first. This affects 112 unique offers and directly blocks visibility.
2. Fix product page unavailable errors next. This affects 22 unique offers and usually means unpublished/deleted products, redirect problems, or crawler access problems.
3. Fix price mismatch products. The hard disapproval affects 3 unique offers, while automatic price updates indicate a larger feed/store sync issue.
4. Fix availability mismatch products. Automatic availability updates affect 74 unique offers and should be cleaned at the Shopify/feed source.
5. Fix age group values only after checking the feed source. Missing or invalid age group affects many products but is usually less urgent than disapprovals.
6. Improve image quality and image size after the blocking issues. This includes clean non-watermarked Merchant images where needed.
7. Review likely policy false positives such as alcohol, live animals, identity/belief, and local requirements. These look like classification problems for deity/dance products and may need title/category cleanup plus review requests.

## Files

- Raw diagnostics: `C:\goldencollections-theme\tmp\merchant-diagnostics.json`
- Product issue JSON: `C:\goldencollections-theme\tmp\merchant-product-issues.json`
- Product issue CSV: `C:\goldencollections-theme\tmp\merchant-product-issues.csv`

## Next Step

Use the product issue CSV to fix the first batch of missing images and product page unavailable errors at the Shopify/feed source. Do not use Merchant API product writes until the current feed source and Shopify Google app behavior are fully understood.

## Missing Image Deep Dive

Codex audited all 112 missing-image offers against Shopify on 2026-05-14.

Result:

- 102 offers are draft Shopify products with zero Shopify product images.
- 10 offers are active Shopify products with images, but the Merchant offer points to a variant ID that no longer exists in Shopify.
- 0 offers looked like a simple "variant exists and can inherit first product image" fix.

Interpretation:

- This is primarily stale/feed-source hygiene, not a simple image-alt or variant-image assignment issue.
- The first fix should not be bulk assigning images.
- The safer fix is to remove or refresh stale Merchant items from the Google/YouTube feed source, make sure draft products are not sent to Merchant Center, and resync the active Shopify products.

Audit file:

- `C:\goldencollections-theme\tmp\merchant-missing-image-shopify-audit.json`

## Product Page Unavailable Deep Dive

Codex audited all 22 `landing_page_error` offers against Shopify on 2026-05-14.

Result:

- 15 offers are draft Shopify products.
- 7 offers are not in the normal Shopify feed ID shape and appear to be stale/non-Shopify Merchant items.
- 0 active Shopify products in this set had a missing current variant in the audit.

Interpretation:

- The product-page-unavailable issue is also mostly stale/feed-source cleanup.
- The first fix should be to remove draft/stale items from the Merchant feed source or force a clean resync, not rewrite live collection/product copy.

Audit file:

- `C:\goldencollections-theme\tmp\merchant-landing-page-error-shopify-audit.json`

## Issue Samples

### DISAPPROVED: item_missing_required_attribute

- Attribute: `image link`
- Unique offers: `112`
- Description: Missing product image
- Sample: `shopify_IN_8833645576490_47467142578474` / SKU `DGC209` / Indian Traditional Gold Plated Mukut Kireedam - Shop Now - DGC-209
- Sample: `shopify_IN_8420794695978_50823147487530` / SKU `GDT004` / Sacred Deity Taira for Hindu Gods - GoldenCollections GDT-004
- Sample: `shopify_IN_8396754551082_50823087948074` / SKU `DGE029` / Deity Karna Pathakam Earrings DGE029

### DISAPPROVED: landing_page_error

- Attribute: `link`
- Unique offers: `22`
- Description: Product page unavailable
- Sample: `shopify_IN_8833646952746_47467140710698` / SKU `DGC205` / Traditional Gold Plated Deity Crown Kireedam - Buy Now - DGC-205
- Sample: `shopify_IN_8352460931370_50935487496490` / SKU `DGC025-7` / Kreedam for Devi Amman Alankaram Decorations - GoldenCollections DGC-025 6 x 7 x 4.5 Right / Andal Half Round / Gold
- Sample: `shopify_IN_9709252313386_49956220797226` / SKU `VHL025` / Gold Plated Deity Hands Set | Hands with Accessories for Alankaram

### DISAPPROVED: attribute_pending_review

- Attribute: `image link`
- Unique offers: `10`
- Description: Image under review
- Sample: `shopify_IN_8354229977386_49783583965482` / SKU `DGC052-2` / Ornate Crown for Deity - GoldenCollections DGC-052 5.5 x 5 x 4 / Green / Half Round
- Sample: `shopify_IN_8832951386410_50807656612138` / SKU `DLN045` / Deity Long Haram - GoldenCollections DLN-045
- Sample: `shopify_IN_8354200682794_49783260152106` / SKU `DGC111` / Divine Crown for Hindu Goddess - GoldenCollections DGC-111

### DISAPPROVED: local_requirements_policy_violation

- Attribute: `none`
- Unique offers: `9`
- Description: Local Requirements
- Sample: `shopify_IN_8833646723370_47467140841770` / SKU `DGC236` / Sacred Amman Gold Plated Kireedam Crown - GoldenCollections - DGC-236
- Sample: `shopify_IN_8833645510954_47467142611242` / SKU `DGC244` / Indian Traditional Gold Plated God Mukut - Buy Online - DGC-244
- Sample: `shopify_IN_8833646788906_47467140809002` / SKU `DGC216` / Shop Exquisite Gold Plated Deity Crown Mukut - DGC-216

### DISAPPROVED: identity_and_belief_policy_violation

- Attribute: `none`
- Unique offers: `9`
- Description: Personalized advertising: Identity and belief
- Sample: `shopify_IN_9301814313258_48704549355818` / SKU `VDF019` / Brass Buddha Head | Goddess Varalakshmi Ammavaru Face for Pooja
- Sample: `shopify_IN_9703367147818_49938375672106` / SKU `GDW045-1` / Divine Trishul for Shiva & Amman by GoldenCollections 12 x 1.8 / Multi / Trishul
- Sample: `shopify_IN_8427712905514_49936004350250` / SKU `GDW004-3` / Hindu God Lord Hanuman Gada Mace Weapon Jewellery GDW-004 20 x 8 / Multi / Half Gada

### DISAPPROVED: local_stores_lack_supported_inventory

- Attribute: `none`
- Unique offers: `8`
- Description: Missing inventory data
- Sample: `53369d49-5727-464d-959d-ffd964474fb9` / Exquisite Bharatanatyam Dance Jewellery Set - Golden Colle
- Sample: `e6a2f95d-c2cb-4953-9a22-a52c14cdf707` / Elegant Mango Bharatanatyam Dance Jewellery Set - Golden C
- Sample: `9b25ed41-4c8f-4efd-827b-902997d2d7ca` / Exquisite Bharatanatyam Dance Jewellery Collection Online

### DISAPPROVED: missing_shipping_weight

- Attribute: `shipping weight`
- Unique offers: `8`
- Description: Missing shipping weight [shipping_weight]
- Sample: `11743088990781154912` / Hindu Goddess Earrings - Elegant Ear Jewels - GoldenCollections DGE-020
- Sample: `14733973445686038395` / Online: Gold Plated Sacred Goddess Amman Kireedam Crown - DGC-240
- Sample: `2870116001895747109` / Andal Hair Crown Perfect for Pooja and Vratham Ceremonies DGC-282

### DISAPPROVED: price_mismatch

- Attribute: `price`
- Unique offers: `3`
- Description: Mismatched product price
- Sample: `shopify_IN_9981578182954_50954147103018` / SKU `BHA072` / Circular Kemp Rakodi for Bharatanatyam | Golden Collections
- Sample: `shopify_IN_8420123148586_47467223777578` / Amman Hands Legs Ornaments GoldenCollections VHL 016
- Sample: `shopify_IN_8348600926506_49766048399658` / SKU `DSN022` / Jewellery for God Statues - GoldenCollections DSN-022

### DEMOTED: missing_item_attribute_for_product_type

- Attribute: `age group`
- Unique offers: `654`
- Description: Missing age group
- Sample: `shopify_IN_8794213351722_47112262517034` / Bharatanatyam Temple Jewelry Vaddanam - GoldenCollections BWB-015
- Sample: `shopify_IN_8794675577130_47113802088746` / Bharatanatyam Long Chain - Traditional Indian Dance Jewelry BLN-004
- Sample: `shopify_IN_8829579624746_50816681804074` / SKU `DSN061` / Deity 2 Step Short Haram DSN061

### NOT_IMPACTED: missing_item_attribute_for_product_type

- Attribute: `age group`
- Unique offers: `627`
- Description: Missing age group
- Sample: `shopify_IN_8794213351722_47112262517034` / Bharatanatyam Temple Jewelry Vaddanam - GoldenCollections BWB-015
- Sample: `shopify_IN_8794675577130_47113802088746` / Bharatanatyam Long Chain - Traditional Indian Dance Jewelry BLN-004
- Sample: `shopify_IN_8829579624746_50816681804074` / SKU `DSN061` / Deity 2 Step Short Haram DSN061

### NOT_IMPACTED: price_updated

- Attribute: `price`
- Unique offers: `290`
- Description: Automatic updates: Mismatched price
- Sample: `shopify_IN_8794213351722_47112262517034` / Bharatanatyam Temple Jewelry Vaddanam - GoldenCollections BWB-015
- Sample: `shopify_IN_8794675577130_47113802088746` / Bharatanatyam Long Chain - Traditional Indian Dance Jewelry BLN-004
- Sample: `shopify_IN_8832951583018_49759753797930` / SKU `DLN033` / Goddess Lakshmi Long Necklace - GoldenCollections DLN-033

### NOT_IMPACTED: invalid_enum_value

- Attribute: `age group`
- Unique offers: `110`
- Description: Invalid value [age_group]
- Sample: `shopify_IN_8794213351722_47112262517034` / Bharatanatyam Temple Jewelry Vaddanam - GoldenCollections BWB-015
- Sample: `shopify_IN_8794675577130_47113802088746` / Bharatanatyam Long Chain - Traditional Indian Dance Jewelry BLN-004
- Sample: `shopify_IN_9029206376746_50001296818474` / Bangles for Bharatanatyam: Gold Plated Bangles for Girls and Women 2:2

### NOT_IMPACTED: missing_potentially_required_attribute

- Attribute: `unit pricing measure`
- Unique offers: `87`
- Description: Missing unit pricing measure
- Sample: `shopify_IN_9694217011498_49958810386730` / SKU `DGT005-11` / Vishnu mark - GoldenCollections DGT-005 1.25 x 0.75 / Multi / Balaji Namam
- Sample: `shopify_IN_9329513660714_48795457225002` / SKU `BPS002` / Bharatanatyam Dance Practice Saree | Kuchipudi Cotton Practice Saree Blue/Red / cotton
- Sample: `shopify_IN_9286035734826_48662595731754` / SKU `BHA-076` / Mifi Panstick Makeup Paste for Bharatanatyam, Kuchipudi & Arangetram 27 - Medium Tan

### NOT_IMPACTED: availability_updated

- Attribute: `availability`
- Unique offers: `74`
- Description: Automatic updates: Mismatched availability
- Sample: `shopify_IN_8832951583018_49759753797930` / SKU `DLN033` / Goddess Lakshmi Long Necklace - GoldenCollections DLN-033
- Sample: `shopify_IN_8881583817002_49918511939882` / SKU `DLN169` / Temple Deity Necklace - Shop Deity Jewellery Online DLN-169
- Sample: `shopify_IN_8881578049834_49759736693034` / SKU `DLN097` / Divine Radiance Long Haram - GoldenCollections DLN-097
