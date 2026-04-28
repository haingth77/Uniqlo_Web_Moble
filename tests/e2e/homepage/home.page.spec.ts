import { AppUrl } from '@config/constant.enum';
import { test, expect } from '@fixtures/fixture';
import { HomePage } from '@pages/home.page';

test.describe('Home Page', () => {
  test('Verify that home page is dependend on location of browser', async ({ appPage }) => {
    await expect(appPage).toHaveURL(AppUrl.Default);
  });

  test(`HP-002: Verify that 'Category' is displayed when hover on 'Women' - 'Men' - 'Kids' - 'Baby' tab`, async ({ appPage }) => {
    const homePage = new HomePage(appPage);
    await expect(appPage).toHaveURL(AppUrl.Default);

    await test.step('Verify that "Women" category is displayed', async () => {
    await homePage.btnWomen.hover();
    await expect(homePage.txbSearch).toBeEditable();
    await expect(homePage.btnTShirts_Sweats).toBeVisible();
    await expect(homePage.btnShirts_Blouses).toBeVisible();
    await expect(homePage.btnSweaters_Cardigans).toBeVisible();
    });

    await test.step('Verify that "Men" category is displayed', async () => {
    await homePage.btnMen.hover();
    await expect(homePage.txbSearch).toBeEditable();
    await expect(homePage.btnPolos).toBeVisible();
    await expect(homePage.btnShirts).toBeVisible();
    await expect(homePage.btnAccessories).toBeVisible();
    });
    
    await test.step('Verify that "Kids" category is displayed', async () => {
    await homePage.btnKids.hover();
    await expect(homePage.txbSearch).toBeEditable();
    await expect(homePage.btnNewArrivals).toBeVisible();
    await expect(homePage.btnSale).toBeVisible();
    await expect(homePage.btnHeattech).toBeVisible();
    });
    
    
    await test.step('Verify that "Baby" category is displayed', async () => {
    await homePage.btnBaby.hover();
    await expect(homePage.txbSearch).toBeEditable();
    await expect(homePage.btnBestSellers).toBeVisible();
    await expect(homePage.btnComingSoon).toBeVisible();
    });
  })

  test(`Verify that URL change when hover on 'Women' - 'Men' - 'Kids' - 'Baby`, async ({ appPage }) => {
    const homePage = new HomePage(appPage);
    await expect(appPage).toHaveURL(AppUrl.Default);

    await homePage.btnMen.hover();
    await expect(appPage).toHaveURL(`${AppUrl.Default}men`);
    await homePage.btnKids.hover();
    await expect(appPage).toHaveURL(`${AppUrl.Default}kids`);
    await homePage.btnBaby.hover();
    await expect(appPage).toHaveURL(`${AppUrl.Default}baby`);
  })
});
