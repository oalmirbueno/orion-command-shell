import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from "lucide-react";

const MOCK = [
  { label: "Crítico", value: 2, icon: AlertCircle, text: "text-status-critical", dot: "status-critical" },
  { label: "Atenção", value: 5, icon: AlertTriangle, text: "text-status-warning", dot: "status-warning" },
  { label: "Info", value: 8, icon: Info, text: "text-primary", dot: "bg-primary/50" },
  { label: "Resolvido", value: 41, icon: CheckCircle2, text: "text-status-online", dot: "status-online" },
];

export function AlertsSummary() {
  const hasCritical = MOCK[0].value > 0;

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-px rounded-lg overflow-hidden border ${hasCritical ? "bg-status-critical/10 border-status-critical/30" : "bg-border/30 border-border/60"}`}>
      {MOCK.map((m, i) => {
        const Icon = m.icon;
        const isCriticalCell = i === 0 && m.value > 0;
        return (
          <div key={m.label} className={`px-6 py-5 flex items-center gap-4 ${isCriticalCell ? "bg-status-critical/8" : "bg-card"}`}>
            <div className={`w-11 h-11 rounded-lg border flex items-center justify-center ${isCriticalCell ? "bg-status-critical/10 border-status-critical/25" : "bg-surface-2 border-border/60"}`}>
              <Icon className={`h-5 w-5 ${m.text}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold leading-none ${isCriticalCell ? "text-status-critical" : "text-foreground"}`}>{m.value}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <div className={`status-dot ${m.dot} ${isCriticalCell ? "animate-pulse-glow" : ""}`} />
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/60">{m.label}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
