import { createRealFirstFetcher } from "../createRealFirstFetcher";
import type { Session, SessionView, SessionStatus } from "./types";
import type { DomainFetcher, DomainResult } from "../types";

/** Deriva status da UI a partir do shape canônico */
function deriveStatus(session: Session): SessionStatus {
  if (session.aborted) return "failed";
  if (session.ageMs < 60_000 && session.totalTokens > 0) return "running";
  if (session.totalTokens === 0) return "paused";
  return "completed";
}

/** Deriva progresso estimado */
function deriveProgress(session: Session): number {
  if (session.aborted) return session.totalTokens > 0 ? 100 : 0;
  if (session.totalTokens === 0) return 0;
  // Heurística: sessions com menos de 1min são "em andamento"
  if (session.ageMs < 60_000) return Math.min(95, Math.round((session.ageMs / 60_000) * 100));
  return 100;
}

/** Formata elapsed legível */
function formatElapsed(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}min`;
  return `${(ms / 3_600_000).toFixed(1)}h`;
}

/** Formata tokens para display */
function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

/** Transforma shape canônico OpenClaw → shape de UI */
function toSessionView(s: Session): SessionView {
  const status = deriveStatus(s);
  return {
    id: s.id,
    key: s.key,
    title: `${s.typeEmoji} ${s.typeLabel} — ${s.key}`,
    type: s.type,
    typeLabel: s.typeLabel,
    typeEmoji: s.typeEmoji,
    agent: s.model,
    model: s.model,
    status,
    progress: deriveProgress(s),
    preview: s.preview,
    previewType: s.previewType,
    startedAt: new Date(s.updatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    elapsed: formatElapsed(s.ageMs),
    tokens: formatTokens(s.totalTokens),
    inputTokens: s.inputTokens,
    outputTokens: s.outputTokens,
    totalTokens: s.totalTokens,
  };
}

export const fetchSessions: DomainFetcher<SessionView[]> = async (): Promise<DomainResult<SessionView[]>> => {
  const baseFetcher = createRealFirstFetcher<Session[], Session[]>({
    endpoint: "/sessions",
    fallbackData: [],
  });

  const result = await baseFetcher();
  return {
    data: result.data.map(toSessionView),
    source: result.source,
    timestamp: result.timestamp,
  };
};
