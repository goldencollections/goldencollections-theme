# GSC Clean Product Request Indexing - 2026-05-25

## Scope

Rechecked the two pin product pages for live cache clearing, inspected the seven rescued clean product URLs in Google Search Console, and requested indexing only for URLs whose normal storefront HTML already showed the updated SEO output.

## Evidence Files

- `tmp/gsc-product-indexing-rescue-2026-05-25/live-and-url-inspection.json`
- `tmp/gsc-product-indexing-rescue-2026-05-25/search-console-ui-request-indexing-results.json`
- `tmp/gsc-product-indexing-rescue-2026-05-25/bds017-url-inspection-snapshot.md`
- `tmp/gsc-product-indexing-rescue-2026-05-25/dsn056-after-request.png`

## Live HTML Gate

Passed live normal storefront gate:

- BDS017
- BLN026
- BLN012
- VHL027
- DSN056

Held back:

- BHA-011 metal pins
- BHA-008 bobby pins

Reason: both pin pages still returned HTTP 200 and had Product schema, but their normal product routes continued to serve the older cached title/meta. They were not submitted for indexing because the user asked to request indexing only after the normal live HTML shows the updated SEO output.

## URL Inspection API Result

The five ready URLs were inspected through the Search Console URL Inspection API before UI request-indexing.

| SKU | Coverage state | Indexing allowed | Page fetch | Last crawl |
| --- | --- | --- | --- | --- |
| BDS017 | Crawled - currently not indexed | Yes | Successful | 2026-03-20T20:41:27Z |
| BLN026 | Crawled - currently not indexed | Yes | Successful | 2026-04-05T16:57:17Z |
| BLN012 | Crawled - currently not indexed | Yes | Successful | 2026-03-14T22:01:16Z |
| VHL027 | Crawled - currently not indexed | Yes | Successful | 2026-03-29T19:53:30Z |
| DSN056 | Crawled - currently not indexed | Yes | Successful | 2026-03-31T21:41:43Z |

## Request Indexing Result

Requested indexing in the Google Search Console URL Inspection UI for:

- BDS017: accepted into priority crawl queue.
- BLN026: accepted into priority crawl queue.
- BLN012: accepted into priority crawl queue.
- VHL027: accepted into priority crawl queue.
- DSN056: accepted into priority crawl queue.

Search Console confirmation shown for each submitted URL:

`Indexing requested. URL was added to a priority crawl queue.`

## Pages That Should Wait

Do not request indexing yet:

- BHA-011: `https://www.goldencollections.com/products/metal-pins-for-every-task-find-the-perfect-fastener-here`
- BHA-008: `https://www.goldencollections.com/products/keep-your-hairstyle-in-place-with-bobby-pins-shop-now`

Next action for those two: recheck the normal product URLs after Shopify/CDN cache clears. Once the live title/meta includes the SKU-specific SEO output, request indexing through URL Inspection UI.

## Follow-up

Reinspect these five submitted URLs after Google recrawls. The current state is expected to remain `Crawled - currently not indexed` immediately after the request; the meaningful follow-up window is after Googlebot has a new crawl timestamp.
