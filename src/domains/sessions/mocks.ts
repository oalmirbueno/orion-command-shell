import type { Session } from "./types";

export const FALLBACK_SESSIONS: Session[] = [
  { id: "s-4821", title: "Classificação Batch #4821", type: "classification", agent: "Classifier-01", model: "GPT-4o", status: "running", progress: 67, preview: "Processando 8.4k leads · 5.6k classificados · ETA 12min", startedAt: "09:28", elapsed: "14min", tokens: "42k" },
  { id: "s-4820", title: "Sync CRM → Data Lake", type: "sync", agent: "Sync-01", model: "GPT-4o-mini", status: "running", progress: 88, preview: "Sincronizando 2.1k registros · 1.8k sincronizados", startedAt: "09:34", elapsed: "8min", tokens: "18k" },
  { id: "s-4819", title: "Sumarização Emails Inbound", type: "analysis", agent: "Summarizer-01", model: "GPT-4o", status: "running", progress: 34, preview: "Processando 156 emails · 53 sumarizados · Prioridade alta", startedAt: "09:22", elapsed: "20min", tokens: "89k" },
  { id: "s-4818", title: "Enriquecimento Leads Q1", type: "enrichment", agent: "Enricher-01", model: "GPT-4o-mini", status: "running", progress: 41, preview: "Enriquecendo com dados LinkedIn e Clearbit · 3.2k/7.8k", startedAt: "09:10", elapsed: "32min", tokens: "67k" },
  { id: "s-4817", title: "Health Check Cycle #8472", type: "routing", agent: "Monitor-01", model: "GPT-4o-mini", status: "running", progress: 92, preview: "Verificando 12 endpoints · 11/12 OK · 1 pendente", startedAt: "09:40", elapsed: "2min", tokens: "3k" },
  { id: "s-4816", title: "Reprocessamento Eventos Falhos", type: "analysis", agent: "Analyzer-01", model: "GPT-4o", status: "paused", progress: 22, preview: "Pausado por operador · 480 eventos pendentes", startedAt: "08:45", elapsed: "1h02", tokens: "34k" },
  { id: "s-4815", title: "Validação Dataset Treinamento", type: "enrichment", agent: "Validator-01", model: "GPT-4o", status: "failed", progress: 15, preview: "Erro: API externa não responde · Retry 3/3 falhou", startedAt: "09:12", elapsed: "30min", tokens: "8k" },
  { id: "s-4814", title: "Distribuição Tasks Sprint 14", type: "routing", agent: "Router-01", model: "GPT-4o-mini", status: "paused", progress: 60, preview: "Aguardando aprovação do operador · 12 tasks pendentes", startedAt: "08:55", elapsed: "47min", tokens: "14k" },
  { id: "s-4810", title: "Export Relatório Semanal", type: "export", agent: "Exporter-01", model: "GPT-4o-mini", status: "completed", progress: 100, preview: "PDF gerado · 24 páginas · Enviado para stakeholders", startedAt: "08:00", elapsed: "12min", tokens: "5k" },
  { id: "s-4809", title: "Classificação Batch #4809", type: "classification", agent: "Classifier-01", model: "GPT-4o", status: "completed", progress: 100, preview: "6.2k leads classificados · Accuracy 97.3%", startedAt: "07:30", elapsed: "18min", tokens: "52k" },
];
