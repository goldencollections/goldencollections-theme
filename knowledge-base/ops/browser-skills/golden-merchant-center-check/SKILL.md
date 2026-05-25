---
name: golden-merchant-center-check
description: Read-only Golden Collections Google Merchant Center browser playbook for checking product/feed diagnostics, disapprovals, stale item issues, account/payment warnings, and Shopify channel signals. Use when Merchant Center UI verification is needed.
---

# Golden Merchant Center Check

Use this playbook for read-only Merchant Center checks.

Prefer Merchant/API scripts when available. Use browser when the UI shows account-level, policy, payment, or diagnostic details not captured in scripts.

## Safety

- Do not delete products.
- Do not change shipping, tax, business info, feed, destination, payment, policy, account linking, or user settings.
- Do not appeal or request review without owner approval.
- Do not unpublish active Shopify products just to fix stale Merchant rows.

## Before Browser

Read:

- `knowledge-base/wiki/merchant-center-workflow.md`
- latest `knowledge-base/outputs/merchant-*.md`
- `knowledge-base/ops/open-loops.md`
- `knowledge-base/ops/knowledge-quality-rules.md`

## Diagnostic Workflow

1. Open Merchant Center.
2. Check account-level warnings first.
3. Check product diagnostics:
   - disapproved / limited / pending / not impacted
   - issue type
   - item count
   - examples
   - whether issue affects active products
4. Compare against latest known cleanup report before recommending action.
5. If a row references deleted/stale variants, verify in Shopify/API before recommending deletion.
6. If issue is payment/business eligibility, document exact blocker and where owner must fix it.

## What Matters Most

- active products blocked from Google surfaces
- missing image / landing page / price mismatch issues
- account or payment blockers
- destination/channel settings excluding valid products
- stale rows that confuse diagnostics but do not hurt active products

## Output

Report:

- Current blocker count
- Account-level warnings
- Product-level issues
- What changed since last report
- One recommended next action
- What not to touch

Keep recommendations conservative. Merchant cleanup can damage revenue if done broadly.
