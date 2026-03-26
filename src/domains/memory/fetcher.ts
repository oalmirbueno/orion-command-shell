// Memory Domain — Fetchers (real-first + fallback-safe)
//
// Shape canônico: MemoryItem (dados brutos do OpenClaw)
// Shape de UI: MemoryPageData (derivado via transform)

import { createRealFirstFetcher } from "../createRealFirstFetcher";
import type {
  MemoryItem, MemorySnapshot, MemoryPageData, MemorySummaryData, MemoryCategory,
} from "./types";
import type { DomainFetcher, DomainResult } from "../types";

// ═══════════════════════════════════════════════════════
// Transforms — canônico → view
// ═══════════════════════════════════════════════════════

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  return `${Math.round(hrs / 24)}d atrás`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function formatBytes(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} KB`;
  return `${bytes} B`;
}

function deriveRelevance(item: MemoryItem): "high" | "medium" | "low" {
  if (item.score !== null) {
    if (item.score >= 0.8) return "high";
    if (item.score >= 0.4) return "medium";
    return "low";
  }
  if (item.kind === "decision" || item.kind === "incident") return "high";
  if (item.kind === "context" || item.kind === "learning") return "medium";
  return "low";
}

function toMemorySnapshot(item: MemoryItem): MemorySnapshot {
  const firstLine = item.content.split("\n")[0] || item.summary || item.id;
  return {
    id: item.id,
    title: item.summary || firstLine.slice(0, 80),
    category: item.kind as MemoryCategory,
    summary: item.summary || firstLine,
    context: item.content.length > 200 ? item.content.slice(0, 200) + "…" : item.content,
    capturedAt: formatTime(item.createdAt),
    capturedAgo: formatTimeAgo(item.createdAt),
    source: item.source,
    tags: item.tags,
    relevance: deriveRelevance(item),
  };
}

function buildSummary(snapshots: MemorySnapshot[], rawItems: MemoryItem[]): MemorySummaryData {
  const totalBytes = rawItems.reduce((sum, i) => sum + i.sizeBytes, 0);
  const categories = new Set(snapshots.map(s => s.category)).size;
  const lastCapture = rawItems.length > 0
    ? rawItems.reduce((latest, i) => i.createdAt > latest ? i.createdAt : latest, rawItems[0].createdAt)
    : null;

  return {
    totalSnapshots: snapshots.length,
    totalCategories: categories,
    lastCapture: lastCapture ? formatTimeAgo(lastCapture) : "—",
    totalSize: rawItems.length > 0 ? formatBytes(totalBytes) : "—",
  };
}

// ═══════════════════════════════════════════════════════
// Fetchers
// ═══════════════════════════════════════════════════════

const EMPTY_MEMORY_PAGE: MemoryPageData = {
  snapshots: [],
  summary: { totalSnapshots: 0, totalCategories: 0, lastCapture: "—", totalSize: "—" },
};

export const fetchMemoryPage: DomainFetcher<MemoryPageData> = async (): Promise<DomainResult<MemoryPageData>> => {
  const baseFetcher = createRealFirstFetcher<MemoryItem[], MemoryItem[]>({
    endpoint: "/memory/search",
    fallbackData: [],
  });

  const result = await baseFetcher();

  if (result.data.length === 0) {
    return { data: EMPTY_MEMORY_PAGE, source: result.source, timestamp: result.timestamp };
  }

  const snapshots = result.data.map(toMemorySnapshot);
  return {
    data: { snapshots, summary: buildSummary(snapshots, result.data) },
    source: result.source,
    timestamp: result.timestamp,
  };
};

export const fetchMemorySnapshots: DomainFetcher<MemorySnapshot[]> = async (): Promise<DomainResult<MemorySnapshot[]>> => {
  const baseFetcher = createRealFirstFetcher<MemoryItem[], MemoryItem[]>({
    endpoint: "/memory/snapshots",
    fallbackData: [],
  });

  const result = await baseFetcher();
  return {
    data: result.data.map(toMemorySnapshot),
    source: result.source,
    timestamp: result.timestamp,
  };
};
