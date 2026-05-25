# 07 Publish Shopify

Use this step only after the owner approves a Shopify package.

Never auto-publish live content. Create Shopify content as `draft`.

## Preconditions

Before using the Shopify Admin API, verify:

- Shopify-ready package exists in `outputs/shopify-ready/`
- `Owner approved: yes` is present
- content type is clear: blog post or page
- destination blog is clear for blog posts
- title, body HTML, handle, excerpt, tags, and metadata are complete
- EEAT review status is pass or owner-approved
- schema JSON-LD has final `mainEntityOfPage`, `datePublished`, and author/publisher values for the Shopify destination

If any precondition fails, stop.

## API Behavior

Use Shopify Admin API credentials from the approved local environment only.

Create:

- blog article when content type is blog post
- page when content type is page

Set:

- status: draft
- handle: approved handle
- title: approved title
- body_html: approved body HTML
- summary_html or excerpt where supported
- tags for blog posts
- SEO title and meta description through Shopify-supported fields or metafields depending on API version

Before posting the body HTML, update any schema JSON-LD in the package:

- set `mainEntityOfPage` to the final Shopify blog or page URL
- set `datePublished` to the intended publish date in `YYYY-MM-DD` format
- set `dateModified` to the draft creation date in `YYYY-MM-DD` format when the content is first created
- include Golden Collections as `publisher`
- include Anil Tunk as a `Person` author where the owner has approved that byline/author signal

Do not set published status unless the owner explicitly asks for live publishing in Shopify admin.

## Post-Creation Output

Return:

- Shopify draft admin URL
- Shopify ID
- handle
- content type
- created date
- any fields that could not be set through the API

## Snapshot Update

After successful draft creation, update `blog-system/knowledge-snapshot.md` under `Already-Published Content` with:

- title
- handle
- Shopify ID
- content type
- status: draft
- date created
- topic cluster
- primary angle

Use `draft` until the owner confirms it is live.

## Failure Handling

If the API fails:

- do not retry blindly
- keep the Shopify package unchanged
- log the error in the package file under `Publish Attempt Notes`
- tell the owner what needs fixing
