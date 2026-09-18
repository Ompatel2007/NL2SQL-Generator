import type { Column, ColumnType, Dataset, DatasetExample, Table } from "./schema";
import { executeSQL } from "./sqlEngine";
import * as XLSX from "xlsx";

export interface ImportStats {
  tablesCount: number;
  rowsCount: number;
  columnsCount: number;
  emptyValuesCleaned: number;
  emptyRowsSkipped: number;
  fileNames: string[];
  detectedFormat: string;
}

export interface ImportParseResult {
  success: boolean;
  error?: string;
  dataset?: Dataset;
  stats?: ImportStats;
}

const WASTE_PATTERNS = new Set([
  "",
  "nan",
  "null",
  "none",
  "n/a",
  "na",
  "#n/a",
  "#na",
  "#value!",
  "#ref!",
  "#div/0!",
  "#num!",
  "#name?",
  "#null!",
  "-",
  "--",
  "nil",
  "undefined",
  "?",
]);

/**
 * Checks if a value is empty, waste, or NaN.
 */
export function isWasteValue(val: unknown): boolean {
  if (val === null || val === undefined) return true;
  if (typeof val === "number" && Number.isNaN(val)) return true;
  const str = String(val).trim().toLowerCase();
  return WASTE_PATTERNS.has(str);
}

/**
 * Sanitizes an identifier (e.g. table name or column name) to be safe for SQL.
 */
export function sanitizeIdentifier(name: string, fallback = "item"): string {
  let cleaned = name
    .trim()
    .toLowerCase()
    .replace(/[^\w]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!cleaned) cleaned = fallback;
  if (/^\d/.test(cleaned)) cleaned = `col_${cleaned}`;
  return cleaned;
}

/**
 * Clean column names, handling duplicates and empty headers.
 */
export function sanitizeColumns(rawColumns: string[]): string[] {
  const seen = new Map<string, number>();
  return rawColumns.map((col, idx) => {
    let clean = sanitizeIdentifier(col || `col_${idx + 1}`);
    const count = seen.get(clean) || 0;
    seen.set(clean, count + 1);
    if (count > 0) {
      clean = `${clean}_${count + 1}`;
    }
    return clean;
  });
}

/**
 * Robust CSV/TSV parser supporting delimiters, escaped quotes, multiline values, and BOM.
 */
export function parseDelimitedText(
  text: string,
  providedDelimiter?: string,
): { headers: string[]; rows: string[][] } {
  // Strip BOM if present
  let cleanText = text.replace(/^\uFEFF/, "");

  // Auto-detect delimiter if not provided
  let delimiter = providedDelimiter;
  if (!delimiter) {
    const firstLine = cleanText.split(/\r?\n/)[0] || "";
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semiCount = (firstLine.match(/;/g) || []).length;
    const pipeCount = (firstLine.match(/\|/g) || []).length;

    if (tabCount > commaCount && tabCount > semiCount) delimiter = "\t";
    else if (semiCount > commaCount && semiCount > tabCount) delimiter = ";";
    else if (pipeCount > commaCount && pipeCount > tabCount) delimiter = "|";
    else delimiter = ",";
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let insideQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentCell += '"';
          i++; // Skip escaped quote
        } else {
          insideQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === delimiter) {
        currentRow.push(currentCell);
        currentCell = "";
      } else if (char === "\r" && nextChar === "\n") {
        currentRow.push(currentCell);
        currentCell = "";
        rows.push(currentRow);
        currentRow = [];
        i++; // Skip \n
      } else if (char === "\n" || char === "\r") {
        currentRow.push(currentCell);
        currentCell = "";
        rows.push(currentRow);
        currentRow = [];
      } else {
        currentCell += char;
      }
    }
  }

  // Push final cell and row if any
  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  if (rows.length === 0) {
    return { headers: [], rows: [] };
  }

  const rawHeaders = rows[0].map((h) => h.trim());
  const dataRows = rows.slice(1);

  return {
    headers: rawHeaders,
    rows: dataRows,
  };
}

/**
 * Infer SQL column type from an array of sample values.
 */
export function inferColumnType(values: unknown[]): ColumnType {
  const nonNull = values.filter((v) => !isWasteValue(v));
  if (nonNull.length === 0) return "TEXT";

  let isAllInteger = true;
  let isAllNumeric = true;
  let isAllBoolean = true;
  let isAllDate = true;

  for (const raw of nonNull) {
    const s = String(raw).trim();

    // Check Boolean
    const lower = s.toLowerCase();
    if (lower !== "true" && lower !== "false" && lower !== "1" && lower !== "0") {
      isAllBoolean = false;
    }

    // Check Integer
    if (!/^-?\d+$/.test(s)) {
      isAllInteger = false;
    } else {
      const num = Number(s);
      if (!Number.isSafeInteger(num)) isAllInteger = false;
    }

    // Check Numeric (float/real)
    if (!/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(s)) {
      isAllNumeric = false;
    }

    // Check Date (YYYY-MM-DD or ISO 8601)
    if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?)?Z?$/.test(s)) {
      isAllDate = false;
    }
  }

  if (isAllBoolean) return "BOOLEAN";
  if (isAllInteger) return "INTEGER";
  if (isAllNumeric) return "REAL";
  if (isAllDate) return "DATE";
  return "TEXT";
}

/**
 * Casts a single value into its target SQL column type, mapping empty/waste/NaN to null.
 */
export function castValue(
  val: unknown,
  type: ColumnType,
): string | number | null {
  if (isWasteValue(val)) return null;

  const s = String(val).trim();
  switch (type) {
    case "INTEGER": {
      const parsed = parseInt(s, 10);
      return Number.isNaN(parsed) ? null : parsed;
    }
    case "REAL":
    case "FLOAT":
    case "DOUBLE":
    case "NUMERIC": {
      const parsed = parseFloat(s);
      return Number.isNaN(parsed) ? null : parsed;
    }
    case "BOOLEAN": {
      const lower = s.toLowerCase();
      if (lower === "true" || lower === "1") return 1;
      if (lower === "false" || lower === "0") return 0;
      return null;
    }
    case "DATE":
    case "TEXT":
    case "VARCHAR":
    default:
      return s;
  }
}

/**
 * Cleans and structures raw records into a validated Table object.
 */
export function buildTableFromRecords(
  tableName: string,
  records: Record<string, unknown>[],
): { table: Table; emptyValuesCleaned: number; emptyRowsSkipped: number } {
  let emptyValuesCleaned = 0;
  let emptyRowsSkipped = 0;

  if (!records || records.length === 0) {
    return {
      table: {
        name: sanitizeIdentifier(tableName, "table_1"),
        columns: [{ name: "id", type: "INTEGER", pk: true }],
        rows: [],
      },
      emptyValuesCleaned: 0,
      emptyRowsSkipped: 0,
    };
  }

  // 1. Gather all unique column names
  const rawKeySet = new Set<string>();
  for (const record of records) {
    if (record && typeof record === "object") {
      Object.keys(record).forEach((k) => rawKeySet.add(k));
    }
  }

  const rawKeys = Array.from(rawKeySet);
  const cleanKeys = sanitizeColumns(rawKeys);
  const keyMap = new Map<string, string>();
  rawKeys.forEach((raw, i) => keyMap.set(raw, cleanKeys[i]));

  // 2. Filter out completely waste rows & clean values
  const validRows: Record<string, unknown>[] = [];
  for (const record of records) {
    if (!record || typeof record !== "object") {
      emptyRowsSkipped++;
      continue;
    }

    let hasAnyValue = false;
    const cleanRow: Record<string, unknown> = {};

    for (const rawKey of rawKeys) {
      const cleanKey = keyMap.get(rawKey)!;
      const val = record[rawKey];
      if (isWasteValue(val)) {
        emptyValuesCleaned++;
        cleanRow[cleanKey] = null;
      } else {
        hasAnyValue = true;
        cleanRow[cleanKey] = val;
      }
    }

    if (!hasAnyValue) {
      emptyRowsSkipped++;
    } else {
      validRows.push(cleanRow);
    }
  }

  // 3. Infer column types
  const columns: Column[] = cleanKeys.map((colName) => {
    const colValues = validRows.map((r) => r[colName]);
    const inferredType = inferColumnType(colValues);
    return {
      name: colName,
      type: inferredType,
    };
  });

  // 4. Cast values according to inferred types
  const finalRows: Record<string, string | number>[] = validRows.map((row) => {
    const typedRow: Record<string, string | number> = {};
    for (const col of columns) {
      const casted = castValue(row[col.name], col.type);
      // In DBMS engine, null is represented as null or empty string
      typedRow[col.name] = casted as unknown as string;
    }
    return typedRow;
  });

  // 5. Detect candidate Primary Key
  // Check for 'id' or '<tableName>_id'
  const targetIdCol = columns.find(
    (c) => c.name === "id" || c.name === `${sanitizeIdentifier(tableName)}_id`,
  );

  let pkColumn: Column | undefined = undefined;
  if (targetIdCol && finalRows.length > 0) {
    const nonNullValues = finalRows
      .map((r) => r[targetIdCol.name])
      .filter((v) => v !== null && v !== undefined && v !== "");
    const uniqueValues = new Set(nonNullValues);
    if (nonNullValues.length === finalRows.length && uniqueValues.size === finalRows.length) {
      targetIdCol.pk = true;
      pkColumn = targetIdCol;
    }
  }

  // If no 'id' column found, look for any unique integer or text column
  if (!pkColumn && finalRows.length > 0) {
    for (const col of columns) {
      if (col.type === "INTEGER" || col.type === "TEXT") {
        const vals = finalRows.map((r) => r[col.name]).filter((v) => v !== null && v !== undefined && v !== "");
        if (vals.length === finalRows.length && new Set(vals).size === finalRows.length) {
          col.pk = true;
          pkColumn = col;
          break;
        }
      }
    }
  }

  return {
    table: {
      name: sanitizeIdentifier(tableName, "imported_table"),
      columns,
      rows: finalRows,
    },
    emptyValuesCleaned,
    emptyRowsSkipped,
  };
}

/**
 * Parses raw text from a CSV / TSV file into a structured Table.
 */
export function parseCSVToTable(
  content: string,
  fileName: string,
): { table: Table; emptyValuesCleaned: number; emptyRowsSkipped: number } {
  const baseName = fileName.replace(/\.[^/.]+$/, "");
  const { headers, rows } = parseDelimitedText(content);

  if (headers.length === 0) {
    throw new Error(`The file "${fileName}" does not contain any headers or rows.`);
  }

  // Convert string[][] rows to Record<string, unknown>[]
  const records: Record<string, unknown>[] = [];
  for (const row of rows) {
    const rec: Record<string, unknown> = {};
    for (let i = 0; i < headers.length; i++) {
      rec[headers[i]] = row[i] !== undefined ? row[i] : null;
    }
    records.push(rec);
  }

  return buildTableFromRecords(baseName, records);
}

/**
 * Parses raw JSON content into one or more structured Tables.
 */
export function parseJSONToTables(
  content: string,
  fileName: string,
): { tables: Table[]; datasetName?: string; description?: string; emptyValuesCleaned: number; emptyRowsSkipped: number } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    throw new Error(`Invalid JSON syntax in "${fileName}": ${errMsg}`);
  }

  if (!parsed || (typeof parsed !== "object" && !Array.isArray(parsed))) {
    throw new Error(`"${fileName}" must contain a JSON object or array of records.`);
  }

  let totalCleaned = 0;
  let totalSkipped = 0;
  const baseName = fileName.replace(/\.[^/.]+$/, "");

  // Format 1: Full Dataset Export { id, name, description, schema: Table[], ... }
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    !Array.isArray(parsed) &&
    "schema" in parsed &&
    Array.isArray((parsed as Record<string, unknown>).schema)
  ) {
    const rawSchema = (parsed as { schema: unknown[] }).schema;
    const tables: Table[] = [];
    for (const rawT of rawSchema) {
      if (rawT && typeof rawT === "object" && "name" in rawT && "columns" in rawT) {
        const t = rawT as Table;
        tables.push(t);
      }
    }
    if (tables.length > 0) {
      const p = parsed as Record<string, unknown>;
      return {
        tables,
        datasetName: typeof p.name === "string" ? p.name : baseName,
        description: typeof p.description === "string" ? p.description : undefined,
        emptyValuesCleaned: 0,
        emptyRowsSkipped: 0,
      };
    }
  }

  // Format 2: Array of records [ { col: val }, ... ]
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      throw new Error(`"${fileName}" contains an empty JSON array.`);
    }
    if (typeof parsed[0] !== "object" || parsed[0] === null) {
      throw new Error(`"${fileName}" array elements must be objects with key-value fields.`);
    }

    const { table, emptyValuesCleaned, emptyRowsSkipped } = buildTableFromRecords(
      baseName,
      parsed as Record<string, unknown>[],
    );
    return {
      tables: [table],
      datasetName: baseName,
      emptyValuesCleaned,
      emptyRowsSkipped,
    };
  }

  // Format 3: Object containing tables or data dictionary { "table_name": [ { ... } ] }
  const obj = parsed as Record<string, unknown>;

  // Check if there's a 'data' or 'rows' array
  if (Array.isArray(obj.data) && obj.data.length > 0 && typeof obj.data[0] === "object") {
    const { table, emptyValuesCleaned, emptyRowsSkipped } = buildTableFromRecords(
      baseName,
      obj.data as Record<string, unknown>[],
    );
    return {
      tables: [table],
      datasetName: baseName,
      emptyValuesCleaned,
      emptyRowsSkipped,
    };
  }

  if (Array.isArray(obj.rows) && obj.rows.length > 0 && typeof obj.rows[0] === "object") {
    const { table, emptyValuesCleaned, emptyRowsSkipped } = buildTableFromRecords(
      baseName,
      obj.rows as Record<string, unknown>[],
    );
    return {
      tables: [table],
      datasetName: baseName,
      emptyValuesCleaned,
      emptyRowsSkipped,
    };
  }

  // Multi-table map: each key is a table name, each value is an array of records
  const tables: Table[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object") {
      const { table, emptyValuesCleaned, emptyRowsSkipped } = buildTableFromRecords(
        key,
        value as Record<string, unknown>[],
      );
      tables.push(table);
      totalCleaned += emptyValuesCleaned;
      totalSkipped += emptyRowsSkipped;
    }
  }

  if (tables.length === 0) {
    throw new Error(
      `No tabular records found in "${fileName}". Ensure your JSON contains an array of objects or key-value table mappings.`,
    );
  }

  return {
    tables,
    datasetName: baseName,
    emptyValuesCleaned: totalCleaned,
    emptyRowsSkipped: totalSkipped,
  };
}

/**
 * Parses SQL DDL and DML script into structured Tables using in-memory executeSQL.
 */
export function parseSQLToTables(
  sqlContent: string,
  fileName: string,
): { tables: Table[]; emptyValuesCleaned: number; emptyRowsSkipped: number } {
  const baseName = fileName.replace(/\.[^/.]+$/, "");
  if (!sqlContent.trim()) {
    throw new Error(`The SQL file "${fileName}" is empty.`);
  }

  const result = executeSQL(sqlContent, []);
  if (result.error) {
    throw new Error(`SQL execution error in "${fileName}": ${result.error}`);
  }

  if (!result.updatedSchema || result.updatedSchema.length === 0) {
    throw new Error(
      `No tables were created by "${fileName}". Make sure the SQL file contains valid CREATE TABLE statements.`,
    );
  }

  return {
    tables: result.updatedSchema,
    emptyValuesCleaned: 0,
    emptyRowsSkipped: 0,
  };
}

/**
 * Parses raw ArrayBuffer from an Excel file (.xlsx, .xls, .xlsm) into structured Tables.
 * Supports multiple sheets, converting each sheet into a separate table.
 */
export function parseExcelToTables(
  buffer: ArrayBuffer,
  fileName: string,
): { tables: Table[]; datasetName?: string; emptyValuesCleaned: number; emptyRowsSkipped: number } {
  const baseName = fileName.replace(/\.[^/.]+$/, "");
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to parse Excel file "${fileName}": ${msg}`);
  }

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error(`The Excel file "${fileName}" does not contain any sheets.`);
  }

  const tables: Table[] = [];
  let totalCleaned = 0;
  let totalSkipped = 0;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: null,
      raw: true,
    });

    if (rawRows.length === 0) continue;

    // Convert Date objects to ISO YYYY-MM-DD strings so SQL and tables handle them cleanly
    const formattedRows: Record<string, unknown>[] = rawRows.map((row) => {
      const formatted: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(row)) {
        if (v instanceof Date) {
          formatted[k] = v.toISOString().slice(0, 10);
        } else {
          formatted[k] = v;
        }
      }
      return formatted;
    });

    const targetTableName =
      workbook.SheetNames.length === 1
        ? baseName
        : `${baseName}_${sheetName}`;

    const { table, emptyValuesCleaned, emptyRowsSkipped } = buildTableFromRecords(
      targetTableName,
      formattedRows,
    );

    tables.push(table);
    totalCleaned += emptyValuesCleaned;
    totalSkipped += emptyRowsSkipped;
  }

  if (tables.length === 0) {
    throw new Error(`No data rows found across any sheets in Excel file "${fileName}".`);
  }

  return {
    tables,
    datasetName: baseName,
    emptyValuesCleaned: totalCleaned,
    emptyRowsSkipped: totalSkipped,
  };
}

/**
 * Main entry point: parses one or more uploaded files into a unified Dataset.
 */
export async function parseImportedFiles(
  files: FileList | File[],
): Promise<ImportParseResult> {
  const fileArray = Array.from(files);
  if (fileArray.length === 0) {
    return {
      success: false,
      error: "No files were selected. Please select a .csv, .json, .tsv, or .sql file.",
    };
  }

  const allTables: Table[] = [];
  let totalEmptyCleaned = 0;
  let totalRowsSkipped = 0;
  let detectedFormat = "";
  const fileNames: string[] = [];
  let inferredDatasetName = "";
  let inferredDescription = "";

  try {
    for (const file of fileArray) {
      fileNames.push(file.name);
      if (file.size === 0) {
        return {
          success: false,
          error: `The file "${file.name}" is completely empty (0 bytes). Please provide a valid file with data.`,
        };
      }

      const ext = file.name.split(".").pop()?.toLowerCase() || "";

      if (ext === "xlsx" || ext === "xls" || ext === "xlsm") {
        detectedFormat = ext.toUpperCase();
        const buffer = await file.arrayBuffer();
        const { tables, datasetName, emptyValuesCleaned, emptyRowsSkipped } =
          parseExcelToTables(buffer, file.name);
        allTables.push(...tables);
        totalEmptyCleaned += emptyValuesCleaned;
        totalRowsSkipped += emptyRowsSkipped;
        if (datasetName && !inferredDatasetName) inferredDatasetName = datasetName;
      } else if (ext === "csv" || ext === "tsv" || ext === "tab" || ext === "txt") {
        detectedFormat = ext.toUpperCase();
        const text = await file.text();
        const { table, emptyValuesCleaned, emptyRowsSkipped } = parseCSVToTable(
          text,
          file.name,
        );
        allTables.push(table);
        totalEmptyCleaned += emptyValuesCleaned;
        totalRowsSkipped += emptyRowsSkipped;
        if (!inferredDatasetName) inferredDatasetName = table.name;
      } else if (ext === "json") {
        detectedFormat = "JSON";
        const text = await file.text();
        const {
          tables,
          datasetName,
          description,
          emptyValuesCleaned,
          emptyRowsSkipped,
        } = parseJSONToTables(text, file.name);
        allTables.push(...tables);
        totalEmptyCleaned += emptyValuesCleaned;
        totalRowsSkipped += emptyRowsSkipped;
        if (datasetName && !inferredDatasetName) inferredDatasetName = datasetName;
        if (description && !inferredDescription) inferredDescription = description;
      } else if (ext === "sql") {
        detectedFormat = "SQL";
        const text = await file.text();
        const { tables, emptyValuesCleaned, emptyRowsSkipped } = parseSQLToTables(
          text,
          file.name,
        );
        allTables.push(...tables);
        totalEmptyCleaned += emptyValuesCleaned;
        totalRowsSkipped += emptyRowsSkipped;
        if (!inferredDatasetName) inferredDatasetName = file.name.replace(/\.[^/.]+$/, "");
      } else {
        return {
          success: false,
          error: `Unsupported file format ".${ext}" for "${file.name}". Supported formats are Excel (.xlsx, .xls), CSV, TSV, JSON, and SQL.`,
        };
      }
    }

    if (allTables.length === 0) {
      return {
        success: false,
        error: "No valid database tables could be extracted from the selected file(s).",
      };
    }

    // Deduplicate table names if multiple files had the same table name
    const seenNames = new Set<string>();
    for (const t of allTables) {
      let original = t.name;
      let counter = 2;
      while (seenNames.has(t.name)) {
        t.name = `${original}_${counter++}`;
      }
      seenNames.add(t.name);
    }

    // Format human-friendly dataset name
    const datasetDisplayName =
      (inferredDatasetName || fileNames[0].replace(/\.[^/.]+$/, ""))
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim() || "Imported Dataset";

    const totalRows = allTables.reduce((sum, t) => sum + (t.rows?.length || 0), 0);
    const totalCols = allTables.reduce((sum, t) => sum + (t.columns?.length || 0), 0);

    const defaultQuery = allTables[0]?.name
      ? `SELECT * FROM ${allTables[0].name} LIMIT 10;`
      : "SELECT 1;";

    const examples: DatasetExample[] = [
      {
        id: 1,
        category: "DQL",
        question: `Show first 10 records from ${allTables[0].name}`,
        sql: defaultQuery,
        expected: `Query all rows from ${allTables[0].name}`,
      },
    ];

    if (allTables[0]?.rows && allTables[0].rows.length > 0) {
      examples.push({
        id: 2,
        category: "DQL",
        question: `Count total records in ${allTables[0].name}`,
        sql: `SELECT COUNT(*) FROM ${allTables[0].name};`,
        expected: `Total rows in ${allTables[0].name}`,
      });
    }

    const dataset: Dataset = {
      id: `custom_import_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: datasetDisplayName,
      description:
        inferredDescription ||
        `Imported dataset with ${allTables.length} table${allTables.length > 1 ? "s" : ""} and ${totalRows} total row${totalRows !== 1 ? "s" : ""}.`,
      schema: allTables,
      defaultQuery,
      examples,
      isCustom: true,
      createdAt: Date.now(),
    };

    const stats: ImportStats = {
      tablesCount: allTables.length,
      rowsCount: totalRows,
      columnsCount: totalCols,
      emptyValuesCleaned: totalEmptyCleaned,
      emptyRowsSkipped: totalRowsSkipped,
      fileNames,
      detectedFormat: fileArray.length > 1 ? "Multi-File" : detectedFormat,
    };

    return {
      success: true,
      dataset,
      stats,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: errorMsg,
    };
  }
}
