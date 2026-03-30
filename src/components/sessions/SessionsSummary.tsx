import { Flame, Pause, CheckCircle2, XCircle } from "lucide-react";
import type { SessionView, SessionStatus } from "@/domains/sessions/types";

const CONFIG: { status: SessionStatus; label: string; icon: React.ElementType; dot: string; text: string }[] = [
  { status: "running", label: "Em Execução", icon: Flame, dot: "status-online", text: "text-status-online" },
  { status: "paused", label: "Pausadas", icon: Pause, dot: "status-warning", text: "text-status-warning" },
  { status: "completed", label: "Concluídas", icon: CheckCircle2, dot: "bg-primary/50", text: "text-primary" },
  { status: "failed", label: "Falhas", icon: XCircle, dot: "status-critical", text: "text-status-critical" },
];

interface Props {
  sessions: SessionView[];
}

export function SessionsSummary({ sessions = [] }: Props) {
  const counts: Record<SessionStatus, number> = { running: 0, paused: 0, completed: 0, failed: 0 };
  for (const s of sessions) counts[s.status]++;

  const isEmpty = sessions.length === 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border/30 rounded-lg overflow-hidden border border-border/50">
      {CONFIG.map((m) => {
        const Icon = m.icon;
        return (
          <div key={m.status} className="bg-card px-6 py-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${isEmpty ? "bg-surface-2 border-border/40" : "bg-surface-2 border-border/50"}`}>
              <Icon className={`h-5 w-5 ${isEmpty ? "text-muted-foreground/25" : m.text}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold leading-none ${isEmpty ? "text-muted-foreground/20" : "text-foreground"}`}>{counts[m.status]}</p>
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
