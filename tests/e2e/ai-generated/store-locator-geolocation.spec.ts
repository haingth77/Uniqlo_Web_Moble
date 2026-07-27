import { test, expect } from '@fixtures/fixture';
import type { TestInfo } from '@playwright/test';
import {
  StoreLocatorPage,
  MapStorePage,
  StorefrontUrl,
  MapUrl,
  MAP_ORIGIN,
  MAP_PAGE_TITLE,
} from '@pages/store.locator.page';

/**
 * E2E suite — Store Locator footer link → new-tab navigation → map.uniqlo.com
 * browser geolocation permission. Implements 03-manual-testcases.md TC-01..TC-17
 * using the live-verified locators from 02-ui-exploration.md.
 *
 * Carried-over constraints (see exploration report + live re-verification):
 *  - map.uniqlo.com is an SPA that never reaches `networkidle` → navigate with
 *    `domcontentloaded` (handled inside MapStorePage.goto).
 *  - uk/en footer link uses target="_self" (Bug D-1) → TC-05 documents the
 *    observed buggy same-tab behaviour.
 *  - Native browser permission dialogs are NOT part of the DOM → TC-09 is
 *    manual-only; "no dialog" assertions in TC-13/14/15 are verified implicitly
 *    via navigator.permissions.query (Playwright resolves silently).
 *
 * Environment specifics discovered live (this repo's playwright.config.ts grants
 * geolocation GLOBALLY):
 *  - Default context/page (and browser.newContext()) start `granted`. Block /
 *    JTT scenarios call `context.clearPermissions()` → state `prompt`. Playwright
 *    never yields a true `denied`, and in `prompt` it leaves getCurrentPosition
 *    pending (no real error). The hard-denied error path (TC-17) is therefore
 *    driven with an injected denial spy.
 *  - The map page renders a generic NON-geo `[role="dialog"]` (cookie/region),
 *    so TC-08 asserts the geolocation-specific selectors only.
 *
 * Mock coordinates used for the Allow path: New York (40.7128, -74.0060).
 */

const NEW_YORK = { latitude: 40.7128, longitude: -74.006 };

/**
 * Pre-existing JS noise the live Uniqlo/React build emits independently of the
 * geolocation feature (React hydration mismatches, third-party analytics, and
 * the generic cross-origin "Script error." placeholder). These are annotated
 * and excluded from the "no uncaught JS error" sub-assertions so the suite does
 * not fail on unrelated site noise — the geolocation-specific assertions
 * (success/error callbacks) stay strict.
 */
const BASELINE_ERROR_NOISE: RegExp[] = [
  /Minified React error #\d+/i,
  /klaviyo is not defined/i,
  /^Script error\.?$/i,
  /ResizeObserver loop/i,
];

function significantErrors(errors: string[], testInfo: TestInfo): string[] {
  const noise = errors.filter((e) => BASELINE_ERROR_NOISE.some((r) => r.test(e)));
  if (noise.length > 0) {
    testInfo.annotations.push({
      type: 'baseline-js-noise',
      description: `${noise.length} pre-existing site error(s) ignored: ${[
        ...new Set(noise),
      ].join(' | ')}`,
    });
  }
  return errors.filter((e) => !BASELINE_ERROR_NOISE.some((r) => r.test(e)));
}

test.describe('Store Locator & Geolocation Permission', () => {
  test.beforeEach(({}, testInfo) => {
    // Live third-party sites (storefront + map SPA) load slowly.
    testInfo.setTimeout(120_000);
  });

  // ── Footer link visibility ─────────────────────────────────────────
  test('[TC-01] [us/en] "Store Locator" link is visible in the footer', async ({
    appPage,
  }) => {
    const store = new StoreLocatorPage(appPage); // appPage is already at us/en
    await store.scrollToFooter();

    await expect(store.storeLocatorLink).toBeVisible();
    await expect(store.storeLocatorLink).toHaveAttribute('href', MapUrl.US);
    await expect(store.storeLocatorLink).toHaveAttribute('target', '_blank');
  });

  test('[TC-02] [uk/en] "Store Locator" link is visible in the footer', async ({
    page,
  }) => {
    const store = new StoreLocatorPage(page);
    await store.gotoStorefront(StorefrontUrl.UK);
    await store.scrollToFooter();

    await expect(store.storeLocatorLink).toBeVisible();
    // Known discrepancy: href has NO trailing slash and target="_self" (Bug D-1).
    await expect(store.storeLocatorLink).toHaveAttribute(
      'href',
      'https://map.uniqlo.com/uk/en',
    );
    await expect(store.storeLocatorLink).toHaveAttribute('target', '_self');
  });

  test('[TC-03] [vn/en] "Store Locator" link is visible in the footer', async ({
    page,
  }) => {
    const store = new StoreLocatorPage(page);
    await store.gotoStorefront(StorefrontUrl.VN);
    await store.scrollToFooter();

    await expect(store.storeLocatorLink).toBeVisible();
    await expect(store.storeLocatorLink).toHaveAttribute('href', MapUrl.VN);
    await expect(store.storeLocatorLink).toHaveAttribute('target', '_blank');
  });

  // ── Click → navigation behaviour ───────────────────────────────────
  test('[TC-04] [us/en] Clicking "Store Locator" opens a new tab; original tab preserved', async ({
    appPage,
  }) => {
    const store = new StoreLocatorPage(appPage);
    const context = appPage.context();

    await store.scrollToFooter();
    const originalUrl = appPage.url();
    expect(context.pages().length).toBe(1);

    const newPage = await store.clickAndWaitForNewTab();

    // A second tab was created.
    expect(context.pages().length).toBe(2);
    await expect(newPage).toHaveURL(MapUrl.US);
    // Title settles from "UNIQLO Store Locator" to the full title shortly after load.
    await expect(newPage).toHaveTitle(MAP_PAGE_TITLE, { timeout: 20_000 });

    // Original tab is untouched.
    expect(appPage.url()).toBe(originalUrl);
    expect(appPage.url()).toContain('uniqlo.com/us/en');

    await newPage.close();
  });

  test('[TC-05] [uk/en] Clicking "Store Locator" navigates the SAME tab — Bug D-1 verification', async ({
    page,
  }) => {
    const store = new StoreLocatorPage(page);
    const context = page.context();

    await store.gotoStorefront(StorefrontUrl.UK);
    await store.scrollToFooter();
    expect(context.pages().length).toBe(1);

    // target="_self" → same-tab navigation (documented buggy behaviour).
    await Promise.all([
      page.waitForURL(/map\.uniqlo\.com\/uk\/en/, {
        timeout: 30000,
        waitUntil: 'domcontentloaded',
      }),
      store.clickStoreLocator(),
    ]);

    // No new tab was opened.
    expect(context.pages().length).toBe(1);
    // Browser auto-appends the trailing slash.
    await expect(page).toHaveURL(MapUrl.UK);
    // The storefront is no longer accessible in any open tab.
    const urls = context.pages().map((p) => p.url());
    expect(urls).not.toContain(StorefrontUrl.UK);
  });

  test('[TC-06] [vn/en] Clicking "Store Locator" opens a new tab; original tab preserved', async ({
    page,
  }) => {
    const store = new StoreLocatorPage(page);
    const context = page.context();

    await store.gotoStorefront(StorefrontUrl.VN);
    await store.scrollToFooter();
    const originalUrl = page.url();
    expect(context.pages().length).toBe(1);

    const newPage = await store.clickAndWaitForNewTab();

    expect(context.pages().length).toBe(2);
    await expect(newPage).toHaveURL(MapUrl.VN);
    expect(page.url()).toBe(originalUrl);
    expect(page.url()).toContain('uniqlo.com/vn/en');

    await newPage.close();
  });

  // ── Geolocation auto-trigger / DOM ─────────────────────────────────
  test('[TC-07] Geolocation API auto-triggers within ~5 s of load (no user interaction)', async ({
    page,
  }, testInfo) => {
    const map = new MapStorePage(page);
    await map.installGeoSpy(); // before navigation
    await map.goto(MapUrl.US);

    const called = await map.waitForGeoCall(6000);
    expect(called, 'getCurrentPosition should fire within 6 s').toBe(true);
    expect(await map.wasGeoCalled()).toBe(true);

    const elapsed = await map.getGeoCallPerfMs();
    expect(elapsed).not.toBeNull();
    expect(elapsed!).toBeGreaterThan(0);
    expect(elapsed!, 'geo call should fire within the 6 s budget').toBeLessThanOrEqual(
      6000,
    );
    testInfo.annotations.push({
      type: 'observation',
      description: `getCurrentPosition fired ${Math.round(
        elapsed!,
      )} ms after navigation start (expected ~2-5 s, no interaction performed).`,
    });
  });

  test('[TC-08] No custom in-page geolocation modal is present in the DOM', async ({
    page,
  }, testInfo) => {
    const map = new MapStorePage(page);
    await map.goto(MapUrl.US);
    await map.waitForInit(5000);

    // Geolocation-specific overlays must be entirely absent.
    await expect(map.permissionModal).toHaveCount(0);
    await expect(map.geoPrompt).toHaveCount(0);
    await expect(map.permissionClass).toHaveCount(0);
    await expect(map.geolocationClass).toHaveCount(0);
    await expect(map.locationPromptClass).toHaveCount(0);
    // No [role="dialog"] is a geolocation permission prompt.
    await expect(map.geoDialog).toHaveCount(0);

    testInfo.annotations.push({
      type: 'discrepancy',
      description:
        'The page renders a generic NON-geolocation [role="dialog"] (cookie/region settings). AC-13 is about the absence of a custom GEOLOCATION modal, which is confirmed: all geo-specific selectors and geo-text dialogs are absent.',
    });
  });

  test('[TC-09] [MANUAL] Native browser dialog shows map.uniqlo.com origin + three choices', async () => {
    test.skip(
      true,
      'Native browser geolocation dialog is NOT part of the page DOM; Playwright cannot inspect/click it. Manual-only per AC-14 and exploration Out-of-UI-Scope.',
    );
  });

  // ── Permission outcomes ────────────────────────────────────────────
  test('[TC-10] Allow — getCurrentPosition resolves with the position; no uncaught JS errors', async ({
    page,
    context,
  }, testInfo) => {
    await context.grantPermissions(['geolocation'], { origin: MAP_ORIGIN });
    await context.setGeolocation(NEW_YORK);

    const map = new MapStorePage(page);
    await map.installGeoResultSpy();
    await map.goto(MapUrl.US);

    expect(await map.waitForGeoSuccess(6000)).toBe(true);
    expect(await map.getGeoSuccess()).toBe(true);

    const pos = await map.getGeoPosition();
    expect(pos).not.toBeNull();
    expect(pos!.coords.latitude).toBeCloseTo(NEW_YORK.latitude, 4);
    expect(pos!.coords.longitude).toBeCloseTo(NEW_YORK.longitude, 4);

    expect(await map.getGeoError()).toBeNull();

    const significant = significantErrors(await map.getJsErrors(), testInfo);
    expect(significant, significant.join('\n')).toHaveLength(0);
  });

  test('[TC-11] Block — fallback UI loads completely without crashing', async ({
    page,
    context,
  }) => {
    await context.clearPermissions(); // simulate Block (config grants by default)

    const map = new MapStorePage(page);
    await map.goto(MapUrl.US);
    await map.waitForInit(5000);

    await expect(map.header).toBeVisible();
    await expect(map.footer).toBeVisible();
    await expect(map.footer).toContainText('Copyright');
    await expect(map.footer).toContainText('All rights reserved');
    await expect(map.mapContainer).toBeVisible();

    // Not blank / crashed.
    await expect(map.noscriptFallback).toBeHidden();
    await expect(map.somethingWentWrong).toHaveCount(0);
    await expect(page).toHaveTitle(MAP_PAGE_TITLE);
  });

  test('[TC-12] Just This Time — fallback UI loads; map uses default view, not user coords', async ({
    page,
    context,
  }, testInfo) => {
    // Coordinates set while still granted, then permission cleared → coords must
    // NOT be applied because permission is no longer granted.
    await context.setGeolocation(NEW_YORK);
    await context.clearPermissions();

    const map = new MapStorePage(page);
    await map.goto(MapUrl.US);
    await map.waitForInit(5000);

    await expect(map.header).toBeVisible();
    await expect(map.footer).toBeVisible();
    await expect(map.mapContainer).toBeVisible();
    await expect(map.somethingWentWrong).toHaveCount(0);

    const state = await map.permissionState();
    expect(['prompt', 'denied']).toContain(state); // NOT granted

    testInfo.annotations.push({
      type: 'manual-visual',
      description:
        'Map centering (default region view, NOT the mock NY coords) requires a visual/manual check — not reliably DOM-observable. Automatable part: permission state is not "granted", so the user location is not applied.',
    });
  });

  // ── Persistence (Test Persistence ACs) ─────────────────────────────
  test('[TC-13] Stored Allow — no re-prompt on second visit; granted state persists', async ({
    page,
    context,
  }, testInfo) => {
    await context.grantPermissions(['geolocation'], { origin: MAP_ORIGIN });
    await context.setGeolocation(NEW_YORK);

    const map = new MapStorePage(page);
    await map.installGeoResultSpy();

    // Visit 1
    await map.goto(MapUrl.US);
    await map.waitForInit(5000);
    await expect(map.header).toBeVisible();
    await expect(map.footer).toBeVisible();
    await expect(map.mapContainer).toBeVisible();
    const state1 = await map.permissionState();
    expect(state1).toBe('granted');
    expect(await map.waitForGeoSuccess(6000)).toBe(true);

    // Visit 2 (same context)
    await map.goto(MapUrl.US);
    await map.waitForInit(5000);
    const state2 = await map.permissionState();
    expect(state2).toBe('granted');
    expect(await map.waitForGeoSuccess(6000)).toBe(true);

    testInfo.annotations.push({
      type: 'implicit-assertion',
      description:
        'No native re-prompt on visit 2 is verified implicitly: Playwright resolves the granted permission silently (no dialog). Permission state stayed "granted" and getCurrentPosition resolved on both visits.',
    });
  });

  test('[TC-14] Stored Block — no re-prompt on second visit; fallback UI persists', async ({
    page,
    context,
  }, testInfo) => {
    await context.clearPermissions(); // stored block (config grants by default)

    const map = new MapStorePage(page);
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));

    // Visit 1
    await map.goto(MapUrl.US);
    await map.waitForInit(5000);
    const state1 = await map.permissionState();
    expect(['prompt', 'denied']).toContain(state1); // not granted
    await expect(map.header).toBeVisible();
    await expect(map.footer).toBeVisible();
    await expect(map.mapContainer).toBeVisible();

    // Visit 2 (same context) — state must NOT reset to granted between visits.
    await map.goto(MapUrl.US);
    await map.waitForInit(5000);
    const state2 = await map.permissionState();
    expect(state2).toBe(state1);
    await expect(map.header).toBeVisible();
    await expect(map.footer).toBeVisible();
    await expect(map.mapContainer).toBeVisible();

    const significant = significantErrors(pageErrors, testInfo);
    expect(significant, significant.join('\n')).toHaveLength(0);

    testInfo.annotations.push({
      type: 'environment',
      description: `Playwright cannot store a true "denied" state; clearPermissions yields "${state1}". The TC intent (no re-prompt, non-granted state persists unchanged across visits) is verified: state stayed "${state1}" on both visits.`,
    });
  });

  test('[TC-15] JTT same session — no re-prompt on second visit; location remains denied', async ({
    page,
    context,
  }, testInfo) => {
    await context.clearPermissions(); // JTT same-session simulation

    const map = new MapStorePage(page);

    // Visit 1
    await map.goto(MapUrl.US);
    await map.waitForInit(5000);
    await expect(map.header).toBeVisible();
    await expect(map.footer).toBeVisible();
    await expect(map.mapContainer).toBeVisible();

    // Visit 2 (same context = same session)
    await map.goto(MapUrl.US);
    await map.waitForInit(5000);
    await expect(map.header).toBeVisible();
    await expect(map.footer).toBeVisible();
    await expect(map.mapContainer).toBeVisible();

    const state = await map.permissionState();
    expect(['prompt', 'denied']).toContain(state); // not granted

    testInfo.annotations.push({
      type: 'implicit-assertion',
      description:
        'No native re-prompt on the second same-session visit is verified implicitly (Playwright never shows a dialog). State is not "granted".',
    });
  });

  test('[TC-16] JTT new session — geolocation prompt reappears in a new context', async ({
    browser,
  }) => {
    // Context A — first session.
    const contextA = await browser.newContext();
    await contextA.clearPermissions();
    try {
      const pageA = await contextA.newPage();
      const mapA = new MapStorePage(pageA);
      await mapA.installGeoSpy();
      await mapA.goto(MapUrl.US);

      expect(await mapA.waitForGeoCall(6000), 'geo requested in context A').toBe(true);
      const stateA = await mapA.permissionState();
      expect(['prompt', 'denied']).toContain(stateA);
    } finally {
      await contextA.close(); // ends the JTT "session"
    }

    // Context B — brand new, independent session.
    const contextB = await browser.newContext();
    await contextB.clearPermissions();
    try {
      const pageB = await contextB.newPage();
      const mapB = new MapStorePage(pageB);
      await mapB.installGeoSpy();
      await mapB.goto(MapUrl.US);

      expect(await mapB.waitForGeoCall(6000), 'geo requested again in context B').toBe(
        true,
      );
      // New session behaves as a first-time visitor: prompt state (not granted).
      const stateB = await mapB.permissionState();
      expect(stateB).toBe('prompt');
    } finally {
      await contextB.close();
    }
  });

  test('[TC-17] [Negative] Blocked — error callback invoked gracefully; no unhandled exception', async ({
    page,
    context,
  }, testInfo) => {
    await context.clearPermissions();

    const map = new MapStorePage(page);
    // Playwright cannot produce a real browser block; inject a PERMISSION_DENIED
    // so the page's geolocation-denied handling path actually runs.
    await map.installGeoDenySpy();
    await map.goto(MapUrl.US);

    expect(await map.waitForGeoError(6000), 'error callback should fire').toBe(true);
    const err = await map.getGeoError();
    expect(err).not.toBeNull();
    expect(err!.code, 'PERMISSION_DENIED').toBe(1);

    // The denial is handled — not bubbled up as an uncaught error.
    const significant = significantErrors(await map.getJsErrors(), testInfo);
    expect(significant, significant.join('\n')).toHaveLength(0);

    // Page is healthy and interactive (fallback UI).
    await expect(map.noscriptFallback).toBeHidden();
    await expect(map.somethingWentWrong).toHaveCount(0);
    await expect(map.mapContainer).toBeVisible();
    await expect(map.useCurrentLocation).toBeVisible();
    await expect(map.searchByState).toBeVisible();

    testInfo.annotations.push({
      type: 'environment',
      description:
        'Playwright cannot produce a genuine browser-level geolocation block (un-granted state stays "prompt"/pending). The denied error callback (code 1) was injected to exercise the page\'s handling path per AC-16/AC-21/AC-24.',
    });
  });
});
