import { Bot, Clock, MessageSquare, Cpu, ChevronRight, Crown, Users } from "lucide-react";
import { useOrionData } from "@/hooks/useOrionData";
import { OrionDataWrapper } from "@/components/orion/DataWrapper";
import { fetchAgents } from "@/domains/agents/fetcher";
import type { Agent, AgentStatus, AgentTier } from "@/domains/agents/types";

const statusConfig: Record<AgentStatus, { label: string; dot: string; text: string; border: string }> = {
  active: { label: "Ativo", dot: "status-online", text: "text-status-online", border: "border-l-status-online" },
  idle: { label: "Ocioso", dot: "bg-muted-foreground/40", text: "text-muted-foreground", border: "border-l-muted-foreground/30" },
  offline: { label: "Offline", dot: "status-critical", text: "text-status-critical", border: "border-l-status-critical" },
};

const tierConfig: Record<AgentTier, { label: string; icon: React.ElementType; badgeClass: string }> = {
  orchestrator: { label: "Orquestrador", icon: Crown, badgeClass: "orion-badge-info" },
  core: { label: "Núcleo", icon: Cpu, badgeClass: "orion-badge-success" },
  support: { label: "Suporte", icon: Users, badgeClass: "orion-badge-neutral" },
};

function LoadBar({ load, status }: { load: number; status: AgentStatus }) {
  if (status === "offline") return <div className="h-1 w-full bg-surface-3 rounded-full" />;
  const color = load > 85 ? "bg-status-warning" : "bg-primary/60";
  return (
    <div className="h-1 w-full bg-surface-3 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${load}%` }} />
    </div>
  );
}

function AgentRow({ agent }: { agent: Agent }) {
  const cfg = statusConfig[agent.status];
  const tier = tierConfig[agent.tier];
  const isDown = agent.status === "offline";

  return (
    <div className={`border border-border/40 rounded-lg bg-card hover:bg-accent/20 transition-colors cursor-pointer border-l-2 ${cfg.border} ${isDown ? "opacity-60" : ""} ${agent.tier === "orchestrator" ? "bg-primary/3" : ""}`}>
      <div className="px-5 py-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-md bg-surface-2 border border-border/50 flex items-center justify-center ${agent.tier === "orchestrator" ? "bg-primary/10 border-primary/25" : ""}`}>
              <Bot className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">{agent.name}</h3>
                <div className={`status-dot ${cfg.dot}`} />
                <span className={`text-[9px] font-mono uppercase ${cfg.text}`}>{cfg.label}</span>
                <span className={`orion-badge ${tier.badgeClass}`}>{tier.label}</span>
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">{agent.role}</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/20 mt-1" />
        </div>

        <div className="flex items-center gap-2 mb-3 px-1">
          <MessageSquare className="h-3 w-3 text-muted-foreground/30 shrink-0" />
          <span className="text-[11px] text-foreground/70 truncate">{agent.lastActivity}</span>
          <span className="text-[9px] font-mono text-muted-foreground/40 shrink-0 ml-auto">{agent.lastActivityLabel}</span>
        </div>

        <div className="flex items-center gap-4 pt-3 border-t border-border/20">
          <div className="flex items-center gap-1.5">
            <Cpu className="h-3 w-3 text-muted-foreground/30" />
            <span className="orion-mono-sm">{agent.model}</span>
          </div>
          <div className="orion-vsep" />
          <div className="flex items-center gap-1">
            <span className="orion-meta">Sessões</span>
            <span className={`text-[10px] font-mono font-medium ${agent.sessions > 0 ? "text-foreground" : "text-muted-foreground/40"}`}>{agent.sessions}</span>
          </div>
          <div className="orion-vsep" />
          <div className="flex items-center gap-1">
            <span className="orion-meta">Tokens</span>
            <span className="text-[10px] font-mono text-foreground">{agent.tokensToday}</span>
          </div>
          <div className="orion-vsep" />
          <div className="flex items-center gap-1">
            <span className="orion-meta">Disp.</span>
            <span className={`text-[10px] font-mono ${parseFloat(agent.availability) < 99 ? "text-status-warning" : "text-foreground"}`}>{agent.availability}</span>
          </div>
          <div className="flex-1 max-w-[80px] ml-auto">
            <LoadBar load={agent.load} status={agent.status} />
          </div>
          <span className="text-[9px] font-mono text-muted-foreground/40 w-8 text-right">{agent.load}%</span>
        </div>
      </div>
    </div>
  );
}

export function AgentsList() {
  const { state, data, source, lastUpdated, refetch } = useOrionData<Agent[]>({
    key: "agents-list",
    fetcher: fetchAgents,
  });

  const agents = data || [];
  const tierOrder: Record<AgentTier, number> = { orchestrator: 0, core: 1, support: 2 };
  const statusOrder: Record<AgentStatus, number> = { active: 0, idle: 1, offline: 2 };
  const sorted = [...agents].sort((a, b) => {
    const t = tierOrder[a.tier] - tierOrder[b.tier];
    return t !== 0 ? t : statusOrder[a.status] - statusOrder[b.status];
  });

  const tiers: AgentTier[] = ["orchestrator", "core", "support"];

  return (
    <section>
      <div className="orion-section-header">
        <h2 className="orion-section-label">Registro de Agentes</h2>
        <div className="orion-section-divider" />
        <span className="orion-live-indicator">● AO VIVO</span>
      </div>

      <OrionDataWrapper state={state} source={source} lastUpdated={lastUpdated} onRetry={refetch}>
        <div className="space-y-6">
          {tiers.map((tier) => {
            const tierAgents = sorted.filter(a => a.tier === tier);
            if (tierAgents.length === 0) return null;
            const cfg = tierConfig[tier];
            const TierIcon = cfg.icon;

            return (
              <div key={tier}>
                <div className="flex items-center gap-1.5 mb-2">
                  <TierIcon className="h-3 w-3 text-muted-foreground/50" />
                  <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/50">{cfg.label}</span>
                  <span className="text-[9px] font-mono text-muted-foreground/25">{tierAgents.length}</span>
                  <div className="flex-1 h-px bg-border/20" />
                </div>
                <div className="space-y-2">
                  {tierAgents.map((agent) => (
                    <AgentRow key={agent.id} agent={agent} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </OrionDataWrapper>
    </section>
  );
}
