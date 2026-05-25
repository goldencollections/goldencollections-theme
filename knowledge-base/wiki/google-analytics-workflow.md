# Google Analytics Workflow

Backlinks: [[index.md]], [[business-entity.md]], [[search-console-workflow.md]], [[merchant-center-workflow.md]]

Last updated: 2026-05-14

## Purpose

This page records the Golden Collections GA4 API integration for conversion-aware SEO, GEO, content, and product-page decisions.

Use this page before asking which organic pages convert, which collections produce revenue, which channels drive transactions, or how Search Console demand connects to business outcomes.

## Current Status

As of 2026-05-14:

- Google Analytics OAuth works locally through the existing Google OAuth client.
- Google Analytics Admin API is enabled and working.
- Google Analytics Data API is enabled and working.
- Codex can list GA4 properties.
- Codex can run GA4 revenue reports.
- Default GA4 property:

```text
goldencollections - GA4 / properties/387291046
```

## Why This Matters

GA4 completes the ecommerce visibility triangle:

- Search Console shows search demand and ranking opportunities.
- Merchant Center shows product eligibility and feed quality.
- GA4 shows business outcomes: sessions, transactions, purchase revenue, and channel conversion behavior.

SEO decisions should not be based only on traffic. Pages that rank and pages that sell are not always the same.

## Credentials And Secret Handling

GA4 OAuth uses the local environment file:

```text
C:\goldencollections-theme\env
```

Preferred GA4-specific keys:

```text
GOOGLE_ANALYTICS_CLIENT_ID
GOOGLE_ANALYTICS_CLIENT_SECRET
GOOGLE_ANALYTICS_REDIRECT_URI
GOOGLE_ANALYTICS_PROPERTY_ID
```

Fallback behavior:

- If GA4-specific OAuth keys are missing, scripts reuse `GOOGLE_GBP_CLIENT_ID`, `GOOGLE_GBP_CLIENT_SECRET`, and `GOOGLE_GBP_REDIRECT_URI`.
- Default redirect URI is the existing Google callback:

```text
http://localhost:3001/google/callback
```

Security rules:

- Never paste actual client secret, refresh token, or access token values into the wiki, Git commits, chat summaries, screenshots, or public docs.
- Treat `env`, `.env`, OAuth token files, and GA4 OAuth logs as local-only secret/runtime files.
- OAuth token files are generated under `tmp/` and should not be committed.

## OAuth Configuration

Required OAuth scope:

```text
https://www.googleapis.com/auth/analytics.readonly
```

Reason for read-only:

- Golden Collections currently needs analytics data for SEO/GEO and merchandising decisions.
- Read-only access is enough for reports and avoids unnecessary account-write permissions.

## Local Scripts

OAuth callback and token generation:

```text
C:\goldencollections-theme\scripts\google-analytics-oauth-callback.mjs
```

Shared GA4 helper:

```text
C:\goldencollections-theme\scripts\google-analytics-lib.mjs
```

List accessible GA4 properties:

```text
C:\goldencollections-theme\scripts\google-analytics-list-properties.mjs
```

Run landing-page revenue report:

```text
C:\goldencollections-theme\scripts\google-analytics-run-revenue-report.mjs
```

Runtime outputs:

```text
C:\goldencollections-theme\tmp\google-analytics-token.json
C:\goldencollections-theme\tmp\google-analytics-auth-url.txt
C:\goldencollections-theme\tmp\google-analytics-properties.json
C:\goldencollections-theme\tmp\google-analytics-revenue-report.json
```

## First Read

First successful GA4 revenue report was run on 2026-05-14 for property `387291046`.

The report queried roughly the last 90 days through yesterday, grouped by:

- `landingPagePlusQueryString`
- `sessionDefaultChannelGroup`

Metrics:

- `sessions`
- `totalUsers`
- `transactions`
- `purchaseRevenue`
- `totalRevenue`

Returned:

- Full row count: `26213`.
- Returned rows: `1000`.

High-level channel summary from returned top-revenue rows:

- Organic Search: `202` transactions and about `1007841.75` purchase revenue.
- Direct: `120` transactions and about `852597.10` purchase revenue.
- Organic Social: `10` transactions and about `39449.00` purchase revenue.
- Organic Shopping: `18` transactions and about `30483.00` purchase revenue.

Notable organic revenue pages in the first read:

- `/`
- `/cart`
- `/collections/kemp-bharatanatyam-jewellery-dance-sets`
- `/collections/bharatanatyam-jewellery-sets`
- `/collections/vara-lakshmi-dolls`
- `/collections/kemp-jewellery`
- Several Bharatanatyam and kemp product URLs.

Important caveat:

- `/cart`, `/search`, and checkout-like URLs appearing as landing pages can reflect attribution/session behavior and should be interpreted carefully before making SEO decisions.

## Operating Workflow

For SEO/GEO prioritization:

1. Use Search Console to identify query/page opportunities.
2. Use GA4 to check whether the same page or collection already contributes sessions, transactions, or revenue.
3. Use Merchant Center to check whether related product feed issues are blocking visibility.
4. Prioritize pages that have search demand, conversion potential, and clean product eligibility.
5. Do not optimize only for impressions if GA4 shows no commercial value and no clear path to conversion.

Useful command:

```powershell
node scripts\google-analytics-run-revenue-report.mjs 387291046
```

## Official References

- Google Analytics Data API: `https://developers.google.com/analytics/devguides/reporting/data/v1`
- Google Analytics Admin API account summaries: `https://developers.google.com/analytics/devguides/config/admin/v1/rest/v1beta/accountSummaries/list`
- GA4 Data API `runReport`: `https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runReport`
