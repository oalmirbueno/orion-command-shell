import { CheckCircle2, AlertTriangle, XCircle, RotateCw, ExternalLink } from "lucide-react";

type ServiceStatus = "running" | "degraded" | "stopped" | "restarting";

interface Service {
  name: string;
  status: ServiceStatus;
  port: string;
  cpu: string;
  mem: string;
  uptime: string;
  pid: string;
}

const MOCK_SERVICES: Service[] = [
  { name: "nginx", status: "running", port: "80, 443", cpu: "0.3%", mem: "48MB", uptime: "47d", pid: "1024" },
  { name: "postgres", status: "running", port: "5432", cpu: "2.1%", mem: "512MB", uptime: "47d", pid: "1102" },
  { name: "redis", status: "running", port: "6379", cpu: "0.8%", mem: "128MB", uptime: "47d", pid: "1156" },
  { name: "orion-core", status: "running", port: "8080", cpu: "12.4%", mem: "1.2GB", uptime: "12d", pid: "2341" },
  { name: "orion-worker", status: "running", port: "—", cpu: "8.7%", mem: "890MB", uptime: "12d", pid: "2342" },
  { name: "orion-scheduler", status: "running", port: "—", cpu: "1.2%", mem: "256MB", uptime: "12d", pid: "2343" },
  { name: "ml-inference", status: "degraded", port: "9090", cpu: "45.2%", mem: "3.8GB", uptime: "2d", pid: "3401" },
  { name: "log-collector", status: "running", port: "5140", cpu: "0.5%", mem: "64MB", uptime: "47d", pid: "1200" },
  { name: "metrics-exporter", status: "running", port: "9100", cpu: "0.2%", mem: "32MB", uptime: "47d", pid: "1201" },
  { name: "backup-agent", status: "stopped", port: "—", cpu: "—", mem: "—", uptime: "—", pid: "—" },
];

const statusConfig: Record<ServiceStatus, { icon: React.ElementType; color: string; dotClass: string }> = {
  running: { icon: CheckCircle2, color: "text-status-online", dotClass: "status-online" },
  degraded: { icon: AlertTriangle, color: "text-status-warning", dotClass: "status-warning" },
  stopped: { icon: XCircle, color: "text-status-critical", dotClass: "status-critical" },
  restarting: { icon: RotateCw, color: "text-primary", dotClass: "bg-primary" },
};

export function ServicesTable() {
  const runningCount = MOCK_SERVICES.filter(s => s.status === "running").length;

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
          Serviços Ativos
        </h2>
        <div className="flex items-center gap-2 ml-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
          <span className="text-xs font-mono text-primary font-medium">{runningCount}/{MOCK_SERVICES.length}</span>
        </div>
        <div className="flex-1 h-px bg-border/40" />
      </div>

      <div className="rounded-xl border border-border/50 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_80px_100px_80px_70px_60px] gap-3 px-5 py-3 bg-surface-2 text-xs font-mono uppercase tracking-wider text-muted-foreground/50">
          <span>Serviço</span>
          <span>Port</span>
          <span>CPU / Mem</span>
          <span>Uptime</span>
          <span>PID</span>
          <span className="text-center">Status</span>
        </div>

        {/* Rows */}
        {MOCK_SERVICES.map((svc) => {
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
    </section>
  );
}
