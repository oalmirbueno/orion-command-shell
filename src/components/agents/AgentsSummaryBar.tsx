import { Bot, Zap, WifiOff, Crown, Archive, Cpu } from "lucide-react";
import type { AgentView } from "@/domains/agents/types";

interface AgentsSummaryBarProps {
  agents: AgentView[];
}

export function AgentsSummaryBar({ agents = [] }: AgentsSummaryBarProps) {
  const isEmpty = agents.length === 0;
  const total = agents.length;
  const active = agents.filter(a => a.status === "active").length;
  const official = agents.filter(a => a.official !== false && a.structuralStatus !== "legacy").length;
  const legacy = agents.filter(a => a.official === false || a.structuralStatus === "legacy").length;
  const offline = agents.filter(a => a.status === "offline").length;
  const totalTokens = agents.reduce((sum, a) => {
    const num = parseFloat(a.tokensToday.replace("k", ""));
    return sum + (isNaN(num) ? 0 : num);
  }, 0);
  const tokensLabel = isEmpty ? "—" : `${Math.round(totalTokens)}k`;

  const items = [
    { label: "Total", value: isEmpty ? "—" : total, icon: Bot, dot: "bg-foreground/30" },
    { label: "Online", value: isEmpty ? "—" : active, icon: Zap, dot: "status-online" },
    { label: "Oficiais", value: isEmpty ? "—" : official, icon: Crown, dot: "bg-primary/50" },
    { label: "Legados", value: isEmpty ? "—" : legacy, icon: Archive, dot: "bg-muted-foreground/30" },
    { label: "Offline", value: isEmpty ? "—" : offline, icon: WifiOff, dot: "status-critical" },
    { label: "Tokens", value: tokensLabel, icon: Cpu, dot: "bg-foreground/30" },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-px bg-border/20 rounded-lg overflow-hidden border border-border/40">
      {items.map((m) => {
        const Icon = m.icon;
        return (
          <div key={m.label} className="bg-card px-4 py-4 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${isEmpty ? "bg-surface-2 border-border/30" : "bg-surface-2 border-border/40"}`}>
              <Icon className={`h-4 w-4 ${isEmpty ? "text-muted-foreground/20" : "text-muted-foreground/50"}`} />
            </div>
            <div>
              <p className={`text-xl font-bold leading-none ${isEmpty ? "text-muted-foreground/15" : "text-foreground"}`}>{m.value}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${isEmpty ? "bg-muted-foreground/10" : m.dot}`} />
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/40">{m.label}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
