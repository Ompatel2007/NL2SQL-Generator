"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import type { Table, Column } from "@/lib/schema";
import type { ThemeId } from "./nlSqlTypes";

interface ChenERDiagramProps {
  schema: Table[];
  theme?: ThemeId;
}

import {
  type Point,
  type EntityLayout,
  type AttributeLayout,
  type RelationshipLayout,
  type ChenDiagramData,
  computeChenDiagramLayout,
} from "@/lib/erDiagramLayout";


// -------------------------------------------------------------
// Interactive Chen ER Diagram Component
// -------------------------------------------------------------
export function ChenERDiagram({ schema, theme }: ChenERDiagramProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Layout dynamic calculation
  const diagramData = useMemo(() => {
    if (!schema || schema.length === 0) return null;
    return computeChenDiagramLayout(schema);
  }, [schema]);

  // Theme resolution: prop or DOM attribute
  const [activeTheme, setActiveTheme] = useState<ThemeId>(theme ?? "slate");

  useEffect(() => {
    if (theme) {
      setActiveTheme(theme);
      return;
    }
    const updateFromDOM = () => {
      const current = document.documentElement.getAttribute("data-theme") as ThemeId | null;
      if (current) setActiveTheme(current);
    };
    updateFromDOM();
    const observer = new MutationObserver(updateFromDOM);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
    return () => observer.disconnect();
  }, [theme]);

  const isPearl = activeTheme === "pearl";

  if (!diagramData) {
    return (
      <div className="p-4 text-xs text-[var(--muted)] text-center">
        No schema available for ER diagram.
      </div>
    );
  }

  return (
    <>
      <ChenCanvas
        diagramData={diagramData}
        onExpandFullscreen={() => setIsFullscreen(true)}
        isModal={false}
        theme={activeTheme}
      />

      {/* Fullscreen Modal View */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md"
          onClick={() => setIsFullscreen(false)}
        >
          <div
            className="w-full max-w-7xl h-[92vh] p-4 sm:p-6 rounded-2xl border flex flex-col gap-3 shadow-2xl overflow-hidden transition-colors duration-200"
            style={{
              borderColor: "var(--border)",
              backgroundColor: isPearl ? "#ffffff" : "#000000",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                <h2 className="text-sm sm:text-base font-bold" style={{ color: isPearl ? "#0f172a" : "#f4f4f5" }}>
                  Entity-Relationship Diagram (Interactive Canvas)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="px-3 py-1 rounded-lg text-xs font-semibold border transition-colors hover:bg-[var(--surface-hover)] cursor-pointer"
                style={{
                  background: isPearl ? "#f1f5f9" : "#18181c",
                  borderColor: "var(--border)",
                  color: isPearl ? "#0f172a" : "#f4f4f5",
                }}
              >
                ✕ Close
              </button>
            </div>

            <div className="flex-1 min-h-0">
              <ChenCanvas diagramData={diagramData} onExpandFullscreen={() => {}} isModal={true} theme={activeTheme} />
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
  theme?: ThemeId;
}

function ChenCanvas({ diagramData, onExpandFullscreen, isModal = false, theme }: ChenCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Pan & Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const dragStartRef = useRef<Point>({ x: 0, y: 0 });
  const panStartRef = useRef<Point>({ x: 0, y: 0 });

  const { viewBox } = diagramData;

  // Active theme tracking
  const [activeTheme, setActiveTheme] = useState<ThemeId>(theme ?? "slate");

  useEffect(() => {
    if (theme) {
      setActiveTheme(theme);
      return;
    }
    const updateFromDOM = () => {
      const current = document.documentElement.getAttribute("data-theme") as ThemeId | null;
      if (current) setActiveTheme(current);
    };
    updateFromDOM();
    const observer = new MutationObserver(updateFromDOM);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
    return () => observer.disconnect();
  }, [theme]);

  const isPearl = activeTheme === "pearl";
  const erBgColor = isPearl ? "#ffffff" : "#000000";

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
    const clone = svgRef.current.cloneNode(true) as SVGSVGElement;
    const contentG = clone.querySelector("#chen-diagram-content");
    if (contentG) {
      contentG.removeAttribute("transform");
    }
    // Inject background rect so exported SVG preserves theme background (white for pearl, black for others)
    const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bgRect.setAttribute("x", String(viewBox.minX));
    bgRect.setAttribute("y", String(viewBox.minY));
    bgRect.setAttribute("width", String(viewBox.width));
    bgRect.setAttribute("height", String(viewBox.height));
    bgRect.setAttribute("fill", erBgColor);
    clone.insertBefore(bgRect, clone.firstChild);

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
      canvas.width = Math.max(1400, Math.round(viewBox.width * 1.5));
      canvas.height = Math.max(800, Math.round(viewBox.height * 1.5));
      if (ctx) {
        ctx.fillStyle = erBgColor;
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
        className={`w-full relative overflow-hidden rounded-xl border select-none transition-colors duration-200 ${
          isModal ? "flex-1 min-h-0" : "h-[480px] min-h-[440px]"
        }`}
        style={{
          borderColor: "var(--border)",
          backgroundColor: erBgColor,
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        <svg
          ref={svgRef}
          viewBox={`${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`}
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            backgroundColor: erBgColor,
          }}
        >
          <defs>
            <filter id="chen-shadow" x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity={isPearl ? "0.18" : "0.6"} />
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
                y2={attr.lineEnd.y}
                stroke={isPearl ? "#64748b" : "#475569"}
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
                  stroke={isPearl ? "#475569" : "#64748b"}
                  strokeWidth="2.2"
                />
                <line
                  x1={rel.x}
                  y1={rel.y}
                  x2={rel.toPoint.x}
                  y2={rel.toPoint.y}
                  stroke={isPearl ? "#475569" : "#64748b"}
                  strokeWidth="2.2"
                />
                {/* Cardinality Labels */}
                <text
                  x={rel.cardFromPoint.x}
                  y={rel.cardFromPoint.y}
                  fill={isPearl ? "#2563eb" : "#60a5fa"}
                  fontSize="15"
                  fontWeight="bold"
                  textAnchor="middle"
                  style={{ textShadow: isPearl ? "0 1px 2px rgba(255,255,255,0.9)" : "0 1px 3px rgba(0,0,0,0.8)" }}
                >
                  {rel.cardinalityFrom}
                </text>
                <text
                  x={rel.cardToPoint.x}
                  y={rel.cardToPoint.y}
                  fill={isPearl ? "#2563eb" : "#60a5fa"}
                  fontSize="15"
                  fontWeight="bold"
                  textAnchor="middle"
                  style={{ textShadow: isPearl ? "0 1px 2px rgba(255,255,255,0.9)" : "0 1px 3px rgba(0,0,0,0.8)" }}
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
              const points = `${rel.x},${rel.y - dw * 0.55} ${rel.x + dw},${rel.y} ${rel.x},${rel.y + dw * 0.55} ${rel.x - dw},${rel.y}`;
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
                    y={rel.y + 4.5}
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
        <div
          className={`absolute bottom-2.5 right-3 pointer-events-none text-[10px] px-2 py-1 rounded-md border backdrop-blur-xs flex items-center gap-1.5 transition-colors duration-200 ${
            isPearl
              ? "text-zinc-600 bg-white/90 border-zinc-300 shadow-xs"
              : "text-zinc-400/80 bg-zinc-950/80 border-zinc-800/80"
          }`}
        >
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
