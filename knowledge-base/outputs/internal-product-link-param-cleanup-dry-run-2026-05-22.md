# Internal Product Link Parameter Cleanup Dry Run - 2026-05-22

## Scope

Dry-run only. No theme files, product data, redirects, canonical tags, robots rules, or noindex rules were changed.

Goal: reduce internally emitted product links containing crawl-noise query parameters:

- Shopify recommendation params: `pr_prod_strat`, `pr_rec_id`, `pr_rec_pid`, `pr_ref_pid`, `pr_seq`
- Shopify search params: `_pos`, `_sid`, `_ss`, `_psq`, `_v`
- Variant/localization/tracking params when not needed for a product-card click: `variant`, `currency`, `country`, `utm_*`

## Evidence

Active source scan found no hard-coded `pr_*`, `_pos`, `_psq`, `_ss`, or `_v` strings in active Liquid theme files. The only active code match for `variant=` was `assets/product-info.js`, which is valid product-page variant behavior and should be preserved.

Live public render checks:

| URL or endpoint | Finding |
|---|---|
| Product page HTML: `/products/kemp-black-bharatanatyam-jewellery-set-bjs005-1` | No suspicious product hrefs in initial HTML. |
| Product recommendations endpoint for BJS005 | 8 suspicious product hrefs, all `pr_*` recommendation links. |
| Product recommendations endpoint for BLN028 | 8 suspicious product hrefs, all `pr_*` recommendation links. |
| Collection page: `/collections/deity-crowns` | No suspicious product hrefs in sampled HTML. |
| Collection page: `/collections/bharatanatyam-jewellery-sets` | No suspicious product hrefs in sampled HTML. |
| Search page: `/search?q=mattal&options%5Bprefix%5D=last` | 48 suspicious product hrefs, all search result URLs like `_pos`, `_sid`, `_ss`. |
| Search page: `/search?q=1-gram-gold-plated-jewellery-necklaces-in-style-now&options%5Bprefix%5D=last` | 2 suspicious product hrefs, search result URL pattern. |

Representative leaking examples:

- `/products/kemp-black-bharatanatyam-jewellery-set-bjs004-1?pr_prod_strat=e5_desc&pr_rec_id=66e111bab&pr_rec_pid=9870129299754&pr_ref_pid=9870133428522&pr_seq=uniform`
- `/products/bharatanatyam-long-haram-classical-dance-necklace-bln-002?pr_prod_strat=e5_desc&pr_rec_id=ebccd934b&pr_rec_pid=8794675609898&pr_ref_pid=8902839861546&pr_seq=uniform`
- `/products/shop-bharatanatyam-kemp-matil-classic-jewellery-bbm-009?_pos=1&_sid=e4a19f7f8&_ss=r`
- `/products/1-gram-gold-plated-jewellery-necklaces-in-style-now-gcn-041?_pos=1&_sid=113daea4a&_ss=r`

## Source Of The Leak

The leak is caused by Shopify-supplied product object URLs, not by hard-coded query strings in the theme.

`snippets/card-product.liquid` renders `card_product.url` directly in crawlable links. When the product object comes from Shopify recommendations, `card_product.url` can include `pr_*`. When the product object comes from search results, it can include `_pos`, `_sid`, and `_ss`.

Current active references:

| File | Lines | Current use | Risk |
|---|---:|---|---|
| `snippets/card-product.liquid` | 154, 191 | Main product-card title links use `card_product.url`. | Confirmed leak in recommendations and search pages. |
| `snippets/card-product.liquid` | 580, 589, 602 | Quick-add/bulk modal detail links use `card_product.url`. | Could leak when quick-add/bulk cards are rendered from search or recommendations. |
| `snippets/card-product.liquid` | 386, 515 | `data-product-url` for quick-add modal fetch. | Not crawlable anchor, but can carry noisy URLs in HTML. Safe to clean if quick-add behavior is verified. |
| `snippets/card-product.liquid` | 616 | `data-url` for bulk modal. | JS already strips query before fetch; safe to clean but lower priority. |
| `sections/predictive-search.liquid` | 140 | Predictive-search product anchor uses `product.url`. | Preventive cleanup candidate; not confirmed in live sample due endpoint timeout. |
| `sections/main-search.liquid` | 275 | Passes search product object into `card-product`. | No direct edit needed if `card-product` is fixed. |
| `sections/related-products.liquid` | 41 | Passes recommendation product object into `card-product`. | No direct edit needed if `card-product` is fixed. |
| `sections/main-product.liquid` | 628 | Complementary products pass recommendation product object into `card-product`. | No direct edit needed if `card-product` is fixed. |

## Proposed Dry-Run Patch

### P1: Clean Crawlable Product Card Links

Add a normalized card URL once near the top of `snippets/card-product.liquid` inside the `card_product` branch:

```liquid
{%- liquid
  assign card_product_url = card_product.url | split: '?' | first
-%}
```

Then replace crawlable product-card hrefs:

```liquid
href="{{ card_product.url }}"
```

with:

```liquid
href="{{ card_product_url }}"
```

Target hrefs:

- `snippets/card-product.liquid:154`
- `snippets/card-product.liquid:191`
- `snippets/card-product.liquid:580`
- `snippets/card-product.liquid:589`
- `snippets/card-product.liquid:602`

Expected effect:

- Related product recommendation links stop emitting `pr_*` URLs.
- Search result product cards stop emitting `_pos/_sid/_ss` URLs.
- Collection/featured product cards continue linking to the same clean product path.

### P1b: Clean Product Card Data URLs After Functional Check

Also consider changing these to `card_product_url`:

- `snippets/card-product.liquid:386` `data-product-url`
- `snippets/card-product.liquid:515` `data-product-url`
- `snippets/card-product.liquid:616` `data-url`

Why this is probably safe:

- `assets/quick-add.js` fetches `data-product-url` to load the quick-add product modal; clean product URLs are enough for that modal in normal product-card contexts.
- `assets/global.js` `BulkModal` already does `this.dataset.url.split('?')[0]` before fetching, so cleaning at the source aligns with existing JS behavior.

Why this is separated from P1:

- These attributes are not normal crawlable anchors.
- If any future product-card context intentionally passes selected-variant URLs into quick-add, stripping `variant` could change which variant opens first. I did not see evidence of this in the sampled public pages, but it deserves a quick browser check when applying.

### P2: Preventive Predictive Search Product Link Cleanup

Inside `sections/predictive-search.liquid`, in the product loop, add:

```liquid
{%- assign predictive_product_url = product.url | split: '?' | first -%}
```

Then change the product anchor:

```liquid
href="{{ product.url }}"
```

to:

```liquid
href="{{ predictive_product_url }}"
```

Target:

- `sections/predictive-search.liquid:140`

Expected effect:

- If Shopify predictive search ever returns product URLs with search params, those links will render clean product paths.

## Files To Leave Alone

These are intentionally not part of the cleanup:

| File/pattern | Reason |
|---|---|
| `assets/product-info.js` `?variant=` handling | Product-page variant selection and section refresh behavior; valid user function. |
| `sections/main-product.liquid` and `sections/featured-product.liquid` share URLs using `product.selected_variant.url` | Intentional selected-variant sharing. |
| Cart/order links using `item.url` or `line_item.url` | Cart and order line items need variant-specific URLs. |
| Facet links using `url_to_remove` | Filter state links are functional collection/search controls. |
| Product/feed/Merchant Center URLs outside active theme rendering | Separate feed/channel problem, not internal theme-link cleanup. |

## Validation Plan For Apply Sprint

After applying P1 and optional P1b/P2:

1. Fetch a related-products endpoint and confirm no anchor href contains `pr_prod_strat`, `pr_rec_id`, `pr_rec_pid`, `pr_ref_pid`, or `pr_seq`.
2. Fetch `/search?q=mattal&options%5Bprefix%5D=last` and confirm product-card anchors no longer contain `_pos`, `_sid`, or `_ss`.
3. Open a collection page and confirm product-card clicks still open clean product pages.
4. Open a product page, scroll to related products, and confirm related-product clicks work.
5. If P1b is applied, test quick-add modal for a multi-variant product and bulk quick-add for collection cards.
6. Do not validate the full GSC `Crawled - currently not indexed` issue until Google recrawls and sample URLs visibly drop.

## Recommendation

Apply P1 first. It is a small shared-snippet cleanup with the largest crawl impact and lowest functional risk.

Apply P1b only with browser verification of quick-add. Apply P2 as a preventive one-line loop cleanup if predictive search is active in production.
