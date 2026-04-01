/**
 * Office 3D — Squads Panel
 * Side panel showing active squads derived from agent dependsOn/feeds relationships.
 */
import { useMemo } from "react";
import { Users, Zap, X, ChevronRight } from "lucide-react";
import type { AgentView } from "@/domains/agents/types";
import { STATUS_VISUAL, TIER_COLORS } from "./OfficeLayout";

interface Squad {
  id: string;
  name: string;
  agents: AgentView[];
  activeCount: number;
  totalSessions: number;
}

function deriveSquads(agents: AgentView[]): Squad[] {
  // Build adjacency from dependsOn/feeds
  const adj = new Map<string, Set<string>>();
  agents.forEach(a => {
    if (!adj.has(a.id)) adj.set(a.id, new Set());
    [...(a.dependsOn || []), ...(a.feeds || [])].forEach(otherId => {
      adj.get(a.id)!.add(otherId);
      if (!adj.has(otherId)) adj.set(otherId, new Set());
      adj.get(otherId)!.add(a.id);
    });
  });

  // Find connected components (squads)
  const visited = new Set<string>();
  const squads: Squad[] = [];
  const agentMap = new Map(agents.map(a => [a.id, a]));

  agents.forEach(agent => {
    if (visited.has(agent.id)) return;
    const links = adj.get(agent.id);
    if (!links || links.size === 0) return; // solo agent, no squad

    // BFS to find component
    const component: string[] = [];
    const queue = [agent.id];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      component.push(id);
      adj.get(id)?.forEach(n => { if (!visited.has(n)) queue.push(n); });
    }

    if (component.length < 2) return;

    const squadAgents = component.map(id => agentMap.get(id)).filter(Boolean) as AgentView[];
    const activeCount = squadAgents.filter(a => a.status === "active").length;
    const totalSessions = squadAgents.reduce((s, a) => s + a.sessions, 0);

    // Name by highest-tier agent
    const lead = squadAgents.find(a => a.tier === "orchestrator") || squadAgents[0];
    squads.push({
      id: component.sort().join("-"),
      name: `Squad ${lead.name.split(" ")[0]}`,
      agents: squadAgents,
      activeCount,
      totalSessions,
    });
  });

  return squads.sort((a, b) => b.activeCount - a.activeCount);
}

interface Props {
  agents: AgentView[];
  open: boolean;
  onClose: () => void;
  onAgentClick?: (agent: AgentView) => void;
}

export function SquadsPanel({ agents, open, onClose, onAgentClick }: Props) {
  const squads = useMemo(() => deriveSquads(agents), [agents]);

  if (!open) return null;

  return (
    <div className="absolute right-3 top-3 bottom-3 z-[56] w-64 flex flex-col bg-card/90 backdrop-blur-xl border border-border/40 rounded-lg shadow-2xl animate-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/30">
        <Users className="h-3.5 w-3.5 text-amber-400/80" />
        <span className="text-xs font-semibold text-foreground/80 flex-1">Squads Ativos</span>
        <span className="text-[10px] font-mono text-muted-foreground/40">{squads.length}</span>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-muted/30 transition-colors">
          <X className="h-3.5 w-3.5 text-muted-foreground/50" />
        </button>
      </div>

      {/* Squad list */}
      <div className="flex-1 overflow-y-auto orion-scroll-thin p-2 space-y-2">
        {squads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Users className="h-5 w-5 text-muted-foreground/20 mb-2" />
            <p className="text-[10px] font-mono text-muted-foreground/30">Nenhum squad ativo</p>
            <p className="text-[9px] text-muted-foreground/20 mt-1">Squads formam-se quando agentes<br />compartilham dependências</p>
          </div>
        ) : (
          squads.map(squad => (
            <div key={squad.id} className="rounded-md border border-border/30 bg-card/50 overflow-hidden">
              {/* Squad header */}
              <div className="flex items-center gap-2 px-2.5 py-2 border-b border-border/20">
                <div className="w-2 h-2 rounded-full bg-amber-400/60" />
                <span className="text-[11px] font-semibold text-foreground/80 flex-1 truncate">{squad.name}</span>
                <div className="flex items-center gap-1">
                  {squad.activeCount > 0 && (
                    <span className="text-[9px] font-mono text-emerald-400/70 flex items-center gap-0.5">
                      <Zap className="h-2.5 w-2.5" />{squad.activeCount}
                    </span>
                  )}
                  <span className="text-[9px] font-mono text-muted-foreground/40">{squad.agents.length} agentes</span>
                </div>
              </div>

              {/* Squad metrics */}
              <div className="px-2.5 py-1.5 flex gap-3 border-b border-border/10">
                <div className="text-[9px] font-mono text-muted-foreground/40">
                  Sessões: <span className="text-foreground/60">{squad.totalSessions}</span>
                </div>
                <div className="text-[9px] font-mono text-muted-foreground/40">
                  Ativos: <span className="text-emerald-400/70">{squad.activeCount}/{squad.agents.length}</span>
                </div>
              </div>

              {/* Agent list */}
              <div className="divide-y divide-border/10">
                {squad.agents.map(agent => {
                  const sv = STATUS_VISUAL[agent.status];
                  return (
                    <button
                      key={agent.id}
                      onClick={() => onAgentClick?.(agent)}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-muted/20 transition-colors text-left group"
                    >
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{
                        backgroundColor: sv.color,
                        boxShadow: agent.status === "active" ? `0 0 4px ${sv.color}` : undefined,
                      }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-medium text-foreground/70 truncate">{agent.name}</div>
                        <div className="text-[8px] font-mono text-muted-foreground/40 truncate">{agent.role}</div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: TIER_COLORS[agent.tier] + "60" }} />
                        <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-colors" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-border/20">
        <p className="text-[8px] font-mono text-muted-foreground/25 text-center">
          Squads derivados de dependsOn/feeds
        </p>
      </div>
    </div>
  );
}
