# Hermes Operating Memory Setup - 2026-05-19

## Purpose

Set up Hermes with stable, low-maintenance operating inputs for Golden Collections.

## Inputs Created

- `knowledge-base/ops/hermes-runtime/SOUL.md`
- `knowledge-base/ops/hermes-runtime/MEMORY.md`
- `knowledge-base/ops/hermes-runtime/USER.md`
- `knowledge-base/ops/hermes-runtime/HERMES.md`
- `knowledge-base/ops/hermes-runtime/daily-owner-brief.prompt.md`

## VPS Deployment

Runtime copies were synced to:

- `/home/hermes/.hermes/SOUL.md`
- `/home/hermes/.hermes/memories/MEMORY.md`
- `/home/hermes/.hermes/memories/USER.md`
- `/opt/gc-hermes/context/.hermes.md`
- `/home/hermes/.hermes/cron/prompts/golden-collections-daily-owner-brief.md`

Hermes cron job created:

- Name: `Golden Collections Daily Owner Brief`
- Job id: `5b27dd17e58b`
- Schedule: `30 3 * * *` UTC, equivalent to 9:00 AM India time
- Delivery: Telegram owner DM
- Workdir: `/opt/gc-hermes/context`

## Design

- `SOUL.md` holds Hermes' communication style and high-level boundaries.
- `MEMORY.md` holds compact durable Golden Collections operational facts.
- `USER.md` holds owner preferences.
- `.hermes.md` in the server context folder holds fuller project instructions and source order.
- The daily brief prompt is read-only, mobile-friendly, and designed to avoid noisy automation.

## Safety Position

Hermes remains a controlled pilot:

- read-only summary and draft-first by default
- Telegram owner-control only
- no customer-facing WhatsApp control yet
- no customer sends, public publishing, account changes, data edits, or spending without explicit owner approval
- no bulk AI content generation

## Verification

- `MEMORY.md` is 1,519 characters, below Hermes' 2,200 character memory limit.
- `USER.md` is 951 characters, below Hermes' 1,375 character user-profile limit.
- `hermes cron list` shows the daily owner brief as active.
- `hermes cron status` reports the gateway is running and cron jobs will fire automatically.
- A CLI sanity test returned the expected role and approval boundary.

## Update On 2026-05-19

`SOUL.md` was upgraded from a short persona file into a fuller Golden Collections operating contract based on owner feedback and the Tony Simons SOUL.md pattern.

Added sections:

- Mission
- Stance
- Pushback
- Accountability
- Autonomy
- Fact Discipline
- Lookup Protocol
- Communication
- End State

The upgraded file keeps Hermes business-safe: it adds stronger pushback and accountability, but does not grant customer-facing send, publishing, account-change, spending, or destructive permissions.

Telegram gateway was restarted and existing Telegram DM sessions were marked suspended so the next Telegram interaction starts from the updated soul instead of the old identity/session snapshot.

## Research Basis

This setup follows the same practical pattern recommended by current agent guidance: separate stable instructions from memory, keep memory compact and source-grounded, keep scheduled jobs narrow, and use human approval for high-impact actions.
