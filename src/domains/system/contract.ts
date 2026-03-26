/**
 * System — Contrato de Integração
 *
 * === ENDPOINT ===
 * GET /api/system
 *
 * === RESPOSTA ESPERADA (SystemPageData) ===
 *
 * {
 *   "header": {
 *     "overallStatus": "healthy" | "degraded" | "critical",
 *     "host":          "string",                              // hostname do servidor
 *     "uptime":        "string",                              // ex: "14d 6h 32m"
 *     "lastCheck":     "string"                               // ex: "há 2 min"
 *   },
 *   "gauges": [
 *     { "label": "CPU", "value": 42, "max": 100, "unit": "%", "detail": "4 cores", "iconName": "Cpu" }
 *   ],
 *   "services": [
 *     { "name": "API Gateway", "status": "running" | "degraded" | "stopped" | "restarting", "port": "3000", "cpu": "2.1%", "mem": "128MB", "uptime": "14d", "pid": "1234" }
 *   ],
 *   "signals": [
 *     { "label": "Latência P95", "value": "42ms", "level": "normal" | "elevated" | "critical", "iconName": "Clock", "detail?": "últimas 24h" }
 *   ],
 *   "uptimeDays": [
 *     { "date": "2026-03-26", "status": "up" | "degraded" | "down" | "partial" }
 *   ],
 *   "uptimePercent": "99.8%"
 * }
 *
 * === ENDPOINTS SECUNDÁRIOS (widgets Home) ===
 *
 * GET /api/system/command → CommandData
 * {
 *   "systemState": "nominal" | "degraded" | "critical",
 *   "metrics": [ { "label": "string", "value": "string", "icon": "string" } ]
 * }
 *
 * GET /api/system/health → HealthService[]
 * [ { "name": "string", "status": "healthy" | "degraded" | "down", "responseTime": "12ms", "uptime": "99.9%" } ]
 *
 * GET /api/system/services → SystemService[]
 * (mesmo formato do campo "services" acima)
 *
 * === TRANSFORM ===
 * Nenhum necessário se a API seguir o formato acima.
 * Para shapes diferentes, adicionar transform no fetcher.ts.
 */

export type {
  SystemPageData,
  SystemHeaderData,
  CommandData,
  HealthService,
  SystemService,
  ResourceGauge,
  StabilitySignal,
  UptimeDay,
} from "./types";
