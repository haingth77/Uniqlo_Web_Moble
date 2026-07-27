import { test as setup, expect } from '@playwright/test';
import { AUTH_STATE, DEMO_ORIGIN, USERS, installDemoAppRoutes } from './helpers/demo-app';

/**
 * Setup: đăng nhập 1 lần như customer → lưu cookies + localStorage vào JSON.
 * Tests đọc lại JSON này → bỏ qua UI login → chạy nhanh, ổn định.
 */
setup('authenticate as customer', async ({ page, context }) => {
  // [demo only] Trên project thật, KHÔNG cần dòng này — BE thật đã chạy.
  await installDemoAppRoutes(context);

  await page.goto(DEMO_ORIGIN + '/');
  await page.getByTestId('login-section').waitFor();

  await page.getByTestId('username-input').fill(USERS.customer.username);
  await page.getByTestId('password-input').fill(USERS.customer.password);
  await page.getByTestId('login-btn').click();

  // Verify login thành công TRƯỚC khi lưu state — nếu fail mà vẫn lưu thì test sau sẽ chạy với empty cookies.
  await expect(page.getByTestId('info-role')).toHaveText('customer');

  // Snapshot cookies + localStorage của context hiện tại vào file.
  await context.storageState({ path: AUTH_STATE.customer });
});
