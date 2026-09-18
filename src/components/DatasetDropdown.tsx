import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Dataset } from "@/lib/schema";

interface DatasetDropdownProps {
  datasets: Dataset[];
  selectedDatasetId: string;
  onChange: (id: string) => void;
  onOpenCreateModal?: () => void;
  onOpenImportModal?: () => void;
  onEditDataset?: (dataset: Dataset) => void;
  onDeleteDataset?: (id: string) => void;
}

export function DatasetDropdown({
  datasets,
  selectedDatasetId,
  onChange,
  onOpenCreateModal,
  onOpenImportModal,
  onEditDataset,
  onDeleteDataset,
}: DatasetDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedDataset =
    datasets.find((dataset) => dataset.id === selectedDatasetId) ?? datasets[0];
  const selectedIndex = Math.max(
    datasets.findIndex((dataset) => dataset.id === selectedDataset?.id),
    0,
  );

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const selectDataset = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen((isOpen) => !isOpen);
      return;
    }
    if (!open || !datasets.length) return;

    let nextIndex = selectedIndex;
    if (event.key === "ArrowDown")
      nextIndex = (selectedIndex + 1) % datasets.length;
    if (event.key === "ArrowUp")
      nextIndex = (selectedIndex - 1 + datasets.length) % datasets.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = datasets.length - 1;
    if (nextIndex !== selectedIndex) {
      event.preventDefault();
      selectDataset(datasets[nextIndex].id);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className="dataset-select flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="dataset-options"
        onClick={() => setOpen((isOpen) => !isOpen)}
        onKeyDown={handleKeyDown}
      >
        <span className="flex items-center gap-2 truncate">
          <span style={{ color: "var(--foreground)" }}>{selectedDataset?.name}</span>
          {selectedDataset?.isCustom && (
            <span
              className="text-xs px-2 py-0.5 rounded font-semibold uppercase border"
              style={{
                background: "var(--surface-hover)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            >
              Custom
            </span>
          )}
        </span>
        <span
          className={`dataset-chevron ${open ? "dataset-chevron-open" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div
          id="dataset-options"
          role="listbox"
          aria-label="Datasets"
          className="dataset-menu absolute z-20 mt-2 w-full overflow-hidden rounded-xl p-1.5 flex flex-col shadow-2xl border"
          style={{
            background: "var(--panel)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
            maxHeight: "384px", // Increased by 20% from 320px
          }}
        >
          {/* Scrollable dataset list with dedicated slider */}
          <div
            className="flex-1 overflow-y-auto min-h-0 space-y-0.5 pr-1 scrollbar-thin"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "var(--border) transparent",
            }}
          >
            {datasets.map((dataset) => {
              const selected = dataset.id === selectedDataset?.id;
              return (
                <div
                  key={dataset.id}
                  className={`dataset-option w-full rounded-lg px-3 py-2 text-left flex items-center justify-between gap-2 ${
                    selected ? "dataset-option-selected" : ""
                  }`}
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className="flex-1 min-w-0 text-left cursor-pointer pr-1"
                    onClick={() => selectDataset(dataset.id)}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="block text-sm font-semibold truncate"
                        style={{ color: "var(--foreground)" }}
                      >
                        {dataset.name}
                      </span>
                      {dataset.isCustom && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase border shrink-0"
                          style={{
                            background: "var(--surface-hover)",
                            borderColor: "var(--border)",
                            color: "var(--foreground)",
                          }}
                        >
                          Custom
                        </span>
                      )}
                    </div>
                    <span
                      className="mt-0.5 block text-xs opacity-70 truncate"
                      style={{ color: "var(--muted)" }}
                    >
                      {dataset.description}
                    </span>
                  </button>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {onEditDataset && (
                      <button
                        type="button"
                        title={`Edit ${dataset.name}`}
                        aria-label={`Edit ${dataset.name}`}
                        className="p-1.5 text-xs rounded-md border border-zinc-500/30 hover:bg-zinc-500/15 hover:border-zinc-400/50 text-zinc-300 hover:text-zinc-100 cursor-pointer flex items-center justify-center transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpen(false);
                          onEditDataset(dataset);
                        }}
                      >
                        <svg
                          className="w-3.5 h-3.5 opacity-80"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                    )}
                    {onDeleteDataset && (
                      <button
                        type="button"
                        title={`Delete ${dataset.name}`}
                        aria-label={`Delete ${dataset.name}`}
                        className="p-1.5 text-xs rounded-md border border-rose-500/30 hover:bg-rose-500/15 hover:border-rose-500/60 text-rose-400 hover:text-rose-300 cursor-pointer flex items-center justify-center transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Are you sure you want to delete dataset "${dataset.name}"?`)) {
                            onDeleteDataset(dataset.id);
                          }
                        }}
                      >
                        <svg
                          className="w-3.5 h-3.5 opacity-80"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Always stuck at the bottom: Create and Import actions */}
          {(onOpenCreateModal || onOpenImportModal) && (
            <div
              className="shrink-0 pt-1.5 mt-1 border-t flex flex-col gap-0.5 z-10"
              style={{
                borderColor: "var(--border)",
                background: "var(--panel)",
              }}
            >
              {onOpenCreateModal && (
                <button
                  type="button"
                  className="dataset-option w-full rounded-lg px-3 py-2 text-left text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  style={{ color: "var(--foreground)" }}
                  onClick={() => {
                    setOpen(false);
                    onOpenCreateModal();
                  }}
                >
                  <span>+ Create New Dataset...</span>
                </button>
              )}
              {onOpenImportModal && (
                <button
                  type="button"
                  className="dataset-option w-full rounded-lg px-3 py-2 text-left text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  style={{ color: "var(--foreground)" }}
                  onClick={() => {
                    setOpen(false);
                    onOpenImportModal();
                  }}
                >
                  <svg
                    className="w-3.5 h-3.5 opacity-80"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  <span>Import Dataset...</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
