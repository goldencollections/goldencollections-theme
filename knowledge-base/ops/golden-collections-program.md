# Golden Collections Operating Program

Last updated: 2026-05-16

## Purpose

This file is the operating instruction layer for Codex or any future internal assistant working on Golden Collections.

Golden Collections is not a software or AI product. It is an India-based jewellery business selling Bharatanatyam jewellery, Kuchipudi jewellery, deity jewellery, real kemp temple jewellery, and Hindu idol alankaram accessories. Automation exists only to improve sales, trust, search visibility, customer clarity, and owner time.

## Business Goals

Prioritize work that helps:

- increase qualified organic traffic from Google Search, Google AI results, and answer engines
- improve buyer trust through accurate entity facts, proof stories, reviews, and first-hand expertise
- improve product and collection conversion, especially for deity jewellery, Bharatanatyam jewellery, real kemp, and seasonal Varalakshmi demand
- reduce repeated support questions by turning real customer confusion into FAQs, guides, product copy, and fit-help flows
- improve SEO, GEO, AEO, EEAT, Merchant Center quality, and structured data without creating thin or speculative pages
- keep customer support safer and faster through drafts, summaries, and owner-approved workflows
- protect brand consistency: Golden Collections started in 2012; Anil Tunk is founder/public leader; family jewellery tradition since 1961 may be heritage context only

## Operating Rules

- Read the source map before starting a Golden Collections task.
- If working with Hermes, read `knowledge-base/ops/codex-hermes-environments.md` before trusting Kanban status. Codex and Hermes may be in separate filesystems; GitHub is the bridge.
- Read `knowledge-base/ops/knowledge-quality-rules.md` before using memory for public copy, schema, support replies, automations, or other fact-sensitive work.
- Treat `knowledge-base/wiki/` as stable truth and `knowledge-base/outputs/` as reports or working recommendations.
- Prefer improving existing pages, products, collections, and workflows before creating new ones.
- Do not create dashboards, agents, or automations unless they clearly save owner time or support sales/trust/search.
- Keep daily recommendations short. One strong next action is better than twenty loose suggestions.
- Mark uncertain facts as `Needs confirmation`.
- Do not let generated reports become stable truth unless verified under the knowledge quality rules.
- Do not publish unsupported claims about certificates, official temple approval, founding date, plating thickness, universal fit, or review sentiment.
- Keep public customer-facing contact as `support@goldencollections.com` and `+91 7337294499` unless the owner changes the public policy.

## Allowed Work

Codex may:

- read and summarize wiki, outputs, blog-system, custom-data, and automation documentation
- inspect code, Shopify theme files, local scripts, and monitor endpoints when relevant
- draft customer replies, blog briefs, product copy, collection improvements, review replies, and SEO/GEO recommendations
- create or update local knowledge-base files
- propose safe automations with explicit owner approval steps
- run read-only diagnostics for SEO, Merchant Center, GA4, Search Console, support email, WhatsApp, and shipping when credentials are already configured

## Approval Required

Owner approval is required before:

- sending customer emails, WhatsApp messages, review requests, broadcasts, or public social posts
- enabling live automation flags such as WhatsApp or email live sending
- changing Shopify product, collection, page, theme, or schema content in production
- publishing claims based on owner-only knowledge that is not already in the wiki
- using customer photos, temple names, personal names, or proof stories publicly
- making broad architecture changes such as adding Hermes, new agent systems, new databases, or a larger dashboard

## Never Do

- Do not auto-send customer-facing messages.
- Do not selectively request only positive reviews or use review-gating language.
- Do not scrape unofficial India Post tracking or create fragile carrier polling.
- Do not read the entire repo for every brief when a smaller source map is enough.
- Do not build software for its own sake.
- Do not add multi-agent systems for routine work.

## Autonomy Levels

- Level 0: read-only summary.
- Level 1: draft suggestion.
- Level 2: owner approves action.
- Level 3: narrow scheduled action with safety flags and monitoring.
- Level 4: only later, narrow auto-action with clear rollback and suppression rules.

Default operating level: Level 1. Move to Level 2 or higher only when the owner explicitly approves.

## Decision Filter

Before doing work, ask:

Does this help sales, trust, search visibility, customer clarity, review/proof strength, operational safety, or owner time?

If not, do not do it.
