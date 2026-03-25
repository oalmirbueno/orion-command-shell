import { Shield, AlertTriangle, Clock, Zap, Bot, Activity } from "lucide-react";
import { useOrionData } from "@/hooks/useOrionData";
import { OrionDataWrapper } from "@/components/orion/DataWrapper";

type SystemState = "nominal" | "degraded" | "critical";

interface CommandData {
  systemState: SystemState;
  metrics: { label: string; value: string; icon: React.ElementType }[];
}

const MOCK_DATA: CommandData = {
  systemState: "degraded",
  metrics: [
    { label: "Uptime", value: "99.97%", icon: Clock },
    { label: "Agentes", value: "7/10", icon: Bot },
    { label: "Sessões", value: "5 ativas", icon: Activity },
    { label: "Tokens/h", value: "142k", icon: Zap },
  ],
};

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
    dot: "status-warning", glow: "shadow-[0_0_40px_-8px_hsl(var(--status-warning)/0.25)]",
  },
  critical: {
    icon: Shield, label: "FALHA DETECTADA", sublabel: "Ação imediata necessária",
    bg: "bg-status-critical/5", border: "border-status-critical/25", text: "text-status-critical",
    dot: "status-critical", glow: "shadow-[0_0_40px_-8px_hsl(var(--status-critical)/0.3)]",
  },
};

export function CommandStatus() {
  const { state, data, source, lastUpdated, refetch } = useOrionData<CommandData>({
    key: "command-status",
    mockData: MOCK_DATA,
    simulateDelay: 400,
  });

  return (
    <section>
      <OrionDataWrapper state={state} source={source} lastUpdated={lastUpdated} onRetry={refetch} compact>
        {data && <CommandStatusContent data={data} />}
      </OrionDataWrapper>
    </section>
  );
}

function CommandStatusContent({ data }: { data: CommandData }) {
  const cfg = stateConfig[data.systemState];
  const Icon = cfg.icon;

  return (
    <div className={`rounded-xl border-2 ${cfg.border} ${cfg.bg} ${cfg.glow} px-8 py-6`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className={`w-14 h-14 rounded-xl ${cfg.bg} border-2 ${cfg.border} flex items-center justify-center`}>
            <Icon className={`h-7 w-7 ${cfg.text}`} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <div className={`status-dot ${cfg.dot}`} />
              <h1 className={`text-lg font-bold tracking-wide ${cfg.text}`}>{cfg.label}</h1>
            </div>
            <p className="text-sm text-muted-foreground/70 mt-1.5">{cfg.sublabel}</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {data.metrics.map(m => {
            const MIcon = m.icon;
            return (
              <div key={m.label} className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <MIcon className="h-4 w-4 text-muted-foreground/40" />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/60">{m.label}</span>
                </div>
                <p className="text-lg font-bold text-foreground mt-1">{m.value}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex md:hidden items-center gap-4 mt-5 pt-4 border-t border-border/20">
        {data.metrics.map(m => (
          <div key={m.label} className="flex-1 text-center">
            <span className="text-[10px] font-mono text-muted-foreground/50 uppercase">{m.label}</span>
            <p className="text-base font-bold text-foreground mt-0.5">{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
