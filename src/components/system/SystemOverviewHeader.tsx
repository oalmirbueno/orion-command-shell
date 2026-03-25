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
    label: "Falha no Sistema Detectada",
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
    <div className={`flex items-center gap-5 px-6 py-5 rounded-xl border ${cfg.border} ${cfg.bg}`}>
      <div className={`w-12 h-12 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
        <Icon className={`h-6 w-6 ${cfg.text}`} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h2 className={`text-base font-semibold ${cfg.text}`}>{cfg.label}</h2>
          <div className={`status-dot ${cfg.dot}`} />
        </div>
        <p className="text-sm font-mono text-muted-foreground mt-1">{cfg.sublabel}</p>
      </div>
      <div className="flex items-center gap-6 text-right">
        <div>
          <p className="text-xs font-mono text-muted-foreground/50 uppercase">Host</p>
          <p className="text-sm font-mono text-foreground">orion-prod-01</p>
        </div>
        <div>
          <p className="text-xs font-mono text-muted-foreground/50 uppercase">Uptime</p>
          <p className="text-sm font-mono text-foreground">47d 12h 38m</p>
        </div>
        <div>
          <p className="text-xs font-mono text-muted-foreground/50 uppercase">Última Verif.</p>
          <p className="text-sm font-mono text-foreground">12s atrás</p>
        </div>
      </div>
    </div>
  );
}
