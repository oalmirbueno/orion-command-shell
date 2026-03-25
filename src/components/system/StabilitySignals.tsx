import { AlertTriangle, ThermometerSun, HardDrive, Wifi, Clock, ShieldAlert } from "lucide-react";

type SignalLevel = "normal" | "elevated" | "critical";

interface Signal {
  label: string;
  value: string;
  level: SignalLevel;
  icon: React.ElementType;
  detail?: string;
}

const MOCK_SIGNALS: Signal[] = [
  { label: "Load Average", value: "1.24", level: "normal", icon: ThermometerSun, detail: "1m: 1.24 · 5m: 1.18 · 15m: 1.02" },
  { label: "Disk I/O", value: "42 MB/s", level: "normal", icon: HardDrive, detail: "Read: 28 MB/s · Write: 14 MB/s" },
  { label: "Network", value: "156 Mbps", level: "normal", icon: Wifi, detail: "In: 98 Mbps · Out: 58 Mbps" },
  { label: "Eventos OOM", value: "0", level: "normal", icon: ShieldAlert, detail: "Últimas 24h · Sem kills" },
  { label: "Swap Usage", value: "0.2 GB", level: "normal", icon: HardDrive, detail: "8 GB total · 7.8 GB free" },
  { label: "Process Count", value: "247", level: "elevated", icon: Clock, detail: "Acima da média de 210" },
];

const levelConfig = {
  normal: { bg: "bg-primary/5", border: "border-primary/15", text: "text-primary", dot: "bg-primary/50" },
  elevated: { bg: "bg-status-warning/5", border: "border-status-warning/15", text: "text-status-warning", dot: "status-warning" },
  critical: { bg: "bg-status-critical/5", border: "border-status-critical/15", text: "text-status-critical", dot: "status-critical" },
};

export function StabilitySignals() {
  const hasIssues = MOCK_SIGNALS.some(s => s.level !== "normal");

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
          Sinais de Estabilidade
        </h2>
        {!hasIssues ? (
          <div className="flex items-center gap-2 ml-2 px-3 py-1 rounded-full bg-status-online/10 border border-status-online/20">
            <span className="text-xs font-mono text-status-online font-medium">Estável</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 ml-2 px-3 py-1 rounded-full bg-status-warning/10 border border-status-warning/20">
            <span className="text-xs font-mono text-status-warning font-medium">Atenção</span>
          </div>
        )}
        <div className="flex-1 h-px bg-border/40" />
      </div>

      <div className="space-y-3">
        {MOCK_SIGNALS.map((signal) => {
          const cfg = levelConfig[signal.level];
          const Icon = signal.icon;

          return (
            <div
              key={signal.label}
              className={`flex items-center gap-4 px-5 py-4 rounded-xl border ${cfg.border} ${cfg.bg} hover:bg-accent/30 transition-colors`}
            >
              <Icon className="h-5 w-5 text-muted-foreground/50 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-medium text-foreground">{signal.label}</span>
                  <div className={`status-dot ${cfg.dot}`} />
                </div>
                {signal.detail && (
                  <p className="text-xs font-mono text-muted-foreground/40 mt-1 truncate">{signal.detail}</p>
                )}
              </div>
              <span className={`text-sm font-mono font-semibold ${cfg.text} shrink-0`}>{signal.value}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
