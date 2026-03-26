// Memory Domain — Fetchers (real-first + fallback-safe)
//
// Real API /memory/snapshots returns: { items: [{ id, memory_type, title, content, priority, created_at }] }
// Transform maps to MemoryItem canonical shape.

import { createRealFirstFetcher } from "../createRealFirstFetcher";
import type {
  MemoryItem, MemorySnapshot, MemoryPageData, MemorySummaryData, MemoryCategory,
} from "./types";
import type { DomainFetcher, DomainResult } from "../types";

// ═══════════════════════════════════════════════════════
// Real API shape
// ═══════════════════════════════════════════════════════

interface RealMemoryItem {
  id: number | string;
  memory_type?: string;
  title?: string;
  content?: string;
  priority?: string;
  created_at?: string;
}

interface MemorySnapshotsResponse {
  items: RealMemoryItem[];
}

function memoryTypeToKind(memType: string): MemoryCategory {
  const map: Record<string, MemoryCategory> = {
    "daily-note": "context",
    "memory-file": "context",
    "decision": "decision",
    "learning": "learning",
    "profile": "profile",
    "config": "config",
    "incident": "incident",
  };
  return map[memType] || "context";
}

function priorityToRelevance(priority: string): "high" | "medium" | "low" {
  if (priority === "high" || priority === "critical") return "high";
  if (priority === "normal" || priority === "medium") return "medium";
  return "low";
}

function realToMemoryItem(raw: RealMemoryItem): MemoryItem {
  return {
    id: String(raw.id),
    kind: memoryTypeToKind(raw.memory_type || "context"),
    content: raw.content || "",
    summary: raw.title || null,
    source: raw.memory_type || "memory",
    agentId: null,
    sessionId: null,
    tags: [],
    score: null,
    sizeBytes: (raw.content || "").length,
    createdAt: raw.created_at || new Date().toISOString(),
    updatedAt: raw.created_at || new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════
// Transforms — canonical → view
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
  const baseFetcher = createRealFirstFetcher<MemorySnapshotsResponse | MemoryItem[], MemoryItem[]>({
    endpoint: "/memory/snapshots",
    fallbackData: [],
    transform: (raw) => {
      // Handle { items: [...] } wrapper
      if (raw && typeof raw === "object" && !Array.isArray(raw) && "items" in raw) {
        return (raw as MemorySnapshotsResponse).items.map(realToMemoryItem);
      }
      if (Array.isArray(raw)) return raw as MemoryItem[];
      return [];
    },
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
  const result = await fetchMemoryPage();
  return { data: result.data.snapshots, source: result.source, timestamp: result.timestamp };
};
