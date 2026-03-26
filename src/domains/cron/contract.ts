// Cron Domain — API Contract (Canônico OpenClaw)
// ================================================
// Shape de referência baseado na rota local do OpenClaw.
//
// ENDPOINT PRINCIPAL
//
//   GET /api/cron
//
//   Retorna CronJobInfo[] — dados brutos de cada job agendado:
//
//   [
//     {
//       "id":                    "cron-sync-leads",
//       "name":                  "Sync de Leads",
//       "description":           "Sincroniza leads do CRM",
//       "schedule":              "0 * /6 * * *",  (sem espaço — expressão cron)
//       "enabled":               true,
//       "lastRunAt":             "2025-03-26T12:00:00Z",
//       "lastRunDurationMs":     134200,
//       "lastRunSuccess":        true,
//       "lastRunError":          null,
//       "nextRunAt":             "2025-03-26T18:00:00Z",
//       "consecutiveSuccesses":  12,
//       "consecutiveFailures":   0,
//       "totalRuns":             248,
//       "createdAt":             "2025-01-15T10:00:00Z"
//     }
//   ]
//
// ENDPOINT SECUNDÁRIO
//
//   GET /api/cron/jobs  → CronJobInfo[] (mesmo shape, para widgets Home)
//   GET /api/cron/runs  → CronRunInfo[] (histórico de execuções)
//
// CAMPOS DERIVADOS (transform no fetcher.ts)
//
//   status, scheduleHuman, lastRun, lastRunAgo, lastDuration,
//   lastResult, nextRun, nextRunIn, summary
//
// ATIVAÇÃO
//
//   1. Rodar acoplado ao OpenClaw
//   2. Ou definir VITE_ORION_API_URL como override

export type { CronJobInfo, CronRunInfo, CronJob, CronPageData, CronSummaryData, JobStatus } from "./types";
