import type { Table, Column } from "./schema";

export interface Point {
  x: number;
  y: number;
}

export interface EntityLayout {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface AttributeLayout {
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

export interface RelationshipLayout {
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

export interface ChenDiagramData {
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
export function getAttributeDimensions(name: string, isSingleTable: boolean) {
  const clean = name.trim().toUpperCase();
  const charWidth = 7.2;
  const padding = isSingleTable ? 30 : 24;
  const rx = Math.max(isSingleTable ? 48 : 42, Math.round((clean.length * charWidth) / 2 + padding));
  const ry = isSingleTable ? 24 : 22;
  return { rx, ry, label: clean };
}

// Calculate entity rectangle dimensions
export function getEntityDimensions(name: string, isSingleTable: boolean) {
  const clean = name.trim().toUpperCase();
  const width = Math.max(isSingleTable ? 170 : 150, Math.round(clean.length * (isSingleTable ? 13 : 11) + 48));
  const height = isSingleTable ? 54 : 48;
  return { width, height, label: clean };
}

// Guaranteed non-overlapping attribute row layout
export function layoutAttributesInRow(
  cols: Column[],
  centerX: number,
  baseY: number,
  arcDirection: number = 0,
  gap: number = 28,
  isSingleTable: boolean = false
) {
  const dims = cols.map((c) => getAttributeDimensions(c.name, isSingleTable));
  const n = cols.length;
  if (n === 0) return [];

  const offsets: number[] = [0];
  for (let i = 1; i < n; i++) {
    offsets.push(offsets[i - 1] + dims[i - 1].rx + dims[i].rx + gap);
  }
  const totalSpan = offsets[n - 1];
  const startX = centerX - totalSpan / 2;

  return cols.map((col, i) => {
    const dim = dims[i];
    const x = startX + offsets[i];
    const norm = n > 1 ? (i - (n - 1) / 2) / ((n - 1) / 2) : 0;
    const y = baseY + arcDirection * (norm * norm * 14);
    return {
      col,
      dim,
      x,
      y,
    };
  });
}

// Helper to push attributes to the master list with connection lines
export function pushAttributes(
  placed: ReturnType<typeof layoutAttributesInRow>,
  entity: EntityLayout,
  attributes: AttributeLayout[],
  connectorEdge: "top" | "bottom"
) {
  const n = placed.length;
  placed.forEach((p, idx) => {
    const entityContactX =
      entity.centerX + (n > 1 ? (idx - (n - 1) / 2) * (entity.width / (n + 1)) : 0);
    const entityContactY =
      connectorEdge === "top" ? entity.y : entity.y + entity.height;
    const attrContactY =
      connectorEdge === "top" ? p.y + p.dim.ry : p.y - p.dim.ry;

    attributes.push({
      id: `${entity.id}_${p.col.name}`,
      name: p.dim.label,
      isPk: !!p.col.pk,
      type: p.col.type,
      x: p.x,
      y: p.y,
      rx: p.dim.rx,
      ry: p.dim.ry,
      entityId: entity.id,
      lineStart: { x: entityContactX, y: entityContactY },
      lineEnd: { x: p.x, y: attrContactY },
    });
  });
}

// Detect foreign key relationships between tables
export function detectRelationships(tables: Table[]) {
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

export function deriveRelName(sourceTable: string, targetTable: string): string {
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
export function computeChenDiagramLayout(schema: Table[]): ChenDiagramData {
  const entities: EntityLayout[] = [];
  const attributes: AttributeLayout[] = [];
  const relationships: RelationshipLayout[] = [];

  const isSingle = schema.length === 1;
  const rels = detectRelationships(schema);

  if (isSingle) {
    // Single Entity
    const table = schema[0];
    const { width, height, label } = getEntityDimensions(table.name, true);
    const centerX = 500;
    const centerY = 160;

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
    if (cols.length <= 6) {
      const placed = layoutAttributesInRow(cols, centerX, centerY + 160, 1, 36, true);
      pushAttributes(placed, entLayout, attributes, "bottom");
    } else {
      const half = Math.ceil(cols.length / 2);
      const topCols = cols.slice(0, half);
      const botCols = cols.slice(half);

      const placedTop = layoutAttributesInRow(topCols, centerX, centerY - 150, -1, 32, true);
      pushAttributes(placedTop, entLayout, attributes, "top");

      const placedBot = layoutAttributesInRow(botCols, centerX, centerY + 150, 1, 32, true);
      pushAttributes(placedBot, entLayout, attributes, "bottom");
    }
  } else if (schema.length === 2) {
    // Two Entities
    const t1 = schema[0];
    const t2 = schema[1];
    const d1 = getEntityDimensions(t1.name, false);
    const d2 = getEntityDimensions(t2.name, false);

    const c1 = { x: 280, y: 260 };
    const c2 = { x: 1040, y: 260 };

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
      cardFromPoint: { x: c1.x + d1.width / 2 + 35, y: c1.y - 14 },
      cardToPoint: { x: c2.x - d2.width / 2 - 35, y: c2.y - 14 },
    });

    // Attributes for t1
    if (t1.columns.length <= 4) {
      const placed = layoutAttributesInRow(t1.columns, ent1.centerX, ent1.y - 100, -1, 28, false);
      pushAttributes(placed, ent1, attributes, "top");
    } else {
      const half = Math.ceil(t1.columns.length / 2);
      const pTop = layoutAttributesInRow(t1.columns.slice(0, half), ent1.centerX, ent1.y - 100, -1, 26, false);
      pushAttributes(pTop, ent1, attributes, "top");
      const pBot = layoutAttributesInRow(t1.columns.slice(half), ent1.centerX, ent1.y + ent1.height + 100, 1, 26, false);
      pushAttributes(pBot, ent1, attributes, "bottom");
    }

    // Attributes for t2
    if (t2.columns.length <= 4) {
      const placed = layoutAttributesInRow(t2.columns, ent2.centerX, ent2.y - 100, -1, 28, false);
      pushAttributes(placed, ent2, attributes, "top");
    } else {
      const half = Math.ceil(t2.columns.length / 2);
      const pTop = layoutAttributesInRow(t2.columns.slice(0, half), ent2.centerX, ent2.y - 100, -1, 26, false);
      pushAttributes(pTop, ent2, attributes, "top");
      const pBot = layoutAttributesInRow(t2.columns.slice(half), ent2.centerX, ent2.y + ent2.height + 100, 1, 26, false);
      pushAttributes(pBot, ent2, attributes, "bottom");
    }
  } else if (schema.length === 3) {
    // Three Entities
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

    const cp1 = { x: 280, y: 180 };
    const cp2 = { x: 1040, y: 180 };
    const cc = { x: 660, y: 520 };

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

    const relName1 = deriveRelName(child.name, p1.name);
    const relName2 = deriveRelName(child.name, p2.name);

    relationships.push({
      id: `rel_${p1.name}_${child.name}`,
      name: relName1,
      fromTable: p1.name,
      toTable: child.name,
      x: (cp1.x + cc.x) / 2,
      y: (cp1.y + cc.y) / 2,
      fromPoint: { x: cp1.x + dp1.width / 4, y: cp1.y + dp1.height / 2 },
      toPoint: { x: cc.x - dc.width / 3, y: cc.y - dc.height / 2 },
      cardinalityFrom: "1",
      cardinalityTo: "N",
      cardFromPoint: { x: cp1.x + dp1.width / 4 + 25, y: cp1.y + dp1.height / 2 + 25 },
      cardToPoint: { x: cc.x - dc.width / 3 - 25, y: cc.y - dc.height / 2 - 20 },
    });

    relationships.push({
      id: `rel_${p2.name}_${child.name}`,
      name: relName2,
      fromTable: p2.name,
      toTable: child.name,
      x: (cp2.x + cc.x) / 2,
      y: (cp2.y + cc.y) / 2,
      fromPoint: { x: cp2.x - dp2.width / 4, y: cp2.y + dp2.height / 2 },
      toPoint: { x: cc.x + dc.width / 3, y: cc.y - dc.height / 2 },
      cardinalityFrom: "1",
      cardinalityTo: "N",
      cardFromPoint: { x: cp2.x - dp2.width / 4 - 25, y: cp2.y + dp2.height / 2 + 25 },
      cardToPoint: { x: cc.x + dc.width / 3 + 25, y: cc.y - dc.height / 2 - 20 },
    });

    const p1Attrs = layoutAttributesInRow(p1.columns, ep1.centerX, ep1.y - 95, -1, 28, false);
    pushAttributes(p1Attrs, ep1, attributes, "top");

    const p2Attrs = layoutAttributesInRow(p2.columns, ep2.centerX, ep2.y - 95, -1, 28, false);
    pushAttributes(p2Attrs, ep2, attributes, "top");

    const childAttrs = layoutAttributesInRow(child.columns, ec.centerX, ec.y + ec.height + 110, 1, 28, false);
    pushAttributes(childAttrs, ec, attributes, "bottom");
  } else if (schema.length === 4) {
    // Four Entities
    const findTable = (names: string[]) =>
      schema.find((t) => names.includes(t.name.toLowerCase())) ?? schema[0];

    const tCust = findTable(["customers", "users", "clients"]);
    const tProd = findTable(["products", "items", "books"]);
    const tOrd = findTable(["orders", "sales", "loans"]);
    const tItems = findTable(["order_items", "order_details", "line_items"]);

    const posCust = { x: 280, y: 180 };
    const posProd = { x: 1140, y: 180 };
    const posOrd = { x: 280, y: 540 };
    const posItems = { x: 1140, y: 540 };

    const dimCust = getEntityDimensions(tCust.name, false);
    const dimProd = getEntityDimensions(tProd.name, false);
    const dimOrd = getEntityDimensions(tOrd.name, false);
    const dimItems = getEntityDimensions(tItems.name, false);

    const entCust: EntityLayout = {
      id: tCust.name,
      name: dimCust.label,
      x: posCust.x - dimCust.width / 2,
      y: posCust.y - dimCust.height / 2,
      width: dimCust.width,
      height: dimCust.height,
      centerX: posCust.x,
      centerY: posCust.y,
    };
    const entProd: EntityLayout = {
      id: tProd.name,
      name: dimProd.label,
      x: posProd.x - dimProd.width / 2,
      y: posProd.y - dimProd.height / 2,
      width: dimProd.width,
      height: dimProd.height,
      centerX: posProd.x,
      centerY: posProd.y,
    };
    const entOrd: EntityLayout = {
      id: tOrd.name,
      name: dimOrd.label,
      x: posOrd.x - dimOrd.width / 2,
      y: posOrd.y - dimOrd.height / 2,
      width: dimOrd.width,
      height: dimOrd.height,
      centerX: posOrd.x,
      centerY: posOrd.y,
    };
    const entItems: EntityLayout = {
      id: tItems.name,
      name: dimItems.label,
      x: posItems.x - dimItems.width / 2,
      y: posItems.y - dimItems.height / 2,
      width: dimItems.width,
      height: dimItems.height,
      centerX: posItems.x,
      centerY: posItems.y,
    };

    entities.push(entCust, entProd, entOrd, entItems);

    relationships.push({
      id: `rel_${tCust.name}_${tOrd.name}`,
      name: "PLACES",
      fromTable: tCust.name,
      toTable: tOrd.name,
      x: posCust.x,
      y: (posCust.y + posOrd.y) / 2,
      fromPoint: { x: posCust.x, y: posCust.y + dimCust.height / 2 },
      toPoint: { x: posOrd.x, y: posOrd.y - dimOrd.height / 2 },
      cardinalityFrom: "1",
      cardinalityTo: "N",
      cardFromPoint: { x: posCust.x + 22, y: posCust.y + dimCust.height / 2 + 30 },
      cardToPoint: { x: posOrd.x + 22, y: posOrd.y - dimOrd.height / 2 - 30 },
    });

    relationships.push({
      id: `rel_${tProd.name}_${tItems.name}`,
      name: "CONTAINS",
      fromTable: tProd.name,
      toTable: tItems.name,
      x: posProd.x,
      y: (posProd.y + posItems.y) / 2,
      fromPoint: { x: posProd.x, y: posProd.y + dimProd.height / 2 },
      toPoint: { x: posItems.x, y: posItems.y - dimItems.height / 2 },
      cardinalityFrom: "1",
      cardinalityTo: "N",
      cardFromPoint: { x: posProd.x + 22, y: posProd.y + dimProd.height / 2 + 30 },
      cardToPoint: { x: posItems.x + 22, y: posItems.y - dimItems.height / 2 - 30 },
    });

    const midX = (posOrd.x + posItems.x) / 2;
    relationships.push({
      id: `rel_${tOrd.name}_${tItems.name}`,
      name: "CONTAINS",
      fromTable: tOrd.name,
      toTable: tItems.name,
      x: midX,
      y: posOrd.y,
      fromPoint: { x: posOrd.x + dimOrd.width / 2, y: posOrd.y },
      toPoint: { x: posItems.x - dimItems.width / 2, y: posItems.y },
      cardinalityFrom: "1",
      cardinalityTo: "N",
      cardFromPoint: { x: posOrd.x + dimOrd.width / 2 + 40, y: posOrd.y - 14 },
      cardToPoint: { x: posItems.x - dimItems.width / 2 - 40, y: posItems.y - 14 },
    });

    const custAttrs = layoutAttributesInRow(tCust.columns, entCust.centerX, entCust.y - 95, -1, 28, false);
    pushAttributes(custAttrs, entCust, attributes, "top");

    const prodAttrs = layoutAttributesInRow(tProd.columns, entProd.centerX, entProd.y - 95, -1, 28, false);
    pushAttributes(prodAttrs, entProd, attributes, "top");

    const ordAttrs = layoutAttributesInRow(tOrd.columns, entOrd.centerX, entOrd.y + entOrd.height + 115, 1, 28, false);
    pushAttributes(ordAttrs, entOrd, attributes, "bottom");

    const itemAttrs = layoutAttributesInRow(tItems.columns, entItems.centerX, entItems.y + entItems.height + 115, 1, 28, false);
    pushAttributes(itemAttrs, entItems, attributes, "bottom");
  } else {
    // General N-Entity Layout
    const colsCount = Math.min(3, Math.ceil(Math.sqrt(schema.length)));
    const cellWidth = 620;
    const cellHeight = 520;

    schema.forEach((table, idx) => {
      const colIdx = idx % colsCount;
      const rowIdx = Math.floor(idx / colsCount);
      const centerX = 320 + colIdx * cellWidth;
      const centerY = 240 + rowIdx * cellHeight;

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

      if (table.columns.length <= 4) {
        const placed = layoutAttributesInRow(table.columns, ent.centerX, ent.y - 100, -1, 28, false);
        pushAttributes(placed, ent, attributes, "top");
      } else {
        const half = Math.ceil(table.columns.length / 2);
        const pTop = layoutAttributesInRow(table.columns.slice(0, half), ent.centerX, ent.y - 100, -1, 26, false);
        pushAttributes(pTop, ent, attributes, "top");
        const pBot = layoutAttributesInRow(table.columns.slice(half), ent.centerX, ent.y + ent.height + 100, 1, 26, false);
        pushAttributes(pBot, ent, attributes, "bottom");
      }
    });

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

  // Calculate Dynamic Bounding Box
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  entities.forEach((e) => {
    minX = Math.min(minX, e.x);
    minY = Math.min(minY, e.y);
    maxX = Math.max(maxX, e.x + e.width);
    maxY = Math.max(maxY, e.y + e.height);
  });

  attributes.forEach((a) => {
    minX = Math.min(minX, a.x - a.rx);
    minY = Math.min(minY, a.y - a.ry);
    maxX = Math.max(maxX, a.x + a.rx);
    maxY = Math.max(maxY, a.y + a.ry);
  });

  relationships.forEach((r) => {
    minX = Math.min(minX, r.x - 70);
    minY = Math.min(minY, r.y - 45);
    maxX = Math.max(maxX, r.x + 70);
    maxY = Math.max(maxY, r.y + 45);
  });

  const pad = isSingle ? 50 : 55;
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
