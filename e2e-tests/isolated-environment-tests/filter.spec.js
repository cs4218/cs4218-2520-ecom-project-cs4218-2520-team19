//Varatharaju Mithuna, A0281223N
// E2E tests containing filter
import { test , expect } from '@playwright/test';

const testUser = {
    name: 'uitestorder',
    email: 'uitestorder@email.com',
    password: 'password123',
    phone: '123456789',
    address: 'uitestorder address',
    answer: 'tennis',
};

test.describe('Filter and add to card flow', () => {
    test.beforeEach(async ({request, page}) => {
        // Reset the test database and add products
        const resetRes = await request.post('/api/v1/test/reset');
        await expect(resetRes.ok()).toBeTruthy();

        const registerRes = await request.post('/api/v1/auth/register', {
            data: testUser,
        });
        expect([201, 409]).toContain(registerRes.status());

        const prodRes = await request.post('/api/v1/test//seed-allProducts');
        await expect(prodRes.ok()).toBeTruthy();

        // Log in via browser
        await page.goto('/login');
        await page.getByRole('textbox', {name: 'Enter Your Email'}).fill(testUser.email);
        await page.getByRole('textbox', {name: 'Enter Your Password'}).fill(testUser.password);
        await page.getByRole('button', {name: 'LOGIN'}).click();
    });
    test('Filter by category & price, add to cart', async ({ page }) => {
        await page.goto('/');

        await page.getByRole('checkbox', { name: 'Electronics' }).check();

        await page.getByRole('radio', { name: '$100 or more' }).check(); // adjust to match Prices

        await page.pause();

        const productName = 'Laptop PW_TEST';
        const productCard = page.getByRole('heading', { name: productName }).locator('..').locator('..');
        await expect(productCard).toBeVisible();

        await productCard.getByRole('button', { name: 'ADD TO CART' }).click();

        await page.goto('/cart');

        //verify order is in cart
        await expect(page.getByText(productName)).toBeVisible();
    });
    test('Filter by category only and add to cart', async ({ page }) => {

        await page.goto('/');

        await page.getByRole('checkbox', { name: 'Books' }).check();

        const productName = 'Book PW_TEST';

        const productCard = page.getByRole('heading', { name: productName })
            .locator('..')
            .locator('..');

        await expect(productCard).toBeVisible();

        await productCard.getByRole('button', { name: 'ADD TO CART' }).click();

        await page.goto('/cart');

        await expect(page.getByText(productName)).toBeVisible();

    });
    test('Filter by price only and add to cart', async ({ page }) => {

        await page.goto('/');

        await page.getByRole('radio', { name: '$20 to 39' }).check();

        const productName = 'Book PW_TEST';

        const productCard = page.getByRole('heading', { name: productName })
            .locator('..')
            .locator('..');

        await expect(productCard).toBeVisible();

        await productCard.getByRole('button', { name: 'ADD TO CART' }).click();

        await page.goto('/cart');

        await expect(page.getByText(productName)).toBeVisible();

    });
    test('Filter by price and add multiple items', async ({ page }) => {

        await page.goto('/');

        await page.getByRole('radio', { name: '$100 or more' }).check();

        const products = [
            'Laptop PW_TEST',
            'Smartphone PW_TEST'
        ];

        // Verify each product is visible
        for (const name of products) {
            await expect(page.getByText(name)).toBeVisible();
        }

        // Add each product to the cart
        for (const name of products) {
            const card = page.getByRole('heading', { name })
                .locator('..')
                .locator('..');

            await card.getByRole('button', { name: 'ADD TO CART' }).click();
        }

        await page.goto('/cart');

        // Verify all filtered products are in the cart
        for (const name of products) {
            await expect(page.getByText(name)).toBeVisible();
        }
    });
    test('Filter multiple categories and add to cart', async ({ page }) => {

        await page.goto('/');

        await page.getByRole('checkbox', { name: 'Electronics' }).check();
        await page.getByRole('checkbox', { name: 'Home' }).check();

        const products = [
            'Laptop PW_TEST',
            'Smartphone PW_TEST',
            'Blender PW_TEST'
        ];

        // Verify each product is visible
        for (const name of products) {
            await expect(page.getByText(name)).toBeVisible();
        }

        // Add each product to the cart
        for (const name of products) {
            const card = page.getByRole('heading', { name })
                .locator('..') // product card container
                .locator('..');

            await card.getByRole('button', { name: 'ADD TO CART' }).click();
        }

        await page.goto('/cart');

        // Verify all products are in the cart
        for (const name of products) {
            await expect(page.getByText(name)).toBeVisible();
        }
    });
    test('Filter category + add multiple items', async ({ page }) => {

        await page.goto('/');

        await page.getByRole('checkbox', { name: 'Electronics' }).check();

        const products = [
            'Laptop PW_TEST',
            'Smartphone PW_TEST'
        ];

        for (const name of products) {

            const card = page.getByRole('heading', { name })
                .locator('..')
                .locator('..');

            await card.getByRole('button', { name: 'ADD TO CART' }).click();

        }

        await page.goto('/cart');

        for (const name of products) {
            await expect(page.getByText(name)).toBeVisible();
        }

    });
    test('No filter and view all products', async ({ page }) => {

        await page.goto('/');

        await expect(page.getByText('Smartphone PW_TEST')).toBeVisible();
        await expect(page.getByText('Laptop PW_TEST')).toBeVisible();
        await expect(page.getByText('Book PW_TEST')).toBeVisible();
        await expect(page.getByText('T-Shirt PW_TEST')).toBeVisible();
        await expect(page.getByText('Blender PW_TEST')).toBeVisible();

    });
    test('No filter and add multiple products to cart', async ({ page }) => {

        await page.goto('/');

        const products = [
            'Laptop PW_TEST',
            'Book PW_TEST',
            'Blender PW_TEST'
        ];

        for (const name of products) {

            const card = page.getByRole('heading', { name })
                .locator('..')
                .locator('..');

            await card.getByRole('button', { name: 'ADD TO CART' }).click();

        }

        await page.goto('/cart');

        for (const name of products) {
            await expect(page.getByText(name)).toBeVisible();
        }

    });
});

test.describe('Filter & add to cart as non-logged-in user', () => {

    test.beforeEach(async ({request, page}) => {
        // Reset the test database and add products
        const resetRes = await request.post('/api/v1/test/reset');
        await expect(resetRes.ok()).toBeTruthy();

        const prodRes = await request.post('/api/v1/test/seed-allProducts');
        await expect(prodRes.ok()).toBeTruthy();

        // No login performed — user is non-logged-in
        await page.goto('/', { waitUntil: 'domcontentloaded' });
    });

    test('Filter by category & price, add to cart disabled checkout', async ({page}) => {
        await page.getByRole('checkbox', {name: 'Electronics'}).check();
        await page.getByRole('radio', {name: '$100 or more'}).check();

        const productName = 'Laptop PW_TEST';
        const productCard = page.getByRole('heading', {name: productName}).locator('..').locator('..');
        await expect(productCard).toBeVisible();

        // Add to cart should still work
        await productCard.getByRole('button', {name: 'ADD TO CART'}).click();

        await page.goto('/cart');

        // Verify product is in cart
        await expect(page.getByText(productName)).toBeVisible();

        // But checkout is disabled with message
        await expect(
            page.getByRole('button', { name: /please login to checkout/i })
        ).toBeVisible();
    });
    test('Filter by category only and add to cart', async ({ page }) => {
        await page.getByRole('checkbox', { name: 'Books' }).check();
        const productName = 'Book PW_TEST';
        const productCard = page.getByRole('heading', { name: productName }).locator('..').locator('..');
        await expect(productCard).toBeVisible();

        await productCard.getByRole('button', { name: 'ADD TO CART' }).click();

        await page.goto('/cart');
        await expect(page.getByText(productName)).toBeVisible();
        await expect(page.getByRole('button', { name: /please login to checkout/i })).toBeVisible();
    });

    test('Filter by price only and add to cart', async ({ page }) => {
        await page.getByRole('radio', { name: '$20 to 39' }).check();
        const productName = 'Book PW_TEST';
        const productCard = page.getByRole('heading', { name: productName }).locator('..').locator('..');
        await expect(productCard).toBeVisible();

        await productCard.getByRole('button', { name: 'ADD TO CART' }).click();

        await page.goto('/cart');
        await expect(page.getByText(productName)).toBeVisible();
        await expect(page.getByRole('button', { name: /please login to checkout/i })).toBeVisible();
    });

    test('Filter multiple categories and add multiple items', async ({ page }) => {
        await page.getByRole('checkbox', { name: 'Electronics' }).check();
        await page.getByRole('checkbox', { name: 'Home' }).check();

        const products = ['Laptop PW_TEST', 'Smartphone PW_TEST', 'Blender PW_TEST'];

        for (const name of products) {
            const card = page.getByRole('heading', { name }).locator('..').locator('..');
            await expect(card).toBeVisible();
            await card.getByRole('button', { name: 'ADD TO CART' }).click();
        }

        await page.goto('/cart');
        for (const name of products) {
            await expect(page.getByText(name)).toBeVisible();
        }

        await expect(page.getByRole('button', { name: /please login to checkout/i })).toBeVisible();
    });

    test('Add multiple products without any filter', async ({ page }) => {
        const products = ['Laptop PW_TEST', 'Book PW_TEST', 'Blender PW_TEST'];

        for (const name of products) {
            const card = page.getByRole('heading', { name }).locator('..').locator('..');
            await expect(card).toBeVisible();
            await card.getByRole('button', { name: 'ADD TO CART' }).click();
        }

        await page.goto('/cart');
        for (const name of products) {
            await expect(page.getByText(name)).toBeVisible();
        }

        await expect(page.getByRole('button', { name: /please login to checkout/i })).toBeVisible();
    });

    test('View all products and ensure cart is disabled for checkout', async ({ page }) => {
        const allProducts = [
            'Smartphone PW_TEST',
            'Laptop PW_TEST',
            'Book PW_TEST',
            'T-Shirt PW_TEST',
            'Blender PW_TEST'
        ];

        for (const name of allProducts) {
            const card = page.getByRole('heading', { name }).locator('..').locator('..');
            await expect(card).toBeVisible();
            await card.getByRole('button', { name: 'ADD TO CART' }).click();
        }

        await page.goto('/cart');
        for (const name of allProducts) {
            await expect(page.getByText(name)).toBeVisible();
        }

        await expect(page.getByRole('button', { name: /please login to checkout/i })).toBeVisible();
    });
});