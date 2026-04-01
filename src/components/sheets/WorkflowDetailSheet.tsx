import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Target, Timer, Bot, Play, Zap, Clock, Calendar, CheckCircle2, XCircle,
  Pause, Trash2, AlertTriangle, BarChart3, ArrowRight, Link2, Unlink,
  Activity, Loader2, Settings2, Workflow, Pencil, Check, X, History,
} from "lucide-react";
import { apiUrl, API_BASE_URL } from "@/domains/api";
import { toast } from "@/hooks/use-toast";
import type { CronJob, JobStatus } from "@/domains/cron/types";

/* ══════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════ */

type Trigger = "cron" | "agent" | "manual" | "event";
type Category = "sync" | "maintenance" | "report" | "automation";

interface MissionForSheet {
  id: string;
  name: string;
  description: string;
  trigger: Trigger;
  category: Category;
  cronMatch?: string;
  matched: boolean;
  enabled: boolean | null;
  lastRunAt: string | null;
  nextRunAt: string | null;
  lastRunOk: boolean | null;
  schedule: string | null;
  cronJob?: CronJob | null;
  isCustom: boolean;
}

interface WorkflowUpdate {
  name?: string;
  description?: string;
  cronMatch?: string;
}

interface Props {
  mission: MissionForSheet | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, updates: WorkflowUpdate) => void;
}

/* ══════════════════════════════════════════════
   Config maps
   ══════════════════════════════════════════════ */

const triggerConfig: Record<Trigger, { icon: React.ElementType; label: string; color: string }> = {
  cron: { icon: Timer, label: "Cron Job", color: "text-primary" },
  agent: { icon: Bot, label: "Agente Autônomo", color: "text-accent-foreground" },
  manual: { icon: Play, label: "Execução Manual", color: "text-status-online" },
  event: { icon: Zap, label: "Baseado em Evento", color: "text-status-warning" },
};

const categoryConfig: Record<Category, { label: string; color: string; bg: string }> = {
  sync: { label: "Sincronização", color: "text-primary", bg: "bg-primary/10 border-primary/20" },
  maintenance: { label: "Manutenção", color: "text-status-warning", bg: "bg-status-warning/10 border-status-warning/20" },
  report: { label: "Relatório", color: "text-accent-foreground", bg: "bg-accent/20 border-accent/30" },
  automation: { label: "Automação", color: "text-status-online", bg: "bg-status-online/10 border-status-online/20" },
};

const statusBadge: Record<JobStatus, { label: string; className: string }> = {
  healthy: { label: "Saudável", className: "bg-status-online/15 text-status-online border-status-online/30" },
  failed: { label: "Falha", className: "bg-status-critical/15 text-status-critical border-status-critical/30" },
  warning: { label: "Atenção", className: "bg-status-warning/15 text-status-warning border-status-warning/30" },
  disabled: { label: "Desativado", className: "bg-muted text-muted-foreground border-border/40" },
};

/* ══════════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════════ */

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  return `${Math.round(hrs / 24)}d atrás`;
}

function timeUntil(iso: string | null): string {
  if (!iso) return "—";
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return "atrasado";
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "em breve";
  if (mins < 60) return `em ${mins}min`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `em ${hrs}h`;
  return `em ${Math.round(hrs / 24)}d`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 60_000)}min`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

/* ══════════════════════════════════════════════
   Execution History (from /api/cron/runs)
   ══════════════════════════════════════════════ */

interface CronRunRaw {
  id: string;
  jobId: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  success: boolean;
  error: string | null;
}

async function fetchCronRuns(jobId: string): Promise<CronRunRaw[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/cron/runs?jobId=${encodeURIComponent(jobId)}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? json.slice(0, 10) : [];
  } catch {
    return [];
  }
}

function RunHistorySection({ cronJobId }: { cronJobId: string }) {
  const { data: runs, isLoading } = useQuery<CronRunRaw[]>({
    queryKey: ["cron-runs", cronJobId],
    queryFn: () => fetchCronRuns(cronJobId),
    staleTime: 30_000,
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <History className="h-3.5 w-3.5 text-muted-foreground/40" />
        <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground/50">Execuções Recentes</h4>
      </div>
      <div className="ml-5 space-y-1.5">
        {isLoading ? (
          <div className="flex items-center gap-2 py-3">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/30" />
            <span className="text-xs text-muted-foreground/40">Carregando histórico…</span>
          </div>
        ) : !runs || runs.length === 0 ? (
          <p className="text-xs text-muted-foreground/30 font-mono py-2">Nenhuma execução registrada</p>
        ) : (
          runs.map((run) => (
            <div key={run.id} className="flex items-center gap-3 py-1.5 group">
              {run.success ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-status-online/60 shrink-0" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-status-critical/60 shrink-0" />
              )}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-[10px] font-mono text-muted-foreground/50">
                  {formatDate(run.startedAt)} {formatTime(run.startedAt)}
                </span>
                <div className="w-px h-3 bg-border/20" />
                <span className="text-[10px] font-mono text-muted-foreground/40">
                  {formatDuration(run.durationMs)}
                </span>
              </div>
              {run.error && (
                <span className="text-[9px] font-mono text-status-critical/40 truncate max-w-[120px]" title={run.error}>
                  {run.error}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Inline editable field
   ══════════════════════════════════════════════ */

function EditableField({
  label,
  value,
  onSave,
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  onSave: (val: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

  if (!editing) {
    return (
      <div className="flex items-center gap-3 group/edit">
        <span className="text-xs text-muted-foreground/50 w-28 shrink-0">{label}</span>
        <span className={`text-sm text-foreground/80 truncate flex-1 ${mono ? "font-mono text-xs" : ""}`}>
          {value || <span className="text-muted-foreground/30 italic">vazio</span>}
        </span>
        <button
          onClick={() => setEditing(true)}
          className="opacity-0 group-hover/edit:opacity-100 transition-opacity p-1 rounded hover:bg-accent/20"
        >
          <Pencil className="h-3 w-3 text-muted-foreground/40" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground/50 w-28 shrink-0">{label}</span>
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        maxLength={200}
        className="h-7 text-xs flex-1"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") { onSave(draft.trim()); setEditing(false); }
          if (e.key === "Escape") { setDraft(value); setEditing(false); }
        }}
      />
      <button onClick={() => { onSave(draft.trim()); setEditing(false); }} className="p-1 rounded hover:bg-status-online/10">
        <Check className="h-3.5 w-3.5 text-status-online" />
      </button>
      <button onClick={() => { setDraft(value); setEditing(false); }} className="p-1 rounded hover:bg-status-critical/10">
        <X className="h-3.5 w-3.5 text-status-critical/60" />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════ */

export function WorkflowDetailSheet({ mission, open, onOpenChange, onDelete, onUpdate }: Props) {
  const [running, setRunning] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!mission) return null;

  const trig = triggerConfig[mission.trigger];
  const cat = categoryConfig[mission.category];
  const TriggerIcon = trig.icon;
  const cron = mission.cronJob;

  const handleRunNow = async () => {
    if (!cron) return;
    setRunning(true);
    try {
      const res = await fetch(apiUrl("/cron/run"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cron.id }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast({ title: `"${mission.name}" executado com sucesso` });
    } catch {
      toast({ title: "Erro ao executar", variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  const handleDelete = () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    onDelete?.(mission.id);
    onOpenChange(false);
    setConfirmDelete(false);
    toast({ title: `Workflow "${mission.name}" removido` });
  };

  const handleFieldSave = (field: keyof WorkflowUpdate, value: string) => {
    onUpdate?.(mission.id, { [field]: value });
    toast({ title: "Workflow atualizado" });
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); setConfirmDelete(false); }}>
      <SheetContent className="bg-card border-border overflow-y-auto p-0 sm:max-w-lg w-full">
        {/* ── Hero header ── */}
        <div className="relative px-6 pt-6 pb-5 border-b border-border/40">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/60 via-primary/30 to-transparent" />
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-surface-2 border border-border/50 flex items-center justify-center shrink-0 shadow-sm">
              <Target className="h-5 w-5 text-foreground/60" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-foreground leading-tight">{mission.name}</h2>
              <p className="text-xs text-muted-foreground/60 mt-1 leading-relaxed">{mission.description}</p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Badge variant="outline" className={`text-[10px] font-mono px-2.5 py-0.5 gap-1.5 border ${cat.bg} ${cat.color}`}>
                  {cat.label}
                </Badge>
                {mission.matched ? (
                  <Badge variant="outline" className="text-[10px] font-mono px-2.5 py-0.5 gap-1 border-primary/20 text-primary/70 bg-primary/5">
                    <Link2 className="h-3 w-3" />Conectado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] font-mono px-2.5 py-0.5 gap-1 border-border/20 text-muted-foreground/30">
                    <Unlink className="h-3 w-3" />Desconectado
                  </Badge>
                )}
                {mission.isCustom && (
                  <Badge variant="outline" className="text-[10px] font-mono px-2.5 py-0.5 border-border/30 text-muted-foreground/40">
                    Customizado
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* ── Flow visualization (n8n style) ── */}
          <div className="rounded-xl border border-border/40 bg-muted/[0.03] p-4">
            <h4 className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/50 mb-4">
              Fluxo de Execução
            </h4>
            <div className="flex items-center gap-0">
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div className={`w-11 h-11 rounded-xl border-2 border-dashed border-border/50 flex items-center justify-center ${trig.color} bg-background`}>
                  <TriggerIcon className="h-5 w-5" />
                </div>
                <span className="text-[9px] font-mono text-muted-foreground/40">{trig.label}</span>
              </div>
              <div className="flex-1 flex items-center mx-1.5 -mt-4">
                <div className="flex-1 h-px bg-border/40" />
                <ArrowRight className="h-3 w-3 text-border/60 shrink-0 -mx-0.5" />
              </div>
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div className="w-11 h-11 rounded-xl border border-border/50 flex items-center justify-center bg-background">
                  <Workflow className="h-5 w-5 text-foreground/50" />
                </div>
                <span className="text-[9px] font-mono text-muted-foreground/40">Processar</span>
              </div>
              <div className="flex-1 flex items-center mx-1.5 -mt-4">
                <div className="flex-1 h-px bg-border/40" />
                <ArrowRight className="h-3 w-3 text-border/60 shrink-0 -mx-0.5" />
              </div>
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div className={`w-11 h-11 rounded-xl border border-border/50 flex items-center justify-center bg-background ${
                  mission.lastRunOk === true ? "border-status-online/30" :
                  mission.lastRunOk === false ? "border-status-critical/30" : ""
                }`}>
                  {mission.lastRunOk === true ? <CheckCircle2 className="h-5 w-5 text-status-online/70" /> :
                   mission.lastRunOk === false ? <XCircle className="h-5 w-5 text-status-critical/70" /> :
                   <Activity className="h-5 w-5 text-muted-foreground/30" />}
                </div>
                <span className="text-[9px] font-mono text-muted-foreground/40">
                  {mission.lastRunOk === true ? "Sucesso" : mission.lastRunOk === false ? "Falha" : "Resultado"}
                </span>
              </div>
            </div>
          </div>

          {/* ── Configuration panel — editable for custom ── */}
          <Section title="Configuração" icon={Settings2}>
            {mission.isCustom ? (
              <>
                <EditableField label="Nome" value={mission.name} onSave={(v) => handleFieldSave("name", v)} placeholder="Nome do workflow" />
                <EditableField label="Descrição" value={mission.description} onSave={(v) => handleFieldSave("description", v)} placeholder="Descrição" />
                <EditableField label="Cron Match" value={mission.cronMatch ?? ""} onSave={(v) => handleFieldSave("cronMatch", v)} placeholder="Ex: sync-leads" mono />
                <Row label="ID" value={mission.id} mono />
                <Row label="Trigger" value={trig.label} />
                <Row label="Categoria" value={cat.label} />
              </>
            ) : (
              <>
                <Row label="ID" value={mission.id} mono />
                <Row label="Trigger" value={trig.label} />
                <Row label="Categoria" value={cat.label} />
                {mission.cronMatch && <Row label="Cron Match" value={mission.cronMatch} mono />}
              </>
            )}
          </Section>

          {/* ── Live data panel (only if matched) ── */}
          {mission.matched && cron && (
            <>
              <Separator className="bg-border/30" />

              <Section title="Dados em Tempo Real" icon={Activity}>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs text-muted-foreground/50 w-28 shrink-0">Status</span>
                  <Badge variant="outline" className={`text-[10px] font-mono px-2.5 py-0 ${statusBadge[cron.status].className}`}>
                    {statusBadge[cron.status].label}
                  </Badge>
                </div>
                <Row label="Habilitado" value={cron.enabled ? "Sim" : "Não"} />
                <Row label="Schedule" value={cron.schedule} mono />
              </Section>

              <Separator className="bg-border/30" />

              <Section title="Última Execução" icon={Clock}>
                <Row label="Horário" value={cron.lastRun} />
                <Row label="Tempo atrás" value={cron.lastRunAgo} />
                <Row label="Duração" value={cron.lastDuration} />
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground/50 w-28 shrink-0">Resultado</span>
                  {cron.lastResult === "success" ? (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-status-online" />
                      <span className="text-xs font-mono text-status-online">OK</span>
                    </div>
                  ) : cron.lastResult === "failure" ? (
                    <div className="flex items-center gap-1.5">
                      <XCircle className="h-3.5 w-3.5 text-status-critical" />
                      <span className="text-xs font-mono text-status-critical">FALHA</span>
                    </div>
                  ) : (
                    <span className="text-xs font-mono text-muted-foreground/30">—</span>
                  )}
                </div>
              </Section>

              {cron.error && (
                <div className="rounded-lg border border-status-critical/20 bg-status-critical/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-status-critical/60" />
                    <h4 className="text-xs font-mono uppercase tracking-wider text-status-critical/50">Erro</h4>
                  </div>
                  <p className="text-xs font-mono text-status-critical/70 whitespace-pre-wrap break-words leading-relaxed">{cron.error}</p>
                </div>
              )}

              <Separator className="bg-border/30" />

              <Section title="Próxima Execução" icon={Calendar}>
                <Row label="Horário" value={cron.nextRun} />
                <Row label="Countdown" value={cron.nextRunIn} />
              </Section>

              <Separator className="bg-border/30" />

              <Section title="Estatísticas" icon={BarChart3}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border/30 bg-muted/20 p-3 text-center">
                    <p className="text-lg font-bold text-status-online">{cron.consecutiveSuccess}</p>
                    <p className="text-[10px] font-mono text-muted-foreground/40 mt-0.5">Sucessos</p>
                  </div>
                  <div className="rounded-lg border border-border/30 bg-muted/20 p-3 text-center">
                    <p className="text-lg font-bold text-status-critical">{cron.consecutiveFails}</p>
                    <p className="text-[10px] font-mono text-muted-foreground/40 mt-0.5">Falhas</p>
                  </div>
                </div>
              </Section>

              <Separator className="bg-border/30" />

              {/* ── Execution History ── */}
              <RunHistorySection cronJobId={cron.id} />

              <Separator className="bg-border/30" />

              {/* Run now */}
              <Button onClick={handleRunNow} disabled={running || !cron.enabled} className="w-full" variant="outline">
                {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                {running ? "Executando…" : "Executar agora"}
              </Button>
            </>
          )}

          {/* ── Not connected state ── */}
          {!mission.matched && (
            <div className="rounded-lg border border-border/30 bg-muted/[0.03] p-6 text-center">
              <Unlink className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground/50 font-medium">Sem conexão com backend</p>
              <p className="text-[10px] text-muted-foreground/30 mt-1 font-mono">
                {mission.cronMatch
                  ? `Nenhum cron job corresponde a "${mission.cronMatch}"`
                  : "Este workflow não possui match configurado"}
              </p>
            </div>
          )}

          {/* ── Delete (custom only) ── */}
          {mission.isCustom && (
            <>
              <Separator className="bg-border/30" />
              <div className="pt-1">
                <Button
                  variant={confirmDelete ? "destructive" : "outline"}
                  size="sm"
                  className="w-full gap-2"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  {confirmDelete ? "Confirmar exclusão" : "Excluir workflow"}
                </Button>
                {confirmDelete && (
                  <p className="text-[10px] text-status-critical/50 text-center mt-2 font-mono">
                    Clique novamente para confirmar a exclusão permanente
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ── Reusable sub-components ── */

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-3.5 w-3.5 text-muted-foreground/40" />
        <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground/50">{title}</h4>
      </div>
      <div className="space-y-2.5 ml-5">{children}</div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground/50 w-28 shrink-0">{label}</span>
      <span className={`text-sm text-foreground/80 truncate ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}

export type { MissionForSheet, WorkflowUpdate };
