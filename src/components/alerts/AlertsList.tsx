import {
  AlertCircle, AlertTriangle, Info, CheckCircle2,
  ChevronRight, Clock, ExternalLink, Inbox,
} from "lucide-react";
import type { Alert, Severity } from "@/domains/alerts/types";

const severityConfig: Record<Severity, {
  icon: React.ElementType; dot: string; text: string; bg: string; border: string; ringBg: string;
}> = {
  critical: { icon: AlertCircle, dot: "status-critical", text: "text-status-critical", bg: "bg-status-critical/[0.04]", border: "border-l-status-critical", ringBg: "bg-status-critical/10 border-status-critical/20" },
  warning: { icon: AlertTriangle, dot: "status-warning", text: "text-status-warning", bg: "bg-status-warning/[0.04]", border: "border-l-status-warning", ringBg: "bg-status-warning/10 border-status-warning/20" },
  info: { icon: Info, dot: "bg-primary/50", text: "text-primary", bg: "", border: "border-l-primary/30", ringBg: "bg-primary/10 border-primary/20" },
  resolved: { icon: CheckCircle2, dot: "status-online", text: "text-status-online", bg: "", border: "border-l-status-online/30", ringBg: "bg-status-online/10 border-status-online/20" },
};

function AlertRow({ alert }: { alert: Alert }) {
  const cfg = severityConfig[alert.severity];
  const Icon = cfg.icon;
  const isCritical = alert.severity === "critical";
  const isResolved = alert.severity === "resolved";

  return (
    <div className={`rounded-lg border border-border/40 border-l-[3px] ${cfg.border} ${cfg.bg} ${isResolved ? "opacity-45 hover:opacity-65" : ""} hover:bg-accent/20 transition-all cursor-pointer group`}>
      <div className="px-6 py-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3.5 min-w-0 flex-1">
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${cfg.ringBg}`}>
              <Icon className={`h-4 w-4 ${cfg.text}`} />
            </div>
            <div className="min-w-0">
              <h3 className={`text-sm font-semibold leading-snug ${isCritical ? "text-status-critical" : "text-foreground"}`}>{alert.title}</h3>
              <p className="text-xs text-foreground/45 leading-relaxed mt-1.5">{alert.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 ml-4 mt-1">
            {!alert.acknowledged && !isResolved && (
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-status-warning/15 text-status-warning border border-status-warning/20">Pendente</span>
            )}
            {alert.occurrences > 1 && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-2 border border-border/30 text-muted-foreground/50">×{alert.occurrences}</span>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground/10 group-hover:text-muted-foreground/40 transition-colors" />
          </div>
        </div>

        {!isResolved && (
          <div className="ml-[50px] mb-4 px-4 py-2.5 rounded-lg bg-surface-2 border border-border/30">
            <div className="flex items-start gap-2">
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/25 shrink-0 mt-0.5" />
              <p className="text-xs text-foreground/50 leading-relaxed">
                <span className="text-muted-foreground/40 font-mono text-[10px] mr-1.5">AÇÃO:</span>
                {alert.action}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3.5 ml-[50px] text-xs font-mono text-muted-foreground/40">
          <span>{alert.source}</span>
          <div className="w-px h-3 bg-border/20" />
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            <span>{alert.triggeredAt}</span>
          </div>
          <span className="text-muted-foreground/25">{alert.triggeredAgo}</span>
          {alert.resolvedAt && (
            <>
              <div className="w-px h-3 bg-border/20" />
              <span className="text-status-online/50">Resolvido {alert.resolvedAt}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface Props {
  alerts: Alert[];
}

export function AlertsList({ alerts }: Props) {
  if (alerts.length === 0) {
    return (
      <section className="rounded-lg border border-border overflow-hidden">
        <div className="orion-panel-header">
          <div className="flex items-center gap-3">
            <div className="w-6 h-0.5 bg-muted-foreground/40 rounded-full" />
            <h2 className="orion-panel-title">Feed de Alertas</h2>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-lg bg-surface-2 border border-border flex items-center justify-center mb-4">
            <Inbox className="h-6 w-6 text-muted-foreground/30" />
          </div>
          <p className="text-sm font-medium text-muted-foreground/50">Nenhum alerta registrado</p>
          <p className="text-xs font-mono text-muted-foreground/30 mt-1.5">Aguardando conexão com API</p>
        </div>
      </section>
    );
  }

  const allGroups = [
    { severity: "critical" as Severity, label: "Crítico", alerts: alerts.filter(a => a.severity === "critical") },
    { severity: "warning" as Severity, label: "Atenção", alerts: alerts.filter(a => a.severity === "warning") },
    { severity: "info" as Severity, label: "Informativo", alerts: alerts.filter(a => a.severity === "info") },
    { severity: "resolved" as Severity, label: "Resolvido", alerts: alerts.filter(a => a.severity === "resolved") },
  ];
  const groups = allGroups.filter(g => g.alerts.length > 0);
  const activeCount = alerts.filter(a => a.severity !== "resolved").length;

  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">Feed de Alertas</h2>
        {activeCount > 0 && (
          <div className="flex items-center gap-2 ml-2 px-3 py-1 rounded-full bg-status-critical/10 border border-status-critical/20">
            <span className="text-xs font-mono text-status-critical font-semibold">{activeCount} ativos</span>
          </div>
        )}
        <div className="flex-1 h-px bg-border/40" />
        <span className="text-xs font-mono text-muted-foreground/40">{alerts.length} total</span>
      </div>

      <div className="space-y-6 max-h-[calc(100vh-280px)] overflow-y-auto orion-thin-scroll pr-1">
        {groups.map((group) => {
          const cfg = severityConfig[group.severity];
          return (
            <div key={group.severity}>
              <div className="flex items-center gap-2.5 mb-3">
                <div className={`status-dot ${cfg.dot}`} />
                <span className={`text-[10px] font-mono uppercase tracking-widest ${cfg.text}`}>{group.label}</span>
                <span className="text-[10px] font-mono text-muted-foreground/25">{group.alerts.length}</span>
                <div className="flex-1 h-px bg-border/15" />
              </div>
              <div className="space-y-2.5">
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
