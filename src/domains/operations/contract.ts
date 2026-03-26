/**
 * Operations — Contrato de Integração
 *
 * Domínio operacional que consolida trabalho em execução, fila e histórico.
 * Agrega sinais de Sessions, Activity, Cron, Agents quando originados
 * como operações coordenadas pelo runtime.
 *
 * === ENDPOINT PRINCIPAL ===
 * GET /api/operations → { operations: OperationInfo[], timeline: TimelineEventInfo[] }
 *
 * OperationInfo (canônico):
 * {
 *   "id":          "string",
 *   "kind":        "task" | "pipeline" | "cron" | "session" | "maintenance",
 *   "title":       "Classificação Batch #4821",
 *   "description": "Processando 8.4k leads" | null,
 *   "status":      "queued" | "running" | "paused" | "done" | "failed",
 *   "priority":    "critical" | "high" | "normal" | "low",
 *   "progress":    67,
 *   "source":      "cron",
 *   "agentId":     "classifier-01" | null,
 *   "sessionId":   null,
 *   "assignee":    "Classifier-01" | null,
 *   "startedAt":   "2026-03-26T16:16:00Z" | null,
 *   "updatedAt":   "2026-03-26T16:30:00Z",
 *   "completedAt": null,
 *   "metadata":    { "batchSize": 8400 } | null
 * }
 *
 * TimelineEventInfo (canônico):
 * {
 *   "id":          "string",
 *   "operationId": "string",
 *   "action":      "started" | "completed" | "failed" | "paused" | "resumed" | "retried" | "queued",
 *   "agent":       "Classifier-01" | null,
 *   "detail":      "Iniciou processamento do batch" | null,
 *   "createdAt":   "2026-03-26T16:30:00Z"
 * }
 *
 * === ENDPOINTS GRANULARES ===
 * GET /api/operations/tasks    → OperationInfo[]   (apenas operações)
 * GET /api/operations/timeline → TimelineEventInfo[] (apenas eventos)
 * GET /api/operations/live     → OperationInfo[]   (filtro: running | paused)
 *
 * === TRANSFORM ===
 * O fetcher converte OperationInfo → OperationTask (view) e
 * TimelineEventInfo → TimelineEvent (view) com campos derivados
 * como elapsed, timeAgo, agent display name.
 */

export type { OperationInfo, TimelineEventInfo, OperationTask, TimelineEvent, Operation } from "./types";
export type { OperationsPageData } from "./types.page";
