import type { UptimeDay, DayStatus } from "@/domains/system/types";

const statusColor: Record<DayStatus, string> = {
  up: "bg-primary/50 hover:bg-primary/70",
  degraded: "bg-status-warning/60 hover:bg-status-warning/80",
  down: "bg-status-critical/60 hover:bg-status-critical/80",
  partial: "bg-status-warning/40 hover:bg-status-warning/60",
};

interface Props {
  days: UptimeDay[];
  uptimePercent: string;
}

export function UptimeTimeline({ days, uptimePercent }: Props) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">Uptime · Últimos 90 Dias</h2>
        <div className="flex-1 h-px bg-border/40" />
        <span className="text-sm font-mono font-semibold text-foreground">{uptimePercent}</span>
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-6">
        <div className="flex gap-1 flex-wrap">
          {days.map((day, i) => (
            <div
              key={i}
              className={`w-3 h-8 rounded-sm transition-colors cursor-pointer ${statusColor[day.status]}`}
              title={`${day.date}: ${day.status}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-5 mt-4 pt-4 border-t border-border/30">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-primary/50" />
            <span className="text-xs font-mono text-muted-foreground/50">Operacional</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-status-warning/60" />
            <span className="text-xs font-mono text-muted-foreground/50">Degradado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-status-critical/60" />
            <span className="text-xs font-mono text-muted-foreground/50">Fora do ar</span>
          </div>
          <div className="flex-1" />
          <span className="text-xs font-mono text-muted-foreground/40">90 dias atrás → Hoje</span>
        </div>
      </div>
    </section>
  );
}
