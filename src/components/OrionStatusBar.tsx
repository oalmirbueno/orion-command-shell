import { Cpu, HardDrive, MemoryStick, Clock, Activity, Server } from "lucide-react";
import { useSystemMetrics } from "@/hooks/useSystemMetrics";
import { useLastUpdated } from "@/hooks/useLastUpdated";
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

function StatusPill({ online, label, tooltip }: { online: boolean; label: string; tooltip?: string }) {
  const content = (
    <div className={`flex items-center gap-1.5 cursor-default ${online ? "text-status-online" : "text-status-critical/60"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-status-online animate-pulse" : "bg-status-critical/50"}`} />
      <span>{label}</span>
    </div>
  );

  if (!tooltip) return content;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="top" className="text-xs font-mono">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

export function OrionStatusBar() {
  const { metrics, source, updatedAt } = useSystemMetrics();
  const { lastUpdated, source: globalSource } = useLastUpdated();

  const displayTime = updatedAt || lastUpdated;
  const timeStr = displayTime ? format(displayTime, "HH:mm:ss") : "—";

  const isLive = source === "api";
  const globalIsLive = globalSource === "api";
  const effectiveLive = isLive || globalIsLive;
  const sourceLabel = effectiveLive ? "Live" : source === "offline" ? "Offline" : "Cache";
  const sourceColor = effectiveLive ? "text-status-online" : source === "offline" ? "text-status-critical/60" : "text-muted-foreground/60";
  const dotColor = effectiveLive ? "bg-status-online animate-pulse" : source === "offline" ? "bg-status-critical/50" : "bg-muted-foreground/40";

  const cpuStr = metrics.cpu !== null ? `${Math.round(metrics.cpu)}%` : "—";
  const ramStr = metrics.ram !== null ? `${metrics.ram}%` : "—";
  const diskStr = metrics.disk !== null ? `${metrics.disk}%` : "—";
  const latStr = metrics.latencyMs !== null && metrics.backendOnline ? `${metrics.latencyMs}ms` : "—";
  const uptimeStr = metrics.uptime || "—";

  // Build tooltip strings
  const cpuTip = metrics.cpu !== null ? `CPU: ${Math.round(metrics.cpu)}%` : null;
  const ramTip = metrics.ramUsedGB && metrics.ramTotalGB
    ? `Memória: ${metrics.ramUsedGB} / ${metrics.ramTotalGB}`
    : null;
  const diskTip = metrics.diskUsedGB && metrics.diskTotalGB
    ? `Disco: ${metrics.diskUsedGB} / ${metrics.diskTotalGB}`
    : null;
  const latTip = metrics.latencyMs !== null
    ? `Latência API: ${metrics.latencyMs}ms`
    : null;
  const uptimeTip = [
    metrics.hostname ? `Host: ${metrics.hostname}` : null,
    metrics.platform ? `Plataforma: ${metrics.platform}` : null,
    metrics.uptime ? `Uptime: ${metrics.uptime}` : null,
  ].filter(Boolean).join("\n") || null;

  const backendTip = metrics.backendOnline
    ? `Backend online${metrics.hostname ? ` · ${metrics.hostname}` : ""}`
    : "Backend indisponível";
  const openclawTip = metrics.openclawOnline
    ? `OpenClaw respondendo${metrics.platform ? ` · ${metrics.platform}` : ""}`
    : "OpenClaw indisponível";

  return (
    <footer className="h-8 flex items-center justify-between px-5 border-t border-border surface-0 text-xs font-mono text-muted-foreground/60 shrink-0 select-none">
      <div className="flex items-center gap-4">
        <MetricCell icon={Cpu} label="CPU" value={cpuStr} color={pctColor(metrics.cpu)} tooltip={cpuTip || undefined} />
        <Sep />
        <MetricCell icon={MemoryStick} label="RAM" value={ramStr} color={pctColor(metrics.ram)} tooltip={ramTip || undefined} />
        <Sep />
        <MetricCell icon={HardDrive} label="DISCO" value={diskStr} color={pctColor(metrics.disk)} tooltip={diskTip || undefined} />
        <Sep />
        <MetricCell icon={Activity} label="LAT" value={latStr} color={latColor(metrics.backendOnline ? metrics.latencyMs : null)} tooltip={latTip || undefined} />
        <Sep />
        <MetricCell icon={Clock} label="UP" value={uptimeStr} tooltip={uptimeTip || undefined} />
      </div>

      <div className="flex items-center gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1.5 cursor-default ${sourceColor}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
              <span>{sourceLabel}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs font-mono">
            {effectiveLive ? "Dados vindos da API em tempo real" : source === "offline" ? "Sem conexão com o backend" : "Usando dados em cache"}
          </TooltipContent>
        </Tooltip>
        <Sep />
        <StatusPill online={metrics.backendOnline} label="Backend" tooltip={backendTip} />
        <Sep />
        <StatusPill online={metrics.openclawOnline} label="OpenClaw" tooltip={openclawTip} />
        <Sep />
        {metrics.activeServices !== null && metrics.totalServices !== null && metrics.totalServices > 0 && (
          <>
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
