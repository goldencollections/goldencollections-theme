# Golden Collections Decisions

Last updated: 2026-05-19

Use this file to avoid re-litigating decisions in future chats.

## Operating System And Memory

- Decision: proceed with a controlled Hermes agent pilot.
- Rationale: owner decided Hermes may help with business memory and operations, but it must reduce owner workload and stay constrained by approval rules.
- Decision: do not run Hermes as a broad autonomous swarm.
- Rationale: Golden Collections needs reliable business assistance, not extra operational complexity.
- Decision: use `knowledge-base/ops/` as the operating memory anchor.
- Rationale: files are inspectable, portable across chats, and aligned with the existing Golden Collections wiki.
- Decision: use Codex as the worker/analyst and Codex mobile later as the remote steering layer, if it works for the workspace setup.
- Rationale: this keeps the business brain close to the repo, wiki, and automation code.

## Automation Philosophy

- Decision: build augmentation before autonomy.
- Rationale: Golden Collections is a jewellery business; automations must reduce owner work and support sales/trust, not become a second job.
- Decision: no customer-facing auto-send by default.
- Rationale: customer email, WhatsApp, reviews, and public publishing require owner approval and safe compliance.
- Decision: Hermes may monitor, summarize, draft, and alert, but must not publish, send customer messages, modify business accounts, or spend money without owner approval.
- Rationale: automation should support sales/trust work while preventing runaway action.

## Business Focus

- Decision: prioritize sales, qualified traffic, trust, SEO/GEO/AEO/EEAT, customer guidance, review/proof signals, and operational clarity.
- Decision: avoid building software for its own sake.
- Decision: use one strong recommended next action rather than long task lists when briefing the owner.

## Entity And Public Claims

- Decision: Golden Collections started in 2012; Anil Tunk is founder/public leader.
- Decision: family jewellery tradition since 1961 may be used only as heritage context, not as Golden Collections' founding date.
- Decision: do not use old public Gmail in customer support copy, schema, AI files, or automation outputs.
- Decision: do not claim certificates, official supplier status, temple approval, or priest endorsement unless specifically confirmed in writing.

## Product And Content Language

- Decision: call the regular dance range `regular Bharatanatyam/Kuchipudi jewellery`, not `imitation kemp`.
- Decision: use customer-friendly real kemp language such as `Kemp stones` or `Kempu stones`.
- Decision: deity jewellery fit should be based on deity, idol size, ornament type, measured dimensions, and fit caveats rather than universal compatibility claims.
