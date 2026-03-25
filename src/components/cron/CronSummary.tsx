import { CheckCircle2, XCircle, Timer, Ban } from "lucide-react";

const MOCK = [
  { label: "Jobs Ativos", value: 9, icon: Timer, text: "text-status-online", dot: "status-online" },
  { label: "Saudáveis", value: 7, icon: CheckCircle2, text: "text-status-online", dot: "status-online" },
  { label: "Falhas", value: 1, icon: XCircle, text: "text-status-critical", dot: "status-critical" },
  { label: "Desabilitados", value: 2, icon: Ban, text: "text-muted-foreground", dot: "bg-muted-foreground/40" },
];

export function CronSummary() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border/30 rounded-xl overflow-hidden border border-border/50">
      {MOCK.map((m) => {
        const Icon = m.icon;
        return (
          <div key={m.label} className="bg-card px-6 py-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-surface-2 border border-border/50 flex items-center justify-center">
              <Icon className={`h-5 w-5 ${m.text}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground leading-none">{m.value}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <div className={`status-dot ${m.dot}`} />
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/60">{m.label}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
