"use client";

import { useState, useEffect } from "react";
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

  // Synchronize with DOM data-theme to prevent any stale theme state
  const [activeTheme, setActiveTheme] = useState<ThemeId>(() => {
    if (typeof document !== "undefined") {
      const dt = document.documentElement.getAttribute("data-theme") as ThemeId;
      if (dt === "pearl" || dt === "slate") return dt;
    }
    return theme;
  });

  useEffect(() => {
    setActiveTheme(theme);
  }, [theme]);

  useEffect(() => {
    const updateTheme = () => {
      const dt = document.documentElement.getAttribute("data-theme") as ThemeId;
      if (dt && (dt === "pearl" || dt === "slate")) {
        setActiveTheme(dt);
      }
    };
    updateTheme();
    const obs = new MutationObserver(updateTheme);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
    return () => obs.disconnect();
  }, []);

  const isDark = activeTheme !== "pearl";
  const textTitle = isDark ? "text-white dl-title" : "text-black dl-title";
  const textBody = isDark ? "text-zinc-200 dl-body" : "text-slate-900 dl-body";
  const textMuted = isDark ? "text-zinc-400 dl-muted" : "text-slate-700 dl-muted";
  const textCode = isDark ? "text-zinc-100 dl-code" : "text-black dl-code";

  return (
    <div className={`flex-1 min-h-0 overflow-y-auto w-full dl-view-container ${textTitle}`}>
      <div
        className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-10 py-6 space-y-6 animate-in fade-in duration-150"
      >
      {/* Toast Feedback Notification */}
      {statusMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-xl shadow-2xl border bg-emerald-600 text-white font-semibold text-sm sm:text-base animate-in slide-in-from-bottom-5 duration-200">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Top Banner Navigation Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-2xl border shadow-xs"
        style={{
          background: "var(--panel)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center border shrink-0"
            style={{
              background: "rgba(var(--accent-rgb, 255, 106, 61), 0.12)",
              borderColor: "rgba(var(--accent-rgb, 255, 106, 61), 0.3)",
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
            <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${textTitle}`}>
              Download &amp; Export Center
            </h1>
            <p className={`text-sm sm:text-base font-semibold ${textMuted} mt-1`}>
              Export execution reports with embedded ER diagrams, query results in 7 formats, Chen diagrams, and session history
            </p>
          </div>
        </div>
      </div>

      {/* Live System Context Overview Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          className="p-4 sm:p-5 rounded-2xl border flex flex-col gap-1.5 shadow-2xs"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <span className={`text-xs uppercase tracking-wider font-bold ${textMuted}`}>Active Dataset</span>
          <span className={`text-base sm:text-lg font-bold truncate ${textTitle}`}>{dataset.name}</span>
          <span className={`text-xs font-semibold ${textMuted}`}>{activeSchema.length} tables in catalog</span>
        </div>

        <div
          className="p-4 sm:p-5 rounded-2xl border flex flex-col gap-1.5 shadow-2xs"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <span className={`text-xs uppercase tracking-wider font-bold ${textMuted}`}>Last Execution</span>
          <span className="text-base sm:text-lg font-bold truncate text-emerald-600 dark:text-emerald-400">
            {hasExecuted ? "Execution Ready" : "Default Dataset Ready"}
          </span>
          <span className={`text-xs font-semibold ${textMuted}`}>
            {totalRowsResult} rows × {totalColsResult} columns
          </span>
        </div>

        <div
          className="p-4 sm:p-5 rounded-2xl border flex flex-col gap-1.5 shadow-2xs"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <span className={`text-xs uppercase tracking-wider font-bold ${textMuted}`}>ER Diagram</span>
          <span className={`text-base sm:text-lg font-bold truncate ${textTitle}`}>Chen Notation</span>
          <span className={`text-xs font-semibold ${textMuted}`}>Vector SVG &amp; PNG ready</span>
        </div>

        <div
          className="p-4 sm:p-5 rounded-2xl border flex flex-col gap-1.5 shadow-2xs"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <span className={`text-xs uppercase tracking-wider font-bold ${textMuted}`}>Session History</span>
          <span className={`text-base sm:text-lg font-bold truncate ${textTitle}`}>{history.length} Queries</span>
          <span className={`text-xs font-semibold ${textMuted}`}>Ready for full export</span>
        </div>
      </div>

      {/* Primary Download Features Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. Complete Execution Report Card */}
        <div
          className="p-6 sm:p-7 rounded-2xl border flex flex-col justify-between gap-6 shadow-xs"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className={`text-lg sm:text-xl font-bold ${textTitle}`}>1. Complete Execution Report</h2>
                  <p className={`text-sm font-medium ${textBody} mt-0.5`}>
                    Includes input prompt, executed SQL, output relation, intermediate steps, brief explanation &amp; Chen ER diagram
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 shrink-0">
                With ER Diagram
              </span>
            </div>

            <div
              className="p-4 rounded-xl border text-sm space-y-2 shadow-2xs"
              style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className={`font-bold ${textTitle}`}>Active Query:</span>
                <span className={`font-mono text-xs sm:text-sm font-semibold max-w-[360px] truncate ${textBody}`}>
                  {lastExecutionData?.sql || dataset.defaultQuery}
                </span>
              </div>
              <div className={`flex items-center gap-2 text-xs sm:text-sm font-medium ${textBody}`}>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                <span>Chen ER Diagram will be embedded in PDF and DOCX automatically</span>
              </div>
              <div className={`flex items-center gap-2 text-xs sm:text-sm font-medium ${textBody}`}>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                <span>Zero algebraic Greek symbol glitches; clean enterprise formatting</span>
              </div>
            </div>
          </div>

          <div>
            <span className={`text-sm sm:text-base font-bold ${textTitle} block mb-3`}>Select Report File Format:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* PDF Button */}
              <button
                type="button"
                onClick={() => handleDownloadReport("pdf")}
                disabled={downloadingFormat === "report-pdf"}
                className="p-3.5 sm:p-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 dl-action-btn"
              >
                <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 font-bold">
                  PDF
                </span>
                <span className={`text-sm sm:text-base font-bold ${textTitle}`}>.pdf</span>
                <span className={`text-xs font-semibold ${textMuted}`}>With ER Image</span>
              </button>

              {/* DOCX Button */}
              <button
                type="button"
                onClick={() => handleDownloadReport("docx")}
                disabled={downloadingFormat === "report-docx"}
                className="p-3.5 sm:p-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 dl-action-btn"
              >
                <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 font-bold">
                  DOCX
                </span>
                <span className={`text-sm sm:text-base font-bold ${textTitle}`}>.docx</span>
                <span className={`text-xs font-semibold ${textMuted}`}>Word + Image</span>
              </button>

              {/* Markdown Button */}
              <button
                type="button"
                onClick={() => handleDownloadReport("md")}
                disabled={downloadingFormat === "report-md"}
                className="p-3.5 sm:p-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 dl-action-btn"
              >
                <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/30 font-bold">
                  MD
                </span>
                <span className={`text-sm sm:text-base font-bold ${textTitle}`}>.md</span>
                <span className={`text-xs font-semibold ${textMuted}`}>Markdown</span>
              </button>

              {/* TXT Button */}
              <button
                type="button"
                onClick={() => handleDownloadReport("txt")}
                disabled={downloadingFormat === "report-txt"}
                className="p-3.5 sm:p-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 dl-action-btn"
              >
                <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold">
                  TXT
                </span>
                <span className={`text-sm sm:text-base font-bold ${textTitle}`}>.txt</span>
                <span className={`text-xs font-semibold ${textMuted}`}>Plain Text</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Last Execution Result Card */}
        <div
          className="p-6 sm:p-7 rounded-2xl border flex flex-col justify-between gap-6 shadow-xs"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 4h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className={`text-lg sm:text-xl font-bold ${textTitle}`}>2. Last Execution Result</h2>
                  <p className={`text-sm font-medium ${textBody} mt-0.5`}>
                    Download tabular query records in all 7 formats
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                7 Formats
              </span>
            </div>

            <div
              className="p-4 rounded-xl border text-sm space-y-2 shadow-2xs"
              style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className={`font-bold ${textTitle}`}>Output Cardinality:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{totalRowsResult} records</span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className={`font-bold ${textTitle}`}>Attributes:</span>
                <span className={`font-mono text-xs sm:text-sm font-semibold truncate max-w-[360px] ${textBody}`}>
                  {columns.length > 0 ? columns.join(", ") : (activeSchema[0]?.columns?.map((c) => c.name).join(", ") ?? "None")}
                </span>
              </div>
            </div>
          </div>

          <div>
            <span className={`text-sm sm:text-base font-bold ${textTitle} block mb-3`}>Select Result File Format:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* CSV */}
              <button
                type="button"
                onClick={() => handleDownloadResult("csv")}
                className={`p-3 sm:p-3.5 rounded-xl border flex items-center justify-between text-sm font-bold ${textTitle} cursor-pointer active:scale-95 dl-action-btn`}
              >
                <span className={textTitle}>CSV</span>
                <span className={`text-xs font-mono font-bold ${textMuted}`}>.csv</span>
              </button>

              {/* Excel */}
              <button
                type="button"
                onClick={() => handleDownloadResult("excel")}
                className="p-3 sm:p-3.5 rounded-xl border flex items-center justify-between text-sm font-bold cursor-pointer active:scale-95 dl-action-btn"
              >
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">Excel</span>
                <span className={`text-xs font-mono font-bold ${textMuted}`}>.xlsx</span>
              </button>

              {/* Markdown */}
              <button
                type="button"
                onClick={() => handleDownloadResult("md")}
                className={`p-3 sm:p-3.5 rounded-xl border flex items-center justify-between text-sm font-bold ${textTitle} cursor-pointer active:scale-95 dl-action-btn`}
              >
                <span className={textTitle}>Markdown</span>
                <span className={`text-xs font-mono font-bold ${textMuted}`}>.md</span>
              </button>

              {/* JSON */}
              <button
                type="button"
                onClick={() => handleDownloadResult("json")}
                className="p-3 sm:p-3.5 rounded-xl border flex items-center justify-between text-sm font-bold cursor-pointer active:scale-95 dl-action-btn"
              >
                <span className="text-amber-700 dark:text-amber-400 font-bold">JSON</span>
                <span className={`text-xs font-mono font-bold ${textMuted}`}>.json</span>
              </button>

              {/* TSV */}
              <button
                type="button"
                onClick={() => handleDownloadResult("tsv")}
                className={`p-3 sm:p-3.5 rounded-xl border flex items-center justify-between text-sm font-bold ${textTitle} cursor-pointer active:scale-95 dl-action-btn`}
              >
                <span className={textTitle}>TSV</span>
                <span className={`text-xs font-mono font-bold ${textMuted}`}>.tsv</span>
              </button>

              {/* SQL */}
              <button
                type="button"
                onClick={() => handleDownloadResult("sql")}
                className={`p-3 sm:p-3.5 rounded-xl border flex items-center justify-between text-sm font-bold ${textTitle} cursor-pointer active:scale-95 dl-action-btn`}
              >
                <span className={textTitle}>SQL</span>
                <span className={`text-xs font-mono font-bold ${textMuted}`}>.sql</span>
              </button>

              {/* SQLite .DB */}
              <button
                type="button"
                onClick={() => handleDownloadResult("db")}
                className={`col-span-2 p-3 sm:p-3.5 rounded-xl border flex items-center justify-between text-sm font-bold ${textTitle} cursor-pointer shadow-xs active:scale-95 dl-db-btn`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" style={{ color: "var(--accent)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                  <span className={`font-bold ${textTitle}`}>SQLite Database (.db)</span>
                </span>
                <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded border" style={{ background: "rgba(var(--accent-rgb, 255, 106, 61), 0.15)", borderColor: "rgba(var(--accent-rgb, 255, 106, 61), 0.3)", color: "var(--accent)" }}>Binary .db</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Latest ER Diagram Only Card */}
        <div
          className="p-6 sm:p-7 rounded-2xl border flex flex-col justify-between gap-6 shadow-xs"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>
                <div>
                  <h2 className={`text-lg sm:text-xl font-bold ${textTitle}`}>3. Latest ER Diagram Only</h2>
                  <p className={`text-sm font-medium ${textBody} mt-0.5`}>
                    Download standalone Chen ER Diagram in SVG vector or high-resolution PNG
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 shrink-0">
                Chen Notation
              </span>
            </div>

            <div
              className="p-4 rounded-xl border text-sm space-y-2 shadow-2xs"
              style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className={`font-bold ${textTitle}`}>Target Schema:</span>
                <span className={`font-bold ${textTitle}`}>{dataset.name} ({activeSchema.length} tables)</span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className={`font-bold ${textTitle}`}>Entities:</span>
                <span className={`font-mono text-xs sm:text-sm font-semibold truncate max-w-[360px] ${textBody}`}>
                  {activeSchema.map((t) => t.name).join(", ")}
                </span>
              </div>
            </div>
          </div>

          <div>
            <span className={`text-sm sm:text-base font-bold ${textTitle} block mb-3`}>Select Image Format:</span>
            <div className="grid grid-cols-2 gap-3.5">
              {/* SVG Vector */}
              <button
                type="button"
                onClick={() => handleDownloadER("svg")}
                disabled={downloadingFormat === "er-svg"}
                className="p-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 dl-action-btn"
              >
                <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 font-bold">
                  SVG
                </span>
                <span className={`text-sm sm:text-base font-bold ${textTitle}`}>Vector Graphics (.svg)</span>
                <span className={`text-xs font-semibold ${textMuted}`}>Infinite scalable resolution</span>
              </button>

              {/* PNG Raster */}
              <button
                type="button"
                onClick={() => handleDownloadER("png")}
                disabled={downloadingFormat === "er-png"}
                className="p-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 dl-action-btn"
              >
                <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold">
                  PNG
                </span>
                <span className={`text-sm sm:text-base font-bold ${textTitle}`}>High-Res Image (.png)</span>
                <span className={`text-xs font-semibold ${textMuted}`}>Retina 2x canvas rendering</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4. Query Execution History Card */}
        <div
          className="p-6 sm:p-7 rounded-2xl border flex flex-col justify-between gap-6 shadow-xs"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className={`text-lg sm:text-xl font-bold ${textTitle}`}>4. Query Execution History</h2>
                  <p className={`text-sm font-medium ${textBody} mt-0.5`}>
                    Download all recorded query executions across this session
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 shrink-0">
                {history.length} Queries Stored
              </span>
            </div>

            <div
              className="p-4 rounded-xl border text-sm max-h-28 overflow-y-auto space-y-2 scrollbar-thin shadow-2xs"
              style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}
            >
              {history.length === 0 ? (
                <p className={`${textMuted} text-center py-2 font-medium`}>No queries executed in history yet.</p>
              ) : (
                history.map((h, i) => (
                  <div key={h.id || i} className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                    <span className={`font-mono text-xs font-medium shrink-0 ${textMuted}`}>{h.time}</span>
                    <span className={`font-mono font-medium truncate ${textCode}`}>{h.sql}</span>
                    <span className="shrink-0 text-xs font-bold text-emerald-600 dark:text-emerald-400">{h.rows} rows</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <span className={`text-sm sm:text-base font-bold ${textTitle} block mb-3`}>Export All History As:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => handleDownloadHistory("json")}
                disabled={history.length === 0}
                className={`p-3 sm:p-3.5 rounded-xl border flex items-center justify-between text-sm font-bold ${textTitle} cursor-pointer active:scale-95 disabled:opacity-40 dl-action-btn`}
              >
                <span className={textTitle}>JSON</span>
                <span className={`text-xs font-mono font-bold ${textMuted}`}>.json</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadHistory("csv")}
                disabled={history.length === 0}
                className={`p-3 sm:p-3.5 rounded-xl border flex items-center justify-between text-sm font-bold ${textTitle} cursor-pointer active:scale-95 disabled:opacity-40 dl-action-btn`}
              >
                <span className={textTitle}>CSV</span>
                <span className={`text-xs font-mono font-bold ${textMuted}`}>.csv</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadHistory("md")}
                disabled={history.length === 0}
                className={`p-3 sm:p-3.5 rounded-xl border flex items-center justify-between text-sm font-bold ${textTitle} cursor-pointer active:scale-95 disabled:opacity-40 dl-action-btn`}
              >
                <span className={textTitle}>Markdown</span>
                <span className={`text-xs font-mono font-bold ${textMuted}`}>.md</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadHistory("sql")}
                disabled={history.length === 0}
                className={`p-3 sm:p-3.5 rounded-xl border flex items-center justify-between text-sm font-bold ${textTitle} cursor-pointer active:scale-95 disabled:opacity-40 dl-action-btn`}
              >
                <span className={textTitle}>SQL Log</span>
                <span className={`text-xs font-mono font-bold ${textMuted}`}>.sql</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Bonus: Active Dataset Catalog Export (Preserved from Right Panel) */}
      <div
        className="p-6 sm:p-7 rounded-2xl border space-y-4 shadow-xs"
        style={{ background: "var(--panel)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
            <h3 className={`text-base sm:text-lg font-bold ${textTitle}`}>
              Active Dataset Catalog Export ({dataset.name})
            </h3>
          </div>
          <button
            type="button"
            onClick={handleExportDatasetSQL}
            className="text-sm px-4 py-2 rounded-xl border font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 text-white"
            style={{
              background: "var(--accent-gradient)",
              borderColor: "var(--accent)",
            }}
          >
            <span>Export DDL &amp; DML (.sql)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          {activeSchema.map((tbl) => (
            <button
              key={tbl.name}
              type="button"
              onClick={() => handleExportTableCSV(tbl)}
              className="p-3.5 rounded-xl border flex items-center justify-between text-sm cursor-pointer shadow-2xs active:scale-95 dl-action-btn"
            >
              <span className={`font-mono text-sm font-bold truncate ${textTitle}`}>{tbl.name}.csv</span>
              <span className={`text-xs font-bold shrink-0 ml-2 ${textMuted}`}>{tbl.rows?.length ?? 0} rows</span>
            </button>
          ))}
        </div>
      </div>
    </div>
    </div>
  );
}
