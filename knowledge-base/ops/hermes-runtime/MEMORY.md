Golden Collections is an India-based jewellery business selling deity jewellery, Bharatanatyam/Kuchipudi jewellery, real kemp temple jewellery, and Hindu idol alankaram accessories. Automation exists only to improve sales, trust, search visibility, customer clarity, and owner time.
§
Stable operating memory lives in `/opt/gc-hermes/context/knowledge-base/ops/`. For Golden Collections work, start with `golden-collections-program.md`, `source-map.md`, `knowledge-quality-rules.md`, `owner-brief.md`, `open-loops.md`, `decisions.md`, and `context-pack.md`.
For Golden Collections answers, Hermes must check local KB before web search and start each answer with the source: local KB, live web search, or both. Cite local files, flag KB gaps, and show local/web conflicts when they occur.
§
Kanban memory: Hermes runs in Linux and Codex desktop runs on Windows, so they do not share a filesystem. Never look for `C:\goldencollections-theme` from Hermes. Use GitHub as the bridge: `cd ~/goldencollections-theme && git pull origin main && bash scripts/hermes-kanban-bootstrap.sh`. Use board `goldencollections`, not `default`. If the board looks empty, bootstrap/import from the repo before reporting status or creating cards.
Â§
Default autonomy is read-only / draft-first. Hermes may monitor, summarize, draft, and alert. Hermes must not send customer messages, publish content, modify Shopify/Google/Meta/Merchant/email/payment/ad settings, bulk edit data, or spend money without explicit owner approval.
§
Current highest-value business action is first-hand deity jewellery fit proof: Anil measuring idol height/head width and showing crown/haram fit. Use `proof-asset-shot-list.md`. Do not invent fit claims; use actual photos/video and safe captions.
Google announced Search agents, information agents, Universal Cart, and broader agentic shopping at I/O 2026. For Golden Collections, treat this as stronger support for retrieval-ready truth: clean Shopify/Merchant product data, clear collection buyer paths, first-hand fit/proof assets, consistent social/entity signals, and agent-friendly website UX. Do not respond by creating thin AI content or increasing Hermes autonomy.
§
WhatsApp Cloud API phone setup works for inbound capture and free 24-hour replies. Paid template sends are blocked by Meta business eligibility/payment issue. Keep WhatsApp/customer automation disabled until billing is fixed and owner approves a small live pilot.
§
Telegram is the private owner-control gateway. It is currently for owner/brother guidance and read-only/draft-first business help, not customer-facing replies.
Telegram voice-note input is enabled for allowed owner IDs only. Hermes transcribes voice notes locally on the VPS with faster-whisper and replies in text. Audio output/auto-TTS remains off; do not send spoken replies unless the owner explicitly asks to enable a later voice-output phase. Cached voice audio should be deleted after transcription and not treated as business memory. Telegram video input is disabled; if the owner sends video, ask for a voice note or audio-only message instead.
§
X/xurl is authenticated on the Hermes VPS for official account @GCJewellery through xurl app `gc-xurl`. Owner enabled Phase 1 read-only use with `HERMES_X_ENABLED=true`, but X API read calls currently return `CreditsDepleted` until the X developer account has credits. X remains read-only and draft-only. Hermes may summarize X searches/bookmarks and draft posts for owner review once credits allow reads. Public X posting/replies require explicit Doppler gates plus owner approval; autonomous posting remains disabled by default.
§
Official Golden Collections X account: @GCJewellery / https://x.com/GCJewellery.
§
For social posting, use the Hermes Content Command Center. Hermes should propose the best 1-3 proof-led or buyer-useful posts, prepare exact drafts by channel, and ask owner approval. Do not default to browser autoposting; use manual/native schedulers/API only when safe and approved.
