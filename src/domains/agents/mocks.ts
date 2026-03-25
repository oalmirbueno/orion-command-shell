import type { AgentNode, Agent } from "./types";

export const FALLBACK_AGENT_TREE: AgentNode[] = [
  { name: "Router-01", role: "Orquestrador de Tarefas", tier: "orchestrator", status: "active", load: 63 },
  { name: "Classifier-01", role: "Classificação de Leads", tier: "core", status: "active", load: 72 },
  { name: "Enricher-01", role: "Enriquecimento de Dados", tier: "core", status: "active", load: 45 },
  { name: "Summarizer-01", role: "Sumarização de Conteúdo", tier: "core", status: "active", load: 55 },
  { name: "Analyzer-01", role: "Detecção de Padrões", tier: "core", status: "idle", load: 0 },
  { name: "Sync-01", role: "Sincronização de Dados", tier: "support", status: "active", load: 91 },
  { name: "Monitor-01", role: "Saúde & Observabilidade", tier: "support", status: "active", load: 18 },
  { name: "Validator-01", role: "Validação de Dados", tier: "support", status: "offline", load: 0 },
  { name: "Exporter-01", role: "Geração de Relatórios", tier: "support", status: "idle", load: 0 },
  { name: "Responder-01", role: "Auto-Resposta", tier: "support", status: "idle", load: 0 },
];

export const FALLBACK_AGENTS: Agent[] = [
  { id: "rtr-01", name: "Router-01", role: "Orquestrador de Tarefas", tier: "orchestrator", model: "GPT-4o-mini", status: "active", sessions: 5, lastActivity: "Distribuindo tasks para fila", lastActivityLabel: "há 1s", load: 63, tokensToday: "67k", availability: "100%" },
  { id: "clf-01", name: "Classifier-01", role: "Classificação de Leads", tier: "core", model: "GPT-4o", status: "active", sessions: 3, lastActivity: "Classificando batch #4821", lastActivityLabel: "há 2s", load: 72, tokensToday: "142k", availability: "99.8%" },
  { id: "enr-01", name: "Enricher-01", role: "Enriquecimento de Dados", tier: "core", model: "GPT-4o-mini", status: "active", sessions: 2, lastActivity: "Enriquecendo registros CRM", lastActivityLabel: "há 5s", load: 45, tokensToday: "89k", availability: "99.9%" },
  { id: "sum-01", name: "Summarizer-01", role: "Sumarização de Conteúdo", tier: "core", model: "GPT-4o", status: "active", sessions: 2, lastActivity: "Sumarizando emails inbound", lastActivityLabel: "há 4s", load: 55, tokensToday: "178k", availability: "99.6%" },
  { id: "anl-01", name: "Analyzer-01", role: "Detecção de Padrões", tier: "core", model: "GPT-4o", status: "idle", sessions: 0, lastActivity: "Análise de padrões concluída", lastActivityLabel: "há 12min", load: 0, tokensToday: "34k", availability: "99.7%" },
  { id: "syn-01", name: "Sync-01", role: "Sincronização de Dados", tier: "support", model: "GPT-4o-mini", status: "active", sessions: 1, lastActivity: "Sincronizando HubSpot → Lake", lastActivityLabel: "há 3s", load: 91, tokensToday: "201k", availability: "99.5%" },
  { id: "mon-01", name: "Monitor-01", role: "Saúde & Observabilidade", tier: "support", model: "GPT-4o-mini", status: "active", sessions: 1, lastActivity: "Ciclo de verificação #8472", lastActivityLabel: "há 8s", load: 18, tokensToday: "12k", availability: "100%" },
  { id: "val-01", name: "Validator-01", role: "Validação de Dados", tier: "support", model: "GPT-4o", status: "offline", sessions: 0, lastActivity: "Falha de conexão com API externa", lastActivityLabel: "há 14min", load: 0, tokensToday: "8k", availability: "94.2%" },
  { id: "exp-01", name: "Exporter-01", role: "Geração de Relatórios", tier: "support", model: "GPT-4o-mini", status: "idle", sessions: 0, lastActivity: "Relatório semanal exportado", lastActivityLabel: "há 1h", load: 0, tokensToday: "5k", availability: "99.9%" },
  { id: "res-01", name: "Responder-01", role: "Auto-Resposta & Rascunhos", tier: "support", model: "GPT-4o", status: "idle", sessions: 0, lastActivity: "Fila vazia — aguardando", lastActivityLabel: "há 3min", load: 0, tokensToday: "22k", availability: "99.8%" },
];
