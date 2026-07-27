# Requirement: Item List — Sort Products

## Context

On the Uniqlo storefront (https://www.uniqlo.com/us/en/), when a shopper opens a
product listing / category page, a **Sort** control lets them reorder the displayed
products. Sort must work together with **Filter Options** (see `item-list-filter.md`):
sort always applies to the **current visible list** (after filters), not the full
catalog.

## Functional requirements

### Sort control

1. The product listing page must display a **Sort** control (dropdown or equivalent).
2. The currently selected sort option must be visible to the shopper.
3. The selected sort is reflected in the URL query parameter **`sort`**.

### Sort options

Only the following three sort options are supported. **Name sort is not in scope.**

| Label              | URL       | Behavior                                                |
| ------------------ | --------- | ------------------------------------------------------- |
| Price: Low to High | `?sort=2` | Sort by display price ascending                         |
| Price: High to Low | `?sort=3` | Sort by display price descending                        |
| Top rated          | `?sort=4` | Sort by product rating descending (highest rated first) |

4. A shopper can sort products by **price low to high** (`sort=2`).
5. A shopper can sort products by **price high to low** (`sort=3`).
6. A shopper can sort products by **Top rated** (`sort=4`).

### Sort rules

7. Price sort uses the **display price** on the listing card (`price.value`).
8. When two products have the same price, preserve a **stable order** (e.g. by `productId`).
9. Products with missing or invalid price appear **last** in both price sorts.
10. Top rated sort uses the product **rating** field (higher rating first) (e.g. by score: //div[@class='fr-ec-rating-average-product-tile fr-ec-rating-static__average-value'] = 5, 4.9, 4, ...).
11. When two products have the same rating, preserve a **stable order** (e.g. by `productId`).

### Sort + filter integration

12. Processing order: **apply filters first, then apply sort**, then render the grid.
13. When filters are active (e.g. Size = M), sort reorders **only the filtered products**.
14. Changing sort while filters are active does **not** clear filters.
15. Changing filters while a sort is active keeps the **current sort option** and
    re-sorts the new filtered list.
16. Clearing all filters returns the full list but **preserves the active sort** (URL
    still contains the current `sort` value).

### Edge cases

17. If a filter combination yields no products, show the existing **"no results"**
    state; sort has no effect and must not cause errors.
18. Changing sort must not duplicate products or cause layout errors.

## Acceptance criteria (examples)

| Scenario                                         | Expected result                                                      |
| ------------------------------------------------ | -------------------------------------------------------------------- |
| Select Price Low→High                            | URL contains `?sort=2`; products ordered by `price.value` ascending  |
| Select Price High→Low                            | URL contains `?sort=3`; products ordered by `price.value` descending |
| Select Top rated                                 | URL contains `?sort=4`; products ordered by rating descending        |
| Filter Size = M, then sort Price High→Low        | URL contains `sort=3`; only Size M products, highest price first     |
| Sort Top rated active, then filter Color = Black | URL contains `sort=4`; only Black products, still top rated first    |
| Clear filters while `sort=2` active              | Full list shown, URL still contains `sort=2`, still low→high         |

## Data reference

Product fields used for sort (from API contract):

```json
{
  "productId": "E000001-000",
  "name": "AIRism Cotton Oversized T-Shirt",
  "price": { "currency": "USD", "value": 19.9 },
  "rating": 4.5
}
```

URL examples (sort can combine with filter params):

```
?sort=2
?sort=3
?sort=4
?size=M&color=Black&sort=2
```

Valid `sort` values: **`2`**, **`3`**, **`4`** only.

## Notes

- Depends on: `item-list-filter.md` (filter must be applied before sort).
- This is a public site; tests should be resilient to A/B content changes and use
  role/text-based locators.
- Out of scope: sort by name (A→Z / Z→A), checkout, login, wishlist.
