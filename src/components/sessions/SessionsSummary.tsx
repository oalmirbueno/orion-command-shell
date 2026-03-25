import { Flame, Pause, CheckCircle2, XCircle } from "lucide-react";

const MOCK = [
  { label: "Em Execução", value: 5, icon: Flame, dot: "status-online", text: "text-status-online" },
  { label: "Pausadas", value: 2, icon: Pause, dot: "status-warning", text: "text-status-warning" },
  { label: "Concluídas", value: 34, icon: CheckCircle2, dot: "bg-primary/50", text: "text-primary" },
  { label: "Falhas", value: 1, icon: XCircle, dot: "status-critical", text: "text-status-critical" },
];

export function SessionsSummary() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border/30 rounded-lg overflow-hidden border border-border/60">
      {MOCK.map((m) => {
        const Icon = m.icon;
        return (
          <div key={m.label} className="bg-card px-6 py-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-surface-2 border border-border/60 flex items-center justify-center">
              <Icon className={`h-5 w-5 ${m.text}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground leading-none">{m.value}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <div className={`status-dot ${m.dot}`} />
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/60">{m.label}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
