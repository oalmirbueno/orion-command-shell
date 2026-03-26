/**
 * Memory — Contrato de Integração
 *
 * === ENDPOINT ===
 * GET /api/memory → MemoryPageData
 *
 * {
 *   "snapshots": [
 *     {
 *       "id":          "string",
 *       "title":       "Decisão de roteamento #42",
 *       "category":    "context" | "decision" | "learning" | "profile" | "config" | "incident",
 *       "summary":     "Resumo da decisão tomada",
 *       "context":     "Contexto operacional completo",
 *       "capturedAt":  "2026-03-26T16:30:00Z",
 *       "capturedAgo": "há 5 min",
 *       "source":      "Orchestrator",
 *       "tags":        ["routing", "leads"],
 *       "relevance":   "high" | "medium" | "low"
 *     }
 *   ],
 *   "summary": {
 *     "totalSnapshots":  42,
 *     "totalCategories": 5,
 *     "lastCapture":     "há 5 min",
 *     "totalSize":       "2.4 MB"
 *   }
 * }
 *
 * === ENDPOINT SECUNDÁRIO (widgets Home) ===
 * GET /api/memory/snapshots → MemorySnapshot[]
 *
 * === TRANSFORM ===
 * Nenhum necessário se a API seguir o formato acima.
 */

export type { MemorySnapshot, MemoryPageData, MemorySummaryData, MemoryCategory } from "./types";
