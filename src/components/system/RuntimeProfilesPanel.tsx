/**
 * Runtime Profiles Panel — exibido na aba "Perfis" da página /system.
 *
 * Mostra a lista de perfis (OpenClaw, Local, Demo, Custom, Hermes),
 * indica o ativo, faz probe individual e exibe latência + status.
 * Tokens nunca são expostos. URL é mascarada.
 */
import { useEffect, useState, useCallback } from "react";
import {
  RUNTIME_PROFILES,
  getActiveProfileId,
  maskUrl,
  probeProfile,
  type RuntimeProfile,
  type RuntimeProbeResult,
} from "@/domains/runtime/profiles";
import { CheckCircle2, AlertCircle, XCircle, HelpCircle, Radio, RefreshCw, Lock, Sparkles } from "lucide-react";

const KIND_LABEL: Record<RuntimeProfile["kind"], string> = {
  production: "Produção",
  development: "Desenvolvimento",
  demo: "Demonstração",
  future: "Futuro",
};

const STATUS_META = {
  ok: { Icon: CheckCircle2, color: "text-status-success", label: "Operacional", bg: "bg-status-success/10 border-status-success/30" },
  degraded: { Icon: AlertCircle, color: "text-status-warning", label: "Degradado", bg: "bg-status-warning/10 border-status-warning/30" },
  down: { Icon: XCircle, color: "text-status-error", label: "Inacessível", bg: "bg-status-error/10 border-status-error/30" },
  unknown: { Icon: HelpCircle, color: "text-muted-foreground", label: "Não verificado", bg: "bg-muted/20 border-border/40" },
} as const;

function formatTime(d: Date) {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function RuntimeProfilesPanel() {
  const activeId = getActiveProfileId();
  const [results, setResults] = useState<Record<string, RuntimeProbeResult | undefined>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  const runProbe = useCallback(async (profile: RuntimeProfile) => {
    setBusy(prev => ({ ...prev, [profile.id]: true }));
    const result = await probeProfile(profile);
    setResults(prev => ({ ...prev, [profile.id]: result }));
    setBusy(prev => ({ ...prev, [profile.id]: false }));
  }, []);

  // Auto-probe ativo na montagem
  useEffect(() => {
    const active = RUNTIME_PROFILES.find(p => p.id === activeId);
    if (active) runProbe(active);
  }, [activeId, runProbe]);

  const probeAll = async () => {
    await Promise.all(RUNTIME_PROFILES.filter(p => p.available).map(runProbe));
  };

  return (
    <div className="orion-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Perfis de Execução</h3>
            <span className="orion-badge orion-badge-info">{RUNTIME_PROFILES.length}</span>
          </div>
          <p className="text-[11px] text-muted-foreground/60 mt-0.5">
            Backends suportados pelo Mission Control · tokens nunca expostos no frontend
          </p>
        </div>
        <button
          onClick={probeAll}
          className="text-xs font-mono px-2.5 py-1 rounded bg-card border border-border/30 text-muted-foreground hover:text-foreground hover:border-border/60 transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className="h-3 w-3" />
          Testar todos
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {RUNTIME_PROFILES.map(profile => {
          const isActive = profile.id === activeId;
          const result = results[profile.id];
          const status = result?.status ?? "unknown";
          const meta = STATUS_META[status];
          const isBusy = busy[profile.id];

          return (
            <div
              key={profile.id}
              className={`rounded-lg border p-3.5 transition-colors ${
                isActive ? "border-primary/40 bg-primary/[0.04]" : "border-border/30 bg-surface-2/30"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-semibold text-foreground truncate">{profile.name}</span>
                  {isActive && (
                    <span className="orion-badge orion-badge-success text-[9px]">Ativo</span>
                  )}
                  {profile.experimental && (
                    <span className="orion-badge border-amber-400/30 text-amber-400 bg-amber-400/10 text-[9px] flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5" /> Futuro
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider whitespace-nowrap">
                  {KIND_LABEL[profile.kind]}
                </span>
              </div>

              <p className="text-[11px] text-muted-foreground/70 mb-2.5 leading-relaxed">
                {profile.description}
              </p>

              <div className="space-y-1.5 mb-3">
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <Lock className="h-2.5 w-2.5 text-muted-foreground/40 shrink-0" />
                  <span className="text-muted-foreground/40">URL:</span>
                  <span className="text-foreground/80 truncate">{maskUrl(profile.baseUrl)}</span>
                </div>
              </div>

              <div className={`rounded border ${meta.bg} px-2.5 py-1.5 flex items-center justify-between gap-2`}>
                <div className="flex items-center gap-1.5 min-w-0">
                  <meta.Icon className={`h-3 w-3 ${meta.color} shrink-0`} />
                  <span className={`text-[11px] font-semibold ${meta.color}`}>{meta.label}</span>
                  {result?.latencyMs != null && (
                    <span className="text-[10px] font-mono text-muted-foreground/60">
                      · {result.latencyMs}ms
                    </span>
                  )}
                </div>
                {result && (
                  <span className="text-[9px] font-mono text-muted-foreground/40 shrink-0">
                    {formatTime(result.checkedAt)}
                  </span>
                )}
              </div>

              {result?.detail && (
                <p className="text-[10px] font-mono text-muted-foreground/50 mt-1.5 truncate">
                  {result.detail}
                </p>
              )}

              <button
                onClick={() => runProbe(profile)}
                disabled={isBusy || !profile.available}
                className="mt-2.5 text-[10px] font-mono px-2 py-0.5 rounded bg-card border border-border/30 text-muted-foreground hover:text-foreground hover:border-border/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <RefreshCw className={`h-2.5 w-2.5 ${isBusy ? "animate-spin" : ""}`} />
                {isBusy ? "Testando…" : "Testar conexão"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-border/20 flex items-center gap-2 text-[10px] font-mono text-muted-foreground/40">
        <Lock className="h-2.5 w-2.5" />
        <span>Tokens, secrets e credenciais nunca são lidos nem renderizados pelo frontend.</span>
      </div>
    </div>
  );
}
