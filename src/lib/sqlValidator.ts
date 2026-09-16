import type { Table } from "./schema";
import { validateSQLAgainstSchema } from "./sqlEngine";

export type ValidationStatus = "valid" | "incomplete" | "invalid" | "empty";

export interface SQLValidationResult {
  status: ValidationStatus;
  message: string;
  detail?: string;
}

const SQL_KEYWORDS = new Set([
  "SELECT", "FROM", "WHERE", "JOIN", "INNER", "LEFT", "RIGHT", "FULL", "OUTER",
  "ON", "GROUP", "BY", "HAVING", "ORDER", "ASC", "DESC", "LIMIT", "OFFSET",
  "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE", "CREATE", "TABLE",
  "ALTER", "DROP", "AND", "OR", "NOT", "IN", "IS", "NULL", "LIKE", "BETWEEN",
  "AS", "DISTINCT", "COUNT", "SUM", "AVG", "MIN", "MAX", "CASE", "WHEN", "THEN", "ELSE", "END"
]);

/**
 * Validates a SQL query string against the active database schema without executing it.
 */
export function validateSQL(rawSql: string, schema: Table[]): SQLValidationResult {
  const sql = rawSql.trim();
  if (!sql) {
    return { status: "empty", message: "" };
  }

  // Check for unclosed quotes
  let singleQuoteCount = 0;
  let doubleQuoteCount = 0;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (ch === "'" && (i === 0 || sql[i - 1] !== "\\")) singleQuoteCount++;
    if (ch === '"' && (i === 0 || sql[i - 1] !== "\\")) doubleQuoteCount++;
  }
  if (singleQuoteCount % 2 !== 0) {
    return {
      status: "incomplete",
      message: "Unclosed single quotation mark (')",
    };
  }
  if (doubleQuoteCount % 2 !== 0) {
    return {
      status: "incomplete",
      message: "Unclosed double quotation mark (\")",
    };
  }

  // Check for unclosed parentheses
  let parenDepth = 0;
  for (let i = 0; i < sql.length; i++) {
    if (sql[i] === "(") parenDepth++;
    if (sql[i] === ")") parenDepth--;
    if (parenDepth < 0) {
      return {
        status: "invalid",
        message: "Unexpected closing parenthesis ')'",
      };
    }
  }
  if (parenDepth > 0) {
    return {
      status: "incomplete",
      message: "Unclosed parenthesis '('",
    };
  }

  // Remove trailing semicolon for token analysis
  const normalized = sql.replace(/;+\s*$/, "");
  const tokens = normalized.split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    return { status: "empty", message: "" };
  }

  const firstToken = tokens[0].toUpperCase();
  const knownCommands = ["SELECT", "INSERT", "UPDATE", "DELETE", "CREATE", "ALTER", "DROP", "SHOW", "DESCRIBE"];
  if (!knownCommands.includes(firstToken)) {
    return {
      status: "invalid",
      message: `Invalid SQL command '${tokens[0]}'. Must start with SELECT, INSERT, UPDATE, DELETE, etc.`,
    };
  }

  // Check common trailing incomplete clauses
  const lastToken = tokens[tokens.length - 1].toUpperCase();
  const incompleteTrailing = [
    "SELECT", "FROM", "WHERE", "JOIN", "ON", "BY", "HAVING", "LIMIT",
    "SET", "INTO", "VALUES", "AND", "OR", "NOT", "LIKE", "IN",
    "=", "!=", "<>", ">", "<", ">=", "<=", ",", "AS"
  ];
  if (incompleteTrailing.includes(lastToken) || normalized.endsWith(",")) {
    return {
      status: "incomplete",
      message: `Incomplete clause: expecting identifier or expression after '${tokens[tokens.length - 1]}'`,
    };
  }

  // Specialized validation for SELECT queries
  if (firstToken === "SELECT") {
    const fromIndex = tokens.findIndex((t) => t.toUpperCase() === "FROM");
    if (fromIndex === -1) {
      return {
        status: "incomplete",
        message: "Incomplete query: missing FROM clause",
      };
    }

    if (fromIndex === tokens.length - 1) {
      return {
        status: "incomplete",
        message: "Incomplete query: expecting table name after FROM",
      };
    }

    // Extract table names (FROM table, JOIN table)
    const referencedTables: string[] = [];
    for (let i = 0; i < tokens.length; i++) {
      const tokUpper = tokens[i].toUpperCase();
      if ((tokUpper === "FROM" || tokUpper === "JOIN") && i + 1 < tokens.length) {
        const candidate = tokens[i + 1].replace(/[,;()]/g, "").trim();
        if (candidate && !SQL_KEYWORDS.has(candidate.toUpperCase())) {
          referencedTables.push(candidate);
        }
      }
    }

    // Validate table names against active schema
    const availableTableNames = schema.map((t) => t.name.toLowerCase());
    for (const tbl of referencedTables) {
      const tblLower = tbl.toLowerCase();
      if (!availableTableNames.includes(tblLower)) {
        return {
          status: "invalid",
          message: `Unknown table "${tbl}" in selected dataset`,
          detail: `Available tables: ${schema.map((t) => t.name).join(", ")}`,
        };
      }
    }

    // If tables are valid, validate referenced columns where feasible
    const targetTables = schema.filter((t) =>
      referencedTables.some((rt) => rt.toLowerCase() === t.name.toLowerCase()),
    );
    const availableColumns = new Set<string>();
    targetTables.forEach((t) => {
      t.columns.forEach((c) => availableColumns.add(c.name.toLowerCase()));
    });

    // Check projected columns (between SELECT and FROM)
    const selectTokens = tokens.slice(1, fromIndex);
    const selectStr = selectTokens.join(" ");
    const rawCols = selectStr.split(",").map((c) => c.trim()).filter(Boolean);

    for (const rawCol of rawCols) {
      const colParts = rawCol.split(/\s+AS\s+|\s+/i);
      let colName = colParts[0].trim();
      const aggMatch = colName.match(/^(?:COUNT|SUM|AVG|MIN|MAX|DISTINCT)\s*\(\s*([a-zA-Z0-9_*]+)\s*\)$/i);
      if (aggMatch) {
        colName = aggMatch[1];
      }
      if (colName.includes(".")) {
        const [tName, cName] = colName.split(".");
        const matchedTbl = schema.find((t) => t.name.toLowerCase() === tName.toLowerCase());
        if (!matchedTbl) {
          return {
            status: "invalid",
            message: `Unknown table qualifier "${tName}" in column "${colName}"`,
          };
        }
        if (cName !== "*" && !matchedTbl.columns.some((c) => c.name.toLowerCase() === cName.toLowerCase())) {
          return {
            status: "invalid",
            message: `Unknown column "${cName}" in table "${tName}"`,
          };
        }
        continue;
      }

      if (colName === "*" || /^\d+$/.test(colName) || /^'.*'$/.test(colName)) {
        continue;
      }

      const cleanIdent = colName.replace(/[^a-zA-Z0-9_]/g, "");
      if (cleanIdent && !SQL_KEYWORDS.has(cleanIdent.toUpperCase())) {
        if (availableColumns.size > 0 && !availableColumns.has(cleanIdent.toLowerCase())) {
          const firstTbl = referencedTables[0] || "table";
          return {
            status: "invalid",
            message: `Unknown column "${cleanIdent}" in table "${firstTbl}"`,
            detail: `Available columns: ${Array.from(availableColumns).join(", ")}`,
          };
        }
      }
    }

    // Check WHERE clause if present
    const whereIndex = tokens.findIndex((t) => t.toUpperCase() === "WHERE");
    if (whereIndex !== -1) {
      if (whereIndex === tokens.length - 1) {
        return {
          status: "incomplete",
          message: "Incomplete WHERE clause: expecting condition",
        };
      }
      const whereTokens = tokens.slice(whereIndex + 1);
      if (whereTokens.length === 1 && !sql.endsWith(";")) {
        return {
          status: "incomplete",
          message: `Incomplete WHERE clause: expecting operator and value after '${whereTokens[0]}'`,
        };
      }
    }

    // Check GROUP BY if present
    const groupIndex = tokens.findIndex((t) => t.toUpperCase() === "GROUP");
    if (groupIndex !== -1) {
      if (groupIndex === tokens.length - 1 || tokens[groupIndex + 1]?.toUpperCase() !== "BY") {
        return {
          status: "incomplete",
          message: "Incomplete clause: expecting 'BY' after GROUP",
        };
      }
      if (groupIndex + 1 === tokens.length - 1) {
        return {
          status: "incomplete",
          message: "Incomplete GROUP BY: expecting column name",
        };
      }
    }
  }

  // Validate INSERT INTO table
  if (firstToken === "INSERT") {
    const intoIndex = tokens.findIndex((t) => t.toUpperCase() === "INTO");
    if (intoIndex === -1 || intoIndex === tokens.length - 1) {
      return {
        status: "incomplete",
        message: "Incomplete INSERT: expecting INTO <table>",
      };
    }
    const tableName = tokens[intoIndex + 1].replace(/[(,;]/g, "").trim();
    if (!schema.some((t) => t.name.toLowerCase() === tableName.toLowerCase())) {
      return {
        status: "invalid",
        message: `Unknown table "${tableName}" in selected dataset`,
      };
    }
  }

  // Validate UPDATE table
  if (firstToken === "UPDATE") {
    if (tokens.length < 2) {
      return {
        status: "incomplete",
        message: "Incomplete UPDATE: expecting table name",
      };
    }
    const tableName = tokens[1].replace(/[,;]/g, "").trim();
    if (!schema.some((t) => t.name.toLowerCase() === tableName.toLowerCase())) {
      return {
        status: "invalid",
        message: `Unknown table "${tableName}" in selected dataset`,
      };
    }
    const setIndex = tokens.findIndex((t) => t.toUpperCase() === "SET");
    if (setIndex === -1) {
      return {
        status: "incomplete",
        message: "Incomplete UPDATE: missing SET clause",
      };
    }
  }

  // Validate DELETE FROM table
  if (firstToken === "DELETE") {
    const fromIndex = tokens.findIndex((t) => t.toUpperCase() === "FROM");
    if (fromIndex === -1 || fromIndex === tokens.length - 1) {
      return {
        status: "incomplete",
        message: "Incomplete DELETE: expecting FROM <table>",
      };
    }
    const tableName = tokens[fromIndex + 1].replace(/[,;]/g, "").trim();
    if (!schema.some((t) => t.name.toLowerCase() === tableName.toLowerCase())) {
      return {
        status: "invalid",
        message: `Unknown table "${tableName}" in selected dataset`,
      };
    }
  }

  // Full schema and query syntax validation against active schema
  try {
    validateSQLAgainstSchema(sql, schema);
    return {
      status: "valid",
      message: "Valid SQL",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (
      errorMsg.toLowerCase().includes("missing") &&
      !sql.endsWith(";")
    ) {
      return {
        status: "incomplete",
        message: errorMsg,
      };
    }
    return {
      status: "invalid",
      message: errorMsg,
    };
  }
}
