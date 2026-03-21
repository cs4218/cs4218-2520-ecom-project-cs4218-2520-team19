// @ts-check
// Sun Zhiyuan Felix (A0272474Y)
// Config file for Playwright tests in an isolated in-memory MongoDB environment
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-tests/isolated-environment-tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    storageState: { cookies: [], origins: [] },
  },
  projects: [
    {
      name: 'chromium',
      testMatch: /.*\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
  webServer: [
    {
      command: 'npm run client',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run server:test',
      url: 'http://localhost:6060',
      reuseExistingServer: false,
    },
  ],
});