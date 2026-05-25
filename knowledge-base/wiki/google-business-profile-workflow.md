# Google Business Profile Publishing Workflow

Backlinks: [[index.md]], [[business-entity.md]], [[content-roadmap.md]], [[pinterest-publishing-workflow.md]]

Last updated: 2026-05-21

## Purpose

This page records the planned Golden Collections Google Business Profile integration for direct Google Posts from Codex.

Use this page before discussing direct publishing to Google Business Profile, Google Posts, local SEO updates, or reuse of Shopify blog repurpose content for Google.

## Current Status

As of 2026-05-14:

- Google Business Profile direct publishing is planned.
- Local Codex scripts are prepared for OAuth, account/location discovery, and a first test Google Post.
- Google Cloud OAuth credentials are present in `C:\goldencollections-theme\env`.
- OAuth authorization works locally after setting the app to External/Testing and adding approved test users.
- OAuth re-authorization was refreshed successfully on 2026-05-21; the current blocker is API quota/access, not login.
- Google Business Profile API access/quota must still be granted by Google before account/location reads or publishing can work.
- Current blocker observed: `mybusinessaccountmanagement.googleapis.com` returns HTTP `429 RESOURCE_EXHAUSTED` because the project has `0` default requests per minute quota.
- Google Business Profile API access request submitted through the GBP API contact form. Case ID: `6-0195000040588`.
- Google stated the expected review time is approximately `7-10 business days`.
- No real Google Post has been created from Codex yet.
- Follow-up package prepared on 2026-05-21: `knowledge-base/outputs/google-business-profile-api-followup-2026-05-21.md`.

Important distinction:

- Pinterest and Google are separate API integrations.
- Pinterest Standard access request is pending.
- Google Business Profile requires its own Google Cloud OAuth setup, API enablement, and Business Profile access.

## Credentials And Secret Handling

Google credentials should be stored only in the local environment file:

```text
C:\goldencollections-theme\env
```

Expected keys:

```text
GOOGLE_GBP_CLIENT_ID
GOOGLE_GBP_CLIENT_SECRET
GOOGLE_GBP_REDIRECT_URI
GOOGLE_GBP_ACCOUNT_ID
GOOGLE_GBP_LOCATION_ID
```

Security rules:

- Never paste actual client secret, refresh token, or access token values into the wiki, blog packages, Git commits, screenshots, or public docs.
- Treat `env`, `.env`, OAuth token files, and Google OAuth logs as local-only secret/runtime files.
- OAuth token files are generated under `tmp/` and should not be committed.
- If Google OAuth refresh fails, rerun the OAuth flow instead of saving tokens in the wiki.

## OAuth Configuration

Recommended local redirect URI:

```text
http://localhost:3001/google/callback
```

Required OAuth scope:

```text
https://www.googleapis.com/auth/business.manage
```

Google OAuth notes:

- Use OAuth client type `Web application`.
- Add the local redirect URI above to the authorized redirect URIs.
- Use `access_type=offline` and `prompt=consent` so Google returns a refresh token.

## Google APIs Needed

Enable/request access for:

- My Business Account Management API.
- My Business Business Information API.
- My Business API / local posts endpoint access for Google Business Profile posts.

Google may require a Business Profile API access request and review before some endpoints work. If an API call returns access or permission errors, verify the Cloud project and Business Profile API approval before changing scripts.

## Local Scripts

OAuth callback and token generation:

```text
C:\goldencollections-theme\scripts\google-gbp-oauth-callback.mjs
```

Shared Google Business Profile helper:

```text
C:\goldencollections-theme\scripts\google-gbp-lib.mjs
```

Account/location discovery:

```text
C:\goldencollections-theme\scripts\google-gbp-list-accounts-locations.mjs
```

Real kemp guide test Google Post publisher:

```text
C:\goldencollections-theme\scripts\google-gbp-publish-real-kemp-post.mjs
```

Runtime outputs:

```text
C:\goldencollections-theme\tmp\google-gbp-token.json
C:\goldencollections-theme\tmp\google-gbp-auth-url.txt
C:\goldencollections-theme\tmp\google-gbp-accounts-locations.json
C:\goldencollections-theme\tmp\google-gbp-real-kemp-post-result.json
```

## Direct Publishing Workflow After Setup

After Google Cloud credentials and API access are ready:

1. Add Google keys to `env`.
2. Run the OAuth callback script.
3. Open the generated Google authorization URL and approve access with the Google account that manages Golden Collections Business Profile.
4. Confirm `tmp/google-gbp-token.json` exists.
5. Run the account/location discovery script.
6. Put the correct `GOOGLE_GBP_ACCOUNT_ID` and `GOOGLE_GBP_LOCATION_ID` in `env`.
7. Run the relevant Google Post publishing script.
8. Verify the returned post name/search URL and record it in the relevant blog repurpose package or publishing log.

Example commands:

```powershell
node scripts\google-gbp-oauth-callback.mjs
node scripts\google-gbp-list-accounts-locations.mjs
node scripts\google-gbp-publish-real-kemp-post.mjs
```

## Content Rules For Google Posts

Google Posts should be created only from approved Golden Collections content:

- Published Shopify blog articles.
- Live product collections.
- Approved educational guides.
- Approved product images or Shopify-hosted article images.

Post content should include:

- Short buyer-useful summary.
- `LEARN_MORE` call to action when pointing to a guide.
- Destination URL on `goldencollections.com`.
- Approved image URL.

Do not publish:

- Draft Shopify URLs.
- Unsupported history, certificate, or material claims.
- Unapproved AI-generated jewellery images.
- Posts that are stuffed with keywords instead of useful customer-facing text.

## Manual Posting Strategy For 2026

Until Google grants non-zero Business Profile API quota for GBP Help case `6-0195000040588`, use the manual Google Business Profile composer in Chrome.

Use a balanced mix rather than posting only blog links:

- Buyer-useful guides that answer real selection questions.
- First-hand proof stories and permissioned alankaram examples.
- Live money-page collections where customers can shop immediately.
- Product-family updates only when the linked collection/product is live, in stock where relevant, and has real product imagery.

For Golden Collections, the priority manual GBP sequence is:

1. Real Kemp Jewellery guide.
2. Hanuman Jayanti alankaram proof story.
3. Varalakshmi Alankaram Examples page.
4. Varalakshmi Pooja and Deity Jewellery collection.
5. Later rotations: Kemp Jewellery collection, deity crowns, deity necklaces, Bharatanatyam jewellery sets, and ghungroo/salangai.

Image guidance:

- Prefer real product, shop, proof, or alankaram photos.
- Avoid heavy text overlays, distracting logos, and heavily watermarked images in GBP media.
- Storefront product images may keep the Golden Collections watermark for anti-copy protection, but Merchant Center main product images should use clean non-watermarked image links wherever the feed setup allows it.

Manual update style:

- Use `Update` posts with `Learn more` for guides, proof stories, and collection pages.
- Keep copy short, specific, and buyer-useful.
- Do not put phone numbers in post descriptions; use built-in profile buttons when needed.
- Do not use unsupported certificate, official supplier, temple-approved, priest-approved, or endorsement claims unless separately confirmed in writing.
- If several posts are prepared in one day, verify each appears as `Live`, `Pending`, or reviewable in the Google Updates list after posting.

## Current Test Target

The first intended Google Post test is for the real kemp pillar article:

```text
https://www.goldencollections.com/blogs/jewellery-guides/real-kemp-jewellery-guide
```

Post summary prepared in:

```text
C:\goldencollections-theme\scripts\google-gbp-publish-real-kemp-post.mjs
```

Current image target:

```text
https://cdn.shopify.com/s/files/1/0764/9224/3242/articles/gc-real-kemp-arangetram-set-bks001-2026.jpg?v=1778696580
```

## Next Step

Wait for Google Business Profile API access approval for GBP Help case `6-0195000040588`. Once Google grants non-zero quota, rerun account/location discovery and publish the first test Google Post from Codex.

Weekly follow-up until resolved:

- Check whether Google has updated GBP Help case `6-0195000040588` or granted non-zero Google Business Profile API quota.
- If access is approved, rerun `node scripts\google-gbp-list-accounts-locations.mjs`.
- After account/location discovery works, add the review-management workflow: list unanswered reviews, draft replies for owner approval, flag low-rating support risks, and export recurring review themes into the content system.
