import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Hammer, ChevronRight, Terminal, Zap, Package, Server } from "lucide-react";
import { API_BASE_URL } from "@/domains/api";
import { Skeleton } from "@/components/ui/skeleton";

interface RealAgent {
  id: string;
  name: string;
  emoji?: string;
  model?: string;
  status?: string;
  activeSessions?: number;
  lastActivity?: string;
}

interface AioxSquad {
  id: string;
  name: string;
  status?: string;
  files?: number | string[];
}

type BuilderDomain = "openclaw" | "claude-code" | "aiox";

const CLAUDE_KW = ["claude", "anthropic", "sonnet", "opus", "haiku", "claude-code"];
const AIOX_KW = ["aiox", "aio-x", "squad"];

function classify(agent: RealAgent): BuilderDomain {
  const h = `${agent.name} ${agent.model || ""} ${agent.id}`.toLowerCase();
  if (CLAUDE_KW.some((k) => h.includes(k))) return "claude-code";
  if (AIOX_KW.some((k) => h.includes(k))) return "aiox";
  return "openclaw";
}

function timeAgo(iso?: string): string {
  if (!iso) return "—";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  return `${Math.round(mins / 60)}h`;
}

const DOMAIN_META: Record<BuilderDomain, { label: string; icon: React.ElementType; accent: string }> = {
  openclaw: { label: "OpenClaw", icon: Server, accent: "text-primary" },
  "claude-code": { label: "Claude Code", icon: Terminal, accent: "text-purple-400" },
  aiox: { label: "AIOX", icon: Zap, accent: "text-amber-400" },
};

export function BuildersWidget() {
  const navigate = useNavigate();

  const { data: agents = [], isLoading } = useQuery<RealAgent[]>({
    queryKey: ["builders-widget"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/agents`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) return [];
      const d = await res.json();
      return Array.isArray(d) ? d : d?.agents ?? [];
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
    placeholderData: (prev) => prev,
  });

  const { data: squads = [] } = useQuery<AioxSquad[]>({
    queryKey: ["builders-aiox-squads"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/builders/aiox-squads`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) return [];
      const d = await res.json();
      return Array.isArray(d) ? d : d?.squads ?? [];
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
    placeholderData: (prev) => prev,
  });

  const grouped: Record<BuilderDomain, RealAgent[]> = { openclaw: [], "claude-code": [], aiox: [] };
  agents.forEach((a) => grouped[classify(a)].push(a));

  const online = agents.filter((a) => a.status === "online").length;
  const activeSquads = squads.filter((s) => s.status === "active").length;

  if (isLoading && !agents.length) {
    return (
      <div className="orion-card p-5 space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div
      className="orion-card hover:border-primary/20 transition-colors cursor-pointer group"
      onClick={() => navigate("/builders")}
    >
      {/* Header */}
      <div className="orion-panel-header">
        <div className="flex items-center gap-2">
          <Hammer className="h-4 w-4 text-primary" />
          <span className="orion-panel-title">Builders</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-muted-foreground/30">{online}/{agents.length} online</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-colors" />
        </div>
      </div>

      {/* Metrics row */}
      <div className="px-5 py-4">
        <div className="grid grid-cols-3 gap-4">
          {([
            { label: "OpenClaw", value: grouped.openclaw.length, icon: Server, color: "text-primary" },
            { label: "Claude Code", value: grouped["claude-code"].length, icon: Terminal, color: "text-purple-400" },
            { label: "Squads", value: `${activeSquads}/${squads.length}`, icon: Package, color: "text-amber-400" },
          ] as const).map((m) => (
            <div key={m.label}>
              <p className={`text-xl font-bold leading-none ${m.color}`}>{m.value}</p>
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/40 mt-1">{m.label}</span>
            </div>
          ))}
        </div>

        {/* Domain agent previews — scrollable */}
        {agents.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border/30 space-y-2 max-h-[160px] overflow-y-auto orion-thin-scroll">
            {(["openclaw", "claude-code", "aiox"] as BuilderDomain[]).map((domain) => {
              const items = grouped[domain];
              if (!items.length) return null;
              const meta = DOMAIN_META[domain];
              return items.slice(0, 2).map((a) => {
                const isOnline = a.status === "online";
                return (
                  <div key={a.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <meta.icon className={`h-3 w-3 ${meta.accent} opacity-50 shrink-0`} />
                      <span className="text-xs text-foreground/60 truncate">{a.name}</span>
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isOnline ? "bg-emerald-400" : "bg-muted-foreground/20"}`} />
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground/30 shrink-0">{timeAgo(a.lastActivity)}</span>
                  </div>
                );
              });
            })}
          </div>
        )}

        {/* Squads preview */}
        {squads.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/30 space-y-1.5 max-h-[120px] overflow-y-auto orion-thin-scroll">
            {squads.slice(0, 4).map((sq) => (
              <div key={sq.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Package className="h-3 w-3 text-amber-400/40 shrink-0" />
                  <span className="text-xs text-foreground/60 truncate">{sq.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {sq.status === "active" && (
                    <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-emerald-400/10 text-emerald-400">ativo</span>
                  )}
                  <span className="text-[10px] font-mono text-muted-foreground/30">
                    {Array.isArray(sq.files) ? sq.files.length : sq.files ?? 0} arq
                  </span>
                </div>
              </div>
            ))}
            {squads.length > 4 && (
              <p className="text-[10px] font-mono text-muted-foreground/25 text-right">+{squads.length - 4} mais</p>
            )}
          </div>
        )}

        {agents.length === 0 && squads.length === 0 && (
          <p className="text-xs text-muted-foreground/30 text-center py-3 mt-3">Aguardando dados de builders</p>
        )}
      </div>
    </div>
  );
}
