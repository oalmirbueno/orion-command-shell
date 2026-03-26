/**
 * Alerts — Contrato de Integração
 *
 * === ENDPOINT ===
 * GET /api/alerts → AlertsPageData
 *
 * {
 *   "alerts": [
 *     {
 *       "id":            "string",
 *       "severity":      "critical" | "warning" | "info" | "resolved",
 *       "title":         "CPU acima de 90%",
 *       "description":   "Servidor principal com carga elevada há 15 min",
 *       "action":        "Verificar processos em execução",
 *       "source":        "monitor-cpu",
 *       "triggeredAt":   "2026-03-26T16:00:00Z",
 *       "triggeredAgo":  "há 30 min",
 *       "resolvedAt?":   "2026-03-26T16:15:00Z",   // opcional
 *       "acknowledged":  false,
 *       "occurrences":   3
 *     }
 *   ],
 *   "summary": {
 *     "critical": 1,
 *     "warning":  3,
 *     "info":     5,
 *     "resolved": 12
 *   }
 * }
 *
 * === ENDPOINT SECUNDÁRIO (widgets Home) ===
 * GET /api/alerts/list → Alert[]
 * (mesmo formato do campo "alerts" acima)
 *
 * === TRANSFORM ===
 * Nenhum necessário se a API seguir o formato acima.
 */

export type { Alert, AlertsPageData, AlertsSummaryData, Severity } from "./types";
