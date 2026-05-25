# Google Business Profile API Access Request - 2026-05-21

Status: submitted to Google Business Profile API access review.

## Case

- Google Business Profile Help case ID: `6-0195000040588`
- Previous Google Cloud support case reference, if needed: `7-7132000040829`
- Project number: `812052515128`
- OAuth client project ID from local config: `project-0c888c66-3653-4fc9-84a`
- Business: Golden Collections
- Intended use: direct owner-approved Google Business Profile posts, account/location discovery, and later review-management drafts for the owner.
- Submitted through the Google Business Profile API contact form as an Application for Basic API Access on 2026-05-21.
- Google stated the expected review time is approximately `7-10 business days`.

## Current Verified State

- OAuth re-authorization completed successfully on 2026-05-21.
- `tmp/google-gbp-token.json` exists and has a refresh token.
- Token is currently valid.
- API call still fails before account/location discovery because quota is zero.

Command run:

```powershell
node scripts\google-gbp-list-accounts-locations.mjs
```

Current error:

```text
GET https://mybusinessaccountmanagement.googleapis.com/v1/accounts
HTTP 429 RESOURCE_EXHAUSTED
Quota exceeded for quota metric 'Requests' and limit 'Requests per minute'
service: mybusinessaccountmanagement.googleapis.com
quota_metric: mybusinessaccountmanagement.googleapis.com/default_requests
quota_limit_value: 0
consumer: projects/812052515128
quota_limit: DefaultRequestsPerMinutePerProject
```

## Submitted Request Summary

The request asked for Google Business Profile API access / non-zero quota for project number `812052515128`, with this owner-approved use case:

- discover the Business Profile account and location IDs for our owned profile
- create owner-approved Google Business Profile update posts from approved Golden Collections content
- later, read reviews and prepare draft replies for owner approval

The request clarified that this is not broad third-party agency access or automated mass posting, and that all public posting will remain owner-approved.

## Follow-Up Message If Google Asks For More

OAuth authorization is working, but the API still cannot be used because the project has zero quota. The current error is:

```text
GET https://mybusinessaccountmanagement.googleapis.com/v1/accounts
HTTP 429 RESOURCE_EXHAUSTED
Quota exceeded for quota metric 'Requests' and limit 'Requests per minute'
service: mybusinessaccountmanagement.googleapis.com
quota_metric: mybusinessaccountmanagement.googleapis.com/default_requests
quota_limit_value: 0
consumer: projects/812052515128
quota_limit: DefaultRequestsPerMinutePerProject
```

Could you please confirm whether case `6-0195000040588` is still under review, and whether any additional information is needed to grant Google Business Profile API access / non-zero quota for project number `812052515128`?

Thank you.

## Console Links

- Google Cloud support cases: `https://console.cloud.google.com/support/cases`
- Quotas and system limits: `https://console.cloud.google.com/iam-admin/quotas`
- Google Business Profile API limits doc: `https://developers.google.com/my-business/content/limits`

## Local Next Step After Google Responds

After Google grants non-zero quota:

```powershell
node scripts\google-gbp-list-accounts-locations.mjs
```

Then set the discovered values in `env`:

```text
GOOGLE_GBP_ACCOUNT_ID=
GOOGLE_GBP_LOCATION_ID=
```

Only after account/location discovery succeeds should `GOOGLE_GBP_API_APPROVED=true` be set for the Social Command Center.
