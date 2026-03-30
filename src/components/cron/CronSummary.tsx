import { CheckCircle2, XCircle, Timer, Ban } from "lucide-react";
import type { CronSummaryData } from "@/domains/cron/types";

interface Props {
  summary: CronSummaryData;
}

export function CronSummary({ summary }: Props) {
  if (!summary) return null;
  const isEmpty = summary.active + summary.failed + summary.disabled === 0;

  const items = [
    { label: "Jobs Ativos", value: summary.active, icon: Timer, text: "text-status-online", dot: "status-online" },
    { label: "Saudáveis", value: summary.healthy, icon: CheckCircle2, text: "text-status-online", dot: "status-online" },
    { label: "Falhas", value: summary.failed, icon: XCircle, text: "text-status-critical", dot: "status-critical" },
    { label: "Desabilitados", value: summary.disabled, icon: Ban, text: "text-muted-foreground", dot: "bg-muted-foreground/40" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border/30 rounded-lg overflow-hidden border border-border/50">
      {items.map((m) => {
        const Icon = m.icon;
        return (
          <div key={m.label} className="bg-card px-6 py-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${isEmpty ? "bg-surface-2 border-border/40" : "bg-surface-2 border-border/50"}`}>
              <Icon className={`h-5 w-5 ${isEmpty ? "text-muted-foreground/25" : m.text}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold leading-none ${isEmpty ? "text-muted-foreground/20" : "text-foreground"}`}>{m.value}</p>
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
