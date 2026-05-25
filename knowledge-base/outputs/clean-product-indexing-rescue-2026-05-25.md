# Clean Product Indexing Rescue - 2026-05-25

## Scope

This sprint strengthened seven in-stock, technically indexable product pages that appeared in the clean product URL sample from Google Search Console.

Products covered:

- BHA-011: metal pins
- BHA-008: bobby pins
- BDS017: Bharatanatyam dance jewellery set
- BLN026: Bharatanatyam long haram
- BLN012: Bharatanatyam pearl long haram
- VHL027: deity hastham
- DSN056: deity 2 step short necklace

Explicitly left alone:

- DLN103, because it is active but out of stock.
- No bulk noindex, canonical, robots, redirect, inventory, product-status, price, or unrelated theme changes.

## Evidence Files

- `tmp/clean-product-rescue-2026-05-25/preflight-products-admin-live.json`
- `tmp/clean-product-rescue-2026-05-25/apply-product-rescue-result.json`
- `tmp/clean-product-rescue-2026-05-25/live-verification-after.json`
- `tmp/clean-product-rescue-2026-05-25/live-cachebusted-verification-after.json`
- `tmp/clean-product-rescue-2026-05-25/pin-cache-recheck.json`

## What Changed

### BHA-011 Metal Pins

- Updated product description to make the page specific to Bharatanatyam costume and hair fixing.
- Updated SEO title and meta description around BHA-011, white metal pins, costume support, bun, braid, jada, and jewellery support.
- Updated two image alt texts:
  - `Bharatanatyam white metal pins BHA-011 for costume and hair fixing`
  - `White metal pins for Bharatanatyam bun jada costume and jewellery support`

### BHA-008 Bobby Pins

- Updated product description to distinguish black bobby pins from the metal pins page.
- Updated SEO title and meta description around BHA-008, black bobby pins, dance hairstyle, bun, braid, jada, and flowers.
- Updated two image alt texts:
  - `Bharatanatyam black bobby pins BHA-008 for dance hairstyle`
  - `Black bobby pins for Bharatanatyam bun braid jada and hair flowers`

### BDS017 Bharatanatyam Dance Jewellery Set

- Updated SEO title and meta description to include BDS-017 and stronger Bharatanatyam/classical dance set relevance.
- Updated two image alt texts:
  - `Classical Bharatanatyam dance jewellery set BDS-017 multicolor stage set`
  - `Kemp-style necklace and earrings from Bharatanatyam dance jewellery set BDS-017`

### BLN026 Bharatanatyam Long Haram

- Updated description to remove a blank list item and strengthen product-specific wording.
- Updated SEO title and meta description around BLN-026, long haram, kemp-style pendant, red/green/clear stones, and classical dance costume layering.
- Updated two image alt texts:
  - `Bharatanatyam long haram BLN-026 with kemp-style pendant red green clear stones`
  - `BLN-026 Bharatanatyam long necklace for classical dance costume layering`

### BLN012 Bharatanatyam Pearl Long Haram

- Updated description to remove a blank list item and strengthen SKU-specific relevance.
- Updated SEO title and meta description around BLN-012, pearl long haram, maroon/green/clear stones, and Bharatanatyam/Kuchipudi costume use.
- Updated one image alt text:
  - `Bharatanatyam pearl long haram BLN-012 with maroon green and clear stones`

### VHL027 Deity Hastham

- Updated SEO title and meta description around VHL027, gold plated deity hastham, Varalakshmi, Lakshmi, Amman, and idol alankaram.
- Updated two image alt texts:
  - `Gold plated deity hastham VHL027 for Varalakshmi Lakshmi Amman idol alankaram`
  - `VHL027 deity hand accessory pair for goddess idol decoration`

### DSN056 Deity 2 Step Short Necklace

- Updated product description to make the necklace type, use case, size context, and alankaram relevance clearer.
- Added/updated SEO title and meta description around DSN056, deity 2 step short necklace, god/goddess idol alankaram, and 8.5 x 6 inch sizing.
- Updated three image alt texts:
  - `Deity 2 Step Short Necklace DSN056 for god and goddess idol alankaram`
  - `DSN056 deity short necklace multi color 8.5 x 6 inch front view`
  - `DSN056 two step deity necklace for idol neck or upper chest placement`

## Verification

Admin mutation results:

- All seven products updated successfully.
- No product update errors were returned.
- Image alt updates were applied through Shopify Admin API.

Live storefront checks:

- All seven product URLs returned HTTP 200.
- Product JSON-LD schema was present on all seven live pages.
- The normal live route already showed the updated title/meta output for BDS017, BLN026, BLN012, VHL027, and DSN056.
- BHA-011 and BHA-008 are updated in Shopify Admin and render the new title/meta/content through `?view=ajax`, but the normal product route was still serving cached title/meta during the final recheck.

Pin-page cache note:

- BHA-011 normal route still showed `Bharatanatyam Metal Pins for Costume and Hair Fixing | Golden Collections`.
- BHA-011 `?view=ajax` showed `Bharatanatyam Metal Pins BHA-011 for Costume and Hair Fixing | Golden Collections`.
- BHA-008 normal route still showed `Bharatanatyam Bobby Pins for Dance Hairstyle | Golden Collections`.
- BHA-008 `?view=ajax` showed `Bharatanatyam Bobby Pins BHA-008 for Dance Hairstyle | Golden Collections`.

Interpretation: the pin product edits succeeded in Admin, and the alternate storefront view can already see the updated data. The normal product route appears to be behind Shopify/theme cache. No further risky action was taken to force-refresh it.

## Recommended Next Step

After the pin-page cache clears, use Google Search Console URL Inspection for these seven clean product URLs and request indexing where appropriate. Then watch whether the clean product sample shrinks or whether the same pages remain in `Crawled - currently not indexed`.

Priority order for manual URL Inspection:

1. BDS017, BLN026, BLN012, VHL027, DSN056, because their normal live routes already show the updated SEO output.
2. BHA-011 and BHA-008 after their normal product routes show the updated title/meta without `?view=ajax`.
