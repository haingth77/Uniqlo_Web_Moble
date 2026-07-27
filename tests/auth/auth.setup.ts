import { test as setup, expect } from '@playwright/test';
import path from 'path';

/**
 * Auth setup — chạy 1 lần, lưu cookies + localStorage vào file JSON.
 * Mọi test sau đó load file này → bỏ qua bước login UI hoàn toàn.
 */
///////////////////////////////
// export const STORAGE_STATE = path.join(__dirname, '.auth/user.json');

// setup('authenticate', async ({ page }) => {
//   await page.goto('/login');

//   await page.getByLabel('Email').fill(process.env.UNIQLO_USER ?? '');
//   await page.getByLabel('Password').fill(process.env.UNIQLO_PASS ?? '');
//   await page.getByRole('button', { name: 'Sign in' }).click();

//   await expect(page).toHaveURL(/account|home/);

//   // Lưu cookies + localStorage → file JSON
//   await page.context().storageState({ path: STORAGE_STATE });
// });
