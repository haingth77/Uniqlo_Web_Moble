# Requirement: Item List — Filter Options

## Context
On the Uniqlo storefront (https://www.uniqlo.com/us/en/), when a shopper opens a
product listing / category page, a **Filter Options** panel lets them narrow the
displayed products.

## Functional requirements
1. The product listing page must display a **"Filter Options"** control/label.
2. A shopper can open the filter panel and filter products by **Size**.
3. A shopper can filter products by **Color**.
4. When one or more filters are applied, only products matching ALL selected
   filters are shown, and an indication of the active filters is visible.
5. The shopper can **clear/reset** all filters to return to the full list.
6. If a filter combination yields no products, the page shows an explicit
   "no results" state rather than an empty page with no message.

## Notes
- This is a public site; tests should be resilient to A/B content changes and use
  role/text-based locators.
- Out of scope: checkout, login, wishlist, pricing accuracy.
