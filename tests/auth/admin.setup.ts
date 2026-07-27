import { test as setup, expect } from '@playwright/test';
import { AUTH_STATE, DEMO_ORIGIN, USERS, installDemoAppRoutes } from './helpers/demo-app';

setup('authenticate as admin', async ({ page, context }) => {
  await installDemoAppRoutes(context);

  await page.goto(DEMO_ORIGIN + '/');
  await page.getByTestId('login-section').waitFor();

  await page.getByTestId('username-input').fill(USERS.admin.username);
  await page.getByTestId('password-input').fill(USERS.admin.password);
  await page.getByTestId('login-btn').click();

  await expect(page.getByTestId('info-role')).toHaveText('admin');
  await context.storageState({ path: AUTH_STATE.admin });
});
