// Curated PL/SQL examples and templates for each active dataset

export interface PLSQLExample {
  id: number;
  category: "Procedural" | "Cursor" | "Control Flow" | "Exception" | "DML Trigger";
  question: string;
  sql: string;
  expected: string;
}

export const DATASET_PLSQL_DEFAULTS: Record<string, string> = {
  ecommerce: `DECLARE
  v_count NUMBER := 0;
  CURSOR c_cust IS
    SELECT name, city FROM customers WHERE city = 'Mumbai';
BEGIN
  DBMS_OUTPUT.PUT_LINE('=== Customer Regional Dispatch ===');
  FOR rec IN c_cust LOOP
    v_count := v_count + 1;
    DBMS_OUTPUT.PUT_LINE('Customer #' || v_count || ': ' || rec.name || ' [' || rec.city || ']');
  END LOOP;
  DBMS_OUTPUT.PUT_LINE('Total customers processed in Mumbai: ' || v_count);
END;`,

  university: `DECLARE
  v_total_students NUMBER := 0;
  CURSOR c_students IS
    SELECT name, major, gpa FROM students WHERE gpa >= 3.5;
BEGIN
  DBMS_OUTPUT.PUT_LINE('=== Dean''s Honor Roll Evaluation ===');
  FOR s IN c_students LOOP
    v_total_students := v_total_students + 1;
    DBMS_OUTPUT.PUT_LINE('Dean''s List: ' || s.name || ' | Major: ' || s.major || ' (GPA: ' || s.gpa || ')');
  END LOOP;
  DBMS_OUTPUT.PUT_LINE('Total high-achieving students: ' || v_total_students);
END;`,

  library: `DECLARE
  v_loan_count NUMBER := 0;
  CURSOR c_books IS
    SELECT title, genre, pages FROM books WHERE pages > 300;
BEGIN
  DBMS_OUTPUT.PUT_LINE('=== Extended Reading Catalog Audit ===');
  FOR b IN c_books LOOP
    v_loan_count := v_loan_count + 1;
    DBMS_OUTPUT.PUT_LINE('Title: ' || b.title || ' (' || b.genre || ') - ' || b.pages || ' pgs');
  END LOOP;
  DBMS_OUTPUT.PUT_LINE('Total extensive volumes identified: ' || v_loan_count);
END;`,

  healthcare: `DECLARE
  v_senior_count NUMBER := 0;
  CURSOR c_patients IS
    SELECT name, city, age FROM patients WHERE age >= 40;
BEGIN
  DBMS_OUTPUT.PUT_LINE('=== Preventive Care Outreach Roster ===');
  FOR p IN c_patients LOOP
    v_senior_count := v_senior_count + 1;
    DBMS_OUTPUT.PUT_LINE('Patient: ' || p.name || ' | Age: ' || p.age || ' | City: ' || p.city);
  END LOOP;
  DBMS_OUTPUT.PUT_LINE('Identified for wellness check: ' || v_senior_count || ' patients');
END;`,

  company: `DECLARE
  v_emp_count NUMBER := 0;
  v_high_earners NUMBER := 0;
  CURSOR c_emp IS
    SELECT name, department, salary FROM employees;
BEGIN
  DBMS_OUTPUT.PUT_LINE('=== Annual Compensation Review ===');
  FOR emp IN c_emp LOOP
    v_emp_count := v_emp_count + 1;
    IF emp.salary >= 80000 THEN
      v_high_earners := v_high_earners + 1;
      DBMS_OUTPUT.PUT_LINE('[SENIOR TIER] ' || emp.name || ' (' || emp.department || ') - $' || emp.salary);
    ELSE
      DBMS_OUTPUT.PUT_LINE('[STANDARD TIER] ' || emp.name || ' (' || emp.department || ') - $' || emp.salary);
    END IF;
  END LOOP;
  DBMS_OUTPUT.PUT_LINE('Total Staff: ' || v_emp_count || ' | Senior Compensated: ' || v_high_earners);
END;`,
};

export const DATASET_PLSQL_EXAMPLES: Record<string, PLSQLExample[]> = {
  ecommerce: [
    {
      id: 1,
      category: "Cursor",
      question: "Iterate through customers in Mumbai and log their names",
      sql: `DECLARE
  v_count NUMBER := 0;
  CURSOR c_cust IS
    SELECT name, city FROM customers WHERE city = 'Mumbai';
BEGIN
  DBMS_OUTPUT.PUT_LINE('--- Processing Customers in Mumbai ---');
  FOR rec IN c_cust LOOP
    v_count := v_count + 1;
    DBMS_OUTPUT.PUT_LINE('Customer #' || v_count || ': ' || rec.name || ' (' || rec.city || ')');
  END LOOP;
  DBMS_OUTPUT.PUT_LINE('Finished processing ' || v_count || ' customer(s).');
END;`,
      expected: "Loops through customers in Mumbai and logs each row to DBMS_OUTPUT.",
    },
    {
      id: 2,
      category: "Control Flow",
      question: "Audit high-value orders using IF-THEN conditions",
      sql: `DECLARE
  v_audit_count NUMBER := 0;
  CURSOR c_orders IS
    SELECT id, total_amount, status FROM orders;
BEGIN
  DBMS_OUTPUT.PUT_LINE('=== High-Value Order Verification ===');
  FOR o IN c_orders LOOP
    IF o.total_amount >= 500 THEN
      v_audit_count := v_audit_count + 1;
      DBMS_OUTPUT.PUT_LINE('PRIORITY AUDIT: Order #' || o.id || ' with amount $' || o.total_amount || ' [' || o.status || ']');
    ELSE
      DBMS_OUTPUT.PUT_LINE('Standard: Order #' || o.id || ' ($' || o.total_amount || ')');
    END IF;
  END LOOP;
  DBMS_OUTPUT.PUT_LINE('Total priority orders requiring review: ' || v_audit_count);
END;`,
      expected: "Inspects orders, flags those with amount >= $500 as priority, and tallies count.",
    },
    {
      id: 3,
      category: "DML Trigger",
      question: "Apply promotion: update customer city and record affected rows",
      sql: `DECLARE
  v_target_city VARCHAR2(50) := 'Mumbai';
BEGIN
  DBMS_OUTPUT.PUT_LINE('Initiating regional territory synchronization...');
  UPDATE customers SET city = 'Navi Mumbai' WHERE city = 'Mumbai';
  DBMS_OUTPUT.PUT_LINE('Regional synchronization completed for customers in ' || v_target_city);
END;`,
      expected: "Executes DML update in PL/SQL block and logs confirmation.",
    },
    {
      id: 4,
      category: "Procedural",
      question: "Simulate order calculation with numeric loop and variable math",
      sql: `DECLARE
  v_subtotal NUMBER := 250;
  v_tax_rate CONSTANT NUMBER := 0.18;
  v_tax_amount NUMBER := 0;
  v_final_total NUMBER := 0;
BEGIN
  v_tax_amount := v_subtotal * v_tax_rate;
  v_final_total := v_subtotal + v_tax_amount;
  DBMS_OUTPUT.PUT_LINE('Subtotal: $' || v_subtotal);
  DBMS_OUTPUT.PUT_LINE('Calculated GST (18%): $' || v_tax_amount);
  DBMS_OUTPUT.PUT_LINE('Grand Total Payable: $' || v_final_total);
END;`,
      expected: "Performs procedural calculation and outputs invoice breakdown.",
    },
    {
      id: 5,
      category: "Exception",
      question: "Single customer lookup with NO_DATA_FOUND exception handler",
      sql: `DECLARE
  v_name VARCHAR2(100);
BEGIN
  DBMS_OUTPUT.PUT_LINE('Searching for customer ID 999...');
  SELECT name INTO v_name FROM customers WHERE id = 999;
  DBMS_OUTPUT.PUT_LINE('Found customer: ' || v_name);
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    DBMS_OUTPUT.PUT_LINE('Handled ORA-01403: Customer record not found in database.');
END;`,
      expected: "Handles missing record with an explicit PL/SQL exception block.",
    },
  ],

  university: [
    {
      id: 1,
      category: "Cursor",
      question: "Check students with GPA >= 3.5 and output honors classification",
      sql: `DECLARE
  v_honors NUMBER := 0;
  CURSOR c_std IS
    SELECT name, major, gpa FROM students WHERE gpa >= 3.5;
BEGIN
  DBMS_OUTPUT.PUT_LINE('=== Academic Honors Candidates ===');
  FOR s IN c_std LOOP
    v_honors := v_honors + 1;
    DBMS_OUTPUT.PUT_LINE('Candidate ' || v_honors || ': ' || s.name || ' (' || s.major || ', GPA: ' || s.gpa || ')');
  END LOOP;
  DBMS_OUTPUT.PUT_LINE('Total Honors Candidates: ' || v_honors);
END;`,
      expected: "Evaluates academic excellence candidates.",
    },
    {
      id: 2,
      category: "Control Flow",
      question: "Classify students into Honor, Pass, or Academic Review tiers",
      sql: `DECLARE
  CURSOR c_all IS
    SELECT name, gpa FROM students;
BEGIN
  FOR s IN c_all LOOP
    IF s.gpa >= 3.7 THEN
      DBMS_OUTPUT.PUT_LINE(s.name || ' [SUMMA CUM LAUDE - GPA: ' || s.gpa || ']');
    ELSIF s.gpa >= 3.3 THEN
      DBMS_OUTPUT.PUT_LINE(s.name || ' [DEAN''S LIST - GPA: ' || s.gpa || ']');
    ELSE
      DBMS_OUTPUT.PUT_LINE(s.name || ' [GOOD STANDING - GPA: ' || s.gpa || ']');
    END IF;
  END LOOP;
END;`,
      expected: "Multi-branch conditional classification of student performance.",
    },
  ],

  healthcare: [
    {
      id: 1,
      category: "Cursor",
      question: "Audit patient appointments and alert on pending visits",
      sql: `DECLARE
  v_total NUMBER := 0;
  CURSOR c_pts IS
    SELECT name, city, age FROM patients WHERE city = 'Mumbai';
BEGIN
  DBMS_OUTPUT.PUT_LINE('--- Mumbai Healthcare District Audit ---');
  FOR p IN c_pts LOOP
    v_total := v_total + 1;
    DBMS_OUTPUT.PUT_LINE('Patient record: ' || p.name || ' (Age: ' || p.age || ')');
  END LOOP;
  DBMS_OUTPUT.PUT_LINE('Total Patients in District: ' || v_total);
END;`,
      expected: "Inspects patients in Mumbai district.",
    },
  ],

  library: [
    {
      id: 1,
      category: "Cursor",
      question: "Examine books collection for volumes with over 300 pages",
      sql: `DECLARE
  v_count NUMBER := 0;
  CURSOR c_b IS
    SELECT title, pages FROM books WHERE pages > 300;
BEGIN
  DBMS_OUTPUT.PUT_LINE('Listing extended volumes:');
  FOR b IN c_b LOOP
    v_count := v_count + 1;
    DBMS_OUTPUT.PUT_LINE('#' || v_count || ': ' || b.title || ' (' || b.pages || ' pages)');
  END LOOP;
  DBMS_OUTPUT.PUT_LINE('Total found: ' || v_count);
END;`,
      expected: "Cursor loop over library books with pages filter.",
    },
  ],

  company: [
    {
      id: 1,
      category: "Control Flow",
      question: "Evaluate staff compensation tiers with conditional branching",
      sql: `DECLARE
  CURSOR c_emp IS
    SELECT name, department, salary FROM employees;
BEGIN
  DBMS_OUTPUT.PUT_LINE('=== Compensation Audit ===');
  FOR e IN c_emp LOOP
    IF e.salary >= 80000 THEN
      DBMS_OUTPUT.PUT_LINE('Executive Tier: ' || e.name || ' ($' || e.salary || ')');
    ELSE
      DBMS_OUTPUT.PUT_LINE('Associate Tier: ' || e.name || ' ($' || e.salary || ')');
    END IF;
  END LOOP;
END;`,
      expected: "Loops through employees with salary condition.",
    },
  ],
};

export function getPlSqlDefault(datasetId: string): string {
  return (
    DATASET_PLSQL_DEFAULTS[datasetId] ??
    DATASET_PLSQL_DEFAULTS.ecommerce
  );
}

export function getPlSqlExamples(datasetId: string): PLSQLExample[] {
  return (
    DATASET_PLSQL_EXAMPLES[datasetId] ??
    DATASET_PLSQL_EXAMPLES.ecommerce
  );
}
