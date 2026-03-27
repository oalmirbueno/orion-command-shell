import { useState } from "react";
import { Bot, Cpu, Zap, AlertTriangle, Crown, Users, ArrowRight, Activity, Inbox } from "lucide-react";
import type { AgentView, AgentStatus, AgentTier } from "@/domains/agents/types";
import { AgentDetailSheet } from "@/components/sheets/AgentDetailSheet";

interface AgentDetailCardsProps { agents: AgentView[]; }

const statusConfig: Record<AgentStatus, { label: string; dot: string; text: string; border: string; bg: string }> = {
  active: { label: "Ativo", dot: "status-online", text: "text-status-online", border: "border-l-status-online", bg: "" },
  idle: { label: "Ocioso", dot: "bg-muted-foreground/40", text: "text-muted-foreground", border: "border-l-muted-foreground/30", bg: "" },
  offline: { label: "Offline", dot: "status-critical", text: "text-status-critical", border: "border-l-status-critical", bg: "bg-status-critical/[0.03]" },
};

const tierConfig: Record<AgentTier, { label: string; icon: React.ElementType; badgeClass: string; description: string }> = {
  orchestrator: { label: "Orquestrador", icon: Crown, badgeClass: "orion-badge-info", description: "Ponto central de decisão e distribuição" },
  core: { label: "Núcleo", icon: Cpu, badgeClass: "orion-badge-success", description: "Execução primária de tarefas de negócio" },
  support: { label: "Suporte", icon: Users, badgeClass: "orion-badge-neutral", description: "Infraestrutura e operações auxiliares" },
};

function AgentCard({ agent, onClick }: { agent: AgentView; onClick: () => void }) {
  const cfg = statusConfig[agent.status];
  const tier = tierConfig[agent.tier];
  const isOrch = agent.tier === "orchestrator";
  const isOffline = agent.status === "offline";
  const loadColor = agent.load > 85 ? "bg-status-warning" : "bg-primary/60";

  return (
    <div onClick={onClick} className={`rounded-lg border border-border/40 border-l-[3px] ${cfg.border} ${cfg.bg} ${isOrch ? "bg-primary/[0.03] border-primary/25" : ""} ${isOffline ? "opacity-50" : ""} hover:bg-accent/20 transition-all cursor-pointer group`}>
      <div className="px-6 py-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${isOrch ? "bg-primary/10 border-primary/25" : "bg-surface-2 border-border/40"}`}>
              <Bot className={`h-5 w-5 ${isOrch ? "text-primary" : "text-muted-foreground/50"}`} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className={`text-sm font-semibold ${isOrch ? "text-primary" : "text-foreground"}`}>{agent.name}</h3>
                <div className={`status-dot ${cfg.dot}`} />
                <span className={`text-xs font-mono uppercase ${cfg.text}`}>{cfg.label}</span>
              </div>
              <p className="text-xs text-muted-foreground/40 mt-0.5">{agent.role} · <span className="text-muted-foreground/30">{agent.model}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {agent.alertCount > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-status-warning/10 border border-status-warning/20">
                <AlertTriangle className="h-3.5 w-3.5 text-status-warning" />
                <span className="text-xs font-mono text-status-warning">{agent.alertCount}</span>
              </div>
            )}
            <span className={`orion-badge ${tier.badgeClass}`}>{tier.label}</span>
          </div>
        </div>
        <div className="flex items-start gap-3 mb-4 ml-[52px]">
          <Activity className="h-3.5 w-3.5 text-muted-foreground/25 shrink-0 mt-0.5" />
          <span className="text-xs text-foreground/55 leading-relaxed">{agent.currentTask}</span>
          <span className="text-[10px] font-mono text-muted-foreground/25 shrink-0 ml-auto">{agent.currentTaskAge}</span>
        </div>
        {(agent.dependsOn.length > 0 || agent.feeds.length > 0) && (
          <div className="flex items-center gap-4 mb-4 ml-[52px] flex-wrap">
            {agent.dependsOn.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted-foreground/30 uppercase">Recebe de</span>
                {agent.dependsOn.map(dep => <span key={dep} className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-2 border border-border/30 text-foreground/50">{dep}</span>)}
              </div>
            )}
            {agent.feeds.length > 0 && (
              <div className="flex items-center gap-2">
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/15" />
                <span className="text-[10px] font-mono text-muted-foreground/30 uppercase">Alimenta</span>
                {agent.feeds.map(f => <span key={f} className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-2 border border-border/30 text-foreground/50">{f}</span>)}
              </div>
            )}
          </div>
        )}
        <div className="flex items-center gap-4 pt-3 border-t border-border/15 ml-[52px] flex-wrap">
          <div className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-muted-foreground/20" /><span className="text-[10px] font-mono text-muted-foreground/35">Sessões</span><span className={`text-xs font-mono font-medium ${agent.sessions > 0 ? "text-foreground" : "text-muted-foreground/25"}`}>{agent.sessions}</span></div>
          <div className="w-px h-3 bg-border/15" />
          <div className="flex items-center gap-1.5"><span className="text-[10px] font-mono text-muted-foreground/35">Tokens</span><span className="text-xs font-mono text-foreground/70">{agent.tokensToday}</span></div>
          <div className="w-px h-3 bg-border/15" />
          <div className="flex items-center gap-1.5"><span className="text-[10px] font-mono text-muted-foreground/35">Disponib.</span><span className={`text-xs font-mono ${parseFloat(agent.availability) < 99 ? "text-status-warning" : "text-foreground/70"}`}>{agent.availability}</span></div>
          {agent.status !== "offline" && agent.load > 0 && (
            <><div className="w-px h-3 bg-border/15" /><div className="flex items-center gap-2 flex-1 max-w-[120px]"><span className="text-[10px] font-mono text-muted-foreground/35">Carga</span><div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden"><div className={`h-full rounded-full ${loadColor}`} style={{ width: `${agent.load}%` }} /></div><span className="text-[10px] font-mono text-muted-foreground/25">{agent.load}%</span></div></>
          )}
        </div>
      </div>
    </div>
  );
}

export function AgentDetailCards({ agents }: AgentDetailCardsProps) {
  const [selected, setSelected] = useState<AgentView | null>(null);

  if (agents.length === 0) {
    return (
      <section className="rounded-lg border border-border overflow-hidden">
        <div className="orion-panel-header">
          <div className="flex items-center gap-3"><div className="w-6 h-0.5 bg-muted-foreground/40 rounded-full" /><h2 className="orion-panel-title">Detalhe Operacional</h2></div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-lg bg-surface-2 border border-border flex items-center justify-center mb-4"><Inbox className="h-6 w-6 text-muted-foreground/30" /></div>
          <p className="text-sm font-medium text-muted-foreground/50">Nenhum agente registrado</p>
          <p className="text-xs font-mono text-muted-foreground/30 mt-1.5">Aguardando conexão com API</p>
        </div>
      </section>
    );
  }

  const tiers: AgentTier[] = ["orchestrator", "core", "support"];

  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">Detalhe Operacional</h2>
        <div className="flex-1 h-px bg-border/40" />
        <span className="text-xs font-mono text-muted-foreground/40">{agents.length} agentes</span>
      </div>
      <div className="space-y-6">
        {tiers.map(tier => {
          const tierAgents = agents.filter(a => a.tier === tier);
          if (tierAgents.length === 0) return null;
          const cfg = tierConfig[tier];
          const TierIcon = cfg.icon;
          const activeCount = tierAgents.filter(a => a.status === "active").length;
          return (
            <div key={tier}>
              <div className="flex items-center gap-3 mb-3">
                <TierIcon className="h-4 w-4 text-muted-foreground/40" />
                <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground/40">{cfg.label}</span>
                <span className="text-xs font-mono text-muted-foreground/20">{activeCount}/{tierAgents.length}</span>
                <span className="text-[10px] text-muted-foreground/25 ml-1">— {cfg.description}</span>
                <div className="flex-1 h-px bg-border/15" />
              </div>
              <div className="space-y-2.5">
                {tierAgents.map(agent => <AgentCard key={agent.id} agent={agent} onClick={() => setSelected(agent)} />)}
              </div>
            </div>
          );
        })}
      </div>
      <AgentDetailSheet agent={selected} open={!!selected} onOpenChange={(o) => !o && setSelected(null)} />
    </section>
  );
}
