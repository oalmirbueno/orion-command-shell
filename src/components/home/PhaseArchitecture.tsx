import { useNavigate } from "react-router-dom";
import { Bot, Crown, Cpu, Link2, Archive, ChevronRight, Zap, WifiOff } from "lucide-react";
import type { AgentNode } from "@/domains/agents/types";

/**
 * Phase 1 Architecture Map — mostra a arquitetura oficial da fase 1
 * com separação clara entre ativos oficiais e legados.
 *
 * Regra crítica: status ESTRUTURAL (ativo/legado) ≠ status RUNTIME (online/offline/quente).
 */

// Known Phase 1 asset IDs — structural classification
const PHASE1_ASSETS: Record<string, { label: string; role: string; structural: "active" | "legacy"; linkedTo?: string }> = {
  "6559": { label: "Factory Multiagentes", role: "Setup, admin e supervisão", structural: "active", linkedTo: "6742" },
  "6742": { label: "Orion Core", role: "Hub central exposto", structural: "active" },
  "6799": { label: "Orion Projects", role: "Interno operacional", structural: "active" },
  "6802": { label: "Orion Advisor", role: "Interno founder OS", structural: "active" },
  "6606": { label: "Orion Core Legacy", role: "Hub central (legado)", structural: "legacy" },
  "6604": { label: "Orion Projects Legacy", role: "Operacional (legado)", structural: "legacy" },
  "6605": { label: "Orion Advisor Legacy", role: "Advisor (legado)", structural: "legacy" },
};

function matchAgent(agents: AgentNode[], assetLabel: string): AgentNode | undefined {
  const lower = assetLabel.toLowerCase();
  return agents.find(a => {
    const name = a.name.toLowerCase();
    // Try direct match or partial
    return name.includes(lower) || lower.includes(name) ||
      (lower.includes("factory") && name.includes("factory")) ||
      (lower.includes("core") && !lower.includes("legacy") && name.includes("core") && !name.includes("legacy")) ||
      (lower.includes("projects") && !lower.includes("legacy") && name.includes("projects") && !name.includes("legacy")) ||
      (lower.includes("advisor") && !lower.includes("legacy") && name.includes("advisor") && !name.includes("legacy"));
  });
}

interface PhaseArchitectureProps {
  agents: AgentNode[];
}

export function PhaseArchitecture({ agents = [] }: PhaseArchitectureProps) {
  const navigate = useNavigate();
  const activeAssets = Object.entries(PHASE1_ASSETS).filter(([, v]) => v.structural === "active");
  const legacyAssets = Object.entries(PHASE1_ASSETS).filter(([, v]) => v.structural === "legacy");

  const runtimeStatus = (label: string): "online" | "offline" | "no-data" => {
    const matched = matchAgent(agents, label);
    if (!matched) return "no-data";
    return matched.status === "active" || matched.status === "idle" ? "online" : "offline";
  };

  const runtimeDot: Record<string, { dot: string; label: string }> = {
    online: { dot: "bg-status-online", label: "Online" },
    offline: { dot: "bg-status-critical", label: "Offline" },
    "no-data": { dot: "bg-muted-foreground/30", label: "Sem dados" },
  };

  return (
    <section className="rounded-lg border border-border overflow-hidden">
      <div
        className="orion-panel-header cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={() => navigate("/agents")}
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-0.5 bg-primary rounded-full" />
          <h2 className="orion-panel-title">Arquitetura Fase 1</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-primary/60">
            {activeAssets.length} ativos · {legacyAssets.length} legados
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Active Official Assets */}
        <div>
          <div className="flex items-center gap-2 mb-2.5 px-1">
            <Crown className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-primary/60 font-semibold">Ativos Oficiais</span>
            <div className="flex-1 h-px bg-border/20" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activeAssets.map(([id, asset]) => {
              const runtime = runtimeStatus(asset.label);
              const rdot = runtimeDot[runtime];
              const isFactory = id === "6559";
              return (
                <div
                  key={id}
                  className={`rounded-lg border px-4 py-3 cursor-pointer hover:bg-accent/20 transition-colors ${
                    isFactory
                      ? "border-primary/20 bg-primary/[0.03]"
                      : "border-border/40"
                  }`}
                  onClick={() => navigate("/agents")}
                >
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className={`w-2 h-2 rounded-full ${rdot.dot}`} />
                    <span className="text-sm font-semibold text-foreground">{asset.label}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 ml-auto">
                      #{id}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground/50 ml-[18px]">{asset.role}</p>
                  <div className="flex items-center gap-2 mt-1.5 ml-[18px]">
                    <span className={`text-[10px] font-mono ${runtime === "online" ? "text-status-online" : runtime === "offline" ? "text-status-critical" : "text-muted-foreground/30"}`}>
                      {rdot.label}
                    </span>
                    {asset.linkedTo && (
                      <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground/30">
                        <Link2 className="h-3 w-3" />
                        <span>→ #{asset.linkedTo}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legacy Assets */}
        <div>
          <div className="flex items-center gap-2 mb-2.5 px-1">
            <Archive className="h-3.5 w-3.5 text-muted-foreground/40" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/30 font-semibold">Legados</span>
            <div className="flex-1 h-px bg-border/15" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {legacyAssets.map(([id, asset]) => {
              const runtime = runtimeStatus(asset.label);
              const rdot = runtimeDot[runtime];
              return (
                <div
                  key={id}
                  className="rounded-lg border border-border/25 px-3 py-2.5 opacity-50 hover:opacity-70 transition-opacity cursor-pointer"
                  onClick={() => navigate("/agents")}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${rdot.dot}`} />
                    <span className="text-xs font-medium text-foreground/60 truncate">{asset.label}</span>
                    <span className="text-[9px] font-mono text-muted-foreground/25 ml-auto">#{id}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/30 ml-[14px]">{asset.role}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
