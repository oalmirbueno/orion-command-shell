import { Bot, Zap, Pause, WifiOff } from "lucide-react";

interface SummaryMetric {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  dotClass: string;
}

const MOCK_SUMMARY: SummaryMetric[] = [
  { label: "Total", value: 10, icon: Bot, color: "text-foreground", dotClass: "bg-foreground/30" },
  { label: "Active", value: 6, icon: Zap, color: "text-status-online", dotClass: "status-online" },
  { label: "Idle", value: 3, icon: Pause, color: "text-muted-foreground", dotClass: "bg-muted-foreground/40" },
  { label: "Offline", value: 1, icon: WifiOff, color: "text-status-critical", dotClass: "status-critical" },
];

export function AgentsSummaryBar() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border/30 rounded-lg overflow-hidden border border-border/50">
      {MOCK_SUMMARY.map((m) => {
        const Icon = m.icon;
        return (
          <div key={m.label} className="bg-card px-5 py-4 flex items-center gap-4">
            <div className={`w-9 h-9 rounded-lg bg-surface-2 border border-border/50 flex items-center justify-center`}>
              <Icon className={`h-4 w-4 ${m.color}`} />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground leading-none">{m.value}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className={`status-dot ${m.dotClass}`} />
                <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60">{m.label}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
