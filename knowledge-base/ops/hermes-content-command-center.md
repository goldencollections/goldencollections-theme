# Hermes Content Command Center

Last updated: 2026-05-20

Purpose: give Hermes one simple operating system for deciding what Golden Collections should post, where it should go, and when to ask the owner for approval.

This is not an autoposting system. It is an approval queue and reminder system for proof-led, buyer-useful content.

## Core Decision

Hermes should not be a stealth browser autoposter.

Hermes should be a content chief-of-staff:

1. Watch the Golden Collections knowledge base, open loops, blog packages, product uploads, proof assets, and seasonal windows.
2. Identify the next best 1-3 post opportunities.
3. Package each opportunity for the right channels.
4. Ask the owner: "I think we should post this. Do I have approval?"
5. After approval, either:
   - provide manual posting copy and assets, or
   - use an approved official scheduler/API when available, or
   - use supervised browser assistance only when the owner can see/control the session.

## Why This Direction

Official platform rules and current Golden Collections access status point to a mixed publishing model:

- X: API is authenticated but blocked by zero credits for most reads. X developer guidance warns against scraping/browser automation and says official API should be used for automated X activity. Browser posting should therefore remain supervised, not routine automation.
- Google Business Profile: official posts support updates, offers, and events with text, images/videos, links, and scheduling. GBP API access remains pending, but manual/scheduled posts are valid.
- Meta/Facebook/Instagram: Meta Business Suite can schedule posts for Facebook/Instagram. Use it as the main non-API scheduler until API publishing is deliberately approved.
- Pinterest: API OAuth works, but public production Pin creation is blocked until Standard access is granted. Prepare Pins, do not assume publishing works.
- YouTube: upload workflow exists locally; use for product/proof videos when the video is meaningful.

## Postable Content Pillars

Use these pillars before inventing a post idea.

### 1. Proof Stories

Best for: X, GBP, Facebook, Instagram, LinkedIn, Pinterest, YouTube Shorts.

Examples:

- Hanuman Jayanti 2026 alankaram proof story.
- Varalakshmi examples shared with permission.
- Future Anil fit videos.
- Customer/temple alankaram only with explicit permission and approved name/location wording.

Rules:

- Use exact permission wording.
- Say "used for" or "shared with permission."
- Do not say official supplier, temple-approved, priest-approved, certified, or endorsed unless separately confirmed.

### 2. Fit Education

Best for: X threads/posts, Instagram carousel/Reel, YouTube Shorts, GBP update, WhatsApp share copy.

Examples:

- Measure idol height before choosing a crown.
- Check face visibility for mukut/kireedam.
- Short haram vs long haram placement.
- Vaddanam/waist belt placement.
- Hastham/padam sizing and pose limitations.

Rules:

- Use real measurements/proof images where available.
- Do not invent universal-fit claims.
- Link to fit-process, measurement guide, or relevant collection.

### 3. Seasonal Planning

Best for: GBP, Instagram/Facebook, Pinterest, X, WhatsApp.

Examples:

- Varalakshmi Vratham planning.
- Navratri/Golu setup planning.
- Hanuman Jayanti, Krishna Janmashtami, Ganesha Chaturthi, Diwali/Lakshmi Pooja.
- Arangetram season for dance jewellery.

Rules:

- Keep it buyer planning, not ritual instruction.
- Point to collections, examples, and fit help.

### 4. Product And Collection Updates

Best for: Instagram/Facebook, Pinterest, GBP, X.

Examples:

- New Bharatanatyam products.
- New deity crowns/harams when product data and images are complete.
- New black kemp or real kemp batches.
- New blog/guide connected to a money collection.

Rules:

- Do not post future/no-image products.
- Do not post weak products just because they are new.
- Product must have acceptable title, images, availability, price, and truthful description.

### 5. Authority Guides

Best for: X, LinkedIn, GBP, Pinterest.

Examples:

- Real kemp guide.
- Bharatanatyam complete set guide.
- Black kemp guide.
- Deity jewellery alankaram guide.
- Varalakshmi examples page.

Rules:

- Pull one practical lesson from the guide.
- Do not write generic "new blog live" copy.
- Link to the guide or relevant collection.

## Channel Roles

### X

Role: fast proof notes, buyer education, founder/brand voice, links to guides.

Current status:

- Official account: `@GCJewellery`.
- xurl OAuth works.
- X API reads are blocked by `CreditsDepleted`.
- Browser autoposting should not be routine.

Use X for:

- short proof posts
- concise fit tips
- guide launch notes
- replies only with owner approval

Do not use X for:

- trend-chasing
- automated replies from keyword searches
- repetitive product blasts
- browser automation without supervision

### Google Business Profile

Role: local trust, Search/Maps visibility, proof and guide updates.

Use GBP for:

- proof stories
- seasonal planning
- guide launches
- offers/events only when real

Use `Update` and `Learn more` for most Golden Collections posts.

### Instagram / Facebook

Role: visual proof, product videos, Reels, carousels, customer trust.

Use Meta Business Suite for scheduling when possible.

Best formats:

- 15-45 second Reels for proof/product videos
- carousel for fit steps
- image post for proof story
- story for quick seasonal reminder

### Pinterest

Role: evergreen discovery for visual product/category planning.

Use Pinterest for:

- Varalakshmi examples
- deity fit guides
- real kemp guide
- Bharatanatyam set components
- product/category images with strong destination links

Current blocker: Standard access pending for direct public Pin creation.

### YouTube

Role: durable video proof and product education.

Use YouTube for:

- Anil fit videos
- Hanuman/Varalakshmi proof clips
- product measurement explainers
- 30-60 second Shorts from real footage

### LinkedIn / Anil Profile

Role: entity trust, founder expertise, temple/dance/community credibility.

Use LinkedIn lightly:

- proof stories
- founder notes
- buyer education
- authority guide launches

## Hermes Daily Approval Brief

Recommended cadence: once daily, late morning IST, unless there is a time-sensitive festival/product launch.

Output shape:

1. Best post today: one sentence.
2. Why this matters: sales/trust/search/seasonal reason.
3. Channels: ranked list.
4. Exact draft copy: by channel.
5. Asset needed: image/video/link.
6. Owner approval question: "Approve this for [channel]?"
7. If not ready: one blocker and the smallest fix.

Hermes should usually propose only one main post per day. Maximum three.

## Approval States

- `idea`: worth considering, not drafted.
- `draft_ready`: exact copy and link ready.
- `asset_needed`: copy ready, but image/video missing.
- `owner_approved`: owner approved exact copy and channel.
- `scheduled_or_posted`: manually scheduled/posted or published through an approved tool.
- `blocked`: missing permission, missing asset, unavailable product, API access, or platform credit issue.

## Posting Priority Rules

Hermes should rank opportunities in this order:

1. Time-sensitive seasonal post with live collection/page.
2. Permissioned proof story with strong visual.
3. New Anil/product fit video.
4. Newly published authority guide tied to a collection.
5. High-value product/collection update with complete product data.
6. Evergreen fit education.

Skip posts that are generic, repetitive, unsupported, or not connected to a real buyer decision.

## Current Best Queue

1. Hanuman Jayanti proof story: ready for X/GBP/Meta/LinkedIn/Pinterest repurpose; permission confirmed.
2. Varalakshmi examples page: ready for seasonal planning posts; permission confirmed for discussed videos.
3. Anil fit proof video: highest-value future asset; blocked until footage exists.
4. Bharatanatyam authority sprint: prepare guide/product-decision posts after the next category cleanup.
5. Real kemp guide: already strong; use as periodic evergreen, not daily repetition.

## Do Not Automate Yet

- Public X browser posting from the VPS.
- Customer WhatsApp sends.
- Review request sends.
- GBP API posting until API access is granted.
- Pinterest public Pin creation until Standard access is granted.
- Meta campaign/boost/ad creation.
- Any post using customer/temple/person details without permission.

## Source Notes

Internal:

- `knowledge-base/ops/open-loops.md`
- `knowledge-base/ops/owner-brief.md`
- `knowledge-base/ops/hermes-agent-guardrails.md`
- `knowledge-base/ops/hermes-x-access.md`
- `knowledge-base/wiki/content-roadmap.md`
- `knowledge-base/wiki/retrieval-ready-seo-strategy.md`
- `knowledge-base/raw/temple-hanuman-jayanti-alankaram-permission-2026-05-16.md`
- `blog-system/outputs/repurpose/2026-05-16-hanuman-jayanti-alankaram-sri-vijaya-vinayaka-swamy-temple-repurpose.md`

External references:

- X automation rules: `https://help.x.com/articles/20174732`
- X developer guidelines: `https://docs.x.com/developer-guidelines`
- Google Business Profile posts: `https://support.google.com/business/answer/7342169`
- Meta/Facebook scheduling help: `https://www.facebook.com/help/389849807718635`
