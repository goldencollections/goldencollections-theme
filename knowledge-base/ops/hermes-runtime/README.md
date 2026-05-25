# Hermes Runtime Files

Last updated: 2026-05-20

These files are the Golden Collections runtime inputs for Hermes.

- `SOUL.md` -> copy to `/home/hermes/.hermes/SOUL.md`.
- `MEMORY.md` -> copy to `/home/hermes/.hermes/memories/MEMORY.md`.
- `USER.md` -> copy to `/home/hermes/.hermes/memories/USER.md`.
- `HERMES.md` -> copy to `/opt/gc-hermes/context/.hermes.md`.
- `daily-owner-brief.prompt.md` -> copy to `/home/hermes/.hermes/cron/prompts/golden-collections-daily-owner-brief.md`.
- `knowledge-base/wiki/*.md` -> sync to `/opt/gc-hermes/context/knowledge-base/wiki/`.

Design notes:

- `SOUL.md` is stable working style, not a place for changing business facts.
- `MEMORY.md` is compact durable operational memory. Keep it under the Hermes memory limit.
- `USER.md` is owner preference memory. Keep it under the Hermes user limit.
- `.hermes.md` is the richer project instruction layer for sessions running from the synced context folder.
- Daily brief prompt is read-only and owner-controlled.
- The wiki folder is stable business truth for Hermes. After wiki changes, run `scripts/sync-hermes-knowledge.ps1` from the repo root and verify the file count/hash result.

Do not store secret values, tokens, passwords, private keys, or raw customer data in any of these files.
