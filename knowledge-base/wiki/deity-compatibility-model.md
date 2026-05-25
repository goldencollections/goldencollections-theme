# Deity Jewellery Compatibility Model

Backlinks: [[business-entity.md]], [[search-entity-map.md]], [[content-roadmap.md]]

## Purpose

Map deity jewellery by:

1. Deity or deity group.
2. Idol size and measured ornament dimensions.
3. Ornament or accessory type.

Some items are deity-specific, some fit multiple deities, and some are broad-use alankaram accessories.

## Compatibility Classes

- `deity_specific`: strongly associated with one deity/group.
- `multi_deity`: works for a defined set of deities.
- `general_common`: internal data class for broad-use deity accessories when size and placement fit. Do not rely on `Common` alone as customer-facing wording.
- `festival_specific`: tied to a festival or ritual season, such as Varalakshmi Vratham.

## Size Rules

Every deity jewellery product should eventually expose:

- Product measurement: height, width, depth/arc where relevant.
- Idol fit note: suggested idol height range.
- Placement: head, forehead, ears, chest, neck, waist, hands, feet, back/arch, peedam/base.
- Measurement confidence: measured, measured from product image, owner confirmed, inferred, or check product image.
- Fit caveat: idol posture, face width, crown style, and draping can affect fit.

## Crown Sizing Standard

Crowns need a stricter standard than generic ornaments. Owner confirmed on 2026-05-24 that deity products are the most size-conscious product group and crowns are the most complicated deity fit category.

Capture:

- `crown_style`: open back, full round, flat back, hair crown, tall mukut, or other.
- Idol height range.
- Idol head or face width range.
- Crown inner width at the head contact point.
- Crown outer width for visual scale.
- Crown height.
- Crown depth for front-to-back fit.
- Inner circumference for full-round crowns.
- Arc length for curved or open-back crowns.
- Fit caveats for hairstyle, trunk direction, posture, face width, and crown angle.

Use `deity_crown_size_standard` metaobjects for reusable standards and product crown fields for measured product facts.

## Deity Groups

### Varalakshmi / Lakshmi / Amman

Priority: first.

Families: Varalakshmi idol/doll, face, hastham/padam, crown, hair crown, short necklace, long haram, vaddanam, earrings, nose ring, pendants, vagamalai/thomala, arch, banana tree, lotus asana, coconut stand, kalasam decor.

Notes: Varalakshmi products are often festival-specific for May-August demand. Lakshmi/Amman ornaments may overlap with Durga/Devi/Parvati by design and size. Hands/legs and faces are not universal.

### Vishnu / Balaji / Venkateswara / Perumal

Families: Namam/thiruman, shanku chakra, crown, short and long haram, pendants, vaddanam, sun and moon ornaments.

Notes: Namam/thiruman and shanku chakra are Vishnu-family specific. Include aliases Srinivasa, Tirupati Balaji, Venkatachalapati, and Perumal where relevant.

### Krishna / Radha Krishna

Families: crown, peacock/feather crown, haram, waist belt, earrings, flute accessory, paired Radha-Krishna alankaram.

Notes: Krishna can overlap with Vishnu-family jewellery, but Krishna motifs should be explicit.

### Ganesha / Ganapati / Vinayaka

Families: crown, haram, earrings, pendant, waist belt where idol shape allows, tilak/bindi.

Notes: Fit can be affected by trunk direction, head width, and seated posture.

### Shiva / Mahadev / Shankara

Families: tripund/vibhuti/thiruneer, crown or hair accessory, rudraksha-style necklace, trishul, naga motifs.

Notes: Tripund/vibhuti marks are Shiva-specific. Shiva linga products need separate handling.

### Durga / Devi / Amman / Parvati

Families: crown, nose ring, earrings, short and long harams, vaddanam, weapons, arch/prabhavali.

Notes: Amman, Durga, Parvati, Lakshmi, and Devi terms can overlap, but weapons and fit should remain explicit.

### Murugan / Subramanya / Kartikeya / Skanda

Families: crown, vel accessory, haram, waist belt, earrings.

Notes: Use aliases Murugan, Subramanya, Kartikeya, Skanda, and Shanmukha.

### Ayyappa / Ayyappan / Dharma Shastha

Families: crown, haram, waist belt, tilak, general alankaram accessories by size.

Notes: Ayyappa fit is posture-sensitive because many idols are seated in yogic posture.

### Hanuman / Anjaneya

Families: crown, haram, mace/gada accessory, waist belt, tilak.

Notes: Support aliases Anjaneya, Maruti, and Bajrangbali.

## Broad-Use Accessories

Broad-use accessories may work across many deities if dimensions fit: generic crown, short necklace, long haram, earrings, vaddanam, pendant, arch/prabhavali, peedam/base, lotus asana, flower garlands, and thomala.

Do not treat these as universal when symbols are deity-specific.

Customer-facing copy should explain actual fit instead of saying only `Common`. Better wording should be tested by product family, such as `works for many deity idols when size and placement match`, `for Lakshmi, Amman and Durga idols`, or `broad deity fit accessory`. Internal `general_common` can still be used for filtering and collection logic.

Owner can provide product-level deity compatibility data for deity-specific, multi-deity, and broad-use products. Example: Gada is specifically for Hanuman; a short necklace may work for many deities when size and placement fit.

### Deity Earrings / Jhumki Note

2026-05-19 UCP sprint: active deity earring winners are Karna Pathakam / deity earrings, not confirmed deity jhumki. The strict `jhumki for god idol` prompt remains a catalog-truth blocker because current deity jhumki candidates `DGE201` and `DGE202` are draft and zero-inventory, while active jhumki products are Bharatanatyam/Kemp human dance earrings. Do not rename Karna Pathakam products as jhumki unless Anil confirms the specific SKU style.

## Deity-First Shopping Structure

Golden Collections should support deity-based collections so customers can browse by deity first, then ornament type.

Example:

- Amman Jewellery
- Amman Crown / Mukut
- Amman Necklace / Haram
- Amman Earrings
- Amman Vaddanam / Waist Belt
- Amman Nose Ring
- Amman Hands and Legs
- Amman Accessories

Use collection metafields to mark deity landing pages and deity-ornament pages. Use product reference metafields to include products that are deity-specific, multi-deity, or general/common when size and placement fit.

## Template Strategy

Owner-confirmed decision: do not mix current ornament/category collections with a global "shop this deity by ornament" strip.

Current deity collections should keep one clean deity collection template and rely on existing category nodes/subcollection circles.

Future deity-first pages can use a separate template driven by:

- Collection deity references.
- Collection ornament references.
- Product deity references, including deity-specific, defined multi-deity, and broad-use products.
- Product ornament references.
- Compatibility class.
- Size and crown fit fields.

End goal: faster shopping, clearer fit guidance, fewer WhatsApp sizing queries, and cleaner Google/answer-engine understanding.

## Deity-Specific Or Semi-Specific Accessories

- Namam/thiruman: Vishnu, Balaji, Venkateswara, Perumal.
- Shanku chakra: Vishnu, Balaji, Venkateswara, Perumal.
- Tripund/vibhuti/thiruneer: Shiva.
- Trishul: Shiva, Durga, Amman, Parvati forms where appropriate.
- Vel: Murugan/Subramanya.
- Mustache: deity/form-specific.
- Hastham/padam: Varalakshmi/Lakshmi/Amman doll/idol context.

## Owner Decisions - 2026-05-04

- Use all relevant regional names.
- Treat unknown broad-use deity products as `General/Common`.
- Treat negative-inventory active products like zero-stock SEO/GEO assets.
- Design Shopify metafields/metaobjects directly instead of using a CSV-only model.
- Remove certificate language and emphasize Golden Collections quality checks.
