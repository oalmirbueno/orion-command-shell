import type { OperationTask, TimelineEvent, Operation } from "./types";

export const FALLBACK_TASKS: OperationTask[] = [
  { id: "op-01", title: "Classificação Batch #4821", agent: "Classifier-01", status: "running", priority: "critical", progress: 67, elapsed: "14min", updatedAt: "09:47", description: "8.4k leads — accuracy target 97%" },
  { id: "op-02", title: "Sync CRM → Data Lake", agent: "Sync-01", status: "running", priority: "high", progress: 88, elapsed: "8min", updatedAt: "09:45", description: "1.8k registros sincronizando" },
  { id: "op-03", title: "Sumarização Emails Inbound", agent: "Summarizer-01", status: "running", priority: "critical", progress: 34, elapsed: "20min", updatedAt: "09:42", description: "156 emails capturados — prioridade alta" },
  { id: "op-04", title: "Enriquecimento Leads Q1", agent: "Enricher-01", status: "running", priority: "normal", progress: 41, elapsed: "32min", updatedAt: "09:40", description: "7.8k registros via LinkedIn + Clearbit" },
  { id: "op-05", title: "Health Check #8472", agent: "Monitor-01", status: "done", priority: "normal", progress: 100, elapsed: "2min", updatedAt: "09:38", description: "12 endpoints verificados — todos OK" },
  { id: "op-06", title: "Reprocessamento Eventos", agent: "Analyzer-01", status: "paused", priority: "normal", progress: 22, elapsed: "1h02", updatedAt: "09:34", description: "480 eventos pendentes na fila" },
  { id: "op-07", title: "Deploy v2.14.3 Staging", agent: "Release Pipeline", status: "done", priority: "high", progress: 100, elapsed: "6min", updatedAt: "08:55", description: "Build #1847 — todos os testes passaram" },
  { id: "op-08", title: "Rollback Pipeline v2.14.2", agent: "Core Engine", status: "done", priority: "critical", progress: 100, elapsed: "4min", updatedAt: "09:42", description: "Restauração após falha no deploy" },
  { id: "op-09", title: "Classificação Batch #4822", agent: "Classifier-01", status: "queued", priority: "high", progress: 0, elapsed: "—", updatedAt: "09:47", description: "12k leads enfileirados — aguardando slot" },
  { id: "op-10", title: "Sync Salesforce Contacts", agent: "Sync-02", status: "queued", priority: "normal", progress: 0, elapsed: "—", updatedAt: "09:45", description: "3.2k contatos pendentes" },
  { id: "op-11", title: "Geração Report Semanal", agent: "Reporter-01", status: "queued", priority: "low", progress: 0, elapsed: "—", updatedAt: "09:30", description: "Relatório executivo — agendado 10:00" },
  { id: "op-12", title: "Validação API Externa", agent: "Validator-01", status: "failed", priority: "critical", progress: 78, elapsed: "3min", updatedAt: "09:47", description: "Timeout após 3 retries — conexão perdida" },
];

export const FALLBACK_TIMELINE: TimelineEvent[] = [
  { id: "tl-01", time: "09:47", timeAgo: "Agora", action: "failed", taskTitle: "Validação API Externa", agent: "Validator-01", detail: "Timeout após 3 retries — conexão perdida com endpoint" },
  { id: "tl-02", time: "09:47", timeAgo: "Agora", action: "started", taskTitle: "Classificação Batch #4821", agent: "Classifier-01", detail: "8.4k leads carregados — processamento iniciado" },
  { id: "tl-03", time: "09:45", timeAgo: "2min", action: "started", taskTitle: "Sync CRM → Data Lake", agent: "Sync-01", detail: "1.8k registros enfileirados para sincronização" },
  { id: "tl-04", time: "09:42", timeAgo: "5min", action: "completed", taskTitle: "Rollback Pipeline v2.14.2", agent: "Core Engine", detail: "Restauração concluída — performance normalizada em 4min" },
  { id: "tl-05", time: "09:42", timeAgo: "5min", action: "started", taskTitle: "Sumarização Emails Inbound", agent: "Summarizer-01", detail: "156 emails capturados para processamento" },
  { id: "tl-06", time: "09:40", timeAgo: "7min", action: "started", taskTitle: "Enriquecimento Leads Q1", agent: "Enricher-01", detail: "7.8k registros via LinkedIn + Clearbit" },
  { id: "tl-07", time: "09:38", timeAgo: "9min", action: "completed", taskTitle: "Health Check #8472", agent: "Monitor-01", detail: "12 endpoints verificados — todos nominais" },
  { id: "tl-08", time: "09:34", timeAgo: "13min", action: "paused", taskTitle: "Reprocessamento Eventos", agent: "Analyzer-01", detail: "Pausado manualmente pelo operador — 480 eventos pendentes" },
  { id: "tl-09", time: "08:55", timeAgo: "52min", action: "completed", taskTitle: "Deploy v2.14.3 Staging", agent: "Release Pipeline", detail: "Build #1847 validado — todos os testes passaram" },
  { id: "tl-10", time: "08:45", timeAgo: "1h", action: "retried", taskTitle: "Validação API Externa", agent: "Validator-01", detail: "Retry #2 iniciado — backoff exponencial 30s" },
  { id: "tl-11", time: "08:30", timeAgo: "1h17", action: "queued", taskTitle: "Classificação Batch #4822", agent: "Classifier-01", detail: "12k leads enfileirados — aguardando slot disponível" },
  { id: "tl-12", time: "08:00", timeAgo: "1h47", action: "completed", taskTitle: "Health Check Matinal", agent: "Health Monitor", detail: "11/12 serviços nominais — Data Pipeline com P95 elevado" },
];

export const FALLBACK_LIVE_OPS: Operation[] = [
  { id: "1", name: "Classificação Batch #4821", agent: "Classifier-01", status: "running", progress: 67, elapsed: "14min", priority: "high" },
  { id: "2", name: "Sync CRM → Data Lake", agent: "Sync-01", status: "running", progress: 88, elapsed: "8min", priority: "normal" },
  { id: "3", name: "Sumarização Emails Inbound", agent: "Summarizer-01", status: "running", progress: 34, elapsed: "20min", priority: "high" },
  { id: "4", name: "Enriquecimento Leads Q1", agent: "Enricher-01", status: "running", progress: 41, elapsed: "32min", priority: "normal" },
  { id: "5", name: "Health Check #8472", agent: "Monitor-01", status: "running", progress: 92, elapsed: "2min", priority: "normal" },
  { id: "6", name: "Reprocessamento Eventos", agent: "Analyzer-01", status: "paused", progress: 22, elapsed: "1h02", priority: "normal" },
];
