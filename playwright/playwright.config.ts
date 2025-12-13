import { defineConfig, devices } from "@playwright/test"
import { execSync } from "child_process"

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./",
  testMatch: /.*\.spec\.ts$/,
  globalSetup: require.resolve("./global-setup.ts"),
  /* Run tests in files in parallel */
  fullyParallel: false, // Enable parallel execution - tests create isolated boards (unique UUIDs)
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Timeout for each test */
  testTimeout: 30000, // 30s per test maximum
  /* Timeout for expect assertions */
  expect: {
    timeout: 10000, // 10s for assertions
  },
  /* Timeout for actions */
  timeout: 10000, // 10s for actions (click, fill, etc.)
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Navigation timeout */
    navigationTimeout: 10000, // 10s for navigation
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://localhost:5900",
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

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "pnpm db:push && pnpm next dev -p 5900",
    url: "http://localhost:5900",
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
