// Sun Zhiyuan Felix (A0272474Y)

import { test, expect } from '@playwright/test';
import mongoose from 'mongoose';
import userModel from '../models/userModel';
import dotenv from 'dotenv';

dotenv.config();

// Ignore global storage state and login explicitly as admin in this spec.
test.use({ storageState: { cookies: [], origins: [] } });

async function loginAsAdmin(page) {
    await page.goto('/register');
    await page.getByRole('textbox', { name: 'Enter Your Name' }).fill('uitestadmin');
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('uitestadmin@email.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('password123');
    await page.getByRole('textbox', { name: 'Enter Your Phone' }).fill('123456789');
    await page.getByRole('textbox', { name: 'Enter Your Address' }).fill('uitest address');
    await page.getByPlaceholder('Enter Your DOB').fill('1998-05-08');
    await page.getByRole('textbox', { name: 'What is Your Favorite sports' }).fill('tennis');
    await page.getByRole('button', { name: 'REGISTER' }).click();

    // Upgrade user to admin in database
    const mongoUri = process.env.MONGO_URL;
    await mongoose.connect(mongoUri);

    await userModel.updateOne(
        { email: 'uitestadmin@email.com' },
        { $set: { role: 1 } }
    );

    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('uitestadmin@email.com');
    await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('password123');
    await page.getByRole('button', { name: 'LOGIN' }).click();

}

test.describe("Category Creation", async () => {
    test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page);
    });

    test('should create a new category', async ({ page }) => {
        //navigate to create category page
        await page.getByRole('button', { name: 'uitestadmin' }).click();
        await page.getByRole('link', { name: 'Dashboard' }).click();
        await page.getByRole('link', { name: 'Create Category' }).click();
        //fill in category name and submit
        await page.getByRole('textbox', { name: 'Enter new category' }).click();
        await page.getByRole('textbox', { name: 'Enter new category' }).fill('Test1');
        await page.getByRole('button', { name: 'Submit' }).click();

        //assert category is created and displayed in the list
        await expect(page.getByRole('cell', { name: 'Test1' })).toBeVisible();
    });
});