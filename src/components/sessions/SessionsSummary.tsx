import { Flame, Pause, CheckCircle2, XCircle } from "lucide-react";
import type { Session, SessionStatus } from "@/domains/sessions/types";

const CONFIG: { status: SessionStatus; label: string; icon: React.ElementType; dot: string; text: string }[] = [
  { status: "running", label: "Em Execução", icon: Flame, dot: "status-online", text: "text-status-online" },
  { status: "paused", label: "Pausadas", icon: Pause, dot: "status-warning", text: "text-status-warning" },
  { status: "completed", label: "Concluídas", icon: CheckCircle2, dot: "bg-primary/50", text: "text-primary" },
  { status: "failed", label: "Falhas", icon: XCircle, dot: "status-critical", text: "text-status-critical" },
];

interface Props {
  sessions: Session[];
}

export function SessionsSummary({ sessions }: Props) {
  const counts: Record<SessionStatus, number> = { running: 0, paused: 0, completed: 0, failed: 0 };
  for (const s of sessions) counts[s.status]++;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border/30 rounded-lg overflow-hidden border border-border/60">
      {CONFIG.map((m) => {
        const Icon = m.icon;
        return (
          <div key={m.status} className="bg-card px-6 py-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-surface-2 border border-border/60 flex items-center justify-center">
              <Icon className={`h-5 w-5 ${m.text}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground leading-none">{counts[m.status]}</p>
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
