/**
 * utils/testData.ts
 *
 * Single entry-point for test data in all spec files.
 *
 * How it works:
 *   1. Reads the DATA_SOURCE environment variable (default: "json").
 *   2. Passes the value to DataSourceFactory, which returns the matching
 *      IDataSource implementation.
 *   3. Calls .load() on that implementation, which reads, validates, and
 *      returns a typed, immutable array of LoginTestCase objects.
 *   4. Exports the array — test files never import the factory directly.
 *
 * Switching data sources requires NO changes to this file or any spec file.
 * Simply set the environment variable before running tests:
 *
 *   PowerShell:
 *     $env:DATA_SOURCE = "csv"  ;  npm test
 *     $env:DATA_SOURCE = "yaml" ;  npm test
 *     $env:DATA_SOURCE = "excel";  npm test
 *     $env:DATA_SOURCE = "properties"; npm test
 *
 *   Bash / CI:
 *     DATA_SOURCE=csv npm test
 *     DATA_SOURCE=yaml npm test
 *
 * Re-exports the LoginTestCase interface so spec files have a single import:
 *   import { loginTestCases, LoginTestCase } from "../utils/testData";
 */

import { DataSourceFactory } from "./DataSourceFactory";

// Re-export so callers don't need a separate import for the type.
export type { LoginTestCase } from "./types";

// ---------------------------------------------------------------------------
// Source selection
// ---------------------------------------------------------------------------

const sourceType = (process.env["DATA_SOURCE"] ?? "json").toLowerCase().trim();

console.log(
  `[testData] Loading test cases from source: "${sourceType}" ` +
  `(set DATA_SOURCE env var to change)`
);

// ---------------------------------------------------------------------------
// Exported collection
// ---------------------------------------------------------------------------

/**
 * Fully-typed, validated login test cases loaded from the configured source.
 *
 * This is a ReadonlyArray — tests cannot accidentally mutate shared state.
 */
export const loginTestCases = DataSourceFactory.create(sourceType).load();

console.log(`[testData] Loaded ${loginTestCases.length} test case(s) successfully.`);
