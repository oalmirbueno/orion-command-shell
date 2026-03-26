import { Bot, Clock, ChevronRight, Cpu, Flame, Pause, CheckCircle2, XCircle, Inbox } from "lucide-react";
import type { SessionView, SessionStatus, SessionType } from "@/domains/sessions/types";

const statusConfig: Record<SessionStatus, { icon: React.ElementType; dot: string; text: string; bg: string; border: string; statusLabel: string }> = {
  running: { icon: Flame, dot: "status-online", text: "text-status-online", bg: "bg-status-online/[0.04]", border: "border-l-status-online", statusLabel: "Em execução" },
  paused: { icon: Pause, dot: "status-warning", text: "text-status-warning", bg: "bg-status-warning/[0.04]", border: "border-l-status-warning", statusLabel: "Pausada" },
  completed: { icon: CheckCircle2, dot: "bg-primary/50", text: "text-primary", bg: "", border: "border-l-primary/30", statusLabel: "Concluída" },
  failed: { icon: XCircle, dot: "status-critical", text: "text-status-critical", bg: "bg-status-critical/[0.04]", border: "border-l-status-critical", statusLabel: "Falha" },
};

const typeBadge: Record<SessionType, { label: string; color: string }> = {
  classification: { label: "Classificação", color: "bg-primary/10 text-primary border-primary/20" },
  enrichment: { label: "Enriquecimento", color: "bg-status-info/10 text-status-info border-status-info/20" },
  sync: { label: "Sincronização", color: "bg-status-online/10 text-status-online border-status-online/20" },
  analysis: { label: "Análise", color: "bg-status-warning/10 text-status-warning border-status-warning/20" },
  export: { label: "Exportação", color: "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20" },
  routing: { label: "Roteamento", color: "bg-primary/10 text-primary border-primary/20" },
};

function SessionRow({ session }: { session: SessionView }) {
  const cfg = statusConfig[session.status];
  const badge = typeBadge[session.type];
  const Icon = cfg.icon;
  const isLive = session.status === "running";
  const isDimmed = session.status === "completed";

  return (
    <div className={`border border-border/40 rounded-lg bg-card hover:bg-accent/20 transition-all cursor-pointer border-l-[3px] ${cfg.border} ${cfg.bg} ${isDimmed ? "opacity-50 hover:opacity-70" : ""} group`}>
      <div className="px-6 py-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${isLive ? "bg-status-online/10 border-status-online/20" : "bg-surface-2 border-border/40"}`}>
              <Icon className={`h-4 w-4 ${cfg.text}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h3 className="text-sm font-semibold text-foreground truncate">{session.title}</h3>
                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border shrink-0 ${badge.color}`}>{badge.label}</span>
              </div>
              <p className="text-xs text-foreground/50 mt-1 truncate">{session.preview}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-4">
            <div className="flex items-center gap-2">
              <div className={`status-dot ${cfg.dot}`} />
              <span className={`text-xs font-mono uppercase font-medium ${cfg.text}`}>{cfg.statusLabel}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/15 group-hover:text-muted-foreground/40 transition-colors" />
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4 ml-12">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  session.status === "failed" ? "bg-status-critical/60" :
                  session.status === "paused" ? "bg-status-warning/50" :
                  session.status === "completed" ? "bg-primary/40" :
                  "bg-primary"
                }`}
                style={{ width: `${session.progress}%` }}
              />
            </div>
            <span className="text-xs font-mono text-muted-foreground/40 w-9 text-right">{session.progress}%</span>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 ml-12 text-xs font-mono text-muted-foreground/50">
          <div className="flex items-center gap-1.5"><Bot className="h-3.5 w-3.5" /><span>{session.agent}</span></div>
          <div className="w-px h-3 bg-border/30" />
          <div className="flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5" /><span>{session.model}</span></div>
          <div className="w-px h-3 bg-border/30" />
          <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /><span>{session.elapsed}</span></div>
          <div className="w-px h-3 bg-border/30" />
          <span>{session.tokens} tokens</span>
          <span className="ml-auto text-muted-foreground/30">Início {session.startedAt}</span>
        </div>
      </div>
    </div>
  );
}

interface Props {
  sessions: SessionView[];
}

export function SessionsList({ sessions }: Props) {
  if (sessions.length === 0) {
    return (
      <section className="rounded-lg border border-border overflow-hidden">
        <div className="orion-panel-header">
          <div className="flex items-center gap-3">
            <div className="w-6 h-0.5 bg-muted-foreground/40 rounded-full" />
            <h2 className="orion-panel-title">Registro de Sessões</h2>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-lg bg-surface-2 border border-border flex items-center justify-center mb-4">
            <Inbox className="h-6 w-6 text-muted-foreground/30" />
          </div>
          <p className="text-sm font-medium text-muted-foreground/50">Nenhuma sessão registrada</p>
          <p className="text-xs font-mono text-muted-foreground/30 mt-1.5">Aguardando conexão com API</p>
        </div>
      </section>
    );
  }

  const order: Record<SessionStatus, number> = { running: 0, paused: 1, failed: 2, completed: 3 };
  const sorted = [...sessions].sort((a, b) => order[a.status] - order[b.status]);
  const runningCount = sessions.filter(s => s.status === "running").length;

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">Registro de Sessões</h2>
        {runningCount > 0 && (
          <div className="flex items-center gap-2 ml-2 px-3 py-1 rounded-full bg-status-online/10 border border-status-online/20">
            <span className="text-xs font-mono text-status-online font-semibold">{runningCount} em execução</span>
          </div>
        )}
        <div className="flex-1 h-px bg-border/40" />
        <span className="text-xs font-mono text-muted-foreground/40">{sessions.length} total</span>
      </div>

      <div className="space-y-2.5">
        {sorted.map((session) => (
          <SessionRow key={session.id} session={session} />
        ))}
      </div>
    </section>
  );
}
