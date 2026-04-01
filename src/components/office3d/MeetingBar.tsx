/**
 * Office 3D — Meeting control bar (HTML overlay)
 */
import { X, Users, Play, Square } from "lucide-react";
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

export function MeetingBar({ agents, allAgents, onAddAgent, onRemoveAgent, onDismiss }: Props) {
  const notInMeeting = allAgents.filter(a => !agents.find(m => m.id === a.id) && a.status !== "offline");

  return (
    <div className="absolute left-4 bottom-4 right-4 z-[60] animate-in slide-in-from-bottom-4 fade-in-0 duration-200">
      <div className="bg-card/95 backdrop-blur-xl border border-status-warning/30 rounded-xl shadow-2xl px-4 py-3">
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-4 w-4 text-status-warning" />
          <span className="text-xs font-semibold text-foreground">Sala de Reunião</span>
          <Badge variant="outline" className="text-[10px] font-mono border-status-warning/30 text-status-warning">
            {agents.length} agente{agents.length !== 1 ? "s" : ""}
          </Badge>
          <div className="flex-1" />
          <Button size="sm" variant="outline" onClick={onDismiss} className="h-7 text-xs gap-1.5">
            <Square className="h-3 w-3" /> Encerrar
          </Button>
        </div>

        {/* Convened agents */}
        <div className="flex flex-wrap gap-1.5 mb-2">
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

        {/* Quick add */}
        {notInMeeting.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1 border-t border-border/20">
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
    </div>
  );
}
