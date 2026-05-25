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
