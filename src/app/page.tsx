"use client";

import { useState } from "react";
import Link from "next/link";

export default function LandingPage() {
  const [hoveredSide, setHoveredSide] = useState<"sql" | "plsql" | null>(null);
  const [plsqlNotice, setPlsqlNotice] = useState(false);

  const handlePlSqlClick = () => {
    setPlsqlNotice(true);
    setTimeout(() => {
      setPlsqlNotice(false);
    }, 3200);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#07090e] text-slate-100 flex flex-col font-sans overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Ambience & Grid */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* SQL Side Ambient Radial Glow */}
        <div
          className={`absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-cyan-600/15 blur-[130px] transition-opacity duration-700 ${
            hoveredSide === "sql" ? "opacity-100 scale-110" : "opacity-60"
          }`}
        />
        {/* PL/SQL Side Ambient Radial Glow */}
        <div
          className={`absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-purple-600/15 blur-[130px] transition-opacity duration-700 ${
            hoveredSide === "plsql" ? "opacity-100 scale-110" : "opacity-60"
          }`}
        />
        {/* Subtle Bottom Ambient Center Glow */}
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-blue-900/10 blur-[150px]" />

        {/* Tech Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-20 w-full border-b border-white/[0.07] bg-[#07090e]/70 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 border border-white/15 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
            <svg
              className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-wider text-white flex items-center gap-2">
              NL2Query
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                v2.0
              </span>
            </span>
            <span className="text-[11px] text-slate-400 tracking-wide">
              Database Engine & Learning Lab
            </span>
          </div>
        </div>

        {/* Status indicator */}
        <div className="hidden sm:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium">SQL Engine Ready</span>
          </div>
        </div>
      </header>

      {/* Main Split Section */}
      <main className="relative z-10 flex-1 flex flex-col md:flex-row w-full max-w-[1600px] mx-auto">
        {/* ================================================================= */}
        {/* LEFT HALF: SQL */}
        {/* ================================================================= */}
        <section
          onMouseEnter={() => setHoveredSide("sql")}
          onMouseLeave={() => setHoveredSide(null)}
          className="relative flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-14 transition-all duration-500 group overflow-hidden"
        >
          {/* Subtle Hover Backlight */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.03] via-blue-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          {/* Top Title & Metadata */}
          <div className="relative z-10 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-xs font-semibold tracking-wide uppercase shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Declarative Database Engine
            </div>

            <div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-3">
                <span className="bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent group-hover:drop-shadow-[0_0_30px_rgba(56,189,248,0.4)] transition-all duration-300">
                  SQL
                </span>
              </h1>
              <p className="text-slate-300 text-base sm:text-lg max-w-xl font-normal leading-relaxed">
                Structured Query Language powered by natural language synthesis. Translate English prompts, explore interactive relational algebra, inspect step-by-step pipelines, and execute real-time SQLite queries.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-2 pt-2">
              {[
                "Natural Language to SQL",
                "Relational Algebra Pipeline",
                "Visual ER Schema & Diagram",
                "PDF & DOCX Report Export",
              ].map((feature) => (
                <span
                  key={feature}
                  className="px-3 py-1 text-xs rounded-md bg-white/[0.04] border border-white/[0.08] text-slate-300 group-hover:border-cyan-500/30 group-hover:text-cyan-200 transition-colors"
                >
                  ✓ {feature}
                </span>
              ))}
            </div>

            {/* Interactive Code Preview Card */}
            <div className="mt-4 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md p-4 shadow-xl font-mono text-xs overflow-x-auto text-slate-300 space-y-1.5 group-hover:border-cyan-500/30 transition-colors">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06] text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                  <span className="ml-2 font-sans font-medium text-slate-400">query.sql</span>
                </div>
                <span className="text-cyan-400/80">SELECT Execution</span>
              </div>
              <p className="text-slate-500 italic">-- Prompt: "Find high earning employees by department"</p>
              <p>
                <span className="text-cyan-400 font-bold">SELECT</span>{" "}
                <span className="text-white">department, COUNT(*), AVG(salary)</span>
              </p>
              <p>
                <span className="text-cyan-400 font-bold">FROM</span>{" "}
                <span className="text-emerald-300">employees</span>
              </p>
              <p>
                <span className="text-cyan-400 font-bold">WHERE</span>{" "}
                <span className="text-white">status = </span>
                <span className="text-amber-300">&apos;ACTIVE&apos;</span>
              </p>
              <p>
                <span className="text-cyan-400 font-bold">GROUP BY</span>{" "}
                <span className="text-white">department</span>
              </p>
              <p>
                <span className="text-cyan-400 font-bold">ORDER BY</span>{" "}
                <span className="text-white">AVG(salary)</span>{" "}
                <span className="text-cyan-400 font-bold">DESC</span>;
              </p>
            </div>
          </div>

          {/* Bottom Action Area */}
          <div className="relative z-10 pt-8 mt-6">
            <Link
              href="/sql"
              className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-sm tracking-wide text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.7)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 border border-cyan-300/30 group/btn"
            >
              <svg
                className="w-4 h-4 text-cyan-200 group-hover/btn:rotate-12 transition-transform duration-300"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              <span>Launch SQL Studio</span>
              <span className="text-lg group-hover/btn:translate-x-1 transition-transform duration-300">
                →
              </span>
            </Link>
          </div>
        </section>

        {/* ================================================================= */}
        {/* CENTER DIVIDER: LIGHTNING BOLT CONDUIT */}
        {/* ================================================================= */}
        <div className="relative flex md:flex-col items-center justify-center my-4 md:my-0 px-4 md:px-0 z-30">
          {/* Vertical Laser Line (Desktop) */}
          <div className="hidden md:block absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-gradient-to-b from-transparent via-cyan-500/40 via-purple-500/40 to-transparent" />
          
          {/* Horizontal Line (Mobile) */}
          <div className="block md:hidden absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/40 via-purple-500/40 to-transparent" />

          {/* Electric Glow Aura */}
          <div className="absolute w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-500/20 via-blue-500/20 to-purple-500/20 blur-xl pointer-events-none animate-pulse" />

          {/* Center Lightning Emblem */}
          <div
            className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#090b14] border-2 border-white/20 shadow-[0_0_30px_rgba(56,189,248,0.4),0_0_60px_rgba(168,85,247,0.3)] transition-transform duration-300 hover:scale-110 cursor-pointer group/bolt"
            title="Database High Voltage Conduit"
          >
            {/* Spinning subtle energy ring */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-500/30 via-transparent to-purple-500/30 opacity-75 group-hover/bolt:opacity-100 transition-opacity" />

            {/* Lightning SVG Icon */}
            <svg
              className="relative w-8 h-8 sm:w-9 sm:h-9 text-amber-300 filter drop-shadow-[0_0_12px_rgba(251,191,36,0.9)] group-hover/bolt:drop-shadow-[0_0_20px_rgba(251,191,36,1)] transition-all duration-300 animate-[pulse_2s_ease-in-out_infinite]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>

            {/* Micro electric sparks around the bolt */}
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 blur-[1px] animate-ping" />
            <span className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-purple-400 blur-[1px] animate-ping delay-300" />
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT HALF: PL/SQL */}
        {/* ================================================================= */}
        <section
          onMouseEnter={() => setHoveredSide("plsql")}
          onMouseLeave={() => setHoveredSide(null)}
          className="relative flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-14 transition-all duration-500 group overflow-hidden"
        >
          {/* Subtle Hover Backlight */}
          <div className="absolute inset-0 bg-gradient-to-bl from-purple-500/[0.03] via-pink-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          {/* Top Title & Metadata */}
          <div className="relative z-10 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-400 text-xs font-semibold tracking-wide uppercase shadow-[0_0_15px_rgba(168,85,247,0.15)]">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              Procedural Engine
            </div>

            <div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-3">
                <span className="bg-gradient-to-r from-white via-purple-100 to-purple-400 bg-clip-text text-transparent group-hover:drop-shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all duration-300">
                  PL/SQL
                </span>
              </h1>
              <p className="text-slate-300 text-base sm:text-lg max-w-xl font-normal leading-relaxed">
                Procedural Language extensions for SQL. Write stored procedures, user-defined functions, database triggers, explicit cursors, and control-flow blocks with complete transaction isolation.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-2 pt-2">
              {[
                "Stored Procedures & Functions",
                "Database Triggers & Events",
                "Explicit Cursors & Bulk Collect",
                "Custom Exception Handling",
              ].map((feature) => (
                <span
                  key={feature}
                  className="px-3 py-1 text-xs rounded-md bg-white/[0.04] border border-white/[0.08] text-slate-300 group-hover:border-purple-500/30 group-hover:text-purple-200 transition-colors"
                >
                  ⚙ {feature}
                </span>
              ))}
            </div>

            {/* Interactive Code Preview Card */}
            <div className="mt-4 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md p-4 shadow-xl font-mono text-xs overflow-x-auto text-slate-300 space-y-1.5 group-hover:border-purple-500/30 transition-colors">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06] text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                  <span className="ml-2 font-sans font-medium text-slate-400">procedure.pls</span>
                </div>
                <span className="text-purple-400/80">PL/SQL Block</span>
              </div>
              <p>
                <span className="text-purple-400 font-bold">CREATE OR REPLACE PROCEDURE</span>{" "}
                <span className="text-white">apply_bonus(</span>
                <span className="text-amber-300">p_id</span>{" "}
                <span className="text-purple-400 font-bold">IN NUMBER</span>
                <span className="text-white">)</span>{" "}
                <span className="text-purple-400 font-bold">IS</span>
              </p>
              <p className="pl-4">
                <span className="text-white">v_salary</span>{" "}
                <span className="text-emerald-300">NUMBER(10,2)</span>;
              </p>
              <p>
                <span className="text-purple-400 font-bold">BEGIN</span>
              </p>
              <p className="pl-4">
                <span className="text-cyan-400 font-bold">SELECT</span>{" "}
                <span className="text-white">salary</span>{" "}
                <span className="text-cyan-400 font-bold">INTO</span>{" "}
                <span className="text-white">v_salary</span>{" "}
                <span className="text-cyan-400 font-bold">FROM</span>{" "}
                <span className="text-emerald-300">employees</span>{" "}
                <span className="text-cyan-400 font-bold">WHERE</span>{" "}
                <span className="text-white">id = p_id;</span>
              </p>
              <p className="pl-4">
                <span className="text-purple-400 font-bold">IF</span>{" "}
                <span className="text-white">v_salary &lt; 50000</span>{" "}
                <span className="text-purple-400 font-bold">THEN</span>
              </p>
              <p className="pl-8">
                <span className="text-cyan-400 font-bold">UPDATE</span>{" "}
                <span className="text-emerald-300">employees</span>{" "}
                <span className="text-cyan-400 font-bold">SET</span>{" "}
                <span className="text-white">salary = salary * 1.10;</span>
              </p>
              <p className="pl-4">
                <span className="text-purple-400 font-bold">END IF;</span>
              </p>
              <p>
                <span className="text-purple-400 font-bold">END;</span> /
              </p>
            </div>
          </div>

          {/* Bottom Action Area */}
          <div className="relative z-10 pt-8 mt-6">
            <div className="relative inline-block w-full sm:w-auto">
              <button
                type="button"
                onClick={handlePlSqlClick}
                className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-sm tracking-wide text-purple-200 bg-gradient-to-r from-purple-900/60 via-purple-800/40 to-pink-900/50 hover:bg-purple-800/60 border border-purple-500/40 hover:border-purple-400/80 shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_35px_rgba(168,85,247,0.4)] transition-all duration-300 group/plbtn cursor-pointer active:scale-[0.98]"
              >
                <svg
                  className="w-4 h-4 text-purple-400 group-hover/plbtn:rotate-45 transition-transform duration-300"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm1 15h-2v-6h2zm0-8h-2V7h2z" />
                </svg>
                <span>Explore PL/SQL</span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  Coming Soon
                </span>
              </button>

              {/* Toast Notification when clicked */}
              {plsqlNotice && (
                <div className="absolute -top-16 left-0 right-0 sm:right-auto sm:w-80 p-3 rounded-lg bg-[#141424] border border-purple-500/50 text-purple-200 text-xs shadow-2xl flex items-center gap-2 animate-bounce">
                  <span className="text-base">⚡</span>
                  <span>PL/SQL module is currently in development! Stay tuned.</span>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Sleek Footer */}
      <footer className="relative z-10 w-full border-t border-white/[0.06] bg-[#07090e]/60 py-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>NL2Query Teaching & Execution Suite</span>
          <span>•</span>
          <span className="text-slate-400">Relational & Procedural Database Architectures</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/sql"
            className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 transition-colors"
          >
            Enter SQL Workspace →
          </Link>
        </div>
      </footer>
    </div>
  );
}
