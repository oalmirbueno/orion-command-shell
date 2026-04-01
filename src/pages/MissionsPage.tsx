import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import {
  Target, RefreshCw, Clock, CheckCircle2, XCircle, Pause, Play,
  Zap, Timer, Bot, Calendar, AlertCircle, ChevronRight, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { WorkflowDetailSheet } from "@/components/sheets/WorkflowDetailSheet";
import type { MissionForSheet } from "@/components/sheets/WorkflowDetailSheet";
import { API_BASE_URL } from "@/domains/api";
import type { CronJob, JobStatus } from "@/domains/cron/types";

/* ══════════════════════════════════════════════
   Workflow definitions
   ══════════════════════════════════════════════ */

interface WorkflowDef {
  id: string;
  name: string;
  description: string;
  trigger: "cron" | "agent" | "manual" | "event";
  cronMatch?: string;
  category: "sync" | "maintenance" | "report" | "automation";
}

const BUILTIN_WORKFLOWS: WorkflowDef[] = [
  { id: "wf-sync-leads", name: "Sync de Leads", description: "Sincroniza leads do CRM com o banco local", trigger: "cron", cronMatch: "sync-leads", category: "sync" },
  { id: "wf-health-check", name: "Health Check", description: "Verificação periódica de saúde dos subsistemas", trigger: "cron", cronMatch: "health-check", category: "maintenance" },
  { id: "wf-daily-report", name: "Relatório Diário", description: "Gera e distribui relatório operacional do dia", trigger: "cron", cronMatch: "daily-report", category: "report" },
  { id: "wf-cache-cleanup", name: "Limpeza de Cache", description: "Remove entradas expiradas do cache distribuído", trigger: "cron", cronMatch: "cache-cleanup", category: "maintenance" },
  { id: "wf-agent-orchestration", name: "Orquestração de Agentes", description: "Coordena ciclos de trabalho dos agentes autônomos", trigger: "agent", category: "automation" },
  { id: "wf-backup-db", name: "Backup do Banco", description: "Snapshot incremental dos dados operacionais", trigger: "cron", cronMatch: "backup", category: "maintenance" },
];

const LS_KEY = "orion-custom-workflows";

function loadCustomWorkflows(): WorkflowDef[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCustomWorkflows(wfs: WorkflowDef[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(wfs));
}

/* ══════════════════════════════════════════════
   Cron API shape
   ══════════════════════════════════════════════ */

interface CronJobRaw {
  id: string;
  name: string;
  enabled: boolean;
  schedule?: { expr?: string; everyMs?: number };
  scheduleDisplay?: string;
  lastRun?: string | null;
  nextRun?: string | null;
  state?: {
    lastRunAtMs?: number;
    nextRunAtMs?: number;
    lastRunStatus?: string | null;
    lastDurationMs?: number | null;
    consecutiveErrors?: number;
  };
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  lastRunSuccess?: boolean | null;
  consecutiveFailures?: number;
  totalRuns?: number;
  description?: string;
}

async function fetchCronRaw(): Promise<CronJobRaw[]> {
  const res = await fetch(`${API_BASE_URL}/cron`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return Array.isArray(json) ? json : [];
}

/* ══════════════════════════════════════════════
   Normalization helpers
   ══════════════════════════════════════════════ */

function resolveField(raw: CronJobRaw, rootField: string | null | undefined, stateMs: number | undefined): string | null {
  if (rootField) return rootField;
  if (stateMs) return new Date(stateMs).toISOString();
  return null;
}

function rawToCronJob(raw: CronJobRaw): CronJob {
  const lastRunAt = raw.lastRun ?? raw.lastRunAt ?? (raw.state?.lastRunAtMs ? new Date(raw.state.lastRunAtMs).toISOString() : null);
  const nextRunAt = raw.nextRun ?? raw.nextRunAt ?? (raw.state?.nextRunAtMs ? new Date(raw.state.nextRunAtMs).toISOString() : null);
  const lastRunOk = raw.lastRunSuccess ?? (raw.state?.lastRunStatus === "ok" ? true : raw.state?.lastRunStatus ? false : null);
  const consecutiveErrors = raw.state?.consecutiveErrors ?? raw.consecutiveFailures ?? 0;
  const lastDurationMs = raw.state?.lastDurationMs ?? null;

  let scheduleStr = "—";
  if (raw.schedule?.expr) scheduleStr = raw.schedule.expr;
  else if (raw.schedule?.everyMs) scheduleStr = `every ${Math.round(raw.schedule.everyMs / 60_000)}min`;
  else if (raw.scheduleDisplay) scheduleStr = raw.scheduleDisplay;

  const enabled = raw.enabled;
  let status: JobStatus = "healthy";
  if (!enabled) status = "disabled";
  else if (consecutiveErrors > 0) status = "failed";
  else if (lastRunOk === false) status = "warning";

  return {
    id: raw.id,
    name: raw.name,
    schedule: scheduleStr,
    scheduleHuman: scheduleStr,
    enabled,
    status,
    lastRun: lastRunAt ? new Date(lastRunAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—",
    lastRunAgo: timeAgo(lastRunAt),
    lastDuration: lastDurationMs != null ? (lastDurationMs < 1000 ? `${lastDurationMs}ms` : `${(lastDurationMs / 1000).toFixed(1)}s`) : "—",
    lastResult: lastRunOk === true ? "success" : lastRunOk === false ? "failure" : "—",
    nextRun: nextRunAt ? new Date(nextRunAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—",
    nextRunIn: timeUntil(nextRunAt),
    consecutiveSuccess: consecutiveErrors === 0 ? 1 : 0,
    consecutiveFails: consecutiveErrors,
    error: lastRunOk === false ? "Última execução falhou" : undefined,
  };
}

/* ══════════════════════════════════════════════
   Merged view model
   ══════════════════════════════════════════════ */

interface MissionCard {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowDef["trigger"];
  category: WorkflowDef["category"];
  matched: boolean;
  enabled: boolean | null;
  lastRunAt: string | null;
  nextRunAt: string | null;
  lastRunOk: boolean | null;
  schedule: string | null;
  cronRaw?: CronJobRaw;
}

function matchCron(wf: WorkflowDef, cronJobs: CronJobRaw[]): CronJobRaw | undefined {
  if (!wf.cronMatch) return undefined;
  const key = wf.cronMatch.toLowerCase();
  return cronJobs.find(
    (c) => c.id?.toLowerCase().includes(key) || c.name?.toLowerCase().includes(key)
  );
}

function buildMissions(workflows: WorkflowDef[], cronJobs: CronJobRaw[]): MissionCard[] {
  return workflows.map((wf) => {
    const raw = matchCron(wf, cronJobs);
    if (raw) {
      const lastRunAt = raw.lastRun ?? raw.lastRunAt ?? (raw.state?.lastRunAtMs ? new Date(raw.state.lastRunAtMs).toISOString() : null);
      const nextRunAt = raw.nextRun ?? raw.nextRunAt ?? (raw.state?.nextRunAtMs ? new Date(raw.state.nextRunAtMs).toISOString() : null);
      const lastRunOk = raw.lastRunSuccess ?? (raw.state?.lastRunStatus === "ok" ? true : raw.state?.lastRunStatus ? false : null);

      let schedule = "—";
      if (raw.schedule?.expr) schedule = raw.schedule.expr;
      else if (raw.schedule?.everyMs) schedule = `every ${Math.round(raw.schedule.everyMs / 60_000)}min`;
      else if (raw.scheduleDisplay) schedule = raw.scheduleDisplay;

      return {
        id: wf.id, name: wf.name, description: wf.description, trigger: wf.trigger, category: wf.category,
        matched: true, enabled: raw.enabled, lastRunAt, nextRunAt, lastRunOk, schedule, cronRaw: raw,
      };
    }
    return {
      id: wf.id, name: wf.name, description: wf.description, trigger: wf.trigger, category: wf.category,
      matched: false, enabled: null, lastRunAt: null, nextRunAt: null, lastRunOk: null, schedule: null,
    };
  });
}

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

const triggerIcons: Record<WorkflowDef["trigger"], React.ElementType> = { cron: Timer, agent: Bot, manual: Play, event: Zap };
const triggerLabels: Record<WorkflowDef["trigger"], string> = { cron: "Cron", agent: "Agente", manual: "Manual", event: "Evento" };
const categoryLabels: Record<WorkflowDef["category"], string> = { sync: "Sincronização", maintenance: "Manutenção", report: "Relatório", automation: "Automação" };

/* ══════════════════════════════════════════════
   Add Workflow Dialog
   ══════════════════════════════════════════════ */

function AddWorkflowDialog({ onAdd }: { onAdd: (wf: WorkflowDef) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState<WorkflowDef["trigger"]>("cron");
  const [cronMatch, setCronMatch] = useState("");
  const [category, setCategory] = useState<WorkflowDef["category"]>("automation");

  const reset = () => { setName(""); setDescription(""); setTrigger("cron"); setCronMatch(""); setCategory("automation"); };

  const handleSubmit = () => {
    if (!name.trim()) return;
    const wf: WorkflowDef = {
      id: `wf-custom-${Date.now()}`,
      name: name.trim().slice(0, 100),
      description: description.trim().slice(0, 200),
      trigger,
      category,
      ...(cronMatch.trim() ? { cronMatch: cronMatch.trim().slice(0, 100) } : {}),
    };
    onAdd(wf);
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Workflow
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Novo Workflow</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Sync de Clientes" maxLength={100} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Descrição</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="O que esse workflow faz" maxLength={200} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Trigger</Label>
              <Select value={trigger} onValueChange={(v) => setTrigger(v as WorkflowDef["trigger"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cron">Cron</SelectItem>
                  <SelectItem value="agent">Agente</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="event">Evento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Categoria</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as WorkflowDef["category"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sync">Sincronização</SelectItem>
                  <SelectItem value="maintenance">Manutenção</SelectItem>
                  <SelectItem value="report">Relatório</SelectItem>
                  <SelectItem value="automation">Automação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Match com Cron Job (nome ou ID parcial)</Label>
            <Input value={cronMatch} onChange={(e) => setCronMatch(e.target.value)} placeholder="Ex: sync-leads, backup" maxLength={100} />
            <p className="text-[10px] text-muted-foreground/40">Se preenchido, conecta este workflow a um cron job real</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button size="sm" onClick={handleSubmit} disabled={!name.trim()}>Criar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════════════════════════════════
   Sub-components
   ══════════════════════════════════════════════ */

function SummaryCards({ missions }: { missions: MissionCard[] }) {
  const total = missions.length;
  const live = missions.filter((m) => m.matched).length;
  const active = missions.filter((m) => m.enabled === true).length;
  const failed = missions.filter((m) => m.lastRunOk === false).length;

  const cards = [
    { label: "Total", value: total, accent: "text-foreground", bg: "bg-surface-2 border-border/40" },
    { label: "Conectados", value: live, accent: live > 0 ? "text-primary" : "text-muted-foreground/40", bg: live > 0 ? "bg-primary/5 border-primary/20" : "bg-surface-2 border-border/40" },
    { label: "Ativos", value: active, accent: active > 0 ? "text-status-online" : "text-muted-foreground/40", bg: active > 0 ? "bg-status-online/[0.06] border-status-online/20" : "bg-surface-2 border-border/40" },
    { label: "Com falha", value: failed, accent: failed > 0 ? "text-status-critical" : "text-muted-foreground/40", bg: failed > 0 ? "bg-status-critical/[0.06] border-status-critical/20" : "bg-surface-2 border-border/40" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div key={c.label} className={`rounded-lg border px-4 py-3.5 ${c.bg}`}>
          <p className={`text-2xl font-bold leading-none ${c.accent}`}>{c.value}</p>
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/50 mt-1 block">{c.label}</span>
        </div>
      ))}
    </div>
  );
}

function MissionRow({ mission, onClick }: { mission: MissionCard; onClick: () => void }) {
  const TriggerIcon = triggerIcons[mission.trigger];

  const statusColor = mission.matched
    ? mission.enabled
      ? mission.lastRunOk === false ? "border-l-status-critical" : "border-l-status-online"
      : "border-l-muted-foreground/30"
    : "border-l-border";

  const statusBg = mission.matched && mission.lastRunOk === false ? "bg-status-critical/[0.03]" : "";

  return (
    <div
      onClick={onClick}
      className={`rounded-lg border border-border/40 border-l-[3px] ${statusColor} ${statusBg} hover:bg-accent/20 transition-all cursor-pointer group`}
    >
      <div className="px-5 py-4">
        <div className="flex items-start justify-between mb-2.5">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-lg bg-surface-2 border border-border/40 flex items-center justify-center shrink-0 mt-0.5">
              <Target className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground leading-snug">{mission.name}</h3>
              <p className="text-xs text-foreground/40 leading-relaxed mt-1">{mission.description}</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/10 group-hover:text-muted-foreground/40 transition-colors shrink-0 mt-2" />
        </div>

        <div className="flex items-center gap-2.5 ml-12 flex-wrap">
          <Badge variant="outline" className="text-[10px] font-mono px-2 py-0 gap-1 border-border/30 text-muted-foreground/60">
            <TriggerIcon className="h-3 w-3" />{triggerLabels[mission.trigger]}
          </Badge>
          <Badge variant="outline" className="text-[10px] font-mono px-2 py-0 border-border/30 text-muted-foreground/50">
            {categoryLabels[mission.category]}
          </Badge>
          {mission.matched ? (
            <Badge variant="outline" className="text-[10px] font-mono px-2 py-0 gap-1 border-primary/20 text-primary/70 bg-primary/5">
              <Zap className="h-3 w-3" />Live
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] font-mono px-2 py-0 border-border/20 text-muted-foreground/30">Estático</Badge>
          )}
          {mission.enabled === true && (
            <Badge variant="outline" className="text-[10px] font-mono px-2 py-0 gap-1 border-status-online/20 text-status-online/70"><Play className="h-3 w-3" /> Ativo</Badge>
          )}
          {mission.enabled === false && (
            <Badge variant="outline" className="text-[10px] font-mono px-2 py-0 gap-1 border-muted-foreground/20 text-muted-foreground/40"><Pause className="h-3 w-3" /> Pausado</Badge>
          )}
          {mission.lastRunOk === true && (
            <div className="flex items-center gap-1 text-status-online/60"><CheckCircle2 className="h-3 w-3" /><span className="text-[10px] font-mono">OK</span></div>
          )}
          {mission.lastRunOk === false && (
            <div className="flex items-center gap-1 text-status-critical/70"><XCircle className="h-3 w-3" /><span className="text-[10px] font-mono">Falha</span></div>
          )}
        </div>

        {mission.matched && (
          <div className="flex items-center gap-4 ml-12 mt-2.5 text-xs font-mono text-muted-foreground/40">
            {mission.lastRunAt && (
              <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" /><span>{timeAgo(mission.lastRunAt)}</span></div>
            )}
            {mission.nextRunAt && (
              <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /><span>{timeUntil(mission.nextRunAt)}</span></div>
            )}
            {mission.schedule && (<><div className="w-px h-3 bg-border/20" /><span>{mission.schedule}</span></>)}
          </div>
        )}
      </div>
    </div>
  );
}

function MissionsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[68px] rounded-lg" />)}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[100px] rounded-lg" />)}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Page
   ══════════════════════════════════════════════ */

const MissionsPage = () => {
  const queryClient = useQueryClient();
  const [customWorkflows, setCustomWorkflows] = useState<WorkflowDef[]>(loadCustomWorkflows);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedCronJob, setSelectedCronJob] = useState<CronJob | null>(null);

  const { data: cronJobs, isLoading, isError, error } = useQuery<CronJobRaw[]>({
    queryKey: ["missions-cron"],
    queryFn: fetchCronRaw,
    refetchInterval: 30_000,
    placeholderData: (prev) => prev,
  });

  const allWorkflows = useMemo(() => [...BUILTIN_WORKFLOWS, ...customWorkflows], [customWorkflows]);
  const missions = useMemo(() => buildMissions(allWorkflows, cronJobs ?? []), [allWorkflows, cronJobs]);

  const handleRefresh = () => queryClient.invalidateQueries({ queryKey: ["missions-cron"] });

  const handleAddWorkflow = useCallback((wf: WorkflowDef) => {
    setCustomWorkflows((prev) => {
      const next = [...prev, wf];
      saveCustomWorkflows(next);
      return next;
    });
  }, []);

  const handleMissionClick = useCallback((mission: MissionCard) => {
    if (mission.matched && mission.cronRaw) {
      setSelectedCronJob(rawToCronJob(mission.cronRaw));
      setSheetOpen(true);
    }
  }, []);

  return (
    <OrionLayout title="Missões">
      <div className="space-y-8">
        <OrionBreadcrumb items={["Mission Control", "Missões"]} />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Missões</h1>
            <p className="text-sm text-muted-foreground/60 mt-1">Workflows operacionais conectados ao backend real</p>
          </div>
          <div className="flex items-center gap-2">
            <AddWorkflowDialog onAdd={handleAddWorkflow} />
            <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
              <RefreshCw className="h-4 w-4" />Atualizar
            </Button>
          </div>
        </div>

        {isLoading && !cronJobs ? (
          <MissionsSkeleton />
        ) : isError ? (
          <div className="rounded-lg border border-border p-12 text-center">
            <AlertCircle className="h-8 w-8 text-status-critical mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground/70">Falha ao carregar dados do backend</p>
            <p className="text-xs text-muted-foreground/50 mt-1">{(error as Error)?.message}</p>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-4">Tentar novamente</Button>
          </div>
        ) : (
          <>
            <SummaryCards missions={missions} />
            <div>
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">Workflows</h2>
                <div className="flex-1 h-px bg-border/40" />
                <span className="text-xs font-mono text-muted-foreground/40">
                  {missions.filter((m) => m.matched).length}/{missions.length} conectados
                </span>
              </div>
              <div className="space-y-2.5">
                {missions.map((m) => (
                  <MissionRow key={m.id} mission={m} onClick={() => handleMissionClick(m)} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <CronDetailSheet job={selectedCronJob} open={sheetOpen} onOpenChange={setSheetOpen} />
    </OrionLayout>
  );
};

export default MissionsPage;
