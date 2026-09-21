"use client";

import React, { useState } from "react";

interface LearnViewProps {
  onBackToWorkspace?: () => void;
}

// Subcard component inside each command section matching Help card design
function LearnSubcard({
  title,
  content,
  isCode = false,
  highlight = false,
  defaultOpen = true,
}: {
  title: string;
  content: string;
  isCode?: boolean;
  highlight?: boolean;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className="rounded-xl border transition-all overflow-hidden shadow-2xs"
      style={{
        borderColor: isOpen ? (highlight ? "rgba(16, 185, 129, 0.5)" : "var(--accent)") : "var(--border)",
        background: "var(--surface-subtle)",
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full p-3.5 flex items-center justify-between text-left cursor-pointer transition-colors hover:opacity-95 focus:outline-none"
        style={{
          background: isOpen
            ? highlight
              ? "rgba(16, 185, 129, 0.08)"
              : "rgba(var(--accent-rgb, 255, 106, 61), 0.08)"
            : "transparent",
        }}
      >
        <span
          className={`font-semibold text-xs md:text-sm uppercase tracking-wider ${
            highlight ? "text-emerald-500 font-bold" : "text-[var(--accent)]"
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
        <div
          className="p-4 border-t text-sm md:text-base leading-relaxed"
          style={{
            borderColor: "var(--border)",
            background: "var(--panel)",
            color: "var(--foreground)",
          }}
        >
          {isCode ? (
            <pre className="font-mono text-xs md:text-sm p-3 rounded-lg overflow-x-auto bg-black/85 border border-[var(--border)] text-orange-400">
              <code>{content}</code>
            </pre>
          ) : (
            <p>{content}</p>
          )}
        </div>
      )}
    </div>
  );
}

// Main collapsible card component matching Help card design
interface LearnCardProps {
  id: string;
  num: string;
  category: string;
  title: string;
  preview: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function LearnCard({
  id,
  num,
  category,
  title,
  preview,
  isOpen,
  onToggle,
  children,
}: LearnCardProps) {
  return (
    <section
      id={id}
      className="panel rounded-xl border transition-all duration-200 overflow-hidden shadow-xs"
      style={{
        background: "var(--panel)",
        borderColor: isOpen ? "var(--accent)" : "var(--border)",
      }}
    >
      {/* Header Button: Clicking toggles collapse/expand tab */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full p-4 md:p-5 flex items-center justify-between text-left cursor-pointer transition-colors hover:bg-[var(--surface-subtle)] focus:outline-none"
      >
        <div className="flex items-start md:items-center gap-3 md:gap-4 pr-3 min-w-0">
          <span
            className="text-xs md:text-sm font-mono font-bold px-2.5 py-1 rounded shrink-0 border"
            style={{
              background: isOpen ? "var(--accent)" : "var(--surface-subtle)",
              color: isOpen ? "var(--accent-foreground)" : "var(--accent)",
              borderColor: "var(--border)",
            }}
          >
            {num}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className="text-[10px] md:text-[11px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider shrink-0"
                style={{
                  background: "var(--surface-subtle)",
                  color: "var(--accent)",
                  borderColor: "var(--border)",
                }}
              >
                {category}
              </span>
            </div>
            <h2
              className="text-base md:text-lg font-bold tracking-tight truncate"
              style={{ color: "var(--foreground)" }}
            >
              {title}
            </h2>
            {!isOpen && (
              <p
                className="text-xs md:text-sm opacity-70 truncate mt-0.5"
                style={{ color: "var(--muted)" }}
              >
                {preview}
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
          {children}
        </div>
      )}
    </section>
  );
}

export function LearnView({ onBackToWorkspace }: LearnViewProps) {
  // Initially expand the first 2 cards
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({
    "sec-01": true,
    "sec-02": true,
  });
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const toggleCard = (id: string) => {
    setOpenCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    for (let i = 1; i <= 30; i++) {
      const id = `sec-${String(i).padStart(2, "0")}`;
      all[id] = true;
    }
    setOpenCards(all);
  };

  const collapseAll = () => {
    setOpenCards({});
  };

  return (
    <main
      className="flex-1 min-h-0 flex flex-col p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 overflow-y-auto overflow-x-hidden w-full max-w-none leading-relaxed"
      style={{ color: "var(--foreground)" }}
      aria-label="Learn section: Complete SQL Commands & Relational Database Curriculum"
    >
      {/* Top Header / Breadcrumb */}
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
              SQL Curriculum &amp; Command Guide
            </span>
            <span
              className="text-sm opacity-70"
              style={{ color: "var(--muted)" }}
            >
              Complete SQL Commands, Sublanguages &amp; Engine Internals
            </span>
          </div>
          <h1
            className="text-2xl md:text-4xl font-bold tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            SQL Commands &amp; Relational Engine Curriculum
          </h1>
          <p
            className="text-sm md:text-base opacity-80 mt-1.5"
            style={{ color: "var(--muted)" }}
          >
            Comprehensive reference manual covering all SQL commands (DQL, DML, DDL, TCL, DCL), operational syntax, execution behaviors, and relational theory. Click any card to expand or collapse.
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

      {/* Module Filter & Search Toolbar */}
      <div
        className="p-3.5 rounded-xl border mb-6 flex flex-wrap items-center justify-between gap-3 shadow-2xs"
        style={{
          background: "var(--panel)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedModule("all")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
            style={{
              background: selectedModule === "all" ? "var(--accent)" : "var(--surface-subtle)",
              color: selectedModule === "all" ? "var(--accent-foreground)" : "var(--foreground)",
              borderColor: "var(--border)",
            }}
          >
            All Commands (30)
          </button>
          <button
            type="button"
            onClick={() => setSelectedModule("dql")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
            style={{
              background: selectedModule === "dql" ? "var(--accent)" : "var(--surface-subtle)",
              color: selectedModule === "dql" ? "var(--accent-foreground)" : "var(--foreground)",
              borderColor: "var(--border)",
            }}
          >
            DQL Queries (13)
          </button>
          <button
            type="button"
            onClick={() => setSelectedModule("dml")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
            style={{
              background: selectedModule === "dml" ? "var(--accent)" : "var(--surface-subtle)",
              color: selectedModule === "dml" ? "var(--accent-foreground)" : "var(--foreground)",
              borderColor: "var(--border)",
            }}
          >
            DML Mutations (4)
          </button>
          <button
            type="button"
            onClick={() => setSelectedModule("ddl")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
            style={{
              background: selectedModule === "ddl" ? "var(--accent)" : "var(--surface-subtle)",
              color: selectedModule === "ddl" ? "var(--accent-foreground)" : "var(--foreground)",
              borderColor: "var(--border)",
            }}
          >
            DDL Schema (6)
          </button>
          <button
            type="button"
            onClick={() => setSelectedModule("tcl")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
            style={{
              background: selectedModule === "tcl" ? "var(--accent)" : "var(--surface-subtle)",
              color: selectedModule === "tcl" ? "var(--accent-foreground)" : "var(--foreground)",
              borderColor: "var(--border)",
            }}
          >
            TCL Transactions (1)
          </button>
          <button
            type="button"
            onClick={() => setSelectedModule("dcl")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
            style={{
              background: selectedModule === "dcl" ? "var(--accent)" : "var(--surface-subtle)",
              color: selectedModule === "dcl" ? "var(--accent-foreground)" : "var(--foreground)",
              borderColor: "var(--border)",
            }}
          >
            DCL Security (1)
          </button>
          <button
            type="button"
            onClick={() => setSelectedModule("theory")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
            style={{
              background: selectedModule === "theory" ? "var(--accent)" : "var(--surface-subtle)",
              color: selectedModule === "theory" ? "var(--accent-foreground)" : "var(--foreground)",
              borderColor: "var(--border)",
            }}
          >
            Relational Theory (3)
          </button>
          <button
            type="button"
            onClick={() => setSelectedModule("nlp")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
            style={{
              background: selectedModule === "nlp" ? "var(--accent)" : "var(--surface-subtle)",
              color: selectedModule === "nlp" ? "var(--accent-foreground)" : "var(--foreground)",
              borderColor: "var(--border)",
            }}
          >
            NL→SQL (1)
          </button>
          <button
            type="button"
            onClick={() => setSelectedModule("references")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
            style={{
              background: selectedModule === "references" ? "var(--accent)" : "var(--surface-subtle)",
              color: selectedModule === "references" ? "var(--accent-foreground)" : "var(--foreground)",
              borderColor: "var(--border)",
            }}
          >
            Media &amp; References (1)
          </button>
        </div>

        {/* Search input */}
        <div className="relative flex-1 sm:max-w-xs min-w-[200px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search commands (e.g. JOIN, WHERE, INDEX)..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs border bg-[var(--surface-subtle)] focus:outline-none focus:border-[var(--accent)]"
            style={{
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          />
          <svg
            className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 opacity-60"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Main Educational Cards Container */}
      <div className="space-y-4">

        {/* Card 01: SELECT — Column Projection & Arithmetic Expressions */}
        {(selectedModule === "all" || selectedModule === "dql") &&
          ("select — column projection & arithmetic expressions".includes(searchQuery.toLowerCase()) ||
            "dql querying".includes(searchQuery.toLowerCase()) ||
            searchQuery === "") && (
            <LearnCard
              id="sec-01"
              num="01"
              category="DQL Querying"
              title="SELECT — Column Projection & Arithmetic Expressions"
              preview="Extracts specific relation attributes, computes scalar arithmetic/string expressions, and aliases column names."
              isOpen={!!openCards["sec-01"]}
              onToggle={() => toggleCard("sec-01")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LearnSubcard title="Command Syntax &amp; Clauses:" content={"SELECT [DISTINCT] column1, column2, expression AS alias_name FROM table_name;"} isCode={true} />
                <LearnSubcard title="What it does &amp; Functionality:" content={"Projects designated column attributes from base relations or intermediate working tables. Computes scalar mathematical expressions, string concatenations, and assigns output column aliases using the AS keyword."} />
                <LearnSubcard title="Code Example &amp; Practical Query:" content={"-- Project explicit columns and compute calculated discount\nSELECT \n  customer_id, \n  name, \n  balance, \n  balance * 0.95 AS discounted_balance,\n  city || ', India' AS full_location\nFROM customers;"} isCode={true} />
                <LearnSubcard title="What happens during processing (Engine Behavior):" content={"The query compiler converts column identifiers into tuple attribute offsets. The physical projection operator (π) reads candidate rows from the buffer pool and outputs only the requested columns into memory stream buffers."} />
              </div>
              <LearnSubcard title="Performance, Indexing &amp; Complexity Tips:" content={"Avoid using 'SELECT *' in production queries. Explicit attribute lists reduce I/O bus bandwidth, minimize memory footprints, and enable the query optimizer to utilize lightweight Covering Index Scans."} highlight={true} />
            </LearnCard>
          )}

        {/* Card 02: WHERE — Filtering Predicates & Boolean Logic */}
        {(selectedModule === "all" || selectedModule === "dql") &&
          ("where — filtering predicates & boolean logic".includes(searchQuery.toLowerCase()) ||
            "dql filtering".includes(searchQuery.toLowerCase()) ||
            searchQuery === "") && (
            <LearnCard
              id="sec-02"
              num="02"
              category="DQL Filtering"
              title="WHERE — Filtering Predicates & Boolean Logic"
              preview="Filters rows satisfying boolean conditions using comparison, logical operators, LIKE pattern matching, and NULL checks."
              isOpen={!!openCards["sec-02"]}
              onToggle={() => toggleCard("sec-02")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LearnSubcard title="Command Syntax &amp; Clauses:" content={"SELECT columns FROM table_name WHERE condition1 [AND | OR | NOT] condition2;"} isCode={true} />
                <LearnSubcard title="What it does &amp; Functionality:" content={"Applies filtering predicates to candidate rows before grouping or aggregation takes place. Discards any row where the boolean condition evaluates to FALSE or UNKNOWN (three-valued logic)."} />
                <LearnSubcard title="Code Example &amp; Practical Query:" content={"-- Filter customers with compound predicate logic\nSELECT name, city, balance \nFROM customers \nWHERE (city = 'Mumbai' OR city = 'Delhi') \n  AND balance >= 5000 \n  AND status IS NOT NULL;"} isCode={true} />
                <LearnSubcard title="What happens during processing (Engine Behavior):" content={"The selection operator (σ) iterates through tuples. For each row, it evaluates the predicate tree. If true, the tuple pointer advances to the next execution stage; if false, it is immediately discarded."} />
              </div>
              <LearnSubcard title="Performance, Indexing &amp; Complexity Tips:" content={"Ensure WHERE predicates are 'sargable' (Search-Argument-Able). For example, write 'WHERE created_at >= '2026-01-01'' instead of 'WHERE YEAR(created_at) = 2026' to allow B-Tree index range seeks (O(log N))."} highlight={true} />
            </LearnCard>
          )}

        {/* Card 03: DISTINCT — Eliminating Duplicate Tuples */}
        {(selectedModule === "all" || selectedModule === "dql") &&
          ("distinct — eliminating duplicate tuples".includes(searchQuery.toLowerCase()) ||
            "dql set semantics".includes(searchQuery.toLowerCase()) ||
            searchQuery === "") && (
            <LearnCard
              id="sec-03"
              num="03"
              category="DQL Set Semantics"
              title="DISTINCT — Eliminating Duplicate Tuples"
              preview="Enforces mathematical set semantics by stripping duplicate tuples from multiset execution streams."
              isOpen={!!openCards["sec-03"]}
              onToggle={() => toggleCard("sec-03")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LearnSubcard title="Command Syntax &amp; Clauses:" content={"SELECT DISTINCT column1, column2 FROM table_name WHERE condition;"} isCode={true} />
                <LearnSubcard title="What it does &amp; Functionality:" content={"Eliminates duplicate rows from the query output. Where standard SQL operates on multisets (bags allowing duplicates), DISTINCT enforces pure relational set semantics so each unique combination of values appears only once."} />
                <LearnSubcard title="Code Example &amp; Practical Query:" content={"-- Find all unique cities where active customers reside\nSELECT DISTINCT city \nFROM customers \nWHERE status = 'active'\nORDER BY city;"} isCode={true} />
                <LearnSubcard title="What happens during processing (Engine Behavior):" content={"The engine inserts projected tuple values into an in-memory hash table or applies a sort-based deduplication operator (δ). Rows with matching hash keys or identical sorted values are discarded."} />
              </div>
              <LearnSubcard title="Performance, Indexing &amp; Complexity Tips:" content={"DISTINCT introduces computational overhead because all candidate rows must be buffered to detect duplicates. If the primary key is already projected, DISTINCT is redundant and should be omitted."} highlight={true} />
            </LearnCard>
          )}

        {/* Card 04: ORDER BY — Result Sorting & Null Ordering */}
        {(selectedModule === "all" || selectedModule === "dql") &&
          ("order by — result sorting & null ordering".includes(searchQuery.toLowerCase()) ||
            "dql sorting".includes(searchQuery.toLowerCase()) ||
            searchQuery === "") && (
            <LearnCard
              id="sec-04"
              num="04"
              category="DQL Sorting"
              title="ORDER BY — Result Sorting & Null Ordering"
              preview="Sorts query output by designated attributes in ascending or descending order, with custom NULL placement."
              isOpen={!!openCards["sec-04"]}
              onToggle={() => toggleCard("sec-04")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LearnSubcard title="Command Syntax &amp; Clauses:" content={"SELECT columns FROM table_name ORDER BY column1 [ASC | DESC] [NULLS FIRST | NULLS LAST], column2 ...;"} isCode={true} />
                <LearnSubcard title="What it does &amp; Functionality:" content={"Sorts output rows in ascending (ASC) or descending (DESC) order based on one or more sort keys. Allows specifying NULL placement via NULLS FIRST or NULLS LAST."} />
                <LearnSubcard title="Code Example &amp; Practical Query:" content={"-- Sort orders by total amount descending, then by order date ascending\nSELECT order_id, customer_id, total, order_date \nFROM orders \nORDER BY total DESC, order_date ASC;"} isCode={true} />
                <LearnSubcard title="What happens during processing (Engine Behavior):" content={"The sorting operator (τ) collects all projected tuples into memory. For small working sets, it runs in-memory Quicksort (O(N log N)). For datasets exceeding memory work buffers, it spills sorted runs to disk and executes External Merge Sort."} />
              </div>
              <LearnSubcard title="Performance, Indexing &amp; Complexity Tips:" content={"If an index exists matching the ORDER BY columns (e.g. INDEX ON orders(total DESC)), the engine walks the B-Tree leaves directly, satisfying the sort order in O(N) streaming time with zero sorting CPU cost."} highlight={true} />
            </LearnCard>
          )}

        {/* Card 05: LIMIT & OFFSET — Result Pagination & Top-N Execution */}
        {(selectedModule === "all" || selectedModule === "dql") &&
          ("limit & offset — result pagination & top-n execution".includes(searchQuery.toLowerCase()) ||
            "dql pagination".includes(searchQuery.toLowerCase()) ||
            searchQuery === "") && (
            <LearnCard
              id="sec-05"
              num="05"
              category="DQL Pagination"
              title="LIMIT & OFFSET — Result Pagination & Top-N Execution"
              preview="Restricts output row counts and skips records for paginated browsing and high-speed Top-N queries."
              isOpen={!!openCards["sec-05"]}
              onToggle={() => toggleCard("sec-05")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LearnSubcard title="Command Syntax &amp; Clauses:" content={"SELECT columns FROM table_name ORDER BY sort_column LIMIT count [OFFSET offset_num];"} isCode={true} />
                <LearnSubcard title="What it does &amp; Functionality:" content={"Restricts the total number of tuples returned to the client (LIMIT) and optionally skips an initial offset of rows (OFFSET). Enables UI pagination and Top-N ranking."} />
                <LearnSubcard title="Code Example &amp; Practical Query:" content={"-- Retrieve page 3 of highest-spending customers (10 per page)\nSELECT customer_id, name, total_spent \nFROM customers \nORDER BY total_spent DESC \nLIMIT 10 OFFSET 20;"} isCode={true} />
                <LearnSubcard title="What happens during processing (Engine Behavior):" content={"When combined with ORDER BY, the engine utilizes a bounded min-heap of size K (Top-N heap sort). It scans rows without sorting the entire table, terminating immediately once K rows are captured."} />
              </div>
              <LearnSubcard title="Performance, Indexing &amp; Complexity Tips:" content={"High OFFSET values (e.g. OFFSET 100000) force the engine to read and discard 100,000 rows. Use 'keyset pagination' (WHERE id > last_seen_id LIMIT 10) for constant O(1) page access speeds."} highlight={true} />
            </LearnCard>
          )}

        {/* Card 06: Aggregate Functions — COUNT, SUM, AVG, MIN & MAX */}
        {(selectedModule === "all" || selectedModule === "dql") &&
          ("aggregate functions — count, sum, avg, min & max".includes(searchQuery.toLowerCase()) ||
            "dql aggregations".includes(searchQuery.toLowerCase()) ||
            searchQuery === "") && (
            <LearnCard
              id="sec-06"
              num="06"
              category="DQL Aggregations"
              title="Aggregate Functions — COUNT, SUM, AVG, MIN & MAX"
              preview="Collapses multiple rows into scalar summary values, handling NULLs and distinct attribute subsets."
              isOpen={!!openCards["sec-06"]}
              onToggle={() => toggleCard("sec-06")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LearnSubcard title="Command Syntax &amp; Clauses:" content={"SELECT COUNT(*), SUM(col), AVG(col), MIN(col), MAX(col) FROM table_name;"} isCode={true} />
                <LearnSubcard title="What it does &amp; Functionality:" content={"Performs mathematical summarization over a collection of values across tuples, returning a single scalar summary value. Supported functions include COUNT(*), COUNT(col), SUM(col), AVG(col), MIN(col), MAX(col), and GROUP_CONCAT(col)."} />
                <LearnSubcard title="Code Example &amp; Practical Query:" content={"-- Summarize store sales performance\nSELECT \n  COUNT(*) AS total_orders,\n  COUNT(DISTINCT customer_id) AS unique_buyers,\n  SUM(total) AS gross_revenue,\n  ROUND(AVG(total), 2) AS average_order_value,\n  MIN(total) AS smallest_sale,\n  MAX(total) AS largest_sale\nFROM orders;"} isCode={true} />
                <LearnSubcard title="What happens during processing (Engine Behavior):" content={"The engine maintains accumulator registers in memory (sum, count, min, max) and iterates through the input stream in a single streaming pass (O(N)). NULL values are skipped in SUM, AVG, and MIN/MAX."} />
              </div>
              <LearnSubcard title="Performance, Indexing &amp; Complexity Tips:" content={"MIN(col) and MAX(col) on an indexed column can execute in instantaneous O(log N) time by simply inspecting the leftmost or rightmost leaf node in the B-Tree index."} highlight={true} />
            </LearnCard>
          )}

        {/* Card 07: GROUP BY & HAVING — Bucket Aggregation & Group Filtering */}
        {(selectedModule === "all" || selectedModule === "dql") &&
          ("group by & having — bucket aggregation & group filtering".includes(searchQuery.toLowerCase()) ||
            "dql grouping".includes(searchQuery.toLowerCase()) ||
            searchQuery === "") && (
            <LearnCard
              id="sec-07"
              num="07"
              category="DQL Grouping"
              title="GROUP BY & HAVING — Bucket Aggregation & Group Filtering"
              preview="Partitions relation tuples into grouping buckets and filters aggregated summaries via HAVING."
              isOpen={!!openCards["sec-07"]}
              onToggle={() => toggleCard("sec-07")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LearnSubcard title="Command Syntax &amp; Clauses:" content={"SELECT group_col, AGG(col) FROM table_name [WHERE filter] GROUP BY group_col HAVING aggregate_condition;"} isCode={true} />
                <LearnSubcard title="What it does &amp; Functionality:" content={"Partitions rows into distinct buckets based on matching values in grouping attributes. Evaluates aggregate functions per bucket. HAVING filters these groups after aggregation has completed."} />
                <LearnSubcard title="Code Example &amp; Practical Query:" content={"-- Find cities with more than 2 high-value customers\nSELECT city, COUNT(*) AS customer_count, AVG(balance) AS avg_balance\nFROM customers\nWHERE status = 'active'             -- WHERE filters rows BEFORE grouping\nGROUP BY city\nHAVING COUNT(*) >= 2;               -- HAVING filters groups AFTER aggregation"} isCode={true} />
                <LearnSubcard title="What happens during processing (Engine Behavior):" content={"Hash Aggregation computes hash values for the GROUP BY keys and routes tuples to hash table buckets (γ operator). Accumulator registers update per bucket. Finally, the HAVING expression evaluates on each bucket."} />
              </div>
              <LearnSubcard title="Performance, Indexing &amp; Complexity Tips:" content={"Always use WHERE to filter out unneeded rows before grouping rather than relying on HAVING. Reducing row counts early saves substantial hashing memory and aggregation CPU time."} highlight={true} />
            </LearnCard>
          )}

        {/* Card 08: JOIN Operations — INNER, LEFT, RIGHT & FULL OUTER */}
        {(selectedModule === "all" || selectedModule === "dql") &&
          ("join operations — inner, left, right & full outer".includes(searchQuery.toLowerCase()) ||
            "dql relational joins".includes(searchQuery.toLowerCase()) ||
            searchQuery === "") && (
            <LearnCard
              id="sec-08"
              num="08"
              category="DQL Relational Joins"
              title="JOIN Operations — INNER, LEFT, RIGHT & FULL OUTER"
              preview="Combines attributes from multiple relations using join predicates, with optional NULL padding."
              isOpen={!!openCards["sec-08"]}
              onToggle={() => toggleCard("sec-08")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LearnSubcard title="Command Syntax &amp; Clauses:" content={"SELECT columns FROM table1 [INNER | LEFT | RIGHT | FULL] JOIN table2 ON table1.fk = table2.pk;"} isCode={true} />
                <LearnSubcard title="What it does &amp; Functionality:" content={"Combines attributes from two or more relations based on a logical matching predicate (ON or USING). INNER JOIN returns rows with matching keys in both tables. LEFT JOIN returns all left rows, filling missing right attributes with NULL."} />
                <LearnSubcard title="Code Example &amp; Practical Query:" content={"-- List all customers and their orders (including customers with zero orders)\nSELECT \n  c.id AS customer_id,\n  c.name,\n  c.city,\n  o.order_id,\n  COALESCE(o.total, 0.0) AS order_total\nFROM customers c\nLEFT JOIN orders o ON c.id = o.customer_id\nORDER BY c.id, o.order_id;"} isCode={true} />
                <LearnSubcard title="What happens during processing (Engine Behavior):" content={"The query planner chooses between Nested-Loop Join (O(N · M)), Hash Join (builds hash table on smaller relation, O(N + M)), or Sort-Merge Join (sorts both relations and merges, O(N log N + M log M))."} />
              </div>
              <LearnSubcard title="Performance, Indexing &amp; Complexity Tips:" content={"Always create B-Tree indexes on foreign key columns used in ON clauses. For unindexed joins, Hash Join or Block-Nested Loop is required, which dramatically increases memory buffer usage."} highlight={true} />
            </LearnCard>
          )}

        {/* Card 09: CROSS JOIN & Self-Joins — Combinatorics & Hierarchies */}
        {(selectedModule === "all" || selectedModule === "dql") &&
          ("cross join & self-joins — combinatorics & hierarchies".includes(searchQuery.toLowerCase()) ||
            "dql advanced joins".includes(searchQuery.toLowerCase()) ||
            searchQuery === "") && (
            <LearnCard
              id="sec-09"
              num="09"
              category="DQL Advanced Joins"
              title="CROSS JOIN & Self-Joins — Combinatorics & Hierarchies"
              preview="Produces Cartesian products for pairings and joins tables to themselves for hierarchical trees."
              isOpen={!!openCards["sec-09"]}
              onToggle={() => toggleCard("sec-09")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LearnSubcard title="Command Syntax &amp; Clauses:" content={"SELECT * FROM table1 CROSS JOIN table2;\nSELECT e.name, m.name AS manager FROM employees e LEFT JOIN employees m ON e.manager_id = m.id;"} isCode={true} />
                <LearnSubcard title="What it does &amp; Functionality:" content={"CROSS JOIN pairs every tuple of relation R with every tuple of relation S, producing |R| × |S| tuples. Self-Join joins a relation to another instance of itself using distinct table aliases to model hierarchies (e.g. employee-manager)."} />
                <LearnSubcard title="Code Example &amp; Practical Query:" content={"-- Self-join: Find employees and their respective managers\nSELECT \n  e.name AS employee_name,\n  e.department,\n  COALESCE(m.name, 'Top Executive') AS manager_name\nFROM employees e\nLEFT JOIN employees m ON e.manager_id = m.id;"} isCode={true} />
                <LearnSubcard title="What happens during processing (Engine Behavior):" content={"Cartesian product evaluates R × S by streaming the outer table and scanning the entire inner table for each outer row. Self-joins allocate two separate cursor iterators on the same underlying table file."} />
              </div>
              <LearnSubcard title="Performance, Indexing &amp; Complexity Tips:" content={"Accidental CROSS JOINs can generate massive result sets (e.g. 10,000 × 10,000 = 100,000,000 rows). Always verify that join predicates (ON clauses) are explicitly specified."} highlight={true} />
            </LearnCard>
          )}

        {/* Card 10: Set Operations — UNION, UNION ALL, INTERSECT & EXCEPT */}
        {(selectedModule === "all" || selectedModule === "dql") &&
          ("set operations — union, union all, intersect & except".includes(searchQuery.toLowerCase()) ||
            "dql set operations".includes(searchQuery.toLowerCase()) ||
            searchQuery === "") && (
            <LearnCard
              id="sec-10"
              num="10"
              category="DQL Set Operations"
              title="Set Operations — UNION, UNION ALL, INTERSECT & EXCEPT"
              preview="Combines multiple query result sets using union, intersection, and set difference operators."
              isOpen={!!openCards["sec-10"]}
              onToggle={() => toggleCard("sec-10")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LearnSubcard title="Command Syntax &amp; Clauses:" content={"query1 UNION [ALL] query2;\nquery1 INTERSECT query2;\nquery1 EXCEPT query2;"} isCode={true} />
                <LearnSubcard title="What it does &amp; Functionality:" content={"Combines output tuples of two or more queries possessing identical column counts and compatible data types. UNION merges with deduplication, UNION ALL appends directly without deduplication, INTERSECT returns shared tuples, and EXCEPT returns difference tuples."} />
                <LearnSubcard title="Code Example &amp; Practical Query:" content={"-- Combine distinct contacts from multiple communication channels\nSELECT email, 'Customer' AS source FROM customers WHERE email IS NOT NULL\nUNION ALL\nSELECT email, 'Lead' AS source FROM newsletter_subscribers WHERE email IS NOT NULL;"} isCode={true} />
                <LearnSubcard title="What happens during processing (Engine Behavior):" content={"UNION ALL streams rows directly from both queries without buffering (O(N + M)). UNION, INTERSECT, and EXCEPT construct an in-memory hash set or perform sorting to identify duplicate or intersecting tuples."} />
              </div>
              <LearnSubcard title="Performance, Indexing &amp; Complexity Tips:" content={"Always default to UNION ALL whenever duplicate rows are impossible or acceptable. Avoiding deduplication eliminates sorting and hashing, saving up to 80% execution time on large datasets."} highlight={true} />
            </LearnCard>
          )}

        {/* Card 11: Subqueries & Common Table Expressions (WITH CTEs) */}
        {(selectedModule === "all" || selectedModule === "dql") &&
          ("subqueries & common table expressions (with ctes)".includes(searchQuery.toLowerCase()) ||
            "dql modular queries".includes(searchQuery.toLowerCase()) ||
            searchQuery === "") && (
            <LearnCard
              id="sec-11"
              num="11"
              category="DQL Modular Queries"
              title="Subqueries & Common Table Expressions (WITH CTEs)"
              preview="Modular query composition using scalar subqueries, IN/EXISTS predicates, and readable WITH CTEs."
              isOpen={!!openCards["sec-11"]}
              onToggle={() => toggleCard("sec-11")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LearnSubcard title="Command Syntax &amp; Clauses:" content={"WITH cte_name AS (SELECT ...) SELECT ... FROM cte_name WHERE col IN (SELECT ...);"} isCode={true} />
                <LearnSubcard title="What it does &amp; Functionality:" content={"Nests queries inside outer statements or defines temporary named result sets using the WITH keyword (Common Table Expressions). Supports scalar subqueries, correlated subqueries, and recursive CTEs."} />
                <LearnSubcard title="Code Example &amp; Practical Query:" content={"-- Identify customers who spent more than the average order total\nWITH CustomerAverages AS (\n  SELECT customer_id, AVG(total) AS customer_avg\n  FROM orders\n  GROUP BY customer_id\n)\nSELECT c.name, ca.customer_avg\nFROM customers c\nJOIN CustomerAverages ca ON c.id = ca.customer_id\nWHERE ca.customer_avg > (SELECT AVG(total) FROM orders);"} isCode={true} />
                <LearnSubcard title="What happens during processing (Engine Behavior):" content={"The query optimizer may inline CTEs as subqueries or materialize them as temporary in-memory tables. Correlated subqueries execute once per outer tuple unless transformed into joins by query rewrites."} />
              </div>
              <LearnSubcard title="Performance, Indexing &amp; Complexity Tips:" content={"Correlated subqueries (e.g. WHERE col IN (SELECT ... WHERE outer.id = inner.id)) can degrade to O(N · M). Rewrite them as JOINs or window functions to achieve O(N + M) execution."} highlight={true} />
            </LearnCard>
          )}

        {/* Card 12: Conditional Logic — CASE, COALESCE & NULLIF */}
        {(selectedModule === "all" || selectedModule === "dql") &&
          ("conditional logic — case, coalesce & nullif".includes(searchQuery.toLowerCase()) ||
            "dql expressions".includes(searchQuery.toLowerCase()) ||
            searchQuery === "") && (
            <LearnCard
              id="sec-12"
              num="12"
              category="DQL Expressions"
              title="Conditional Logic — CASE, COALESCE & NULLIF"
              preview="Inline branching evaluation and NULL safety handling in declarative relational queries."
              isOpen={!!openCards["sec-12"]}
              onToggle={() => toggleCard("sec-12")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LearnSubcard title="Command Syntax &amp; Clauses:" content={"CASE WHEN condition THEN result [WHEN ... THEN ...] ELSE default END;\nCOALESCE(val1, val2, ...);"} isCode={true} />
                <LearnSubcard title="What it does &amp; Functionality:" content={"Provides procedural IF-THEN-ELSE branching logic directly within SQL expressions (CASE). Handles missing or NULL values gracefully using COALESCE (returns first non-null argument) and NULLIF (returns NULL if arguments match)."} />
                <LearnSubcard title="Code Example &amp; Practical Query:" content={"-- Categorize customer loyalty tiers and protect against NULL shipping addresses\nSELECT \n  id, \n  name,\n  COALESCE(shipping_address, billing_address, 'Pick Up In Store') AS resolved_address,\n  CASE \n    WHEN balance > 10000 THEN 'Platinum'\n    WHEN balance >= 5000 THEN 'Gold'\n    ELSE 'Standard'\n  END AS loyalty_tier\nFROM customers;"} isCode={true} />
                <LearnSubcard title="What happens during processing (Engine Behavior):" content={"CASE expressions evaluate sequentially in short-circuit mode. As soon as a condition evaluates to TRUE, its corresponding value is returned without testing subsequent WHEN clauses."} />
              </div>
              <LearnSubcard title="Performance, Indexing &amp; Complexity Tips:" content={"Use COALESCE to provide sensible default values in aggregate calculations (e.g. SUM(COALESCE(tax, 0))) to prevent NULL values from poisoning numerical calculations."} highlight={true} />
            </LearnCard>
          )}

        {/* Card 13: Window Functions — OVER, PARTITION BY & Ranking */}
        {(selectedModule === "all" || selectedModule === "dql") &&
          ("window functions — over, partition by & ranking".includes(searchQuery.toLowerCase()) ||
            "dql analytical".includes(searchQuery.toLowerCase()) ||
            searchQuery === "") && (
            <LearnCard
              id="sec-13"
              num="13"
              category="DQL Analytical"
              title="Window Functions — OVER, PARTITION BY & Ranking"
              preview="Calculates running totals, rankings, and lead/lag values across tuple partitions without collapsing rows."
              isOpen={!!openCards["sec-13"]}
              onToggle={() => toggleCard("sec-13")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LearnSubcard title="Command Syntax &amp; Clauses:" content={"AGG_FUNC() OVER (PARTITION BY partition_col ORDER BY sort_col [ROWS BETWEEN ...]);"} isCode={true} />
                <LearnSubcard title="What it does &amp; Functionality:" content={"Computes analytical rankings, sliding windows, and moving averages across partitions of rows without collapsing rows like GROUP BY does. Supports ROW_NUMBER(), RANK(), DENSE_RANK(), LEAD(), LAG(), and cumulative SUM()."} />
                <LearnSubcard title="Code Example &amp; Practical Query:" content={"-- Rank products by price within each category and compute running category totals\nSELECT \n  product_name,\n  category,\n  price,\n  ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) AS price_rank,\n  SUM(price) OVER (PARTITION BY category ORDER BY price ASC) AS running_category_total\nFROM products;"} isCode={true} />
                <LearnSubcard title="What happens during processing (Engine Behavior):" content={"The window operator sorts the relation by partition keys and order keys. It maintains a sliding frame buffer across the tuples, computing analytical metrics while streaming original rows to the client."} />
              </div>
              <LearnSubcard title="Performance, Indexing &amp; Complexity Tips:" content={"Window functions are executed after WHERE, GROUP BY, and HAVING stages, but before ORDER BY and LIMIT. Indexes on (partition_col, sort_col) eliminate physical sorting overhead."} highlight={true} />
            </LearnCard>
          )}

        {/* Card 14: INSERT INTO — Inserting Tuples & Batch Mutations */}
        {(selectedModule === "all" || selectedModule === "dml") &&
          ("insert into — inserting tuples & batch mutations".includes(searchQuery.toLowerCase()) ||
            "dml mutations".includes(searchQuery.toLowerCase()) ||
            searchQuery === "") && (
            <LearnCard
              id="sec-14"
              num="14"
              category="DML Mutations"
              title="INSERT INTO — Inserting Tuples & Batch Mutations"
              preview="Appends single or multi-row tuples into relational tables with constraint verification and WAL logging."
              isOpen={!!openCards["sec-14"]}
              onToggle={() => toggleCard("sec-14")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LearnSubcard title="Command Syntax &amp; Clauses:" content={"INSERT INTO table_name (col1, col2, ...) VALUES (val1, val2, ...), (val3, val4, ...);"} isCode={true} />
                <LearnSubcard title="What it does &amp; Functionality:" content={"Inserts new tuples into a relation. Supports single-row insertion, multi-row batch insertion, and inserting query results from other tables (INSERT INTO ... SELECT)."} />
                <LearnSubcard title="Code Example &amp; Practical Query:" content={"-- Insert multiple customer records atomically in a single statement\nINSERT INTO customers (id, name, email, city, balance, status)\nVALUES \n  (201, 'Ananya Sharma', 'ananya@example.com', 'Mumbai', 4500.0, 'active'),\n  (202, 'Rohan Verma', 'rohan@example.com', 'Bangalore', 8200.0, 'active');"} isCode={true} />
                <LearnSubcard title="What happens during processing (Engine Behavior):" content={"The catalog manager asserts NOT NULL, CHECK, PRIMARY KEY uniqueness, and FOREIGN KEY references. The storage engine allocates slots in page freespace, appends tuple byte payloads, and writes WAL log records."} />
              </div>
              <LearnSubcard title="Performance, Indexing &amp; Complexity Tips:" content={"Always bundle multiple row inserts into a single multi-row statement or wrap individual inserts in a single BEGIN...COMMIT transaction to avoid repeated disk fsync operations."} highlight={true} />
            </LearnCard>
          )}

        {/* Card 15: UPDATE — Modifying Existing Relation Tuples */}
        {(selectedModule === "all" || selectedModule === "dml") &&
          ("update — modifying existing relation tuples".includes(searchQuery.toLowerCase()) ||
            "dml mutations".includes(searchQuery.toLowerCase()) ||
            searchQuery === "") && (
            <LearnCard
              id="sec-15"
              num="15"
              category="DML Mutations"
              title="UPDATE — Modifying Existing Relation Tuples"
              preview="Updates column values across matching rows, applying calculations and constraint checks."
              isOpen={!!openCards["sec-15"]}
              onToggle={() => toggleCard("sec-15")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LearnSubcard title="Command Syntax &amp; Clauses:" content={"UPDATE table_name SET column1 = value1, column2 = expression WHERE condition;"} isCode={true} />
                <LearnSubcard title="What it does &amp; Functionality:" content={"Modifies column values in existing tuples satisfying a WHERE condition. If no WHERE clause is provided, all tuples in the relation are updated."} />
                <LearnSubcard title="Code Example &amp; Practical Query:" content={"-- Apply 10% loyalty bonus to all active customers from Pune\nUPDATE customers\nSET \n  balance = balance * 1.10,\n  status = 'verified'\nWHERE city = 'Pune' AND status = 'active';"} isCode={true} />
                <LearnSubcard title="What happens during processing (Engine Behavior):" content={"The engine scans tuples matching the predicate, acquires update locks on modified pages, evaluates replacement expressions, validates schema constraints, and writes modified dirty pages to buffer cache."} />
              </div>
              <LearnSubcard title="Performance, Indexing &amp; Complexity Tips:" content={"Always execute a SELECT with the same WHERE clause first to verify which rows will be affected before running an UPDATE in production databases."} highlight={true} />
            </LearnCard>
          )}

        {/* Card 16: DELETE & TRUNCATE — Deleting Rows & Page Deallocation */}
        {(selectedModule === "all" || selectedModule === "dml") &&
          ("delete & truncate — deleting rows & page deallocation".includes(searchQuery.toLowerCase()) ||
            "dml mutations".includes(searchQuery.toLowerCase()) ||
            searchQuery === "") && (
            <LearnCard
              id="sec-16"
              num="16"
              category="DML Mutations"
              title="DELETE & TRUNCATE — Deleting Rows & Page Deallocation"
              preview="Deletes specific records via tombstone marking, or wipes entire relations via fast page unlinking."
              isOpen={!!openCards["sec-16"]}
              onToggle={() => toggleCard("sec-16")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LearnSubcard title="Command Syntax &amp; Clauses:" content={"DELETE FROM table_name WHERE condition;\nTRUNCATE TABLE table_name;"} isCode={true} />
                <LearnSubcard title="What it does &amp; Functionality:" content={"DELETE removes specific rows satisfying a filter, logging deletions row-by-row and triggering foreign key cascades. TRUNCATE rapidly deallocates all pages in the relation, resetting autoincrement sequences."} />
                <LearnSubcard title="Code Example &amp; Practical Query:" content={"-- Delete inactive customer accounts with zero balance\nDELETE FROM customers\nWHERE status = 'inactive' AND balance = 0;"} isCode={true} />
                <LearnSubcard title="What happens during processing (Engine Behavior):" content={"DELETE marks slot headers in data pages as deleted (tombstone) without immediate physical compaction; writes WAL rollback entries. TRUNCATE unlinks B-Tree root page chains in O(1) time."} />
              </div>
              <LearnSubcard title="Performance, Indexing &amp; Complexity Tips:" content={"Massive DELETE statements generate extensive WAL logs and lock tables for extended periods. To purge an entire table, TRUNCATE is orders of magnitude faster and reclaims disk space immediately."} highlight={true} />
            </LearnCard>
          )}

        {/* Card 17: UPSERT — Atomic Insert or Update Conflict Handling */}
        {(selectedModule === "all" || selectedModule === "dml") &&
          ("upsert — atomic insert or update conflict handling".includes(searchQuery.toLowerCase()) ||
            "dml mutations".includes(searchQuery.toLowerCase()) ||
            searchQuery === "") && (
            <LearnCard
              id="sec-17"
              num="17"
              category="DML Mutations"
              title="UPSERT — Atomic Insert or Update Conflict Handling"
              preview="Handles primary key and unique constraint collisions idempotently using ON CONFLICT DO UPDATE."
              isOpen={!!openCards["sec-17"]}
              onToggle={() => toggleCard("sec-17")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LearnSubcard title="Command Syntax &amp; Clauses:" content={"INSERT INTO table (cols) VALUES (vals) ON CONFLICT (conflict_col) DO UPDATE SET col = excluded_val;"} isCode={true} />
                <LearnSubcard title="What it does &amp; Functionality:" content={"Atomically inserts a new row or updates existing column values if a PRIMARY KEY or UNIQUE constraint conflict occurs. Eliminates race conditions in concurrent data pipelines."} />
                <LearnSubcard title="Code Example &amp; Practical Query:" content={"-- Atomically increment customer visits on duplicate customer ID\nINSERT INTO customer_visits (customer_id, visit_count, last_visit)\nVALUES (101, 1, CURRENT_TIMESTAMP)\nON CONFLICT(customer_id) DO UPDATE SET\n  visit_count = visit_count + 1,\n  last_visit = CURRENT_TIMESTAMP;"} isCode={true} />
                <LearnSubcard title="What happens during processing (Engine Behavior):" content={"The engine attempts an insert. If a UNIQUE/PK index duplicate is detected, it rolls back the insert and redirects to the update branch using the pseudo-table EXCLUDED containing the proposed values."} />
              </div>
              <LearnSubcard title="Performance, Indexing &amp; Complexity Tips:" content={"UPSERT provides atomic idempotency, making it ideal for webhook receivers, ETL synchronization, and distributed ingestion pipelines."} highlight={true} />
            </LearnCard>
          )}

        {/* Card 18: CREATE TABLE — Relational Schema Definition */}
        {(selectedModule === "all" || selectedModule === "ddl") &&
          ("create table — relational schema definition".includes(searchQuery.toLowerCase()) ||
            "ddl architecture".includes(searchQuery.toLowerCase()) ||
            searchQuery === "") && (
            <LearnCard
              id="sec-18"
              num="18"
              category="DDL Architecture"
              title="CREATE TABLE — Relational Schema Definition"
              preview="Allocates database relations, attribute types (INTEGER, TEXT, REAL, BLOB), and column constraints."
              isOpen={!!openCards["sec-18"]}
              onToggle={() => toggleCard("sec-18")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LearnSubcard title="Command Syntax &amp; Clauses:" content={"CREATE TABLE table_name (\n  col1 type PRIMARY KEY,\n  col2 type NOT NULL,\n  col3 type DEFAULT val CHECK (predicate)\n);"} isCode={true} />
                <LearnSubcard title="What it does &amp; Functionality:" content={"Defines a new relation schema in the database catalog. Specifies column names, SQL data types (INTEGER, TEXT, REAL, BLOB, NUMERIC), and integrity constraints (PRIMARY KEY, NOT NULL, UNIQUE, DEFAULT, CHECK)."} />
                <LearnSubcard title="Code Example &amp; Practical Query:" content={"-- Define a resilient relational orders table\nCREATE TABLE orders (\n  order_id INTEGER PRIMARY KEY AUTOINCREMENT,\n  customer_id INTEGER NOT NULL,\n  order_date TEXT NOT NULL DEFAULT (CURRENT_DATE),\n  total REAL NOT NULL CHECK (total >= 0.0),\n  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'shipped', 'cancelled')),\n  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE\n);"} isCode={true} />
                <LearnSubcard title="What happens during processing (Engine Behavior):" content={"The DDL compiler allocates relation metadata in the system catalog (e.g. sqlite_master), initializes an empty B-Tree root page on disk, and binds column type checkers."} />
              </div>
              <LearnSubcard title="Performance, Indexing &amp; Complexity Tips:" content={"Choose precise data types and define NOT NULL constraints whenever possible. NOT NULL columns allow the optimizer to eliminate null-handling checks in query execution trees."} highlight={true} />
            </LearnCard>
          )}

        {/* Card 19: FOREIGN KEY Constraints & Cascade Actions */}
        {(selectedModule === "all" || selectedModule === "ddl") &&
          ("foreign key constraints & cascade actions".includes(searchQuery.toLowerCase()) ||
            "ddl architecture".includes(searchQuery.toLowerCase()) ||
            searchQuery === "") && (
            <LearnCard
              id="sec-19"
              num="19"
              category="DDL Architecture"
              title="FOREIGN KEY Constraints & Cascade Actions"
              preview="Maintains referential integrity across parent-child relations with ON DELETE CASCADE and RESTRICT."
              isOpen={!!openCards["sec-19"]}
              onToggle={() => toggleCard("sec-19")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LearnSubcard title="Command Syntax &amp; Clauses:" content={"FOREIGN KEY (fk_col) REFERENCES parent_table(pk_col) [ON DELETE CASCADE | SET NULL | RESTRICT] [ON UPDATE CASCADE]"} isCode={true} />
                <LearnSubcard title="What it does &amp; Functionality:" content={"Enforces referential integrity by requiring that a column's value matches a primary key in a referenced parent table (or be NULL). Defines automated cascading behaviors upon parent deletion or update."} />
                <LearnSubcard title="Code Example &amp; Practical Query:" content={"-- Enforce cascading cleanup of order items when an order is deleted\nCREATE TABLE order_items (\n  item_id INTEGER PRIMARY KEY,\n  order_id INTEGER NOT NULL,\n  product_id INTEGER NOT NULL,\n  quantity INTEGER NOT NULL CHECK (quantity > 0),\n  unit_price REAL NOT NULL,\n  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,\n  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT\n);"} isCode={true} />
                <LearnSubcard title="What happens during processing (Engine Behavior):" content={"On row insert, the catalog constraint manager checks parent table indexes. On parent deletion, the engine intercepts the deletion and either cascades deletes to child tables or raises an integrity violation error."} />
              </div>
              <LearnSubcard title="Performance, Indexing &amp; Complexity Tips:" content={"Always create indexes on foreign key columns. Without an index on order_id in order_items, deleting an order forces a full table scan of the entire order_items table to verify cascade dependencies."} highlight={true} />
            </LearnCard>
          )}

        {/* Card 20: ALTER TABLE — Schema Evolution & Alterations */}
        {(selectedModule === "all" || selectedModule === "ddl") &&
          ("alter table — schema evolution & alterations".includes(searchQuery.toLowerCase()) ||
            "ddl architecture".includes(searchQuery.toLowerCase()) ||
            searchQuery === "") && (
            <LearnCard
              id="sec-20"
              num="20"
              category="DDL Architecture"
              title="ALTER TABLE — Schema Evolution & Alterations"
              preview="Modifies existing relation structures, adding columns or renaming relations without losing data."
              isOpen={!!openCards["sec-20"]}
              onToggle={() => toggleCard("sec-20")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LearnSubcard title="Command Syntax &amp; Clauses:" content={"ALTER TABLE table_name ADD COLUMN col_name type [constraints];\nALTER TABLE table_name RENAME TO new_table_name;\nALTER TABLE table_name RENAME COLUMN old_col TO new_col;"} isCode={true} />
                <LearnSubcard title="What it does &amp; Functionality:" content={"Modifies the structural definition of an existing relation without dropping data. Supports adding new columns, dropping unused columns, renaming columns, and renaming the relation itself."} />
                <LearnSubcard title="Code Example &amp; Practical Query:" content={"-- Add a loyalty points column and rename table structure safely\nALTER TABLE customers ADD COLUMN loyalty_tier TEXT DEFAULT 'Bronze';\nALTER TABLE customers RENAME COLUMN balance TO wallet_balance;"} isCode={true} />
                <LearnSubcard title="What happens during processing (Engine Behavior):" content={"Updates the catalog relation descriptor in memory and on disk. For ADD COLUMN with constant defaults, modern engines apply lazy schema versioning without rewriting existing physical data pages."} />
              </div>
              <LearnSubcard title="Performance, Indexing &amp; Complexity Tips:" content={"Adding a column with a DEFAULT value is fast (O(1)). Adding complex computed constraints or altering primary keys may require recreating the table under a transaction."} highlight={true} />
            </LearnCard>
          )}

        {/* Card 21: DROP TABLE & Schema Object Deconstruction */}
        {(selectedModule === "all" || selectedModule === "ddl") &&
          ("drop table & schema object deconstruction".includes(searchQuery.toLowerCase()) ||
            "ddl architecture".includes(searchQuery.toLowerCase()) ||
            searchQuery === "") && (
            <LearnCard
              id="sec-21"
              num="21"
              category="DDL Architecture"
              title="DROP TABLE & Schema Object Deconstruction"
              preview="Permanently destroys relation schemas, reclaim storage pages, and remove dependent objects."
              isOpen={!!openCards["sec-21"]}
              onToggle={() => toggleCard("sec-21")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LearnSubcard title="Command Syntax &amp; Clauses:" content={"DROP TABLE [IF EXISTS] table_name [CASCADE];"} isCode={true} />
                <LearnSubcard title="What it does &amp; Functionality:" content={"Permanently removes a table, all its tuples, its catalog schema, and associated indexes and triggers from the database catalog. Reclaims storage pages to the database free-list."} />
                <LearnSubcard title="Code Example &amp; Practical Query:" content={"-- Safely drop temporary staging table if it exists\nDROP TABLE IF EXISTS staging_import_cache;"} isCode={true} />
                <LearnSubcard title="What happens during processing (Engine Behavior):" content={"The catalog descriptor is purged. All allocated B-Tree leaf and interior pages are unlinked and returned to the database free-list page header."} />
              </div>
              <LearnSubcard title="Performance, Indexing &amp; Complexity Tips:" content={"Always use the IF EXISTS clause in migration scripts to prevent runtime exceptions if the target object has already been dropped."} highlight={true} />
            </LearnCard>
          )}

        {/* Card 22: CREATE INDEX — B-Tree Indexing & Performance Tuning */}
        {(selectedModule === "all" || selectedModule === "ddl") &&
          ("create index — b-tree indexing & performance tuning".includes(searchQuery.toLowerCase()) ||
            "ddl indexing".includes(searchQuery.toLowerCase()) ||
            searchQuery === "") && (
            <LearnCard
              id="sec-22"
              num="22"
              category="DDL Indexing"
              title="CREATE INDEX — B-Tree Indexing & Performance Tuning"
              preview="Builds auxiliary B+ Tree indexes to accelerate selection lookups from O(N) scans to O(log N) seeks."
              isOpen={!!openCards["sec-22"]}
              onToggle={() => toggleCard("sec-22")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LearnSubcard title="Command Syntax &amp; Clauses:" content={"CREATE [UNIQUE] INDEX index_name ON table_name (col1 [ASC|DESC], col2);"} isCode={true} />
                <LearnSubcard title="What it does &amp; Functionality:" content={"Constructs an auxiliary B+ Tree search index on designated table columns. Accelerates row lookup operations from linear table scans O(N) to logarithmic binary seeks O(log N). Supports single-column, composite, and unique indexes."} />
                <LearnSubcard title="Code Example &amp; Practical Query:" content={"-- Composite index for frequent queries filtering by city and sorting by balance\nCREATE INDEX idx_customers_city_bal ON customers (city, balance DESC);\n-- Unique index preventing duplicate email registrations\nCREATE UNIQUE INDEX idx_customers_email ON customers (email);"} isCode={true} />
                <LearnSubcard title="What happens during processing (Engine Behavior):" content={"The engine scans the base relation, extracts key values alongside tuple RowIDs, sorts them via external merge sort, and constructs a balanced B+ Tree page hierarchy on disk."} />
              </div>
              <LearnSubcard title="Performance, Indexing &amp; Complexity Tips:" content={"Indexes drastically accelerate SELECT queries, but impose a write overhead on INSERT, UPDATE, and DELETE because every mutation must also update auxiliary B-Tree index pages."} highlight={true} />
            </LearnCard>
          )}

        {/* Card 23: CREATE VIEW & Triggers — Virtual Tables & Automation */}
        {(selectedModule === "all" || selectedModule === "ddl") &&
          ("create view & triggers — virtual tables & automation".includes(searchQuery.toLowerCase()) ||
            "ddl virtual objects".includes(searchQuery.toLowerCase()) ||
            searchQuery === "") && (
            <LearnCard
              id="sec-23"
              num="23"
              category="DDL Virtual Objects"
              title="CREATE VIEW & Triggers — Virtual Tables & Automation"
              preview="Creates reusable virtual query abstractions and event-driven automated business rule triggers."
              isOpen={!!openCards["sec-23"]}
              onToggle={() => toggleCard("sec-23")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LearnSubcard title="Command Syntax &amp; Clauses:" content={"CREATE VIEW view_name AS SELECT ...;\nCREATE TRIGGER trigger_name AFTER INSERT ON table BEGIN ... END;"} isCode={true} />
                <LearnSubcard title="What it does &amp; Functionality:" content={"CREATE VIEW defines a saved, reusable virtual query that behaves like a table without duplicating data. CREATE TRIGGER attaches automated procedural logic executed before or after INSERT, UPDATE, or DELETE events."} />
                <LearnSubcard title="Code Example &amp; Practical Query:" content={"-- Create reusable customer orders view\nCREATE VIEW customer_order_summary AS\nSELECT \n  c.id, c.name, c.city, \n  COUNT(o.order_id) AS total_orders,\n  COALESCE(SUM(o.total), 0.0) AS lifetime_value\nFROM customers c\nLEFT JOIN orders o ON c.id = o.customer_id\nGROUP BY c.id;\n\n-- Audit trigger: Log balance updates\nCREATE TRIGGER trg_audit_balance AFTER UPDATE OF balance ON customers\nBEGIN\n  INSERT INTO audit_log (customer_id, old_bal, new_bal, changed_at)\n  VALUES (OLD.id, OLD.balance, NEW.balance, CURRENT_TIMESTAMP);\nEND;"} isCode={true} />
                <LearnSubcard title="What happens during processing (Engine Behavior):" content={"Views are inlined by the query rewriter into the parent AST before optimization. Triggers compile into execution bytecode and trigger synchronously inside the mutating transaction boundary."} />
              </div>
              <LearnSubcard title="Performance, Indexing &amp; Complexity Tips:" content={"Views do not store duplicate data unless declared as Materialized Views. Use views to simplify complex business calculations and enforce column-level security access."} highlight={true} />
            </LearnCard>
          )}

        {/* Card 24: BEGIN, COMMIT & ROLLBACK — Transaction Boundaries */}
        {(selectedModule === "all" || selectedModule === "tcl") &&
          ("begin, commit & rollback — transaction boundaries".includes(searchQuery.toLowerCase()) ||
            "tcl transactions".includes(searchQuery.toLowerCase()) ||
            searchQuery === "") && (
            <LearnCard
              id="sec-24"
              num="24"
              category="TCL Transactions"
              title="BEGIN, COMMIT & ROLLBACK — Transaction Boundaries"
              preview="Demarcates atomic transaction boundaries, partial savepoints, and rollback recovery."
              isOpen={!!openCards["sec-24"]}
              onToggle={() => toggleCard("sec-24")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LearnSubcard title="Command Syntax &amp; Clauses:" content={"BEGIN TRANSACTION;\n-- statements...\nCOMMIT;  -- or ROLLBACK;\nSAVEPOINT sp1;\nROLLBACK TO sp1;"} isCode={true} />
                <LearnSubcard title="What it does &amp; Functionality:" content={"Demarcates transaction boundaries for multi-step mutations. Ensures ACID Atomicity: either all statements commit permanently, or all changes are rolled back on failure. SAVEPOINT enables partial rollbacks."} />
                <LearnSubcard title="Code Example &amp; Practical Query:" content={"-- Atomic bank transfer between accounts\nBEGIN TRANSACTION;\n  UPDATE accounts SET balance = balance - 500 WHERE id = 101;\n  UPDATE accounts SET balance = balance + 500 WHERE id = 102;\nCOMMIT;"} isCode={true} />
                <LearnSubcard title="What happens during processing (Engine Behavior):" content={"Mutations are held in dirty buffer pool pages and logged to the Write-Ahead Log (WAL). On COMMIT, WAL records are flushed to non-volatile disk. On ROLLBACK, dirty frames are discarded and undone."} />
              </div>
              <LearnSubcard title="Performance, Indexing &amp; Complexity Tips:" content={"Keep transactions as short as possible to minimize lock contention and prevent thread blocking in multi-user concurrent relational databases."} highlight={true} />
            </LearnCard>
          )}

        {/* Card 25: GRANT & REVOKE — Role-Based Access Control */}
        {(selectedModule === "all" || selectedModule === "dcl") &&
          ("grant & revoke — role-based access control".includes(searchQuery.toLowerCase()) ||
            "dcl security".includes(searchQuery.toLowerCase()) ||
            searchQuery === "") && (
            <LearnCard
              id="sec-25"
              num="25"
              category="DCL Security"
              title="GRANT & REVOKE — Role-Based Access Control"
              preview="Manages user permissions, security access rights, and table-level privileges."
              isOpen={!!openCards["sec-25"]}
              onToggle={() => toggleCard("sec-25")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LearnSubcard title="Command Syntax &amp; Clauses:" content={"GRANT privilege ON object TO user_or_role;\nREVOKE privilege ON object FROM user_or_role;"} isCode={true} />
                <LearnSubcard title="What it does &amp; Functionality:" content={"Grants or revokes security access privileges (SELECT, INSERT, UPDATE, DELETE, ALL) on database tables, views, and schemas to specific users or roles."} />
                <LearnSubcard title="Code Example &amp; Practical Query:" content={"-- Grant read-only access to reporting analysts\nGRANT SELECT ON customers TO 'analyst_role';\nGRANT SELECT, INSERT ON orders TO 'service_agent';\nREVOKE DELETE ON orders FROM 'service_agent';"} isCode={true} />
                <LearnSubcard title="What happens during processing (Engine Behavior):" content={"The security catalog registers user permissions. The query parser validates access rights during the catalog check phase before generating the query execution tree."} />
              </div>
              <LearnSubcard title="Performance, Indexing &amp; Complexity Tips:" content={"Apply the principle of least privilege: give application database connections only the exact permissions needed (e.g. read-only accounts should never have DROP or DELETE rights)."} highlight={true} />
            </LearnCard>
          )}

        {/* Card 26: Relational Algebra Foundations — Mathematical Operators */}
        {(selectedModule === "all" || selectedModule === "theory") &&
          ("relational algebra foundations — mathematical operators".includes(searchQuery.toLowerCase()) ||
            "theory & internals".includes(searchQuery.toLowerCase()) ||
            searchQuery === "") && (
            <LearnCard
              id="sec-26"
              num="26"
              category="Theory & Internals"
              title="Relational Algebra Foundations — Mathematical Operators"
              preview="Mathematical procedural operators defined by Edgar F. Codd forming the formal theoretical foundation of SQL."
              isOpen={!!openCards["sec-26"]}
              onToggle={() => toggleCard("sec-26")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LearnSubcard title="Command Syntax &amp; Clauses:" content={"σ_p(R) [Selection], π_A(R) [Projection], R ⋈_θ S [Theta Join], γ_G, F(A)(R) [Aggregation]"} isCode={true} />
                <LearnSubcard title="What it does &amp; Functionality:" content={"Relational algebra is the procedural mathematical query language underpinning all relational databases. Every SQL statement compiles into an expression tree composed of these formal algebraic operators."} />
                <LearnSubcard title="Code Example &amp; Practical Query:" content={"-- Relational Algebra Equivalence:\n-- SQL: SELECT name FROM customers WHERE city = 'Mumbai';\n-- Algebra: π_name(σ_city='Mumbai'(customers))"} isCode={true} />
                <LearnSubcard title="What happens during processing (Engine Behavior):" content={"The query parser builds an Abstract Syntax Tree (AST), which transforms into a Logical Query Plan consisting of Selection (σ), Projection (π), Join (⋈), and Grouping (γ) operators."} />
              </div>
              <LearnSubcard title="Performance, Indexing &amp; Complexity Tips:" content={"Relational algebra allows rule-based optimizations such as Predicate Pushdown: σ_p(R ⋈ S) ≡ (σ_p R) ⋈ S, filtering rows before performing expensive joins."} highlight={true} />
            </LearnCard>
          )}

        {/* Card 27: Relational Integrity Constraints & ACID Architecture */}
        {(selectedModule === "all" || selectedModule === "theory") &&
          ("relational integrity constraints & acid architecture".includes(searchQuery.toLowerCase()) ||
            "theory & internals".includes(searchQuery.toLowerCase()) ||
            searchQuery === "") && (
            <LearnCard
              id="sec-27"
              num="27"
              category="Theory & Internals"
              title="Relational Integrity Constraints & ACID Architecture"
              preview="Domain, Entity, and Referential integrity rules coupled with ACID transaction reliability guarantees."
              isOpen={!!openCards["sec-27"]}
              onToggle={() => toggleCard("sec-27")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LearnSubcard title="Command Syntax &amp; Clauses:" content={"PRIMARY KEY, FOREIGN KEY, CHECK, NOT NULL, UNIQUE, ACID Guarantees"} isCode={true} />
                <LearnSubcard title="What it does &amp; Functionality:" content={"Defines the declarative invariants that prevent corrupt or orphaned data: Domain Integrity (types), Entity Integrity (Primary Keys), and Referential Integrity (Foreign Keys). Enforces ACID transaction reliability (Atomicity, Consistency, Isolation, Durability)."} />
                <LearnSubcard title="Code Example &amp; Practical Query:" content={"-- Invariants enforced across relation boundaries:\n-- 1. Domain: balance must be REAL >= 0\n-- 2. Entity: id is PRIMARY KEY NOT NULL\n-- 3. Referential: customer_id in orders must reference a valid customer"} isCode={true} />
                <LearnSubcard title="What happens during processing (Engine Behavior):" content={"Constraint checks run automatically in the pipeline before mutations are committed to buffer pages. If any invariant is violated, the statement aborts safely."} />
              </div>
              <LearnSubcard title="Performance, Indexing &amp; Complexity Tips:" content={"Preserving integrity at the database layer prevents silent data corruption that application-level code often misses."} highlight={true} />
            </LearnCard>
          )}

        {/* Card 28: Query Execution Complexity & Slotted Page Storage */}
        {(selectedModule === "all" || selectedModule === "theory") &&
          ("query execution complexity & slotted page storage".includes(searchQuery.toLowerCase()) ||
            "theory & internals".includes(searchQuery.toLowerCase()) ||
            searchQuery === "") && (
            <LearnCard
              id="sec-28"
              num="28"
              category="Theory & Internals"
              title="Query Execution Complexity & Slotted Page Storage"
              preview="Big-O computational time and space complexities across query processing operators and slotted pages."
              isOpen={!!openCards["sec-28"]}
              onToggle={() => toggleCard("sec-28")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LearnSubcard title="Command Syntax &amp; Clauses:" content={"Time: O(1) to O(N log N) | Space: O(1) streaming to O(N) hash buffer"} isCode={true} />
                <LearnSubcard title="What it does &amp; Functionality:" content={"Analyzes the computational time and buffer pool memory requirements of database execution operators (Full Table Scan O(N), Index Seek O(log N), Nested Loop Join O(N · M), Hash Join O(N + M), External Sort O(N log N)). Explains physical slotted disk page architecture."} />
                <LearnSubcard title="Code Example &amp; Practical Query:" content={"-- Operator Complexity Breakdown:\n-- FROM (Table Scan): O(N) Time, O(1) Memory\n-- WHERE (Filter): O(N) Time, O(1) Memory\n-- JOIN (Hash Join): O(N + M) Time, O(min(N,M)) Memory\n-- ORDER BY (Merge Sort): O(N log N) Time, O(N) Memory"} isCode={true} />
                <LearnSubcard title="What happens during processing (Engine Behavior):" content={"Database relations are stored on disk in fixed-size slotted pages (typically 4KB or 8KB). A page contains a Page Header, Slot Array pointing to record offsets, freespace, and variable-length record payloads."} />
              </div>
              <LearnSubcard title="Performance, Indexing &amp; Complexity Tips:" content={"Understanding execution complexity allows database engineers to identify bottlenecks, add appropriate indexes, and optimize query plans."} highlight={true} />
            </LearnCard>
          )}

        {/* Card 29: Natural Language to SQL (NL→SQL) Overview & Semantic Parsing */}
        {(selectedModule === "all" || selectedModule === "nlp") &&
          ("natural language to sql (nl→sql) overview & semantic parsing".includes(searchQuery.toLowerCase()) ||
            "nl→sql architecture".includes(searchQuery.toLowerCase()) ||
            searchQuery === "") && (
            <LearnCard
              id="sec-29"
              num="29"
              category="NL→SQL Architecture"
              title="Natural Language to SQL (NL→SQL) Overview & Semantic Parsing"
              preview="Condensed overview of conversational querying, schema linking, AST translation, and execution-guided repair."
              isOpen={!!openCards["sec-29"]}
              onToggle={() => toggleCard("sec-29")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LearnSubcard title="Command Syntax &amp; Clauses:" content={"User Question -> Schema Linking -> Prompt Formulation -> LLM Generation -> AST Validation -> Execution"} isCode={true} />
                <LearnSubcard title="What it does &amp; Functionality:" content={"Translates human language questions into syntactically valid and semantically accurate SQL queries. Coordinates tokenization, schema linking (mapping entity words to tables and columns), grammar-constrained LLM decoding, and execution-guided self-repair."} />
                <LearnSubcard title="Code Example &amp; Practical Query:" content={"-- Example Translation:\n-- Input: 'Show the names and cities of customers with balance over 5000'\n-- Output: SELECT name, city FROM customers WHERE balance > 5000;"} isCode={true} />
                <LearnSubcard title="What happens during processing (Engine Behavior):" content={"The application extracts database schema metadata (table names, column types, foreign keys, sample records) and provides it as structured context to the language model. The generated query is validated against active catalog tables before execution."} />
              </div>
              <LearnSubcard title="Performance, Indexing &amp; Complexity Tips:" content={"Explicit database schema naming conventions (e.g. customer_id instead of just id) significantly improve AI schema linking accuracy."} highlight={true} />
            </LearnCard>
          )}

        {/* Card 30: Educational Video Breakdown & Academic Bibliography */}
        {(selectedModule === "all" || selectedModule === "references") &&
          ("educational video breakdown & academic bibliography".includes(searchQuery.toLowerCase()) ||
            "media & bibliography".includes(searchQuery.toLowerCase()) ||
            searchQuery === "") && (
            <LearnCard
              id="sec-30"
              num="30"
              category="Media & Bibliography"
              title="Educational Video Breakdown & Academic Bibliography"
              preview="Interactive video lecture on SQL fundamentals and authoritative textbooks, research papers, and standards."
              isOpen={!!openCards["sec-30"]}
              onToggle={() => toggleCard("sec-30")}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LearnSubcard title="Command Syntax &amp; Clauses:" content={"Curated Courseware & Authoritative ISO/IEC 9075 Standards"} isCode={true} />
                <LearnSubcard title="What it does &amp; Functionality:" content={"Provides multimedia learning resources and academic references for students and researchers. Includes an embedded SQL educational lecture and citations to seminal textbooks (Silberschatz, Ramakrishnan) and research papers (Spider, RAT-SQL)."} />
                <LearnSubcard title="Code Example &amp; Practical Query:" content={"-- Academic References:\n-- 1. Silberschatz, Korth, Sudarshan (2020) 'Database System Concepts'\n-- 2. Edgar F. Codd (1970) 'A Relational Model of Data for Large Shared Data Banks'\n-- 3. ISO/IEC 9075:2023 SQL Standard Specification"} isCode={true} />
                <LearnSubcard title="What happens during processing (Engine Behavior):" content={"Streams video from YouTube with full player controls and renders formatted academic citations."} />
              </div>
              <LearnSubcard title="Performance, Indexing &amp; Complexity Tips:" content={"Consult academic textbooks for formal relational algebra proofs and query optimization mathematics."} highlight={true} />
            </LearnCard>
          )}
      </div>
    </main>
  );
}
