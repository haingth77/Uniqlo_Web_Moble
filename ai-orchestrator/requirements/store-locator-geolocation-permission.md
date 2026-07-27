# Requirement: Store Locator — Browser Geolocation Permission

## Context

On the Uniqlo storefront (e.g. `https://www.uniqlo.com/us/en/`), the footer contains a
**Store Locator** link. When a shopper clicks it, the frontend opens the Uniqlo Store
Locator in a **new browser tab** (`https://map.uniqlo.com/{region}/{language}/`).

On first visit to the Store Locator tab, the browser shows a **native geolocation
permission prompt** asking whether the site may access the user's location. The prompt
offers three actions: **Block**, **Just this time**, and **Allow** (browser UI may vary
slightly by browser/OS).

Reference: [UNIQLO Store Locator](https://map.uniqlo.com/us/en/)

## User flow

```
Storefront (us/en | uk/en | vn/en)
  → scroll to footer
  → click "Store Locator"
  → new tab opens: map.uniqlo.com/{region}/{language}/
  → browser geolocation permission prompt appears
  → user chooses Block | Just this time | Allow
```

## Functional requirements

### Footer — Store Locator link

1. On supported storefront locales (**us/en**, **uk/en**, **vn/en**), the page footer
   must display a **Store Locator** link.
2. The link must be reachable after scrolling to the **bottom of the page** (footer area).
3. Clicking **Store Locator** must open the Store Locator in a **new browser tab**
   (`target="_blank"` or equivalent), without navigating away from the current tab.

### Store Locator URL mapping

4. The new tab URL must follow the pattern:

   ```
   https://map.uniqlo.com/{region}/{language}/
   ```

5. `{region}` and `{language}` must match the shopper's current storefront locale:

   | Storefront locale | Store Locator URL               |
   | ----------------- | ------------------------------- |
   | us/en             | `https://map.uniqlo.com/us/en/` |
   | uk/en             | `https://map.uniqlo.com/uk/en/` |
   | vn/en             | `https://map.uniqlo.com/vn/en/` |

### Browser geolocation permission prompt

6. When the Store Locator tab loads, the application must request the browser's
   **Geolocation API** (triggering the native permission dialog).
7. The permission prompt must be shown by the **browser** (not a custom in-page modal).
8. The prompt must offer the user three choices (labels may vary by browser):

   | Action           | Typical browser label | Expected behavior (summary)                          |
   | ---------------- | --------------------- | ---------------------------------------------------- |
   | Deny permanently | **Block**             | Location access denied; site uses fallback behavior  |
   | Deny once        | **Just this time**    | Location denied for this session/request only        |
   | Grant            | **Allow**             | Location access granted; map can use user's position |

9. The permission prompt is scoped to **`map.uniqlo.com`** (origin shown in the dialog,
   e.g. _"map.uniqlo.com wants to — Know your location"_).
10. If the user has **already granted or blocked** location for `map.uniqlo.com`, the
    browser must **not** show the prompt again until site data / permissions are reset
    (standard browser behavior).

### Post-permission behavior (high level)

11. **Allow** — Store Locator may center the map or suggest nearby stores using the
    device's location (exact UI is owned by Store Locator; out of scope for storefront).
12. **Block** / **Just this time** — Store Locator must remain usable without crashing;
    map loads with a non-location fallback (e.g. default region or manual search).

## Acceptance criteria

### AC-1: Store Locator opens in new tab (us/en)

- **Given** the shopper is on `https://www.uniqlo.com/us/en/`
- **When** they scroll to the footer and click **Store Locator**
- **Then** a new tab opens with URL `https://map.uniqlo.com/us/en/`
- **And** the original storefront tab remains open on the same page

### AC-2: Locale URL mapping (uk/en, vn/en)

- **Given** the shopper is on `https://www.uniqlo.com/uk/en/` (or `.../vn/en/`)
- **When** they click **Store Locator** in the footer
- **Then** the new tab URL is `https://map.uniqlo.com/uk/en/` (or `.../vn/en/` respectively)

### AC-3: Geolocation permission prompt on first visit

- **Given** the shopper has no prior geolocation permission set for `map.uniqlo.com`
- **When** the Store Locator tab loads
- **Then** the browser displays a native geolocation permission dialog for
  `map.uniqlo.com`
- **And** the dialog includes options equivalent to **Block**, **Just this time**, and
  **Allow**

### AC-4: Allow — permission granted

- **Given** AC-3 and the permission dialog is visible
- **When** the shopper clicks **Allow**
- **Then** the dialog closes
- **And** Store Locator receives location access (map may show nearby stores or user
  position; no JS error on page)

### AC-5: Block — permission denied

- **Given** AC-3 and the permission dialog is visible
- **When** the shopper clicks **Block**
- **Then** the dialog closes
- **And** Store Locator still loads and remains usable without location access

### AC-6: Just this time — one-time deny

- **Given** AC-3 and the permission dialog is visible
- **When** the shopper clicks **Just this time**
- **Then** the dialog closes
- **And** location is not used for the current session/request
- **And** Store Locator still loads without error

### AC-7: No prompt when permission already decided

- **Given** the shopper previously chose **Allow** or **Block** for `map.uniqlo.com`
- **When** they open Store Locator again via the footer link
- **Then** the browser does **not** show the permission dialog again
- **And** behavior follows the stored permission (grant or deny)

## Test notes

- **E2E (Playwright):** Geolocation prompts are native browser UI and are **not**
  reliably automatable via DOM locators. Recommended approaches:
  - Pre-grant or pre-deny via `context.grantPermissions(['geolocation'], { origin })` /
    `clearPermissions()` before navigation; assert Store Locator load and map behavior.
  - Use `page.context().setGeolocation({ latitude, longitude })` when permission is
    granted to verify location-based behavior.
  - Assert **new tab** via `context.waitForEvent('page')` and URL `map.uniqlo.com/...`.
- **Footer link:** Prefer role/link text **Store Locator**; scroll into view before click.
- **Locales:** Parameterize tests for `us/en`, `uk/en`, `vn/en`.
- **Resilience:** Prompt copy and button order may differ between Chrome, Edge, and
  Firefox; do not assert exact prompt strings in automated tests.

## Out of scope

- Store Locator map UI, store search, and store detail pages after permission is resolved
- Custom in-app permission modals on the main storefront (`www.uniqlo.com`)
- Mobile app location permissions (native OS dialogs)
- Checkout, login, wishlist

## Notes

- Permission UI is controlled by the **browser/OS**, not Uniqlo FE; requirements describe
  observable behavior, not pixel-perfect dialog design.
- Store Locator runs on a **separate origin** (`map.uniqlo.com`) from the storefront
  (`www.uniqlo.com`); permissions are per-origin.

## Answer note:

1. **Unsupported locales: The requirement lists exactly 3 locales. It is unclear whether the Store Locator link must be absent on other locales (e.g. jp/en, au/en) or whether those locales are simply untested. A negative assertion ("link absent on locale X") cannot be written without product sign-off.**: only testing for 3 locales. other locales is out of scope
2. **"Just this time" re-prompt scope: The source says JTT denies for "this session/request only," implying the prompt reappears on next load. However, the exact definition of "session" (tab close? browser restart? new Playwright context?) is browser-controlled and not specified**: session means browser window, all tabs on 1 browser window are counted to be on same session, this session will end when browser window is closed
3. **Fallback UI for Block/JTT: doc says the Store Locator "must remain usable without crashing" and may use a "default region or manual search." The exact fallback UI (e.g. which default map center, whether a search box appears) is not specified**: just assert header, footer, map are displayed normally
4. **Geolocation trigger point: doc API is requested "when the Store Locator tab loads." If the map page lazy-loads or defers the geolocation request until an in-page interaction (e.g. a "Find stores near me" button), the timing requirement would fail. The source is ambiguous whether the trigger is truly automatic on load or conditional.**: Verified on map.uniqlo.com/us/en/ — getCurrentPosition() runs automatically ~2–3s after page open, not only on Use current location. The permission dialog therefore appears on first visit without extra user action. Wording “when tab loads” = first automatic geolocation request after Store Locator init, not synchronous load. Clicking Use current location triggers a second request. If Uniqlo changes to interaction-only, update FR-6 and AC-3.
5. **Cross-browser scope**: testing on chrome, webkit and firefox project
