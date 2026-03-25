import { Crown, Cpu, Users, ArrowDown } from "lucide-react";
import type { Agent, AgentStatus, AgentTier } from "@/domains/agents/types";

interface AgentArchitectureMapProps {
  agents: Agent[];
}

const statusDot: Record<AgentStatus, string> = {
  active: "status-online",
  idle: "bg-muted-foreground/40",
  offline: "status-critical",
};

function MiniNode({ agent, variant = "default" }: { agent: Agent; variant?: "orchestrator" | "core" | "support" | "default" }) {
  const isOrch = variant === "orchestrator";
  const isOffline = agent.status === "offline";
  const loadColor = agent.load > 85 ? "bg-status-warning" : "bg-primary/60";

  return (
    <div className={`
      relative rounded-xl border bg-card px-5 py-4 transition-all cursor-pointer group
      ${isOrch ? "border-primary/30 bg-primary/5 shadow-[0_0_20px_-5px_hsl(var(--primary)/0.15)]" : "border-border/40 hover:bg-accent/20"}
      ${isOffline ? "opacity-50" : ""}
    `}>
      {isOrch && agent.status === "active" && (
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary animate-pulse" />
      )}

      <div className="flex items-center gap-3 mb-2">
        <div className={`status-dot ${statusDot[agent.status]}`} />
        <span className={`text-sm font-semibold ${isOrch ? "text-primary" : "text-foreground"}`}>{agent.name}</span>
        {agent.sessions > 0 && (
           <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 ml-auto">
            {agent.sessions}s
          </span>
        )}
      </div>
      <p className="text-xs font-mono text-muted-foreground/50">{agent.role}</p>

      {agent.status !== "offline" && agent.load > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-2 bg-surface-3 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${loadColor}`} style={{ width: `${agent.load}%` }} />
          </div>
          <span className="text-xs font-mono text-muted-foreground/40">{agent.load}%</span>
        </div>
      )}
    </div>
  );
}

function FlowArrow({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center py-2">
      <div className="w-px h-6 bg-border/30" />
      <ArrowDown className="h-4 w-4 text-border/40" />
      {label && <span className="text-xs font-mono text-muted-foreground/30 mt-1">{label}</span>}
    </div>
  );
}

export function AgentArchitectureMap({ agents }: AgentArchitectureMapProps) {
  const orchestrators = agents.filter(a => a.tier === "orchestrator");
  const coreAgents = agents.filter(a => a.tier === "core");
  const supportAgents = agents.filter(a => a.tier === "support");

  const activeCore = coreAgents.filter(a => a.status === "active").length;
  const activeSupport = supportAgents.filter(a => a.status === "active").length;

  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
          Mapa de Arquitetura
        </h2>
        <div className="flex-1 h-px bg-border/40" />
        <span className="text-xs font-mono text-primary animate-pulse-glow">● AO VIVO</span>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/50 p-8">
        {/* Tier 1: Orchestrator */}
        {orchestrators.length > 0 && (
          <>
            <div className="flex flex-col items-center mb-2">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="h-4 w-4 text-primary" />
                <span className="text-xs font-mono uppercase tracking-widest text-primary/70">Orquestrador</span>
              </div>
              <div className="w-full max-w-sm">
                <MiniNode agent={orchestrators[0]} variant="orchestrator" />
              </div>
            </div>

            <div className="flex justify-center">
              <FlowArrow label="distribui tasks" />
            </div>
          </>
        )}

        {/* Tier 2: Core */}
        {coreAgents.length > 0 && (
          <>
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-3 justify-center">
                <Cpu className="h-4 w-4 text-foreground/50" />
                <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground/50">
                  Núcleo · {activeCore}/{coreAgents.length} ativos
                </span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {coreAgents.map(agent => (
                  <MiniNode key={agent.id} agent={agent} variant="core" />
                ))}
              </div>
            </div>

            {supportAgents.length > 0 && (
              <div className="flex justify-center">
                <FlowArrow label="alimenta" />
              </div>
            )}
          </>
        )}

        {/* Tier 3: Support */}
        {supportAgents.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3 justify-center">
              <Users className="h-4 w-4 text-muted-foreground/40" />
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground/40">
                Suporte · {activeSupport}/{supportAgents.length} ativos
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {supportAgents.map(agent => (
                <MiniNode key={agent.id} agent={agent} variant="support" />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
