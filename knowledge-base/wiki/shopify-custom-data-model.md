# Shopify Custom Data Model

Backlinks: [[deity-compatibility-model.md]], [[content-roadmap.md]], [[business-entity.md]], [[collection-optimization-playbook.md]]

## Purpose

Use Shopify custom data to make Golden Collections product pages, collection pages, filters, and GEO answers consistent.

Separate:

- Product facts: product metafields.
- Collection facts: collection metafields.
- Reusable entities: metaobjects referenced by products and collections.

## Metaobjects

### Deity Group

Core fields: `name`, `slug`, `status`, `aliases`, `regional_names`, `parent_group`, `specific_symbols`, `seo_intro`, `collection_intro`, `compatibility_notes`.

Navigation fields: `parent_group_ref`, `default_ornament_types`, `shop_by_deity_collection`, `featured_collections`, `sort_priority`.

Examples: Varalakshmi/Lakshmi/Amman, Balaji/Vishnu/Perumal, Krishna/Radha Krishna, Ganesha, Shiva, Durga/Devi/Amman/Parvati, Murugan, Ayyappa, Hanuman.

### Ornament Type

Core fields: `name`, `slug`, `status`, `aliases`, `placement`, `fit_measurement_needed`, `seo_definition`, `fit_notes`.

Navigation fields: `sizing_standard`, `deity_first_label`, `collection_handle_suffix`, `sort_priority`.

Examples: Crown/Mukut/Kireedam, Short Necklace, Long Haram, Vaddanam, Earrings, Nose Ring, Hands/Legs, Tilak/Namam, Shanku Chakra, Pooja Decor/Banana Tree Decor.

### Size Profile

Fields: `label`, `slug`, `status`, `idol_height_min_in`, `idol_height_max_in`, `idol_width_min_in`, `idol_width_max_in`, `fit_notes`, `confidence`, `sort_priority`.

Use this for reusable idol-size bands.

### Deity Crown Size Standard

Fields: `label`, `slug`, `status`, `deity_groups`, `ornament_type`, idol height range, head width range, crown inner width range, crown height range, crown depth range, crown arc length range, `crown_style`, `measuring_points`, `fit_caveats`, `confidence`, `sort_priority`.

Use this when crown fit needs more precision than generic ornament dimensions.

## Product Metafields

Keep text fields for current theme compatibility:

- `primary_deity`
- `compatible_deities`
- `compatibility_class`
- `ornament_type`
- `idol_height_min_in`
- `idol_height_max_in`
- `ornament_height_in`
- `ornament_width_in`
- `ornament_depth_in`
- `placement`
- `regional_names`
- `not_for_deities`
- `size_confidence`
- `fit_notes`
- `quality_checks`
- `set_items_included`
- `optional_items`
- `component_count`
- `range_type`

Use reference fields for canonical model work:

- `primary_deity_ref`
- `compatible_deity_refs`
- `not_for_deity_refs`
- `ornament_type_ref`
- `size_profile_ref`
- `crown_size_standard_ref`

Crown-specific product fields:

- `idol_head_width_min_in`
- `idol_head_width_max_in`
- `crown_style`
- `crown_inner_width_in`
- `crown_outer_width_in`
- `crown_inner_circumference_in`
- `crown_arc_length_in`

## Collection Metafields

Use collection metafields to support deity-first browsing without changing existing Liquid templates yet:

- `primary_deity_ref`
- `deity_group_refs`
- `ornament_type_ref`
- `ornament_type_refs`
- `size_profile_ref`
- `crown_size_standard_ref`
- `collection_role`
- `deity_first_enabled`
- `shopping_path_label`
- `display_title`
- `parent_menu_handles`
- `category_node_ref`
- `collection_intro`
- `size_fit_intro`
- `faq_family`
- `regional_keyword_cluster`
- `subcollections`
- `parent_deity_collection`
- `related_collection_refs`
- `sort_priority`

Collection roles: `shop_by_deity_root`, `deity_landing`, `deity_ornament`, `ornament_first`, `festival`, `accessory`, `pooja_decor`.

Use `Pooja Decor` as `range_type` for ritual decor such as banana trees, banana bunches, coconut tree decor, kalasam decor, altar decor, doorway decor and mandapam setup pieces. Do not force these products into jewellery when a pooja-decor taxonomy is more accurate.

## Deity-First Navigation

Future path:

- Shop by Deity
- Amman
- Amman Crowns
- Amman Necklaces
- Amman Earrings
- Amman Vaddanam
- Amman Accessories

Products can appear in both ornament-first collections, such as all deity crowns, and deity-first collections, such as Amman crowns. Use deity references, ornament references, compatibility class, and fit fields to decide inclusion.

## Public Labels

Use customer-friendly labels:

- `Made for`
- `Also suitable for`
- `Idol size guide`
- `Measured ornament size`
- `Set includes`
- `Quality checked for`

Avoid certificate language. Talk about quality checks instead.
