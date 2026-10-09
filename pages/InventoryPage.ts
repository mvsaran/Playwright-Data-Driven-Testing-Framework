/**
 * pages/InventoryPage.ts
 *
 * Page Object for the SauceDemo inventory (product listing) page.
 *
 * After a successful login the application redirects to /inventory.html.
 * This page object captures the key verifiable elements that confirm
 * the user has been authenticated and is viewing real content.
 *
 * Keeping these assertions in a page object rather than inline in the
 * test file means:
 *  - Tests read at a business level ("verify inventory is visible")
 *    rather than a selector level.
 *  - Selector changes require a fix in one place, not across all tests.
 */

import { Page, Locator, expect } from "@playwright/test";

export class InventoryPage {
  // -------------------------------------------------------------------------
  // Locators
  // -------------------------------------------------------------------------

  /**
   * The page title element that confirms we are on the inventory screen.
   * SauceDemo renders "Products" as the title of the inventory view.
   */
  private readonly pageTitle: Locator;

  /**
   * The container that wraps all product cards.
   * Its presence confirms that product data has been loaded.
   */
  private readonly inventoryContainer: Locator;

  /**
   * Individual product items inside the inventory container.
   * Used to verify that at least one product is rendered.
   */
  private readonly inventoryItems: Locator;

  // -------------------------------------------------------------------------
  // Constructor
  // -------------------------------------------------------------------------

  constructor(private readonly page: Page) {
    this.pageTitle = page.locator(".title");
    this.inventoryContainer = page.locator('[data-test="inventory-container"]');
    this.inventoryItems = page.locator('[data-test="inventory-item"]');
  }

  // -------------------------------------------------------------------------
  // Assertions (expressed as page-object methods)
  // -------------------------------------------------------------------------

  /**
   * Asserts that the inventory page URL segment is present, confirming that
   * the browser navigated away from the login page after a successful login.
   */
  async assertPageIsVisible(): Promise<void> {
    await expect(this.page).toHaveURL(/.*inventory\.html/);
    await expect(this.pageTitle).toBeVisible();
    await expect(this.pageTitle).toHaveText("Products");
  }

  /**
   * Asserts that the product list container is visible and contains at least
   * one product card. This validates that application data loaded correctly
   * rather than just checking the URL.
   */
  async assertProductsAreVisible(): Promise<void> {
    await expect(this.inventoryContainer).toBeVisible();
    const count = await this.inventoryItems.count();
    expect(count).toBeGreaterThan(0);
  }

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  /**
   * Returns the current URL of the page.
   * Useful for logging or conditional branching in complex scenarios.
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Returns the number of product items currently visible in the inventory.
   */
  async getProductCount(): Promise<number> {
    return this.inventoryItems.count();
  }
}
