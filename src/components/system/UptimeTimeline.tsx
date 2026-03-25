type DayStatus = "up" | "degraded" | "down" | "partial";

interface UptimeDay {
  date: string;
  status: DayStatus;
}

// Generate 90 days of mock uptime
const generateDays = (): UptimeDay[] => {
  const days: UptimeDay[] = [];
  const today = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(5, 10);
    // Mostly up, occasional degraded
    let status: DayStatus = "up";
    if (i === 45) status = "degraded";
    if (i === 67) status = "partial";
    if (i === 72) status = "degraded";
    days.push({ date: dateStr, status });
  }
  return days;
};

const MOCK_DAYS = generateDays();

const statusColor: Record<DayStatus, string> = {
  up: "bg-primary/50 hover:bg-primary/70",
  degraded: "bg-status-warning/60 hover:bg-status-warning/80",
  down: "bg-status-critical/60 hover:bg-status-critical/80",
  partial: "bg-status-warning/40 hover:bg-status-warning/60",
};

export function UptimeTimeline() {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
          Uptime · Last 90 Days
        </h2>
        <div className="flex-1 h-px bg-border/40" />
        <span className="text-[10px] font-mono text-foreground">99.97%</span>
      </div>

      <div className="rounded-lg border border-border/50 bg-card p-4">
        <div className="flex gap-[3px] flex-wrap">
          {MOCK_DAYS.map((day, i) => (
            <div
              key={i}
              className={`w-2 h-6 rounded-sm transition-colors cursor-pointer ${statusColor[day.status]}`}
              title={`${day.date}: ${day.status}`}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/30">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm bg-primary/50" />
            <span className="text-[9px] font-mono text-muted-foreground/50">Operational</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm bg-status-warning/60" />
            <span className="text-[9px] font-mono text-muted-foreground/50">Degraded</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm bg-status-critical/60" />
            <span className="text-[9px] font-mono text-muted-foreground/50">Down</span>
          </div>
          <div className="flex-1" />
          <span className="text-[9px] font-mono text-muted-foreground/40">90 days ago → Today</span>
        </div>
      </div>
    </section>
  );
}
