import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb, OrionSectionHeader } from "@/components/orion";
import { Box, Eye, RotateCcw, Maximize2, Layers } from "lucide-react";
import { Suspense, useState } from "react";
import { SceneCanvas } from "@/components/office3d/SceneCanvas";

const layerItems = [
  { label: "Agentes", color: "bg-[#a78bfa]", active: true },
  { label: "Conexões", color: "bg-[#60a5fa]", active: true },
  { label: "Sessões", color: "bg-[#6ee7b7]", active: false },
  { label: "Pipelines", color: "bg-[#fbbf24]", active: false },
];

const Office3DPage = () => {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <OrionLayout title="Office 3D">
      <div className="max-w-7xl mx-auto space-y-6">
        <OrionBreadcrumb items={["Mission Control", "Office 3D"]} />

        {/* Header */}
        <div className="flex items-center gap-4 px-5 py-4 rounded-lg border border-primary/15 bg-primary/5">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Box className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-semibold text-foreground">Visão 3D — Arquitetura Operacional</h2>
              <span className="orion-badge orion-badge-success">Ativo</span>
            </div>
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
              Representação espacial dos agentes, conexões e fluxo operacional
            </p>
          </div>
        </div>

        {/* 3D Viewport */}
        <div className={`orion-card overflow-hidden ${fullscreen ? "fixed inset-0 z-50 rounded-none" : ""}`}>
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-card">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Viewport 3D</span>
              <div className="h-3 w-px bg-border/30" />
              <div className="flex items-center gap-1.5">
                <Eye className="h-3 w-3 text-muted-foreground/60" />
                <span className="text-[9px] font-mono text-muted-foreground/60">Perspectiva · Auto-Rotate</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFullscreen((f) => !f)}
                className="text-[8px] font-mono px-2.5 py-1 rounded bg-card border border-border/30 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Maximize2 className="h-2.5 w-2.5" />
                {fullscreen ? "Sair" : "Expandir"}
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div style={{ height: fullscreen ? "calc(100vh - 41px)" : "520px" }}>
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center bg-[#0a0a0f]">
                  <div className="text-center space-y-3">
                    <RotateCcw className="h-6 w-6 text-primary/40 animate-spin mx-auto" />
                    <p className="text-[10px] font-mono text-muted-foreground/40">Carregando viewport…</p>
                  </div>
                </div>
              }
            >
              <SceneCanvas />
            </Suspense>
          </div>
        </div>

        {/* Info panels */}
        {!fullscreen && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Layers */}
            <div className="orion-card p-4">
              <h3 className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Layers className="h-3 w-3" /> Camadas
              </h3>
              <div className="space-y-2">
                {layerItems.map((layer) => (
                  <div key={layer.label} className="flex items-center gap-2.5 py-1">
                    <div className={`w-2.5 h-2.5 rounded-full ${layer.color} ${layer.active ? "" : "opacity-25"}`} />
                    <span className={`text-[11px] ${layer.active ? "text-foreground/80" : "text-muted-foreground/40 line-through"}`}>
                      {layer.label}
                    </span>
                    <span className="ml-auto text-[8px] font-mono text-muted-foreground/30">
                      {layer.active ? "ON" : "OFF"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="orion-card p-4">
              <h3 className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-3">Controles</h3>
              <div className="space-y-1.5 text-[10px] font-mono text-muted-foreground/50">
                <p>Arrastar → Orbitar câmera</p>
                <p>Scroll → Zoom (4x – 16x)</p>
                <p>Shift + Arrastar → Pan</p>
                <p>Duplo-clique → Focar nó</p>
                <p className="text-primary/40 pt-1">Auto-rotação ativa</p>
              </div>
            </div>

            {/* Legend */}
            <div className="orion-card p-4">
              <h3 className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-3">Legenda</h3>
              <div className="space-y-2">
                {[
                  { label: "Orquestrador", color: "bg-[#a78bfa]", desc: "Coordenação central" },
                  { label: "Núcleo", color: "bg-[#60a5fa]", desc: "Execução principal" },
                  { label: "Suporte", color: "bg-[#6ee7b7]", desc: "Ferramentas e recursos" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-sm ${item.color}`} />
                    <div>
                      <span className="text-[10px] text-foreground/70">{item.label}</span>
                      <span className="text-[9px] text-muted-foreground/40 ml-1.5">— {item.desc}</span>
                    </div>
                  </div>
                ))}
                <div className="pt-1.5 border-t border-border/20 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-px bg-muted-foreground/20" />
                    <span className="text-[9px] text-muted-foreground/30">Linhas = dependências</span>
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
