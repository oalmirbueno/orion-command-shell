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
  { label: "OOM Events", value: "0", level: "normal", icon: ShieldAlert, detail: "Last 24h · No kills" },
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
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
          Stability Signals
        </h2>
        {!hasIssues ? (
          <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full bg-status-online/10 border border-status-online/20">
            <span className="text-[9px] font-mono text-status-online font-medium">Stable</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full bg-status-warning/10 border border-status-warning/20">
            <span className="text-[9px] font-mono text-status-warning font-medium">Attention</span>
          </div>
        )}
        <div className="flex-1 h-px bg-border/40" />
      </div>

      <div className="space-y-2">
        {MOCK_SIGNALS.map((signal) => {
          const cfg = levelConfig[signal.level];
          const Icon = signal.icon;

          return (
            <div
              key={signal.label}
              className={`flex items-center gap-3 px-4 py-3 rounded-md border ${cfg.border} ${cfg.bg} hover:bg-accent/30 transition-colors`}
            >
              <Icon className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-foreground">{signal.label}</span>
                  <div className={`status-dot ${cfg.dot}`} />
                </div>
                {signal.detail && (
                  <p className="text-[9px] font-mono text-muted-foreground/40 mt-0.5 truncate">{signal.detail}</p>
                )}
              </div>
              <span className={`text-xs font-mono font-medium ${cfg.text} shrink-0`}>{signal.value}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
