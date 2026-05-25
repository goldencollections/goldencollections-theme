# Internal Product Link Parameter Cleanup Live Deploy - 2026-05-22

## Scope

Live deployment and verification for `snippets/card-product.liquid` on Shopify live theme:

- Theme: `shopifyaitool`
- Theme ID: `186459816234`

No product data, redirects, canonicals, robots rules, noindex rules, collection copy, or theme-wide files were changed.

## P1 Deployment

P1 was deployed first from a pulled live copy of `snippets/card-product.liquid`, not from the dirty working tree.

P1 changes:

- Added `card_product_url = card_product.url | split: '?' | first`.
- Swapped five crawlable product-card hrefs from `card_product.url` to `card_product_url`.
- Left quick-add data attributes untouched until live behavior was verified.

Live Chrome verification after P1:

| Surface | Product links checked | Noisy links found |
|---|---:|---:|
| Search page: `/search?q=mattal&options%5Bprefix%5D=last` | 24 unique product links | 0 |
| Recommendations endpoint for BJS005 | 4 product links | 0 |
| Collection page: `/collections/deity-crowns` | 16 unique product links | 0 |

Live quick-add smoke check before P1b:

- `Choose options` opened successfully on `/collections/deity-crowns`.
- Modal rendered product content.
- Product detail link was clean:
  - `/products/gold-plated-full-crown-for-hindu-god-goddess-goldencollections-dgc-017`

## P1b Deployment

P1b was deployed separately after P1 live verification passed.

P1b changes:

- Changed two `data-product-url="{{ card_product.url }}"` attributes to `data-product-url="{{ card_product_url }}"`.
- Changed one `data-url="{{ card_product.url }}"` attribute to `data-url="{{ card_product_url }}"`.
- Updated the local working copy in `snippets/card-product.liquid` to match the live P1b behavior.

Live Chrome verification after P1b:

| Surface | Check | Result |
|---|---|---|
| Search page: `/search?q=mattal&options%5Bprefix%5D=last` | Product anchor noise | 0 noisy anchors |
| Collection page: `/collections/deity-crowns` | Product anchor noise | 0 noisy anchors |
| Collection page: `/collections/deity-crowns` | Product data attributes | 11 clean product data attributes, 0 noisy data attributes |
| Quick-add on `/collections/deity-crowns` | `Choose options` modal | Opened successfully |

Sample clean data attribute after P1b:

```html
data-product-url="/products/gold-plated-full-crown-for-hindu-god-goddess-goldencollections-dgc-017"
```

## Outcome

Both P1 and P1b are live and verified.

Expected impact:

- Search-result product cards should no longer expose `_pos`, `_sid`, or `_ss` URLs.
- Related-products recommendation cards should no longer expose `pr_*` URLs.
- Quick-add product data attributes now align with the same clean product URL used by product-card links.

Recommended next separate sprint:

- Preventive cleanup in `sections/predictive-search.liquid` so predictive-search product links also strip any Shopify/search query parameters if they appear in that context.
