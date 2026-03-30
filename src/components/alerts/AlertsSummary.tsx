import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import type { AlertsSummaryData } from "@/domains/alerts/types";

interface Props {
  summary: AlertsSummaryData;
}

const CELLS = [
  { key: "critical" as const, label: "Crítico", icon: AlertCircle, text: "text-status-critical", dot: "status-critical" },
  { key: "warning" as const, label: "Atenção", icon: AlertTriangle, text: "text-status-warning", dot: "status-warning" },
  { key: "info" as const, label: "Info", icon: Info, text: "text-primary", dot: "bg-primary/50" },
  { key: "resolved" as const, label: "Resolvido", icon: CheckCircle2, text: "text-status-online", dot: "status-online" },
];

export function AlertsSummary({ summary }: Props) {
  if (!summary) return null;
  const isEmpty = summary.critical + summary.warning + summary.info + summary.resolved === 0;
  const hasCritical = summary.critical > 0;

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-px rounded-lg overflow-hidden border ${hasCritical ? "bg-status-critical/10 border-status-critical/25" : "bg-border/30 border-border/50"}`}>
      {CELLS.map((cell) => {
        const Icon = cell.icon;
        const value = summary[cell.key];
        const isCriticalCell = cell.key === "critical" && value > 0;
        return (
          <div key={cell.key} className={`px-6 py-5 flex items-center gap-4 ${isCriticalCell ? "bg-status-critical/[0.06]" : "bg-card"}`}>
            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${isCriticalCell ? "bg-status-critical/10 border-status-critical/20" : isEmpty ? "bg-surface-2 border-border/40" : "bg-surface-2 border-border/50"}`}>
              <Icon className={`h-5 w-5 ${isEmpty ? "text-muted-foreground/25" : cell.text}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold leading-none ${isEmpty ? "text-muted-foreground/20" : isCriticalCell ? "text-status-critical" : "text-foreground"}`}>{value}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <div className={`status-dot ${isEmpty ? "bg-muted-foreground/15" : cell.dot}`} />
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/50">{cell.label}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
