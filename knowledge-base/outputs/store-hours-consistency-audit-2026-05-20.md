# Store Hours Consistency Audit - 2026-05-20

Owner-confirmed source of truth:

- Monday-Saturday: 11:00 AM IST to 8:30 PM IST
- Sunday: 1:00 PM IST to 8:00 PM IST

## Updated

- `knowledge-base/wiki/business-entity.md` now records the owner-confirmed hours.
- `layout/theme.liquid` LocalBusiness schema now uses Monday-Saturday `11:00`-`20:30` and Sunday `13:00`-`20:00`.
- `snippets/organization-schema.liquid` now uses Monday-Saturday `11:00`-`20:30` and Sunday `13:00`-`20:00`.
- `config/settings_data.json` footer support text now says `Mon-Sat (11:00 AM-8:30 PM IST); Sun (1:00 PM-8:00 PM IST)`.
- The live Shopify theme assets were pushed through the Shopify Admin API to theme `186459816234` (`shopifyaitool`).
- Hermes wiki and ops/runtime context were synced after the local knowledge updates.

## Public Verification

- Shopify theme assets and section rendering now serve the corrected footer and LocalBusiness schema.
- `https://www.goldencollections.com/?section_id=footer` served the corrected footer after the push.
- The normal full-page cache for `https://www.goldencollections.com/` still served stale HTML shortly after the push:
  - footer: `Mon - Sat (11 AM - 8 PM)`
  - schema: Monday-Saturday `11:00`-`20:00`

This looks like Shopify page-cache propagation because the same main theme assets and section rendering already serve the corrected content.

## Still To Fix Or Recheck

- Recheck `https://www.goldencollections.com/` after propagation.
- Update Google Business Profile hours when manual/API access allows.
- Review public `goldencollections.in` pages if that legacy domain remains tied to the business; public pages were observed showing `24/7`.
- Google search snippets that quote the old footer will need recrawl after the public custom domain serves the corrected text.
