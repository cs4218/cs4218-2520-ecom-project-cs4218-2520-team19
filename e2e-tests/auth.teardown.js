import { test as teardown } from '@playwright/test';
import { deleteTestUser } from './test-user.js';

teardown('teardown', async () => {
    await deleteTestUser();
});