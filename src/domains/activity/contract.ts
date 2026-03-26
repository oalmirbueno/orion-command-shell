/**
 * Activity — Contrato de Integração
 *
 * === ENDPOINT ===
 * GET /api/activity → ActivityPageData
 *
 * {
 *   "events": [
 *     {
 *       "id":          "string",
 *       "time":        "16:30",                               // display time
 *       "timeAgo":     "há 5 min",
 *       "priority":    "critical" | "warning" | "success" | "info" | "neutral",
 *       "category":    "agent" | "system" | "pipeline" | "security" | "session" | "deploy",
 *       "title":       "Classificador reiniciado",
 *       "description": "Reinício automático após timeout",
 *       "source":      "Classifier-01"
 *     }
 *   ],
 *   "summary": {
 *     "total":    42,
 *     "critical": 2,
 *     "warning":  5,
 *     "resolved": 35
 *   }
 * }
 *
 * === ENDPOINTS SECUNDÁRIOS (widgets Home) ===
 *
 * GET /api/activity/events   → ActivityEvent[]
 * GET /api/activity/briefing → BriefingItem[]
 *   [ { "time": "09:00", "content": "Deploy v2.4 concluído", "source": "deploy-bot" } ]
 *
 * GET /api/activity/attention → AttentionItem[]
 *   [ { "id": "string", "priority": "critical" | "warning" | "info", "title": "string", "context": "string", "timestamp": "string" } ]
 *
 * === TRANSFORM ===
 * Nenhum necessário se a API seguir o formato acima.
 */

export type { ActivityEvent, ActivityPageData, BriefingItem, AttentionItem } from "./types";
