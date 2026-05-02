export const Locales = {
    us: {
        Search: 'Search',
        TShirts_Sweats: 'T-Shirts & Sweats',
        Shirts_Blouses: 'Shirts & Blouses',
        Sweaters_Cardigans: 'Sweaters & Cardigans',
        Polos: 'Polos',
        Shirts: 'Shirts',
        Accessories: 'Accessories',
        New_Arrivals: 'New Arrivals',
        Sale: 'Sale',
        Heattech: 'HEATTECH',
        Coming_Soon: 'Coming Soon',
    },
    uk: {
        Search: 'What are you looking for?',
        TShirts_Sweats: 'T-Shirts, Sweats & Bra Tops',
        Shirts_Blouses: 'Shirts, Blouses & Polo Shirts',
        Sweaters_Cardigans: 'Knitwear',
        Polos: 'Shirts & Polos',
        Shirts: 'Short Sleeve T-shirts',
        Accessories: 'Accessories',
        New_Arrivals: 'New Arrivals',
        Sale: 'Sale',
        Heattech: 'HEATTECH',
        Coming_Soon: 'Coming Soon',
    },

    vn: {
        Search: 'What are you looking for?',
        TShirts_Sweats: 'T-SHIRTS, SWEATS & BRA TOPS',
        Shirts_Blouses: 'SHIRTS & BLOUSES',
        Sweaters_Cardigans: 'SWEATERS & KNITWEAR',
        Polos: 'SHIRTS & POLO SHIRTS',
        Shirts: 'T-SHIRTS & SWEAT',
        Accessories: 'ACCESSORIES',
        New_Arrivals: 'NEW ARRIVALS',
        Sale: 'SALE',
        Heattech: 'HEATTECH',
        Coming_Soon: 'COMING SOON',
    },
} as const;

export type Locale = keyof typeof Locales;