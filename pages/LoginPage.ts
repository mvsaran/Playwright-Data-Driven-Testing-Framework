/**
 * pages/LoginPage.ts
 *
 * Page Object for the SauceDemo login screen.
 *
 * Design principles applied here:
 *  - All locators are defined once as private properties; tests never construct
 *    their own selectors, which makes maintenance trivial.
 *  - Role-based and text-based locators are preferred over CSS or XPath because
 *    they reflect what a real user sees and are more resilient to markup changes.
 *  - Every method is async and uses Playwright built-ins (fill, click, etc.)
 *    which have built-in auto-waiting. No fixed sleeps are used.
 *  - The class carries no test-framework imports so it can be reused across
 *    different fixtures or projects.
 */

import { Page, Locator } from "@playwright/test";

export class LoginPage {
  // -------------------------------------------------------------------------
  // Locators
  // -------------------------------------------------------------------------

  /** The username text field. */
  private readonly usernameInput: Locator;

  /** The password text field. */
  private readonly passwordInput: Locator;

  /** The "Login" submit button. */
  private readonly loginButton: Locator;

  /**
   * The error container displayed when credentials are invalid.
   * SauceDemo renders this as a div with data-test="error".
   */
  private readonly errorMessage: Locator;

  // -------------------------------------------------------------------------
  // Constructor
  // -------------------------------------------------------------------------

  constructor(private readonly page: Page) {
    this.usernameInput = page.locator('[data-test="username"]');
    this.passwordInput = page.locator('[data-test="password"]');
    this.loginButton = page.locator('[data-test="login-button"]');
    this.errorMessage = page.locator('[data-test="error"]');
  }

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  /**
   * Navigates the browser to the SauceDemo login page.
   * Uses the baseURL configured in playwright.config.ts so the target
   * environment can be changed without touching test code.
   */
  async goto(): Promise<void> {
    await this.page.goto("/");
  }

  /**
   * Types the given value into the username field.
   * Passing an empty string validates the empty-username scenario without
   * special branching in test code.
   */
  async enterUsername(username: string): Promise<void> {
    await this.usernameInput.fill(username);
  }

  /**
   * Types the given value into the password field.
   */
  async enterPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  /**
   * Clicks the login button and waits for the resulting navigation or
   * error state to settle. Playwright auto-waits for the element to be
   * actionable before clicking.
   */
  async submitLogin(): Promise<void> {
    await this.loginButton.click();
  }

  /**
   * Convenience method: fills credentials and submits in one call.
   * Keeps test steps readable: await loginPage.login(username, password).
   */
  async login(username: string, password: string): Promise<void> {
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.submitLogin();
  }

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  /**
   * Returns the trimmed text content of the error message element.
   * Call this only after a failed login attempt.
   */
  async getErrorMessage(): Promise<string> {
    return (await this.errorMessage.innerText()).trim();
  }

  /**
   * Returns the Locator for the error message element so callers can
   * use Playwright assertions directly (e.g. expect(locator).toBeVisible()).
   */
  getErrorLocator(): Locator {
    return this.errorMessage;
  }
}
