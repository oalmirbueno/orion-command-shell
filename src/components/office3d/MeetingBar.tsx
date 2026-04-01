/**
 * Office 3D — Meeting control bar (HTML overlay)
 * Shows meeting agenda auto-generated from convened agents.
 */
import { useState } from "react";
import { X, Users, ChevronDown, ChevronUp, AlertTriangle, Zap, Clock, Target, MessageSquare, StickyNote, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AgentView } from "@/domains/agents/types";

interface Props {
  agents: AgentView[];
  allAgents: AgentView[];
  onAddAgent: (agent: AgentView) => void;
  onRemoveAgent: (agentId: string) => void;
  onDismiss: () => void;
}

/* ── Auto-generate agenda from agent data ── */
function buildAgenda(agents: AgentView[]) {
  const items: { icon: "task" | "alert" | "idle" | "collab"; agent: string; text: string }[] = [];

  agents.forEach(a => {
    // Active tasks
    if (a.currentTask && a.currentTask !== "Sem tarefa ativa") {
      items.push({ icon: "task", agent: a.name, text: a.currentTask });
    }
    // Alerts
    if (a.alertCount > 0) {
      items.push({ icon: "alert", agent: a.name, text: `${a.alertCount} alerta${a.alertCount > 1 ? "s" : ""} pendente${a.alertCount > 1 ? "s" : ""}` });
    }
    // Idle agents — point of discussion
    if (a.status === "idle") {
      items.push({ icon: "idle", agent: a.name, text: "Disponível para nova alocação" });
    }
  });

  // Collaboration opportunities between convened agents
  const ids = new Set(agents.map(a => a.id));
  agents.forEach(a => {
    const linked = [...(a.dependsOn || []), ...(a.feeds || [])].filter(id => ids.has(id));
    if (linked.length > 0) {
      const names = linked.map(id => agents.find(x => x.id === id)?.name).filter(Boolean);
      items.push({ icon: "collab", agent: a.name, text: `Conectado com ${names.join(", ")}` });
    }
  });

  return items;
}

const ICON_MAP = {
  task: <Zap className="h-3 w-3 text-primary shrink-0" />,
  alert: <AlertTriangle className="h-3 w-3 text-status-error shrink-0" />,
  idle: <Clock className="h-3 w-3 text-muted-foreground/60 shrink-0" />,
  collab: <Target className="h-3 w-3 text-amber-400 shrink-0" />,
};

/* ── Meeting Notes component ── */
function MeetingNotes() {
  const [notes, setNotes] = useState<{ id: number; text: string; done: boolean }[]>([]);
  const [draft, setDraft] = useState("");

  const addNote = () => {
    const trimmed = draft.trim().slice(0, 500);
    if (!trimmed) return;
    setNotes(prev => [...prev, { id: Date.now(), text: trimmed, done: false }]);
    setDraft("");
  };

  return (
    <div className="border border-border/30 rounded-lg bg-background/30">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/20">
        <StickyNote className="h-3.5 w-3.5 text-primary" />
        <span className="text-[11px] font-semibold text-foreground/80 uppercase tracking-wider">Notas & Decisões</span>
        <span className="text-[10px] font-mono text-muted-foreground/40 ml-auto">{notes.length}</span>
      </div>
      <div className="p-3 space-y-2">
        {notes.length > 0 && (
          <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin">
            {notes.map(n => (
              <div key={n.id} className="flex items-start gap-2 group">
                <button onClick={() => setNotes(prev => prev.map(x => x.id === n.id ? { ...x, done: !x.done } : x))}
                  className={`mt-0.5 w-3.5 h-3.5 rounded border shrink-0 transition-colors ${n.done ? "bg-primary border-primary" : "border-border/40 hover:border-primary/50"}`}
                />
                <p className={`text-[11px] leading-tight flex-1 ${n.done ? "line-through text-muted-foreground/40" : "text-foreground/80"}`}>{n.text}</p>
                <button onClick={() => setNotes(prev => prev.filter(x => x.id !== n.id))}
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Trash2 className="h-3 w-3 text-muted-foreground/30 hover:text-status-error/60" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-1.5">
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addNote()}
            placeholder="Registrar decisão ou ação..."
            maxLength={500}
            className="flex-1 text-[11px] bg-background/50 border border-border/30 rounded px-2 py-1.5 text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/40"
          />
          <button onClick={addNote} className="px-2 py-1.5 rounded bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors">
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function MeetingBar({ agents, allAgents, onAddAgent, onRemoveAgent, onDismiss }: Props) {
  const [expanded, setExpanded] = useState(true);
  const notInMeeting = allAgents.filter(a => !agents.find(m => m.id === a.id) && a.status !== "offline");
  const agenda = buildAgenda(agents);

  return (
    <div className="absolute left-4 bottom-4 right-4 z-[60] animate-in slide-in-from-bottom-4 fade-in-0 duration-200">
      <div className="bg-card/95 backdrop-blur-xl border border-status-warning/30 rounded-xl shadow-2xl max-h-[70vh] overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 sticky top-0 bg-card/95 backdrop-blur-xl z-10 border-b border-border/20">
          <Users className="h-4 w-4 text-status-warning" />
          <span className="text-xs font-semibold text-foreground">Sala de Reunião</span>
          <Badge variant="outline" className="text-[10px] font-mono border-status-warning/30 text-status-warning">
            {agents.length} agente{agents.length !== 1 ? "s" : ""}
          </Badge>
          <div className="flex-1" />
          <button onClick={() => setExpanded(e => !e)} className="text-muted-foreground/50 hover:text-foreground transition-colors p-1">
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
          <Button size="sm" variant="outline" onClick={onDismiss} className="h-7 text-xs gap-1.5">
            <X className="h-3 w-3" /> Encerrar
          </Button>
        </div>

        {expanded && (
          <div className="px-4 py-3 space-y-3">
            {/* Convened agents */}
            <div className="flex flex-wrap gap-1.5">
              {agents.map(a => (
                <button
                  key={a.id}
                  onClick={() => onRemoveAgent(a.id)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-status-warning/10 border border-status-warning/20 text-xs text-foreground/70 hover:bg-status-warning/20 transition-colors"
                >
                  <span className="font-medium">{a.name}</span>
                  <X className="h-2.5 w-2.5 text-muted-foreground/40" />
                </button>
              ))}
            </div>

            {/* ── AGENDA / PAUTA ── */}
            {agents.length > 0 && (
              <div className="border border-border/30 rounded-lg bg-background/30">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-border/20">
                  <MessageSquare className="h-3.5 w-3.5 text-status-warning" />
                  <span className="text-[11px] font-semibold text-foreground/80 uppercase tracking-wider">Pauta da Reunião</span>
                  <span className="text-[10px] font-mono text-muted-foreground/40 ml-auto">{agenda.length} pontos</span>
                </div>
                <div className="p-3 space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
                  {agenda.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground/40 text-center py-2">Nenhum ponto de pauta — agentes sem tarefas ou alertas ativos</p>
                  ) : (
                    agenda.map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        {ICON_MAP[item.icon]}
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-semibold text-foreground/60">{item.agent}</span>
                          <p className="text-[11px] text-foreground/80 leading-tight truncate">{item.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ── NOTAS / DECISÕES ── */}
            {agents.length > 0 && <MeetingNotes />}

            {/* Quick add */}
            {notInMeeting.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2 border-t border-border/20">
                <span className="text-[10px] text-muted-foreground/40 self-center mr-1">Adicionar:</span>
                {notInMeeting.slice(0, 8).map(a => (
                  <button
                    key={a.id}
                    onClick={() => onAddAgent(a)}
                    className="px-2 py-0.5 rounded text-[10px] font-mono text-muted-foreground/50 hover:text-foreground hover:bg-primary/5 transition-colors"
                  >
                    + {a.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
