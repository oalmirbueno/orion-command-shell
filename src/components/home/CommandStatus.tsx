import { Shield, AlertTriangle, Clock, Zap, Bot, Activity } from "lucide-react";

/**
 * CommandStatus — the single most important element on the home screen.
 * A prominent status banner that tells the operator the state of the entire system
 * at a glance, plus key operational metrics inline.
 */

type SystemState = "nominal" | "degraded" | "critical";

const SYSTEM_STATE: SystemState = "degraded"; // Because Data Pipeline has issues

const stateConfig: Record<SystemState, {
  icon: React.ElementType; label: string; sublabel: string;
  bg: string; border: string; text: string; dot: string; glow: string;
}> = {
  nominal: {
    icon: Shield, label: "SISTEMAS NOMINAIS", sublabel: "Todas as operações dentro dos parâmetros",
    bg: "bg-status-online/5", border: "border-status-online/25", text: "text-status-online",
    dot: "status-online", glow: "",
  },
  degraded: {
    icon: AlertTriangle, label: "PERFORMANCE DEGRADADA", sublabel: "1 serviço com latência elevada · operação continua",
    bg: "bg-status-warning/5", border: "border-status-warning/25", text: "text-status-warning",
    dot: "status-warning", glow: "shadow-[0_0_30px_-8px_hsl(var(--status-warning)/0.2)]",
  },
  critical: {
    icon: Shield, label: "FALHA DETECTADA", sublabel: "Ação imediata necessária",
    bg: "bg-status-critical/5", border: "border-status-critical/25", text: "text-status-critical",
    dot: "status-critical", glow: "shadow-[0_0_30px_-8px_hsl(var(--status-critical)/0.3)]",
  },
};

const METRICS = [
  { label: "Uptime", value: "99.97%", icon: Clock },
  { label: "Agentes", value: "7/10", icon: Bot },
  { label: "Sessões", value: "5 ativas", icon: Activity },
  { label: "Tokens/h", value: "142k", icon: Zap },
];

export function CommandStatus() {
  const cfg = stateConfig[SYSTEM_STATE];
  const Icon = cfg.icon;

  return (
    <section>
      {/* Main status banner */}
      <div className={`rounded-lg border ${cfg.border} ${cfg.bg} ${cfg.glow} px-6 py-5`}>
        <div className="flex items-center justify-between">
          {/* Left: Status */}
          <div className="flex items-center gap-4">
            <div className={`w-11 h-11 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
              <Icon className={`h-5 w-5 ${cfg.text}`} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <div className={`status-dot ${cfg.dot}`} />
                <h1 className={`text-sm font-bold tracking-wide ${cfg.text}`}>{cfg.label}</h1>
                <span className="text-[10px] font-mono text-primary animate-pulse-glow ml-2">● AO VIVO</span>
              </div>
              <p className="text-[11px] text-muted-foreground/60 mt-1">{cfg.sublabel}</p>
            </div>
          </div>

          {/* Right: Key metrics inline */}
          <div className="hidden md:flex items-center gap-6">
            {METRICS.map(m => {
              const MIcon = m.icon;
              return (
                <div key={m.label} className="text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <MIcon className="h-3 w-3 text-muted-foreground/30" />
                    <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/50">{m.label}</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{m.value}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile metrics row */}
        <div className="flex md:hidden items-center gap-4 mt-4 pt-3 border-t border-border/20">
          {METRICS.map(m => (
            <div key={m.label} className="flex-1 text-center">
              <span className="text-[8px] font-mono text-muted-foreground/40 uppercase">{m.label}</span>
              <p className="text-xs font-semibold text-foreground">{m.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
