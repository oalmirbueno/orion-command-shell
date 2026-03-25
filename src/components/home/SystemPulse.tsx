import { AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";

type Status = "online" | "warning" | "critical" | "neutral";
type Trend = "up" | "down" | "stable";

interface SystemPulseMetric {
  label: string;
  value: string;
  status: Status;
  trend?: Trend;
  detail?: string;
}

const MOCK_METRICS: SystemPulseMetric[] = [
  { label: "Uptime", value: "99.97%", status: "online", trend: "stable", detail: "30d rolling" },
  { label: "Latência P95", value: "42ms", status: "online", trend: "down", detail: "< 50ms target" },
  { label: "Missões Ativas", value: "12", status: "online", trend: "up" },
  { label: "Taxa de Erro", value: "0.03%", status: "online", trend: "stable", detail: "< 0.1% target" },
  { label: "Agentes Online", value: "8/8", status: "online", trend: "stable" },
  { label: "Fila Pendente", value: "3", status: "warning", trend: "up", detail: "acima do normal" },
];

const TrendIcon = ({ trend }: { trend?: Trend }) => {
  if (trend === "up") return <TrendingUp className="h-3 w-3 text-status-online" />;
  if (trend === "down") return <TrendingDown className="h-3 w-3 text-primary" />;
  return <Minus className="h-3 w-3 text-muted-foreground/40" />;
};

export function SystemPulse() {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
          Pulso do Sistema
        </h2>
        <div className="flex-1 h-px bg-border/40" />
        <span className="text-[10px] font-mono text-primary animate-pulse-glow">● AO VIVO</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-border/30 rounded-lg overflow-hidden border border-border/50">
        {MOCK_METRICS.map((m) => (
          <div key={m.label} className="bg-card p-4 flex flex-col gap-2">
            <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/70">{m.label}</span>
            <div className="flex items-end gap-1.5">
              <span className="text-lg font-semibold text-foreground leading-none">{m.value}</span>
              <TrendIcon trend={m.trend} />
            </div>
            {m.detail && (
              <span className="text-[9px] font-mono text-muted-foreground/50">{m.detail}</span>
            )}
            <div className={`h-0.5 w-full rounded-full mt-auto ${m.status === "warning" ? "bg-status-warning/40" : m.status === "critical" ? "bg-status-critical/40" : "bg-primary/20"}`} />
          </div>
        ))}
      </div>
    </section>
  );
}
