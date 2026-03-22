import { test as setup } from '@playwright/test';
import path from 'path';
import { createTestUser } from './test-user.js';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('log in test user', async ({ page }) => {
  // await createTestUser();

  // Register a new user if not already registered
  await page.goto('/register');
  await page.getByRole('textbox', { name: 'Enter Your Name' }).fill('uitest');
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('uitest@email.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('password123');
  await page.getByRole('textbox', { name: 'Enter Your Phone' }).fill('123456789');
  await page.getByRole('textbox', { name: 'Enter Your Address' }).fill('uitest address');
  await page.getByRole('textbox', { name: 'What is Your Favorite sports' }).fill('tennis');
  await page.getByRole('button', { name: 'REGISTER' }).click();

  // No assertion for registration as user may already exist, 
  // just want to ensure the user is registered before login.

  // Login with the registered user
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('uitest@email.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('password123');
  await page.getByRole('button', { name: 'LOGIN' }).click();

  await page.waitForURL('/');

  await page.context().storageState({ path: authFile });
});