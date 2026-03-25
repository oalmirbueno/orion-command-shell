import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from "lucide-react";

const MOCK = [
  { label: "Critical", value: 2, icon: AlertCircle, text: "text-status-critical", dot: "status-critical" },
  { label: "Warning", value: 5, icon: AlertTriangle, text: "text-status-warning", dot: "status-warning" },
  { label: "Info", value: 8, icon: Info, text: "text-primary", dot: "bg-primary/50" },
  { label: "Resolved", value: 41, icon: CheckCircle2, text: "text-status-online", dot: "status-online" },
];

export function AlertsSummary() {
  const hasCritical = MOCK[0].value > 0;

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-px rounded-lg overflow-hidden border ${hasCritical ? "bg-status-critical/10 border-status-critical/30" : "bg-border/30 border-border/50"}`}>
      {MOCK.map((m, i) => {
        const Icon = m.icon;
        const isCriticalCell = i === 0 && m.value > 0;
        return (
          <div key={m.label} className={`px-5 py-4 flex items-center gap-4 ${isCriticalCell ? "bg-status-critical/8" : "bg-card"}`}>
            <div className={`w-9 h-9 rounded-lg border border-border/50 flex items-center justify-center ${isCriticalCell ? "bg-status-critical/10 border-status-critical/25" : "bg-surface-2"}`}>
              <Icon className={`h-4 w-4 ${m.text}`} />
            </div>
            <div>
              <p className={`text-lg font-semibold leading-none ${isCriticalCell ? "text-status-critical" : "text-foreground"}`}>{m.value}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className={`status-dot ${m.dot} ${isCriticalCell ? "animate-pulse-glow" : ""}`} />
                <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60">{m.label}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
