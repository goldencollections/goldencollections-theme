# Pinterest Trial Restored And Standard Access Next Steps - 2026-05-25

## Latest Email Summary

Pinterest sent two relevant messages on 2026-05-25:

- Pinterest Developer Platform approved `Golden Collections Content Publisher` for Trial access again.
- Eloise from Pinterest API Ops confirmed app trial `1570604` has been approved again and explained what is required for Standard access.

## What Changed

Trial access is back.

The previous blocker for `GC-PIN-002` is resolved. We can now record a real OAuth/API demo instead of a simulated or limited demo.

Standard access is still not approved. Pinterest says Standard access was denied because the submitted demo did not fully show the required OAuth flow and integration result.

## What Pinterest Wants In The Standard Demo

The revised video should explicitly show:

1. Pinterest login page.
2. Grant-access screen for the app.
3. Redirect back to the registered Golden Collections callback URL with the authorization code visible in the URL bar.
4. Server-side code exchange for access token.
5. API integration process and result.
6. If creating a Pin, show the created Pin on Pinterest.

Pinterest also said the sandbox environment can be used as reference if needed.

## Existing Kanban Cards

- `GC-PIN-001` should move to done because the reply was sent and Pinterest responded.
- `GC-PIN-002` should move from blocked to ready because Trial access has been restored.

## Recommended Next Action

Run a real Trial-access demo recording:

1. Confirm app `1570604` shows Trial access in Pinterest Developers.
2. Run the local Pinterest OAuth flow.
3. Capture the login, consent, redirect, token exchange, board listing, Pin creation, and resulting Pin page.
4. Upload the new demo through the Pinterest Developers app card using the Standard upgrade flow.

## Reply Needed?

No immediate email reply is required if the Standard upgrade form is available.

If the upgrade form is not available or the app card still looks blocked, reply to Eloise and say Trial access email was received, but the app card does not yet show the expected Standard upgrade option.
