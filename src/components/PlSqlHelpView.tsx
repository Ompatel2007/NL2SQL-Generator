"use client";

import React, { useState } from "react";

interface PlSqlHelpViewProps {
  onBackToWorkspace?: () => void;
}

function HelpSubcard({
  title,
  content,
  defaultOpen = true,
}: {
  title: string;
  content: string;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className="rounded-xl border transition-all overflow-hidden shadow-2xs"
      style={{
        borderColor: isOpen ? "var(--accent)" : "var(--border)",
        background: "var(--surface-subtle)",
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3.5 flex items-center justify-between text-left cursor-pointer transition-colors hover:opacity-95 focus:outline-none"
        style={{
          background: isOpen ? "rgba(var(--accent-rgb, 255, 106, 61), 0.08)" : "transparent",
        }}
      >
        <span className="font-semibold text-xs md:text-sm uppercase tracking-wider text-[var(--accent)]">
          {title}
        </span>
        <div className="flex items-center gap-1.5 text-xs opacity-75 font-mono">
          <span className="hidden sm:inline font-sans">{isOpen ? "Hide" : "Click to view"}</span>
          <span className="text-xs">{isOpen ? "▲" : "▼"}</span>
        </div>
      </button>

      {isOpen && (
        <div
          className="p-4 pt-3 text-xs md:text-sm leading-relaxed border-t"
          style={{
            borderColor: "var(--border)",
            background: "var(--panel)",
            color: "var(--foreground)",
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}

const HELP_SECTIONS = [
  {
    id: 1,
    title: "1. The PL/SQL Workspace",
    summary: "Complete procedural development environment for executing Oracle PL/SQL blocks and procedural automation.",
    cards: [
      {
        title: "Workspace Overview",
        content: "The PL/SQL Workspace provides an interactive development environment designed specifically for Oracle PL/SQL. It includes a left input sidebar for natural language prompts, voice dictation, and script editing, alongside a center canvas featuring a step-by-step pipeline player, interactive DBMS_OUTPUT terminal, and schema visualizer.",
      },
      {
        title: "Layout and Resizing",
        content: "The layout features a dual-panel arrangement with a draggable slider handle. Drag the slider to resize the left panel according to your display needs, or click the collapse button (◀ / ▶) to toggle between full canvas and side-by-side view.",
      },
    ],
  },
  {
    id: 2,
    title: "2. Natural Language Translation to PL/SQL",
    summary: "Translates plain conversational English instructions into executable Oracle PL/SQL blocks using Gemini AI.",
    cards: [
      {
        title: "Asking by Voice or Text",
        content: "Type your procedural requirements into the '1. Ask by Voice or Natural Language' box (e.g. 'Loop through customers in Mumbai and print their names with row count') or click the 'Speak & Run SQL/PLSQL' microphone button. Click 'Translate & Run' to have Gemini synthesize an executable PL/SQL block with appropriate variable declarations and DBMS_OUTPUT.PUT_LINE statements.",
      },
      {
        title: "Direct PL/SQL Fast-Path",
        content: "If you input a block starting with DECLARE, BEGIN, or CREATE OR REPLACE, the engine automatically recognizes it as raw PL/SQL code and bypasses AI generation for instantaneous execution.",
      },
    ],
  },
  {
    id: 3,
    title: "3. Writing and Executing PL/SQL",
    summary: "Full support for standard anonymous blocks, control flow, cursors, and embedded DML.",
    cards: [
      {
        title: "Supported Constructs",
        content: "The engine parses and executes standard PL/SQL constructs: DECLARE variable blocks (NUMBER, VARCHAR2, BOOLEAN, DATE), explicit cursors (CURSOR c IS SELECT ...), cursor FOR loops (FOR r IN (SELECT ...)), numeric FOR loops (FOR i IN 1..N), conditional branches (IF-THEN-ELSIF-ELSE), embedded DML (INSERT, UPDATE, DELETE, SELECT ... INTO), and EXCEPTION blocks.",
      },
      {
        title: "DBMS_OUTPUT Terminal",
        content: "All calls to DBMS_OUTPUT.PUT_LINE are captured in real-time in the DBMS_OUTPUT Terminal located under the 'Pipeline & Output' tab. Toggle between the Console view and structured Table view, or copy the entire output log with one click.",
      },
    ],
  },
  {
    id: 4,
    title: "4. Reports and Data Export",
    summary: "Generate and export execution audit logs and datasets in multiple formats.",
    cards: [
      {
        title: "Exporting Results",
        content: "Click 'CSV' in the canvas header to download result records or console lines as a .csv file. Click 'Report' to generate a complete execution report in Markdown (.md), or navigate to the 'Download' section in the top bar to download reports in PDF, DOCX, TXT, or Markdown format.",
      },
    ],
  },
];

export function PlSqlHelpView({}: PlSqlHelpViewProps) {
  return (
    <main
      className="flex-1 min-h-0 flex flex-col p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 overflow-y-auto overflow-x-hidden w-full max-w-none leading-relaxed"
      style={{ color: "var(--foreground)" }}
      aria-label="Help section: Comprehensive PL/SQL Manual"
    >
      {/* Top Header / Breadcrumb matching HelpView.tsx */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-6 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-sm font-semibold px-2.5 py-1 rounded border"
              style={{
                background: "var(--surface-subtle)",
                borderColor: "var(--accent)",
                color: "var(--accent)",
              }}
            >
              PL/SQL Studio Reference Manual
            </span>
            <span
              className="text-sm opacity-70"
              style={{ color: "var(--muted)" }}
            >
              Step-by-step Guides, Controls &amp; Syntax Reference
            </span>
          </div>
          <h1
            className="text-2xl md:text-4xl font-bold tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            PL/SQL Studio Operations &amp; User Manual
          </h1>
          <p
            className="text-sm md:text-base opacity-80 mt-1.5"
            style={{ color: "var(--muted)" }}
          >
            Detailed instructions explaining every user interface control, translation behavior, procedural stage, and export format in the PL/SQL workspace.
          </p>
        </div>
      </div>

      {/* Help Sections */}
      <div className="flex flex-col gap-6">
        {HELP_SECTIONS.map((section) => (
          <div
            key={section.id}
            className="rounded-xl border p-5 flex flex-col gap-3"
            style={{
              background: "var(--panel)",
              borderColor: "var(--border)",
            }}
          >
            <div className="border-b pb-3" style={{ borderColor: "var(--border)" }}>
              <h2 className="text-base sm:text-lg font-bold" style={{ color: "var(--foreground)" }}>
                {section.title}
              </h2>
              <p className="text-xs sm:text-sm opacity-80 mt-0.5" style={{ color: "var(--muted)" }}>
                {section.summary}
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-1">
              {section.cards.map((c) => (
                <HelpSubcard key={c.title} title={c.title} content={c.content} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
