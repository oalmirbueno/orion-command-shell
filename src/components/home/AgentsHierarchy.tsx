import { useNavigate } from "react-router-dom";
import { Bot, Crown, Users, Cpu, ChevronRight } from "lucide-react";
import type { AgentNode, AgentTier, AgentStatus } from "@/domains/agents/types";

const tierConfig: Record<AgentTier, { label: string; icon: React.ElementType; color: string }> = {
  orchestrator: { label: "Orquestrador", icon: Crown, color: "text-primary" },
  core: { label: "Núcleo", icon: Cpu, color: "text-foreground/70" },
  support: { label: "Suporte", icon: Users, color: "text-muted-foreground" },
};

const statusDot: Record<AgentStatus, string> = {
  active: "status-online",
  idle: "bg-muted-foreground/30",
  offline: "status-critical",
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
            <h2 className="orion-panel-title">Hierarquia de Agentes</h2>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
        </div>
        <div className="orion-empty">
          <div className="orion-empty-icon">
            <Bot className="h-5 w-5 text-muted-foreground/30" />
          </div>
          <p className="orion-empty-title">Aguardando conexão com API</p>
          <p className="orion-empty-subtitle">Agentes serão listados automaticamente</p>
        </div>
      </section>
    );
  }

  const tiers: AgentTier[] = ["orchestrator", "core", "support"];
  const activeCount = agents.filter(a => a.status === "active").length;
  const total = agents.length;

  return (
    <section className="rounded-lg border border-border overflow-hidden h-full">
      <div className="orion-panel-header cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => navigate("/agents")}>
        <div className="flex items-center gap-3">
          <div className="w-6 h-0.5 bg-primary rounded-full" />
          <h2 className="orion-panel-title">Hierarquia de Agentes</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-primary font-semibold">{activeCount}/{total} ativos</span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
        </div>
      </div>

      <div className="p-4 space-y-4 max-h-[320px] overflow-y-auto">
        {tiers.map((tier) => {
          const tierAgents = agents.filter(a => a.tier === tier);
          if (tierAgents.length === 0) return null;
          const cfg = tierConfig[tier];
          const TierIcon = cfg.icon;

          return (
            <div key={tier}>
              <div className="flex items-center gap-2.5 mb-2 px-1">
                <TierIcon className={`h-4 w-4 ${cfg.color}`} />
                <span className={`text-xs font-mono uppercase tracking-widest font-semibold ${cfg.color}`}>{cfg.label}</span>
                <div className="flex-1 h-px bg-border/25" />
              </div>

              <div className="space-y-1">
                {tierAgents.map((agent) => (
                  <div
                    key={agent.name}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-md hover:bg-accent/20 transition-colors cursor-pointer ${agent.status === "offline" ? "opacity-35" : ""} ${tier === "orchestrator" ? "border-l-2 border-l-primary/40 bg-primary/[0.03]" : ""}`}
                    onClick={() => navigate("/agents")}
                  >
                    <div className={`status-dot ${statusDot[agent.status]}`} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground">{agent.name}</span>
                      <p className="text-xs font-mono text-muted-foreground/40 mt-0.5">{agent.role}</p>
                    </div>
                    {agent.status !== "offline" && (
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-14 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${agent.load > 85 ? "bg-status-warning" : "bg-primary/50"}`} style={{ width: `${agent.load}%` }} />
                        </div>
                        <span className="text-xs font-mono text-muted-foreground/40 w-8 text-right">{agent.load}%</span>
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
