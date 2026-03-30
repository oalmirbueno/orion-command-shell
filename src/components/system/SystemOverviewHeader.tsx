import { CheckCircle2, AlertTriangle, XCircle, Server } from "lucide-react";
import type { SystemHeaderData, OverallStatus } from "@/domains/system/types";

const statusConfig: Record<OverallStatus, {
  icon: React.ElementType; label: string; sublabel: string;
  dot: string; border: string; bg: string; text: string;
}> = {
  healthy: {
    icon: CheckCircle2, label: "Sistemas Operacionais",
    sublabel: "Nenhuma anomalia detectada", dot: "status-online",
    border: "border-status-online/20", bg: "bg-status-online/[0.04]", text: "text-status-online",
  },
  degraded: {
    icon: AlertTriangle, label: "Performance Degradada",
    sublabel: "Serviços com performance reduzida", dot: "status-warning",
    border: "border-status-warning/20", bg: "bg-status-warning/[0.04]", text: "text-status-warning",
  },
  critical: {
    icon: XCircle, label: "Falha Detectada",
    sublabel: "Ação imediata necessária", dot: "status-critical",
    border: "border-status-critical/20", bg: "bg-status-critical/[0.04]", text: "text-status-critical",
  },
};

interface Props {
  header: SystemHeaderData;
}

export function SystemOverviewHeader({ header }: Props) {
  if (!header) return null;
  const cfg = statusConfig[header.overallStatus];
  const Icon = cfg.icon;
  const isEmpty = header.host === "—";

  return (
    <div className={`flex items-center gap-5 px-6 py-5 rounded-lg border ${cfg.border} ${cfg.bg}`}>
      <div className={`w-10 h-10 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
        <Icon className={`h-5 w-5 ${isEmpty ? "text-muted-foreground/30" : cfg.text}`} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2.5">
          <h2 className={`text-sm font-semibold ${isEmpty ? "text-muted-foreground/50" : cfg.text}`}>{isEmpty ? "Aguardando conexão" : cfg.label}</h2>
          {!isEmpty && <div className={`status-dot ${cfg.dot}`} />}
        </div>
        <p className="text-xs font-mono text-muted-foreground/40 mt-1">{isEmpty ? "Conecte a API para monitorar o sistema" : cfg.sublabel}</p>
      </div>
      {!isEmpty && (
        <div className="flex items-center gap-6 text-right">
          <div>
            <p className="text-[10px] font-mono text-muted-foreground/35 uppercase">Host</p>
            <p className="text-sm font-mono text-foreground/80">{header.host}</p>
          </div>
          <div>
            <p className="text-[10px] font-mono text-muted-foreground/35 uppercase">Ativo</p>
            <p className="text-sm font-mono text-foreground/80">{header.uptime}</p>
          </div>
          <div>
            <p className="text-[10px] font-mono text-muted-foreground/35 uppercase">Última Verif.</p>
            <p className="text-sm font-mono text-foreground/80">{header.lastCheck}</p>
          </div>
        </div>
      )}
    </div>
  );
}
