import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import {
  Target,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Pause,
  Play,
  Zap,
  Timer,
  GitBranch,
  Bot,
  Calendar,
  Inbox,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { API_BASE_URL } from "@/domains/api";

/* ══════════════════════════════════════════════
   Static workflow definitions
   ══════════════════════════════════════════════ */

interface WorkflowDef {
  id: string;
  name: string;
  description: string;
  trigger: "cron" | "agent" | "manual" | "event";
  /** cron job name/id to match against real data */
  cronMatch?: string;
  category: "sync" | "maintenance" | "report" | "automation";
}

const WORKFLOWS: WorkflowDef[] = [
  {
    id: "wf-sync-leads",
    name: "Sync de Leads",
    description: "Sincroniza leads do CRM com o banco local",
    trigger: "cron",
    cronMatch: "sync-leads",
    category: "sync",
  },
  {
    id: "wf-health-check",
    name: "Health Check",
    description: "Verificação periódica de saúde dos subsistemas",
    trigger: "cron",
    cronMatch: "health-check",
    category: "maintenance",
  },
  {
    id: "wf-daily-report",
    name: "Relatório Diário",
    description: "Gera e distribui relatório operacional do dia",
    trigger: "cron",
    cronMatch: "daily-report",
    category: "report",
  },
  {
    id: "wf-cache-cleanup",
    name: "Limpeza de Cache",
    description: "Remove entradas expiradas do cache distribuído",
    trigger: "cron",
    cronMatch: "cache-cleanup",
    category: "maintenance",
  },
  {
    id: "wf-agent-orchestration",
    name: "Orquestração de Agentes",
    description: "Coordena ciclos de trabalho dos agentes autônomos",
    trigger: "agent",
    category: "automation",
  },
  {
    id: "wf-backup-db",
    name: "Backup do Banco",
    description: "Snapshot incremental dos dados operacionais",
    trigger: "cron",
    cronMatch: "backup",
    category: "maintenance",
  },
];

/* ══════════════════════════════════════════════
   Cron API shape (minimal — same as /api/cron)
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
  // legacy flat fields
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  lastRunSuccess?: boolean | null;
  consecutiveFailures?: number;
}

interface CronLive {
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  lastRunOk: boolean | null;
  schedule: string;
}

function normalizeCron(raw: CronJobRaw): CronLive {
  const lastRunAt =
    raw.lastRun ??
    raw.lastRunAt ??
    (raw.state?.lastRunAtMs ? new Date(raw.state.lastRunAtMs).toISOString() : null);

  const nextRunAt =
    raw.nextRun ??
    raw.nextRunAt ??
    (raw.state?.nextRunAtMs ? new Date(raw.state.nextRunAtMs).toISOString() : null);

  const lastRunOk =
    raw.lastRunSuccess ??
    (raw.state?.lastRunStatus === "ok" ? true : raw.state?.lastRunStatus ? false : null);

  let schedule = "—";
  if (raw.schedule?.expr) schedule = raw.schedule.expr;
  else if (raw.schedule?.everyMs) schedule = `every ${Math.round(raw.schedule.everyMs / 60_000)}min`;
  else if (raw.scheduleDisplay) schedule = raw.scheduleDisplay;

  return { enabled: raw.enabled, lastRunAt, nextRunAt, lastRunOk, schedule };
}

/* ══════════════════════════════════════════════
   Fetcher
   ══════════════════════════════════════════════ */

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
}

function matchCron(wf: WorkflowDef, cronJobs: CronJobRaw[]): CronJobRaw | undefined {
  if (!wf.cronMatch) return undefined;
  const key = wf.cronMatch.toLowerCase();
  return cronJobs.find(
    (c) =>
      c.id?.toLowerCase().includes(key) ||
      c.name?.toLowerCase().includes(key)
  );
}

function buildMissions(workflows: WorkflowDef[], cronJobs: CronJobRaw[]): MissionCard[] {
  return workflows.map((wf) => {
    const raw = matchCron(wf, cronJobs);
    if (raw) {
      const live = normalizeCron(raw);
      return {
        id: wf.id,
        name: wf.name,
        description: wf.description,
        trigger: wf.trigger,
        category: wf.category,
        matched: true,
        enabled: live.enabled,
        lastRunAt: live.lastRunAt,
        nextRunAt: live.nextRunAt,
        lastRunOk: live.lastRunOk,
        schedule: live.schedule,
      };
    }
    return {
      id: wf.id,
      name: wf.name,
      description: wf.description,
      trigger: wf.trigger,
      category: wf.category,
      matched: false,
      enabled: null,
      lastRunAt: null,
      nextRunAt: null,
      lastRunOk: null,
      schedule: null,
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

const triggerIcons: Record<WorkflowDef["trigger"], React.ElementType> = {
  cron: Timer,
  agent: Bot,
  manual: Play,
  event: Zap,
};

const triggerLabels: Record<WorkflowDef["trigger"], string> = {
  cron: "Cron",
  agent: "Agente",
  manual: "Manual",
  event: "Evento",
};

const categoryLabels: Record<WorkflowDef["category"], string> = {
  sync: "Sincronização",
  maintenance: "Manutenção",
  report: "Relatório",
  automation: "Automação",
};

/* ══════════════════════════════════════════════
   Components
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
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/50 mt-1 block">
            {c.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function MissionRow({ mission }: { mission: MissionCard }) {
  const TriggerIcon = triggerIcons[mission.trigger];

  const statusColor = mission.matched
    ? mission.enabled
      ? mission.lastRunOk === false
        ? "border-l-status-critical"
        : "border-l-status-online"
      : "border-l-muted-foreground/30"
    : "border-l-border";

  const statusBg = mission.matched
    ? mission.lastRunOk === false
      ? "bg-status-critical/[0.03]"
      : ""
    : "bg-muted/[0.03]";

  return (
    <div className={`rounded-lg border border-border/40 border-l-[3px] ${statusColor} ${statusBg} hover:bg-accent/20 transition-all cursor-pointer group`}>
      <div className="px-5 py-4">
        {/* Top row */}
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

        {/* Meta row */}
        <div className="flex items-center gap-2.5 ml-12 flex-wrap">
          {/* Trigger badge */}
          <Badge variant="outline" className="text-[10px] font-mono px-2 py-0 gap-1 border-border/30 text-muted-foreground/60">
            <TriggerIcon className="h-3 w-3" />
            {triggerLabels[mission.trigger]}
          </Badge>

          {/* Category */}
          <Badge variant="outline" className="text-[10px] font-mono px-2 py-0 border-border/30 text-muted-foreground/50">
            {categoryLabels[mission.category]}
          </Badge>

          {/* Connection status */}
          {mission.matched ? (
            <Badge variant="outline" className="text-[10px] font-mono px-2 py-0 gap-1 border-primary/20 text-primary/70 bg-primary/5">
              <Zap className="h-3 w-3" />
              Live
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] font-mono px-2 py-0 border-border/20 text-muted-foreground/30">
              Estático
            </Badge>
          )}

          {/* Enabled / disabled */}
          {mission.enabled === true && (
            <Badge variant="outline" className="text-[10px] font-mono px-2 py-0 gap-1 border-status-online/20 text-status-online/70">
              <Play className="h-3 w-3" /> Ativo
            </Badge>
          )}
          {mission.enabled === false && (
            <Badge variant="outline" className="text-[10px] font-mono px-2 py-0 gap-1 border-muted-foreground/20 text-muted-foreground/40">
              <Pause className="h-3 w-3" /> Pausado
            </Badge>
          )}

          {/* Last run result */}
          {mission.lastRunOk === true && (
            <div className="flex items-center gap-1 text-status-online/60">
              <CheckCircle2 className="h-3 w-3" />
              <span className="text-[10px] font-mono">OK</span>
            </div>
          )}
          {mission.lastRunOk === false && (
            <div className="flex items-center gap-1 text-status-critical/70">
              <XCircle className="h-3 w-3" />
              <span className="text-[10px] font-mono">Falha</span>
            </div>
          )}
        </div>

        {/* Time row — only for matched missions */}
        {mission.matched && (
          <div className="flex items-center gap-4 ml-12 mt-2.5 text-xs font-mono text-muted-foreground/40">
            {mission.lastRunAt && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                <span>{timeAgo(mission.lastRunAt)}</span>
              </div>
            )}
            {mission.nextRunAt && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                <span>{timeUntil(mission.nextRunAt)}</span>
              </div>
            )}
            {mission.schedule && (
              <>
                <div className="w-px h-3 bg-border/20" />
                <span>{mission.schedule}</span>
              </>
            )}
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
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[68px] rounded-lg" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[100px] rounded-lg" />
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Page
   ══════════════════════════════════════════════ */

const MissionsPage = () => {
  const queryClient = useQueryClient();

  const { data: cronJobs, isLoading, isError, error } = useQuery<CronJobRaw[]>({
    queryKey: ["missions-cron"],
    queryFn: fetchCronRaw,
    refetchInterval: 30_000,
    placeholderData: (prev) => prev,
  });

  const missions = useMemo(
    () => buildMissions(WORKFLOWS, cronJobs ?? []),
    [cronJobs]
  );

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["missions-cron"] });
  };

  return (
    <OrionLayout title="Missões">
      <div className="space-y-8">
        <OrionBreadcrumb items={["Mission Control", "Missões"]} />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Missões</h1>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Workflows operacionais conectados ao backend real
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {/* Content */}
        {isLoading && !cronJobs ? (
          <MissionsSkeleton />
        ) : isError ? (
          <div className="rounded-lg border border-border p-12 text-center">
            <AlertCircle className="h-8 w-8 text-status-critical mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground/70">Falha ao carregar dados do backend</p>
            <p className="text-xs text-muted-foreground/50 mt-1">{(error as Error)?.message}</p>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-4">
              Tentar novamente
            </Button>
          </div>
        ) : (
          <>
            <SummaryCards missions={missions} />

            <div>
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">
                  Workflows
                </h2>
                <div className="flex-1 h-px bg-border/40" />
                <span className="text-xs font-mono text-muted-foreground/40">
                  {missions.filter((m) => m.matched).length}/{missions.length} conectados
                </span>
              </div>
              <div className="space-y-2.5">
                {missions.map((m) => (
                  <MissionRow key={m.id} mission={m} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </OrionLayout>
  );
};

export default MissionsPage;
