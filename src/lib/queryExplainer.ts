import type { Table } from "./schema";
import type { PipelineStep, Row, StatementType, SQLCommand } from "./sqlEngine";

export interface ExplanationStep {
  stepNumber: number;
  clause: string;
  title: string;
  description: string;
  metrics: {
    label: string;
    value: string | number;
  }[];
  sampleRows?: Row[];
  columns?: string[];
}

export interface QueryExplanation {
  sql: string;
  statementType: StatementType;
  command?: SQLCommand;
  summary: string;
  steps: ExplanationStep[];
  pipelineConnection: {
    stepNumber: number;
    stage: string;
    operation: string;
    rows: number;
  }[];
  finalOutputSummary: {
    rowCount: number;
    columnCount: number;
    columns: string[];
    sampleData: Row[];
  };
}

/**
 * Builds a dynamic, comprehensive query explanation using real execution data and schema rows.
 */
export function buildQueryExplanation(
  sql: string,
  schema: Table[] = [],
  pipelineSteps: PipelineStep[] = [],
  finalRows: Row[] = [],
  columns: string[] = [],
  statementType: StatementType = "DQL",
  command: SQLCommand = "SELECT",
): QueryExplanation {
  const steps: ExplanationStep[] = [];
  let stepIndex = 1;

  // Extract from pipeline steps
  const fromStep = pipelineSteps.find((s) => s.stage === "FROM");
  const joinStep = pipelineSteps.find((s) => s.stage === "JOIN");
  const whereStep = pipelineSteps.find((s) => s.stage === "WHERE");
  const groupStep = pipelineSteps.find((s) => s.stage === "GROUP BY");
  const havingStep = pipelineSteps.find((s) => s.stage === "HAVING");
  const aggStep = pipelineSteps.find((s) => s.stage === "AGGREGATE");
  const distinctStep = pipelineSteps.find((s) => s.stage === "DISTINCT");
  const orderStep = pipelineSteps.find((s) => s.stage === "ORDER BY");
  const limitStep = pipelineSteps.find((s) => s.stage === "LIMIT");
  const selectStep = pipelineSteps.find((s) => s.stage === "SELECT");
  const mutationStep = pipelineSteps.find((s) => s.stage === "MUTATION" || s.stage === "SCHEMA");

  // DDL / DML Special Handling
  if (statementType !== "DQL" || command !== "SELECT") {
    const actionDesc = mutationStep ? mutationStep.detail : `Executed ${command} operation on database catalog.`;
    steps.push({
      stepNumber: stepIndex++,
      clause: command,
      title: `${command} Operation`,
      description: actionDesc,
      metrics: [
        { label: "Operation", value: command },
        { label: "Statement Type", value: statementType },
        { label: "Status", value: "Applied to Active Schema Buffer" },
      ],
      sampleRows: mutationStep?.rows.slice(0, 5),
      columns: mutationStep?.columns,
    });

    return {
      sql,
      statementType,
      command,
      summary: `The database engine processed a ${statementType} (${command}) command to modify table definitions or records.`,
      steps,
      pipelineConnection: pipelineSteps.map((s, idx) => ({
        stepNumber: idx + 1,
        stage: s.stage,
        operation: s.detail,
        rows: s.rowCount,
      })),
      finalOutputSummary: {
        rowCount: finalRows.length,
        columnCount: columns.length,
        columns,
        sampleData: finalRows.slice(0, 5),
      },
    };
  }

  // 1. FROM Step
  if (fromStep) {
    const tableName = fromStep.title.replace(/^(?:FROM|Scan)\s+/i, "").trim() || "relations";
    const initialCount = fromStep.rowCount;
    steps.push({
      stepNumber: stepIndex++,
      clause: "FROM",
      title: `Scan Base Relation: ${tableName}`,
      description: `Loads all initial tuples from table "${tableName}". The database begins query evaluation by accessing the base data from the buffer pool.`,
      metrics: [
        { label: "Source Table", value: tableName },
        { label: "Rows Initially Available", value: initialCount },
      ],
      sampleRows: fromStep.rows.slice(0, 5),
      columns: fromStep.columns,
    });
  }

  // 2. JOIN Step
  if (joinStep) {
    const prevRows = fromStep ? fromStep.rowCount : joinStep.rowCount;
    steps.push({
      stepNumber: stepIndex++,
      clause: "JOIN",
      title: `Relational Join Execution`,
      description: joinStep.detail || "Matches tuples across relations based on equality constraints (Foreign Key = Primary Key).",
      metrics: [
        { label: "Input Row Count", value: prevRows },
        { label: "Joined Row Count", value: joinStep.rowCount },
      ],
      sampleRows: joinStep.rows.slice(0, 5),
      columns: joinStep.columns,
    });
  }

  // 3. WHERE Step
  if (whereStep) {
    const prevCount = joinStep ? joinStep.rowCount : fromStep ? fromStep.rowCount : whereStep.rowCount;
    const matchedCount = whereStep.rowCount;
    const removedCount = Math.max(0, prevCount - matchedCount);
    const conditionMatch = whereStep.title.replace(/^WHERE\s+/i, "") || "Boolean predicate";

    steps.push({
      stepNumber: stepIndex++,
      clause: "WHERE",
      title: `Filter Rows by Condition: ${conditionMatch}`,
      description: `Applies the boolean filter condition to each candidate tuple. Only tuples evaluating to TRUE survive this stage; non-matching tuples are discarded from the working memory buffer.`,
      metrics: [
        { label: "Condition", value: conditionMatch },
        { label: "Rows Before Filtering", value: prevCount },
        { label: "Rows Matching", value: matchedCount },
        { label: "Rows Filtered Out", value: removedCount },
      ],
      sampleRows: whereStep.rows.slice(0, 5),
      columns: whereStep.columns,
    });
  }

  // 4. GROUP BY Step
  if (groupStep) {
    steps.push({
      stepNumber: stepIndex++,
      clause: "GROUP BY",
      title: `Partitioning Relations into Groups`,
      description: groupStep.detail || "Groups rows sharing common partition key values for aggregate evaluations.",
      metrics: [
        { label: "Groups Formed", value: groupStep.rowCount },
      ],
      sampleRows: groupStep.rows.slice(0, 5),
      columns: groupStep.columns,
    });
  }

  // 5. HAVING Step
  if (havingStep) {
    steps.push({
      stepNumber: stepIndex++,
      clause: "HAVING",
      title: `Filter Aggregate Groups`,
      description: havingStep.detail || "Discards aggregated group rows that fail the group predicate condition.",
      metrics: [
        { label: "Surviving Groups", value: havingStep.rowCount },
      ],
      sampleRows: havingStep.rows.slice(0, 5),
      columns: havingStep.columns,
    });
  }

  // 6. DISTINCT Step
  if (distinctStep) {
    steps.push({
      stepNumber: stepIndex++,
      clause: "DISTINCT",
      title: `Eliminate Duplicate Tuples`,
      description: distinctStep.detail || "Filters out identical projected records to ensure relational set uniqueness.",
      metrics: [
        { label: "Unique Rows Retained", value: distinctStep.rowCount },
      ],
      sampleRows: distinctStep.rows.slice(0, 5),
      columns: distinctStep.columns,
    });
  }

  // 7. ORDER BY Step
  if (orderStep) {
    steps.push({
      stepNumber: stepIndex++,
      clause: "ORDER BY",
      title: `Sort Output Records`,
      description: orderStep.detail || "Sorts surviving rows according to specified attribute ordering criteria.",
      metrics: [
        { label: "Sorted Rows", value: orderStep.rowCount },
      ],
      sampleRows: orderStep.rows.slice(0, 5),
      columns: orderStep.columns,
    });
  }

  // 8. LIMIT Step
  if (limitStep) {
    steps.push({
      stepNumber: stepIndex++,
      clause: "LIMIT",
      title: `Truncate Result Set`,
      description: limitStep.detail || "Restricts the output relation to the maximum number of requested rows.",
      metrics: [
        { label: "Row Limit Applied", value: limitStep.rowCount },
      ],
      sampleRows: limitStep.rows.slice(0, 5),
      columns: limitStep.columns,
    });
  }

  // 9. SELECT (Projection) Step
  if (selectStep || columns.length > 0) {
    const projCols = columns.length > 0 ? columns : (selectStep ? selectStep.columns : []);
    const projRows = finalRows.length;
    steps.push({
      stepNumber: stepIndex++,
      clause: "SELECT",
      title: `Attribute Projection: ${projCols.join(", ")}`,
      description: `Performs the relational projection operation. Retains only the requested attribute columns (${projCols.join(", ")}) and discards all other internal working columns.`,
      metrics: [
        { label: "Selected Columns", value: projCols.join(", ") },
        { label: "Projected Matrix", value: `${projRows} rows × ${projCols.length} columns` },
      ],
      sampleRows: finalRows.slice(0, 5),
      columns: projCols,
    });
  }

  // 10. Final Output Step
  steps.push({
    stepNumber: stepIndex++,
    clause: "FINAL RESULT",
    title: `Produce Output Relation`,
    description: finalRows.length === 0
      ? "Query executed successfully, but 0 rows matched the specified filtering conditions."
      : `Delivers the final processed relation containing ${finalRows.length} tuple${finalRows.length !== 1 ? "s" : ""} across ${columns.length} attribute${columns.length !== 1 ? "s" : ""}.`,
    metrics: [
      { label: "Total Rows Returned", value: finalRows.length },
      { label: "Total Columns", value: columns.length },
      { label: "Attributes", value: columns.join(", ") },
    ],
    sampleRows: finalRows.slice(0, 10),
    columns,
  });

  // Pipeline Connection
  const pipelineConnection = pipelineSteps.map((p, idx) => ({
    stepNumber: idx + 1,
    stage: p.stage,
    operation: p.detail || p.title,
    rows: p.rowCount,
  }));

  const targetTbl = fromStep?.title.replace(/^(?:FROM|Scan)\s+/i, "").trim() || "relations";
  const summary = `Executed query "${sql.trim()}". Started with ${fromStep?.rowCount ?? 0} rows from ${targetTbl}, evaluated relational conditions, and returned ${finalRows.length} row${finalRows.length !== 1 ? "s" : ""}.`;

  return {
    sql,
    statementType,
    command,
    summary,
    steps,
    pipelineConnection,
    finalOutputSummary: {
      rowCount: finalRows.length,
      columnCount: columns.length,
      columns,
      sampleData: finalRows.slice(0, 10),
    },
  };
}
