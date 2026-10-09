/**
 * utils/dataSources/ExcelDataSource.ts
 *
 * Reads test cases from an Excel workbook (.xlsx / .xls) using SheetJS (xlsx).
 * Excel is the most widely used format for test data in enterprise QA teams —
 * non-technical stakeholders can manage test data directly in Excel without
 * any code changes.
 *
 * Expected format (test-data/login-data.xlsx):
 *
 *   Sheet name: LoginTestData   (first sheet is used if this name is not found)
 *
 *   Row 1 (header): testCaseId | testCaseName | username | password | expectedResult
 *   Row 2+:         TC_LOGIN_001 | Valid standard user login | ... | success
 *
 * To generate the initial Excel file from existing JSON data, run:
 *   npx tsx scripts/generateExcelData.ts
 *
 * After that, testers can open login-data.xlsx in Excel and edit it directly.
 * The framework reads the file at test run time — no re-generation step is needed
 * unless you want to keep the JSON and Excel files in sync.
 *
 * SheetJS docs: https://docs.sheetjs.com/
 */

import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";
import { LoginTestCase } from "../types";
import { IDataSource, validateAndCoerce } from "./IDataSource";

/** Name of the Excel sheet that stores login test data. */
const SHEET_NAME = "LoginTestData";

export class ExcelDataSource implements IDataSource {
  private readonly filePath: string;

  constructor(filePath?: string) {
    this.filePath =
      filePath ??
      path.resolve(__dirname, "..", "..", "test-data", "login-data.xlsx");
  }

  load(): ReadonlyArray<LoginTestCase> {
    if (!fs.existsSync(this.filePath)) {
      throw new Error(
        `ExcelDataSource: file not found at "${this.filePath}". ` +
        `Run "npx tsx scripts/generateExcelData.ts" to create it from the JSON source, ` +
        `or provide a manually created Excel file.`
      );
    }

    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.readFile(this.filePath);
    } catch (err) {
      throw new Error(
        `ExcelDataSource: failed to read "${this.filePath}": ${(err as Error).message}`
      );
    }

    // Use the named sheet, or fall back to the first sheet.
    const sheetName = workbook.SheetNames.includes(SHEET_NAME)
      ? SHEET_NAME
      : workbook.SheetNames[0];

    if (!sheetName) {
      throw new Error(
        `ExcelDataSource: workbook "${this.filePath}" contains no sheets.`
      );
    }

    const sheet = workbook.Sheets[sheetName];

    // sheet_to_json uses the first row as headers automatically.
    // `defval: ""` ensures missing cells produce an empty string, not undefined.
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });

    if (rows.length === 0) {
      throw new Error(
        `ExcelDataSource: sheet "${sheetName}" in "${this.filePath}" ` +
        `contains no data rows (only a header or is empty).`
      );
    }

    // Coerce every cell value to string (Excel may parse numbers or booleans).
    const normalised = rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([k, v]) => [k.trim(), String(v).trim()])
      )
    );

    return normalised.map((row, i) => validateAndCoerce(row, i, "Excel"));
  }
}
