import { useNavigate } from "react-router-dom";
import { Bot, Crown, Cpu, Link2, Archive, ChevronRight, Zap, WifiOff } from "lucide-react";
import type { AgentNode } from "@/domains/agents/types";

/**
 * Phase Architecture — fully dynamic from backend discovery.
 * No hardcoded agent IDs or names.
 * Groups by structural status (official vs legacy) and shows parentAgent links.
 */

interface PhaseArchitectureProps {
  agents: AgentNode[];
}

const runtimeDot: Record<string, { dot: string; label: string }> = {
  online: { dot: "bg-status-online", label: "Online" },
  active: { dot: "bg-status-online", label: "Online" },
  idle: { dot: "bg-status-online", label: "Idle" },
  offline: { dot: "bg-status-critical", label: "Offline" },
  "no-data": { dot: "bg-muted-foreground/30", label: "Sem dados" },
};

function getRuntimeKey(agent: AgentNode): string {
  if (agent.status === "active" || agent.status === "idle") return "online";
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
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-primary/60">
            {officialAgents.length} ativos · {legacyAgents.length} legados
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Official agents */}
        {officialAgents.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2.5 px-1">
              <Crown className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-primary/60 font-semibold">Ativos Oficiais</span>
              <div className="flex-1 h-px bg-border/20" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {officialAgents.map((agent) => {
                const rKey = getRuntimeKey(agent);
                const rdot = runtimeDot[rKey] || runtimeDot["no-data"];
                const hasParent = !!agent.parentAgent;
                const parentName = agent.parentAgent
                  ? agents.find(a => a.id === agent.parentAgent)?.name || agent.parentAgent
                  : null;

                return (
                  <div
                    key={agent.id}
                    className={`rounded-lg border px-4 py-3 cursor-pointer hover:bg-accent/20 transition-colors ${
                      agent.tier === "orchestrator"
                        ? "border-primary/20 bg-primary/[0.03]"
                        : "border-border/40"
                    }`}
                    onClick={() => navigate("/agents")}
                  >
                    <div className="flex items-center gap-2.5 mb-1">
                      <div className={`w-2 h-2 rounded-full ${rdot.dot}`} />
                      <span className="text-sm font-semibold text-foreground">{agent.name}</span>
                      {agent.exposure && agent.exposure !== "unknown" && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 ml-auto">
                          {agent.exposure}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground/50 ml-[18px]">{agent.role}</p>
                    <div className="flex items-center gap-2 mt-1.5 ml-[18px]">
                      <span className={`text-[10px] font-mono ${rKey === "online" ? "text-status-online" : rKey === "offline" ? "text-status-critical" : "text-muted-foreground/30"}`}>
                        {rdot.label}
                      </span>
                      {agent.activeSessions > 0 && (
                        <span className="text-[10px] font-mono text-primary/60">{agent.activeSessions} sessões</span>
                      )}
                      {parentName && (
                        <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground/30">
                          <Link2 className="h-3 w-3" />
                          <span>→ {parentName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Legacy agents */}
        {legacyAgents.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2.5 px-1">
              <Archive className="h-3.5 w-3.5 text-muted-foreground/40" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/30 font-semibold">Legados</span>
              <div className="flex-1 h-px bg-border/15" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {legacyAgents.map((agent) => {
                const rKey = getRuntimeKey(agent);
                const rdot = runtimeDot[rKey] || runtimeDot["no-data"];
                return (
                  <div
                    key={agent.id}
                    className="rounded-lg border border-border/25 px-3 py-2.5 opacity-50 hover:opacity-70 transition-opacity cursor-pointer"
                    onClick={() => navigate("/agents")}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${rdot.dot}`} />
                      <span className="text-xs font-medium text-foreground/60 truncate">{agent.name}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/30 ml-[14px]">{agent.role}</p>
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
