import { Zap, AlertTriangle, CheckCircle2, Info } from "lucide-react";

const MOCK = [
  { label: "Total Hoje", value: 142, icon: Zap, text: "text-foreground", dot: "bg-foreground/30" },
  { label: "Crítico", value: 3, icon: AlertTriangle, text: "text-status-critical", dot: "status-critical" },
  { label: "Atenção", value: 8, icon: AlertTriangle, text: "text-status-warning", dot: "status-warning" },
  { label: "Resolvido", value: 131, icon: CheckCircle2, text: "text-status-online", dot: "status-online" },
];

export function ActivitySummary() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border/30 rounded-lg overflow-hidden border border-border/60">
      {MOCK.map((m) => {
        const Icon = m.icon;
        return (
          <div key={m.label} className="bg-card px-6 py-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-surface-2 border border-border/60 flex items-center justify-center">
              <Icon className={`h-5 w-5 ${m.text}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground leading-none">{m.value}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <div className={`status-dot ${m.dot}`} />
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/60">{m.label}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
