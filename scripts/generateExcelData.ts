/**
 * scripts/generateExcelData.ts
 *
 * One-time utility that generates test-data/login-data.xlsx from the
 * canonical JSON source (test-data/login-data.json).
 *
 * Run with:
 *   npx tsx scripts/generateExcelData.ts
 *
 * When to run:
 *   - After initial project setup (creates the .xlsx for the first time).
 *   - After editing login-data.json, if you want the Excel file kept in sync.
 *   - In CI as a pre-test step when DATA_SOURCE=excel.
 *
 * After generation, testers can open login-data.xlsx in Excel and edit it
 * directly. The framework reads the file at test run time.
 *
 * Sheet layout (LoginTestData):
 *   Row 1: testCaseId | testCaseName | username | password | expectedResult
 *   Row 2+: one data row per test case
 */

import * as fs   from "fs";
import * as path from "path";
import * as XLSX from "xlsx";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const projectRoot = path.resolve(__dirname, "..");
const jsonPath    = path.join(projectRoot, "test-data", "login-data.json");
const xlsxPath    = path.join(projectRoot, "test-data", "login-data.xlsx");

// ---------------------------------------------------------------------------
// Load source JSON
// ---------------------------------------------------------------------------

if (!fs.existsSync(jsonPath)) {
  console.error(`ERROR: source file not found: ${jsonPath}`);
  process.exit(1);
}

const loginData = JSON.parse(fs.readFileSync(jsonPath, "utf-8")) as unknown[];

if (!Array.isArray(loginData) || loginData.length === 0) {
  console.error("ERROR: login-data.json must be a non-empty array.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Build workbook
// ---------------------------------------------------------------------------

const worksheet = XLSX.utils.json_to_sheet(loginData);

// Style the header row: make column widths proportional to content.
const columnWidths = [
  { wch: 16 },  // testCaseId
  { wch: 35 },  // testCaseName
  { wch: 20 },  // username
  { wch: 20 },  // password
  { wch: 16 },  // expectedResult
];
worksheet["!cols"] = columnWidths;

const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "LoginTestData");

// ---------------------------------------------------------------------------
// Write file
// ---------------------------------------------------------------------------

XLSX.writeFile(workbook, xlsxPath);

console.log(`Excel file generated successfully:`);
console.log(`  Source : ${jsonPath}`);
console.log(`  Output : ${xlsxPath}`);
console.log(`  Rows   : ${loginData.length} test case(s)`);
