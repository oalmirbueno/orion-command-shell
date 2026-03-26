/**
 * Agents — Contrato de Integração
 *
 * === ENDPOINTS ===
 *
 * GET /api/agents → Agent[]
 * [
 *   {
 *     "id":                "string",                          // unique ID
 *     "name":              "Classifier-01",                   // display name
 *     "role":              "Classificador de leads",          // role description
 *     "tier":              "orchestrator" | "core" | "support",
 *     "model":             "GPT-4o",                          // model identifier
 *     "status":            "active" | "idle" | "offline",
 *     "sessions":          3,                                 // active session count
 *     "lastActivity":      "2026-03-26T16:30:00Z",           // ISO or display string
 *     "lastActivityLabel": "há 5 min",                       // human-readable
 *     "load":              67,                                // 0-100
 *     "tokensToday":       "42k",                             // display format
 *     "availability":      "99.2%",                           // display format
 *     "currentTask":       "Classificando batch #4821",       // current task description
 *     "currentTaskAge":    "14min",                           // elapsed
 *     "dependsOn":         ["Orchestrator"],                  // agent names
 *     "feeds":             ["Enricher-01"],                   // agent names
 *     "alertCount":        0                                  // active alerts
 *   }
 * ]
 *
 * GET /api/agents/tree → AgentNode[]
 * [
 *   {
 *     "name":   "Orchestrator",
 *     "role":   "Orquestrador principal",
 *     "tier":   "orchestrator" | "core" | "support",
 *     "status": "active" | "idle" | "offline",
 *     "load":   45
 *   }
 * ]
 *
 * === TRANSFORM ===
 * Nenhum necessário se a API seguir o formato acima.
 */

export type { Agent, AgentNode, AgentStatus, AgentTier } from "./types";
