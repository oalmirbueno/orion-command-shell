import { Brain, Layers, Clock, Database } from "lucide-react";

const MOCK = [
  { label: "Snapshots", value: 24, icon: Layers, text: "text-primary", dot: "bg-primary/50" },
  { label: "Categories", value: 6, icon: Brain, text: "text-foreground", dot: "bg-foreground/30" },
  { label: "Last Capture", value: "4min", icon: Clock, text: "text-status-online", dot: "status-online" },
  { label: "Total Size", value: "1.8MB", icon: Database, text: "text-muted-foreground", dot: "bg-muted-foreground/40" },
];

export function MemorySummary() {
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
