# Pinterest Standard Access Remediation - 2026-05-24

## What Pinterest Said

Pinterest did not approve Standard access for app `1570604` because:

- The Privacy Policy did not mention Pinterest API data.
- The demo did not show enough Pinterest integration.
- The demo did not show the full OAuth flow.

## Fix Completed

The Shopify Privacy Policy was updated on 2026-05-24 with a new section titled:

```text
Pinterest API and Pinterest-derived data
```

The section states:

- Golden Collections uses the Pinterest API for its owner-approved publishing workflow.
- Golden Collections is not endorsed by, certified by, affiliated with, or sponsored by Pinterest.
- Pinterest-derived data is used only for Golden Collections' own publishing workflow.
- Pinterest content or Pinterest-derived data is not sold, rented, resold, redistributed, or shared with third parties for their independent use.
- When Pinterest authorization is disconnected or revoked, API use stops and stored tokens / no-longer-needed Pinterest-derived operational data are deleted or anonymized, normally within 30 days unless retention is legally or operationally required.

Verified immediately after update:

- Shopify policy/admin URL has the new section: `https://checkout.shopify.com/76492243242/policies/32313245994.html?locale=en`
- Public URL to send to Pinterest: `https://www.goldencollections.com/policies/privacy-policy`
- Note: public storefront cache may take a short time to show the new section without a preview/cache bypass.

## Reply To Pinterest

```text
Hi Teri,

Thank you for the clear guidance. We have updated our Privacy Policy to include Pinterest-API-specific language:

https://www.goldencollections.com/policies/privacy-policy

It now states that Golden Collections uses the Pinterest API for our owner-approved publishing workflow, that Golden Collections is not endorsed by or affiliated with Pinterest, what happens to Pinterest-derived data after disconnect/revocation, and that we do not resell or redistribute Pinterest content or Pinterest-derived data to third parties.

Please re-enable Trial access for app ID 1570604 so we can record and submit a revised demo video showing the complete Pinterest OAuth flow and Pinterest integration.

Thank you,
Anil
```

## New Demo Requirements

After Trial is re-enabled, the revised video should show:

1. Social Command Center Pinterest connection entry point.
2. Redirect to Pinterest OAuth.
3. Consent/approval by the GoldenCollectionsJewelry account.
4. Return to the app callback without showing tokens.
5. Pinterest board listing/selection from the API.
6. Pin title, description, image, board, and destination URL.
7. Final API publish attempt/result.
8. Owner approval control before publishing.
