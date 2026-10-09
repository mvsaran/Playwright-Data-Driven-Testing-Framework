/**
 * utils/dataSources/YamlDataSource.ts
 *
 * Reads test cases from a YAML file using the `js-yaml` library.
 * YAML is preferred when test data needs inline comments or multi-line strings.
 *
 * Expected format (test-data/login-data.yaml):
 *
 *   # Login test cases
 *   - testCaseId: TC_LOGIN_001
 *     testCaseName: Valid standard user login
 *     username: standard_user
 *     password: secret_sauce
 *     expectedResult: success
 *
 *   - testCaseId: TC_LOGIN_002
 *     testCaseName: Invalid username
 *     username: invalid_user
 *     password: secret_sauce
 *     expectedResult: failure
 *
 * YAML advantages over JSON for test data:
 *   - Inline comments explain WHY each scenario exists.
 *   - No quotes required around strings.
 *   - Multi-line values supported natively (useful for payloads or URLs).
 *   - Easier to read/write for non-developers (BAs, QA leads).
 */

import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { LoginTestCase } from "../types";
import { IDataSource, validateAndCoerce } from "./IDataSource";

export class YamlDataSource implements IDataSource {
  private readonly filePath: string;

  constructor(filePath?: string) {
    this.filePath =
      filePath ??
      path.resolve(__dirname, "..", "..", "test-data", "login-data.yaml");
  }

  load(): ReadonlyArray<LoginTestCase> {
    if (!fs.existsSync(this.filePath)) {
      throw new Error(
        `YamlDataSource: file not found at "${this.filePath}". ` +
        `Ensure "test-data/login-data.yaml" exists.`
      );
    }

    let parsed: unknown;
    try {
      const raw = fs.readFileSync(this.filePath, "utf-8");
      parsed = yaml.load(raw);
    } catch (err) {
      throw new Error(
        `YamlDataSource: failed to parse "${this.filePath}": ${(err as Error).message}`
      );
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error(
        `YamlDataSource: "${this.filePath}" must be a non-empty YAML sequence (list).`
      );
    }

    return parsed.map((entry, i) => validateAndCoerce(entry, i, "YAML"));
  }
}
