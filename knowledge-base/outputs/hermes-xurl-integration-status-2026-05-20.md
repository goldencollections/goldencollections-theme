# Hermes X/xurl Integration Status - 2026-05-20

## Status

Hermes X/xurl integration is authenticated as a safe, staged capability. It is not enabled for public posting.

Update after owner manual Doppler setup:

- Doppler X gate values were verified from the Hermes VPS on 2026-05-20.
- Current verified values:
  - `HERMES_X_ENABLED=false`
  - `HERMES_X_MODE=read_only`
  - `HERMES_X_PUBLIC_WRITE_MODE=disabled`
  - `HERMES_X_AUTO_POST_ENABLED=false`
  - `HERMES_X_AUTO_REPLY_ENABLED=false`
  - `HERMES_X_REQUIRE_OWNER_APPROVAL=true`
  - `HERMES_X_DAILY_BRIEF_ENABLED=false`
  - `HERMES_X_APP_NAME=gc-xurl`
- This is the intended safe default.

Update after X developer app and OAuth setup:

- Owner created X developer app `Golden Collections Hermes`.
- Owner added `X_CLIENT_ID` and `X_CLIENT_SECRET` to Doppler project `gc-hermes-agent`, config `prd`.
- Codex registered xurl app `gc-xurl` on the Hermes VPS using Doppler-injected credentials.
- OAuth completed through the official account `@GCJewellery`.
- `xurl auth status` shows `gc-xurl` with OAuth2 user `GCJewellery`.
- `xurl whoami` verified username `GCJewellery`, account name `Golden Collections`, X id `2207358732`, follower count `95`, and tweet count `729`.
- No post, reply, like, DM, follow, bookmark, list mutation, or paid action was performed.
- Owner later set `HERMES_X_ENABLED=true` for Phase 1 read-only access.
- Public-write gates remain disabled: `HERMES_X_MODE=read_only`, `HERMES_X_PUBLIC_WRITE_MODE=disabled`, `HERMES_X_AUTO_POST_ENABLED=false`, `HERMES_X_AUTO_REPLY_ENABLED=false`, `HERMES_X_REQUIRE_OWNER_APPROVAL=true`.
- Read-only smoke tests for mentions/bookmarks/timeline returned `CreditsDepleted`, matching the X Developer Console `$0.00` credit balance. Hermes cannot produce useful X intelligence briefs until X API credits are added or linked.

## Decision

Use X/xurl first for read-only intelligence and draft-only social suggestions:

- summarize X bookmarks and searches
- identify useful social/search/AI-commerce signals
- draft Golden Collections posts or replies for owner review
- send private owner briefs through Telegram

Official Golden Collections X account: `@GCJewellery` / `https://x.com/GCJewellery`.

Do not use Hermes as a public X autoposter.

## Safety Gates

Source of truth: Doppler project `gc-hermes-agent`, config `prd`.

Safe default values to add or keep:

```env
HERMES_X_ENABLED=false
HERMES_X_MODE=read_only
HERMES_X_PUBLIC_WRITE_MODE=disabled
HERMES_X_AUTO_POST_ENABLED=false
HERMES_X_AUTO_REPLY_ENABLED=false
HERMES_X_REQUIRE_OWNER_APPROVAL=true
HERMES_X_DAILY_BRIEF_ENABLED=false
HERMES_X_APP_NAME=gc-xurl
```

Owner-approved public posting later should still keep:

```env
HERMES_X_AUTO_POST_ENABLED=false
HERMES_X_AUTO_REPLY_ENABLED=false
HERMES_X_REQUIRE_OWNER_APPROVAL=true
```

This means a later owner-approved post can be possible, but autonomous posting remains blocked.

## Files Added Or Updated

- Added X/xurl access plan: `knowledge-base/ops/hermes-x-access.md`
- Added readiness note: `knowledge-base/ops/hermes-xurl-readiness.md`
- Added private X brief prompt: `knowledge-base/ops/hermes-x-daily-brief.prompt.md`
- Added dry-run readiness checker: `scripts/check-hermes-xurl-readiness.ps1`
- Updated guardrails: `knowledge-base/ops/hermes-agent-guardrails.md`
- Updated Hermes runtime project context: `knowledge-base/ops/hermes-runtime/HERMES.md`
- Updated Hermes compact memory: `knowledge-base/ops/hermes-runtime/MEMORY.md`
- Updated Hermes style/back-burner list: `knowledge-base/ops/hermes-runtime/SOUL.md`
- Updated ops source map: `knowledge-base/ops/source-map.md`
- Updated open loops: `knowledge-base/ops/open-loops.md`

## Verification

Local dry-run helper exists and is designed to be non-destructive:

```powershell
.\scripts\check-hermes-xurl-readiness.ps1
.\scripts\check-hermes-xurl-readiness.ps1 -Json
.\scripts\check-hermes-xurl-readiness.ps1 -CheckNetwork
```

The helper checks for:

- `xurl` availability
- Doppler CLI availability
- local Hermes runtime files
- X/xurl and Hermes X safety gate variable names without printing values
- local safety gate conflicts
- optional no-auth X API reachability

It does not post, reply, like, DM, follow, bookmark, or mutate lists.

VPS check on 2026-05-20:

- Hermes VPS reachable at `gc-hermes-01`.
- Hermes Agent remains installed: `v0.14.0`.
- Doppler CLI is present on the VPS.
- `xurl` was installed under the `hermes` user and verified on PATH for shell sessions.
- `xurl auth status` now reports app `gc-xurl` with OAuth2 user `GCJewellery`.
- Updated Hermes ops/runtime files were synced to `/opt/gc-hermes/context` and the live Hermes runtime files.
- X OAuth was performed for `@GCJewellery`.
- No X post, reply, like, DM, follow, bookmark, or list mutation was performed.

Doppler safe-default write attempt:

- First attempt failed because Doppler's token is scoped to `/home/hermes/.hermes`, while the setup script originally ran from `/home/hermes`.
- The setup script was corrected to run Doppler from `/home/hermes/.hermes`.
- Second attempt reached Doppler successfully but returned: `You do not have write access to this config's secrets.`
- Conclusion: Doppler CLI is installed and authenticated on the VPS, but the configured Hermes service token is read-only. This matches the existing setup note for `gc-hermes-01-read`.
- Owner manually added the safe Doppler flags after this blocker.
- Flags have now been verified from the Hermes VPS.
- Public X write access remains disabled by verified config.

## Remaining Setup Needed

Authenticated setup is complete. Remaining owner-controlled decision:

1. Add or link X API credits for the X developer account so read endpoints work.
2. Keep public write gates disabled:
   - `HERMES_X_PUBLIC_WRITE_MODE=disabled`
   - `HERMES_X_AUTO_POST_ENABLED=false`
   - `HERMES_X_AUTO_REPLY_ENABLED=false`
   - `HERMES_X_REQUIRE_OWNER_APPROVAL=true`
3. Optional read-only smoke tests after credits are available:

```bash
xurl auth status
xurl whoami
xurl mentions -n 5
xurl bookmarks -n 5
```

## Recommendation

Enable in this order:

1. `HERMES_X_ENABLED=false`: keep disabled while installing and authenticating xurl.
2. `HERMES_X_ENABLED=true`, `HERMES_X_MODE=read_only`: allow read-only X intelligence.
3. `HERMES_X_DAILY_BRIEF_ENABLED=true`: private Telegram summary only.
4. Later, if owner is confident: `HERMES_X_MODE=owner_approved`, `HERMES_X_PUBLIC_WRITE_MODE=owner_approved`.

Do not enable `HERMES_X_AUTO_POST_ENABLED=true` now.
