# Golden Collections Entity Inconsistency Audit - 2026-05-16

## Scope

Audit requested before any further authority/content build.

Checked:

- Live sitemap crawl: 1,920 URLs from `https://www.goldencollections.com/sitemap.xml`
- AI-facing files: `llms.txt`, `llms-full.txt`, `agents.md`
- Live About, Glossary, Knowledge Hub, Home, Anil, proof pages and indexed guide pages
- Shopify Admin shop identity fields available through Admin GraphQL
- Shopify `glossary_term` metaobjects
- Theme schema, meta tag snippets, footer contact copy and local theme surfaces

Entity facts used as the standard:

- Golden Collections store entity started/was established in 2012.
- Golden Collections is led by founder/public leader Anil Tunk.
- Golden Collections is based in Secunderabad/Hyderabad, Telangana, India.
- Public support email is `support@goldencollections.com`.
- Phone/WhatsApp is `+91 7337294499`.
- Family heritage since 1961 may be used only when clearly separated from the store entity.
- Do not say Golden Collections was founded in 1961.
- Do not say Ashok Tunk or Lakshman Tunk founded Golden Collections.
- Do not use `goldencollections9@gmail.com` as the public support email.

## Executive Summary

The situation is better than expected, but there are two real cleanup items.

Confirmed live/public problems:

1. One live glossary metaobject sentence says Golden Collections has been crafting temple jewellery in Hyderabad since 1961. This incorrectly attaches 1961 to the store entity instead of family heritage.
2. Shopify Admin `shop.email` still shows `goldencollections9@gmail.com`. Shopify Admin `contactEmail` is correct as `support@goldencollections.com`. The old Gmail is not currently exposed in the crawled storefront, `llms.txt`, `llms-full.txt`, or `agents.md`, but the Admin source should still be cleaned.

Clean confirmations:

- No live sitemap URL exposed `Ashok Tunk`.
- No live sitemap URL exposed `Lakshman Tunk`.
- No live sitemap URL exposed `goldencollections9@gmail.com`.
- `llms.txt`, `llms-full.txt`, and `agents.md` expose `support@goldencollections.com`.
- Theme LocalBusiness/Organization schema uses `foundingDate: 2012`, founder Anil Tunk, and `support@goldencollections.com`.
- Footer contact copy uses `support@goldencollections.com`.

## Confirmed Fixes

These are factual corrections that should be safe to apply after owner approval.

| Surface | Current Text / Current Value | Why It Is a Problem | Proposed Replacement |
|---|---|---|---|
| Live glossary page: `https://www.goldencollections.com/pages/jewelry-glossary` via Shopify metaobject `glossary_term` handle `temple-jewellery` | "Temple jewellery refers to the traditional South Indian antique gold-plated jewellery style originally created for adorning Hindu temple deities and later adapted for Bharatanatyam and Kuchipudi classical dancers. Characterised by intricate deity motifs, kemp stones (red & green), and antique gold finish, Golden Collections has been crafting authentic temple jewellery in Hyderabad since 1961." | This says Golden Collections itself has been crafting since 1961, which conflicts with the confirmed 2012 store entity. | "Temple jewellery refers to the traditional South Indian antique gold-plated jewellery style originally created for adorning Hindu temple deities and later adapted for Bharatanatyam and Kuchipudi classical dancers. Characterised by intricate deity motifs, kemp stones, and antique gold finish, this jewellery style is part of the South Indian tradition Golden Collections serves today. Golden Collections was established by Anil Tunk in 2012 in Secunderabad/Hyderabad and is rooted in a family jewellery tradition since 1961." |
| Shopify Admin shop identity | `shop.email`: `goldencollections9@gmail.com` | This is not currently visible in the crawled storefront or AI files, but it is still a source-level mismatch inside Shopify. It may leak into Shopify-controlled surfaces, notifications, generated commerce files, or future integrations. | Change Shopify Admin store email source to `support@goldencollections.com` if Shopify allows it, or document it as a non-public account/login email if it cannot be changed. `shop.contactEmail` is already correct. |

## Needs Owner Decision

These are not necessarily wrong. They use the approved "family heritage since 1961, store entity since 2012" framing. The only question is whether you want to keep the heritage wording prominent or make it quieter.

| Surface | Current Text | My Recommendation | Owner Decision Needed |
|---|---|---|---|
| About page: `https://www.goldencollections.com/pages/about-us` visible copy | "Golden Collections is rooted in a family jewellery tradition since 1961. The Golden Collections store was established by Anil Tunk in 2012 in Secunderabad/Hyderabad..." | Keep. This is clear and correctly separates family heritage from store establishment. | Approve keeping as-is, or ask me to tighten the sentence. |
| About page title/meta/OG/Twitter descriptions | "Golden Collections is rooted in a family jewellery tradition since 1961 and was established by Anil Tunk in 2012..." | Keep. It is qualified, though it is compact. If you want maximum AI clarity, we can rewrite to: "Golden Collections was established by Anil Tunk in 2012 in Secunderabad/Hyderabad and is rooted in a family jewellery tradition since 1961..." | Keep as-is or approve the tighter order. |
| Homepage authority copy | "Established by Anil Tunk in Secunderabad, Golden Collections serves classical dancers, temples, devotees, and South Indian diaspora families, while carrying forward a family jewellery tradition rooted in 1961." | Keep. This is one of the cleanest phrasings because it starts with Anil/store context and only then mentions family tradition. | Approve keeping as-is. |
| Knowledge Hub: `https://www.goldencollections.com/pages/golden-collections-knowledge-hub` | "Rooted in a family jewellery tradition since 1961, with the store entity anchored to 2012." and "Golden Collections is rooted in a family jewellery tradition since 1961, while the store entity remains anchored to 2012." | Keep. This is explicitly written for AI/entity clarity and is safer than most possible alternatives. | Approve keeping as-is. |
| Glossary meta description | "Glossary of temple jewellery, Bharatanatyam jewellery, Kuchipudi jewellery and deity alankaram terms by Golden Collections, established by Anil Tunk in 2012 and rooted in a family jewellery tradition since 1961." | Keep or tighten. It is correct. If changing the glossary metaobject anyway, we can leave this alone. | Keep as-is unless you want every meta line to use the same word order. |

## Owner-Written Replacement Needed

No current live page requires this immediately.

If you want to mention Ashok Tunk, Lakshman Tunk, or named family heritage publicly, the wording should come from you before publication. Current live crawl found no public `Ashok Tunk` or `Lakshman Tunk` references, and that is safer until the family-history wording is explicitly approved.

Suggested placeholder rule:

> Do not add named family-founder claims until owner supplies the exact family heritage sentence.

## AI-Facing File Status

| URL | Status |
|---|---|
| `https://www.goldencollections.com/llms.txt` | Clean. Shows `support@goldencollections.com`; no old Gmail, Ashok, Lakshman, or 1961 founder conflict found. |
| `https://www.goldencollections.com/llms-full.txt` | Clean. Shows `support@goldencollections.com`; no old Gmail, Ashok, Lakshman, or 1961 founder conflict found. |
| `https://www.goldencollections.com/agents.md` | Clean. Shows `support@goldencollections.com`; no old Gmail, Ashok, Lakshman, or 1961 founder conflict found. |

## Local / Private False Positives

The old Gmail appears in local workflow files, Google Search Console screenshots/Markdown captures, Merchant Center workflow notes, and OAuth/test-user notes. These are not public storefront entity conflicts.

Examples:

- GSC local captures showing the logged-in Google account label.
- Merchant Center workflow notes using the developer/test account.
- YouTube/GBP workflow notes that reference test-user setup.

Recommendation: do not rewrite these blindly. They are operational history, not customer-facing support copy.

## Approval Request

Recommended approval:

1. Apply the confirmed glossary metaobject fix.
2. Attempt the Shopify Admin `shop.email` correction to `support@goldencollections.com`. If Shopify blocks it because it is the account/login owner email, document that it is non-public and keep `contactEmail` as the public source.
3. Keep the About, Homepage, Knowledge Hub, and glossary meta descriptions as-is because they correctly separate 1961 family heritage from the 2012 Golden Collections store entity.

No live changes were made during this audit.

## Completion Update - 2026-05-16

Owner approved the two confirmed fixes.

Completed:

- Updated the Shopify `glossary_term` metaobject for `Temple Jewellery` to remove the stale sentence "Golden Collections has been crafting authentic temple jewellery in Hyderabad since 1961."
- New glossary wording now separates the tradition from the store entity: Golden Collections is rooted in a family jewellery tradition since 1961, and the Golden Collections store was established by Anil Tunk in 2012 in Secunderabad/Hyderabad.
- Attempted to update Shopify Admin `shop.email` to `support@goldencollections.com` through the Admin API. Shopify returned HTTP `406 Not Acceptable`; GraphQL introspection for the active API version exposes no `shopUpdate` mutation. `shop.contactEmail` remains correct as `support@goldencollections.com`.
- Documented `shop.email: goldencollections9@gmail.com` in `knowledge-base/wiki/business-entity.md` as a non-public account/admin email unless changed manually in Shopify Admin.
- Marked entity cleanup as closed in `knowledge-base/wiki/content-roadmap.md` for public storefront and AI-facing files.

Final strict spot-check targets:

- `https://www.goldencollections.com/`
- `https://www.goldencollections.com/pages/about-us`
- `https://www.goldencollections.com/pages/jewelry-glossary`
- `https://www.goldencollections.com/pages/golden-collections-knowledge-hub`
- `https://www.goldencollections.com/pages/anil-tunk`
- `https://www.goldencollections.com/llms.txt`
- `https://www.goldencollections.com/llms-full.txt`
- `https://www.goldencollections.com/agents.md`

Final strict spot-check result:

- No public `goldencollections9@gmail.com`.
- No `Ashok Tunk`.
- No `Lakshman Tunk` or `Shri Lakshman`.
- No `Golden Collections founded/established/started in 1961`.
- No stale glossary sentence saying Golden Collections has been crafting temple jewellery since 1961.
- Expected signals are present across key pages: `support@goldencollections.com`, Anil Tunk, 2012, and qualified family heritage wording where relevant.
