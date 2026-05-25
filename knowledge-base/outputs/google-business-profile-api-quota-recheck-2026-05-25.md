# Google Business Profile API Quota Recheck - 2026-05-25

Card: `GC-GBP-001 - Wait for Google Business Profile API quota/access`

## Result

Access has not been granted yet.

The local OAuth token exists and the account/location discovery command was rerun:

```powershell
node scripts\google-gbp-list-accounts-locations.mjs
```

The command still fails before account discovery because the Google Cloud project has zero Google Business Profile API quota.

## Current Error

```text
GET https://mybusinessaccountmanagement.googleapis.com/v1/accounts
HTTP 429 RESOURCE_EXHAUSTED
quota_metric: mybusinessaccountmanagement.googleapis.com/default_requests
quota_limit_value: 0
consumer: projects/812052515128
quota_limit: DefaultRequestsPerMinutePerProject
```

## Timing

The API access request was submitted on 2026-05-21 under Google Business Profile Help case `6-0195000040588`.

Google's stated review window was approximately 7-10 business days. Counting from the next business day after submission, the practical window is:

- Day 1: 2026-05-22
- Day 2: 2026-05-25
- Day 7: 2026-06-01
- Day 10: 2026-06-04

## Next Action

Do not follow up yet unless Google replies earlier.

Recheck quota on or after 2026-06-05. If quota is still zero after 2026-06-04, send the prepared follow-up asking whether case `6-0195000040588` is still under review and whether more information is needed.

Prepared follow-up text remains in:

```text
knowledge-base/outputs/google-business-profile-api-followup-2026-05-21.md
```

## Acceptance Status

Not met yet.

Acceptance requires non-zero quota and successful account/location discovery.
