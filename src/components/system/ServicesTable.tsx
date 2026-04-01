import { CheckCircle2, AlertTriangle, XCircle, RotateCw, Inbox } from "lucide-react";
import type { SystemService, ServiceStatus } from "@/domains/system/types";

const statusConfig: Record<ServiceStatus, { icon: React.ElementType; color: string; dotClass: string }> = {
  running: { icon: CheckCircle2, color: "text-status-online", dotClass: "status-online" },
  degraded: { icon: AlertTriangle, color: "text-status-warning", dotClass: "status-warning" },
  stopped: { icon: XCircle, color: "text-status-critical", dotClass: "status-critical" },
  restarting: { icon: RotateCw, color: "text-primary", dotClass: "bg-primary" },
};

interface Props {
  services: SystemService[];
}

export function ServicesTable({ services = [] }: Props) {
  if (services.length === 0) {
    return (
      <section className="rounded-lg border border-border overflow-hidden h-full">
        <div className="orion-panel-header">
          <div className="flex items-center gap-3">
            <div className="w-6 h-0.5 bg-muted-foreground/40 rounded-full" />
            <h2 className="orion-panel-title">Serviços Ativos</h2>
          </div>
        </div>
        <div className="orion-empty">
          <div className="orion-empty-icon">
            <Inbox className="h-5 w-5 text-muted-foreground/30" />
          </div>
          <p className="orion-empty-title">Nenhum serviço registrado</p>
          <p className="orion-empty-subtitle">Aguardando conexão com API</p>
        </div>
      </section>
    );
  }

  const runningCount = services.filter(s => s.status === "running").length;
  const hasIssues = services.some(s => s.status !== "running");

  return (
    <section className="rounded-lg border border-border overflow-hidden">
      <div className="orion-panel-header">
        <div className="flex items-center gap-3">
          <div className={`w-6 h-0.5 rounded-full ${hasIssues ? "bg-status-warning" : "bg-status-online"}`} />
          <h2 className="orion-panel-title">Serviços Ativos</h2>
        </div>
        <span className={`text-xs font-mono font-semibold ${hasIssues ? "text-status-warning" : "text-status-online"}`}>{runningCount}/{services.length}</span>
      </div>

      <div className="overflow-hidden">
        <div className="grid grid-cols-[1fr_70px_100px_70px_60px_50px] gap-3 px-5 py-2.5 bg-surface-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/40">
          <span>Serviço</span>
          <span>Porta</span>
          <span>CPU / Mem</span>
          <span>Ativo</span>
          <span>PID</span>
          <span className="text-center">Estado</span>
        </div>

        {services.map((svc) => {
          const cfg = statusConfig[svc.status];
          const Icon = cfg.icon;
          const isIssue = svc.status !== "running";

          return (
            <div
              key={svc.name}
              className={`grid grid-cols-[1fr_70px_100px_70px_60px_50px] gap-3 px-5 py-3 items-center border-t border-border/20 hover:bg-accent/20 transition-colors cursor-pointer ${isIssue ? "bg-status-warning/[0.03]" : ""}`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`status-dot ${cfg.dotClass}`} />
                <span className={`text-sm font-mono ${isIssue ? cfg.color : "text-foreground/80"}`}>{svc.name}</span>
              </div>
              <span className="text-xs font-mono text-muted-foreground/50">{svc.port}</span>
              <div className="text-xs font-mono text-muted-foreground/50">
                <span>{svc.cpu}</span>
                <span className="text-border/40 mx-1">/</span>
                <span>{svc.mem}</span>
              </div>
              <span className="text-xs font-mono text-muted-foreground/50">{svc.uptime}</span>
              <span className="text-xs font-mono text-muted-foreground/30">{svc.pid}</span>
              <div className="flex justify-center">
                <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
