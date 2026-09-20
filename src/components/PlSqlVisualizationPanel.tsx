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

function getPlSqlStageBadgeClass(stage: string): string {
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
                        color: "var(--muted)",
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
              className="px-2.5 py-1 text-xs rounded-md border text-zinc-300 hover:bg-zinc-800 transition-colors flex items-center gap-1"
              style={{ borderColor: "var(--border)" }}
            >
              <span>📥</span>
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={onExportReport}
              className="px-2.5 py-1 text-xs rounded-md border text-zinc-300 hover:bg-zinc-800 transition-colors flex items-center gap-1"
              style={{ borderColor: "var(--border)" }}
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

                  <div className="flex items-center gap-1 text-xs text-zinc-400 font-mono">
                    <span className="font-semibold text-zinc-200">
                      Step {activeStep + 1}
                    </span>
                    <span>/</span>
                    <span>{steps.length}</span>
                  </div>

                  {current && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${getPlSqlStageBadgeClass(current.stage)}`}>
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
                    className="px-2.5 py-1 text-xs rounded-md border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800 text-zinc-300 transition-colors"
                    style={{ borderColor: "var(--border)" }}
                  >
                    ◀ Prev
                  </button>
                  <button
                    type="button"
                    disabled={activeStep >= steps.length - 1}
                    onClick={() => onStepChange(Math.min(steps.length - 1, activeStep + 1))}
                    className="px-2.5 py-1 text-xs rounded-md border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800 text-zinc-300 transition-colors"
                    style={{ borderColor: "var(--border)" }}
                  >
                    Next ▶
                  </button>
                </div>
              </div>

              {/* Progress Slider track */}
              <div className="w-full bg-zinc-800/60 rounded-full h-1.5 overflow-hidden">
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
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col gap-1 text-xs">
                  <div className="font-semibold text-zinc-200 flex items-center gap-2">
                    <span>{current.title}</span>
                  </div>
                  <p className="text-zinc-400 font-mono text-[11px] leading-relaxed">
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
            <div className="p-3 border-b flex items-center justify-between gap-3 bg-zinc-900/40" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
                </div>
                <span className="text-xs font-mono font-semibold text-zinc-300 ml-1">
                  DBMS_OUTPUT Terminal
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-950/60 text-orange-400 border border-orange-800/40 font-mono">
                  {dbmsOutput.length} line(s)
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* View Mode Toggle: Terminal vs Table */}
                <div className="flex items-center rounded-lg border border-zinc-700/60 p-0.5 bg-zinc-800/40 text-xs">
                  <button
                    type="button"
                    onClick={() => setOutputViewMode("terminal")}
                    className={`px-2.5 py-0.5 rounded-md font-medium transition-colors ${
                      outputViewMode === "terminal"
                        ? "bg-orange-600 text-white font-semibold"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Console
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutputViewMode("table")}
                    className={`px-2.5 py-0.5 rounded-md font-medium transition-colors ${
                      outputViewMode === "table"
                        ? "bg-orange-600 text-white font-semibold"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Table
                  </button>
                </div>

                {outputViewMode === "terminal" && dbmsOutput.length > 0 && (
                  <button
                    type="button"
                    onClick={handleCopyConsole}
                    className="px-2 py-1 text-xs rounded-md border text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-colors"
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
                  background: "#080B11",
                  color: "#F1F5F9",
                }}
              >
                {dbmsOutput.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-zinc-500 gap-2 font-sans">
                    <span className="text-2xl">⚡</span>
                    <p className="text-xs">No execution output yet. Click &quot;Execute PL/SQL Script&quot; to run.</p>
                  </div>
                ) : (
                  dbmsOutput.map((line, idx) => (
                    <div key={idx} className="flex items-start gap-3 hover:bg-zinc-800/30 px-1 py-0.5 rounded">
                      <span className="text-zinc-600 text-[11px] select-none shrink-0 w-6 text-right">
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
                                : "text-zinc-200"
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
                    <tr className="border-b bg-zinc-900/60" style={{ borderColor: "var(--border)" }}>
                      {columns.map((c) => (
                        <th key={c} className="p-3 font-semibold text-zinc-300 uppercase tracking-wider text-[11px]">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {finalRows.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length || 1} className="p-8 text-center text-zinc-500">
                          No rows to display.
                        </td>
                      </tr>
                    ) : (
                      finalRows.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className="border-b hover:bg-zinc-800/30 transition-colors"
                          style={{ borderColor: "var(--border)" }}
                        >
                          {columns.map((c) => (
                            <td key={c} className="p-3 font-mono text-zinc-300">
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
          <div
            className="rounded-2xl border p-4"
            style={{ background: "var(--panel)", borderColor: "var(--border)" }}
          >
            <h3 className="text-sm font-bold text-zinc-200 mb-3 flex items-center gap-2">
              <span>Chen ER Diagram & Schema Inspector</span>
            </h3>
            <ChenERDiagram schema={schema} theme={theme} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {schema.map((t) => (
              <div
                key={t.name}
                className="rounded-xl border p-3 flex flex-col gap-2"
                style={{ background: "var(--panel)", borderColor: "var(--border)" }}
              >
                <div className="flex items-center justify-between border-b pb-2 border-zinc-800">
                  <span className="font-bold text-sm text-orange-400 font-mono">
                    {t.name}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {t.rows.length} rows
                  </span>
                </div>
                <div className="flex flex-col gap-1 text-xs">
                  {t.columns.map((c) => (
                    <div key={c.name} className="flex items-center justify-between py-0.5 text-zinc-300 font-mono">
                      <span>{c.name}</span>
                      <span className="text-zinc-500 text-[10px]">
                        {c.type} {c.pk ? "[PK]" : ""} {c.fk ? `-> ${c.fk.table}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab Content: Procedural Logic Explanation ── */}
      {tab === "explanation" && (
        <div
          className="rounded-2xl border p-5 flex flex-col gap-4"
          style={{ background: "var(--panel)", borderColor: "var(--border)" }}
        >
          <div className="border-b pb-3 border-zinc-800">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <span className="text-orange-400">✦</span>
              <span>Procedural Flow & Block Anatomy</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Automated procedural structural breakdown of the executed PL/SQL block.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/40 flex flex-col gap-1">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">1. Declarations</span>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Allocates memory variables, constants, and sets up explicit or implicit cursors in the private SQL area before execution commences.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/40 flex flex-col gap-1">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">2. Control Flow & Loops</span>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Executes procedural branching (IF-THEN-ELSIF), cursor traversal loops, variable assignment arithmetic, and embedded DML updates.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/40 flex flex-col gap-1">
              <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">3. Exception & Output</span>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Captures runtime exceptions (e.g., NO_DATA_FOUND, TOO_MANY_ROWS), logs diagnostic feedback to DBMS_OUTPUT, and commits state atomically.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-zinc-800/80 bg-zinc-900/50 flex flex-col gap-2">
            <span className="text-xs font-bold text-zinc-200">Active Script:</span>
            <pre className="text-xs font-mono p-3 rounded-lg bg-black/60 text-zinc-300 overflow-x-auto leading-relaxed">
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
          <div className="border-b pb-3 border-zinc-800">
            <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <span className="text-orange-400">⚡</span>
              <span>PL/SQL Engine & Oracle Architecture</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Comprehensive theory on procedural database engines, runtime mechanics, and comparison with declarative SQL.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 flex flex-col gap-2">
              <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wide">
                Procedural vs Declarative Execution
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Standard SQL is <strong>declarative</strong>: it specifies <em>what</em> data to retrieve, leaving the execution strategy to the cost-based optimizer.
                PL/SQL is <strong>procedural</strong>: it gives the engineer explicit control over <em>how</em> steps execute, allowing loops, conditional branching, stateful cursor traversal, and error trapping.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 flex flex-col gap-2">
              <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wide">
                Context Switching & Engine Collaboration
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed">
                When a PL/SQL block runs, the <strong>PL/SQL engine</strong> executes procedural logic (loops, assignments, conditions) and sends embedded SQL statements to the <strong>SQL engine</strong>.
                Minimizing context switching (e.g., through cursor FOR loops or batch operations) maximizes throughput.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 flex flex-col gap-2">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                Cursor Mechanics & Memory Work Areas
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed">
                An Oracle cursor is a pointer to the <strong>Private SQL Area</strong> in the Program Global Area (PGA).
                Explicit cursors allow fine-grained lifecycle management (<code>OPEN</code>, <code>FETCH</code>, <code>CLOSE</code>) with state attributes like <code>%FOUND</code>, <code>%NOTFOUND</code>, and <code>%ROWCOUNT</code>.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 flex flex-col gap-2">
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wide">
                DBMS_OUTPUT Architecture
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed">
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
