/**
 * DoctorPanel — diagnóstico consolidado do Mission Control.
 *
 * Roda probes reais contra os endpoints críticos (health, agents, cron, skills, memory)
 * e mostra latência, status, e falhas recentes.
 * Permite exportar o snapshot completo em JSON.
 *
 * Sem dados fake. Endpoints sem resposta real = "não verificado".
 */
import { useEffect, useState, useCallback } from "react";
import { Stethoscope, RefreshCw, Download, CheckCircle2, AlertCircle, XCircle, HelpCircle, Activity, Radio } from "lucide-react";
import { apiUrl } from "@/domains/api";
import { useDomainHealth } from "@/hooks/useDomainHealth";
import { sseDiagnostics } from "@/hooks/sseDiagnostics";

type ProbeStatus = "ok" | "degraded" | "down" | "unknown";

interface ProbeResult {
  endpoint: string;
  label: string;
  status: ProbeStatus;
  httpStatus: number | null;
  latencyMs: number | null;
  detail: string | null;
  checkedAt: Date;
}

const PROBES = [
  { endpoint: "/health", label: "API Health" },
  { endpoint: "/agents", label: "Agentes" },
  { endpoint: "/cron", label: "Cron Jobs" },
  { endpoint: "/skills", label: "Skills" },
  { endpoint: "/memory/snapshots", label: "Memória" },
  { endpoint: "/system", label: "Sistema" },
  { endpoint: "/system/stats", label: "Recursos" },
];

const STATUS_META = {
  ok: { Icon: CheckCircle2, color: "text-status-success", label: "OK", bg: "bg-status-success/10 border-status-success/30" },
  degraded: { Icon: AlertCircle, color: "text-status-warning", label: "Lento", bg: "bg-status-warning/10 border-status-warning/30" },
  down: { Icon: XCircle, color: "text-status-error", label: "Falha", bg: "bg-status-error/10 border-status-error/30" },
  unknown: { Icon: HelpCircle, color: "text-muted-foreground", label: "—", bg: "bg-muted/20 border-border/40" },
} as const;

async function runProbe(endpoint: string, label: string): Promise<ProbeResult> {
  const checkedAt = new Date();
  const t0 = performance.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(apiUrl(endpoint), {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timer);
    const latencyMs = Math.round(performance.now() - t0);
    if (!res.ok) {
      return { endpoint, label, status: "down", httpStatus: res.status, latencyMs, detail: `HTTP ${res.status}`, checkedAt };
    }
    return {
      endpoint,
      label,
      status: latencyMs > 2500 ? "degraded" : "ok",
      httpStatus: res.status,
      latencyMs,
      detail: latencyMs > 2500 ? "Latência elevada" : null,
      checkedAt,
    };
  } catch (e) {
    return {
      endpoint,
      label,
      status: "down",
      httpStatus: null,
      latencyMs: null,
      detail: e instanceof Error ? e.message : "Falha de conexão",
      checkedAt,
    };
  }
}

export function DoctorPanel() {
  const [results, setResults] = useState<ProbeResult[]>([]);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const health = useDomainHealth();
  const sse = sseDiagnostics.getSnapshot();

  const runAll = useCallback(async () => {
    setRunning(true);
    const probes = await Promise.all(PROBES.map(p => runProbe(p.endpoint, p.label)));
    setResults(probes);
    setLastRun(new Date());
    setRunning(false);
  }, []);

  useEffect(() => {
    runAll();
  }, [runAll]);

  const exportJSON = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      mission: "Orion Mission Control",
      probes: results.map(r => ({ ...r, checkedAt: r.checkedAt.toISOString() })),
      stream: {
        status: sse.status,
        connectedAt: sse.connectedAt?.toISOString() ?? null,
        uptimeSeconds: sse.uptimeSeconds,
        reconnects: sse.reconnects,
        eventCount: sse.eventCount,
        lastError: sse.lastError,
      },
      domains: Object.entries(health.domains).map(([key, d]) => ({
        domain: key,
        status: d.status,
        source: d.source,
        lastUpdated: d.lastUpdated?.toISOString() ?? null,
        error: d.error,
      })),
      global: { status: health.global, liveCount: health.liveCount, totalTracked: health.totalTracked },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orion-diagnostic-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const okCount = results.filter(r => r.status === "ok").length;
  const downCount = results.filter(r => r.status === "down").length;
  const degradedCount = results.filter(r => r.status === "degraded").length;
  const avgLatency = (() => {
    const valid = results.filter(r => r.latencyMs != null);
    if (valid.length === 0) return null;
    return Math.round(valid.reduce((s, r) => s + (r.latencyMs ?? 0), 0) / valid.length);
  })();

  const sseMeta =
    sse.status === "connected" ? STATUS_META.ok :
    sse.status === "connecting" ? STATUS_META.degraded :
    sse.status === "unsupported" ? STATUS_META.unknown : STATUS_META.down;
  const sseLabel =
    sse.status === "connected" ? "Stream conectado" :
    sse.status === "connecting" ? "Conectando…" :
    sse.status === "unsupported" ? "SSE não suportado" : "Stream desconectado";

  return (
    <div className="orion-card p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Diagnóstico (Doctor)</h3>
            {lastRun && (
              <span className="text-[10px] font-mono text-muted-foreground/40">
                · {lastRun.toLocaleTimeString("pt-BR")}
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground/60 mt-0.5">
            Probe vivo dos endpoints críticos · sem dados sintéticos
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={runAll}
            disabled={running}
            className="text-xs font-mono px-2.5 py-1 rounded bg-card border border-border/30 text-muted-foreground hover:text-foreground hover:border-border/60 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${running ? "animate-spin" : ""}`} />
            {running ? "Rodando…" : "Rodar diagnóstico"}
          </button>
          <button
            onClick={exportJSON}
            disabled={results.length === 0}
            className="text-xs font-mono px-2.5 py-1 rounded bg-card border border-border/30 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors flex items-center gap-1.5 disabled:opacity-30"
          >
            <Download className="h-3 w-3" />
            Exportar JSON
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <div className="rounded border border-status-success/20 bg-status-success/5 p-2.5">
          <p className="text-[10px] font-mono text-muted-foreground/60 uppercase">OK</p>
          <p className="text-lg font-semibold text-status-success">{okCount}</p>
        </div>
        <div className="rounded border border-status-warning/20 bg-status-warning/5 p-2.5">
          <p className="text-[10px] font-mono text-muted-foreground/60 uppercase">Degradado</p>
          <p className="text-lg font-semibold text-status-warning">{degradedCount}</p>
        </div>
        <div className="rounded border border-status-error/20 bg-status-error/5 p-2.5">
          <p className="text-[10px] font-mono text-muted-foreground/60 uppercase">Falha</p>
          <p className="text-lg font-semibold text-status-error">{downCount}</p>
        </div>
        <div className="rounded border border-primary/20 bg-primary/5 p-2.5">
          <p className="text-[10px] font-mono text-muted-foreground/60 uppercase">Latência média</p>
          <p className="text-lg font-semibold text-primary">{avgLatency != null ? `${avgLatency}ms` : "—"}</p>
        </div>
      </div>

      {/* Endpoint probes */}
      <div className="space-y-1.5 mb-4">
        {results.length === 0 && !running && (
          <p className="text-xs font-mono text-muted-foreground/50 py-3 text-center">
            Aguardando primeiro diagnóstico…
          </p>
        )}
        {results.map(r => {
          const meta = STATUS_META[r.status];
          return (
            <div
              key={r.endpoint}
              className={`flex items-center gap-3 px-3 py-2 rounded border ${meta.bg}`}
            >
              <meta.Icon className={`h-3.5 w-3.5 ${meta.color} shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">{r.label}</span>
                  <span className="text-[10px] font-mono text-muted-foreground/50">{r.endpoint}</span>
                </div>
                {r.detail && (
                  <p className="text-[10px] font-mono text-muted-foreground/50 truncate">{r.detail}</p>
                )}
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono shrink-0">
                {r.httpStatus != null && (
                  <span className="text-muted-foreground/50">HTTP {r.httpStatus}</span>
                )}
                {r.latencyMs != null && (
                  <span className={r.status === "ok" ? "text-status-success" : r.status === "degraded" ? "text-status-warning" : "text-muted-foreground/40"}>
                    {r.latencyMs}ms
                  </span>
                )}
                <span className={`uppercase font-bold ${meta.color}`}>{meta.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stream + Domains */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* SSE */}
        <div className={`rounded border ${sseMeta.bg} p-3`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Radio className={`h-3 w-3 ${sseMeta.color}`} />
              <span className="text-xs font-semibold text-foreground">Stream / SSE</span>
            </div>
            <span className={`text-[10px] font-bold uppercase ${sseMeta.color}`}>{sseLabel}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-muted-foreground/60">
            <div>
              <p className="text-muted-foreground/40">Eventos</p>
              <p className="text-foreground">{sse.eventCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground/40">Reconnects</p>
              <p className="text-foreground">{sse.reconnects}</p>
            </div>
            <div>
              <p className="text-muted-foreground/40">Uptime</p>
              <p className="text-foreground">{sse.uptimeSeconds != null ? `${sse.uptimeSeconds}s` : "—"}</p>
            </div>
          </div>
          {sse.lastError && (
            <p className="text-[10px] font-mono text-status-error/70 mt-2 truncate">⚠ {sse.lastError}</p>
          )}
        </div>

        {/* Domain health snapshot */}
        <div className="rounded border border-border/30 bg-surface-2/30 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-primary" />
              <span className="text-xs font-semibold text-foreground">Domínios</span>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground/60">
              {health.liveCount}/{health.totalTracked} live
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-mono">
            {Object.entries(health.domains).map(([key, d]) => {
              const color =
                d.status === "live" ? "text-status-success" :
                d.status === "stale" ? "text-status-warning" :
                d.status === "offline" ? "text-status-error" : "text-muted-foreground/40";
              return (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-muted-foreground/60 capitalize">{key}</span>
                  <span className={`uppercase font-bold ${color}`}>{d.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
