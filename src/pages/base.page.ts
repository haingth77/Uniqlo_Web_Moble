import { Page } from '@playwright/test';
import { Locales } from '@utils/locales';
import { getLocale } from '@config/constant.enum';

type LocaleStrings = (typeof Locales)[keyof typeof Locales];

export class BasePage {
  readonly _page: Page;
  readonly t: LocaleStrings;

  constructor(page: Page) {
    this._page = page;
    this.t = Locales[getLocale()];
  }

  async acceptCookiesIfShown(timeout = 3000): Promise<void> {
    const acceptBtn = this._page.getByRole('button', { name: 'Accept All' });
    try {
      await acceptBtn.waitFor({ state: 'visible', timeout });
      await acceptBtn.click();
      console.log('Accepted Cookies');
    } catch {
      // Banner not shown within timeout — skip silently.
    }
  }
}
export default BasePage;
