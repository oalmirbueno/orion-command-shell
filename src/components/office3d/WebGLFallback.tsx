/**
 * Office 3D — WebGL Fallback (premium 2D)
 *
 * Renderiza um painel 2D imersivo quando o WebGL não está disponível
 * ou falha em runtime. Usa o asset oficial orion-office-3d-visual-concept.png
 * como cenário e plota os agentes reais por cima como cards posicionados.
 *
 * Sem dados fake. Se não houver agentes, mostra empty state honesto.
 */
import { useMemo } from "react";
import { AlertTriangle, MonitorOff, Users, Sparkles } from "lucide-react";
import { useOrionData } from "@/hooks/useOrionData";
import { fetchAgents } from "@/domains/agents/fetcher";
import type { AgentView } from "@/domains/agents/types";
import { TIER_COLORS, STATUS_VISUAL } from "./OfficeLayout";

interface Props {
  reason?: string;
  onAgentClick?: (agent: AgentView) => void;
}

/** Detecta suporte a WebGL no browser de forma defensiva. */
export function detectWebGL(): { supported: boolean; reason?: string } {
  if (typeof window === "undefined") return { supported: false, reason: "SSR" };
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return { supported: false, reason: "WebGL não suportado neste navegador" };
    return { supported: true };
  } catch (e) {
    return { supported: false, reason: e instanceof Error ? e.message : "Falha ao inicializar WebGL" };
  }
}

/** Distribui agentes em uma grade orgânica sobre o asset 2D. */
function computeLayout(agents: AgentView[]) {
  const orchs = agents.filter(a => a.tier === "orchestrator");
  const cores = agents.filter(a => a.tier === "core");
  const sups = agents.filter(a => a.tier === "support");

  const positioned: { agent: AgentView; x: number; y: number }[] = [];

  // Orchestrators: top-center band
  orchs.forEach((a, i) => {
    const span = Math.max(orchs.length, 1);
    const x = 50 + (i - (span - 1) / 2) * 18;
    positioned.push({ agent: a, x, y: 28 });
  });

  // Cores: middle band (operations)
  cores.forEach((a, i) => {
    const perRow = 6;
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const rows = Math.ceil(cores.length / perRow);
    const span = Math.min(cores.length - row * perRow, perRow);
    const x = 50 + (col - (span - 1) / 2) * 13;
    const y = 52 + row * 14 - (rows - 1) * 7;
    positioned.push({ agent: a, x, y });
  });

  // Support: side rails
  sups.forEach((a, i) => {
    const onLeft = i % 2 === 0;
    const idx = Math.floor(i / 2);
    const x = onLeft ? 8 + (idx % 2) * 4 : 88 + (idx % 2) * 4;
    const y = 38 + idx * 12;
    positioned.push({ agent: a, x: Math.min(94, Math.max(4, x)), y: Math.min(92, y) });
  });

  return positioned;
}

export function WebGLFallback({ reason, onAgentClick }: Props) {
  const { data: agents, state } = useOrionData<AgentView[]>({
    key: "agents-page",
    fetcher: fetchAgents,
    refreshInterval: 30_000,
  });

  const list = agents || [];
  const layout = useMemo(() => computeLayout(list), [list]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#1a1a2e]">
      {/* Visual concept background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(180deg, hsl(var(--background)/0.55) 0%, hsl(var(--background)/0.35) 50%, hsl(var(--background)/0.7) 100%), url(/orion-assets/orion-office-3d-visual-concept.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Scanline overlay for premium feel */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, hsl(var(--primary)) 0 1px, transparent 1px 3px)",
        }}
      />

      {/* Top notice */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-20">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-card/80 backdrop-blur-md border border-status-warning/30">
          <MonitorOff className="h-3.5 w-3.5 text-status-warning" />
          <span className="text-[11px] font-mono text-foreground/80">
            Modo 2D — WebGL indisponível
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-card/80 backdrop-blur-md border border-border/40">
          <Users className="h-3 w-3 text-muted-foreground/60" />
          <span className="text-[11px] font-mono text-muted-foreground">
            {list.filter(a => a.status === "active").length} ativos · {list.length} total
          </span>
        </div>
      </div>

      {/* Agents */}
      {state === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Sparkles className="h-5 w-5 text-primary/40 animate-pulse" />
        </div>
      )}

      {state === "error" && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center space-y-2 px-6 py-4 rounded-md bg-card/80 backdrop-blur-md border border-status-error/30">
            <AlertTriangle className="h-5 w-5 text-status-error/70 mx-auto" />
            <p className="text-xs font-mono text-muted-foreground">Falha ao carregar agentes</p>
          </div>
        </div>
      )}

      {state === "ready" && layout.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <p className="text-xs font-mono text-muted-foreground/60">Nenhum agente descoberto</p>
        </div>
      )}

      {layout.map(({ agent, x, y }) => {
        const tierColor = TIER_COLORS[agent.tier] || TIER_COLORS.support;
        const sv = STATUS_VISUAL[agent.status] || STATUS_VISUAL.idle;
        const hasTask =
          !!agent.currentTask &&
          agent.currentTask !== "Sem tarefa ativa" &&
          agent.currentTask !== "—";
        const isActive = agent.status === "active" && hasTask;

        return (
          <button
            key={agent.id}
            onClick={() => onAgentClick?.(agent)}
            className="absolute z-10 group -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110 focus:outline-none"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <div className="flex flex-col items-center gap-1">
              {/* Avatar */}
              <div className="relative">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg border-2"
                  style={{
                    backgroundColor: tierColor,
                    borderColor: isActive ? sv.color : "transparent",
                    boxShadow: isActive
                      ? `0 0 18px ${sv.color}66, 0 0 6px ${tierColor}88`
                      : `0 0 10px ${tierColor}55`,
                  }}
                >
                  {agent.name.charAt(0).toUpperCase()}
                </div>
                {/* Status dot */}
                <div
                  className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card"
                  style={{ backgroundColor: sv.color }}
                />
                {/* Alert badge */}
                {agent.alertCount > 0 && (
                  <div className="absolute -bottom-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-status-error text-[9px] font-bold text-white flex items-center justify-center border border-card">
                    {agent.alertCount}
                  </div>
                )}
              </div>

              {/* Name */}
              <div className="px-1.5 py-0.5 rounded bg-card/85 backdrop-blur-sm border border-border/40 max-w-[110px]">
                <p className="text-[10px] font-semibold text-foreground truncate">
                  {agent.name}
                </p>
              </div>

              {/* Task pill — only if real */}
              {isActive && (
                <div className="px-1.5 py-0.5 rounded bg-card/85 backdrop-blur-sm border border-primary/20 max-w-[140px]">
                  <p className="text-[9px] font-mono text-primary/80 truncate">
                    ⚡ {agent.currentTask.slice(0, 24)}
                  </p>
                </div>
              )}
            </div>

            {/* Hover detail */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 whitespace-nowrap">
              <div className="bg-card/95 backdrop-blur-md border border-border/60 rounded px-2 py-1 shadow-xl">
                <p className="text-[10px] font-mono text-muted-foreground">{agent.role}</p>
              </div>
            </div>
          </button>
        );
      })}

      {/* Bottom reason */}
      {reason && (
        <div className="absolute bottom-3 left-3 right-3 z-20">
          <div className="px-3 py-1.5 rounded-md bg-card/80 backdrop-blur-md border border-border/40">
            <p className="text-[10px] font-mono text-muted-foreground/60 truncate">
              Motivo: {reason}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
