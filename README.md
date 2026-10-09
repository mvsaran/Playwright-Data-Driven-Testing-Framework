# 🎭 Playwright Data-Driven Testing Framework

> A **production-quality**, enterprise-ready test automation framework built with **Playwright Test** and **TypeScript**, demonstrating **multi-source Data-Driven Testing (DDT)** using the **Page Object Model (POM)** and **Strategy / Factory Design Patterns** against [SauceDemo](https://www.saucedemo.com/).

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Playwright](https://img.shields.io/badge/Playwright-1.49-green?logo=playwright)](https://playwright.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen?logo=nodedotjs)](https://nodejs.org/)
[![Data Sources](https://img.shields.io/badge/Data%20Sources-JSON%20|%20CSV%20|%20YAML%20|%20Properties%20|%20Excel-purple)](https://github.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## 📋 Table of Contents

1. [🔍 What is Data-Driven Testing?](#-what-is-data-driven-testing)
2. [✅ Why DDT is Useful](#-why-ddt-is-useful)
3. [🔌 Multi-Source Data Architecture (Strategy Pattern)](#-multi-source-data-architecture-strategy-pattern)
4. [⚙️ How the Data-Driven Logic Works](#️-how-the-data-driven-logic-works)
5. [📚 Supported Data Sources](#-supported-data-sources)
   - [🗂️ JSON Format](#️-1-json-format-test-datalogin-datajson)
   - [📊 CSV Format](#-2-csv-format-test-datalogin-datacsv)
   - [📝 YAML Format](#-3-yaml-format-test-datalogin-datayaml)
   - [⚙️ Java .properties Format](#️-4-java-properties-format-test-datalogin-dataproperties)
   - [📗 Excel (.xlsx) Format](#-5-excel-spreadsheet-format-test-datalogin-dataxlsx)
6. [🏗️ Framework Architecture & Execution Flow](#️-framework-architecture--execution-flow)
7. [🧩 Why Page Object Model?](#-why-page-object-model)
8. [📂 Project Structure](#-project-structure)
9. [🔧 Prerequisites](#-prerequisites)
10. [📦 Installation](#-installation)
11. [🌐 Configuration](#-configuration)
12. [▶️ Running Tests Across All Data Sources](#️-running-tests-across-all-data-sources)
13. [➕ Adding Scenarios & New Data Sources](#-adding-scenarios--new-data-sources)
14. [🐛 Troubleshooting](#-troubleshooting)
15. [🚀 CI Execution](#-ci-execution)
16. [🎤 SDET Interview Q&A](#-sdet-interview-qa)

---

## 🔍 What is Data-Driven Testing?

**Data-Driven Testing (DDT)** is an automation design methodology where **test logic is authored once** and executed repeatedly across distinct sets of input data and expected outcomes.

Instead of hardcoding credentials, boundary inputs, or assertion expectations inside test scripts, data is stored externally (**JSON, CSV, YAML, Properties, or Excel**) and injected at runtime:

```
📄 Single Test Logic (written once, immutable)
       │
       ├──► 📦 Dataset 1 (Standard User)      ──► 🧪 Test 1 [TC_LOGIN_001] (PASS)
       ├──► 📦 Dataset 2 (Invalid Username)   ──► 🧪 Test 2 [TC_LOGIN_002] (PASS)
       ├──► 📦 Dataset 3 (Invalid Password)   ──► 🧪 Test 3 [TC_LOGIN_003] (PASS)
       ├──► 📦 Dataset 4 (Empty Username)     ──► 🧪 Test 4 [TC_LOGIN_004] (PASS)
       └──► 📦 Dataset N (Empty Password)     ──► 🧪 Test N [TC_LOGIN_005] (PASS)
```

> 💡 **Core Principle:** Modify the external data file to expand test coverage. **Never touch the automation test code.**

---

## ✅ Why DDT is Useful

| 🏷️ Benefit | 📝 Explanation |
|---|---|
| 🚫 **Zero Code Duplication** | A single parameterized test function covers dozens of edge cases and user personas. |
| ⚡ **Rapid Test Scalability** | Add test cases simply by appending a row to Excel or an entry to JSON/CSV/YAML. |
| 🔀 **Separation of Concerns** | Manual QA, product managers, or business analysts can manage datasets; SDETs maintain automation logic. |
| 🔌 **Pluggable Storage** | Switch between file formats or pull test data dynamically without refactoring test scripts. |
| 🛡️ **Fail-Fast Validation** | Schema validation validates data at startup before spawning browser contexts, preventing false positives. |
| 📖 **Self-Documenting Reports** | Each dataset embeds its own `testCaseId` and human-readable `testCaseName` into Playwright HTML reports. |

---

## 🔌 Multi-Source Data Architecture (Strategy Pattern)

This framework utilizes the **Strategy Pattern** paired with a **Factory Registry** (`DataSourceFactory`) to support heterogeneous data formats through a unified contract (`IDataSource`):

```
                        ┌───────────────────────────────┐
                        │   DATA_SOURCE Environment     │
                        │ (json | csv | yaml | prop | xlsx)│
                        └───────────────┬───────────────┘
                                        │
                                        ▼
                        ┌───────────────────────────────┐
                        │    DataSourceFactory.create()  │
                        └───────────────┬───────────────┘
                                        │
       ┌───────────────┬────────────────┼───────────────┬────────────────┐
       ▼               ▼                ▼               ▼                ▼
┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────┐┌────────────────┐
│JsonDataSource││CsvDataSource ││YamlDataSource││PropertiesDS  ││ExcelDataSource │
└──────┬───────┘└──────┬───────┘└──────┬───────┘└──────┬───────┘└────────┬───────┘
       │               │                │               │                │
       └───────────────┴────────────────┼───────────────┴────────────────┘
                                        │ (implements IDataSource)
                                        ▼
                        ┌───────────────────────────────┐
                        │ ReadonlyArray<LoginTestCase>  │
                        │   (Validated & Typed Array)   │
                        └───────────────┬───────────────┘
                                        │ (imported by)
                                        ▼
                        ┌───────────────────────────────┐
                        │      tests/login.spec.ts      │
                        │    (Playwright Test Suite)    │
                        └───────────────────────────────┘
```

### 🧱 Architectural Highlights

1. **`IDataSource` Contract**: Every adapter implements `load(): ReadonlyArray<LoginTestCase>`.
2. **Strict Compile-Time Safety**: All loaded records conform to `LoginTestCase` where `expectedResult` is constrained to `"success" | "failure"`.
3. **Decoupled Test Suite**: The test file `tests/login.spec.ts` only consumes `loginTestCases` from `utils/testData.ts` and remains completely agnostic of the physical storage format.

---

## ⚙️ How the Data-Driven Logic Works

### Step 1 — 📄 The Data Contract (`utils/types.ts`)

Every data format resolves into an array of typed objects conforming to `LoginTestCase`:

```typescript
export interface LoginTestCase {
  testCaseId: string;                     // e.g. "TC_LOGIN_001"
  testCaseName: string;                   // e.g. "Valid standard user login"
  username: string;                       // e.g. "standard_user"
  password: string;                       // e.g. "secret_sauce"
  expectedResult: "success" | "failure";  // Strict union type
}
```

---

### Step 2 — 🛡️ Validation & Fail-Fast Loading

Before browser instances are initialized, the selected `IDataSource` reads the dataset and performs rigorous schema checks:
- Verifies that all 5 required fields exist and are strings.
- Enforces that `expectedResult` is strictly `"success"` or `"failure"`.
- If malformed data is encountered, execution halts immediately with a clear diagnostic message.

---

### Step 3 — 🔁 Dynamic Test Registration (`tests/login.spec.ts`)

Playwright Test discovers tests dynamically at module evaluation time. We use an idiomatic `for...of` loop over `loginTestCases`:

```typescript
import { test, expect } from "@playwright/test";
import { loginTestCases } from "../utils/testData";
import { LoginPage } from "../pages/LoginPage";
import { InventoryPage } from "../pages/InventoryPage";

test.describe("SauceDemo – Login Functionality (Data-Driven)", () => {
  for (const testCase of loginTestCases) {
    const { testCaseId, testCaseName, username, password, expectedResult } = testCase;

    test(`[${testCaseId}] ${testCaseName}`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      const inventoryPage = new InventoryPage(page);

      await loginPage.goto();
      await loginPage.login(username, password);

      if (expectedResult === "success") {
        // ✅ Happy Path Assertions
        await inventoryPage.assertPageIsVisible();
        await inventoryPage.assertProductsAreVisible();
      } else {
        // ❌ Failure Path Assertions
        await expect(page).not.toHaveURL(/.*inventory\.html/);
        await expect(loginPage.getErrorLocator()).toBeVisible();
        const errorText = await loginPage.getErrorMessage();
        expect(errorText.length).toBeGreaterThan(0);
      }
    });
  }
});
```

---

### Step 4 — 🔀 Decision-Branch Assertions

The `expectedResult` field acts as the decision pivot:
- **`"success"`**: Asserts redirection to `/inventory.html`, verified page header title `"Products"`, and confirms product inventory cards are displayed.
- **`"failure"`**: Asserts the browser remains on the login page, the error badge/container is displayed, and the descriptive error message is verified.

---

## 📚 Supported Data Sources

All five data sources represent the identical set of 5 test scenarios, allowing zero-friction switching:

| Test Case ID | Scenario Name | Username | Password | Expected Result |
|---|---|---|---|---|
| `TC_LOGIN_001` | Valid standard user login | `standard_user` | `secret_sauce` | `success` |
| `TC_LOGIN_002` | Invalid username | `invalid_user` | `secret_sauce` | `failure` |
| `TC_LOGIN_003` | Invalid password | `standard_user` | `wrong_password` | `failure` |
| `TC_LOGIN_004` | Empty username | `""` | `secret_sauce` | `failure` |
| `TC_LOGIN_005` | Empty password | `standard_user` | `""` | `failure` |

---

### 🗂️ 1. JSON Format (`test-data/login-data.json`)
Native JavaScript object notation, structured and parse-efficient:
```json
[
  {
    "testCaseId": "TC_LOGIN_001",
    "testCaseName": "Valid standard user login",
    "username": "standard_user",
    "password": "secret_sauce",
    "expectedResult": "success"
  }
]
```

### 📊 2. CSV Format (`test-data/login-data.csv`)
Comma-separated values ideal for lightweight editing in spreadsheet tools:
```csv
testCaseId,testCaseName,username,password,expectedResult
TC_LOGIN_001,Valid standard user login,standard_user,secret_sauce,success
TC_LOGIN_002,Invalid username,invalid_user,secret_sauce,failure
```

### 📝 3. YAML Format (`test-data/login-data.yaml`)
Clean, human-readable format supporting inline comments for test case rationale:
```yaml
- testCaseId: TC_LOGIN_001
  testCaseName: Valid standard user login
  username: standard_user
  password: secret_sauce
  expectedResult: success
```

### ⚙️ 4. Java .properties Format (`test-data/login-data.properties`)
Standard key-value configuration format using group prefixes:
```properties
tc1.testCaseId=TC_LOGIN_001
tc1.testCaseName=Valid standard user login
tc1.username=standard_user
tc1.password=secret_sauce
tc1.expectedResult=success
```

### 📗 5. Excel Spreadsheet Format (`test-data/login-data.xlsx`)
Multi-row binary workbook parsed using `xlsx`. Easily editable by business analysts.
> 💡 Re-generate this file at any time with: `npm run generate:excel`

---

## 🏗️ Framework Architecture & Execution Flow

```
playwright.config.ts        ← 🌐 Runner configuration: baseURL, reporter, timeouts, devices
utils/testData.ts           ← 🛡️  Entry point invoking DataSourceFactory based on DATA_SOURCE
utils/DataSourceFactory.ts   ← 🏭 Factory instantiating the selected IDataSource strategy
utils/dataSources/*         ← 🔌 Concrete loaders (JSON, CSV, YAML, Properties, Excel)
test-data/*                 ← 📂 External data repositories
tests/login.spec.ts         ← 🔁 Test suite: dynamic for...of test execution
pages/LoginPage.ts          ← 🖥️  Page Object: Locators & actions for login screen
pages/InventoryPage.ts      ← 📦 Page Object: Locators & assertions for inventory screen
```

---

## 🧩 Why Page Object Model?

| ❌ Without POM (Anti-Pattern) | ✅ With POM (Clean Architecture) |
|---|---|
| Selectors scattered across multiple test specs | Encapsulated inside `LoginPage` and `InventoryPage` |
| UI redesign breaks dozens of test files | Update locator once in the Page Object class |
| Test files cluttered with low-level click/fill calls | Specs read like clean business user stories |
| Harder to maintain and refactor | Clear single-responsibility separation |

---

## 📂 Project Structure

```
playwright-ddt-framework/
├── 📁 pages/                                → Page Object Model classes
│   ├── 🖥️  LoginPage.ts                     → POM: Login screen locators & actions
│   └── 📦 InventoryPage.ts                  → POM: Inventory screen locators & assertions
├── 📁 scripts/                              → Build & generator utilities
│   └── 📗 generateExcelData.ts              → Generates login-data.xlsx from canonical JSON
├── 📁 test-data/                            → External test datasets (Multi-Source DDT)
│   ├── 🗂️  login-data.json                  → Canonical JSON dataset (default)
│   ├── 📊 login-data.csv                   → CSV dataset
│   ├── 📝 login-data.yaml                  → YAML dataset (with comments)
│   ├── ⚙️  login-data.properties            → Java-style .properties dataset
│   └── 📗 login-data.xlsx                  → Excel spreadsheet dataset (.xlsx)
├── 📁 tests/                                → Test specifications
│   └── 🧪 login.spec.ts                     → Data-driven test suite with dynamic registration
├── 📁 utils/                                → Framework utilities, loaders & types
│   ├── 📁 dataSources/                      → Pluggable Strategy Pattern implementations
│   │   ├── 🔌 IDataSource.ts               → Common interface for all data loaders
│   │   ├── 🗂️  JsonDataSource.ts            → JSON parser & validator
│   │   ├── 📊 CsvDataSource.ts             → CSV parser & validator
│   │   ├── 📝 YamlDataSource.ts            → YAML parser (js-yaml) & validator
│   │   ├── ⚙️  PropertiesDataSource.ts      → .properties parser & validator
│   │   └── 📗 ExcelDataSource.ts           → Excel workbook parser (xlsx) & validator
│   ├── 🏭 DataSourceFactory.ts              → Factory class resolving DATA_SOURCE env var
│   ├── 🛡️  testData.ts                      → Central data gateway consumed by specs
│   └── 🏷️  types.ts                         → Shared TypeScript interfaces & types
├── 🔐 .env.example                          → Template for environment variables
├── 🚫 .gitignore                            → Git exclusion patterns
├── 📄 package.json                          → Dependencies & npm execution scripts
├── ⚙️  playwright.config.ts                  → Playwright configuration (browsers, reporters)
├── 📖 README.md                             → Comprehensive framework documentation
└── 🔷 tsconfig.json                         → TypeScript compiler options
```

---

## 🔧 Prerequisites

- **Node.js** >= 18 (LTS recommended)
- **npm** >= 9
- 🌐 Internet connection to reach `https://www.saucedemo.com`

---

## 📦 Installation

```bash
# 1️⃣ Clone or navigate to the repository
cd c:\Users\mvsar\Projects\PWDATADRIVEN

# 2️⃣ Install npm dependencies
npm install

# 3️⃣ Install Playwright browser binaries (Chromium)
npx playwright install chromium
```

---

## 🌐 Configuration

Copy `.env.example` to `.env` to configure local variables:

```bash
cp .env.example .env
```

| 🔑 Variable | 🏷️ Default | 📝 Description |
|---|---|---|
| `BASE_URL` | `https://www.saucedemo.com` | Target application base URL |
| `DATA_SOURCE` | `json` | Active data source (`json`, `csv`, `yaml`, `properties`, `excel`) |

---

## ▶️ Running Tests Across All Data Sources

Execute test runs against any data source using pre-configured npm scripts:

### 🧪 Data Source Execution Commands

| 🏷️ Data Source | 💻 Command | 📋 Description |
|---|---|---|
| 🗂️ **JSON** (Default) | `npm test` | Runs suite against `test-data/login-data.json` |
| 📊 **CSV** | `npm run test:csv` | Runs suite against `test-data/login-data.csv` |
| 📝 **YAML** | `npm run test:yaml` | Runs suite against `test-data/login-data.yaml` |
| ⚙️ **Properties** | `npm run test:properties` | Runs suite against `test-data/login-data.properties` |
| 📗 **Excel** | `npm run test:excel` | Runs suite against `test-data/login-data.xlsx` |

### 🛠️ Framework Helper Commands

```bash
# 👁️ Run tests in headed browser mode
npm run test:headed

# 🔍 Step-by-step debug in Playwright Inspector
npm run test:debug

# 🎯 Target only the login test spec
npm run test:login

# 📗 Regenerate the Excel dataset from JSON source
npm run generate:excel

# 📊 View the interactive Playwright HTML report
npm run report

# 🔷 Perform strict TypeScript type checking without running tests
npm run typecheck
```

---

## ➕ Adding Scenarios & New Data Sources

### Adding a Test Scenario
Simply append a new row or entry to your preferred data file (e.g. `test-data/login-data.json`):

```json
{
  "testCaseId": "TC_LOGIN_006",
  "testCaseName": "Locked out user authentication error",
  "username": "locked_out_user",
  "password": "secret_sauce",
  "expectedResult": "failure"
}
```
Run `npm test` — Playwright will dynamically discover and execute the new test case with **zero code modifications**.

---

### Adding a New Data Source (e.g., PostgreSQL / REST API)
1. Create `utils/dataSources/DatabaseDataSource.ts` implementing `IDataSource`:
   ```typescript
   export class DatabaseDataSource implements IDataSource {
     load(): ReadonlyArray<LoginTestCase> {
       // Query database, validate rows, and return typed array
     }
   }
   ```
2. Register the source in [`DataSourceFactory.ts`](file:///c:/Users/mvsar/Projects/PWDATADRIVEN/utils/DataSourceFactory.ts):
   ```typescript
   case "database": return new DatabaseDataSource();
   ```
3. Add a script to `package.json`:
   ```json
   "test:db": "cross-env DATA_SOURCE=database playwright test"
   ```

---

## 🐛 Troubleshooting

| ⚠️ Symptom | 🔎 Root Cause | 🔧 Resolution |
|---|---|---|
| `Test data file not found` | File path incorrect or missing | Verify target data file exists in `test-data/` |
| `Validation failed: missing or non-string field` | Malformed entry or wrong field name | Verify entries match `LoginTestCase` schema |
| `expectedResult must be 'success' or 'failure'` | Invalid value in data file | Ensure `expectedResult` is either `"success"` or `"failure"` |
| `Browser binary not found` | Playwright binaries not installed | Execute `npx playwright install chromium` |
| `cross-env command not found` | Dependencies not installed | Run `npm install` |

---

## 🚀 CI Execution

Here is an example **GitHub Actions CI workflow** executing matrix tests across all data sources:

```yaml
name: 🎭 Playwright Data-Driven CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        data-source: [json, csv, yaml, properties, excel]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: 📦 Install dependencies
        run: npm ci

      - name: 🎭 Install Playwright Browsers
        run: npx playwright install chromium --with-deps

      - name: 🧪 Run Tests (${{ matrix.data-source }})
        run: npm run test:${{ matrix.data-source }}
        env:
          BASE_URL: https://www.saucedemo.com
          CI: true

      - name: 📊 Upload HTML Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-${{ matrix.data-source }}
          path: playwright-report/
```

---

## 🎤 SDET Interview Q&A

### 1️⃣ How does this framework achieve multi-source data-driven testing?
Through the **Strategy Pattern** and a **Factory Pattern** (`DataSourceFactory`). An `IDataSource` interface defines the `load()` contract. Concrete classes parse JSON, CSV, YAML, Properties, and Excel formats into a strongly-typed `ReadonlyArray<LoginTestCase>`. The test suite only interacts with this typed array, isolating test logic from data storage details.

### 2️⃣ Why use dynamic test registration (`for...of`) instead of `test.each`?
A `for...of` loop at the top-level of a Playwright test file evaluates at module-import time and provides native TypeScript type inference without tricky array tuple casting. Each loop iteration calls `test(name, fn)`, registering an independent test with its own worker context, trace, screenshot, and video slots.

### 3️⃣ How is data integrity guaranteed before running tests?
Each `IDataSource` implementation runs runtime validation on every record. If any required field is missing or if `expectedResult` is not strictly `"success"` or `"failure"`, the process throws an explicit error immediately. This fail-fast architecture prevents wasting CI time spinning up browsers for malformed datasets.

### 4️⃣ What are the key benefits of combining POM with DDT?
- **POM** abstracts UI interactions and locators into reusable, maintainable classes.
- **DDT** decouples test data from test logic.
- Combined, test scripts focus purely on business intent: feeding data into page objects and asserting business outcomes.

---

<p align="center">
  Built with ❤️ using <strong>Playwright</strong>, <strong>TypeScript</strong>, and <strong>Clean Architecture Patterns</strong>
</p>
