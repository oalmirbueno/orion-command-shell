import { Shield, AlertTriangle, Clock, Zap, Bot, Activity } from "lucide-react";
import type { CommandData, SystemState } from "@/domains/system/types";

const stateConfig: Record<SystemState, {
  icon: React.ElementType; label: string; sublabel: string;
  bg: string; border: string; text: string; dot: string;
}> = {
  nominal: {
    icon: Shield, label: "NOMINAL", sublabel: "Operações dentro dos parâmetros",
    bg: "bg-status-online/[0.06]", border: "border-status-online/30", text: "text-status-online",
    dot: "status-online",
  },
  degraded: {
    icon: AlertTriangle, label: "DEGRADADO", sublabel: "Latência elevada detectada",
    bg: "bg-status-warning/[0.06]", border: "border-status-warning/30", text: "text-status-warning",
    dot: "status-warning",
  },
  critical: {
    icon: Shield, label: "CRÍTICO", sublabel: "Intervenção necessária",
    bg: "bg-status-critical/[0.06]", border: "border-status-critical/30", text: "text-status-critical",
    dot: "status-critical",
  },
};

const iconMap: Record<string, React.ElementType> = { Clock, Bot, Activity, Zap };

interface CommandStatusProps {
  data: CommandData;
}

export function CommandStatus({ data }: CommandStatusProps) {
  if (!data) return null;
  const cfg = stateConfig[data.systemState];
  const Icon = cfg.icon;

  return (
    <section className="h-full">
      <div className={`h-full rounded-lg border ${cfg.border} ${cfg.bg} px-5 py-5 flex flex-col justify-between`}>
        {/* Header: status */}
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-11 h-11 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
            <Icon className={`h-5 w-5 ${cfg.text}`} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <div className={`status-dot ${cfg.dot}`} />
              <h1 className={`text-sm font-bold tracking-widest font-mono uppercase ${cfg.text}`}>{cfg.label}</h1>
            </div>
            <p className="text-sm text-muted-foreground/60 mt-1">{cfg.sublabel}</p>
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-border/30">
          {data.metrics.map(m => {
            const MIcon = iconMap[m.icon] || Clock;
            return (
              <div key={m.label}>
                <div className="flex items-center gap-1.5 mb-1">
                  <MIcon className="h-3.5 w-3.5 text-muted-foreground/30" />
                  <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/50">{m.label}</span>
                </div>
                <p className="text-xl font-bold text-foreground tracking-tight">{m.value}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
