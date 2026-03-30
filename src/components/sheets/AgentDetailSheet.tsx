import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bot, Cpu, Zap, Activity, Clock, Layers, ArrowDownRight,
  ArrowUpRight, AlertTriangle, Briefcase, RotateCcw, Loader2, Terminal, RefreshCw,
  Fingerprint, Brain, Target, Shield, Sparkles, Hash, Copy, Check, ListChecks, CheckCircle2, XCircle, Clock3,
} from "lucide-react";
import { apiUrl } from "@/domains/api";
import { toast } from "@/hooks/use-toast";
import type { AgentView } from "@/domains/agents/types";

interface LogEntry { ts: string; level: string; message: string; }
interface TaskHistoryEntry { id: string; description: string; status: string; timestamp: string; duration?: string; }

interface AgentProfile {
  personality: string;
  objective: string;
  scope: string;
  behavior: string;
  soul: string;
  instructions: string;
}

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
  const [logFilter, setLogFilter] = useState<"all" | "info" | "warn" | "error">("all");
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [taskHistory, setTaskHistory] = useState<TaskHistoryEntry[]>([]);
  const [taskHistoryLoading, setTaskHistoryLoading] = useState(false);
  const [taskVisible, setTaskVisible] = useState(5);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Fetch task history from activities
  useEffect(() => {
    if (!open || !agent) { setTaskHistory([]); setTaskVisible(5); return; }
    let cancelled = false;
    const fetchHistory = async () => {
      setTaskHistoryLoading(true);
      try {
        const res = await fetch(apiUrl("/activities"));
        if (!res.ok) throw new Error();
        const data = await res.json();
        const all = data.activities || data || [];
        if (!cancelled) {
          const filtered = all
            .filter((a: any) => a.agent === agent.name || a.agent === agent.id || a.agentId === agent.id)
            .slice(0, 20)
            .map((a: any) => ({
              id: a.id || crypto.randomUUID(),
              description: a.description || a.message || a.content || "",
              status: a.status || "success",
              timestamp: a.timestamp || "",
              duration: a.duration_ms ? `${(a.duration_ms / 1000).toFixed(1)}s` : undefined,
            }));
          setTaskHistory(filtered);
        }
      } catch { /* silent */ }
      finally { if (!cancelled) setTaskHistoryLoading(false); }
    };
    fetchHistory();
    return () => { cancelled = true; };
  }, [open, agent?.id]);

  // Fetch agent profile/soul
  useEffect(() => {
    if (!open || !agent) { setProfile(null); return; }
    let cancelled = false;
    const fetchProfile = async () => {
      setProfileLoading(true);
      try {
        const res = await fetch(apiUrl(`/agents/${agent.id}`));
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelled) {
          setProfile({
            personality: data.personality || data.soul?.personality || "",
            objective: data.objective || data.soul?.objective || data.purpose || "",
            scope: data.scope || data.soul?.scope || "",
            behavior: data.behavior || data.soul?.behavior || data.expectedBehavior || "",
            soul: data.soul?.summary || data.soulSummary || data.identity || "",
            instructions: data.instructions || data.soul?.instructions || data.systemPrompt || "",
          });
        }
      } catch {
        // No profile endpoint — leave null, UI shows fallback
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    };
    fetchProfile();
    return () => { cancelled = true; };
  }, [open, agent?.id]);

  useEffect(() => {
    if (!open || !agent) { setLogs([]); return; }

    let cancelled = false;
    let endpointUnavailable = false;

    const fetchLogs = async () => {
      if (endpointUnavailable) return;
      setLogsLoading(true);
      setLogsError(false);
      try {
        // Try dedicated logs endpoint first
        const res = await fetch(apiUrl(`/agents/${agent.id}/logs`));
        if (res.status === 404) {
          // Endpoint doesn't exist — try activities filtered by agent
          const fallback = await fetch(apiUrl(`/activities`));
          if (!fallback.ok) throw new Error("activities-failed");
          const fbData = await fallback.json();
          const allActivities = fbData.activities || fbData || [];
          if (!cancelled) {
            const filtered = allActivities
              .filter((a: any) => a.agent === agent.name || a.agent === agent.id || a.agentId === agent.id)
              .slice(0, 50);
            if (filtered.length === 0) {
              // No agent-specific data available at all
              endpointUnavailable = true;
              setLogs([]);
            } else {
              setLogs(filtered.map((a: any) => ({
                ts: a.timestamp || "",
                level: a.status === "error" ? "error" : a.status === "warning" ? "warn" : "info",
                message: a.description || a.message || a.content || String(a),
              })));
            }
          }
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
          {/* Identity */}
          <Section icon={Fingerprint} title="Identidade">
            <Row label="Nome" value={agent.name} />
            <div className="flex items-center gap-3 ml-5">
              <span className="text-xs text-muted-foreground/50 w-28 shrink-0">ID</span>
              <code className="text-[11px] font-mono text-foreground/60 truncate">{agent.id}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(agent.id); setCopiedId(true); setTimeout(() => setCopiedId(false), 1500); }}
                className="shrink-0 text-muted-foreground/30 hover:text-foreground/60 transition-colors cursor-pointer"
              >
                {copiedId ? <Check className="h-3 w-3 text-status-online" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
            <Row label="Função" value={agent.role} />
            <Row label="Tier" value={tier} />
            <Row label="Modelo" value={agent.model} mono />
            <Row label="Status" value={badge.label} />
          </Section>

          <Separator className="bg-border/30" />

          {/* Agent Profile / Soul */}
          <Section icon={Brain} title="Perfil do Agente">
            {profileLoading ? (
              <div className="space-y-2 ml-5">
                {[1,2,3].map(i => <div key={i} className="h-3 rounded bg-muted/30 animate-pulse" style={{ width: `${80 - i * 15}%` }} />)}
              </div>
            ) : profile && Object.values(profile).some(v => v) ? (
              <div className="space-y-3 ml-5">
                {profile.soul && <ProfileBlock icon={Sparkles} label="SOUL" value={profile.soul} />}
                {profile.objective && <ProfileBlock icon={Target} label="Objetivo" value={profile.objective} />}
                {profile.personality && <ProfileBlock label="Personalidade" value={profile.personality} />}
                {profile.scope && <ProfileBlock label="Escopo" value={profile.scope} />}
                {profile.behavior && <ProfileBlock icon={Shield} label="Comportamento" value={profile.behavior} />}
                {profile.instructions && (
                  <div className="rounded-lg border border-border/30 bg-muted/10 p-3">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/40 mb-1.5">Instruções</p>
                    <p className="text-xs text-foreground/60 leading-relaxed whitespace-pre-wrap">{profile.instructions}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="ml-5 rounded-lg border border-dashed border-border/30 p-4 text-center">
                <Brain className="h-5 w-5 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground/40">Perfil não disponível via API</p>
                <p className="text-[10px] font-mono text-muted-foreground/25 mt-1">Endpoint: GET /api/agents/{agent.id}</p>
              </div>
            )}
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

          {/* Task History */}
          <Section icon={ListChecks} title="Histórico de Tarefas">
            {taskHistoryLoading ? (
              <div className="space-y-2 ml-5">
                {[1,2,3].map(i => <div key={i} className="h-8 rounded bg-muted/30 animate-pulse" />)}
              </div>
            ) : taskHistory.length === 0 ? (
              <p className="text-xs text-muted-foreground/40 italic ml-5">Nenhuma tarefa registrada</p>
            ) : (
              <div className="ml-5 space-y-1.5 max-h-56 overflow-y-auto scrollbar-thin pr-1">
                {taskHistory.map(task => (
                  <div key={task.id} className="flex items-start gap-2.5 rounded-md border border-border/20 bg-muted/10 px-3 py-2">
                    {task.status === "success" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-status-online shrink-0 mt-0.5" />
                    ) : task.status === "error" ? (
                      <XCircle className="h-3.5 w-3.5 text-status-critical shrink-0 mt-0.5" />
                    ) : (
                      <Clock3 className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-foreground/70 leading-relaxed truncate">{task.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono text-muted-foreground/30">
                          {task.timestamp ? new Date(task.timestamp).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
                        </span>
                        {task.duration && <span className="text-[10px] font-mono text-muted-foreground/25">{task.duration}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Separator className="bg-border/30" />
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
            {/* Filter chips */}
            <div className="flex gap-1.5 ml-5 mb-2">
              {(["all", "info", "warn", "error"] as const).map(level => (
                <button
                  key={level}
                  onClick={() => setLogFilter(level)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition-colors cursor-pointer ${
                    logFilter === level
                      ? level === "error" ? "bg-status-critical/20 text-status-critical"
                        : level === "warn" ? "bg-status-warning/20 text-status-warning"
                        : "bg-primary/20 text-primary"
                      : "bg-muted/20 text-muted-foreground/50 hover:bg-muted/40"
                  }`}
                >
                  {level === "all" ? "Todos" : level}
                </button>
              ))}
            </div>
            {logsLoading && logs.length === 0 ? (
              <div className="space-y-2 ml-5">
                {[1,2,3].map(i => <div key={i} className="h-4 w-full rounded bg-muted/30 animate-pulse" />)}
              </div>
            ) : logsError ? (
              <p className="text-xs text-muted-foreground/40 italic ml-5">Não foi possível conectar ao endpoint de logs</p>
            ) : logs.length === 0 ? (
              <p className="text-xs text-muted-foreground/40 italic ml-5">Nenhuma atividade registrada para este agente</p>
            ) : (() => {
              const filtered = logFilter === "all" ? logs : logs.filter(l => l.level === logFilter);
              return filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground/40 italic ml-5">Nenhum log "{logFilter}"</p>
              ) : (
                <div className="ml-5 max-h-48 overflow-y-auto rounded-lg border border-border/30 bg-muted/10 p-3 space-y-1.5 scrollbar-thin">
                  {filtered.map((log, i) => (
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
              );
            })()}
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

function ProfileBlock({ icon: Icon, label, value }: { icon?: React.ElementType; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        {Icon && <Icon className="h-3 w-3 text-muted-foreground/30" />}
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/40">{label}</p>
      </div>
      <p className="text-xs text-foreground/65 leading-relaxed">{value}</p>
    </div>
  );
}
