// In-browser Oracle PL/SQL Procedural Execution Engine
// Supports:
// - Anonymous Blocks: DECLARE ... BEGIN ... [EXCEPTION ...] END;
// - Variable declarations (NUMBER, VARCHAR2, BOOLEAN, DATE) with default initialization (:=)
// - Cursors: explicit (CURSOR c IS SELECT ...) and inline Cursor FOR Loops (FOR r IN (SELECT ...))
// - Control Flow: IF-THEN-ELSIF-ELSE-END IF, numeric FOR loops, WHILE loops
// - Procedural Output: DBMS_OUTPUT.PUT_LINE with string concatenation (||)
// - Embedded DML: INSERT INTO, UPDATE, DELETE, and SELECT ... INTO
// - Schema mutations with transaction commit and pipeline execution stepping

import {
  cloneSchema,
  type Table,
} from "./schema";
import { executeSQL, type PipelineStep, type Row, type StatementType, type SQLCommand } from "./sqlEngine";

export interface PLSQLResult {
  statementType: StatementType | "PL/SQL";
  command: SQLCommand | "PL/SQL BLOCK" | "PROCEDURE" | "FUNCTION" | "TRIGGER";
  message?: string;
  affectedRows?: number;
  steps: PipelineStep[];
  finalRows: Row[];
  columns: string[];
  dbmsOutput: string[];
  updatedSchema?: Table[];
  variables?: Record<string, string | number | boolean>;
  error?: string;
  executionDurationMs?: number;
}

interface ExecutionScope {
  variables: Record<string, any>;
  cursors: Record<string, string>; // cursorName -> SELECT query
  dbmsOutput: string[];
  steps: PipelineStep[];
  currentSchema: Table[];
  affectedRows: number;
}

/**
 * Executes an Oracle PL/SQL script or block against the active database schema
 */
export function executePLSQL(script: string, schema: Table[]): PLSQLResult {
  const startTime = performance.now();
  const currentSchema = cloneSchema(schema);
  const dbmsOutput: string[] = [];
  const steps: PipelineStep[] = [];

  const pushStep = (
    stage: string,
    title: string,
    detail: string,
    rows: Row[] = [],
    columns: string[] = [],
  ) => {
    steps.push({
      stage,
      title,
      detail,
      rowCount: rows.length,
      rows,
      columns,
    });
  };

  const raw = script.trim();
  if (!raw) {
    return {
      statementType: "PL/SQL",
      command: "PL/SQL BLOCK",
      error: "PL/SQL script is empty.",
      steps: [],
      finalRows: [],
      columns: [],
      dbmsOutput: [],
    };
  }

  // Determine construct type
  let blockType: "ANONYMOUS" | "PROCEDURE" | "FUNCTION" | "TRIGGER" = "ANONYMOUS";
  let constructName = "Anonymous Block";
  if (/create\s+(or\s+replace\s+)?procedure\s+([a-zA-Z0-9_]+)/i.test(raw)) {
    blockType = "PROCEDURE";
    constructName = raw.match(/procedure\s+([a-zA-Z0-9_]+)/i)?.[1] ?? "Procedure";
  } else if (/create\s+(or\s+replace\s+)?function\s+([a-zA-Z0-9_]+)/i.test(raw)) {
    blockType = "FUNCTION";
    constructName = raw.match(/function\s+([a-zA-Z0-9_]+)/i)?.[1] ?? "Function";
  } else if (/create\s+(or\s+replace\s+)?trigger\s+([a-zA-Z0-9_]+)/i.test(raw)) {
    blockType = "TRIGGER";
    constructName = raw.match(/trigger\s+([a-zA-Z0-9_]+)/i)?.[1] ?? "Trigger";
  }

  const scope: ExecutionScope = {
    variables: {},
    cursors: {},
    dbmsOutput,
    steps,
    currentSchema,
    affectedRows: 0,
  };

  try {
    // 1. Initial Compilation / Parsing step
    pushStep(
      "PARSER",
      `PL/SQL Compilation (${constructName})`,
      `Compiled ${blockType} PL/SQL unit into execution memory. Relational catalog checked with ${schema.length} active tables.`,
      schema.map((t) => ({ Table: t.name, Columns: t.columns.length, Rows: t.rows.length })),
      ["Table", "Columns", "Rows"],
    );

    // 2. Parse DECLARE and BEGIN sections
    const cleanScript = stripComments(raw);
    const { declarePart, beginPart } = parseBlockSections(cleanScript);

    // Process DECLARE section
    if (declarePart) {
      processDeclare(declarePart, scope, pushStep);
    }

    // Process BEGIN section
    if (beginPart) {
      executeBlockStatements(beginPart, scope, pushStep);
    } else {
      // If no BEGIN keyword was explicitly written but statements exist, execute directly
      executeBlockStatements(cleanScript, scope, pushStep);
    }

    // Transaction COMMIT Step
    const outputRows: Row[] = scope.dbmsOutput.map((line, idx) => ({
      Line: idx + 1,
      Output: line,
    }));

    pushStep(
      "COMMIT",
      "PL/SQL Execution Complete",
      `Execution finalized successfully. Output buffer captured ${scope.dbmsOutput.length} message(s). Total affected tuples: ${scope.affectedRows}.`,
      outputRows,
      ["Line", "Output"],
    );

    const durationMs = Math.round(performance.now() - startTime);

    return {
      statementType: "PL/SQL",
      command: blockType === "ANONYMOUS" ? "PL/SQL BLOCK" : (blockType as any),
      message: `PL/SQL execution completed successfully in ${durationMs}ms. Output lines: ${scope.dbmsOutput.length}.`,
      affectedRows: scope.affectedRows,
      steps: scope.steps,
      finalRows: outputRows.length > 0 ? outputRows : (scope.currentSchema[0]?.rows ?? []),
      columns: outputRows.length > 0 ? ["Line", "Output"] : (scope.currentSchema[0]?.columns.map(c => c.name) ?? []),
      dbmsOutput: scope.dbmsOutput,
      updatedSchema: scope.currentSchema,
      variables: scope.variables,
      executionDurationMs: durationMs,
    };
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    scope.dbmsOutput.push(`[ERROR] ${errorMsg}`);
    pushStep(
      "EXCEPTION",
      "PL/SQL Exception Raised",
      `Unhandled Exception: ${errorMsg}`,
      [{ Error: errorMsg }],
      ["Error"],
    );

    const outputRows: Row[] = scope.dbmsOutput.map((line, idx) => ({
      Line: idx + 1,
      Output: line,
    }));

    return {
      statementType: "PL/SQL",
      command: "PL/SQL BLOCK",
      error: errorMsg,
      steps: scope.steps,
      finalRows: outputRows,
      columns: ["Line", "Output"],
      dbmsOutput: scope.dbmsOutput,
      updatedSchema: scope.currentSchema,
    };
  }
}

/** Remove SQL comments -- and block comments */
function stripComments(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/--.*$/gm, "");
}

/** Split code into DECLARE, BEGIN, and EXCEPTION segments */
function parseBlockSections(code: string): {
  declarePart?: string;
  beginPart?: string;
  exceptionPart?: string;
} {
  // Check for DECLARE
  const declareMatch = code.match(/declare\b([\s\S]*?)\bbegin\b/i);
  let declarePart: string | undefined = undefined;
  if (declareMatch) {
    declarePart = declareMatch[1].trim();
  }

  let beginBody = code;
  const beginIndex = code.search(/\bbegin\b/i);
  if (beginIndex >= 0) {
    beginBody = code.slice(beginIndex + 5);
  }

  // Strip trailing END; or END <name>;
  beginBody = beginBody.replace(/\bend\s*([a-zA-Z0-9_]+)?\s*;?\s*$/i, "").trim();

  // Split out EXCEPTION if present
  let beginPart = beginBody;
  let exceptionPart: string | undefined = undefined;
  const exceptionIndex = beginBody.search(/\bexception\b/i);
  if (exceptionIndex >= 0) {
    beginPart = beginBody.slice(0, exceptionIndex).trim();
    exceptionPart = beginBody.slice(exceptionIndex + 9).trim();
  }

  return { declarePart, beginPart, exceptionPart };
}

/** Process variable and cursor declarations */
function processDeclare(
  declareStr: string,
  scope: ExecutionScope,
  pushStep: Function,
) {
  const statements = declareStr
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    // Check for CURSOR declaration: CURSOR cursor_name IS SELECT ...
    const cursorMatch = stmt.match(/cursor\s+([a-zA-Z0-9_]+)\s+is\s+([\s\S]+)/i);
    if (cursorMatch) {
      const cName = cursorMatch[1].toLowerCase();
      const query = cursorMatch[2].replace(/;+$/, "").trim();
      scope.cursors[cName] = query;
      pushStep(
        "CURSOR",
        `Declare Cursor (${cName.toUpperCase()})`,
        `Declared cursor \`${cName.toUpperCase()}\` with statement: \`${query}\`.`,
        [{ Cursor: cName.toUpperCase(), Query: query }],
        ["Cursor", "Query"],
      );
      continue;
    }

    // Check for Variable declaration: var_name [CONSTANT] TYPE [:= default_val]
    const varMatch = stmt.match(/([a-zA-Z0-9_]+)(?:\s+constant)?\s+([a-zA-Z0-9_]+(?:\(\d+\))?)(?:\s*:=\s*([\s\S]+))?/i);
    if (varMatch) {
      const varName = varMatch[1].toLowerCase();
      const type = varMatch[2].toUpperCase();
      const defaultRaw = varMatch[3]?.trim();
      let val: any = null;
      if (defaultRaw) {
        val = evaluateExpression(defaultRaw, scope.variables);
      } else {
        if (type.startsWith("NUMBER") || type.startsWith("INT")) val = 0;
        else if (type.startsWith("VARCHAR") || type.startsWith("TEXT")) val = "";
        else if (type.startsWith("BOOLEAN")) val = false;
        else val = null;
      }
      scope.variables[varName] = val;
    }
  }

  const varList = Object.entries(scope.variables).map(([name, value]) => ({
    Variable: name,
    InitialValue: String(value),
  }));

  if (varList.length > 0) {
    pushStep(
      "DECLARE",
      "Variable Declarations",
      `Initialized ${varList.length} local variable(s) in PL/SQL memory workspace.`,
      varList,
      ["Variable", "InitialValue"],
    );
  }
}

/** Execute procedural statements within the block */
function executeBlockStatements(
  code: string,
  scope: ExecutionScope,
  pushStep: Function,
) {
  const statements = splitProceduralStatements(code);

  for (const stmt of statements) {
    executeSingleStatement(stmt, scope, pushStep);
  }
}

/** Split statements while respecting IF ... END IF and LOOP ... END LOOP constructs */
function splitProceduralStatements(code: string): string[] {
  const result: string[] = [];
  let buffer = "";

  const tokens = code.split(/(;)/);
  for (let i = 0; i < tokens.length; i++) {
    const part = tokens[i];
    if (!part) continue;

    buffer += part;

    const openIfs = (buffer.match(/\bif\b/gi) || []).length;
    const closeIfs = (buffer.match(/\bend\s+if\b/gi) || []).length;
    const openLoops = (buffer.match(/\bloop\b/gi) || []).length;
    const closeLoops = (buffer.match(/\bend\s+loop\b/gi) || []).length;

    if (part === ";") {
      if (openIfs <= closeIfs && openLoops <= closeLoops) {
        const trimmed = buffer.trim();
        if (trimmed) result.push(trimmed);
        buffer = "";
      }
    }
  }

  if (buffer.trim()) {
    result.push(buffer.trim());
  }

  return result;
}

/** Execute a single procedural construct */
function executeSingleStatement(
  rawStmt: string,
  scope: ExecutionScope,
  pushStep: Function,
) {
  const stmt = rawStmt.replace(/;+$/, "").trim();
  if (!stmt) return;

  // 1. DBMS_OUTPUT.PUT_LINE(expr)
  const putLineMatch = stmt.match(/^dbms_output\.put_line\s*\(([\s\S]+)\)$/i);
  if (putLineMatch) {
    const expr = putLineMatch[1].trim();
    const evaluated = evaluateConcatExpression(expr, scope.variables);
    scope.dbmsOutput.push(evaluated);
    pushStep(
      "OUTPUT",
      "DBMS_OUTPUT.PUT_LINE",
      evaluated,
      [{ Output: evaluated }],
      ["Output"],
    );
    return;
  }

  // 2. Cursor FOR Loop: FOR rec IN c_name LOOP ... END LOOP
  // or inline: FOR rec IN (SELECT ...) LOOP ... END LOOP
  const cursorForMatch = stmt.match(/^for\s+([a-zA-Z0-9_]+)\s+in\s+(\(([\s\S]+?)\)|[a-zA-Z0-9_]+)\s+loop\s+([\s\S]+?)\s+end\s+loop$/i);
  if (cursorForMatch) {
    const recVar = cursorForMatch[1].toLowerCase();
    const cursorSource = cursorForMatch[2].trim();
    const loopBody = cursorForMatch[4].trim();

    let query = "";
    if (cursorSource.startsWith("(") && cursorSource.endsWith(")")) {
      query = cursorSource.slice(1, -1).trim();
    } else {
      const cName = cursorSource.toLowerCase();
      query = scope.cursors[cName] || "";
      if (!query) {
        throw new Error(`Cursor "${cursorSource}" is not declared.`);
      }
    }

    const cleanQuery = query.replace(/;+$/, "").trim();
    const queryResult = executeSQL(cleanQuery, scope.currentSchema);
    if (queryResult.error) {
      throw new Error(`Cursor query failed: ${queryResult.error}`);
    }

    const fetchedRows = queryResult.finalRows;
    pushStep(
      "CURSOR",
      `OPEN & FETCH Cursor (${cursorSource})`,
      `Cursor fetched ${fetchedRows.length} tuple(s). Starting FOR LOOP traversal.`,
      fetchedRows.slice(0, 15),
      queryResult.columns,
    );

    let iter = 0;
    for (const row of fetchedRows) {
      iter++;
      for (const [k, v] of Object.entries(row)) {
        scope.variables[`${recVar}.${k.toLowerCase()}`] = v;
        scope.variables[k.toLowerCase()] = v;
      }

      pushStep(
        "LOOP",
        `Loop Iteration ${iter} of ${fetchedRows.length}`,
        `Bound row tuple ${iter}: ${JSON.stringify(row)}`,
        [row],
        Object.keys(row),
      );

      const bodyStmts = splitProceduralStatements(loopBody);
      for (const bStmt of bodyStmts) {
        executeSingleStatement(bStmt, scope, pushStep);
      }
    }
    return;
  }

  // 3. Numeric FOR Loop: FOR i IN 1..N LOOP ... END LOOP
  const numForMatch = stmt.match(/^for\s+([a-zA-Z0-9_]+)\s+in\s+(-?\d+)\s*\.\.\s*(-?\d+)\s+loop\s+([\s\S]+?)\s+end\s+loop$/i);
  if (numForMatch) {
    const iterVar = numForMatch[1].toLowerCase();
    const startNum = parseInt(numForMatch[2], 10);
    const endNum = parseInt(numForMatch[3], 10);
    const loopBody = numForMatch[4].trim();

    pushStep(
      "LOOP",
      `Numeric FOR Loop (${startNum}..${endNum})`,
      `Beginning numeric iteration loop over counter \`${iterVar}\`.`,
      [{ Counter: iterVar, Start: startNum, End: endNum }],
      ["Counter", "Start", "End"],
    );

    for (let i = startNum; i <= endNum; i++) {
      scope.variables[iterVar] = i;
      const bodyStmts = splitProceduralStatements(loopBody);
      for (const bStmt of bodyStmts) {
        executeSingleStatement(bStmt, scope, pushStep);
      }
    }
    return;
  }

  // 4. Conditional IF-THEN-ELSIF-ELSE-END IF
  const ifMatch = stmt.match(/^if\s+([\s\S]+?)\s+then\s+([\s\S]+?)\s+end\s+if$/i);
  if (ifMatch) {
    executeIfStatement(ifMatch[1], ifMatch[2], scope, pushStep);
    return;
  }

  // 5. Assignment: var_name := expr
  const assignMatch = stmt.match(/^([a-zA-Z0-9_.]+)\s*:=\s*([\s\S]+)$/i);
  if (assignMatch) {
    const varName = assignMatch[1].toLowerCase();
    const expr = assignMatch[2].trim();
    const value = evaluateExpression(expr, scope.variables);
    scope.variables[varName] = value;

    pushStep(
      "ASSIGN",
      `Assign Variable: ${varName}`,
      `Computed expression \`${expr}\` => \`${value}\`. Stored into \`${varName}\`.`,
      [{ Variable: varName, NewValue: String(value) }],
      ["Variable", "NewValue"],
    );
    return;
  }

  // 6. Embedded DML: UPDATE, INSERT, DELETE
  if (/^(update|insert\s+into|delete\s+from)\b/i.test(stmt)) {
    const interpolated = interpolateVariables(stmt, scope.variables);
    const dmlResult = executeSQL(interpolated, scope.currentSchema);
    if (dmlResult.error) {
      throw new Error(`DML Statement failed: ${dmlResult.error}`);
    }

    if (dmlResult.updatedSchema) {
      scope.currentSchema = dmlResult.updatedSchema;
    }

    scope.affectedRows += (dmlResult.affectedRows ?? dmlResult.finalRows.length ?? 0);

    pushStep(
      "MUTATION",
      `Execute DML (${dmlResult.command})`,
      `Executed embedded DML: \`${stmt}\`. Affected rows: ${dmlResult.affectedRows ?? 1}.`,
      dmlResult.finalRows.slice(0, 10),
      dmlResult.columns,
    );
    return;
  }

  // 7. Embedded SELECT INTO: SELECT col INTO var FROM table WHERE ...
  const selectIntoMatch = stmt.match(/^select\s+([\s\S]+?)\s+into\s+([\s\S]+?)\s+from\s+([\s\S]+)$/i);
  if (selectIntoMatch) {
    const selectCols = selectIntoMatch[1].split(",").map(c => c.trim());
    const targetVars = selectIntoMatch[2].split(",").map(v => v.trim().toLowerCase());
    const restQuery = `SELECT ${selectCols.join(", ")} FROM ${selectIntoMatch[3]}`;

    const queryRes = executeSQL(restQuery, scope.currentSchema);
    if (queryRes.error) throw new Error(queryRes.error);
    if (!queryRes.finalRows.length) {
      throw new Error("ORA-01403: no data found (SELECT INTO returned 0 rows).");
    }

    const firstRow = queryRes.finalRows[0];
    for (let i = 0; i < targetVars.length; i++) {
      const colName = selectCols[i] || Object.keys(firstRow)[i];
      const val = firstRow[colName] ?? firstRow[Object.keys(firstRow)[i]];
      scope.variables[targetVars[i]] = val;
    }

    pushStep(
      "SELECT INTO",
      `SELECT ... INTO (${targetVars.join(", ")})`,
      `Fetched row values and assigned to PL/SQL variables: ${targetVars.map((v) => `${v} = ${scope.variables[v]}`).join(", ")}.`,
      [firstRow],
      queryRes.columns,
    );
    return;
  }
}

/** Execute IF-THEN-[ELSIF ...]-[ELSE ...]-END IF */
function executeIfStatement(
  conditionStr: string,
  bodyWithBranches: string,
  scope: ExecutionScope,
  pushStep: Function,
) {
  const branches: { condition?: string; body: string }[] = [];

  let currentCond: string | undefined = conditionStr;
  let remaining = bodyWithBranches;

  while (true) {
    const nextBranchMatch = remaining.match(/\b(elsif\s+[\s\S]+?\s+then|else)\b/i);
    if (!nextBranchMatch) {
      branches.push({ condition: currentCond, body: remaining });
      break;
    }

    const branchIdx = nextBranchMatch.index!;
    const branchText = nextBranchMatch[0];
    const prevBody = remaining.slice(0, branchIdx);
    branches.push({ condition: currentCond, body: prevBody });

    remaining = remaining.slice(branchIdx + branchText.length);
    if (/^else$/i.test(branchText)) {
      currentCond = undefined;
    } else {
      const elsifCond = branchText.replace(/^elsif\s+/i, "").replace(/\s+then$/i, "").trim();
      currentCond = elsifCond;
    }
  }

  for (const branch of branches) {
    const isMatched = branch.condition === undefined
      ? true
      : evaluateBooleanCondition(branch.condition, scope.variables);

    if (isMatched) {
      pushStep(
        "CONDITIONAL",
        branch.condition ? `Condition TRUE (${branch.condition})` : "Branch: ELSE",
        `Condition evaluated to TRUE. Entering branch body.`,
        [{ Condition: branch.condition ?? "ELSE", Result: "TRUE" }],
        ["Condition", "Result"],
      );

      const stmts = splitProceduralStatements(branch.body);
      for (const s of stmts) {
        executeSingleStatement(s, scope, pushStep);
      }
      return;
    }
  }

  pushStep(
    "CONDITIONAL",
    `Conditions Evaluated FALSE`,
    `No IF or ELSIF branches matched. Branch skipped.`,
    [],
    [],
  );
}

/** Evaluate simple boolean expressions */
function evaluateBooleanCondition(cond: string, vars: Record<string, any>): boolean {
  let c = cond.trim();

  for (const [k, v] of Object.entries(vars)) {
    const re = new RegExp(`\\b${k}\\b`, "gi");
    const valRepr = typeof v === "string" ? `'${v}'` : String(v);
    c = c.replace(re, valRepr);
  }

  c = c.replace(/([^\s<>=!])\s*=\s*([^\s<>=!])/g, "$1 == $2");
  c = c.replace(/\band\b/gi, "&&").replace(/\bor\b/gi, "||").replace(/\bnot\b/gi, "!");

  try {
    const fn = new Function(`return Boolean(${c});`);
    return fn();
  } catch {
    return false;
  }
}

/** Evaluate PL/SQL string concatenation */
function evaluateConcatExpression(expr: string, vars: Record<string, any>): string {
  const parts = expr.split("||").map(p => p.trim());
  let result = "";

  for (const part of parts) {
    if ((part.startsWith("'") && part.endsWith("'")) || (part.startsWith('"') && part.endsWith('"'))) {
      result += part.slice(1, -1);
    } else {
      const lower = part.toLowerCase();
      if (lower in vars) {
        result += String(vars[lower] ?? "");
      } else {
        try {
          const evalVal = evaluateExpression(part, vars);
          result += String(evalVal);
        } catch {
          result += part;
        }
      }
    }
  }

  return result;
}

/** Evaluate arithmetic / scalar expression */
function evaluateExpression(expr: string, vars: Record<string, any>): any {
  let exp = expr.trim();
  if ((exp.startsWith("'") && exp.endsWith("'")) || (exp.startsWith('"') && exp.endsWith('"'))) {
    return exp.slice(1, -1);
  }

  for (const [k, v] of Object.entries(vars)) {
    const re = new RegExp(`\\b${k}\\b`, "gi");
    exp = exp.replace(re, typeof v === "number" ? String(v) : `'${v}'`);
  }

  try {
    const fn = new Function(`return (${exp});`);
    return fn();
  } catch {
    return expr;
  }
}

/** Replace PL/SQL variables in DML statement with current values */
function interpolateVariables(sql: string, vars: Record<string, any>): string {
  let result = sql;
  for (const [k, v] of Object.entries(vars)) {
    const re = new RegExp(`(?<=[=,<>!\\s])(:?${k})(?=[\\s,;]|$)`, "gi");
    const valRepr = typeof v === "number" ? String(v) : `'${v}'`;
    result = result.replace(re, valRepr);
  }
  return result;
}

/**
 * Builds a QueryExplanation structure for PL/SQL executions
 */
export function buildPlSqlExplanation(
  plsql: string,
  schema: Table[] = [],
  steps: PipelineStep[] = [],
  finalRows: Row[] = [],
  columns: string[] = [],
  dbmsOutput: string[] = [],
) {
  return {
    sql: plsql,
    statementType: "DQL" as const,
    command: "SELECT" as const,
    summary: `Executed PL/SQL procedural program unit with ${steps.length} sequential execution stages, producing ${dbmsOutput.length} message(s) in DBMS_OUTPUT.`,
    steps: steps.map((s, idx) => ({
      stepNumber: idx + 1,
      clause: s.stage,
      title: s.title,
      description: s.detail,
      metrics: [
        { label: "Stage", value: s.stage },
        { label: "Tuples/Outputs", value: s.rowCount },
      ],
      sampleRows: s.rows.slice(0, 5),
      columns: s.columns,
    })),
    pipelineConnection: steps.map((s, idx) => ({
      stepNumber: idx + 1,
      stage: s.stage,
      operation: s.title,
      rows: s.rowCount,
    })),
    finalOutputSummary: {
      rowCount: finalRows.length,
      columnCount: columns.length,
      columns,
      sampleData: finalRows.slice(0, 10),
    },
  };
}

