# Golden Collections Browser Skills

Last updated: 2026-05-19

These are internal browse-style playbooks for repeatable Golden Collections browser tasks.

Use them before opening a browser for recurring workflows. They are not a replacement for APIs or scripts. Prefer direct APIs/scripts when available and safer.

## Skills

- `golden-live-page-proof-check/` - verify live Golden Collections pages, proof blocks, schema-visible content, and mobile/desktop rendering.
- `golden-search-console-check/` - inspect Search Console status and queries in a read-only way.
- `golden-merchant-center-check/` - inspect Merchant Center/feed health in a read-only way.
- `golden-competitor-serp-research/` - research SERPs and competitor pages for buyer intent and proof gaps without copying.

## Rules

- Read-only by default.
- Do not change live settings, publish, send, spend, delete, or edit account data without owner approval.
- Do not store passwords, tokens, customer data, or private screenshots in these files.
- Capture findings into `knowledge-base/outputs/` or `knowledge-base/ops/open-loops.md` when useful.
- If a browser task repeats three times, improve the relevant skill.
