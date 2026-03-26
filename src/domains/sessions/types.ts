/**
 * Sessions Domain — Tipos Canônicos
 *
 * Shape baseado na rota local do OpenClaw (/api/sessions).
 * Este é o formato de referência do projeto-base.
 */

export type SessionType = "classification" | "enrichment" | "sync" | "analysis" | "export" | "routing";
export type PreviewType = "text" | "json" | "markdown" | "code";

/** Shape canônico retornado pelo OpenClaw */
export interface Session {
  id: string;
  key: string;
  type: SessionType;
  typeLabel: string;
  typeEmoji: string;
  updatedAt: string;
  ageMs: number;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  preview: string;
  previewType: PreviewType;
  aborted: boolean;
}

/** Shape derivado para uso na UI — construído via transform */
export interface SessionView {
  id: string;
  key: string;
  title: string;
  type: SessionType;
  typeLabel: string;
  typeEmoji: string;
  agent: string;
  model: string;
  status: SessionStatus;
  progress: number;
  preview: string;
  previewType: PreviewType;
  startedAt: string;
  elapsed: string;
  tokens: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export type SessionStatus = "running" | "paused" | "completed" | "failed";
