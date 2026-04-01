/**
 * Office 3D — Agent Command Panel (HTML overlay)
 * Rich interaction panel when clicking an agent in the 3D office.
 * Supports task delegation, status view, history, and navigation.
 */
import { useState } from "react";
import { X, Send, RotateCcw, Eye, Clock, Zap, ArrowRight, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiUrl } from "@/domains/api";
import { toast } from "@/hooks/use-toast";
import type { AgentView } from "@/domains/agents/types";

const TIER_LABEL: Record<string, string> = { orchestrator: "Orquestrador", core: "Núcleo", support: "Suporte" };
const STATUS_CFG: Record<string, { label: string; cls: string; dot: string }> = {
  active:  { label: "Trabalhando", cls: "text-status-online",    dot: "bg-status-online" },
  idle:    { label: "Disponível",  cls: "text-status-warning",   dot: "bg-status-warning" },
  offline: { label: "Offline",     cls: "text-muted-foreground", dot: "bg-muted-foreground/40" },
};

interface Props {
  agent: AgentView;
  onClose: () => void;
  onOpenDetail: (agent: AgentView) => void;
  onConveneToMeeting: (agent: AgentView) => void;
}

export function AgentCommandPanel({ agent, onClose, onOpenDetail, onConveneToMeeting }: Props) {
  const [taskInput, setTaskInput] = useState("");
  const [sending, setSending] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const sc = STATUS_CFG[agent.status] || STATUS_CFG.idle;

  const handleSendTask = async () => {
    if (!taskInput.trim()) return;
    setSending(true);
    try {
      const res = await fetch(apiUrl(`/agents/${agent.id}/task`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: taskInput.trim() }),
      });
      if (!res.ok) throw new Error();
      toast({ title: `Tarefa delegada para ${agent.name}` });
      setTaskInput("");
    } catch {
      toast({ title: "Erro ao delegar tarefa", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleRestart = async () => {
    setRestarting(true);
    try {
      const res = await fetch(apiUrl(`/agents/${agent.id}/restart`), { method: "POST" });
      if (!res.ok) throw new Error();
      toast({ title: `${agent.name} reiniciado` });
    } catch {
      toast({ title: "Erro ao reiniciar", variant: "destructive" });
    } finally {
      setRestarting(false);
    }
  };

  return (
    <div className="absolute right-4 top-4 z-[60] w-80 animate-in slide-in-from-right-4 fade-in-0 duration-200">
      <div className="bg-card/95 backdrop-blur-xl border border-border/60 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border/30 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary">
            {agent.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{agent.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
              <span className={`text-[10px] font-mono ${sc.cls}`}>{sc.label}</span>
              <span className="text-[10px] text-muted-foreground/30">·</span>
              <span className="text-[10px] font-mono text-muted-foreground/50">{TIER_LABEL[agent.tier]}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground/40 hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Current state */}
        <div className="px-4 py-3 space-y-2 border-b border-border/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">Tarefa atual</span>
            {agent.currentTaskAge !== "—" && (
              <span className="text-[10px] font-mono text-muted-foreground/30 flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" /> {agent.currentTaskAge}
              </span>
            )}
          </div>
          <p className="text-xs text-foreground/80">
            {agent.currentTask === "Sem tarefa ativa" ? (
              <span className="text-muted-foreground/40 italic">Nenhuma tarefa ativa</span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Zap className="h-3 w-3 text-primary/60 shrink-0" />
                {agent.currentTask}
              </span>
            )}
          </p>

          {/* Metrics row */}
          <div className="flex gap-3 pt-1">
            <div className="text-center">
              <p className="text-[10px] font-mono text-muted-foreground/40">Carga</p>
              <p className="text-xs font-semibold text-foreground/70">{agent.load}%</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-mono text-muted-foreground/40">Sessões</p>
              <p className="text-xs font-semibold text-foreground/70">{agent.sessions}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-mono text-muted-foreground/40">Tokens</p>
              <p className="text-xs font-semibold text-foreground/70">{agent.tokensToday}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-mono text-muted-foreground/40">Uptime</p>
              <p className="text-xs font-semibold text-foreground/70">{agent.availability}</p>
            </div>
          </div>
        </div>

        {/* Task delegation */}
        <div className="px-4 py-3 border-b border-border/20">
          <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider mb-2">Delegar tarefa</p>
          <div className="flex gap-2">
            <input
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendTask()}
              placeholder="Descreva a tarefa..."
              className="flex-1 text-xs bg-background/50 border border-border/30 rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/40 transition-colors"
            />
            <Button
              size="sm"
              onClick={handleSendTask}
              disabled={sending || !taskInput.trim()}
              className="h-8 w-8 p-0"
            >
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 space-y-1.5">
          <button
            onClick={() => onOpenDetail(agent)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-foreground/70 hover:bg-primary/5 hover:text-foreground transition-colors"
          >
            <Eye className="h-3.5 w-3.5 text-muted-foreground/50" />
            Ver detalhes completos
            <ArrowRight className="h-3 w-3 ml-auto text-muted-foreground/30" />
          </button>
          <button
            onClick={handleRestart}
            disabled={restarting}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-foreground/70 hover:bg-primary/5 hover:text-foreground transition-colors disabled:opacity-40"
          >
            {restarting ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/50" /> : <RotateCcw className="h-3.5 w-3.5 text-muted-foreground/50" />}
            {restarting ? "Reiniciando…" : "Reiniciar agente"}
          </button>
          <button
            onClick={() => onConveneToMeeting(agent)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-foreground/70 hover:bg-status-warning/5 hover:text-foreground transition-colors"
          >
            <Users className="h-3.5 w-3.5 text-status-warning/60" />
            Convocar para reunião
          </button>
        </div>
      </div>
    </div>
  );
}
