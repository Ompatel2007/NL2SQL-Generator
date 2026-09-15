import type { PipelineStep, Row, StatementType, SQLCommand } from "./sqlEngine";
import type { QueryExplanation } from "./queryExplainer";

export interface ReportExecutionData {
  sql: string;
  nlQuestion?: string;
  inputMode: "nl" | "sql";
  datasetName: string;
  tables: string[];
  steps: PipelineStep[];
  finalRows: Row[];
  columns: string[];
  explanation: QueryExplanation;
  error?: string;
  executionDurationMs?: number;
  timestamp?: string;
  statementType?: StatementType;
  command?: SQLCommand;
}

/**
 * Downloads a text or binary Blob as a file.
 */
export function triggerFileDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates the complete execution report in Markdown (.md), matching the Explanation section.
 * Does not contain any algebraic notations (pi, sigma, etc.).
 */
export function generateMarkdownReport(data: ReportExecutionData): string {
  const timeStr = data.timestamp || new Date().toLocaleString();
  const finalRows = data.finalRows || [];
  const columns = data.columns || [];
  const steps = data.steps || [];
  const explanationSteps = data.explanation?.steps || [];

  // Final Output Table
  let finalTableMd = "_No rows returned._";
  if (finalRows.length > 0 && columns.length > 0) {
    const headerRow = `| ${columns.join(" | ")} |`;
    const separatorRow = `| ${columns.map(() => "---").join(" | ")} |`;
    const dataRows = finalRows
      .slice(0, 100)
      .map((r) => `| ${columns.map((c) => String(r[c] ?? "")).join(" | ")} |`)
      .join("\n");
    finalTableMd = `${headerRow}\n${separatorRow}\n${dataRows}`;
  }

  // Step-by-Step Breakdown (Matching Explanation section)
  const stepsMd = explanationSteps
    .map((st) => {
      const metricsStr = st.metrics
        .map((m) => `  - **${m.label}:** ${m.value}`)
        .join("\n");

      let tableSnapshot = "";
      if (st.sampleRows && st.sampleRows.length > 0 && st.columns && st.columns.length > 0) {
        const hRow = `| ${st.columns.join(" | ")} |`;
        const sRow = `| ${st.columns.map(() => "---").join(" | ")} |`;
        const rRows = st.sampleRows
          .slice(0, 5)
          .map((r) => `| ${st.columns!.map((c) => String(r[c] ?? "")).join(" | ")} |`)
          .join("\n");
        tableSnapshot = `\n\n*Working Relation Snapshot (${st.sampleRows.length} rows):*\n${hRow}\n${sRow}\n${rRows}`;
      }

      return `### STEP ${st.stepNumber} — ${st.clause}: ${st.title}\n${st.description}\n\n${metricsStr}${tableSnapshot}`;
    })
    .join("\n\n");

  // Physical Engine Pipeline Stages
  const pipelineStepsMd =
    steps.length > 0
      ? `| # | Stage | Title | Operation Detail | Rows |\n|---|---|---|---|---|\n` +
        steps
          .map(
            (s, idx) =>
              `| ${idx + 1} | ${s.stage} | ${s.title} | ${s.detail} | ${s.rowCount} rows |`,
          )
          .join("\n")
      : "_No pipeline steps recorded._";

  return `# NL to SQL Visualizer — Execution Report

**Generated:** ${timeStr}  
**Dataset:** ${data.datasetName}  
**Status:** ${data.error ? "FAILED" : "SUCCESS"}  

---

## 1. Executed SQL & Summary

\`\`\`sql
${data.sql}
\`\`\`

${data.nlQuestion ? `**Natural Language Prompt:** "${data.nlQuestion}"\n` : ""}
**Execution Summary:** ${data.explanation?.summary || "Query execution completed."}

---

## 2. Step-by-Step Relational Execution Breakdown
${stepsMd || "_No relational breakdown steps available._"}

---

## 3. Physical Engine Pipeline Stages
${pipelineStepsMd}

---

## 4. Final Output Relation
- **Total Rows Returned:** ${finalRows.length}
- **Attributes:** ${columns.join(", ") || "None"}

${finalTableMd}

---

## 5. Execution Metrics & Status
- **Statement Type:** ${data.statementType || "DQL"}
- **Command:** ${data.command || "SELECT"}
- **Pipeline Stages Evaluated:** ${steps.length}
- **Final Result Cardinality:** ${finalRows.length} rows
- **Execution Duration:** ${data.executionDurationMs != null ? `${data.executionDurationMs} ms` : "Instantaneous (in-memory)"}
- **Errors / Warnings:** ${data.error ? `ERROR: ${data.error}` : "Clean execution with 0 errors."}
`;
}

/**
 * Generates the complete execution report in plain text (.txt).
 * Identical structure and details to the Explanation section and PDF/DOCX reports.
 */
export function generateTextReport(data: ReportExecutionData): string {
  const timeStr = data.timestamp || new Date().toLocaleString();
  const finalRows = data.finalRows || [];
  const columns = data.columns || [];
  const steps = data.steps || [];
  const explanationSteps = data.explanation?.steps || [];

  const divider = "================================================================================";
  const subDivider = "--------------------------------------------------------------------------------";

  let out = `${divider}\n`;
  out += `NL TO SQL VISUALIZER — EXECUTION REPORT\n`;
  out += `Generated: ${timeStr}\n`;
  out += `Dataset: ${data.datasetName}\n`;
  out += `Status: ${data.error ? "FAILED" : "SUCCESS"}\n`;
  out += `${divider}\n\n`;

  // 1. User Input & Executed SQL
  out += `1. USER INPUT & EXECUTED SQL\n${subDivider}\n`;
  if (data.nlQuestion) {
    out += `Natural Language Prompt: "${data.nlQuestion}"\n`;
  }
  out += `Executed SQL:\n  ${data.sql}\n\n`;
  out += `Summary:\n  ${data.explanation?.summary || "Query execution completed."}\n\n`;

  // 2. Step-by-Step Relational Execution Breakdown
  out += `2. STEP-BY-STEP RELATIONAL EXECUTION BREAKDOWN\n${subDivider}\n`;
  for (const st of explanationSteps) {
    out += `[STEP ${st.stepNumber} - ${st.clause}] ${st.title}\n`;
    out += `  Description: ${st.description}\n`;
    for (const m of st.metrics) {
      out += `  * ${m.label}: ${m.value}\n`;
    }
    if (st.sampleRows && st.sampleRows.length > 0 && st.columns && st.columns.length > 0) {
      out += `  Working Snapshot (${st.sampleRows.length} rows):\n`;
      out += `    ${st.columns.join(" | ")}\n`;
      for (const r of st.sampleRows.slice(0, 5)) {
        out += `    ${st.columns.map((c) => String(r[c] ?? "")).join(" | ")}\n`;
      }
    }
    out += `\n`;
  }

  // 3. Physical Engine Pipeline Stages
  out += `3. PHYSICAL ENGINE PIPELINE STAGES\n${subDivider}\n`;
  for (let idx = 0; idx < steps.length; idx++) {
    const s = steps[idx];
    out += `  #${idx + 1} [${s.stage}] ${s.title}: ${s.detail} (${s.rowCount} rows)\n`;
  }
  out += `\n`;

  // 4. Final Output Relation
  out += `4. FINAL OUTPUT RELATION\n${subDivider}\n`;
  out += `Total Rows Returned: ${finalRows.length}\n`;
  out += `Attributes: ${columns.join(", ") || "None"}\n\n`;

  if (finalRows.length > 0 && columns.length > 0) {
    out += columns.join("\t") + "\n";
    out += columns.map(() => "---").join("\t") + "\n";
    for (const r of finalRows.slice(0, 50)) {
      out += columns.map((c) => String(r[c] ?? "")).join("\t") + "\n";
    }
    if (finalRows.length > 50) {
      out += `... and ${finalRows.length - 50} more rows\n`;
    }
  } else {
    out += `Query executed successfully, but 0 rows matched the condition.\n`;
  }
  out += `\n`;

  // 5. Execution Metrics & Status
  out += `5. EXECUTION METRICS & STATUS\n${subDivider}\n`;
  out += `Statement Type: ${data.statementType || "DQL"}\n`;
  out += `Command: ${data.command || "SELECT"}\n`;
  out += `Pipeline Stages: ${steps.length}\n`;
  out += `Execution Duration: ${data.executionDurationMs != null ? `${data.executionDurationMs} ms` : "Instantaneous"}\n`;
  out += `Errors: ${data.error ? data.error : "Clean execution with 0 errors."}\n\n`;
  out += `${divider}\n`;

  return out;
}

/**
 * Generates and triggers download for a PDF report matching the Explanation section.
 * Clean typography without Greek algebraic symbols or character corruption.
 */
export async function downloadPdfReport(data: ReportExecutionData) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const finalRows = data.finalRows || [];
  const columns = data.columns || [];
  const steps = data.steps || [];
  const explanationSteps = data.explanation?.steps || [];

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top Banner
  doc.setFillColor(124, 58, 237); // Purple accent
  doc.rect(0, 0, pageWidth, 26, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text("NL to SQL Visualizer - Execution Report", 14, 17);

  // Metadata Subtitle
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const timeStr = data.timestamp || new Date().toLocaleString();
  doc.text(
    `Generated: ${timeStr}   |   Dataset: ${data.datasetName}   |   Status: ${data.error ? "FAILED" : "SUCCESS"}`,
    14,
    34,
  );

  let currentY = 42;

  // 1. Executed SQL Box
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text("1. Executed SQL Query", 14, currentY);
  currentY += 5;

  if (data.nlQuestion) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`Natural Language: "${data.nlQuestion}"`, 14, currentY);
    currentY += 5;
  }

  // SQL Code Box
  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  doc.setFillColor(245, 245, 247);
  const sqlLines = doc.splitTextToSize(data.sql, pageWidth - 32);
  const boxHeight = Math.max(16, sqlLines.length * 5 + 8);
  doc.rect(14, currentY, pageWidth - 28, boxHeight, "F");
  doc.setTextColor(30, 30, 30);
  doc.text(sqlLines, 18, currentY + 7);
  currentY += boxHeight + 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  const sumLines = doc.splitTextToSize(data.explanation?.summary || "Query execution completed.", pageWidth - 28);
  doc.text(sumLines, 14, currentY);
  currentY += sumLines.length * 4 + 6;

  // 2. Step-by-Step Relational Execution Breakdown
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text("2. Step-by-Step Relational Execution Breakdown", 14, currentY);
  currentY += 6;

  for (const st of explanationSteps) {
    if (currentY > 255) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(124, 58, 237);
    doc.text(`[STEP ${st.stepNumber} - ${st.clause}] ${st.title}`, 14, currentY);
    currentY += 4.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(50, 50, 50);
    const descLines = doc.splitTextToSize(st.description, pageWidth - 28);
    doc.text(descLines, 14, currentY);
    currentY += descLines.length * 4 + 2;

    // Metrics
    for (const m of st.metrics) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(70, 70, 70);
      doc.text(`* ${m.label}: `, 18, currentY);
      const labelW = doc.getTextWidth(`* ${m.label}: `);
      doc.setFont("helvetica", "normal");
      doc.text(String(m.value), 18 + labelW, currentY);
      currentY += 4;
    }
    currentY += 3;

    // Snapshot table if available
    if (st.sampleRows && st.sampleRows.length > 0 && st.columns && st.columns.length > 0) {
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }
      const snapshotBody = st.sampleRows.slice(0, 5).map((r) =>
        st.columns!.map((c) => String(r[c] ?? "")),
      );
      autoTable(doc, {
        startY: currentY,
        head: [st.columns],
        body: snapshotBody,
        theme: "plain",
        headStyles: { fillColor: [240, 240, 245], textColor: 40, fontSize: 7.5, fontStyle: "bold" },
        styles: { fontSize: 7, cellPadding: 1.5 },
        margin: { left: 18, right: 18 },
      });
      // @ts-expect-error autoTable adds lastAutoTable
      currentY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 6 : currentY + 25;
    }
  }

  // 3. Physical Execution Pipeline Stages
  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text("3. Physical Engine Pipeline Stages", 14, currentY);
  currentY += 4;

  const pipelineRows = steps.map((s, idx) => [
    String(idx + 1),
    s.stage,
    s.title,
    s.detail,
    `${s.rowCount} rows`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [["#", "Stage", "Title", "Operation Detail", "Rows"]],
    body: pipelineRows,
    theme: "striped",
    headStyles: { fillColor: [124, 58, 237], textColor: 255, fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    margin: { left: 14, right: 14 },
  });

  // @ts-expect-error autoTable adds lastAutoTable to doc
  currentY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 10 : currentY + 40;

  // 4. Final Output Table
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text(`4. Final Output Relation (${finalRows.length} rows)`, 14, currentY);
  currentY += 4;

  if (finalRows.length > 0 && columns.length > 0) {
    const tableBody = finalRows.slice(0, 100).map((r) =>
      columns.map((c) => String(r[c] ?? "")),
    );

    autoTable(doc, {
      startY: currentY,
      head: [columns],
      body: tableBody,
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { left: 14, right: 14 },
    });
    // @ts-expect-error autoTable adds lastAutoTable
    currentY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 8 : currentY + 30;
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("Query executed successfully, but 0 rows matched the condition.", 14, currentY + 5);
    currentY += 12;
  }

  // 5. Execution Metrics & Status
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text("5. Execution Metrics & Status", 14, currentY);
  currentY += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  doc.text(`Statement Type: ${data.statementType || "DQL"}   |   Command: ${data.command || "SELECT"}   |   Stages: ${steps.length}`, 14, currentY);
  currentY += 4;
  doc.text(`Duration: ${data.executionDurationMs != null ? `${data.executionDurationMs} ms` : "Instantaneous"}   |   Status: ${data.error ? `Error: ${data.error}` : "Clean execution (0 errors)"}`, 14, currentY);

  doc.save("nl-to-sql-execution-report.pdf");
}

/**
 * Generates and triggers download for a DOCX report matching the Explanation section.
 * Exactly matches PDF, TXT, and Markdown with zero algebraic notations.
 */
export async function downloadDocxReport(data: ReportExecutionData) {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    Table: DocxTable,
    TableRow: DocxTableRow,
    TableCell: DocxTableCell,
    WidthType,
  } = await import("docx");

  const timeStr = data.timestamp || new Date().toLocaleString();
  const finalRows = data.finalRows || [];
  const columns = data.columns || [];
  const steps = data.steps || [];
  const explanationSteps = data.explanation?.steps || [];
  const children: any[] = [];

  // Title
  children.push(
    new Paragraph({
      text: "NL to SQL Visualizer — Execution Report",
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 },
    }),
  );

  // Meta info
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated: ${timeStr}  |  Dataset: ${data.datasetName}  |  Status: ${data.error ? "FAILED" : "SUCCESS"}`,
          italics: true,
          color: "666666",
        }),
      ],
      spacing: { after: 300 },
    }),
  );

  // 1. User Input & Executed SQL
  children.push(
    new Paragraph({
      text: "1. User Input & Executed SQL",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 100 },
    }),
  );

  if (data.nlQuestion) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Natural Language Query: ", bold: true }),
          new TextRun({ text: `"${data.nlQuestion}"`, italics: true }),
        ],
        spacing: { after: 100 },
      }),
    );
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: data.sql, font: "Courier New", size: 20 }),
      ],
      spacing: { after: 150 },
    }),
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Summary: ${data.explanation?.summary || "Query execution completed."}`, italics: true }),
      ],
      spacing: { after: 300 },
    }),
  );

  // 2. Step-by-Step Relational Execution Breakdown
  children.push(
    new Paragraph({
      text: "2. Step-by-Step Relational Execution Breakdown",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 100 },
    }),
  );

  for (const st of explanationSteps) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `STEP ${st.stepNumber} — ${st.clause}: ${st.title}`,
            bold: true,
            color: "4F46E5",
          }),
        ],
        spacing: { before: 100, after: 50 },
      }),
    );
    children.push(
      new Paragraph({
        text: st.description,
        spacing: { after: 50 },
      }),
    );
    for (const m of st.metrics) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `• ${m.label}: `, bold: true }),
            new TextRun({ text: String(m.value) }),
          ],
          indent: { left: 400 },
          spacing: { after: 20 },
        }),
      );
    }

    // Intermediate Working Relation Snapshot Table
    if (st.sampleRows && st.sampleRows.length > 0 && st.columns && st.columns.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Working Relation Snapshot (${st.sampleRows.length} rows):`,
              italics: true,
              size: 18,
              color: "4B5563",
            }),
          ],
          indent: { left: 400 },
          spacing: { before: 80, after: 40 },
        }),
      );

      const snapCols = st.columns;
      const snapHead = new DocxTableRow({
        children: snapCols.map(
          (col) =>
            new DocxTableCell({
              shading: { fill: "F3F4F6" },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: col, bold: true, size: 16 })],
                }),
              ],
            }),
        ),
      });

      const snapRows = st.sampleRows.slice(0, 5).map(
        (r) =>
          new DocxTableRow({
            children: snapCols.map(
              (col) =>
                new DocxTableCell({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: String(r[col] ?? ""), size: 16 })],
                    }),
                  ],
                }),
            ),
          }),
      );

      children.push(
        new DocxTable({
          width: { size: 95, type: WidthType.PERCENTAGE },
          rows: [snapHead, ...snapRows],
        }),
      );
    }

    // Spacer after step
    children.push(
      new Paragraph({
        spacing: { after: 120 },
      }),
    );
  }

  // 3. Physical Engine Pipeline Stages
  children.push(
    new Paragraph({
      text: "3. Physical Engine Pipeline Stages",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 100 },
    }),
  );

  if (steps.length > 0) {
    const pipelineHead = new DocxTableRow({
      children: ["#", "Stage", "Title", "Operation Detail", "Rows"].map(
        (col) =>
          new DocxTableCell({
            children: [new Paragraph({ children: [new TextRun({ text: col, bold: true })] })],
          }),
      ),
    });

    const pipelineRows = steps.map(
      (s, idx) =>
        new DocxTableRow({
          children: [
            String(idx + 1),
            s.stage,
            s.title,
            s.detail,
            `${s.rowCount} rows`,
          ].map(
            (c) =>
              new DocxTableCell({
                children: [new Paragraph({ text: c })],
              }),
          ),
        }),
    );

    children.push(
      new DocxTable({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [pipelineHead, ...pipelineRows],
      }),
    );
  }

  // 4. Final Output Table
  children.push(
    new Paragraph({
      text: `4. Final Output Relation (${finalRows.length} rows)`,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 100 },
    }),
  );

  if (finalRows.length > 0 && columns.length > 0) {
    const headerRow = new DocxTableRow({
      children: columns.map(
        (col) =>
          new DocxTableCell({
            children: [new Paragraph({ children: [new TextRun({ text: col, bold: true })] })],
          }),
      ),
    });

    const dataRows = finalRows.slice(0, 50).map(
      (r) =>
        new DocxTableRow({
          children: columns.map(
            (c) =>
              new DocxTableCell({
                children: [new Paragraph({ text: String(r[c] ?? "") })],
              }),
          ),
        }),
    );

    children.push(
      new DocxTable({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [headerRow, ...dataRows],
      }),
    );
  } else {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Query executed successfully, but 0 rows matched the condition.",
            italics: true,
          }),
        ],
      }),
    );
  }

  // 5. Execution Metrics & Status
  children.push(
    new Paragraph({
      text: "5. Execution Metrics & Status",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 100 },
    }),
  );
  children.push(
    new Paragraph({
      text: `Statement Type: ${data.statementType || "DQL"}  |  Command: ${data.command || "SELECT"}  |  Pipeline Stages: ${steps.length}`,
    }),
  );
  children.push(
    new Paragraph({
      text: data.error ? `Error: ${data.error}` : "Status: Clean execution with 0 errors.",
    }),
  );

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(doc);
  triggerFileDownload(blob, "nl-to-sql-execution-report.docx");
}
