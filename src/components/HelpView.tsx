"use client";

import React, { useState } from "react";

interface HelpViewProps {
  onBackToWorkspace?: () => void;
}

// Subcard component inside each manual section
function HelpSubcard({
  title,
  content,
  highlight = false,
  defaultOpen = true,
}: {
  title: string;
  content: string;
  highlight?: boolean;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className="rounded-lg border transition-all overflow-hidden"
      style={{
        borderColor: isOpen ? (highlight ? "rgba(16, 185, 129, 0.4)" : "var(--accent)") : "var(--border)",
        background: "var(--surface-subtle)",
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full p-3.5 flex items-center justify-between text-left cursor-pointer transition-colors hover:opacity-90 focus:outline-none"
        style={{
          background: isOpen
            ? highlight
              ? "rgba(16, 185, 129, 0.08)"
              : "rgba(var(--accent-rgb, 99, 102, 241), 0.08)"
            : "transparent",
        }}
      >
        <span
          className={`font-semibold text-xs md:text-sm uppercase tracking-wider ${
            highlight ? "text-emerald-400" : "text-[var(--accent)]"
          }`}
        >
          {title}
        </span>
        <div className="flex items-center gap-1.5 text-xs opacity-75 font-mono">
          <span className="hidden sm:inline font-sans">{isOpen ? "Hide" : "Click to view"}</span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {isOpen && (
        <div className="p-4 border-t text-sm md:text-base leading-relaxed opacity-90" style={{ borderColor: "var(--border)" }}>
          <p>{content}</p>
        </div>
      )}
    </div>
  );
}

export function HelpView({ onBackToWorkspace }: HelpViewProps) {
  const [quickStartOpen, setQuickStartOpen] = useState(true);
  const [openCards, setOpenCards] = useState<Record<number, boolean>>({
    1: true,
    2: true,
  });

  const toggleCard = (id: number) => {
    setOpenCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const all: Record<number, boolean> = {};
    for (let i = 1; i <= 19; i++) {
      all[i] = true;
    }
    setOpenCards(all);
    setQuickStartOpen(true);
  };

  const collapseAll = () => {
    setOpenCards({});
    setQuickStartOpen(false);
  };

  const quickStartSteps = [
    {
      step: "Step 1",
      title: "Choose a dataset",
      desc: "Select a database from the 'Choose a dataset' dropdown at the top of the left sidebar (e.g. E-Commerce, University, Hospital, or Library).",
    },
    {
      step: "Step 2",
      title: "Enter or speak a query",
      desc: "Type a plain-English question into the text area, speak using the microphone button, or click any query under 'Sample Inputs'.",
    },
    {
      step: "Step 3",
      title: "Translate & Run / Execute SQL",
      desc: "Click 'Translate & Run' for natural language questions, or click 'Execute SQL' if you wrote or edited SQL directly.",
    },
    {
      step: "Step 4",
      title: "Inspect generated SQL",
      desc: "Review the generated SQL query in the '2. Or write SQL directly' editor box along with the AI translation confidence score.",
    },
    {
      step: "Step 5",
      title: "View execution and result",
      desc: "Watch the execution pipeline steps light up in the center canvas and inspect the output records in the 'Final Result' table.",
    },
    {
      step: "Step 6",
      title: "Explore Schema / ER / Theory",
      desc: "Switch between the 'Pipeline & Result', 'Schema / ER', and 'Theory' tabs to inspect database tables, Chen ER diagrams, and relational algebra.",
    },
    {
      step: "Step 7",
      title: "Use Download / Report",
      desc: "Use the top navigation 'Download' section or the 'Report' button above the Final Result table to download execution results in PDF, DOCX, CSV, or SVG.",
    },
  ];

  const manualSections = [
    {
      id: 1,
      title: "Getting Started",
      whatItDoes: "Provides an interactive responsive workspace for learning and visualizing relational database execution and natural language to SQL translation.",
      whatToDo: "Upon opening the application, the default landing view is the Workspace. You can resize the left panel by dragging the vertical resizer divider bar or clicking its arrow to collapse or expand it.",
      controls: "Main navigation bar at the top ([Workspace], [Download], [Learn], [Help], [Developed By]), Theme dropdown on the far right, and panel resize slider.",
      processing: "The app initializes an in-memory relational database schema buffer populated with initial sample tables and records.",
      expectedOutput: "A responsive workspace ready to accept natural language prompts or direct SQL code, with the central canvas spanning full width.",
    },
    {
      id: 2,
      title: "Choosing a Dataset",
      whatItDoes: "Switches the active database catalog between different domains (E-Commerce, University, Hospital, Library) or custom user-created datasets.",
      whatToDo: "Click the dataset selector in the left panel to choose any domain, create a new custom dataset, or import datasets from your computer (.csv, .json, .tsv, .sql, .db).",
      controls: "The 'Choose a dataset' dropdown box located at the top-left of the Input Panel, including '+ Create New Dataset...' and 'Import Dataset...'.",
      processing: "The relational database engine clears the current buffer, loads the chosen schema relations, indexes, and initial records, and updates the ER diagram and sample queries.",
      expectedOutput: "The input sample queries and center Schema/ER diagram immediately update to reflect the newly selected dataset domain.",
    },
    {
      id: 3,
      title: "Asking a Question Using Natural Language",
      whatItDoes: "Enables users to query relational data in conversational plain English without writing database code.",
      whatToDo: "Click into the textarea under '1. Ask by Voice or Natural Language' and type any query (e.g. 'Show the names and cities of customers from Mumbai'). Alternatively, click any item under 'Sample Inputs'.",
      controls: "The Natural Language textarea labeled 'Speak via mic above or type (e.g. \"How many customers are there?\")'.",
      processing: "The input string is staged in component state ready to be dispatched to the Gemini translation engine.",
      expectedOutput: "The text appears in the input field, and the 'Translate & Run' button becomes active and clickable.",
    },
    {
      id: 4,
      title: "Using Voice Input",
      whatItDoes: "Captures spoken voice queries using the browser's Web Speech API and converts audio into text in real time.",
      whatToDo: "Click the 'Start Voice Input' button (microphone icon). Grant microphone permission in your browser if prompted, then speak your question clearly into your mic.",
      controls: "The large 'Start Voice Input' microphone button, the 'Auto-Translate on stop' checkbox, and the 'Read SQL summary' checkbox in the Voice Controls bar.",
      processing: "Speech recognition converts audio waveforms into text tokens. A pulsating red 'Recording Audio' badge displays live interim transcripts. If 'Auto-Translate on stop' is checked, translation triggers automatically after speech stops.",
      expectedOutput: "Your spoken question is automatically transcribed into the natural language textarea and executed.",
    },
    {
      id: 5,
      title: "Translating Natural Language to SQL",
      whatItDoes: "Sends your conversational query alongside the active database schema catalog to the LLM (Gemini) to generate standard SQL.",
      whatToDo: "Click the purple 'Translate & Run' button below the natural language textarea.",
      controls: "The 'Translate & Run' button with arrow icon.",
      processing: "The system builds a structured prompt containing table columns, types, primary/foreign keys, and sample rows. The model synthesizes the SQL, validates keywords, and returns an explanation and confidence score.",
      expectedOutput: "A spinner displays 'Translating to SQL...'. Upon completion, the synthesized query appears in the SQL editor, a confidence pill displays the rating (e.g., 95%), and the query is executed automatically.",
    },
    {
      id: 6,
      title: "Writing SQL Directly",
      whatItDoes: "Allows students and developers to write or modify SQL statements manually, supporting DQL (SELECT), DML (INSERT/UPDATE/DELETE), and DDL (CREATE/ALTER/DROP).",
      whatToDo: "Scroll to '2. Or write SQL directly' in the left sidebar and type or edit SQL in the monospaced editor box.",
      controls: "The monospace SQL textarea under '2. Or write SQL directly'.",
      processing: "The editor captures raw SQL text and preserves formatting, indentation, and casing.",
      expectedOutput: "Custom SQL syntax ready for one-click compilation and execution against the in-memory database.",
    },
    {
      id: 7,
      title: "Executing SQL",
      whatItDoes: "Parses, validates, compiles, and executes the SQL query currently present in the SQL editor against active relational tables.",
      whatToDo: "Click the 'Execute SQL' button below the SQL textarea.",
      controls: "The 'Execute SQL' button.",
      processing: "The in-memory relational engine runs lexical tokenization, catalog verification, predicate filtering, joins, aggregates, and projections.",
      expectedOutput: "Execution steps populate the Center Canvas pipeline, and the 'Final Result' table renders output records.",
    },
    {
      id: 8,
      title: "Understanding the Generated SQL",
      whatItDoes: "Displays the translated SQL code generated by the AI model so you can inspect, learn, and verify its correctness.",
      whatToDo: "Review the query displayed in the SQL editor under section 2. You can freely edit keywords, add WHERE conditions, or change column selections.",
      controls: "The SQL textarea and the 'Confidence' box with the natural language interpretation.",
      processing: "The interpretation box breaks down what the AI understood your request to mean. Clicking 'Read aloud' will narrate this explanation using speech synthesis.",
      expectedOutput: "Full visibility into the exact SQL code that will execute on the database.",
    },
    {
      id: 9,
      title: "Understanding the Final Result",
      whatItDoes: "Displays the tabular output dataset produced by the executed query.",
      whatToDo: "Scroll down in the center 'Pipeline & Result' tab to the 'Final Result' card.",
      controls: "The 'Final Result' table, showing total row counts, column names, and scrollable data cells.",
      processing: "The engine projects the designated output attributes for each surviving tuple and maps them into an accessible HTML data grid.",
      expectedOutput: "A high-contrast grid displaying result columns and rows. For mutations (INSERT/UPDATE/DELETE), a notification confirms the number of affected rows.",
    },
    {
      id: 10,
      title: "Understanding the Execution Pipeline",
      whatItDoes: "Breaks down physical query execution into discrete observable stages (PARSER, CATALOG, CONSTRAINT, FROM, JOIN, WHERE, GROUP BY, AGGREGATE, SELECT, ORDER BY, LIMIT).",
      whatToDo: "Click on any stage pill in the 'Execution Pipeline' box (e.g. click 'WHERE' or 'SELECT'), or click the 'Animate' button.",
      controls: "The stage badges (e.g. `FROM (10)`, `WHERE (4)`, `SELECT (4)`) and the 'Animate' / 'Pause' button.",
      processing: "Selecting a step updates the 'Step X/Y' card below, displaying the operational detail and intermediate working table at that exact stage.",
      expectedOutput: "Visual verification of how rows are filtered, joined, aggregated, or projected at each step of query execution.",
    },
    {
      id: 11,
      title: "Understanding Schema / ER",
      whatItDoes: "Renders the relational schema tables, column data types, key constraints, and a complete Chen Entity-Relationship (ER) diagram.",
      whatToDo: "Click the 'Schema / ER' tab at the top of the center canvas.",
      controls: "The 'Schema / ER' tab button above the center panel, zoom/reset controls, and table cards.",
      processing: "Extracts table definitions, attribute types, PK flags, and foreign key relations from the catalog and draws an interactive SVG Chen ER diagram with entities, attributes, and relationship diamonds.",
      expectedOutput: "A visual representation of table structures, primary keys (PK), foreign keys (FK), and relationship connectors.",
    },
    {
      id: 12,
      title: "Understanding Theory / Relational Foundations",
      whatItDoes: "Provides query-specific execution theory, big-O complexity upper bounds, relational algebra equivalences, and buffer page models.",
      whatToDo: "Click the 'Theory' tab at the top of the center canvas.",
      controls: "The 'Theory' tab button in the center panel.",
      processing: "Calculates stage-specific algorithmic complexities, relational algebra operators, and disk I/O slotted block access models for the active executed statement.",
      expectedOutput: "Execution Theory & Insights cards tailored dynamically to the executed query and active operator stage.",
    },
    {
      id: 13,
      title: "Understanding Complexity Information",
      whatItDoes: "Displays algorithmic time complexity metrics for database operations (e.g. O(N) scans, O(N × M) nested joins, O(N log N) external sorts).",
      whatToDo: "Click the 'Theory' tab in the central canvas while inspecting any pipeline step.",
      controls: "The 'Theory' tab and stage selection pills.",
      processing: "Maps the active operator to its operational notes and big-O computational upper bounds for Best, Average, and Worst cases.",
      expectedOutput: "Algorithmic expressions and operational complexity notes explaining why specific database operators perform with certain efficiencies.",
    },
    {
      id: 14,
      title: "Using Query History",
      whatItDoes: "Maintains a persistent chronological log of queries executed during your session.",
      whatToDo: "Scroll down to 'History' in the left sidebar and click on any previous query card to reload it.",
      controls: "The history items listed under the 'History' section in the left panel.",
      processing: "Loads the saved SQL query and question back into the editor and re-executes it automatically.",
      expectedOutput: "Instant restoration of prior queries with their timestamp, statement type badge, and row counts.",
    },
    {
      id: 15,
      title: "Editing the Dataset",
      whatItDoes: "Enables adding custom tables, modifying schema definitions, adding columns, setting Primary/Foreign keys, and populating custom records.",
      whatToDo: "Click the 3-dots menu or 'Edit Dataset' button next to the dataset dropdown.",
      controls: "'Edit Dataset' button, 'New Dataset' button, or 'Reset Database' button.",
      processing: "Opens the Dataset Modal dialog where tables, column types (INTEGER, TEXT, REAL), and sample records can be defined and saved to localStorage.",
      expectedOutput: "A customized database schema that immediately becomes the active target for voice and natural language queries.",
    },
    {
      id: 16,
      title: "Importing Datasets (.csv, .json, .sql, .db)",
      whatItDoes: "Imports local database files or tabular data (.csv, .tsv, .json, .sql, and SQLite .db binaries) into the active workspace.",
      whatToDo: "Click 'Import Dataset...' from the dataset dropdown or '+ Import' in the left panel.",
      controls: "The Import Dataset Modal with drag-and-drop file upload zone.",
      processing: "Parses CSV headers, JSON records, SQL dumps, or binary SQLite .db tables using sql.js in the browser.",
      expectedOutput: "The uploaded tables, records, and schema catalog are immediately registered and active in the database.",
    },
    {
      id: 17,
      title: "Exporting Reports & Datasets (Download View)",
      whatItDoes: "Provides comprehensive export capabilities for execution reports, result tables, ER diagrams, and complete session history.",
      whatToDo: "Click 'Download' in the top navigation bar to open the dedicated Download Center.",
      controls: "The 'Download' navigation tab and format buttons (PDF, DOCX, CSV, Excel, MD, JSON, TSV, SQL, SQLite .db, SVG, PNG).",
      processing: "Generates formatted PDF/Word reports with embedded ER diagrams, converts tables to spreadsheets or CSV, and packages query logs.",
      expectedOutput: "Instant file download in your selected format with complete execution metadata.",
    },
    {
      id: 18,
      title: "Switching Day/Night & Themes",
      whatItDoes: "Changes the color palette and dark/light mode of the application.",
      whatToDo: "Click the 'Theme' button in the top-right corner of the top navigation bar and select a theme.",
      controls: "The 'Theme' dropdown menu in the header (Slate, Pearl, etc.).",
      processing: "Updates CSS custom variables (`data-theme` attribute on the root element) and persists your preference in `localStorage`.",
      expectedOutput: "The interface updates its appearance immediately, with 'Pearl' providing light mode and 'Slate' providing the dark theme.",
    },
    {
      id: 19,
      title: "Handling Errors & Constraint Violations",
      whatItDoes: "Identifies and highlights syntax mistakes, non-existent table/column names, or constraint violations.",
      whatToDo: "If a query fails, read the red error alert box displayed under the SQL editor and in the canvas Theory tab.",
      controls: "Red error banners in the Input Panel and Theory tab.",
      processing: "The engine catches the exception, halts execution safely, leaves database buffers untainted, and explains which identifier was invalid.",
      expectedOutput: "Clear actionable guidance telling you whether a column was not found, a table name was misspelled, or SQL grammar was malformed.",
    },
  ];

  return (
    <main
      className="flex-1 min-h-0 flex flex-col p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 overflow-y-auto overflow-x-hidden w-full max-w-none leading-relaxed"
      style={{ color: "var(--foreground)" }}
      aria-label="Help and User Manual"
    >
      {/* Top Header / Breadcrumb */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-8 border-b"
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
              User Manual
            </span>
            <span className="text-sm opacity-70" style={{ color: "var(--muted)" }}>
              Step-by-Step Operating Guide
            </span>
          </div>
          <h1
            className="text-2xl md:text-4xl font-bold tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            Help &amp; User Manual
          </h1>
          <p className="text-sm md:text-base opacity-80 mt-1.5" style={{ color: "var(--muted)" }}>
            Complete operating manual for the NL2Query workspace, controls, and features.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={expandAll}
            className="px-3 py-2 rounded-lg text-xs md:text-sm font-semibold border transition-all cursor-pointer hover:opacity-90"
            style={{
              background: "var(--surface-subtle)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="px-3 py-2 rounded-lg text-xs md:text-sm font-semibold border transition-all cursor-pointer hover:opacity-90"
            style={{
              background: "var(--surface-subtle)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* QUICK START SECTION (Collapsible Card Tab) */}
      <section
        className="panel rounded-xl border transition-all overflow-hidden mb-8 shadow-xs"
        style={{
          background: "var(--panel)",
          borderColor: quickStartOpen ? "var(--accent)" : "var(--border)",
        }}
      >
        <button
          type="button"
          onClick={() => setQuickStartOpen(!quickStartOpen)}
          aria-expanded={quickStartOpen}
          className="w-full p-5 flex items-center justify-between text-left cursor-pointer transition-colors hover:bg-[var(--surface-subtle)] focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-3 py-1 rounded bg-[var(--accent)] text-[var(--accent-foreground)] uppercase tracking-wider">
              Quick Start
            </span>
            <h2 className="text-base md:text-xl font-bold" style={{ color: "var(--foreground)" }}>
              7-Step Getting Started Walkthrough
            </h2>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shrink-0 transition-colors"
            style={{
              background: quickStartOpen ? "var(--accent)" : "var(--surface-subtle)",
              color: quickStartOpen ? "var(--accent-foreground)" : "var(--foreground)",
              borderColor: "var(--border)",
            }}
          >
            <span className="hidden sm:inline font-sans">
              {quickStartOpen ? "Collapse" : "Click to view"}
            </span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
                quickStartOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </button>

        {quickStartOpen && (
          <div className="p-6 border-t space-y-4" style={{ borderColor: "var(--border)" }}>
            <p className="text-sm md:text-base opacity-85 leading-relaxed">
              Follow these simple steps to perform your first natural language query and inspect its relational execution:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
              {quickStartSteps.map((item) => (
                <div
                  key={item.step}
                  className="p-4 rounded-lg border bg-[var(--surface-subtle)] space-y-1.5"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[var(--panel)] text-[var(--accent)] border border-[var(--border)]">
                      {item.step}
                    </span>
                    <h3 className="text-sm font-bold truncate" style={{ color: "var(--foreground)" }}>
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-xs md:text-sm opacity-85 leading-relaxed pl-0.5">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* DETAILED USER MANUAL SECTIONS 1 - 19 (Collapsible Card Tabs Matching Pic) */}
      <div className="space-y-4">
        <div className="pb-2">
          <h2 className="text-lg md:text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
            Detailed Feature Manual (Sections 1 — 19)
          </h2>
          <p className="text-sm md:text-base opacity-80 mt-1" style={{ color: "var(--muted)" }}>
            Detailed operation rules, input requirements, button names, processing lifecycles, and expected outputs. Click any card to expand or collapse.
          </p>
        </div>

        {manualSections.map((sec) => {
          const isOpen = !!openCards[sec.id];
          return (
            <section
              key={sec.id}
              className="panel rounded-xl border transition-all duration-200 overflow-hidden shadow-xs"
              style={{
                background: "var(--panel)",
                borderColor: isOpen ? "var(--accent)" : "var(--border)",
              }}
            >
              {/* Header Button: Clicking toggles collapse/expand tab */}
              <button
                type="button"
                onClick={() => toggleCard(sec.id)}
                aria-expanded={isOpen}
                className="w-full p-4 md:p-5 flex items-center justify-between text-left cursor-pointer transition-colors hover:bg-[var(--surface-subtle)] focus:outline-none"
              >
                <div className="flex items-center gap-3 md:gap-4 pr-3 min-w-0">
                  <span
                    className="text-xs md:text-sm font-mono font-bold px-2.5 py-1 rounded shrink-0 border"
                    style={{
                      background: isOpen ? "var(--accent)" : "var(--surface-subtle)",
                      color: isOpen ? "var(--accent-foreground)" : "var(--accent)",
                      borderColor: "var(--border)",
                    }}
                  >
                    {sec.id}
                  </span>
                  <div className="min-w-0">
                    <h3
                      className="text-base md:text-lg font-bold tracking-tight truncate"
                      style={{ color: "var(--foreground)" }}
                    >
                      {sec.title}
                    </h3>
                    {!isOpen && (
                      <p
                        className="text-xs md:text-sm opacity-70 truncate mt-0.5"
                        style={{ color: "var(--muted)" }}
                      >
                        {sec.whatItDoes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Indicator icon showing you have to click to view more details */}
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shrink-0 transition-colors"
                  style={{
                    background: isOpen ? "var(--accent)" : "var(--surface-subtle)",
                    color: isOpen ? "var(--accent-foreground)" : "var(--foreground)",
                    borderColor: "var(--border)",
                  }}
                  title={isOpen ? "Click to collapse card" : "Click to view more details"}
                >
                  <span className="hidden sm:inline font-sans">
                    {isOpen ? "Collapse" : "Click to view"}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {/* Expanded Content: 5 Detailed Subcards matching the picture */}
              {isOpen && (
                <div
                  className="p-5 md:p-6 border-t space-y-4"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <HelpSubcard
                      title="What it does:"
                      content={sec.whatItDoes}
                    />

                    <HelpSubcard
                      title="What the user needs to enter/do:"
                      content={sec.whatToDo}
                    />

                    <HelpSubcard
                      title="Which button / control to use:"
                      content={sec.controls}
                    />

                    <HelpSubcard
                      title="What happens during processing:"
                      content={sec.processing}
                    />
                  </div>

                  <HelpSubcard
                    title="What output the user should expect:"
                    content={sec.expectedOutput}
                    highlight={true}
                  />
                </div>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
