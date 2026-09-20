"use client";

import { useCallback, useRef, useState } from "react";
import type { Dataset, Table } from "@/lib/schema";
import type { HistoryItem, ThemeId } from "./nlSqlTypes";
import { DatasetDropdown } from "./DatasetDropdown";
import { VoiceButton } from "./VoiceButton";
import {
  useVoiceRecognition,
  speakText,
  type VoiceAudioResult,
} from "@/lib/useSpeechRecognition";
import type { PLSQLExample } from "@/lib/plsqlExamples";

export interface PlSqlInputPanelProps {
  datasets: Dataset[];
  selectedDatasetId: string;
  activeSchema?: Table[];
  minPanelHeight?: number | string;
  maxPanelHeight?: number | string;
  panelHeight?: number | string;
  onDatasetChange: (id: string) => void;
  examples: PLSQLExample[];
  nlInput: string;
  onNlInputChange: (value: string) => void;
  onTranslate: () => void;
  nlInfo?: {
    sql: string;
    confidence: number;
    interpretation: string;
  } | null;
  plsql: string;
  onPlSqlChange: (value: string) => void;
  onRunScript: () => void;
  onExampleSelect: (question: string, script: string) => void;
  onResetDatabase: () => void;
  error?: string;
  history: HistoryItem[];
  onSelectHistory: (item: HistoryItem) => void;
  onVoiceTranslateAndRun?: (params: {
    audioBase64?: string;
    mimeType?: string;
    question?: string;
  }) => void;
  isTranslatingVoice?: boolean;
  isTranslatingText?: boolean;
  voiceFeedback?: boolean;
  onToggleVoiceFeedback?: (enabled: boolean) => void;
  onOpenCreateModal?: () => void;
  onOpenImportModal?: () => void;
  onEditDataset?: (dataset: Dataset) => void;
  onDeleteDataset?: (id: string) => void;
  onOpenGuide?: () => void;
  theme?: ThemeId;
}

export function PlSqlInputPanel({
  datasets,
  selectedDatasetId,
  minPanelHeight,
  maxPanelHeight,
  panelHeight,
  onDatasetChange,
  examples,
  nlInput,
  onNlInputChange,
  onTranslate,
  nlInfo,
  plsql,
  onPlSqlChange,
  onRunScript,
  onExampleSelect,
  onResetDatabase,
  error,
  history,
  onSelectHistory,
  onVoiceTranslateAndRun,
  isTranslatingVoice = false,
  isTranslatingText = false,
  voiceFeedback = false,
  onToggleVoiceFeedback,
  onOpenCreateModal,
  onOpenImportModal,
  onEditDataset,
  onDeleteDataset,
}: PlSqlInputPanelProps) {
  const [autoExecute, setAutoExecute] = useState(true);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const activeDataset =
    datasets.find((d) => d.id === selectedDatasetId) ?? datasets[0];

  // Handle completion of audio speech
  const handleAudioReady = useCallback(
    (result: VoiceAudioResult) => {
      if (result.transcript) {
        onNlInputChange(result.transcript);
      }
      if (autoExecute && onVoiceTranslateAndRun) {
        onVoiceTranslateAndRun({
          audioBase64: result.audioBase64,
          mimeType: result.mimeType,
          question: result.transcript || nlInput,
        });
      }
    },
    [autoExecute, nlInput, onNlInputChange, onVoiceTranslateAndRun],
  );

  const {
    isListening,
    transcript,
    interimTranscript,
    audioLevel,
    error: speechError,
    isSupported,
    startListening,
    stopListening,
  } = useVoiceRecognition({
    onAudioReady: handleAudioReady,
    onInterimResult: (interim) => {
      if (interim && !autoExecute) {
        onNlInputChange(interim);
      }
    },
    autoStopSilenceMs: 2500,
  });

  const handleStartVoice = () => {
    startListening(handleAudioReady);
  };

  const handleReadInterpretation = () => {
    if (nlInfo?.interpretation) {
      speakText(nlInfo.interpretation);
    }
  };

  return (
    <section
      className="panel p-4 flex flex-col gap-4 relative overflow-hidden"
      style={{
        background: "var(--panel)",
        borderColor: "var(--border)",
        color: "var(--foreground)",
        minHeight: minPanelHeight
          ? typeof minPanelHeight === "number"
            ? `${minPanelHeight}px`
            : minPanelHeight
          : "calc(100vh - 5.25rem)",
        maxHeight: maxPanelHeight ? `${maxPanelHeight}px` : undefined,
        height: panelHeight
          ? typeof panelHeight === "number"
            ? `${panelHeight}px`
            : panelHeight
          : undefined,
      }}
      aria-label="PL/SQL Input panel"
    >
      {/* Scrollable Main Area matching SQL InputPanel */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto scrollbar-thin space-y-4 pr-1">
        {/* Choose a Dataset Header */}
        <div className="p-3 rounded-lg">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <label
              htmlFor="dataset"
              className="text-xs font-bold uppercase tracking-wider whitespace-nowrap shrink-0 block"
              style={{ color: "var(--muted)" }}
            >
              Choose a dataset
            </label>

            <div
              className="flex items-center gap-1.5 shrink-0 relative"
              ref={moreMenuRef}
            >
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen((prev) => !prev)}
                title="Click for more options"
                aria-label="Click for more options"
                className="h-7 px-2 rounded-md text-zinc-300 hover:bg-zinc-500/10 flex items-center justify-center transition-colors cursor-pointer text-xs font-medium"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>

              {/* 3-Dots Dropdown Popover */}
              {isMoreMenuOpen && (
                <div
                  className="absolute right-0 top-8 z-30 w-44 rounded-xl border p-1.5 shadow-xl space-y-1"
                  style={{
                    background: "var(--panel)",
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                  }}
                >
                  {onEditDataset && activeDataset && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        onEditDataset(activeDataset);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 hover:bg-[var(--surface-hover)] text-purple-400 cursor-pointer"
                    >
                      <span>Edit Dataset</span>
                    </button>
                  )}
                  {onOpenCreateModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        onOpenCreateModal();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 hover:bg-[var(--surface-hover)] text-blue-400 cursor-pointer"
                    >
                      <span>+ New Dataset</span>
                    </button>
                  )}
                  {onOpenImportModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        onOpenImportModal();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 hover:bg-[var(--surface-hover)] text-emerald-400 cursor-pointer"
                    >
                      <span>Import Dataset</span>
                    </button>
                  )}
                  {onResetDatabase && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        onResetDatabase();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 hover:bg-[var(--surface-hover)] text-rose-400 cursor-pointer"
                    >
                      <span>Reset Database</span>
                    </button>
                  )}
                  {onDeleteDataset && activeDataset && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreMenuOpen(false);
                        if (
                          window.confirm(
                            `Are you sure you want to delete dataset "${activeDataset.name}"?`,
                          )
                        ) {
                          onDeleteDataset(activeDataset.id);
                        }
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 hover:bg-[var(--surface-hover)] text-rose-400 cursor-pointer"
                    >
                      <span>Delete Dataset</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <DatasetDropdown
            datasets={datasets}
            selectedDatasetId={selectedDatasetId}
            onChange={onDatasetChange}
            onOpenCreateModal={onOpenCreateModal}
            onOpenImportModal={onOpenImportModal}
            onEditDataset={onEditDataset}
            onDeleteDataset={onDeleteDataset}
          />
        </div>

        {/* 1. Voice and Natural Language Query Section */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <h2
              className="font-bold flex items-center gap-1.5 text-sm"
              style={{ color: "var(--foreground)" }}
            >
              <span>1. Ask by Voice or Natural Language</span>
            </h2>
            {isListening && (
              <span className="flex items-center gap-1 text-xs text-red-500 font-medium animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Recording
              </span>
            )}
          </div>

          {/* Dedicated Direct Voice Button & Controls */}
          <VoiceButton
            isListening={isListening}
            isSupported={isSupported}
            onStartListening={handleStartVoice}
            onStopListening={stopListening}
            transcript={transcript}
            interimTranscript={interimTranscript}
            audioLevel={audioLevel}
            error={speechError}
            autoExecute={autoExecute}
            onToggleAutoExecute={setAutoExecute}
            voiceFeedback={voiceFeedback}
            onToggleVoiceFeedback={onToggleVoiceFeedback}
            isTranslating={isTranslatingVoice}
            isTextTranslating={isTranslatingText}
          />

          {/* Natural Language Textarea */}
          <div className="relative">
            <textarea
              value={nlInput}
              onChange={(event) => onNlInputChange(event.target.value)}
              placeholder='Speak via mic above or type (e.g. "Loop through customers in Mumbai and log their names")'
              rows={3}
              className="w-full p-2.5 pr-8 text-sm resize-y rounded-lg border focus:outline-none"
              style={{
                background: "var(--panel)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
              aria-label="Natural language input"
            />
          </div>

          <button
            type="button"
            onClick={onTranslate}
            disabled={!nlInput.trim() || isTranslatingText}
            className="w-full py-2 h-8.5 rounded-lg text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-1.5 transition-opacity cursor-pointer shadow-xs"
            style={{
              background: "var(--accent-gradient, var(--accent))",
              color: "var(--accent-foreground)",
            }}
          >
            {isTranslatingText ? (
              <span>Translating to PL/SQL...</span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span className="text-sm font-semibold">Translate &amp; Run</span>
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </span>
            )}
          </button>

          {/* Translation results & interpretation */}
          {nlInfo && (
            <div
              className="mt-1 text-xs space-y-1 p-2.5 rounded-lg border"
              style={{
                background: "var(--surface-subtle)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="font-semibold"
                  style={{ color: "var(--foreground)" }}
                >
                  Confidence:{" "}
                  <span
                    className="font-mono font-bold"
                    style={{ color: "var(--accent)" }}
                  >
                    {(nlInfo.confidence * 100).toFixed(0)}%
                  </span>
                </span>
                <button
                  type="button"
                  onClick={handleReadInterpretation}
                  title="Read interpretation aloud"
                  className="flex items-center gap-1 text-xs hover:underline cursor-pointer"
                  style={{ color: "var(--muted)" }}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                  </svg>
                  <span>Read aloud</span>
                </button>
              </div>
              <p
                className="opacity-90 leading-relaxed"
                style={{ color: "var(--foreground)" }}
              >
                {nlInfo.interpretation}
              </p>
            </div>
          )}
        </div>

        {/* 2. Or write PL/SQL directly */}
        <div>
          <h2
            className="font-bold mb-2 text-sm"
            style={{ color: "var(--foreground)" }}
          >
            2. Or write PL/SQL directly
          </h2>
          <textarea
            value={plsql}
            onChange={(event) => onPlSqlChange(event.target.value)}
            onKeyDown={(event) => {
              if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                event.preventDefault();
                onRunScript();
              }
            }}
            rows={5}
            spellCheck={false}
            className="w-full p-2.5 text-sm font-mono resize-y rounded-lg border focus:outline-none transition-colors"
            style={{
              background: "var(--surface-subtle)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
            aria-label="PL/SQL script"
          />

          <button
            type="button"
            onClick={onRunScript}
            className="mt-2 w-full py-2 rounded-lg text-sm font-semibold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:opacity-90"
            style={{
              background: "var(--surface-subtle)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          >
            <span>Execute PL/SQL</span>
          </button>
          {error && (
            <p role="alert" className="mt-2 text-xs text-red-500 font-mono">
              {error}
            </p>
          )}
        </div>

        {/* 3. Sample Inputs (PL/SQL Templates) */}
        <div>
          <h2
            className="font-bold mb-2.5 text-sm"
            style={{ color: "var(--foreground)" }}
          >
            Sample Inputs
          </h2>
          <ul className="space-y-2.5">
            {examples.map((example) => (
              <li key={example.id}>
                <button
                  type="button"
                  onClick={() => {
                    onExampleSelect(example.question, example.sql);
                  }}
                  className="w-full text-left text-sm p-3 rounded-xl border transition-all cursor-pointer hover:border-[var(--accent)] hover:bg-[var(--surface-hover)] font-medium leading-snug flex items-start"
                  style={{
                    background: "var(--panel)",
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                  }}
                  title={`Expected: ${example.expected}`}
                >
                  <span className="opacity-60 font-mono text-xs mr-2 shrink-0 mt-0.5">
                    {example.id}.
                  </span>
                  <span>{example.question}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* 4. History */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2
              className="font-bold text-sm"
              style={{ color: "var(--foreground)" }}
            >
              History
            </h2>
            <button
              type="button"
              onClick={() => {
                const validItems = history.filter(
                  (item) => item && (item.question?.trim() || item.sql?.trim()),
                );
                if (validItems.length === 0) return;
                const last5 = validItems.slice(0, 5);
                let md = `# PL/SQL Execution History (Last ${last5.length} Scripts)\n\n`;
                md += `**Exported:** ${new Date().toLocaleString()}\n`;
                md += `**Dataset:** ${activeDataset?.name || "Active Dataset"}\n\n`;
                md += `---\n\n`;

                last5.forEach((item, index) => {
                  md += `### Script ${index + 1}\n`;
                  md += `- **Timestamp:** ${item.time || "N/A"}\n`;
                  if (item.question && item.question !== item.sql) {
                    md += `- **Natural Language Input:** ${item.question}\n`;
                  }
                  md += `- **Executed PL/SQL:**\n\`\`\`sql\n${item.sql}\n\`\`\`\n`;
                  md += `- **Result Row Count:** ${item.rows != null ? item.rows : 0} rows\n\n`;
                  md += `---\n\n`;
                });

                const blob = new Blob([md], {
                  type: "text/markdown;charset=utf-8",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `plsql-history-last-${last5.length}.md`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              disabled={
                history.filter(
                  (item) => item && (item.question?.trim() || item.sql?.trim()),
                ).length === 0
              }
              title="Download PL/SQL History"
              className="p-1 px-1.5 rounded-md border text-xs flex items-center gap-1 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 cursor-pointer"
              style={{
                background: "var(--surface-subtle)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
              aria-label="Download PL/SQL History"
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </button>
          </div>
          {history.filter(
            (item) => item && (item.question?.trim() || item.sql?.trim()),
          ).length === 0 ? (
            <p className="text-xs opacity-60" style={{ color: "var(--muted)" }}>
              No PL/SQL execution history recorded yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {history
                .filter(
                  (item) => item && (item.question?.trim() || item.sql?.trim()),
                )
                .slice(0, 5)
                .map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onSelectHistory(item)}
                      className="w-full text-left p-3 rounded-xl border transition-all cursor-pointer hover:border-[var(--accent)] hover:bg-[var(--surface-hover)] shadow-xs"
                      style={{
                        background: "var(--panel)",
                        borderColor: "var(--border)",
                        color: "var(--foreground)",
                      }}
                    >
                      <div className="flex items-center justify-between text-xs font-mono opacity-80 mb-1">
                        <span style={{ color: "var(--muted)" }}>
                          {item.time} &middot; {item.rows} row
                          {item.rows !== 1 ? "s" : ""}
                        </span>
                        <span
                          className="text-[11px] px-1.5 py-0.5 rounded font-bold uppercase border"
                          style={{
                            background: "var(--surface-subtle)",
                            borderColor: "var(--border)",
                            color: "var(--accent)",
                          }}
                        >
                          PL/SQL
                        </span>
                      </div>
                      <span className="font-semibold text-xs block text-[var(--foreground)] leading-snug line-clamp-2">
                        {item.question?.trim() || item.sql}
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
