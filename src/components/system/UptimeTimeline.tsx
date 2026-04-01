import { Inbox } from "lucide-react";
import type { UptimeDay, DayStatus } from "@/domains/system/types";

const statusColor: Record<DayStatus, string> = {
  up: "bg-primary/40 hover:bg-primary/60",
  degraded: "bg-status-warning/50 hover:bg-status-warning/70",
  down: "bg-status-critical/50 hover:bg-status-critical/70",
  partial: "bg-status-warning/30 hover:bg-status-warning/50",
};

interface Props {
  days: UptimeDay[];
  uptimePercent: string;
}

export function UptimeTimeline({ days = [], uptimePercent = "—" }: Props) {
  if (days.length === 0) {
    return (
      <section className="rounded-lg border border-border overflow-hidden">
        <div className="orion-panel-header">
          <div className="flex items-center gap-3">
            <div className="w-6 h-0.5 bg-muted-foreground/40 rounded-full" />
            <h2 className="orion-panel-title">Disponibilidade · 90 Dias</h2>
          </div>
        </div>
        <div className="orion-empty">
          <div className="orion-empty-icon">
            <Inbox className="h-5 w-5 text-muted-foreground/30" />
          </div>
          <p className="orion-empty-title">Histórico não disponível</p>
          <p className="orion-empty-subtitle">Dados de uptime serão coletados ao longo do tempo</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">Disponibilidade · 90 Dias</h2>
        <div className="flex-1 h-px bg-border/40" />
        <span className="text-sm font-mono font-semibold text-foreground">{uptimePercent}</span>
      </div>

      <div className="rounded-lg border border-border/40 bg-card p-5">
        <div className="flex gap-0.5 flex-wrap">
          {days.map((day, i) => (
            <div
              key={i}
              className={`w-2.5 h-7 rounded-sm transition-colors cursor-pointer ${statusColor[day.status]}`}
              title={`${day.date}: ${day.status}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-5 mt-4 pt-3 border-t border-border/20">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-primary/40" />
            <span className="text-[10px] font-mono text-muted-foreground/40">Operacional</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-status-warning/50" />
            <span className="text-[10px] font-mono text-muted-foreground/40">Degradado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-status-critical/50" />
            <span className="text-[10px] font-mono text-muted-foreground/40">Fora do ar</span>
          </div>
          <div className="flex-1" />
          <span className="text-[10px] font-mono text-muted-foreground/25">90 dias atrás → Hoje</span>
        </div>
      </div>
    </section>
  );
}
