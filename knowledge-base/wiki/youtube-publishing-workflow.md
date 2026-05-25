# YouTube Publishing Workflow

Backlinks: [[index.md]], [[business-entity.md]], [[content-roadmap.md]], [[google-business-profile-workflow.md]], [[pinterest-publishing-workflow.md]]

Last updated: 2026-05-21

## Purpose

This page records the Golden Collections YouTube integration plan for uploading videos from Codex.

Use this page before creating or uploading YouTube videos for Golden Collections, especially videos generated from HyperFrames, HeyGen, Shopify blog content, product guides, or KB-backed educational scripts.

## Current Status

As of 2026-05-21:

- YouTube Data API v3 is enabled in the Google Cloud project.
- Local Codex scripts are prepared for YouTube OAuth, channel check, and MP4 upload.
- OAuth client redirect URI added: `http://localhost:3002/youtube/callback`.
- OAuth consent scopes added: `youtube.upload` and `youtube.readonly`.
- YouTube OAuth completed locally and token saved under `tmp/`.
- Channel check succeeded.
- Correct connected channel: `https://www.youtube.com/@Goldencollections`.
- Connected channel ID: `UC7s4UaUciea8qQPGavdLg4A`.
- Connected channel title: `Goldencollections`.
- Connected channel custom URL: `@Goldencollections`.
- Channel read-back showed `7630` subscribers and `366` videos on 2026-05-21.
- Upload scripts now guard against accidental uploads to the wrong channel by checking the expected channel before upload.
- No video has been uploaded to YouTube from Codex yet.
- The same Google Cloud OAuth client may be reused if `YOUTUBE_*` keys are not present; YouTube scripts fall back to `GOOGLE_GBP_CLIENT_ID` and `GOOGLE_GBP_CLIENT_SECRET`.

Important distinction:

- YouTube upload is separate from Google Business Profile posting.
- YouTube uses its own OAuth scopes and quota rules.
- Google Business Profile API access being pending does not block YouTube API testing.

## Credentials And Secret Handling

YouTube credentials should be stored only in the local environment file:

```text
C:\goldencollections-theme\env
```

Preferred YouTube-specific keys:

```text
YOUTUBE_CLIENT_ID
YOUTUBE_CLIENT_SECRET
YOUTUBE_REDIRECT_URI
```

Fallback behavior:

- If `YOUTUBE_CLIENT_ID` and `YOUTUBE_CLIENT_SECRET` are missing, scripts reuse `GOOGLE_GBP_CLIENT_ID` and `GOOGLE_GBP_CLIENT_SECRET`.
- If `YOUTUBE_REDIRECT_URI` is missing, scripts default to:

```text
http://localhost:3002/youtube/callback
```

Security rules:

- Never paste actual client secret, refresh token, or access token values into the wiki, Git commits, chat summaries, screenshots, or public docs.
- Treat `env`, `.env`, OAuth token files, and YouTube OAuth logs as local-only secret/runtime files.
- OAuth token files are generated under `tmp/` and should not be committed.

## OAuth Configuration

Recommended local redirect URI:

```text
http://localhost:3002/youtube/callback
```

Required OAuth scopes:

```text
https://www.googleapis.com/auth/youtube.upload
https://www.googleapis.com/auth/youtube.readonly
```

Console setup:

1. In Google Cloud, confirm YouTube Data API v3 is enabled.
2. In the OAuth client, add the authorized redirect URI above.
3. In OAuth consent screen scopes, add `youtube.upload`.
4. Keep the app in External / Testing unless Google requires app verification for production.
5. Keep `goldencollections79@gmail.com` as a test user for the channel owner account. `goldencollections9@gmail.com` may remain as an additional approved tester if needed.

## Local Scripts

OAuth callback and token generation:

```text
C:\goldencollections-theme\scripts\youtube-oauth-callback.mjs
```

Shared YouTube helper:

```text
C:\goldencollections-theme\scripts\youtube-lib.mjs
```

Channel check:

```text
C:\goldencollections-theme\scripts\youtube-check-channel.mjs
```

MP4 upload:

```text
C:\goldencollections-theme\scripts\youtube-upload-video.mjs
```

Runtime outputs:

```text
C:\goldencollections-theme\tmp\youtube-token.json
C:\goldencollections-theme\tmp\youtube-auth-url.txt
C:\goldencollections-theme\tmp\youtube-channel.json
C:\goldencollections-theme\tmp\youtube-upload-result.json
```

## Upload Workflow

After OAuth is configured:

1. Run the YouTube OAuth callback script.
2. Open the generated Google authorization URL.
3. Approve with the YouTube channel owner/manager account.
4. Confirm `tmp/youtube-token.json` exists.
5. Run the channel check script and verify the correct Golden Collections channel is connected.
6. Create or choose an MP4 video.
7. Set title, description, tags, category, and privacy status through env variables or a purpose-built upload script.
8. Run the upload script.
9. Record the YouTube video URL in the relevant content package, repurpose file, or publishing log.

Example commands:

```powershell
node scripts\youtube-oauth-callback.mjs
node scripts\youtube-check-channel.mjs
node scripts\youtube-upload-video.mjs "pinterest-upgrade-demo\renders\golden-collections-pinterest-upgrade-demo.mp4"
```

## Upload Metadata Env Variables

Optional variables for `youtube-upload-video.mjs`:

```text
YOUTUBE_UPLOAD_VIDEO_PATH
YOUTUBE_UPLOAD_TITLE
YOUTUBE_UPLOAD_DESCRIPTION
YOUTUBE_UPLOAD_TAGS
YOUTUBE_UPLOAD_CATEGORY_ID
YOUTUBE_UPLOAD_PRIVACY_STATUS
```

Default privacy status should be:

```text
private
```

Do not upload public videos until the owner explicitly approves the title, description, thumbnail, and final video.

## YouTube API Restrictions

Google's YouTube Data API documentation says video uploads from unverified API projects may be restricted to private visibility until the project passes YouTube API Services verification/audit.

Operational rule:

- Use private uploads for initial testing.
- Treat public publishing as a separate approval step.
- If Google blocks public visibility or requires verification, document the case status here before retrying.

## Content Rules For YouTube

YouTube uploads should be created only from approved Golden Collections content:

- Published Shopify blog articles.
- Live product collections.
- Approved educational guides.
- Owner-approved HyperFrames or HeyGen videos.
- Owner-approved product images and footage.

Good initial YouTube topics:

- Real kemp jewellery meaning and buying guide.
- How to choose jewellery for Bharatanatyam arangetram.
- How to measure idols for deity jewellery.
- Varalakshmi alankaram checklist.
- Black kemp jewellery range overview.

Do not upload:

- Unsupported history, certificate, or material claims.
- Unapproved AI-generated jewellery visuals that could misrepresent the product.
- Draft Shopify URLs.
- Videos with unreviewed product/pricing claims.
- Public videos without owner approval.

## Next Step

Choose an owner-approved MP4 and metadata package, then run a private test upload from Codex. Do not publish public videos until the owner approves the final video, title, description, thumbnail and visibility.
