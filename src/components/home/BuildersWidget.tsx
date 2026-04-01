import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Hammer, Bot, Activity, ChevronRight, Terminal, Zap, Package, Server } from "lucide-react";
import { API_BASE_URL } from "@/domains/api";

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

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-border cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={() => navigate("/builders")}
      >
        <div className="flex items-center gap-2">
          <Hammer className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">Builders</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground/50">
          <span className="text-[10px] font-mono">{online}/{agents.length} online</span>
          <ChevronRight className="h-3 w-3" />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 border-b border-border divide-x divide-border">
        {[
          { label: "OpenClaw", value: grouped.openclaw.length, icon: Server, color: "text-primary" },
          { label: "Claude Code", value: grouped["claude-code"].length, icon: Terminal, color: "text-purple-400" },
          { label: "AIOX Squads", value: `${activeSquads}/${squads.length}`, icon: Package, color: "text-amber-400" },
        ].map((m) => (
          <div key={m.label} className="flex items-center gap-1.5 px-2.5 py-2">
            <m.icon className={`h-3 w-3 ${m.color} shrink-0`} />
            <div className="min-w-0">
              <div className="text-[9px] font-mono text-muted-foreground/50 uppercase truncate">{m.label}</div>
              <div className="text-sm font-bold text-foreground">{isLoading ? "—" : m.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Domain previews */}
      <div className="p-3 space-y-3">
        {isLoading && !agents.length ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-9 rounded-md bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : agents.length === 0 && squads.length === 0 ? (
          <p className="text-xs text-muted-foreground/40 text-center py-3">Aguardando dados de builders</p>
        ) : (
          <>
            {(["openclaw", "claude-code", "aiox"] as BuilderDomain[]).map((domain) => {
              const items = grouped[domain];
              if (!items.length) return null;
              const meta = DOMAIN_META[domain];
              return (
                <div key={domain} className="space-y-1.5">
                  <div className="flex items-center gap-1.5 px-1">
                    <meta.icon className={`h-3 w-3 ${meta.accent}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">{meta.label}</span>
                    <span className="text-[10px] font-mono text-muted-foreground/40">({items.length})</span>
                  </div>
                  {items.slice(0, 2).map((a) => {
                    const isOnline = a.status === "online";
                    return (
                      <div key={a.id} className="flex items-center justify-between rounded-md border border-border bg-muted/10 px-3 py-2">
                        <div className="flex items-center gap-2 truncate">
                          {a.emoji ? <span className="text-sm">{a.emoji}</span> : <meta.icon className={`h-3.5 w-3.5 ${meta.accent}/50`} />}
                          <span className="text-xs font-medium text-foreground/80 truncate max-w-[120px]">{a.name}</span>
                          <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-400" : "bg-muted-foreground/30"}`} />
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground/50">
                          {(a.activeSessions ?? 0) > 0 && <span>{a.activeSessions}s</span>}
                          <span>{timeAgo(a.lastActivity)}</span>
                        </div>
                      </div>
                    );
                  })}
                  {items.length > 2 && <p className="text-[10px] text-muted-foreground/40 font-mono px-1">+{items.length - 2} mais</p>}
                </div>
              );
            })}

            {/* AIOX Squads preview */}
            {squads.length > 0 && (
              <div className="space-y-1.5 pt-1 border-t border-border">
                <div className="flex items-center gap-1.5 px-1">
                  <Package className="h-3 w-3 text-amber-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Squads Instalados</span>
                  <span className="text-[10px] font-mono text-muted-foreground/40">({squads.length})</span>
                </div>
                {squads.slice(0, 3).map((sq) => (
                  <div key={sq.id} className="flex items-center justify-between rounded-md border border-amber-400/10 bg-amber-400/5 px-3 py-1.5">
                    <span className="text-xs font-medium text-foreground/80 truncate max-w-[160px]">{sq.name}</span>
                    <div className="flex items-center gap-2">
                      {sq.status === "active" && (
                        <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-emerald-400/10 text-emerald-400">ativo</span>
                      )}
                      <span className="text-[10px] font-mono text-muted-foreground/50">
                        {Array.isArray(sq.files) ? sq.files.length : sq.files ?? 0} arq
                      </span>
                    </div>
                  </div>
                ))}
                {squads.length > 3 && <p className="text-[10px] text-muted-foreground/40 font-mono px-1">+{squads.length - 3} mais</p>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
