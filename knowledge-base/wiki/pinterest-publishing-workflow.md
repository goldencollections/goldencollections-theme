# Pinterest Publishing Workflow

Backlinks: [[index.md]], [[business-entity.md]], [[content-roadmap.md]]

Last updated: 2026-05-24

## Purpose

This page records the Golden Collections Pinterest developer integration status and the operating workflow for direct Pin publishing from Codex.

Use this page before creating Pinterest Pins from Shopify blogs, product collections, or educational content.

## Current Status

As of 2026-05-24:

- Pinterest developer app: `Golden Collections Content Publisher`.
- Pinterest app purpose: internal Golden Collections workflow for publishing approved organic Pins from Shopify blog articles, product collections, and educational content.
- App ID: `1570604`.
- Standard access upgrade request: not approved yet.
- Standard access follow-up/status request: submitted through Pinterest Help Centre on 2026-05-21 as an API access / appeal status request, with the demo video attached.
- Pinterest Support response received on 2026-05-24: Trial access was revoked because the privacy policy did not mention Pinterest API data, and the submitted demo did not show enough Pinterest integration / full OAuth flow.
- Privacy policy was updated through Shopify on 2026-05-24 with a `Pinterest API and Pinterest-derived data` section.
- OAuth app connection: working locally through the configured callback.
- Board read/listing: working through the Pinterest API after OAuth authorization.
- Social Command Center board publishing adapter is implemented for Pinterest image Pins.
- Supabase has a seeded owner-review package for the Real Kemp Jewellery guide Pinterest test Pin.
- Public production Pin creation: not yet enabled until Pinterest approves Standard access.
- Trial-access result observed: Pinterest API returned a production restriction error for `POST /v5/pins`, saying Trial apps may not create Pins in production and should use Sandbox instead.

Important distinction:

- Codex can run the OAuth and publishing workflow locally.
- Real public Pin creation should be retried only after Pinterest grants Standard access.

## 2026-05-24 Pinterest Review Blocker

Pinterest asked for two fixes before the next approval pass:

1. Privacy policy wording:
   - State that Golden Collections uses the Pinterest API.
   - State that Golden Collections is not endorsed by or affiliated with Pinterest.
   - Explain what happens to Pinterest-derived data when a user disconnects or revokes authorization.
   - Confirm that Golden Collections does not resell or redistribute Pinterest content or Pinterest-derived data to third parties.
2. Demo video:
   - Show the full Pinterest OAuth flow.
   - Show the actual Pinterest integration, including authorization, return to the app, board selection/listing, Pin preparation, and the publishing/API step.

Policy update status:

- Shopify Privacy Policy updated on 2026-05-24.
- Admin policy URL verified with the new section: `https://checkout.shopify.com/76492243242/policies/32313245994.html?locale=en`.
- Public URL to cite in Pinterest reply: `https://www.goldencollections.com/policies/privacy-policy`.
- Public storefront cache may take a short time to show the new section without a theme preview parameter; verify before sending the final reply.

Reply to Pinterest:

```text
Hi Teri,

Thank you for the clear guidance. We have updated our Privacy Policy to include Pinterest-API-specific language:

https://www.goldencollections.com/policies/privacy-policy

It now states that Golden Collections uses the Pinterest API for our owner-approved publishing workflow, that Golden Collections is not endorsed by or affiliated with Pinterest, what happens to Pinterest-derived data after disconnect/revocation, and that we do not resell or redistribute Pinterest content or Pinterest-derived data to third parties.

Please re-enable Trial access for app ID 1570604 so we can record and submit a revised demo video showing the complete Pinterest OAuth flow and Pinterest integration.

Thank you,
Anil
```

## Credentials And Secret Handling

Pinterest app credentials are available in the local environment file:

```text
C:\goldencollections-theme\env
```

Expected keys:

```text
PINTEREST_APP_ID
PINTEREST_APP_SECRET
PINTEREST_REDIRECT_URI
```

Security rules:

- Never paste the actual secret values into the knowledge base, blog packages, Git commits, chat summaries, screenshots, or public docs.
- Treat `env`, `.env`, OAuth token files, and Pinterest logs as local-only secret/runtime files.
- OAuth access tokens are generated locally and saved under `tmp/`; they should not be committed.
- If a token expires, rerun the OAuth callback flow rather than storing long-lived tokens in the wiki.

## OAuth Configuration

Configured redirect URI:

```text
http://localhost:3000/pinterest/callback
```

Required OAuth scopes for the Golden Collections publishing workflow:

```text
boards:read
boards:write
pins:read
pins:write
user_accounts:read
```

Reason for `boards:write`:

- Pinterest required `boards:write` when attempting to create a Pin, even though the workflow is only selecting existing boards and creating organic Pins.

## Local Scripts

OAuth callback and token generation:

```text
C:\goldencollections-theme\scripts\pinterest-oauth-callback.mjs
```

Real kemp guide test Pin publisher:

```text
C:\goldencollections-theme\scripts\pinterest-publish-real-kemp-pin.mjs
```

Current OAuth runtime output:

```text
C:\goldencollections-theme\tmp\pinterest-token.json
```

Current API result output path for the real kemp test publisher:

```text
C:\goldencollections-theme\tmp\pinterest-real-kemp-pin-result.json
```

Social Command Center adapter:

```text
C:\goldencollections-theme\whatsapp-automation\lib\pinterest-publisher.js
```

Seeded Supabase package:

```text
Real Kemp Jewellery guide Pinterest Pin
```

The board UI accepts a Pinterest board name and optional board ID. The first seeded target uses:

```text
Board name: Bharatanatyam Dance Jewellery
Destination: https://www.goldencollections.com/blogs/jewellery-guides/real-kemp-jewellery-guide
Image: https://cdn.shopify.com/s/files/1/0764/9224/3242/articles/gc-real-kemp-arangetram-set-bks001-2026.jpg?v=1778696580
```

## Demo Video For Pinterest Review

Pinterest requested a video demo showing authentication and app features. A HyperFrames MP4 demo was created for the Standard access request:

```text
C:\goldencollections-theme\pinterest-upgrade-demo\renders\golden-collections-pinterest-upgrade-demo.mp4
```

Video details:

- Length: 65 seconds.
- Format: MP4 / H.264.
- Size: about 4.2 MB.
- Shows OAuth, board loading/selection, Shopify content preparation, and intended `POST /v5/pins` publishing flow.
- Clearly states that Trial access blocks production Pin creation and Standard access enables the final production publish step.

This earlier demo is not enough for the next submission because Pinterest specifically said it did not show full OAuth flow and enough Pinterest integration. Record a new demo after Trial access is re-enabled.

Required new demo outline:

1. Open Social Command Center.
2. Click/connect Pinterest from the board or settings flow.
3. Show redirect to Pinterest OAuth consent.
4. Approve with the GoldenCollectionsJewelry Pinterest account.
5. Show return to the app callback/success screen without exposing tokens.
6. Show board listing/selection from Pinterest API.
7. Show image/title/description/destination URL prepared for a Pin.
8. Show the final Pin API call or publish attempt and the success/result state.
9. Mention that the workflow is owner-approved and only for Golden Collections content.

## Direct Publishing Workflow After Approval

After Pinterest grants Standard access:

1. Confirm `env` contains the Pinterest app ID, app secret, and redirect URI.
2. Run the OAuth callback script.
3. Open the generated Pinterest authorization URL and approve access.
4. Confirm `tmp/pinterest-token.json` exists.
5. Set `PINTEREST_STANDARD_ACCESS_APPROVED=true` only after Pinterest approval is confirmed.
6. Keep `PINTEREST_BOARD_PUBLISHING_ENABLED=true` for board-controlled owner-approved posting.
7. In Social Command Center, approve the Pinterest variant, confirm board/image/copy/link, and click `Publish / Pack`.
8. Verify the returned board, Pin ID, and Pinterest Pin URL.
9. Record the Pin URL back into the relevant blog repurpose package or publishing log.

Example commands:

```powershell
node scripts\pinterest-oauth-callback.mjs
node scripts\pinterest-publish-real-kemp-pin.mjs
```

If the API still returns a Trial or access-tier error, do not retry repeatedly. Check Pinterest developer app status first.

## Content Rules For Pins

Pinterest Pins should be created only from approved Golden Collections content:

- Published Shopify blog articles.
- Live product collections.
- Approved educational guides.
- Approved product imagery or Shopify-hosted article images.

Pin content should include:

- Board ID.
- Pin title.
- Pin description from the blog repurpose package.
- Destination URL on `goldencollections.com`.
- Approved image URL.

Do not publish:

- Unapproved AI-generated jewellery images.
- Draft Shopify URLs.
- Unsupported history, certificate, or material claims.
- Content that implies Trial access already created public production Pins.

## Current Test Target

The first intended production test Pin is for the real kemp pillar article:

```text
https://www.goldencollections.com/blogs/jewellery-guides/real-kemp-jewellery-guide
```

Repurpose source:

```text
C:\goldencollections-theme\blog-system\outputs\repurpose\2026-05-13-real-kemp-jewellery-guide-repurpose.md
```

Current image target:

```text
https://cdn.shopify.com/s/files/1/0764/9224/3242/articles/gc-real-kemp-arangetram-set-bks001-2026.jpg?v=1778696580
```

## Next Step

Verify the public privacy policy shows the Pinterest API section, reply to Pinterest asking Trial access to be re-enabled, then record the new OAuth-to-Pin demo. Once Pinterest approves Standard access, set `PINTEREST_STANDARD_ACCESS_APPROVED=true`, refresh the Social Command Center, and publish the seeded Real Kemp Pinterest test Pin from the board.
