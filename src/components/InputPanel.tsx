"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { InputPanelProps } from "./nlSqlTypes";
import { DatasetDropdown } from "./DatasetDropdown";
import { VoiceButton } from "./VoiceButton";
import {
  useVoiceRecognition,
  speakText,
  type VoiceAudioResult,
} from "@/lib/useSpeechRecognition";
import { analyzeSQL, type SQLAssistantResult } from "@/lib/sqlAssistant";

export function InputPanel({
  datasets,
  selectedDatasetId,
  activeSchema = [],
  minPanelHeight,
  maxPanelHeight,
  panelHeight,
  onDatasetChange,
  examples,
  nlInput,
  onNlInputChange,
  onTranslate,
  nlInfo,
  sql,
  onSqlChange,
  onRunQuery,
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
  onOpenGuide,
}: InputPanelProps) {
  const [autoExecute, setAutoExecute] = useState(true);

  // Real-time debounced SQL Assistant & Debugger while typing
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPos, setCursorPos] = useState<number | undefined>(undefined);
  const [assistantResult, setAssistantResult] = useState<SQLAssistantResult>({
    severity: "valid",
    title: "",
    suggestions: [],
  });

  useEffect(() => {
    if (!sql.trim()) {
      setAssistantResult({ severity: "valid", title: "", suggestions: [] });
      return;
    }
    const timer = setTimeout(() => {
      const res = analyzeSQL(sql, activeSchema || []);
      setAssistantResult(res);
    }, 200);
    return () => clearTimeout(timer);
  }, [sql, activeSchema]);

  const handleApplySuggestion = (
    textToInsert: string,
    range?: [number, number],
  ) => {
    let newSql = sql;
    let nextCursor = sql.length;

    if (range && range[0] >= 0 && range[1] >= range[0]) {
      newSql = sql.slice(0, range[0]) + textToInsert + sql.slice(range[1]);
      nextCursor = range[0] + textToInsert.length;
    } else {
      const pos =
        cursorPos ?? textareaRef.current?.selectionStart ?? sql.length;
      const beforeChar = pos > 0 ? sql[pos - 1] : "";
      const needsLeadingSpace =
        beforeChar &&
        !/\s/.test(beforeChar) &&
        !textToInsert.startsWith(" ") &&
        !textToInsert.startsWith(",") &&
        !textToInsert.startsWith(")");
      const insertStr = (needsLeadingSpace ? " " : "") + textToInsert;
      newSql = sql.slice(0, pos) + insertStr + sql.slice(pos);
      nextCursor = pos + insertStr.length;
    }

    onSqlChange(newSql);
    setCursorPos(nextCursor);

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(nextCursor, nextCursor);
      }
    });
  };

  // Handle completion of audio recording / speech
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

  const [isCompressed, setIsCompressed] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const cardHeaderRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardHeaderRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setIsCompressed(entry.contentRect.width < 340);
      }
    });
    observer.observe(cardHeaderRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!moreMenuRef.current?.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const activeDataset =
    datasets.find((d) => d.id === selectedDatasetId) ?? datasets[0];

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
      aria-label="Input panel"
    >
      {/* Scrollable Main Area */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto scrollbar-thin space-y-4 pr-1">
        <div ref={cardHeaderRef} className="p-3 rounded-lg">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <label
              htmlFor="dataset"
              className="text-xs font-bold uppercase tracking-wider whitespace-nowrap shrink-0 block"
              style={{ color: "var(--muted)" }}
            >
              Choose a dataset
            </label>

            {/* 3-Dots Button on Reduced Width / Compression */}
            <div
              className="flex items-center gap-1.5 shrink-0 relative"
              ref={moreMenuRef}
            >
              {!isCompressed ? (
                <div className="flex items-center gap-1.5">
                  {onEditDataset && activeDataset && (
                    <button
                      type="button"
                      onClick={() => onEditDataset(activeDataset)}
                      title="Edit currently selected dataset"
                      className="h-6.5 px-2 text-xs rounded-md border border-purple-500/40 text-purple-400 hover:bg-purple-500/10 transition-colors font-semibold cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap"
                    >
                      <svg
                        className="w-3 h-3 opacity-80 shrink-0"
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
                      <span>Edit</span>
                    </button>
                  )}
                  {onOpenCreateModal && (
                    <button
                      type="button"
                      onClick={onOpenCreateModal}
                      title="Create a new custom dataset with tables"
                      className="h-6.5 px-2 text-xs rounded-md border border-blue-500/40 text-blue-400 hover:bg-blue-500/10 transition-colors font-semibold cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap"
                    >
                      + New
                    </button>
                  )}
                  {onResetDatabase && (
                    <button
                      type="button"
                      onClick={onResetDatabase}
                      title="Reset database tables and data to defaults"
                      className="h-6.5 px-2 text-xs rounded-md border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 transition-colors font-semibold cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap"
                    >
                      Reset DB
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsMoreMenuOpen((prev) => !prev)}
                  title="Click for more options"
                  aria-label="Click for more options"
                  className="h-7 px-2 rounded-md  text-zinc-300 hover:bg-zinc-500/10 flex items-center justify-center transition-colors cursor-pointer text-xs font-medium"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                  </svg>
                </button>
              )}

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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
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
                      <span className="font-bold text-sm">+</span>
                      <span>New Dataset</span>
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
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                      </svg>
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
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
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

          {/* Dedicated Direct Voice-to-SQL Button & Controls */}
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

          {/* Natural Language Textarea with Inline Dictation Mic */}
          <div className="relative">
            <textarea
              value={nlInput}
              onChange={(event) => onNlInputChange(event.target.value)}
              placeholder='Speak via mic above or type (e.g. "How many customers are there?")'
              rows={3}
              className="w-full p-2.5 pr-8 text-sm resize-y rounded-lg border focus:outline-none"
              style={{
                background: "var(--panel)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
              aria-label="Natural language input"
            />
            {/* {isSupported && (
              <button
                type="button"
                onClick={isListening ? stopListening : handleStartVoice}
                title={isListening ? "Stop listening" : "Dictate via microphone"}
                className="absolute right-2 top-2.5 p-1 rounded-md transition-colors"
                style={{
                  color: isListening ? "#ef4444" : "var(--muted)",
                  background: isListening ? "rgba(239, 68, 68, 0.15)" : "transparent",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
                  <path d="M5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-1.5v-1.546A6.001 6.001 0 0016 10v-.357a.75.75 0 00-1.5 0V10a4.5 4.5 0 01-9 0v-.357z" />
                </svg>
              </button>
            )} */}
          </div>

          <button
            onClick={onTranslate}
            disabled={!nlInput.trim() || isTranslatingText}
            className="w-full py-2 h-8.5 rounded-lg text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-1.5 transition-opacity cursor-pointer shadow-xs"
            style={{
              background: "var(--accent-gradient, var(--accent))",
              color: "var(--accent-foreground)",
            }}
          >
            {isTranslatingText ? (
              <>
                <span>Translating to SQL...</span>
              </>
            ) : (
              <span className="flex items-center gap-1.5">
                <span className="text-sm font-semibold">
                  Translate &amp; Run
                </span>
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
              <p
                className="font-mono opacity-70 text-xs"
                style={{ color: "var(--muted)" }}
              >
                Generated by Gemini 2.5 Flash
              </p>
            </div>
          )}
        </div>

        {/* 2. Direct SQL Query Section */}
        <div>
          <h2
            className="font-bold mb-2 text-sm"
            style={{ color: "var(--foreground)" }}
          >
            2. Or write SQL directly
          </h2>
          <textarea
            ref={textareaRef}
            value={sql}
            onChange={(event) => {
              onSqlChange(event.target.value);
              setCursorPos(event.target.selectionStart);
            }}
            onClick={(event) =>
              setCursorPos(event.currentTarget.selectionStart)
            }
            onKeyUp={(event) =>
              setCursorPos(event.currentTarget.selectionStart)
            }
            onSelect={(event) =>
              setCursorPos(event.currentTarget.selectionStart)
            }
            rows={4}
            spellCheck={false}
            className="w-full p-2.5 text-sm font-mono resize-y rounded-lg border focus:outline-none transition-colors"
            style={{
              background: "var(--surface-subtle)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
            aria-label="SQL query"
          />

          {/* Real-time SQL Assistant & Debugger Panel */}
          {(assistantResult.title || Boolean(error)) && (
            <div
              className="mt-2 p-2.5 rounded-lg border text-xs font-mono transition-all space-y-2"
              style={{
                background: "var(--surface-subtle)",
                borderColor: error
                  ? "rgba(244, 63, 94, 0.4)"
                  : assistantResult.severity === "error"
                    ? "rgba(244, 63, 94, 0.35)"
                    : assistantResult.severity === "warning"
                      ? "rgba(245, 158, 11, 0.35)"
                      : assistantResult.severity === "incomplete"
                        ? "rgba(59, 130, 246, 0.3)"
                        : "rgba(16, 185, 129, 0.3)",
              }}
            >
              {/* Diagnostic Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                  {error || assistantResult.severity === "error" ? (
                    <span className="flex items-center gap-1 text-rose-400 font-semibold shrink-0">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      <span>Error:</span>
                    </span>
                  ) : assistantResult.severity === "warning" ? (
                    <span className="flex items-center gap-1 text-amber-400 font-semibold shrink-0">
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
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <span>Warning:</span>
                    </span>
                  ) : assistantResult.severity === "incomplete" ? (
                    <span className="flex items-center gap-1 text-sky-400 font-medium shrink-0">
                      <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                      <span>Incomplete:</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold shrink-0">
                      <svg
                        className="w-3.5 h-3.5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>Valid SQL</span>
                    </span>
                  )}

                  <span style={{ color: "var(--foreground)" }}>
                    {error || assistantResult.what || assistantResult.title}
                  </span>
                </div>

                {/* Quick Fix Button (if available) */}
                {assistantResult.quickFix && !error && (
                  <button
                    type="button"
                    onClick={() =>
                      handleApplySuggestion(
                        assistantResult.quickFix!.replacement,
                        assistantResult.quickFix!.range,
                      )
                    }
                    className="shrink-0 px-2 py-0.5 text-[11px] font-semibold rounded bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                    title={`Apply: ${assistantResult.quickFix.replacement}`}
                  >
                    {assistantResult.quickFix.label}
                  </button>
                )}
              </div>

              {/* Structured Explanation (WHAT, WHERE, SUGGESTION) when problem or suggestion exists */}
              {(assistantResult.where || assistantResult.suggestionText) &&
                !error &&
                assistantResult.severity !== "valid" && (
                  <div
                    className="text-[11px] leading-relaxed pt-1.5 border-t opacity-90 space-y-0.5"
                    style={{
                      borderColor: "var(--border)",
                      color: "var(--muted)",
                    }}
                  >
                    {assistantResult.where && (
                      <div>
                        <span className="font-semibold text-zinc-300">
                          WHERE:
                        </span>{" "}
                        {assistantResult.where}
                      </div>
                    )}
                    {assistantResult.suggestionText && (
                      <div>
                        <span className="font-semibold text-zinc-300">
                          SUGGESTION:
                        </span>{" "}
                        {assistantResult.suggestionText}
                      </div>
                    )}
                  </div>
                )}

              {/* Context-Aware Suggestion Chips */}
              {assistantResult.suggestions.length > 0 && !error && (
                <div
                  className="pt-1.5 border-t space-y-1"
                  style={{ borderColor: "var(--border)" }}
                >
                  {assistantResult.suggestionsTitle && (
                    <div
                      className="text-[10px] font-semibold tracking-wider uppercase opacity-70"
                      style={{ color: "var(--muted)" }}
                    >
                      {assistantResult.suggestionsTitle}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-thin py-0.5">
                    {assistantResult.suggestions.map((sugg, sIdx) => (
                      <button
                        key={`${sugg.category}-${sugg.label}-${sIdx}`}
                        type="button"
                        onClick={() =>
                          handleApplySuggestion(sugg.value, sugg.rangeToReplace)
                        }
                        className="px-2 py-0.5 rounded text-[11px] font-mono border transition-all cursor-pointer hover:border-[var(--accent)] hover:bg-[var(--surface-hover)] hover:scale-105 active:scale-95"
                        style={{
                          background: "var(--panel)",
                          borderColor: "var(--border)",
                          color:
                            sugg.category === "table"
                              ? "var(--accent)"
                              : sugg.category === "column"
                                ? "#38bdf8"
                                : sugg.category === "operator"
                                  ? "#fbbf24"
                                  : sugg.category === "value"
                                    ? "#34d399"
                                    : "var(--foreground)",
                        }}
                        title={
                          sugg.detail
                            ? `${sugg.value} (${sugg.detail})`
                            : `Insert ${sugg.value}`
                        }
                      >
                        <span>{sugg.label}</span>
                        {sugg.detail && (
                          <span className="ml-1 opacity-50 text-[9px] font-sans">
                            ({sugg.detail})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={onRunQuery}
            className="mt-2 w-full py-2 rounded-lg text-sm font-semibold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:opacity-90"
            style={{
              background: "var(--surface-subtle)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          >
            <span>Execute SQL</span>
          </button>
          {error && !assistantResult.title && (
            <p role="alert" className="mt-2 text-xs text-red-500 font-mono">
              {error}
            </p>
          )}
        </div>

        {/* Pic 2: Sample Inputs (Bigger font 1-2 steps + increased space) */}
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

        {/* Pic 6: History (High contrast visibility & skip empty boxes) */}
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
                let md = `# Query History (Last ${last5.length} Queries)\n\n`;
                md += `**Exported:** ${new Date().toLocaleString()}\n`;
                md += `**Dataset:** ${activeDataset?.name || "Active Dataset"}\n\n`;
                md += `---\n\n`;

                last5.forEach((item, index) => {
                  md += `### Query ${index + 1}\n`;
                  md += `- **Timestamp:** ${item.time || "N/A"}\n`;
                  if (item.question && item.question !== item.sql) {
                    md += `- **Natural Language Input:** ${item.question}\n`;
                  }
                  md += `- **Generated / Executed SQL:**\n\`\`\`sql\n${item.sql}\n\`\`\`\n`;
                  md += `- **Statement Type:** ${item.statementType || "DQL"}\n`;
                  if (item.command) md += `- **Command:** ${item.command}\n`;
                  md += `- **Dataset:** ${activeDataset?.name || "Active"}\n`;
                  md += `- **Execution Status:** Success\n`;
                  md += `- **Result Row Count:** ${item.rows != null ? item.rows : 0} rows\n\n`;
                  md += `---\n\n`;
                });

                const blob = new Blob([md], {
                  type: "text/markdown;charset=utf-8",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `query-history-last-${last5.length}.md`;
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
              title={
                history.filter(
                  (item) => item && (item.question?.trim() || item.sql?.trim()),
                ).length === 0
                  ? "No query history available to download"
                  : "Download last 5 query history entries"
              }
              className="p-1 px-1.5 rounded-md border text-xs flex items-center gap-1 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 cursor-pointer"
              style={{
                background: "var(--surface-subtle)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
              aria-label="Download Query History"
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
              {/* <span className="text-xs font-mono font-bold">↓</span> */}
            </button>
          </div>
          {history.filter(
            (item) => item && (item.question?.trim() || item.sql?.trim()),
          ).length === 0 ? (
            <p className="text-xs opacity-60" style={{ color: "var(--muted)" }}>
              No query history recorded yet.
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
                        {item.statementType && (
                          <span
                            className="text-[11px] px-1.5 py-0.5 rounded font-bold uppercase border"
                            style={{
                              background: "var(--surface-subtle)",
                              borderColor: "var(--border)",
                              color: "var(--accent)",
                            }}
                          >
                            {item.statementType}
                          </span>
                        )}
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
