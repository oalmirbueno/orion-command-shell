import { useNavigate } from "react-router-dom";
import { AlertTriangle, AlertCircle, Info, ChevronRight, CheckCircle2 } from "lucide-react";
import type { AttentionItem, AttentionPriority } from "@/domains/activity/types";

const priorityConfig: Record<AttentionPriority, { icon: React.ElementType; border: string; bg: string; dot: string }> = {
  critical: { icon: AlertCircle, border: "border-l-status-critical", bg: "bg-status-critical/[0.04]", dot: "status-critical" },
  warning: { icon: AlertTriangle, border: "border-l-status-warning", bg: "bg-status-warning/[0.04]", dot: "status-warning" },
  info: { icon: Info, border: "border-l-primary/40", bg: "bg-primary/[0.03]", dot: "bg-primary/50" },
};

const domainRoutes: Record<string, string> = {
  alert: "/alerts",
  alerts: "/alerts",
  cron: "/cron",
  session: "/sessions",
  sessions: "/sessions",
  agent: "/agents",
  agents: "/agents",
  operation: "/operations",
  operations: "/operations",
  system: "/system",
  builder: "/builders",
  builders: "/builders",
};

function resolveRoute(item: AttentionItem): string {
  const src = ((item as any).source || (item as any).domain || "").toLowerCase();
  return domainRoutes[src] || "/alerts";
}

interface AttentionRequiredProps {
  items: AttentionItem[];
}

export function AttentionRequired({ items = [] }: AttentionRequiredProps) {
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <section className="rounded-lg border border-border overflow-hidden">
        <div className="orion-panel-header">
          <div className="flex items-center gap-3">
            <div className="w-6 h-0.5 bg-status-online rounded-full" />
            <h2 className="orion-panel-title">Atenção Necessária</h2>
          </div>
          <span className="text-xs font-mono text-status-online/60">Tudo em ordem</span>
        </div>
        <div className="px-5 py-6 text-center flex flex-col items-center">
          <CheckCircle2 className="h-5 w-5 text-status-online/40 mb-2" />
          <p className="text-sm text-muted-foreground/50 font-mono">Nenhum item requer atenção</p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border overflow-hidden">
      <div
        className="orion-panel-header cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={() => navigate("/alerts")}
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-0.5 bg-status-warning rounded-full" />
          <h2 className="orion-panel-title">Atenção Necessária</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-status-warning font-semibold">{items.length} itens</span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
        </div>
      </div>
      <div className="divide-y divide-border/30 max-h-[320px] overflow-y-auto">
        {items.map((item) => {
          const config = priorityConfig[item.priority];
          const Icon = config.icon;
          return (
            <div
              key={item.id}
              className={`flex items-center gap-4 px-5 py-4 ${config.bg} border-l-3 ${config.border} cursor-pointer hover:bg-accent/30 transition-colors group`}
              onClick={() => navigate(resolveRoute(item))}
            >
              <Icon className="h-5 w-5 shrink-0 text-muted-foreground/60" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                <p className="text-xs font-mono text-muted-foreground/50 mt-1">{item.context}</p>
              </div>
              <span className="text-xs font-mono text-muted-foreground/40 shrink-0">{item.timestamp}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-colors shrink-0" />
            </div>
          );
        })}
      </div>
    </section>
  );
}
