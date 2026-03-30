import { Crown, Cpu, Users, ArrowDown, Inbox } from "lucide-react";
import type { AgentView, AgentStatus, AgentTier } from "@/domains/agents/types";

interface AgentArchitectureMapProps {
  agents: AgentView[];
}

const statusDot: Record<AgentStatus, string> = {
  active: "status-online",
  idle: "bg-muted-foreground/40",
  offline: "status-critical",
};

function MiniNode({ agent, variant = "default" }: { agent: AgentView; variant?: "orchestrator" | "core" | "support" | "default" }) {
  const isOrch = variant === "orchestrator";
  const isOffline = agent.status === "offline";
  const loadColor = agent.load > 85 ? "bg-status-warning" : "bg-primary/60";

  return (
    <div className={`
      relative rounded-lg border bg-card px-4 py-3.5 transition-all cursor-pointer group
      ${isOrch ? "border-primary/30 bg-primary/[0.04] shadow-[0_0_15px_-5px_hsl(var(--primary)/0.12)]" : "border-border/40 hover:bg-accent/20"}
      ${isOffline ? "opacity-40" : ""}
    `}>
      {isOrch && agent.status === "active" && (
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
      )}

      <div className="flex items-center gap-2.5 mb-1.5">
        <div className={`status-dot ${statusDot[agent.status]}`} />
        <span className={`text-sm font-semibold ${isOrch ? "text-primary" : "text-foreground"}`}>{agent.name}</span>
        {agent.sessions > 0 && (
           <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 ml-auto">
            {agent.sessions}s
          </span>
        )}
      </div>
      <p className="text-[10px] font-mono text-muted-foreground/40">{agent.role}</p>

      {agent.status !== "offline" && agent.load > 0 && (
        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${loadColor}`} style={{ width: `${agent.load}%` }} />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground/30">{agent.load}%</span>
        </div>
      )}
    </div>
  );
}

function FlowArrow({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center py-2">
      <div className="w-px h-5 bg-border/25" />
      <ArrowDown className="h-3.5 w-3.5 text-border/30" />
      {label && <span className="text-[10px] font-mono text-muted-foreground/25 mt-1">{label}</span>}
    </div>
  );
}

export function AgentArchitectureMap({ agents = [] }: AgentArchitectureMapProps) {
  if (agents.length === 0) {
    return (
      <section className="rounded-lg border border-border overflow-hidden">
        <div className="orion-panel-header">
          <div className="flex items-center gap-3">
            <div className="w-6 h-0.5 bg-muted-foreground/40 rounded-full" />
            <h2 className="orion-panel-title">Mapa de Arquitetura</h2>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-lg bg-surface-2 border border-border flex items-center justify-center mb-4">
            <Inbox className="h-6 w-6 text-muted-foreground/30" />
          </div>
          <p className="text-sm font-medium text-muted-foreground/50">Nenhum agente registrado</p>
          <p className="text-xs font-mono text-muted-foreground/30 mt-1.5">Aguardando conexão com API</p>
        </div>
      </section>
    );
  }

  const orchestrators = agents.filter(a => a.tier === "orchestrator");
  const coreAgents = agents.filter(a => a.tier === "core");
  const supportAgents = agents.filter(a => a.tier === "support");

  const activeCore = coreAgents.filter(a => a.status === "active").length;
  const activeSupport = supportAgents.filter(a => a.status === "active").length;

  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">Mapa de Arquitetura</h2>
        <div className="flex-1 h-px bg-border/40" />
      </div>

      <div className="rounded-lg border border-border/40 bg-card/50 p-6">
        {/* Tier 1: Orchestrator */}
        {orchestrators.length > 0 && (
          <>
            <div className="flex flex-col items-center mb-2">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-primary/60">Orquestrador</span>
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
                <Cpu className="h-3.5 w-3.5 text-foreground/40" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40">
                  Núcleo · {activeCore}/{coreAgents.length} ativos
                </span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
              <Users className="h-3.5 w-3.5 text-muted-foreground/30" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/30">
                Suporte · {activeSupport}/{supportAgents.length} ativos
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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
