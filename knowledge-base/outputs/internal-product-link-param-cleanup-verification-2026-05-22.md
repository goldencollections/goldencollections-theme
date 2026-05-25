# Internal Product Link Parameter Cleanup Verification - 2026-05-22

## Scope

Rendered verification for the P1 cleanup in `snippets/card-product.liquid`.

No product data, redirects, canonicals, robots rules, noindex rules, or collection copy were changed.

## Patch Verified

`snippets/card-product.liquid` now assigns one clean product-card URL:

```liquid
assign card_product_url = card_product.url | split: '?' | first
```

The five crawlable product-card hrefs now use `card_product_url`.

The quick-add data attributes still use `card_product.url` intentionally:

- `data-product-url="{{ card_product.url }}"`
- `data-url="{{ card_product.url }}"`

Those attributes are not ordinary crawlable anchors and were left for the separate P1b check.

## Checks

### Static Theme Checks

- `git diff --check -- snippets/card-product.liquid`: passed.
- Active file scan confirmed:
  - 1 `card_product_url` assignment.
  - 5 crawlable hrefs using `card_product_url`.
  - 0 crawlable hrefs still using `card_product.url`.
  - 3 non-crawl data attributes still using `card_product.url`.

### Shopify Preview

A temporary Shopify theme preview was started and inspected through Chrome because direct `127.0.0.1:9292` requests were blocked by storefront password protection.

Chrome preview checks used the patched development theme.

### Search Results

Preview URL:

`https://www.goldencollections.com/search?q=mattal&options%5Bprefix%5D=last`

Result:

- Product-card anchors checked: 24 unique product links.
- Suspicious product hrefs with `_pos`, `_sid`, `_ss`, `_psq`, `_v`, `variant`, `currency`, `country`, `utm_*`, or `pr_*`: 0.
- Sample rendered hrefs:
  - `/products/shop-bharatanatyam-kemp-matil-classic-jewellery-bbm-009`
  - `/products/handcrafted-bharatanatyam-matil-kemp-ear-chain-bbm-017`
  - `/products/bharatanatyam-kemp-matil-temple-jewelry-ear-chain-bbm-019`

Public live no-cookie comparison still showed 48/48 product hrefs with `_pos/_sid/_ss`, which is expected until the patched theme is deployed.

### Product Recommendations

Preview endpoint:

`/recommendations/products?limit=4&product_id=9870133428522&section_id=template--27135344869674__related-products`

Result:

- Product anchors checked: 8.
- Suspicious product hrefs with `pr_prod_strat`, `pr_rec_id`, `pr_rec_pid`, `pr_ref_pid`, or `pr_seq`: 0.
- Sample rendered hrefs:
  - `/products/kemp-black-bharatanatyam-jewellery-set-bjs004-1`
  - `/products/antique-kemp-maroon-green-bharatanatyam-set-bjs003`
  - `/products/kemp-black-bharatanatyam-jewellery-set-bjs001`

### Click-Through Checks

- Search result product card: clean href opened the product page with no query params.
- Collection product card on `/collections/deity-crowns`: clean href opened the product page with no query params.
- Product recommendation endpoint rendered clean product-card hrefs; the sampled product page did not expose a visible recommendation-card click target in the loaded page body, so the endpoint itself was used as the rendered verification source.

### Quick-Add Smoke Check

Preview URL:

`https://www.goldencollections.com/collections/deity-crowns`

Result:

- A visible `Choose options` quick-add button opened the quick-add modal.
- The modal loaded product content successfully.
- The modal's visible product detail link was clean:
  - `/products/gold-plated-full-crown-for-hindu-god-goddess-goldencollections-dgc-017`

## Outcome

The P1 patch is ready to deploy.

Expected impact after deployment:

- Search result product-card links should stop emitting `_pos/_sid/_ss` URLs.
- Related-products recommendation links should stop emitting `pr_*` URLs.
- Collection product-card links continue to resolve to the same clean product paths.

Next best follow-up after deployment:

1. Re-run the same public no-cookie checks on live.
2. Inspect GSC `Crawled - currently not indexed` after Google recrawls to confirm fewer newly discovered `pr_*` and search-result parameter URLs.
3. Decide separately whether to do P1b for non-crawl quick-add `data-product-url` / `data-url` attributes.
