# Measurement Proof Surfacing Workflow

Created: 2026-05-24

Scope: Golden Collections SEO, GEO, AEO and UCP readiness for measurement-sensitive products.

## Current Audit Snapshot

Source: `knowledge-base/outputs/shopify-product-proof-measurement-readiness-audit-2026-05-24.md`

- Active products audited: 1,784
- Products with measurement metafields: 1,587
- Products with measurement image signals: 117
- Products with description measurement signals: 1,234
- Products with any measurement/proof signal: 1,613
- Products with no measurement/proof signal: 171
- Products hitting per-product fetch limits: 1

## Operating Rule

Do not turn a measurement, fit or compatibility idea into public copy unless it is supported by one of these:

1. Shopify product data or option values.
2. A visible ruler/tape or measurement-labelled image.
3. Owner-confirmed product data.
4. A permission-safe proof asset with approved wording.

If the proof is ambiguous, use neutral fit-help language and ask for owner confirmation.

## Proof Tiers

Tier 3: Public-ready proof

- Image visibly shows product measurement, ruler/tape, SKU/product identity or clear placement.
- Alt text can mention measurement proof.
- Product/collection copy can point customers to the measurement image.
- UCP/AEO answers can safely describe how to check fit.

Tier 2: Review-needed proof

- Product has measurement metafields or a likely measurement image, but the image/claim is not visually verified.
- Keep exact values in product data, but do not add new proof claims until a visual/contact-sheet review is complete.

Tier 1: No proof or weak proof

- Product may still be sellable, but do not claim visual measurement proof.
- Add to owner/photo queue if the product is high value, fit-sensitive, frequently asked about, or appears in UCP results.

## Weekly Workflow

1. Run the measurement-readiness audit.

```powershell
node scripts\audit-product-measurement-readiness.mjs --output=knowledge-base\outputs\shopify-product-proof-measurement-readiness-audit-YYYY-MM-DD.md
```

2. Sort the missing or weak-proof list by commercial priority:

- Deity crowns first.
- Deity necklaces/harams next.
- Varalakshmi faces, dolls, hastham/padam and setup items next.
- Dance jewellery measurement-sensitive items next.

3. Create or refresh a contact sheet only for candidates with likely visual proof.

4. Apply measurement-image alt updates only from approved/visually verified files, such as the existing `apply-*-measurement-alt.mjs` scripts.

5. Retest UCP prompts for the product family.

6. Record final status in the sprint report:

- products reviewed
- alt updates applied
- skipped products and why
- owner data still needed
- UCP prompt movement
- Merchant issue movement

## Owner Data Gates

Skip until owner confirms:

- deity compatibility by SKU
- crown fit claims for specific idols
- material for products with missing/unclear material
- exact included components when product photos/titles conflict
- customer/temple/home proof usage permissions

## Current Next Owner Capture Queue

Keep the already identified crown proof task first:

- `DGC269`
- `DGC267`
- `DGC272`
- `DGC263`
- `DGC255`
- `DGC259`
- `DGC270`

For each crown: front height with ruler, inside/bottom width with ruler, side/depth view where relevant, and a placement view on a suitable idol/face when possible.
