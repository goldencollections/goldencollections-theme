---
name: golden-live-page-proof-check
description: Read-only Golden Collections live page verification playbook for checking storefront pages, proof blocks, deity fit content, structured data visibility, mobile/desktop rendering, screenshots, and buyer-trust issues. Use before browser-testing live Golden Collections product, collection, blog, or authority pages.
---

# Golden Live Page Proof Check

Use this playbook to verify live Golden Collections pages without changing anything.

## Scope

Check whether a live page supports buyer trust, SEO/GEO/AEO, and conversion.

Good targets:

- deity fit/process pages
- Anil Tunk authority page
- Varalakshmi examples
- deity product or collection pages
- Bharatanatyam / real kemp product or collection pages

## Before Opening Browser

Read the smallest relevant context:

- `knowledge-base/ops/golden-collections-program.md`
- `knowledge-base/ops/knowledge-quality-rules.md`
- `knowledge-base/ops/source-map.md`
- current `knowledge-base/ops/owner-brief.md`
- task-specific wiki/output file if named

## Browser Steps

1. Open the live URL.
2. Check desktop first, then mobile.
3. Confirm first viewport clearly shows the product/page purpose.
4. Check whether proof content is visible without excessive scrolling.
5. Check images load and are not cropped in a way that hides measurement/proof details.
6. Check visible copy for unsupported claims.
7. Check internal links and primary CTA behavior, but do not submit forms or place orders.
8. Inspect rendered HTML only when needed for schema, canonical, headings, or hidden content.
9. Capture screenshots only when useful for a report or bug.

## What To Look For

- buyer can understand fit/size/proof quickly
- ruler/measurement or proof images are visible when relevant
- copy avoids universal fit, certificate, temple/priest approval, and unsupported founder/history claims
- title/H1/intro match buyer intent
- FAQ or schema content matches visible page content
- mobile text/buttons do not overlap
- product cards and proof blocks do not push important content too low

## Output

Report:

- Page checked
- What is working
- What is blocking trust/conversion/search
- One best fix
- Evidence: screenshot path, HTML finding, or visible text
- Risk level: low / medium / high

Do not suggest broad redesigns unless the page clearly fails its main purpose.
