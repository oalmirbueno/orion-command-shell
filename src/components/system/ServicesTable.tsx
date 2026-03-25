import { CheckCircle2, AlertTriangle, XCircle, RotateCw } from "lucide-react";
import { useOrionData } from "@/hooks/useOrionData";
import { OrionDataWrapper } from "@/components/orion/DataWrapper";
import { fetchSystemServices } from "@/domains/system/fetcher";
import type { SystemService, ServiceStatus } from "@/domains/system/types";

const statusConfig: Record<ServiceStatus, { icon: React.ElementType; color: string; dotClass: string }> = {
  running: { icon: CheckCircle2, color: "text-status-online", dotClass: "status-online" },
  degraded: { icon: AlertTriangle, color: "text-status-warning", dotClass: "status-warning" },
  stopped: { icon: XCircle, color: "text-status-critical", dotClass: "status-critical" },
  restarting: { icon: RotateCw, color: "text-primary", dotClass: "bg-primary" },
};

export function ServicesTable() {
  const { state, data, source, lastUpdated, refetch } = useOrionData<SystemService[]>({
    key: "system-services",
    fetcher: fetchSystemServices,
  });

  const services = data || [];
  const runningCount = services.filter(s => s.status === "running").length;

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">Serviços Ativos</h2>
        <div className="flex items-center gap-2 ml-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
          <span className="text-xs font-mono text-primary font-medium">{runningCount}/{services.length}</span>
        </div>
        <div className="flex-1 h-px bg-border/40" />
      </div>

      <OrionDataWrapper state={state} source={source} lastUpdated={lastUpdated} onRetry={refetch}>
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <div className="grid grid-cols-[1fr_80px_100px_80px_70px_60px] gap-3 px-5 py-3 bg-surface-2 text-xs font-mono uppercase tracking-wider text-muted-foreground/50">
            <span>Serviço</span>
            <span>Port</span>
            <span>CPU / Mem</span>
            <span>Uptime</span>
            <span>PID</span>
            <span className="text-center">Status</span>
          </div>

          {services.map((svc) => {
            const cfg = statusConfig[svc.status];
            const Icon = cfg.icon;
            const isIssue = svc.status !== "running";

            return (
              <div
                key={svc.name}
                className={`grid grid-cols-[1fr_80px_100px_80px_70px_60px] gap-3 px-5 py-3.5 items-center border-t border-border/30 hover:bg-accent/30 transition-colors cursor-pointer ${isIssue ? "bg-accent/10" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`status-dot ${cfg.dotClass}`} />
                  <span className={`text-sm font-mono ${isIssue ? cfg.color : "text-foreground"}`}>{svc.name}</span>
                </div>
                <span className="text-sm font-mono text-muted-foreground/60">{svc.port}</span>
                <div className="text-sm font-mono text-muted-foreground/60">
                  <span>{svc.cpu}</span>
                  <span className="text-border mx-1.5">/</span>
                  <span>{svc.mem}</span>
                </div>
                <span className="text-sm font-mono text-muted-foreground/60">{svc.uptime}</span>
                <span className="text-sm font-mono text-muted-foreground/40">{svc.pid}</span>
                <div className="flex justify-center">
                  <Icon className={`h-4 w-4 ${cfg.color}`} />
                </div>
              </div>
            );
          })}
        </div>
      </OrionDataWrapper>
    </section>
  );
}
