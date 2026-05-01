import { Page } from '@playwright/test';

export class BasePage {
  readonly _page: Page;
  constructor(page: Page) {
    this._page = page;
  }

  async acceptCookiesIfShown(timeout = 3000): Promise<void> {
    const acceptBtn = this._page.getByRole('button', { name: 'Accept All' });
    try {
      await acceptBtn.waitFor({ state: 'visible', timeout });
      await acceptBtn.click();
    } catch {
      // Banner not shown within timeout — skip silently.
    }
  }
}
export default BasePage;
