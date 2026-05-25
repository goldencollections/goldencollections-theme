# Predictive Search Product URL Cleanup Live Deploy - 2026-05-22

## Scope

Preventive cleanup for predictive-search product links on Shopify live theme:

- Theme: `shopifyaitool`
- Theme ID: `186459816234`
- File: `sections/predictive-search.liquid`

No product data, redirects, canonicals, robots rules, noindex rules, collection copy, or other theme files were changed.

## Change

Inside the predictive-search product loop, product URLs now strip query parameters before rendering the product anchor.

```liquid
{%- assign predictive_product_url = product.url | split: '?' | first -%}
```

The product result anchor now uses:

```liquid
href="{{ predictive_product_url }}"
```

## Deployment

The live section was pulled into a temporary deployment folder, patched there, and pushed back with `--only sections/predictive-search.liquid`.

The local working copy in `sections/predictive-search.liquid` was updated to match the live deployed behavior.

## Verification

The live theme asset was pulled again after deployment and confirmed to contain the new `predictive_product_url` assignment and anchor.

Public no-cookie fetch check:

- `/search/suggest?q=mattal&resources%5Btype%5D=product&resources%5Blimit%5D=10&section_id=predictive-search`
- Product hrefs: 10
- Noisy product hrefs: 0
- Sample clean href:
  - `/products/shop-bharatanatyam-kemp-matil-classic-jewellery-bbm-009`

Chrome live-theme check:

| Query | Product links checked | Noisy product links |
|---|---:|---:|
| `mattal` | 10 | 0 |
| `deity crown` | 10 | 0 |

Note: the Chrome profile initially still had an old Shopify preview theme cookie from the earlier dev-theme test, which showed stale parameterized links. After setting Chrome back to the live theme ID, the predictive-search endpoint returned clean product paths.

## Outcome

Predictive-search product links now align with the product-card cleanup:

- No `_pos`, `_psq`, `_ss`, or `_v` links in predictive product suggestions on the live theme.
- The change is preventive and isolated to product anchors in predictive search.
