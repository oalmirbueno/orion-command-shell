import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import { OrionReady } from "@/components/orion";
import { Box, Layers, Eye } from "lucide-react";

const Office3DPage = () => {
  return (
    <OrionLayout title="Office 3D">
      <div className="max-w-7xl mx-auto space-y-8">
        <OrionBreadcrumb items={["Mission Control", "Office 3D"]} />

        {/* Header com contexto */}
        <div className="flex items-center gap-4 px-5 py-4 rounded-lg border border-primary/15 bg-primary/5">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Box className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-semibold text-foreground">Visão 3D do Escritório</h2>
              <span className="orion-badge orion-badge-info">Em preparação</span>
            </div>
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
              Visualização tridimensional do ambiente operacional Orion
            </p>
          </div>
        </div>

        {/* Área principal — viewport 3D placeholder */}
        <div className="orion-card overflow-hidden" style={{ minHeight: "500px" }}>
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 surface-2">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Viewport 3D</span>
              <div className="h-3 w-px bg-border/30" />
              <div className="flex items-center gap-1.5">
                <Eye className="h-3 w-3 text-muted-foreground/40" />
                <span className="text-[9px] font-mono text-muted-foreground/40">Perspectiva</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-mono px-2 py-0.5 rounded bg-surface-3 border border-border/30 text-muted-foreground/40 cursor-pointer hover:text-foreground transition-colors">Orbit</span>
              <span className="text-[8px] font-mono px-2 py-0.5 rounded bg-surface-3 border border-border/30 text-muted-foreground/40 cursor-pointer hover:text-foreground transition-colors">Pan</span>
              <span className="text-[8px] font-mono px-2 py-0.5 rounded bg-surface-3 border border-border/30 text-muted-foreground/40 cursor-pointer hover:text-foreground transition-colors">Reset</span>
            </div>
          </div>

          {/* 3D Canvas area */}
          <div className="flex items-center justify-center" style={{ minHeight: "440px", background: "radial-gradient(ellipse at center, hsl(var(--surface-2)) 0%, hsl(var(--surface-0)) 70%)" }}>
            <div className="text-center space-y-4">
              {/* Grid visual placeholder */}
              <div className="relative w-48 h-48 mx-auto">
                <div className="absolute inset-0 border border-primary/10 rounded-lg" style={{ transform: "perspective(400px) rotateX(45deg) rotateZ(45deg)" }}>
                  <div className="w-full h-full grid grid-cols-4 grid-rows-4">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div key={i} className="border border-primary/5" />
                    ))}
                  </div>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <Layers className="h-8 w-8 text-primary/30" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Canvas 3D</p>
                <p className="text-[10px] font-mono text-muted-foreground/40 mt-1">
                  Módulo de renderização 3D será integrado aqui
                </p>
                <p className="text-[9px] font-mono text-primary/50 mt-0.5">
                  React Three Fiber · Three.js · WebGL
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="orion-card p-4">
            <h3 className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Camadas Disponíveis</h3>
            <div className="space-y-1.5">
              {["Agentes", "Sessões", "Pipelines", "Infraestrutura"].map((layer) => (
                <div key={layer} className="flex items-center gap-2 py-1">
                  <div className="w-3 h-3 rounded-sm bg-primary/20 border border-primary/30" />
                  <span className="text-[11px] text-foreground/70">{layer}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="orion-card p-4">
            <h3 className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Controles</h3>
            <div className="space-y-1.5 text-[10px] font-mono text-muted-foreground/50">
              <p>Arrastar → Orbitar câmera</p>
              <p>Scroll → Zoom</p>
              <p>Shift + Arrastar → Pan</p>
              <p>Clique → Selecionar nó</p>
            </div>
          </div>
          <div className="orion-card p-4">
            <h3 className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Status do Módulo</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground/50">Renderizador</span>
                <span className="orion-badge orion-badge-neutral">Aguardando</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground/50">Dados</span>
                <span className="orion-badge orion-badge-info">Pronto</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground/50">Interação</span>
                <span className="orion-badge orion-badge-neutral">Aguardando</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </OrionLayout>
  );
};

export default Office3DPage;
