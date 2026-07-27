/**
 * UI Exploration script — Store Locator / Geolocation Permission
 * Purpose: discover real DOM structure, labels, and behaviour
 * This spec is intentionally non-assertive; it collects observations.
 */
import { test, expect } from '@playwright/test';

const STOREFRONT_LOCALES = [
  { url: 'https://www.uniqlo.com/us/en/', expectedMapUrl: 'https://map.uniqlo.com/us/en/' },
  { url: 'https://www.uniqlo.com/uk/en/', expectedMapUrl: 'https://map.uniqlo.com/uk/en/' },
  { url: 'https://www.uniqlo.com/vn/en/', expectedMapUrl: 'https://map.uniqlo.com/vn/en/' },
];

test.describe('Store Locator — Footer link exploration', () => {

  test('us/en — scroll to footer, find Store Locator link', async ({ page }) => {
    await page.goto('https://www.uniqlo.com/us/en/', { waitUntil: 'domcontentloaded' });
    
    // Scroll to bottom to reveal footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);
    
    // Try to find any link containing "store" text (case-insensitive)
    const storeLinks = await page.locator('a').filter({ hasText: /store locator/i }).all();
    console.log('[us/en] Store Locator link count:', storeLinks.length);
    
    for (const link of storeLinks) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      const target = await link.getAttribute('target');
      const isVisible = await link.isVisible();
      console.log(`  Text: "${text?.trim()}", href: ${href}, target: ${target}, visible: ${isVisible}`);
    }
    
    // Also look for any link with text containing "store" broadly
    const storeLinksBoard = await page.locator('a').filter({ hasText: /store/i }).all();
    console.log('[us/en] All "store" links count:', storeLinksBoard.length);
    for (const link of storeLinksBoard) {
      const text = await link.textContent();
      const href = await link.getAttribute('href');
      if (text?.trim()) {
        console.log(`  Text: "${text?.trim()}", href: ${href}`);
      }
    }
    
    // Check footer element existence
    const footerExists = await page.locator('footer').count();
    console.log('[us/en] footer element count:', footerExists);
    
    // Grab footer HTML excerpt
    const footerHTML = await page.locator('footer').first().innerHTML().catch(() => 'NOT FOUND');
    console.log('[us/en] Footer HTML length:', footerHTML.length);
    
    // Check aria-label or role=contentinfo
    const contentInfo = await page.locator('[role="contentinfo"]').count();
    console.log('[us/en] role=contentinfo count:', contentInfo);
  });

  test('us/en — click Store Locator, check new tab', async ({ page, context }) => {
    await page.goto('https://www.uniqlo.com/us/en/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);

    const originalUrl = page.url();
    console.log('[us/en] Original URL:', originalUrl);
    
    // Wait for new page to open
    const storeLocatorLink = page.locator('a').filter({ hasText: /store locator/i }).first();
    const linkVisible = await storeLocatorLink.isVisible().catch(() => false);
    console.log('[us/en] Store Locator link visible:', linkVisible);
    
    if (linkVisible) {
      await storeLocatorLink.scrollIntoViewIfNeeded();
      
      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        storeLocatorLink.click(),
      ]);
      
      await newPage.waitForLoadState('domcontentloaded');
      const newTabUrl = newPage.url();
      console.log('[us/en] New tab URL:', newTabUrl);
      console.log('[us/en] Original tab URL after click:', page.url());
      console.log('[us/en] Tab count:', context.pages().length);
      
      // Inspect map.uniqlo.com DOM for fallback selectors
      await newPage.waitForTimeout(3000);
      
      const headerCount = await newPage.locator('header').count();
      const footerCount = await newPage.locator('footer').count();
      const mainCount = await newPage.locator('main').count();
      const mapCount = await newPage.locator('[id*="map"], [class*="map"], [id*="Map"], [class*="Map"]').count();
      const canvasCount = await newPage.locator('canvas').count();
      
      console.log('[map.uniqlo.com] header count:', headerCount);
      console.log('[map.uniqlo.com] footer count:', footerCount);
      console.log('[map.uniqlo.com] main count:', mainCount);
      console.log('[map.uniqlo.com] map-related elements count:', mapCount);
      console.log('[map.uniqlo.com] canvas count:', canvasCount);
      console.log('[map.uniqlo.com] final URL:', newPage.url());
      
      // Get page title
      const title = await newPage.title();
      console.log('[map.uniqlo.com] page title:', title);
      
      // Get top-level element structure
      const bodyHTML = await newPage.locator('body').innerHTML().catch(() => 'error');
      console.log('[map.uniqlo.com] body HTML length:', bodyHTML.length);
      
      // Check role=contentinfo, role=banner, role=main
      const banner = await newPage.locator('[role="banner"]').count();
      const contentInfo2 = await newPage.locator('[role="contentinfo"]').count();
      const mainRole = await newPage.locator('[role="main"]').count();
      console.log('[map.uniqlo.com] role=banner:', banner);
      console.log('[map.uniqlo.com] role=contentinfo:', contentInfo2);
      console.log('[map.uniqlo.com] role=main:', mainRole);
      
      // Check for error page indicators
      const errorText = await newPage.locator('body').textContent();
      if (errorText && errorText.includes('Error')) {
        console.log('[map.uniqlo.com] ERROR text found in page');
      }
      
      await newPage.close();
    } else {
      console.log('[us/en] STORE LOCATOR LINK NOT FOUND — trying broader search');
      const allLinks = await page.locator('footer a, [role="contentinfo"] a').all();
      for (const link of allLinks) {
        const text = await link.textContent();
        const href = await link.getAttribute('href');
        if (text?.trim()) {
          console.log(`  Footer link: "${text.trim()}", href: ${href}`);
        }
      }
    }
  });

  test('uk/en — footer Store Locator link', async ({ page }) => {
    await page.goto('https://www.uniqlo.com/uk/en/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);
    
    const storeLinks = await page.locator('a').filter({ hasText: /store locator/i }).all();
    console.log('[uk/en] Store Locator link count:', storeLinks.length);
    for (const link of storeLinks) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      const target = await link.getAttribute('target');
      const isVisible = await link.isVisible();
      console.log(`  Text: "${text?.trim()}", href: ${href}, target: ${target}, visible: ${isVisible}`);
    }
    
    if (storeLinks.length === 0) {
      // Try wider search
      const allFooterLinks = await page.locator('footer a, [role="contentinfo"] a').all();
      console.log('[uk/en] All footer links:');
      for (const link of allFooterLinks) {
        const text = await link.textContent();
        const href = await link.getAttribute('href');
        if (text?.trim()) console.log(`  "${text.trim()}", href: ${href}`);
      }
    }
  });

  test('vn/en — footer Store Locator link', async ({ page }) => {
    await page.goto('https://www.uniqlo.com/vn/en/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);
    
    const storeLinks = await page.locator('a').filter({ hasText: /store locator/i }).all();
    console.log('[vn/en] Store Locator link count:', storeLinks.length);
    for (const link of storeLinks) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      const target = await link.getAttribute('target');
      const isVisible = await link.isVisible();
      console.log(`  Text: "${text?.trim()}", href: ${href}, target: ${target}, visible: ${isVisible}`);
    }
    
    if (storeLinks.length === 0) {
      const allFooterLinks = await page.locator('footer a, [role="contentinfo"] a').all();
      console.log('[vn/en] All footer links:');
      for (const link of allFooterLinks) {
        const text = await link.textContent();
        const href = await link.getAttribute('href');
        if (text?.trim()) console.log(`  "${text.trim()}", href: ${href}`);
      }
    }
  });

  test('map.uniqlo.com — DOM structure for fallback UI selectors', async ({ page }) => {
    // Navigate directly to map.uniqlo.com (geolocation denied by default in Playwright)
    await page.goto('https://map.uniqlo.com/us/en/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);
    
    console.log('[map.uniqlo.com] URL after load:', page.url());
    console.log('[map.uniqlo.com] Title:', await page.title());
    
    // Check various structural elements
    const checks = [
      { selector: 'header', label: 'header' },
      { selector: 'footer', label: 'footer' },
      { selector: 'main', label: 'main' },
      { selector: 'nav', label: 'nav' },
      { selector: '[role="banner"]', label: 'role=banner' },
      { selector: '[role="contentinfo"]', label: 'role=contentinfo' },
      { selector: '[role="main"]', label: 'role=main' },
      { selector: 'canvas', label: 'canvas' },
      { selector: '#map', label: '#map' },
      { selector: '.map', label: '.map' },
      { selector: '[data-testid*="map"]', label: 'data-testid=map' },
      { selector: '[class*="map-container"]', label: 'class=map-container' },
      { selector: '[class*="mapContainer"]', label: 'class=mapContainer' },
      { selector: '[class*="Map"]', label: 'class contains Map' },
      { selector: '[id*="map"]', label: 'id contains map' },
    ];
    
    for (const { selector, label } of checks) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        const firstVisible = await page.locator(selector).first().isVisible().catch(() => false);
        console.log(`[map.uniqlo.com] ${label}: count=${count}, firstVisible=${firstVisible}`);
      }
    }
    
    // Get body text to understand page state
    const bodyText = await page.locator('body').textContent();
    console.log('[map.uniqlo.com] Body text excerpt (first 500 chars):', bodyText?.substring(0, 500));
    
    // Check if geolocation was requested (spy)
    const geoResult = await page.evaluate(() => {
      return new Promise<string>((resolve) => {
        const original = navigator.geolocation.getCurrentPosition;
        let called = false;
        // Check if it was already called
        setTimeout(() => {
          resolve(called ? 'called' : 'not-yet-called-after-eval');
        }, 100);
      });
    });
    console.log('[map.uniqlo.com] Geolocation spy result:', geoResult);
    
    // Try getting all visible text elements in header area
    const headerText = await page.locator('header').first().textContent().catch(() => 'NO HEADER');
    console.log('[map.uniqlo.com] Header text:', headerText?.substring(0, 200));
    
    const footerText = await page.locator('footer').first().textContent().catch(() => 'NO FOOTER');
    console.log('[map.uniqlo.com] Footer text:', footerText?.substring(0, 200));
  });

  test('map.uniqlo.com — geolocation auto-trigger spy test', async ({ page }) => {
    // Inject spy before navigation
    await page.addInitScript(() => {
      (window as any).__geoWasCalled = false;
      const originalGeo = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
      navigator.geolocation.getCurrentPosition = function(...args) {
        (window as any).__geoWasCalled = true;
        console.log('GEOLOCATION getCurrentPosition CALLED');
        return originalGeo(...args);
      };
    });
    
    await page.goto('https://map.uniqlo.com/us/en/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait up to 5s for geolocation call
    let geoCalled = false;
    try {
      await page.waitForFunction(() => (window as any).__geoWasCalled === true, { timeout: 6000 });
      geoCalled = true;
    } catch {
      geoCalled = false;
    }
    
    console.log('[map.uniqlo.com] Geolocation auto-triggered within 5s:', geoCalled);
    
    const finalGeoState = await page.evaluate(() => (window as any).__geoWasCalled);
    console.log('[map.uniqlo.com] Final __geoWasCalled state:', finalGeoState);
  });
});
