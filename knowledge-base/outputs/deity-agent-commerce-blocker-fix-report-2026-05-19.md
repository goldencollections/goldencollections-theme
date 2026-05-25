# Deity Agent-Commerce Blocker/Fix Report

Generated: 2026-05-19

## Scope

Goal: resolve or document the selected-variant availability blockers and the crown top-10 regression from the deity agent-commerce stability check.

Guardrails followed:

- Did not change DGE201 or DGE202.
- Did not publish unavailable products.
- Did not change inventory counts or create artificial availability.
- Applied only product-data fixes that matched the product truth.

## Selected-Variant Availability Blockers

Products inspected:

- DGE009
- DGE013
- VHL013
- VDF031

Evidence:

- Before: `tmp/variant-blocker-investigation/variant-blockers-before-2026-05-19.json`
- After: `tmp/variant-blocker-investigation/variant-blockers-after-2026-05-19.json`
- Earring search sanity check: `tmp/deity-earrings-ucp-sprint/ucp-after-variant-and-crown-cleanup-2026-05-19.json`
- Script: `scripts/investigate-variant-availability-blockers.mjs`

### Diagnosis

This was not a no-inventory product problem and not only a stale UCP problem. All four products were active and had available inventory, but their first/default Shopify variant was sold out. UCP `get_product` on the old first variant selected an unavailable size, while UCP `get_product` on an in-stock measured variant had no selected-availability issue.

| Product | Old first/default variant | Issue | New first/default variant | Result |
| --- | --- | --- | --- | --- |
| DGE009 | DGE009, 1.5 x 0.7, unavailable | Selected sold-out size | DGE009-2, 1.5 x 1, available | Clean |
| DGE013 | DGE013, 3 x 1.65, unavailable | Selected sold-out size | DGE013-2, 4 x 2.25, available | Clean |
| VHL013 | VHL013, 3 x 2 cm, unavailable | Selected sold-out size | VHL013-1, 4 x 3 cm, available | Clean |
| VDF031 | VDF031, 6.5 x 4.5, unavailable | Selected sold-out size | VDF0311, 7 x 4.5, available | Clean |

### Fix Applied

Used Shopify `productVariantsBulkReorder` to move an already in-stock variant to position 1 for each product.

No inventory, price, product status, or publication changes were made.

After evidence:

- DGE009 first variant is now DGE009-2 and UCP selected-availability issues are empty.
- DGE013 first variant is now DGE013-2 and UCP selected-availability issues are empty.
- VHL013 first variant is now VHL013-1 and UCP selected-availability issues are empty.
- VDF031 first variant is now VDF0311 and UCP selected-availability issues are empty.
- A fresh earring UCP search now returns DGE013 as variant `49956118331690` and DGE009 as variant `49902745452842`, matching the in-stock variants moved to first/default position.

## Crown Top-10 Regression

Evidence:

- Before retest: `tmp/crown-ucp-sprint/ucp-regression-retest-2026-05-19.json`
- After retest: `tmp/crown-ucp-sprint/ucp-regression-after-fix-2026-05-19.json`
- Product cleanup before/after: `tmp/crown-regression-investigation/balaji-earring-leakage-cleanup-before.json`, `tmp/crown-regression-investigation/balaji-earring-leakage-cleanup-after.json`
- Script: `scripts/fix-balaji-crown-earring-leakage.mjs`

### Before

Fresh retest reproduced the stability-check regression:

| Prompt | Before top-3 | Before top-10 |
| --- | ---: | ---: |
| Varalakshmi crown for home pooja | 3/3 | 10/10 |
| deity mukut kireedam | 3/3 | 10/10 |
| goddess crown with size | 3/3 | 10/10 |
| Balaji crown for idol | 3/3 | 4/10 |

The six wrong top-10 results for `Balaji crown for idol` were:

1. DGE009 - Deity Karna Pathakam Earrings for Balaji / God Idol
2. DGE007 - Deity Karna Pathakam Earrings for Balaji / God Idol
3. DGE013 - Deity Gold Plated Karna Pathakam Earrings for Balaji / God Idol
4. DGE003 - Deity Round Earrings for Balaji / God Idol
5. DGE010 - Deity Gold Plated Karna Pathakam Earrings for Balaji / God Idol
6. DGE011 - Deity Karna Pathakam Earrings for Balaji / God Idol

### Diagnosis

The leakage was product-data related. The earring pages correctly described earring fit, but included crown-query language such as `crown position` and `large crown` in product description and `custom.fit_notes`. That made Balaji earring pages relevant to the crown intent even though the product type and title were earrings.

### Fix Applied

Updated only truthful fit language:

- `crown position` -> `head ornament clearance`
- `large crown` -> `large head ornament`
- remaining generic `crown` mentions in the affected earring fit copy -> `head ornament`

Applied to:

- The six leaking Balaji earring products.
- The deity earrings collection fit copy/metafields, so collection-level guidance does not reintroduce crown-query leakage.

No product titles were changed, because the titles already truthfully identify the products as earrings.

### After

Immediate UCP retest after cleanup:

| Prompt | After top-3 | After top-10 |
| --- | ---: | ---: |
| Varalakshmi crown for home pooja | 3/3 | 10/10 |
| deity mukut kireedam | 3/3 | 10/10 |
| goddess crown with size | 3/3 | 10/10 |
| Balaji crown for idol | 3/3 | 10/10 |

Overall crown score recovered from 34/40 top-10 correct to 40/40 top-10 correct.

## Remaining Watch Item

Run the same crown prompt set again after the normal 48-72 hour indexing window. The immediate UCP retest is clean, but delayed re-ranking can still happen after Shopify/catalog refresh cycles.
