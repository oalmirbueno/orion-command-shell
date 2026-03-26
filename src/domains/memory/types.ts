// Memory Domain — Tipos Canônicos
//
// Shape baseado nas rotas locais do OpenClaw (/api/memory).

// ═══════════════════════════════════════════════════════
// SHAPE CANÔNICO — retornado pelo OpenClaw
// ═══════════════════════════════════════════════════════

export type MemoryKind = "context" | "decision" | "learning" | "profile" | "config" | "incident";

// /api/memory/search — item de memória persistido
export interface MemoryItem {
  id: string;
  kind: MemoryKind;
  content: string;
  summary: string | null;
  source: string;
  agentId: string | null;
  sessionId: string | null;
  tags: string[];
  score: number | null;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
}

// /api/memory/snapshots — snapshot consolidado
export interface MemorySnapshotInfo {
  id: string;
  label: string;
  kind: MemoryKind;
  itemCount: number;
  totalBytes: number;
  capturedAt: string;
}

// ═══════════════════════════════════════════════════════
// SHAPE DE UI (View) — derivado via transform no fetcher
// ═══════════════════════════════════════════════════════

export type MemoryCategory = "context" | "decision" | "learning" | "profile" | "config" | "incident";

export interface MemorySnapshot {
  id: string;
  title: string;
  category: MemoryCategory;
  summary: string;
  context: string;
  capturedAt: string;
  capturedAgo: string;
  source: string;
  tags: string[];
  relevance: "high" | "medium" | "low";
}

export interface MemorySummaryData {
  totalSnapshots: number;
  totalCategories: number;
  lastCapture: string;
  totalSize: string;
}

export interface MemoryPageData {
  snapshots: MemorySnapshot[];
  summary: MemorySummaryData;
}
