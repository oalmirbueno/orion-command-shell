import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Hammer, Bot, Activity, ChevronRight } from "lucide-react";
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

function timeAgo(iso?: string): string {
  if (!iso) return "—";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  return `${Math.round(mins / 60)}h`;
}

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

  const online = agents.filter((a) => a.status === "online");
  const totalSessions = agents.reduce((s, a) => s + (a.activeSessions ?? 0), 0);

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
          <span className="text-[10px] font-mono">{online.length}/{agents.length} online</span>
          <ChevronRight className="h-3 w-3" />
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {isLoading && !agents.length ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-9 rounded-md bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : agents.length === 0 ? (
          <p className="text-xs text-muted-foreground/40 text-center py-3">Aguardando dados</p>
        ) : (
          <>
            {/* Summary strip */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground/60 font-mono px-1">
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3 text-emerald-400" />
                {totalSessions} sessões
              </span>
            </div>

            {/* Top agents */}
            {agents.slice(0, 4).map((a) => {
              const isOnline = a.status === "online";
              return (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-md border border-border bg-muted/10 px-3 py-2"
                >
                  <div className="flex items-center gap-2 truncate">
                    {a.emoji ? (
                      <span className="text-sm">{a.emoji}</span>
                    ) : (
                      <Bot className="h-3.5 w-3.5 text-muted-foreground/50" />
                    )}
                    <span className="text-xs font-medium text-foreground/80 truncate max-w-[120px]">
                      {a.name}
                    </span>
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        isOnline ? "bg-emerald-400" : "bg-muted-foreground/30"
                      }`}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground/50">
                    {(a.activeSessions ?? 0) > 0 && <span>{a.activeSessions}s</span>}
                    <span>{timeAgo(a.lastActivity)}</span>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
