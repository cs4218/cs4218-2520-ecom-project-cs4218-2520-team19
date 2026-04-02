// Teo Kim Han, A0273551E
import { test, expect } from '@playwright/test';
import { testUser } from './test-user.js';

test('search by full name with all lower case returns correct product', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.getByRole('searchbox', { name: 'Search' }).fill('smartphone');
    await page.getByRole('button', { name: 'Search' }).click();

    await page.waitForURL('/search', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Smartphone' })).toBeVisible();
});

test('search by full name with all upper case returns correct product', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.getByRole('searchbox', { name: 'Search' }).fill('SMARTPHONE');
    await page.getByRole('button', { name: 'Search' }).click();

    await page.waitForURL('/search', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Smartphone' })).toBeVisible();
});

test('search by partial name with multiple matches returns all matching products', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.getByRole('searchbox', { name: 'Search' }).fill('book');
    await page.getByRole('button', { name: 'Search' }).click();

    await page.waitForURL('/search', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Textbook' })).toBeVisible();
});

test('search by a dash returns smartphone and nus t-shirt', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.getByRole('searchbox', { name: 'Search' }).fill('-');
    await page.getByRole('button', { name: 'Search' }).click();

    await page.waitForURL('/search', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Smartphone' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'NUS T-shirt' })).toBeVisible();
});

test('search with no matches returns no products', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.getByRole('searchbox', { name: 'Search' }).fill('no match');
    await page.getByRole('button', { name: 'Search' }).click();

    await page.waitForURL('/search', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('No Products found')).toBeVisible();
});

test('search by partial match of description returns correct products with matching description', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.getByRole('searchbox', { name: 'Search' }).fill('best');
    await page.getByRole('button', { name: 'Search' }).click();

    await page.waitForURL('/search', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Novel' })).toBeVisible();
});

test('search by category name does not return the products in that category', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await page.getByRole('searchbox', { name: 'Search' }).fill('clothing');
    await page.getByRole('button', { name: 'Search' }).click();

    await page.waitForURL('/search', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('No Products found')).toBeVisible();
});

test.describe('Search should work correctly from different pages', async () => {
    test('search is not limited to category from category page', async ({ page }) => {
        await page.goto('/categories/clothing');

        await page.getByRole('searchbox', { name: 'Search' }).fill('Smartphone');
        await page.getByRole('button', { name: 'Search' }).click();

        await page.waitForURL('/search', { waitUntil: 'domcontentloaded' });
        await expect(page.getByRole('heading', { name: 'Smartphone' })).toBeVisible();
    });

    test('search works from dashboard page', async ({ page }) => {
        await page.goto('/dashboard/user');

        await page.getByRole('searchbox', { name: 'Search' }).fill('Smartphone');
        await page.getByRole('button', { name: 'Search' }).click();

        await page.waitForURL('/search', { waitUntil: 'domcontentloaded' });
        await expect(page.getByRole('heading', { name: 'Smartphone' })).toBeVisible();
    });

    test('search works from cart page', async ({ page }) => {
        await page.goto('/cart');

        await page.getByRole('searchbox', { name: 'Search' }).fill('Smartphone');
        await page.getByRole('button', { name: 'Search' }).click();

        await page.waitForURL('/search', { waitUntil: 'domcontentloaded' });
        await expect(page.getByRole('heading', { name: 'Smartphone' })).toBeVisible();
    });
});

test('search should work even when not logged in', async ({ page }) => {
    await test.step('Logout the user', async () => {
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await page.getByRole('button', { name: testUser.name }).click();
        await page.getByRole('link', { name: 'Logout' }).click();
        await expect(page.getByText('Logout Successfully')).toBeVisible();
    });

    await page.getByRole('searchbox', { name: 'Search' }).fill('Smartphone');
    await page.getByRole('button', { name: 'Search' }).click();

    await page.waitForURL('/search', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Smartphone' })).toBeVisible();
});