import BaseScreen from './base.screen.js';

/**
 * HomeScreen — màn hình chính của app UNIQLO.
 *
 * ⚠️ Các selector dưới đây là PLACEHOLDER. App bên thứ ba thường không có
 * accessibility id sạch, nên bạn cần dùng Appium Inspector để lấy selector thật:
 *   1) Chạy Appium server + emulator có app UNIQLO.
 *   2) Mở Appium Inspector, kết nối bằng capabilities trong wdio.conf.ts.
 *   3) Click vào element trên cây UI để lấy resource-id / content-desc / text.
 * Sau đó thay các selector bên dưới cho đúng.
 */
export class HomeScreen extends BaseScreen {
  // Tab bar dưới cùng (ví dụ điển hình của app thương mại điện tử)
  get tabHome() {
    return this.byAccessibilityId('Home');
  }
  get tabSearch() {
    return this.byAccessibilityId('Search');
  }
  get tabCart() {
    return this.byAccessibilityId('Cart');
  }
  get tabAccount() {
    return this.byAccessibilityId('Account');
  }

  // Ô tìm kiếm
  get searchBox() {
    return $('android=new UiSelector().resourceIdMatches(".*search.*")');
  }

  async openSearch(): Promise<void> {
    await this.tap(this.tabSearch);
  }

  async searchProduct(keyword: string): Promise<void> {
    await this.openSearch();
    await this.searchBox.waitForDisplayed();
    await this.searchBox.setValue(keyword);
    await driver.pressKeyCode(66); // Enter
  }

  async isLoaded(): Promise<boolean> {
    return this.tabHome.isDisplayed();
  }
}

export default new HomeScreen();
