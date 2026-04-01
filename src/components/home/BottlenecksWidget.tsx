/**
 * BottlenecksWidget — Analytics de gargalos operacionais.
 * Mostra domínios com maior latência, taxa de erro e tendência.
 */

import { useSyncExternalStore } from "react";
import { domainAnalyticsStore, type DomainAnalytics } from "@/services/domainAnalytics";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Activity, Zap } from "lucide-react";
import { useDomainHealth, type DomainKey } from "@/hooks/useDomainHealth";

const DOMAIN_LABELS: Record<string, string> = {
  system: "Sistema", sessions: "Sessões", agents: "Agentes",
  cron: "Cron", alerts: "Alertas", operations: "Operações",
  activity: "Atividade", memory: "Memória", files: "Arquivos", home: "Home",
};

const TrendIcon = ({ trend }: { trend: "up" | "down" | "stable" }) => {
  if (trend === "up") return <TrendingUp className="h-3 w-3 text-status-critical" />;
  if (trend === "down") return <TrendingDown className="h-3 w-3 text-status-online" />;
  return <Minus className="h-3 w-3 text-muted-foreground/40" />;
};

function MiniSparkline({ values, color = "text-primary" }: { values: number[]; color?: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={w} height={h} className={`${color} opacity-60`}>
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BottlenecksWidget() {
  const analytics = useSyncExternalStore(
    domainAnalyticsStore.subscribe,
    domainAnalyticsStore.getSnapshot
  );
  const health = useDomainHealth();

  const bottlenecks = domainAnalyticsStore.getBottlenecks();
  const hasData = bottlenecks.length > 0;

  // Calculate global stats
  const allAnalytics = Object.values(analytics);
  const globalAvgLatency = allAnalytics.length > 0
    ? Math.round(allAnalytics.reduce((a, b) => a + b.avgLatency, 0) / allAnalytics.length)
    : 0;
  const globalErrors = allAnalytics.reduce((a, b) => a + b.errorCount, 0);
  const globalSuccess = allAnalytics.reduce((a, b) => a + b.successCount, 0);

  return (
    <section className="rounded-lg border border-border overflow-hidden h-full">
      <div className="orion-panel-header">
        <div className="flex items-center gap-3">
          <div className="w-6 h-0.5 bg-primary/40 rounded-full" />
          <h2 className="orion-panel-title">Gargalos & Tendências</h2>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-muted-foreground/40" />
          <span className="text-[10px] font-mono text-muted-foreground/40">
            {health.liveCount}/{health.totalTracked} live
          </span>
        </div>
      </div>

      {!hasData ? (
        <div className="orion-empty">
          <div className="orion-empty-icon">
            <Zap className="h-5 w-5 text-muted-foreground/30" />
          </div>
          <p className="orion-empty-title">Acumulando métricas...</p>
          <p className="orion-empty-subtitle">Dados de latência e erro aparecerão após os primeiros fetches</p>
        </div>
      ) : (
        <>
          {/* Global summary */}
          <div className="grid grid-cols-3 gap-3 px-5 py-3 border-b border-border/30">
            <div className="text-center">
              <p className="text-lg font-bold font-mono text-foreground">{globalAvgLatency}<span className="text-[10px] text-muted-foreground/50">ms</span></p>
              <p className="text-[9px] font-mono uppercase text-muted-foreground/40">Latência média</p>
            </div>
            <div className="text-center">
              <p className={`text-lg font-bold font-mono ${globalErrors > 0 ? "text-status-critical" : "text-status-online"}`}>{globalErrors}</p>
              <p className="text-[9px] font-mono uppercase text-muted-foreground/40">Erros</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold font-mono text-status-online">{globalSuccess}</p>
              <p className="text-[9px] font-mono uppercase text-muted-foreground/40">Sucessos</p>
            </div>
          </div>

          {/* Per-domain breakdown */}
          <div className="divide-y divide-border/20">
            {bottlenecks.slice(0, 6).map(({ domain, analytics: a }) => (
              <div key={domain} className="flex items-center gap-3 px-5 py-3 hover:bg-accent/10 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">
                      {DOMAIN_LABELS[domain] || domain}
                    </span>
                    <TrendIcon trend={a.trend} />
                    {a.errorRate > 0.3 && (
                      <AlertTriangle className="h-3 w-3 text-status-warning" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] font-mono text-muted-foreground/50">
                      {a.avgLatency}ms avg
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground/30">
                      {a.maxLatency}ms max
                    </span>
                    {a.errorCount > 0 && (
                      <span className="text-[10px] font-mono text-status-critical/60">
                        {a.errorCount} erros
                      </span>
                    )}
                  </div>
                </div>
                <MiniSparkline
                  values={[...a.recentLatencies].reverse()}
                  color={a.trend === "up" ? "text-status-warning" : a.trend === "down" ? "text-status-online" : "text-primary"}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
