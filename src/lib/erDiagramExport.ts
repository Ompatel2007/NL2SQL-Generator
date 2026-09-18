import type { Table } from "./schema";
import type { ThemeId } from "@/components/nlSqlTypes";
import { computeChenDiagramLayout } from "./erDiagramLayout";
import { triggerFileDownload } from "./reportGenerator";

/**
 * Generates a standalone, self-contained SVG string representing the Chen ER diagram
 * for the given database schema. Works in both browser and server/Node environments.
 */
export function generateChenErDiagramSvg(schema: Table[], theme: ThemeId = "slate"): string {
  if (!schema || schema.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="120" viewBox="0 0 400 120">
      <rect width="400" height="120" fill="#0f172a" rx="8"/>
      <text x="200" y="65" fill="#94a3b8" font-size="14" font-family="sans-serif" text-anchor="middle">No schema available</text>
    </svg>`;
  }

  const diagramData = computeChenDiagramLayout(schema);
  const { viewBox, entities, attributes, relationships } = diagramData;

  const isPearl = theme === "pearl";
  const erBgColor = isPearl ? "#ffffff" : "#000000";
  const textColorPrimary = isPearl ? "#0f172a" : "#ffffff";
  const lineColorAttr = isPearl ? "#64748b" : "#475569";
  const lineColorRel = isPearl ? "#475569" : "#64748b";
  const cardColor = isPearl ? "#2563eb" : "#60a5fa";

  let linesSvg = "";

  // 1. Connector Lines from Entities to Attributes
  for (const attr of attributes) {
    linesSvg += `<line x1="${attr.lineStart.x}" y1="${attr.lineStart.y}" x2="${attr.x}" y2="${attr.lineEnd.y}" stroke="${lineColorAttr}" stroke-width="2" stroke-linecap="round" />\n`;
  }

  // 2. Connector Lines between Entities and Relationships
  for (const rel of relationships) {
    linesSvg += `<line x1="${rel.fromPoint.x}" y1="${rel.fromPoint.y}" x2="${rel.x}" y2="${rel.y}" stroke="${lineColorRel}" stroke-width="2.2" stroke-linecap="round" />\n`;
    linesSvg += `<line x1="${rel.x}" y1="${rel.y}" x2="${rel.toPoint.x}" y2="${rel.toPoint.y}" stroke="${lineColorRel}" stroke-width="2.2" stroke-linecap="round" />\n`;
    linesSvg += `<text x="${rel.cardFromPoint.x}" y="${rel.cardFromPoint.y}" fill="${cardColor}" font-size="15" font-weight="bold" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">${rel.cardinalityFrom}</text>\n`;
    linesSvg += `<text x="${rel.cardToPoint.x}" y="${rel.cardToPoint.y}" fill="${cardColor}" font-size="15" font-weight="bold" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle">${rel.cardinalityTo}</text>\n`;
  }

  // 3. Entities (Blue Rectangles)
  let entitiesSvg = "";
  for (const ent of entities) {
    entitiesSvg += `<g filter="url(#chen-shadow)">
      <rect x="${ent.x}" y="${ent.y}" width="${ent.width}" height="${ent.height}" rx="8" fill="url(#entity-gradient)" stroke="#3b82f6" stroke-width="2.5" />
      <text x="${ent.centerX}" y="${ent.centerY + 5}" fill="#ffffff" font-size="15" font-weight="bold" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle" letter-spacing="0.05em">${ent.name}</text>
    </g>\n`;
  }

  // 4. Relationships (Emerald Diamonds)
  let relationshipsSvg = "";
  for (const rel of relationships) {
    const dw = 55;
    const points = `${rel.x},${rel.y - dw * 0.55} ${rel.x + dw},${rel.y} ${rel.x},${rel.y + dw * 0.55} ${rel.x - dw},${rel.y}`;
    relationshipsSvg += `<g filter="url(#chen-shadow)">
      <polygon points="${points}" fill="url(#rel-gradient)" stroke="#10b981" stroke-width="2.5" />
      <text x="${rel.x}" y="${rel.y + 4.5}" fill="#ffffff" font-size="13" font-weight="bold" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle" letter-spacing="0.03em">${rel.name}</text>
    </g>\n`;
  }

  // 5. Attributes (Slate Ovals)
  let attributesSvg = "";
  for (const attr of attributes) {
    attributesSvg += `<g filter="url(#chen-shadow)">
      <ellipse cx="${attr.x}" cy="${attr.y}" rx="${attr.rx}" ry="${attr.ry}" fill="url(#attr-gradient)" stroke="${attr.isPk ? "#f59e0b" : "#64748b"}" stroke-width="${attr.isPk ? "2.5" : "2"}" />
      <text x="${attr.x}" y="${attr.y + 4.5}" fill="${attr.isPk ? "#fbbf24" : "#f1f5f9"}" font-size="${attr.isPk ? "13" : "12"}" font-weight="${attr.isPk ? "bold" : "500"}" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle"${attr.isPk ? ' text-decoration="underline"' : ""}>${attr.name}</text>
    </g>\n`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}" width="${viewBox.width}" height="${viewBox.height}">
  <defs>
    <filter id="chen-shadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="${isPearl ? "0.18" : "0.6"}" />
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

  <rect x="${viewBox.minX}" y="${viewBox.minY}" width="${viewBox.width}" height="${viewBox.height}" fill="${erBgColor}" />

  <g id="chen-diagram-content">
    ${linesSvg}
    ${entitiesSvg}
    ${relationshipsSvg}
    ${attributesSvg}
  </g>
</svg>`;
}

/**
 * Renders the Chen ER diagram into a high-resolution PNG Base64 data URL.
 */
export async function generateChenErDiagramPng(schema: Table[], theme: ThemeId = "slate"): Promise<string> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return "";
  }

  const svgString = generateChenErDiagramSvg(schema, theme);
  const diagramData = computeChenDiagramLayout(schema);
  const { viewBox } = diagramData;

  const isPearl = theme === "pearl";
  const erBgColor = isPearl ? "#ffffff" : "#000000";

  return new Promise<string>((resolve, reject) => {
    try {
      const img = new Image();
      const encodedSvg = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgString)));

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = 2; // Crisp 2x retina rendering
        canvas.width = Math.max(1200, Math.round(viewBox.width * scale));
        canvas.height = Math.max(650, Math.round(viewBox.height * scale));

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve("");
          return;
        }

        ctx.fillStyle = erBgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const pngUrl = canvas.toDataURL("image/png");
        resolve(pngUrl);
      };

      img.onerror = (e) => {
        console.error("Failed to render SVG image onto canvas:", e);
        reject(e);
      };

      img.src = encodedSvg;
    } catch (err) {
      console.error("Error in generateChenErDiagramPng:", err);
      reject(err);
    }
  });
}

/**
 * Triggers instant download for only the latest ER Diagram in SVG or PNG.
 */
export async function downloadERDiagram(
  schema: Table[],
  format: "svg" | "png",
  theme: ThemeId = "slate",
  filename = "er_diagram",
) {
  if (format === "svg") {
    const svg = generateChenErDiagramSvg(schema, theme);
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    triggerFileDownload(blob, `${filename}.svg`);
  } else {
    const pngDataUrl = await generateChenErDiagramPng(schema, theme);
    if (!pngDataUrl) return;

    // Convert data URL to Blob for clean triggering
    const res = await fetch(pngDataUrl);
    const blob = await res.blob();
    triggerFileDownload(blob, `${filename}.png`);
  }
}
