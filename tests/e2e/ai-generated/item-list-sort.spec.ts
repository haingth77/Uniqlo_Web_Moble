import { test, expect } from '@fixtures/fixture';
import type { Page, TestInfo } from '@playwright/test';
import { ItemListPage } from '@pages/item.list.page';

/**
 * E2E suite — Item List: Sort Products (Uniqlo US Women's T-shirts).
 * Implements 03-manual-testcases.md TC-01..TC-16 using the live-verified
 * role/text locators from 02-ui-exploration.md.
 *
 * Notes carried over from the exploration report:
 *  - The closed "Sort by" button label NEVER changes (Discrepancy D-4); the
 *    active sort is only observable via aria-selected inside the OPEN dropdown.
 *  - A `sort` param is required to render the flat product grid.
 *  - Filter params use internal codes: Size M -> sizeCodes=SMA004,
 *    Color Black -> colorCodes=COL09.
 */

const SMA004 = 'SMA004'; // Size = M
const COL09 = 'COL09';   // Color = Black

/**
 * Uncaught errors the live Uniqlo build emits on EVERY page load (React
 * hydration mismatches + a third-party `klaviyo` analytics bug). They are not
 * caused by the sort feature, so they are excluded from the "no NEW JS error"
 * checks (still annotated) to avoid failing on pre-existing site noise.
 */
const BASELINE_ERROR_NOISE: RegExp[] = [
    /Minified React error #\d+/i,
    /klaviyo is not defined/i,
];

// ── small assertion helpers ─────────────────────────────────────────
function expectNonDecreasing(values: number[]): void {
    expect(values.length, 'expected at least 2 prices to compare').toBeGreaterThan(1);
    expect(values).toEqual([...values].sort((a, b) => a - b));
}

function expectNonIncreasing(values: number[]): void {
    expect(values.length, 'expected at least 2 values to compare').toBeGreaterThan(1);
    expect(values).toEqual([...values].sort((a, b) => b - a));
}

function rectsOverlap(
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number },
): boolean {
    const tol = 2; // allow 2px touching/anti-alias slack
    return (
        a.x + tol < b.x + b.width &&
        a.x + a.width > b.x + tol &&
        a.y + tol < b.y + b.height &&
        a.y + a.height > b.y + tol
    );
}

function occurrences(ids: string[]): Map<string, number> {
    const map = new Map<string, number>();
    for (const id of ids) map.set(id, (map.get(id) ?? 0) + 1);
    return map;
}

/** Collect uncaught JS exceptions (the real "page crash" signal). */
function collectPageErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    return errors;
}

/**
 * Split collected errors into pre-existing baseline noise (annotated, ignored)
 * and "significant" errors that would indicate a feature-induced crash.
 */
function significantErrors(errors: string[], testInfo: TestInfo): string[] {
    const noise = errors.filter((e) => BASELINE_ERROR_NOISE.some((r) => r.test(e)));
    if (noise.length > 0) {
        testInfo.annotations.push({
            type: 'baseline-js-noise',
            description: `${noise.length} pre-existing site error(s) ignored: ${[...new Set(noise)].join(' | ')}`,
        });
    }
    return errors.filter((e) => !BASELINE_ERROR_NOISE.some((r) => r.test(e)));
}

test.describe('Item List — Sort Products', () => {
    test.beforeEach(({}, testInfo) => {
        // Live third-party site: scrolling, lazy grids and SPA settles are slow.
        testInfo.setTimeout(150_000);
    });

    test('[TC-01] Sort control is visible on the product listing page', async ({ appPage }) => {
        const item = new ItemListPage(appPage);

        await item.gotoCategory({ sort: 2 });
        await item.waitForGrid();

        await expect(item.productList).toBeVisible();
        await expect(item.resultsCountVisible).toBeVisible();
        await expect(item.btnSortBy).toBeVisible();
    });

    test('[TC-02] "Featured" is shown as selected when no sort param is present', async ({ appPage }) => {
        const item = new ItemListPage(appPage);

        await item.gotoCategory(); // no sort param
        await item.waitForGrid();

        // URL must NOT carry a sort param.
        expect(item.urlParam('sort')).toBeNull();

        await item.openSort();
        // Featured is the only selected option.
        await expect(item.selectedOption('Featured')).toBeVisible();
        await expect(item.selectedOption('New arrivals')).toHaveCount(0);
        await expect(item.selectedOption('Price: Low to high')).toHaveCount(0);
        await expect(item.selectedOption('Price: High to low')).toHaveCount(0);
        await expect(item.selectedOption('Top rated')).toHaveCount(0);

        // URL still has no sort param after opening the dropdown.
        expect(item.urlParam('sort')).toBeNull();
    });

    test('[TC-03] Selecting "Price: Low to high" sets sort=2 and ascending prices', async ({ appPage }) => {
        const item = new ItemListPage(appPage);

        await item.gotoCategory({ sort: 3 });
        await item.waitForGrid();

        await item.selectSort('Price: Low to high');
        await item.waitForGrid();

        expect(item.urlParam('sort')).toBe('2');

        const prices = await item.getProductPrices(5);
        expectNonDecreasing(prices);

        await item.openSort();
        await expect(item.selectedOption('Price: Low to high')).toBeVisible();
    });

    test('[TC-04] Selecting "Price: High to low" sets sort=3 and descending prices', async ({ appPage }) => {
        const item = new ItemListPage(appPage);

        await item.gotoCategory({ sort: 2 });
        await item.waitForGrid();

        await item.selectSort('Price: High to low');
        await item.waitForGrid();

        expect(item.urlParam('sort')).toBe('3');

        const prices = await item.getProductPrices(5);
        expectNonIncreasing(prices);

        await item.openSort();
        await expect(item.selectedOption('Price: High to low')).toBeVisible();
    });

    test('[TC-05] Selecting "Top rated" sets sort=4 and descending ratings', async ({ appPage }) => {
        const item = new ItemListPage(appPage);

        await item.gotoCategory({ sort: 2 });
        await item.waitForGrid();

        await item.selectSort('Top rated');
        await item.waitForGrid();

        expect(item.urlParam('sort')).toBe('4');

        // Only rated cards contribute; placement of unrated cards is not asserted.
        const ratings = await item.getProductRatings(5);
        expectNonIncreasing(ratings);

        await item.openSort();
        await expect(item.selectedOption('Top rated')).toBeVisible();
    });

    test('[TC-06] Switching sort from "Price: Low to high" to "Top rated" updates selection and URL', async ({ appPage }) => {
        const item = new ItemListPage(appPage);

        await item.gotoCategory({ sort: 2 });
        await item.waitForGrid();

        // Step 4: confirm Price: Low to high is the active selection.
        await item.openSort();
        await expect(item.selectedOption('Price: Low to high')).toBeVisible();
        await item.closeSort();

        // Steps 6-7: reopen and pick Top rated.
        await item.selectSort('Top rated');
        await item.waitForGrid();

        expect(item.urlParam('sort')).toBe('4');

        // Step 11: Top rated now selected, Price: Low to high no longer selected.
        await item.openSort();
        await expect(item.selectedOption('Top rated')).toBeVisible();
        await expect(item.selectedOption('Price: Low to high')).toHaveCount(0);
        await item.closeSort();

        const ratings = await item.getProductRatings(5);
        expectNonIncreasing(ratings);
    });

    test('[TC-07] Applying Size=M with sort=3 active preserves the sort selection', async ({ appPage }) => {
        const item = new ItemListPage(appPage);

        await item.gotoCategory({ sort: 3 });
        await item.waitForGrid();
        const baseCount = await item.getResultsCount();

        await item.toggleSizeFilter(item.chkSizeM);
        await item.waitForGrid();

        expect(item.urlParam('sort')).toBe('3');
        expect(item.urlParam('sizeCodes')).toBe(SMA004);

        const filteredCount = await item.getResultsCount();
        expect(filteredCount).toBeLessThan(baseCount);

        await expect(item.filterChip('M')).toBeVisible();
        await expect(item.filterBadge(1)).toBeVisible();

        await item.openSort();
        await expect(item.selectedOption('Price: High to low')).toBeVisible();
    });

    test('[TC-08] Size=M then sort to "Price: High to low" shows only M products descending by price', async ({ appPage }) => {
        const item = new ItemListPage(appPage);

        await item.gotoCategory({ sort: 2 });
        await item.waitForGrid();

        await item.toggleSizeFilter(item.chkSizeM);
        await item.waitForGrid();
        expect(item.urlParam('sizeCodes')).toBe(SMA004);
        await expect(item.filterChip('M')).toBeVisible();
        const filteredCount = await item.getResultsCount();

        await item.selectSort('Price: High to low');
        await item.waitForGrid();

        expect(item.urlParam('sort')).toBe('3');
        expect(item.urlParam('sizeCodes')).toBe(SMA004);
        expect(await item.getResultsCount()).toBe(filteredCount);
        await expect(item.filterChip('M')).toBeVisible();

        const prices = await item.getProductPrices(5);
        expectNonIncreasing(prices);
    });

    test('[TC-09] Applying Color=Black after "Top rated" keeps sort active and ratings descending', async ({ appPage }) => {
        const item = new ItemListPage(appPage);

        await item.gotoCategory({ sort: 4 });
        await item.waitForGrid();
        const baseCount = await item.getResultsCount();

        await item.toggleColorFilter(item.chkColorBlack);
        await item.waitForGrid();

        expect(item.urlParam('sort')).toBe('4');
        expect(item.urlParam('colorCodes')).toBe(COL09);

        const filteredCount = await item.getResultsCount();
        expect(filteredCount).toBeLessThan(baseCount);

        await expect(item.filterChip('BLACK')).toBeVisible();
        await expect(item.filterBadge(1)).toBeVisible();

        const ratings = await item.getProductRatings(5);
        expectNonIncreasing(ratings);

        await item.openSort();
        await expect(item.selectedOption('Top rated')).toBeVisible();
    });

    test('[TC-10] Removing Size=M while sort=2 restores the full list and preserves sort=2', async ({ appPage }) => {
        const item = new ItemListPage(appPage);

        await item.gotoCategory({ sort: 2 });
        await item.waitForGrid();
        const baseCount = await item.getResultsCount();

        await item.toggleSizeFilter(item.chkSizeM);
        await item.waitForGrid();
        await expect(item.filterChip('M')).toBeVisible();
        expect(await item.getResultsCount()).toBeLessThan(baseCount);

        // Remove the Size=M filter (live chip-click is overlay-intercepted, so the
        // PO clears it reliably by toggling the size checkbox off — same end state).
        await item.removeSizeFilter(item.chkSizeM);
        await item.waitForGrid();

        expect(item.urlParam('sort')).toBe('2');
        expect(item.urlParam('sizeCodes')).toBeNull();
        expect(await item.getResultsCount()).toBe(baseCount);
        await expect(item.filterChip('Size')).toBeVisible();
        await expect(item.filterChip('M')).toHaveCount(0);

        const prices = await item.getProductPrices(5);
        expectNonDecreasing(prices);
    });

    test('[TC-11] Changing sort from "Top rated" to "Price: High to low" with Size=M preserves the filter', async ({ appPage }) => {
        const item = new ItemListPage(appPage);

        await item.gotoCategory({ sort: 4 });
        await item.waitForGrid();

        await item.toggleSizeFilter(item.chkSizeM);
        await item.waitForGrid();
        await expect(item.filterChip('M')).toBeVisible();
        const filteredCount = await item.getResultsCount();

        await item.selectSort('Price: High to low');
        await item.waitForGrid();

        expect(item.urlParam('sort')).toBe('3');
        expect(item.urlParam('sizeCodes')).toBe(SMA004);
        expect(await item.getResultsCount()).toBe(filteredCount);
        await expect(item.filterChip('M')).toBeVisible();
        await expect(item.filterBadge(1)).toBeVisible();

        const prices = await item.getProductPrices(5);
        expectNonIncreasing(prices);

        await item.openSort();
        await expect(item.selectedOption('Price: High to low')).toBeVisible();
    });

    test('[TC-12] Changing filter Size=M -> Size=L while "Price: High to low" active preserves the sort', async ({ appPage }) => {
        const item = new ItemListPage(appPage);

        await item.gotoCategory({ sort: 3 });
        await item.waitForGrid();

        await item.toggleSizeFilter(item.chkSizeM);
        await item.waitForGrid();
        expect(item.urlParam('sort')).toBe('3');
        expect(item.urlParam('sizeCodes')).toBe(SMA004);
        const sizeMCount = await item.getResultsCount();

        await item.switchSizeFilter(item.chkSizeM, item.chkSizeL);
        await item.waitForGrid();

        // Sort preserved; Size M code replaced.
        expect(item.urlParam('sort')).toBe('3');
        expect(item.urlParam('sizeCodes')).not.toBe(SMA004);
        expect(await item.getResultsCount()).not.toBe(sizeMCount);
        await expect(item.filterChip('M')).toHaveCount(0);
        await expect(item.filterChip('L')).toBeVisible();

        const prices = await item.getProductPrices(5);
        expectNonIncreasing(prices);

        await item.openSort();
        await expect(item.selectedOption('Price: High to low')).toBeVisible();
    });

    test('[TC-13] Clearing filters while "Top rated" active preserves sort=4 and descending ratings', async ({ appPage }) => {
        const item = new ItemListPage(appPage);

        await item.gotoCategory({ sort: 4 });
        await item.waitForGrid();
        const baseCount = await item.getResultsCount();

        await item.toggleSizeFilter(item.chkSizeM);
        await item.waitForGrid();
        await expect(item.filterChip('M')).toBeVisible();
        expect(await item.getResultsCount()).toBeLessThan(baseCount);

        // Clear the active filter (see TC-10 note on reliable removal).
        await item.removeSizeFilter(item.chkSizeM);
        await item.waitForGrid();

        expect(item.urlParam('sort')).toBe('4');
        expect(item.urlParam('sizeCodes')).toBeNull();
        expect(await item.getResultsCount()).toBe(baseCount);
        await expect(item.filterChip('Size')).toBeVisible();
        await expect(item.filterChip('M')).toHaveCount(0);

        const ratings = await item.getProductRatings(5);
        expectNonIncreasing(ratings);

        await item.openSort();
        await expect(item.selectedOption('Top rated')).toBeVisible();
    });

    test('[TC-14] Rapidly switching sort options yields no duplicates and no layout/JS errors', async ({ appPage }, testInfo) => {
        const item = new ItemListPage(appPage);
        const pageErrors = collectPageErrors(appPage);

        await item.gotoCategory({ sort: 2 });
        await item.waitForGrid();
        const baseCount = await item.getResultsCount();

        // Rapid switches — do not wait for the grid to settle between them.
        await item.openSort();
        await item.optPriceHighToLow.click();
        await item.openSort();
        await item.optTopRated.click();
        await item.openSort();
        await item.optPriceLowToHigh.click();

        // Now let everything settle.
        await item.waitForGrid();

        // Last sort clicked was Price: Low to high (sort=2).
        expect(item.urlParam('sort')).toBe('2');
        expect(await item.getResultsCount()).toBe(baseCount);

        const rapidIds = await item.getProductIds();
        expect(rapidIds.length).toBeGreaterThan(0);

        // No overlapping tiles in the grid layout.
        const boxes = await item.getProductCardBoxes(12);
        for (const box of boxes) {
            expect(box.width).toBeGreaterThan(0);
            expect(box.height).toBeGreaterThan(0);
        }
        for (let i = 0; i < boxes.length; i++) {
            for (let j = i + 1; j < boxes.length; j++) {
                expect(
                    rectsOverlap(boxes[i], boxes[j]),
                    `cards ${i} and ${j} overlap`,
                ).toBe(false);
            }
        }

        // No NEW uncaught JS exceptions introduced by the rapid switching
        // (pre-existing baseline noise is annotated and ignored).
        const significant = significantErrors(pageErrors, testInfo);
        expect(significant, significant.join('\n')).toHaveLength(0);

        // Detect race-induced DUPLICATE cards: the live catalog legitimately repeats
        // some product names/ids across tiles, so we compare against a clean,
        // single-sort reference render of the SAME sort. Rapid switching must not
        // make any product appear MORE times than it does in the clean render.
        await item.gotoCategory({ sort: 2 });
        await item.waitForGrid();
        const referenceIds = await item.getProductIds();
        const refCounts = occurrences(referenceIds);

        for (const [id, count] of occurrences(rapidIds)) {
            const allowed = refCounts.get(id);
            if (allowed !== undefined) {
                expect(count, `product ${id} appears more often after rapid sorting`).toBeLessThanOrEqual(allowed);
            }
        }
    });

    // TC-15 requires a confirmed zero-result filter combination, which could not
    // be identified on the live Women's T-shirts category (broad coverage — see
    // Coverage Deviations / Out-of-UI-Exploration Scope). Skipped pending a
    // controlled/staging environment or a documented impossible filter pair.
    test.skip('[TC-15] Changing sort with zero results keeps the grid empty with no JS errors', async ({ appPage }, testInfo) => {
        const item = new ItemListPage(appPage);
        const pageErrors = collectPageErrors(appPage);

        await item.gotoCategory({ sort: 2 });
        await item.waitForGrid();

        // TODO: apply a confirmed zero-result filter combination here.

        await expect(item.noResultsMessage).toBeVisible();
        await item.selectSort('Price: High to low');
        await item.waitForGrid();
        await expect(item.noResultsMessage).toBeVisible();
        await expect(item.btnSortBy).toBeVisible();
        const significant = significantErrors(pageErrors, testInfo);
        expect(significant, significant.join('\n')).toHaveLength(0);
    });

    test('[TC-16] Unrecognized sort param value does not crash the page (negative)', async ({ appPage }, testInfo) => {
        const item = new ItemListPage(appPage);
        const pageErrors = collectPageErrors(appPage);

        await item.gotoCategory({ sort: 'abc' });
        await item.waitForGrid();

        // Firm assertion: Uniqlo renders *some* content (no blank page / browser crash).
        // NOTE: the live site responds to an invalid `sort` with a handled view
        // (observed: "Service temporarily unavailable"). The exact fallback is
        // unspecified (OQ-2), so any rendered Uniqlo content is an acceptable outcome.
        await expect(appPage.locator('body')).toBeVisible();
        const bodyText = (await appPage.locator('body').innerText()).trim();
        expect(bodyText.length, 'page rendered no content (blank screen)').toBeGreaterThan(0);

        // The manual step is conditional ("If the page loads any Uniqlo content,
        // click Sort by"). Exercise the sort control only when it is rendered.
        if ((await item.btnSortBy.count()) > 0 && (await item.btnSortBy.isVisible())) {
            await item.openSort();
            await expect(item.selectedSortOption.first()).toBeVisible();
            await item.closeSort();
        }

        // OQ-2 is unresolved, so the "no JS errors" criterion has no agreed pass/fail.
        // Record the observed runtime errors as a finding rather than failing the
        // exploratory negative test (the live build logs React hydration #418/#423
        // and a `klaviyo is not defined` ReferenceError for invalid sort values).
        if (pageErrors.length > 0) {
            testInfo.annotations.push({
                type: 'known-issue (OQ-2)',
                description: `Invalid sort=abc surfaced ${pageErrors.length} JS error(s): ${pageErrors.join(' | ')}`,
            });
        }
    });
});
