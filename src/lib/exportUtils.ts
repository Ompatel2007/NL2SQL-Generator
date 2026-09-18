import type { Table } from "./schema";
import type { Row } from "./sqlEngine";
import type { HistoryItem } from "@/components/nlSqlTypes";
import { triggerFileDownload } from "./reportGenerator";
import * as XLSX from "xlsx";

/**
 * Generates full DDL (CREATE TABLE) and DML (INSERT INTO) SQL script for a dataset schema.
 */
export function generateDatasetSQL(datasetName: string, schema: Table[]): string {
  const lines: string[] = [
    `-- SQL Schema and Data Export for Dataset: ${datasetName}`,
    `-- Exported at: ${new Date().toISOString()}`,
    "",
  ];

  for (const table of schema) {
    lines.push(`-- Table: ${table.name}`);
    lines.push(`DROP TABLE IF EXISTS ${table.name};`);

    const colDefs = (table.columns || []).map((col) => {
      let def = `  ${col.name} ${col.type || "TEXT"}`;
      if (col.pk) def += " PRIMARY KEY";
      if (col.fk && col.fk.table) {
        def += ` REFERENCES ${col.fk.table}(${col.fk.column})`;
      }
      return def;
    });

    lines.push(`CREATE TABLE ${table.name} (\n${colDefs.join(",\n")}\n);`);
    lines.push("");

    if (table.rows && table.rows.length > 0) {
      const colNames = (table.columns || []).map((c) => c.name);
      lines.push(`INSERT INTO ${table.name} (${colNames.join(", ")}) VALUES`);

      const rowStrings = table.rows.map((row) => {
        const vals = colNames.map((col) => {
          const val = row[col];
          if (val === null || val === undefined) return "NULL";
          if (typeof val === "number") return String(val);
          if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
          return `'${String(val).replace(/'/g, "''")}'`;
        });
        return `  (${vals.join(", ")})`;
      });

      lines.push(rowStrings.join(",\n") + ";");
      lines.push("");
    }
  }

  return lines.join("\n");
}

/**
 * Generates CSV string for a single table in a dataset.
 */
export function generateTableCSV(table: Table): string {
  const escapeValue = (val: unknown) =>
    `"${String(val ?? "").replace(/"/g, '""')}"`;

  const colNames = (table.columns || []).map((c) => c.name);
  const header = colNames.map(escapeValue).join(",");
  const rows = (table.rows || []).map((row) =>
    colNames.map((col) => escapeValue(row[col])).join(",")
  );

  return [header, ...rows].join("\n");
}

// -------------------------------------------------------------
// Execution Result Exporters (CSV, Excel, MD, JSON, TSV, SQL, .DB)
// -------------------------------------------------------------

export function exportResultCSV(columns: string[], rows: Row[], filename = "results.csv") {
  const escapeValue = (val: unknown) =>
    `"${String(val ?? "").replace(/"/g, '""')}"`;

  const header = columns.map(escapeValue).join(",");
  const dataRows = (rows || []).map((row) =>
    columns.map((col) => escapeValue(row[col])).join(","),
  );

  const csv = [header, ...dataRows].join("\n");
  triggerFileDownload(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
    filename.endsWith(".csv") ? filename : `${filename}.csv`,
  );
}

export function exportResultTSV(columns: string[], rows: Row[], filename = "results.tsv") {
  const cleanTab = (val: unknown) =>
    String(val ?? "").replace(/\t/g, " ").replace(/\r?\n/g, " ");

  const header = columns.map(cleanTab).join("\t");
  const dataRows = (rows || []).map((row) =>
    columns.map((col) => cleanTab(row[col])).join("\t"),
  );

  const tsv = [header, ...dataRows].join("\n");
  triggerFileDownload(
    new Blob([tsv], { type: "text/tab-separated-values;charset=utf-8" }),
    filename.endsWith(".tsv") ? filename : `${filename}.tsv`,
  );
}

export function exportResultJSON(columns: string[], rows: Row[], filename = "results.json") {
  const json = JSON.stringify(rows || [], null, 2);
  triggerFileDownload(
    new Blob([json], { type: "application/json;charset=utf-8" }),
    filename.endsWith(".json") ? filename : `${filename}.json`,
  );
}

export function exportResultMarkdown(columns: string[], rows: Row[], filename = "results.md") {
  if (!columns.length) {
    triggerFileDownload(new Blob(["_No result columns._"], { type: "text/markdown;charset=utf-8" }), filename);
    return;
  }

  const header = `| ${columns.join(" | ")} |`;
  const sep = `| ${columns.map(() => "---").join(" | ")} |`;
  const dataRows = (rows || []).map(
    (row) => `| ${columns.map((c) => String(row[c] ?? "")).join(" | ")} |`,
  );

  const md = [`# Query Execution Result`, "", `**Total Rows:** ${rows.length}`, "", header, sep, ...dataRows].join("\n");
  triggerFileDownload(
    new Blob([md], { type: "text/markdown;charset=utf-8" }),
    filename.endsWith(".md") ? filename : `${filename}.md`,
  );
}

export function exportResultExcel(columns: string[], rows: Row[], filename = "results.xlsx") {
  const ws = XLSX.utils.json_to_sheet(rows || [], { header: columns });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Result");
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  triggerFileDownload(
    new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`,
  );
}

export function exportResultSQL(
  columns: string[],
  rows: Row[],
  tableName = "query_results",
  filename = "results.sql",
) {
  const safeTable = tableName.replace(/[^\w]/g, "_") || "query_results";
  const lines: string[] = [
    `-- Exported Query Results: ${new Date().toISOString()}`,
    `-- Table: ${safeTable} (${rows.length} rows)`,
    "",
    `DROP TABLE IF EXISTS ${safeTable};`,
  ];

  const colDefs = columns.map((c) => `  "${c.replace(/"/g, '""')}" TEXT`);
  lines.push(`CREATE TABLE ${safeTable} (\n${colDefs.join(",\n")}\n);`);
  lines.push("");

  if (rows && rows.length > 0) {
    const colNames = columns.map((c) => `"${c.replace(/"/g, '""')}"`).join(", ");
    lines.push(`INSERT INTO ${safeTable} (${colNames}) VALUES`);

    const rowStrings = rows.map((row) => {
      const vals = columns.map((col) => {
        const val = row[col];
        if (val === null || val === undefined) return "NULL";
        if (typeof val === "number") return String(val);
        if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
        return `'${String(val).replace(/'/g, "''")}'`;
      });
      return `  (${vals.join(", ")})`;
    });

    lines.push(rowStrings.join(",\n") + ";");
  }

  const sql = lines.join("\n");
  triggerFileDownload(
    new Blob([sql], { type: "application/sql;charset=utf-8" }),
    filename.endsWith(".sql") ? filename : `${filename}.sql`,
  );
}

export async function exportResultSqliteDB(
  columns: string[],
  rows: Row[],
  tableName = "query_results",
  filename = "results.db",
) {
  const sqlJsModule = await import("sql.js");
  const initSqlJs = sqlJsModule.default || sqlJsModule;
  const SQL = await initSqlJs({
    locateFile: () => "/sql-wasm.wasm",
  });

  const db = new SQL.Database();
  try {
    const safeTable = tableName.replace(/[^\w]/g, "_") || "query_results";
    const colDefs = columns.map((c) => `"${c.replace(/"/g, '""')}" TEXT`).join(", ");
    db.run(`CREATE TABLE ${safeTable} (${colDefs || "col TEXT"});`);

    if (rows && rows.length > 0 && columns.length > 0) {
      const placeholders = columns.map(() => "?").join(", ");
      const stmt = db.prepare(`INSERT INTO ${safeTable} VALUES (${placeholders});`);
      for (const row of rows) {
        const vals = columns.map((col) => {
          const v = row[col];
          return v !== undefined && v !== null ? v : null;
        });
        stmt.run(vals);
      }
      stmt.free();
    }

    const binaryData = db.export();
    triggerFileDownload(
      new Blob([binaryData.buffer as ArrayBuffer], { type: "application/x-sqlite3" }),
      filename.endsWith(".db") ? filename : `${filename}.db`,
    );
  } finally {
    db.close();
  }
}

// -------------------------------------------------------------
// History Exporter (All History Present)
// -------------------------------------------------------------

export function exportHistory(
  history: HistoryItem[],
  format: "json" | "csv" | "md" | "sql",
  filename = "query_history",
) {
  if (format === "json") {
    const json = JSON.stringify(history, null, 2);
    triggerFileDownload(
      new Blob([json], { type: "application/json;charset=utf-8" }),
      `${filename}.json`,
    );
  } else if (format === "csv") {
    const escapeCsv = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const headers = ["ID", "Time", "Question", "SQL", "Rows_Returned", "Statement_Type", "Command"];
    const rows = history.map((h) =>
      [
        escapeCsv(h.id),
        escapeCsv(h.time),
        escapeCsv(h.question),
        escapeCsv(h.sql),
        escapeCsv(h.rows),
        escapeCsv(h.statementType || "DQL"),
        escapeCsv(h.command || "SELECT"),
      ].join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    triggerFileDownload(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
      `${filename}.csv`,
    );
  } else if (format === "md") {
    const lines: string[] = [
      `# NL to SQL Visualizer — Query Execution History`,
      `**Exported:** ${new Date().toLocaleString()}`,
      `**Total Queries:** ${history.length}`,
      "",
    ];

    history.forEach((h, idx) => {
      lines.push(`### #${idx + 1} — ${h.time}`);
      if (h.question) {
        lines.push(`- **Question:** "${h.question}"`);
      }
      lines.push(`- **Rows Returned:** ${h.rows}`);
      lines.push(`- **Type:** ${h.statementType || "DQL"} (${h.command || "SELECT"})`);
      lines.push("```sql");
      lines.push(h.sql);
      lines.push("```");
      lines.push("");
    });

    triggerFileDownload(
      new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" }),
      `${filename}.md`,
    );
  } else if (format === "sql") {
    const lines: string[] = [
      `-- NL to SQL Query Execution History`,
      `-- Exported at: ${new Date().toISOString()}`,
      `-- Total Records: ${history.length}`,
      "",
    ];

    history.forEach((h, idx) => {
      lines.push(`-- [Query #${idx + 1}] Time: ${h.time} | Rows: ${h.rows}`);
      if (h.question) {
        lines.push(`-- Prompt: ${h.question.replace(/\r?\n/g, " ")}`);
      }
      lines.push(`${h.sql.trim().replace(/;*$/, "")};`);
      lines.push("");
    });

    triggerFileDownload(
      new Blob([lines.join("\n")], { type: "application/sql;charset=utf-8" }),
      `${filename}.sql`,
    );
  }
}
