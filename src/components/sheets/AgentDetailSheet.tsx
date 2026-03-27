import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Bot, Cpu, Zap, Activity } from "lucide-react";
import type { AgentView } from "@/domains/agents/types";

interface Props {
  agent: AgentView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentDetailSheet({ agent, open, onOpenChange }: Props) {
  if (!agent) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-border overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-foreground flex items-center gap-2">
            <Bot className="h-5 w-5" /> {agent.name}
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-5 mt-6">
          <Row label="Role" value={agent.role} />
          <Row label="Tier" value={agent.tier} />
          <Row label="Modelo" value={agent.model} />
          <Row label="Status" value={agent.status} />
          <Row label="Disponibilidade" value={agent.availability} />

          <div className="rounded-lg border border-border/40 bg-surface-2 p-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground/50 mb-3">Métricas</h4>
            <div className="grid grid-cols-2 gap-4">
              <Metric icon={Zap} label="Sessões ativas" value={String(agent.sessions)} />
              <Metric icon={Cpu} label="Carga" value={`${agent.load}%`} />
              <Metric icon={Activity} label="Tokens hoje" value={agent.tokensToday} />
              <Metric icon={Activity} label="Alertas" value={String(agent.alertCount)} />
            </div>
          </div>

          <div className="rounded-lg border border-border/40 bg-surface-2 p-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground/50 mb-3">Tarefa Atual</h4>
            <p className="text-sm text-foreground/70">{agent.currentTask || "—"}</p>
            <p className="text-[10px] font-mono text-muted-foreground/30 mt-1">{agent.currentTaskAge}</p>
          </div>

          {agent.dependsOn.length > 0 && (
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground/50 mb-2">Depende de</h4>
              <div className="flex flex-wrap gap-1.5">
                {agent.dependsOn.map(d => <span key={d} className="orion-tag">{d}</span>)}
              </div>
            </div>
          )}
          {agent.feeds.length > 0 && (
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground/50 mb-2">Alimenta</h4>
              <div className="flex flex-wrap gap-1.5">
                {agent.feeds.map(f => <span key={f} className="orion-tag">{f}</span>)}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground/50 w-28 shrink-0">{label}</span>
      <span className="text-sm font-mono text-foreground/80">{value}</span>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground/30" />
      <div>
        <p className="text-xs text-muted-foreground/40">{label}</p>
        <p className="text-sm font-mono font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
