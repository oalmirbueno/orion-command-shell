/**
 * Agents Domain — API Contract (Canônico OpenClaw)
 * =================================================
 * Shape de referência baseado na rota local do OpenClaw.
 *
 * === ENDPOINT PRINCIPAL ===
 *
 *   GET /api/agents
 *
 *   Retorna AgentInfo[] — dados brutos de cada agente:
 *
 *   [
 *     {
 *       "id":                   "agent-router-01",
 *       "name":                 "Router",
 *       "role":                 "Orquestração e roteamento de tarefas",
 *       "tier":                 "orchestrator",
 *       "model":                "gpt-4o",
 *       "enabled":              true,
 *       "online":               true,
 *       "activeSessions":       3,
 *       "totalTokensToday":     142000,
 *       "uptimePercent":        99.8,
 *       "cpuPercent":           45.2,
 *       "lastActivityAt":       "2025-03-26T14:28:00Z",
 *       "currentTask":          "Classificando batch #4821",
 *       "currentTaskStartedAt": "2025-03-26T14:25:00Z",
 *       "dependsOn":            ["Sync"],
 *       "feeds":                ["Classifier", "Enricher"],
 *       "alertCount":           0
 *     }
 *   ]
 *
 * === ENDPOINT SECUNDÁRIO ===
 *
 *   GET /api/agents/tree → AgentNode[]
 *
 * === CAMPOS DERIVADOS (transform no fetcher.ts) ===
 *
 *   status, sessions, load, tokensToday, availability,
 *   lastActivity, lastActivityLabel, currentTask, currentTaskAge
 *
 * === ATIVAÇÃO ===
 *
 *   1. Rodar acoplado ao OpenClaw
 *   2. Ou definir VITE_ORION_API_URL como override
 */

export type {
  AgentInfo, AgentView, AgentNode, AgentTier, AgentStatus,
  AgentProfile, AgentOperationalStatus, AgentScopeType,
} from "./types";
