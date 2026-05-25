# Golden Collections Knowledge Quality Rules

Last updated: 2026-05-16

## Purpose

Bad memory is worse than no memory. These rules protect Golden Collections from wrong facts entering customer-facing copy, schema, support replies, automations, SEO/GEO recommendations, or public profiles.

Use this file before moving information from raw notes or generated outputs into the stable wiki, and before publishing any fact-sensitive content.

## Source Tiers

Use the strongest available source tier for each important claim.

- `Owner confirmed`: directly confirmed by Anil/owner or recorded in an owner-confirmed raw note.
- `Shopify verified`: read from Shopify Admin, Shopify API, product data, collection data, theme asset, or rendered section output.
- `Live-site verified`: checked on the public Golden Collections storefront or public profile.
- `Connected-platform verified`: checked through an official connected account/API such as Search Console, GA4, Merchant Center, Meta, WhatsApp Cloud API, YouTube, Google Business Profile, Pinterest, or LinkedIn.
- `External source cited`: supported by a reliable external source and cited in the relevant report.
- `Working recommendation`: useful analysis or suggestion, but not a stable fact.
- `Needs confirmation`: plausible but not yet safe to publish.
- `Do not publish`: explicitly unsafe, unsupported, contradictory, private, or not owner-approved.

## Folder Roles

- `knowledge-base/raw/`: source notes, owner confirmations, permission records, observations.
- `knowledge-base/wiki/`: stable business knowledge that future sessions may treat as truth.
- `knowledge-base/outputs/`: audits, drafts, reports, plans, research, and recommendations.
- `knowledge-base/ops/`: current operating memory, decisions, open loops, source map, and owner brief.

Generated reports in `outputs/` do not become truth automatically. Move only verified facts into `wiki/`, and only when the source tier is clear.

## Public-Use Rule

Before using a fact in public copy, schema, customer support, email, WhatsApp, ads, social posts, or product/collection pages, confirm that it is either:

- already in `knowledge-base/wiki/` with no contradiction in `open-questions.md` or `ops/open-loops.md`
- owner confirmed
- verified from Shopify/live site/connected platform
- cited from a reliable external source when the claim is not about Golden Collections' private operations

If not, label it `Needs confirmation` and do not publish it.

## Contradiction Check

Before publishing fact-sensitive work, check:

1. `knowledge-base/wiki/business-entity.md`
2. `knowledge-base/wiki/open-questions.md`
3. `knowledge-base/ops/decisions.md`
4. the relevant category or workflow wiki page
5. any recent output file directly tied to the task

If two sources conflict, do not choose silently. Mark the conflict and ask for owner confirmation, or use the most recent owner-confirmed decision if it clearly resolves the conflict.

## Do-Not-Say List

Do not publish or repeat these unless a newer owner-confirmed decision explicitly changes them:

- Golden Collections was founded, established, or started in 1961.
- Ashok Tunk or Lakshman Tunk is the current founder/public leader of Golden Collections.
- `goldencollections9@gmail.com` as a public customer-support contact.
- Golden Collections provides certificates.
- Golden Collections is an official supplier, temple-approved, priest-approved, certified, or endorsed by a temple unless written permission confirms that exact claim.
- Regular Bharatanatyam/Kuchipudi jewellery is Golden Collections' `imitation kemp` range.
- Deity jewellery universally fits all idols.
- Unsupported plating thickness for regular Bharatanatyam/Kuchipudi or deity jewellery.
- Positive-review nudging, review gating, incentives for reviews, or requests for only happy customers to review.
- Customer names, temple names, photos, videos, order details, or locations without permission and approved wording.

## High-Risk Claim Types

Treat these as high-risk and require stronger evidence:

- founding date, founder, ownership, heritage, family tradition
- material, plating, gold content, stone type, weight, certification
- temple, priest, institution, or customer endorsement
- shipping delivery guarantees or delivery-date promises
- universal fit, size compatibility, idol-height rules
- medical, legal, tax, customs, or religious-procedure advice
- review requests and public review replies
- customer identity, permission, and proof-story usage

## Updating The Wiki

When adding or changing stable knowledge:

1. Update the smallest relevant wiki page.
2. Include the source tier in the text when the claim could later be disputed.
3. Add or update backlinks if the fact affects another page.
4. Add unresolved uncertainty to `knowledge-base/wiki/open-questions.md` or `knowledge-base/ops/open-loops.md`.
5. Update `knowledge-base/ops/decisions.md` only for durable decisions, not temporary tasks.

## Publishing Checklist

Before public-facing output, verify:

- facts match `business-entity.md`
- risky claims are source-backed
- open questions are not presented as facts
- visible page content and schema claims match
- review language is neutral
- contact details are public-safe
- permissions exist for proof stories, names, photos, and videos
- no `Do not publish` item appears

## Monthly Audit

At least monthly, run a focused knowledge audit:

- scan wiki and ops files for high-risk claim types
- compare public pages/schema against `business-entity.md`
- check `open-questions.md` and remove or resolve stale items
- move only verified recurring facts from outputs into wiki
- prune noisy open loops that no longer affect sales, search, trust, or operations

