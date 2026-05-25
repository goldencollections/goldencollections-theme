# Proof Block Placement Plan

Date: 2026-05-16

Scope: recommendation only. No live theme or Shopify content changes were made.

## Source Facts And Guardrails

- Golden Collections started in 2012 and is led by Anil Tunk from Secunderabad/Hyderabad.
- Public copy may say Golden Collections is rooted in a family jewellery tradition since 1961, but must keep the store entity anchored to 2012.
- Hanuman proof fact to reuse safely: "Golden Collections deity jewellery was used for Hanuman Jayanti alankaram at Sri Vijaya Vinayaka Swamy Temple, Malkajgiri, coordinated with Ayyagaru Ram Sharma."
- Hanuman event date: May 12, 2026.
- Allowed wording: "used for Hanuman Jayanti alankaram", "coordinated with Ayyagaru Ram Sharma", "shared with permission", "temple alankaram example".
- Avoid: "official supplier", "temple-approved", "endorsed by the temple", "certified by the temple", "preferred supplier", "priest-approved".
- Future Varalakshmi proof should not publish until owner/media permission confirms the exact setup, customer/temple identity handling, and approved photos/videos.

## Existing Surfaces Inspected

| Area | Existing file / section | Current role |
| --- | --- | --- |
| Anil Tunk page | `templates/page.anil-tunk.json` -> `sections/gc-anil-authority-profile.liquid` | Founder/profile authority page with proof cards and guide links. |
| Fit-process page | `templates/page.how-golden-collections-checks-deity-jewellery-fit.json` -> `sections/gc-deity-compatibility-guide.liquid` | Reuses compatibility section with a page-handle branch for the fit process. |
| Measurement guide | `templates/page.how-to-measure-idol-for-deity-jewellery.json` -> `sections/gc-idol-measurement-guide.liquid` | Interactive checklist and measurement guidance. |
| Deity crown guide | `templates/page.deity-crown-mukut-kireedam-size-guide.json` -> `sections/gc-deity-crown-guide.liquid` | Crown sizing guide with product showcase and FAQ. |
| Knowledge Hub | `templates/page.golden-collections-knowledge-hub.json` -> `sections/gc-knowledge-hub.liquid` | Central authority hub with entity proof cards, guides, schema, and internal links. |
| Proof hub | `templates/page.temple-alankaram-proof.json` -> `sections/gc-proof-stories-hub.liquid` | Pulls `jewellery-guides` articles tagged `temple alankaram proof`. |
| Homepage proof section | `templates/index.json` section `gc_proof_stories_hub` -> `sections/gc-proof-stories-hub.liquid` | Homepage proof carousel/grid linking to `/pages/temple-alankaram-proof`. |
| Varalakshmi authority guide | `templates/page.varalakshmi-alankaram-guide.json` -> `sections/gc-authority-simple-guide.liquid` | Future proof placement surface for Varalakshmi once media/permission is ready. |
| Deity authority hub | `templates/page.deity-jewellery-alankaram-guide.json` -> `sections/gc-deity-authority-hub.liquid` | Optional secondary hub for linking proof into deity-guide navigation. |

## Recommended Changes

### 1. Anil Tunk Page

Edit: `sections/gc-anil-authority-profile.liquid`

Best placement:

- Add `proof_url` and `hanuman_proof_url` assigns near the existing `knowledge_url`, `measure_url`, and `crown_url` assigns.
- Add one guide-grid card after "How to Measure Your Idol for Deity Jewellery" or after the crown guide card.
- Optionally add a fourth proof-strip card, but the guide-grid card is safer because it avoids overcrowding the top proof band.

Safe-to-publish-now snippet:

```text
Real temple alankaram proof
Golden Collections deity jewellery was used for Hanuman Jayanti alankaram at Sri Vijaya Vinayaka Swamy Temple, Malkajgiri, coordinated with Ayyagaru Ram Sharma. Shared with permission as a real alankaram example.
```

Internal links:

- `/pages/temple-alankaram-proof`
- `/blogs/jewellery-guides/hanuman-jayanti-alankaram-sri-vijaya-vinayaka-swamy-temple-malkajgiri-2026`
- Keep existing links to `/pages/how-to-measure-idol-for-deity-jewellery` and `/pages/deity-crown-mukut-kireedam-size-guide`.

Publish status: safe now if the Hanuman article URL is live. If the article is not public yet, link only to `/pages/temple-alankaram-proof` until the article is published.

Future Varalakshmi status: needs owner/media input. Add a second proof card only after approved Varalakshmi photos/videos and permission wording exist.

### 2. Fit-Process Page

Edit: `sections/gc-deity-compatibility-guide.liquid`

Best placement:

- Inside the `when 'how-golden-collections-checks-deity-jewellery-fit'` branch, add a real-example section below the existing `.gc-compat__proof` strip or before the FAQ.
- This page is the strongest match for Hanuman proof because the article demonstrates crown height, face visibility, body ornament scale, hand/gada placement, and arch clearance.

Safe-to-publish-now snippet:

```text
Real fit example: Hanuman Jayanti alankaram
On May 12, 2026, Golden Collections deity jewellery was used for Hanuman Jayanti alankaram at Sri Vijaya Vinayaka Swamy Temple, Malkajgiri, coordinated with Ayyagaru Ram Sharma. The example shows why deity jewellery fit is checked through crown height, face visibility, body ornament scale, hand or gada placement, and arch clearance.
```

CTA copy:

```text
See the Hanuman temple alankaram proof story
```

Internal links:

- `/blogs/jewellery-guides/hanuman-jayanti-alankaram-sri-vijaya-vinayaka-swamy-temple-malkajgiri-2026`
- `/pages/temple-alankaram-proof`
- `/pages/how-to-measure-idol-for-deity-jewellery`
- `/pages/deity-crown-mukut-kireedam-size-guide`

Publish status: safe now as a text-only block if the article is live.

Future Varalakshmi status: needs owner/media input. Use the same section pattern later with a Varalakshmi proof block focused on setup type, face/crown fit, hastham/padam placement, haram drop, thomala shoulder fit, vaddanam fit, and altar space.

### 3. Measurement Guide

Edit: `sections/gc-idol-measurement-guide.liquid`

Best placement:

- Add a small "Measurement in a real alankaram example" card after the three quick summary cards or near the "Ask before ordering" step.
- Keep it text-led unless the owner wants to add images. This page should stay a practical measurement tool.

Safe-to-publish-now snippet:

```text
Real example to study
The Hanuman Jayanti temple alankaram proof story shows why front photos, side photos, head width, crown clearance, chest scale, hand position and arch space should be checked before choosing deity jewellery.
```

Internal links:

- `/blogs/jewellery-guides/hanuman-jayanti-alankaram-sri-vijaya-vinayaka-swamy-temple-malkajgiri-2026`
- `/pages/temple-alankaram-proof`

Publish status: safe now as text-only. Needs owner/media input only if adding temple images directly to this page.

Future Varalakshmi status: needs owner/media input. Best future copy should show "what to measure before Varalakshmi Vratham" using approved setup photos.

### 4. Deity Crown Guide

Edit: `sections/gc-deity-crown-guide.liquid`

Best placement:

- Add a compact proof note after the "How do I choose the right deity crown size?" answer or after the deity-fit notes.
- Keep the lesson crown-specific; do not make the Hanuman proof sound like a universal crown rule.

Safe-to-publish-now snippet:

```text
Real crown-fit lesson
In the Hanuman Jayanti alankaram proof story, crown height and face visibility are part of the final fit check. Use the example as a reminder to compare head width, crown height, backdrop clearance and deity posture before choosing a mukut or kireedam.
```

Internal links:

- `/blogs/jewellery-guides/hanuman-jayanti-alankaram-sri-vijaya-vinayaka-swamy-temple-malkajgiri-2026`
- `/pages/how-to-measure-idol-for-deity-jewellery`
- `/collections/deity-crowns-1`

Publish status: safe now as a text-only note.

Future Varalakshmi status: needs owner/media input. Add a Lakshmi/Varalakshmi crown-fit proof note only after approved Varalakshmi media confirms face width, crown placement, and final setup.

### 5. Knowledge Hub

Edit: `sections/gc-knowledge-hub.liquid`

Best placement:

- Add a proof path card in the "Authority paths" grid or "Fast answers" matrix.
- Add `/pages/temple-alankaram-proof` and the Hanuman article to the `hasPart` schema only after confirming the article is public.

Safe-to-publish-now snippet:

```text
Real alankaram proof stories
See real deity jewellery and alankaram examples shared with permission, including the Hanuman Jayanti alankaram at Sri Vijaya Vinayaka Swamy Temple, Malkajgiri.
```

Internal links:

- `/pages/temple-alankaram-proof`
- `/blogs/jewellery-guides/hanuman-jayanti-alankaram-sri-vijaya-vinayaka-swamy-temple-malkajgiri-2026`
- Existing hub links to Anil, measurement guide, crown guide, and fit process should remain.

Publish status: safe now if the article is public. If uncertain, link only to the proof hub.

Future Varalakshmi status: needs owner/media input. Once Varalakshmi proof exists, broaden copy from "temple" to "temple and festival alankaram proof stories" so home and private pooja examples are not mislabeled.

### 6. Proof Hub

Edit: `templates/page.temple-alankaram-proof.json` and, only if behavior changes are needed, `sections/gc-proof-stories-hub.liquid`

Current behavior:

- The hub pulls articles from `jewellery-guides` with tag `temple alankaram proof`.
- The current JSON subheading is already safe: "Real deity jewellery and alankaram examples shared with permission..."

Recommended near-term edit:

```text
Real deity jewellery and alankaram examples shared with permission, including temple and festival proof stories that show practical fit, measurement support, preparation and final alankaram outcomes.
```

Internal links:

- Keep `/pages/temple-alankaram-proof` as the hub URL.
- Make sure the Hanuman article carries the exact tag `temple alankaram proof`.

Publish status: safe now as a copy refinement. No media input needed if the hub continues pulling approved article images.

Future Varalakshmi status: if the future Varalakshmi proof is a home/festival setup rather than a temple setup, either tag it into this hub and rename visible copy to "Alankaram proof stories", or create a broader `/pages/alankaram-proof` later. Do not force a non-temple proof into "temple" wording without owner approval.

### 7. Homepage Proof Section

Edit: `templates/index.json` section `gc_proof_stories_hub`

Current section:

- Type: `gc-proof-stories-hub`
- Tag filter: `temple alankaram proof`
- Heading: "Temple alankaram proof stories"
- View-all link: `/pages/temple-alankaram-proof`

Recommended copy if keeping this as temple-only:

```text
Real temple alankaram proof
Temple alankaram proof stories
Real deity jewellery examples shared with permission, showing temple measurement support, fit planning and final alankaram outcomes.
```

Recommended copy if preparing for Varalakshmi proof:

```text
Real alankaram proof
Alankaram proof stories
Real deity jewellery examples shared with permission, showing measurement support, fit planning, festival preparation and final alankaram outcomes.
```

Internal links:

- `/pages/temple-alankaram-proof`
- Article cards are pulled automatically by tag.

Publish status: safe now. If the Hanuman article is already live and tagged, no structural change is required.

Future Varalakshmi status: needs owner/media input for the article itself. The homepage section can show it automatically if the Varalakshmi proof story is published in `jewellery-guides` with the same tag, but the heading should be broadened first if the proof is not from a temple.

### 8. Varalakshmi Authority Guide

Edit later: `sections/gc-authority-simple-guide.liquid`, inside the `when 'varalakshmi-alankaram-guide'` branch.

Best placement:

- Add a future proof callout after the "Quick answer" section and before the required-vs-optional table.
- This is not ready for Hanuman proof; keep Hanuman on general authority/process/crown pages.

Future safe wording template:

```text
Real Varalakshmi setup proof
This approved Varalakshmi alankaram example shows how Golden Collections checks setup type, face size, crown placement, haram drop, hastham and padam placement, thomala shoulder fit, vaddanam position and altar space before recommending items.
```

Internal links:

- Future Varalakshmi proof article URL.
- `/pages/varalakshmi-alankaram-guide`
- `/collections/varalakshmi-deity-jewellery`
- `/pages/how-to-measure-idol-for-deity-jewellery`
- `/pages/deity-crown-mukut-kireedam-size-guide`

Publish status: not safe now. Needs owner/media input and approved proof material.

### 9. Deity Authority Hub

Optional edit: `sections/gc-deity-authority-hub.liquid`

Best placement:

- Add a small proof guide card after the core guide grid, or add proof hub as a sixth guide card if the layout remains balanced.

Safe-to-publish-now snippet:

```text
Temple alankaram proof stories
Real deity jewellery examples shared with permission, useful for understanding fit, measurement and final alankaram context.
```

Internal links:

- `/pages/temple-alankaram-proof`
- `/pages/how-golden-collections-checks-deity-jewellery-fit`

Publish status: safe now if desired, but lower priority than Anil, fit-process, Knowledge Hub and homepage.

Future Varalakshmi status: update wording to "Temple and festival alankaram proof stories" after owner-approved Varalakshmi proof exists.

## Priority Order

1. Add text-only Hanuman proof card to the fit-process page.
2. Add text-only Hanuman proof card to the Anil Tunk page.
3. Add proof hub link/card to the Knowledge Hub.
4. Keep homepage proof section as-is if article tagging works; only broaden heading before adding non-temple Varalakshmi proof.
5. Add compact proof note to measurement guide and crown guide.
6. Add Varalakshmi proof only after owner-approved media, permission, and exact event/setup facts are available.

## Suggested Internal Link Map

| From | To | Anchor |
| --- | --- | --- |
| Anil Tunk page | `/pages/temple-alankaram-proof` | Real alankaram proof stories |
| Anil Tunk page | Hanuman article URL | Hanuman Jayanti temple alankaram proof |
| Fit-process page | Hanuman article URL | See the Hanuman temple alankaram proof story |
| Measurement guide | Hanuman article URL | Real alankaram measurement example |
| Crown guide | Hanuman article URL | Real crown-fit lesson |
| Knowledge Hub | `/pages/temple-alankaram-proof` | Real alankaram proof stories |
| Homepage proof section | `/pages/temple-alankaram-proof` | View all proof stories |
| Future Varalakshmi guide | Future Varalakshmi proof article URL | Real Varalakshmi setup proof |

## Owner / Media Inputs Needed Before Future Varalakshmi Proof

- Is the proof from a temple, home pooja, customer setup, or Golden Collections product setup?
- Exact date and occasion, if public.
- Whether the owner/customer/temple name may be shown.
- Which photos/videos are approved for website, WhatsApp, and social use.
- Whether the proof may be tagged into the current temple proof hub, or whether the visible hub wording should be broadened first.
- Any wording the owner wants avoided around ritual procedure, tradition, or endorsement.

## Do Not Change

- Do not add temple endorsement language.
- Do not imply Golden Collections guarantees perfect fit.
- Do not publish private deity, home pooja, customer, or temple media without permission.
- Do not edit live theme files until the owner approves the placement order and copy.
