# Search Console Workflow

Backlinks: [[index.md]], [[business-entity.md]], [[content-roadmap.md]], [[google-business-profile-workflow.md]]

Last updated: 2026-05-17

## Purpose

This page records the Golden Collections Google Search Console API integration for SEO/GEO analysis from Codex.

Use this page before asking for query audits, page 2 opportunities, CTR issues, content refresh priorities, collection optimization priorities, or search performance reporting.

## Current Status

As of 2026-05-14:

- Google Search Console API is enabled in the Google Cloud project.
- Search Console OAuth works locally through the existing Google OAuth client.
- Search Console API read-back works from Codex.
- Local Codex scripts are prepared for OAuth, site listing, and page 2 opportunity exports.
- The integration is read-only by default.
- URL Inspection API works for status checks. General `Request indexing` for normal Shopify pages is UI-only in Search Console; Google's Indexing API is not intended for ordinary ecommerce pages.

Connected Search Console properties returned by API:

- `sc-domain:goldencollections.com` with `siteOwner` permission.
- `https://www.goldencollections.com/` with `siteOwner` permission.
- `http://www.goldencollections.com/` with `siteOwner` permission.
- `sc-domain:goldencollections-gbs.blogspot.com` with `siteOwner` permission.

Default working property:

```text
sc-domain:goldencollections.com
```

## Credentials And Secret Handling

Search Console OAuth uses the local environment file:

```text
C:\goldencollections-theme\env
```

Preferred Search Console-specific keys:

```text
SEARCH_CONSOLE_CLIENT_ID
SEARCH_CONSOLE_CLIENT_SECRET
SEARCH_CONSOLE_REDIRECT_URI
SEARCH_CONSOLE_SITE_URL
```

Fallback behavior:

- If Search Console-specific OAuth keys are missing, scripts reuse `GOOGLE_GBP_CLIENT_ID`, `GOOGLE_GBP_CLIENT_SECRET`, and `GOOGLE_GBP_REDIRECT_URI`.
- Default redirect URI is the existing Google callback:

```text
http://localhost:3001/google/callback
```

Security rules:

- Never paste actual client secret, refresh token, or access token values into the wiki, Git commits, chat summaries, screenshots, or public docs.
- Treat `env`, `.env`, OAuth token files, and Search Console OAuth logs as local-only secret/runtime files.
- OAuth token files are generated under `tmp/` and should not be committed.

## OAuth Configuration

Required OAuth scope:

```text
https://www.googleapis.com/auth/webmasters.readonly
```

Reason for read-only:

- Golden Collections needs search performance data for SEO/GEO decisions.
- Read-only access is enough for query/page audits and avoids unnecessary write permissions.

## Local Scripts

OAuth callback and token generation:

```text
C:\goldencollections-theme\scripts\search-console-oauth-callback.mjs
```

Shared Search Console helper:

```text
C:\goldencollections-theme\scripts\search-console-lib.mjs
```

List accessible Search Console properties:

```text
C:\goldencollections-theme\scripts\search-console-list-sites.mjs
```

Export page 2 / high-opportunity query-page pairs:

```text
C:\goldencollections-theme\scripts\search-console-query-page2.mjs
```

Runtime outputs:

```text
C:\goldencollections-theme\tmp\search-console-token.json
C:\goldencollections-theme\tmp\search-console-auth-url.txt
C:\goldencollections-theme\tmp\search-console-sites.json
C:\goldencollections-theme\tmp\search-console-page2-goldmine.json
```

## First Export

First successful export was created on 2026-05-14:

```text
C:\goldencollections-theme\tmp\search-console-page2-goldmine.json
```

The export returned `906` query/page opportunities using the default filters:

- Last roughly 90 days, ending 3 days before current date.
- Dimensions: `query`, `page`.
- Positions between `8` and `25`.
- Impressions at least `20`.

Notable high-impression examples from the first export:

- `bharatanatyam jewellery` ranking to the homepage.
- `bharatanatyam jewellery set` ranking to the homepage.
- `kids jewellery set` ranking to a kids Bharatanatyam product.
- `bharatanatyam makeup kit` ranking to the makeup/hair essentials collection.
- `kathak ghungroo` and `ghungroo for kathak` ranking to ghungroo products.
- Multiple `1 gram gold jewellery` variants ranking to older product pages.

## First Prioritized Action Plan

The first non-duplicative action plan from this export was created on 2026-05-16:

```text
C:\goldencollections-theme\knowledge-base\outputs\search-console-merchant-priority-action-plan-2026-05-16.md
```

It combines the page 2 export with Merchant Center blocker priorities so future work can execute from one ranked artifact instead of creating parallel SEO roadmaps.

## Operating Workflow

For SEO work:

1. Run site listing if ownership status is unclear.
2. Run `search-console-query-page2.mjs`.
3. Group opportunities by page.
4. Prioritize pages with high impressions, weak CTR, and business value.
5. Check whether each query intent belongs on the current page or needs a better target page.
6. Update titles, H1s, collection copy, product copy, internal links, schema, and supporting content only when they match buyer intent.
7. Record action decisions in the relevant blog, collection, or SEO output package.

Do not:

- Promise ranking timelines.
- Rewrite pages only because a query appears in Search Console.
- Stuff exact-match queries into headings or copy.
- Treat old product pages as strategic targets without checking product availability, collection fit, and margin/business value.

## Useful Commands

```powershell
node scripts\search-console-oauth-callback.mjs
node scripts\search-console-list-sites.mjs
node scripts\search-console-query-page2.mjs
```

Optional environment overrides:

```text
SEARCH_CONSOLE_SITE_URL
SEARCH_CONSOLE_START_DATE
SEARCH_CONSOLE_END_DATE
SEARCH_CONSOLE_ROW_LIMIT
```

## Next Step

Continue from `knowledge-base/outputs/search-console-near-win-audit-2026-05-17.md`. The May 17 refresh covered `902` query-page opportunities from `2026-02-12` to `2026-05-13`. Safe Lakshmi/Amman routing was applied for product `DLN095`, safe ghungroo/Kathak wording plus regional-name metadata was applied for the two 50/100-bell ghungroo products and the ghungroo collection, safe Mattal/ear-chain wording plus regional-name metadata was applied for BBM019 and the Mattal collections, and safe kids jewellery wording plus a feed age-group correction was applied for Little Gopika and the Kids Bharatanatyam collection. Pause the May 17 near-win batch now and monitor before adding more page changes.
