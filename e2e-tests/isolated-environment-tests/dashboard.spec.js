//Varatharaju Mithuna
// E2E tests for dashboard related flow
import { test , expect } from '@playwright/test';

const testUser = {
    name: 'uitestorder',
    email: 'uitestorder@email.com',
    password: 'password123',
    phone: '123456789',
    address: 'uitestorder address',
    answer: 'tennis',
};

// Helper to create a fresh unique user
function generateUniqueUser() {
    const timestamp = Date.now();
    return {
        name: `uitestuser${timestamp}`,
        email: `uitestuser${timestamp}@email.com`,
        password: 'password123',
        phone: '123456789',
        address: 'Test Address',
        answer: 'tennis',
    };
}

test.describe('Orders dashboard tests', () => {
    test.beforeEach(async ({request, page}) => {
        // Reset the test database and add products
        const resetRes = await request.post('/api/v1/test/reset');
        await expect(resetRes.ok()).toBeTruthy();

        const registerRes = await request.post('/api/v1/auth/register', {
            data: testUser,
        });
        expect([201, 409]).toContain(registerRes.status());

        const seedRes = await request.post('/api/v1/test/seed-orders');
        await expect(seedRes.ok()).toBeTruthy();

        // Log in via browser
        await page.goto('/login');
        await page.getByRole('textbox', {name: 'Enter Your Email'}).fill(testUser.email);
        await page.getByRole('textbox', {name: 'Enter Your Password'}).fill(testUser.password);
        await page.getByRole('button', {name: 'LOGIN'}).click();
    });

    test('Dashboard displays user info after login', async ({page}) => {
        // Go to dashboard (logged-in user)
        await page.goto('/dashboard/user');
        await page.waitForLoadState('networkidle');

        // Verify user info displayed
        const dashboard = page.locator('div.dashboard');
        await dashboard.waitFor({ state: 'visible', timeout: 15000 });

        // Check userName exactly
        await expect(dashboard.getByRole('heading', {name: 'uitestorder', exact: true})).toBeVisible();

        // Check email exactly
        await expect(dashboard.getByRole('heading', {name: 'uitestorder@email.com', exact: true})).toBeVisible();

        // Check address exactly
        await expect(dashboard.getByRole('heading', {name: 'uitestorder address', exact: true})).toBeVisible();
    });

    test('Login -> dashboard -> view all past orders', async ({page}) => {
        // Go to dashboard
        await page.goto('/dashboard/user');
        await page.waitForLoadState('networkidle');

        // Verify user info displayed
        const dashboard = page.locator('div.dashboard');
        await dashboard.waitFor({ state: 'visible', timeout: 15000 });

        // Navigate to Orders
        await page.getByRole('link', {name: 'Orders'}).click();

        const firstOrderRow = page.locator('div.dashboard table tbody tr').first();
        await expect(firstOrderRow.getByRole('cell', {name: 'uitestorder'})).toBeVisible();
        await expect(firstOrderRow.getByRole('cell', {name: 'Delivered'})).toBeVisible();

        // For product info
        const firstOrderContainer = page.locator('div.dashboard div.border.shadow').first();
        await firstOrderContainer.waitFor({state: 'visible', timeout: 10000});

        // Assert all products in seeded order
        const products = [
            {name: 'Laptop PW_TEST', description: 'Gaming laptop', price: 1000},
            {name: 'Smartphone PW_TEST', description: 'Latest smartphone', price: 300},
        ];

        for (const p of products) {
            await expect(firstOrderContainer.getByText(p.name)).toBeVisible();
            await expect(firstOrderContainer.getByText(p.description)).toBeVisible();
            // Flexible price match
            await expect(firstOrderContainer.getByText(new RegExp(p.price.toString()))).toBeVisible();
        }
    });
});
test.describe('Profile management tests', () => {

    let freshUser;

    test.beforeEach(async ({ request, page }) => {
        // Create a fresh user for each profile test
        freshUser = generateUniqueUser();

        // Register the fresh user
        const registerRes = await request.post('/api/v1/auth/register', {
            data: freshUser,
        });
        expect([201, 409]).toContain(registerRes.status());

        // Log in
        await page.goto('/login');
        await page.getByRole('textbox', { name: 'Enter Your Email' }).fill(freshUser.email);
        await page.getByRole('textbox', { name: 'Enter Your Password' }).fill(freshUser.password);
        await page.getByRole('button', { name: 'LOGIN' }).click();
    });


    test('Can update profile and view in dashboard', async ({ page }) => {
        // Go to dashboard
        await page.goto('/dashboard/user');
        const dashboard = page.locator('div.dashboard');
        await dashboard.waitFor({ state: 'visible', timeout: 15000 });

        // Before clicking Profile link
        await page.waitForLoadState('networkidle');
        const profileLink = page.getByRole('link', { name: 'Profile' });
        await profileLink.waitFor({ state: 'visible', timeout: 15000 });
        await profileLink.click();

        // Wait for profile page title
        await page.locator('h4.title', { hasText: 'USER PROFILE' }).waitFor({ timeout: 15000 });

        // Verify Profile page loaded
        await expect(page.locator('h4.title')).toHaveText('USER PROFILE');

        // Fill new info
        const newName = 'updated_' + freshUser.name;
        const newPhone = '987654321';
        const newAddress = 'Updated Address 123';

        await page.locator('input[placeholder="Enter Your Name"]').fill(newName);
        await page.locator('input[placeholder="Enter Your Phone"]').fill(newPhone);
        await page.locator('input[placeholder="Enter Your Address"]').fill(newAddress);
        await page.locator('input[placeholder="Enter Your Password"]').fill('newpassword123');

        // Click UPDATE
        await page.getByRole('button', { name: 'UPDATE' }).click();

        // Expect toast success message
        await expect(page.locator('text=Profile Updated Successfully')).toBeVisible();

        // Go to dashboard
        await page.goto('/dashboard/user');

        // Verify updated info in dashboard card
        const dashboardCard = page.locator('div.dashboard .card');
        await dashboardCard.waitFor({ state: 'visible', timeout: 15000 });
        await expect(dashboardCard.getByRole('heading', { name: newName, exact: true })).toBeVisible();
        await expect(dashboardCard.getByRole('heading', { name: newAddress, exact: true })).toBeVisible();
    });
    test('Cannot update invalid phone', async ({ page }) => {
        await page.goto('/dashboard/user');
        const dashboard = page.locator('div.dashboard');
        await dashboard.waitFor({ state: 'visible', timeout: 15000 });

        // Before clicking Profile link
        await page.waitForLoadState('networkidle');
        const profileLink = page.getByRole('link', { name: 'Profile' });
        await profileLink.waitFor({ state: 'visible', timeout: 15000 });
        await profileLink.click();

        // Wait for profile page title
        await page.locator('h4.title', { hasText: 'USER PROFILE' }).waitFor({ timeout: 15000 });

        // Verify Profile page loaded
        await expect(page.locator('h4.title')).toHaveText('USER PROFILE');

        await page.locator('input[placeholder="Enter Your Phone"]').fill('hai');
        await page.getByRole('button', { name: 'UPDATE' }).click();

        await expect(page.locator('text="Phone number should be numeric"')).toBeVisible();
    });
    test('Cannot update password = 5  characters', async ({ page }) => {
        await page.goto('/dashboard/user');
        const dashboard = page.locator('div.dashboard');
        await dashboard.waitFor({ state: 'visible', timeout: 15000 });

        // Before clicking Profile link
        await page.waitForLoadState('networkidle');
        const profileLink = page.getByRole('link', { name: 'Profile' });
        await profileLink.waitFor({ state: 'visible', timeout: 15000 });
        await profileLink.click();

        // Wait for profile page title
        await page.locator('h4.title', { hasText: 'USER PROFILE' }).waitFor({ timeout: 15000 });

        // Verify Profile page loaded
        await expect(page.locator('h4.title')).toHaveText('USER PROFILE');

        await page.locator('input[placeholder="Enter Your Password"]').fill('12345');
        await page.getByRole('button', { name: 'UPDATE' }).click();

        await expect(page.locator('text="Password is required and should be 6 characters long"')).toBeVisible();
    });
    test('Can update password = 6 characters', async ({ page }) => {
        // Go to dashboard
        await page.goto('/dashboard/user');
        const dashboard = page.locator('div.dashboard');
        await dashboard.waitFor({ state: 'visible', timeout: 15000 });

        // Before clicking Profile link
        await page.waitForLoadState('networkidle');
        const profileLink = page.getByRole('link', { name: 'Profile' });
        await profileLink.waitFor({ state: 'visible', timeout: 15000 });
        await profileLink.click();

        // Wait for profile page title
        await page.locator('h4.title', { hasText: 'USER PROFILE' }).waitFor({ timeout: 15000 });

        // Verify Profile page loaded
        await expect(page.locator('h4.title')).toHaveText('USER PROFILE');

        // Fill new info
        await page.locator('input[placeholder="Enter Your Password"]').fill('sixsix');

        // Click UPDATE
        await page.getByRole('button', { name: 'UPDATE' }).click();

        // Expect toast success message
        await expect(page.locator('text=Profile Updated Successfully')).toBeVisible();
    });

    test('Can update password = 7 characters', async ({ page }) => {
        // Go to dashboard
        await page.goto('/dashboard/user');
        const dashboard = page.locator('div.dashboard');
        await dashboard.waitFor({ state: 'visible', timeout: 15000 });

        // Before clicking Profile link
        await page.waitForLoadState('networkidle');
        const profileLink = page.getByRole('link', { name: 'Profile' });
        await profileLink.waitFor({ state: 'visible', timeout: 15000 });
        await profileLink.click();

        // Wait for profile page title
        await page.locator('h4.title', { hasText: 'USER PROFILE' }).waitFor({ timeout: 15000 });

        // Verify Profile page loaded
        await expect(page.locator('h4.title')).toHaveText('USER PROFILE');

        // Fill new info
        await page.locator('input[placeholder="Enter Your Password"]').fill('seven77');

        // Click UPDATE
        await page.getByRole('button', { name: 'UPDATE' }).click();

        // Expect toast success message
        await expect(page.locator('text=Profile Updated Successfully')).toBeVisible();
    });

    test('No update and dashboard remains the same', async ({ page }) => {
        await page.goto('/dashboard/user');
        const dashboard = page.locator('div.dashboard');
        await dashboard.waitFor({ state: 'visible', timeout: 15000 });

        // Before clicking Profile link
        await page.waitForLoadState('networkidle');
        const profileLink = page.getByRole('link', { name: 'Profile' });
        await profileLink.waitFor({ state: 'visible', timeout: 15000 });
        await profileLink.click();

        // Wait for profile page title
        await page.locator('h4.title', { hasText: 'USER PROFILE' }).waitFor({ timeout: 15000 });

        // Verify Profile page loaded
        await expect(page.locator('h4.title')).toHaveText('USER PROFILE');

        // Get current values
        const currentName = await page.locator('input[placeholder="Enter Your Name"]').inputValue();
        const currentAddress = await page.locator('input[placeholder="Enter Your Address"]').inputValue();

        // Click update without changing anything
        await page.getByRole('button', { name: 'UPDATE' }).click();
        await expect(page.locator('text=Profile Updated Successfully')).toBeVisible();

        // Verify dashboard
        await page.goto('/dashboard/user');
        const dashboardCard = page.locator('div.dashboard');
        await dashboardCard.waitFor({ state: 'visible', timeout: 15000 });
        await expect(dashboardCard.getByRole('heading', { name: currentName, exact: true })).toBeVisible();
        await expect(dashboardCard.getByRole('heading', { name: currentAddress, exact: true })).toBeVisible();
    });

    test('Empty fields revert to old profile values', async ({ page }) => {
        await page.goto('/dashboard/user');
        const dashboard = page.locator('div.dashboard');
        await dashboard.waitFor({ state: 'visible', timeout: 15000 });

        // Before clicking Profile link
        await page.waitForLoadState('networkidle');
        const profileLink = page.getByRole('link', { name: 'Profile' });
        await profileLink.waitFor({ state: 'visible', timeout: 15000 });
        await profileLink.click();

        // Wait for profile page title
        await page.locator('h4.title', { hasText: 'USER PROFILE' }).waitFor({ timeout: 15000 });

        // Verify Profile page loaded
        await expect(page.locator('h4.title')).toHaveText('USER PROFILE');

        // Capture old values first
        const oldName = await page.locator('input[placeholder="Enter Your Name"]').inputValue();
        const oldPhone = await page.locator('input[placeholder="Enter Your Phone"]').inputValue();
        const oldAddress = await page.locator('input[placeholder="Enter Your Address"]').inputValue();

        // Clear fields
        await page.locator('input[placeholder="Enter Your Name"]').fill('');
        await page.locator('input[placeholder="Enter Your Phone"]').fill('');
        await page.locator('input[placeholder="Enter Your Address"]').fill('');

        await page.getByRole('button', { name: 'UPDATE' }).click();
        await expect(page.locator('text=Profile Updated Successfully')).toBeVisible();

        // Fields should revert to old values
        const nameValue = await page.locator('input[placeholder="Enter Your Name"]').inputValue();
        const phoneValue = await page.locator('input[placeholder="Enter Your Phone"]').inputValue();
        const addressValue = await page.locator('input[placeholder="Enter Your Address"]').inputValue();

        expect(nameValue).toBe(oldName);
        expect(phoneValue).toBe(oldPhone);
        expect(addressValue).toBe(oldAddress);
    });

    test('Partial update profile and view', async ({ page }) => {
        await page.goto('/dashboard/user');
        const dashboard = page.locator('div.dashboard');
        await dashboard.waitFor({ state: 'visible', timeout: 15000 });

        // Before clicking Profile link
        await page.waitForLoadState('networkidle');
        const profileLink = page.getByRole('link', { name: 'Profile' });
        await profileLink.waitFor({ state: 'visible', timeout: 15000 });
        await profileLink.click();

        // Wait for profile page title
        await page.locator('h4.title', { hasText: 'USER PROFILE' }).waitFor({ timeout: 15000 });

        // Verify Profile page loaded
        await expect(page.locator('h4.title')).toHaveText('USER PROFILE');

        const partialName = 'Partial Update Name';
        const partialPhone = '111222333';

        // Capture old address to verify it stays the same
        const oldAddress = await page.locator('input[placeholder="Enter Your Address"]').inputValue();

        // Update only name and phone
        await page.locator('input[placeholder="Enter Your Name"]').fill(partialName);
        await page.locator('input[placeholder="Enter Your Phone"]').fill(partialPhone);

        await page.getByRole('button', { name: 'UPDATE' }).click();
        await expect(page.locator('text=Profile Updated Successfully')).toBeVisible();

        // Verify dashboard
        await page.goto('/dashboard/user');
        const dashboardCard = page.locator('div.dashboard');
        await dashboardCard.waitFor({ state: 'visible', timeout: 15000 });
        await expect(dashboardCard.getByRole('heading', { name: partialName, exact: true })).toBeVisible();
        await expect(dashboardCard.getByRole('heading', { name: oldAddress, exact: true })).toBeVisible(); // address should stay the same
    });
});
test.describe('Non-logged in user end2end tests', () => {

        test('Non-logged-in user redirected to login when accessing dashboard', async ({ page }) => {
            // Directly visit dashboard without login
            await page.goto('/dashboard/user');

            // Should redirect to login page
            await expect(page).toHaveURL('/')
        });

        test('Non-logged-in user cannot access profile page', async ({ page }) => {
            await page.goto('/dashboard/user/profile');

            // Should redirect to login
            await expect(page).toHaveURL('/');
        });

        test('Non-logged-in user cannot access orders page', async ({ page }) => {
            await page.goto('/dashboard/user/orders');

            // Should redirect to login
            await expect(page).toHaveURL('/')
        });
});