# Deity Agent-Commerce Stability Retest - 2026-05-21

Status: completed. No Shopify data was changed.

Evidence files:

- `tmp/crown-ucp-sprint/ucp-baseline.json`
- `tmp/deity-short-necklace-ucp-sprint/ucp-baseline.json`
- `tmp/deity-long-haram-ucp-sprint/ucp-baseline.json`
- `tmp/deity-waist-belt-ucp-sprint/ucp-stability-2026-05-21.json`
- `tmp/deity-earrings-ucp-sprint/ucp-stability-2026-05-21.json`

## Summary

| Category | Result | Status |
| --- | ---: | --- |
| Deity crowns | 40/40 top-10 correct; 12/12 top-3 correct | Holding |
| Deity short harams | 40/40 top-10 correct; 12/12 top-3 correct | Holding |
| Deity long harams | 40/40 top-10 correct; 12/12 top-3 correct | Holding |
| Deity waist belts / vaddanam | 40/40 top-10 correct; 12/12 top-3 correct | Holding |
| Deity earrings, general/goddess/Balaji | Required top-3 checks holding | Holding |
| Jhumki for god idol | 0/10 strict jhumki results | Inventory/publishing gap |

## Category Detail

### Crowns

Prompts retested:

- `Varalakshmi crown for home pooja`: 10/10
- `deity mukut kireedam`: 10/10
- `goddess crown with size`: 10/10
- `Balaji crown for idol`: 10/10

No wrong product leakage appeared in the top 10.

Proof tier note:

- Balaji/Vishnu crown top-3 winners are Tier 3.
- Several general/goddess crown top-3 winners are still Tier 1 despite correct ranking: DGC269, DGC267, DGC260, DGC259, DGC273.
- This is not a search metadata regression. It remains an owner proof-photo / visual-confirmation task for the existing Anil crown capture list.

### Short Harams

Prompts retested:

- `deity short necklace for idol`: 10/10
- `short haram for god idol`: 10/10
- `goddess short necklace with size`: 10/10
- `Balaji short necklace for idol`: 10/10

Top-3 proof status: all checked top-3 winners are Tier 3 with measurement alt, dimensions, and copy signals.

### Long Harams

Prompts retested:

- `deity long haram for idol`: 10/10
- `long haram for god idol`: 10/10
- `goddess long haram with size`: 10/10
- `Balaji long haram for idol`: 10/10

Top-3 proof status: all checked top-3 winners are Tier 3 with measurement alt, dimensions, and copy signals.

### Waist Belts / Vaddanam

Prompts retested:

- `deity waist belt for idol`: 10/10
- `vaddanam for god idol`: 10/10
- `goddess waist belt with size`: 10/10
- `Varalakshmi vaddanam for pooja idol`: 10/10

No wrong product leakage appeared in the top 10.

Proof note: top winners overlap with the approved waist-belt measurement-alt batch, including DWB-007, DWB-028, DWB-005, DWB-012, DWB-011, DWB-002, DWB-006, DWB-025, DWB-004, DWB-014, DWB-017, DWB-022, and DWB-023.

### Earrings

Prompts retested:

- `deity earrings for idol`: top 3 correct; 9 visible results, all correct
- `goddess earrings with size`: top 3 correct; 7 visible results, all correct
- `Balaji earrings for idol`: top 3 correct; 6 visible results, all correct
- `jhumki for god idol`: 0/10 strict jhumki results

Wrong strict-jhumki top-10 results:

1. Venkateshwara Balaji Idol for Varalakshmi Vratham 27 in VVD104
2. God Idol Mustache Ornament with Stone Work DGM-005
3. God Idol Mustache Ornament with Stone Work DGM-004
4. God Idol Mustache Ornament with Stone Work DGM-003
5. God Idol Mustache Ornament with Stone Work DGM-002
6. Surya & Moon Idol Ornament Set for Pooja - DSM004
7. Deity Vaddanam Waist Belt for Varalakshmi / Goddess Idol with Stone Work DWB-007
8. God Idol Mustache Ornament with Stone Work DGM-001
9. Premium Celestial Sun & Moon Idol Decor - DSM008
10. Deity Karna Pathakam Earrings for Balaji / God Idol DGE009

Diagnosis:

- This is not a truthful metadata correction task for existing Karna Pathakam products.
- DGE201 and DGE202 remain draft/unavailable and must not be published as substitutes.
- Active in-stock jhumka/jhumki products exist for Bharatanatyam/Kemp, but they are not deity jhumka products and should not be relabeled for god idols.
- Current fix class: owner inventory/publishing task. Add true deity jhumka/jhumki products only when real product images, inventory, fit context, and product truth are available.

## Action Items

1. Keep crowns, short harams, long harams, and waist belts as stable; no metadata fix needed from this retest.
2. Continue the existing Anil proof-photo task for Tier 1 crown winners, especially DGC269, DGC267, DGC260, DGC259, and DGC273.
3. Treat deity jhumki as a product/inventory gap, not an SEO copy gap. Do not publish DGE201/DGE202 until real product readiness exists.
