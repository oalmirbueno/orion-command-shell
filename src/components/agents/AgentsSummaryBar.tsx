import { Bot, Zap, Pause, WifiOff } from "lucide-react";

const MOCK_SUMMARY = [
  { label: "Total", value: 10, icon: Bot, color: "text-foreground", dotClass: "bg-foreground/30" },
  { label: "Ativos", value: 6, icon: Zap, color: "text-status-online", dotClass: "status-online" },
  { label: "Ociosos", value: 3, icon: Pause, color: "text-muted-foreground", dotClass: "bg-muted-foreground/40" },
  { label: "Offline", value: 1, icon: WifiOff, color: "text-status-critical", dotClass: "status-critical" },
];

export function AgentsSummaryBar() {
  return (
    <div className="orion-summary-grid grid-cols-2 sm:grid-cols-4">
      {MOCK_SUMMARY.map((m) => {
        const Icon = m.icon;
        return (
          <div key={m.label} className="orion-summary-cell">
            <div className="orion-icon-box">
              <Icon className={`h-4 w-4 ${m.color}`} />
            </div>
            <div>
              <p className="orion-metric-value">{m.value}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className={`status-dot ${m.dotClass}`} />
                <span className="orion-metric-label">{m.label}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
