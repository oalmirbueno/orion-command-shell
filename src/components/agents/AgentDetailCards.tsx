import { useState } from "react";
import { Bot, Cpu, Zap, AlertTriangle, Crown, Users, Activity, Inbox, Link2 } from "lucide-react";
import type { AgentView, AgentStatus, AgentTier } from "@/domains/agents/types";
import { AgentDetailSheet } from "@/components/sheets/AgentDetailSheet";

interface AgentDetailCardsProps { agents: AgentView[]; }

/* ── Status configs ── */

const statusConfig: Record<AgentStatus, { label: string; dotClass: string; text: string; border: string; bg: string; pulse: boolean }> = {
  active: { label: "Online", dotClass: "bg-status-online", text: "text-status-online", border: "border-l-status-online", bg: "", pulse: true },
  idle: { label: "Idle", dotClass: "bg-muted-foreground/40", text: "text-muted-foreground", border: "border-l-muted-foreground/30", bg: "", pulse: false },
  offline: { label: "Offline", dotClass: "bg-status-critical", text: "text-status-critical", border: "border-l-status-critical", bg: "bg-status-critical/[0.02]", pulse: false },
};

const tierConfig: Record<AgentTier, { label: string; icon: React.ElementType; description: string }> = {
  orchestrator: { label: "Orquestrador", icon: Crown, description: "Decisão e distribuição" },
  core: { label: "Núcleo", icon: Cpu, description: "Execução primária" },
  support: { label: "Suporte", icon: Users, description: "Infraestrutura e auxiliar" },
};

/* ── Ordered badge renderer ── */
function AgentBadges({ agent }: { agent: AgentView }) {
  const badges: { label: string; className: string }[] = [];

  // 1. lifecycle
  if (agent.lifecycle && agent.lifecycle !== "unknown") {
    const cls = agent.lifecycle === "production"
      ? "bg-status-online/8 text-status-online/70 border-status-online/15"
      : agent.lifecycle === "deprecated"
        ? "bg-muted-foreground/8 text-muted-foreground/50 border-muted-foreground/15"
        : "bg-status-warning/8 text-status-warning/70 border-status-warning/15";
    badges.push({ label: agent.lifecycle, className: cls });
  }

  // 2. official / structural
  if (agent.structuralStatus === "legacy" || agent.official === false) {
    badges.push({ label: "Legado", className: "bg-muted-foreground/8 text-muted-foreground/50 border-muted-foreground/15" });
  }

  // 3. binding
  if (agent.bindingStatus && agent.bindingStatus !== "unknown") {
    badges.push({ label: agent.bindingStatus, className: "bg-primary/8 text-primary/60 border-primary/15" });
  }

  // 4. exposure
  if (agent.exposure && agent.exposure !== "unknown") {
    badges.push({ label: agent.exposure, className: "bg-primary/8 text-primary/60 border-primary/15" });
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {badges.map((b, i) => (
        <span key={i} className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${b.className}`}>
          {b.label}
        </span>
      ))}
    </div>
  );
}

/* ── Load gauge ── */
function LoadGauge({ value }: { value: number }) {
  const color = value > 85 ? "text-status-critical" : value > 60 ? "text-status-warning" : "text-status-online";
  const bgColor = value > 85 ? "bg-status-critical" : value > 60 ? "bg-status-warning" : "bg-status-online";
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative w-10 h-10 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r={radius} fill="none" strokeWidth="2.5" className="stroke-muted/15" />
        <circle cx="18" cy="18" r={radius} fill="none" strokeWidth="2.5" strokeLinecap="round"
          className={`${bgColor.replace("bg-", "stroke-")} transition-all duration-700`}
          strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold ${color}`}>
        {value}
      </span>
    </div>
  );
}

/* ── Agent card ── */
function AgentCard({ agent, onClick }: { agent: AgentView; onClick: () => void }) {
  const cfg = statusConfig[agent.status];
  const isOrch = agent.tier === "orchestrator";
  const isOffline = agent.status === "offline";
  const isLegacy = agent.structuralStatus === "legacy" || agent.official === false;

  return (
    <div onClick={onClick} className={`rounded-lg border border-border/30 border-l-[3px] ${cfg.border} ${cfg.bg} ${isOrch ? "bg-primary/[0.02]" : ""} ${isOffline ? "opacity-40" : ""} ${isLegacy ? "opacity-40 hover:opacity-60" : ""} hover:bg-accent/20 transition-all cursor-pointer group`}>
      <div className="px-5 py-4">
        {/* Header: name + runtime status */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${isOrch ? "bg-primary/8 border-primary/20" : "bg-surface-2 border-border/30"}`}>
              <Bot className={`h-4 w-4 ${isOrch ? "text-primary/70" : "text-muted-foreground/40"}`} />
            </div>
            <div className="min-w-0">
              <h3 className={`text-sm font-semibold truncate ${isOrch ? "text-primary" : "text-foreground"}`}>{agent.name}</h3>
              <p className="text-[11px] text-muted-foreground/35 mt-0.5">{agent.role} · {agent.model}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <span className={`relative flex h-2 w-2`}>
              {cfg.pulse && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.dotClass} opacity-30`} />}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${cfg.dotClass}`} />
            </span>
            <span className={`text-[10px] font-mono ${cfg.text}`}>{cfg.label}</span>
          </div>
        </div>

        {/* Badges row — standardized order */}
        <div className="ml-[46px] mb-2">
          <AgentBadges agent={agent} />
        </div>

        {/* Parent link */}
        {agent.parentAgent && (
          <div className="flex items-center gap-1.5 ml-[46px] mb-2 text-[10px] font-mono text-muted-foreground/25">
            <Link2 className="h-2.5 w-2.5" />
            <span>Vinculado a {agent.parentAgent}</span>
          </div>
        )}

        {/* Alert count */}
        {agent.alertCount > 0 && (
          <div className="flex items-center gap-1.5 ml-[46px] mb-2 px-2 py-1 rounded bg-status-warning/8 border border-status-warning/15 w-fit">
            <AlertTriangle className="h-3 w-3 text-status-warning/70" />
            <span className="text-[10px] font-mono text-status-warning/70">{agent.alertCount} alertas</span>
          </div>
        )}

        {/* Current task */}
        {agent.currentTask && (
          <div className="flex items-start gap-2 mb-3 ml-[46px]">
            <Activity className="h-3 w-3 text-muted-foreground/20 shrink-0 mt-0.5" />
            <span className="text-[11px] text-foreground/45 leading-relaxed line-clamp-2">{agent.currentTask}</span>
            {agent.currentTaskAge && (
              <span className="text-[9px] font-mono text-muted-foreground/20 shrink-0 ml-auto">{agent.currentTaskAge}</span>
            )}
          </div>
        )}

        {/* Metrics bar */}
        <div className="flex items-center gap-3 pt-3 border-t border-border/10 ml-[46px]">
          {agent.status !== "offline" && agent.load > 0 && (
            <LoadGauge value={Number(agent.load)} />
          )}
          <div className="flex items-center gap-3 flex-wrap flex-1 text-[10px] font-mono text-muted-foreground/40">
            {agent.sessions > 0 && (
              <span><Zap className="h-3 w-3 inline mr-1 text-muted-foreground/20" />{agent.sessions} sessões</span>
            )}
            <span>{agent.tokensToday} tokens</span>
            <span>{agent.availability} up</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main export ── */
export function AgentDetailCards({ agents = [] }: AgentDetailCardsProps) {
  const [selected, setSelected] = useState<AgentView | null>(null);

  if (agents.length === 0) {
    return (
      <section className="rounded-lg border border-border overflow-hidden">
        <div className="orion-panel-header">
          <div className="flex items-center gap-3"><div className="w-6 h-0.5 bg-muted-foreground/40 rounded-full" /><h2 className="orion-panel-title">Detalhe Operacional</h2></div>
        </div>
        <div className="orion-empty">
          <div className="orion-empty-icon"><Inbox className="h-5 w-5 text-muted-foreground/30" /></div>
          <p className="orion-empty-title">Nenhum agente registrado</p>
          <p className="orion-empty-subtitle">Aguardando conexão com API</p>
        </div>
      </section>
    );
  }

  const tiers: AgentTier[] = ["orchestrator", "core", "support"];

  return (
    <section className="rounded-lg border border-border overflow-hidden">
      <div className="orion-panel-header">
        <div className="flex items-center gap-3">
          <div className="w-6 h-0.5 bg-muted-foreground/40 rounded-full" />
          <h2 className="orion-panel-title">Detalhe Operacional</h2>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground/30">{agents.length} agentes</span>
      </div>
      <div className="space-y-5 p-1">
        {tiers.map(tier => {
          const tierAgents = agents.filter(a => a.tier === tier);
          if (tierAgents.length === 0) return null;
          const cfg = tierConfig[tier];
          const TierIcon = cfg.icon;
          const activeCount = tierAgents.filter(a => a.status === "active").length;
          return (
            <div key={tier}>
              <div className="flex items-center gap-2 mb-2 px-2">
                <TierIcon className="h-3.5 w-3.5 text-muted-foreground/30" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/35">{cfg.label}</span>
                <span className="text-[9px] font-mono text-muted-foreground/20">{activeCount}/{tierAgents.length}</span>
                <div className="flex-1 h-px bg-border/10" />
              </div>
              <div className="space-y-2">
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
