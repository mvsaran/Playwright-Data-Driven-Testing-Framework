/**
 * utils/types.ts
 *
 * Central type definitions shared across all data sources.
 * Keeping types in a dedicated file prevents circular imports and makes
 * the interface available to the data-source implementations, the factory,
 * and the spec files with a single, stable import path.
 */

/**
 * Represents one login test scenario.
 *
 * The `expectedResult` field uses a strict union type ("success" | "failure")
 * instead of a plain string so that:
 *  - Typos in any data source are caught at compile time (after mapping to this type).
 *  - The assertion branch in the spec file is type-narrowed — TypeScript knows
 *    the only two possible values, so there is no need for a defensive "else if unknown".
 */
export interface LoginTestCase {
  /** Unique identifier embedded in the Playwright test title and HTML report. */
  testCaseId: string;

  /** Human-readable description embedded in the Playwright test title. */
  testCaseName: string;

  /** Value typed into the username field (empty string is a valid scenario). */
  username: string;

  /** Value typed into the password field (empty string is a valid scenario). */
  password: string;

  /**
   * Controls which assertion branch the spec executes.
   *   "success" → assert navigation to inventory page + products visible
   *   "failure" → assert error message displayed, no redirect
   */
  expectedResult: "success" | "failure";
}
