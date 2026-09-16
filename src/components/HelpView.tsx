"use client";

interface HelpViewProps {
  onBackToWorkspace: () => void;
}

export function HelpView({ onBackToWorkspace }: HelpViewProps) {
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
      title: "Use Report if required",
      desc: "Click the 'Report' button above the Final Result table to download a complete execution summary in Markdown format.",
    },
  ];

  const manualSections = [
    {
      id: 1,
      title: "Getting Started",
      whatItDoes: "Provides an interactive three-panel web application for learning and visualizing relational database execution and natural language to SQL translation.",
      whatToDo: "Upon opening the application, the default landing view is the Workspace. You can resize the left and right panels by dragging the vertical resizer divider bars or clicking their arrows to collapse or expand them.",
      controls: "Main navigation bar at the top ([Workspace], [Learn], [Help], [Developed By]), Theme dropdown on the far right, and panel resize sliders.",
      processing: "The app initializes an in-memory relational database schema buffer populated with initial sample tables and records.",
      expectedOutput: "A responsive three-column workspace ready to accept natural language prompts or direct SQL code.",
    },
    {
      id: 2,
      title: "Choosing a Dataset",
      whatItDoes: "Switches the active database catalog between different domains (E-Commerce, University, Hospital, Library) or custom user-created datasets.",
      whatToDo: "Click the dataset selector in the left panel and click on any domain from the dropdown menu.",
      controls: "The 'Choose a dataset' dropdown box located at the top-left of the Input Panel.",
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
      whatItDoes: "Provides academic documentation on relational operators, SQL sublanguages, and database engine theory.",
      whatToDo: "Click the 'Theory' tab at the top of the center canvas.",
      controls: "The 'Theory' tab button.",
      processing: "Renders academic summaries covering DQL, DML, DDL, selection, projection, joins, aggregation, and ACID transaction guarantees.",
      expectedOutput: "A textbook-style reference panel ideal for study and academic demonstrations.",
    },
    {
      id: 13,
      title: "Understanding Complexity Information",
      whatItDoes: "Displays algorithmic time complexity metrics for database operations (e.g. O(N) scans, O(N × M) nested joins, O(N log N) external sorts).",
      whatToDo: "Look at the right sidebar ('Execution Theory & Insights') while inspecting any pipeline step.",
      controls: "The operation details card in the Explanation Panel.",
      processing: "Maps the active operator to its operational notes and big-O computational upper bound.",
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
      title: "Exporting the Dataset",
      whatItDoes: "Exports the active relational database schema and data as standard SQL files or CSV tables.",
      whatToDo: "In the right-hand Explanation Panel, find the 'Export Dataset' section at the bottom.",
      controls: "'Export SQL Script (.sql)' button and individual table CSV buttons or 'Export All' button.",
      processing: "Generates a downloadable file containing CREATE TABLE / INSERT INTO statements or RFC 4180 compliant CSV tables.",
      expectedOutput: "A file download prompt saving `<dataset>_schema.sql` or `<table_name>.csv` to your computer.",
    },
    {
      id: 17,
      title: "Using the Report Button",
      whatItDoes: "Generates an execution report summarizing the query, error logs, full pipeline step breakdown, and final result table.",
      whatToDo: "After running any query, locate the 'Report' button above the Final Result table and click it.",
      controls: "The 'Report' button next to the 'CSV' button above the Final Result grid.",
      processing: "Compiles a formatted Markdown document (`report.md`) detailing query metadata, step-by-step pipeline stages, row counts, and output tables.",
      expectedOutput: "A downloaded `report.md` file suitable for project submissions, debugging, and academic documentation.",
    },
    {
      id: 18,
      title: "Switching Day/Night Mode",
      whatItDoes: "Changes the color palette and dark/light mode of the application.",
      whatToDo: "Click the 'Theme' button in the top-right corner of the top navigation bar and select a theme.",
      controls: "The 'Theme' dropdown menu in the header (Eclipse, Lazuli, Pearl, Slate, Volt).",
      processing: "Updates CSS custom variables (`data-theme` attribute on the root element) and persists your preference in `localStorage`.",
      expectedOutput: "The interface updates its appearance immediately, with 'Pearl' providing light mode and 'Eclipse' providing the dark/purple demo style.",
    },
    {
      id: 19,
      title: "Handling Errors",
      whatItDoes: "Identifies and highlights syntax mistakes, non-existent table/column names, or constraint violations.",
      whatToDo: "If a query fails, read the red error alert box displayed under the SQL editor and in the Explanation Panel.",
      controls: "Red error banners in the Input Panel and Explanation Panel.",
      processing: "The engine catches the exception, halts execution safely, leaves database buffers untainted, and explains which identifier was invalid.",
      expectedOutput: "Clear actionable guidance telling you whether a column was not found, a table name was misspelled, or SQL grammar was malformed.",
    },
  ];

  return (
    <main
      className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 overflow-y-auto overflow-x-hidden w-full max-w-none leading-relaxed"
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
            Complete operating manual for the NL→SQL Visualizer workspace, controls, and features.
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToWorkspace}
          className="px-4 py-2.5 rounded-lg text-sm md:text-base font-semibold border transition-all cursor-pointer shadow-xs hover:opacity-90 flex items-center gap-2"
          style={{
            background: "var(--surface-subtle)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
        >
          <svg
            className="w-4 h-4 opacity-80"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span>Back to Workspace</span>
        </button>
      </div>

      {/* QUICK START SECTION */}
      <section
        className="panel p-6 rounded-xl border space-y-4 mb-10 shadow-sm"
        style={{
          background: "var(--panel)",
          borderColor: "var(--accent)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold px-3 py-1 rounded bg-[var(--accent)] text-[var(--accent-foreground)] uppercase tracking-wider">
            Quick Start
          </span>
          <h2 className="text-lg md:text-xl font-bold" style={{ color: "var(--foreground)" }}>
            7-Step Getting Started Walkthrough
          </h2>
        </div>
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
                <span className="text-sm font-mono font-bold px-2.5 py-0.5 rounded bg-[var(--panel)] text-[var(--accent)] border border-[var(--border)]">
                  {item.step}
                </span>
                <h3 className="text-sm md:text-base font-bold" style={{ color: "var(--foreground)" }}>
                  {item.title}
                </h3>
              </div>
              <p className="text-sm opacity-85 leading-relaxed pl-1">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* DETAILED USER MANUAL SECTIONS 1 - 19 */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg md:text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
            Detailed Feature Manual (Sections 1 — 19)
          </h2>
          <p className="text-sm md:text-base opacity-80 mt-1" style={{ color: "var(--muted)" }}>
            Detailed operation rules, input requirements, button names, processing lifecycles, and expected outputs.
          </p>
        </div>

        {manualSections.map((sec) => (
          <section
            key={sec.id}
            className="panel p-6 rounded-xl border space-y-4"
            style={{
              background: "var(--panel)",
              borderColor: "var(--border)",
            }}
          >
            <h3
              className="text-base md:text-lg font-bold text-[var(--foreground)] border-b pb-2.5 flex items-center gap-2"
              style={{ borderColor: "var(--border)" }}
            >
              <span className="text-sm font-mono px-2.5 py-1 rounded bg-[var(--surface-subtle)] text-[var(--accent)] border border-[var(--border)]">
                {sec.id}
              </span>
              <span>{sec.title}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm md:text-base pt-1">
              <div className="p-4 rounded-lg border bg-[var(--surface-subtle)] space-y-1.5" style={{ borderColor: "var(--border)" }}>
                <span className="font-semibold text-sm text-[var(--accent)] uppercase tracking-wider block">
                  What it does:
                </span>
                <p className="opacity-90 leading-relaxed">{sec.whatItDoes}</p>
              </div>

              <div className="p-4 rounded-lg border bg-[var(--surface-subtle)] space-y-1.5" style={{ borderColor: "var(--border)" }}>
                <span className="font-semibold text-sm text-[var(--accent)] uppercase tracking-wider block">
                  What the user needs to enter/do:
                </span>
                <p className="opacity-90 leading-relaxed">{sec.whatToDo}</p>
              </div>

              <div className="p-4 rounded-lg border bg-[var(--surface-subtle)] space-y-1.5" style={{ borderColor: "var(--border)" }}>
                <span className="font-semibold text-sm text-[var(--accent)] uppercase tracking-wider block">
                  Which button / control to use:
                </span>
                <p className="opacity-90 leading-relaxed">{sec.controls}</p>
              </div>

              <div className="p-4 rounded-lg border bg-[var(--surface-subtle)] space-y-1.5" style={{ borderColor: "var(--border)" }}>
                <span className="font-semibold text-sm text-[var(--accent)] uppercase tracking-wider block">
                  What happens during processing:
                </span>
                <p className="opacity-90 leading-relaxed">{sec.processing}</p>
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-[var(--surface-subtle)] text-sm md:text-base space-y-1.5" style={{ borderColor: "var(--border)" }}>
              <span className="font-semibold text-sm text-emerald-400 uppercase tracking-wider block">
                What output the user should expect:
              </span>
              <p className="opacity-90 leading-relaxed">{sec.expectedOutput}</p>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
