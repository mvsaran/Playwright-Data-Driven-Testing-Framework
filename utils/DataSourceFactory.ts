/**
 * utils/DataSourceFactory.ts
 *
 * Factory (Registry pattern) that maps a source-type string to a concrete
 * IDataSource implementation.
 *
 * The active source is controlled by the DATA_SOURCE environment variable:
 *
 *   $env:DATA_SOURCE = "json"        # (default) test-data/login-data.json
 *   $env:DATA_SOURCE = "csv"         # test-data/login-data.csv
 *   $env:DATA_SOURCE = "yaml"        # test-data/login-data.yaml
 *   $env:DATA_SOURCE = "properties"  # test-data/login-data.properties
 *   $env:DATA_SOURCE = "excel"       # test-data/login-data.xlsx
 *
 * On CI (GitHub Actions, Azure DevOps, Jenkins …):
 *   env:
 *     DATA_SOURCE: excel
 *
 * Extending with a new source (e.g. "database"):
 *   1. Create utils/dataSources/DatabaseDataSource.ts implementing IDataSource.
 *   2. Import it below.
 *   3. Add a case "database" to the switch statement.
 *   No changes to any test file are needed.
 */

import { IDataSource } from "./dataSources/IDataSource";
import { JsonDataSource }       from "./dataSources/JsonDataSource";
import { CsvDataSource }        from "./dataSources/CsvDataSource";
import { YamlDataSource }       from "./dataSources/YamlDataSource";
import { PropertiesDataSource } from "./dataSources/PropertiesDataSource";
import { ExcelDataSource }      from "./dataSources/ExcelDataSource";

/** All supported source-type identifiers (lower-cased). */
export type DataSourceType = "json" | "csv" | "yaml" | "properties" | "excel";

export class DataSourceFactory {
  /**
   * Creates and returns the IDataSource implementation that corresponds to
   * the given source-type string.
   *
   * @param type  - One of the supported DATA_SOURCE values (case-insensitive).
   *                Falls back to "json" for any unrecognised value.
   * @param filePath - Optional absolute path override for the data file.
   *                   When omitted, each implementation uses its default path.
   */
  static create(type: string, filePath?: string): IDataSource {
    const normalised = type.toLowerCase().trim() as DataSourceType;

    switch (normalised) {
      case "csv":
        return new CsvDataSource(filePath);

      case "yaml":
        return new YamlDataSource(filePath);

      case "properties":
        return new PropertiesDataSource(filePath);

      case "excel":
        return new ExcelDataSource(filePath);

      case "json":
      default: {
        if (normalised !== "json") {
          console.warn(
            `DataSourceFactory: unknown type "${type}". Falling back to JSON.`
          );
        }
        return new JsonDataSource(filePath);
      }
    }
  }

  /**
   * Returns the list of supported source type identifiers.
   * Useful for generating help text or validation messages.
   */
  static supportedTypes(): ReadonlyArray<DataSourceType> {
    return ["json", "csv", "yaml", "properties", "excel"];
  }
}
