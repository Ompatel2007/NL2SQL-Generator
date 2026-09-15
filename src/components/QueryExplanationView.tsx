"use client";

import type { QueryExplanation } from "@/lib/queryExplainer";

interface QueryExplanationViewProps {
  explanation: QueryExplanation | null;
  hasExecuted: boolean;
}

export function QueryExplanationView({
  explanation,
  hasExecuted,
}: QueryExplanationViewProps) {
  if (!hasExecuted || !explanation) {
    return (
      <div
        className="panel p-8 rounded-xl border text-center flex flex-col items-center justify-center min-h-80 space-y-3"
        style={{
          background: "var(--panel)",
          borderColor: "var(--border)",
          color: "var(--foreground)",
        }}
      >
        <div
          className="w-12 h-12 rounded-full border flex items-center justify-center mb-1"
          style={{
            background: "var(--surface-subtle)",
            borderColor: "var(--border)",
            color: "var(--muted)",
          }}
        >
          <svg className="w-6 h-6 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-base md:text-lg font-bold" style={{ color: "var(--foreground)" }}>
          No query has been executed yet.
        </h3>
        <p className="text-xs md:text-sm opacity-80 max-w-md leading-relaxed" style={{ color: "var(--muted)" }}>
          Execute a natural-language or SQL query to see a detailed explanation here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" aria-label="Detailed Query Explanation">
      {/* 1. Header & Executed SQL */}
      <div
        className="panel p-4 rounded-xl border space-y-2.5"
        style={{
          background: "var(--panel)",
          borderColor: "var(--border)",
          color: "var(--foreground)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-bold px-2 py-0.5 rounded border"
              style={{
                background: "var(--surface-subtle)",
                borderColor: "var(--accent)",
                color: "var(--accent)",
              }}
            >
              {explanation.statementType} Query
            </span>
            <h2 className="font-bold text-sm md:text-base tracking-tight" style={{ color: "var(--foreground)" }}>
              Executed SQL Query
            </h2>
          </div>
          <span className="text-xs opacity-75 font-mono" style={{ color: "var(--muted)" }}>
            {explanation.finalOutputSummary.rowCount} row{explanation.finalOutputSummary.rowCount !== 1 ? "s" : ""} returned
          </span>
        </div>

        <pre
          className="p-3 rounded-lg border text-xs md:text-sm font-mono whitespace-pre-wrap wrap-break-word"
          style={{
            background: "var(--surface-subtle)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
        >
          {explanation.sql}
        </pre>

        <p className="text-xs opacity-85 leading-relaxed pt-0.5" style={{ color: "var(--foreground)" }}>
          {explanation.summary}
        </p>
      </div>



      {/* 3. Step-by-Step Query Clause Breakdown */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm md:text-base tracking-tight" style={{ color: "var(--foreground)" }}>
          Step-by-Step Relational Execution Breakdown
        </h3>

        {explanation.steps.map((st) => (
          <div
            key={st.stepNumber}
            className="panel p-4 rounded-xl border space-y-3 shadow-xs"
            style={{
              background: "var(--panel)",
              borderColor: "var(--border)",
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--accent)] border border-[var(--border)]">
                  STEP {st.stepNumber} — {st.clause}
                </span>
                <h4 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
                  {st.title}
                </h4>
              </div>
            </div>

            <p className="text-xs md:text-sm opacity-90 leading-relaxed" style={{ color: "var(--foreground)" }}>
              {st.description}
            </p>

            {/* Metrics pills */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {st.metrics.map((m, mIdx) => (
                <div
                  key={mIdx}
                  className="p-2 rounded-lg border text-xs"
                  style={{
                    background: "var(--surface-subtle)",
                    borderColor: "var(--border)",
                  }}
                >
                  <span className="text-xs opacity-70 block" style={{ color: "var(--muted)" }}>
                    {m.label}
                  </span>
                  <span className="font-mono font-bold text-xs md:text-sm" style={{ color: "var(--foreground)" }}>
                    {m.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Sample Table Rows if applicable */}
            {st.sampleRows && st.sampleRows.length > 0 && st.columns && st.columns.length > 0 && (
              <div className="pt-1">
                <span className="text-xs font-semibold opacity-70 block mb-1.5" style={{ color: "var(--muted)" }}>
                  Working Relation Snapshot ({st.sampleRows.length} sample row{st.sampleRows.length !== 1 ? "s" : ""}):
                </span>
                <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
                  <table className="text-xs w-full border-collapse">
                    <thead>
                      <tr style={{ background: "var(--surface-subtle)" }}>
                        {st.columns.map((c) => (
                          <th
                            key={c}
                            className="text-left px-2 py-1 border-b font-mono font-bold"
                            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                          >
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {st.sampleRows.map((r, rIdx) => (
                        <tr key={rIdx} className="hover:opacity-90">
                          {st.columns!.map((c) => (
                            <td
                              key={c}
                              className="px-2 py-1 border-b"
                              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                            >
                              {String(r[c] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 4. Execution Pipeline Connection */}
      {explanation.pipelineConnection?.length > 0 && (
        <div
          className="panel p-4 rounded-xl border space-y-3"
          style={{
            background: "var(--panel)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-mono font-bold px-2 py-0.5 rounded border"
              style={{
                background: "var(--surface-subtle)",
                borderColor: "var(--accent)",
                color: "var(--accent)",
              }}
            >
              Pipeline
            </span>
            <h3 className="font-bold text-sm md:text-base" style={{ color: "var(--foreground)" }}>
              Physical Engine Pipeline Stages
            </h3>
          </div>

          <p className="text-xs opacity-80" style={{ color: "var(--muted)" }}>
            How declarative SQL maps into the physical database operator execution flow:
          </p>

          <div className="space-y-2">
            {explanation.pipelineConnection.map((pipe) => (
              <div
                key={pipe.stepNumber}
                className="p-2.5 rounded-lg border text-xs flex items-center justify-between gap-3"
                style={{
                  background: "var(--surface-subtle)",
                  borderColor: "var(--border)",
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-xs opacity-60 shrink-0">
                    {pipe.stepNumber}.
                  </span>
                  <span className="font-mono font-bold px-2 py-0.5 rounded bg-[var(--panel)] border text-[var(--accent)] shrink-0" style={{ borderColor: "var(--border)" }}>
                    {pipe.stage}
                  </span>
                  <span className="truncate opacity-90" style={{ color: "var(--foreground)" }}>
                    {pipe.operation}
                  </span>
                </div>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[var(--panel)] shrink-0" style={{ color: "var(--muted)" }}>
                  {pipe.rows} row{pipe.rows !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
