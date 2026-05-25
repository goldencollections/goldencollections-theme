# Live Store Observations - 2026-05-02

Source: https://www.goldencollections.com/

## Homepage Positioning Observed

- Store name: Golden Collections.
- Primary categories shown on the homepage: Deity Jewellery, Bharatanatyam Jewellery, Kemp Jewellery, Kemp Black Jewellery, Varalakshmi Collections.
- Homepage copy says the business serves temples, classical dancers, and brides across South India.
- Homepage trust sections included some older trust claims that were later corrected by owner-confirmed facts.
- Public contact details shown at the time included WhatsApp/phone `+91 7337294499` and an older support-hours value that is now superseded.
- Stale observation note: owner corrected current store/support timings on 2026-05-20 to Monday-Saturday 11:00 AM IST to 8:30 PM IST, and Sunday 1:00 PM IST to 8:00 PM IST. Use [[../wiki/business-entity.md]] as the current source of truth.

## Main Navigation Observed

- Kemp Jewellery: dance sets, short necklace, long haram, mattal, maang tikka, earrings, headset, vaddanam, accessories.
- Black Kemp Jewellery: dance set, short necklace, long haram, mattal, maang tikka, earrings, headset, oddiyanam, accessories.
- Bharatanatyam Jewellery: adult dance sets, kids dance sets, short necklace, long necklace, ghungroo/salangai, bangles, mattal/matil/mattel, waist belts, headset, maang tikka/nethichutti, earrings/jhumka, nath, baju band, hair accessories, instruments, practice saree.
- Deity/God Jewellery: Varalakshmi idols and faces, hands and legs, vagamalai/thomala, short and long necklaces, gold/stone/hair/drama crowns, earrings, eyes, waist belts, arch, pustal tadu, pendants, nose rings, mustache, weapons, taira, bindi/tilak, shanku chakra, banana trees, lotus, stand.

## Sitemap Observed

Source: https://www.goldencollections.com/sitemap.xml

- Shopify sitemap includes products, pages, collections, and blogs.
- Blog sitemap contains Varalakshmi, Bharatanatyam jewellery, and kemp Bharatanatyam content.
- Local `.tmp_live_collection_handles.txt` contains many collection handles that can support topic clusters.

## Theme Observations

- `layout/theme.liquid` already has a Golden Collections LocalBusiness JSON-LD block.
- `snippets/organization-schema.liquid` contained stale previous-brand entity data before cleanup.
- `templates/page.golden-glossary.liquid` renders glossary entries from `shop.metaobjects.glossary_term`.
- `seed-data/` already contains taxonomy JSONL for ornament types, deity accessories, entity types, idol types, and size compatibility profiles.

## Do Not Publish Until Confirmed

- Exact ownership/leadership names beyond what is already visible in the theme.
- Exact plating thickness by product/range.
- Exact artisan/crafting location model.
- Which products are normal quality range vs real kemp range at SKU level.
