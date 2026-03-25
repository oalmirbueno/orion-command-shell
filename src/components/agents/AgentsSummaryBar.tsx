import { Bot, Zap, Pause, WifiOff, Crown, Cpu } from "lucide-react";

const MOCK_SUMMARY = [
  { label: "Total", value: 10, icon: Bot, color: "text-foreground", dotClass: "bg-foreground/30" },
  { label: "Ativos", value: 6, icon: Zap, color: "text-status-online", dotClass: "status-online" },
  { label: "Ociosos", value: 3, icon: Pause, color: "text-muted-foreground", dotClass: "bg-muted-foreground/40" },
  { label: "Offline", value: 1, icon: WifiOff, color: "text-status-critical", dotClass: "status-critical" },
  { label: "Orquestrador", value: 1, icon: Crown, color: "text-primary", dotClass: "bg-primary/50" },
  { label: "Tokens Hoje", value: "758k", icon: Cpu, color: "text-foreground", dotClass: "bg-foreground/30" },
];

export function AgentsSummaryBar() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-border/30 rounded-xl overflow-hidden border border-border/50">
      {MOCK_SUMMARY.map((m) => {
        const Icon = m.icon;
        return (
          <div key={m.label} className="bg-card px-6 py-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-surface-2 border border-border/50 flex items-center justify-center">
              <Icon className={`h-5 w-5 ${m.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground leading-none">{m.value}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <div className={`status-dot ${m.dotClass}`} />
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/60">{m.label}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
