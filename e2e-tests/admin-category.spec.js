import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('navigate to admin category link', async ({ page }) => {
  await page.getByRole('link', { name: 'Login' }).click();
    await expect(page.getByText('LOGIN FORM')).toBeVisible();
});

