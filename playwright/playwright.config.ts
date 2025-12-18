import { defineConfig, devices } from "@playwright/test"

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./",
  testMatch: /.*\.spec\.ts$/,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /**
   * We WANT parallel execution (locally + CI).
   * Keep tests/app deterministic under strict 10s action/assertion timeouts.
   */
  workers: process.env.CI ? 2 : 4,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retries for flakiness detection (not to hide bugs - both flaky and hard failures are bugs) */
  retries: 2,
  /* Timeout for each test */
  timeout: 30000, // 30s per test maximum
  /* Timeout for expect assertions */
  expect: {
    timeout: 10000, // 10s for assertions
  },
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Timeout for actions */
    actionTimeout: 10000, // 10s for actions (click, fill, etc.)
    /* Navigation timeout */
    navigationTimeout: 10000, // 10s for navigation
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://localhost:5800",
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    /* Screenshot on failure */
    screenshot: "only-on-failure",
    /* Video on failure */
    video: "retain-on-failure",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /* Build and run production server before starting the tests */
  webServer: {
    // Run from repo root (config file lives in /playwright).
    // process.cwd() returns the directory where the command was run from (project root)
    cwd: process.cwd(),
    // Use a clean test DB (and let the package scripts run migrations/build/start).
    command: "pnpm test:reset && pnpm build && pnpm start",
    url: "http://localhost:5800",
    reuseExistingServer: false,
    timeout: 120 * 1000,
    stdout: "ignore",
    stderr: "pipe",
    env: {
      TURSO_DATABASE_URL: "file:test.db",
      NODE_ENV: "test",
    },
  },
})
