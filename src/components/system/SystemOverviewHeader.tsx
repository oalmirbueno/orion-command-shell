import { CheckCircle2, AlertTriangle, XCircle, Server } from "lucide-react";

type OverallStatus = "healthy" | "degraded" | "critical";

const MOCK_STATUS: OverallStatus = "healthy";

const statusConfig = {
  healthy: {
    icon: CheckCircle2,
    label: "Todos os Sistemas Operacionais",
    sublabel: "Nenhuma anomalia detectada",
    dot: "status-online",
    border: "border-status-online/20",
    bg: "bg-status-online/5",
    text: "text-status-online",
  },
  degraded: {
    icon: AlertTriangle,
    label: "Performance Degradada",
    sublabel: "Alguns serviços com performance reduzida",
    dot: "status-warning",
    border: "border-status-warning/20",
    bg: "bg-status-warning/5",
    text: "text-status-warning",
  },
  critical: {
    icon: XCircle,
    label: "System Failure Detected",
    sublabel: "Ação imediata necessária",
    dot: "status-critical",
    border: "border-status-critical/20",
    bg: "bg-status-critical/5",
    text: "text-status-critical",
  },
};

export function SystemOverviewHeader() {
  const cfg = statusConfig[MOCK_STATUS];
  const Icon = cfg.icon;

  return (
    <div className={`flex items-center gap-4 px-5 py-4 rounded-lg border ${cfg.border} ${cfg.bg}`}>
      <div className={`w-10 h-10 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
        <Icon className={`h-5 w-5 ${cfg.text}`} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2.5">
          <h2 className={`text-sm font-semibold ${cfg.text}`}>{cfg.label}</h2>
          <div className={`status-dot ${cfg.dot}`} />
        </div>
        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{cfg.sublabel}</p>
      </div>
      <div className="flex items-center gap-4 text-right">
        <div>
          <p className="text-[9px] font-mono text-muted-foreground/50 uppercase">Host</p>
          <p className="text-[11px] font-mono text-foreground">orion-prod-01</p>
        </div>
        <div>
          <p className="text-[9px] font-mono text-muted-foreground/50 uppercase">Uptime</p>
          <p className="text-[11px] font-mono text-foreground">47d 12h 38m</p>
        </div>
        <div>
          <p className="text-[9px] font-mono text-muted-foreground/50 uppercase">Last Check</p>
          <p className="text-[11px] font-mono text-foreground">12s ago</p>
        </div>
      </div>
    </div>
  );
}
