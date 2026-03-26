/**
 * Cron — Contrato de Integração
 *
 * === ENDPOINT ===
 * GET /api/cron → CronPageData
 *
 * {
 *   "jobs": [
 *     {
 *       "id":                "string",
 *       "name":              "Sync de leads",
 *       "schedule":          "0 */6 * * *",                  // cron expression
 *       "scheduleHuman":     "A cada 6 horas",               // human-readable
 *       "enabled":           true,
 *       "status":            "healthy" | "failed" | "warning" | "disabled",
 *       "lastRun":           "2026-03-26T12:00:00Z",
 *       "lastRunAgo":        "há 4h",
 *       "lastDuration":      "2m 14s",
 *       "lastResult":        "success" | "failure" | "—",
 *       "nextRun":           "2026-03-26T18:00:00Z",
 *       "nextRunIn":         "em 1h 30min",
 *       "consecutiveSuccess": 12,
 *       "consecutiveFails":   0,
 *       "error?":            "Timeout na conexão"            // opcional
 *     }
 *   ],
 *   "summary": {
 *     "active":   8,
 *     "healthy":  7,
 *     "failed":   1,
 *     "disabled": 2
 *   }
 * }
 *
 * === ENDPOINT SECUNDÁRIO (widgets Home) ===
 * GET /api/cron/jobs → CronJob[]
 *
 * === TRANSFORM ===
 * Nenhum necessário se a API seguir o formato acima.
 */

export type { CronJob, CronPageData, CronSummaryData, JobStatus } from "./types";
