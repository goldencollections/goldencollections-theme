# Product Upload And Image Workflow

Backlinks: [[index.md]], [[business-entity.md]], [[search-entity-map.md]], [[shopify-custom-data-model.md]], [[collection-optimization-playbook.md]], [[retrieval-ready-seo-strategy.md]]

Last updated: 2026-05-20

## Purpose

This page is the durable operating workflow for adding Golden Collections product images and product data to Shopify. Future chats should read this before discussing bulk uploads, product image processing, watermarking, SEO filenames, Shopify product creation, or the Google Drive tracker.

Core rule:

- Folders organize images and workflow status.
- The Google Sheet is the product truth.
- Shopify is the final publishing destination.
- If a product is not in the tracker, it should not be uploaded.
- Shopify product variants should default to `Charge tax on this product = off` unless the owner explicitly says otherwise.
- No AI slop: product copy must be specific to the actual product, not duplicated filler with only the SKU, size, or color swapped.
- Product title, description, SEO title, meta description, tags and alt text must be written after looking at the actual product images and the tracker facts. Do not write them from the category folder alone.
- Country/Region of origin should default to India for Golden Collections products unless the owner identifies a non-India origin.
- Product weight is a mandatory owner-entered field. Codex should not guess weight from older products.
- For Bharatanatyam/Kuchipudi jewellery, default Google/Merchant gender to `female` and age group to `adult` unless the owner marks the product as kids/unisex/male or otherwise different.

## Workspace Locations

### Google Drive Product Workspace

Use Google Drive for actual product images and upload workflow files. Current source root as of 2026-05-19:

`G:\My Drive\GC`

The previous upload workspace is legacy/history only unless the owner explicitly asks to use it:

`G:\My Drive\Golden-Product-Uploads`

This is synced through Google Drive for desktop so files remain accessible beyond one local machine.

### Google Sheet Tracker

Current master tracker:

`GC Product Upload Master`

Native Google Sheet URL:

`https://docs.google.com/spreadsheets/d/1ZR3lnUEyPoBIbHTyWnn1fXl4StZDZPlZzNpI-kByHYU/edit`

Drive-synced Excel workbook:

`G:\My Drive\GC\00_Admin\GC Product Upload Master.xlsx`

Convenience Google Sheet shortcut at the GC root:

`G:\My Drive\GC\GC Product Upload Master Google Sheet.url`

Local admin README and shortcut:

```text
G:\My Drive\GC\00_Admin\README-GC-upload-workflow.txt
G:\My Drive\GC\00_Admin\GC Product Upload Master Google Sheet.url
```

Legacy tracker:

`Golden Collections Product Upload Master`

URL:

`https://docs.google.com/spreadsheets/d/1BhoLa8Zwnywf0eek9d2xahES0xRW24q1umIw37UNPZM/edit`

Tabs:

- `Product Upload Master`
- `Collections Master`
- `Instructions`
- `SKU Prefix Master`
- `Merchant Feed Test`
- `Merchant Feed Upload IN`

The current `GC Product Upload Master` Google Sheet is the official source of truth for upload status and product facts going forward. The legacy sheet should be treated as historical unless data must be migrated from it.

The local CSV files in `G:\My Drive\Golden-Product-Uploads` are starter templates/backups only. Do not treat the CSV, the legacy Google Sheet and the new GC Google Sheet as three active trackers, because they can drift. If data exists outside the current `GC Product Upload Master`, sync it into the current Google Sheet before processing.

### Theme Repository Tools

Keep automation scripts in the theme repo, not inside the Drive upload workspace:

`C:\goldencollections-theme\scripts\create-golden-upload-folders.ps1`

The script creates the folder tree and starter CSV files. It is safe to rerun because it creates missing folders and leaves existing template files alone unless explicitly overwritten.

Command used for the Drive workspace:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\goldencollections-theme\scripts\create-golden-upload-folders.ps1 -RootPath "G:\My Drive\GC"
```

## Folder Model

The chosen model is category folders with workflow subfolders. This is preferred because Golden Collections usually prepares products in same-category batches, such as deity short necklaces, deity long necklaces, stone crowns, or Bharatanatyam sets.

Example category path:

```text
G:\My Drive\GC\
  01_Products\
    Deity-God-Jewellery\
      Necklace\
        Short-Necklace\
          00_New-Raw-Images\
          10_Processed-Shopify-Ready\
          20_Uploaded-To-Shopify\
          90_Needs-Fixing\
          reports\
```

Workflow subfolders:

- `00_New-Raw-Images`: owner drops raw images here.
- `10_Processed-Shopify-Ready`: Codex exports cleaned, resized, compressed, watermarked Shopify-ready images here.
- `20_Uploaded-To-Shopify`: completed/uploaded product images can be moved or copied here.
- `90_Needs-Fixing`: missing, unclear, duplicate, bad-quality, or mismatched product images go here.
- `reports`: category-specific processing logs and SEO previews.

Top-level support folders:

- `00_Admin`: current tracker workbook, Google Sheet shortcut, README, and admin references.
- `00_Brand`: logo and watermark assets.
- `02_Global-Reports`: upload run reports that are not category-specific.
- `03_Archive`: old or completed workspace material.

Current GC setup note:

- On 2026-05-19, `G:\My Drive\GC\00_Admin\GC Product Upload Master.xlsx` was created and imported as the native Google Sheet `GC Product Upload Master`.
- The existing `G:\My Drive\GC` category folders such as `short necklace`, `Long Haram`, `Gold Crown`, and `Black Kemp Short Necklace` were inventoried in the `GC Folder Inventory` tab.
- On 2026-05-19, the owner confirmed this is a fresh start and the strict structure should be used. Loose category folders were migrated into the matching `01_Products\...\00_New-Raw-Images` folders and the old loose folders were moved to `G:\My Drive\GC\03_Archive\legacy-loose-folders-2026-05-19`.
- Root-level template files and the old `gc-watermark` folder were moved to `G:\My Drive\GC\03_Archive\root-cleanup-2026-05-19`; usable brand assets are in `G:\My Drive\GC\00_Brand`.
- Going forward, do not create loose category folders at the GC root. Top-level GC should stay limited to `00_Admin`, `00_Brand`, `01_Products`, `02_Global-Reports`, and `03_Archive`, plus the convenience shortcut `GC Product Upload Master Google Sheet.url`.
- Inventory rows are not automatically upload-ready. The owner still needs one tracker row per product with mandatory facts before `Status = Ready`.

## Key Product Families

The folder tree includes category leaves for:

- Deity god jewellery: Varalakshmi, short necklaces, long necklaces, crowns, earrings, eyes, waist belts, arch for crown, pustal tadu, pendants, nose rings, mustache, weapons, taira, bindi/tilak, shanku chakra, decorative items.
- Premium deity jewellery: long haram, short necklace, lockets/pendants, kasula mala, nose ring, shanku chakra, taira.
- Bharatanatyam jewellery: adult/kids sets, short necklace, long necklace, ghungroo/salangai, bangles, mattal/matil/mattel, waist belts, headset, nethi chutti/maang tikka, earrings/jhumka, nath, baju band, hair accessories, cosmetics, instruments.
- Kemp jewellery: gold kemp and black kemp sets, necklaces, long harams, mattal, maang tikka, earrings, headset, oddiyanam/vaddanam, accessories.

When a new collection/category becomes important, add a new category leaf to the script and rerun it.

## Image Naming Rule

Each product usually has exactly 3 images. The image prefix may be temporary and does not have to be the final SKU.

```text
ImagePrefix_1.jpg = main product image
ImagePrefix_2.jpg = close-up or second angle
ImagePrefix_3.jpg = detail or alternate image
```

Example:

```text
new-001_1.jpg
new-001_2.jpg
new-001_3.jpg
```

The tracker row must use:

- `Image Prefix`: `new-001`
- `SKU`: optional; Codex can assign the final SKU if blank.
- `Category Folder`: the relative folder path under `01_Products`

This lets the owner group images without manually searching for the next SKU number.

Final SKU example after Codex assignment:

```text
DSN047
```

## Tracker Rule

The Google Sheet is the source of truth for business and Shopify decisions.

Color guide:

- Green fields: owner workflow status.
- Yellow fields: mandatory owner inputs before setting `Status = Ready`.
- Blue fields: optional fields that owner may fill, or Codex can generate/improve.
- Gray fields: Codex/admin tracking fields that owner does not need to fill.

Column layout:

- The owner-required intake fields must stay grouped first so the sheet is easy to fill quickly.
- Optional owner/Codex-assisted fields come after the required intake fields.
- Codex/admin tracking fields stay at the far right.

Current column order:

- `Status`
- `Category Folder`
- `Image Prefix`
- `Primary Collection`
- `Price`
- `Stock Qty`
- `Weight (g)`
- `Material`
- `Size`
- `Set Includes`
- `Suitable For`
- `SKU`
- `Product Title`
- `Extra Collections`
- `Compare At Price`
- `Color / Stone Color`
- `Product Type`
- `Vendor`
- `Tags`
- `SEO Keywords`
- `Notes`
- `Watermark Rule`
- `Upload Run`
- `Shopify Status`
- `Shopify Product ID`
- `Shopify Handle`
- `Uploaded Date`

Mandatory owner inputs before `Ready`:

- `Status`
- `Category Folder`
- `Image Prefix`
- `Primary Collection`
- `Price`
- `Stock Qty`
- `Weight (g)`
- `Material`
- `Size`
- `Set Includes`
- `Suitable For`

Optional/Codex-generated fields:

- `SKU`, if left blank; Codex assigns from `Primary Collection` and `SKU Prefix Master`.
- `Product Title`, if the owner already has one; otherwise Codex writes a SEO-focused title.
- `Extra Collections`, only when the product should go into more than the primary collection.
- `Compare At Price`.
- `Color / Stone Color`, if owner wants to specify exact wording; otherwise Codex can infer from images.
- `Product Type`, if owner wants to specify exact wording; otherwise Codex can infer from primary collection.
- `Vendor`, usually `Golden Collections`.
- `Tags`.
- `SEO Keywords`.
- `Notes`, when something special must be preserved.

System/admin fields filled by Codex:

- `Watermark Rule`, now fixed by owner decision.
- `Upload Run`.
- `Shopify Status`.
- `Shopify Product ID`.
- `Shopify Handle`.
- `Uploaded Date`.

Status values:

- `New`
- `Needs Info`
- `Ready`
- `Processing`
- `Draft Uploaded`
- `Review Approved`
- `Live`
- `Live Uploaded`
- `Error`
- `Skipped`

Processing rule:

- Only rows with `Status = Ready` should be processed.
- Missing price, stock, weight, material, size, or collections should become `Needs Info`.
- Products should normally be created in Shopify as drafts first, then made live after review/approval.
- Product variants should be created or corrected with `taxable = false` because owner confirmed on 2026-05-12 that charge tax should be off by default for all products.

## Shipping, Customs, Country Of Origin, And HS Codes

Owner decision on 2026-05-12:

- Country/Region of origin should default to `India` / `IN` for Golden Collections products unless the owner explicitly says a product is made elsewhere.
- Weight must be entered by the owner in the tracker before `Status = Ready`. Use grams in the `Weight (g)` column.
- Codex must not infer or guess weight from similar products. If weight is blank, mark the row `Needs Info` or keep the Shopify draft unpublished until the owner confirms the weight.
- `Charge tax on this product` should default to off unless the owner explicitly says otherwise.

HS/HSN code rule:

- Do not use one HS code blindly for every Golden Collections product. Country of origin can be a store-wide default, but HS codes are product-classification data and must match the product material/type.
- For alloy/base-metal imitation jewellery, including alloy metal or gold-plated deity necklaces/crowns, use HS code `711719` by default unless a customs/tax professional confirms a better country-specific code.
- `711790` is a valid HS code, but it is for imitation jewellery of materials other than base metal. Do not use `711790` for alloy/base-metal plated jewellery just because it is also imitation jewellery.
- If the product is not jewellery, such as fabric, sarees, dolls, decor, stands or other non-jewellery goods, choose a category-specific HS code instead of `711719` or `711790`.
- For destination-country forms that require more than 6 digits, use the confirmed 6-digit HS base plus the correct country-specific extension after review.

Verification notes:

- United Nations Statistics Division lists `711719` as imitation jewellery, excluding cuff links and studs, of base metal, whether or not plated with precious metal.
- United Nations Statistics Division lists `711790` as imitation jewellery of other than base metal, whether or not plated with precious metal.
- Therefore, for the current alloy metal with gold plating jewellery drafts, `711719` is safer than `711790`.

## Collection Tracking

Collections should not be guessed only from folder names. The folder gives the default category, but the tracker controls final collection assignment.

Use:

- `Primary Collection`: the main Shopify collection.
- `Extra Collections`: comma-separated additional collections.
- `Collections Master`: canonical collection names, Shopify handles, collection group, default folder, and notes.

Example:

```text
Deity Jewellery, Lakshmi Amman Jewellery, Varalakshmi Alankaram
```

This prevents spelling drift such as `Varalakshmi`, `Vara Lakshmi`, and `Varalaxmi` being treated inconsistently.

## SKU Assignment

Owner decision on 2026-05-12:

- Owner should not have to manually search for the next SKU number.
- `Image Prefix` can be any unique temporary grouping code, such as `new-001`.
- Codex should assign the final SKU when the `SKU` field is blank.

Use the Google Sheet tab `SKU Prefix Master` as the canonical short-code map.

Initial owner-provided SKU short-code map:

| SKU Short Code | Type |
| --- | --- |
| DLN | Deity Long Necklace |
| DSN | Deity Short Necklace |
| DGC | Deity Stone Crowns |
| DGCG | Deity Gold Plated Crowns |
| GNR | Deity Accessories- Nose Rings |
| GDW | Deity Accessories- Weapons |
| GDT | Deity Accessories- Taira |
| DGM | Deity Accessories- Mustache |
| VBT | Deity Accessories- Banana |
| GFA | Deity Accessories- Face Jewellery |
| DAC | Deity Accessories- Coconut Stand |
| DGS | Deity Accessories- Stand |
| DLC | Deity Accessories- Cushion |
| WBG | Deity Waist Belt |
| GGA | Deity Arch |
| DGE | Deity Earrings |
| DGP | Deity Pendant |
| DHB | Deity Accessories- Hair |
| DNC | Deity Eyes |
| DVT | Deity Vagamalai/Thomala |
| GPT | Deity God Pustal Tadu Thali/Sutram |
| VDF | Deity Faces |
| VHL | Deity Hands and Legs |
| VVD | Deity Varalakshmi Vratham Dolls |
| VVS | Deity Varalakshmi Doll Sarees |
| DSM | Deity Sun Moon |
| DGT | Tilak |
| DGL | Lotus |
| DSC | Shank Chakra |
| BHA | Bharatanatyam Nath Nose Ring |
| BJN | Black Kemp Jewellery Necklace |

Codex SKU assignment rule:

1. Use `Primary Collection` to identify the matching short code in `SKU Prefix Master`.
2. Check existing Shopify products and tracker rows for the highest used number for that short code.
3. Assign the next unused number.
4. Write the assigned SKU back to the tracker.
5. Rename processed output images with SEO-friendly filenames that include the final SKU.

If the matching short code is unclear, mark the row as `Needs Info` instead of guessing.

SKU format rule:

- Final SKUs should not contain hyphens.
- Owner confirmed on 2026-05-12 that 3 digits is enough.
- Use prefix plus a 3-digit number by default.
- Examples: `DSN047`, `DLN012`, `DGC021`, `DGCG001`.
- `DGCG` replaces the older `DGC-G` short code because owner prefers no hyphens in SKUs.

Product title and SEO copy rule:

- Do not include SKU in SEO meta title or SEO meta description by default. Exception: SKU may appear at the end of SEO titles for product families where owner review explicitly wants SKU-level agent-commerce/UCP disambiguation, such as Black Kemp necklace SKUs. Do not put SKU in meta descriptions unless there is a specific review reason.
- Do not write customer-facing product copy such as `for this SKU`.
- Product titles should normally read naturally without SKU.
- Product titles and descriptions must reflect visible product details from the images, such as stone color, stone shape, pearl drops, pendant shape, crown style, necklace length/type, included pieces and actual product use.
- If the sheet title conflicts with the image, pause or correct the title in the tracker notes before upload. Example: do not call a visible pearl-drop long necklace only a `green stone pendant`.
- Do not include SKU in Shopify tags or image alt text unless there is a specific operational reason.
- Keep SKU in the Shopify SKU field, barcode, tracker, admin notes, and bottom-right image stamp.
- If owner explicitly asks for SKU in a product title for a special batch, put it at the end of the title.
- Use `short necklace` for short necklace products. Never call a short necklace `short haram` in product titles, SEO copy, tags, alt text, or customer-facing descriptions.

Example:

```text
Deity Short Necklace for Lakshmi Amman Idol
```

Image SKU stamp rule:

- Add the final SKU to the bottom-right corner of every processed product image.
- Keep the selected center watermark on all images.
- The SKU stamp should be readable but should not cover important jewellery details.
- Use enough padding from the image edge so the SKU is not cropped by Shopify thumbnails.

## Product Facts Codex Cannot Infer Reliably

Codex can often infer visual product type and write SEO copy from images, but the owner or tracker must provide:

- Price.
- Stock quantity.
- Exact material.
- Exact size or idol-fit range.
- Set includes.
- Variants.
- Final primary and extra collections.
- Any premium/quality claim that must be true.

Avoid publishing unsupported claims about certificates, plating thickness, material, stone type, or exact fit.

## SEO, GEO, And AEO Standard

Golden Collections product uploads should aim for high-quality 2026 search visibility, but never through keyword stuffing or unsupported claims.

Read [[retrieval-ready-seo-strategy.md]] before major product upload batches. The operating principle is `retrieval-ready truth`: make real product facts, real images, owner-confirmed fields, measurements and proof easy for humans, Google, Merchant Center, answer engines and Shopify/UCP agents to extract.

Use this standard for every product and collection:

- Write for buyer intent first: product type, use case, deity/dance context, size, material, color, and fit guidance.
- Use natural phrases that customers actually search, such as `deity short necklace`, `idol alankaram necklace`, `god jewellery`, and relevant deity/use terms when truthful.
- Include answer-style copy for AI search and AEO: what it is, who it is for, where it is used, size/fit guidance, what is included, and what to compare before ordering.
- Support GEO/entity clarity by connecting the product to Golden Collections, deity jewellery, Bharatanatyam/Kemp/deity categories, collection pages, compatible deity concepts, and structured metafields.
- Keep SEO meta title and meta description clean and search-facing. Default to no SKU in SEO fields, except for SKU-driven product families where owner review explicitly approves SKU in SEO title for agent-commerce disambiguation. Avoid SKU in meta descriptions.
- Keep product copy human and trustworthy. Do not use phrases like `for this SKU` in customer-facing content.
- Use JSON-LD/schema, Shopify category, Google/Facebook product category fields, product metafields, alt text, and collection mapping to support machine understanding.
- Do not promise ranking positions. The goal is best-practice ecommerce SEO/GEO/AEO readiness, not a guaranteed Google first-page claim.
- Write for a global English-speaking buyer base, including customers in India, the USA, Europe, Malaysia, Singapore and similar markets. Use globally understandable product terms plus truthful regional terms such as `mukut`, `kireedam`, `alankaram`, `long necklace`, `deity crown`, and `Bharatanatyam` where relevant.
- SEO titles must be specific, concise and unique. Prefer product type + key visible attribute + use case, for example `Deity Long Necklace Pink Green Stones Pearl Drops`, instead of vague titles like `Beautiful Deity Jewellery`.
- Meta descriptions should help the buyer decide, not repeat mechanical phrases. Use size, material, use case and visual differentiator naturally.
- Avoid duplicate product descriptions. Similar products may share a structure, but each description must include the actual visible style, stone shape/color, included pieces, size and use case for that product.
- Avoid generic AI phrases such as `premium e-commerce product`, `perfect for every occasion`, `elevate your style`, `for this SKU`, or repeated `compare before ordering` wording. Keep the language factual, buyer-useful and product-specific.
- Keep SEO meta descriptions close to 150-160 characters when possible. They can be shorter when the product is clear; avoid 190-200 character meta descriptions unless there is a strong reason.
- Image alt text should not be duplicated across every product image. Use the same product identity but vary the image-specific angle/detail, such as front view, angled view, close-up, pendant detail, pearl drops, or stone detail.
- If a product has visible multi-color stones, do not oversimplify the title or color fields. Example: if a black kemp necklace shows green and purple/maroon stones, use `green purple` or `green, purple and clear stones`, not only `green stone`.
- For Shopify/UCP/agent-commerce readiness, every product should carry enough structured fields for an agent to identify brand, product type, material, color, gender/age audience, country of origin, HS/HSN code, included components, fit guidance and FAQs without relying only on prose.
- Every important product page should be understandable from extracted sections alone. A retrieved paragraph or image-alt line should still clearly say what the product is, who it is for, visible color/material facts, what is included, and what the buyer should check.
- Do not create AI-only text, hidden markdown copies, or artificial fragments as a substitute for real product facts. Clear human-readable sections and structured Shopify fields are the standard.

### Merchant And Agent-Commerce Fields

For jewellery in Apparel & Accessories, fill Google/Merchant and custom fields wherever truthful and available:

- `mm-google-shopping.google_product_category`: use the relevant numeric Google category, such as `196` for necklaces where appropriate.
- `mm-google-shopping.condition`: `new`.
- `mm-google-shopping.custom_product`: `true` when no GTIN/brand-manufacturer barcode exists.
- `mm-google-shopping.age_group`: for Bharatanatyam/Kuchipudi jewellery, default `adult` unless the tracker says kids.
- `mm-google-shopping.gender`: for Bharatanatyam/Kuchipudi jewellery, default `female` unless owner says otherwise.
- `mm-google-shopping.color`: use slash-separated real colors, primary first, such as `Black/Green/Purple/Clear`; do not use vague `multicolor` when actual colors can be named.
- `mm-google-shopping.material`: material such as `Brass`, `Alloy metal`, `Copper`, or owner-confirmed material.
- `mm-google-shopping.size`: owner/tracker size label such as `One Size`, or exact size where available.
- Mirror useful feed fields into `mc-facebook` where the store uses Facebook/Instagram catalog data.

Custom trust/detail fields to fill when available:

- `custom.brand`: `Golden Collections`.
- `custom.country_of_origin`: usually `India`.
- `custom.hsn_code`: the confirmed HS/HSN base code, such as `711719` for base-metal imitation jewellery.
- `custom.product_details`: JSON facts table for brand, product type, jewellery type, material, finish, color, size, set includes, origin and HS code.
- `custom.product_faqs`: JSON FAQs specific to the product/category.
- `custom.key_features`: JSON list of concrete product features, not generic sales claims.
- `custom.ai_product_intelligence`: JSON summary for UCP/agent-commerce fields such as SKU, category, product type, audience, material, visible colors and set includes.

Measurement/scale rule:

- Do not create fake measurement claims or fake scale images.
- If no exact necklace drop/width exists, say `One Size` and add clear fit guidance from photos.
- A true measurement/scale image requires either owner-provided measurements or a new product photo with ruler/scale.

## Google Merchant Center Image Feed Rule

Google Merchant Center image requirements conflict with the owner-preferred storefront watermark rule. Google requires the main `image_link` product image for ads/free listings to be a clean product image without overlays such as watermarks, merchant brand names, logos, barcodes, or borders unless those elements are an inherent part of the product.

Operating decision:

- Shopify storefront product images may use the brand-gold `GoldenCollections.com` center watermark for anti-copy protection.
- Google Merchant Center should receive a clean, non-watermarked main image wherever the feed setup allows it.
- Keep clean feed images in a separate generated folder, for example `10_Processed-Shopify-Ready\SKU-clean-feed`, and keep watermarked storefront images in the normal processed/uploaded folders.
- Clean feed images must show the same actual product/variant as the Shopify page, with no watermark, no SKU stamp, no border, no promotional text, and a stable public HTTPS image URL.
- Supplemental feed rows must use the exact Merchant Center item `id` from the primary feed. For Shopify Google app feeds this is often shaped like `shopify_COUNTRY_PRODUCTID_VARIANTID`, but the exact id must be confirmed in Merchant Center before scaling.
- Preferred implementation options are:
  - Use a supplemental data source/feed in Merchant Center to override `image_link` with the clean image URL while Shopify storefront keeps watermarked media.
  - Use a feed management app or custom feed/API that sends clean `image_link` and optional `additional_image_link` values separately from Shopify storefront media.
  - If using the Shopify Google & YouTube app only, test whether Merchant Center accepts an `image_link` override for a small SKU set before scaling.
- Do not assume the Shopify first product image is Merchant-safe when it has a watermark.

## Image Processing Standard

Research basis:

- Shopify product media guidance says square product images at `2048 x 2048 px` usually display best.
- Shopify supports product/collection images up to `5000 x 5000 px` or `25 megapixels`, with file size below `20 MB`.
- Shopify recommends consistent aspect ratios for featured/main product images so collection pages display evenly.
- Shopify recommends JPEG for product photos and PNG for logos/icons/transparency.

Source URLs:

- `https://help.shopify.com/en/manual/products/product-media/product-media-types`
- `https://help.shopify.com/en/manual/online-store/images/theme-images`
- `https://www.shopify.com/blog/image-sizes`

Golden Collections standard:

```text
Default final product image size: 2048 x 2048 px
Default aspect ratio: 1:1 square
Format: JPG for product photos
Color profile: sRGB
Background: white or very light neutral
Composition: centered, full product visible, no cropping of jewellery
File target: preferably under 500 KB to 1.5 MB after compression
Watermark: centered Golden Collections watermark
```

Important Golden Collections override:

- Do not blindly force every product into a square canvas if that creates large white borders or makes the product look small.
- First check existing active products in the same collection and match that product family's image ratio.
- Deity short necklaces should use the existing store pattern of `990 x 1320 px` portrait images.
- For tall items such as long harams, jada, vagamalai, malas, or deity long ornaments, use the best family-matched portrait ratio with enough padding so the whole product is visible.
- Product should fill the frame as much as possible while preserving measurement trust and not cropping jewellery.
- Image alt text should describe the visible product and view naturally. Do not include SKU in alt text unless there is a specific operational reason.

Desired product-photo treatment:

- Soft studio lighting.
- Sharp focus.
- Vibrant but realistic colors.
- Centered composition.
- High resolution.
- Clean background.
- No distracting props.
- Minimal shadows where possible.
- Premium ecommerce look without changing the actual product design, color, material, size impression, or included items.

## Watermark Standard

Owner decision on 2026-05-12:

Use center watermark on all product images, including the first image, because image copying is common in this industry.

Selected file:

`G:\My Drive\GC\00_Brand\watermark-center-gc-logo-and-website.png`

Revision on 2026-05-12 after first live product review:

- Use one clear center watermark, not a layered logo plus separate website text that reads like two watermarks.
- Current selected watermark is a brand-gold single-line `GoldenCollections.com` center mark.
- Capitalization must be exactly `GoldenCollections.com`, with capital `G` and `C`.
- Apply the center watermark to all images, including the first image.
- Add the final SKU stamp at bottom-right of every image.
- Regenerate product images from raw source files when adjusting watermark strength; do not process already-watermarked output files.
- Current watermark strength should be visibly darker than the first two pilot passes: brand-gold center mark at a medium-dark opacity with a subtle shadow so it remains visible on white/gold product photos without hiding jewellery details.

Tracker implication:

- Owner does not need to fill `Watermark Rule`.
- Codex should treat the watermark rule as fixed: apply this center watermark to all product images unless the owner explicitly changes the rule.

Source logo retained:

`G:\My Drive\GC\00_Brand\golden-logo-original.png`

Deleted unused watermark experiments after selection.

Tradeoff:

- Center watermark improves anti-copy protection.
- It may reduce clean-image quality for Google Shopping/Merchant Center compared with an unwatermarked main image.
- Owner preference is to prioritize image protection.

## End-To-End Workflow

Owner workflow:

1. Choose the correct product category folder.
2. Drop product images into `00_New-Raw-Images`.
3. Name images using `ImagePrefix_1`, `ImagePrefix_2`, `ImagePrefix_3`.
4. Fill one row per product in the Google Sheet.
5. Provide price, stock, material, size, set includes, suitable for, primary collection, and extra collections.
6. Set `Status` to `Ready`.
7. Ask Codex to process that category folder.

Codex workflow:

1. Read this wiki page.
2. Read the tracker rows marked `Ready`.
3. Validate that each ready product has exactly the expected images.
4. Check required fields and mark missing/unclear rows as `Needs Info`.
5. Process images to the Golden Collections standard.
6. Apply the selected center watermark.
7. Rename final images with SEO-friendly names.
8. Generate product title, SEO title, meta description, product description, alt text, tags, and collection mapping from the tracker and Golden Collections KB.
9. Upload images to Shopify.
10. Create products as draft unless owner explicitly approves going live.
11. Update tracker with Shopify status, product ID, handle, uploaded date, errors, and notes.

## First Test Flow

Recommended pilot:

1. Add 1 product with 3 images to:

```text
G:\My Drive\Golden-Product-Uploads\01_Products\Deity-God-Jewellery\Necklace\Short-Necklace\00_New-Raw-Images
```

2. Name files:

```text
img-001_1.jpg
img-001_2.jpg
img-001_3.jpg
```

3. Fill one tracker row and set `Status` to `Ready`.
4. Ask Codex: `Process the deity short necklace test product.`

Only after the pilot looks right should larger 20-40 product category batches be processed.

## Pilot Upload Log

### 2026-05-12: First Deity Short Necklace

Input:

- Category: deity short necklace.
- Raw image group: `img-001_1.JPG`, `img-001_2.JPG`, `img-001_3.JPG`.
- Product facts: INR 1500, stock 1, alloy metal with stone work, 9 x 6 inches, multi color, one necklace, suitable for all god and goddess idols.

SKU:

- Existing Shopify `DSN` SKUs used the older hyphen format and reached at least `DSN-217`.
- New no-hyphen SKU assigned: `DSN218`.

Created Shopify product:

- Product ID: `gid://shopify/Product/10126065074474`.
- Handle: `deity-short-necklace-pink-green-stones-idols-dsn218`.
- Title: `Deity Short Necklace with Pink Green Stones for Idols`.
- Status: `ACTIVE` after correction and review.
- Primary collection: `Deity Short Necklace` / `deity-short-harams`.
- Auto-associated collections observed on read-back: `Deity Jewellery`, `Deity Necklaces`.
- Online product URL: `https://www.goldencollections.com/products/deity-short-necklace-pink-green-stones-idols-dsn218`.

Corrections made after admin review:

- Theme template set to `deity-lite`.
- Shopify category set to `Apparel & Accessories > Jewelry > Necklaces`.
- Variant barcode set equal to SKU: `DSN218`.
- Product weight set to `660 g`, matching the existing active short-necklace pattern.
- Deity/product/category metafields filled, including material, size, ornament type, placement, deity compatibility, Google Shopping category, and Facebook category fields.
- Product published to Online Store, Point of Sale, Facebook & Instagram, Google & YouTube, Inbox, Shop, and the custom app publication.
- Public product page returned `200` and included live JSON-LD structured data.
- SEO title and meta description were revised to remove SKU from search-facing copy.
- Customer-facing description was revised to remove the phrase `for this SKU`.
- Image alt text was revised to remove SKU while keeping the visible SKU stamp on images.
- Shopify tags and SEO keyword tracker values were revised to avoid calling a short necklace `haram`.

Processed images:

```text
G:\My Drive\Golden-Product-Uploads\01_Products\Deity-God-Jewellery\Necklace\Short-Necklace\10_Processed-Shopify-Ready\DSN218-portrait
G:\My Drive\Golden-Product-Uploads\01_Products\Deity-God-Jewellery\Necklace\Short-Necklace\20_Uploaded-To-Shopify\DSN218
```

Final Shopify image output:

- Size: `990 x 1320 px`.
- Format: JPG.
- Center watermark applied on all images; later revised to one brand-gold single-line `GoldenCollections.com` mark.
- SKU stamp `DSN218` applied bottom-right on all images.
- SEO alt text applied per image.

Merchant Center clean-image test setup:

- Generated clean feed image with no watermark, no SKU stamp, no border and no promotional text:
  `G:\My Drive\Golden-Product-Uploads\01_Products\Deity-God-Jewellery\Necklace\Short-Necklace\10_Processed-Shopify-Ready\DSN218-clean-feed\deity-short-necklace-pink-green-stone-idols-clean-feed-dsn218.jpg`
- Shopify Files public URL:
  `https://cdn.shopify.com/s/files/1/0764/9224/3242/files/deity-short-necklace-pink-green-stone-idols-clean-feed-dsn218.jpg?v=1778583961`
- Clean image dimensions: `1500 x 2000 px`.
- Shopify product legacy ID: `10126065074474`.
- Shopify variant legacy ID: `51531459985706`.
- Likely India Merchant Center item id candidate: `shopify_IN_10126065074474_51531459985706`.
- Backup US candidate if the primary feed uses US target country: `shopify_US_10126065074474_51531459985706`.
- Google Sheet tab `Merchant Feed Test` was created in the product upload master sheet to hold the test URL and id candidates.
- Google Sheet tab `Merchant Feed Upload IN` was created with only `id` and `image_link` columns for a clean Merchant Center supplemental feed test using the likely India item id.
- Still required for a full pass/fail result: confirm the exact product `id` inside Merchant Center, import the supplemental feed row, and check Merchant Center product details/diagnostics after processing.

### 2026-05-12: First Ready Batch Draft Upload

Input rows:

- Row 3: `DGCG001`, deity gold plated crown, `IMG_1.JPG` through `IMG_4.JPG`.
- Row 4: `DLN1047`, deity long necklace, `A_1.JPG` through `A_3.JPG`.
- Row 5: `DLN1048`, deity long necklace, `B_1.JPG` through `B_3.JPG`.

Created Shopify drafts:

| SKU | Product ID | Handle | Status |
| --- | --- | --- | --- |
| DGCG001 | `gid://shopify/Product/10126173176106` | `deity-gold-plated-crown-idols-dgcg001` | `DRAFT` |
| DLN1047 | `gid://shopify/Product/10126173438250` | `deity-long-necklace-pink-green-stones-pearl-drops-idols-dln1047` | `DRAFT` |
| DLN1048 | `gid://shopify/Product/10126173602090` | `deity-long-necklace-pink-green-stones-idols-dln1048` | `DRAFT` |

Readback checks:

- All three products are drafts for owner review, not live.
- Template suffix is `deity-lite`.
- Barcode equals SKU for all products.
- Charge tax is off for all three products after correction.
- Country/Region of origin is set to `IN`.
- HS code is set to `711719` for the three alloy/base-metal plated jewellery drafts. `711790` was not used because it applies to imitation jewellery of other than base metal.
- Storefront images are `990 x 1320 px`, JPG, with center brand-gold `GoldenCollections.com` watermark and bottom-right SKU stamp.
- The storefront watermark was strengthened twice after review because the first passes were too light on gold/white product photos.
- Clean feed images were also generated locally at `1500 x 2000 px` with no watermark, no SKU stamp, no border, and no promotional overlay.
- Crown category is `Religious & Ceremonial > Religious Items`, Google category `97`, primary collection `deity-crowns`.
- Long necklace category is `Apparel & Accessories > Jewelry > Necklaces`, Google category `196`, primary collection `deity-long-harams`.
- Shopify smart collections also associated the drafts with higher-level deity jewellery/necklace/crown collections.
- SEO titles and meta descriptions are clean and do not include SKUs.
- Product copy, tags, and alt text avoid SKU language. SKU remains in SKU field, barcode, handle, tracker/admin notes, filenames, and image stamp.
- SEO/body copy was revised to avoid vague wording and repeated mechanical phrases such as `compare before ordering`.
- Long necklace products now also carry general/common deity compatibility metafields because the tracker says they are suitable for all god and goddess idols by measured fit.
- Current Shopify draft weights remain as draft values, but the owner must confirm exact weights before publish because `Weight (g)` is now mandatory owner input.
- Row 4 title was corrected from `Deity Long Necklace with Green Stone Pendant for Idols` to `Deity Long Necklace with Pink Green Stones and Pearl Drops for Idols` because the photos show pink/green stones and pearl drops.
