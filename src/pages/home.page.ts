import BasePage from "@pages/base.page";
import { Page } from "@playwright/test";

export class HomePage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    // TODO: add Men/Women/Kids/Baby/Wishlist/Membership/Cart/Menu keys to locales.ts when adding non-English locales.
    btnMen = this._page.getByRole('tab', { name: 'men', exact: true });
    btnWomen = this._page.getByRole('tab', { name: 'women', exact: true });
    btnKids = this._page.getByRole('tab', { name: 'kids', exact: true });
    btnBaby = this._page.getByRole('tab', { name: 'baby', exact: true });
    btnSearch = this._page.getByRole('button', { name: this.t.Search });
    btnFavorite = this._page.getByRole('link', { name: 'Wishlist' });
    btnMembership = this._page.getByRole('link', { name: 'Membership / Purchase history' });
    btnCart = this._page.getByRole('link', { name: 'Cart' });
    btnMenu = this._page.getByRole('button', { name: 'Menu / Product Search' });

    txbSearch = this._page.getByRole('searchbox', { name: this.t.Search });

    // Women Category
    btnTShirts_Sweats = this._page.getByRole('link', { name: this.t.TShirts_Sweats });
    btnShirts_Blouses = this._page.getByRole('link', { name: this.t.Shirts_Blouses });
    btnSweaters_Cardigans = this._page.getByRole('link', { name: this.t.Sweaters_Cardigans });

    // Men Category
    btnPolos = this._page.locator('#homeCategoryList').getByRole('link', { name: this.t.Polos });
    btnShirts = this._page.getByRole('link', { name: this.t.Shirts, exact: true });
    btnAccessories = this._page.getByRole('link', { name: this.t.Accessories, exact: true });

    // Kids Category
    btnNewArrivals = this._page.getByRole('link', { name: this.t.New_Arrivals, exact: true });
    btnSale = this._page.locator('#homeCategoryList').getByRole('link', { name: this.t.Sale });
    btnHeattech = this._page.getByRole('link', { name: this.t.Heattech });

    // Baby Category
    btnBestSellers = this._page.getByRole('link', { name: 'Best Sellers', exact: true });
    btnComingSoon = this._page.getByRole('link', { name: this.t.Coming_Soon });
}
