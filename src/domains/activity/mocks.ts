import type { ActivityEvent, BriefingItem, AttentionItem } from "./types";

export const FALLBACK_EVENTS: ActivityEvent[] = [
  { id: "e-01", time: "09:47", timeAgo: "Agora", priority: "critical", category: "agent", title: "Validator-01 ficou offline", description: "Falha de conexão com API externa após 3 retries. Última resposta: timeout 30s.", source: "Validator-01" },
  { id: "e-02", time: "09:45", timeAgo: "2min ago", priority: "warning", category: "pipeline", title: "Pipeline ingestão com latência elevada", description: "P95 subiu para 187ms (threshold: 100ms). Causa provável: volume de dados 3x acima do normal.", source: "Data Pipeline" },
  { id: "e-03", time: "09:42", timeAgo: "5min ago", priority: "success", category: "system", title: "Rollback automático concluído com sucesso", description: "Pipeline restaurado para v2.14.2 após falha no deploy. Performance normalizada em 4min.", source: "Core Engine" },
  { id: "e-04", time: "09:40", timeAgo: "7min ago", priority: "info", category: "session", title: "Session Health Check #8472 iniciada", description: "Verificação de 12 endpoints agendada. Execução automática pelo Monitor-01.", source: "Monitor-01" },
  { id: "e-05", time: "09:38", timeAgo: "9min ago", priority: "warning", category: "agent", title: "Sync-01 atingiu 91% de carga", description: "Carga elevada devido a sync CRM com 2.1k registros simultâneos. Monitorando.", source: "Sync-01" },
  { id: "e-06", time: "09:34", timeAgo: "13min ago", priority: "success", category: "session", title: "Sync CRM → Data Lake concluído", description: "1.8k registros sincronizados com sucesso. Duração: 8min. Zero erros.", source: "Sync-01" },
  { id: "e-07", time: "09:28", timeAgo: "19min ago", priority: "info", category: "session", title: "Classificação Batch #4821 iniciada", description: "8.4k leads enfileirados para classificação. Agente Classifier-01 alocado.", source: "Classifier-01" },
  { id: "e-08", time: "09:22", timeAgo: "25min ago", priority: "neutral", category: "session", title: "Sumarização Emails Inbound iniciada", description: "156 emails capturados. Prioridade alta. Summarizer-01 processando.", source: "Summarizer-01" },
  { id: "e-09", time: "09:15", timeAgo: "32min ago", priority: "warning", category: "security", title: "Rate limit atingido na API de enrichment", description: "Clearbit retornou 429. Backoff exponencial ativado. Próximo retry em 60s.", source: "Enricher-01" },
  { id: "e-10", time: "09:10", timeAgo: "37min ago", priority: "info", category: "session", title: "Enriquecimento Leads Q1 iniciado", description: "7.8k registros para enriquecimento via LinkedIn + Clearbit. ETA: 45min.", source: "Enricher-01" },
  { id: "e-11", time: "08:55", timeAgo: "52min ago", priority: "neutral", category: "deploy", title: "Deploy v2.14.3 em staging validado", description: "Todos os testes passaram. Aguardando aprovação manual para produção.", source: "Release Pipeline" },
  { id: "e-12", time: "08:45", timeAgo: "1h ago", priority: "info", category: "session", title: "Reprocessamento pausado por operador", description: "Session s-4816 pausada manualmente. 480 eventos pendentes na fila.", source: "Analyzer-01" },
  { id: "e-13", time: "08:30", timeAgo: "1h17 ago", priority: "success", category: "deploy", title: "Deploy v2.14.3 aprovado para staging", description: "Build #1847 promovido. Imagem docker validada. Ambiente staging atualizado.", source: "Release Pipeline" },
  { id: "e-14", time: "08:00", timeAgo: "1h47 ago", priority: "success", category: "system", title: "Health check matinal concluído", description: "Rotina diária executada. 11/12 serviços nominais. Data Pipeline com P95 elevado.", source: "Health Monitor" },
  { id: "e-15", time: "07:30", timeAgo: "2h17 ago", priority: "success", category: "session", title: "Classificação Batch #4809 concluída", description: "6.2k leads classificados. Accuracy: 97.3%. Duração: 18min.", source: "Classifier-01" },
];

export const FALLBACK_BRIEFING: BriefingItem[] = [
  { time: "09:42", content: "Pipeline de ingestão retomado após rollback automático do v2.14.2. Performance restaurada em 4min.", source: "Core Engine" },
  { time: "09:15", content: "Agente Validator-01 reportou falha de conectividade com API externa. Retry policy ativado.", source: "Validator-01" },
  { time: "08:58", content: "Classificação de leads Q1 iniciada. ETA: 45min com 12.4k registros enfileirados.", source: "Mission Control" },
  { time: "08:30", content: "Deploy v2.14.3 em staging validado. Aguardando aprovação para produção.", source: "Release Pipeline" },
  { time: "08:00", content: "Rotina de saúde matinal concluída. Todos os serviços nominais exceto Data Pipeline (P95 elevado).", source: "Health Monitor" },
];

export const FALLBACK_ATTENTION: AttentionItem[] = [
  { id: "1", priority: "critical", title: "Pipeline de ingestão com latência elevada", context: "Data Pipeline · P95 > 200ms há 12min", timestamp: "12min" },
  { id: "2", priority: "warning", title: "Agente Classifier atingiu 85% de memória", context: "ML Processor · Cluster East", timestamp: "28min" },
  { id: "3", priority: "warning", title: "3 tarefas na fila há mais de 5 minutos", context: "Queue Manager · Threshold: 3min", timestamp: "6min" },
  { id: "4", priority: "info", title: "Deploy v2.14.3 aguardando aprovação", context: "Release Pipeline · Staging validated", timestamp: "1h" },
];
