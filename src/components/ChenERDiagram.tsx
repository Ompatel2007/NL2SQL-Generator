"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import type { Table, Column } from "@/lib/schema";

interface ChenERDiagramProps {
  schema: Table[];
}

// Layout element types
interface Point {
  x: number;
  y: number;
}

interface EntityLayout {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

interface AttributeLayout {
  id: string;
  name: string;
  isPk: boolean;
  type: string;
  x: number;
  y: number;
  rx: number;
  ry: number;
  entityId: string;
  lineStart: Point;
  lineEnd: Point;
}

interface RelationshipLayout {
  id: string;
  name: string;
  fromTable: string;
  toTable: string;
  x: number;
  y: number;
  fromPoint: Point;
  toPoint: Point;
  cardinalityFrom: string;
  cardinalityTo: string;
  cardFromPoint: Point;
  cardToPoint: Point;
}

interface ChenDiagramData {
  entities: EntityLayout[];
  attributes: AttributeLayout[];
  relationships: RelationshipLayout[];
  viewBox: {
    minX: number;
    minY: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  };
}

// Calculate attribute oval radius based on text length
function getAttributeDimensions(name: string, isSingleTable: boolean) {
  const clean = name.trim().toUpperCase();
  const basePad = isSingleTable ? 24 : 18;
  const charWidth = isSingleTable ? 6.4 : 5.6;
  const rx = Math.max(isSingleTable ? 48 : 42, Math.round(clean.length * charWidth + basePad));
  const ry = isSingleTable ? 24 : 21;
  return { rx, ry, label: clean };
}

// Calculate entity rectangle dimensions
function getEntityDimensions(name: string, isSingleTable: boolean) {
  const clean = name.trim().toUpperCase();
  const width = Math.max(isSingleTable ? 170 : 150, Math.round(clean.length * (isSingleTable ? 13 : 11) + 48));
  const height = isSingleTable ? 54 : 48;
  return { width, height, label: clean };
}

// Detect foreign key relationships between tables
function detectRelationships(tables: Table[]) {
  const rels: { from: string; to: string; colName: string; relName: string }[] = [];
  const tableNames = new Set(tables.map((t) => t.name.toLowerCase()));

  for (const table of tables) {
    for (const col of table.columns) {
      if (col.fk && tableNames.has(col.fk.table.toLowerCase())) {
        rels.push({
          from: table.name,
          to: col.fk.table,
          colName: col.name,
          relName: deriveRelName(table.name, col.fk.table),
        });
      } else if (col.name.toLowerCase().endsWith("_id") || col.name.toLowerCase().startsWith("id_")) {
        // Inferred foreign key
        const potentialTarget = col.name.toLowerCase().replace(/_id$/, "").replace(/^id_/, "");
        const matched = tables.find(
          (t) =>
            t.name.toLowerCase() === potentialTarget ||
            t.name.toLowerCase() === `${potentialTarget}s` ||
            t.name.toLowerCase() === `${potentialTarget}es`
        );
        if (matched && matched.name.toLowerCase() !== table.name.toLowerCase()) {
          rels.push({
            from: table.name,
            to: matched.name,
            colName: col.name,
            relName: deriveRelName(table.name, matched.name),
          });
        }
      }
    }
  }

  // Deduplicate pairs
  const uniqueRels: typeof rels = [];
  const seen = new Set<string>();
  for (const r of rels) {
    const key = [r.from.toLowerCase(), r.to.toLowerCase()].sort().join("::");
    if (!seen.has(key)) {
      seen.add(key);
      uniqueRels.push(r);
    }
  }

  return uniqueRels;
}

function deriveRelName(sourceTable: string, targetTable: string): string {
  const s = sourceTable.toLowerCase();
  const t = targetTable.toLowerCase();

  if ((s.includes("order") && t.includes("customer")) || (t.includes("order") && s.includes("customer"))) {
    return "PLACES";
  }
  if ((s.includes("order_item") && t.includes("order")) || (t.includes("order_item") && s.includes("order"))) {
    return "CONTAINS";
  }
  if ((s.includes("order_item") && t.includes("product")) || (t.includes("order_item") && s.includes("product"))) {
    return "CONTAINS";
  }
  if ((s.includes("loan") && (t.includes("book") || t.includes("member"))) || ((s.includes("book") || s.includes("member")) && t.includes("loan"))) {
    return "BORROWS";
  }
  if ((s.includes("visit") && (t.includes("patient") || t.includes("doctor"))) || ((s.includes("patient") || s.includes("doctor")) && t.includes("visit"))) {
    return "VISITS";
  }
  if (s.includes("item") || t.includes("item") || s.includes("product") || t.includes("product")) {
    return "HAS";
  }
  return "RELATES_TO";
}

// Master layout computation for Chen ER Diagrams
function computeChenDiagramLayout(schema: Table[]): ChenDiagramData {
  const entities: EntityLayout[] = [];
  const attributes: AttributeLayout[] = [];
  const relationships: RelationshipLayout[] = [];

  const isSingle = schema.length === 1;
  const rels = detectRelationships(schema);

  if (isSingle) {
    // -------------------------------------------------------------
    // CASE 1: Single Entity (Generous spacing, centered, elegant arc)
    // -------------------------------------------------------------
    const table = schema[0];
    const { width, height, label } = getEntityDimensions(table.name, true);
    const centerX = 460;
    const centerY = 140;

    const entLayout: EntityLayout = {
      id: table.name,
      name: label,
      x: centerX - width / 2,
      y: centerY - height / 2,
      width,
      height,
      centerX,
      centerY,
    };
    entities.push(entLayout);

    const cols = table.columns;
    const N = cols.length;

    if (N <= 6) {
      // Fan out in a single wide row / arc below the entity
      const attrDims = cols.map((c) => getAttributeDimensions(c.name, true));
      // Generous horizontal spacing so ovals never crowd or overlap
      const maxRx = Math.max(...attrDims.map((d) => d.rx));
      const stepX = Math.max(140, maxRx * 2 + 32);
      const totalWidth = (N - 1) * stepX;
      const startX = centerX - totalWidth / 2;

      cols.forEach((col, idx) => {
        const dim = attrDims[idx];
        const attrX = startX + idx * stepX;
        // Subtle parabolic arc for aesthetics
        const arcCurve = Math.abs(idx - (N - 1) / 2) * 16;
        const attrY = centerY + 155 + arcCurve;

        const entityContactX = centerX + (idx - (N - 1) / 2) * (width / Math.max(N + 1, 3));
        const entityContactY = centerY + height / 2;

        attributes.push({
          id: `${table.name}_${col.name}`,
          name: dim.label,
          isPk: !!col.pk,
          type: col.type,
          x: attrX,
          y: attrY,
          rx: dim.rx,
          ry: dim.ry,
          entityId: table.name,
          lineStart: { x: entityContactX, y: entityContactY },
          lineEnd: { x: attrX, y: attrY - dim.ry },
        });
      });
    } else {
      // Split into top and bottom tiers for large number of columns
      const half = Math.ceil(N / 2);
      const topCols = cols.slice(0, half);
      const botCols = cols.slice(half);

      // Top Tier
      const topDims = topCols.map((c) => getAttributeDimensions(c.name, true));
      const topStep = Math.max(135, Math.max(...topDims.map((d) => d.rx)) * 2 + 28);
      const topWidth = (topCols.length - 1) * topStep;
      const topStartX = centerX - topWidth / 2;

      topCols.forEach((col, idx) => {
        const dim = topDims[idx];
        const attrX = topStartX + idx * topStep;
        const arc = Math.abs(idx - (topCols.length - 1) / 2) * 14;
        const attrY = centerY - 145 - arc;

        attributes.push({
          id: `${table.name}_${col.name}`,
          name: dim.label,
          isPk: !!col.pk,
          type: col.type,
          x: attrX,
          y: attrY,
          rx: dim.rx,
          ry: dim.ry,
          entityId: table.name,
          lineStart: { x: centerX + (idx - (topCols.length - 1) / 2) * (width / (topCols.length + 1)), y: centerY - height / 2 },
          lineEnd: { x: attrX, y: attrY + dim.ry },
        });
      });

      // Bottom Tier
      const botDims = botCols.map((c) => getAttributeDimensions(c.name, true));
      const botStep = Math.max(135, Math.max(...botDims.map((d) => d.rx)) * 2 + 28);
      const botWidth = (botCols.length - 1) * botStep;
      const botStartX = centerX - botWidth / 2;

      botCols.forEach((col, idx) => {
        const dim = botDims[idx];
        const attrX = botStartX + idx * botStep;
        const arc = Math.abs(idx - (botCols.length - 1) / 2) * 14;
        const attrY = centerY + 145 + arc;

        attributes.push({
          id: `${table.name}_${col.name}`,
          name: dim.label,
          isPk: !!col.pk,
          type: col.type,
          x: attrX,
          y: attrY,
          rx: dim.rx,
          ry: dim.ry,
          entityId: table.name,
          lineStart: { x: centerX + (idx - (botCols.length - 1) / 2) * (width / (botCols.length + 1)), y: centerY + height / 2 },
          lineEnd: { x: attrX, y: attrY - dim.ry },
        });
      });
    }
  } else if (schema.length === 2) {
    // -------------------------------------------------------------
    // CASE 2: Two Entities (Side-by-side with relationship diamond)
    // -------------------------------------------------------------
    const t1 = schema[0];
    const t2 = schema[1];
    const d1 = getEntityDimensions(t1.name, false);
    const d2 = getEntityDimensions(t2.name, false);

    const c1 = { x: 260, y: 240 };
    const c2 = { x: 800, y: 240 };

    const ent1: EntityLayout = {
      id: t1.name,
      name: d1.label,
      x: c1.x - d1.width / 2,
      y: c1.y - d1.height / 2,
      width: d1.width,
      height: d1.height,
      centerX: c1.x,
      centerY: c1.y,
    };
    const ent2: EntityLayout = {
      id: t2.name,
      name: d2.label,
      x: c2.x - d2.width / 2,
      y: c2.y - d2.height / 2,
      width: d2.width,
      height: d2.height,
      centerX: c2.x,
      centerY: c2.y,
    };
    entities.push(ent1, ent2);

    // Relationship diamond
    const rel = rels.length > 0 ? rels[0] : { from: t1.name, to: t2.name, relName: "RELATES_TO" };
    relationships.push({
      id: `rel_${t1.name}_${t2.name}`,
      name: rel.relName,
      fromTable: t1.name,
      toTable: t2.name,
      x: (c1.x + c2.x) / 2,
      y: (c1.y + c2.y) / 2,
      fromPoint: { x: c1.x + d1.width / 2, y: c1.y },
      toPoint: { x: c2.x - d2.width / 2, y: c2.y },
      cardinalityFrom: "1",
      cardinalityTo: "N",
      cardFromPoint: { x: c1.x + d1.width / 2 + 35, y: c1.y - 12 },
      cardToPoint: { x: c2.x - d2.width / 2 - 35, y: c2.y - 12 },
    });

    // Spread attributes for Table 1 (arc above/below)
    layoutEntityAttributes(t1, ent1, attributes, "split");
    // Spread attributes for Table 2 (arc above/below)
    layoutEntityAttributes(t2, ent2, attributes, "split");
  } else if (schema.length === 3) {
    // -------------------------------------------------------------
    // CASE 3: Three Entities (e.g. Library, Healthcare, Triangle)
    // -------------------------------------------------------------
    // Determine child/associative entity (has incoming references)
    let childIdx = 1;
    schema.forEach((t, idx) => {
      const isReferenced = t.columns.some((c) => c.fk || c.name.endsWith("_id"));
      if (isReferenced) childIdx = idx;
    });

    const parents = schema.filter((_, i) => i !== childIdx);
    const child = schema[childIdx];

    const p1 = parents[0];
    const p2 = parents[1];

    const dp1 = getEntityDimensions(p1.name, false);
    const dp2 = getEntityDimensions(p2.name, false);
    const dc = getEntityDimensions(child.name, false);

    const cp1 = { x: 260, y: 140 };
    const cp2 = { x: 800, y: 140 };
    const cc = { x: 530, y: 440 };

    const ep1: EntityLayout = {
      id: p1.name,
      name: dp1.label,
      x: cp1.x - dp1.width / 2,
      y: cp1.y - dp1.height / 2,
      width: dp1.width,
      height: dp1.height,
      centerX: cp1.x,
      centerY: cp1.y,
    };
    const ep2: EntityLayout = {
      id: p2.name,
      name: dp2.label,
      x: cp2.x - dp2.width / 2,
      y: cp2.y - dp2.height / 2,
      width: dp2.width,
      height: dp2.height,
      centerX: cp2.x,
      centerY: cp2.y,
    };
    const ec: EntityLayout = {
      id: child.name,
      name: dc.label,
      x: cc.x - dc.width / 2,
      y: cc.y - dc.height / 2,
      width: dc.width,
      height: dc.height,
      centerX: cc.x,
      centerY: cc.y,
    };
    entities.push(ep1, ep2, ec);

    // Relationships: p1 <-> child and p2 <-> child
    const relName1 = deriveRelName(child.name, p1.name);
    const relName2 = deriveRelName(child.name, p2.name);

    relationships.push({
      id: `rel_${p1.name}_${child.name}`,
      name: relName1,
      fromTable: p1.name,
      toTable: child.name,
      x: (cp1.x + cc.x) / 2 - 20,
      y: (cp1.y + cc.y) / 2,
      fromPoint: { x: cp1.x + 30, y: cp1.y + dp1.height / 2 },
      toPoint: { x: cc.x - dc.width / 4, y: cc.y - dc.height / 2 },
      cardinalityFrom: "1",
      cardinalityTo: "N",
      cardFromPoint: { x: cp1.x + 50, y: cp1.y + dp1.height / 2 + 25 },
      cardToPoint: { x: cc.x - dc.width / 4 - 30, y: cc.y - dc.height / 2 - 20 },
    });

    relationships.push({
      id: `rel_${p2.name}_${child.name}`,
      name: relName2,
      fromTable: p2.name,
      toTable: child.name,
      x: (cp2.x + cc.x) / 2 + 20,
      y: (cp2.y + cc.y) / 2,
      fromPoint: { x: cp2.x - 30, y: cp2.y + dp2.height / 2 },
      toPoint: { x: cc.x + dc.width / 4, y: cc.y - dc.height / 2 },
      cardinalityFrom: "1",
      cardinalityTo: "N",
      cardFromPoint: { x: cp2.x - 50, y: cp2.y + dp2.height / 2 + 25 },
      cardToPoint: { x: cc.x + dc.width / 4 + 30, y: cc.y - dc.height / 2 - 20 },
    });

    // Attributes for p1 fan above
    layoutEntityAttributes(p1, ep1, attributes, "above");
    // Attributes for p2 fan above
    layoutEntityAttributes(p2, ep2, attributes, "above");
    // Attributes for child fan below
    layoutEntityAttributes(child, ec, attributes, "below");
  } else if (schema.length === 4) {
    // -------------------------------------------------------------
    // CASE 4: Four Entities (e.g. Ecommerce or 4-table relational)
    // -------------------------------------------------------------
    // Check if standard ecommerce (customers, products, orders, order_items)
    const findTable = (names: string[]) =>
      schema.find((t) => names.includes(t.name.toLowerCase())) ?? schema[0];

    const tCust = findTable(["customers", "users", "clients"]);
    const tProd = findTable(["products", "items", "books"]);
    const tOrd = findTable(["orders", "sales", "loans"]);
    const tItems = findTable(["order_items", "order_details", "line_items"]);

    // Assign positions
    const posCust = { x: 200, y: 110 };
    const posProd = { x: 880, y: 220 };
    const posOrd = { x: 380, y: 380 };
    const posItems = { x: 680, y: 620 };

    const arranged = [
      { t: tCust, pos: posCust, attrDir: "above_left" as const },
      { t: tProd, pos: posProd, attrDir: "above_right" as const },
      { t: tOrd, pos: posOrd, attrDir: "below_left" as const },
      { t: tItems, pos: posItems, attrDir: "below" as const },
    ];

    arranged.forEach(({ t, pos, attrDir }) => {
      const dim = getEntityDimensions(t.name, false);
      const ent: EntityLayout = {
        id: t.name,
        name: dim.label,
        x: pos.x - dim.width / 2,
        y: pos.y - dim.height / 2,
        width: dim.width,
        height: dim.height,
        centerX: pos.x,
        centerY: pos.y,
      };
      entities.push(ent);
      layoutEntityAttributes(t, ent, attributes, attrDir);
    });

    // Relationships: Cust -> Ord, Ord -> Items, Prod -> Items
    relationships.push({
      id: `rel_${tCust.name}_${tOrd.name}`,
      name: "PLACES",
      fromTable: tCust.name,
      toTable: tOrd.name,
      x: (posCust.x + posOrd.x) / 2 + 30,
      y: (posCust.y + posOrd.y) / 2 - 20,
      fromPoint: { x: posCust.x + 40, y: posCust.y + 24 },
      toPoint: { x: posOrd.x - 30, y: posOrd.y - 24 },
      cardinalityFrom: "1",
      cardinalityTo: "N",
      cardFromPoint: { x: posCust.x + 65, y: posCust.y + 50 },
      cardToPoint: { x: posOrd.x - 45, y: posOrd.y - 45 },
    });

    relationships.push({
      id: `rel_${tOrd.name}_${tItems.name}`,
      name: "CONTAINS",
      fromTable: tOrd.name,
      toTable: tItems.name,
      x: (posOrd.x + posItems.x) / 2 - 20,
      y: (posOrd.y + posItems.y) / 2,
      fromPoint: { x: posOrd.x + 50, y: posOrd.y + 24 },
      toPoint: { x: posItems.x - 60, y: posItems.y - 24 },
      cardinalityFrom: "1",
      cardinalityTo: "N",
      cardFromPoint: { x: posOrd.x + 75, y: posOrd.y + 45 },
      cardToPoint: { x: posItems.x - 80, y: posItems.y - 45 },
    });

    relationships.push({
      id: `rel_${tProd.name}_${tItems.name}`,
      name: "CONTAINS",
      fromTable: tProd.name,
      toTable: tItems.name,
      x: (posProd.x + posItems.x) / 2 + 50,
      y: (posProd.y + posItems.y) / 2 - 10,
      fromPoint: { x: posProd.x - 30, y: posProd.y + 24 },
      toPoint: { x: posItems.x + 60, y: posItems.y - 24 },
      cardinalityFrom: "1",
      cardinalityTo: "N",
      cardFromPoint: { x: posProd.x - 50, y: posProd.y + 50 },
      cardToPoint: { x: posItems.x + 80, y: posItems.y - 45 },
    });
  } else {
    // -------------------------------------------------------------
    // CASE 5: General N-Entity Layout (Grid with generous column zones)
    // -------------------------------------------------------------
    const colsCount = Math.min(3, Math.ceil(Math.sqrt(schema.length)));
    const cellWidth = 440;
    const cellHeight = 360;

    schema.forEach((table, idx) => {
      const colIdx = idx % colsCount;
      const rowIdx = Math.floor(idx / colsCount);
      const centerX = 240 + colIdx * cellWidth;
      const centerY = 180 + rowIdx * cellHeight;

      const dim = getEntityDimensions(table.name, false);
      const ent: EntityLayout = {
        id: table.name,
        name: dim.label,
        x: centerX - dim.width / 2,
        y: centerY - dim.height / 2,
        width: dim.width,
        height: dim.height,
        centerX,
        centerY,
      };
      entities.push(ent);
      layoutEntityAttributes(table, ent, attributes, "split");
    });

    // Add relationships between matching tables
    rels.forEach((r, idx) => {
      const fromEnt = entities.find((e) => e.id.toLowerCase() === r.from.toLowerCase());
      const toEnt = entities.find((e) => e.id.toLowerCase() === r.to.toLowerCase());
      if (fromEnt && toEnt) {
        const midX = (fromEnt.centerX + toEnt.centerX) / 2;
        const midY = (fromEnt.centerY + toEnt.centerY) / 2;
        relationships.push({
          id: `rel_gen_${idx}`,
          name: r.relName,
          fromTable: fromEnt.id,
          toTable: toEnt.id,
          x: midX,
          y: midY,
          fromPoint: { x: fromEnt.centerX, y: fromEnt.centerY },
          toPoint: { x: toEnt.centerX, y: toEnt.centerY },
          cardinalityFrom: "N",
          cardinalityTo: "1",
          cardFromPoint: { x: fromEnt.centerX + 25, y: fromEnt.centerY - 15 },
          cardToPoint: { x: toEnt.centerX - 25, y: toEnt.centerY - 15 },
        });
      }
    });
  }

  // -------------------------------------------------------------
  // Calculate Dynamic Bounding Box across all visual elements
  // -------------------------------------------------------------
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  // Include Entities
  entities.forEach((e) => {
    minX = Math.min(minX, e.x);
    minY = Math.min(minY, e.y);
    maxX = Math.max(maxX, e.x + e.width);
    maxY = Math.max(maxY, e.y + e.height);
  });

  // Include Attributes
  attributes.forEach((a) => {
    minX = Math.min(minX, a.x - a.rx);
    minY = Math.min(minY, a.y - a.ry);
    maxX = Math.max(maxX, a.x + a.rx);
    maxY = Math.max(maxY, a.y + a.ry);
  });

  // Include Relationships
  relationships.forEach((r) => {
    minX = Math.min(minX, r.x - 70);
    minY = Math.min(minY, r.y - 45);
    maxX = Math.max(maxX, r.x + 70);
    maxY = Math.max(maxY, r.y + 45);
  });

  const pad = isSingle ? 50 : 45;
  const vbMinX = Math.round(minX - pad);
  const vbMinY = Math.round(minY - pad);
  const vbWidth = Math.max(400, Math.round(maxX - minX + pad * 2));
  const vbHeight = Math.max(260, Math.round(maxY - minY + pad * 2));

  return {
    entities,
    attributes,
    relationships,
    viewBox: {
      minX: vbMinX,
      minY: vbMinY,
      width: vbWidth,
      height: vbHeight,
      centerX: vbMinX + vbWidth / 2,
      centerY: vbMinY + vbHeight / 2,
    },
  };
}

// Helper to layout attributes around an entity
function layoutEntityAttributes(
  table: Table,
  entity: EntityLayout,
  attributes: AttributeLayout[],
  direction: "above" | "below" | "split" | "above_left" | "above_right" | "below_left"
) {
  const cols = table.columns;
  const N = cols.length;
  if (N === 0) return;

  const attrDims = cols.map((c) => getAttributeDimensions(c.name, false));

  if (direction === "above") {
    const step = Math.max(120, Math.max(...attrDims.map((d) => d.rx)) * 2 + 20);
    const span = (N - 1) * step;
    const startX = entity.centerX - span / 2;

    cols.forEach((col, idx) => {
      const dim = attrDims[idx];
      const attrX = startX + idx * step;
      const arc = Math.abs(idx - (N - 1) / 2) * 12;
      const attrY = entity.y - 85 - arc;

      attributes.push({
        id: `${table.name}_${col.name}`,
        name: dim.label,
        isPk: !!col.pk,
        type: col.type,
        x: attrX,
        y: attrY,
        rx: dim.rx,
        ry: dim.ry,
        entityId: table.name,
        lineStart: { x: entity.centerX + (idx - (N - 1) / 2) * (entity.width / (N + 1)), y: entity.y },
        lineEnd: { x: attrX, y: attrY + dim.ry },
      });
    });
  } else if (direction === "below") {
    const step = Math.max(120, Math.max(...attrDims.map((d) => d.rx)) * 2 + 20);
    const span = (N - 1) * step;
    const startX = entity.centerX - span / 2;

    cols.forEach((col, idx) => {
      const dim = attrDims[idx];
      const attrX = startX + idx * step;
      const arc = Math.abs(idx - (N - 1) / 2) * 12;
      const attrY = entity.y + entity.height + 85 + arc;

      attributes.push({
        id: `${table.name}_${col.name}`,
        name: dim.label,
        isPk: !!col.pk,
        type: col.type,
        x: attrX,
        y: attrY,
        rx: dim.rx,
        ry: dim.ry,
        entityId: table.name,
        lineStart: { x: entity.centerX + (idx - (N - 1) / 2) * (entity.width / (N + 1)), y: entity.y + entity.height },
        lineEnd: { x: attrX, y: attrY - dim.ry },
      });
    });
  } else if (direction === "above_left" || direction === "above_right") {
    // Fan angled upward toward left or right
    const isLeft = direction === "above_left";
    const stepX = isLeft ? -115 : 115;
    cols.forEach((col, idx) => {
      const dim = attrDims[idx];
      const attrX = entity.centerX + (idx - (N - 1) / 2) * 115 + (isLeft ? -40 : 40);
      const attrY = entity.y - 80 - Math.abs(idx - (N - 1) / 2) * 10;
      attributes.push({
        id: `${table.name}_${col.name}`,
        name: dim.label,
        isPk: !!col.pk,
        type: col.type,
        x: attrX,
        y: attrY,
        rx: dim.rx,
        ry: dim.ry,
        entityId: table.name,
        lineStart: { x: entity.centerX, y: entity.y },
        lineEnd: { x: attrX, y: attrY + dim.ry },
      });
    });
  } else if (direction === "below_left") {
    cols.forEach((col, idx) => {
      const dim = attrDims[idx];
      const attrX = entity.centerX - 120 + (idx - (N - 1) / 2) * 110;
      const attrY = entity.y + entity.height + 80 + Math.abs(idx - (N - 1) / 2) * 10;
      attributes.push({
        id: `${table.name}_${col.name}`,
        name: dim.label,
        isPk: !!col.pk,
        type: col.type,
        x: attrX,
        y: attrY,
        rx: dim.rx,
        ry: dim.ry,
        entityId: table.name,
        lineStart: { x: entity.centerX, y: entity.y + entity.height },
        lineEnd: { x: attrX, y: attrY - dim.ry },
      });
    });
  } else {
    // SPLIT: Half above, half below
    const half = Math.ceil(N / 2);
    const top = cols.slice(0, half);
    const bot = cols.slice(half);

    // Top
    const topDims = top.map((c) => getAttributeDimensions(c.name, false));
    const topStep = Math.max(115, Math.max(...topDims.map((d) => d.rx)) * 2 + 18);
    const topWidth = (top.length - 1) * topStep;
    const topStartX = entity.centerX - topWidth / 2;

    top.forEach((col, idx) => {
      const dim = topDims[idx];
      const attrX = topStartX + idx * topStep;
      const attrY = entity.y - 75;

      attributes.push({
        id: `${table.name}_${col.name}`,
        name: dim.label,
        isPk: !!col.pk,
        type: col.type,
        x: attrX,
        y: attrY,
        rx: dim.rx,
        ry: dim.ry,
        entityId: table.name,
        lineStart: { x: entity.centerX + (idx - (top.length - 1) / 2) * (entity.width / (top.length + 1)), y: entity.y },
        lineEnd: { x: attrX, y: attrY + dim.ry },
      });
    });

    // Bottom
    const botDims = bot.map((c) => getAttributeDimensions(c.name, false));
    const botStep = Math.max(115, Math.max(...botDims.map((d) => d.rx)) * 2 + 18);
    const botWidth = (bot.length - 1) * botStep;
    const botStartX = entity.centerX - botWidth / 2;

    bot.forEach((col, idx) => {
      const dim = botDims[idx];
      const attrX = botStartX + idx * botStep;
      const attrY = entity.y + entity.height + 75;

      attributes.push({
        id: `${table.name}_${col.name}`,
        name: dim.label,
        isPk: !!col.pk,
        type: col.type,
        x: attrX,
        y: attrY,
        rx: dim.rx,
        ry: dim.ry,
        entityId: table.name,
        lineStart: { x: entity.centerX + (idx - (bot.length - 1) / 2) * (entity.width / (bot.length + 1)), y: entity.y + entity.height },
        lineEnd: { x: attrX, y: attrY - dim.ry },
      });
    });
  }
}

// -------------------------------------------------------------
// Interactive Chen ER Diagram Component
// -------------------------------------------------------------
export function ChenERDiagram({ schema }: ChenERDiagramProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Compute layout dynamically
  const diagramData = useMemo(() => {
    if (!schema || schema.length === 0) return null;
    return computeChenDiagramLayout(schema);
  }, [schema]);

  if (!diagramData) {
    return (
      <div className="p-4 text-xs text-[var(--muted)] text-center">
        No schema available for ER diagram.
      </div>
    );
  }

  return (
    <>
      <ChenCanvas diagramData={diagramData} onExpandFullscreen={() => setIsFullscreen(true)} isModal={false} />

      {/* Fullscreen Modal View */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md"
          onClick={() => setIsFullscreen(false)}
        >
          <div
            className="w-full max-w-7xl h-[92vh] p-4 sm:p-6 rounded-2xl border bg-zinc-950 flex flex-col gap-3 shadow-2xl overflow-hidden"
            style={{ borderColor: "var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                <h2 className="text-sm sm:text-base font-bold" style={{ color: "var(--foreground)" }}>
                  Entity-Relationship Diagram (Interactive Canvas)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="px-3 py-1 rounded-lg text-xs font-semibold border transition-colors hover:bg-[var(--surface-hover)] cursor-pointer"
                style={{
                  background: "var(--panel)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
              >
                ✕ Close
              </button>
            </div>

            <div className="flex-1 min-h-0">
              <ChenCanvas diagramData={diagramData} onExpandFullscreen={() => {}} isModal={true} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// -------------------------------------------------------------
// Interactive Pan & Zoom Canvas Sub-component
// -------------------------------------------------------------
interface ChenCanvasProps {
  diagramData: ChenDiagramData;
  onExpandFullscreen?: () => void;
  isModal?: boolean;
}

function ChenCanvas({ diagramData, onExpandFullscreen, isModal = false }: ChenCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Pan & Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const dragStartRef = useRef<Point>({ x: 0, y: 0 });
  const panStartRef = useRef<Point>({ x: 0, y: 0 });

  const { viewBox } = diagramData;

  // Reset zoom & pan to default fit
  const handleResetFit = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Zoom In / Out handlers
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(3.5, Number((prev + 0.2).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0.35, Number((prev - 0.2).toFixed(2))));
  };

  // Mouse wheel zoom with native passive:false handler
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
      setZoom((prev) => {
        const next = Math.min(3.5, Math.max(0.35, prev * zoomFactor));
        return Number(next.toFixed(2));
      });
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
    };
  }, []);

  // Drag to pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only primary button
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const clientWidth = containerRef.current.clientWidth || 800;
    // Scale pan movement according to viewBox to achieve 1:1 screen-to-diagram cursor tracking
    const ratio = viewBox.width / clientWidth;
    const dx = (e.clientX - dragStartRef.current.x) * ratio;
    const dy = (e.clientY - dragStartRef.current.y) * ratio;

    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Download SVG
  const downloadSVG = () => {
    if (!svgRef.current) return;
    // Clone SVG so pan/zoom transform does not affect the pristine exported SVG
    const clone = svgRef.current.cloneNode(true) as SVGSVGElement;
    const contentG = clone.querySelector("#chen-diagram-content");
    if (contentG) {
      contentG.removeAttribute("transform");
    }
    const svgData = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "er_diagram.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download PNG (crisp high-res canvas rendering)
  const downloadPNG = () => {
    if (!svgRef.current) return;
    const clone = svgRef.current.cloneNode(true) as SVGSVGElement;
    const contentG = clone.querySelector("#chen-diagram-content");
    if (contentG) {
      contentG.removeAttribute("transform");
    }
    const svgData = new XMLSerializer().serializeToString(clone);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Export at sharp high-DPI resolution
      canvas.width = Math.max(1400, Math.round(viewBox.width * 1.5));
      canvas.height = Math.max(800, Math.round(viewBox.height * 1.5));
      if (ctx) {
        ctx.fillStyle = "#09090b";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = "er_diagram.png";
        a.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className={`relative w-full flex flex-col ${isModal ? "h-full" : ""}`}>
      {/* Legend & Action Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 text-xs opacity-95 px-1 shrink-0">
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-blue-600 rounded-xs inline-block shadow-xs"></span>
            <span style={{ color: "var(--foreground)" }}>Entity</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-emerald-600 rotate-45 inline-block shadow-xs"></span>
            <span style={{ color: "var(--foreground)" }}>Relationship</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-2.5 border border-slate-400 rounded-full inline-block"></span>
            <span style={{ color: "var(--foreground)" }}>Attribute</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="font-bold underline text-amber-400">PK</span>
            <span style={{ color: "var(--foreground)" }}>Primary Key</span>
          </span>
        </div>

        {/* Action Controls & Zoom Toolbar */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Zoom In/Out & Fit Toolbar */}
          <div
            className="flex items-center rounded-lg border overflow-hidden"
            style={{
              background: "var(--panel)",
              borderColor: "var(--border)",
            }}
          >
            <button
              type="button"
              onClick={handleZoomOut}
              title="Zoom Out (Wheel Down)"
              aria-label="Zoom Out"
              className="p-1.5 px-2 text-xs font-bold transition-colors hover:bg-[var(--surface-hover)] cursor-pointer"
              style={{ color: "var(--foreground)" }}
            >
              −
            </button>
            <span
              className="px-2 text-[11px] font-mono font-medium border-x select-none"
              style={{
                borderColor: "var(--border)",
                color: "var(--foreground)",
                minWidth: "48px",
                textAlign: "center",
              }}
            >
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              title="Zoom In (Wheel Up)"
              aria-label="Zoom In"
              className="p-1.5 px-2 text-xs font-bold transition-colors hover:bg-[var(--surface-hover)] cursor-pointer"
              style={{ color: "var(--foreground)" }}
            >
              +
            </button>
            <button
              type="button"
              onClick={handleResetFit}
              title="Reset Zoom and Fit Diagram"
              aria-label="Fit Diagram"
              className="px-2 py-1 text-[11px] font-medium border-l transition-colors hover:bg-[var(--surface-hover)] cursor-pointer flex items-center gap-1"
              style={{
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            >
              <svg className="w-3 h-3 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              <span>Fit</span>
            </button>
          </div>

          {/* Download Buttons */}
          <button
            type="button"
            onClick={downloadSVG}
            className="px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 cursor-pointer transition-colors hover:bg-[var(--surface-hover)]"
            style={{
              background: "var(--panel)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          >
            <svg className="w-3.5 h-3.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>SVG</span>
          </button>
          <button
            type="button"
            onClick={downloadPNG}
            className="px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 cursor-pointer transition-colors hover:bg-[var(--surface-hover)]"
            style={{
              background: "var(--panel)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          >
            <svg className="w-3.5 h-3.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>PNG</span>
          </button>

          {/* Fullscreen Button */}
          {!isModal && onExpandFullscreen && (
            <button
              type="button"
              onClick={onExpandFullscreen}
              title="Full Screen View"
              aria-label="Full Screen View"
              className="p-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors hover:bg-[var(--surface-hover)]"
              style={{
                background: "var(--panel)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            >
              <svg className="w-3.5 h-3.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* SVG Canvas Area with Interactive Pan & Zoom */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleResetFit}
        className={`w-full relative overflow-hidden rounded-xl border border-[var(--border)] bg-zinc-950/70 select-none ${
          isModal ? "flex-1 min-h-0" : "h-[460px] min-h-[420px]"
        }`}
        style={{
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        <svg
          ref={svgRef}
          viewBox={`${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`}
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="chen-shadow" x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.6" />
            </filter>
            <linearGradient id="entity-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="100%" stopColor="#172554" />
            </linearGradient>
            <linearGradient id="rel-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#065f46" />
              <stop offset="100%" stopColor="#022c22" />
            </linearGradient>
            <linearGradient id="attr-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>

          {/* Scalable & Pannable Group */}
          <g
            id="chen-diagram-content"
            transform={`translate(${pan.x}, ${pan.y}) translate(${viewBox.centerX}, ${viewBox.centerY}) scale(${zoom}) translate(${-viewBox.centerX}, ${-viewBox.centerY})`}
            style={{
              transition: isDragging ? "none" : "transform 0.1s ease-out",
            }}
          >
            {/* 1. Connector Lines from Entities to Attributes */}
            {diagramData.attributes.map((attr) => (
              <line
                key={`line_${attr.id}`}
                x1={attr.lineStart.x}
                y1={attr.lineStart.y}
                x2={attr.x}
                y2={attr.y}
                stroke="#475569"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ))}

            {/* 2. Connector Lines between Entities and Relationships */}
            {diagramData.relationships.map((rel) => (
              <g key={`rel_lines_${rel.id}`}>
                <line
                  x1={rel.fromPoint.x}
                  y1={rel.fromPoint.y}
                  x2={rel.x}
                  y2={rel.y}
                  stroke="#64748b"
                  strokeWidth="2.2"
                />
                <line
                  x1={rel.x}
                  y1={rel.y}
                  x2={rel.toPoint.x}
                  y2={rel.toPoint.y}
                  stroke="#64748b"
                  strokeWidth="2.2"
                />
                {/* Cardinality Labels */}
                <text
                  x={rel.cardFromPoint.x}
                  y={rel.cardFromPoint.y}
                  fill="#60a5fa"
                  fontSize="15"
                  fontWeight="bold"
                  textAnchor="middle"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
                >
                  {rel.cardinalityFrom}
                </text>
                <text
                  x={rel.cardToPoint.x}
                  y={rel.cardToPoint.y}
                  fill="#60a5fa"
                  fontSize="15"
                  fontWeight="bold"
                  textAnchor="middle"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
                >
                  {rel.cardinalityTo}
                </text>
              </g>
            ))}

            {/* 3. Entities (Blue Rectangles) */}
            {diagramData.entities.map((ent) => (
              <g key={`ent_${ent.id}`} filter="url(#chen-shadow)">
                <rect
                  x={ent.x}
                  y={ent.y}
                  width={ent.width}
                  height={ent.height}
                  rx="8"
                  fill="url(#entity-gradient)"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                />
                <text
                  x={ent.centerX}
                  y={ent.centerY + 5}
                  fill="#ffffff"
                  fontSize="15"
                  fontWeight="bold"
                  textAnchor="middle"
                  letterSpacing="0.05em"
                >
                  {ent.name}
                </text>
              </g>
            ))}

            {/* 4. Relationships (Emerald Diamonds) */}
            {diagramData.relationships.map((rel) => {
              const dw = 55;
              const dh = 30;
              const points = `${rel.x},${rel.y - dh} ${rel.x + dw},${rel.y} ${rel.x},${rel.y + dh} ${rel.x - dw},${rel.y}`;
              return (
                <g key={`rel_shape_${rel.id}`} filter="url(#chen-shadow)">
                  <polygon
                    points={points}
                    fill="url(#rel-gradient)"
                    stroke="#10b981"
                    strokeWidth="2.5"
                  />
                  <text
                    x={rel.x}
                    y={rel.y + 4}
                    fill="#ffffff"
                    fontSize="13"
                    fontWeight="bold"
                    textAnchor="middle"
                    letterSpacing="0.03em"
                  >
                    {rel.name}
                  </text>
                </g>
              );
            })}

            {/* 5. Attributes (Slate Ovals) */}
            {diagramData.attributes.map((attr) => (
              <g key={`attr_${attr.id}`} filter="url(#chen-shadow)">
                <ellipse
                  cx={attr.x}
                  cy={attr.y}
                  rx={attr.rx}
                  ry={attr.ry}
                  fill="url(#attr-gradient)"
                  stroke={attr.isPk ? "#f59e0b" : "#64748b"}
                  strokeWidth={attr.isPk ? "2.5" : "2"}
                />
                <text
                  x={attr.x}
                  y={attr.y + 4.5}
                  fill={attr.isPk ? "#fbbf24" : "#f1f5f9"}
                  fontSize={attr.isPk ? "13" : "12"}
                  fontWeight={attr.isPk ? "bold" : "500"}
                  textAnchor="middle"
                  textDecoration={attr.isPk ? "underline" : undefined}
                >
                  {attr.name}
                </text>
              </g>
            ))}
          </g>
        </svg>

        {/* Floating Canvas Navigation Hint */}
        <div className="absolute bottom-2.5 right-3 pointer-events-none text-[10px] text-zinc-400/80 bg-zinc-900/80 px-2 py-1 rounded-md border border-zinc-800/80 backdrop-blur-xs flex items-center gap-1.5">
          <span>Scroll to zoom</span>
          <span>•</span>
          <span>Drag to pan</span>
          <span>•</span>
          <span>Double-click to reset</span>
        </div>
      </div>
    </div>
  );
}
