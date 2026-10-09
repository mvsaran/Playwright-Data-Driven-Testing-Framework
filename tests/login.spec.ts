/**
 * tests/login.spec.ts
 *
 * Data-driven login test suite for SauceDemo.
 *
 * How data-driven testing works here:
 *  1. `loginTestCases` is a validated, typed array loaded from JSON at module
 *     initialisation time (see utils/testData.ts).
 *  2. A plain JavaScript for...of loop iterates over every test case and
 *     registers a Playwright `test()` for each one dynamically.
 *  3. The test title embeds `testCaseId` and `testCaseName` so every run in
 *     the HTML report is self-documenting.
 *  4. The assertion branch is controlled by `expectedResult` from the data
 *     file – no test logic changes are needed to add or remove a scenario.
 *
 * Adding a new scenario:
 *   Simply append a new object to test-data/login-data.json.  No code changes
 *   are required.
 */

import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { InventoryPage } from "../pages/InventoryPage";
import { loginTestCases } from "../utils/testData";

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

test.describe("SauceDemo – Login Functionality (Data-Driven)", () => {
  /**
   * Iterate over every test case from the JSON data file and register a
   * dedicated Playwright test for each one.
   *
   * Using `for...of` instead of `test.each` is idiomatic Playwright Test and
   * gives us full TypeScript type inference on `testCase` without casting.
   */
  for (const testCase of loginTestCases) {
    const { testCaseId, testCaseName, username, password, expectedResult } =
      testCase;

    test(`[${testCaseId}] ${testCaseName}`, async ({ page }) => {
      // -------------------------------------------------------------------
      // Arrange: construct page objects for this test
      // -------------------------------------------------------------------
      const loginPage = new LoginPage(page);
      const inventoryPage = new InventoryPage(page);

      // -------------------------------------------------------------------
      // Act: navigate to the login page and attempt to log in
      // -------------------------------------------------------------------
      await loginPage.goto();
      await loginPage.login(username, password);

      // -------------------------------------------------------------------
      // Assert: branch on the expected outcome declared in the data file
      // -------------------------------------------------------------------
      if (expectedResult === "success") {
        // -----------------------------------------------------------------
        // Happy path – user should reach the inventory page with products
        // -----------------------------------------------------------------

        // Verify the browser URL has changed to the inventory page.
        await inventoryPage.assertPageIsVisible();

        // Verify that the product list contains at least one item, confirming
        // that application data loaded and the session is fully authenticated.
        await inventoryPage.assertProductsAreVisible();

        const productCount = await inventoryPage.getProductCount();
        console.log(
          `[${testCaseId}] Login succeeded. Products visible: ${productCount}`
        );
      } else {
        // -----------------------------------------------------------------
        // Failure path – user must NOT be redirected to the inventory page
        // -----------------------------------------------------------------

        // Assert the URL did NOT change to the inventory page.
        // This is the definitive check that login was rejected.
        await expect(page).not.toHaveURL(/.*inventory\.html/);

        // Assert the error message container is visible.
        const errorLocator = loginPage.getErrorLocator();
        await expect(errorLocator).toBeVisible();

        // Read the error text and assert it is non-empty, confirming the
        // application communicated the rejection to the user.
        const errorText = await loginPage.getErrorMessage();
        expect(errorText.length).toBeGreaterThan(0);

        console.log(
          `[${testCaseId}] Login correctly rejected. Error: "${errorText}"`
        );
      }
    });
  }
});
