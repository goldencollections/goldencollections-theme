# GA4 Revenue Snapshot - 2026-05-14

Backlinks: [[../wiki/google-analytics-workflow.md]], [[../wiki/search-console-workflow.md]], [[../wiki/merchant-center-workflow.md]]

## Summary

First GA4 API revenue report for Golden Collections.

- GA4 property: `387291046` / `goldencollections - GA4`.
- Date range: roughly last 90 days through yesterday.
- Dimensions: `landingPagePlusQueryString`, `sessionDefaultChannelGroup`.
- Metrics: `sessions`, `totalUsers`, `transactions`, `purchaseRevenue`, `totalRevenue`.
- Full row count: `26213`.
- Returned rows saved: `1000`.
- Raw output: `C:\goldencollections-theme\tmp\google-analytics-revenue-report.json`.

## Channel Summary

From the returned top-revenue rows:

| Channel | Sessions | Users | Transactions | Purchase Revenue |
| --- | ---: | ---: | ---: | ---: |
| Organic Search | 20811 | 17526 | 202 | 1007841.75 |
| Direct | 8097 | 6230 | 120 | 852597.10 |
| Unassigned | 2279 | 2076 | 16 | 41338.00 |
| Organic Social | 432 | 359 | 10 | 39449.00 |
| Organic Shopping | 495 | 390 | 18 | 30483.00 |
| Referral | 172 | 109 | 1 | 7186.00 |
| Organic Video | 299 | 250 | 1 | 1053.00 |

## Organic Revenue Pages

Notable Organic Search landing pages by purchase revenue in the first report:

| Landing page | Sessions | Users | Transactions | Purchase Revenue |
| --- | ---: | ---: | ---: | ---: |
| `/cart` | 402 | 166 | 18 | 264335.00 |
| `/` | 3474 | 2070 | 49 | 170045.70 |
| `/collections/kemp-bharatanatyam-jewellery-dance-sets` | 94 | 74 | 1 | 56316.00 |
| `/search` | 79 | 45 | 5 | 55460.85 |
| `/collections/bharatanatyam-jewellery-sets` | 1812 | 1668 | 9 | 53328.00 |
| `/collections/vara-lakshmi-dolls` | 227 | 213 | 2 | 52509.00 |
| `/collections/kemp-jewellery` | 761 | 701 | 2 | 36406.00 |
| `/products/kemp-bharatanatyam-temple-jewellery-dance-set-bks003` | 27 | 24 | 1 | 24724.00 |
| `/products/bharatanatyam-vaddanam-oddiyanam-waist-belt-goldencollections-bbw-001` | 26 | 18 | 1 | 24234.50 |
| `/products/bharatanatyam-dance-ornaments-goldencollections-bwb-012` | 4 | 3 | 1 | 23944.00 |

## Interpretation Notes

- Organic Search is a major revenue channel in the first read, not just a traffic source.
- Bharatanatyam, kemp, and Varalakshmi pages show clear commercial value.
- `/cart`, `/search`, and checkout-like URLs need careful interpretation because landing-page attribution can reflect session behavior, not necessarily SEO landing intent.
- Next useful analysis is to join Search Console query/page data with GA4 revenue pages and Merchant Center issue status.

## Next Actions

1. Build a Search Console + GA4 page join for high-impression pages with revenue.
2. Prioritize collection/product pages with both search demand and purchase revenue.
3. Overlay Merchant Center issue status so feed problems do not block the highest-value pages/products.
