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
  const hasCritical = summary.critical > 0;

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-px rounded-lg overflow-hidden border ${hasCritical ? "bg-status-critical/10 border-status-critical/30" : "bg-border/30 border-border/60"}`}>
      {CELLS.map((cell) => {
        const Icon = cell.icon;
        const value = summary[cell.key];
        const isCriticalCell = cell.key === "critical" && value > 0;
        return (
          <div key={cell.key} className={`px-6 py-5 flex items-center gap-4 ${isCriticalCell ? "bg-status-critical/8" : "bg-card"}`}>
            <div className={`w-11 h-11 rounded-lg border flex items-center justify-center ${isCriticalCell ? "bg-status-critical/10 border-status-critical/25" : "bg-surface-2 border-border/60"}`}>
              <Icon className={`h-5 w-5 ${cell.text}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold leading-none ${isCriticalCell ? "text-status-critical" : "text-foreground"}`}>{value}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <div className={`status-dot ${cell.dot} ${isCriticalCell ? "animate-pulse-glow" : ""}`} />
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/60">{cell.label}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
