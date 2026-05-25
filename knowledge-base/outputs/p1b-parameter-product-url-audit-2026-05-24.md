# P1b Parameter Product URL Audit - 2026-05-24

## Scope

Audited the live Golden Collections storefront for crawlable product links that still emit URL parameters such as:

- `pr_*`
- `variant`
- `currency`
- `_pos`
- `_psq`
- `_ss`
- `_v`

The audit focused on current live emission, not historical URLs already stored in Google Search Console.

No robots rules, no noindex rules, no canonical tags, no redirects, and no product data were changed.

## Evidence Files

- Live page and endpoint audit: `tmp/p1b-param-url-audit-2026-05-24/live-param-url-audit.json`
- Live audit summary: `tmp/p1b-param-url-audit-2026-05-24/live-param-url-summary.json`
- Recommendation endpoint audit: `tmp/p1b-param-url-audit-2026-05-24/recommendations-param-url-audit.json`
- Browser-rendered collection DOM check: `tmp/p1b-param-url-audit-2026-05-24/p1b-dynamic-collection-param-check.json`
- Browser-rendered search DOM check: `tmp/p1b-param-url-audit-2026-05-24/p1b-dynamic-search-param-check.json`
- Browser-rendered product DOM check: `tmp/p1b-param-url-audit-2026-05-24/p1b-dynamic-product-param-check.json`

## Live Rendered Results

Primary live sweep:

- Pages/endpoints checked: 22
- Crawlable product `href`s with tracked parameters: 0
- Raw `/products/...?...` occurrences with tracked parameters in rendered HTML: 0

Recommendation endpoint sweep:

- Endpoints checked: 12
- Related-product endpoints returning product links: 5
- Complementary-product endpoints returning product links: 0 in this sample
- Crawlable product `href`s with tracked parameters: 0

Browser-rendered DOM checks:

| Surface | Product hrefs | Unique product hrefs | Bad parameter hrefs |
|---|---:|---:|---:|
| `bharatanatyam-long-necklace` collection | 51 | 26 | 0 |
| Search results for `bharatanatyam` | 48 | 24 | 0 |
| DSN062 product page | 236 | 4 | 0 |

## Surfaces Covered

Checked live/storefront-rendered examples for:

- Homepage product-card surfaces.
- Collection product grids.
- Search results.
- Predictive search endpoint output.
- Product pages.
- Related-products recommendation endpoints.
- Complementary recommendation endpoint requests.
- Product-card snippet output through collection, search, and recommendation-rendered pages.

No current recently-viewed product widget was found in the active theme code. The theme contains product recommendation components, but not a recently-viewed product surface that emits product links from browsing history.

## Theme Code Findings

The earlier P1 patches are present:

- `snippets/card-product.liquid` assigns `card_product_url = card_product.url | split: '?' | first`.
- Crawlable product-card anchors now use `card_product_url`.
- Quick-add product URL data attributes in `card-product.liquid` also use the cleaned `card_product_url`.
- `sections/predictive-search.liquid` assigns `predictive_product_url = product.url | split: '?' | first` and uses it for product anchors.
- `sections/main-search.liquid` renders products through `card-product`.
- `sections/related-products.liquid` renders recommendations through `card-product`.

`product-info.js` can still update the browser URL to `?variant=...` after a shopper changes variants on a product page. That is an interactive browser-history behavior, not a crawlable product `href` in rendered HTML, and it was intentionally not changed in this sprint.

## Decision

No additional theme patch was applied because the current live storefront did not emit crawlable product links with the tracked parameters in the audited surfaces.

The likely explanation for the 948 parameterized product URLs in the GSC sample is historical discovery from older product-card, recommendation, predictive-search, search, and Shopify-generated recommendation URLs. The already deployed P1 and predictive-search cleanups appear to be preventing new crawlable emissions in the sampled live storefront.

## Follow-Up

Monitor Search Console over the next recrawl cycle. The old parameter URLs will not disappear immediately; Google needs time to recrawl clean internal links and consolidate historical URL variants.

Next useful check: rerun this same live audit after the next major theme deployment or after Search Console shows a meaningful drop in the parameterized examples.
