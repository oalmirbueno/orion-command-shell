import { Clock, ArrowRight } from "lucide-react";

interface ActiveSession {
  id: string;
  name: string;
  type: string;
  status: "running" | "paused" | "finishing";
  progress: number;
  elapsed: string;
}

const MOCK_SESSIONS: ActiveSession[] = [
  { id: "1", name: "Ingestão Batch — Cluster A", type: "Pipeline", status: "running", progress: 73, elapsed: "14min" },
  { id: "2", name: "Classificação de leads Q1", type: "Mission", status: "running", progress: 41, elapsed: "32min" },
  { id: "3", name: "Sync CRM → Data Lake", type: "Automation", status: "running", progress: 88, elapsed: "8min" },
  { id: "4", name: "Reprocessamento de eventos", type: "Pipeline", status: "paused", progress: 22, elapsed: "1h12" },
];

const statusLabel = {
  running: { text: "Em execução", color: "text-status-online" },
  paused: { text: "Pausado", color: "text-status-warning" },
  finishing: { text: "Finalizando", color: "text-primary" },
};

export function ActiveSessions() {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
          Sessões Ativas
        </h2>
        <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
          <span className="text-[9px] font-mono text-primary font-medium">{MOCK_SESSIONS.filter(s => s.status === "running").length} running</span>
        </div>
        <div className="flex-1 h-px bg-border/40" />
      </div>

      <div className="rounded-lg border border-border/50 overflow-hidden">
        <div className="grid grid-cols-[1fr_100px_80px_60px_60px] gap-2 px-4 py-2 bg-surface-2 text-[9px] font-mono uppercase tracking-wider text-muted-foreground/50">
          <span>Nome</span>
          <span>Tipo</span>
          <span>Status</span>
          <span>Progresso</span>
          <span className="text-right">Tempo</span>
        </div>
        {MOCK_SESSIONS.map((session) => {
          const st = statusLabel[session.status];
          return (
            <div
              key={session.id}
              className="grid grid-cols-[1fr_100px_80px_60px_60px] gap-2 px-4 py-3 border-t border-border/30 items-center hover:bg-accent/30 transition-colors cursor-pointer group"
            >
              <span className="text-xs text-foreground truncate">{session.name}</span>
              <span className="text-[10px] font-mono text-muted-foreground">{session.type}</span>
              <span className={`text-[10px] font-mono ${st.color}`}>{st.text}</span>
              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-1 bg-surface-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${session.status === "paused" ? "bg-status-warning/60" : "bg-primary/70"}`}
                    style={{ width: `${session.progress}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono text-muted-foreground/50">{session.progress}%</span>
              </div>
              <div className="flex items-center justify-end gap-1">
                <Clock className="h-3 w-3 text-muted-foreground/30" />
                <span className="text-[10px] font-mono text-muted-foreground/50">{session.elapsed}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
