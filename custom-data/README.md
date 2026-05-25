# Golden Collections Shopify Custom Data

This package defines custom data for deity product pages, collection pages, and future deity-first browsing.

## Install Order

1. Create metaobject definitions with `admin-api/create-metaobject-definition.graphql` and `metaobject-definitions.json`.
2. Create product and collection metafield definitions with `admin-api/create-product-metafield-definition.graphql` and `product-metafield-definitions.json`.
3. Seed reusable deity, ornament, size, and crown-size entries.
4. Write product values with `admin-api/set-product-deity-metafields.graphql`.
5. Read values with `admin-api/read-product-deity-data.graphql`.

## Installation Log

Installed on Shopify Admin API on 2026-05-04:

- 3 metaobject definitions created.
- 19 product metafield definitions created.
- 25 reusable metaobject entries upserted.
- Read-back verification succeeded for deity groups, ornament types, size profiles, and product metafield definitions.

Current model adds collection metafields, metaobject reference fields, and `deity_crown_size_standard`. These still need Admin API install/update after metaobject IDs are available.

## Required Admin API Scopes

- `read_products`
- `write_products`
- `read_metaobjects`
- `write_metaobjects`
- `read_metaobject_definitions`
- `write_metaobject_definitions`

## Reference Fields

Keep legacy text metafields for existing theme compatibility. Use reference fields for new data work:

- Products: `primary_deity_ref`, `compatible_deity_refs`, `ornament_type_ref`, `size_profile_ref`, `crown_size_standard_ref`.
- Collections: `primary_deity_ref`, `deity_group_refs`, `ornament_type_ref`, `ornament_type_refs`, `size_profile_ref`, `crown_size_standard_ref`.
- Collection links: `parent_deity_collection`, `related_collection_refs`.
- Current collection navigation: `display_title`, `parent_menu_handles`, `category_node_ref`, `subcollections`.

When creating reference definitions through GraphQL, add `metaobject_definition_id` validations after querying the live definition GIDs. Do not store placeholder GIDs in this JSON.

## Metaobject Governance

Every deity taxonomy metaobject should include:

- `slug`: stable lowercase ASCII identifier for duplicate checks and admin search.
- `status`: `active`, `draft`, or `deprecated`.
- `sort_priority`: optional integer for deity-first display order.

Seed and update jobs should query by slug before creating entries. Existing handles can stay stable, but slug fields make the taxonomy easier to validate and migrate.

## Crown Sizing Standard

For deity crowns, capture:

- Suggested idol height range.
- Suggested idol head or face width range.
- Crown inner width at the head contact point.
- Crown outer width for visual scale.
- Crown height, depth, inner circumference, or arc length where relevant.
- Crown style and fit caveats.

Use `size_confidence` values consistently:

- `Measured`
- `Measured from product image`
- `Owner confirmed`
- `Inferred`
- `Check product image`

## Compatibility Classes

Use these values consistently:

- `Deity Specific`
- `Multi-Deity`
- `General/Common`
- `Festival Specific`
