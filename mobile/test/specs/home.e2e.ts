import { expect } from '@wdio/globals';
import HomeScreen from '../screens/home.screen.js';

/**
 * Smoke test mẫu cho app UNIQLO trên Android.
 *
 * Mục tiêu bản đầu tiên: xác nhận app mở được và màn hình Home hiển thị.
 * Bước tìm kiếm để sẵn (skip) tới khi bạn lấy đúng selector bằng Appium Inspector.
 */
describe('UNIQLO Android - Home', () => {
  it('mở app và hiển thị màn hình Home', async () => {
    // Đóng các popup quyền/onboarding nếu có (điều chỉnh selector theo app thật)
    await HomeScreen.dismissIfShown('android=new UiSelector().textMatches("(?i)(allow|ok|skip|later|đồng ý)")');

    await expect(await HomeScreen.isLoaded()).toBe(true);
  });

  it.skip('tìm kiếm sản phẩm', async () => {
    await HomeScreen.searchProduct('AIRism');
    const result = HomeScreen.byTextContains('AIRism');
    await expect(result).toBeDisplayed();
  });
});
