# Browse.sh Pattern Adoption - 2026-05-19

## Decision

Adopt the Browse.sh idea as internal Golden Collections browser playbooks, but do not add Browserbase billing or external cloud browser infrastructure yet.

## Why

Browse.sh's useful pattern is reusable browser knowledge: a `SKILL.md` playbook captures steps, gotchas, selectors, endpoints, and output expectations so an agent does not rediscover the same website every run.

For Golden Collections, this is useful for repeatable read-only checks:

- live page proof and rendering checks
- Search Console checks
- Merchant Center checks
- SERP and competitor research

## Files Created

- `knowledge-base/ops/browser-skills/index.md`
- `knowledge-base/ops/browser-skills/golden-live-page-proof-check/SKILL.md`
- `knowledge-base/ops/browser-skills/golden-search-console-check/SKILL.md`
- `knowledge-base/ops/browser-skills/golden-merchant-center-check/SKILL.md`
- `knowledge-base/ops/browser-skills/golden-competitor-serp-research/SKILL.md`

## Operating Rule

Use these playbooks before browser-driving recurring Golden Collections workflows. Prefer APIs/scripts when they are safer and already available.

## Do Not Do Yet

- Do not subscribe to Browserbase.
- Do not install third-party Browse.sh skills into production workflows.
- Do not use browser automation for customer-facing sends, account changes, payments, publishing, or destructive actions.
