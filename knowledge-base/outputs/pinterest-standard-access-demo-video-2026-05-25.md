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
