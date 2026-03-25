import { Zap, AlertTriangle, CheckCircle2 } from "lucide-react";

interface ActivitySummaryProps {
  summary: {
    total: number;
    critical: number;
    warning: number;
    resolved: number;
  };
}

const FIELDS = [
  { key: "total" as const, label: "Total Hoje", icon: Zap, text: "text-foreground", dot: "bg-foreground/30" },
  { key: "critical" as const, label: "Crítico", icon: AlertTriangle, text: "text-status-critical", dot: "status-critical" },
  { key: "warning" as const, label: "Atenção", icon: AlertTriangle, text: "text-status-warning", dot: "status-warning" },
  { key: "resolved" as const, label: "Resolvido", icon: CheckCircle2, text: "text-status-online", dot: "status-online" },
];

export function ActivitySummary({ summary }: ActivitySummaryProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border/30 rounded-lg overflow-hidden border border-border/60">
      {FIELDS.map((m) => {
        const Icon = m.icon;
        return (
          <div key={m.key} className="bg-card px-6 py-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-surface-2 border border-border/60 flex items-center justify-center">
              <Icon className={`h-5 w-5 ${m.text}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground leading-none">{summary[m.key]}</p>
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
