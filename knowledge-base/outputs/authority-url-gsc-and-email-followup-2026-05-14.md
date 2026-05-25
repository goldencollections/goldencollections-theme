# Authority URL Search Console And Email Follow-Up - 2026-05-14

## Shopify Customer-Facing Email

Current Shopify Admin API read-back:

- `shop.email`: `goldencollections9@gmail.com`
- `shop.contactEmail`: `goldencollections9@gmail.com`

Target:

- `support@goldencollections.com`

API result:

- REST `PUT /admin/api/.../shop.json` returned HTTP `406`.
- Shopify GraphQL Admin schema exposes `shop.email` and `shop.contactEmail`, but no safe `shopUpdate` or contact-email mutation.
- Official Shopify REST docs say the Shop resource retrieves store settings but does not update them.

Manual Shopify Admin path:

1. Shopify Admin -> Settings -> Notifications -> Sender email -> set `support@goldencollections.com` -> Save.
2. Shopify Admin -> Settings -> General -> Store contact details -> Store email -> set `support@goldencollections.com` -> Save.
3. Complete Shopify's email verification if prompted.

Verification after manual change:

- `https://www.goldencollections.com/llms.txt` should show `Contact: support@goldencollections.com`.
- `https://www.goldencollections.com/llms-full.txt` should show `Contact email: support@goldencollections.com`.
- `https://www.goldencollections.com/agents.md` should show `Email: support@goldencollections.com`.
- GraphQL `shop { email contactEmail }` should show `support@goldencollections.com`, at least for `contactEmail`.

## Search Console API Inspection

Script added:

- `scripts/search-console-inspect-authority-urls.mjs`

Output:

- `tmp/search-console-authority-url-inspection.json`

Worker also added:

- `scripts/search-console-inspect-request-indexing.mjs`
- `tmp/search-console-url-inspection-indexing.json`

Inspection results:

| URL | Status | Coverage | Last crawl |
|---|---|---|---|
| `https://www.goldencollections.com/` | `PASS` | `Submitted and indexed` | `2026-05-14T06:36:25Z` |
| `https://www.goldencollections.com/pages/about-us` | `PASS` | `Submitted and indexed` | `2026-05-10T01:52:00Z` |
| `https://www.goldencollections.com/pages/anil-tunk` | `NEUTRAL` | `URL is unknown to Google` | none |
| `https://www.goldencollections.com/pages/jewelry-glossary` | `PASS` | `Submitted and indexed` | `2026-03-04T20:00:11Z` |

## Indexing Request Constraint

The current OAuth token has scope:

- `https://www.googleapis.com/auth/webmasters.readonly`

URL Inspection API works with this scope.

Indexing API calls returned:

- HTTP `403`
- `ACCESS_TOKEN_SCOPE_INSUFFICIENT`

Important: even with broader scopes, Google's official Indexing API is for pages with `JobPosting` or `BroadcastEvent` embedded in a `VideoObject`, not normal Shopify authority pages. For these four URLs, use Search Console URL Inspection UI -> Request indexing.

## Browser/UI Attempt

Tried opening Search Console URL Inspection UI for Anil Tunk page. The available Playwright browser was not authenticated and redirected to Google sign-in, so the UI-only `Request indexing` button could not be completed from Codex without a logged-in browser session.

Manual URL to request indexing:

```text
https://search.google.com/search-console/inspect?resource_id=https%3A%2F%2Fwww.goldencollections.com%2F&id=https%3A%2F%2Fwww.goldencollections.com%2Fpages%2Fanil-tunk
```

Recommended manual UI steps:

1. Open Search Console.
2. Inspect `https://www.goldencollections.com/pages/anil-tunk`.
3. Click `Test live URL`.
4. Confirm the live page is indexable.
5. Click `Request indexing`.

Optional recrawl requests:

- `https://www.goldencollections.com/pages/about-us`
- `https://www.goldencollections.com/pages/jewelry-glossary`

Home is already freshly crawled on 2026-05-14.
