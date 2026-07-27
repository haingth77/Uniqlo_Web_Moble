import { test, expect } from '@playwright/test';

/**
 * API tests — chạy bằng project "api" trong playwright.config.ts
 *   npx playwright test --project=api
 *
 * `request` fixture đã tự động:
 *   - dùng baseURL từ project "api"
 *   - gắn extraHTTPHeaders (Accept, Content-Type)
 *   - apply ignoreHTTPSErrors, proxy, ... từ config
 * → Không cần khai báo lại bất cứ gì.
 */

test.describe.skip('Uniqlo Product API', () => {
  test('GET featured products returns 200', async ({ request }) => {
    const response = await request.get('/commerce/v5/en/products');

    expect(response.status()).toBe(200);
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body).toHaveProperty('result');
  });

  test('POST search with payload', async ({ request }) => {
    const response = await request.post('/commerce/v5/en/products/search', {
      data: { query: 'jacket', limit: 10 },
    });

    expect(response.status()).toBe(200);
  });

  test('Response time under 2s', async ({ request }) => {
    const start = Date.now();
    const response = await request.get('/commerce/v5/en/products');
    const duration = Date.now() - start;

    expect(response.ok()).toBeTruthy();
    expect(duration).toBeLessThan(2000);
  });
});
