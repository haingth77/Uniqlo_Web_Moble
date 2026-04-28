import { Page } from '@playwright/test';

export class BasePage {
  readonly _page: Page;
  constructor(page: Page) {
    this._page = page;
  }
}
export default BasePage;
