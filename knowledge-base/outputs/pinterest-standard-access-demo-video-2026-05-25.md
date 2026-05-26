# Pinterest Standard Access Demo Video - 2026-05-25

## Output

- Video: `pinterest-upgrade-demo/renders/golden-collections-pinterest-standard-access-live-oauth-sandbox-demo-2026-05-25.mp4`
- Format: MP4, H.264, 1280x720, about 41 seconds.

## What the video shows

1. Pinterest Developer app page for app `1570604`, Golden Collections Content Publisher, with Trial access active.
2. Pinterest OAuth consent screen showing the app name, requested scopes, logged-in `GoldenCollections` account, and `Give access`.
3. Local callback URL after consent with the authorization `code` and `state`, followed by server-side token exchange completion.
4. API evidence:
   - Production `GET /v5/boards` succeeded with `200 OK`.
   - Production `POST /v5/pins` returned `403` because Trial apps must create Pins in the API Sandbox.
   - Sandbox `POST /v5/pins` succeeded with `201 Created`.
5. Created sandbox Pin shown on Pinterest:
   - Pin ID: `485825878576971431`
   - Pin URL: `https://www.pinterest.com/pin/485825878576971431/`
   - Destination URL: `https://www.goldencollections.com/blogs/jewellery-guides/real-kemp-jewellery-guide`

## Security notes

- No access token, refresh token, app secret, or sandbox token is included in the video or committed files.
- The OAuth callback screenshot shows a temporary authorization code because Pinterest specifically requested proof of the redirect/code step.

## Next action

Upload the MP4 in the Pinterest Standard access upgrade flow and submit the request again. The card should stay in review until Pinterest submission is completed, then move to waiting if Pinterest has not responded yet.

## Submission attempt - 2026-05-25

The Pinterest Standard access upgrade form was opened for app `1570604`.

- The MP4 upload completed successfully; Pinterest displayed `Upload successful!`.
- The company website field was updated to `https://www.goldencollections.com/`.
- The app purpose field was updated to explain the internal Golden Collections OAuth-to-Pin publishing workflow.
- Existing use case selections included Pin creation/scheduling and Reporting.
- Existing audience selections included Creators and Advertisers.
- Final submit is blocked by a live Google reCAPTCHA image challenge that requires human verification.

## Submitted - 2026-05-25

The owner completed the reCAPTCHA and clicked submit. The Pinterest Developer app page now shows:

- Current access: `Trial access active`
- Requested access: `Upgrade to Standard access pending`

The next step is to wait for Pinterest's review decision. A short reply to the support thread is recommended so Eloise has the context that the corrected Standard access request has been submitted.

## Support reply sent - 2026-05-25

A reply was sent to the existing Pinterest support thread with Eloise confirming that the revised Standard access request has been submitted for app `1570604`.

- Gmail sent message ID: `19e5ed597f801bad`
- Gmail thread ID: `19e4ae2ca2b6199d`
- The reply noted that the uploaded demo shows OAuth consent, redirect/code, server-side token exchange, production board access, Trial production Pin creation restriction, sandbox Pin creation, and the created Pin on Pinterest.

## Denied again - 2026-05-25

Pinterest replied in the same support thread:

- Gmail message ID: `19e5eee4393326fd`
- Sender: Pinterest support / Eloise
- Decision: Standard access denied again.
- Reason: the uploaded video was composed of screenshots and did not show the full uncut process.

This narrows the blocker. Privacy policy, Trial access, OAuth scope, and sandbox use were not called out in the latest denial. The next attempt must be a real continuous screen recording, not a slideshow or stitched screenshot video.

Required next demo:

1. Start recording before opening the OAuth URL.
2. Show the Pinterest authorization / Give access screen.
3. Click Give access during the recording.
4. Show redirect to localhost callback with code in the URL.
5. Show server-side token exchange success without exposing tokens.
6. Run the API check live in terminal: production board list, production Trial create restriction, sandbox Pin creation.
7. Open the created Pin on Pinterest.
8. Stop recording only after the created Pin is visible.

## Uncut demo recorded and resubmitted - 2026-05-25

The corrected Standard access request was submitted after Pinterest rejected the screenshot-based video.

- New video: `pinterest-upgrade-demo/renders/golden-collections-pinterest-standard-access-uncut-oauth-api-demo-2026-05-25.mp4`
- Format: MP4, H.264, 1280x720, 25 fps, about 40 seconds.
- Helper script: `scripts/pinterest-standard-uncut-demo-server.mjs`
- Submission status verified on Pinterest Developer app page: `Requested access: Upgrade to Standard access pending`

What the uncut video shows:

1. Local Golden Collections Pinterest API demo page.
2. Pinterest OAuth authorization screen for `Golden Collections Content Publisher`.
3. `Give access` action while logged in as `GoldenCollections`.
4. Redirect to localhost callback with authorization code and state visible on-screen.
5. Server-side token exchange success, without printing access token, refresh token, or app secret.
6. Live API checks:
   - Production board read succeeded: `GET /v5/boards`, `200 OK`.
   - Production Pin creation showed expected Trial restriction: `POST /v5/pins`, `403`.
   - Sandbox Pin creation succeeded: `POST /v5/pins`, `201 Created`.
7. Created sandbox Pin displayed on Pinterest.

Created Pin from the corrected uncut demo:

- Pin ID: `485825878576972078`
- Pin URL: `https://www.pinterest.com/pin/485825878576972078/`
- Destination URL: `https://www.goldencollections.com/blogs/jewellery-guides/real-kemp-jewellery-guide`

Security note: the video displays the temporary authorization code and callback URL because Pinterest requested proof of the OAuth redirect/code step. It does not display any access token, refresh token, app secret, or sandbox token.

## Support reply sent after uncut resubmission - 2026-05-25

A short reply was sent to Eloise confirming that a new Standard access request was submitted with a continuous uncut MP4 demo.

- Gmail sent message ID: `19e5f55be049aa62`
- Gmail thread ID: `19e4ae2ca2b6199d`

## Denied again after uncut resubmission - 2026-05-25

Eloise replied again in the same Pinterest support thread:

- Gmail message ID: `19e5f5ab317b3879`
- Sender: Pinterest support / Eloise
- Decision: Standard access denied again.
- Reason given: Pinterest says the submitted demo still appears to show only screenshots. They need to see a screen recording of the OAuth and Pin creation process.

Likely interpretation: the Playwright page-viewport recording is continuous, but it does not show browser chrome, the URL bar, or cursor movement, so the reviewer may still interpret it as a screenshot-style demo. The next attempt should be a true desktop/browser recording with the visible browser window, URL bar, cursor, OAuth consent click, localhost callback, live API checks, and created Pin.

No reply has been sent yet for this latest Eloise message.

## Desktop recording dry run - 2026-05-25

A true desktop/browser recording path was validated with Microsoft Edge and ffmpeg available on the Windows machine. The visible browser shows the address bar and full page chrome, which addresses the latest reviewer complaint.

Dry-run blocker: Edge is not currently authenticated into Pinterest for this OAuth flow. Opening the OAuth URL redirects to Pinterest login, and choosing Google opens a Google sign-in window. Owner login is required in the visible browser before Codex can record the complete OAuth consent, callback, API-check, and Pin-creation flow.

## Full desktop recording submitted - 2026-05-25

A new full desktop/browser recording was created using the authenticated Google Chrome profile so Pinterest can see the browser chrome, URL bar, OAuth consent page, localhost callback, live API checks, and created Pin page.

- New desktop video: `pinterest-upgrade-demo/renders/golden-collections-pinterest-standard-access-desktop-oauth-pin-demo-2026-05-25.mp4`
- Format: MP4, H.264, 1920x1080, 90 seconds.
- Verified with `ffprobe`: valid MP4, H.264 video stream, 1920x1080.
- Visual frame checks confirmed:
  - local demo page with full Chrome window and URL bar,
  - Pinterest OAuth consent screen with `Give access`,
  - localhost callback with authorization code and server-side token exchange,
  - live API check screen,
  - created Pin displayed on Pinterest.

Live API result from the final desktop recording:

- Production board read succeeded: `GET /v5/boards`, `200 OK`.
- Production Pin creation returned the expected Trial restriction: `POST /v5/pins`, `403`.
- Sandbox Pin creation succeeded: `POST /v5/pins`, `201 Created`.
- Created sandbox Pin ID: `485825878576972966`
- Created sandbox Pin URL: `https://www.pinterest.com/pin/485825878576972966/`
- Destination URL: `https://www.goldencollections.com/blogs/jewellery-guides/real-kemp-jewellery-guide`

Submission status:

- The desktop MP4 uploaded successfully in the Pinterest Standard access upgrade form.
- The form was submitted successfully.
- Pinterest Developer app page now shows `Requested access: Upgrade to Standard access pending`.

Support reply:

- A reply was sent to Eloise confirming the new full desktop screen recording and resubmission.
- Gmail sent message ID: `19e5fb8f34de93a5`
- Gmail thread ID: `19e4ae2ca2b6199d`

## Rejected after full desktop recording - 2026-05-25

Pinterest rejected the Standard access request again after the full desktop MP4 was uploaded and submitted.

Automated platform email:

- Gmail message ID: `19e607b60f691d05`
- Sender: Pinterest Developer Platform Team / `pinbot@account.pinterest.com`
- Timestamp: `2026-05-25T18:52:37+00:00`
- Subject: `Update to your application status`
- Reason given: request not approved; common reasons listed were that the demo did not show Pinterest integration and did not show the full OAuth flow.

Support thread reply:

- Gmail message ID: `19e607b819169fac`
- Sender: Pinterest support / Omaira
- Timestamp: `2026-05-25T18:52:46+00:00`
- Reason given: app `1570604` was denied because the provided video was still considered incorrect and "only shows screenshots"; Pinterest wants a full, uncut recording of the entire process from start to finish.

Important interpretation: this conflicts with the local evidence. The submitted MP4 was a valid 90-second desktop capture with visible Chrome browser chrome, URL bar, OAuth consent, localhost callback, API checks, and created Pin page. The next step should not be another blind resubmission. Ask Pinterest support to confirm they reviewed the file uploaded after the desktop resubmission and to identify the exact missing timestamp/step, or open a new Developer Tools ticket with the video file and frame-by-frame timestamps.

Follow-up sent:

- Gmail sent message ID: `19e65adba8714e01`
- Gmail thread ID: `19e4ae2ca2b6199d`
- Sent to: `support@pinterest2.zendesk.com`
- Attachment: `pinterest-upgrade-demo/renders/golden-collections-pinterest-standard-access-desktop-oauth-pin-demo-2026-05-25.mp4`
- Reply summary: asked Pinterest to confirm the review team is seeing the attached full desktop MP4 and, if still incomplete, identify the exact timestamp or step that does not satisfy the Standard access demo requirement.
