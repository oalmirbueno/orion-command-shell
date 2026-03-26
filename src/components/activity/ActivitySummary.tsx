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
  const isEmpty = summary.total === 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border/30 rounded-lg overflow-hidden border border-border/50">
      {FIELDS.map((m) => {
        const Icon = m.icon;
        return (
          <div key={m.key} className="bg-card px-6 py-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${isEmpty ? "bg-surface-2 border-border/40" : "bg-surface-2 border-border/50"}`}>
              <Icon className={`h-5 w-5 ${isEmpty ? "text-muted-foreground/25" : m.text}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold leading-none ${isEmpty ? "text-muted-foreground/20" : "text-foreground"}`}>{summary[m.key]}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <div className={`status-dot ${isEmpty ? "bg-muted-foreground/15" : m.dot}`} />
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/50">{m.label}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
