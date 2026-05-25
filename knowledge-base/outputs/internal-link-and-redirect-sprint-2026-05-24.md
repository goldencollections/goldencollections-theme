# Internal Link and Redirect Sprint

Generated: 2026-05-24

## Completed

### Internal links

Added contextual in-stock product links to Shopify collection intro metafields:

| Product | Source collection updated | Target |
| --- | --- | --- |
| BLN028 | `bharatanatyam-long-necklace` | `/products/authentic-bharatanatyam-long-harams-bln-028` |
| BMT032 | `bharatanatyam-maang-tikka-matil` | `/products/bharatanatyam-nethi-chutti-kundan` |
| DSN062 | `deity-short-harams` | `/products/divine-goddess-lakshmi-jewellery-deity-short-haram-dsn-062` |
| GDW004 | `hanuman-anjaneya-deity-jewellery` | `/products/hindu-god-lord-hanuman-gada-mace-weapon-jewellery-gdw-004` |

To make the dance collection intro links render as crawlable HTML, deployed `templates/collection.dance-product-v4.json` to live theme `186459816234` with the existing `collection-seo-intro` section added before the product grid.

To make deity-first landing intro links render as crawlable HTML, deployed `templates/collection.deity-first.json` to live theme `186459816234` with the existing `collection-seo-intro` section added after the hero.

No product data, product inventory, noindex rules, canonicals, or product URLs were changed.

### Redirect

Updated Shopify URL redirect:

| Path | Old target | New target |
| --- | --- | --- |
| `/products/goddess-lakshmi-doll-face` | `/products/lord-vishnu-face-alangaram-tanjore-idol` | `/collections/varalakshmi-doll-faces` |

Reason: no matching active old product was found, and the generic Lakshmi doll face URL is better served by the Varalakshmi/Lakshmi face collection than by a Vishnu/Balaji product.

## Verification

- `/products/goddess-lakshmi-doll-face` now returns `301` to `/collections/varalakshmi-doll-faces`.
- Shopify section rendering confirms the four collection intro sections include the intended product links.
- Some full collection pages were still serving cached HTML immediately after deployment, but the section endpoints rendered the updated content and Shopify Admin confirmed the metafields were updated.

## Search Console

Search Console auth was reconnected after Google OAuth consent.

Validated properties:

- `https://www.goldencollections.com/`
- `http://www.goldencollections.com/`
- `sc-domain:goldencollections.com`

Ran Search Analytics page 2 export:

- Output: `tmp/search-console-page2-goldmine.json`
- Rows: 885

Ran URL Inspection API checks for the affected pages:

| URL | Current GSC coverage | Last crawl |
| --- | --- | --- |
| `/collections/bharatanatyam-long-necklace` | Submitted and indexed | 2026-05-20 |
| `/products/authentic-bharatanatyam-long-harams-bln-028` | Crawled - currently not indexed | 2026-04-24 |
| `/collections/bharatanatyam-maang-tikka-matil` | Submitted and indexed | 2026-05-22 |
| `/products/bharatanatyam-nethi-chutti-kundan` | Submitted and indexed | 2026-05-13 |
| `/collections/deity-short-harams` | Submitted and indexed | 2026-05-22 |
| `/products/divine-goddess-lakshmi-jewellery-deity-short-haram-dsn-062` | Crawled - currently not indexed | 2026-04-23 |
| `/collections/hanuman-anjaneya-deity-jewellery` | Discovered - currently not indexed | not crawled |
| `/products/hindu-god-lord-hanuman-gada-mace-weapon-jewellery-gdw-004` | Submitted and indexed | 2026-05-15 |
| `/products/enchanting-divine-long-haram-limited-edition-dln-103` | Crawled - currently not indexed | 2026-04-25 |
| `/products/goddess-lakshmi-doll-face` | Crawled - currently not indexed | 2026-04-02 |
| `/collections/varalakshmi-doll-faces` | Submitted and indexed | 2026-05-21 |

Key read: BLN028 and DSN062 remain not indexed based on old April crawls, while their source collection pages are indexed. The new internal links should be re-evaluated only after Google recrawls those collection pages/product pages.

The full 26 clean product URL list still needs a fresh GSC Page indexing export or browser extraction because the earlier local report preserved only named examples. Search Console Search Analytics and URL Inspection APIs do not expose the Page indexing example URL list directly.

## Files / API outputs

- `tmp/internal-link-sprint/collection-intros-before.json`
- `tmp/internal-link-sprint/collection-intros-target-before.json`
- `tmp/internal-link-sprint/collection-intros-update-result.json`
- `tmp/internal-link-sprint/goddess-lakshmi-doll-face-redirect-update-result.json`
- `tmp/internal-link-sprint/live-dance-product-v4-template.json`
- `tmp/internal-link-sprint/template-upload-result.json`
- `tmp/internal-link-sprint/gsc-url-inspection-after-auth-2026-05-24.json`
- `tmp/search-console-page2-goldmine.json`
