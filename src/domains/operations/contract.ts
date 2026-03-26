/**
 * Operations — Contrato de Integração
 *
 * === ENDPOINT ===
 * GET /api/operations → OperationsPageData
 *
 * {
 *   "tasks": [
 *     {
 *       "id":          "string",
 *       "title":       "Classificação Batch #4821",
 *       "agent":       "Classifier-01",
 *       "status":      "queued" | "running" | "paused" | "done" | "failed",
 *       "priority":    "critical" | "high" | "normal" | "low",
 *       "progress":    67,                                    // 0-100
 *       "elapsed":     "14min",
 *       "updatedAt":   "2026-03-26T16:30:00Z",
 *       "description": "Processando 8.4k leads"
 *     }
 *   ],
 *   "timeline": [
 *     {
 *       "id":        "string",
 *       "time":      "16:30",
 *       "timeAgo":   "há 5 min",
 *       "action":    "started" | "completed" | "failed" | "paused" | "resumed" | "retried" | "queued",
 *       "taskTitle": "Classificação Batch #4821",
 *       "agent":     "Classifier-01",
 *       "detail":    "Iniciou processamento do batch"
 *     }
 *   ],
 *   "liveOps": [
 *     {
 *       "id":       "string",
 *       "name":     "Classificação Batch #4821",
 *       "agent":    "Classifier-01",
 *       "status":   "running" | "paused",
 *       "progress": 67,
 *       "elapsed":  "14min",
 *       "priority": "high" | "normal"
 *     }
 *   ]
 * }
 *
 * === ENDPOINTS SECUNDÁRIOS ===
 * GET /api/operations/tasks    → OperationTask[]
 * GET /api/operations/timeline → TimelineEvent[]
 * GET /api/operations/live     → Operation[]
 *
 * === TRANSFORM ===
 * Nenhum necessário se a API seguir o formato acima.
 */

export type { OperationTask, TimelineEvent, Operation } from "./types";
export type { OperationsPageData } from "./types.page";
