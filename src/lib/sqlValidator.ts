import type { Table } from "./schema";
import { analyzeSQL } from "./sqlAssistant";

export type ValidationStatus = "valid" | "incomplete" | "invalid" | "empty";

export interface SQLValidationResult {
  status: ValidationStatus;
  message: string;
  detail?: string;
}

/**
 * Validates a SQL query string against the active database schema using the real-time SQL Assistant.
 */
export function validateSQL(rawSql: string, schema: Table[]): SQLValidationResult {
  const trimmed = rawSql.trim();
  if (!trimmed) {
    return { status: "empty", message: "" };
  }

  const analysis = analyzeSQL(rawSql, schema);
  let status: ValidationStatus = "valid";
  if (analysis.severity === "incomplete") {
    status = "incomplete";
  } else if (analysis.severity === "error" || analysis.severity === "warning") {
    status = "invalid";
  }

  return {
    status,
    message: analysis.what || analysis.title,
    detail: analysis.suggestionText,
  };
}

