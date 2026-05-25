# 06 Shopify Package

Use this step after the draft passes EEAT review.

The goal is to create a Shopify-ready review file that the owner can approve quickly.

## Output Location

Save packages in:

`blog-system/outputs/shopify-ready/`

Use the same handle as the research, brief, and draft.

## Package Structure

```markdown
# Shopify Package: [Title]

Owner approval required before publish: yes
Owner approved: no
Content status: ready for owner review

## Destination

Content type: blog post | page
Shopify blog destination:
Suggested handle:

## Titles And Metadata

Blog or page title:
SEO title:
Meta description:
Excerpt:
Tags:

## Body HTML

[Shopify-compatible HTML]

## FAQ Block

[Visible FAQ HTML]

## Schema JSON-LD

[Only include schema that matches visible page content]

## Internal Links

## Image Requirements

| Filename | Placement | Alt text | Notes |
| --- | --- | --- | --- |

For every image, specify:

- source file or Shopify product/file URL
- SEO filename using lowercase words and hyphens
- descriptive alt text that names the product/use case without keyword stuffing
- image role: hero, product proof, component detail, fit guide, checklist, or social crop
- watermark status
- image type: real product photography, AI-assisted product-derived image, or decorative AI-assisted image

Default filename pattern:

`gc-[product-family]-[use-case]-[sku-or-topic]-[year].jpg`

Examples:

- `gc-real-kemp-arangetram-set-bks001-2026.jpg`
- `gc-real-kemp-long-haram-arangetram-bks001.jpg`
- `gc-deity-crown-size-guide-2026.jpg`

Prefer real product photography or product-derived editorial images for ecommerce trust. Do not use decorative AI images as product proof.

## Repurpose Notes

## Owner Review Checklist

- [ ] Facts approved
- [ ] Product links approved
- [ ] Images approved
- [ ] Metadata approved
- [ ] Ready to create Shopify draft
```

## Body HTML Rules

- Use clean Shopify-compatible HTML.
- Use `<h2>` and `<h3>` for sections below the page title.
- Use paragraphs, lists, and tables only where they help the buyer.
- Do not include inline styles unless required.
- Keep FAQ visible in the body if FAQ schema is included.

## Default Blog Destination

For these evergreen guide formats, default to the Shopify blog `Golden Collections Jewellery Guides` with handle `jewellery-guides`:

- buying guide
- size guide
- comparison
- checklist
- glossary

Use another destination only when the owner explicitly approves it for that package.

## Schema Rules

Recommended schema may include:

- `BlogPosting`
- `Article`
- `FAQPage`
- `CollectionPage`
- `ItemList`
- `Product` only when the visible page clearly supports it and product facts are verified

Do not add schema claims that are not visible on the page.

## Approval Rule

The package must keep:

`Owner approved: no`

until the owner explicitly approves it.
