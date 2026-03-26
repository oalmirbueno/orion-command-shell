/**
 * Home / Command — Fallback data
 *
 * Consolidates fallback data from all domains needed by the Home page.
 */

import type { HomePageData } from "./types";
import type { CommandData, HealthService } from "../system/types";
import type { AttentionItem, BriefingItem } from "../activity/types";
import type { Operation } from "../operations/types";
import type { AgentNode } from "../agents/types";

const FALLBACK_COMMAND: CommandData = {
  systemState: "degraded",
  metrics: [
    { label: "Uptime", value: "99.97%", icon: "Clock" },
    { label: "Agentes", value: "7/10", icon: "Bot" },
    { label: "Sessões", value: "5 ativas", icon: "Activity" },
    { label: "Tokens/h", value: "142k", icon: "Zap" },
  ],
};

const FALLBACK_ATTENTION: AttentionItem[] = [
  { id: "1", priority: "critical", title: "Pipeline de ingestão com latência elevada", context: "data-pipeline · P95 > 200ms há 12min", timestamp: "12min" },
  { id: "2", priority: "warning", title: "Classifier-01 atingiu 85% de memória", context: "ml-processor · cluster-east", timestamp: "28min" },
  { id: "3", priority: "warning", title: "3 tarefas na fila há mais de 5 minutos", context: "queue-manager · threshold: 3min", timestamp: "6min" },
  { id: "4", priority: "info", title: "Deploy v2.14.3 aguardando aprovação", context: "release-pipeline · staging validado", timestamp: "1h" },
];

const FALLBACK_LIVE_OPS: Operation[] = [
  { id: "op-1", name: "Ingestão Batch — Cluster A", agent: "Router-01", status: "running", progress: 73, elapsed: "14min", priority: "high" },
  { id: "op-2", name: "Classificação de Leads Q1", agent: "Classifier-01", status: "running", progress: 41, elapsed: "32min", priority: "high" },
  { id: "op-3", name: "Sync CRM → Data Lake", agent: "Sync-01", status: "running", progress: 88, elapsed: "8min", priority: "normal" },
  { id: "op-4", name: "Enriquecimento via Clearbit", agent: "Enricher-01", status: "running", progress: 56, elapsed: "22min", priority: "normal" },
  { id: "op-5", name: "Reprocessamento de eventos", agent: "Analyzer-01", status: "paused", progress: 22, elapsed: "1h12", priority: "normal" },
];

const FALLBACK_AGENTS: AgentNode[] = [
  { name: "Orion Core", role: "Orquestrador principal do sistema", tier: "orchestrator", status: "active", load: 42 },
  { name: "Router-01", role: "Roteamento de tarefas", tier: "core", status: "active", load: 63 },
  { name: "Classifier-01", role: "Classificação de leads", tier: "core", status: "active", load: 85 },
  { name: "Enricher-01", role: "Enriquecimento de dados", tier: "core", status: "active", load: 56 },
  { name: "Sync-01", role: "Sincronização de dados", tier: "support", status: "active", load: 91 },
  { name: "Monitor-01", role: "Verificação de saúde", tier: "support", status: "active", load: 34 },
  { name: "Analyzer-01", role: "Detecção de padrões", tier: "support", status: "idle", load: 8 },
  { name: "Validator-01", role: "Validação de dados", tier: "support", status: "offline", load: 0 },
];

const FALLBACK_HEALTH: HealthService[] = [
  { name: "API Gateway", status: "healthy", responseTime: "12ms", uptime: "99.99%" },
  { name: "Core Engine", status: "healthy", responseTime: "8ms", uptime: "99.98%" },
  { name: "Data Pipeline", status: "degraded", responseTime: "187ms", uptime: "99.91%" },
  { name: "Auth Service", status: "healthy", responseTime: "15ms", uptime: "100%" },
  { name: "ML Processor", status: "healthy", responseTime: "34ms", uptime: "99.95%" },
  { name: "Cache Layer", status: "healthy", responseTime: "2ms", uptime: "100%" },
  { name: "Queue Service", status: "healthy", responseTime: "5ms", uptime: "99.99%" },
  { name: "Storage", status: "healthy", responseTime: "22ms", uptime: "99.97%" },
];

const FALLBACK_BRIEFING: BriefingItem[] = [
  { time: "há 3min", content: "Pipeline de ingestão retomado após rollback do v2.14.2. Performance normalizada.", source: "core-engine" },
  { time: "há 30min", content: "Validator-01 reportou falha de conectividade com API externa. Retry ativo.", source: "validator-01" },
  { time: "há 47min", content: "Classificação Q1 iniciada. 12.4k registros enfileirados, ETA ~45min.", source: "classifier-01" },
  { time: "há 1h", content: "Deploy v2.14.3 validado em staging. Aguardando aprovação.", source: "release-pipeline" },
  { time: "há 2h", content: "Health check matinal concluído. Data Pipeline com P95 elevado, demais nominais.", source: "monitor-01" },
];

export const FALLBACK_HOME_PAGE: HomePageData = {
  command: FALLBACK_COMMAND,
  attention: FALLBACK_ATTENTION,
  liveOps: FALLBACK_LIVE_OPS,
  agents: FALLBACK_AGENTS,
  health: FALLBACK_HEALTH,
  briefing: FALLBACK_BRIEFING,
};
