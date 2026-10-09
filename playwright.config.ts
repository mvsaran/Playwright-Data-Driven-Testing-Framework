import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";

// Load .env file if present; CI typically injects variables directly.
dotenv.config();

/**
 * Playwright configuration for the data-driven SauceDemo test suite.
 *
 * Environment variables:
 *   BASE_URL  – override the application URL (defaults to SauceDemo).
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Directory that contains test files.
  testDir: "./tests",

  // Run tests in each file sequentially (safe for login flows sharing no state).
  fullyParallel: false,

  // Fail the build on CI if any test.only() was accidentally committed.
  forbidOnly: !!process.env.CI,

  // No automatic retries – failures should be investigated, not hidden.
  retries: process.env.CI ? 1 : 0,

  // Number of parallel worker processes.
  workers: process.env.CI ? 2 : undefined,

  // -----------------------------------------------------------------------
  // Reporters
  // -----------------------------------------------------------------------
  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["list"],
  ],

  // -----------------------------------------------------------------------
  // Global test settings
  // -----------------------------------------------------------------------
  use: {
    // Base URL – override with BASE_URL env var on CI.
    baseURL: process.env.BASE_URL ?? "https://www.saucedemo.com",

    // Collect trace on the first retry so failing tests are debuggable.
    trace: "on-first-retry",

    // Capture a screenshot whenever a test fails.
    screenshot: "only-on-failure",

    // Keep video recording only for failed tests (saves disk space).
    video: "retain-on-failure",

    // Navigation / action timeouts.
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  // Global timeout per test (ms).
  timeout: 60_000,

  // -----------------------------------------------------------------------
  // Browser projects
  // -----------------------------------------------------------------------
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
