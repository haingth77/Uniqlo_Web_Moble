/**
 * UI Exploration script — Store Locator Phase 2
 * Focus: uk/en new-tab behaviour, map.uniqlo.com DOM deep-dive, geo-modal check
 */
import { test } from '@playwright/test';

test.describe('Store Locator — Phase 2 exploration', () => {

  test('uk/en — click Store Locator, observe tab behaviour', async ({ page, context }) => {
    await page.goto('https://www.uniqlo.com/uk/en/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);

    const originalUrl = page.url();
    console.log('[uk/en] Original URL:', originalUrl);

    const storeLocatorLink = page.locator('a').filter({ hasText: /store locator/i }).first();
    const linkVisible = await storeLocatorLink.isVisible();
    console.log('[uk/en] Store Locator link visible:', linkVisible);
    
    const href = await storeLocatorLink.getAttribute('href');
    const target = await storeLocatorLink.getAttribute('target');
    console.log('[uk/en] href:', href, 'target:', target);

    if (linkVisible) {
      await storeLocatorLink.scrollIntoViewIfNeeded();
      
      // Listen for new page event; if target=_self it won't fire
      let newPageOpened = false;
      const newPagePromise = context.waitForEvent('page', { timeout: 5000 }).catch(() => null);
      
      await storeLocatorLink.click();
      const newPage = await newPagePromise;
      
      if (newPage) {
        newPageOpened = true;
        await newPage.waitForLoadState('domcontentloaded');
        console.log('[uk/en] NEW TAB opened:', newPage.url());
        console.log('[uk/en] Original tab URL after click:', page.url());
        console.log('[uk/en] Tab count:', context.pages().length);
        await newPage.close();
      } else {
        newPageOpened = false;
        console.log('[uk/en] NO new tab opened (target=_self behaviour)');
        console.log('[uk/en] Current URL after click:', page.url());
        console.log('[uk/en] Tab count:', context.pages().length);
      }
      console.log('[uk/en] New tab opened:', newPageOpened);
    }
  });

  test('map.uniqlo.com — deep DOM inspection', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__geoWasCalled = false;
      const orig = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
      navigator.geolocation.getCurrentPosition = function(...args) {
        (window as any).__geoWasCalled = true;
        return orig(...args);
      };
    });
    
    await page.goto('https://map.uniqlo.com/us/en/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    console.log('[map] Title:', await page.title());
    console.log('[map] URL:', page.url());
    
    // Detailed DOM inspection for fallback UI selectors
    const domChecks = [
      // Header variants
      'header',
      'header:first-of-type',
      '.header',
      '#header',
      '[class*="header"]',
      // Footer variants
      'footer',
      '.footer',
      '#footer',
      '[class*="footer"]',
      // Map container
      '.map-container',
      '#map-container',
      '[class*="map-container"]',
      '[class*="MapContainer"]',
      // Content
      '.content',
      '#content',
      '.app',
      '#app',
      '#root',
      '.store-locator',
      '[class*="store-locator"]',
      '[class*="StoreLocator"]',
    ];
    
    for (const selector of domChecks) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        const vis = await page.locator(selector).first().isVisible().catch(() => false);
        const tag = await page.locator(selector).first().evaluate(el => el.tagName).catch(() => '?');
        const cls = await page.locator(selector).first().evaluate(el => el.className).catch(() => '?');
        const id = await page.locator(selector).first().evaluate(el => el.id).catch(() => '?');
        console.log(`[map] "${selector}": count=${count}, visible=${vis}, tag=${tag}, class="${cls}", id="${id}"`);
      }
    }
    
    // Check for custom geo-permission modal
    const modalSelectors = [
      '[role="dialog"]',
      '.permission-modal',
      '.geo-prompt',
      '[class*="permission"]',
      '[class*="geolocation"]',
      '[class*="location-prompt"]',
      '[class*="LocationPrompt"]',
    ];
    
    console.log('\n[map] Custom geo-modal check:');
    for (const sel of modalSelectors) {
      const count = await page.locator(sel).count();
      if (count > 0) {
        const vis = await page.locator(sel).first().isVisible().catch(() => false);
        console.log(`[map] FOUND custom modal "${sel}": count=${count}, visible=${vis}`);
      }
    }
    
    // Get the actual HTML of header and footer
    const header1HTML = await page.locator('header').nth(0).innerHTML().catch(() => 'NOT FOUND');
    const header2HTML = await page.locator('header').nth(1).innerHTML().catch(() => 'NOT FOUND');
    console.log('[map] header[0] HTML:', header1HTML.substring(0, 300));
    console.log('[map] header[1] HTML:', header2HTML.substring(0, 300));
    
    const footerHTML = await page.locator('footer').innerHTML().catch(() => 'NOT FOUND');
    console.log('[map] footer HTML:', footerHTML.substring(0, 300));
    
    const mapContainerHTML = await page.locator('.map-container').innerHTML().catch(() => 'NOT FOUND');
    console.log('[map] .map-container HTML:', mapContainerHTML.substring(0, 300));
    
    // Check geolocation was triggered
    const geoCalled = await page.evaluate(() => (window as any).__geoWasCalled);
    console.log('[map] Geolocation was called:', geoCalled);
    
    // Check no JS errors by looking for error boundary elements
    const jsErrorEl = await page.locator('[class*="error"], [class*="Error"]').count();
    console.log('[map] Error elements count:', jsErrorEl);
    
    // Check if "Use current location" button exists
    const useLocBtn = await page.locator('button').filter({ hasText: /use current location/i }).count();
    console.log('[map] "Use current location" button count:', useLocBtn);
    
    // Check visible text on page
    const pageText = await page.locator('body').innerText();
    console.log('[map] Visible text (first 800):', pageText.substring(0, 800));
  });

  test('map.uniqlo.com — check for JS error console messages', async ({ page }) => {
    const consoleErrors: string[] = [];
    const jsErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => {
      jsErrors.push(err.message);
    });
    
    await page.goto('https://map.uniqlo.com/us/en/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(4000);
    
    console.log('[map] Console errors:', JSON.stringify(consoleErrors));
    console.log('[map] Page (JS) errors:', JSON.stringify(jsErrors));
    console.log('[map] Console errors count:', consoleErrors.length);
    console.log('[map] JS errors count:', jsErrors.length);
  });

  test('uk/en — navigate directly to map.uniqlo.com/uk/en to check URL', async ({ page }) => {
    await page.goto('https://map.uniqlo.com/uk/en', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    console.log('[map-uk] URL after load:', page.url());
    console.log('[map-uk] Title:', await page.title());
    
    // Check if it redirects to trailing slash
    const header = await page.locator('header').count();
    const footer = await page.locator('footer').count();
    const mapContainer = await page.locator('.map-container').count();
    console.log('[map-uk] header count:', header);
    console.log('[map-uk] footer count:', footer);
    console.log('[map-uk] .map-container count:', mapContainer);
  });
});
