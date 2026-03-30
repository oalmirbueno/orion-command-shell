import { ThermometerSun, HardDrive, Wifi, ShieldAlert, Clock, Inbox } from "lucide-react";
import type { StabilitySignal, SignalLevel } from "@/domains/system/types";

const iconMap: Record<string, React.ElementType> = { ThermometerSun, HardDrive, Wifi, ShieldAlert, Clock };

const levelConfig: Record<SignalLevel, { bg: string; border: string; text: string; dot: string }> = {
  normal: { bg: "", border: "border-border/30", text: "text-foreground/70", dot: "bg-primary/40" },
  elevated: { bg: "bg-status-warning/[0.04]", border: "border-status-warning/20", text: "text-status-warning", dot: "status-warning" },
  critical: { bg: "bg-status-critical/[0.04]", border: "border-status-critical/20", text: "text-status-critical", dot: "status-critical" },
};

interface Props {
  signals: StabilitySignal[];
}

export function StabilitySignals({ signals = [] }: Props) {
  if (signals.length === 0) {
    return (
      <section className="rounded-lg border border-border overflow-hidden h-full">
        <div className="orion-panel-header">
          <div className="flex items-center gap-3">
            <div className="w-6 h-0.5 bg-muted-foreground/40 rounded-full" />
            <h2 className="orion-panel-title">Sinais de Estabilidade</h2>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="w-12 h-12 rounded-lg bg-surface-2 border border-border flex items-center justify-center mb-4">
            <Inbox className="h-6 w-6 text-muted-foreground/30" />
          </div>
          <p className="text-sm font-medium text-muted-foreground/50">Sem sinais disponíveis</p>
          <p className="text-xs font-mono text-muted-foreground/30 mt-1.5">Aguardando conexão com API</p>
        </div>
      </section>
    );
  }

  const hasIssues = signals.some(s => s.level !== "normal");

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">Sinais de Estabilidade</h2>
        {!hasIssues ? (
          <div className="flex items-center gap-2 ml-2 px-3 py-1 rounded-full bg-status-online/10 border border-status-online/20">
            <span className="text-xs font-mono text-status-online font-medium">Estável</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 ml-2 px-3 py-1 rounded-full bg-status-warning/10 border border-status-warning/20">
            <span className="text-xs font-mono text-status-warning font-medium">Atenção</span>
          </div>
        )}
        <div className="flex-1 h-px bg-border/40" />
      </div>

      <div className="space-y-2">
        {signals.map((signal) => {
          const cfg = levelConfig[signal.level];
          const Icon = iconMap[signal.iconName] || Clock;

          return (
            <div
              key={signal.label}
              className={`flex items-center gap-3.5 px-4 py-3.5 rounded-lg border ${cfg.border} ${cfg.bg} hover:bg-accent/20 transition-colors`}
            >
              <Icon className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{signal.label}</span>
                  <div className={`status-dot ${cfg.dot}`} />
                </div>
                {signal.detail && (
                  <p className="text-[10px] font-mono text-muted-foreground/30 mt-0.5 truncate">{signal.detail}</p>
                )}
              </div>
              <span className={`text-sm font-mono font-semibold ${cfg.text} shrink-0`}>{signal.value}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
