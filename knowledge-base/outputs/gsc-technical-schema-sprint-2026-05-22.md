# GSC Technical Schema Sprint - 2026-05-22

Source goal:

- Dry-run then fix confirmed technical SEO issues for Golden Collections.
- Keep page-specific Product, CollectionPage, BreadcrumbList, FAQPage, and ItemList schema intact.
- Inspect GSC 5xx / other 4xx samples before making URL fixes.

## Before-State Snapshot

Before editing, current file copies were saved under:

```text
C:\goldencollections-theme\tmp\schema-technical-sprint-before-20260522-020754
```

## Dry-Run Findings

### FAQPage Duplication

Live Search Console still reports `Duplicate field "FAQPage"` for `72` pages. Sample live pages such as `/collections/deity-crowns` currently expose two `FAQPage` blocks.

Local source status:

- `snippets/deity-collection-schema.liquid` does not emit `FAQPage`.
- `sections/ornament-collection-footer.liquid` is the only local `FAQPage` source in the deity ornament collection path.
- Therefore no additional local FAQPage code change was made in this sprint. The local source already preserves the intended one-visible-FAQ schema model; live GSC may reflect the currently deployed theme or older crawl state.

### Canonical Entity Graph

Hard-coded non-www schema references existed in global/page schema files. A global `WebSite` node was missing even though page schemas reference `https://www.goldencollections.com/#website`.

## Changes Applied

- Updated the global business schema in `layout/theme.liquid` to use the canonical `https://www.goldencollections.com/#organization` ID.
- Added a global `WebSite` schema node with `SearchAction` and publisher reference to the global organization ID.
- Updated the robots sitemap reference to `https://www.goldencollections.com/sitemap.xml`.
- Replaced hard-coded non-www `#organization` schema references with `https://www.goldencollections.com/#organization`.
- Removed the generic Dawn header Organization/WebSite schema block from `sections/header.liquid` to avoid duplicate global schema if that section is ever rendered.
- Removed the duplicated full Organization object from product/article schema where brand, seller, author, and publisher can reference the global organization node instead.
- Updated `snippets/organization-schema.liquid` to emit the same canonical global organization and WebSite graph if that snippet is used later.

No product data, prices, collection copy, SEO titles, descriptions, merchandising, or navigation were changed.

## GSC 5xx / 4xx Inspection

Search Console UI samples were collected from:

- `Server error (5xx)` - `18` affected pages in GSC.
- `Blocked due to other 4xx issue` - `11` affected pages in GSC.

Visible 5xx samples were mostly product URLs with `variant`, `currency`, or recommendation query parameters. Live testing on 2026-05-22 returned `200` for sampled product URLs, with canonical tags pointing to clean product URLs.

Visible other-4xx samples were also mostly product URLs with `variant`, recommendation, or search query parameters. Live testing returned `200` for sampled product URLs, with canonical tags pointing to clean product URLs.

The only active other-4xx sample was:

```text
https://www.goldencollections.com/.well-known/shopify/monorail/unstable/produce_batch
```

Live status:

```text
405 Method Not Allowed
```

Decision: no redirect or theme fix was applied for this Shopify internal endpoint.

## Verification

- Parsed JSON-LD blocks in `layout/theme.liquid` and `snippets/organization-schema.liquid` successfully with Node JSON parsing.
- Confirmed no hard-coded `https://goldencollections.com` references remain under `layout`, `templates`, `sections`, or `snippets`.
- Confirmed no `#localbusiness` references remain under `layout`, `templates`, `sections`, or `snippets`.
- Confirmed the deity ornament collection path has only the visible footer `FAQPage` source in local code.
- `shopify theme check --path . --output json` still fails because of pre-existing invalid JSON files under `tmp/`. It also scans the new before-state snapshot under `tmp/`, so Theme Check remains unsuitable as a clean pass/fail signal until tmp artifacts are excluded or moved outside the theme scan path.

## Intentionally Left Unchanged

- No mass redirects for the GSC 5xx / 4xx samples because product sample URLs now resolve.
- No changes to the `9,873` Crawled - currently not indexed URLs; that remains a separate read-only pattern audit.
- No changes to product descriptions, collection copy, titles, meta descriptions, prices, inventory, merchandising, or navigation.
- No removal of valid page-specific Product, CollectionPage, BreadcrumbList, FAQPage, or ItemList schema.
