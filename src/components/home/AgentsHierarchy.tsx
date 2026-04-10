import { useNavigate } from "react-router-dom";
import { Bot, Crown, Users, Cpu, ChevronRight } from "lucide-react";
import type { AgentNode, AgentTier, AgentStatus } from "@/domains/agents/types";

const tierConfig: Record<AgentTier, { label: string; icon: React.ElementType }> = {
  orchestrator: { label: "Orquestrador", icon: Crown },
  core: { label: "Núcleo", icon: Cpu },
  support: { label: "Suporte", icon: Users },
};

const statusDot: Record<AgentStatus, string> = {
  active: "bg-status-online",
  idle: "bg-muted-foreground/30",
  offline: "bg-status-critical",
};

interface AgentsHierarchyProps {
  agents: AgentNode[];
}

export function AgentsHierarchy({ agents = [] }: AgentsHierarchyProps) {
  const navigate = useNavigate();

  if (agents.length === 0) {
    return (
      <section className="rounded-lg border border-border overflow-hidden h-full">
        <div className="orion-panel-header cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => navigate("/agents")}>
          <div className="flex items-center gap-3">
            <div className="w-6 h-0.5 bg-primary rounded-full" />
            <h2 className="orion-panel-title">Hierarquia</h2>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
        </div>
        <div className="orion-empty">
          <div className="orion-empty-icon"><Bot className="h-5 w-5 text-muted-foreground/30" /></div>
          <p className="orion-empty-title">Aguardando conexão</p>
          <p className="orion-empty-subtitle">Agentes serão listados automaticamente</p>
        </div>
      </section>
    );
  }

  const officialAgents = agents.filter(a => a.official !== false && a.structuralStatus !== "legacy");
  const tiers: AgentTier[] = ["orchestrator", "core", "support"];
  const activeCount = officialAgents.filter(a => a.status === "active").length;

  return (
    <section className="rounded-lg border border-border overflow-hidden h-full">
      <div className="orion-panel-header cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => navigate("/agents")}>
        <div className="flex items-center gap-3">
          <div className="w-6 h-0.5 bg-primary rounded-full" />
          <h2 className="orion-panel-title">Hierarquia</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-primary/60 font-medium">{activeCount}/{officialAgents.length} online</span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
        </div>
      </div>

      <div className="p-3 space-y-3 max-h-[320px] overflow-y-auto orion-thin-scroll">
        {tiers.map((tier) => {
          const tierAgents = officialAgents.filter(a => a.tier === tier);
          if (tierAgents.length === 0) return null;
          const cfg = tierConfig[tier];
          const TierIcon = cfg.icon;

          return (
            <div key={tier}>
              <div className="flex items-center gap-2 mb-1.5 px-1">
                <TierIcon className="h-3 w-3 text-muted-foreground/30" />
                <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/30">{cfg.label}</span>
                <div className="flex-1 h-px bg-border/15" />
              </div>

              <div className="space-y-0.5">
                {tierAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-accent/20 transition-colors cursor-pointer ${agent.status === "offline" ? "opacity-30" : ""}`}
                    onClick={() => navigate("/agents")}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot[agent.status]}`} />
                    <span className="text-[12px] font-medium text-foreground truncate">{agent.name}</span>
                    {agent.status !== "offline" && agent.load > 0 && (
                      <div className="flex items-center gap-1.5 ml-auto shrink-0">
                        <div className="w-10 h-1 bg-surface-3 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${agent.load > 85 ? "bg-status-warning" : "bg-primary/40"}`} style={{ width: `${agent.load}%` }} />
                        </div>
                        <span className="text-[9px] font-mono text-muted-foreground/30 w-6 text-right">{agent.load}%</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
