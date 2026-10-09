/**
 * utils/dataSources/PropertiesDataSource.ts
 *
 * Reads test cases from a Java-style .properties file using a zero-dependency
 * parser. This format is common in Java/Spring test projects and is familiar
 * to SDETs coming from a Java background.
 *
 * Expected format (test-data/login-data.properties):
 *
 *   # Each test case uses a shared prefix. Lines starting with # are comments.
 *   # Blank lines are ignored.
 *
 *   TC_LOGIN_001.testCaseId    = TC_LOGIN_001
 *   TC_LOGIN_001.testCaseName  = Valid standard user login
 *   TC_LOGIN_001.username      = standard_user
 *   TC_LOGIN_001.password      = secret_sauce
 *   TC_LOGIN_001.expectedResult = success
 *
 *   TC_LOGIN_002.testCaseId    = TC_LOGIN_002
 *   TC_LOGIN_002.testCaseName  = Invalid username
 *   TC_LOGIN_002.username      = invalid_user
 *   TC_LOGIN_002.password      = secret_sauce
 *   TC_LOGIN_002.expectedResult = failure
 *
 * Parsing rules:
 *   - Lines starting with # or ! are comments.
 *   - Blank lines and whitespace-only lines are skipped.
 *   - Each line has the form:  <prefix>.<field> = <value>
 *   - Whitespace around the = separator is trimmed.
 *   - Test cases are grouped by their <prefix> and ordered by first appearance.
 *   - The value after the last = on a line is used (handles values with = in them).
 */

import * as fs from "fs";
import * as path from "path";
import { LoginTestCase } from "../types";
import { IDataSource, validateAndCoerce } from "./IDataSource";

export class PropertiesDataSource implements IDataSource {
  private readonly filePath: string;

  constructor(filePath?: string) {
    this.filePath =
      filePath ??
      path.resolve(__dirname, "..", "..", "test-data", "login-data.properties");
  }

  load(): ReadonlyArray<LoginTestCase> {
    if (!fs.existsSync(this.filePath)) {
      throw new Error(
        `PropertiesDataSource: file not found at "${this.filePath}". ` +
        `Ensure "test-data/login-data.properties" exists.`
      );
    }

    const raw = fs.readFileSync(this.filePath, "utf-8");
    const grouped = this.parseProperties(raw);

    if (grouped.length === 0) {
      throw new Error(
        `PropertiesDataSource: "${this.filePath}" contains no test case entries.`
      );
    }

    return grouped.map((record, i) => validateAndCoerce(record, i, "Properties"));
  }

  // ---------------------------------------------------------------------------
  // Internal parser
  // ---------------------------------------------------------------------------

  /**
   * Parses the .properties content and groups entries by their prefix.
   * Returns an array of plain objects ordered by the first time each prefix
   * was seen in the file.
   */
  private parseProperties(content: string): Array<Record<string, string>> {
    // Map from prefix → field-value pairs, preserving insertion order.
    const groups = new Map<string, Record<string, string>>();

    // Ordered list of prefixes (to maintain test-case order from the file).
    const prefixOrder: string[] = [];

    const lines = content
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n");

    for (const rawLine of lines) {
      const line = rawLine.trim();

      // Skip blank lines and comments.
      if (line === "" || line.startsWith("#") || line.startsWith("!")) {
        continue;
      }

      // Split on the FIRST `=` only (values may contain `=`).
      const eqIndex = line.indexOf("=");
      if (eqIndex === -1) {
        // Not a key=value pair — skip (could be a section header comment).
        continue;
      }

      const fullKey = line.substring(0, eqIndex).trim();
      const value   = line.substring(eqIndex + 1).trim();

      // The key format is  <prefix>.<fieldName>
      const dotIndex = fullKey.indexOf(".");
      if (dotIndex === -1) {
        throw new Error(
          `PropertiesDataSource: key "${fullKey}" has no prefix. ` +
          `Expected format: <prefix>.<fieldName> = <value>`
        );
      }

      const prefix    = fullKey.substring(0, dotIndex).trim();
      const fieldName = fullKey.substring(dotIndex + 1).trim();

      if (!groups.has(prefix)) {
        groups.set(prefix, {});
        prefixOrder.push(prefix);
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      groups.get(prefix)![fieldName] = value;
    }

    return prefixOrder.map((prefix) => groups.get(prefix)!);
  }
}
