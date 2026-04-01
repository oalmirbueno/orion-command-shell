/**
 * TrendsDashboard — Painel de tendências históricas por domínio.
 * Consulta domain_metrics persistidos no Supabase.
 * Fallback honesto sem Supabase.
 */

import { useState, useEffect, useCallback } from "react";
import { useDomainMetrics, type DomainMetricRecord } from "@/hooks/useDomainMetrics";
import { TrendingUp, TrendingDown, Minus, BarChart3, RefreshCw, Inbox } from "lucide-react";

const DOMAIN_LABELS: Record<string, string> = {
  system: "Sistema", sessions: "Sessões", agents: "Agentes",
  cron: "Cron", alerts: "Alertas", operations: "Operações",
  activity: "Atividade", memory: "Memória", files: "Arquivos", home: "Home",
};

const TrendIcon = ({ trend }: { trend: string }) => {
  if (trend === "up") return <TrendingUp className="h-3 w-3 text-status-critical" />;
  if (trend === "down") return <TrendingDown className="h-3 w-3 text-status-online" />;
  return <Minus className="h-3 w-3 text-muted-foreground/40" />;
};

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return <span className="text-[9px] text-muted-foreground/30">—</span>;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 100;
  const h = 28;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={w} height={h} className="text-primary opacity-60">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface DomainTrend {
  domain: string;
  records: DomainMetricRecord[];
  latest: DomainMetricRecord | null;
}

export function TrendsDashboard() {
  const { fetchHistory, fetchLatest, mode } = useDomainMetrics();
  const [trends, setTrends] = useState<DomainTrend[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [days, setDays] = useState(7);

  const load = useCallback(async () => {
    if (mode !== "supabase") return;
    setLoading(true);
    try {
      const latest = await fetchLatest();
      const domains = [...new Set(latest.map(r => r.domain))];
      const allTrends: DomainTrend[] = [];

      const histories = await Promise.allSettled(
        domains.map(d => fetchHistory(d, { days }))
      );

      domains.forEach((domain, i) => {
        const result = histories[i];
        const records = result.status === "fulfilled" ? result.value : [];
        const latestRec = latest.find(r => r.domain === domain) ?? null;
        allTrends.push({ domain, records, latest: latestRec });
      });

      // Sort by latest avg latency descending
      allTrends.sort((a, b) => (b.latest?.avg_latency_ms ?? 0) - (a.latest?.avg_latency_ms ?? 0));
      setTrends(allTrends);
    } catch (err) {
      console.warn("[trends] erro:", err);
    } finally {
      setLoading(false);
    }
  }, [mode, fetchHistory, fetchLatest, days]);

  useEffect(() => { load(); }, [load]);

  if (mode !== "supabase") {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground/50">
        <BarChart3 className="h-6 w-6" />
        <p className="text-xs font-mono">Tendências indisponíveis — Supabase não configurado</p>
        <p className="text-[10px] font-mono text-muted-foreground/30">Configure as variáveis de ambiente e execute 005_domain_metrics.sql</p>
      </div>
    );
  }

  const selected = selectedDomain ? trends.find(t => t.domain === selectedDomain) : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Tendências por Domínio</h3>
          <span className="text-[10px] font-mono text-muted-foreground/40">{trends.length} domínios</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            className="text-[10px] font-mono bg-surface-2 border border-border rounded px-2 py-1 text-muted-foreground"
          >
            <option value={1}>24h</option>
            <option value={7}>7 dias</option>
            <option value={14}>14 dias</option>
            <option value={30}>30 dias</option>
          </select>
          <button onClick={load} className="p-1.5 rounded hover:bg-accent/40 transition-colors" title="Atualizar">
            <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-surface-2 animate-pulse" />
          ))}
        </div>
      ) : trends.length === 0 ? (
        <div className="flex flex-col items-center py-12 gap-2 text-muted-foreground/40">
          <Inbox className="h-5 w-5" />
          <p className="text-xs font-mono">Nenhuma métrica persistida ainda</p>
          <p className="text-[10px] text-muted-foreground/30">Snapshots serão registrados automaticamente</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {trends.map(t => (
            <button
              key={t.domain}
              onClick={() => setSelectedDomain(t.domain === selectedDomain ? null : t.domain)}
              className={`rounded-lg border p-4 text-left transition-colors hover:bg-accent/10 ${
                t.domain === selectedDomain ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">
                    {DOMAIN_LABELS[t.domain] || t.domain}
                  </span>
                  {t.latest && <TrendIcon trend={t.latest.trend} />}
                </div>
                {t.latest && (
                  <span className="text-[10px] font-mono text-muted-foreground/50">
                    {t.latest.avg_latency_ms}ms avg
                  </span>
                )}
              </div>
              <Sparkline values={t.records.map(r => r.avg_latency_ms)} />
              {t.latest && (
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[9px] font-mono text-muted-foreground/40">
                    {t.latest.success_count} ok
                  </span>
                  {t.latest.error_count > 0 && (
                    <span className="text-[9px] font-mono text-status-critical/60">
                      {t.latest.error_count} erros
                    </span>
                  )}
                  <span className="text-[9px] font-mono text-muted-foreground/30">
                    {t.records.length} pontos
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Detail panel */}
      {selected && selected.records.length > 0 && (
        <div className="rounded-lg border border-primary/20 bg-card p-4 space-y-3">
          <h4 className="text-xs font-semibold text-foreground">
            {DOMAIN_LABELS[selected.domain] || selected.domain} — Últimos {days} dias
          </h4>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {selected.records.slice(-20).reverse().map(r => (
              <div key={r.id} className="flex items-center justify-between py-1.5 px-2 text-[10px] font-mono hover:bg-accent/10 rounded transition-colors">
                <span className="text-muted-foreground/60">
                  {new Date(r.recorded_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-foreground">{r.avg_latency_ms}ms</span>
                  <TrendIcon trend={r.trend} />
                  {r.error_count > 0 && <span className="text-status-critical">{r.error_count}err</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
