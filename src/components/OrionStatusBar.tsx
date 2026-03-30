import { Cpu, HardDrive, MemoryStick, Shield, Clock, Activity, Server } from "lucide-react";
import { useSystemMetrics } from "@/hooks/useSystemMetrics";
import { useLastUpdated } from "@/hooks/useLastUpdated";
import { format } from "date-fns";

function Sep() {
  return <div className="w-px h-3.5 bg-border" />;
}

/** Color by percentage threshold */
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

function MetricCell({ icon: Icon, label, value, color }: {
  icon: React.ElementType;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
      <span className={color || "text-foreground/70"}>{value}</span>
    </div>
  );
}

function StatusPill({ online, label }: { online: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${online ? "text-status-online" : "text-status-critical/60"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-status-online animate-pulse" : "bg-status-critical/50"}`} />
      <span>{label}</span>
    </div>
  );
}

export function OrionStatusBar() {
  const { metrics, source, updatedAt } = useSystemMetrics();
  const { lastUpdated, source: globalSource } = useLastUpdated();

  // Prefer the status bar's own updatedAt, fall back to global
  const displayTime = updatedAt || lastUpdated;
  const timeStr = displayTime ? format(displayTime, "HH:mm:ss") : "—";

  // Source indicator
  const isLive = source === "api";
  const globalIsLive = globalSource === "api";
  const effectiveLive = isLive || globalIsLive;
  const sourceLabel = effectiveLive ? "Live" : source === "offline" ? "Offline" : "Cache";
  const sourceColor = effectiveLive ? "text-status-online" : source === "offline" ? "text-status-critical/60" : "text-muted-foreground/60";
  const dotColor = effectiveLive ? "bg-status-online animate-pulse" : source === "offline" ? "bg-status-critical/50" : "bg-muted-foreground/40";

  // Format values — never show "0" if data didn't arrive
  const cpuStr = metrics.cpu !== null ? `${Math.round(metrics.cpu)}%` : "—";
  const ramStr = metrics.ram !== null ? `${metrics.ram}%` : "—";
  const diskStr = metrics.disk !== null ? `${metrics.disk}%` : "—";
  const latStr = metrics.latencyMs !== null && metrics.backendOnline ? `${metrics.latencyMs}ms` : "—";
  const uptimeStr = metrics.uptime || "—";

  return (
    <footer className="h-8 flex items-center justify-between px-5 border-t border-border surface-0 text-xs font-mono text-muted-foreground/60 shrink-0 select-none">
      {/* Left: Resource metrics */}
      <div className="flex items-center gap-4">
        <MetricCell icon={Cpu} label="CPU" value={cpuStr} color={pctColor(metrics.cpu)} />
        <Sep />
        <MetricCell icon={MemoryStick} label="RAM" value={ramStr} color={pctColor(metrics.ram)} />
        <Sep />
        <MetricCell icon={HardDrive} label="DISCO" value={diskStr} color={pctColor(metrics.disk)} />
        <Sep />
        <MetricCell icon={Activity} label="LAT" value={latStr} color={latColor(metrics.backendOnline ? metrics.latencyMs : null)} />
        <Sep />
        <MetricCell icon={Clock} label="UP" value={uptimeStr} />
      </div>

      {/* Right: Status indicators */}
      <div className="flex items-center gap-4">
        <div className={`flex items-center gap-1.5 ${sourceColor}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
          <span>{sourceLabel}</span>
        </div>
        <Sep />
        <StatusPill online={metrics.backendOnline} label="Backend" />
        <Sep />
        <StatusPill online={metrics.openclawOnline} label="OpenClaw" />
        <Sep />
        {metrics.activeServices !== null && metrics.totalServices !== null && metrics.totalServices > 0 && (
          <>
            <div className="flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5" />
              <span className="text-foreground/70">{metrics.activeServices}/{metrics.totalServices}</span>
            </div>
            <Sep />
          </>
        )}
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span>Atualizado {timeStr}</span>
        </div>
      </div>
    </footer>
  );
}
