/**
 * utils/dataSources/CsvDataSource.ts
 *
 * Reads test cases from a CSV file using a zero-dependency, RFC-4180-compliant
 * parser written in-house. No external CSV library is needed because the
 * parser is tailored to the controlled structure of our test-data files.
 *
 * Expected format (test-data/login-data.csv):
 *
 *   testCaseId,testCaseName,username,password,expectedResult
 *   TC_LOGIN_001,Valid standard user login,standard_user,secret_sauce,success
 *   TC_LOGIN_002,Invalid username,invalid_user,secret_sauce,failure
 *   ...
 *
 * Supported CSV features:
 *   - Header row (first line) maps column names to object keys.
 *   - Double-quoted fields allow embedded commas: "Smith, John"
 *   - Blank lines and lines containing only whitespace are skipped.
 *   - Windows (\r\n) and Unix (\n) line endings are normalised.
 *
 * Unsupported (not needed for test data files):
 *   - Multi-line quoted fields.
 *   - Escaped double quotes inside quoted fields ("" → ").
 *     If you need these, switch to the CsvDataSource with csv-parse library.
 */

import * as fs from "fs";
import * as path from "path";
import { LoginTestCase } from "../types";
import { IDataSource, validateAndCoerce } from "./IDataSource";

export class CsvDataSource implements IDataSource {
  private readonly filePath: string;

  constructor(filePath?: string) {
    this.filePath =
      filePath ??
      path.resolve(__dirname, "..", "..", "test-data", "login-data.csv");
  }

  load(): ReadonlyArray<LoginTestCase> {
    if (!fs.existsSync(this.filePath)) {
      throw new Error(
        `CsvDataSource: file not found at "${this.filePath}". ` +
        `Ensure "test-data/login-data.csv" exists.`
      );
    }

    const raw = fs.readFileSync(this.filePath, "utf-8");
    const rows = this.parseCsv(raw);

    if (rows.length === 0) {
      throw new Error(
        `CsvDataSource: "${this.filePath}" contains no data rows (only header or is empty).`
      );
    }

    return rows.map((row, i) => validateAndCoerce(row, i, "CSV"));
  }

  // ---------------------------------------------------------------------------
  // Internal CSV parser
  // ---------------------------------------------------------------------------

  /**
   * Parses a CSV string into an array of objects.
   * The first non-blank line is treated as the header row.
   * Subsequent non-blank lines produce one object whose keys are the header values.
   */
  private parseCsv(content: string): Array<Record<string, string>> {
    // Normalise line endings and split.
    const lines = content
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")
      .filter((line) => line.trim().length > 0);

    if (lines.length < 2) {
      throw new Error(
        `CsvDataSource: CSV must have at least a header row and one data row.`
      );
    }

    const headers = this.parseCsvLine(lines[0]);

    return lines.slice(1).map((line, lineIndex) => {
      const values = this.parseCsvLine(line);

      if (values.length !== headers.length) {
        throw new Error(
          `CsvDataSource: line ${lineIndex + 2} has ${values.length} columns ` +
          `but header has ${headers.length} columns.`
        );
      }

      return Object.fromEntries(headers.map((header, i) => [header.trim(), values[i]]));
    });
  }

  /**
   * Splits one CSV line into field values, honouring double-quoted fields.
   * Leading/trailing whitespace is trimmed from unquoted values.
   * Quoted values preserve their inner whitespace.
   */
  private parseCsvLine(line: string): string[] {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];

      if (ch === '"') {
        // Handle escaped double-quote ("").
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }

    fields.push(current.trim());
    return fields;
  }
}
