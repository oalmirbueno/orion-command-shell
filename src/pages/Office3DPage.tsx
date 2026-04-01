import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import { Box, Eye, Maximize2, Users, AlertTriangle, Network } from "lucide-react";
import { Suspense, useState, useCallback, Component, type ReactNode } from "react";
import { SceneCanvas, SceneOverlay } from "@/components/office3d/SceneCanvas";
import { AgentCommandPanel } from "@/components/office3d/AgentCommandPanel";
import { MeetingBar } from "@/components/office3d/MeetingBar";
import { OfficeMinimap } from "@/components/office3d/OfficeMinimap";
import { SquadsPanel } from "@/components/office3d/SquadsPanel";
import { AgentDetailSheet } from "@/components/sheets/AgentDetailSheet";
import { useOrionData } from "@/hooks/useOrionData";
import { fetchAgents } from "@/domains/agents/fetcher";
import type { AgentView } from "@/domains/agents/types";
import { SECTOR_META, STATUS_VISUAL } from "@/components/office3d/OfficeLayout";

/* ── WebGL Error Boundary ── */
class WebGLErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  state = { hasError: false, error: "" };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-background">
          <div className="text-center space-y-3">
            <AlertTriangle className="h-6 w-6 text-status-error/60 mx-auto" />
            <p className="text-xs font-mono text-muted-foreground/60">WebGL indisponível</p>
            <p className="text-[10px] text-muted-foreground/40 max-w-xs">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: "" })} className="text-xs text-primary hover:text-primary/80 transition-colors">
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const Office3DPage = () => {
  const [fullscreen, setFullscreen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentView | null>(null);
  const [commandAgent, setCommandAgent] = useState<AgentView | null>(null);
  const [hoveredAgent, setHoveredAgent] = useState<AgentView | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [meetingAgents, setMeetingAgents] = useState<AgentView[]>([]);
  const [meetingActive, setMeetingActive] = useState(false);

  // Get all agents for meeting bar
  const { data: allAgents } = useOrionData<AgentView[]>({
    key: "agents-page",
    fetcher: fetchAgents,
    refreshInterval: 30_000,
  });

  const handleHover = useCallback((agent: AgentView | null, pos?: { x: number; y: number }) => {
    setHoveredAgent(agent);
    setTooltipPos(pos ?? null);
  }, []);

  const handleAgentClick = useCallback((agent: AgentView) => {
    setCommandAgent(agent);
    setHoveredAgent(null);
    setTooltipPos(null);
  }, []);

  const handleConveneToMeeting = useCallback((agent: AgentView) => {
    setMeetingActive(true);
    setMeetingAgents(prev => {
      if (prev.find(a => a.id === agent.id)) return prev;
      return [...prev, agent];
    });
    setCommandAgent(null);
  }, []);

  const handleDismissMeeting = useCallback(() => {
    setMeetingActive(false);
    setMeetingAgents([]);
  }, []);

  const meetingAgentIds = meetingActive ? meetingAgents.map(a => a.id) : [];

  return (
    <OrionLayout title="Office 3D">
      <div className="space-y-4">
        <OrionBreadcrumb items={["Mission Control", "Office 3D"]} />

        {/* Header */}
        <div className="flex items-center gap-4 px-5 py-3.5 rounded-lg border border-primary/15 bg-primary/5">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Box className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-semibold text-foreground">Escritório Operacional 3D</h2>
              <span className="orion-badge orion-badge-success">Live</span>
              {meetingActive && (
                <span className="orion-badge border-status-warning/30 text-status-warning bg-status-warning/10 flex items-center gap-1">
                  <Users className="h-2.5 w-2.5" /> Reunião
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              Equipe materializada · Status em tempo real · Comando espacial
            </p>
          </div>
        </div>

        {/* 3D Viewport */}
        <div className={`orion-card overflow-hidden ${fullscreen ? "fixed inset-0 z-50 rounded-none" : ""}`}>
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-card">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Escritório</span>
              <div className="h-3 w-px bg-border/30" />
              <div className="flex items-center gap-1.5">
                <Eye className="h-3 w-3 text-muted-foreground/60" />
                <span className="text-xs font-mono text-muted-foreground/60">
                  {(allAgents || []).filter(a => a.status === "active").length} ativos · {(allAgents || []).length} total
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {!meetingActive && (
                <button
                  onClick={() => setMeetingActive(true)}
                  className="text-xs font-mono px-2.5 py-1 rounded bg-card border border-status-warning/20 text-muted-foreground hover:text-status-warning hover:border-status-warning/40 transition-colors flex items-center gap-1"
                >
                  <Users className="h-3 w-3" /> Reunião
                </button>
              )}
              <button
                onClick={() => setFullscreen(f => !f)}
                className="text-xs font-mono px-2.5 py-1 rounded bg-card border border-border/30 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Maximize2 className="h-3 w-3" />
                {fullscreen ? "Sair" : "Expandir"}
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div className="relative" style={{ height: fullscreen ? "calc(100vh - 37px)" : "560px" }}>
            <WebGLErrorBoundary>
              <Suspense fallback={<SceneOverlay state="loading" />}>
                <SceneCanvas
                  onAgentClick={handleAgentClick}
                  onAgentHover={handleHover}
                  meetingAgentIds={meetingAgentIds}
                />
              </Suspense>
            </WebGLErrorBoundary>

            {/* Command panel */}
            {commandAgent && (
              <AgentCommandPanel
                agent={commandAgent}
                onClose={() => setCommandAgent(null)}
                onOpenDetail={(a) => { setSelectedAgent(a); setCommandAgent(null); }}
                onConveneToMeeting={handleConveneToMeeting}
              />
            )}

            {/* Hover tooltip */}
            {hoveredAgent && tooltipPos && !commandAgent && (
              <div
                className="fixed z-[60] pointer-events-none animate-in fade-in-0 duration-150"
                style={{ left: tooltipPos.x + 14, top: tooltipPos.y - 10 }}
              >
                <div className="bg-card/95 backdrop-blur-md border border-border/60 rounded-lg px-3 py-2 shadow-xl max-w-[200px]">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: STATUS_VISUAL[hoveredAgent.status]?.color }} />
                    <span className="text-xs font-semibold text-foreground truncate">{hoveredAgent.name}</span>
                  </div>
                  <div className="space-y-0.5 text-[10px] font-mono text-muted-foreground">
                    <p>{hoveredAgent.role}</p>
                    {hoveredAgent.currentTask !== "Sem tarefa ativa" && (
                      <p className="text-primary/70 truncate">⚡ {hoveredAgent.currentTask}</p>
                    )}
                  </div>
                  <p className="text-[9px] text-muted-foreground/30 mt-1.5 border-t border-border/20 pt-1">Clique para comandar</p>
                </div>
              </div>
            )}

            {/* Meeting bar */}
            {meetingActive && (
              <MeetingBar
                agents={meetingAgents}
                allAgents={allAgents || []}
                onAddAgent={(a) => setMeetingAgents(prev => prev.find(x => x.id === a.id) ? prev : [...prev, a])}
                onRemoveAgent={(id) => setMeetingAgents(prev => prev.filter(a => a.id !== id))}
                onDismiss={handleDismissMeeting}
              />
            )}

            {/* Minimap */}
            {!commandAgent && (
              <OfficeMinimap
                agents={allAgents || []}
                meetingAgentIds={meetingAgentIds}
              />
            )}
          </div>
        </div>

        {/* Info panels (only when not fullscreen) */}
        {!fullscreen && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Sectors */}
            {(["command", "operations", "support", "meeting"] as const).map(key => {
              const s = SECTOR_META[key];
              const count = key === "meeting"
                ? meetingAgents.length
                : (allAgents || []).filter(a => {
                    if (key === "command") return a.tier === "orchestrator";
                    if (key === "operations") return a.tier === "core";
                    return a.tier === "support";
                  }).length;
              return (
                <div key={key} className="orion-card p-3.5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
                    <span className="text-xs font-semibold text-foreground/80">{s.label}</span>
                    <span className="ml-auto text-xs font-mono text-muted-foreground/40">{count}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/50">{s.description}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Controls help */}
        {!fullscreen && (
          <div className="orion-card p-3.5">
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-[10px] font-mono text-muted-foreground/40">
              <span>Arrastar → Orbitar</span>
              <span>Scroll → Zoom</span>
              <span>Shift + Arrastar → Pan</span>
              <span>Clique no agente → Comandar</span>
              <span className="text-status-warning/40">Reunião → Convoque agentes para a mesa central</span>
            </div>
          </div>
        )}

        <AgentDetailSheet
          agent={selectedAgent}
          open={!!selectedAgent}
          onOpenChange={(open) => { if (!open) setSelectedAgent(null); }}
        />
      </div>
    </OrionLayout>
  );
};

export default Office3DPage;
