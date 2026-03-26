/**
 * Sessions Domain — Fetchers (real-first + fallback-safe)
 *
 * Real API shape: { sessions: Session[] }
 * The API wraps sessions in an object, so we unwrap it.
 */

import { createRealFirstFetcher } from "../createRealFirstFetcher";
import type { Session, SessionView, SessionStatus } from "./types";
import type { DomainFetcher, DomainResult } from "../types";

/** Derives UI status from canonical shape */
function deriveStatus(session: Session): SessionStatus {
  if (session.aborted) return "failed";
  if (session.ageMs < 60_000 && session.totalTokens > 0) return "running";
  if (session.totalTokens === 0) return "paused";
  return "completed";
}

function deriveProgress(session: Session): number {
  if (session.aborted) return session.totalTokens > 0 ? 100 : 0;
  if (session.totalTokens === 0) return 0;
  if (session.ageMs < 60_000) return Math.min(95, Math.round((session.ageMs / 60_000) * 100));
  return 100;
}

function formatElapsed(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}min`;
  return `${(ms / 3_600_000).toFixed(1)}h`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function toSessionView(s: Session): SessionView {
  const status = deriveStatus(s);
  const updatedAtMs = typeof s.updatedAt === "number" ? s.updatedAt : new Date(s.updatedAt).getTime();
  return {
    id: s.id,
    key: s.key,
    title: `${s.typeEmoji || "💬"} ${s.typeLabel || s.type} — ${s.key}`,
    type: s.type,
    typeLabel: s.typeLabel || s.type,
    typeEmoji: s.typeEmoji || "💬",
    agent: s.model || "—",
    model: s.model || "—",
    status,
    progress: deriveProgress(s),
    preview: s.preview || null,
    previewType: s.previewType || null,
    startedAt: new Date(updatedAtMs).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    elapsed: formatElapsed(s.ageMs),
    tokens: formatTokens(s.totalTokens),
    inputTokens: s.inputTokens,
    outputTokens: s.outputTokens,
    totalTokens: s.totalTokens,
  };
}

/** Real API returns { sessions: Session[] } — unwrap */
interface SessionsApiResponse {
  sessions: Session[];
}

export const fetchSessions: DomainFetcher<SessionView[]> = async (): Promise<DomainResult<SessionView[]>> => {
  const baseFetcher = createRealFirstFetcher<SessionsApiResponse | Session[], Session[]>({
    endpoint: "/sessions",
    fallbackData: [],
    transform: (raw) => {
      // Handle both { sessions: [...] } and direct array
      if (Array.isArray(raw)) return raw;
      if (raw && typeof raw === "object" && "sessions" in raw) return raw.sessions;
      return [];
    },
  });

  const result = await baseFetcher();
  return {
    data: result.data.map(toSessionView),
    source: result.source,
    timestamp: result.timestamp,
  };
};
