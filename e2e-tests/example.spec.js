// @ts-check
import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page.getByText(/Virtual Vault/)).toBeVisible();
});

test('navigate to register link', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'Register' }).click();

  await expect(page.getByText('REGISTER FORM')).toBeVisible();
});
