"use client";

import React, { useState } from "react";

interface PlSqlLearnViewProps {
  onBackToWorkspace?: () => void;
}

function PlSqlLearnCard({
  title,
  subtitle,
  category,
  code,
  explanation,
  isOpen,
  onToggle,
}: {
  title: string;
  subtitle: string;
  category: string;
  code: string;
  explanation: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="rounded-xl border transition-all overflow-hidden"
      style={{
        background: "var(--panel)",
        borderColor: "var(--border)",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-zinc-800/20 transition-colors"
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
              style={{
                background: "var(--surface-subtle)",
                borderColor: "var(--border)",
                color: "var(--accent)",
              }}
            >
              {category}
            </span>
            <h3 className="text-sm font-bold text-[var(--foreground)]">{title}</h3>
          </div>
          <p className="text-xs text-[var(--muted)]">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2 text-[var(--muted)] text-xs">
          <span className="hidden sm:inline font-mono">{isOpen ? "Hide" : "Click to view"}</span>
          <span className="text-sm">{isOpen ? "▲" : "▼"}</span>
        </div>
      </button>

      {isOpen && (
        <div className="p-4 pt-1 border-t flex flex-col gap-3" style={{ borderColor: "var(--border)" }}>
          <div
            className="p-3 rounded-lg font-mono text-xs overflow-x-auto leading-relaxed border"
            style={{
              background: "var(--surface-subtle)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          >
            <pre>{code}</pre>
          </div>
          <p className="text-xs leading-relaxed font-sans" style={{ color: "var(--foreground)" }}>
            {explanation}
          </p>
        </div>
      )}
    </div>
  );
}

const LEARN_MODULES = [
  {
    id: "block",
    category: "Architecture",
    title: "The Anonymous Block Structure",
    subtitle: "The fundamental execution unit in PL/SQL: DECLARE, BEGIN, EXCEPTION, END;",
    code: `DECLARE
  -- Declaration section: optional
  v_greeting VARCHAR2(50) := 'Hello, PL/SQL!';
  v_count    NUMBER := 10;
BEGIN
  -- Executable section: mandatory
  DBMS_OUTPUT.PUT_LINE(v_greeting || ' Processing count: ' || v_count);
EXCEPTION
  -- Exception section: optional
  WHEN OTHERS THEN
    DBMS_OUTPUT.PUT_LINE('An unexpected error occurred.');
END;`,
    explanation:
      "An anonymous block is an unnamed, dynamically compiled PL/SQL program unit. It is passed to the PL/SQL engine at runtime, executed in memory, and does not persist in the database catalog.",
  },
  {
    id: "variables",
    category: "Variables",
    title: "Data Types, Constants, and Assignments",
    subtitle: "Declaring scalar types, %TYPE attribute, and constant definitions",
    code: `DECLARE
  c_tax_rate CONSTANT NUMBER := 0.18; -- Constant cannot be reassigned
  v_subtotal          NUMBER(10,2) := 1500.00;
  v_tax_amount        NUMBER(10,2);
  v_customer_name     VARCHAR2(100);
BEGIN
  v_tax_amount := v_subtotal * c_tax_rate;
  DBMS_OUTPUT.PUT_LINE('Tax calculation: $' || v_tax_amount);
END;`,
    explanation:
      "PL/SQL provides rich scalar types including NUMBER, VARCHAR2, DATE, and BOOLEAN. Variables can be initialized with default values using the := assignment operator.",
  },
  {
    id: "conditional",
    category: "Branching",
    title: "Conditional Logic: IF-THEN-ELSIF-ELSE",
    subtitle: "Evaluating multiple criteria and branching execution accordingly",
    code: `DECLARE
  v_score NUMBER := 88;
BEGIN
  IF v_score >= 90 THEN
    DBMS_OUTPUT.PUT_LINE('Grade: A (Distinction)');
  ELSIF v_score >= 75 THEN
    DBMS_OUTPUT.PUT_LINE('Grade: B (Commendable)');
  ELSIF v_score >= 50 THEN
    DBMS_OUTPUT.PUT_LINE('Grade: C (Pass)');
  ELSE
    DBMS_OUTPUT.PUT_LINE('Grade: F (Remedial Required)');
  END IF;
END;`,
    explanation:
      "The ELSIF ladder allows multi-path conditional evaluation. Remember that ELSIF has no 'E' before the 'S' in Oracle PL/SQL syntax.",
  },
  {
    id: "loops",
    category: "Iteration",
    title: "Loops: FOR, WHILE, and Basic LOOP",
    subtitle: "Iterating across ranges and conditional loops",
    code: `DECLARE
  v_counter NUMBER := 1;
BEGIN
  -- 1. Numeric FOR loop (automatically declares index variable)
  FOR i IN 1..5 LOOP
    DBMS_OUTPUT.PUT_LINE('Iteration #' || i);
  END LOOP;

  -- 2. WHILE loop
  WHILE v_counter <= 3 LOOP
    DBMS_OUTPUT.PUT_LINE('While count: ' || v_counter);
    v_counter := v_counter + 1;
  END LOOP;
END;`,
    explanation:
      "PL/SQL supports three types of loops: basic LOOP with EXIT WHEN, WHILE loops with entry conditions, and numeric FOR loops that automatically increment the counter.",
  },
  {
    id: "cursors",
    category: "Cursor",
    title: "Explicit Cursors vs Cursor FOR Loops",
    subtitle: "Traversing multiple rows returned by queries",
    code: `DECLARE
  CURSOR c_customers IS
    SELECT name, city FROM customers WHERE city = 'Mumbai';
BEGIN
  -- Cursor FOR loop automatically handles OPEN, FETCH, and CLOSE
  FOR cust IN c_customers LOOP
    DBMS_OUTPUT.PUT_LINE('Customer: ' || cust.name || ' in ' || cust.city);
  END LOOP;
END;`,
    explanation:
      "A cursor is a work area pointer allocated in the private SQL area. Cursor FOR loops are best practice because they automatically manage the lifecycle and prevent resource leaks.",
  },
  {
    id: "subprograms",
    category: "Subprograms",
    title: "Stored Procedures & Functions",
    subtitle: "Reusable, compiled named blocks stored in database catalog",
    code: `-- Procedure Definition
CREATE OR REPLACE PROCEDURE grant_bonus(
  p_emp_id IN NUMBER,
  p_bonus  IN NUMBER
) IS
BEGIN
  UPDATE employees 
  SET salary = salary + p_bonus 
  WHERE id = p_emp_id;
  DBMS_OUTPUT.PUT_LINE('Bonus applied successfully to employee ' || p_emp_id);
END;`,
    explanation:
      "Procedures perform actions and can have IN, OUT, and IN OUT parameters. Functions compute and must RETURN a single scalar or collection value.",
  },
  {
    id: "triggers",
    category: "Triggers",
    title: "Database Triggers",
    subtitle: "Event-driven procedures executed automatically on DML operations",
    code: `CREATE OR REPLACE TRIGGER trg_audit_orders
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW
BEGIN
  IF :NEW.total_amount < 0 THEN
    RAISE_APPLICATION_ERROR(-20001, 'Order amount cannot be negative.');
  END IF;
  DBMS_OUTPUT.PUT_LINE('Audit: Processing order ID ' || :NEW.id);
END;`,
    explanation:
      "Triggers fire BEFORE or AFTER INSERT, UPDATE, or DELETE operations. Row-level triggers (FOR EACH ROW) can access :OLD and :NEW column values.",
  },
  {
    id: "exceptions",
    category: "Exceptions",
    title: "Predefined and Custom Exception Handling",
    subtitle: "Graceful error recovery and ORA error trapping",
    code: `DECLARE
  v_customer_name customers.name%TYPE;
BEGIN
  SELECT name INTO v_customer_name FROM customers WHERE id = 9999;
  DBMS_OUTPUT.PUT_LINE('Customer: ' || v_customer_name);
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    DBMS_OUTPUT.PUT_LINE('Handled ORA-01403: No customer matching this identifier.');
  WHEN TOO_MANY_ROWS THEN
    DBMS_OUTPUT.PUT_LINE('Handled ORA-01422: Query returned more than one tuple.');
  WHEN OTHERS THEN
    DBMS_OUTPUT.PUT_LINE('Handled unexpected error.');
END;`,
    explanation:
      "The EXCEPTION block intercepts runtime exceptions. Standard predefined exceptions include NO_DATA_FOUND, TOO_MANY_ROWS, ZERO_DIVIDE, and DUP_VAL_ON_INDEX.",
  },
];

export function PlSqlLearnView({}: PlSqlLearnViewProps) {
  const [openCards, setOpenCards] = useState<Record<string, boolean>>(() =>
    LEARN_MODULES.reduce((acc, m) => ({ ...acc, [m.id]: true }), {}),
  );

  const toggleCard = (id: string) => {
    setOpenCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    setOpenCards(
      LEARN_MODULES.reduce((acc, m) => ({ ...acc, [m.id]: true }), {}),
    );
  };

  const collapseAll = () => {
    setOpenCards({});
  };

  return (
    <main
      className="flex-1 min-h-0 flex flex-col p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 overflow-y-auto overflow-x-hidden w-full max-w-none leading-relaxed"
      style={{ color: "var(--foreground)" }}
      aria-label="Learn section: Complete PL/SQL Procedural Database Curriculum"
    >
      {/* Top Header / Breadcrumb matching LearnView.tsx */}
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
              PL/SQL Curriculum &amp; Procedural Guide
            </span>
            <span
              className="text-sm opacity-70"
              style={{ color: "var(--muted)" }}
            >
              Complete PL/SQL Blocks, Cursors, Loops &amp; Engine Internals
            </span>
          </div>
          <h1
            className="text-2xl md:text-4xl font-bold tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            PL/SQL Commands &amp; Procedural Engine Curriculum
          </h1>
          <p
            className="text-sm md:text-base opacity-80 mt-1.5"
            style={{ color: "var(--muted)" }}
          >
            Comprehensive reference manual covering all PL/SQL constructs (Block structure, Cursors, Control Flow, Subprograms, Triggers, Exceptions), operational syntax, execution behaviors, and procedural theory. Click any card to expand or collapse.
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

      {/* Cards List */}
      <div className="flex flex-col gap-4">
        {LEARN_MODULES.map((m) => (
          <PlSqlLearnCard
            key={m.id}
            category={m.category}
            title={m.title}
            subtitle={m.subtitle}
            code={m.code}
            explanation={m.explanation}
            isOpen={Boolean(openCards[m.id])}
            onToggle={() => toggleCard(m.id)}
          />
        ))}
      </div>
    </main>
  );
}
