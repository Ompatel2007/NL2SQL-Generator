"use client";

interface DevelopedByViewProps {
  onBackToWorkspace: () => void;
}

export function DevelopedByView({ onBackToWorkspace }: DevelopedByViewProps) {
  return (
    <main
      className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto max-w-6xl mx-auto w-full"
      style={{ color: "var(--foreground)" }}
      aria-label="Developed by and project attribution"
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
              About Project
            </span>
            <span className="text-xs opacity-60" style={{ color: "var(--muted)" }}>
              Credits &amp; Academic Overview
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
            Developed By
          </h1>
          <p className="text-sm opacity-80 mt-1" style={{ color: "var(--muted)" }}>
            Project background, architecture overview, and academic demonstration attribution.
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
        {/* Card 1: Project Overview */}
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
              <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-base font-bold" style={{ color: "var(--foreground)" }}>
              Project Architecture
            </h2>
            <p className="text-xs md:text-sm opacity-80 leading-relaxed" style={{ color: "var(--muted)" }}>
              NL→SQL Visualizer is an educational relational database environment integrating LLM natural language semantic parsing, AST decomposition, and step-by-step physical execution pipelines.
            </p>
          </div>
          <div
            className="mt-4 pt-3 border-t text-xs opacity-70 flex items-center gap-1.5"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            <span>Architecture section ready</span>
          </div>
        </div>

        {/* Card 2: Contributors */}
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
              <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h2 className="text-base font-bold" style={{ color: "var(--foreground)" }}>
              Development &amp; Academic Team
            </h2>
            <p className="text-xs md:text-sm opacity-80 leading-relaxed" style={{ color: "var(--muted)" }}>
              Built for academic demonstration, database research, and pedagogical instruction in database management systems (DBMS).
            </p>
          </div>
          <div
            className="mt-4 pt-3 border-t text-xs opacity-70 flex items-center gap-1.5"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            <span>Profile section ready</span>
          </div>
        </div>

        {/* Card 3: Technologies */}
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
              <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h2 className="text-base font-bold" style={{ color: "var(--foreground)" }}>
              Technology Stack
            </h2>
            <p className="text-xs md:text-sm opacity-80 leading-relaxed" style={{ color: "var(--muted)" }}>
              Next.js 16, TypeScript, Tailwind CSS, Google Gemini 2.5 Flash API, Web Speech API, and in-memory relational query execution engine.
            </p>
          </div>
          <div
            className="mt-4 pt-3 border-t text-xs opacity-70 flex items-center gap-1.5"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            <span>Tech specifications ready</span>
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
          Detailed contributor profiles, citations, and institutional attribution will be populated in this section in a subsequent step.
        </span>
      </div>
    </main>
  );
}
