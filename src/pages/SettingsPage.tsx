/**
 * Settings — Configurações do Mission Control
 * Leitura operacional de status, domínios, conectividade e configuração.
 */

import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import { useDomainHealth, type DomainKey, type DomainHealthEntry } from "@/hooks/useDomainHealth";
import { API_BASE_URL, isUsingLocalBackend } from "@/domains/api";
import {
  Settings, Server, Wifi, WifiOff, Activity, Clock, Database,
  Radio, Shield, Eye, Lock, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Loader2,
  Zap, ArrowDown
} from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { apiUrl } from "@/domains/api";
import { sseDiagnostics } from "@/hooks/sseDiagnostics";
import { cn } from "@/lib/utils";

/* ── Domain labels ── */
const DOMAIN_LABELS: Record<DomainKey, string> = {
  system: "Sistema",
  sessions: "Sessões",
  agents: "Agentes",
  cron: "Cron",
  alerts: "Alertas",
  operations: "Operações",
  activity: "Atividade",
  memory: "Memória",
  files: "Arquivos",
  home: "Home",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  live: <CheckCircle2 className="h-3.5 w-3.5 text-status-online" />,
  stale: <AlertTriangle className="h-3.5 w-3.5 text-status-warning" />,
  offline: <XCircle className="h-3.5 w-3.5 text-status-error" />,
  loading: <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />,
};

const STATUS_LABEL: Record<string, string> = {
  live: "Live",
  stale: "Desatualizado",
  offline: "Offline",
  loading: "Carregando",
};

const GLOBAL_LABEL: Record<string, { text: string; cls: string }> = {
  live: { text: "Todos os domínios conectados", cls: "text-status-online" },
  partial: { text: "Conectividade parcial", cls: "text-status-warning" },
  offline: { text: "Backend indisponível", cls: "text-status-error" },
  loading: { text: "Inicializando…", cls: "text-muted-foreground" },
};

/* ── API ping ── */
function useApiPing() {
  const [status, setStatus] = useState<"checking" | "ok" | "error">("checking");
  const [latency, setLatency] = useState<number | null>(null);

  const ping = () => {
    setStatus("checking");
    const t0 = performance.now();
    fetch(apiUrl("/system/stats"), { method: "GET", signal: AbortSignal.timeout(8000) })
      .then(r => {
        const ms = Math.round(performance.now() - t0);
        setLatency(ms);
        setStatus(r.ok ? "ok" : "error");
      })
      .catch(() => {
        setLatency(null);
        setStatus("error");
      });
  };

  useEffect(() => { ping(); }, []);
  return { status, latency, ping };
}

/* ── Section card ── */
function SectionCard({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ConfigRow({ label, value, badge, readonly = true }: {
  label: string;
  value: string;
  badge?: string;
  readonly?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
      <div className="flex items-center gap-2">
        {readonly ? <Lock className="h-3 w-3 text-muted-foreground/50" /> : <Eye className="h-3 w-3 text-primary/50" />}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <code className="text-xs font-mono text-foreground/80 bg-muted/30 px-2 py-0.5 rounded">{value}</code>
        {badge && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-border text-muted-foreground">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Domain row ── */
function DomainRow({ domain, entry }: { domain: DomainKey; entry: DomainHealthEntry }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
      <div className="flex items-center gap-2.5">
        {STATUS_ICON[entry.status]}
        <span className="text-xs font-medium text-foreground">{DOMAIN_LABELS[domain]}</span>
      </div>
      <div className="flex items-center gap-3">
        {entry.source && (
          <span className={cn(
            "text-[10px] font-mono px-1.5 py-0.5 rounded border",
            entry.source === "api" ? "text-status-online border-status-online/30" : "text-muted-foreground border-border/40"
          )}>
            {entry.source === "api" ? "API" : entry.source === "cache" ? "CACHE" : "FALLBACK"}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground">
          {STATUS_LABEL[entry.status]}
        </span>
        {entry.lastUpdated && (
          <span className="text-[10px] text-muted-foreground/50 font-mono">
            {entry.lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── SSE Diagnostics Section ── */
const SSE_STATUS_MAP: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  connected: { label: "Conectado", icon: <Zap className="h-3.5 w-3.5 text-status-online" />, cls: "text-status-online" },
  connecting: { label: "Conectando…", icon: <Loader2 className="h-3.5 w-3.5 text-status-warning animate-spin" />, cls: "text-status-warning" },
  disconnected: { label: "Desconectado", icon: <WifiOff className="h-3.5 w-3.5 text-status-error" />, cls: "text-status-error" },
  unsupported: { label: "Não suportado", icon: <XCircle className="h-3.5 w-3.5 text-muted-foreground" />, cls: "text-muted-foreground" },
};

function SSEDiagnosticsSection() {
  const [, setTick] = useState(0);

  useEffect(() => {
    return sseDiagnostics.subscribe(() => setTick(t => t + 1));
  }, []);

  const { status, events, connectedAt, reconnects } = sseDiagnostics;
  const info = SSE_STATUS_MAP[status] || SSE_STATUS_MAP.disconnected;

  return (
    <SectionCard title="Diagnóstico SSE (Real-time)" icon={Zap}>
      {/* Status row */}
      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          {info.icon}
          <span className={cn("text-sm font-semibold", info.cls)}>{info.label}</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono">
          {connectedAt && (
            <span>Desde {connectedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
          )}
          <span>Reconexões: {reconnects}</span>
        </div>
      </div>

      {/* Event log */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <ArrowDown className="h-3 w-3 text-muted-foreground/50" />
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Últimos eventos ({events.length})
          </span>
        </div>
        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground/40 text-center py-6">Nenhum evento SSE recebido</p>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-0.5 scrollbar-thin">
            {events.map((ev, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-online animate-pulse" />
                  <span className="text-xs font-mono font-medium text-foreground">{ev.domain}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
                  <span>{(ev.size / 1024).toFixed(1)} KB</span>
                  <span>{ev.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SectionCard>
  );
}

/* ── Page ── */
const SettingsPage = () => {
  const health = useDomainHealth();
  const apiPing = useApiPing();
  const globalInfo = GLOBAL_LABEL[health.global] || GLOBAL_LABEL.loading;

  const allDomains = Object.entries(health.domains) as [DomainKey, DomainHealthEntry][];
  const liveDomains = allDomains.filter(([, e]) => e.status === "live");
  const otherDomains = allDomains.filter(([, e]) => e.status !== "live");

  return (
    <OrionLayout title="Configurações">
      <div className="space-y-6">
        <OrionBreadcrumb items={["Mission Control", "Configurações"]} />

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Configurações</h1>
            <p className="text-xs text-muted-foreground">Leitura operacional • Status e conectividade</p>
          </div>
        </div>

        {/* Global status banner */}
        <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {health.global === "live" ? <Wifi className="h-4 w-4 text-status-online" /> : health.global === "offline" ? <WifiOff className="h-4 w-4 text-status-error" /> : <Activity className="h-4 w-4 text-status-warning" />}
            <div>
              <span className={cn("text-sm font-semibold", globalInfo.cls)}>{globalInfo.text}</span>
              <p className="text-[10px] text-muted-foreground">{health.liveCount}/{health.totalTracked} domínios ativos</p>
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">{new Date().toLocaleTimeString("pt-BR")}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* API & Conexão */}
          <SectionCard title="Conexão API" icon={Server}>
            <ConfigRow
              label="Base URL"
              value={API_BASE_URL}
              badge={isUsingLocalBackend() ? "Local" : "Remoto"}
            />
            <ConfigRow label="Modo" value={isUsingLocalBackend() ? "Proxy relativo (/api)" : "Endpoint absoluto"} />
            <ConfigRow label="SSE Stream" value="/api/stream" badge="Somente leitura" />

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Ping API</span>
                {apiPing.status === "checking" && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                {apiPing.status === "ok" && <CheckCircle2 className="h-3 w-3 text-status-online" />}
                {apiPing.status === "error" && <XCircle className="h-3 w-3 text-status-error" />}
                {apiPing.latency !== null && (
                  <span className="text-[10px] font-mono text-muted-foreground">{apiPing.latency}ms</span>
                )}
              </div>
              <button
                onClick={apiPing.ping}
                className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                Testar
              </button>
            </div>
          </SectionCard>

          {/* Arquitetura */}
          <SectionCard title="Arquitetura de Dados" icon={Database}>
            <ConfigRow label="Estratégia" value="Real-first, fallback-safe" badge="Somente leitura" />
            <ConfigRow label="Backend" value="OpenClaw" />
            <ConfigRow label="Cache" value="React Query (30s stale)" />
            <ConfigRow label="Real-time" value="SSE → QueryClient inject" />
            <ConfigRow label="Fallback" value="Estado vazio honesto" />
          </SectionCard>

          {/* Domínios Live */}
          <SectionCard title={`Domínios Live (${liveDomains.length})`} icon={Radio}>
            {liveDomains.length === 0 ? (
              <p className="text-xs text-muted-foreground/50 py-4 text-center">Nenhum domínio live no momento</p>
            ) : (
              liveDomains.map(([d, e]) => <DomainRow key={d} domain={d} entry={e} />)
            )}
          </SectionCard>

          {/* Domínios Pendentes */}
          <SectionCard title={`Outros Domínios (${otherDomains.length})`} icon={Shield}>
            {otherDomains.length === 0 ? (
              <p className="text-xs text-muted-foreground/50 py-4 text-center">Todos os domínios estão live</p>
            ) : (
              otherDomains.map(([d, e]) => <DomainRow key={d} domain={d} entry={e} />)
            )}
          </SectionCard>
        </div>

        {/* SSE Diagnostics */}
        <SSEDiagnosticsSection />

        {/* Notas operacionais */}
        <SectionCard title="Notas Operacionais" icon={Clock}>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>• Todas as configurações de conexão são <strong className="text-foreground">somente leitura</strong> nesta interface.</p>
            <p>• A <code className="text-foreground/80 bg-muted/30 px-1 rounded">VITE_API_BASE_URL</code> é definida via variável de ambiente no build.</p>
            <p>• Domínios em <strong className="text-foreground">fallback</strong> exibem estados vazios honestos até o backend responder.</p>
            <p>• O stream SSE reconecta automaticamente em caso de desconexão.</p>
          </div>
        </SectionCard>
      </div>
    </OrionLayout>
  );
};

export default SettingsPage;
