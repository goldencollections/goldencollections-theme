# Deity Waist Belt / Vaddanam UCP Sprint Report

Created: 2026-05-19

Scope: Deity vaddanam, oddiyanam, waist belt and kamarband products for Varalakshmi, Lakshmi / Amman, goddess and god idol dressing.

## Priority Rationale

This category was selected after Hastham Padam because the baseline showed a high-value Varalakshmi query leaking entirely into full idol sets instead of waist belts:

- `deity waist belt for idol`: top 3 `3/3`, top 10 `10/10`
- `vaddanam for god idol`: top 3 `3/3`, top 10 `10/10`
- `goddess waist belt with size`: top 3 `3/3`, top 10 `10/10`
- `Varalakshmi vaddanam for pooja idol`: top 3 `0/3`, top 10 `0/10`

Overall baseline: top 3 `9/12`; top 10 `30/40`.

The failure mode was not lack of products. It was missing Varalakshmi / Goddess disambiguation on real waist-belt products, allowing UCP to return Varalakshmi Amman idols and full sets for a vaddanam query.

## Truth Guardrails

- Do not position Varalakshmi idols, faces, or full sets as vaddanam products.
- Do not claim universal fit. Fit language remains tied to exact waist length, idol posture, waist placement, dress/saree volume, nearby jewellery, and product photos.
- Do not invent measurement proof. Measurement alt updates were limited to reviewed image 2 assets with visible dimension label and/or ruler proof.
- Do not hide stock constraints. Most top DWB products have shallow inventory and should be monitored before scaling traffic.

## Shopify Data Fixes Applied

Applied files:

- `tmp/deity-waist-belt-ucp-sprint/applied-varalakshmi-waist-belt-disambiguation.json`
- `tmp/deity-waist-belt-ucp-sprint/applied-waist-belt-measurement-alt-updates.json`

The changes were product-truth preserving:

- In-stock DWB products were retitled from `Deity Vaddanam Waist Belt with Stone Work DWB-xxx` to `Deity Vaddanam Waist Belt for Varalakshmi / Goddess Idol with Stone Work DWB-xxx`.
- `custom.regional_names` was expanded with terms such as Vaddanam, Oddiyanam, Waist Belt, Kamarband, Kati Sutra, Deity waist ornament, Goddess waist belt, Varalakshmi vaddanam, Lakshmi vaddanam, Amman vaddanam, and Ammavaru vaddanam.
- SEO title and description metafields were updated to say these are for Varalakshmi, Lakshmi / Amman and other god or goddess idols, with size/photo checks before ordering.
- Image 2 alt text was updated for approved top-result DWB products where the visual-check contact sheet showed measurement proof.

## UCP Scorecard

Baseline file:

- `tmp/next-category-ucp-baseline/next-category-ucp-baseline.md`

Final retest files:

- `tmp/deity-waist-belt-ucp-sprint/ucp-final.md`
- `tmp/deity-waist-belt-ucp-sprint/ucp-final.json`

Final score:

| Prompt | Top 3 | Top 10 | Status |
| --- | ---: | ---: | --- |
| deity waist belt for idol | 3/3 | 10/10 | Clean |
| vaddanam for god idol | 3/3 | 10/10 | Clean |
| goddess waist belt with size | 3/3 | 10/10 | Clean |
| Varalakshmi vaddanam for pooja idol | 3/3 | 10/10 | Clean; fixed prior full-idol leakage |

Overall final: top 3 `12/12`; top 10 `40/40`.

## get_product Checks

UCP `catalog get_product --refresh` checks were run against top winners:

| Product | Variant checked | Evidence from get_product |
| --- | --- | --- |
| `DWB-007` | `gid://shopify/ProductVariant/47564091982122` | Live product, selected variant available, SKU returned, `10 Inches` waist-belt length, White Stones, price INR 853, image media, collection membership in `waist-belt-vaddanam-jewellery-for-hindu-gods-goddess-1`, deity waist belt/vaddanam copy, material `Alloy metal with stone work`, and exact-size fit caveats. |
| `DWB-028` | `gid://shopify/ProductVariant/47564101058858` | Live product, selected variant available, SKU returned, `24 Inches` waist-belt length, White & Green & Maroon Stones, price INR 1453, image media, collection membership, and confirmed belt-length guidance. |
| `DWB-012` | `gid://shopify/ProductVariant/47564092440874` | Live product, selected variant available, SKU returned, `21 Inches` waist-belt length, White & Green & Pink Stones, price INR 5503, image media, collection membership, and confirmed belt-length guidance. |
| `DWB-005` | `gid://shopify/ProductVariant/47564088803626` | Live product, selected variant available, SKU returned, `9 Inches` waist-belt length, White & Red Stones, price INR 853, image media, collection membership, and confirmed belt-length guidance. |

## Remaining Gaps

- Product body descriptions returned by `get_product` still begin with the older shorter title pattern for checked DWB products, even though product titles, SEO metafields, regional names and UCP results are clean. This is a good future cleanup, but it is not blocking current UCP top-3/top-10 readiness.
- UCP `get_product` often returns the first media image, while measurement proof alt updates were applied to image 2 after visual review. Keep measurement claims tied to the applied alt/update files and visual-check contact sheet, not to whichever single image UCP returns first.
- Inventory is shallow on many DWB winners. Several top products have inventory `1`, with only a few deeper-stock options. Stock depth should be watched before routing more agent traffic to this category.

## Revenue And Measurement Baseline

Track this prompt group with:

- UCP top 3 and top 10 correctness for the four prompts above.
- Count of top winners with approved measurement-image alt proof.
- GA4 add-to-cart events for `DWB-007`, `DWB-028`, `DWB-012`, `DWB-011`, `DWB-002`, `DWB-005`, `DWB-025`, `DWB-004`, `DWB-006`, `DWB-014`, `DWB-017`, `DWB-022`, and `DWB-023`.
- WhatsApp/manual fit-help questions mentioning waist length, belt placement, idol posture, saree/dress volume, or nearby jewellery clearance.
- Orders and revenue for the DWB prompt set over 7-day and 14-day windows after 2026-05-19.

## Next Action

This category is clean for UCP top-3 and top-10 retrieval. Revisit product body title sync and stock depth after higher-leakage categories are handled.
