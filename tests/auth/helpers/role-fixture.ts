import { test as base, expect, type Page } from '@playwright/test';
import { AUTH_STATE, DEMO_ORIGIN, installDemoAppRoutes } from './demo-app';

/**
 * Role-based fixture: cấp page đã login sẵn cho từng role.
 *
 * Mỗi role → 1 BrowserContext riêng (cookies isolation).
 * Dùng khi 1 test cần thao tác cùng lúc với NHIỀU role
 * (ví dụ: admin tạo user, customer login thấy user mới).
 *
 * Nếu test chỉ cần 1 role, ưu tiên `test.use({ storageState })` ở file-scope
 * — đỡ overhead 1 context.
 */

type RoleFixtures = {
  customerPage: Page;
  adminPage: Page;
  operatorPage: Page;
};

function makeRoleFixture(stateFile: string) {
  return async ({ browser }: { browser: import('@playwright/test').Browser }, use: (p: Page) => Promise<void>) => {
    const ctx = await browser.newContext({ storageState: stateFile });
    // [demo only] Real app KHÔNG cần installDemoAppRoutes.
    await installDemoAppRoutes(ctx);
    const page = await ctx.newPage();
    await page.goto(DEMO_ORIGIN + '/');
    // Chờ info-section render xong để test assert ngay, không cần chờ trong từng test.
    await page.getByTestId('info-section').waitFor();
    await use(page);
    await ctx.close();
  };
}

export const test = base.extend<RoleFixtures>({
  customerPage: makeRoleFixture(AUTH_STATE.customer),
  adminPage: makeRoleFixture(AUTH_STATE.admin),
  operatorPage: makeRoleFixture(AUTH_STATE.operator),
});

export { expect };
