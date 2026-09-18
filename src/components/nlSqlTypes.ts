import type { Dataset, DatasetExample, Table } from "@/lib/schema";
import type {
  PipelineStep,
  Row,
  StatementType,
  SQLCommand,
  QueryResult,
} from "@/lib/sqlEngine";

export interface NLResult {
  sql: string;
  confidence: number;
  interpretation: string;
}

export interface HistoryItem {
  id: number;
  question: string;
  sql: string;
  rows: number;
  time: string;
  statementType?: StatementType;
  command?: SQLCommand;
}

export type Tab = "result" | "schema" | "explanation" | "theory";

export type ThemeId = "slate" | "pearl"; /* | "eclipse" | "lazuli" | "volt" */

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  subtitle: string;
  isDark: boolean;
  isDefault?: boolean;
  swatches: string[];
}

export const THEME_CONFIGS: ThemeConfig[] = [
  {
    id: "slate",
    name: "1. Slate",
    subtitle: "Monochrome zinc & obsidian",
    isDark: true,
    isDefault: true,
    swatches: ["#09090b", "#18181b", "#ffffff", "#a1a1aa"],
  },
  {
    id: "pearl",
    name: "2. Pearl",
    subtitle: "Crisp white & royal indigo",
    isDark: false,
    swatches: ["#f8fafc", "#ffffff", "#4f46e5", "#0f172a"],
  },
  /*
  {
    id: "eclipse",
    name: "3. Eclipse",
    subtitle: "Vivid purple & multi-color",
    isDark: true,
    swatches: ["#09090b", "#7c3aed", "#0ea5e9", "#10b981"],
  },
  {
    id: "lazuli",
    name: "4. Lazuli",
    subtitle: "Midnight navy & electric blue",
    isDark: true,
    swatches: ["#0b1120", "#111a2e", "#3b82f6", "#e2e8f0"],
  },
  {
    id: "volt",
    name: "5. Volt",
    subtitle: "High contrast black & yellow",
    isDark: true,
    swatches: ["#000000", "#ffff00", "#00ff66", "#ff3333"],
  },
  */
];

export interface InputPanelProps {
  datasets: Dataset[];
  selectedDatasetId: string;
  activeSchema?: Table[];
  minPanelHeight?: number | string;
  maxPanelHeight?: number;
  panelHeight?: number | string;
  onDatasetChange: (id: string) => void;
  examples: DatasetExample[];
  nlInput: string;
  onNlInputChange: (value: string) => void;
  onTranslate: () => void;
  nlInfo: NLResult | null;
  sql: string;
  onSqlChange: (value: string) => void;
  onRunQuery: () => void;
  onExampleSelect: (question: string, sql: string) => void;
  onResetDatabase: () => void;
  error?: string;
  lastResult?: QueryResult | null;
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

export interface VisualizationPanelProps {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  steps: PipelineStep[];
  activeStep: number;
  current?: PipelineStep;
  playing: boolean;
  onPlay: () => void;
  onStepChange: (index: number) => void;
  finalRows: Row[];
  columns: string[];
  onExportCSV: () => void;
  onExportReport: () => void;
  sql: string;
  dotSource: string;
  schema: Table[];
  dark: boolean;
  theme?: ThemeId;
  lastResult?: QueryResult | null;
  onResetDatabase?: () => void;
}
