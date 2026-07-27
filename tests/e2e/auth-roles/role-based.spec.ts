import { test, expect } from '../../auth/helpers/role-fixture';
import { AUTH_STATE, DEMO_ORIGIN, ROLES, installDemoAppRoutes } from '../../auth/helpers/demo-app';

/**
 * ============================================================================
 * BEST PRACTICES — Multi-role UI testing với storageState
 * ============================================================================
 *
 * SETUP (chạy 1 lần qua `setup` project):
 *   tests/auth/customer.setup.ts → .auth/customer.json
 *   tests/auth/admin.setup.ts    → .auth/admin.json
 *   tests/auth/operator.setup.ts → .auth/operator.json
 *
 * Mỗi state file chứa cookies + localStorage tại thời điểm sau login.
 * Tests reuse file này → SKIP UI login → nhanh + ổn định.
 *
 * 4 PATTERN tổ chức (chọn theo nhu cầu):
 *   A. test.use() file-scope        — 1 file / 1 role, đơn giản nhất
 *   B. test.use() trong describe + parameterized loop — DRY cho test giống nhau
 *   C. Role fixture (customerPage / adminPage / operatorPage) — multi-role 1 test
 *   D. Empty storageState           — test trạng thái CHƯA login
 *
 * Nguyên tắc:
 *   - Không bao giờ login qua UI trong từng test (chậm + flaky).
 *   - storageState là default; UI login chỉ trong setup file.
 *   - Verify state HỢP LỆ trước khi save (nếu login fail, đừng ghi đè state cũ).
 *   - Mỗi role 1 file state riêng; KHÔNG dùng chung 1 file rồi gán cookie khác lúc test.
 * ============================================================================
 */

test.describe('Multi-role UI — best-practice patterns', () => {

  // ===========================================================================
  // PATTERN A — file-scope test.use()
  // Dùng khi: cả describe (hoặc cả file) test chỉ MỘT role.
  // Ưu điểm: rõ ràng, 1 context, không cần fixture custom.
  // ===========================================================================
  test.describe('A) file-scope — admin only', () => {
    test.use({ storageState: AUTH_STATE.admin });

    test.beforeEach(async ({ context, page }) => {
      // [demo only] real app skip dòng này
      await installDemoAppRoutes(context);
      await page.goto(DEMO_ORIGIN + '/');
      await page.getByTestId('info-section').waitFor();
    });

    test('A.1 — info hiện đúng role admin + admin features', async ({ page }) => {
      await expect(page.getByTestId('info-role')).toHaveText('admin');
      await expect(page.getByTestId('info-role-badge')).toHaveClass(/badge-admin/);
      await expect(page.getByTestId('feature-user-management')).toBeVisible();
      await expect(page.getByTestId('feature-audit-logs')).toBeVisible();
    });

    test('A.2 — admin KHÔNG thấy feature của customer', async ({ page }) => {
      await expect(page.getByTestId('feature-orders')).toHaveCount(0);
      await expect(page.getByTestId('feature-wishlist')).toHaveCount(0);
    });
  });

  // ===========================================================================
  // PATTERN B — parameterized describe
  // Dùng khi: test logic GIỐNG NHAU lặp lại cho mỗi role (smoke check).
  // Tránh copy-paste 3 lần.
  // ===========================================================================
  for (const role of ROLES) {
    test.describe(`B) parameterized — ${role}`, () => {
      test.use({ storageState: AUTH_STATE[role] });

      test.beforeEach(async ({ context, page }) => {
        await installDemoAppRoutes(context);
        await page.goto(DEMO_ORIGIN + '/');
        await page.getByTestId('info-section').waitFor();
      });

      test(`B.1 — ${role} login state được preserved (không cần login lại)`, async ({ page }) => {
        // Quan trọng: ta KHÔNG fill form ở đây. storageState đã restore session cookie.
        await expect(page.getByTestId('info-section')).toBeVisible();
        await expect(page.getByTestId('login-section')).toBeHidden();
        await expect(page.getByTestId('info-role')).toHaveText(role);
      });
    });
  }

  // ===========================================================================
  // PATTERN C — multi-role fixture
  // Dùng khi: 1 test cần SO SÁNH hành vi giữa các role
  // hoặc cần admin tạo data → customer login thấy data đó.
  // ===========================================================================
  test.describe('C) multi-role fixture', () => {
    test('C.1 — admin có User Management, customer thì không', async ({
      adminPage,
      customerPage,
    }) => {
      await expect(adminPage.getByTestId('feature-user-management')).toBeVisible();
      await expect(customerPage.getByTestId('feature-user-management')).toHaveCount(0);

      // Sanity: mỗi role thấy đúng feature của mình
      await expect(adminPage.getByTestId('info-role')).toHaveText('admin');
      await expect(customerPage.getByTestId('info-role')).toHaveText('customer');
      await expect(customerPage.getByTestId('feature-orders')).toBeVisible();
    });

    test('C.2 — operator dashboard cô lập khỏi admin', async ({
      operatorPage,
      adminPage,
    }) => {
      await expect(operatorPage.getByTestId('feature-ops-dashboard')).toBeVisible();
      await expect(adminPage.getByTestId('feature-ops-dashboard')).toHaveCount(0);
    });

    test('C.3 — cùng 1 test, 3 role chạy đồng thời (3 BrowserContext riêng)', async ({
      customerPage,
      adminPage,
      operatorPage,
    }) => {
      // Mỗi page là context riêng → cookies độc lập, không leak.
      await expect(customerPage.getByTestId('info-role')).toHaveText('customer');
      await expect(adminPage.getByTestId('info-role')).toHaveText('admin');
      await expect(operatorPage.getByTestId('info-role')).toHaveText('operator');
    });
  });

  // ===========================================================================
  // PATTERN D — empty storageState
  // Dùng khi: test luồng KHÔNG đăng nhập (login form, error message, redirect).
  // ===========================================================================
  test.describe('D) no auth — fresh context', () => {
    // Override project storageState bằng object rỗng (KHÔNG dùng undefined — vẫn dính default).
    test.use({ storageState: { cookies: [], origins: [] } });

    test.beforeEach(async ({ context, page }) => {
      await installDemoAppRoutes(context);
      await page.goto(DEMO_ORIGIN + '/');
    });

    test('D.1 — không cookie → hiện login form, không thấy info', async ({ page }) => {
      await expect(page.getByTestId('login-section')).toBeVisible();
      await expect(page.getByTestId('info-section')).toBeHidden();
    });

    test('D.2 — credentials sai → error message hiện ra', async ({ page }) => {
      await page.getByTestId('username-input').fill('wrong');
      await page.getByTestId('password-input').fill('wrong');
      await page.getByTestId('login-btn').click();
      await expect(page.getByTestId('error-msg')).toBeVisible();
      await expect(page.getByTestId('error-msg')).toHaveText(/invalid credentials/i);
      await expect(page.getByTestId('info-section')).toBeHidden();
    });
  });
});
