/**
 * Cron Domain — API Contract (Canônico OpenClaw)
 * ================================================
 * Shape de referência baseado na rota local do OpenClaw.
 *
 * === ENDPOINT PRINCIPAL ===
 *
 *   GET /api/cron
 *
 *   Retorna CronJobInfo[] — dados brutos de cada job agendado:
 *
 *   [
 *     {
 *       "id":                    "cron-sync-leads",          // string — ID único
 *       "name":                  "Sync de Leads",            // string — nome de exibição
 *       "description":           "Sincroniza leads do CRM",  // string — descrição do job
 *       "schedule":              "0 */6 * * *",              // string — expressão cron
 *       "enabled":               true,                       // boolean — se está habilitado
 *       "lastRunAt":             "2025-03-26T12:00:00Z",     // string | null — ISO 8601
 *       "lastRunDurationMs":     134200,                     // number | null — duração em ms
 *       "lastRunSuccess":        true,                       // boolean | null
 *       "lastRunError":          null,                       // string | null — mensagem de erro
 *       "nextRunAt":             "2025-03-26T18:00:00Z",     // string | null — ISO 8601
 *       "consecutiveSuccesses":  12,                         // number
 *       "consecutiveFailures":   0,                          // number
 *       "totalRuns":             248,                        // number
 *       "createdAt":             "2025-01-15T10:00:00Z"      // string — ISO 8601
 *     }
 *   ]
 *
 * === ENDPOINT SECUNDÁRIO ===
 *
 *   GET /api/cron/jobs  → CronJobInfo[] (mesmo shape, para widgets Home)
 *   GET /api/cron/runs  → CronRunInfo[] (histórico de execuções)
 *
 * === CAMPOS DERIVADOS (transform no fetcher.ts) ===
 *
 *   O fetcher transforma CronJobInfo[] → CronPageData (view model):
 *
 *   - status:           derivado de enabled + consecutiveFailures + lastRunSuccess
 *   - scheduleHuman:    lookup de expressão cron → label legível
 *   - lastRun:          hora formatada de lastRunAt
 *   - lastRunAgo:       tempo relativo ("4h atrás")
 *   - lastDuration:     formatado de lastRunDurationMs ("2.1s")
 *   - lastResult:       derivado de lastRunSuccess
 *   - nextRun:          hora formatada de nextRunAt
 *   - nextRunIn:        tempo relativo ("em 1h")
 *   - summary:          contagens computadas do array de jobs
 *
 * === ATIVAÇÃO ===
 *
 *   1. Rodar acoplado ao OpenClaw
 *   2. Ou definir VITE_ORION_API_URL como override
 */

export type { CronJobInfo, CronRunInfo, CronJob, CronPageData, CronSummaryData, JobStatus } from "./types";
