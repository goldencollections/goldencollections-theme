---
name: golden-search-console-check
description: Read-only Golden Collections Google Search Console browser playbook for URL inspection, indexing status, query/page review, near-win checks, and SEO/GEO/AEO monitoring. Use when checking Search Console through a browser instead of API scripts.
---

# Golden Search Console Check

Use this playbook for read-only Search Console checks.

Prefer existing scripts/APIs when available. Use browser only when the UI has information not available through scripts or when owner explicitly asks for browser verification.

## Safety

- Do not request indexing unless owner asked for that exact URL/action.
- Do not change users, properties, settings, sitemaps, removals, or URL parameters.
- Do not export private data unless the output is needed and stored safely.

## Before Browser

Read:

- `knowledge-base/ops/source-map.md`
- `knowledge-base/wiki/search-console-workflow.md`
- latest relevant `knowledge-base/outputs/search-console-*.md`
- `knowledge-base/ops/open-loops.md`

## URL Inspection Workflow

1. Open Search Console for `goldencollections.com`.
2. Use URL Inspection for the exact live URL.
3. Record:
   - Google-selected canonical
   - user-declared canonical
   - indexing status
   - last crawl date
   - mobile usability status if shown
   - enhancement/schema notes if shown
4. If status is unexpected, verify the live page before recommending action.
5. Do not click "Request Indexing" unless owner explicitly approved it.

## Performance / Query Workflow

1. Set date range intentionally. Use the same range as the prior report when comparing.
2. Filter by page or query only as needed.
3. Look for:
   - queries with impressions but weak CTR
   - pages near positions 8-20
   - product/collection queries with buyer intent
   - deity fit, size, ornament, and Varalakshmi terms
4. Avoid drawing conclusions from tiny samples.

## Output

Report:

- Date range
- Filters used
- Key finding
- Opportunity
- Recommended next action
- Whether action should wait for more data

For Golden Collections, prioritize product/collection and proof-page improvements over creating new bulk blog content.
