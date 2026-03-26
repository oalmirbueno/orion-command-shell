import { AlertTriangle, AlertCircle, Info, ChevronRight } from "lucide-react";
import type { AttentionItem, AttentionPriority } from "@/domains/activity/types";

const priorityConfig: Record<AttentionPriority, { icon: React.ElementType; border: string; bg: string; dot: string }> = {
  critical: { icon: AlertCircle, border: "border-l-status-critical", bg: "bg-status-critical/[0.04]", dot: "status-critical" },
  warning: { icon: AlertTriangle, border: "border-l-status-warning", bg: "bg-status-warning/[0.04]", dot: "status-warning" },
  info: { icon: Info, border: "border-l-primary/40", bg: "bg-primary/[0.03]", dot: "bg-primary/50" },
};

interface AttentionRequiredProps {
  items: AttentionItem[];
}

export function AttentionRequired({ items = [] }: AttentionRequiredProps) {
  if (items.length === 0) {
    return (
      <section className="rounded-lg border border-border overflow-hidden">
        <div className="orion-panel-header">
          <div className="flex items-center gap-3">
            <div className="w-6 h-0.5 bg-status-warning rounded-full" />
            <h2 className="orion-panel-title">Atenção Necessária</h2>
          </div>
          <span className="text-xs font-mono text-muted-foreground/40">0 itens</span>
        </div>
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-muted-foreground/50 font-mono">Aguardando conexão com API</p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border overflow-hidden">
      <div className="orion-panel-header">
        <div className="flex items-center gap-3">
          <div className="w-6 h-0.5 bg-status-warning rounded-full" />
          <h2 className="orion-panel-title">Atenção Necessária</h2>
        </div>
        <span className="text-xs font-mono text-status-warning font-semibold">{items.length} itens</span>
      </div>

      <div className="divide-y divide-border/30">
        {items.map((item) => {
          const config = priorityConfig[item.priority];
          const Icon = config.icon;
          return (
            <div key={item.id} className={`flex items-center gap-4 px-5 py-4 ${config.bg} border-l-3 ${config.border} cursor-pointer hover:bg-accent/30 transition-colors group`}>
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
