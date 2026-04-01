import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import { Box, Eye, Maximize2, Layers, AlertTriangle } from "lucide-react";
import { Suspense, useState, Component, type ReactNode } from "react";
import { SceneCanvas, SceneOverlay } from "@/components/office3d/SceneCanvas";
import { AgentDetailSheet } from "@/components/sheets/AgentDetailSheet";
import type { AgentView } from "@/domains/agents/types";

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
            <button
              onClick={() => this.setState({ hasError: false, error: "" })}
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
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

  return (
    <OrionLayout title="Office 3D">
      <div className="space-y-6">
        <OrionBreadcrumb items={["Mission Control", "Office 3D"]} />

        {/* Header */}
        <div className="flex items-center gap-4 px-5 py-4 rounded-lg border border-primary/15 bg-primary/5">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Box className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-semibold text-foreground">Visão 3D — Arquitetura Operacional</h2>
              <span className="orion-badge orion-badge-success">Live</span>
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              Agentes reais do ecossistema · Status e tarefa atual
            </p>
          </div>
        </div>

        {/* 3D Viewport */}
        <div className={`orion-card overflow-hidden ${fullscreen ? "fixed inset-0 z-50 rounded-none" : ""}`}>
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-card">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Viewport 3D</span>
              <div className="h-3 w-px bg-border/30" />
              <div className="flex items-center gap-1.5">
                <Eye className="h-3 w-3 text-muted-foreground/60" />
                <span className="text-xs font-mono text-muted-foreground/60">Perspectiva · Auto-Rotate</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFullscreen((f) => !f)}
                className="text-xs font-mono px-2.5 py-1 rounded bg-card border border-border/30 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Maximize2 className="h-3 w-3" />
                {fullscreen ? "Sair" : "Expandir"}
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div style={{ height: fullscreen ? "calc(100vh - 41px)" : "520px" }}>
            <WebGLErrorBoundary>
              <Suspense fallback={<SceneOverlay state="loading" />}>
                <SceneCanvas />
              </Suspense>
            </WebGLErrorBoundary>
          </div>
        </div>

        {/* Info panels */}
        {!fullscreen && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Layers */}
            <div className="orion-card p-4">
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" /> Camadas Ativas
              </h3>
              <div className="space-y-2">
                {[
                  { label: "Agentes (API)", color: "bg-primary/60", active: true },
                  { label: "Conexões", color: "bg-accent-foreground/40", active: true },
                  { label: "Status live", color: "bg-status-online/60", active: true },
                  { label: "Tarefa atual", color: "bg-status-warning/60", active: true },
                ].map((layer) => (
                  <div key={layer.label} className="flex items-center gap-2.5 py-1">
                    <div className={`w-2.5 h-2.5 rounded-full ${layer.color} ${layer.active ? "" : "opacity-25"}`} />
                    <span className={`text-xs ${layer.active ? "text-foreground/80" : "text-muted-foreground/40 line-through"}`}>
                      {layer.label}
                    </span>
                    <span className="ml-auto text-xs font-mono text-muted-foreground/30">
                      {layer.active ? "ON" : "OFF"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="orion-card p-4">
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">Controles</h3>
              <div className="space-y-1.5 text-xs font-mono text-muted-foreground/50">
                <p>Arrastar → Orbitar câmera</p>
                <p>Scroll → Zoom (4x – 16x)</p>
                <p>Shift + Arrastar → Pan</p>
                <p className="text-primary/40 pt-1">Auto-rotação ativa</p>
              </div>
            </div>

            {/* Legend */}
            <div className="orion-card p-4">
              <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">Legenda</h3>
              <div className="space-y-2">
                {[
                  { label: "Orquestrador", color: "bg-[#a78bfa]", desc: "Coordenação central" },
                  { label: "Núcleo", color: "bg-[#60a5fa]", desc: "Execução principal" },
                  { label: "Suporte", color: "bg-[#6ee7b7]", desc: "Ferramentas e recursos" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-sm ${item.color}`} />
                    <div>
                      <span className="text-xs text-foreground/70">{item.label}</span>
                      <span className="text-xs text-muted-foreground/40 ml-1.5">— {item.desc}</span>
                    </div>
                  </div>
                ))}
                <div className="pt-1.5 border-t border-border/20 mt-2 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#a3e635]" />
                    <span className="text-xs text-muted-foreground/50">Ativo — com tarefa</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]" />
                    <span className="text-xs text-muted-foreground/50">Idle — sem tarefa</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#6b7280]" />
                    <span className="text-xs text-muted-foreground/50">Offline</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </OrionLayout>
  );
};

export default Office3DPage;
