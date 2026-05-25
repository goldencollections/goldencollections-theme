# Hermes X/xurl Readiness

Last updated: 2026-05-20

Purpose: keep the future Hermes X integration draft-first and safe while checking local readiness for `xurl`.

## Safety Model

Hermes may later use X only for owner-approved monitoring, drafting, or read-only checks.

Hermes must not:

- post, reply, repost, like, follow, unfollow, or DM
- change X account settings
- print API keys, bearer tokens, access tokens, or OAuth secrets
- store secrets in repo files
- run a live X action without explicit owner approval for that exact action

## Local Readiness Helper

Use the draft helper from the repo root:

```powershell
.\scripts\check-hermes-xurl-readiness.ps1
```

Optional no-auth reachability check:

```powershell
.\scripts\check-hermes-xurl-readiness.ps1 -CheckNetwork
```

Machine-readable output:

```powershell
.\scripts\check-hermes-xurl-readiness.ps1 -Json
```

The helper checks:

- whether an `xurl` command is available on `PATH`
- whether the Doppler CLI is available
- whether local Hermes runtime context files exist
- whether common X/Twitter config and Hermes X safety gate variable names are present, without printing values
- whether local safety gates conflict with the safe default of read-only, public writes disabled, auto-post disabled, and owner approval required
- optionally, whether `api.x.com` is reachable with a no-auth HEAD request

It does not call write endpoints and does not require secrets.

## VPS Setup Helper

Use this to check the Hermes VPS without installing anything:

```powershell
.\scripts\setup-hermes-xurl-vps.ps1 -CheckOnly
```

Install `xurl` on the Hermes VPS, still without authenticating or posting:

```powershell
.\scripts\setup-hermes-xurl-vps.ps1 -InstallXurl
```

Set safe Doppler defaults if the remote Doppler token has permission:

```powershell
.\scripts\setup-hermes-xurl-vps.ps1 -SetSafeDopplerDefaults
```

If the server token is read-only, setting Doppler defaults will fail safely. In that case, set the flags manually in Doppler project `gc-hermes-agent`, config `prd`.

Sync updated Hermes ops/runtime files to the VPS:

```powershell
.\scripts\sync-hermes-ops.ps1
```

## Future Authenticated Smoke Test

When the owner explicitly approves authenticated testing, keep the first test read-only. Suitable examples are account lookup, current-user lookup, or API capability inspection, depending on the final `xurl` command syntax.

Do not add a posting test to this helper. Posting belongs in a separate owner-approved runbook after credentials, account identity, approval path, and rollback expectations are documented.
