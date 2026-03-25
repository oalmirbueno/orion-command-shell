import {
  AlertCircle, AlertTriangle, Info, CheckCircle2,
  ChevronRight, Clock, ExternalLink,
} from "lucide-react";

type Severity = "critical" | "warning" | "info" | "resolved";

interface Alert {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  action: string;
  source: string;
  triggeredAt: string;
  triggeredAgo: string;
  resolvedAt?: string;
  acknowledged: boolean;
  occurrences: number;
}

const MOCK_ALERTS: Alert[] = [
  {
    id: "a-01", severity: "critical", title: "Validator-01 offline — conexão com API externa perdida",
    description: "Agente não responde há 14min. 3 retries falharam com timeout. Tarefas de validação suspensas.",
    action: "Verificar conectividade com api.external-service.com:443 e reiniciar agente",
    source: "Validator-01", triggeredAt: "09:33", triggeredAgo: "14min ago",
    acknowledged: false, occurrences: 1,
  },
  {
    id: "a-02", severity: "critical", title: "Cron job 'Reprocessar Eventos Falhos' com 3 falhas consecutivas",
    description: "ConnectionRefusedError: event-processor:8081. Serviço de processamento pode estar down.",
    action: "Verificar status do event-processor e logs do container",
    source: "Cron Scheduler", triggeredAt: "09:30", triggeredAgo: "17min ago",
    acknowledged: true, occurrences: 3,
  },
  {
    id: "a-03", severity: "warning", title: "Data Pipeline com latência P95 elevada",
    description: "P95 em 187ms (threshold: 100ms). Volume de ingestão 3x acima do normal. Causa: pico de dados.",
    action: "Monitorar. Considerar scale-up do worker pool se persistir por +30min",
    source: "Data Pipeline", triggeredAt: "09:28", triggeredAgo: "19min ago",
    acknowledged: true, occurrences: 1,
  },
  {
    id: "a-04", severity: "warning", title: "Sync-01 com carga em 91%",
    description: "Sync CRM com 2.1k registros simultâneos. Próximo do limite operacional.",
    action: "Aguardar conclusão da sessão atual. Reduzir batch size se carga não baixar",
    source: "Sync-01", triggeredAt: "09:34", triggeredAgo: "13min ago",
    acknowledged: false, occurrences: 1,
  },
  {
    id: "a-05", severity: "warning", title: "Rate limit atingido na API Clearbit",
    description: "HTTP 429 retornado. Backoff exponencial ativado automaticamente.",
    action: "Nenhuma ação necessária. Retry automático em 60s",
    source: "Enricher-01", triggeredAt: "09:15", triggeredAgo: "32min ago",
    acknowledged: true, occurrences: 2,
  },
  {
    id: "a-06", severity: "warning", title: "Process count acima da média",
    description: "247 processos ativos (média: 210). Sem impacto de performance detectado ainda.",
    action: "Monitorar. Investigar se persistir acima de 260",
    source: "System Monitor", triggeredAt: "09:10", triggeredAgo: "37min ago",
    acknowledged: false, occurrences: 1,
  },
  {
    id: "a-07", severity: "warning", title: "Export métricas com latência elevada",
    description: "Cron de export Prometheus levando 8s (normal: 2s) nas últimas 3 execuções.",
    action: "Verificar volume de métricas e estado do Prometheus endpoint",
    source: "Cron Scheduler", triggeredAt: "09:46", triggeredAgo: "1min ago",
    acknowledged: false, occurrences: 3,
  },
  {
    id: "a-08", severity: "info", title: "Deploy v2.14.3 aguardando aprovação",
    description: "Build validado em staging. Todos os testes passaram. Aguardando approval manual.",
    action: "Aprovar deploy para produção quando conveniente",
    source: "Release Pipeline", triggeredAt: "08:30", triggeredAgo: "1h17 ago",
    acknowledged: true, occurrences: 1,
  },
  {
    id: "a-09", severity: "info", title: "Classificação Batch #4821 em progresso — 67%",
    description: "8.4k leads em processamento. ETA: 12min. Sem anomalias.",
    action: "Nenhuma ação necessária",
    source: "Classifier-01", triggeredAt: "09:28", triggeredAgo: "19min ago",
    acknowledged: true, occurrences: 1,
  },
  {
    id: "a-10", severity: "info", title: "Session s-4816 pausada por operador",
    description: "Reprocessamento de eventos pausado manualmente. 480 eventos na fila.",
    action: "Retomar quando pronto",
    source: "Analyzer-01", triggeredAt: "08:45", triggeredAgo: "1h02 ago",
    acknowledged: true, occurrences: 1,
  },
  {
    id: "a-11", severity: "resolved", title: "Rollback v2.14.2 concluído com sucesso",
    description: "Pipeline restaurado. Performance normalizada em 4min. Zero perda de dados.",
    action: "Resolvido automaticamente",
    source: "Core Engine", triggeredAt: "09:42", triggeredAgo: "5min ago",
    resolvedAt: "09:42", acknowledged: true, occurrences: 1,
  },
  {
    id: "a-12", severity: "resolved", title: "Health check matinal concluído",
    description: "11/12 serviços nominais. Data Pipeline flagged para monitoramento contínuo.",
    action: "Resolvido",
    source: "Health Monitor", triggeredAt: "08:00", triggeredAgo: "1h47 ago",
    resolvedAt: "08:02", acknowledged: true, occurrences: 1,
  },
];

const severityConfig: Record<Severity, {
  icon: React.ElementType; dot: string; text: string; bg: string; border: string; ringBg: string;
}> = {
  critical: {
    icon: AlertCircle, dot: "status-critical", text: "text-status-critical",
    bg: "bg-status-critical/6", border: "border-l-status-critical", ringBg: "bg-status-critical/10 border-status-critical/25",
  },
  warning: {
    icon: AlertTriangle, dot: "status-warning", text: "text-status-warning",
    bg: "bg-status-warning/5", border: "border-l-status-warning", ringBg: "bg-status-warning/10 border-status-warning/25",
  },
  info: {
    icon: Info, dot: "bg-primary/50", text: "text-primary",
    bg: "", border: "border-l-primary/30", ringBg: "bg-primary/10 border-primary/25",
  },
  resolved: {
    icon: CheckCircle2, dot: "status-online", text: "text-status-online",
    bg: "", border: "border-l-status-online/30", ringBg: "bg-status-online/10 border-status-online/25",
  },
};

function AlertRow({ alert }: { alert: Alert }) {
  const cfg = severityConfig[alert.severity];
  const Icon = cfg.icon;
  const isCritical = alert.severity === "critical";
  const isResolved = alert.severity === "resolved";

  return (
    <div className={`rounded-lg border border-border/40 border-l-[3px] ${cfg.border} ${cfg.bg} ${isResolved ? "opacity-50 hover:opacity-70" : ""} hover:bg-accent/20 transition-all cursor-pointer group`}>
      <div className="px-5 py-4">
        {/* Row 1: Severity icon + Title + Badge */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${cfg.ringBg}`}>
              <Icon className={`h-4 w-4 ${cfg.text} ${isCritical ? "animate-pulse-glow" : ""}`} />
            </div>
            <div className="min-w-0">
              <h3 className={`text-[13px] font-semibold leading-snug ${isCritical ? "text-status-critical" : "text-foreground"}`}>
                {alert.title}
              </h3>
              <p className="text-[11px] text-foreground/50 leading-relaxed mt-1">{alert.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3 mt-1">
            {!alert.acknowledged && !isResolved && (
              <span className="text-[8px] font-mono uppercase px-1.5 py-0.5 rounded bg-status-warning/15 text-status-warning border border-status-warning/20">
                Unack
              </span>
            )}
            {alert.occurrences > 1 && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface-2 border border-border/40 text-muted-foreground/60">
                ×{alert.occurrences}
              </span>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground/15 group-hover:text-muted-foreground/40 transition-colors" />
          </div>
        </div>

        {/* Action box */}
        {!isResolved && (
          <div className="ml-10 mb-3 px-3 py-2 rounded-md bg-surface-2 border border-border/30">
            <div className="flex items-start gap-1.5">
              <ExternalLink className="h-3 w-3 text-muted-foreground/30 shrink-0 mt-0.5" />
              <p className="text-[10px] text-foreground/60 leading-relaxed">
                <span className="text-muted-foreground/40 font-mono text-[9px] mr-1">ACTION:</span>
                {alert.action}
              </p>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-3 ml-10 text-[9px] font-mono text-muted-foreground/40">
          <span>{alert.source}</span>
          <div className="h-3 w-px bg-border/30" />
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{alert.triggeredAt}</span>
          </div>
          <span className="text-muted-foreground/25">{alert.triggeredAgo}</span>
          {alert.resolvedAt && (
            <>
              <div className="h-3 w-px bg-border/30" />
              <span className="text-status-online/60">Resolved {alert.resolvedAt}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function AlertsList() {
  const allGroups = [
    { severity: "critical" as Severity, label: "Critical", alerts: MOCK_ALERTS.filter(a => a.severity === "critical") },
    { severity: "warning" as Severity, label: "Warning", alerts: MOCK_ALERTS.filter(a => a.severity === "warning") },
    { severity: "info" as Severity, label: "Informational", alerts: MOCK_ALERTS.filter(a => a.severity === "info") },
    { severity: "resolved" as Severity, label: "Resolved", alerts: MOCK_ALERTS.filter(a => a.severity === "resolved") },
  ];
  const groups = allGroups.filter(g => g.alerts.length > 0);

  const activeCount = MOCK_ALERTS.filter(a => a.severity !== "resolved").length;

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
          Alert Feed
        </h2>
        <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full bg-status-critical/10 border border-status-critical/20">
          <span className="text-[9px] font-mono text-status-critical font-medium">{activeCount} active</span>
        </div>
        <div className="flex-1 h-px bg-border/40" />
      </div>

      <div className="space-y-6">
        {groups.map((group) => {
          const cfg = severityConfig[group.severity];
          return (
            <div key={group.severity}>
              {/* Group header */}
              <div className="flex items-center gap-2 mb-2">
                <div className={`status-dot ${cfg.dot}`} />
                <span className={`text-[9px] font-mono uppercase tracking-widest ${cfg.text}`}>
                  {group.label}
                </span>
                <span className="text-[9px] font-mono text-muted-foreground/30">{group.alerts.length}</span>
                <div className="flex-1 h-px bg-border/20" />
              </div>

              <div className="space-y-2">
                {group.alerts.map((alert) => (
                  <AlertRow key={alert.id} alert={alert} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
