# Meta / Facebook / Instagram Workflow

Last updated: 2026-05-25

## Status

Meta business diagnostics were created and run from Codex on 2026-05-16, then refreshed for Social Command Center publishing on 2026-05-21.

Current confirmed Meta assets:

- Meta Business ID: `616419604506500`
- Business name: `Golden Collections`
- Business verification status: `verified`
- Meta app: `GoldenCollections App`
- App ID: `887425463811453`
- Token type used for diagnostics: `SYSTEM_USER`
- Current token scopes:
  - `business_management`
  - `whatsapp_business_management`
  - `whatsapp_business_messaging`
  - `whatsapp_business_manage_events`
  - `public_profile`
- Facebook Page found:
  - Name: `Golden Collections`
  - Page ID: `1537422259843226`
  - Fan count at check time: `23175`
  - Page verification status: `not_verified`
- Meta catalog ID known locally from env: `1449822553323795`
- Ad accounts visible through current token: `0`

Diagnostic output:

- `tmp/meta-business-diagnostics-2026-05-16.json`
- `tmp/meta-business-diagnostics-2026-05-21.json`

## Social Command Center Publishing Status

As of 2026-05-21:

- Facebook and Instagram board publishing are connected through a separate owner-login Meta publishing token.
- Verified Facebook Pages and linked Instagram professional accounts:
  - Page `Golden Collections` / `1537422259843226` -> Instagram `goldencollections_gbs` / `17841404574225927`.
  - Page `Deity Jewellery` / `104562424244697` -> Instagram `deity_jewellery` / `17841443887433226`.
  - Page `Bharatanatyam Jewellery - GoldenCollections.com` / `428783937470391` -> Instagram `bharatanatyamjewellery` / `17841405682664840`.
- Meta publishing token is currently valid. Re-run `npm run social:meta:check` before live posting if it has been a while.
- A separate Meta publishing OAuth flow has been added for board-controlled posting.
- Local OAuth helper:

```powershell
cd C:\goldencollections-theme\whatsapp-automation
npm run social:meta:oauth
```

For the published Meta app, prefer the production callback/manual exchange flow because `localhost` OAuth redirects are only allowed in Development mode:

```powershell
cd C:\goldencollections-theme\whatsapp-automation
npm run social:meta:auth-url -- --redirect https://www.goldencollections.com/meta/callback --config-id META_LOGIN_CONFIG_ID
npm run social:meta:exchange-code -- --url "PASTE_FULL_CALLBACK_URL_FROM_BROWSER"
```

Meta app settings for this flow:

- App Domains: `goldencollections.com`
- Facebook Login for Business / Valid OAuth Redirect URIs: `https://www.goldencollections.com/meta/callback`
- Facebook Login for Business / Configurations: create a configuration for Social Command Center publishing and use its `config_id` in the OAuth URL.

- Local publishing health check:

```powershell
cd C:\goldencollections-theme\whatsapp-automation
npm run social:meta:check
```

Publishing token file after owner authorization:

```text
C:\goldencollections-theme\tmp\meta-publishing-token.json
```

Required publishing permissions:

- Facebook Page publishing:
  - `pages_show_list`
  - `pages_read_engagement`
  - `pages_manage_posts`
- Instagram publishing:
  - `instagram_basic`
  - `instagram_content_publish`
  - `pages_show_list`
  - `pages_read_engagement`

Important gates:

- `META_CONTENT_PUBLISHING_ENABLED=true` in local board runtime after token verification.
- `FACEBOOK_PAGE_PUBLISHING_ENABLED=true` in local board runtime after token verification.
- `INSTAGRAM_PUBLISHING_ENABLED=true` in local board runtime after token verification.
- Keep `SOCIAL_REQUIRE_OWNER_APPROVAL=true`; every post still requires owner approval on the board.
- Instagram API publishing requires a public HTTPS image/video URL. Local files must be uploaded to a public asset URL before posting to Instagram.
- Instagram variants can target an account by username in the board, for example `goldencollections_gbs`, `deity_jewellery`, or `bharatanatyamjewellery`.
- Facebook Page publishing can post feed/link/photo/video variants through the Page token after the gates are enabled.

## Final Media Hosting Rule

Use this storage split for Social Command Center media:

- Google Drive is the raw/source workspace. Store staff uploads, long originals, event folders, documents, and review material there.
- Shopify Files/CDN is the final approved media host for public social assets. Upload the approved MP4/image to Shopify Files, use the resulting `https://cdn.shopify.com/...` URL as the `asset_url`, then publish Instagram/Pinterest/API variants from the board.
- Supabase should store workflow metadata only: package status, approvals, account routing, publish results, and error history. Do not use Supabase Free as the normal video host; the free limits are too small for repeated social video usage.

This does not slow the website merely because the video exists in Shopify Files. It affects storefront speed only if the video is embedded on a page. When reusing a Shopify CDN video on the website, use an optimized final clip, lazy loading, and a poster image.

For Instagram specifically:

1. Keep the raw video in Google Drive or local review storage.
2. Create the final approved MP4.
3. Upload that MP4 to Shopify Admin -> Content -> Files.
4. Copy the Shopify CDN URL.
5. Put that URL in the Instagram variant `asset_url`.
6. Publish from the board after owner approval.

## Instagram Account Routing Rules

Use these routing rules when preparing Instagram variants:

- `goldencollections_gbs` is the main Golden Collections account and should receive all approved jewellery posts, including general jewellery, deity jewellery, Bharatanatyam jewellery, kemp, and black kemp.
- `deity_jewellery` is niche-only. Use it only for deity jewellery, deity alankaram, god idol ornaments, deity crowns, harams, waist belts, earrings, and related deity education/proof content.
- `bharatanatyamjewellery` is niche-only. Use it only for Bharatanatyam jewellery, dance jewellery, real kemp, imitation kemp, black kemp, mattal, temple dance sets, dance accessories, and related Bharatanatyam/Kuchipudi content.

Practical rule:

- General content gets one Instagram variant for `goldencollections_gbs`.
- Deity content should usually get two Instagram variants: one for `goldencollections_gbs` and one for `deity_jewellery`.
- Bharatanatyam/kemp/black kemp content should usually get two Instagram variants: one for `goldencollections_gbs` and one for `bharatanatyamjewellery`.
- Do not send general jewellery posts to the niche accounts unless the content clearly belongs there.

## Shopify Channel Status

Shopify has a `Facebook & Instagram` publication/channel:

- Publication ID: `gid://shopify/Publication/158476501290`

Shopify Facebook & Instagram channel audit on 2026-05-16:

- Active products checked: `1780`
- Published to Facebook & Instagram before fix: `1779`
- Missing product fixed: `Varalakshmi Long Necklace with Green Stone Segments`
- Published to Facebook & Instagram after fix: `1780`
- Not published after fix: `0`

Diagnostic output:

- `tmp/meta-shopify-channel-audit-2026-05-16.json`

## Scripts

- `scripts/meta-lib.mjs` - shared Meta env loading and Graph API helper using `Authorization: Bearer` so tokens are not placed in URLs.
- `scripts/meta-business-diagnostics.mjs` - reads Meta business/page/ad/catalog readiness and writes a diagnostics JSON file.
- `scripts/meta-shopify-channel-audit.mjs` - audits Shopify active-product publication status for the Facebook & Instagram sales channel.

## Current Permission Gaps

The current Meta token can read the business and page, but it cannot read catalog/product diagnostics through the Meta API.

Failed checks:

- `owned_product_catalogs`: blocked because the application is not approved for that API.
- `catalog`: blocked because the application is not approved for catalog API use.
- `catalog_sample_products`: blocked because the application is not approved for catalog product reads.
- `owned_ad_accounts`: blocked by missing `ads_read` or `ads_management` permission.

Next permissions/capabilities to request if we want direct Meta diagnostics from Codex:

- `catalog_management`
- `ads_read`
- Continue `business_management`

Next permissions/capabilities needed for public Social Command Center posting:

- `pages_show_list`
- `pages_read_engagement`
- `pages_manage_posts`
- `instagram_basic`
- `instagram_content_publish`

## Recommended Operating Sequence

1. Keep Shopify as the product source of truth.
2. Use `scripts/meta-shopify-channel-audit.mjs` to verify products are published to Facebook & Instagram from Shopify.
3. Do not rely on Meta catalog API diagnostics until Meta app/API approval includes catalog access.
4. After catalog API access is approved, add direct catalog diagnostics:
   - product approval/disapproval state
   - image issues
   - price/availability mismatches
   - item-level rejection reasons
   - feed/product-set health
5. After `ads_read` is granted, add ad-account diagnostics:
   - account status
   - conversion tracking readiness
   - campaign/spend/ROAS snapshots
   - catalog or shopping ad issues
6. For Social Command Center posting, use the separate Meta publishing OAuth token, not the WhatsApp system-user token.
7. Do not enable Facebook/Instagram live gates until the owner has approved the exact board posting workflow.

## Rules

- Do not store Meta access tokens or app secrets in this wiki.
- Prefer read-only diagnostics first.
- Do not create campaigns, audiences, ads, or boosted posts without owner approval.
- Do not treat Shopify channel publication as proof of Meta catalog approval; it only confirms Shopify is sending products to the Facebook & Instagram channel.
- If Meta direct catalog access is blocked, use Shopify publication status and Google Merchant diagnostics as the safer interim source.
- Do not use the WhatsApp system-user token for public Facebook or Instagram posting.
