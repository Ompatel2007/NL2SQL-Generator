"use client";

interface HelpViewProps {
  onBackToWorkspace: () => void;
}

export function HelpView({ onBackToWorkspace }: HelpViewProps) {
  return (
    <main
      className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto max-w-6xl mx-auto w-full"
      style={{ color: "var(--foreground)" }}
      aria-label="Help and user manual"
    >
      {/* Top Header / Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b" style={{ borderColor: "var(--border)" }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded border"
              style={{
                background: "var(--surface-subtle)",
                borderColor: "var(--accent)",
                color: "var(--accent)",
              }}
            >
              Documentation
            </span>
            <span className="text-xs opacity-60" style={{ color: "var(--muted)" }}>
              Reference &amp; Manual
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
            Help &amp; User Manual
          </h1>
          <p className="text-sm opacity-80 mt-1" style={{ color: "var(--muted)" }}>
            Reference documentation, user workflows, and system guides for the NL→SQL Visualizer.
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToWorkspace}
          className="px-3.5 py-2 rounded-lg text-xs md:text-sm font-semibold border transition-all cursor-pointer shadow-xs hover:opacity-90 flex items-center gap-2"
          style={{
            background: "var(--surface-subtle)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
        >
          <svg className="w-4 h-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Workspace</span>
        </button>
      </div>

      {/* Scaffolding Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Section 1 */}
        <div
          className="panel p-5 rounded-xl border flex flex-col justify-between"
          style={{
            background: "var(--panel)",
            borderColor: "var(--border)",
          }}
        >
          <div className="space-y-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center border font-bold text-sm"
              style={{
                background: "var(--surface-subtle)",
                borderColor: "var(--accent)",
                color: "var(--accent)",
              }}
            >
              1
            </div>
            <h2 className="text-base font-bold" style={{ color: "var(--foreground)" }}>
              Quick Start &amp; Querying
            </h2>
            <p className="text-xs md:text-sm opacity-80 leading-relaxed" style={{ color: "var(--muted)" }}>
              Learn how to enter natural language questions, dictate queries using voice recognition, or write SQL directly in the editor.
            </p>
          </div>
          <div
            className="mt-4 pt-3 border-t text-xs opacity-70 flex items-center gap-1.5"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Section structure ready</span>
          </div>
        </div>

        {/* Section 2 */}
        <div
          className="panel p-5 rounded-xl border flex flex-col justify-between"
          style={{
            background: "var(--panel)",
            borderColor: "var(--border)",
          }}
        >
          <div className="space-y-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center border font-bold text-sm"
              style={{
                background: "var(--surface-subtle)",
                borderColor: "var(--accent)",
                color: "var(--accent)",
              }}
            >
              2
            </div>
            <h2 className="text-base font-bold" style={{ color: "var(--foreground)" }}>
              Execution Pipeline &amp; Relational Algebra
            </h2>
            <p className="text-xs md:text-sm opacity-80 leading-relaxed" style={{ color: "var(--muted)" }}>
              Step through AST parsing, catalog lookup, constraint validation, scans, joins, grouping, and relational algebra notations.
            </p>
          </div>
          <div
            className="mt-4 pt-3 border-t text-xs opacity-70 flex items-center gap-1.5"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Section structure ready</span>
          </div>
        </div>

        {/* Section 3 */}
        <div
          className="panel p-5 rounded-xl border flex flex-col justify-between"
          style={{
            background: "var(--panel)",
            borderColor: "var(--border)",
          }}
        >
          <div className="space-y-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center border font-bold text-sm"
              style={{
                background: "var(--surface-subtle)",
                borderColor: "var(--accent)",
                color: "var(--accent)",
              }}
            >
              3
            </div>
            <h2 className="text-base font-bold" style={{ color: "var(--foreground)" }}>
              Datasets, Schema &amp; Exporting
            </h2>
            <p className="text-xs md:text-sm opacity-80 leading-relaxed" style={{ color: "var(--muted)" }}>
              Switch datasets, construct custom database schemas, inspect Chen ER diagrams, and export CSV or SQL files.
            </p>
          </div>
          <div
            className="mt-4 pt-3 border-t text-xs opacity-70 flex items-center gap-1.5"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Section structure ready</span>
          </div>
        </div>
      </div>

      {/* Notice Card */}
      <div
        className="mt-6 p-4 rounded-xl border flex items-center gap-3 text-xs md:text-sm"
        style={{
          background: "var(--surface-subtle)",
          borderColor: "var(--border)",
          color: "var(--muted)",
        }}
      >
        <svg className="w-5 h-5 text-[var(--accent)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>
          Detailed user manual and interactive walkthrough content will be populated in this section in a subsequent step.
        </span>
      </div>
    </main>
  );
}
