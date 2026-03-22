import { test as setup } from '@playwright/test';
import path from 'path';
import { createTestUser } from './test-user.js';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('log in test user', async ({ page }) => {
  await createTestUser();

  // Login with the registered user
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('uitest@email.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('password123');
  await page.getByRole('button', { name: 'LOGIN' }).click();

  await page.waitForURL('/');

  await page.context().storageState({ path: authFile });
});