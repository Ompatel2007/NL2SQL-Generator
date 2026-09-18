import { useMemo, useState } from "react";
import type { PipelineStep, Row, SQLCommand, StatementType } from "@/lib/sqlEngine";
import type { Table } from "@/lib/schema";
import type { QueryExplanation } from "@/lib/queryExplainer";

export interface TheoryProps {
  current?: PipelineStep;
  steps?: PipelineStep[];
  activeStep?: number;
  onStepChange?: (index: number) => void;
  sql?: string;
  error?: string;
  schema?: Table[];
  explanation?: QueryExplanation | null;
  hasExecuted?: boolean;
}

const STAGE_NOTES: Record<string, string> = {
  PARSER:
    "The query parser lexicalizes and parses the SQL string into an Abstract Syntax Tree (AST), checking SQL grammar, keywords, and identifiers.",
  CATALOG:
    "The System Catalog (Data Dictionary) manages metadata schemas, relation definitions, column types, and integrity constraints.",
  CONSTRAINT:
    "Constraint validation verifies Domain Constraints (types), Entity Integrity (Primary Key uniqueness & NOT NULL), and Referential Integrity (Foreign Keys).",
  MUTATION:
    "Tuple/Schema Mutation applies row insertions, updates, deletions, or structural catalog alterations to the in-memory database storage buffer.",
  COMMIT:
    "Transaction Commit finalizes all mutations atomically, ensuring ACID durability and synchronizing live catalog state with active relations.",
  SCHEMA:
    "Relational schema construction allocates table descriptor headers, column data types, and key indexes.",
  FROM: "The database first locates the table on disk and reads its pages into memory. Every subsequent operator works on this working set.",
  JOIN: "A join combines rows of two tables using a predicate. Nested-loop join is O(n·m); real engines use hash joins (O(n+m)) when indexes are absent.",
  WHERE:
    "Selection (WHERE) is a row filter — it removes tuples that fail the predicate but never changes their shape.",
  "GROUP BY":
    "Grouping partitions rows into buckets so aggregates can be computed per bucket, usually via hashing or sorting.",
  DISTINCT:
    "DISTINCT removes duplicate values or rows so each remaining value is considered only once.",
  HAVING:
    "HAVING filters groups after aggregation, unlike WHERE which filters rows before it.",
  AGGREGATE:
    "Aggregates collapse many rows into one summary value per group — COUNT, SUM, AVG, MIN, MAX.",
  SELECT:
    "Projection (SELECT) keeps only requested columns, reducing data shipped to the client.",
  "ORDER BY":
    "Sorting is typically an external merge sort, O(n log n), possibly spilling to disk for large inputs.",
  LIMIT:
    "LIMIT lets the engine stop early — combined with ORDER BY it enables efficient 'top-N' execution plans.",
};

const STAGE_COMPLEXITY: Record<
  string,
  {
    timeBest: string;
    timeAvg: string;
    timeWorst: string;
    space: string;
    model: string;
    diskIo: string;
  }
> = {
  PARSER: {
    timeBest: "O(L)",
    timeAvg: "O(L)",
    timeWorst: "O(L)",
    space: "O(T)",
    model: "Lexical token stream scanning & LALR(1) shift-reduce parsing of query length L.",
    diskIo: "0 I/O (CPU only; parses statement string in memory)",
  },
  CATALOG: {
    timeBest: "O(1)",
    timeAvg: "O(1)",
    timeWorst: "O(K)",
    space: "O(1)",
    model: "Data dictionary hash lookup of relation descriptors and attribute schemas.",
    diskIo: "Cached in catalog cache buffer; 1 block read if cold.",
  },
  CONSTRAINT: {
    timeBest: "O(1)",
    timeAvg: "O(C)",
    timeWorst: "O(C · N)",
    space: "O(1)",
    model: "Check Domain types, assert Primary Key uniqueness via index or hash, verify Foreign Key references.",
    diskIo: "Index root & leaf page lookups if indexed; sequential scan if unindexed FK.",
  },
  MUTATION: {
    timeBest: "O(1)",
    timeAvg: "O(N)",
    timeWorst: "O(N)",
    space: "O(ΔN)",
    model: "Append new tuples to slotted page freespace or mark deleted bitflags in place.",
    diskIo: "Modifies dirty pages in RAM buffer pool; writes WAL (Write-Ahead Log) redo record.",
  },
  COMMIT: {
    timeBest: "O(1)",
    timeAvg: "O(1)",
    timeWorst: "O(log B)",
    space: "O(1)",
    model: "Transaction commit boundary finalizing ACID guarantees and releasing record locks.",
    diskIo: "fsync() log flush ensures durability before transaction acknowledgment.",
  },
  FROM: {
    timeBest: "O(1) [Index]",
    timeAvg: "O(N) [Full Scan]",
    timeWorst: "O(N)",
    space: "O(N)",
    model: "Sequential table scan reading 4KB/8KB slotted disk pages into memory working buffer.",
    diskIo: "Sequential block read of ⌈N / records_per_page⌉ disk pages into Buffer Pool.",
  },
  JOIN: {
    timeBest: "O(N + M) [Hash Join]",
    timeAvg: "O(N + M) [Hash] / O(N·log M) [Index NLJ]",
    timeWorst: "O(N · M) [Block NLJ]",
    space: "O(min(N, M))",
    model: "Build hash table on join key of relation R, probe with relation S tuples; or nested iteration loops.",
    diskIo: "Two-pass hybrid hash join or multi-block buffer page nested scan.",
  },
  WHERE: {
    timeBest: "O(log N) [Index Seek]",
    timeAvg: "O(N) [Predicate Scan]",
    timeWorst: "O(N)",
    space: "O(K) [Filtered Set]",
    model: "Evaluates boolean expression tree for each candidate tuple in the current working set.",
    diskIo: "0 additional disk I/O (operates entirely on RAM pages in buffer pool).",
  },
  "GROUP BY": {
    timeBest: "O(N) [Hash Aggregate]",
    timeAvg: "O(N)",
    timeWorst: "O(N log N) [Sort Aggregate]",
    space: "O(G) [Unique Groups]",
    model: "Hashes group-by column keys into buckets or sorts tuples by grouping keys.",
    diskIo: "Spills to disk temporary runs if hash table exceeds buffer memory (external sort).",
  },
  DISTINCT: {
    timeBest: "O(N)",
    timeAvg: "O(N)",
    timeWorst: "O(N log N)",
    space: "O(U) [Unique Rows]",
    model: "Hash set deduplication or sorting pass eliminating duplicate tuple projections.",
    diskIo: "In-memory hash table lookup; external spill if cardinality is extreme.",
  },
  HAVING: {
    timeBest: "O(G)",
    timeAvg: "O(G)",
    timeWorst: "O(G)",
    space: "O(G)",
    model: "Post-aggregation filter evaluated against aggregate group summaries.",
    diskIo: "0 disk I/O (in-memory evaluation against computed group accumulator records).",
  },
  AGGREGATE: {
    timeBest: "O(N)",
    timeAvg: "O(N)",
    timeWorst: "O(N)",
    space: "O(1)",
    model: "Single-pass stream accumulation updating COUNT, SUM, MIN, MAX accumulators.",
    diskIo: "Stream accumulator cache in CPU L1/L2 data cache.",
  },
  SELECT: {
    timeBest: "O(N · C)",
    timeAvg: "O(N · C)",
    timeWorst: "O(N · C)",
    space: "O(N · C)",
    model: "Attribute projection (π) discarding unrequested column bytes and preparing output tuples.",
    diskIo: "Shrinks tuple memory footprint for network serialization.",
  },
  "ORDER BY": {
    timeBest: "O(N) [Already Sorted]",
    timeAvg: "O(N log N) [Quick/Merge]",
    timeWorst: "O(N log N)",
    space: "O(N) [Working Buffer]",
    model: "External 2-way or K-way merge sort using run generation and priority queue merge.",
    diskIo: "Spills intermediate sorted runs to disk if working set exceeds RAM sort buffer.",
  },
  LIMIT: {
    timeBest: "O(1)",
    timeAvg: "O(K) [Top-K with Heap]",
    timeWorst: "O(K log K)",
    space: "O(K)",
    model: "Short-circuit cursor cutoff or min-heap bounded priority queue.",
    diskIo: "Stops table scan early, saving page reads across disk blocks.",
  },
};

export function algebraForStage(stage: string, command?: string): string {
  switch (stage) {
    case "PARSER":
      return "AST ← LexParse(SQL_String)";
    case "CATALOG":
      return "CatalogEntry ← LookupSchema(Relation, Attributes)";
    case "CONSTRAINT":
      return "Assert(Domain(attrs) ∧ Unique(PK) ∧ RefIntegrity(FK))";
    case "MUTATION":
      if (command === "INSERT") return "R ← R ∪ { t₁, t₂, … }";
      if (command === "UPDATE") return "R ← (R \\ σ_p(R)) ∪ { update(t) | t ∈ σ_p(R) }";
      if (command === "DELETE") return "R ← R \\ σ_p(R)";
      if (command === "ALTER TABLE") return "Schema(R) ← Schema(R) ∪ { attr }";
      if (command === "TRUNCATE") return "R ← ∅";
      return "Mutation(R, BufferPool)";
    case "COMMIT":
      return "WAL_Commit(TxnID, FlushToDisk)";
    case "SCHEMA":
      return "Catalog ← Catalog ∪ { RelationDescriptor(R) }";
    case "FROM":
      return "R ← Scan(Relation)";
    case "JOIN":
      return "R ← R ⋈_θ S";
    case "WHERE":
      return "R ← σ_predicate(R)";
    case "GROUP BY":
      return "R ← γ_group_attrs, F(agg_attrs)(R)";
    case "DISTINCT":
      return "R ← δ(R)";
    case "HAVING":
      return "R ← σ_group_predicate(γ(R))";
    case "AGGREGATE":
      return "R ← G_AggFunctions(R)";
    case "SELECT":
      return "R ← π_attribute_list(R)";
    case "ORDER BY":
      return "R ← τ_sort_keys(R)";
    case "LIMIT":
      return "R ← Top_N(R, limit_val)";
    default:
      return "R ← EvalOperator(Op)";
  }
}

export function Theory({
  current,
  steps = [],
  activeStep = 0,
  onStepChange,
  sql = "",
  error,
  schema = [],
  explanation,
  hasExecuted = false,
}: TheoryProps) {
  const [selectedComplexityDetail, setSelectedComplexityDetail] = useState(false);

  const statementType: StatementType = explanation?.statementType ?? "DQL";
  const command: SQLCommand = explanation?.command ?? "SELECT";

  const activeStage = current?.stage ?? "FROM";
  const activeNote =
    STAGE_NOTES[activeStage] ??
    "The database engine evaluates this operator in working memory according to relational semantics.";
  const activeComplexity =
    STAGE_COMPLEXITY[activeStage] ?? {
      timeBest: "O(1)",
      timeAvg: "O(N)",
      timeWorst: "O(N)",
      space: "O(N)",
      model: "In-memory evaluation of relational operator against active tuples.",
      diskIo: "Page reads managed by buffer pool frame manager.",
    };

  const prevStep = activeStep > 0 ? steps[activeStep - 1] : undefined;
  const initialCount = steps[0]?.rowCount ?? current?.rowCount ?? 0;
  const currentCount = current?.rowCount ?? 0;

  // Filter reduction percentage
  const reductionPct = useMemo(() => {
    if (!prevStep || prevStep.rowCount === 0) return null;
    const diff = prevStep.rowCount - currentCount;
    const pct = Math.round((diff / prevStep.rowCount) * 100);
    return pct;
  }, [prevStep, currentCount]);

  return (
    <div
      className="panel p-5 text-xs space-y-6 leading-relaxed overflow-y-auto w-full"
      style={{
        background: "var(--panel)",
        borderColor: "var(--border)",
        color: "var(--foreground)",
      }}
    >
      {/* Header bar matching Pic 2 */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[11px] font-mono font-bold px-2 py-0.5 rounded border uppercase"
              style={{
                background: "var(--surface-subtle)",
                borderColor: "var(--accent)",
                color: "var(--accent)",
              }}
            >
              Execution Theory &amp; Insights
            </span>
            <span
              className="text-[11px] font-mono px-2 py-0.5 rounded border"
              style={{
                background: "var(--surface-subtle)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            >
              {statementType} • {command}
            </span>
          </div>
          <h2
            className="text-base md:text-lg font-bold tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            Operator Internals, Algorithmic Complexity &amp; Physical Semantics
          </h2>
        </div>

        {/* Step Jump Navigation Pills */}
        {steps.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] opacity-70 mr-1" style={{ color: "var(--muted)" }}>
              Pipeline Stages:
            </span>
            {steps.map((step, idx) => {
              const isSelected = idx === activeStep;
              return (
                <button
                  key={`${step.stage}-${idx}`}
                  type="button"
                  onClick={() => onStepChange?.(idx)}
                  className="px-2 py-1 rounded text-[11px] font-mono font-bold border transition-all cursor-pointer shadow-2xs"
                  style={
                    isSelected
                      ? {
                          background: "var(--accent)",
                          color: "var(--accent-foreground)",
                          borderColor: "var(--accent)",
                        }
                      : {
                          background: "var(--surface-subtle)",
                          color: "var(--muted)",
                          borderColor: "var(--border)",
                        }
                  }
                  title={`Step ${idx + 1}: ${step.stage} - ${step.title}`}
                >
                  {step.stage}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div
          className="p-4 rounded-xl border space-y-2 bg-red-500/10 border-red-500/30 text-red-400"
          role="alert"
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            <span>Execution Failed</span>
          </div>
          <p className="font-mono text-xs p-2.5 rounded bg-black/30 border border-red-500/20">
            {error}
          </p>
          <p className="text-xs opacity-80" style={{ color: "var(--muted)" }}>
            The database parser or catalog constraint manager rejected this statement. Verify identifiers and syntax against the active Database Schema.
          </p>
        </div>
      )}

      {/* Active Stage Deep Dive (Pic 2 Implementation) */}
      {current && (
        <div className="space-y-4">
          {/* Stage badge and Title */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span
                className="px-2.5 py-0.5 rounded text-xs font-mono font-bold border uppercase"
                style={{
                  background: "var(--surface-subtle)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
              >
                {current.stage}
              </span>
              <span className="text-xs font-mono opacity-70" style={{ color: "var(--muted)" }}>
                Step {activeStep + 1} of {steps.length}
              </span>
            </div>
            <h3
              className="text-lg md:text-xl font-bold tracking-tight"
              style={{ color: "var(--foreground)" }}
            >
              {current.title}
            </h3>
          </div>

          {/* Operation detail */}
          <div className="space-y-3">
            <p
              className="text-sm md:text-base leading-relaxed"
              style={{ color: "var(--foreground)" }}
            >
              {current.detail}
            </p>

            {/* Quote block matching Pic 2 */}
            <div
              className="p-4 rounded-xl border text-xs md:text-sm leading-relaxed shadow-2xs"
              style={{
                background: "var(--surface-subtle)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            >
              <p className="italic opacity-90">{activeNote}</p>
            </div>

            {/* Working rows badge matching Pic 2 */}
            <div
              className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border font-mono text-xs"
              style={{
                background: "var(--panel)",
                borderColor: "var(--border)",
              }}
            >
              <div>
                Working rows after this stage:{" "}
                <strong
                  className="text-sm font-bold"
                  style={{ color: "var(--accent)" }}
                >
                  {current.rowCount}
                </strong>
                {prevStep && (
                  <span className="opacity-70 ml-2">
                    (was {prevStep.rowCount} in {prevStep.stage})
                  </span>
                )}
              </div>
              {reductionPct !== null && reductionPct !== 0 && (
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                    reductionPct > 0
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-blue-500/10 border-blue-500/30 text-blue-400"
                  }`}
                >
                  {reductionPct > 0
                    ? `-${reductionPct}% rows filtered`
                    : `+${Math.abs(reductionPct)}% rows expanded`}
                </span>
              )}
            </div>
          </div>

          {/* Relational Algebra & Semantics */}
          <div
            className="p-4 rounded-xl border space-y-2.5"
            style={{
              background: "var(--surface-subtle)",
              borderColor: "var(--border)",
            }}
          >
            <div className="flex items-center justify-between">
              <h4
                className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]"
              >
                Relational Algebra Equivalence
              </h4>
              <span className="text-[11px] font-mono opacity-70" style={{ color: "var(--muted)" }}>
                First-Order Predicate Logic
              </span>
            </div>
            <pre
              className="p-3 rounded-lg font-mono text-sm font-semibold border overflow-x-auto"
              style={{
                background: "var(--panel)",
                borderColor: "var(--border)",
                color: "var(--accent)",
              }}
            >
              {algebraForStage(current.stage, command)}
            </pre>
          </div>

          {/* Comprehensive Complexity & Disk I/O Breakdown */}
          <div
            className="p-4 rounded-xl border space-y-3.5"
            style={{
              background: "var(--surface-subtle)",
              borderColor: "var(--border)",
            }}
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4
                className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]"
              >
                Computational Complexity &amp; Physical Access Path
              </h4>
              <button
                type="button"
                onClick={() => setSelectedComplexityDetail((prev) => !prev)}
                className="text-[11px] underline opacity-80 hover:opacity-100 cursor-pointer"
                style={{ color: "var(--accent)" }}
              >
                {selectedComplexityDetail ? "Hide Details" : "Learn More About Engine Costs"}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
              <div
                className="p-2.5 rounded-lg border space-y-1"
                style={{ background: "var(--panel)", borderColor: "var(--border)" }}
              >
                <span className="opacity-70 text-[10px] uppercase block">Best Time</span>
                <span className="font-bold text-emerald-400">{activeComplexity.timeBest}</span>
              </div>
              <div
                className="p-2.5 rounded-lg border space-y-1"
                style={{ background: "var(--panel)", borderColor: "var(--border)" }}
              >
                <span className="opacity-70 text-[10px] uppercase block">Average Time</span>
                <span className="font-bold text-amber-400">{activeComplexity.timeAvg}</span>
              </div>
              <div
                className="p-2.5 rounded-lg border space-y-1"
                style={{ background: "var(--panel)", borderColor: "var(--border)" }}
              >
                <span className="opacity-70 text-[10px] uppercase block">Worst Time</span>
                <span className="font-bold text-rose-400">{activeComplexity.timeWorst}</span>
              </div>
              <div
                className="p-2.5 rounded-lg border space-y-1"
                style={{ background: "var(--panel)", borderColor: "var(--border)" }}
              >
                <span className="opacity-70 text-[10px] uppercase block">Buffer Space</span>
                <span className="font-bold text-sky-400">{activeComplexity.space}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs opacity-90">
              <p>
                <strong>Execution Algorithm:</strong> {activeComplexity.model}
              </p>
              <p>
                <strong>Disk I/O &amp; Slotted Page Model:</strong> {activeComplexity.diskIo}
              </p>
            </div>

            {selectedComplexityDetail && (
              <div
                className="p-3 rounded-lg border text-xs space-y-2 mt-2"
                style={{
                  background: "var(--panel)",
                  borderColor: "var(--border)",
                }}
              >
                <h5 className="font-bold text-[var(--foreground)]">
                  DBMS Cost-Based Optimizer (CBO) Principles:
                </h5>
                <p className="opacity-85 leading-relaxed">
                  The query optimizer estimates total cost as{" "}
                  <code className="font-mono text-xs bg-[var(--surface-subtle)] px-1 py-0.5 rounded">
                    Cost = (Disk Page Reads × 1.0) + (Tuple CPU Evaluations × 0.01)
                  </code>
                  . When predicates can be satisfied using an Index (B+Tree / Hash), complexity drops from $O(N)$ sequential scan to $O(\log N)$ or $O(1)$.
                </p>
              </div>
            )}
          </div>

          {/* Current Working Columns and Cardinality */}
          {current.columns && current.columns.length > 0 && (
            <div
              className="p-4 rounded-xl border space-y-2"
              style={{
                background: "var(--surface-subtle)",
                borderColor: "var(--border)",
              }}
            >
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                Active Relation Attributes in Memory ({current.columns.length} columns)
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {current.columns.map((col) => (
                  <span
                    key={col}
                    className="font-mono text-xs px-2 py-0.5 rounded border"
                    style={{
                      background: "var(--panel)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                    }}
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* When no query has been executed yet */}
      {!current && !error && (
        <div className="space-y-5 text-xs md:text-sm">
          <div
            className="p-4 rounded-xl border space-y-2.5"
            style={{
              background: "var(--surface-subtle)",
              borderColor: "var(--border)",
            }}
          >
            <h3 className="font-bold text-sm md:text-base" style={{ color: "var(--foreground)" }}>
              Awaiting Query Execution
            </h3>
            <p className="opacity-90 leading-relaxed">
              Run any SQL statement (or ask in Natural Language) to inspect its live relational algebra pipeline, disk scan model, Big-O computational complexity, and operator-by-operator memory transitions right here.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div
              className="p-3.5 rounded-lg border space-y-2"
              style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}
            >
              <h4 className="font-bold text-xs md:text-sm text-[var(--accent)]">
                1. DQL Execution
              </h4>
              <p className="text-xs opacity-80">
                Visualizes FROM table page scans, JOIN hash probes, WHERE boolean selections, GROUP BY hash buckets, and SELECT projections.
              </p>
            </div>
            <div
              className="p-3.5 rounded-lg border space-y-2"
              style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}
            >
              <h4 className="font-bold text-xs md:text-sm text-[var(--accent)]">
                2. DML Execution
              </h4>
              <p className="text-xs opacity-80">
                Inspects Primary Key integrity assertions, Foreign Key referential constraints, tuple buffer page mutations, and WAL commits.
              </p>
            </div>
            <div
              className="p-3.5 rounded-lg border space-y-2"
              style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}
            >
              <h4 className="font-bold text-xs md:text-sm text-[var(--accent)]">
                3. DDL Execution
              </h4>
              <p className="text-xs opacity-80">
                Examines system catalog metadata registration, table descriptor allocation, and column data type bounds.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
