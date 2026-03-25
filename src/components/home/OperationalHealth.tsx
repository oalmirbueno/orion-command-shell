import { CheckCircle2, XCircle, Clock, Server } from "lucide-react";

interface HealthService {
  name: string;
  status: "healthy" | "degraded" | "down";
  responseTime: string;
  uptime: string;
}

const MOCK_SERVICES: HealthService[] = [
  { name: "API Gateway", status: "healthy", responseTime: "12ms", uptime: "99.99%" },
  { name: "Core Engine", status: "healthy", responseTime: "8ms", uptime: "99.98%" },
  { name: "Data Pipeline", status: "degraded", responseTime: "187ms", uptime: "99.91%" },
  { name: "Auth Service", status: "healthy", responseTime: "15ms", uptime: "100%" },
  { name: "ML Processor", status: "healthy", responseTime: "34ms", uptime: "99.95%" },
  { name: "Cache Layer", status: "healthy", responseTime: "2ms", uptime: "100%" },
  { name: "Queue Service", status: "healthy", responseTime: "5ms", uptime: "99.99%" },
  { name: "Storage", status: "healthy", responseTime: "22ms", uptime: "99.97%" },
];

const statusIcon = {
  healthy: <CheckCircle2 className="h-3.5 w-3.5 text-status-online" />,
  degraded: <Clock className="h-3.5 w-3.5 text-status-warning" />,
  down: <XCircle className="h-3.5 w-3.5 text-status-critical" />,
};

export function OperationalHealth() {
  const healthyCount = MOCK_SERVICES.filter(s => s.status === "healthy").length;
  const total = MOCK_SERVICES.length;
  const allHealthy = healthyCount === total;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
          Saúde Operacional
        </h2>
        <div className={`flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full border ${allHealthy ? "bg-status-online/10 border-status-online/20" : "bg-status-warning/10 border-status-warning/20"}`}>
          <span className={`text-[9px] font-mono font-medium ${allHealthy ? "text-status-online" : "text-status-warning"}`}>
            {healthyCount}/{total} saudáveis
          </span>
        </div>
        <div className="flex-1 h-px bg-border/40" />
      </div>

      <div className="rounded-lg border border-border/50 overflow-hidden">
        {MOCK_SERVICES.map((svc, i) => (
          <div
            key={svc.name}
            className={`flex items-center gap-3 px-4 py-2.5 ${i > 0 ? "border-t border-border/30" : ""} hover:bg-accent/30 transition-colors`}
          >
            {statusIcon[svc.status]}
            <span className="text-xs text-foreground flex-1">{svc.name}</span>
            <span className="text-[10px] font-mono text-muted-foreground/50 w-16 text-right">{svc.responseTime}</span>
            <span className="text-[10px] font-mono text-muted-foreground/50 w-16 text-right">{svc.uptime}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
