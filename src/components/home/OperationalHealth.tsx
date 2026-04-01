import { useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Clock, ChevronRight } from "lucide-react";
import type { HealthService } from "@/domains/system/types";

const statusIcon = {
  healthy: <CheckCircle2 className="h-4 w-4 text-status-online" />,
  degraded: <Clock className="h-4 w-4 text-status-warning" />,
  down: <XCircle className="h-4 w-4 text-status-critical" />,
};

interface OperationalHealthProps {
  services: HealthService[];
}

export function OperationalHealth({ services = [] }: OperationalHealthProps) {
  const navigate = useNavigate();

  if (services.length === 0) {
    return (
      <section className="rounded-lg border border-border overflow-hidden h-full">
        <div className="orion-panel-header cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => navigate("/system")}>
          <div className="flex items-center gap-3">
            <div className="w-6 h-0.5 bg-muted-foreground/40 rounded-full" />
            <h2 className="orion-panel-title">Saúde Operacional</h2>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
        </div>
        <div className="orion-empty">
          <div className="orion-empty-icon">
            <Clock className="h-5 w-5 text-muted-foreground/30" />
          </div>
          <p className="orion-empty-title">Aguardando conexão com API</p>
          <p className="orion-empty-subtitle">Serviços serão monitorados automaticamente</p>
        </div>
      </section>
    );
  }

  const healthyCount = services.filter(s => s.status === "healthy").length;
  const total = services.length;
  const allHealthy = healthyCount === total;

  return (
    <section className="rounded-lg border border-border overflow-hidden h-full">
      <div className="orion-panel-header cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => navigate("/system")}>
        <div className="flex items-center gap-3">
          <div className={`w-6 h-0.5 rounded-full ${allHealthy ? "bg-status-online" : "bg-status-warning"}`} />
          <h2 className="orion-panel-title">Saúde Operacional</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono font-semibold ${allHealthy ? "text-status-online" : "text-status-warning"}`}>
            {healthyCount}/{total}
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
        </div>
      </div>

      <div className="flex items-center gap-3 px-5 py-2 surface-2 border-b border-border/30 text-xs font-mono uppercase tracking-wider text-muted-foreground/40">
        <span className="w-5" />
        <span className="flex-1">Serviço</span>
        <span className="w-20 text-right">Latência</span>
        <span className="w-20 text-right">Disponib.</span>
      </div>

      <div className="divide-y divide-border/20 max-h-[200px] overflow-y-auto orion-thin-scroll">
        {services.map((svc) => (
          <div
            key={svc.name}
            className={`flex items-center gap-3 px-5 py-3 hover:bg-accent/15 transition-colors cursor-pointer ${svc.status === "degraded" ? "bg-status-warning/[0.03]" : ""}`}
            onClick={() => navigate("/system")}
          >
            {statusIcon[svc.status]}
            <span className="text-sm text-foreground flex-1">{svc.name}</span>
            <span className={`text-xs font-mono w-20 text-right ${svc.status === "degraded" ? "text-status-warning" : "text-muted-foreground/50"}`}>{svc.responseTime}</span>
            <span className="text-xs font-mono text-muted-foreground/50 w-20 text-right">{svc.uptime}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
