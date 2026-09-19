import type { Table, Column } from "./schema";
import {
  validateSQLAgainstSchema,
  DISALLOWED_WORDS,
  isGibberish,
  findClosestKeyword,
} from "./sqlEngine";

export type DiagnosticSeverity = "valid" | "incomplete" | "warning" | "error";

export interface SQLQuickFix {
  label: string;
  replacement: string;
  range?: [number, number]; // [startIndex, endIndex] in original query
}

export interface SQLSuggestion {
  label: string;
  value: string;
  category: "table" | "column" | "operator" | "value" | "clause" | "fix" | "relationship";
  detail?: string;
  rangeToReplace?: [number, number];
}

export interface SQLAssistantResult {
  severity: DiagnosticSeverity;
  title: string;
  what?: string;
  where?: string;
  suggestionText?: string;
  quickFix?: SQLQuickFix;
  suggestionsTitle?: string;
  suggestions: SQLSuggestion[];
}

interface SQLToken {
  text: string;
  upper: string;
  start: number;
  end: number;
}

const SQL_KEYWORDS = new Set([
  "SELECT", "FROM", "WHERE", "JOIN", "INNER", "LEFT", "RIGHT", "FULL", "OUTER",
  "ON", "GROUP", "BY", "HAVING", "ORDER", "ASC", "DESC", "LIMIT", "OFFSET",
  "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE", "CREATE", "TABLE",
  "ALTER", "DROP", "TRUNCATE", "AND", "OR", "NOT", "IN", "IS", "NULL", "LIKE",
  "BETWEEN", "AS", "DISTINCT", "COUNT", "SUM", "AVG", "MIN", "MAX", "CASE",
  "WHEN", "THEN", "ELSE", "END"
]);

/**
 * Tokenizes SQL while recording character offsets for precise surgical replacements.
 * Matches multi-character operators (==, ===, !==, !=, <=, >=, <>, &&, ||) as distinct tokens.
 */
function tokenizeWithOffsets(sql: string): SQLToken[] {
  const tokens: SQLToken[] = [];
  const regex = /'[^']*'|"[^"]*"|`[^`]*`|===|==|!==|!=|<=|>=|<>|&&|\|\||[(),;=*<>+\/%-]|[\w.]+/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(sql)) !== null) {
    tokens.push({
      text: match[0],
      upper: match[0].toUpperCase(),
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return tokens;
}

/**
 * Standard Levenshtein distance for fuzzy typo matching.
 */
export function levenshtein(a: string, b: string): number {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  const row = Array.from({ length: bl + 1 }, (_, i) => i);
  for (let i = 1; i <= al; i++) {
    let prev = i;
    for (let j = 1; j <= bl; j++) {
      const val =
        a[i - 1].toLowerCase() === b[j - 1].toLowerCase()
          ? row[j - 1]
          : Math.min(row[j - 1], prev, row[j]) + 1;
      row[j - 1] = prev;
      prev = val;
    }
    row[bl] = prev;
  }
  return row[bl];
}

/**
 * Finds the closest matching string if within an acceptable edit distance.
 */
export function findClosestMatch(
  target: string,
  candidates: string[],
  maxDistance = 3
): string | null {
  if (target.length <= 1) return null;
  let closest: string | null = null;
  let minDistance = maxDistance + 1;
  const tLower = target.toLowerCase();

  for (const candidate of candidates) {
    const cLower = candidate.toLowerCase();
    if (tLower === cLower) return candidate;
    if (Math.abs(tLower.length - cLower.length) > 2) continue;
    const dist = levenshtein(tLower, cLower);
    if (dist < minDistance && dist <= Math.max(1, Math.floor(cLower.length / 2))) {
      minDistance = dist;
      closest = candidate;
    }
  }
  return closest;
}

/**
 * Identifies known relationships between two tables in the schema.
 */
export function findJoinCondition(
  table1Name: string,
  table2Name: string,
  schema: Table[]
): string | null {
  const t1 = schema.find((t) => t.name.toLowerCase() === table1Name.toLowerCase());
  const t2 = schema.find((t) => t.name.toLowerCase() === table2Name.toLowerCase());
  if (!t1 || !t2) return null;

  // 1. Check if table2 references table1
  for (const col of t2.columns) {
    if (col.fk && col.fk.table.toLowerCase() === t1.name.toLowerCase()) {
      return `${t1.name}.${col.fk.column} = ${t2.name}.${col.name}`;
    }
  }

  // 2. Check if table1 references table2
  for (const col of t1.columns) {
    if (col.fk && col.fk.table.toLowerCase() === t2.name.toLowerCase()) {
      return `${t1.name}.${col.name} = ${t2.name}.${col.fk.column}`;
    }
  }

  // 3. Fallback: Check matching ID columns (e.g. customers.id vs orders.customer_id)
  const t1Singular = t1.name.replace(/s$/i, "").toLowerCase();
  const t2Singular = t2.name.replace(/s$/i, "").toLowerCase();

  const t2FkCandidate = t2.columns.find(
    (c) => c.name.toLowerCase() === `${t1Singular}_id` || c.name.toLowerCase() === `${t1.name.toLowerCase()}_id`
  );
  if (t2FkCandidate && t1.columns.some((c) => c.name.toLowerCase() === "id")) {
    return `${t1.name}.id = ${t2.name}.${t2FkCandidate.name}`;
  }

  const t1FkCandidate = t1.columns.find(
    (c) => c.name.toLowerCase() === `${t2Singular}_id` || c.name.toLowerCase() === `${t2.name.toLowerCase()}_id`
  );
  if (t1FkCandidate && t2.columns.some((c) => c.name.toLowerCase() === "id")) {
    return `${t1.name}.${t1FkCandidate.name} = ${t2.name}.id`;
  }

  return null;
}

/**
 * Extracts distinct values for a given column from actual table rows.
 */
export function getColumnValues(
  table: Table,
  columnName: string,
  maxValues = 6
): string[] {
  const values: string[] = [];
  const seen = new Set<string>();

  for (const row of table.rows) {
    const rawVal = row[columnName];
    if (rawVal !== undefined && rawVal !== null) {
      const formatted = typeof rawVal === "string" ? `'${rawVal}'` : String(rawVal);
      if (!seen.has(formatted)) {
        seen.add(formatted);
        values.push(formatted);
        if (values.length >= maxValues) break;
      }
    }
  }

  return values;
}

/**
 * Intelligent Real-Time SQL Assistant & Debugger.
 * Analysis is evaluated on the COMPLETE line / statement, not on the position of the cursor.
 */
export function analyzeSQL(
  rawSql: string,
  schema: Table[]
): SQLAssistantResult {
  const trimmed = rawSql.trim();
  if (!trimmed) {
    return {
      severity: "valid",
      title: "",
      suggestions: [],
    };
  }

  const hasTerminalSemicolon = /;+\s*$/.test(trimmed);
  const cleanSql = trimmed.replace(/;+\s*$/, "").trim();
  const cleanUpper = cleanSql.toUpperCase();
  const tokens = tokenizeWithOffsets(rawSql);
  const availableTableNames = schema.map((t) => t.name);

  // 1. Check for invalid operators (e.g. ==, ===, !==, &&, ||) on the entire query
  for (const tok of tokens) {
    if (tok.text === "==" || tok.text === "===") {
      return {
        severity: "error",
        title: `Invalid operator '${tok.text}'`,
        what: `Operator '${tok.text}' is not valid in SQL. Use '=' for equality comparison.`,
        where: "In SQL statement",
        suggestionText: "In SQL, equality comparison uses a single '=' sign.",
        quickFix: {
          label: "Replace with '='",
          replacement: "=",
          range: [tok.start, tok.end],
        },
        suggestionsTitle: "Valid operator:",
        suggestions: [
          {
            label: "=",
            value: "=",
            category: "operator",
            rangeToReplace: [tok.start, tok.end],
          },
        ],
      };
    }
    if (tok.text === "!==") {
      return {
        severity: "error",
        title: "Invalid operator '!=='",
        what: "Operator '!==' is not valid in SQL. Use '!=' or '<>' for inequality.",
        where: "In SQL statement",
        suggestionText: "In SQL, inequality comparison uses '!=' or '<>'.",
        quickFix: {
          label: "Replace with '!='",
          replacement: "!=",
          range: [tok.start, tok.end],
        },
        suggestions: [
          {
            label: "!=",
            value: "!=",
            category: "operator",
            rangeToReplace: [tok.start, tok.end],
          },
        ],
      };
    }
    if (tok.text === "&&") {
      return {
        severity: "error",
        title: "Invalid operator '&&'",
        what: "Operator '&&' is not valid in SQL. Use 'AND' to combine conditions.",
        where: "In SQL statement",
        suggestionText: "Use the keyword 'AND' to combine conditions.",
        quickFix: {
          label: "Replace with 'AND'",
          replacement: "AND",
          range: [tok.start, tok.end],
        },
        suggestions: [
          {
            label: "AND",
            value: "AND",
            category: "operator",
            rangeToReplace: [tok.start, tok.end],
          },
        ],
      };
    }
    if (tok.text === "||") {
      return {
        severity: "error",
        title: "Invalid boolean operator '||'",
        what: "Operator '||' is not supported for logical OR in this SQL engine. Use 'OR'.",
        where: "In SQL statement",
        suggestionText: "Use the keyword 'OR' to combine conditions.",
        quickFix: {
          label: "Replace with 'OR'",
          replacement: "OR",
          range: [tok.start, tok.end],
        },
        suggestions: [
          {
            label: "OR",
            value: "OR",
            category: "operator",
            rangeToReplace: [tok.start, tok.end],
          },
        ],
      };
    }
  }

  // 2. Check for unclosed quotation marks
  let singleQuotes = 0;
  let doubleQuotes = 0;
  for (let i = 0; i < rawSql.length; i++) {
    const ch = rawSql[i];
    if (ch === "'" && (i === 0 || rawSql[i - 1] !== "\\")) singleQuotes++;
    if (ch === '"' && (i === 0 || rawSql[i - 1] !== "\\")) doubleQuotes++;
  }
  if (singleQuotes % 2 !== 0) {
    return {
      severity: "incomplete",
      title: "Unclosed string literal",
      what: "Unclosed single quotation mark (')",
      where: "In string literal",
      suggestionText: "Close the quotation mark with a matching single quote (')",
      suggestions: [{ label: "'", value: "'", category: "clause" }],
    };
  }
  if (doubleQuotes % 2 !== 0) {
    return {
      severity: "incomplete",
      title: "Unclosed identifier quote",
      what: "Unclosed double quotation mark (\")",
      where: "In quoted identifier",
      suggestionText: "Close the quotation mark with a matching double quote (\")",
      suggestions: [{ label: '"', value: '"', category: "clause" }],
    };
  }

  // 3. Check for unbalanced parentheses
  let parenDepth = 0;
  for (let i = 0; i < rawSql.length; i++) {
    if (rawSql[i] === "(") parenDepth++;
    if (rawSql[i] === ")") parenDepth--;
    if (parenDepth < 0) {
      return {
        severity: "error",
        title: "Unexpected closing parenthesis ')'",
        what: "Closing parenthesis without a matching opening parenthesis",
        where: `Around character ${i + 1}`,
        suggestionText: "Remove the unmatched ')' or add an opening '('",
        suggestions: [],
      };
    }
  }
  if (parenDepth > 0) {
    return {
      severity: "incomplete",
      title: "Unclosed parenthesis '('",
      what: "Expression has unclosed opening parenthesis",
      where: "In query",
      suggestionText: "Close the parenthesis with ')'",
      suggestions: [{ label: ")", value: ")", category: "clause" }],
    };
  }

  if (tokens.length === 0) {
    return { severity: "valid", title: "", suggestions: [] };
  }

  // 3.5. Universal Disallowed Words & Gibberish Detection
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok.text.startsWith("'") || tok.text.startsWith('"') || tok.text.startsWith("`")) {
      continue;
    }

    if (DISALLOWED_WORDS.has(tok.upper)) {
      const prevTok = i > 0 ? tokens[i - 1] : undefined;
      const nextTok = i + 1 < tokens.length ? tokens[i + 1] : undefined;
      const replaceStart = prevTok ? prevTok.end : tok.start;
      const replaceEnd = !prevTok && nextTok ? nextTok.start : tok.end;

      return {
        severity: "error",
        title: `Disallowed word '${tok.text}'`,
        what: `'${tok.text}' is a disallowed programming keyword not valid in SQL queries.`,
        where: prevTok ? `After '${prevTok.text}'` : "In SQL statement",
        suggestionText: `Remove the disallowed word '${tok.text}'.`,
        quickFix: {
          label: `Remove '${tok.text}'`,
          replacement: "",
          range: [replaceStart, replaceEnd],
        },
        suggestionsTitle: "Quick Fix:",
        suggestions: [
          {
            label: `Remove '${tok.text}'`,
            value: "",
            category: "fix",
            rangeToReplace: [replaceStart, replaceEnd],
          },
        ],
      };
    }

    if (isGibberish(tok.text)) {
      const isKnownTbl = schema.some((t) => t.name.toLowerCase() === tok.text.toLowerCase());
      const isKnownCol = schema.some((t) =>
        t.columns.some((c) => c.name.toLowerCase() === tok.text.toLowerCase()),
      );
      if (!isKnownTbl && !isKnownCol) {
        const prevTok = i > 0 ? tokens[i - 1] : undefined;
        const nextTok = i + 1 < tokens.length ? tokens[i + 1] : undefined;
        const replaceStart = prevTok ? prevTok.end : tok.start;
        const replaceEnd = !prevTok && nextTok ? nextTok.start : tok.end;

        return {
          severity: "error",
          title: `Gibberish token '${tok.text}'`,
          what: `Unrecognized word '${tok.text}' detected in SQL statement.`,
          where: prevTok ? `After '${prevTok.text}'` : "In SQL statement",
          suggestionText: `Remove the invalid token '${tok.text}'.`,
          quickFix: {
            label: `Remove '${tok.text}'`,
            replacement: "",
            range: [replaceStart, replaceEnd],
          },
          suggestionsTitle: "Quick Fix:",
          suggestions: [
            {
              label: `Remove '${tok.text}'`,
              value: "",
              category: "fix",
              rangeToReplace: [replaceStart, replaceEnd],
            },
          ],
        };
      }
    }
  }

  // 4. First token validation
  const firstToken = tokens[0].upper;
  const knownCommands = ["SELECT", "INSERT", "UPDATE", "DELETE", "CREATE", "ALTER", "DROP", "TRUNCATE", "SHOW", "DESCRIBE"];
  if (!knownCommands.includes(firstToken)) {
    const closestCmd = findClosestMatch(tokens[0].text, knownCommands);
    return {
      severity: "error",
      title: `Unknown SQL command '${tokens[0].text}'`,
      what: `Invalid statement start '${tokens[0].text}'`,
      where: "At start of query",
      suggestionText: closestCmd
        ? `Did you mean '${closestCmd}'?`
        : "Statements must start with SELECT, INSERT, UPDATE, DELETE, etc.",
      quickFix: closestCmd
        ? {
          label: `Change to '${closestCmd}'`,
          replacement: closestCmd,
          range: [tokens[0].start, tokens[0].end],
        }
        : undefined,
      suggestions: closestCmd
        ? [{ label: closestCmd, value: closestCmd, category: "clause", rangeToReplace: [tokens[0].start, tokens[0].end] }]
        : knownCommands.slice(0, 5).map((c) => ({ label: c, value: c, category: "clause" })),
    };
  }

  // 4.0. Detect multiple duplicate clause keywords (e.g. multiple WHERE or FROM clauses)
  const clauseCounts: Record<string, number> = {};
  for (const tok of tokens) {
    if (["SELECT", "FROM", "WHERE", "HAVING", "LIMIT"].includes(tok.upper)) {
      clauseCounts[tok.upper] = (clauseCounts[tok.upper] || 0) + 1;
      if (clauseCounts[tok.upper] > 1) {
        return {
          severity: "error",
          title: `Duplicate ${tok.upper} clause`,
          what: `Multiple '${tok.upper}' clauses found in statement`,
          where: `At '${tok.text}'`,
          suggestionText:
            tok.upper === "WHERE"
              ? "Combine multiple filter conditions using 'AND' or 'OR' within a single WHERE clause."
              : `Remove the duplicate '${tok.upper}' clause.`,
          suggestions: [],
        };
      }
    }
  }

  // 4.1. Detect duplicate adjacent SQL keywords (e.g. WHERE WHERE, FROM FROM)
  for (let i = 0; i < tokens.length - 1; i++) {
    const t1 = tokens[i];
    const t2 = tokens[i + 1];
    if (
      SQL_KEYWORDS.has(t1.upper) &&
      t1.upper === t2.upper &&
      !["AS", "BY", "JOIN"].includes(t1.upper)
    ) {
      return {
        severity: "error",
        title: `Duplicate keyword '${t1.text}'`,
        what: `Redundant '${t2.text}' keyword found in statement`,
        where: `After '${t1.text}'`,
        suggestionText: `Remove the duplicate '${t2.text}' keyword.`,
        quickFix: {
          label: `Remove duplicate '${t2.text}'`,
          replacement: "",
          range: [t1.end, t2.end],
        },
        suggestions: [],
      };
    }
  }

  // 4.2. Universal Keyword Typo Detection across all tokens
  const allKeywords = Array.from(SQL_KEYWORDS);
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (!/^[a-zA-Z_]\w*$/.test(tok.text) || SQL_KEYWORDS.has(tok.upper)) {
      continue;
    }

    // Skip if it is a known table name in active schema
    const isKnownTable = schema.some(
      (t) => t.name.toLowerCase() === tok.text.toLowerCase(),
    );
    if (isKnownTable) continue;

    // Skip if it is a known column in active schema
    const isKnownColumn = schema.some((t) =>
      t.columns.some((c) => c.name.toLowerCase() === tok.text.toLowerCase()),
    );
    if (isKnownColumn) continue;

    // Skip if it is an alias used as a prefix (e.g. `c.name`)
    const isQualifier = tokens.some((t) =>
      t.text.toLowerCase().startsWith(`${tok.text.toLowerCase()}.`),
    );
    if (isQualifier) continue;

    // Check if it's a typo of any SQL keyword
    const closestKw = findClosestMatch(tok.upper, allKeywords, 2);
    if (closestKw) {
      // Check if the correct keyword already exists in the statement (like `WHRE WHERE`)
      const hasExactKeyword = tokens.some(
        (t, idx) => idx !== i && t.upper === closestKw,
      );

      if (hasExactKeyword) {
        const nextTok = tokens[i + 1];
        const prevTok = tokens[i - 1];
        const replaceEnd = nextTok ? nextTok.start : tok.end;
        return {
          severity: "error",
          title: `Unexpected token '${tok.text}'`,
          what: `Redundant or misspelled keyword '${tok.text}' near '${closestKw}'`,
          where: prevTok ? `After '${prevTok.text}'` : "In SQL statement",
          suggestionText: `Remove the stray '${tok.text}' keyword.`,
          quickFix: {
            label: `Remove '${tok.text}'`,
            replacement: "",
            range: [tok.start, replaceEnd],
          },
          suggestions: [],
        };
      }

      // Misspelled keyword (e.g. `WHRE city = 'Mumbai'` or `FORM customers`)
      return {
        severity: "error",
        title: `Misspelled keyword '${tok.text}'`,
        what: `Keyword '${tok.text}' is not recognized. Did you mean '${closestKw}'?`,
        where: "In SQL statement",
        suggestionText: `Replace '${tok.text}' with '${closestKw}'.`,
        quickFix: {
          label: `Replace with '${closestKw}'`,
          replacement: closestKw,
          range: [tok.start, tok.end],
        },
        suggestionsTitle: "Did you mean:",
        suggestions: [
          {
            label: closestKw,
            value: closestKw,
            category: "clause",
            rangeToReplace: [tok.start, tok.end],
          },
        ],
      };
    }
  }

  // 5. Extract referenced tables and aliases from the complete query
  interface RefTable {
    name: string;
    alias?: string;
    start: number;
    end: number;
  }
  const referencedTables: RefTable[] = [];
  const aliasMap: Record<string, string> = {};

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if ((tok.upper === "FROM" || tok.upper === "JOIN") && i + 1 < tokens.length) {
      const nextTok = tokens[i + 1];
      if (!SQL_KEYWORDS.has(nextTok.upper) && nextTok.upper !== "(" && nextTok.upper !== ";") {
        let alias: string | undefined = undefined;
        if (i + 2 < tokens.length) {
          const possibleAlias = tokens[i + 2];
          const isKwTypo = Boolean(
            findClosestMatch(possibleAlias.upper, allKeywords, 2),
          );
          if (possibleAlias.upper === "AS" && i + 3 < tokens.length) {
            alias = tokens[i + 3].text;
          } else if (
            !SQL_KEYWORDS.has(possibleAlias.upper) &&
            !isKwTypo &&
            !possibleAlias.text.includes(",") &&
            possibleAlias.text !== ";"
          ) {
            const isQualifierUsed = tokens.some((t) =>
              t.text.toLowerCase().startsWith(`${possibleAlias.text.toLowerCase()}.`),
            );
            if (!isQualifierUsed) {
              const prevTok = nextTok;
              const nextAfter = i + 3 < tokens.length ? tokens[i + 3] : undefined;
              const replaceEnd = possibleAlias.end;
              return {
                severity: "error",
                title: `Unexpected token '${possibleAlias.text}'`,
                what: `Unexpected word '${possibleAlias.text}' after table '${prevTok.text}'. If this is a table alias, use 'AS ${possibleAlias.text}'. Otherwise, remove it.`,
                where: `After '${prevTok.text}'`,
                suggestionText: `Remove '${possibleAlias.text}' or write 'AS ${possibleAlias.text}'.`,
                quickFix: {
                  label: `Remove '${possibleAlias.text}'`,
                  replacement: "",
                  range: [prevTok.end, replaceEnd],
                },
                suggestionsTitle: "Suggested actions:",
                suggestions: [
                  {
                    label: `Remove '${possibleAlias.text}'`,
                    value: "",
                    category: "fix",
                    rangeToReplace: [prevTok.end, replaceEnd],
                  },
                  {
                    label: `AS ${possibleAlias.text}`,
                    value: `AS ${possibleAlias.text}`,
                    category: "fix",
                    rangeToReplace: [possibleAlias.start, possibleAlias.end],
                  },
                ],
              };
            }
            alias = possibleAlias.text;
          }
        }
        referencedTables.push({
          name: nextTok.text,
          alias,
          start: nextTok.start,
          end: nextTok.end,
        });
        if (alias) {
          aliasMap[alias.toLowerCase()] = nextTok.text.toLowerCase();
        }
      }
    }
  }

  // 6. Detect Unknown Table & Typo ("Did you mean customers?") on the complete query
  for (const ref of referencedTables) {
    const nameLower = ref.name.toLowerCase();
    const isKnown = availableTableNames.some((t) => t.toLowerCase() === nameLower);
    if (!isKnown) {
      const closest = findClosestMatch(ref.name, availableTableNames);
      return {
        severity: "error",
        title: `Unknown table: \`${ref.name}\``,
        what: `Unknown table \`${ref.name}\` in dataset`,
        where: "In FROM / JOIN clause",
        suggestionText: closest ? `Did you mean \`${closest}\`?` : "Choose a table from the selected dataset:",
        quickFix: closest
          ? {
            label: `Replace with \`${closest}\``,
            replacement: closest,
            range: [ref.start, ref.end],
          }
          : undefined,
        suggestionsTitle: closest ? "Did you mean:" : "Tables in current dataset:",
        suggestions: closest
          ? [{ label: closest, value: closest, category: "table", rangeToReplace: [ref.start, ref.end] }]
          : availableTableNames.map((t) => ({ label: t, value: t, category: "table", rangeToReplace: [ref.start, ref.end] })),
      };
    }
  }

  // 7. Detect Missing FROM Clause (e.g. `SELECT name customers`) on complete query
  if (firstToken === "SELECT") {
    const fromIndex = tokens.findIndex((t) => t.upper === "FROM");
    if (fromIndex === -1) {
      for (let i = 1; i < tokens.length; i++) {
        const candidate = tokens[i].text.toLowerCase();
        if (availableTableNames.some((t) => t.toLowerCase() === candidate)) {
          return {
            severity: "warning",
            title: "Missing FROM clause",
            what: `Expected a FROM clause before table name \`${tokens[i].text}\``,
            where: `Before \`${tokens[i].text}\``,
            suggestionText: `Insert \`FROM\` before \`${tokens[i].text}\``,
            quickFix: {
              label: `Insert 'FROM'`,
              replacement: `FROM ${tokens[i].text}`,
              range: [tokens[i].start, tokens[i].end],
            },
            suggestions: [{ label: `FROM ${tokens[i].text}`, value: `FROM ${tokens[i].text}`, category: "clause", rangeToReplace: [tokens[i].start, tokens[i].end] }],
          };
        }
      }
    }
  }

  // 8. Detect Missing JOIN Condition (e.g. `SELECT * FROM customers JOIN orders`) on complete query
  const joinIndices: number[] = [];
  tokens.forEach((t, idx) => {
    if (t.upper === "JOIN") joinIndices.push(idx);
  });

  for (const jIdx of joinIndices) {
    if (jIdx + 1 < tokens.length) {
      const joinTableTok = tokens[jIdx + 1];
      let hasOn = false;
      for (let k = jIdx + 2; k < tokens.length; k++) {
        if (tokens[k].upper === "ON") {
          hasOn = true;
          break;
        }
        if (["WHERE", "GROUP", "ORDER", "JOIN", "LIMIT"].includes(tokens[k].upper)) {
          break;
        }
      }
      if (!hasOn && referencedTables.length >= 2) {
        const primaryTable = referencedTables[0].name;
        const joinedTable = joinTableTok.text;
        const suggestedJoin = findJoinCondition(primaryTable, joinedTable, schema);
        return {
          severity: "warning",
          title: "JOIN condition missing",
          what: `JOIN condition missing for \`${joinedTable}\``,
          where: `After JOIN ${joinedTable}`,
          suggestionText: suggestedJoin
            ? `The selected schema indicates:\n${suggestedJoin}`
            : "Specify ON <table1.col = table2.col>",
          quickFix: suggestedJoin
            ? {
              label: `Insert: ON ${suggestedJoin}`,
              replacement: `${joinedTable} ON ${suggestedJoin}`,
              range: [joinTableTok.start, joinTableTok.end],
            }
            : undefined,
          suggestionsTitle: suggestedJoin ? "Suggested JOIN condition:" : "Join columns:",
          suggestions: suggestedJoin
            ? [
              {
                label: `ON ${suggestedJoin}`,
                value: ` ON ${suggestedJoin}`,
                category: "fix",
                detail: "Auto-detected relationship",
              },
            ]
            : [],
        };
      }
    }
  }

  // 9. Resolve target tables & columns for validation
  const targetTables = schema.filter((t) =>
    referencedTables.some((rt) => rt.name.toLowerCase() === t.name.toLowerCase())
  );
  const activeColumns: { name: string; tableName: string; type: string }[] = [];
  if (targetTables.length > 0) {
    targetTables.forEach((t) => {
      t.columns.forEach((c) => activeColumns.push({ name: c.name, tableName: t.name, type: c.type }));
    });
  } else {
    schema.forEach((t) => {
      t.columns.forEach((c) => activeColumns.push({ name: c.name, tableName: t.name, type: c.type }));
    });
  }

  // 10. Detect Unknown Column & Typo ("Did you mean name?") on complete query
  const fromIdx = tokens.findIndex((t) => t.upper === "FROM");
  if (firstToken === "SELECT" && fromIdx > 1) {
    const selectTokens = tokens.slice(1, fromIdx);
    for (const tok of selectTokens) {
      if (
        tok.text === "*" ||
        tok.text === "," ||
        tok.upper === "DISTINCT" ||
        tok.upper === "AS" ||
        /^\d+$/.test(tok.text) ||
        /^'.*'$/.test(tok.text) ||
        /^(COUNT|SUM|AVG|MIN|MAX)$/i.test(tok.upper) ||
        SQL_KEYWORDS.has(tok.upper)
      ) {
        continue;
      }

      let colName = tok.text.replace(/[,()]/g, "").trim();
      let expectedTableCols = activeColumns;

      if (colName.includes(".")) {
        const [tblOrAlias, pureCol] = colName.split(".");
        const actualTbl = aliasMap[tblOrAlias.toLowerCase()] || tblOrAlias.toLowerCase();
        const matched = schema.find((t) => t.name.toLowerCase() === actualTbl);
        if (matched) {
          expectedTableCols = matched.columns.map((c) => ({ name: c.name, tableName: matched.name, type: c.type }));
          colName = pureCol;
        }
      }

      if (colName && colName !== "*" && expectedTableCols.length > 0) {
        const isColKnown = expectedTableCols.some((c) => c.name.toLowerCase() === colName.toLowerCase());
        if (!isColKnown && !SQL_KEYWORDS.has(colName.toUpperCase())) {
          const closestCol = findClosestMatch(colName, expectedTableCols.map((c) => c.name));
          const tblName = expectedTableCols[0]?.tableName || "table";
          return {
            severity: "error",
            title: `Unknown column: \`${colName}\``,
            what: `Unknown column \`${colName}\` in table \`${tblName}\``,
            where: "In SELECT projection list",
            suggestionText: closestCol ? `Did you mean \`${closestCol}\`?` : `Available columns in \`${tblName}\`:`,
            quickFix: closestCol
              ? {
                label: `Replace with \`${closestCol}\``,
                replacement: closestCol,
                range: [tok.start, tok.end],
              }
              : undefined,
            suggestionsTitle: closestCol ? "Did you mean:" : "Available columns:",
            suggestions: [
              ...(closestCol
                ? [
                  {
                    label: closestCol,
                    value: closestCol,
                    category: "column" as const,
                    rangeToReplace: [tok.start, tok.end] as [number, number],
                    detail: "Did you mean",
                  },
                ]
                : []),
              ...expectedTableCols
                .filter((c) => c.name.toLowerCase() !== closestCol?.toLowerCase())
                .map((c) => ({
                  label: c.name,
                  value: c.name,
                  category: "column" as const,
                  rangeToReplace: [tok.start, tok.end] as [number, number],
                  detail: c.type,
                })),
            ],
          };
        }
      }
    }
  }

  // 10.5. Detect Missing WHERE Clause before condition (e.g. `SELECT name, city FROM customers city = 'Mumbai'`)
  const whereIdx = tokens.findIndex((t) => t.upper === "WHERE");
  if (whereIdx === -1) {
    if (firstToken === "SELECT") {
      const fromIdx = tokens.findIndex((t) => t.upper === "FROM");
      if (fromIdx !== -1 && fromIdx + 1 < tokens.length) {
        let scanIdx = fromIdx + 1;
        // Skip base table name
        if (scanIdx < tokens.length && !SQL_KEYWORDS.has(tokens[scanIdx].upper)) {
          scanIdx++;
        }
        // Skip table alias (e.g. `AS c` or `c`)
        if (scanIdx < tokens.length && tokens[scanIdx].upper === "AS" && scanIdx + 1 < tokens.length) {
          scanIdx += 2;
        } else if (
          scanIdx < tokens.length &&
          !SQL_KEYWORDS.has(tokens[scanIdx].upper) &&
          scanIdx + 1 < tokens.length &&
          !["=", "!=", "<>", "<", ">", "<=", ">=", "LIKE", "IN", "IS", "==", "===", "!=="].includes(tokens[scanIdx + 1].text)
        ) {
          scanIdx++;
        }

        // Skip any JOIN clauses: JOIN <table> [alias] ON <col> = <col>
        while (scanIdx < tokens.length && tokens[scanIdx].upper === "JOIN") {
          scanIdx++; // skip JOIN
          if (scanIdx < tokens.length && !SQL_KEYWORDS.has(tokens[scanIdx].upper)) scanIdx++; // skip join table
          if (scanIdx < tokens.length && tokens[scanIdx].upper === "AS" && scanIdx + 1 < tokens.length) scanIdx += 2;
          else if (scanIdx < tokens.length && !SQL_KEYWORDS.has(tokens[scanIdx].upper)) scanIdx++; // alias
          if (scanIdx < tokens.length && tokens[scanIdx].upper === "ON") {
            scanIdx++; // skip ON
            if (scanIdx < tokens.length) scanIdx++; // skip left
            if (scanIdx < tokens.length && tokens[scanIdx].text === "=") scanIdx++; // skip =
            if (scanIdx < tokens.length) scanIdx++; // skip right
          }
        }

        // Check if a condition is present without WHERE
        if (scanIdx < tokens.length && tokens[scanIdx].text !== ";") {
          const condTok = tokens[scanIdx];
          const nextTok = scanIdx + 1 < tokens.length ? tokens[scanIdx + 1] : undefined;
          const isClauseKeyword = ["GROUP", "ORDER", "HAVING", "LIMIT", "UNION"].includes(condTok.upper);

          if (!isClauseKeyword) {
            const KNOWN_OPS = new Set(["=", "!=", "<>", "<", ">", "<=", ">=", "LIKE", "IN", "IS", "==", "===", "!=="]);
            const isFollowedByOp = nextTok && KNOWN_OPS.has(nextTok.text);
            const isKnownCol = activeColumns.some((c) => c.name.toLowerCase() === condTok.text.toLowerCase());

            if (isFollowedByOp || isKnownCol || condTok.text.includes("=")) {
              let endScan = scanIdx;
              while (
                endScan < tokens.length &&
                tokens[endScan].text !== ";" &&
                !["GROUP", "ORDER", "HAVING", "LIMIT", "UNION"].includes(tokens[endScan].upper)
              ) {
                endScan++;
              }
              const conditionSnippet = rawSql
                .slice(condTok.start, endScan < tokens.length ? tokens[endScan - 1].end : rawSql.length)
                .trim()
                .replace(/;+$/, "");

              return {
                severity: "error",
                title: "Missing WHERE clause",
                what: `Expected 'WHERE' keyword before condition \`${conditionSnippet || condTok.text}\``,
                where: `Before \`${condTok.text}\``,
                suggestionText: `Insert \`WHERE\` before \`${condTok.text}\` to filter records.`,
                quickFix: {
                  label: "Insert 'WHERE'",
                  replacement: `WHERE ${condTok.text}`,
                  range: [condTok.start, condTok.end],
                },
                suggestionsTitle: "Quick Fix:",
                suggestions: [
                  {
                    label: `WHERE ${condTok.text}`,
                    value: `WHERE ${condTok.text}`,
                    category: "fix",
                    detail: "Insert missing WHERE clause",
                    rangeToReplace: [condTok.start, condTok.end],
                  },
                ],
              };
            }
          }
        }
      }
    } else if (firstToken === "DELETE") {
      const fromIdx = tokens.findIndex((t) => t.upper === "FROM");
      const tblIdx = fromIdx !== -1 ? fromIdx + 1 : 1;
      if (tblIdx + 1 < tokens.length && tokens[tblIdx + 1].text !== ";") {
        const condTok = tokens[tblIdx + 1];
        const nextTok = tblIdx + 2 < tokens.length ? tokens[tblIdx + 2] : undefined;
        const KNOWN_OPS = new Set(["=", "!=", "<>", "<", ">", "<=", ">=", "LIKE", "IN", "IS", "==", "===", "!=="]);
        const isFollowedByOp = nextTok && KNOWN_OPS.has(nextTok.text);
        const isKnownCol = activeColumns.some((c) => c.name.toLowerCase() === condTok.text.toLowerCase());

        if (isFollowedByOp || isKnownCol || condTok.text.includes("=")) {
          const conditionSnippet = rawSql
            .slice(condTok.start)
            .trim()
            .replace(/;+$/, "");

          return {
            severity: "error",
            title: "Missing WHERE clause",
            what: `Expected 'WHERE' keyword before condition \`${conditionSnippet || condTok.text}\``,
            where: `Before \`${condTok.text}\``,
            suggestionText: `Insert \`WHERE\` before \`${condTok.text}\` in DELETE statement.`,
            quickFix: {
              label: "Insert 'WHERE'",
              replacement: `WHERE ${condTok.text}`,
              range: [condTok.start, condTok.end],
            },
            suggestionsTitle: "Quick Fix:",
            suggestions: [
              {
                label: `WHERE ${condTok.text}`,
                value: `WHERE ${condTok.text}`,
                category: "fix",
                detail: "Insert missing WHERE clause",
                rangeToReplace: [condTok.start, condTok.end],
              },
            ],
          };
        }
      }
    }
  }

  // 11. Validate WHERE clause on the complete line
  if (whereIdx !== -1) {
    const nextClauseIdx = tokens.findIndex(
      (t, idx) => idx > whereIdx && ["GROUP", "ORDER", "HAVING", "LIMIT", "UNION"].includes(t.upper)
    );
    const whereTokens = nextClauseIdx !== -1 ? tokens.slice(whereIdx + 1, nextClauseIdx) : tokens.slice(whereIdx + 1);

    // Case: `WHERE` with nothing after it
    if (whereTokens.length === 0 || (whereTokens.length === 1 && whereTokens[0].text === ";")) {
      const firstTbl = targetTables[0] || schema[0];
      return {
        severity: hasTerminalSemicolon ? "error" : "incomplete",
        title: "Condition missing after WHERE",
        what: "Filter condition expected after WHERE",
        where: "After WHERE",
        suggestionText: `Choose a column from \`${firstTbl.name}\`:`,
        suggestionsTitle: `Columns in \`${firstTbl.name}\`:`,
        suggestions: firstTbl.columns.map((c) => ({
          label: c.name,
          value: c.name,
          category: "column" as const,
          detail: c.type,
        })),
      };
    }

    // Check for unknown or misspelled column in WHERE clause
    const KNOWN_OPS = new Set([
      "=", "!=", "<>", "<", ">", "<=", ">=", "LIKE", "ILIKE", "IN", "IS", "NOT", "BETWEEN", "==", "===", "!=="
    ]);

    for (let w = 0; w < whereTokens.length; w++) {
      const wTok = whereTokens[w];
      const isColPos =
        (w + 1 < whereTokens.length && KNOWN_OPS.has(whereTokens[w + 1].upper)) ||
        (w === 0 && whereTokens.length >= 1 && !SQL_KEYWORDS.has(wTok.upper));

      if (isColPos && /^[a-zA-Z_]\w*(\.[a-zA-Z_]\w*)?$/.test(wTok.text) && !SQL_KEYWORDS.has(wTok.upper)) {
        let colName = wTok.text;
        let expectedCols = activeColumns;

        if (colName.includes(".")) {
          const [tblOrAlias, pureCol] = colName.split(".");
          const actualTbl = aliasMap[tblOrAlias.toLowerCase()] || tblOrAlias.toLowerCase();
          const matched = schema.find((t) => t.name.toLowerCase() === actualTbl);
          if (matched) {
            expectedCols = matched.columns.map((c) => ({ name: c.name, tableName: matched.name, type: c.type }));
            colName = pureCol;
          }
        }

        if (expectedCols.length > 0) {
          const isKnown = expectedCols.some((c) => c.name.toLowerCase() === colName.toLowerCase());
          if (!isKnown) {
            const closestCol = findClosestMatch(colName, expectedCols.map((c) => c.name));
            const tblName = expectedCols[0]?.tableName || "table";
            return {
              severity: "error",
              title: `Unknown column: \`${colName}\``,
              what: `Unknown column \`${colName}\` in table \`${tblName}\``,
              where: "In WHERE condition",
              suggestionText: closestCol
                ? `Did you mean \`${closestCol}\`?`
                : `Available columns in \`${tblName}\`:`,
              quickFix: closestCol
                ? {
                  label: `Replace with \`${closestCol}\``,
                  replacement: closestCol,
                  range: [wTok.start, wTok.end],
                }
                : undefined,
              suggestionsTitle: closestCol ? "Did you mean:" : `Columns in \`${tblName}\`:`,
              suggestions: [
                ...(closestCol
                  ? [
                    {
                      label: closestCol,
                      value: closestCol,
                      category: "column" as const,
                      rangeToReplace: [wTok.start, wTok.end] as [number, number],
                      detail: "Did you mean",
                    },
                  ]
                  : []),
                ...expectedCols
                  .filter((c) => c.name.toLowerCase() !== closestCol?.toLowerCase())
                  .map((c) => ({
                    label: c.name,
                    value: c.name,
                    category: "column" as const,
                    rangeToReplace: [wTok.start, wTok.end] as [number, number],
                    detail: c.type,
                  })),
              ],
            };
          }
        }
      }
    }

    // Case: `WHERE col` (operator missing)
    if (whereTokens.length === 1 || (whereTokens.length === 2 && whereTokens[1].text === ";")) {
      const colName = whereTokens[0].text;
      return {
        severity: hasTerminalSemicolon ? "error" : "incomplete",
        title: `Operator expected after \`${colName}\``,
        what: `Comparison operator expected after \`${colName}\``,
        where: `After \`${colName}\``,
        suggestionText: "Choose a comparison operator:",
        suggestionsTitle: "Operators:",
        suggestions: ["=", "!=", ">", "<", ">=", "<=", "LIKE", "IN"].map((op) => ({
          label: op,
          value: `${op} `,
          category: "operator" as const,
        })),
      };
    }

    // Case: `WHERE col op` (value missing, e.g. `WHERE id =` or `WHERE id =;` or `WHERE id ==;`)
    if (whereTokens.length === 2 || (whereTokens.length === 3 && whereTokens[2].text === ";")) {
      const opTok = whereTokens[1];
      const colRaw = whereTokens[0].text;
      const colName = colRaw.includes(".") ? colRaw.split(".")[1] : colRaw;
      const targetTbl = targetTables[0] || schema.find((t) => t.columns.some((c) => c.name.toLowerCase() === colName.toLowerCase())) || schema[0];

      const KNOWN_OPS = new Set(["=", "!=", "<>", "<", ">", "<=", ">=", "LIKE", "IN", "IS", "NOT", "==", "===", "!=="]);
      if (!KNOWN_OPS.has(opTok.upper)) {
        return {
          severity: "error",
          title: `Operator expected after \`${colName}\``,
          what: `Expected a comparison operator after \`${colName}\` instead of '${opTok.text}'`,
          where: `After \`${colName}\``,
          suggestionText: "Choose a comparison operator:",
          suggestionsTitle: "Operators:",
          suggestions: ["=", "!=", ">", "<", ">=", "<=", "LIKE", "IN"].map((op) => ({
            label: op,
            value: `${op} `,
            category: "operator" as const,
          })),
        };
      }

      if (hasTerminalSemicolon) {
        return {
          severity: "error",
          title: `Missing value after '${opTok.text}'`,
          what: `Expected a value after '${opTok.text}' before semicolon.`,
          where: "In WHERE clause",
          suggestionText: "Provide a literal value (number or 'string') to complete the condition.",
          suggestions: targetTbl ? getColumnValues(targetTbl, colName, 5).map((v) => ({
            label: v,
            value: v,
            category: "value" as const,
          })) : [],
        };
      }

      const actualValues = targetTbl ? getColumnValues(targetTbl, colName, 6) : [];
      return {
        severity: "incomplete",
        title: `Value expected after '${opTok.text}'`,
        what: `Value expected for \`${targetTbl.name}.${colName}\``,
        where: `After ${opTok.text}`,
        suggestionText: actualValues.length > 0
          ? `Actual values in \`${targetTbl.name}.${colName}\`:`
          : "Enter literal value or expression",
        suggestionsTitle: actualValues.length > 0 ? "Dataset values:" : undefined,
        suggestions: actualValues.map((v) => ({
          label: v,
          value: v,
          category: "value" as const,
        })),
      };
    }

    // Check values in WHERE condition comparisons against active dataset rows
    const VALUE_OPS = new Set(["=", "!=", "<>", "LIKE", "ILIKE"]);
    for (let w = 0; w < whereTokens.length; w++) {
      const wTok = whereTokens[w];
      if (VALUE_OPS.has(wTok.upper) && w > 0 && w + 1 < whereTokens.length) {
        const leftTok = whereTokens[w - 1];
        const valTok = whereTokens[w + 1];

        // Ensure leftTok is a valid column candidate
        if (/^[a-zA-Z_]\w*(\.[a-zA-Z_]\w*)?$/.test(leftTok.text) && !SQL_KEYWORDS.has(leftTok.upper)) {
          let colName = leftTok.text;
          let targetTbl: Table | undefined = undefined;

          if (colName.includes(".")) {
            const [tblOrAlias, pureCol] = colName.split(".");
            const actualTbl = aliasMap[tblOrAlias.toLowerCase()] || tblOrAlias.toLowerCase();
            targetTbl = schema.find((t) => t.name.toLowerCase() === actualTbl);
            colName = pureCol;
          } else if (targetTables.length > 0) {
            targetTbl = targetTables.find((t) => t.columns.some((c) => c.name.toLowerCase() === colName.toLowerCase())) || targetTables[0];
          } else {
            targetTbl = schema.find((t) => t.columns.some((c) => c.name.toLowerCase() === colName.toLowerCase()));
          }

          if (targetTbl && targetTbl.rows && targetTbl.rows.length > 0) {
            const distinctValues: (string | number)[] = [];
            const seenVals = new Set<string>();
            for (const row of targetTbl.rows) {
              const v = row[colName];
              if (v !== undefined && v !== null) {
                const key = String(v);
                if (!seenVals.has(key)) {
                  seenVals.add(key);
                  distinctValues.push(v);
                }
              }
            }

            if (distinctValues.length > 0) {
              const isSingleQuoted = valTok.text.startsWith("'") && valTok.text.endsWith("'");
              const isDoubleQuoted = valTok.text.startsWith('"') && valTok.text.endsWith('"');
              const isQuoted = isSingleQuoted || isDoubleQuoted;

              if (isQuoted) {
                const rawLiteral = valTok.text.slice(1, -1);
                const exactMatch = distinctValues.some((v) => String(v) === rawLiteral);

                if (!exactMatch) {
                  const noSpaceLiteral = rawLiteral.replace(/\s+/g, "").toLowerCase();
                  const collapsedLiteral = rawLiteral.trim().replace(/\s+/g, " ").toLowerCase();
                  const stringCandidates = distinctValues.map((v) => String(v));

                  let matchedVal: string | number | undefined = distinctValues.find(
                    (v) => String(v).replace(/\s+/g, "").toLowerCase() === noSpaceLiteral,
                  );
                  if (matchedVal === undefined) {
                    matchedVal = distinctValues.find(
                      (v) => String(v).trim().replace(/\s+/g, " ").toLowerCase() === collapsedLiteral,
                    );
                  }
                  if (matchedVal === undefined) {
                    matchedVal = distinctValues.find(
                      (v) => String(v).toLowerCase() === rawLiteral.trim().toLowerCase(),
                    );
                  }
                  if (matchedVal === undefined) {
                    const closest =
                      findClosestMatch(rawLiteral.trim(), stringCandidates, 3) ||
                      findClosestMatch(noSpaceLiteral, stringCandidates, 3);
                    if (closest) matchedVal = closest;
                  }
                  if (matchedVal === undefined && rawLiteral.trim().length >= 3) {
                    const sub = rawLiteral.trim().toLowerCase();
                    matchedVal = distinctValues.find((v) =>
                      String(v).toLowerCase().includes(sub) || sub.includes(String(v).toLowerCase()),
                    );
                  }

                  const formattedReplacement = typeof matchedVal === "number" ? String(matchedVal) : `'${matchedVal}'`;
                  const cleanDisplay = rawLiteral.trim() || rawLiteral;

                  return {
                    severity: "warning",
                    title: `No records match '${cleanDisplay}'`,
                    what: matchedVal !== undefined
                      ? `No records in \`${targetTbl.name}\` match \`${colName} = ${valTok.text}\`. Did you mean '${matchedVal}'?`
                      : `No records in \`${targetTbl.name}\` match \`${colName} = ${valTok.text}\`.`,
                    where: `In WHERE condition: ${leftTok.text} ${wTok.text} ${valTok.text}`,
                    suggestionText: matchedVal !== undefined
                      ? `Did you mean '${matchedVal}'? Choose a valid value from the dataset:`
                      : `Available values in \`${targetTbl.name}.${colName}\`:`,
                    quickFix: matchedVal !== undefined
                      ? {
                          label: `Replace with '${matchedVal}'`,
                          replacement: formattedReplacement,
                          range: [valTok.start, valTok.end] as [number, number],
                        }
                      : undefined,
                    suggestionsTitle: matchedVal !== undefined ? "Did you mean:" : `Values in \`${targetTbl.name}.${colName}\`:`,
                    suggestions: [
                      ...(matchedVal !== undefined
                        ? [
                            {
                              label: formattedReplacement,
                              value: formattedReplacement,
                              category: "value" as const,
                              rangeToReplace: [valTok.start, valTok.end] as [number, number],
                              detail: "Did you mean",
                            },
                          ]
                        : []),
                      ...distinctValues
                        .filter((v) => String(v) !== String(matchedVal))
                        .slice(0, 6)
                        .map((v) => {
                          const formatted = typeof v === "string" ? `'${v}'` : String(v);
                          return {
                            label: formatted,
                            value: formatted,
                            category: "value" as const,
                            rangeToReplace: [valTok.start, valTok.end] as [number, number],
                          };
                        }),
                    ],
                  };
                }
              } else if (!isQuoted && !/^\d+$/.test(valTok.text) && valTok.text !== ";" && !SQL_KEYWORDS.has(valTok.upper)) {
                // Unquoted string identifier (e.g. WHERE city = Mumbai)
                const candidateVal = distinctValues.find(
                  (v) => String(v).toLowerCase() === valTok.text.toLowerCase(),
                );
                if (candidateVal !== undefined) {
                  const formattedReplacement = `'${candidateVal}'`;
                  return {
                    severity: "error",
                    title: `Missing quotes around '${valTok.text}'`,
                    what: `'${valTok.text}' is a text value in \`${targetTbl.name}.${colName}\`. Text literals in SQL must be enclosed in single quotes.`,
                    where: "In WHERE condition",
                    suggestionText: `Enclose '${valTok.text}' in single quotes: '${candidateVal}'`,
                    quickFix: {
                      label: `Replace with '${candidateVal}'`,
                      replacement: formattedReplacement,
                      range: [valTok.start, valTok.end] as [number, number],
                    },
                    suggestionsTitle: "Quick Fix:",
                    suggestions: [
                      {
                        label: formattedReplacement,
                        value: formattedReplacement,
                        category: "value" as const,
                        rangeToReplace: [valTok.start, valTok.end] as [number, number],
                      },
                    ],
                  };
                }
              }
            }
          }
        }
      }
    }

    // Check for stray / unexpected tokens after conditions in WHERE clause
    for (let w = 0; w < whereTokens.length; w++) {
      const wTok = whereTokens[w];
      if (VALUE_OPS.has(wTok.upper) && w > 0 && w + 1 < whereTokens.length) {
        const nextIdx = w + 2;
        if (nextIdx < whereTokens.length) {
          const trailingTok = whereTokens[nextIdx];
          if (
            trailingTok.text !== ";" &&
            !["AND", "OR"].includes(trailingTok.upper) &&
            !["GROUP", "ORDER", "HAVING", "LIMIT", "UNION"].includes(trailingTok.upper)
          ) {
            const prevTok = whereTokens[nextIdx - 1];
            return {
              severity: "error",
              title: `Unexpected token '${trailingTok.text}'`,
              what: `Unexpected word '${trailingTok.text}' in WHERE clause after condition '${whereTokens[w - 1].text} ${wTok.text} ${whereTokens[w + 1].text}'. Expected 'AND', 'OR', or end of statement.`,
              where: `After '${prevTok.text}'`,
              suggestionText: `Remove '${trailingTok.text}' or combine conditions with 'AND' / 'OR'.`,
              quickFix: {
                label: `Remove '${trailingTok.text}'`,
                replacement: "",
                range: [prevTok.end, trailingTok.end] as [number, number],
              },
              suggestionsTitle: "Suggested fixes:",
              suggestions: [
                {
                  label: `Remove '${trailingTok.text}'`,
                  value: "",
                  category: "fix",
                  rangeToReplace: [prevTok.end, trailingTok.end] as [number, number],
                },
                {
                  label: "AND",
                  value: "AND ",
                  category: "operator",
                  rangeToReplace: [trailingTok.start, trailingTok.end] as [number, number],
                },
              ],
            };
          }
        }
      }
    }
  }

  // 12. Check Incomplete Query States based on the COMPLETE line (when NOT terminated with ;)
  if (!hasTerminalSemicolon) {
    // CASE 3: Bare "SELECT" or typing in SELECT list
    if (/^SELECT\s*$/i.test(cleanUpper)) {
      return {
        severity: "incomplete",
        title: "Continue typing your query...",
        what: "Specify columns or * after SELECT",
        where: "After SELECT",
        suggestionText: "Choose columns or * from the dataset:",
        suggestionsTitle: "Columns:",
        suggestions: [
          { label: "* (All Columns)", value: "*", category: "column" },
          ...activeColumns.slice(0, 8).map((c) => ({
            label: c.name,
            value: c.name,
            category: "column" as const,
            detail: c.tableName,
          })),
        ],
      };
    }

    // CASE 1: "SELECT *" or "SELECT col1, col2" without FROM
    if (firstToken === "SELECT" && fromIdx === -1) {
      return {
        severity: "incomplete",
        title: "Missing FROM clause",
        what: "Missing FROM clause",
        where: "After SELECT projection",
        suggestionText: "Choose a table from the current dataset:",
        suggestionsTitle: "Tables in current dataset:",
        suggestions: availableTableNames.map((t) => ({
          label: `FROM ${t}`,
          value: ` FROM ${t}`,
          category: "table" as const,
        })),
      };
    }

    // CASE 2: "FROM" or "FROM " with no table name yet
    if (/FROM\s*$/i.test(cleanUpper)) {
      return {
        severity: "incomplete",
        title: "Table name missing after FROM",
        what: "Missing table name after FROM",
        where: "After FROM",
        suggestionText: "Choose a table from the selected dataset:",
        suggestionsTitle: "Tables in current dataset:",
        suggestions: availableTableNames.map((t) => ({
          label: t,
          value: t,
          category: "table" as const,
        })),
      };
    }

    // Partial table typing at end of complete query (e.g. `SELECT * FROM cust`)
    const partialMatch = cleanUpper.match(/FROM\s+([a-zA-Z_]\w*)$/i);
    if (partialMatch) {
      const partial = partialMatch[1].toLowerCase();
      const isCompleteTable = availableTableNames.some((t) => t.toLowerCase() === partial);
      if (!isCompleteTable) {
        const filtered = availableTableNames.filter((t) => t.toLowerCase().startsWith(partial));
        if (filtered.length > 0) {
          const lastTok = tokens[tokens.length - 1];
          return {
            severity: "incomplete",
            title: "Continue typing table name...",
            what: `Matching tables for '${partial}'`,
            where: "After FROM",
            suggestionsTitle: "Matching tables:",
            suggestions: filtered.map((t) => ({
              label: t,
              value: t,
              category: "table" as const,
              rangeToReplace: [lastTok.start, lastTok.end],
            })),
          };
        }
      }
    }

    // JOIN trailing
    if (/JOIN\s*$/i.test(cleanUpper)) {
      const primaryTable = referencedTables[0]?.name.toLowerCase();
      const joinCandidates = schema.filter((t) => t.name.toLowerCase() !== primaryTable);
      return {
        severity: "incomplete",
        title: "Table name expected after JOIN",
        what: "Choose a table to join",
        where: "After JOIN",
        suggestionText: "Available tables in dataset:",
        suggestionsTitle: "Tables to join:",
        suggestions: joinCandidates.map((t) => {
          const cond = primaryTable ? findJoinCondition(primaryTable, t.name, schema) : null;
          return {
            label: t.name,
            value: cond ? `${t.name} ON ${cond}` : t.name,
            category: "table" as const,
            detail: cond ? `Relationship: ${cond}` : undefined,
          };
        }),
      };
    }

    // GROUP BY / ORDER BY trailing
    if (/GROUP\s+BY\s*$/i.test(cleanUpper) || /ORDER\s+BY\s*$/i.test(cleanUpper)) {
      const isOrder = /ORDER\s+BY\s*$/i.test(cleanUpper);
      const firstTbl = targetTables[0] || schema[0];
      return {
        severity: "incomplete",
        title: `Column expected after ${isOrder ? "ORDER BY" : "GROUP BY"}`,
        what: `Specify column to ${isOrder ? "sort by" : "group by"}`,
        where: `After ${isOrder ? "ORDER BY" : "GROUP BY"}`,
        suggestionsTitle: "Columns:",
        suggestions: [
          ...firstTbl.columns.map((c) => ({
            label: c.name,
            value: isOrder ? `${c.name} ASC` : c.name,
            category: "column" as const,
          })),
          ...(isOrder ? [{ label: "DESC", value: "DESC", category: "clause" as const }] : []),
        ],
      };
    }

    // LIMIT trailing
    if (/LIMIT\s*$/i.test(cleanUpper)) {
      return {
        severity: "incomplete",
        title: "Row limit count expected",
        what: "Specify number of rows to return",
        where: "After LIMIT",
        suggestionsTitle: "Row limits:",
        suggestions: ["5", "10", "25", "50", "100"].map((n) => ({
          label: n,
          value: n,
          category: "value" as const,
        })),
      };
    }
  }

  // 13. Full Syntax Verification of the COMPLETE statement via validateSQLAgainstSchema
  try {
    validateSQLAgainstSchema(rawSql, schema);
    return {
      severity: "valid",
      title: "Valid SQL",
      what: "Query syntax and dataset schema are valid.",
      suggestions: [],
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.toLowerCase().includes("missing") && !hasTerminalSemicolon) {
      return {
        severity: "incomplete",
        title: errorMsg,
        what: errorMsg,
        suggestions: [],
      };
    }

    // 13.1 Parse Unknown Column from schema validation
    const colMatch = errorMsg.match(/Unknown column "([^"]+)" in ([^.]+)\.?(?: Did you mean "([^"]+)")?/i);
    if (colMatch) {
      const colName = colMatch[1];
      const context = colMatch[2];
      const suggested = colMatch[3];
      const tok = tokens.find(
        (t) =>
          t.text.toLowerCase() === colName.toLowerCase() ||
          t.text.toLowerCase().endsWith("." + colName.toLowerCase()),
      );
      const range: [number, number] | undefined = tok ? [tok.start, tok.end] : undefined;

      return {
        severity: "error",
        title: `Unknown column: \`${colName}\``,
        what: errorMsg,
        where: `In ${context}`,
        suggestionText: suggested ? `Did you mean \`${suggested}\`?` : "Choose an available column:",
        quickFix: suggested && range
          ? {
            label: `Replace with \`${suggested}\``,
            replacement: suggested,
            range,
          }
          : undefined,
        suggestionsTitle: suggested ? "Did you mean:" : "Available columns:",
        suggestions: [
          ...(suggested && range
            ? [
              {
                label: suggested,
                value: suggested,
                category: "column" as const,
                rangeToReplace: range,
                detail: "Did you mean",
              },
            ]
            : []),
          ...activeColumns
            .filter((c) => c.name.toLowerCase() !== suggested?.toLowerCase())
            .map((c) => ({
              label: c.name,
              value: c.name,
              category: "column" as const,
              rangeToReplace: range,
              detail: c.type,
            })),
        ],
      };
    }

    // 13.2 Parse Unknown Table
    const tblMatch = errorMsg.match(/Unknown table "([^"]+)"\.?(?: Did you mean "([^"]+)")?/i);
    if (tblMatch) {
      const tblName = tblMatch[1];
      const suggested = tblMatch[2];
      const tok = tokens.find((t) => t.text.toLowerCase() === tblName.toLowerCase());
      const range: [number, number] | undefined = tok ? [tok.start, tok.end] : undefined;

      return {
        severity: "error",
        title: `Unknown table: \`${tblName}\``,
        what: errorMsg,
        where: "In FROM / JOIN clause",
        suggestionText: suggested ? `Did you mean \`${suggested}\`?` : "Choose a valid table:",
        quickFix: suggested && range
          ? {
            label: `Replace with \`${suggested}\``,
            replacement: suggested,
            range,
          }
          : undefined,
        suggestionsTitle: suggested ? "Did you mean:" : "Tables in current dataset:",
        suggestions: [
          ...(suggested && range
            ? [{ label: suggested, value: suggested, category: "table" as const, rangeToReplace: range }]
            : []),
          ...availableTableNames
            .filter((t) => t.toLowerCase() !== suggested?.toLowerCase())
            .map((t) => ({
              label: t,
              value: t,
              category: "table" as const,
              rangeToReplace: range,
            })),
        ],
      };
    }

    // 13.3 Parse Gibberish, Disallowed, or Unexpected token
    const tokenMatch = errorMsg.match(/(?:Unexpected gibberish token|Disallowed word|Unexpected token) "([^"]+)"/i);
    if (tokenMatch) {
      const badWord = tokenMatch[1];
      const tokIdx = tokens.findIndex((t) => t.text.toLowerCase() === badWord.toLowerCase());
      if (tokIdx !== -1) {
        const tok = tokens[tokIdx];
        const prevTok = tokIdx > 0 ? tokens[tokIdx - 1] : undefined;
        const nextTok = tokIdx + 1 < tokens.length ? tokens[tokIdx + 1] : undefined;
        const replaceStart = prevTok ? prevTok.end : tok.start;
        const replaceEnd = !prevTok && nextTok ? nextTok.start : tok.end;

        return {
          severity: "error",
          title: isGibberish(badWord) ? `Gibberish token '${badWord}'` : `Invalid token '${badWord}'`,
          what: errorMsg,
          where: prevTok ? `After '${prevTok.text}'` : "In SQL statement",
          suggestionText: `Remove '${badWord}' from the query.`,
          quickFix: {
            label: `Remove '${badWord}'`,
            replacement: "",
            range: [replaceStart, replaceEnd],
          },
          suggestionsTitle: "Quick Fix:",
          suggestions: [
            {
              label: `Remove '${badWord}'`,
              value: "",
              category: "fix",
              rangeToReplace: [replaceStart, replaceEnd],
            },
          ],
        };
      }
    }

    return {
      severity: "error",
      title: "Invalid SQL syntax",
      what: errorMsg,
      where: "In SQL statement",
      suggestionText: "Check query syntax, operators, table names, and column types.",
      suggestions: [],
    };
  }
}
