import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bot, Cpu, Zap, Activity, Clock, Layers, ArrowDownRight,
  ArrowUpRight, AlertTriangle, Briefcase, RotateCcw, Loader2, Terminal, RefreshCw,
} from "lucide-react";
import { apiUrl } from "@/domains/api";
import { toast } from "@/hooks/use-toast";
import type { AgentView } from "@/domains/agents/types";

interface LogEntry { ts: string; level: string; message: string; }

const statusBadge: Record<string, { label: string; className: string }> = {
  active:  { label: "Ativo",   className: "bg-status-online/15 text-status-online border-status-online/30" },
  idle:    { label: "Ocioso",  className: "bg-muted text-muted-foreground border-border/40" },
  offline: { label: "Offline", className: "bg-status-critical/15 text-status-critical border-status-critical/30" },
};

const tierLabel: Record<string, string> = {
  orchestrator: "Orquestrador",
  core: "Núcleo",
  support: "Suporte",
};

interface Props {
  agent: AgentView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentDetailSheet({ agent, open, onOpenChange }: Props) {
  const [restarting, setRestarting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !agent) { setLogs([]); return; }

    let cancelled = false;
    const fetchLogs = async () => {
      setLogsLoading(true);
      setLogsError(false);
      try {
        const res = await fetch(apiUrl(`/agents/${agent.id}/logs`));
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelled) {
          const entries: LogEntry[] = (data.logs || data || []).map((l: any) => ({
            ts: l.timestamp || l.ts || l.at || "",
            level: l.level || "info",
            message: l.message || l.msg || l.text || String(l),
          }));
          setLogs(entries);
        }
      } catch {
        if (!cancelled) setLogsError(true);
      } finally {
        if (!cancelled) setLogsLoading(false);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 10_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [open, agent?.id]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  if (!agent) return null;

  const handleRestart = async () => {
    setRestarting(true);
    try {
      const res = await fetch(apiUrl(`/agents/${agent.id}/restart`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast({ title: `"${agent.name}" reiniciado com sucesso` });
    } catch {
      toast({ title: "Erro ao reiniciar agente", variant: "destructive" });
    } finally {
      setRestarting(false);
    }
  };

  const badge = statusBadge[agent.status] || statusBadge.idle;
  const tier = tierLabel[agent.tier] || agent.tier;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-border overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-surface-2 border border-border/40 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-foreground text-base truncate">{agent.name}</SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={`text-[10px] font-mono px-2 py-0 ${badge.className}`}>
                  {badge.label}
                </Badge>
                <Badge variant="outline" className="text-[10px] font-mono px-2 py-0 border-border/40 text-muted-foreground">
                  {tier}
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-5 mt-6">
          {/* Role & Model */}
          <Section icon={Briefcase} title="Função">
            <Row label="Role" value={agent.role} />
            <Row label="Modelo" value={agent.model} mono />
          </Section>

          <Separator className="bg-border/30" />

          {/* Sessions & Activity */}
          <Section icon={Activity} title="Atividade">
            <Row label="Sessões ativas" value={String(agent.sessions)} />
            <Row label="Última atividade" value={agent.lastActivityLabel || agent.lastActivity} />
          </Section>

          <Separator className="bg-border/30" />

          {/* Current Task */}
          <Section icon={Clock} title="Tarefa Atual">
            {agent.currentTask ? (
              <>
                <p className="text-sm text-foreground/80 ml-5">{agent.currentTask}</p>
                {agent.currentTaskAge && (
                  <p className="text-[10px] font-mono text-muted-foreground/30 ml-5 mt-1">{agent.currentTaskAge}</p>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground/40 italic ml-5">Nenhuma tarefa em execução</p>
            )}
          </Section>

          <Separator className="bg-border/30" />

          {/* Metrics */}
          <Section icon={Cpu} title="Métricas">
            <div className="grid grid-cols-3 gap-3 ml-5">
              <MetricCard label="Carga" value={`${agent.load}%`} />
              <MetricCard label="Tokens hoje" value={String(agent.tokensToday)} />
              <MetricCard label="Disponibilidade" value={String(agent.availability)} />
            </div>
          </Section>

          {/* Alerts */}
          {(agent.alertCount ?? 0) > 0 && (
            <>
              <Separator className="bg-border/30" />
              <div className="flex items-center gap-2 rounded-lg border border-status-warning/20 bg-status-warning/5 px-4 py-3">
                <AlertTriangle className="h-4 w-4 text-status-warning" />
                <span className="text-sm text-status-warning font-medium">{agent.alertCount} alerta{agent.alertCount! > 1 ? "s" : ""}</span>
              </div>
            </>
          )}

          {/* Dependencies */}
          {(agent.dependsOn?.length ?? 0) > 0 && (
            <>
              <Separator className="bg-border/30" />
              <Section icon={ArrowDownRight} title="Depende de">
                <div className="flex flex-wrap gap-1.5 ml-5">
                  {agent.dependsOn!.map(d => (
                    <Badge key={d} variant="outline" className="text-[10px] font-mono border-border/40 text-muted-foreground">{d}</Badge>
                  ))}
                </div>
              </Section>
            </>
          )}

          {(agent.feeds?.length ?? 0) > 0 && (
            <>
              <Separator className="bg-border/30" />
              <Section icon={ArrowUpRight} title="Alimenta">
                <div className="flex flex-wrap gap-1.5 ml-5">
                  {agent.feeds!.map(f => (
                    <Badge key={f} variant="outline" className="text-[10px] font-mono border-border/40 text-muted-foreground">{f}</Badge>
                  ))}
                </div>
              </Section>
            </>
          )}

          <Separator className="bg-border/30" />

          {/* Logs */}
          <Section icon={Terminal} title="Logs recentes">
            {logsLoading && logs.length === 0 ? (
              <div className="space-y-2 ml-5">
                {[1,2,3].map(i => <div key={i} className="h-4 w-full rounded bg-muted/30 animate-pulse" />)}
              </div>
            ) : logsError ? (
              <p className="text-xs text-muted-foreground/40 italic ml-5">Erro ao carregar logs</p>
            ) : logs.length === 0 ? (
              <p className="text-xs text-muted-foreground/40 italic ml-5">Nenhum log disponível</p>
            ) : (
              <div className="ml-5 max-h-48 overflow-y-auto rounded-lg border border-border/30 bg-muted/10 p-3 space-y-1.5 scrollbar-thin">
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-2 text-[11px] font-mono leading-relaxed">
                    <span className="text-muted-foreground/30 shrink-0 w-16 truncate">
                      {log.ts ? new Date(log.ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"}
                    </span>
                    <span className={`shrink-0 w-10 uppercase ${
                      log.level === "error" ? "text-status-critical" :
                      log.level === "warn" ? "text-status-warning" :
                      "text-muted-foreground/50"
                    }`}>{log.level}</span>
                    <span className="text-foreground/70 break-all">{log.message}</span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </Section>

          <Separator className="bg-border/30" />

          <Button
            onClick={handleRestart}
            disabled={restarting || agent.status === "offline"}
            className="w-full"
            variant="outline"
          >
            {restarting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-2" />
            )}
            {restarting ? "Reiniciando…" : "Reiniciar agente"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-3.5 w-3.5 text-muted-foreground/40" />
        <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground/50">{title}</h4>
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-3 ml-5">
      <span className="text-xs text-muted-foreground/50 w-28 shrink-0">{label}</span>
      <span className={`text-sm text-foreground/80 truncate ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/30 bg-muted/20 p-3 text-center">
      <p className="text-base font-bold text-foreground">{value}</p>
      <p className="text-[10px] font-mono text-muted-foreground/40 mt-0.5">{label}</p>
    </div>
  );
}
