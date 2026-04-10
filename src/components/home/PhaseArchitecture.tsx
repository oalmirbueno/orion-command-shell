import { useNavigate } from "react-router-dom";
import { Bot, Crown, Archive, ChevronRight, Link2 } from "lucide-react";
import type { AgentNode } from "@/domains/agents/types";

interface PhaseArchitectureProps {
  agents: AgentNode[];
}

const runtimeLabel: Record<string, { dot: string; label: string }> = {
  online: { dot: "bg-status-online", label: "Online" },
  idle: { dot: "bg-muted-foreground/40", label: "Idle" },
  offline: { dot: "bg-status-critical", label: "Offline" },
  "no-data": { dot: "bg-muted-foreground/20", label: "Sem dados" },
};

function getRuntimeKey(agent: AgentNode): string {
  if (agent.status === "active") return "online";
  if (agent.status === "idle") return "idle";
  if (agent.status === "offline") return "offline";
  return "no-data";
}

export function PhaseArchitecture({ agents = [] }: PhaseArchitectureProps) {
  const navigate = useNavigate();

  const officialAgents = agents.filter(a => a.official !== false && a.structuralStatus !== "legacy");
  const legacyAgents = agents.filter(a => a.official === false || a.structuralStatus === "legacy");

  if (agents.length === 0) {
    return (
      <section className="rounded-lg border border-border overflow-hidden">
        <div className="orion-panel-header cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => navigate("/agents")}>
          <div className="flex items-center gap-3">
            <div className="w-6 h-0.5 bg-primary rounded-full" />
            <h2 className="orion-panel-title">Arquitetura de Agentes</h2>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
        </div>
        <div className="orion-empty">
          <div className="orion-empty-icon"><Bot className="h-5 w-5 text-muted-foreground/30" /></div>
          <p className="orion-empty-title">Aguardando descoberta de agentes</p>
          <p className="orion-empty-subtitle">Agentes serão renderizados automaticamente do backend</p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border overflow-hidden">
      <div
        className="orion-panel-header cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={() => navigate("/agents")}
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-0.5 bg-primary rounded-full" />
          <h2 className="orion-panel-title">Arquitetura de Agentes</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-muted-foreground/40">
            {officialAgents.length} oficiais · {legacyAgents.length} legados
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Official agents */}
        {officialAgents.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 px-1">
              <Crown className="h-3 w-3 text-primary/60" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-primary/50 font-medium">Oficiais</span>
              <div className="flex-1 h-px bg-border/15" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {officialAgents.map((agent) => {
                const rKey = getRuntimeKey(agent);
                const rt = runtimeLabel[rKey] || runtimeLabel["no-data"];
                const parentName = agent.parentAgent
                  ? agents.find(a => a.id === agent.parentAgent)?.name || agent.parentAgent
                  : null;

                return (
                  <div
                    key={agent.id}
                    className={`rounded-lg border px-4 py-3 cursor-pointer hover:bg-accent/20 transition-colors ${
                      agent.tier === "orchestrator"
                        ? "border-primary/20 bg-primary/[0.02]"
                        : "border-border/30"
                    }`}
                    onClick={() => navigate("/agents")}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${rt.dot}`} />
                      <span className="text-sm font-semibold text-foreground truncate">{agent.name}</span>
                      <span className={`text-[10px] font-mono ml-auto shrink-0 ${rKey === "online" ? "text-status-online/70" : rKey === "offline" ? "text-status-critical/70" : "text-muted-foreground/30"}`}>
                        {rt.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground/45 ml-4 leading-relaxed">{agent.role}</p>
                    {(agent.activeSessions > 0 || parentName) && (
                      <div className="flex items-center gap-3 mt-1.5 ml-4">
                        {agent.activeSessions > 0 && (
                          <span className="text-[10px] font-mono text-primary/50">{agent.activeSessions} sessões</span>
                        )}
                        {parentName && (
                          <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground/25">
                            <Link2 className="h-2.5 w-2.5" />
                            <span>{parentName}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Legacy agents — compact */}
        {legacyAgents.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 px-1">
              <Archive className="h-3 w-3 text-muted-foreground/30" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/25 font-medium">Legados</span>
              <div className="flex-1 h-px bg-border/10" />
            </div>
            <div className="flex flex-wrap gap-2">
              {legacyAgents.map((agent) => {
                const rKey = getRuntimeKey(agent);
                const rt = runtimeLabel[rKey] || runtimeLabel["no-data"];
                return (
                  <div
                    key={agent.id}
                    className="flex items-center gap-2 rounded-md border border-border/20 px-3 py-1.5 opacity-40 hover:opacity-60 transition-opacity cursor-pointer"
                    onClick={() => navigate("/agents")}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${rt.dot}`} />
                    <span className="text-[11px] font-medium text-foreground/50">{agent.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
