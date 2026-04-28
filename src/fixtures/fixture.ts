import { test as baseTest, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { AppUrl } from '@config/constant.enum';

type Fixtures = {
  /**
   * Isolated `page` for this test (default Playwright behavior), already opened at
   * {@link AppUrl.Default}. Use bare `{ page }` when you need a tab without this navigation.
   */
  appPage: Page;
};

export const test = baseTest.extend<Fixtures>({
  appPage: async ({ page }, use) => {
    await page.goto(AppUrl.Default);
    await use(page);
  },
});

export { expect };
