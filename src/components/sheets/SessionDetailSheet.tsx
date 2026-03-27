import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Bot, Cpu, Clock, Hash, Key, Flame, Pause, CheckCircle2, XCircle } from "lucide-react";
import type { SessionView, SessionStatus } from "@/domains/sessions/types";

const statusConfig: Record<SessionStatus, { label: string; dot: string; icon: React.ElementType }> = {
  running: { label: "Em execução", dot: "status-online", icon: Flame },
  paused: { label: "Pausada", dot: "status-warning", icon: Pause },
  completed: { label: "Concluída", dot: "bg-primary/50", icon: CheckCircle2 },
  failed: { label: "Falha", dot: "status-critical", icon: XCircle },
};

interface Props {
  session: SessionView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SessionDetailSheet({ session, open, onOpenChange }: Props) {
  if (!session) return null;
  const cfg = statusConfig[session.status];
  const StatusIcon = cfg.icon;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-border overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-foreground">{session.title}</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 mt-6">
          {/* Status */}
          <div className="flex items-center gap-3">
            <StatusIcon className="h-5 w-5 text-muted-foreground" />
            <div className={`status-dot ${cfg.dot}`} />
            <span className="text-sm font-mono">{cfg.label}</span>
            <span className="text-xs font-mono text-muted-foreground/50 ml-auto">{session.progress}%</span>
          </div>

          {/* Details grid */}
          <div className="space-y-4">
            <DetailRow icon={Hash} label="ID" value={session.id} mono />
            <DetailRow icon={Key} label="Key" value={session.key} mono />
            <DetailRow icon={Bot} label="Agente" value={session.agent} />
            <DetailRow icon={Cpu} label="Modelo" value={session.model} />
            <DetailRow icon={Clock} label="Início" value={session.startedAt} />
            <DetailRow icon={Clock} label="Tempo ativo" value={session.elapsed} />
          </div>

          {/* Tokens */}
          <div className="rounded-lg border border-border/40 bg-surface-2 p-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground/50 mb-3">Tokens</h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-bold text-foreground">{session.inputTokens.toLocaleString()}</p>
                <p className="text-[10px] font-mono text-muted-foreground/40">Input</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{session.outputTokens.toLocaleString()}</p>
                <p className="text-[10px] font-mono text-muted-foreground/40">Output</p>
              </div>
              <div>
                <p className="text-lg font-bold text-primary">{session.totalTokens.toLocaleString()}</p>
                <p className="text-[10px] font-mono text-muted-foreground/40">Total</p>
              </div>
            </div>
          </div>

          {/* Preview */}
          {session.preview && (
            <div className="rounded-lg border border-border/40 bg-surface-2 p-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground/50 mb-3">Preview</h4>
              <pre className="text-xs font-mono text-foreground/70 whitespace-pre-wrap break-words leading-relaxed max-h-60 overflow-y-auto">{session.preview}</pre>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({ icon: Icon, label, value, mono }: { icon: React.ElementType; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground/30 shrink-0" />
      <span className="text-xs text-muted-foreground/50 w-24 shrink-0">{label}</span>
      <span className={`text-sm text-foreground/80 truncate ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}
