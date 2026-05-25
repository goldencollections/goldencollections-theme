# Golden Collections Authority Next Build - 2026-05-15

Status: implemented and published to the live Shopify theme.

## What Was Built

### Compatibility Authority Pages

Published six customer-facing authority pages:

- `/pages/lakshmi-varalakshmi-deity-jewellery-guide`
- `/pages/balaji-vishnu-perumal-deity-jewellery-guide`
- `/pages/ganesha-deity-crown-ornament-guide`
- `/pages/krishna-deity-jewellery-guide`
- `/pages/amman-devi-alankaram-jewellery-guide`
- `/pages/how-golden-collections-checks-deity-jewellery-fit`

Each page uses the reusable `gc-deity-compatibility-guide` section with:

- Direct-answer hero.
- Deity-specific search names.
- Ornament groups to consider.
- Fit checks before ordering.
- Visible FAQ section.
- WebPage, FAQPage and BreadcrumbList JSON-LD.
- Links back to the Knowledge Hub, Anil Tunk page, glossary, measurement guide and crown guide.

### Knowledge Hub Expansion

Updated `/pages/golden-collections-knowledge-hub` with a deity compatibility section linking to the new pages and process proof page.

### Glossary Authority Upgrade

Upgraded `/pages/jewelry-glossary` from a simple term list into an authority glossary surface with:

- Premium dark hero.
- Direct answer block.
- Pathway cards to crown sizing, Lakshmi/Varalakshmi, Balaji/Vishnu and fit process pages.
- Metaobject-driven term cards retained.
- Visible glossary FAQ.
- WebPage, DefinedTermSet and FAQPage JSON-LD.

### Scripts Updated

Updated:

- `scripts/create-authority-pages.mjs`
- `scripts/publish-authority-theme-assets.mjs`
- `scripts/search-console-inspect-authority-urls.mjs`

These scripts now create, publish and inspect the expanded authority page set.

## Live Verification

Checked live URLs after publish:

- All eight authority URLs returned HTTP 200.
- No checked URL had `noindex`.
- All checked URLs included JSON-LD.
- All checked URLs were present in Shopify's pages sitemap.
- Search Console URL Inspection API confirmed Home, About, Anil and Glossary are indexed.
- Search Console currently reports the Knowledge Hub and the six new pages as `URL is unknown to Google`, which is expected for newly published pages.

## Search Console Note

The current Search Console OAuth token can inspect URLs, but it does not have the scope needed to submit sitemaps through the Sitemaps API. The sitemap already includes the pages, so the next practical action is to request indexing manually in Search Console for the new pages, starting with:

1. `/pages/golden-collections-knowledge-hub`
2. `/pages/lakshmi-varalakshmi-deity-jewellery-guide`
3. `/pages/balaji-vishnu-perumal-deity-jewellery-guide`
4. `/pages/how-golden-collections-checks-deity-jewellery-fit`

## Manual Owner Follow-Up

Anil should review cultural and product accuracy for:

- Lakshmi, Varalakshmi and Amman overlap.
- Balaji, Vishnu, Venkateswara and Perumal naming.
- Ganesha crown fit language.
- Krishna flute, feather and crown language.
- Amman and Devi alankaram language.

The next authority asset should be the WhatsApp-friendly PDF handbook, using `knowledge-base/outputs/deity-jewellery-handbook-and-proof-plan-2026-05-15.md` as the source draft.
