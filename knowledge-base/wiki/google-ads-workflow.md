# Google Ads Workflow

Backlinks: [[index.md]], [[business-entity.md]], [[merchant-center-workflow.md]], [[google-analytics-workflow.md]]

Last updated: 2026-05-14

## Purpose

This page records the Golden Collections Google Ads API integration plan and current setup status.

Use this page before inspecting Shopping campaign readiness, Performance Max status, search terms, ad spend, ROAS, conversion tracking, Google Ads account status, or Shopping/ads issues from Codex.

## Current Status

As of 2026-05-14:

- Google Ads API scripts are prepared locally.
- Google Ads OAuth completed locally and token file was saved under `tmp/`.
- `GOOGLE_ADS_DEVELOPER_TOKEN` is present in the local `env` file.
- Google Ads API customer listing works.
- Manager account is enabled:

```text
323-881-0054 / Golden Collections
```

- Accessible customers returned by the API:

```text
customers/9008483912
customers/3238810054
```

- The old ads account `900-848-3912` cannot be queried for metrics because Google Ads returns `CUSTOMER_NOT_ENABLED`; the UI also says the account is canceled/deactivated.
- The new manager account currently lists only itself under `customer_client`; the old account does not appear linked under the new manager yet.
- Merchant Center shows a linked/canceled Google Ads account in the UI:

```text
900-848-3912 / Golden Collections
```

Treat that customer ID as a candidate only until verified by Google Ads API.

## Why This Matters

Google Ads API should come after Merchant Center diagnostics because paid Shopping and Performance Max depend on feed quality.

Useful Ads API checks after setup:

- Accessible Google Ads customers.
- Shopping and Performance Max campaigns.
- Campaign status and account status.
- Cost, clicks, conversions, and conversion value.
- Search terms and product-group performance.
- Conversion tracking status.
- Merchant-linked product/campaign problems.

## Credentials And Secret Handling

Google Ads OAuth uses the local environment file:

```text
C:\goldencollections-theme\env
```

Preferred Google Ads-specific keys:

```text
GOOGLE_ADS_CLIENT_ID
GOOGLE_ADS_CLIENT_SECRET
GOOGLE_ADS_REDIRECT_URI
GOOGLE_ADS_DEVELOPER_TOKEN
GOOGLE_ADS_CUSTOMER_ID
GOOGLE_ADS_LOGIN_CUSTOMER_ID
```

Fallback behavior:

- If Google Ads-specific OAuth keys are missing, scripts reuse `GOOGLE_GBP_CLIENT_ID`, `GOOGLE_GBP_CLIENT_SECRET`, and `GOOGLE_GBP_REDIRECT_URI`.
- Default redirect URI is the existing Google callback:

```text
http://localhost:3001/google/callback
```

Security rules:

- Never paste actual client secret, refresh token, access token, or Google Ads developer token values into the wiki, Git commits, chat summaries, screenshots, or public docs.
- Treat `env`, `.env`, OAuth token files, developer tokens, and OAuth logs as local-only secret/runtime files.
- OAuth token files are generated under `tmp/` and should not be committed.

## OAuth Configuration

Required OAuth scope:

```text
https://www.googleapis.com/auth/adwords
```

Google Ads API also requires a developer token. OAuth alone is not enough.

## Local Scripts

OAuth callback and token generation:

```text
C:\goldencollections-theme\scripts\google-ads-oauth-callback.mjs
```

Shared Google Ads helper:

```text
C:\goldencollections-theme\scripts\google-ads-lib.mjs
```

List accessible customers:

```text
C:\goldencollections-theme\scripts\google-ads-list-accessible-customers.mjs
```

Read Shopping / Performance Max campaign readiness:

```text
C:\goldencollections-theme\scripts\google-ads-shopping-readiness.mjs
```

Runtime outputs:

```text
C:\goldencollections-theme\tmp\google-ads-token.json
C:\goldencollections-theme\tmp\google-ads-auth-url.txt
C:\goldencollections-theme\tmp\google-ads-accessible-customers.json
C:\goldencollections-theme\tmp\google-ads-customer-clients.json
C:\goldencollections-theme\tmp\google-ads-shopping-readiness.json
```

## Required Next Steps

1. Link old Google Ads account `900-848-3912` under manager account `323-881-0054`, if future campaign reads should happen through the manager.
2. Reactivate old account `900-848-3912` only if the owner intentionally wants the old ads account active again and understands the billing implications.
3. For manager-only reads, use `3238810054`.
4. For campaign/Shopping/PMax metrics, use a client account that is enabled.
5. Run:

```powershell
node scripts\google-ads-list-accessible-customers.mjs
node scripts\google-ads-list-customer-clients.mjs 3238810054
node scripts\google-ads-shopping-readiness.mjs <customerId>
```

## Operating Workflow

When Google Ads API access is complete:

1. Start with account/customer listing.
2. Verify whether account `900-848-3912` is accessible and active/canceled.
3. If it is active, read Shopping and Performance Max campaigns for the last 30 days.
4. Compare Ads revenue/conversion data with GA4.
5. Use Merchant Center diagnostics before changing Shopping campaign strategy.
6. Do not scale paid campaigns until feed disapprovals, stale products, and price/availability mismatches are under control.

## Official References

- Google Ads API OAuth: `https://developers.google.com/google-ads/api/docs/oauth/overview`
- Google Ads API developer token: `https://developers.google.com/google-ads/api/docs/get-started/dev-token`
- Google Ads API REST: `https://developers.google.com/google-ads/api/rest/overview`

## First Results

First Google Ads API read attempts after OAuth on 2026-05-14:

- Accessible customers read succeeded.
- API returned `customers/9008483912` and `customers/3238810054`.
- Manager customer-client read succeeded for `3238810054`.
- Manager account status is `ENABLED`, currency `INR`, time zone `Asia/Calcutta`.
- Shopping/PMax metrics against `3238810054` failed with `REQUESTED_METRICS_FOR_MANAGER`, which is expected because metrics must be queried against client accounts.
- Shopping/PMax metrics against `9008483912` failed with `CUSTOMER_NOT_ENABLED`, matching the UI notice that the old account is canceled/deactivated.

Earlier blocker before token was added:

```text
Missing GOOGLE_ADS_DEVELOPER_TOKEN in env. Google Ads API calls require a developer token from the Google Ads API Center.
```

That blocker is now resolved.

Google Ads API Center page:

```text
https://ads.google.com/aw/apicenter
```
