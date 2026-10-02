import { defineConfig, devices } from '@playwright/test';
import { E2E_ENV } from './e2e/env';

/**
 * End-to-end tests run against a production build (`npm run build` first)
 * served on port 3100 with a dedicated test database, which global-setup
 * wipes and re-seeds before every run.
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  // Tests share one server and database, so run them one at a time
  workers: 1,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    // The site follows the browser's language on a first visit; tests read the Uzbek UI
    locale: 'uz-UZ',
    baseURL: E2E_ENV.NEXT_PUBLIC_APP_URL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npx next start -p 3100',
    // A static file: the server starts before global-setup migrates the test
    // database, so a readiness check that queries it fails after schema changes
    url: `${E2E_ENV.NEXT_PUBLIC_APP_URL}/icon.svg`,
    reuseExistingServer: !process.env.CI,
    env: E2E_ENV,
    timeout: 60_000,
  },
});
