import { Bot, Zap, Pause, WifiOff, Crown, Cpu, Archive } from "lucide-react";
import type { AgentView } from "@/domains/agents/types";

interface AgentsSummaryBarProps {
  agents: AgentView[];
}

export function AgentsSummaryBar({ agents = [] }: AgentsSummaryBarProps) {
  const isEmpty = agents.length === 0;
  const total = agents.length;
  const active = agents.filter(a => a.status === "active").length;
  const idle = agents.filter(a => a.status === "idle").length;
  const offline = agents.filter(a => a.status === "offline").length;
  // Dynamic: use structuralStatus from backend instead of name matching
  const official = agents.filter(a => a.official !== false && a.structuralStatus !== "legacy").length;
  const legacy = agents.filter(a => a.official === false || a.structuralStatus === "legacy").length;
  const totalTokens = agents.reduce((sum, a) => {
    const num = parseFloat(a.tokensToday.replace("k", ""));
    return sum + (isNaN(num) ? 0 : num);
  }, 0);
  const tokensLabel = isEmpty ? "—" : `${Math.round(totalTokens)}k`;

  const items = [
    { label: "Total", value: isEmpty ? "—" : total, icon: Bot, color: "text-foreground", dotClass: "bg-foreground/30" },
    { label: "Ativos", value: isEmpty ? "—" : active, icon: Zap, color: "text-status-online", dotClass: "status-online" },
    { label: "Oficiais", value: isEmpty ? "—" : official, icon: Crown, color: "text-primary", dotClass: "bg-primary/50" },
    { label: "Legados", value: isEmpty ? "—" : legacy, icon: Archive, color: "text-muted-foreground", dotClass: "bg-muted-foreground/40" },
    { label: "Offline", value: isEmpty ? "—" : offline, icon: WifiOff, color: "text-status-critical", dotClass: "status-critical" },
    { label: "Tokens Hoje", value: tokensLabel, icon: Cpu, color: "text-foreground", dotClass: "bg-foreground/30" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-border/30 rounded-lg overflow-hidden border border-border/50">
      {items.map((m) => {
        const Icon = m.icon;
        return (
          <div key={m.label} className="bg-card px-5 py-5 flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${isEmpty ? "bg-surface-2 border-border/40" : "bg-surface-2 border-border/50"}`}>
              <Icon className={`h-5 w-5 ${isEmpty ? "text-muted-foreground/25" : m.color}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold leading-none ${isEmpty ? "text-muted-foreground/20" : "text-foreground"}`}>{m.value}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <div className={`status-dot ${isEmpty ? "bg-muted-foreground/15" : m.dotClass}`} />
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/50">{m.label}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
