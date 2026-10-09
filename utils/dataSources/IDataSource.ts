/**
 * utils/dataSources/IDataSource.ts
 *
 * Defines the contract every data source must fulfil (Strategy pattern).
 * Also exports the shared field validator so each implementation gets
 * consistent, uniform error messages without duplicating logic.
 *
 * Adding a new data source:
 *  1. Create a class that implements IDataSource.
 *  2. In load(), parse your format into plain objects.
 *  3. Map each object through validateAndCoerce() to get LoginTestCase.
 *  4. Register the class in DataSourceFactory.ts.
 */

import { LoginTestCase } from "../types";

// ---------------------------------------------------------------------------
// Strategy interface
// ---------------------------------------------------------------------------

/**
 * Common contract for all data sources.
 * Each concrete implementation knows how to read its own format;
 * the spec file never needs to know which source is active.
 */
export interface IDataSource {
  /**
   * Loads, validates, and returns an immutable collection of test cases.
   * Implementations must throw with a descriptive message on invalid data.
   */
  load(): ReadonlyArray<LoginTestCase>;
}

// ---------------------------------------------------------------------------
// Shared validator
// ---------------------------------------------------------------------------

/** Fields that every test case must provide as non-empty strings. */
const REQUIRED_STRING_FIELDS: ReadonlyArray<keyof LoginTestCase> = [
  "testCaseId",
  "testCaseName",
  "username",
  "password",
  "expectedResult",
];

/**
 * Validates a raw, untyped record (typically parsed from JSON, CSV, YAML,
 * .properties, or Excel) and returns it as a fully-typed LoginTestCase.
 *
 * Note: `username` and `password` are allowed to be empty strings because
 * "empty field" is itself a valid test scenario. The validator only ensures
 * the field EXISTS in the source record.
 *
 * @param raw    - The raw object to validate.
 * @param index  - Zero-based position in the source file (used in error messages).
 * @param source - Name of the source format (used in error messages).
 */
export function validateAndCoerce(
  raw: unknown,
  index: number,
  source: string
): LoginTestCase {
  const ctx = `[${source}] entry at index ${index}`;

  if (typeof raw !== "object" || raw === null) {
    throw new Error(`${ctx}: expected an object, got ${typeof raw}.`);
  }

  const record = raw as Record<string, unknown>;

  for (const field of REQUIRED_STRING_FIELDS) {
    if (!(field in record)) {
      throw new Error(`${ctx}: missing required field "${field}".`);
    }
    // Allow empty strings for username and password.
    if (field !== "username" && field !== "password") {
      if (typeof record[field] !== "string" || (record[field] as string).trim() === "") {
        throw new Error(
          `${ctx}: field "${field}" must be a non-empty string. Got: "${record[field]}".`
        );
      }
    } else {
      if (typeof record[field] !== "string") {
        throw new Error(
          `${ctx}: field "${field}" must be a string. Got: ${typeof record[field]}.`
        );
      }
    }
  }

  const expectedResult = (record["expectedResult"] as string).trim();
  if (expectedResult !== "success" && expectedResult !== "failure") {
    throw new Error(
      `${ctx}: "expectedResult" must be "success" or "failure". Got: "${expectedResult}".`
    );
  }

  return {
    testCaseId:     (record["testCaseId"]     as string).trim(),
    testCaseName:   (record["testCaseName"]   as string).trim(),
    username:       (record["username"]       as string),
    password:       (record["password"]       as string),
    expectedResult: expectedResult as "success" | "failure",
  };
}
