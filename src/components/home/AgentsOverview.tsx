import { Bot, Cpu, Wifi, WifiOff } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  role: string;
  status: "active" | "idle" | "offline";
  load: number;
  lastPing: string;
}

const MOCK_AGENTS: Agent[] = [
  { id: "1", name: "Classifier-01", role: "Classificação de Leads", status: "active", load: 72, lastPing: "2s" },
  { id: "2", name: "Enricher-01", role: "Enriquecimento de Dados", status: "active", load: 45, lastPing: "1s" },
  { id: "3", name: "Router-01", role: "Roteamento de Tarefas", status: "active", load: 63, lastPing: "3s" },
  { id: "4", name: "Analyzer-01", role: "Detecção de Padrões", status: "idle", load: 8, lastPing: "5s" },
  { id: "5", name: "Sync-01", role: "Sincronização de Dados", status: "active", load: 91, lastPing: "1s" },
  { id: "6", name: "Monitor-01", role: "Verificação de Saúde", status: "active", load: 34, lastPing: "2s" },
  { id: "7", name: "Validator-01", role: "Validação de Dados", status: "offline", load: 0, lastPing: "14min" },
  { id: "8", name: "Exporter-01", role: "Exportação de Relatórios", status: "idle", load: 2, lastPing: "8s" },
];

const statusConfig = {
  active: { dot: "status-online", label: "Ativo" },
  idle: { dot: "bg-muted-foreground/40", label: "Ocioso" },
  offline: { dot: "status-critical", label: "Offline" },
};

function LoadBar({ load, status }: { load: number; status: Agent["status"] }) {
  const color = status === "offline" ? "bg-status-critical/40" : load > 80 ? "bg-status-warning" : "bg-primary/60";
  return (
    <div className="w-full h-1 bg-surface-3 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${load}%` }} />
    </div>
  );
}

export function AgentsOverview() {
  const activeCount = MOCK_AGENTS.filter(a => a.status === "active").length;
  const total = MOCK_AGENTS.length;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
          Agentes
        </h2>
        <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
          <span className="text-[9px] font-mono text-primary font-medium">{activeCount}/{total} ativos</span>
        </div>
        <div className="flex-1 h-px bg-border/40" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {MOCK_AGENTS.map((agent) => {
          const cfg = statusConfig[agent.status];
          return (
            <div
              key={agent.id}
              className={`rounded-md border border-border/40 bg-card p-3 hover:bg-accent/30 transition-colors cursor-pointer ${agent.status === "offline" ? "opacity-50" : ""}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Bot className="h-3.5 w-3.5 text-muted-foreground/60" />
                  <span className="text-[11px] font-medium text-foreground">{agent.name}</span>
                </div>
                <div className={`status-dot ${cfg.dot}`} />
              </div>
              <p className="text-[9px] font-mono text-muted-foreground/50 mb-2">{agent.role}</p>
              <LoadBar load={agent.load} status={agent.status} />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[9px] font-mono text-muted-foreground/40">Carga {agent.load}%</span>
                <span className="text-[9px] font-mono text-muted-foreground/40">Ping {agent.lastPing}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
