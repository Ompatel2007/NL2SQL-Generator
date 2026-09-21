"use client";

import { useState } from "react";
import type { Table } from "@/lib/schema";
import type { PipelineStep, Row } from "@/lib/sqlEngine";
import type { Tab, ThemeId } from "./nlSqlTypes";
import { ChenERDiagram } from "./ChenERDiagram";

interface PlSqlVisualizationPanelProps {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  steps: PipelineStep[];
  activeStep: number;
  current?: PipelineStep;
  playing: boolean;
  onPlay: () => void;
  onStepChange: (index: number) => void;
  finalRows: Row[];
  columns: string[];
  dbmsOutput: string[];
  onExportCSV: () => void;
  onExportReport: () => void;
  plsql: string;
  mermaidSource: string;
  schema: Table[];
  dark: boolean;
  theme?: ThemeId;
  hasExecuted?: boolean;
}

function getPlSqlStageBadgeClass(stage: string, isDark = true): string {
  if (!isDark) {
    switch (stage.toUpperCase()) {
      case "DECLARE":
      case "ASSIGN":
        return "bg-indigo-100 text-indigo-950 border border-indigo-300 font-semibold";
      case "CURSOR":
        return "bg-sky-100 text-sky-950 border border-sky-300 font-semibold";
      case "LOOP":
        return "bg-amber-100 text-amber-950 border border-amber-300 font-semibold";
      case "CONDITIONAL":
        return "bg-purple-100 text-purple-950 border border-purple-300 font-semibold";
      case "OUTPUT":
        return "bg-orange-100 text-orange-950 border border-orange-400 font-bold";
      case "MUTATION":
        return "bg-rose-100 text-rose-950 border border-rose-300 font-semibold";
      case "COMMIT":
        return "bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold";
      case "EXCEPTION":
        return "bg-red-100 text-red-950 border border-red-400 font-bold";
      default:
        return "bg-slate-100 text-slate-900 border border-slate-300 font-semibold";
    }
  }
  switch (stage.toUpperCase()) {
    case "DECLARE":
    case "ASSIGN":
      return "bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 font-semibold";
    case "CURSOR":
      return "bg-sky-950/80 text-sky-300 border border-sky-700/60 font-semibold";
    case "LOOP":
      return "bg-amber-950/80 text-amber-300 border border-amber-700/60 font-semibold";
    case "CONDITIONAL":
      return "bg-purple-950/80 text-purple-300 border border-purple-700/60 font-semibold";
    case "OUTPUT":
      return "bg-orange-950/90 text-orange-300 border border-orange-600/70 font-bold";
    case "MUTATION":
      return "bg-rose-950/80 text-rose-300 border border-rose-700/60 font-semibold";
    case "COMMIT":
      return "bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 font-bold";
    case "EXCEPTION":
      return "bg-red-950/90 text-red-300 border border-red-600/80 font-bold";
    default:
      return "bg-zinc-800 text-zinc-100 border border-zinc-700 font-semibold";
  }
}

export function PlSqlVisualizationPanel({
  tab,
  onTabChange,
  steps,
  activeStep,
  current,
  playing,
  onPlay,
  onStepChange,
  finalRows,
  columns,
  dbmsOutput = [],
  onExportCSV,
  onExportReport,
  plsql,
  mermaidSource,
  schema,
  dark,
  theme = "slate",
  hasExecuted = false,
}: PlSqlVisualizationPanelProps) {
  const [outputViewMode, setOutputViewMode] = useState<"terminal" | "table">("terminal");
  const [copiedConsole, setCopiedConsole] = useState(false);

  const handleCopyConsole = () => {
    if (dbmsOutput.length === 0) return;
    navigator.clipboard.writeText(dbmsOutput.join("\n"));
    setCopiedConsole(true);
    setTimeout(() => setCopiedConsole(false), 2000);
  };

  return (
    <section className="flex flex-col gap-4 min-w-0" aria-label="PL/SQL Visualization Panel">
      {/* ── Top Tabs Navigation ── */}
      <div className="flex gap-2 flex-wrap items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {(["result", "schema", "explanation", "theory"] as const).map((item) => {
            const isActive = tab === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => onTabChange(item)}
                className="px-3.5 py-1.5 rounded-lg text-xs md:text-sm capitalize cursor-pointer transition-all border font-semibold shadow-xs"
                style={
                  isActive
                    ? {
                      background: "linear-gradient(135deg, #FF6A3D 0%, #D83B01 100%)",
                      color: "#FFFFFF",
                      borderColor: "#FF6A3D",
                      boxShadow: "0 0 15px rgba(255, 91, 57, 0.3)",
                    }
                    : {
                      background: "var(--panel)",
                      color: dark ? "var(--muted)" : "#09090b",
                      borderColor: "var(--border)",
                    }
                }
              >
                {item === "result"
                  ? "Pipeline & Output"
                  : item === "schema"
                    ? "Schema / ER"
                    : item === "explanation"
                      ? "Procedural Logic"
                      : "PL/SQL Theory"}
              </button>
            );
          })}
        </div>

        {/* Global Action Export buttons */}
        {tab === "result" && hasExecuted && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onExportCSV}
              className={`px-2.5 py-1 text-xs rounded-md border transition-colors flex items-center gap-1 font-medium ${
                dark
                  ? "text-zinc-300 hover:bg-zinc-800 border-[var(--border)]"
                  : "text-black bg-orange-50 border-orange-300 hover:bg-orange-100"
              }`}
            >
              <span>📥</span>
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={onExportReport}
              className={`px-2.5 py-1 text-xs rounded-md border transition-colors flex items-center gap-1 font-medium ${
                dark
                  ? "text-zinc-300 hover:bg-zinc-800 border-[var(--border)]"
                  : "text-black bg-orange-50 border-orange-300 hover:bg-orange-100"
              }`}
            >
              <span>📄</span>
              <span>Report</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Tab Content: Pipeline & Result ── */}
      {tab === "result" && (
        <div className="flex flex-col gap-4">
          {/* Step Timeline Player */}
          {steps.length > 0 && (
            <div
              className="rounded-2xl border p-4 flex flex-col gap-3 transition-all"
              style={{ background: "var(--panel)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onPlay}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white transition-transform active:scale-95 shadow-md"
                    style={{ background: "#FF5B39" }}
                    title={playing ? "Pause execution" : "Play step-by-step"}
                  >
                    {playing ? "⏸" : "▶"}
                  </button>

                  <div className={`flex items-center gap-1 text-xs font-mono ${dark ? "text-zinc-400" : "text-black font-semibold"}`}>
                    <span className={`font-semibold ${dark ? "text-zinc-200" : "text-black"}`}>
                      Step {activeStep + 1}
                    </span>
                    <span>/</span>
                    <span>{steps.length}</span>
                  </div>

                  {current && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${getPlSqlStageBadgeClass(current.stage, dark)}`}>
                      {current.stage}
                    </span>
                  )}
                </div>

                {/* Step navigation prev / next */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={activeStep <= 0}
                    onClick={() => onStepChange(Math.max(0, activeStep - 1))}
                    className={`px-2.5 py-1 text-xs rounded-md border disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium ${
                      dark
                        ? "text-zinc-300 hover:bg-zinc-800 border-[var(--border)]"
                        : "text-black bg-orange-50 border-orange-300 hover:bg-orange-100"
                    }`}
                  >
                    ◀ Prev
                  </button>
                  <button
                    type="button"
                    disabled={activeStep >= steps.length - 1}
                    onClick={() => onStepChange(Math.min(steps.length - 1, activeStep + 1))}
                    className={`px-2.5 py-1 text-xs rounded-md border disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium ${
                      dark
                        ? "text-zinc-300 hover:bg-zinc-800 border-[var(--border)]"
                        : "text-black bg-orange-50 border-orange-300 hover:bg-orange-100"
                    }`}
                  >
                    Next ▶
                  </button>
                </div>
              </div>

              {/* Progress Slider track */}
              <div className={`w-full rounded-full h-1.5 overflow-hidden ${dark ? "bg-zinc-800/60" : "bg-orange-100 border border-orange-200"}`}>
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${((activeStep + 1) / steps.length) * 100}%`,
                    background: "linear-gradient(90deg, #FF6A3D, #FF9A6C)",
                  }}
                />
              </div>

              {/* Current Step Description Card */}
              {current && (
                <div className={`p-3 rounded-xl border flex flex-col gap-1 text-xs ${
                  dark
                    ? "bg-zinc-900/60 border-zinc-800/80"
                    : "bg-orange-50/70 border-orange-200"
                }`}>
                  <div className={`font-semibold flex items-center gap-2 ${dark ? "text-zinc-200" : "text-black font-bold"}`}>
                    <span>{current.title}</span>
                  </div>
                  <p className={`font-mono text-[11px] leading-relaxed ${dark ? "text-zinc-400" : "text-slate-800"}`}>
                    {current.detail}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* DBMS_OUTPUT Terminal & Result Table Container */}
          <div
            className="rounded-2xl border flex flex-col overflow-hidden transition-all shadow-sm"
            style={{ background: "var(--panel)", borderColor: "var(--border)" }}
          >
            {/* Console Sub-header */}
            <div
              className={`p-3 border-b flex items-center justify-between gap-3 ${
                dark ? "bg-zinc-900/40" : "bg-slate-50"
              }`}
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
                </div>
                <span className={`text-xs font-mono font-semibold ml-1 ${dark ? "text-zinc-300" : "text-black font-bold"}`}>
                  DBMS_OUTPUT Terminal
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                  dark
                    ? "bg-orange-950/60 text-orange-400 border border-orange-800/40"
                    : "bg-orange-100 text-orange-900 border border-orange-300 font-bold"
                }`}>
                  {dbmsOutput.length} line(s)
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* View Mode Toggle: Terminal vs Table */}
                <div className={`flex items-center rounded-lg border p-0.5 text-xs ${
                  dark ? "border-zinc-700/60 bg-zinc-800/40" : "border-slate-300 bg-slate-100"
                }`}>
                  <button
                    type="button"
                    onClick={() => setOutputViewMode("terminal")}
                    className={`px-2.5 py-0.5 rounded-md font-medium transition-colors ${
                      outputViewMode === "terminal"
                        ? "bg-orange-600 text-white font-semibold shadow-xs"
                        : dark
                          ? "text-zinc-400 hover:text-zinc-200"
                          : "text-slate-700 hover:text-black font-semibold"
                    }`}
                  >
                    Console
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutputViewMode("table")}
                    className={`px-2.5 py-0.5 rounded-md font-medium transition-colors ${
                      outputViewMode === "table"
                        ? "bg-orange-600 text-white font-semibold shadow-xs"
                        : dark
                          ? "text-zinc-400 hover:text-zinc-200"
                          : "text-slate-700 hover:text-black font-semibold"
                    }`}
                  >
                    Table
                  </button>
                </div>

                {outputViewMode === "terminal" && dbmsOutput.length > 0 && (
                  <button
                    type="button"
                    onClick={handleCopyConsole}
                    className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                      dark
                        ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                        : "text-black hover:bg-slate-200 border-slate-300 font-semibold"
                    }`}
                    style={{ borderColor: "var(--border)" }}
                    title="Copy console output"
                  >
                    {copiedConsole ? "Copied!" : "Copy"}
                  </button>
                )}
              </div>
            </div>

            {/* Output Display Area */}
            {outputViewMode === "terminal" ? (
              <div
                className="p-4 font-mono text-xs sm:text-sm overflow-x-auto max-h-[420px] scrollbar-thin flex flex-col gap-1 select-text"
                style={{
                  background: dark ? "#080B11" : "#0d1117",
                  color: "#F1F5F9",
                }}
              >
                {dbmsOutput.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-zinc-400 gap-2 font-sans">
                    <span className="text-2xl">⚡</span>
                    <p className="text-xs">No execution output yet. Click &quot;Execute PL/SQL Script&quot; to run.</p>
                  </div>
                ) : (
                  dbmsOutput.map((line, idx) => (
                    <div key={idx} className="flex items-start gap-3 hover:bg-zinc-800/40 px-1 py-0.5 rounded">
                      <span className="text-zinc-500 text-[11px] select-none shrink-0 w-6 text-right font-mono">
                        {idx + 1}
                      </span>
                      <span
                        className={
                          line.startsWith("[ERROR]")
                            ? "text-red-400 font-semibold"
                            : line.startsWith("===") || line.startsWith("---")
                              ? "text-orange-400 font-bold"
                              : line.includes("PRIORITY") || line.includes("ALERT")
                                ? "text-amber-300 font-semibold"
                                : "text-zinc-100"
                        }
                      >
                        {line}
                      </span>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* Structured Table View */
              <div className="overflow-x-auto max-h-[420px] scrollbar-thin">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b ${dark ? "bg-zinc-900/60 text-zinc-300" : "bg-slate-100 text-black font-bold"}`} style={{ borderColor: "var(--border)" }}>
                      {columns.map((c) => (
                        <th key={c} className={`p-3 font-semibold uppercase tracking-wider text-[11px] ${dark ? "text-zinc-300" : "text-black font-bold"}`}>
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {finalRows.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length || 1} className={`p-8 text-center ${dark ? "text-zinc-500" : "text-slate-600 font-medium"}`}>
                          No rows to display.
                        </td>
                      </tr>
                    ) : (
                      finalRows.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className={`border-b transition-colors ${dark ? "hover:bg-zinc-800/30" : "hover:bg-slate-50"}`}
                          style={{ borderColor: "var(--border)" }}
                        >
                          {columns.map((c) => (
                            <td key={c} className={`p-3 font-mono ${dark ? "text-zinc-300" : "text-black font-medium"}`}>
                              {String(row[c] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab Content: Schema / ER Diagram ── */}
      {tab === "schema" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {schema.map((t) => (
              <div
                key={t.name}
                className="rounded-xl border p-3.5 flex flex-col gap-2 shadow-xs"
                style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}
              >
                <div className={`flex items-center justify-between border-b pb-2 ${dark ? "border-zinc-800" : "border-slate-300"}`}>
                  <span className={`font-bold text-sm font-mono ${dark ? "text-orange-400" : "text-black font-bold"}`}>
                    {t.name}
                  </span>
                  <span className={`text-xs ${dark ? "text-zinc-400" : "text-black font-semibold"}`}>
                    {t.rows.length} rows
                  </span>
                </div>
                <div className="flex flex-col gap-1 text-xs">
                  {t.columns.map((c) => (
                    <div key={c.name} className={`flex items-center justify-between py-0.5 font-mono ${dark ? "text-zinc-300" : "text-black font-medium"}`}>
                      <span>{c.name}</span>
                      <span className={`text-[10px] font-mono ${dark ? "text-zinc-500" : "text-black font-semibold opacity-85"}`}>
                        {c.type} {c.pk ? "[PK]" : ""} {c.fk ? `-> ${c.fk.table}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div
            className="rounded-2xl border p-4"
            style={{ background: "var(--panel)", borderColor: "var(--border)" }}
          >
            <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${dark ? "text-zinc-200" : "text-black font-bold"}`}>
              <span>Chen ER Diagram & Schema Inspector</span>
            </h3>
            <ChenERDiagram schema={schema} theme={theme} />
          </div>
        </div>
      )}

      {/* ── Tab Content: Procedural Logic Explanation ── */}
      {tab === "explanation" && (
        <div
          className="rounded-2xl border p-5 flex flex-col gap-4"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <div className={`border-b pb-3 ${dark ? "border-zinc-800" : "border-slate-200"}`}>
            <h3 className={`text-base font-bold flex items-center gap-2 ${dark ? "text-zinc-100" : "text-black font-bold"}`}>
              <span className="text-orange-500">✦</span>
              <span>Procedural Flow &amp; Block Anatomy</span>
            </h3>
            <p className={`text-xs mt-1 ${dark ? "text-zinc-400" : "text-black font-medium opacity-80"}`}>
              Automated procedural structural breakdown of the executed PL/SQL block.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Card 1: Declarations (Blue in Dark, Light Blue with Black Font in Light) */}
            <div
              className={`p-3 rounded-xl border flex flex-col gap-1.5 transition-all ${
                dark
                  ? "border-zinc-800 bg-zinc-900/40"
                  : "bg-blue-50/90 border-blue-200 shadow-xs"
              }`}
            >
              <span
                className={`text-xs uppercase tracking-wider ${
                  dark
                    ? "font-semibold text-indigo-400"
                    : "font-bold text-black"
                }`}
              >
                1. Declarations
              </span>
              <p
                className={`text-xs leading-relaxed ${
                  dark ? "text-zinc-300" : "text-black font-normal"
                }`}
              >
                Allocates memory variables, constants, and sets up explicit or implicit cursors in the private SQL area before execution commences.
              </p>
            </div>

            {/* Card 2: Control Flow & Loops (Yellow in Dark, Light Yellow with Black Font in Light) */}
            <div
              className={`p-3 rounded-xl border flex flex-col gap-1.5 transition-all ${
                dark
                  ? "border-zinc-800 bg-zinc-900/40"
                  : "bg-amber-50/90 border-amber-200 shadow-xs"
              }`}
            >
              <span
                className={`text-xs uppercase tracking-wider ${
                  dark
                    ? "font-semibold text-amber-400"
                    : "font-bold text-black"
                }`}
              >
                2. Control Flow &amp; Loops
              </span>
              <p
                className={`text-xs leading-relaxed ${
                  dark ? "text-zinc-300" : "text-black font-normal"
                }`}
              >
                Executes procedural branching (IF-THEN-ELSIF), cursor traversal loops, variable assignment arithmetic, and embedded DML updates.
              </p>
            </div>

            {/* Card 3: Exception & Output (Pink in Dark, Light Pink with Black Font in Light) */}
            <div
              className={`p-3 rounded-xl border flex flex-col gap-1.5 transition-all ${
                dark
                  ? "border-zinc-800 bg-zinc-900/40"
                  : "bg-rose-50/90 border-rose-200 shadow-xs"
              }`}
            >
              <span
                className={`text-xs uppercase tracking-wider ${
                  dark
                    ? "font-semibold text-rose-400"
                    : "font-bold text-black"
                }`}
              >
                3. Exception &amp; Output
              </span>
              <p
                className={`text-xs leading-relaxed ${
                  dark ? "text-zinc-300" : "text-black font-normal"
                }`}
              >
                Captures runtime exceptions (e.g., NO_DATA_FOUND, TOO_MANY_ROWS), logs diagnostic feedback to DBMS_OUTPUT, and commits state atomically.
              </p>
            </div>
          </div>

          <div
            className={`p-3.5 rounded-xl border flex flex-col gap-2.5 shadow-2xs ${
              dark
                ? "border-zinc-800/80 bg-zinc-900/50"
                : "border-slate-300 bg-slate-200/70"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${dark ? "text-zinc-200" : "text-slate-900"}`}>
                Active Script:
              </span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                PL/SQL Block
              </span>
            </div>
            <pre
              className={`text-xs font-mono p-3.5 rounded-lg overflow-x-auto leading-relaxed border shadow-inner ${
                dark
                  ? "bg-black/80 text-zinc-200 border-zinc-800"
                  : "bg-slate-900 text-slate-100 border-slate-700"
              }`}
            >
              {plsql}
            </pre>
          </div>
        </div>
      )}

      {/* ── Tab Content: PL/SQL Theory ── */}
      {tab === "theory" && (
        <div
          className="rounded-2xl border p-5 flex flex-col gap-5"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <div className={`border-b pb-3 ${dark ? "border-zinc-800" : "border-slate-200"}`}>
            <h3 className={`text-base font-bold flex items-center gap-2 ${dark ? "text-zinc-100" : "text-black font-bold"}`}>
              <span className="text-orange-500">⚡</span>
              <span>PL/SQL Engine &amp; Oracle Architecture</span>
            </h3>
            <p className={`text-xs mt-1 ${dark ? "text-zinc-400" : "text-black opacity-80"}`}>
              Comprehensive theory on procedural database engines, runtime mechanics, and comparison with declarative SQL.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl border flex flex-col gap-2 ${
              dark
                ? "border-zinc-800 bg-zinc-900/40 text-zinc-300"
                : "border-orange-200 bg-orange-50/60 text-black shadow-2xs"
            }`}>
              <h4 className={`text-xs font-bold uppercase tracking-wide ${dark ? "text-orange-400" : "text-orange-700"}`}>
                Procedural vs Declarative Execution
              </h4>
              <p className="text-xs leading-relaxed">
                Standard SQL is <strong>declarative</strong>: it specifies <em>what</em> data to retrieve, leaving the execution strategy to the cost-based optimizer.
                PL/SQL is <strong>procedural</strong>: it gives the engineer explicit control over <em>how</em> steps execute, allowing loops, conditional branching, stateful cursor traversal, and error trapping.
              </p>
            </div>

            <div className={`p-4 rounded-xl border flex flex-col gap-2 ${
              dark
                ? "border-zinc-800 bg-zinc-900/40 text-zinc-300"
                : "border-sky-200 bg-sky-50/60 text-black shadow-2xs"
            }`}>
              <h4 className={`text-xs font-bold uppercase tracking-wide ${dark ? "text-sky-400" : "text-sky-700"}`}>
                Context Switching &amp; Engine Collaboration
              </h4>
              <p className="text-xs leading-relaxed">
                When a PL/SQL block runs, the <strong>PL/SQL engine</strong> executes procedural logic (loops, assignments, conditions) and sends embedded SQL statements to the <strong>SQL engine</strong>.
                Minimizing context switching (e.g., through cursor FOR loops or batch operations) maximizes throughput.
              </p>
            </div>

            <div className={`p-4 rounded-xl border flex flex-col gap-2 ${
              dark
                ? "border-zinc-800 bg-zinc-900/40 text-zinc-300"
                : "border-emerald-200 bg-emerald-50/60 text-black shadow-2xs"
            }`}>
              <h4 className={`text-xs font-bold uppercase tracking-wide ${dark ? "text-emerald-400" : "text-emerald-700"}`}>
                Cursor Mechanics &amp; Memory Work Areas
              </h4>
              <p className="text-xs leading-relaxed">
                An Oracle cursor is a pointer to the <strong>Private SQL Area</strong> in the Program Global Area (PGA).
                Explicit cursors allow fine-grained lifecycle management (<code>OPEN</code>, <code>FETCH</code>, <code>CLOSE</code>) with state attributes like <code>%FOUND</code>, <code>%NOTFOUND</code>, and <code>%ROWCOUNT</code>.
              </p>
            </div>

            <div className={`p-4 rounded-xl border flex flex-col gap-2 ${
              dark
                ? "border-zinc-800 bg-zinc-900/40 text-zinc-300"
                : "border-purple-200 bg-purple-50/60 text-black shadow-2xs"
            }`}>
              <h4 className={`text-xs font-bold uppercase tracking-wide ${dark ? "text-purple-400" : "text-purple-700"}`}>
                DBMS_OUTPUT Architecture
              </h4>
              <p className="text-xs leading-relaxed">
                <code>DBMS_OUTPUT.PUT_LINE</code> buffers text messages into an internal memory buffer.
                The client workspace retrieves the buffered messages following successful block completion, enabling rich runtime logging, debugging, and audit output.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
