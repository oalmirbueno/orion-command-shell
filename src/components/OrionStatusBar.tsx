import { Cpu, HardDrive, MemoryStick, Clock, Activity, Server, Radio } from "lucide-react";
import { useSystemMetrics, type SubsystemHealth, type SubsystemStatus, type PanelStatus } from "@/hooks/useSystemMetrics";
import { useLastUpdated } from "@/hooks/useLastUpdated";
import { useDomainHealth, type DomainHealthStatus, type GlobalHealthStatus } from "@/hooks/useDomainHealth";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";

function Sep() {
  return <div className="w-px h-3.5 bg-border" />;
}

function pctColor(value: number | null): string {
  if (value === null) return "text-muted-foreground/40";
  if (value > 90) return "text-status-critical";
  if (value > 75) return "text-status-warning";
  return "text-foreground/70";
}

function latColor(ms: number | null): string {
  if (ms === null) return "text-muted-foreground/40";
  if (ms > 2000) return "text-status-critical";
  if (ms > 800) return "text-status-warning";
  return "text-foreground/70";
}

/* ── Combined panel status (merges system metrics health + domain health) ── */

const globalConfig: Record<GlobalHealthStatus, { label: string; color: string; dot: string }> = {
  live:    { label: "Live",     color: "text-status-online",       dot: "bg-status-online animate-pulse" },
  partial: { label: "Parcial",  color: "text-status-warning",      dot: "bg-status-warning animate-pulse" },
  offline: { label: "Offline",  color: "text-status-critical/60",  dot: "bg-status-critical/50" },
  loading: { label: "Loading",  color: "text-muted-foreground/60", dot: "bg-muted-foreground/40 animate-pulse" },
};

const domainStatusLabel: Record<DomainHealthStatus, { label: string; color: string }> = {
  live:    { label: "Live",    color: "text-status-online" },
  stale:   { label: "Stale",   color: "text-status-warning" },
  loading: { label: "...",     color: "text-muted-foreground/40" },
  offline: { label: "Offline", color: "text-status-critical/60" },
};

const subsysConfig: Record<SubsystemStatus, { color: string; dot: string; label: string }> = {
  online:  { color: "text-status-online",      dot: "bg-status-online animate-pulse", label: "Online" },
  offline: { color: "text-status-critical/60",  dot: "bg-status-critical/50",          label: "Offline" },
  unknown: { color: "text-muted-foreground/40", dot: "bg-muted-foreground/30",         label: "—" },
};

/* ── Shared components ── */

function MetricCell({ icon: Icon, label, value, color, tooltip }: {
  icon: React.ElementType;
  label: string;
  value: string;
  color?: string;
  tooltip?: string;
}) {
  const content = (
    <div className="flex items-center gap-1.5 cursor-default">
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
      <span className={color || "text-foreground/70"}>{value}</span>
    </div>
  );

  if (!tooltip) return content;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="top" className="text-xs font-mono max-w-xs whitespace-pre-line">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

function SubsystemPill({ status, label, tooltip }: { status: SubsystemStatus; label: string; tooltip?: string }) {
  const cfg = subsysConfig[status];
  const content = (
    <div className={`flex items-center gap-1.5 cursor-default ${cfg.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      <span>{label}</span>
    </div>
  );

  if (!tooltip) return content;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="top" className="text-xs font-mono">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

/* ── Main status bar ── */

export function OrionStatusBar() {
  const { metrics, updatedAt } = useSystemMetrics();
  const { lastUpdated } = useLastUpdated();
  const domainHealth = useDomainHealth();

  const displayTime = updatedAt || lastUpdated;
  const timeStr = displayTime ? format(displayTime, "HH:mm:ss") : "—";

  const defaultHealth: SubsystemHealth = { backend: "unknown", openclaw: "unknown", stats: "unknown" };
  const health = metrics?.health ?? defaultHealth;

  // Derive effective global status: merge system metrics health with domain health
  const effectiveGlobal = deriveEffectiveGlobal(health, domainHealth.global);
  const globalCfg = globalConfig[effectiveGlobal];

  // Format values
  const cpuStr = metrics?.cpu != null ? `${Math.round(metrics.cpu)}%` : "—";
  const ramStr = metrics?.ram != null ? `${metrics.ram}%` : "—";
  const diskStr = metrics?.disk != null ? `${metrics.disk}%` : "—";
  const latStr = metrics?.latencyMs != null && health.backend === "online" ? `${metrics.latencyMs}ms` : "—";
  const uptimeStr = metrics?.uptime || "—";

  // Tooltips
  const cpuTip = metrics.cpu !== null ? `CPU: ${Math.round(metrics.cpu)}%` : undefined;
  const ramTip = metrics.ramUsedGB && metrics.ramTotalGB
    ? `Memória: ${metrics.ramUsedGB} / ${metrics.ramTotalGB}` : undefined;
  const diskTip = metrics.diskUsedGB && metrics.diskTotalGB
    ? `Disco: ${metrics.diskUsedGB} / ${metrics.diskTotalGB}` : undefined;
  const latTip = metrics.latencyMs !== null ? `Latência API: ${metrics.latencyMs}ms` : undefined;
  const uptimeTip = [
    metrics.hostname ? `Host: ${metrics.hostname}` : null,
    metrics.platform ? `Plataforma: ${metrics.platform}` : null,
    metrics.uptime ? `Uptime: ${metrics.uptime}` : null,
  ].filter(Boolean).join("\n") || undefined;

  const backendTip = health.backend === "online"
    ? `Backend online${metrics.hostname ? ` · ${metrics.hostname}` : ""}`
    : health.backend === "offline" ? "Backend indisponível" : "Aguardando primeira verificação";
  const openclawTip = health.openclaw === "online"
    ? `OpenClaw respondendo${metrics.platform ? ` · ${metrics.platform}` : ""}`
    : health.openclaw === "offline" ? "OpenClaw indisponível" : "Aguardando primeira verificação";

  // Domain-level health breakdown for tooltip
  const domainLines = Object.entries(domainHealth.domains).map(([key, entry]) => {
    const st = domainStatusLabel[entry.status];
    return `${key}: ${st.label}`;
  });
  const panelTip = [
    `Domínios: ${domainHealth.liveCount}/${domainHealth.totalTracked} live`,
    `Backend: ${subsysConfig[health.backend].label}`,
    `OpenClaw: ${subsysConfig[health.openclaw].label}`,
    "",
    ...domainLines,
  ].join("\n");

  return (
    <footer className="h-8 flex items-center justify-between px-5 border-t border-border surface-0 text-xs font-mono text-muted-foreground/60 shrink-0 select-none">
      {/* Left: Resource metrics */}
      <div className="flex items-center gap-4">
        <MetricCell icon={Cpu} label="CPU" value={cpuStr} color={pctColor(metrics.cpu)} tooltip={cpuTip} />
        <Sep />
        <MetricCell icon={MemoryStick} label="RAM" value={ramStr} color={pctColor(metrics.ram)} tooltip={ramTip} />
        <Sep />
        <MetricCell icon={HardDrive} label="DISCO" value={diskStr} color={pctColor(metrics.disk)} tooltip={diskTip} />
        <Sep />
        <MetricCell icon={Activity} label="LAT" value={latStr} color={latColor(health.backend === "online" ? metrics.latencyMs : null)} tooltip={latTip} />
        <Sep />
        <MetricCell icon={Clock} label="UP" value={uptimeStr} tooltip={uptimeTip} />
      </div>

      {/* Right: Status indicators */}
      <div className="flex items-center gap-4">
        {/* Global panel status with domain health */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1.5 cursor-default ${globalCfg.color}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${globalCfg.dot}`} />
              <span className="font-medium">{globalCfg.label}</span>
              {domainHealth.liveCount > 0 && (
                <span className="text-muted-foreground/40 ml-0.5">
                  {domainHealth.liveCount}/{domainHealth.totalTracked}
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs font-mono whitespace-pre-line max-w-xs">
            {panelTip}
          </TooltipContent>
        </Tooltip>
        <Sep />

        {/* Per-subsystem pills */}
        <SubsystemPill status={health.backend} label="Backend" tooltip={backendTip} />
        <Sep />
        <SubsystemPill status={health.openclaw} label="OpenClaw" tooltip={openclawTip} />

        {/* Services count */}
        {metrics.activeServices !== null && metrics.totalServices !== null && metrics.totalServices > 0 && (
          <>
            <Sep />
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 cursor-default">
                  <Server className="h-3.5 w-3.5" />
                  <span className="text-foreground/70">{metrics.activeServices}/{metrics.totalServices}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs font-mono">
                {metrics.activeServices} de {metrics.totalServices} serviços conectados
              </TooltipContent>
            </Tooltip>
          </>
        )}

        <Sep />
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span>Atualizado {timeStr}</span>
        </div>
      </div>
    </footer>
  );
}

/** Merge system metrics panel status with domain-level health for accurate global */
function deriveEffectiveGlobal(
  sysHealth: SubsystemHealth,
  domainGlobal: GlobalHealthStatus,
): GlobalHealthStatus {
  const backendUp = sysHealth.backend === "online";
  const anyDomainLive = domainGlobal === "live" || domainGlobal === "partial";

  // If backend is online AND domains are getting data → live
  if (backendUp && domainGlobal === "live") return "live";
  // If backend is online but only some domains have data → partial (not offline)
  if (backendUp) return "partial";
  // If backend unknown/offline but domains have cached data → partial
  if (anyDomainLive) return "partial";
  // If domains are still loading (first mount) → loading (not offline)
  if (domainGlobal === "loading") return "loading";
  // Only truly offline if both backend and domains confirm
  return "offline";
}
