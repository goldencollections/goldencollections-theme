# Clean Product Indexing Audit

Generated: 2026-05-22

Scope: clean product URLs from the `Crawled - currently not indexed` pattern audit, using the named examples preserved in `gsc-crawled-not-indexed-pattern-audit-2026-05-22.md`.

## Executive read

The clean product sample does not show a broad technical indexability problem. The live product pages audited are generally:

- HTTP 200
- self-canonical
- not blocked by `robots` meta
- present in the Shopify product sitemap, where the product still exists
- rendering Product JSON-LD and breadcrumbs

So the next move should not be bulk noindexing, canonical changes, or redirects for valid products. The right next move is selective improvement: strengthen internal links and product-quality signals for in-stock products, deprioritize out-of-stock low-demand products, and fix the one clearly mismatched old redirect after owner review.

## Constraint

Search Console URL Inspection API could not be refreshed because the local Google token is revoked:

`Search Console token refresh failed HTTP 400: invalid_grant`

That means this report uses live site checks, Shopify Admin data, sitemap checks, prior GSC pattern exports, and existing local audits. Reconnect Search Console before requesting live validation or re-exporting the complete 26 clean product examples.

## Audited URLs

| URL / handle | Live result | Shopify status | Inventory | Sitemap | Main finding |
| --- | --- | --- | ---: | --- | --- |
| `enchanting-divine-long-haram-limited-edition-dln-103` | 200, self-canonical | ACTIVE | 0 | yes | Indexable technically, but out of stock and lower priority. Do not push until restocked or intentionally kept as a reference page. |
| `authentic-bharatanatyam-long-harams-bln-028` | 200, self-canonical | ACTIVE | 103 | yes | Good candidate. In stock with improved description/schema. Needs stronger internal links and one Shopify image alt cleanup. |
| `divine-goddess-lakshmi-jewellery-deity-short-haram-dsn-062` | 200, self-canonical | ACTIVE | 1 | yes | Good candidate but low inventory. Merchant feed has age/gender warnings; organic page itself is technically fine. |
| `goddess-lakshmi-doll-face` | redirects to Vishnu/Balaji face | no matching product | n/a | no | The redirect is semantically mismatched. Old Lakshmi face URL currently lands on a Vishnu product. |
| `lord-vishnu-face-alangaram-tanjore-idol` | 200, self-canonical | ACTIVE | 1 | yes | Redirect target is valid by itself, but not a good semantic target for a Lakshmi doll face URL. |
| `hindu-god-lord-hanuman-gada-mace-weapon-jewellery-gdw-004` | 200, self-canonical | ACTIVE | 4 | yes | Technically strong. Merchant Center has identity/belief policy disapprovals, which is a paid/Shopping issue rather than an organic indexing blocker. |
| `bharatanatyam-nethi-chutti-kundan` | 200, self-canonical | ACTIVE | 198 | yes | Good candidate. In stock, but only one product image; strengthen internal links and add another useful product/detail/measurement image when available. |

## Internal link check

Products are in relevant Shopify collections, but several only appear on deeper paginated collection pages:

| Handle | Strongest found collection page |
| --- | --- |
| `enchanting-divine-long-haram-limited-edition-dln-103` | `deity-long-harams?page=11` |
| `authentic-bharatanatyam-long-harams-bln-028` | `bharatanatyam-long-necklace?page=2` |
| `divine-goddess-lakshmi-jewellery-deity-short-haram-dsn-062` | `deity-short-harams?page=4` |
| `lord-vishnu-face-alangaram-tanjore-idol` | `varalakshmi-doll-faces?page=2` |
| `hindu-god-lord-hanuman-gada-mace-weapon-jewellery-gdw-004` | `god-goddess-weapons` page 1 |
| `bharatanatyam-nethi-chutti-kundan` | `bharatanatyam-maang-tikka-matil?page=2` |

This is not a crawl block, but it is a weak priority signal for some valid products. Google can discover the links, but page-1 collection links, guide links, and topical collection copy links are stronger signals.

## Recommended actions

1. Reconnect Search Console and export the full 26 clean product URLs.
   The local report preserved examples and patterns, not the full URL list. Re-export before making decisions across all 26.

2. Do not bulk noindex or canonicalize valid products.
   The audited valid products are indexable. A bulk noindex would damage potentially useful inventory pages.

3. Fix the semantically wrong redirect after owner review.
   `goddess-lakshmi-doll-face` currently redirects to `lord-vishnu-face-alangaram-tanjore-idol`. Better targets are likely the active Varalakshmi/Lakshmi face collection or a specific active Lakshmi face product, but that should be confirmed before changing the redirect.

4. Strengthen internal links for in-stock clean products.
   Add selective links from relevant guide/collection copy or curated collection blocks to:
   - `authentic-bharatanatyam-long-harams-bln-028`
   - `bharatanatyam-nethi-chutti-kundan`
   - `divine-goddess-lakshmi-jewellery-deity-short-haram-dsn-062`, if inventory will remain available
   - `hindu-god-lord-hanuman-gada-mace-weapon-jewellery-gdw-004`

5. Product-quality fixes, not theme fixes:
   - `BLN028`: fill the second Shopify image alt with a specific long-haram description.
   - `BMT032`: add another real detail or measurement image when available.
   - `DSN062`: resolve Merchant Center age/gender warnings if using Shopping/free listings.
   - `DLN103`: leave alone unless restocked; it is out of stock and not a strong indexing push candidate today.

## Files created

- Raw live + Shopify audit: `tmp/clean-product-indexing-audit/live-shopify-audit.json`
- Summary: `tmp/clean-product-indexing-audit/live-shopify-audit-summary.json`
- Diagnostic rows: `tmp/clean-product-indexing-audit/diagnostic-rows.json`
- Collection link checks: `tmp/clean-product-indexing-audit/collection-pagination-link-presence.json`

