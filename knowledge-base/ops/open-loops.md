# Golden Collections Open Loops

Last updated: 2026-05-25

Use this file for things waiting on owner approval, external access, real-world observation, or a later focused task.

Kanban source of truth: `knowledge-base/ops/kanban-board.md`. Use this open-loops file for richer context and history; use the Kanban board for current status, owner, next action, and verification.

## Business Operating Memory

- First manual growth brief created at `knowledge-base/ops/briefs/2026-05-16-growth-brief.md`. Validate whether this format is useful before building a dashboard.
- After one more manual brief, decide whether a daily or weekly Codex automation is worth creating.
- Keep recommendations short and business-focused; revise the brief format if it becomes noisy.
- Owner decided on 2026-05-19 to move forward with a Hermes agent for business operations. Treat this as a controlled pilot, not a broad autonomous system.
- Before Hermes setup, choose a stable secure network approach for the agent. Avoid shared consumer VPNs for business-account work; prefer stable dedicated egress and owner-controlled access.
- Hermes VPS setup is complete through the platform layer: Hetzner CPX32 server, Ubuntu 24.04.4 LTS rebuild, SSH hardening, firewall, fail2ban, automatic security updates, Docker, Tailscale, and Hermes install are done.
- Hermes browser tooling is now available after the Ubuntu 24.04 rebuild. Keep `AGENT_BROWSER_ARGS=--no-sandbox` in the server Hermes `.env`.
- Doppler project `gc-whatsapp-automation` / `prd` is now the source of truth for the approved WhatsApp/support-email/Supabase-service/Shopify-webhook/cron runtime secrets, including `SUPABASE_URL`. Do not place live credential values in wiki files.
- Doppler project `gc-hermes-agent` / `prd` is now the source of truth for Hermes runtime config. Server `gc-hermes-01` has a read-only Doppler service token named `gc-hermes-01-read`.
- Hermes is configured for provider `openai-codex` and model `gpt-5.4-mini`; ChatGPT/Codex OAuth is logged in and the first read-only Golden Collections brief succeeded.
- Telegram owner-control gateway is configured for private DM with allowed Telegram IDs `8601210897` and `8552935024`, and runs through `gc-hermes-gateway.service`. Keep it read-only at first; no customer sends, Shopify edits, or public posts.
- Telegram bot token was rotated in BotFather on 2026-05-19 and `TELEGRAM_BOT_TOKEN` was updated in Doppler `gc-hermes-agent` / `prd`.
- Telegram voice-note input was enabled on 2026-05-20 using local faster-whisper on the Hermes VPS. Scope is owner/brother allowed IDs only, audio input only, text replies only, no paid speech API, and cached audio deletion after transcription. Video input is blocked at the Telegram gateway with a short notice asking for a voice note or audio-only message. Ask owner to test with a short Telegram voice note.
- Hermes runtime inputs were created on 2026-05-19 under `knowledge-base/ops/hermes-runtime/`: `SOUL.md`, `MEMORY.md`, `USER.md`, `HERMES.md`, and `daily-owner-brief.prompt.md`. These keep personality, durable memory, user preferences, project instructions, and heartbeat prompt separate.
- Hermes wiki sync was verified on 2026-05-20: 22 local `knowledge-base/wiki/*.md` files were copied to `/opt/gc-hermes/context/knowledge-base/wiki/` and SHA-256 hashes matched. After future wiki changes, run `scripts/sync-hermes-knowledge.ps1`.
- X/xurl integration plan added on 2026-05-20 at `knowledge-base/ops/hermes-x-access.md`. Keep `HERMES_X_ENABLED=false`, `HERMES_X_PUBLIC_WRITE_MODE=disabled`, `HERMES_X_AUTO_POST_ENABLED=false`, and `HERMES_X_REQUIRE_OWNER_APPROVAL=true` until owner explicitly approves the next phase. X/xurl should start as read-only intelligence and draft-only social suggestions.
- X/xurl VPS setup on 2026-05-20: `xurl` installed for the Hermes user and app `gc-xurl` registered with the owner-created X developer app. OAuth completed for official account `@GCJewellery`; `xurl whoami` verified username `GCJewellery`, account name `Golden Collections`, and X id `2207358732`. Owner enabled `HERMES_X_ENABLED=true` for Phase 1 read-only use. Public-write gates remain closed: `HERMES_X_MODE=read_only`, `HERMES_X_PUBLIC_WRITE_MODE=disabled`, `HERMES_X_AUTO_POST_ENABLED=false`, `HERMES_X_AUTO_REPLY_ENABLED=false`, and `HERMES_X_REQUIRE_OWNER_APPROVAL=true`. Current blocker: X API read calls such as mentions/bookmarks/timeline return `CreditsDepleted` because the X developer account has `$0.00` credits. Buy/link credits before expecting Hermes X briefs to work.
- Browse.sh pattern adopted internally on 2026-05-19 as Golden Collections browser playbooks under `knowledge-base/ops/browser-skills/`. Use these for recurring live-page, Search Console, Merchant Center, and SERP/competitor checks before improvising browser automation. Do not subscribe to Browserbase yet.
- Hermes Content Command Center added on 2026-05-20 at `knowledge-base/ops/hermes-content-command-center.md`, with approval prompt `knowledge-base/ops/hermes-social-approval-brief.prompt.md`. Use it for consolidated posting recommendations across X, GBP, Meta, Pinterest, YouTube, LinkedIn, blogs, products, and proof assets. Hermes should recommend and ask approval; it should not become a stealth browser autoposter.

## Search, GEO, And Authority

- Owner corrected Golden Collections store/support hours on 2026-05-20: Monday-Saturday 11:00 AM IST to 8:30 PM IST; Sunday 1:00 PM IST to 8:00 PM IST. Local theme footer and LocalBusiness schema were updated, and the live Shopify theme assets `config/settings_data.json`, `layout/theme.liquid`, and `snippets/organization-schema.liquid` were pushed through the Shopify Admin API because Shopify CLI auth was unavailable. Verification: `https://6f15d1.myshopify.com/` serves the corrected hours, but `https://www.goldencollections.com/` was still serving stale custom-domain HTML shortly after the push; recheck after Shopify/CDN propagation. Update Google Business Profile hours manually/API when access allows. Public `goldencollections.in` pages still show `24/7` and should be reviewed if that legacy site remains public for the same business.
- Google Search agents / Universal Cart update was added to the wiki on 2026-05-20. Watch for India rollout, Merchant Center UCP onboarding, Shopify agentic-commerce controls, and any Search Console/Merchant/GA4 reporting for AI Mode, Search agents, Universal Cart, or UCP-driven traffic.
- First Anil measurement video asset was captured and prepared on 2026-05-20: half-crown fit guidance comparing deity face/crown-area width with crown width while keeping eyes, tilak and facial detail visible.
- Use `knowledge-base/ops/proof-asset-shot-list.md` when capturing the proof assets.
- The first video should be embedded on existing authority/help pages, not turned into a standalone page: measurement guide, fit-process page, Anil page, and deity crown guide.
- Continue capturing future first-hand visual proof when available: Anil measuring idol height/head width plus crown/haram fit examples.
- Monitor indexing and Search Console queries for Knowledge Hub, deity compatibility pages, glossary, fit-process page, proof stories, and Varalakshmi examples.
- Search Console near-win refresh completed on 2026-05-17; report saved at `knowledge-base/outputs/search-console-near-win-audit-2026-05-17.md`.
- Applied the first safe near-win action: routed `Lakshmi / Amman 3 Step Long Haram DLN095` into `/collections/lakshmi-amman-deity-jewellery` and set matching deity metafields.
- Applied the second safe near-win action: updated the two 50/100-bell ghungroo products and ghungroo collection SEO/metafields to reflect existing Bharatanatyam, Kuchipudi, Kathak, salangai, chilanka, chilanga and gejje search intent.
- Applied the third safe near-win action: updated BBM019, the real-kemp Mattal collection, and the regular Bharatanatyam Mattal collection for existing `ear mattal`, `mattal ear chain`, `matil`, and `mattel` search intent.
- Applied the fourth safe near-win action: updated Little Gopika and the Kids Bharatanatyam collection for existing `kids jewellery set`, `children's jewellery set`, and kids Bharatanatyam search intent; corrected the product feed age group from `adult` to `kids`.
- Pause the May 17 near-win batch now; next step is monitoring/recrawl rather than more page edits, unless a clearly urgent Merchant/feed issue appears.

## Merchant Center And Product Feed

- Read-only Merchant refresh completed on 2026-05-17; owner-facing triage saved at `knowledge-base/outputs/merchant-feed-cleanup-triage-2026-05-17.md`.
- Shopify Google & YouTube publication audit saved at `tmp/shopify-google-publication-blocker-audit-2026-05-17.json`; `0` draft blocker rows are currently published to Google in Shopify, and `83` stale variant rows reference variant IDs that no longer exist in Shopify.
- Targeted Merchant cleanup applied on 2026-05-17: invalid product inputs were removed only after Shopify verification; final blocker audit dropped from `221` rows to `2` rows.
- Remaining Merchant rows are `2` `NOT_IMPACTED` availability-sync notices where Shopify inventory is also `0` and Merchant availability is `OUT_OF_STOCK`; treat as monitoring unless the products should be restocked.
- Also confirm Shopify Google & YouTube channel/feed settings exclude draft, unpublished, and no-image products from Google surfaces.
- Recheck blocker counts later: missing-image draft/no-image blockers should stay at `0`, landing-page draft blockers should stay at `0`, stale variant offers should stay at `0`, and price-mismatch blockers should stay at `0`.
- Do not unpublish active products just because old variant offers remain in Merchant; product-level unpublishing would be too broad.
- Do not repeat Merchant API delete passes without a fresh blocker audit.

## Varalakshmi And Proof Pipeline

- Use the prepared Varalakshmi proof outreach package only with appropriate permission and owner review.
- Do not message proof candidates automatically.
- Confirm exact approved name/location wording before using any customer or temple example publicly.
- `/pages/varalakshmi-alankaram-examples` indexing recheck on 2026-05-16 returned `Submitted and indexed`; no further manual indexing request is needed right now.

## Reviews

- Do not enable live post-delivery WhatsApp review requests until a real fulfillment webhook confirms true delivery timing for current India Post/Speed Post workflow.
- Keep using neutral review language only.
- Suppress review requests for support issues, refunds, delivery problems, high-value/custom sensitive orders, or unhappy customers.

## WhatsApp And Support Email

- Reminder for 2026-05-28: review the first USA dance-school outreach batch before any WhatsApp follow-up. Check support inbox for bounces/replies from the 15 emails sent on 2026-05-24/25, then decide whether to manually WhatsApp only 5-7 best-fit schools. Do not WhatsApp all 15 automatically; keep the message soft and resource-first.
- WhatsApp Cloud API phone registration is complete for `+91 63098 75444`; inbound webhook capture and free 24-hour session replies work.
- Paid WhatsApp template sends are blocked by Meta error `131042 Business eligibility payment issue`; fix WABA billing/payment setup before any live template pilot.
- Keep WhatsApp automation disabled/dry-run until paid template delivery is confirmed and owner approves a small controlled live pilot.
- Keep support email live sending disabled until owner approves a live-send test.
- Use support email ingest/drafts as review-only unless live sending is explicitly enabled.
- Support email connection check on 2026-05-20: password was corrected in Doppler and read-only IMAP ingest now works. Manual apply created support-email draft records for non-system messages. Keep live sending disabled; decide later whether to enable scheduled ingest only.
- Gmail `goldencollections9@gmail.com` read-only IMAP check succeeded on 2026-05-20 using a Gmail app password stored in Doppler `gc-hermes-agent` / `prd`. Treat Gmail as admin-only/read-only. Do not use it for public support, signatures, schema, storefront copy, or customer-facing drafts.

## External Channel Access

- Google Business Profile API access/quota request remains pending under GBP Help case `6-0195000040588`; Google stated the review time is approximately `7-10 business days`.
- Pinterest Standard access needs re-review before public production Pin creation. Pinterest replied on 2026-05-24 that Trial was revoked because the Privacy Policy lacked Pinterest API data wording and the demo did not show full OAuth/Pinterest integration. Shopify Privacy Policy was updated on 2026-05-24; verify the public URL has refreshed, reply asking Trial to be re-enabled, then record a new OAuth-to-Pin demo.
- Meta Facebook/Instagram board posting is wired and connected through owner-login OAuth. Verified Page/IG pairs: `Golden Collections` -> `goldencollections_gbs`, `Deity Jewellery` -> `deity_jewellery`, and `Bharatanatyam Jewellery - GoldenCollections.com` -> `bharatanatyamjewellery`. Local board gates are enabled, but `SOCIAL_REQUIRE_OWNER_APPROVAL=true` remains mandatory before any post.
- Instagram routing rule: `goldencollections_gbs` is the main all-jewellery account and should receive all approved jewellery posts; `deity_jewellery` receives deity-only posts; `bharatanatyamjewellery` receives Bharatanatyam, dance jewellery, kemp, and black kemp posts. For deity or dance/kemp content, prepare both the main-account variant and the relevant niche-account variant.
- YouTube metadata update for `6CyaMiZmGXs` needs manual YouTube Studio update or re-authorization with broader YouTube scope.

## Admin Cleanup

- Shopify Admin API still reports `shop.email` as `goldencollections9@gmail.com`; public `shop.contactEmail` is correct as `support@goldencollections.com`. Treat the Gmail as admin-only unless changed manually in Shopify Admin.
