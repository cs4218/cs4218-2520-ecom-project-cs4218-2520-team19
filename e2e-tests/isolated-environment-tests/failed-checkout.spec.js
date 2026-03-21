// Sun Zhiyuan Felix (A0272474Y)

import { test, expect } from '@playwright/test';
import { seededProducts } from './seededProducts.js';

const testUser = {
    name: 'uitestcheckout',
    email: 'uitestcheckout@email.com',
    password: 'password123',
    phone: '123456789',
    address: 'uitestcheckout address',
    answer: 'tennis',
};

test.beforeAll(async ({ request }) => {
    const registerRes = await request.post('/api/v1/auth/register', {
        data: testUser,
    });
    expect([201, 409]).toContain(registerRes.status());
});

test.beforeEach(async ({ request, page }) => {
    // Reset the test database and add products
    const resetRes = await request.post('/api/v1/test/reset');
    await expect(resetRes.ok()).toBeTruthy();

    const seedRes = await request.post('/api/v1/test/seed-products');
    await expect(seedRes.ok()).toBeTruthy();

    await page.goto('/', { waitUntil: 'domcontentloaded' });
});

test.describe("Can't checkout", () => {
    test("checking out when not logged in prompts login", async ({ page }) => {
        // Add products to cart
        await page.getByRole('button', { name: 'ADD TO CART' }).first().click();
        await page.getByRole('button', { name: 'ADD TO CART' }).nth(1).click();
        // Attempt to checkout
        await page.getByRole('link', { name: 'Cart' }).click();

        await expect(page.getByRole('button', { name: 'Make Payment' })).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Please Login to checkout' })).toBeVisible();
    });

    test("login prompt redirects to login page", async ({ page }) => {
        // Add products to cart
        await page.getByRole('button', { name: 'ADD TO CART' }).first().click();
        await page.getByRole('button', { name: 'ADD TO CART' }).nth(1).click();
        // Attempt to checkout
        await page.getByRole('link', { name: 'Cart' }).click();
        await page.getByRole('button', { name: 'Please Login to checkout' }).click();

        await expect(page.getByRole('heading', { name: 'LOGIN FORM' })).toBeVisible();
    });

    test("checking out when not logged in preserves cart after login", async ({ page }) => {
        // Add products to cart
        await page.getByRole('button', { name: 'ADD TO CART' }).first().click();
        await page.getByRole('button', { name: 'ADD TO CART' }).nth(1).click();
        // Attempt to checkout
        await page.getByRole('link', { name: 'Cart' }).click();
        await page.getByRole('button', { name: 'Please Login to checkout' }).click();
        // Login
        await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(testUser.email);
        await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(testUser.password);
        await page.getByRole('button', { name: 'LOGIN' }).click();
        await page.waitForURL('**/');
        // Navigate back to cart
        await page.getByRole('link', { name: 'Cart' }).click();

        // Expect products to still be in cart
        await expect(page.getByText(seededProducts[0].name)).toBeVisible();
        await expect(page.getByText(seededProducts[1].name)).toBeVisible();
    });

    test("cannot check out with empty cart", async ({ page }) => {
        // Login
        await page.getByRole('link', { name: 'Login' }).click();
        await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(testUser.email);
        await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(testUser.password);
        await page.getByRole('button', { name: 'LOGIN' }).click();
        // Navigate to cart
        await page.getByRole('link', { name: 'Cart' }).click();

        await expect(page.getByText('Your Cart Is Empty')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Make Payment' })).toHaveCount(0);
    });
});