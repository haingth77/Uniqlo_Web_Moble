/**
 * BaseScreen — tương đương BasePage bên Playwright.
 * Chứa các helper dùng chung cho mọi màn hình native.
 */
export class BaseScreen {
  /**
   * Chờ một element hiện ra rồi tap.
   */
  protected async tap(el: WebdriverIO.Element | ChainablePromiseElement): Promise<void> {
    await el.waitForDisplayed({ timeout: 15_000 });
    await el.click();
  }

  /**
   * Đóng dialog xin quyền / popup nếu xuất hiện (không có thì bỏ qua im lặng).
   * Native app thường bung dialog "Allow notifications", "Accept cookies"...
   */
  async dismissIfShown(selector: string, timeout = 3000): Promise<void> {
    const el = $(selector);
    try {
      await el.waitForDisplayed({ timeout });
      await el.click();
    } catch {
      // Không hiện trong thời gian chờ — bỏ qua.
    }
  }

  /**
   * Android UiAutomator selector helper — tìm theo text.
   */
  byText(text: string): ChainablePromiseElement {
    return $(`android=new UiSelector().text("${text}")`);
  }

  /**
   * Tìm theo text chứa (partial match).
   */
  byTextContains(text: string): ChainablePromiseElement {
    return $(`android=new UiSelector().textContains("${text}")`);
  }

  /**
   * Tìm theo content-desc (accessibility id).
   */
  byAccessibilityId(id: string): ChainablePromiseElement {
    return $(`~${id}`);
  }
}

export default BaseScreen;
