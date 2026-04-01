import { Activity, AlertTriangle, CheckCircle2, XCircle, Calendar, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimelinePageData } from "@/domains/timeline/types";

export function TimelineSummary({ data }: { data: TimelinePageData }) {
  const { summary } = data;
  const cards = [
    { label: "Total", value: summary.total, icon: Radio, accent: "text-foreground" },
    { label: "Em Andamento", value: summary.running, icon: Activity, accent: "text-status-online" },
    { label: "Concluídos", value: summary.completed, icon: CheckCircle2, accent: "text-primary" },
    { label: "Falhas", value: summary.failed, icon: XCircle, accent: "text-status-critical" },
    { label: "Agendados", value: summary.scheduled, icon: Calendar, accent: "text-muted-foreground" },
    { label: "Atenção", value: summary.critical, icon: AlertTriangle, accent: "text-status-warning" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-lg border border-border/40 bg-card px-4 py-3 flex items-center gap-3">
          <c.icon className={cn("h-4 w-4 shrink-0", c.accent)} />
          <div>
            <p className="text-lg font-bold text-foreground leading-none">{c.value}</p>
            <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider mt-0.5">{c.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
