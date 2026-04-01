import {
  CheckCircle2, AlertTriangle, XCircle, Server, Activity,
  Shield, Clock, Wifi, Timer, Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SystemHeaderData, OverallStatus } from "@/domains/system/types";
import type { CronSummaryData } from "@/domains/cron/types";

// ── Types ──

interface SubsystemHealth {
  name: string;
  icon: React.ElementType;
  status: "nominal" | "degraded" | "critical" | "offline";
  detail: string;
}

interface InfraHealthBannerProps {
  header: SystemHeaderData;
  cronSummary: CronSummaryData | null;
  serviceCount: number;
  runningServices: number;
}

// ── Config ──

const overallConfig: Record<OverallStatus, {
  icon: React.ElementType; label: string; sublabel: string;
  border: string; bg: string; text: string; glow: string;
}> = {
  healthy: {
    icon: CheckCircle2, label: "Infraestrutura Operacional",
    sublabel: "Todos os subsistemas nominais",
    border: "border-status-online/20", bg: "bg-status-online/[0.03]",
    text: "text-status-online", glow: "shadow-[0_0_20px_hsl(var(--status-online)/0.08)]",
  },
  degraded: {
    icon: AlertTriangle, label: "Performance Degradada",
    sublabel: "Um ou mais subsistemas com anomalia",
    border: "border-status-warning/20", bg: "bg-status-warning/[0.03]",
    text: "text-status-warning", glow: "shadow-[0_0_20px_hsl(var(--status-warning)/0.08)]",
  },
  critical: {
    icon: XCircle, label: "Falha Crítica Detectada",
    sublabel: "Ação imediata necessária",
    border: "border-status-critical/20", bg: "bg-status-critical/[0.03]",
    text: "text-status-critical", glow: "shadow-[0_0_20px_hsl(var(--status-critical)/0.1)]",
  },
};

const subsystemStatusConfig: Record<SubsystemHealth["status"], {
  dot: string; text: string; label: string;
}> = {
  nominal:  { dot: "bg-status-online",  text: "text-status-online",  label: "Nominal" },
  degraded: { dot: "bg-status-warning", text: "text-status-warning", label: "Degradado" },
  critical: { dot: "bg-status-critical", text: "text-status-critical", label: "Crítico" },
  offline:  { dot: "bg-muted-foreground/30", text: "text-muted-foreground/50", label: "Offline" },
};

// ── Derive subsystems ──

function deriveSubsystems(
  header: SystemHeaderData,
  cronSummary: CronSummaryData | null,
  serviceCount: number,
  runningServices: number,
): SubsystemHealth[] {
  const isEmpty = header.host === "—";

  const hostStatus: SubsystemHealth["status"] = isEmpty ? "offline" :
    header.overallStatus === "critical" ? "critical" :
    header.overallStatus === "degraded" ? "degraded" : "nominal";

  const apiStatus: SubsystemHealth["status"] = isEmpty ? "offline" : "nominal";

  const openclawStatus: SubsystemHealth["status"] = isEmpty ? "offline" :
    serviceCount === 0 ? "offline" :
    runningServices < serviceCount ? "degraded" : "nominal";

  const cronStatus: SubsystemHealth["status"] = !cronSummary ? "offline" :
    cronSummary.failed > 0 ? "critical" :
    cronSummary.active === 0 ? "offline" : "nominal";

  return [
    {
      name: "Host",
      icon: Server,
      status: hostStatus,
      detail: isEmpty ? "Sem conexão" : header.host,
    },
    {
      name: "OpenClaw",
      icon: Bot,
      status: openclawStatus,
      detail: isEmpty ? "Sem dados" :
        serviceCount === 0 ? "Sem serviços" :
        `${runningServices}/${serviceCount} ativos`,
    },
    {
      name: "API",
      icon: Wifi,
      status: apiStatus,
      detail: isEmpty ? "Sem conexão" : `Verificado ${header.lastCheck}`,
    },
    {
      name: "Cron Jobs",
      icon: Timer,
      status: cronStatus,
      detail: !cronSummary ? "Sem dados" :
        cronSummary.failed > 0 ? `${cronSummary.failed} falhando` :
        `${cronSummary.healthy}/${cronSummary.active} saudáveis`,
    },
  ];
}

// ── Component ──

export function InfraHealthBanner({ header, cronSummary, serviceCount, runningServices }: InfraHealthBannerProps) {
  if (!header) return null;

  const isEmpty = header.host === "—";
  const subsystems = deriveSubsystems(header, cronSummary, serviceCount, runningServices);

  // Derive overall from subsystems
  const hasCritical = subsystems.some(s => s.status === "critical");
  const hasDegraded = subsystems.some(s => s.status === "degraded");
  const effectiveStatus: OverallStatus = hasCritical ? "critical" : hasDegraded ? "degraded" : header.overallStatus;
  const cfg = overallConfig[isEmpty ? "healthy" : effectiveStatus];
  const Icon = cfg.icon;

  return (
    <div className="space-y-4">
      {/* Main Banner */}
      <div className={cn(
        "rounded-xl border px-6 py-5 transition-all",
        isEmpty ? "border-border/30 bg-card" : cfg.border,
        !isEmpty && cfg.bg,
        !isEmpty && cfg.glow,
      )}>
        <div className="flex items-center gap-5">
          <div className={cn(
            "w-12 h-12 rounded-xl border flex items-center justify-center shrink-0",
            isEmpty ? "border-border/30 bg-muted/10" : cfg.border,
            !isEmpty && cfg.bg,
          )}>
            <Icon className={cn("h-6 w-6", isEmpty ? "text-muted-foreground/30" : cfg.text)} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <h2 className={cn("text-sm font-semibold", isEmpty ? "text-muted-foreground/50" : cfg.text)}>
                {isEmpty ? "Aguardando Conexão" : cfg.label}
              </h2>
              {!isEmpty && (
                <div className={cn("w-2 h-2 rounded-full animate-pulse", cfg.text === "text-status-online" ? "bg-status-online" : cfg.text === "text-status-warning" ? "bg-status-warning" : "bg-status-critical")} />
              )}
            </div>
            <p className="text-xs font-mono text-muted-foreground/40 mt-0.5">
              {isEmpty ? "Conecte a API para monitorar a infraestrutura" : cfg.sublabel}
            </p>
          </div>

          {!isEmpty && (
            <div className="flex items-center gap-8 shrink-0">
              <div className="text-right">
                <p className="text-[9px] font-mono text-muted-foreground/30 uppercase tracking-wider">Host</p>
                <p className="text-sm font-mono text-foreground/80 font-medium">{header.host}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-mono text-muted-foreground/30 uppercase tracking-wider">Uptime</p>
                <p className="text-sm font-mono text-foreground/80 font-medium">{header.uptime}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-mono text-muted-foreground/30 uppercase tracking-wider">Verif.</p>
                <p className="text-sm font-mono text-foreground/80 font-medium">{header.lastCheck}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subsystems Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {subsystems.map((sub) => {
          const scfg = subsystemStatusConfig[sub.status];
          return (
            <div
              key={sub.name}
              className={cn(
                "rounded-lg border px-4 py-3 flex items-center gap-3 transition-colors",
                sub.status === "critical" ? "border-status-critical/20 bg-status-critical/[0.03]" :
                sub.status === "degraded" ? "border-status-warning/20 bg-status-warning/[0.03]" :
                "border-border/30",
              )}
            >
              <sub.icon className={cn("h-4 w-4 shrink-0", scfg.text)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">{sub.name}</span>
                  <div className={cn("w-1.5 h-1.5 rounded-full", scfg.dot)} />
                </div>
                <p className="text-[10px] font-mono text-muted-foreground/40 truncate mt-0.5">{sub.detail}</p>
              </div>
              <span className={cn("text-[9px] font-mono uppercase tracking-wider shrink-0", scfg.text)}>
                {scfg.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
