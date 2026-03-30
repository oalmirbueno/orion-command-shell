import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bot, Cpu, Zap, Activity, Clock, ArrowDownRight, ArrowUpRight,
  AlertTriangle, RotateCcw, Loader2, Terminal, Fingerprint, Brain,
  Target, Shield, Sparkles, Copy, Check, ListChecks, CheckCircle2,
  XCircle, Clock3, Settings2, Save, Pencil, Power,
} from "lucide-react";
import { apiUrl } from "@/domains/api";
import { toast } from "@/hooks/use-toast";
import type { AgentView } from "@/domains/agents/types";

// ── Types ────────────────────────────────────────────
interface LogEntry { ts: string; level: string; message: string }
interface TaskHistoryEntry { id: string; description: string; status: string; timestamp: string; duration?: string }
interface AgentProfile { personality: string; objective: string; scope: string; behavior: string; soul: string; instructions: string }

// ── Constants ────────────────────────────────────────
const statusBadge: Record<string, { label: string; cls: string }> = {
  active:  { label: "Ativo",   cls: "bg-status-online/15 text-status-online border-status-online/30" },
  idle:    { label: "Ocioso",  cls: "bg-muted text-muted-foreground border-border/40" },
  offline: { label: "Offline", cls: "bg-status-critical/15 text-status-critical border-status-critical/30" },
};
const tierLabel: Record<string, string> = { orchestrator: "Orquestrador", core: "Núcleo", support: "Suporte" };

// ── Props ────────────────────────────────────────────
interface Props {
  agent: AgentView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════
export function AgentDetailSheet({ agent, open, onOpenChange }: Props) {
  const [tab, setTab] = useState("overview");

  // ── Actions state ──
  const [restarting, setRestarting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [agentEnabled, setAgentEnabled] = useState(true);

  // ── Profile state ──
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSource, setProfileSource] = useState<"live" | "fallback">("fallback");

  // ── Logs state ──
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState(false);
  const [logFilter, setLogFilter] = useState<"all" | "info" | "warn" | "error">("all");
  const [logsSource, setLogsSource] = useState<"live" | "fallback">("fallback");
  const logsEndRef = useRef<HTMLDivElement>(null);

  // ── Task history ──
  const [taskHistory, setTaskHistory] = useState<TaskHistoryEntry[]>([]);
  const [taskHistoryLoading, setTaskHistoryLoading] = useState(false);
  const [taskHistorySource, setTaskHistorySource] = useState<"live" | "fallback">("fallback");
  const [taskVisible, setTaskVisible] = useState(5);

  // ── Config controls ──
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [newTopicId, setNewTopicId] = useState("");
  const [controls, setControls] = useState({
    displayName: "", shortDesc: "", role: "", notes: "",
    scopeType: "global" as "global" | "dm" | "topic" | "mixed",
    topicIds: [] as string[],
    dmEnabled: true, groupEnabled: true,
    opStatus: "ativo" as "ativo" | "pausado" | "somente_leitura",
  });

  // ── Reset on open ──
  useEffect(() => {
    if (open && agent) {
      setTab("overview");
      setEditing(false);
      setTaskVisible(5);
      setAgentEnabled(agent.status !== "offline");
      setControls(c => ({ ...c, displayName: agent.name, role: agent.role, shortDesc: "", notes: "" }));
    }
  }, [open, agent?.id]);

  // ── Fetch profile ──
  useEffect(() => {
    if (!open || !agent) { setProfile(null); return; }
    let cancelled = false;
    setProfileLoading(true);
    fetch(apiUrl(`/agents/${agent.id}`))
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => {
        if (cancelled) return;
        const p: AgentProfile = {
          personality: d.personality || d.soul?.personality || "",
          objective: d.objective || d.soul?.objective || d.purpose || "",
          scope: d.scope || d.soul?.scope || "",
          behavior: d.behavior || d.soul?.behavior || "",
          soul: d.soul?.summary || d.soulSummary || d.identity || "",
          instructions: d.instructions || d.soul?.instructions || d.systemPrompt || "",
        };
        setProfile(p);
        setProfileSource(Object.values(p).some(v => v) ? "live" : "fallback");
      })
      .catch(() => { if (!cancelled) { setProfile(null); setProfileSource("fallback"); } })
      .finally(() => { if (!cancelled) setProfileLoading(false); });
    return () => { cancelled = true; };
  }, [open, agent?.id]);

  // ── Fetch logs ──
  useEffect(() => {
    if (!open || !agent || tab !== "logs") { return; }
    let cancelled = false;
    let unavailable = false;
    const fetchLogs = async () => {
      if (unavailable) return;
      setLogsLoading(true); setLogsError(false);
      try {
        const res = await fetch(apiUrl(`/agents/${agent.id}/logs`));
        if (res.status === 404) {
          const fb = await fetch(apiUrl("/activities"));
          if (!fb.ok) throw new Error();
          const data = await fb.json();
          const all = data.activities || data || [];
          if (!cancelled) {
            const filtered = all.filter((a: any) => a.agent === agent.name || a.agent === agent.id || a.agentId === agent.id).slice(0, 50);
            if (filtered.length === 0) { unavailable = true; setLogs([]); }
133:             else { setLogs(filtered.map((a: any) => ({ ts: a.timestamp || "", level: a.status === "error" ? "error" : a.status === "warning" ? "warn" : "info", message: a.description || a.message || String(a) }))); setLogsSource("fallback"); }
          }
          return;
        }
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelled) { setLogs((data.logs || data || []).map((l: any) => ({ ts: l.timestamp || l.ts || "", level: l.level || "info", message: l.message || l.msg || String(l) }))); setLogsSource("live"); }
      } catch { if (!cancelled) setLogsError(true); }
      finally { if (!cancelled) setLogsLoading(false); }
    };
    fetchLogs();
    const interval = setInterval(fetchLogs, 10_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [open, agent?.id, tab]);

  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);

  // ── Fetch task history ──
  useEffect(() => {
    if (!open || !agent || (tab !== "overview" && tab !== "operation")) { return; }
    let cancelled = false;
    setTaskHistoryLoading(true);
    fetch(apiUrl("/activities"))
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (cancelled) return;
        const all = data.activities || data || [];
        const filtered = all.filter((a: any) => a.agent === agent.name || a.agent === agent.id || a.agentId === agent.id).map((a: any) => ({ id: a.id || crypto.randomUUID(), description: a.description || a.message || "", status: a.status || "success", timestamp: a.timestamp || "", duration: a.duration_ms ? `${(a.duration_ms / 1000).toFixed(1)}s` : undefined }));
        setTaskHistory(filtered);
        setTaskHistorySource(filtered.length > 0 ? "live" : "fallback");
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setTaskHistoryLoading(false); });
    return () => { cancelled = true; };
  }, [open, agent?.id, tab]);

  if (!agent) return null;

  // ── Action handlers ──
  const handleRestart = async () => {
    setRestarting(true);
    try {
      const res = await fetch(apiUrl(`/agents/${agent.id}/restart`), { method: "POST", headers: { "Content-Type": "application/json" } });
      if (!res.ok) throw new Error();
      toast({ title: `"${agent.name}" reiniciado com sucesso` });
    } catch { toast({ title: "Erro ao reiniciar agente", variant: "destructive" }); }
    finally { setRestarting(false); }
  };

  const handleToggle = async (enabled: boolean) => {
    setToggling(true);
    const prev = agentEnabled;
    setAgentEnabled(enabled);
    try {
      const res = await fetch(apiUrl(`/agents/${agent.id}`), { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled }) });
      if (!res.ok) throw new Error();
      toast({ title: enabled ? "Agente ativado" : "Agente desativado" });
    } catch { setAgentEnabled(prev); toast({ title: "Erro ao alterar estado", variant: "destructive" }); }
    finally { setToggling(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(apiUrl(`/agents/${agent.id}`), { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(controls) });
      if (!res.ok) throw new Error();
      toast({ title: "Configurações salvas" });
      setEditing(false);
    } catch { toast({ title: "Erro ao salvar", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const badge = statusBadge[agent.status] || statusBadge.idle;
  const tier = tierLabel[agent.tier] || agent.tier;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-border overflow-y-auto sm:max-w-lg p-0">
        {/* ── Header ── */}
        <div className="px-6 pt-6 pb-4 border-b border-border/30">
          <SheetHeader className="mb-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-surface-2 border border-border/40 flex items-center justify-center shrink-0">
                <Bot className="h-5 w-5 text-muted-foreground/60" />
              </div>
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-foreground text-base truncate">{agent.name}</SheetTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={`text-[10px] font-mono px-2 py-0 ${badge.cls}`}>{badge.label}</Badge>
                  <Badge variant="outline" className="text-[10px] font-mono px-2 py-0 border-border/40 text-muted-foreground">{tier}</Badge>
                  <Badge variant="outline" className={`text-[10px] font-mono px-1.5 py-0 ${profileSource === "live" ? "border-status-online/40 text-status-online" : "border-border/30 text-muted-foreground/40"}`}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${profileSource === "live" ? "bg-status-online" : "bg-muted-foreground/30"}`} />
                    {profileSource === "live" ? "LIVE" : "OFFLINE"}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex flex-col items-center gap-0.5">
                  <Switch checked={agentEnabled} disabled={toggling} onCheckedChange={handleToggle} className="data-[state=checked]:bg-status-online" />
                  <span className="text-[9px] font-mono text-muted-foreground/40">{agentEnabled ? "ON" : "OFF"}</span>
                </div>
              </div>
            </div>
          </SheetHeader>

          {/* Quick actions bar */}
          <div className="flex gap-2 mt-4">
            <Button size="sm" variant="outline" onClick={handleRestart} disabled={restarting || !agentEnabled} className="flex-1 h-8 text-xs">
              {restarting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5 mr-1.5" />}
              {restarting ? "Reiniciando…" : "Reiniciar"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setTab("config"); setEditing(true); }} className="flex-1 h-8 text-xs">
              <Pencil className="h-3.5 w-3.5 mr-1.5" /> Configurar
            </Button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <Tabs value={tab} onValueChange={setTab} className="flex-1">
          <TabsList className="w-full rounded-none border-b border-border/30 bg-transparent h-10 px-6">
            <TabsTrigger value="overview" className="text-xs font-mono data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Visão Geral</TabsTrigger>
            <TabsTrigger value="config" className="text-xs font-mono data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Configuração</TabsTrigger>
            <TabsTrigger value="operation" className="text-xs font-mono data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Operação</TabsTrigger>
            <TabsTrigger value="logs" className="text-xs font-mono data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">Logs</TabsTrigger>
          </TabsList>

          {/* ═══════ TAB: Visão Geral ═══════ */}
          <TabsContent value="overview" className="px-6 py-5 space-y-5 mt-0">
            <Sec icon={Fingerprint} title="Identidade">
              <InfoRow label="Nome" value={agent.name} />
              <div className="flex items-center gap-3 ml-5">
                <span className="text-xs text-muted-foreground/50 w-28 shrink-0">ID</span>
                <code className="text-[11px] font-mono text-foreground/60 truncate">{agent.id}</code>
                <button onClick={() => { navigator.clipboard.writeText(agent.id); setCopiedId(true); setTimeout(() => setCopiedId(false), 1500); }} className="shrink-0 text-muted-foreground/30 hover:text-foreground/60 transition-colors cursor-pointer">
                  {copiedId ? <Check className="h-3 w-3 text-status-online" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
              <InfoRow label="Função" value={agent.role} />
              <InfoRow label="Tier" value={tier} />
              <InfoRow label="Modelo" value={agent.model} mono />
            </Sec>

            <Separator className="bg-border/30" />

             <Sec icon={Brain} title="Perfil" badge={profileSource === "live" ? "live" : "fallback"}>
              {profileLoading ? (
                <div className="space-y-2 ml-5">{[1,2,3].map(i => <div key={i} className="h-3 rounded bg-muted/30 animate-pulse" style={{ width: `${80 - i * 15}%` }} />)}</div>
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
                  <p className="text-[10px] font-mono text-muted-foreground/25 mt-1">GET /api/agents/{agent.id}</p>
                </div>
              )}
            </Sec>

            <Separator className="bg-border/30" />

            <Sec icon={Cpu} title="Métricas">
              <div className="grid grid-cols-3 gap-3 ml-5">
                <MetricCard label="Carga" value={`${agent.load}%`} />
                <MetricCard label="Tokens" value={String(agent.tokensToday)} />
                <MetricCard label="Disponib." value={String(agent.availability)} />
              </div>
            </Sec>

            {(agent.alertCount ?? 0) > 0 && (
              <>
                <Separator className="bg-border/30" />
                <div className="flex items-center gap-2 rounded-lg border border-status-warning/20 bg-status-warning/5 px-4 py-3">
                  <AlertTriangle className="h-4 w-4 text-status-warning" />
                  <span className="text-sm text-status-warning font-medium">{agent.alertCount} alerta{agent.alertCount! > 1 ? "s" : ""}</span>
                </div>
              </>
            )}

            {((agent.dependsOn?.length ?? 0) > 0 || (agent.feeds?.length ?? 0) > 0) && (
              <>
                <Separator className="bg-border/30" />
                {(agent.dependsOn?.length ?? 0) > 0 && (
                  <Sec icon={ArrowDownRight} title="Depende de">
                    <div className="flex flex-wrap gap-1.5 ml-5">
                      {agent.dependsOn!.map(d => <Badge key={d} variant="outline" className="text-[10px] font-mono border-border/40 text-muted-foreground">{d}</Badge>)}
                    </div>
                  </Sec>
                )}
                {(agent.feeds?.length ?? 0) > 0 && (
                  <Sec icon={ArrowUpRight} title="Alimenta">
                    <div className="flex flex-wrap gap-1.5 ml-5">
                      {agent.feeds!.map(f => <Badge key={f} variant="outline" className="text-[10px] font-mono border-border/40 text-muted-foreground">{f}</Badge>)}
                    </div>
                  </Sec>
                )}
              </>
            )}
          </TabsContent>

          {/* ═══════ TAB: Configuração ═══════ */}
          <TabsContent value="config" className="px-6 py-5 space-y-5 mt-0">
            <Sec icon={Settings2} title="Controle Operacional" badge={profileSource}>
              <div className="ml-5 space-y-3">
                {!editing ? (
                  <>
                    <InfoRow label="Nome" value={controls.displayName} />
                    <InfoRow label="Descrição" value={controls.shortDesc || "—"} />
                    <InfoRow label="Função" value={controls.role} />
                    <InfoRow label="Observações" value={controls.notes || "—"} />
                    <InfoRow label="Escopo" value={{ global: "Global", dm: "Somente DMs", topic: "Tópicos específicos", mixed: "Misto" }[controls.scopeType]} />
                    {(controls.scopeType === "topic" || controls.scopeType === "mixed") && (
                      <InfoRow label="Tópicos" value={controls.topicIds.length > 0 ? controls.topicIds.join(", ") : "—"} />
                    )}
                    <InfoRow label="DM" value={controls.dmEnabled ? "Habilitado" : "Desabilitado"} />
                    <InfoRow label="Grupo" value={controls.groupEnabled ? "Habilitado" : "Desabilitado"} />
                    <InfoRow label="Status Op." value={{ ativo: "Ativo", pausado: "Pausado", somente_leitura: "Somente leitura" }[controls.opStatus]} />
                    <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-[11px] font-mono text-primary/70 hover:text-primary transition-colors cursor-pointer mt-1">
                      <Pencil className="h-3 w-3" /> Editar configuração
                    </button>
                  </>
                ) : (
                  <>
                    <EditField label="Nome" value={controls.displayName} onChange={v => setControls(c => ({ ...c, displayName: v }))} />
                    <EditField label="Descrição curta" value={controls.shortDesc} onChange={v => setControls(c => ({ ...c, shortDesc: v }))} />
                    <EditField label="Função" value={controls.role} onChange={v => setControls(c => ({ ...c, role: v }))} />
                    <EditField label="Observações" value={controls.notes} onChange={v => setControls(c => ({ ...c, notes: v }))} textarea />

                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground/40 mb-1.5">Escopo de atuação</p>
                      <div className="flex flex-wrap gap-1.5">
                        {([["global", "Global"], ["dm", "Somente DMs"], ["topic", "Tópicos"], ["mixed", "Misto"]] as const).map(([val, lbl]) => (
                          <Chip key={val} selected={controls.scopeType === val} onClick={() => setControls(c => ({ ...c, scopeType: val }))}>{lbl}</Chip>
                        ))}
                      </div>
                    </div>

                    {(controls.scopeType === "topic" || controls.scopeType === "mixed") && (
                      <div>
                        <p className="text-[10px] font-mono text-muted-foreground/40 mb-1.5">IDs de tópicos</p>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {controls.topicIds.map(tid => (
                            <span key={tid} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[10px] font-mono text-primary">
                              {tid}
                              <button onClick={() => setControls(c => ({ ...c, topicIds: c.topicIds.filter(t => t !== tid) }))} className="hover:text-status-critical cursor-pointer">×</button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-1.5">
                          <input value={newTopicId} onChange={e => setNewTopicId(e.target.value)} placeholder="Topic ID"
                            onKeyDown={e => { if (e.key === "Enter" && newTopicId.trim()) { setControls(c => ({ ...c, topicIds: [...c.topicIds, newTopicId.trim()] })); setNewTopicId(""); } }}
                            className="flex-1 px-3 py-1.5 rounded-md border border-border/40 bg-muted/10 text-xs font-mono text-foreground/80 placeholder:text-muted-foreground/25 focus:outline-none focus:border-primary/40" />
                          <button onClick={() => { if (newTopicId.trim()) { setControls(c => ({ ...c, topicIds: [...c.topicIds, newTopicId.trim()] })); setNewTopicId(""); } }}
                            className="px-2.5 py-1.5 rounded-md border border-border/40 text-[10px] font-mono text-muted-foreground/50 hover:text-foreground/70 hover:border-border/60 transition-colors cursor-pointer">+</button>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={controls.dmEnabled} onChange={e => setControls(c => ({ ...c, dmEnabled: e.target.checked }))} className="rounded accent-primary" />
                        <span className="text-xs text-foreground/70">DMs</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={controls.groupEnabled} onChange={e => setControls(c => ({ ...c, groupEnabled: e.target.checked }))} className="rounded accent-primary" />
                        <span className="text-xs text-foreground/70">Grupos</span>
                      </label>
                    </div>

                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground/40 mb-1.5">Status operacional</p>
                      <div className="flex gap-1.5">
                        {([["ativo", "Ativo", "bg-status-online/15 text-status-online border-status-online/30"], ["pausado", "Pausado", "bg-status-warning/15 text-status-warning border-status-warning/30"], ["somente_leitura", "Somente leitura", "bg-muted text-muted-foreground border-border/40"]] as const).map(([val, lbl, cls]) => (
                          <Chip key={val} selected={controls.opStatus === val} onClick={() => setControls(c => ({ ...c, opStatus: val }))} activeClass={cls}>{lbl}</Chip>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button size="sm" onClick={handleSave} disabled={saving} className="flex-1">
                        {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                        {saving ? "Salvando…" : "Salvar"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving}>Cancelar</Button>
                    </div>
                  </>
                )}
              </div>
            </Sec>
          </TabsContent>

          {/* ═══════ TAB: Operação ═══════ */}
          <TabsContent value="operation" className="px-6 py-5 space-y-5 mt-0">
            <Sec icon={Activity} title="Atividade Atual">
              <InfoRow label="Sessões ativas" value={String(agent.sessions)} />
              <InfoRow label="Última atividade" value={agent.lastActivityLabel || agent.lastActivity} />
            </Sec>

            <Separator className="bg-border/30" />

            <Sec icon={Clock} title="Tarefa em Execução">
              {agent.currentTask ? (
                <>
                  <p className="text-sm text-foreground/80 ml-5">{agent.currentTask}</p>
                  {agent.currentTaskAge && <p className="text-[10px] font-mono text-muted-foreground/30 ml-5 mt-1">{agent.currentTaskAge}</p>}
                </>
              ) : (
                <p className="text-xs text-muted-foreground/40 italic ml-5">Nenhuma tarefa em execução</p>
              )}
            </Sec>

            <Separator className="bg-border/30" />

            <Sec icon={ListChecks} title={`Histórico${taskHistory.length > 0 ? ` (${taskHistory.length})` : ""}`}>
              {taskHistoryLoading ? (
                <div className="space-y-2 ml-5">{[1,2,3].map(i => <div key={i} className="h-8 rounded bg-muted/30 animate-pulse" />)}</div>
              ) : taskHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground/40 italic ml-5">Nenhuma tarefa registrada</p>
              ) : (
                <div className="ml-5 space-y-1.5">
                  {taskHistory.slice(0, taskVisible).map(task => (
                    <div key={task.id} className="flex items-start gap-2.5 rounded-md border border-border/20 bg-muted/10 px-3 py-2">
                      {task.status === "success" ? <CheckCircle2 className="h-3.5 w-3.5 text-status-online shrink-0 mt-0.5" /> : task.status === "error" ? <XCircle className="h-3.5 w-3.5 text-status-critical shrink-0 mt-0.5" /> : <Clock3 className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 mt-0.5" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-foreground/70 leading-relaxed truncate">{task.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-muted-foreground/30">{task.timestamp ? new Date(task.timestamp).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}</span>
                          {task.duration && <span className="text-[10px] font-mono text-muted-foreground/25">{task.duration}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {taskVisible < taskHistory.length && (
                    <button onClick={() => setTaskVisible(v => v + 10)} className="w-full py-2 rounded-md border border-dashed border-border/30 text-[11px] font-mono text-muted-foreground/50 hover:text-foreground/70 hover:border-border/50 transition-colors cursor-pointer">
                      Carregar mais ({taskHistory.length - taskVisible} restantes)
                    </button>
                  )}
                </div>
              )}
            </Sec>
          </TabsContent>

          {/* ═══════ TAB: Logs ═══════ */}
          <TabsContent value="logs" className="px-6 py-5 space-y-4 mt-0">
            <div className="flex gap-1.5">
              {(["all", "info", "warn", "error"] as const).map(level => (
                <button key={level} onClick={() => setLogFilter(level)}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase transition-colors cursor-pointer ${
                    logFilter === level
                      ? level === "error" ? "bg-status-critical/20 text-status-critical" : level === "warn" ? "bg-status-warning/20 text-status-warning" : "bg-primary/20 text-primary"
                      : "bg-muted/20 text-muted-foreground/50 hover:bg-muted/40"
                  }`}>
                  {level === "all" ? "Todos" : level}
                </button>
              ))}
            </div>

            {logsLoading && logs.length === 0 ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-4 w-full rounded bg-muted/30 animate-pulse" />)}</div>
            ) : logsError ? (
              <p className="text-xs text-muted-foreground/40 italic">Não foi possível conectar ao endpoint de logs</p>
            ) : logs.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/30 p-6 text-center">
                <Terminal className="h-6 w-6 text-muted-foreground/15 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground/40">Nenhuma atividade registrada</p>
              </div>
            ) : (() => {
              const filtered = logFilter === "all" ? logs : logs.filter(l => l.level === logFilter);
              return filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground/40 italic">Nenhum log "{logFilter}"</p>
              ) : (
                <div className="max-h-[400px] overflow-y-auto rounded-lg border border-border/30 bg-muted/5 p-3 space-y-1 scrollbar-thin">
                  {filtered.map((log, i) => (
                    <div key={i} className="flex gap-2 text-[11px] font-mono leading-relaxed">
                      <span className="text-muted-foreground/30 shrink-0 w-16 truncate">{log.ts ? new Date(log.ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"}</span>
                      <span className={`shrink-0 w-10 uppercase ${log.level === "error" ? "text-status-critical" : log.level === "warn" ? "text-status-warning" : "text-muted-foreground/50"}`}>{log.level}</span>
                      <span className="text-foreground/70 break-all">{log.message}</span>
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              );
            })()}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

// ════════════════════════════════════════════════════
// SUB-COMPONENTS
// ════════════════════════════════════════════════════

function Sec({ icon: Icon, title, children, badge }: { icon: React.ElementType; title: string; children: React.ReactNode; badge?: "live" | "fallback" }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-3.5 w-3.5 text-muted-foreground/40" />
        <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground/50">{title}</h4>
        {badge && (
          <span className={`text-[9px] font-mono px-1.5 py-0 rounded border ${badge === "live" ? "border-status-online/30 text-status-online" : "border-border/30 text-muted-foreground/30"}`}>
            {badge === "live" ? "API" : "LOCAL"}
          </span>
        )}
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
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

function EditField({ label, value, onChange, textarea }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean }) {
  const cls = "w-full px-3 py-1.5 rounded-md border border-border/40 bg-muted/10 text-xs text-foreground/80 placeholder:text-muted-foreground/25 focus:outline-none focus:border-primary/40";
  return (
    <div>
      <p className="text-[10px] font-mono text-muted-foreground/40 mb-1">{label}</p>
      {textarea ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={2} className={`${cls} resize-none`} /> : <input value={value} onChange={e => onChange(e.target.value)} className={cls} />}
    </div>
  );
}

function Chip({ selected, onClick, children, activeClass }: { selected: boolean; onClick: () => void; children: React.ReactNode; activeClass?: string }) {
  return (
    <button onClick={onClick} className={`px-2.5 py-1 rounded-md text-[10px] font-mono border transition-colors cursor-pointer ${selected ? activeClass || "bg-primary/15 text-primary border-primary/30" : "bg-muted/10 text-muted-foreground/50 border-border/30 hover:bg-muted/20"}`}>
      {children}
    </button>
  );
}
