# Golden Collections Brief System

Last updated: 2026-05-16

## Purpose

The brief system keeps Golden Collections work focused without building a dashboard too early.

It should answer:

- What is the best business action now?
- Why does it help sales, trust, SEO/GEO/AEO/EEAT, customer clarity, or owner time?
- What is waiting on the owner?
- What can Codex do next?
- What should not be done yet?

## Local Command

Generate a dated owner brief and compact context pack:

```powershell
node scripts\generate-owner-brief.mjs
```

Generate and also replace the current `owner-brief.md`:

```powershell
node scripts\generate-owner-brief.mjs --update-current
```

Outputs:

- `knowledge-base/ops/briefs/YYYY-MM-DD-auto-owner-brief.md`
- `knowledge-base/ops/context-pack.md`
- optionally `knowledge-base/ops/owner-brief.md`

## Maintenance Rule

Keep the human-edited truth in:

- `knowledge-base/ops/open-loops.md`
- `knowledge-base/ops/decisions.md`
- `knowledge-base/ops/owner-brief.md`
- `knowledge-base/wiki/`

The script composes the brief from those files. It does not call AI, Shopify, Search Console, WhatsApp, email, or Supabase.

## Automation Candidate

Only schedule this after the owner confirms the generated brief is useful. A safe automation can run the command, read the generated brief, and report a short summary. It should not make live changes, send messages, or publish content.

