# Search Console Near-Win Audit - 2026-05-17

Source workflow:

- `knowledge-base/wiki/search-console-workflow.md`
- `knowledge-base/outputs/search-console-merchant-priority-action-plan-2026-05-16.md`
- `knowledge-base/ops/knowledge-quality-rules.md`

Source data:

- `tmp/search-console-page2-goldmine.json`
- `tmp/search-console-near-win-grouped-2026-05-17.json`

## Data Window

Search Console export:

- Property: `sc-domain:goldencollections.com`
- Date range: `2026-02-12` to `2026-05-13`
- Dimensions: query + page
- Filter used by export: average position `8` to `25`, impressions at least `20`
- Rows: `902`
- Grouped pages: `234`

## Guardrails

- Do not create duplicate pages for query variants.
- Do not over-optimize generic `1 gram gold` traffic unless the owner confirms that category is a strategic priority.
- Prefer existing money pages and product-family pages.
- Do not publish unverified size, material, heritage, temple/priest, certificate, or official-supplier claims.
- Keep deity/dance/real-kemp/Varalakshmi work ahead of generic jewellery terms.

## Top Near-Win Focus Pages

| Priority | Page | Query Theme | Impressions | Clicks | CTR | Avg. Position | Decision |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| 1 | `/` | Bharatanatyam / dance routing | 16,371 | 175 | 1.07% | 10.29 | Already worked on 2026-05-16; monitor rather than add more homepage copy now. |
| 2 | `/products/divine-goddess-lakshmi-jewellery-deity-long-haram-dln-095` | `lakshmi jewellery` | 1,054 | 0 | 0.00% | 10.40 | Fix routing because this product belongs in the Lakshmi/Amman deity path. |
| 3 | `/collections/kemp-jewellery` | kemp / kempu jewellery | 2,320 | 32 | 1.38% | 9.79 | Already has real-kemp guide links and safe terminology; monitor. |
| 4 | `/products/bharatanatyam-kemp-matil-temple-jewelry-ear-chain-bbm-019` | ear mattal | 179 | 0 | 0.00% | 8.98 | Applied safe Mattal / ear-chain wording and metadata update on 2026-05-17. |
| 5 | `/products/50-bells-ghungroo-kathak-dance-performance` | kathak ghungroo | 3,050 | 12 | 0.39% | 8.82 | Applied safe ghungroo/Kathak wording and metadata update on 2026-05-17. |
| 6 | `/products/enchanting-bharatanatyam-jewellery-set-for-kids-little-gopika` | kids jewellery set | 3,361 | 1 | 0.03% | 13.05 | Applied safe kids/children jewellery wording, collection metadata, and feed age-group correction on 2026-05-17. |
| 7 | `/collections/banana-tree-banana-bunches-for-pooja-varamahalakshmi-vratham` | banana tree decoration / Varalakshmi | 325 | 3 | 0.92% | 9.26 | Good seasonal page; review after proof/Varalakshmi work. |
| 8 | `/collections/bharatanatyam-jewellery-sets` | Bharatanatyam set intent | 1,996 | 22 | 1.10% | 10.07 | Already improved on 2026-05-16; monitor. |

## Applied Action - Lakshmi / Amman Routing

Why this was safe:

- Search Console showed `lakshmi jewellery` with `1,054` impressions, `0` clicks, and average position `10.40`.
- The ranking page is an active product titled `Lakshmi / Amman 3 Step Long Haram DLN095`.
- Shopify product data showed the product was in broad deity and necklace collections, but not in the specific `Lakshmi / Amman Deity Jewellery` collection.
- The existing product title and deity collection model support Lakshmi/Amman routing; no new public claim was invented.

Live Shopify changes applied through `scripts/apply-lakshmi-near-win-routing.mjs --apply`:

- Added product `Lakshmi / Amman 3 Step Long Haram DLN095` to collection `/collections/lakshmi-amman-deity-jewellery`.
- Set product `custom.primary_deity` to `Lakshmi / Amman`.
- Set product `custom.primary_deity_ref` to deity metaobject `varalakshmi-lakshmi-amman`.
- Set product `custom.compatible_deities` to `Varalakshmi / Lakshmi / Amman`.
- Set product `custom.compatible_deity_refs` to deity metaobject `varalakshmi-lakshmi-amman`.

What was not changed:

- No product title, price, inventory, publication, image, sales channel, template, or product description was changed.
- No customer-facing claim about temple approval, official ritual use, certificates, or universal fit was added.

Verification:

- Product collections now include `lakshmi-amman-deity-jewellery`.
- The Lakshmi/Amman collection product list contains the product.
- Product deity metafields read back with the expected metaobject reference.

## Applied Action - Ghungroo / Kathak Routing

Why this was safe:

- Search Console showed strong near-win demand for ghungroo intent already landing on the two ghungroo product pages.
- The `50-bells-ghungroo-kathak-dance-performance` product had about `3,050` impressions, `12` clicks, and average position `8.82` across the page 2 export.
- Its top queries included `kathak ghungroo` with `1,358` impressions at average position `8.51`, and `ghungroo for kathak` with `873` impressions at average position `8.68`.
- The `100-bells-ghungroo-kathak-dance-performance` product had about `2,129` impressions, `10` clicks, and average position `9.84`.
- Its top queries included `kathak ghungroo` with `806` impressions at average position `9.62`, and `ghungroo for kathak` with `727` impressions at average position `9.48`.
- The product handles and existing product tags already supported Kathak intent, while the old product titles/descriptions/metafields mostly said Bharatanatyam/Kuchipudi only.
- The collection `/collections/bharatanatyam-ghungroo` was already receiving regional-name intent such as `chilanga price`, `belt ghungroo`, `bharatanatyam anklets name`, `chilanka online purchase`, and `bharatanatyam gejje in english`.

Live Shopify changes applied through `scripts/apply-ghungroo-near-win-routing.mjs --apply`:

- Updated the `50 Bells` product title to `Bharatanatyam and Kathak Ghungroo Salangai 50 Bells BDG-020`.
- Updated the `100 Bells` product title to `Bharatanatyam and Kathak Ghungroo Salangai 100 Bells BDG-021`.
- Updated both product descriptions to include Bharatanatyam, Kuchipudi and Kathak use cases.
- Updated both product SEO titles and SEO descriptions.
- Set both products' `dance.dance_form_suitable` metafield to `Bharatanatyam`, `Kuchipudi`, and `Kathak`.
- Added product-level regional-name metadata for `ghungroo`, `ghunghroo`, `salangai`, `chilanka`, `chilanga`, `gejje`, `ankle bells`, `dance anklets`, `Kathak ghungroo`, `Bharatanatyam ghungroo`, and `Kuchipudi ghungroo`.
- Updated the ghungroo collection SEO title/description and added the same regional keyword cluster as a collection metafield.
- Updated `scripts/apply-bharatanatyam-accessory-products-content.mjs` so future accessory cleanup passes preserve the Kathak/ghungroo wording instead of reverting it.

What was not changed:

- No price, inventory, image, sales channel, publication status, variant, or product handle was changed.
- No claim was added about exact dancer age, universal fit, guaranteed sound, teacher approval, or official dance-school approval.
- No new duplicate ghungroo collection or page was created.

Verification:

- Shopify read-back confirmed the two products still belong to `/collections/bharatanatyam-ghungroo`.
- Shopify read-back confirmed updated product titles, SEO fields, dance form metadata, size notes, fit notes, and regional names.
- Storefront checks returned `200` for the ghungroo collection and both product URLs.
- Storefront checks found the expected `Kathak`, `chilanga`, and `gejje` wording with no Liquid error marker.

## Applied Action - Mattal / Ear-Chain Routing

Why this was safe:

- Search Console showed near-win Mattal intent already landing on the correct real-kemp Mattal collection and one matching real-kemp product.
- `/collections/kemp-mattal-ear-chains` had `897` impressions, `6` clicks, and average position `9.20`.
- Its top queries included `ear mattal` with `404` impressions, `ear chain mattal` with `213`, `mattal ear chain` with `149`, and `ear mattal in english` with `67`.
- Product `bharatanatyam-kemp-matil-temple-jewelry-ear-chain-bbm-019` had `179` impressions, `0` clicks, and average position `8.98` for `ear mattal`.
- `/collections/mattal-matil-bharatanatyam-dance` also had `312` impressions for `mattal jewellery` at average position `9.12`.
- Shopify read-back showed BBM019 was already in the real-kemp Mattal collection, so this was a wording/metadata alignment problem, not a collection-membership problem.

Live Shopify changes applied through `scripts/apply-mattal-near-win-routing.mjs --apply`:

- Updated product `BBM019` title to `Real Kemp Ear Mattal for Bharatanatyam and Kuchipudi BBM019`.
- Updated product SEO title/description to include `ear mattal` and `mattal ear chain`.
- Updated product description with natural `ear mattal`, `matil`, `mattel`, `ear chain mattal`, and `mattal ear chain` wording.
- Set product `custom.regional_names` with Mattal/Matil/Mattel and ear-chain variants.
- Updated product `dance.fit_notes` and `dance.size_notes` to mention ear-chain comfort and pulling risk.
- Updated `/collections/kemp-mattal-ear-chains` SEO, visible collection description, `collection_intro`, `size_fit_intro`, and `regional_keyword_cluster`.
- Updated `/collections/mattal-matil-bharatanatyam-dance` SEO, visible collection description, `collection_intro`, `size_fit_intro`, and `regional_keyword_cluster`.
- Updated maintenance scripts `apply-real-kemp-products-content.mjs` and `update-dance-collections-seo.mjs` so future cleanup passes preserve this Mattal wording.

What was not changed:

- No price, inventory, product image, variant, product handle, publication status, sales channel, or collection membership was changed.
- No claim was added about exact length, universal fit, guaranteed comfort, teacher approval, or official dance-school approval.
- No duplicate Mattal page was created.

Verification:

- Shopify Admin read-back confirmed updated product title, SEO fields, description, `custom.regional_names`, `dance.fit_notes`, and `dance.size_notes`.
- Shopify Admin read-back confirmed both Mattal collections have updated SEO descriptions and regional keyword clusters.
- Storefront checks returned `200` for the real-kemp Mattal collection, regular Mattal collection, and BBM019 product URL.
- Storefront checks found Mattal/Matil/Mattel and mattal-ear-chain wording with no Liquid error marker.

## Applied Action - Kids Jewellery Set Routing

Why this was safe:

- Search Console showed broad kids-jewellery demand already landing on the Little Gopika product page.
- Product `enchanting-bharatanatyam-jewellery-set-for-kids-little-gopika` had `3,361` impressions, `1` click, and average position `13.05`.
- Top queries included `kids jewellery set` with `3,021` impressions, `children's jewellery set` with `152`, `kids jewellery sets` with `121`, `jewellery set kids` with `37`, and `kids jwellery set` with `30`.
- Shopify read-back showed the product is active, in stock, has images, and is already in `/collections/bharatnatyam-dance-jewellery-kids-collection`.
- This was not a collection-membership problem; it was a search-snippet, customer-language, collection-metadata, and feed-attribute alignment problem.
- The existing Shopify feed field `mm-google-shopping.age_group` was `adult`, even though the product title, collection, tags, and product role clearly identify it as a kids dance jewellery set.

Live Shopify changes applied through `scripts/apply-kids-near-win-routing.mjs --apply`:

- Kept the public product title unchanged: `Kids Bharatanatyam Dance Jewellery Set Little Gopika BDS-039`.
- Updated product SEO title to `Kids Jewellery Set for Bharatanatyam | Little Gopika`.
- Updated product SEO description to include `kids jewellery set`, Bharatanatyam, Kuchipudi, class, school programs, and stage use.
- Updated product description with safe `kids jewellery set`, `children's jewellery set`, and `kids Bharatanatyam jewellery` wording.
- Set product `custom.regional_names` with kids/children/Bharatanatyam/Kuchipudi jewellery search variants.
- Updated product `dance.fit_notes` and `dance.size_notes` to keep the guardrail that parents should compare costume size, height, neckline, hairstyle, photos, and measurements.
- Corrected product `mm-google-shopping.age_group` from `adult` to `kids`.
- Updated `/collections/bharatnatyam-dance-jewellery-kids-collection` SEO title/description, visible collection description, `collection_intro`, `size_fit_intro`, and `regional_keyword_cluster`.
- Updated maintenance scripts `apply-bharatanatyam-dance-sets-content.mjs` and `update-dance-collections-seo.mjs` so future cleanup passes preserve this kids jewellery wording.

What was not changed:

- No price, inventory, image, variant, product handle, publication status, sales channel, or collection membership was changed.
- No exact age range, universal fit, guaranteed child fit, teacher approval, school approval, or official performance claim was added.
- No duplicate kids jewellery page was created.

Verification:

- Shopify Admin read-back confirmed updated product SEO fields, description, `custom.regional_names`, `dance.fit_notes`, `dance.size_notes`, `global.title_tag`, and `mm-google-shopping.age_group = kids`.
- Shopify Admin read-back confirmed the kids collection has updated SEO fields and regional keyword cluster.
- Storefront checks returned `200` for the kids collection and Little Gopika product URL.
- Storefront checks found relevant kids/children/Bharatanatyam/Kuchipudi wording with no Liquid error marker.

## Next Near-Win Candidates

Do next only after this routing change has time to settle:

1. Seasonal Varalakshmi/banana tree page review closer to the next Varalakshmi push.
2. Re-run Search Console near-win export after Google has had time to recrawl the May 16-17 changes.

Do not start a new page batch until the May 17 changes and the May 16 collection changes have had time to show in Search Console.
