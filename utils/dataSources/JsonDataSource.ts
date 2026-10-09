/**
 * utils/dataSources/JsonDataSource.ts
 *
 * Reads test cases from a JSON array file.
 * This is the default source used when DATA_SOURCE is not set.
 *
 * Expected format (test-data/login-data.json):
 *   [
 *     {
 *       "testCaseId":     "TC_LOGIN_001",
 *       "testCaseName":   "Valid standard user login",
 *       "username":       "standard_user",
 *       "password":       "secret_sauce",
 *       "expectedResult": "success"
 *     },
 *     ...
 *   ]
 */

import * as fs from "fs";
import * as path from "path";
import { LoginTestCase } from "../types";
import { IDataSource, validateAndCoerce } from "./IDataSource";

export class JsonDataSource implements IDataSource {
  private readonly filePath: string;

  constructor(filePath?: string) {
    this.filePath =
      filePath ??
      path.resolve(__dirname, "..", "..", "test-data", "login-data.json");
  }

  load(): ReadonlyArray<LoginTestCase> {
    if (!fs.existsSync(this.filePath)) {
      throw new Error(
        `JsonDataSource: file not found at "${this.filePath}". ` +
        `Ensure "test-data/login-data.json" exists.`
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(fs.readFileSync(this.filePath, "utf-8"));
    } catch (err) {
      throw new Error(
        `JsonDataSource: failed to parse "${this.filePath}": ${(err as Error).message}`
      );
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error(
        `JsonDataSource: "${this.filePath}" must be a non-empty JSON array.`
      );
    }

    return parsed.map((entry, i) => validateAndCoerce(entry, i, "JSON"));
  }
}
