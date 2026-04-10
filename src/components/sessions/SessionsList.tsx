import { useState } from "react";
import { Bot, Clock, ChevronRight, Cpu, Flame, Pause, CheckCircle2, XCircle, Inbox } from "lucide-react";
import type { SessionView, SessionStatus } from "@/domains/sessions/types";
import { SessionDetailSheet } from "@/components/sheets/SessionDetailSheet";

const statusConfig: Record<SessionStatus, { icon: React.ElementType; dot: string; text: string; bg: string; border: string; label: string }> = {
  running: { icon: Flame, dot: "status-online", text: "text-status-online", bg: "bg-status-online/[0.03]", border: "border-l-status-online", label: "Em execução" },
  paused: { icon: Pause, dot: "status-warning", text: "text-status-warning", bg: "bg-status-warning/[0.03]", border: "border-l-status-warning", label: "Pausada" },
  completed: { icon: CheckCircle2, dot: "bg-primary/40", text: "text-primary/60", bg: "", border: "border-l-primary/20", label: "Concluída" },
  failed: { icon: XCircle, dot: "status-critical", text: "text-status-critical", bg: "bg-status-critical/[0.03]", border: "border-l-status-critical", label: "Falha" },
};

const typeBadge: Record<string, string> = {
  direct: "Direta",
  group: "Grupo",
  pipeline: "Pipeline",
  cron: "Cron",
  classification: "Classificação",
  enrichment: "Enriquecimento",
  sync: "Sincronização",
  analysis: "Análise",
  export: "Exportação",
  routing: "Roteamento",
};

function SessionRow({ session, onClick }: { session: SessionView; onClick: () => void }) {
  const cfg = statusConfig[session.status];
  const Icon = cfg.icon;
  const isDimmed = session.status === "completed";
  const typeLabel = typeBadge[session.type] || session.typeLabel || session.type;

  return (
    <div onClick={onClick} className={`border border-border/30 rounded-lg hover:bg-accent/20 transition-all cursor-pointer border-l-[3px] ${cfg.border} ${cfg.bg} ${isDimmed ? "opacity-40 hover:opacity-60" : ""} group`}>
      <div className="px-5 py-4">
        {/* Title row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${session.status === "running" ? "bg-status-online/8 border-status-online/15" : "bg-surface-2 border-border/30"}`}>
              <Icon className={`h-3.5 w-3.5 ${cfg.text}`} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">{session.title}</h3>
              <p className="text-[11px] text-muted-foreground/35 mt-0.5 truncate">{session.preview}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <div className={`status-dot ${cfg.dot}`} />
            <span className={`text-[10px] font-mono ${cfg.text}`}>{cfg.label}</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/10 group-hover:text-muted-foreground/30 transition-colors" />
          </div>
        </div>

        {/* Progress */}
        <div className="ml-[42px] mb-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-surface-3 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${session.status === "failed" ? "bg-status-critical/50" : session.status === "paused" ? "bg-status-warning/40" : session.status === "completed" ? "bg-primary/30" : "bg-primary"}`} style={{ width: `${session.progress}%` }} />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground/30 w-8 text-right">{session.progress}%</span>
          </div>
        </div>

        {/* Metadata row — compact */}
        <div className="flex items-center gap-3 ml-[42px] text-[10px] font-mono text-muted-foreground/35">
          <span className="px-1.5 py-0.5 rounded border border-border/20 bg-muted/10 text-muted-foreground/45">{typeLabel}</span>
          <span className="flex items-center gap-1"><Cpu className="h-3 w-3" />{session.model}</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{session.elapsed}</span>
          <span>{session.tokens} tok</span>
          <span className="ml-auto text-muted-foreground/20">{session.startedAt}</span>
        </div>
      </div>
    </div>
  );
}

interface Props { sessions: SessionView[]; }

export function SessionsList({ sessions = [] }: Props) {
  const [selected, setSelected] = useState<SessionView | null>(null);

  if (sessions.length === 0) {
    return (
      <section className="rounded-lg border border-border overflow-hidden">
        <div className="orion-panel-header">
          <div className="flex items-center gap-3">
            <div className="w-6 h-0.5 bg-muted-foreground/40 rounded-full" />
            <h2 className="orion-panel-title">Sessões</h2>
          </div>
        </div>
        <div className="orion-empty">
          <div className="orion-empty-icon"><Inbox className="h-5 w-5 text-muted-foreground/30" /></div>
          <p className="orion-empty-title">Nenhuma sessão registrada</p>
          <p className="orion-empty-subtitle">Aguardando conexão com API</p>
        </div>
      </section>
    );
  }

  const order: Record<SessionStatus, number> = { running: 0, paused: 1, failed: 2, completed: 3 };
  const sorted = [...sessions].sort((a, b) => order[a.status] - order[b.status]);
  const runningCount = sessions.filter(s => s.status === "running").length;
  const failedCount = sessions.filter(s => s.status === "failed").length;

  // Group by agent
  const byAgent = new Map<string, SessionView[]>();
  for (const s of sorted) {
    const key = s.agent || "—";
    if (!byAgent.has(key)) byAgent.set(key, []);
    byAgent.get(key)!.push(s);
  }

  const groupEntries = [...byAgent.entries()].sort((a, b) => {
    const aRun = a[1].some(s => s.status === "running");
    const bRun = b[1].some(s => s.status === "running");
    if (aRun && !bRun) return -1;
    if (!aRun && bRun) return 1;
    return 0;
  });

  return (
    <section className="rounded-lg border border-border overflow-hidden">
      <div className="orion-panel-header">
        <div className="flex items-center gap-3">
          <div className={`w-6 h-0.5 rounded-full ${runningCount > 0 ? "bg-status-online" : "bg-muted-foreground/40"}`} />
          <h2 className="orion-panel-title">Sessões</h2>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          {runningCount > 0 && <span className="text-status-online font-medium">{runningCount} ativas</span>}
          {failedCount > 0 && <span className="text-status-critical font-medium">{failedCount} falhas</span>}
          <span className="text-muted-foreground/25">{sessions.length} total</span>
        </div>
      </div>
      <div className="max-h-[calc(100vh-280px)] overflow-y-auto orion-thin-scroll">
        {groupEntries.map(([agentName, agentSessions]) => (
          <div key={agentName}>
            <div className="flex items-center gap-2 px-4 py-1.5 bg-surface-2/30 border-b border-border/10">
              <Bot className="h-3 w-3 text-muted-foreground/25" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/30 font-medium">{agentName}</span>
              <span className="text-[9px] font-mono text-muted-foreground/18">{agentSessions.length}</span>
              <div className="flex-1 h-px bg-border/10" />
            </div>
            <div className="space-y-1.5 p-1.5">
              {agentSessions.map((session) => (
                <SessionRow key={session.id} session={session} onClick={() => setSelected(session)} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <SessionDetailSheet session={selected} open={!!selected} onOpenChange={(o) => !o && setSelected(null)} />
    </section>
  );
}
