import { Flame, Pause, CheckCircle2, XCircle } from "lucide-react";

const MOCK = [
  { label: "Running", value: 5, icon: Flame, dot: "status-online", text: "text-status-online" },
  { label: "Paused", value: 2, icon: Pause, dot: "status-warning", text: "text-status-warning" },
  { label: "Completed", value: 34, icon: CheckCircle2, dot: "bg-primary/50", text: "text-primary" },
  { label: "Failed", value: 1, icon: XCircle, dot: "status-critical", text: "text-status-critical" },
];

export function SessionsSummary() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border/30 rounded-lg overflow-hidden border border-border/50">
      {MOCK.map((m) => {
        const Icon = m.icon;
        return (
          <div key={m.label} className="bg-card px-5 py-4 flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg bg-surface-2 border border-border/50 flex items-center justify-center">
              <Icon className={`h-4 w-4 ${m.text}`} />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground leading-none">{m.value}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className={`status-dot ${m.dot}`} />
                <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60">{m.label}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
