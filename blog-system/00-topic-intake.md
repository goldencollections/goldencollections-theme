# 00 Topic Intake

Use this step when the owner provides a content topic.

The goal is to turn a rough topic into a structured intake record for research and angle selection.

## Inputs

Accept:

- topic phrase
- optional target product or collection
- optional buyer type
- optional season or festival
- optional geography
- optional desired outcome

Example:

`Write a blog for Real Kemp Jewellery for Arangetram`

## Required Reads

Read first:

- `blog-system/knowledge-snapshot.md`
- `knowledge-base/wiki/search-entity-map.md`
- relevant wiki files based on topic

Use `knowledge-base/wiki/open-questions.md` to flag missing facts.

## Extraction Rules

Identify:

- ornament type or product family
- dance form, deity, festival, or use context
- buyer persona if stated
- likely buyer persona if not stated
- season relevance
- regional terms already present in the topic
- related regional terms from controlled wiki lists
- likely target page type: blog post, Shopify page, collection support page, or glossary page
- whether similar content already exists in `knowledge-snapshot.md`

## Duplication Check

Before continuing, compare the proposed topic against:

- `knowledge-snapshot.md` already-published content
- existing content roadmap topics
- prior outputs in `outputs/`

If duplication is likely, recommend one of:

- update existing content
- create a narrower support piece
- create a comparison
- create a seasonal version
- create a diaspora version

## Output Format

Save the intake record to `outputs/research/` only when the user wants a durable run.

Use this structure:

```yaml
topic:
date:
requested_by:
primary_product_family:
ornament_type:
dance_or_deity_context:
festival_or_season_context:
buyer_persona:
geography:
regional_terms_present:
regional_terms_to_consider:
likely_search_intent:
possible_page_type:
related_collections:
related_wiki_files:
duplication_risk:
owner_questions:
research_next_steps:
```

## Stop Conditions

Stop and ask for owner input if:

- the topic depends on an unconfirmed material, plating, ritual, or compatibility claim
- the target product or collection is unclear and cannot be inferred from the wiki
- the owner asks for a published claim that conflicts with the wiki

