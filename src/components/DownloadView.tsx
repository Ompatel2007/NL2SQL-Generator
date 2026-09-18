"use client";

import { useState } from "react";
import type { Table, Dataset } from "@/lib/schema";
import type { Row } from "@/lib/sqlEngine";
import type { HistoryItem, ThemeId } from "./nlSqlTypes";
import {
  downloadPdfReport,
  downloadDocxReport,
  generateMarkdownReport,
  generateTextReport,
  triggerFileDownload,
  type ReportExecutionData,
} from "@/lib/reportGenerator";
import {
  exportResultCSV,
  exportResultExcel,
  exportResultJSON,
  exportResultMarkdown,
  exportResultSQL,
  exportResultSqliteDB,
  exportResultTSV,
  exportHistory,
  generateDatasetSQL,
  generateTableCSV,
} from "@/lib/exportUtils";
import {
  downloadERDiagram,
  generateChenErDiagramPng,
} from "@/lib/erDiagramExport";

interface DownloadViewProps {
  onBackToWorkspace?: () => void;
  dataset: Dataset;
  activeSchema: Table[];
  lastExecutionData: ReportExecutionData | null;
  finalRows: Row[];
  columns: string[];
  history: HistoryItem[];
  theme?: ThemeId;
  hasExecuted: boolean;
}

export function DownloadView({
  onBackToWorkspace,
  dataset,
  activeSchema,
  lastExecutionData,
  finalRows,
  columns,
  history,
  theme = "slate",
  hasExecuted,
}: DownloadViewProps) {
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Helper to ensure ReportExecutionData is equipped with ER Diagram image
  const prepareReportDataWithER = async (): Promise<ReportExecutionData> => {
    let baseData: ReportExecutionData;
    if (lastExecutionData) {
      baseData = { ...lastExecutionData, schema: activeSchema };
    } else {
      // Create execution data from current dataset state if none executed yet
      baseData = {
        sql: dataset.defaultQuery,
        nlQuestion: dataset.examples[0]?.question,
        inputMode: "sql",
        datasetName: dataset.name,
        tables: activeSchema.map((t) => t.name),
        schema: activeSchema,
        steps: [],
        finalRows: finalRows.length > 0 ? finalRows : (activeSchema[0]?.rows ?? []),
        columns: columns.length > 0 ? columns : (activeSchema[0]?.columns?.map((c) => c.name) ?? []),
        explanation: {
          sql: dataset.defaultQuery,
          statementType: "DQL",
          command: "SELECT",
          summary: `Database execution report for dataset "${dataset.name}".`,
          steps: [],
          pipelineConnection: [],
          finalOutputSummary: {
            rowCount: finalRows.length > 0 ? finalRows.length : (activeSchema[0]?.rows?.length ?? 0),
            columnCount: columns.length > 0 ? columns.length : (activeSchema[0]?.columns?.length ?? 0),
            columns: columns.length > 0 ? columns : (activeSchema[0]?.columns?.map((c) => c.name) ?? []),
            sampleData: (finalRows.length > 0 ? finalRows : (activeSchema[0]?.rows ?? [])).slice(0, 5),
          },
        },
        timestamp: new Date().toLocaleString(),
        statementType: "DQL",
        command: "SELECT",
      };
    }

    try {
      const erPng = await generateChenErDiagramPng(activeSchema, theme);
      if (erPng) {
        baseData.erDiagramImage = erPng;
      }
    } catch (err) {
      console.warn("Could not render ER diagram image for report:", err);
    }

    return baseData;
  };

  // 1. Download Execution Report handlers
  const handleDownloadReport = async (format: "pdf" | "docx" | "txt" | "md") => {
    setDownloadingFormat(`report-${format}`);
    try {
      const reportData = await prepareReportDataWithER();

      if (format === "pdf") {
        await downloadPdfReport(reportData);
        showFeedback("PDF report with embedded ER Diagram downloaded successfully!");
      } else if (format === "docx") {
        await downloadDocxReport(reportData);
        showFeedback("DOCX report with embedded ER Diagram downloaded successfully!");
      } else if (format === "md") {
        const md = generateMarkdownReport(reportData);
        triggerFileDownload(
          new Blob([md], { type: "text/markdown;charset=utf-8" }),
          "nl-to-sql-execution-report.md",
        );
        showFeedback("Markdown report downloaded successfully!");
      } else if (format === "txt") {
        const txt = generateTextReport(reportData);
        triggerFileDownload(
          new Blob([txt], { type: "text/plain;charset=utf-8" }),
          "nl-to-sql-execution-report.txt",
        );
        showFeedback("Plain text report downloaded successfully!");
      }
    } catch (err) {
      console.error("Report download error:", err);
      alert(`Failed to generate ${format.toUpperCase()} report: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  // 2. Download Execution Result handlers
  const handleDownloadResult = async (
    format: "csv" | "excel" | "md" | "json" | "tsv" | "sql" | "db",
  ) => {
    const activeRows = finalRows.length > 0 ? finalRows : (activeSchema[0]?.rows ?? []);
    const activeCols = columns.length > 0 ? columns : (activeSchema[0]?.columns?.map((c) => c.name) ?? []);

    if (activeRows.length === 0 && activeCols.length === 0) {
      alert("No execution results available. Run a query in Workspace first!");
      return;
    }

    setDownloadingFormat(`result-${format}`);
    try {
      if (format === "csv") {
        exportResultCSV(activeCols, activeRows, "query_results.csv");
        showFeedback("Query results downloaded as CSV!");
      } else if (format === "excel") {
        exportResultExcel(activeCols, activeRows, "query_results.xlsx");
        showFeedback("Query results downloaded as Excel (.xlsx)!");
      } else if (format === "md") {
        exportResultMarkdown(activeCols, activeRows, "query_results.md");
        showFeedback("Query results downloaded as Markdown!");
      } else if (format === "json") {
        exportResultJSON(activeCols, activeRows, "query_results.json");
        showFeedback("Query results downloaded as JSON!");
      } else if (format === "tsv") {
        exportResultTSV(activeCols, activeRows, "query_results.tsv");
        showFeedback("Query results downloaded as TSV!");
      } else if (format === "sql") {
        exportResultSQL(activeCols, activeRows, "query_results", "query_results.sql");
        showFeedback("Query results downloaded as SQL script!");
      } else if (format === "db") {
        await exportResultSqliteDB(activeCols, activeRows, "query_results", "query_results.db");
        showFeedback("Query results exported into genuine SQLite (.db) database!");
      }
    } catch (err) {
      console.error("Result download error:", err);
      alert(`Failed to export result: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  // 3. Download ER Diagram handler
  const handleDownloadER = async (format: "svg" | "png") => {
    setDownloadingFormat(`er-${format}`);
    try {
      await downloadERDiagram(activeSchema, format, theme, `${dataset.name.toLowerCase().replace(/[^\w]/g, "_")}_er_diagram`);
      showFeedback(`ER Diagram downloaded as ${format.toUpperCase()}!`);
    } catch (err) {
      console.error("ER diagram download error:", err);
      alert(`Failed to download ER diagram: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  // 4. Download History handlers
  const handleDownloadHistory = (format: "json" | "csv" | "md" | "sql") => {
    if (!history || history.length === 0) {
      alert("No query execution history found in this session yet.");
      return;
    }

    setDownloadingFormat(`history-${format}`);
    try {
      exportHistory(history, format, "nlp_sql_query_history");
      showFeedback(`All ${history.length} query history entries downloaded as ${format.toUpperCase()}!`);
    } catch (err) {
      console.error("History download error:", err);
      alert(`Failed to download history: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  // Bonus: Dataset schema download
  const handleExportDatasetSQL = () => {
    const sql = generateDatasetSQL(dataset.name, activeSchema);
    triggerFileDownload(
      new Blob([sql], { type: "application/sql;charset=utf-8" }),
      `${dataset.name.toLowerCase().replace(/[^\w]/g, "_")}_schema.sql`,
    );
    showFeedback("Complete dataset SQL schema downloaded!");
  };

  const handleExportTableCSV = (t: Table) => {
    const csv = generateTableCSV(t);
    triggerFileDownload(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
      `${t.name}.csv`,
    );
    showFeedback(`Table "${t.name}" downloaded as CSV!`);
  };

  const totalRowsResult = finalRows.length > 0 ? finalRows.length : (activeSchema[0]?.rows?.length ?? 0);
  const totalColsResult = columns.length > 0 ? columns.length : (activeSchema[0]?.columns?.length ?? 0);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto w-full">
      <div
        className="p-4 sm:p-6 max-w-6xl w-full mx-auto space-y-6 animate-in fade-in duration-150"
        style={{ color: "var(--foreground)" }}
      >
      {/* Toast Feedback Notification */}
      {statusMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border bg-emerald-600 text-white font-medium text-xs sm:text-sm animate-in slide-in-from-bottom-5 duration-200">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Top Banner Navigation Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border shadow-xs"
        style={{
          background: "var(--panel)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex items-center gap-3.5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center border shrink-0"
            style={{
              background: "var(--surface-subtle)",
              borderColor: "var(--border)",
              color: "var(--accent)",
            }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">
              Download &amp; Export Center
            </h1>
            <p className="text-xs sm:text-sm opacity-75 mt-0.5" style={{ color: "var(--muted)" }}>
              Export execution reports with embedded ER diagrams, query results in 7 formats, Chen diagrams, and session history
            </p>
          </div>
        </div>
      </div>

      {/* Live System Context Overview Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          className="p-3.5 rounded-xl border flex flex-col gap-1"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <span className="text-[11px] uppercase tracking-wider font-semibold opacity-60">Active Dataset</span>
          <span className="text-sm font-bold truncate">{dataset.name}</span>
          <span className="text-[11px] opacity-70">{activeSchema.length} tables in catalog</span>
        </div>

        <div
          className="p-3.5 rounded-xl border flex flex-col gap-1"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <span className="text-[11px] uppercase tracking-wider font-semibold opacity-60">Last Execution</span>
          <span className="text-sm font-bold truncate text-emerald-500">
            {hasExecuted ? "Execution Ready" : "Default Dataset Ready"}
          </span>
          <span className="text-[11px] opacity-70">
            {totalRowsResult} rows × {totalColsResult} columns
          </span>
        </div>

        <div
          className="p-3.5 rounded-xl border flex flex-col gap-1"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <span className="text-[11px] uppercase tracking-wider font-semibold opacity-60">ER Diagram</span>
          <span className="text-sm font-bold truncate">Chen Notation</span>
          <span className="text-[11px] opacity-70">Vector SVG &amp; PNG ready</span>
        </div>

        <div
          className="p-3.5 rounded-xl border flex flex-col gap-1"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <span className="text-[11px] uppercase tracking-wider font-semibold opacity-60">Session History</span>
          <span className="text-sm font-bold truncate">{history.length} Queries</span>
          <span className="text-[11px] opacity-70">Ready for full export</span>
        </div>
      </div>

      {/* Primary Download Features Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. Complete Execution Report Card */}
        <div
          className="p-5 rounded-2xl border flex flex-col justify-between gap-5 shadow-xs"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold">1. Complete Execution Report</h2>
                  <p className="text-xs opacity-70" style={{ color: "var(--muted)" }}>
                    Includes input prompt, executed SQL, output relation, intermediate steps, brief explanation &amp; Chen ER diagram
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 shrink-0">
                With ER Diagram
              </span>
            </div>

            <div
              className="p-3 rounded-xl border text-xs space-y-1.5"
              style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="opacity-70">Active Query:</span>
                <span className="font-mono text-[10px] opacity-80 max-w-[280px] truncate">
                  {lastExecutionData?.sql || dataset.defaultQuery}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] opacity-75">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Chen ER Diagram will be embedded in PDF and DOCX automatically</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] opacity-75">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Zero algebraic Greek symbol glitches; clean enterprise formatting</span>
              </div>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold opacity-80 block mb-2">Select Report File Format:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* PDF Button */}
              <button
                type="button"
                onClick={() => handleDownloadReport("pdf")}
                disabled={downloadingFormat === "report-pdf"}
                className="p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer hover:bg-[var(--surface-hover)] shadow-xs active:scale-95 disabled:opacity-50"
                style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}
              >
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 font-bold">
                  PDF
                </span>
                <span className="text-xs font-semibold">.pdf</span>
                <span className="text-[10px] opacity-60">With ER Image</span>
              </button>

              {/* DOCX Button */}
              <button
                type="button"
                onClick={() => handleDownloadReport("docx")}
                disabled={downloadingFormat === "report-docx"}
                className="p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer hover:bg-[var(--surface-hover)] shadow-xs active:scale-95 disabled:opacity-50"
                style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}
              >
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 font-bold">
                  DOCX
                </span>
                <span className="text-xs font-semibold">.docx</span>
                <span className="text-[10px] opacity-60">Word + Image</span>
              </button>

              {/* Markdown Button */}
              <button
                type="button"
                onClick={() => handleDownloadReport("md")}
                disabled={downloadingFormat === "report-md"}
                className="p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer hover:bg-[var(--surface-hover)] shadow-xs active:scale-95 disabled:opacity-50"
                style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}
              >
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 font-bold">
                  MD
                </span>
                <span className="text-xs font-semibold">.md</span>
                <span className="text-[10px] opacity-60">Markdown</span>
              </button>

              {/* TXT Button */}
              <button
                type="button"
                onClick={() => handleDownloadReport("txt")}
                disabled={downloadingFormat === "report-txt"}
                className="p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer hover:bg-[var(--surface-hover)] shadow-xs active:scale-95 disabled:opacity-50"
                style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}
              >
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                  TXT
                </span>
                <span className="text-xs font-semibold">.txt</span>
                <span className="text-[10px] opacity-60">Plain Text</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Last Execution Result Card */}
        <div
          className="p-5 rounded-2xl border flex flex-col justify-between gap-5 shadow-xs"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 4h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold">2. Last Execution Result</h2>
                  <p className="text-xs opacity-70" style={{ color: "var(--muted)" }}>
                    Download tabular query records in all 7 formats
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                7 Formats
              </span>
            </div>

            <div
              className="p-3 rounded-xl border text-xs space-y-1"
              style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <span className="opacity-70">Output Cardinality:</span>
                <span className="font-semibold text-emerald-400">{totalRowsResult} records</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="opacity-70">Attributes:</span>
                <span className="font-mono text-[11px] opacity-90 truncate max-w-[280px]">
                  {columns.length > 0 ? columns.join(", ") : (activeSchema[0]?.columns?.map((c) => c.name).join(", ") ?? "None")}
                </span>
              </div>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold opacity-80 block mb-2">Select Result File Format:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* CSV */}
              <button
                type="button"
                onClick={() => handleDownloadResult("csv")}
                className="p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold transition-all cursor-pointer hover:bg-[var(--surface-hover)] shadow-xs active:scale-95"
                style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}
              >
                <span>CSV</span>
                <span className="text-[10px] font-mono opacity-60">.csv</span>
              </button>

              {/* Excel */}
              <button
                type="button"
                onClick={() => handleDownloadResult("excel")}
                className="p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold transition-all cursor-pointer hover:bg-[var(--surface-hover)] shadow-xs active:scale-95"
                style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}
              >
                <span className="text-emerald-400 font-bold">Excel</span>
                <span className="text-[10px] font-mono opacity-60">.xlsx</span>
              </button>

              {/* Markdown */}
              <button
                type="button"
                onClick={() => handleDownloadResult("md")}
                className="p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold transition-all cursor-pointer hover:bg-[var(--surface-hover)] shadow-xs active:scale-95"
                style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}
              >
                <span>Markdown</span>
                <span className="text-[10px] font-mono opacity-60">.md</span>
              </button>

              {/* JSON */}
              <button
                type="button"
                onClick={() => handleDownloadResult("json")}
                className="p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold transition-all cursor-pointer hover:bg-[var(--surface-hover)] shadow-xs active:scale-95"
                style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}
              >
                <span className="text-amber-400 font-bold">JSON</span>
                <span className="text-[10px] font-mono opacity-60">.json</span>
              </button>

              {/* TSV */}
              <button
                type="button"
                onClick={() => handleDownloadResult("tsv")}
                className="p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold transition-all cursor-pointer hover:bg-[var(--surface-hover)] shadow-xs active:scale-95"
                style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}
              >
                <span>TSV</span>
                <span className="text-[10px] font-mono opacity-60">.tsv</span>
              </button>

              {/* SQL */}
              <button
                type="button"
                onClick={() => handleDownloadResult("sql")}
                className="p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold transition-all cursor-pointer hover:bg-[var(--surface-hover)] shadow-xs active:scale-95"
                style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}
              >
                <span>SQL</span>
                <span className="text-[10px] font-mono opacity-60">.sql</span>
              </button>

              {/* SQLite .DB */}
              <button
                type="button"
                onClick={() => handleDownloadResult("db")}
                className="col-span-2 p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold transition-all cursor-pointer bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/40 text-purple-300 shadow-xs active:scale-95"
              >
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                  <span>SQLite Database (.db)</span>
                </span>
                <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-purple-500/20">Binary .db</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Latest ER Diagram Only Card */}
        <div
          className="p-5 rounded-2xl border flex flex-col justify-between gap-5 shadow-xs"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold">3. Latest ER Diagram Only</h2>
                  <p className="text-xs opacity-70" style={{ color: "var(--muted)" }}>
                    Download standalone Chen ER Diagram in SVG vector or high-resolution PNG
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 shrink-0">
                Chen Notation
              </span>
            </div>

            <div
              className="p-3 rounded-xl border text-xs space-y-1"
              style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <span className="opacity-70">Target Schema:</span>
                <span className="font-semibold">{dataset.name} ({activeSchema.length} tables)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="opacity-70">Entities:</span>
                <span className="font-mono text-[11px] opacity-90 truncate max-w-[260px]">
                  {activeSchema.map((t) => t.name).join(", ")}
                </span>
              </div>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold opacity-80 block mb-2">Select Image Format:</span>
            <div className="grid grid-cols-2 gap-3">
              {/* SVG Vector */}
              <button
                type="button"
                onClick={() => handleDownloadER("svg")}
                disabled={downloadingFormat === "er-svg"}
                className="p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer hover:bg-[var(--surface-hover)] shadow-xs active:scale-95 disabled:opacity-50"
                style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}
              >
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 font-bold">
                  SVG
                </span>
                <span className="text-xs font-semibold">Vector Graphics (.svg)</span>
                <span className="text-[10px] opacity-60">Infinite scalable resolution</span>
              </button>

              {/* PNG Raster */}
              <button
                type="button"
                onClick={() => handleDownloadER("png")}
                disabled={downloadingFormat === "er-png"}
                className="p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer hover:bg-[var(--surface-hover)] shadow-xs active:scale-95 disabled:opacity-50"
                style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}
              >
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                  PNG
                </span>
                <span className="text-xs font-semibold">High-Res Image (.png)</span>
                <span className="text-[10px] opacity-60">Retina 2x canvas rendering</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4. Query Execution History Card */}
        <div
          className="p-5 rounded-2xl border flex flex-col justify-between gap-5 shadow-xs"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold">4. Query Execution History</h2>
                  <p className="text-xs opacity-70" style={{ color: "var(--muted)" }}>
                    Download all recorded query executions across this session
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                {history.length} Queries Stored
              </span>
            </div>

            <div
              className="p-3 rounded-xl border text-xs max-h-24 overflow-y-auto space-y-1.5 scrollbar-thin"
              style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}
            >
              {history.length === 0 ? (
                <p className="opacity-60 text-center py-2">No queries executed in history yet.</p>
              ) : (
                history.map((h, i) => (
                  <div key={h.id || i} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-mono text-[10px] opacity-60 shrink-0">{h.time}</span>
                    <span className="font-mono truncate opacity-90">{h.sql}</span>
                    <span className="shrink-0 text-[10px] font-semibold text-emerald-400">{h.rows} rows</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold opacity-80 block mb-2">Export All History As:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleDownloadHistory("json")}
                disabled={history.length === 0}
                className="p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold transition-all cursor-pointer hover:bg-[var(--surface-hover)] shadow-xs active:scale-95 disabled:opacity-40"
                style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}
              >
                <span>JSON</span>
                <span className="text-[10px] font-mono opacity-60">.json</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadHistory("csv")}
                disabled={history.length === 0}
                className="p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold transition-all cursor-pointer hover:bg-[var(--surface-hover)] shadow-xs active:scale-95 disabled:opacity-40"
                style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}
              >
                <span>CSV</span>
                <span className="text-[10px] font-mono opacity-60">.csv</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadHistory("md")}
                disabled={history.length === 0}
                className="p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold transition-all cursor-pointer hover:bg-[var(--surface-hover)] shadow-xs active:scale-95 disabled:opacity-40"
                style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}
              >
                <span>Markdown</span>
                <span className="text-[10px] font-mono opacity-60">.md</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadHistory("sql")}
                disabled={history.length === 0}
                className="p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold transition-all cursor-pointer hover:bg-[var(--surface-hover)] shadow-xs active:scale-95 disabled:opacity-40"
                style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}
              >
                <span>SQL Log</span>
                <span className="text-[10px] font-mono opacity-60">.sql</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Bonus: Active Dataset Catalog Export (Preserved from Right Panel) */}
      <div
        className="p-5 rounded-2xl border space-y-3 shadow-xs"
        style={{ background: "var(--panel)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
            <h3 className="text-sm font-bold">Active Dataset Catalog Export ({dataset.name})</h3>
          </div>
          <button
            type="button"
            onClick={handleExportDatasetSQL}
            className="text-xs px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-all cursor-pointer hover:bg-[var(--surface-hover)]"
            style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}
          >
            <span>Export DDL &amp; DML (.sql)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1">
          {activeSchema.map((tbl) => (
            <button
              key={tbl.name}
              type="button"
              onClick={() => handleExportTableCSV(tbl)}
              className="p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all cursor-pointer hover:bg-[var(--surface-hover)] shadow-xs"
              style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}
            >
              <span className="font-mono text-xs truncate">{tbl.name}.csv</span>
              <span className="text-[10px] opacity-60 shrink-0">{tbl.rows?.length ?? 0} rows</span>
            </button>
          ))}
        </div>
      </div>
    </div>
    </div>
  );
}
