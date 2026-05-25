# Golden Collections Kanban Board

Last exported from Hermes: 2026-05-25 19:02:18

Hermes is authoritative for live task status. This repo file is the durable backup/export and Codex-readable context.

Environment note: Codex and Hermes may run in separate filesystems. Use GitHub as the bridge and follow `knowledge-base/ops/codex-hermes-environments.md` before treating an empty local board as authoritative.

## Operating Rule

A task is not finished until the board is updated.

Every Codex or Hermes session must close with a board update:

- update Hermes Kanban first
- export Hermes to the repo with `python scripts/sync-kanban-board.py export`
- pull/import the repo backup first when switching machines or agent environments
- create cards for new open loops found during the session
- mark blockers with the exact blocking reason
- add verification notes, output files, URLs, or command evidence

## Sync Rule

- Hermes live board is the source of truth for current status.
- Repo export is the backup and Codex context.
- Repo-to-Hermes import is controlled: it creates/updates planned card details, but preserves existing Hermes statuses unless `--apply-status` is used.
- If there is a conflict, Hermes wins unless the owner explicitly says the repo version is newer.

## Columns

- `Triage`: captured but not yet shaped into a clear task
- `Todo`: accepted work, not yet ready to execute
- `Ready`: clear next action exists
- `Running`: actively being worked
- `Blocked`: waiting on owner input, credentials, external approval, cache, or data
- `Review`: agent says done; human or later verification needed
- `Done`: completed with evidence

## Ready

### GC-KAN-002 - Add board closeout line to every Codex/Hermes brief

- Owner: codex / hermes
- Area: operations
- Next action: Append the closeout rule to future agent goal specs and Hermes briefs.
- Acceptance: Every future session ends with board changes or an explicit no-board-changes note.
- Evidence:
  - knowledge-base/ops/kanban-board.md

### GC-SEO-001 - Manually request GSC indexing for the arangetram checklist page

- Owner: owner
- Area: Search Console
- Next action: Use Google Search Console URL Inspection to request indexing for the live checklist URL.
- Acceptance: Manual indexing request submitted and date recorded.
- Evidence:
  - knowledge-base/outputs/arangetram-rangapravesam-checklist-launch-next-steps-2026-05-24.md

### GC-SEO-002 - Request indexing for seven clean product rescue URLs

- Owner: owner / codex
- Area: Search Console
- Next action: After cache checks, inspect and request indexing for BDS017, BLN026, BLN012, VHL027, DSN056, BHA-011, and BHA-008.
- Acceptance: Indexing requests submitted or documented as unnecessary.
- Evidence:
  - knowledge-base/outputs/clean-product-indexing-rescue-2026-05-25.md

### GC-PROOF-002 - Review remaining Tier 2 deity crown visual proof rows

- Owner: codex
- Area: proof / UCP
- Next action: Review remaining contact-sheet rows and approve only visibly measured ruler/tape photos.
- Acceptance: Next batch of approved crown measurement alt updates is prepared or applied, with skipped rows documented.
- Evidence:
  - tmp/crown-ucp-sprint/crown-ucp-sprint-report.md

### GC-OUTREACH-001 - Review first 15 USA dance-school outreach replies before WhatsApp follow-up

- Owner: owner / codex
- Area: outreach
- Next action: On or after 2026-05-28, check support inbox for bounces/replies and decide whether to WhatsApp only 5-7 best-fit schools.
- Acceptance: Reply/bounce status updated in CSV tracker and follow-up decision recorded.
- Evidence:
  - knowledge-base/outputs/usa-dance-school-outreach-first-15-manual-send-2026-05-24.md
  - knowledge-base/outputs/usa-dance-school-outreach-first-15-ready-2026-05-24.csv

### GC-HERMES-001 - Test Hermes Telegram voice note input

- Owner: owner
- Area: Hermes
- Next action: send a short Telegram voice note to the private Hermes bot.
- Acceptance: Hermes transcribes and replies in text; failures are recorded.
- Evidence:
  - `knowledge-base/ops/open-loops.md`
  - `knowledge-base/outputs/hermes-telegram-voice-input-setup-2026-05-20.md`

### GC-SEO-003 - Recheck BHA-011 and BHA-008 normal product route cache

- Owner: codex
- Area: SEO / Shopify
- Next action: re-fetch normal live product routes and confirm the title/meta now match the Admin and `?view=ajax` output.
- Acceptance: BHA-011 and BHA-008 normal routes show updated SEO output without `?view=ajax`.
- Evidence:
  - `knowledge-base/outputs/clean-product-indexing-rescue-2026-05-25.md`

### GC-SEO-004 - Monitor GSC parameterized product URL sample

- Owner: codex
- Area: Search Console
- Next action: rerun the parameter URL audit after a recrawl cycle or after the next major theme deployment.
- Acceptance: current emitted crawlable product links still show zero tracked parameters; GSC sample trend noted.
- Evidence:
  - `knowledge-base/outputs/p1b-parameter-product-url-audit-2026-05-24.md`

### GC-MERCHANT-002 - Monitor remaining Merchant availability notices

- Owner: codex
- Area: Merchant Center
- Next action: after Merchant OAuth is refreshed, rerun diagnostics and confirm hard blockers remain at zero except expected availability notices.
- Acceptance: blocker counts are recorded; no broad delete pass is run without fresh diagnostics.
- Evidence:
  - `knowledge-base/outputs/merchant-feed-cleanup-triage-2026-05-17.md`

### GC-PROOF-003 - Run broader deity fit proof capture session

- Owner: owner
- Area: proof / content
- Next action: schedule a 60-90 minute capture session for crowns, short harams, long harams, Varalakshmi setup items, and Balaji/Vishnu examples.
- Acceptance: raw assets and SKU notes are placed in a dated local folder; Codex can triage proof tiers.
- Evidence:
  - `knowledge-base/outputs/proof-capture-review-ucp-revenue-operational-brief-2026-05-19.md`
  - `knowledge-base/ops/proof-asset-shot-list.md`

### GC-OUTREACH-002 - Decide whether to scale arangetram checklist outreach

- Owner: owner
- Area: outreach
- Next action: after two weeks of first-batch signals, decide whether to create a teacher PDF, partner code, sponsorship option, or second outreach batch.
- Acceptance: decision documented before any scale-up.
- Evidence:
  - `knowledge-base/outputs/arangetram-rangapravesam-checklist-launch-next-steps-2026-05-24.md`

### GC-WA-002 - Prepare WhatsApp review trigger for controlled live pilot

- Owner: codex
- Area: WhatsApp / reviews
- Next action: complete migration, monitoring, dry-run validation, true delivery-event observation, and manual suppression rules before live sends.
- Acceptance: dry-run evidence exists; suppression list is implemented; owner approves a small pilot.
- Evidence:
  - `knowledge-base/outputs/activation-gap-closeout-2026-05-16.md`
  - `knowledge-base/outputs/whatsapp-review-trigger-delivery-source-audit-2026-05-16.md`

### GC-HERMES-002 - Sync changed wiki/ops context to Hermes VPS

- Owner: codex / hermes
- Area: Hermes
- Next action: after meaningful KB/wiki/ops changes, run `scripts/sync-hermes-knowledge.ps1` and, if relevant, `scripts/sync-hermes-ops.ps1`.
- Acceptance: sync completes and hashes/target paths are verified.
- Evidence:
  - `knowledge-base/outputs/hermes-wiki-sync-verification-2026-05-20.md`

### GC-ADMIN-001 - Decide whether to change Shopify Admin email

- Owner: owner
- Area: admin cleanup
- Next action: decide whether Shopify Admin `shop.email` should remain `goldencollections9@gmail.com` or be changed manually.
- Acceptance: decision documented; public contact remains `support@goldencollections.com`.
- Evidence:
  - `knowledge-base/ops/open-loops.md`
  - `knowledge-base/wiki/business-entity.md`

## Blocked

### GC-PROOF-001 - Capture seven crown ruler proof SKUs

- Owner: owner
- Area: proof / UCP
- Blocked by: Physical product/photo capture needed.
- Next action: Capture ruler/tape proof for DGC269, DGC267, DGC272, DGC263, DGC255, DGC259, and DGC270.
- Acceptance: Height, inside/bottom width, relevant side/depth, and placement view exist for each SKU.
- Evidence:
  - knowledge-base/ops/proof-asset-shot-list.md

### GC-DATA-001 - Provide deity compatibility sheet

- Owner: owner
- Area: catalog data
- Blocked by: Owner product truth required.
- Next action: Provide SKU/product-handle compatibility fields for primary deity, also-fits, broad-use, not-for, size note, and special symbol.
- Acceptance: Sheet exists and Codex can safely run deity-specific collection/metadata passes.
- Evidence:
  - knowledge-base/outputs/non-owner-data-seo-ucp-execution-report-2026-05-24.md

### GC-DATA-002 - Confirm material for VDF057 and VDF0311

- Owner: owner
- Area: Varalakshmi catalog
- Blocked by: Owner/product material confirmation required.
- Next action: Confirm material for VDF057 and VDF0311.
- Acceptance: Materials recorded and blocked Varalakshmi doll-face pass can run.
- Evidence:
  - knowledge-base/outputs/non-owner-data-seo-ucp-execution-report-2026-05-24.md

### GC-CATALOG-001 - Decide deity jhumki product truth

- Owner: owner
- Area: catalog / UCP
- Blocked by: Catalog decision required.
- Next action: Decide whether DGE201/DGE202 should be activated, current DGE products can be called jhumki, or the prompt remains a product gap.
- Acceptance: Decision recorded and no deceptive jhumki wording is used.
- Evidence:
  - knowledge-base/outputs/deity-earrings-ucp-sprint-report-2026-05-19.md

### GC-MERCHANT-001 - Refresh Merchant Center OAuth token

- Owner: owner / codex
- Area: Merchant Center
- Blocked by: Expired/revoked Merchant OAuth refresh token.
- Next action: Reauthorize Merchant OAuth and rerun diagnostics for account 767542510.
- Acceptance: Diagnostics command succeeds and blocker counts are refreshed.
- Evidence:
  - knowledge-base/outputs/non-owner-data-seo-ucp-execution-report-2026-05-24.md

### GC-WABA-001 - Fix WhatsApp Business eligibility payment issue

- Owner: owner
- Area: WhatsApp
- Blocked by: Meta error 131042 Business eligibility payment issue.
- Next action: Fix WABA billing/payment setup before any paid template pilot.
- Acceptance: Paid template delivery succeeds in a controlled test.
- Evidence:
  - knowledge-base/ops/open-loops.md

### GC-X-001 - Resolve X API CreditsDepleted state

- Owner: owner
- Area: X / social
- Blocked by: X developer account has `$0.00` credits.
- Next action: buy/link credits or keep Hermes X as unavailable for read calls.
- Acceptance: read-only X brief calls succeed or the channel is explicitly deprioritized.
- Evidence:
  - `knowledge-base/ops/open-loops.md`

### GC-YT-001 - Update YouTube metadata or reauthorize broader scope

- Owner: owner
- Area: YouTube
- Blocked by: token lacks update scope.
- Next action: manually update YouTube metadata for `6CyaMiZmGXs` or reauthorize with broader YouTube scope.
- Acceptance: metadata update is completed and documented.
- Evidence:
  - `knowledge-base/outputs/activation-gap-closeout-2026-05-16.md`
  - `knowledge-base/wiki/content-roadmap.md`

### GC-PIN-002 - Record revised Pinterest OAuth-to-Pin demo

- Owner: codex / owner
- Area: Pinterest
- Blocked by: Corrected uncut Standard access demo has been recorded, uploaded, and submitted; waiting for Pinterest review decision.
- Next action: Monitor Pinterest email/support response and app page for Standard access approval or reviewer feedback.
- Acceptance: Pinterest grants Standard access, or any reviewer feedback is converted into a follow-up card.
- Evidence:
  - Pinterest Developer app page shows `Requested access: Upgrade to Standard access pending` after the uncut MP4 upload.
  - New uncut video: `pinterest-upgrade-demo/renders/golden-collections-pinterest-standard-access-uncut-oauth-api-demo-2026-05-25.mp4`
  - Helper script: `scripts/pinterest-standard-uncut-demo-server.mjs`
  - Evidence note: `knowledge-base/outputs/pinterest-standard-access-demo-video-2026-05-25.md`
  - Created uncut-demo sandbox Pin: `https://www.pinterest.com/pin/485825878576972078/`
  - Latest denial email that triggered this fix: Gmail message ID `19e5eee4393326fd`.
  - Support reply sent to Eloise after uncut resubmission: Gmail message ID `19e5f55be049aa62`.

## Review

### GC-THEME-001 - Verify public custom-domain footer hours and schema cache

- Owner: codex
- Area: theme / entity consistency
- Next action: Verify www.goldencollections.com footer and LocalBusiness schema, then decide whether goldencollections.in needs cleanup.
- Acceptance: Public custom domain shows corrected hours; legacy-site decision documented.
- Evidence:
  - knowledge-base/outputs/store-hours-consistency-audit-2026-05-20.md
  - knowledge-base/ops/open-loops.md

### GC-THEME-002 - Verify social/entity fixes on rendered storefront

- Owner: codex
- Area: theme / schema
- Next action: spot-check rendered pages after cache propagation.
- Acceptance: live rendered schema/source shows corrected `goldencollections` Facebook URL and canonical organization/website IDs.
- Evidence:
  - `knowledge-base/outputs/non-owner-data-seo-ucp-execution-report-2026-05-24.md`

### GC-LINK-001 - Recheck cached internal-link sections

- Owner: codex
- Area: internal linking
- Next action: recheck after Shopify/CDN refresh.
- Acceptance: both live sections show the new links; URL Inspection follow-up can proceed later.
- Evidence:
  - `knowledge-base/outputs/internal-link-rescue-and-redirect-fix-2026-05-24.md`

## Done

### GC-KAN-001 - Mirror this repo board into Hermes Kanban

- Owner: owner / hermes
- Area: operations
- Result: Hermes CLI installed locally, goldencollections board created, and all repo-board cards mirrored.
- Acceptance: Hermes dashboard/CLI shows the same active cards; repo board remains durable backup.
- Evidence:
  - knowledge-base/ops/kanban-board.md
  - https://hermes-agent.nousresearch.com/docs/user-guide/features/kanban

### GC-PIN-001 - Reply to Pinterest after privacy-policy cache is visibly refreshed

- Owner: owner / codex
- Area: Pinterest
- Result: Pinterest reply was sent on 2026-05-24 with updated privacy policy and demo attachment. Pinterest responded on 2026-05-25 confirming Trial access for app 1570604 is approved again.
- Acceptance: Pinterest receives the reply for app 1570604 and status is recorded.
- Evidence:
  - knowledge-base/outputs/pinterest-standard-access-remediation-2026-05-24.md

### GC-OUTREACH-000 - Send first 15 USA dance-school outreach emails

- Owner: codex / owner
- Area: outreach
- Result: Imported as done from repo Kanban board.
- Acceptance: Acceptance criteria not recorded yet.
- Evidence:
  - `knowledge-base/outputs/usa-dance-school-outreach-first-15-manual-send-2026-05-24.md`

### GC-SEO-000 - Apply seven-product clean indexing rescue

- Owner: codex
- Area: SEO / Shopify
- Result: Imported as done from repo Kanban board.
- Acceptance: Acceptance criteria not recorded yet.
- Evidence:
  - `knowledge-base/outputs/clean-product-indexing-rescue-2026-05-25.md`

### GC-LINK-000 - Fix confirmed bad redirects and add selective internal links

- Owner: codex
- Area: internal linking / redirects
- Result: Imported as done from repo Kanban board.
- Acceptance: Acceptance criteria not recorded yet.
- Evidence:
  - `knowledge-base/outputs/internal-link-rescue-and-redirect-fix-2026-05-24.md`

### GC-KAN-000 - Create initial repo-backed board

- Owner: codex
- Area: operations
- Result: Imported as done from repo Kanban board.
- Acceptance: Acceptance criteria not recorded yet.
- Evidence:
  - this file

### GC-KAN-003 - Create controlled Hermes/repo Kanban sync

- Owner: codex
- Area: operations
- Result: Created scripts/sync-kanban-board.py with status, export, and controlled import; verified zero drift after export and no status overwrite on import.
- Acceptance: status shows zero drift after export; import updates details without changing existing Hermes statuses unless --apply-status is used.
- Evidence:
  - scripts/sync-kanban-board.py
  - knowledge-base/ops/kanban-board.md
  - knowledge-base/ops/kanban-cards.json

### GC-GH-001 - Move project GitHub remote to goldencollections

- Owner: codex
- Area: GitHub / operations
- Result: Created goldencollections/goldencollections-theme, preserved old remote as shanaya-origin, pushed main, pushed Kanban sync commits, and imported the full safe workspace in commit 1b2314a. Excluded ignored local secrets, tmp scratch output, caches, logs, and files over GitHub's normal limit.
- Acceptance: GitHub repo exists under goldencollections, local origin points there, main is pushed, and Kanban sync files are committed.
- Evidence:
  - https://github.com/goldencollections/goldencollections-theme
  - commit d4193c8 Add Hermes Kanban sync board

### gc-kan-004-simple-codex-viewer - GC-KAN-004 - Create simple Codex Kanban viewer

- Owner: codex
- Area: operations
- Result: Created tools/kanban-viewer static page with counts, filters, quick lanes, detail drawer, copyable execution prompt, and README. Verified locally at http://127.0.0.1:8787/tools/kanban-viewer/.
- Acceptance: Simple visual board renders exported Kanban cards with counts, filters, quick action lanes, details, and copyable execution prompts.
- Evidence:
  - tools/kanban-viewer/
  - knowledge-base/ops/kanban-cards.json

### GC-KAN-005 - Document Codex/Hermes environment split and bootstrap

- Owner: codex
- Area: operations
- Result: Documented Codex/Hermes separate filesystem model and added a GitHub-backed Hermes Kanban bootstrap/recovery path.
- Acceptance: Codex/Hermes environment split is documented, bootstrap script exists, and sync script accepts --board before or after the command.
- Evidence:
  - `knowledge-base/ops/codex-hermes-environments.md`
  - `scripts/hermes-kanban-bootstrap.sh`
  - `scripts/sync-kanban-board.py`
  - `knowledge-base/README.md`
  - `knowledge-base/ops/golden-collections-program.md`
  - `knowledge-base/wiki/index.md`
  - `knowledge-base/ops/source-map.md`
  - `knowledge-base/ops/hermes-runtime/HERMES.md`
  - `knowledge-base/ops/hermes-runtime/MEMORY.md`
  - `knowledge-base/ops/hermes-agent-guardrails.md`

## Commands

```powershell
hermes kanban boards switch goldencollections
hermes kanban list
python scripts/sync-kanban-board.py status
python scripts/sync-kanban-board.py export
python scripts/sync-kanban-board.py import
```
