// @ts-check
import { test, expect } from '@playwright/test';

// Reset storage state for this file to avoid being authenticated
test.use({ storageState: { cookies: [], origins: [] } });

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page.getByText(/Virtual Vault/)).toBeVisible();
});

// Should work because authentication is reset for this file, so we should be able to see the Register Page
test('navigate to register link', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'Register' }).click();

  await expect(page.getByText('REGISTER FORM')).toBeVisible();
});
