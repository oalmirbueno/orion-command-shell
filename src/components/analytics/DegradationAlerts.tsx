/**
 * DegradationAlerts — Alertas automáticos de degradação baseados em métricas.
 * Analisa tendências in-memory do domainAnalyticsStore e emite alertas visuais.
 * Quando Supabase configurado, também consulta histórico persistido.
 */

import { useSyncExternalStore, useMemo } from "react";
import { domainAnalyticsStore, type DomainAnalytics } from "@/services/domainAnalytics";
import { AlertTriangle, TrendingUp, Clock, ShieldAlert, CheckCircle2 } from "lucide-react";

const DOMAIN_LABELS: Record<string, string> = {
  system: "Sistema", sessions: "Sessões", agents: "Agentes",
  cron: "Cron", alerts: "Alertas", operations: "Operações",
  activity: "Atividade", memory: "Memória", files: "Arquivos", home: "Home",
};

interface DegradationAlert {
  domain: string;
  severity: "critical" | "warning";
  reason: string;
  metric: string;
}

const THRESHOLDS = {
  criticalLatencyMs: 5000,
  warningLatencyMs: 2000,
  criticalErrorRate: 0.5,
  warningErrorRate: 0.2,
};

function analyzeDegradation(analytics: Record<string, DomainAnalytics>): DegradationAlert[] {
  const alerts: DegradationAlert[] = [];

  for (const [domain, a] of Object.entries(analytics)) {
    // High error rate
    if (a.errorRate >= THRESHOLDS.criticalErrorRate) {
      alerts.push({
        domain, severity: "critical",
        reason: `Taxa de erro crítica: ${(a.errorRate * 100).toFixed(0)}%`,
        metric: `${a.errorCount} erros / ${a.errorCount + a.successCount} total`,
      });
    } else if (a.errorRate >= THRESHOLDS.warningErrorRate) {
      alerts.push({
        domain, severity: "warning",
        reason: `Taxa de erro elevada: ${(a.errorRate * 100).toFixed(0)}%`,
        metric: `${a.errorCount} erros / ${a.errorCount + a.successCount} total`,
      });
    }

    // High latency
    if (a.avgLatency >= THRESHOLDS.criticalLatencyMs) {
      alerts.push({
        domain, severity: "critical",
        reason: `Latência crítica: ${a.avgLatency}ms`,
        metric: `Máximo: ${a.maxLatency}ms`,
      });
    } else if (a.avgLatency >= THRESHOLDS.warningLatencyMs) {
      alerts.push({
        domain, severity: "warning",
        reason: `Latência elevada: ${a.avgLatency}ms`,
        metric: `Máximo: ${a.maxLatency}ms`,
      });
    }

    // Trend rising with high base
    if (a.trend === "up" && a.avgLatency > 1000) {
      alerts.push({
        domain, severity: "warning",
        reason: "Latência em tendência de alta",
        metric: `${a.avgLatency}ms avg, tendência ↑`,
      });
    }
  }

  // Sort: critical first
  alerts.sort((a, b) => (a.severity === "critical" ? 0 : 1) - (b.severity === "critical" ? 0 : 1));
  return alerts;
}

export function DegradationAlerts() {
  const analytics = useSyncExternalStore(
    domainAnalyticsStore.subscribe,
    domainAnalyticsStore.getSnapshot
  );

  const alerts = useMemo(() => analyzeDegradation(analytics), [analytics]);
  const hasData = Object.keys(analytics).length > 0;

  if (!hasData) {
    return (
      <div className="flex flex-col items-center py-8 gap-2 text-muted-foreground/40">
        <ShieldAlert className="h-5 w-5" />
        <p className="text-xs font-mono">Acumulando métricas para detecção de degradação...</p>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-3 py-4 px-4 rounded-lg border border-status-online/20 bg-status-online/5">
        <CheckCircle2 className="h-4 w-4 text-status-online" />
        <div>
          <p className="text-xs font-medium text-foreground">Nenhuma degradação detectada</p>
          <p className="text-[10px] font-mono text-muted-foreground/50">
            {Object.keys(analytics).length} domínios monitorados — todos dentro dos limiares
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert, i) => (
        <div
          key={`${alert.domain}-${alert.reason}-${i}`}
          className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${
            alert.severity === "critical"
              ? "border-status-critical/30 bg-status-critical/5"
              : "border-status-warning/30 bg-status-warning/5"
          }`}
        >
          <div className="mt-0.5 shrink-0">
            {alert.severity === "critical" ? (
              <AlertTriangle className="h-4 w-4 text-status-critical" />
            ) : (
              <TrendingUp className="h-4 w-4 text-status-warning" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/50">
                {DOMAIN_LABELS[alert.domain] || alert.domain}
              </span>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                alert.severity === "critical"
                  ? "bg-status-critical/10 text-status-critical"
                  : "bg-status-warning/10 text-status-warning"
              }`}>
                {alert.severity}
              </span>
            </div>
            <p className="text-xs font-medium text-foreground">{alert.reason}</p>
            <p className="text-[10px] font-mono text-muted-foreground/40 mt-0.5">
              <Clock className="h-3 w-3 inline mr-1" />{alert.metric}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
