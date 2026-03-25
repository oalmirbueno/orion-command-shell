import {
  AlertCircle, AlertTriangle, Info, CheckCircle2,
  ChevronRight, Clock, ExternalLink,
} from "lucide-react";
import { useOrionData } from "@/hooks/useOrionData";
import { OrionDataWrapper } from "@/components/orion/DataWrapper";
import { fetchAlerts } from "@/domains/alerts/fetcher";
import type { Alert, Severity } from "@/domains/alerts/types";

const severityConfig: Record<Severity, {
  icon: React.ElementType; dot: string; text: string; bg: string; border: string; ringBg: string;
}> = {
  critical: { icon: AlertCircle, dot: "status-critical", text: "text-status-critical", bg: "bg-status-critical/6", border: "border-l-status-critical", ringBg: "bg-status-critical/10 border-status-critical/25" },
  warning: { icon: AlertTriangle, dot: "status-warning", text: "text-status-warning", bg: "bg-status-warning/5", border: "border-l-status-warning", ringBg: "bg-status-warning/10 border-status-warning/25" },
  info: { icon: Info, dot: "bg-primary/50", text: "text-primary", bg: "", border: "border-l-primary/30", ringBg: "bg-primary/10 border-primary/25" },
  resolved: { icon: CheckCircle2, dot: "status-online", text: "text-status-online", bg: "", border: "border-l-status-online/30", ringBg: "bg-status-online/10 border-status-online/25" },
};

function AlertRow({ alert }: { alert: Alert }) {
  const cfg = severityConfig[alert.severity];
  const Icon = cfg.icon;
  const isCritical = alert.severity === "critical";
  const isResolved = alert.severity === "resolved";

  return (
    <div className={`rounded-lg border border-border/50 border-l-[3px] ${cfg.border} ${cfg.bg} ${isResolved ? "opacity-50 hover:opacity-70" : ""} hover:bg-accent/20 transition-all cursor-pointer group`}>
      <div className="px-6 py-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${cfg.ringBg}`}>
              <Icon className={`h-5 w-5 ${cfg.text} ${isCritical ? "animate-pulse-glow" : ""}`} />
            </div>
            <div className="min-w-0">
              <h3 className={`text-base font-semibold leading-snug ${isCritical ? "text-status-critical" : "text-foreground"}`}>{alert.title}</h3>
              <p className="text-sm text-foreground/50 leading-relaxed mt-1.5">{alert.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-4 mt-1">
            {!alert.acknowledged && !isResolved && (
              <span className="text-[10px] font-mono uppercase px-2 py-1 rounded bg-status-warning/15 text-status-warning border border-status-warning/20">Pendente</span>
            )}
            {alert.occurrences > 1 && (
              <span className="text-[11px] font-mono px-2 py-1 rounded bg-surface-2 border border-border/40 text-muted-foreground/60">×{alert.occurrences}</span>
            )}
            <ChevronRight className="h-5 w-5 text-muted-foreground/15 group-hover:text-muted-foreground/40 transition-colors" />
          </div>
        </div>

        {!isResolved && (
          <div className="ml-[52px] mb-4 px-4 py-3 rounded-lg bg-surface-2 border border-border/40">
            <div className="flex items-start gap-2">
              <ExternalLink className="h-4 w-4 text-muted-foreground/30 shrink-0 mt-0.5" />
              <p className="text-xs text-foreground/60 leading-relaxed">
                <span className="text-muted-foreground/50 font-mono text-[10px] mr-1.5">AÇÃO:</span>
                {alert.action}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 ml-[52px] text-[11px] font-mono text-muted-foreground/50">
          <span>{alert.source}</span>
          <div className="h-4 w-px bg-border/30" />
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>{alert.triggeredAt}</span>
          </div>
          <span className="text-muted-foreground/30">{alert.triggeredAgo}</span>
          {alert.resolvedAt && (
            <>
              <div className="h-4 w-px bg-border/30" />
              <span className="text-status-online/60">Resolvido {alert.resolvedAt}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function AlertsList() {
  const { state, data, source, lastUpdated, refetch } = useOrionData<Alert[]>({
    key: "alerts-list",
    fetcher: fetchAlerts,
  });

  const alerts = data || [];
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
        <div className="flex items-center gap-2 ml-2 px-3 py-1 rounded-full bg-status-critical/10 border border-status-critical/20">
          <span className="text-[11px] font-mono text-status-critical font-semibold">{activeCount} ativos</span>
        </div>
        <div className="flex-1 h-px bg-border/40" />
      </div>

      <OrionDataWrapper state={state} source={source} lastUpdated={lastUpdated} onRetry={refetch}>
        <div className="space-y-8">
          {groups.map((group) => {
            const cfg = severityConfig[group.severity];
            return (
              <div key={group.severity}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`status-dot ${cfg.dot}`} />
                  <span className={`text-[11px] font-mono uppercase tracking-widest ${cfg.text}`}>{group.label}</span>
                  <span className="text-[11px] font-mono text-muted-foreground/30">{group.alerts.length}</span>
                  <div className="flex-1 h-px bg-border/20" />
                </div>
                <div className="space-y-3">
                  {group.alerts.map((alert) => (
                    <AlertRow key={alert.id} alert={alert} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </OrionDataWrapper>
    </section>
  );
}
