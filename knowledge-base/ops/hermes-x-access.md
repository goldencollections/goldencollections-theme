# Hermes X/xurl Access Plan

Last updated: 2026-05-20

Purpose: let Hermes help Golden Collections learn from X, summarize useful posts/bookmarks, and draft social content without accidentally becoming a public posting bot.

Official Golden Collections X account: `@GCJewellery` / `https://x.com/GCJewellery`.

## Current Decision

Proceed with a staged X/xurl integration, but keep public write actions disabled by default.

Hermes may use X for:

- read-only search and trend checks
- bookmark/timeline summaries
- competitor and creator monitoring
- draft X posts and reply suggestions for owner review
- daily or weekly X intelligence briefs sent privately to the owner through Telegram

Hermes must not post, reply, quote, like, bookmark, DM, follow, unfollow, or manage lists unless the owner explicitly enables the relevant Doppler gates and approves the action flow.

## Permission Phases

### Phase 1 - Read-Only Intelligence

Default phase.

Allowed:

- `xurl whoami`
- X searches
- timeline reads
- bookmark reads
- profile reads
- list reads
- private owner summaries

Not allowed:

- posting
- replying
- quoting
- liking
- bookmarking/unbookmarking
- following/unfollowing
- DMs
- list mutation

Business uses:

- summarize X bookmarks into `useful / ignore / action`
- watch Bharatanatyam, real kemp, Varalakshmi, deity jewellery, Shopify, UCP, and AI-commerce topics
- identify customer language that should inform product titles, FAQs, guides, and collection paths

### Phase 2 - Draft-Only Social Assistant

Allowed:

- draft posts
- draft replies
- draft quote-post text
- prepare content calendars
- suggest which saved post is worth responding to

Not allowed:

- any public X write action

Business uses:

- turn approved Golden Collections proof, guides, product launches, and fit education into draft X posts
- draft responses to credible discussions about Bharatanatyam jewellery, real kemp, deity jewellery, and Shopify AI commerce
- prepare posts for Anil/owner voice without publishing automatically

### Phase 3 - Owner-Approved Public Posting

Allowed only after Doppler gates are deliberately changed.

Required controls:

- owner approval must happen in the current Telegram or terminal session
- Hermes must show exact final text, media, account, and action before posting
- Hermes must save the post ID/link after success
- no customer/private/order details unless separately approved

Use cases:

- publish approved educational posts
- publish approved product/guide announcements
- reply to low-risk public discussions when owner explicitly approves exact wording

### Phase 4 - Autonomous Public Posting

Not recommended now.

This should stay disabled unless Golden Collections has:

- a written content policy
- approved topic lanes
- hard rate limits
- logging and rollback workflow
- manual review samples showing Hermes consistently sounds like the business
- a clear business reason that outweighs reputational risk

## Doppler Safety Gates

Add these to Doppler project `gc-hermes-agent`, config `prd`.

Default safe values:

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

Meaning:

- `HERMES_X_ENABLED=false`: Hermes should not use X/xurl yet.
- `HERMES_X_MODE=read_only`: the highest normal mode is read-only.
- `HERMES_X_PUBLIC_WRITE_MODE=disabled`: all public write actions are blocked.
- `HERMES_X_AUTO_POST_ENABLED=false`: autonomous posting is blocked even if other flags are changed.
- `HERMES_X_AUTO_REPLY_ENABLED=false`: autonomous replies are blocked even if other flags are changed.
- `HERMES_X_REQUIRE_OWNER_APPROVAL=true`: owner approval is required for any public write.
- `HERMES_X_DAILY_BRIEF_ENABLED=false`: X brief is off until xurl auth is verified.
- `HERMES_X_APP_NAME=gc-xurl`: expected xurl app/profile name.

Owner-approved posting later:

```env
HERMES_X_ENABLED=true
HERMES_X_MODE=owner_approved
HERMES_X_PUBLIC_WRITE_MODE=owner_approved
HERMES_X_AUTO_POST_ENABLED=false
HERMES_X_AUTO_REPLY_ENABLED=false
HERMES_X_REQUIRE_OWNER_APPROVAL=true
```

Autonomous posting would require all of these and is not recommended:

```env
HERMES_X_MODE=autonomous
HERMES_X_PUBLIC_WRITE_MODE=autonomous
HERMES_X_AUTO_POST_ENABLED=true
```

If any gate is missing or unclear, Hermes must treat X write access as disabled.

## Setup Steps

Owner or Codex can install xurl on the Hermes VPS, but the X developer OAuth authorization requires owner credentials and consent.

Current status as of 2026-05-20:

- X developer app name: `Golden Collections Hermes`
- xurl app/profile name: `gc-xurl`
- OAuth account: `@GCJewellery`
- `xurl whoami` verified username `GCJewellery`, account name `Golden Collections`, and X id `2207358732`.
- No public X write action was performed during setup.
- Owner enabled Phase 1 by setting `HERMES_X_ENABLED=true`.
- Public-write gates remain closed: `HERMES_X_MODE=read_only`, `HERMES_X_PUBLIC_WRITE_MODE=disabled`, `HERMES_X_AUTO_POST_ENABLED=false`, `HERMES_X_AUTO_REPLY_ENABLED=false`, and `HERMES_X_REQUIRE_OWNER_APPROVAL=true`.
- Current external blocker: X API read endpoints return `CreditsDepleted` until the X developer account has credits.

1. Create or use an X developer app.
2. Set redirect URI exactly: `http://localhost:8080/callback`.
3. On the Hermes VPS, install xurl.
4. Register the app:

```bash
xurl auth apps add gc-xurl --client-id CLIENT_ID --client-secret CLIENT_SECRET
```

5. Authenticate:

```bash
xurl auth oauth2 --app gc-xurl
xurl auth default gc-xurl
xurl auth status
xurl whoami
```

6. Do not store the client secret in the knowledge base. Store X app credentials only in Doppler or xurl's own secure local auth storage.

## Daily X Intelligence Brief

When Phase 1 is enabled, Hermes may produce a private Telegram brief with:

1. Useful posts or bookmarks.
2. What matters for Golden Collections.
3. Whether the item affects SEO/GEO/AEO, Shopify/UCP, product data, or social content.
4. Suggested owner action.
5. Draft post ideas, clearly labelled as drafts.

Recommended saved searches:

- `Bharatanatyam jewellery`
- `real kemp jewellery`
- `black kemp jewellery`
- `Varalakshmi alankaram`
- `deity jewellery`
- `arangetram jewellery`
- `Shopify UCP`
- `agentic commerce Shopify`
- `AI search SEO ecommerce`

## Content Safety Rules

Hermes must follow Golden Collections knowledge rules before drafting public X content:

- no unsupported material, plating, certificate, temple/priest approval, or universal-fit claims
- no customer/order/photo/location details without permission
- no fake urgency or review nudging
- no religious-procedure advice beyond product selection and fit guidance
- no AI-slop posts made only to chase trends

Good X content for Golden Collections should be:

- specific
- useful
- buyer-oriented
- proof-led
- culturally careful
- connected to real products, guides, or owner experience

## First Safe Workflow

After xurl is authenticated and Doppler is set to read-only:

1. Hermes reads the owner's X bookmarks.
2. Hermes summarizes the top 10 into:
   - useful now
   - watch later
   - ignore
3. Hermes drafts at most 3 possible Golden Collections post ideas.
4. Hermes sends the brief privately to the owner.
5. Nothing is posted.
