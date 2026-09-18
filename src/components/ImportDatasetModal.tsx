"use client";

import { useRef, useState, type DragEvent, type ChangeEvent } from "react";
import type { Dataset, Table } from "@/lib/schema";
import { parseImportedFiles, type ImportStats } from "@/lib/datasetImporter";

interface ImportDatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportDataset: (dataset: Dataset) => void;
  dark?: boolean;
}

export function ImportDatasetModal({
  isOpen,
  onClose,
  onImportDataset,
}: ImportDatasetModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedDataset, setParsedDataset] = useState<Dataset | null>(null);
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [datasetName, setDatasetName] = useState("");
  const [description, setDescription] = useState("");
  const [activeTableIdx, setActiveTableIdx] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setIsDragging(false);
    setIsLoading(false);
    setError(null);
    setParsedDataset(null);
    setStats(null);
    setDatasetName("");
    setDescription("");
    setActiveTableIdx(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await parseImportedFiles(files);
      if (!result.success || !result.dataset) {
        setError(result.error || "Failed to parse files. Please check file format.");
        setParsedDataset(null);
        setStats(null);
      } else {
        setParsedDataset(result.dataset);
        setStats(result.stats || null);
        setDatasetName(result.dataset.name);
        setDescription(result.dataset.description);
        setActiveTableIdx(0);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Unexpected error processing file: ${msg}`);
      setParsedDataset(null);
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleConfirmImport = () => {
    if (!parsedDataset) return;
    const finalDataset: Dataset = {
      ...parsedDataset,
      name: datasetName.trim() || parsedDataset.name,
      description: description.trim() || parsedDataset.description,
    };
    onImportDataset(finalDataset);
    handleClose();
  };

  const currentTable: Table | undefined = parsedDataset?.schema[activeTableIdx];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden transition-all animate-in zoom-in-95 duration-150"
        style={{
          background: "var(--panel)",
          borderColor: "var(--border)",
          color: "var(--foreground)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center border"
              style={{
                background: "var(--surface-subtle)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
                Import Dataset
              </h2>
              <p className="text-xs opacity-70" style={{ color: "var(--muted)" }}>
                Import data from SQLite (.db), Excel, CSV, JSON, TSV, or SQL files
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer border hover:opacity-80"
            style={{
              background: "var(--surface-subtle)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.xlsm,.csv,.tsv,.tab,.json,.sql,.txt,.db,.sqlite,.sqlite3"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* File Upload / Drag Zone */}
          {!parsedDataset && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? "border-[var(--accent)] bg-[var(--surface-hover)] scale-[0.99]"
                  : "border-[var(--border)] hover:border-[var(--muted)] bg-[var(--surface-subtle)]"
              }`}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center border shadow-xs"
                style={{
                  background: "var(--panel)",
                  borderColor: "var(--border)",
                  color: "var(--accent)",
                }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>

              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  {isLoading ? "Reading and analyzing file..." : "Click to browse or drag and drop files here"}
                </p>
                <p className="text-xs opacity-70 mt-1" style={{ color: "var(--muted)" }}>
                  Supports SQLite Database (.db, .sqlite), Excel (.xlsx, .xls), CSV, TSV, JSON, and SQL files.
                </p>
              </div>

              {/* Supported format pills */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
                {[".DB", ".SQLITE", ".XLSX", ".CSV", ".JSON", ".TSV", ".SQL"].map((ext) => (
                  <span
                    key={ext}
                    className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold border"
                    style={{
                      background: "var(--surface-hover)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                    }}
                  >
                    {ext}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center justify-center gap-3 py-6">
              <div
                className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: "var(--foreground)", borderTopColor: "transparent" }}
              />
              <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                Parsing tables, sanitizing empty/NaN values, and inferring schema...
              </span>
            </div>
          )}

          {/* Graceful Error Notification */}
          {error && (
            <div
              className="p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed animate-in fade-in"
              style={{
                background: "rgba(244, 63, 94, 0.1)",
                borderColor: "rgba(244, 63, 94, 0.3)",
                color: "#fda4af",
              }}
            >
              <svg className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-rose-400 mb-1">Issue Importing File</h4>
                <p className="text-rose-300 whitespace-pre-wrap">{error}</p>
                <div className="mt-2.5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      fileInputRef.current?.click();
                    }}
                    className="px-2.5 py-1 rounded bg-rose-500 text-white font-semibold cursor-pointer text-xs hover:bg-rose-600 transition-colors"
                  >
                    Try Another File
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Parsed Preview Section */}
          {parsedDataset && (
            <div className="space-y-4">
              {/* Hygiene & Stats Banner */}
              {stats && (
                <div
                  className="p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-2"
                  style={{
                    background: "var(--surface-subtle)",
                    borderColor: "var(--border)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <div className="text-xs">
                      <span className="font-semibold" style={{ color: "var(--foreground)" }}>
                        {stats.tablesCount} table{stats.tablesCount > 1 ? "s" : ""}, {stats.rowsCount} rows, {stats.columnsCount} columns detected
                      </span>
                      <p className="opacity-70 text-[11px]" style={{ color: "var(--muted)" }}>
                        From: {stats.fileNames.join(", ")} ({stats.detectedFormat})
                      </p>
                    </div>
                  </div>

                  {/* Sanitization Badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-1 rounded-md text-[11px] font-semibold border flex items-center gap-1"
                      style={{
                        background: stats.emptyValuesCleaned > 0 ? "rgba(16, 185, 129, 0.1)" : "var(--surface-hover)",
                        borderColor: stats.emptyValuesCleaned > 0 ? "rgba(16, 185, 129, 0.3)" : "var(--border)",
                        color: stats.emptyValuesCleaned > 0 ? "#10b981" : "var(--muted)",
                      }}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>
                        {stats.emptyValuesCleaned > 0
                          ? `${stats.emptyValuesCleaned} empty/NaN cells cleaned`
                          : "No empty/NaN values"}
                      </span>
                    </span>

                    {stats.emptyRowsSkipped > 0 && (
                      <span
                        className="px-2 py-1 rounded-md text-[11px] font-semibold border"
                        style={{
                          background: "var(--surface-hover)",
                          borderColor: "var(--border)",
                          color: "var(--muted)",
                        }}
                      >
                        {stats.emptyRowsSkipped} blank row{stats.emptyRowsSkipped > 1 ? "s" : ""} skipped
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Dataset Name & Description Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--foreground)" }}>
                    Dataset Name
                  </label>
                  <input
                    type="text"
                    value={datasetName}
                    onChange={(e) => setDatasetName(e.target.value)}
                    placeholder="e.g. Sales Records"
                    className="w-full px-3 py-1.5 rounded-lg border text-xs outline-none focus:ring-1 transition-all"
                    style={{
                      background: "var(--surface-subtle)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--foreground)" }}>
                    Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Dataset description"
                    className="w-full px-3 py-1.5 rounded-lg border text-xs outline-none focus:ring-1 transition-all"
                    style={{
                      background: "var(--surface-subtle)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                    }}
                  />
                </div>
              </div>

              {/* Table Selector (if multiple tables) */}
              {parsedDataset.schema.length > 1 && (
                <div className="flex items-center gap-1.5 border-b pb-2 overflow-x-auto" style={{ borderColor: "var(--border)" }}>
                  <span className="text-xs font-semibold shrink-0 mr-1" style={{ color: "var(--muted)" }}>
                    Tables:
                  </span>
                  {parsedDataset.schema.map((t, idx) => (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => setActiveTableIdx(idx)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                        activeTableIdx === idx ? "font-bold shadow-xs" : "opacity-75 hover:opacity-100"
                      }`}
                      style={{
                        background: activeTableIdx === idx ? "var(--surface-hover)" : "transparent",
                        borderColor: activeTableIdx === idx ? "var(--accent)" : "var(--border)",
                        color: "var(--foreground)",
                      }}
                    >
                      {t.name} ({t.rows?.length || 0} rows)
                    </button>
                  ))}
                </div>
              )}

              {/* Active Table Schema & Data Preview */}
              {currentTable && (
                <div className="border rounded-xl overflow-hidden" style={{ borderColor: "var(--border)" }}>
                  {/* Table Header Info */}
                  <div
                    className="px-3.5 py-2.5 border-b flex items-center justify-between"
                    style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs font-mono" style={{ color: "var(--foreground)" }}>
                        {currentTable.name}
                      </span>
                      <span className="text-[11px] opacity-70" style={{ color: "var(--muted)" }}>
                        {currentTable.columns.length} columns • {currentTable.rows?.length || 0} rows
                      </span>
                    </div>

                    {/* Column Types Summary */}
                    <div className="flex items-center gap-1">
                      {currentTable.columns.slice(0, 5).map((col) => (
                        <span
                          key={col.name}
                          className="text-[10px] px-1.5 py-0.5 rounded font-mono border"
                          style={{
                            background: "var(--panel)",
                            borderColor: "var(--border)",
                            color: col.pk ? "var(--accent)" : "var(--muted)",
                          }}
                          title={`${col.name} (${col.type})${col.pk ? " - Primary Key" : ""}`}
                        >
                          {col.name}: <span className="font-semibold">{col.type}</span>
                          {col.pk && <span className="ml-1 text-emerald-400 font-bold">PK</span>}
                        </span>
                      ))}
                      {currentTable.columns.length > 5 && (
                        <span className="text-[10px] opacity-60 font-mono" style={{ color: "var(--muted)" }}>
                          +{currentTable.columns.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sample Rows Table Preview */}
                  <div className="max-h-48 overflow-auto">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead>
                        <tr style={{ background: "var(--surface-subtle)" }}>
                          {currentTable.columns.map((col) => (
                            <th
                              key={col.name}
                              className="px-3 py-1.5 border-b font-semibold text-[11px] whitespace-nowrap"
                              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                            >
                              <div className="flex items-center gap-1">
                                <span>{col.name}</span>
                                <span className="text-[9px] opacity-60 font-normal">({col.type})</span>
                                {col.pk && (
                                  <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    PK
                                  </span>
                                )}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {currentTable.rows && currentTable.rows.length > 0 ? (
                          currentTable.rows.slice(0, 6).map((row, rIdx) => (
                            <tr
                              key={rIdx}
                              className="border-b last:border-none hover:bg-[var(--surface-hover)] transition-colors"
                              style={{ borderColor: "var(--border)" }}
                            >
                              {currentTable.columns.map((col) => {
                                const val = row[col.name];
                                const isNull = val === null || val === undefined;
                                return (
                                  <td
                                    key={col.name}
                                    className="px-3 py-1.5 whitespace-nowrap text-xs"
                                    style={{
                                      color: isNull ? "var(--muted)" : "var(--foreground)",
                                      fontStyle: isNull ? "italic" : "normal",
                                    }}
                                  >
                                    {isNull ? "NULL" : String(val)}
                                  </td>
                                );
                              })}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={currentTable.columns.length}
                              className="px-3 py-4 text-center text-xs opacity-60"
                              style={{ color: "var(--muted)" }}
                            >
                              Table structure ready with 0 data rows.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className="flex items-center justify-between px-5 py-3.5 border-t shrink-0"
          style={{ background: "var(--surface-subtle)", borderColor: "var(--border)" }}
        >
          {parsedDataset ? (
            <button
              type="button"
              onClick={() => {
                setParsedDataset(null);
                setStats(null);
                setError(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer hover:opacity-90 transition-opacity"
              style={{
                background: "transparent",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            >
              Choose Another File
            </button>
          ) : (
            <div className="text-xs opacity-60" style={{ color: "var(--muted)" }}>
              Select any compatible file from your computer
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium border cursor-pointer hover:opacity-90 transition-opacity"
              style={{
                background: "transparent",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            >
              Cancel
            </button>

            {parsedDataset && (
              <button
                type="button"
                onClick={handleConfirmImport}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shadow-xs hover:opacity-95 transition-all flex items-center gap-1.5 border"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-foreground)",
                  borderColor: "var(--accent)",
                }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Import &amp; Load Dataset</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
