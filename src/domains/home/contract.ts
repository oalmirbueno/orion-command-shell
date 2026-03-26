/**
 * Home / Comando — Contrato de Integração
 *
 * Define formalmente o endpoint, formato esperado e regras de transformação
 * para o domínio Home, seguindo o padrão piloto de Sessions.
 *
 * === ENDPOINT ===
 * GET {VITE_ORION_API_URL}/home
 *
 * === RESPOSTA ESPERADA ===
 * {
 *   "command": {
 *     "systemState": "nominal" | "degraded" | "critical",
 *     "metrics": [
 *       { "label": "string", "value": "string", "icon": "Clock" | "Bot" | "Activity" | "Zap" }
 *     ]
 *   },
 *   "attention": [
 *     { "id": "string", "title": "string", "context": "string", "priority": "critical" | "warning" | "info", "timestamp": "string" }
 *   ],
 *   "liveOps": [
 *     { "id": "string", "name": "string", "agent": "string", "status": "running" | "paused", "priority": "high" | "normal", "progress": number, "elapsed": "string" }
 *   ],
 *   "agents": [
 *     { "name": "string", "role": "string", "tier": "orchestrator" | "core" | "support", "status": "active" | "idle" | "offline", "load": number }
 *   ],
 *   "health": [
 *     { "name": "string", "status": "healthy" | "degraded" | "down", "responseTime": "string", "uptime": "string" }
 *   ],
 *   "briefing": [
 *     { "time": "string", "content": "string", "source": "string" }
 *   ]
 * }
 *
 * === NOTAS ===
 * - WeatherContext usa API externa própria (Open-Meteo), não faz parte deste contrato.
 * - Sem transform necessário se a API seguir o formato acima.
 * - Fallback retorna estruturas vazias (sem dados fictícios).
 */

import type { HomePageData } from "./types";

/** Formato esperado da resposta da API — idêntico ao HomePageData */
export type HomeApiResponse = HomePageData;

/** Nenhum transform necessário quando a API segue o contrato */
export function transformHomeResponse(raw: HomeApiResponse): HomePageData {
  return raw;
}
