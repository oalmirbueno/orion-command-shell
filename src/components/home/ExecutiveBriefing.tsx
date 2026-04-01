import { useNavigate } from "react-router-dom";
import { useSyncExternalStore } from "react";
import { FileText, Clock, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { domainAnalyticsStore } from "@/services/domainAnalytics";
import { useDomainHealth } from "@/hooks/useDomainHealth";
import type { BriefingItem } from "@/domains/activity/types";

interface ExecutiveBriefingProps {
  items: BriefingItem[];
}

const TREND_LABELS: Record<string, { icon: React.ElementType; label: string; cls: string }> = {
  up:     { icon: TrendingUp,   label: "↑ Subindo",  cls: "text-status-warning" },
  down:   { icon: TrendingDown, label: "↓ Descendo", cls: "text-status-online" },
  stable: { icon: Minus,        label: "→ Estável",  cls: "text-muted-foreground/50" },
};

function TrendBadge({ trend }: { trend: "up" | "down" | "stable" }) {
  const cfg = TREND_LABELS[trend];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded ${cfg.cls}`}>
      <Icon className="h-2.5 w-2.5" /> {cfg.label}
    </span>
  );
}

export function ExecutiveBriefing({ items = [] }: ExecutiveBriefingProps) {
  const navigate = useNavigate();
  const health = useDomainHealth();
  const analytics = useSyncExternalStore(
    domainAnalyticsStore.subscribe,
    domainAnalyticsStore.getSnapshot
  );

  // Build operational snapshot
  const allAnalytics = Object.values(analytics);
  const globalAvgLatency = allAnalytics.length > 0
    ? Math.round(allAnalytics.reduce((a, b) => a + b.avgLatency, 0) / allAnalytics.length)
    : null;
  const globalTrend: "up" | "down" | "stable" = (() => {
    if (allAnalytics.length === 0) return "stable";
    const upCount = allAnalytics.filter(a => a.trend === "up").length;
    const downCount = allAnalytics.filter(a => a.trend === "down").length;
    if (upCount > downCount + 1) return "up";
    if (downCount > upCount + 1) return "down";
    return "stable";
  })();

  return (
    <section className="rounded-lg border border-border overflow-hidden h-full">
      <div className="orion-panel-header cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => navigate("/timeline")}>
        <div className="flex items-center gap-3">
          <div className="w-6 h-0.5 bg-muted-foreground/40 rounded-full" />
          <h2 className="orion-panel-title">Log Operacional</h2>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <>
              <FileText className="h-4 w-4 text-muted-foreground/40" />
              <span className="text-xs font-mono text-muted-foreground/40">{items.length} registros</span>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
        </div>
      </div>

      {/* Operational summary strip */}
      <div className="flex items-center gap-4 px-5 py-2.5 border-b border-border/20 surface-2">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/40">Domínios</span>
          <span className="text-xs font-mono font-semibold text-foreground">
            {health.liveCount}/{health.totalTracked}
          </span>
        </div>
        <div className="w-px h-4 bg-border/30" />
        {globalAvgLatency !== null && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/40">Latência</span>
              <span className={`text-xs font-mono font-semibold ${globalAvgLatency > 5000 ? "text-status-warning" : "text-foreground"}`}>
                {globalAvgLatency}ms
              </span>
            </div>
            <div className="w-px h-4 bg-border/30" />
          </>
        )}
        <TrendBadge trend={globalTrend} />
      </div>

      {items.length === 0 ? (
        <div className="px-5 py-6 text-center flex flex-col items-center">
          <Clock className="h-5 w-5 text-muted-foreground/20 mb-2" />
          <p className="text-sm text-muted-foreground/50 font-mono">Sem registros recentes</p>
          <p className="text-[10px] font-mono text-muted-foreground/25 mt-1">Eventos aparecerão conforme o sistema operar</p>
        </div>
      ) : (
        <div className="divide-y divide-border/20 max-h-[360px] overflow-y-auto">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex gap-5 px-5 py-4 hover:bg-accent/15 transition-colors cursor-pointer"
              onClick={() => navigate("/activity")}
            >
              <div className="flex flex-col items-center pt-0.5 shrink-0">
                <span className="text-xs font-mono text-primary/60 font-semibold">{item.time}</span>
                {i < items.length - 1 && <div className="w-px flex-1 bg-border/25 mt-2" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground/80 leading-relaxed">{item.content}</p>
                <p className="text-xs font-mono text-muted-foreground/40 mt-1.5">{item.source}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
