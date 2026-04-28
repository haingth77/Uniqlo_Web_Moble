import BasePage from "@pages/base.page";
import { Page } from "@playwright/test";

export class HomePage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    btnMen = this._page.getByRole('tab', { name: 'men', exact: true });
    btnWomen = this._page.getByRole('tab', { name: 'women', exact: true });
    btnKids = this._page.getByRole('tab', { name: 'kids', exact: true });
    btnBaby = this._page.getByRole('tab', { name: 'baby', exact: true });
    btnSearch = this._page.getByRole('button', { name: 'search' });
    btnFavorite = this._page.getByRole('link', {name: 'Wishlist'});
    btnMembership = this._page.getByRole('link', {name: 'Membership / Purchase history'})
    btnCart = this._page.getByRole('link', {name: 'Cart'});
    btnMenu = this._page.getByRole('button', {name: 'Menu / Product Search'});

    txbSearch = this._page.getByRole('searchbox', {name: 'Search'})
    // Women Category
    btnTShirts_Sweats =  this._page.getByRole('link', {name: 'T-Shirts & Sweats'})
    btnShirts_Blouses = this._page.getByRole('link', {name: 'Shirts & Blouses'})
    btnSweaters_Cardigans = this._page.getByRole('link', {name: 'Sweaters & Cardigans'})

    // Men Category
    btnPolos =  this._page.locator('#homeCategoryList').getByRole('link', { name: 'Polos' })
    btnShirts = this._page.getByRole('link', {name: 'Shirts', exact: true})
    btnAccessories = this._page.getByRole('link', {name: 'Accessories', exact: true})

    // Kids Category
    btnNewArrivals = this._page.getByRole('link', {name: 'New Arrivals', exact: true})
    btnSale = this._page.locator('#homeCategoryList').getByRole('link', { name: 'Sale' })
    btnHeattech = this._page.getByRole('link', {name: 'HEATTECH'})
   
    // Baby Category
    btnBestSellers = this._page.getByRole('link', {name: 'Best Sellers', exact: true})
    btnComingSoon = this._page.getByRole('link', {name: 'Coming Soon'})

}