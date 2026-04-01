import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import {
  Hammer, RefreshCw, Cpu, Activity, Inbox, AlertCircle, Bot,
  Zap, Terminal, Layers, MonitorSmartphone, Package, FileText,
  ChevronDown, ChevronRight, ExternalLink, Server,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { API_BASE_URL } from "@/domains/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

/* ── Types ── */
interface RealAgent {
  id: string;
  name: string;
  emoji?: string;
  color?: string;
  model?: string;
  workspace?: string;
  status?: string;
  lastActivity?: string;
  activeSessions?: number;
  currentTask?: string;
  context?: string;
}

interface RealSession {
  id: string;
  key: string;
  type: string;
  typeLabel?: string;
  typeEmoji?: string;
  updatedAt: string | number;
  ageMs: number;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  preview?: string;
  previewType?: string;
  aborted: boolean;
}

interface AioxSquad {
  id: string;
  name: string;
  description?: string;
  source?: string;
  status?: string;
  agents?: string[];
  files?: number | string[];
  tags?: string[];
  category?: string;
}

/* ── 3 domains ── */
type BuilderDomain = "openclaw" | "claude-code" | "aiox";

const DOMAIN_META: Record<BuilderDomain, { label: string; desc: string; icon: React.ElementType; accent: string; border: string; bg: string }> = {
  "openclaw": {
    label: "OpenClaw",
    desc: "Plataforma de orquestração — agentes de controle, roteamento e gestão do ecossistema",
    icon: Server,
    accent: "text-primary",
    border: "border-primary/20",
    bg: "bg-primary/5",
  },
  "claude-code": {
    label: "Claude Code",
    desc: "Builders de construção — geração de código, edição e sessões de desenvolvimento via Anthropic",
    icon: Terminal,
    accent: "text-purple-400",
    border: "border-purple-400/20",
    bg: "bg-purple-400/5",
  },
  aiox: {
    label: "AIOX",
    desc: "Squads operacionais — automação, pipelines e capacidades instaladas no filesystem",
    icon: Zap,
    accent: "text-amber-400",
    border: "border-amber-400/20",
    bg: "bg-amber-400/5",
  },
};

/* ── Classification — strict rules ── */
const CLAUDE_KEYWORDS = ["claude", "anthropic", "sonnet", "opus", "haiku", "claude-code"];
const AIOX_KEYWORDS = ["aiox", "aio-x", "squad"];

function classifyAgent(agent: RealAgent): BuilderDomain {
  const haystack = `${agent.name} ${agent.model || ""} ${agent.id}`.toLowerCase();

  // Claude Code: only if agent model or name explicitly references Anthropic/Claude
  if (CLAUDE_KEYWORDS.some((k) => haystack.includes(k))) return "claude-code";

  // AIOX: only if agent name/id explicitly references AIOX
  if (AIOX_KEYWORDS.some((k) => haystack.includes(k))) return "aiox";

  // Everything else is OpenClaw platform agent
  return "openclaw";
}

/* ── Fetchers ── */
async function fetchAgents(): Promise<RealAgent[]> {
  const res = await fetch(`${API_BASE_URL}/agents`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(`agents ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : data?.agents ?? [];
}

async function fetchSessions(): Promise<RealSession[]> {
  const res = await fetch(`${API_BASE_URL}/sessions`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(`sessions ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : data?.sessions ?? [];
}

async function fetchSquads(): Promise<AioxSquad[]> {
  const res = await fetch(`${API_BASE_URL}/builders/aiox-squads`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : data?.squads ?? [];
}

/* ── Helpers ── */
function timeAgo(iso?: string | number): string {
  if (!iso) return "—";
  const d = typeof iso === "number" ? new Date(iso) : new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60_000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  return `${Math.round(hrs / 24)}d atrás`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

/* ── Derived view ── */
interface BuilderView {
  id: string;
  name: string;
  model: string;
  status: string;
  domain: BuilderDomain;
  activeSessions: number;
  lastActivity: string;
  lastActivityRaw: string;
  sessions: RealSession[];
  totalTokens: number;
  emoji?: string;
  currentTask: string;
  context: string;
}

/* ── Component ── */
export default function BuildersPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [expandedBuilder, setExpandedBuilder] = useState<string | null>(null);
  const [expandedSquad, setExpandedSquad] = useState<string | null>(null);
  const [showAllImported, setShowAllImported] = useState(false);

  const agentsQ = useQuery({ queryKey: ["builders-agents"], queryFn: fetchAgents, staleTime: 30_000, refetchInterval: 60_000, placeholderData: (prev) => prev });
  const sessionsQ = useQuery({ queryKey: ["builders-sessions"], queryFn: fetchSessions, staleTime: 30_000, refetchInterval: 60_000, placeholderData: (prev) => prev });
  const squadsQ = useQuery({ queryKey: ["builders-aiox-squads"], queryFn: fetchSquads, staleTime: 30_000, refetchInterval: 60_000, placeholderData: (prev) => prev });

  const isLoading = agentsQ.isLoading || sessionsQ.isLoading;
  const isError = agentsQ.isError && sessionsQ.isError;
  const squads = squadsQ.data ?? [];

  const builders = useMemo<BuilderView[]>(() => {
    const agents = agentsQ.data ?? [];
    const sessions = sessionsQ.data ?? [];
    return agents.map((a) => {
      const domain = classifyAgent(a);
      const agentSessions = sessions.filter(
        (s) =>
          s.model?.toLowerCase().includes(a.model?.split("/")[0]?.toLowerCase() || "___") ||
          s.key?.toLowerCase().includes(a.name?.toLowerCase() || "___"),
      );
      // Derive current task: from API field or latest active session
      const latestActive = agentSessions.find((s) => !s.aborted && s.ageMs < 300_000);
      const currentTask = a.currentTask || latestActive?.preview || latestActive?.key || "";
      const context = a.context || (latestActive ? `${latestActive.type || "session"} · ${latestActive.model || "—"}` : "");

      return {
        id: a.id,
        name: a.name,
        model: a.model || "—",
        status: a.status || "unknown",
        domain,
        activeSessions: a.activeSessions ?? agentSessions.filter((s) => !s.aborted && s.ageMs < 300_000).length,
        lastActivity: timeAgo(a.lastActivity),
        lastActivityRaw: a.lastActivity || "",
        sessions: agentSessions,
        totalTokens: agentSessions.reduce((sum, s) => sum + (s.totalTokens || 0), 0),
        emoji: a.emoji,
        currentTask,
        context,
      };
    });
  }, [agentsQ.data, sessionsQ.data]);

  const grouped = useMemo(() => {
    const map: Record<BuilderDomain, BuilderView[]> = { openclaw: [], "claude-code": [], aiox: [] };
    builders.forEach((b) => map[b.domain].push(b));
    return map;
  }, [builders]);

  const stats = useMemo(
    () => ({
      total: builders.length,
      online: builders.filter((b) => b.status === "online").length,
      activeSessions: builders.reduce((s, b) => s + b.activeSessions, 0),
      totalTokens: builders.reduce((s, b) => s + b.totalTokens, 0),
      squads: squads.length,
    }),
    [builders, squads],
  );

  /* ── Token chart: 6 × 4h buckets over last 24h ── */
  const tokenChartData = useMemo(() => {
    const now = Date.now();
    const bucketSize = 4 * 60 * 60_000;
    const buckets: { label: string; OpenClaw: number; "Claude Code": number; AIOX: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const hS = new Date(now - (i + 1) * bucketSize).getHours();
      const hE = new Date(now - i * bucketSize).getHours();
      buckets.push({ label: `${String(hS).padStart(2, "0")}–${String(hE).padStart(2, "0")}h`, OpenClaw: 0, "Claude Code": 0, AIOX: 0 });
    }
    const h24 = 24 * 60 * 60_000;
    builders.forEach((b) => {
      const key = b.domain === "openclaw" ? "OpenClaw" : b.domain === "claude-code" ? "Claude Code" : "AIOX";
      b.sessions.forEach((s) => {
        const ts = typeof s.updatedAt === "number" ? s.updatedAt : new Date(s.updatedAt).getTime();
        if (ts < now - h24 || ts > now) return;
        const idx = 5 - Math.min(5, Math.floor((now - ts) / bucketSize));
        if (idx >= 0 && idx < 6) buckets[idx][key] += s.totalTokens || 0;
      });
    });
    return buckets;
  }, [builders]);

  const hasTokenData = tokenChartData.some((d) => d.OpenClaw > 0 || d["Claude Code"] > 0 || d.AIOX > 0);


    const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: ["builders-sessions"] });
    qc.invalidateQueries({ queryKey: ["builders-aiox-squads"] });
  };

  /* ── Squad card renderer ── */
  const renderSquadCard = (sq: AioxSquad, borderCls: string, bgCls: string) => {
    const fileCount = Array.isArray(sq.files) ? sq.files.length : (sq.files ?? 0);
    const fileNames = Array.isArray(sq.files) ? sq.files : [];
    const agentNames = sq.agents ?? [];
    const isOpen = expandedSquad === sq.id;
    return (
      <div
        key={sq.id}
        onClick={() => setExpandedSquad(isOpen ? null : sq.id)}
        className={`rounded-lg border ${borderCls} ${bgCls} hover:border-amber-400/30 transition-colors cursor-pointer`}
      >
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-amber-400" />
              <span className="font-semibold text-sm text-foreground truncate max-w-[200px]">{sq.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {sq.status && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    sq.status === "active" ? "bg-emerald-400/10 text-emerald-400" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {sq.status === "active" ? "ativo" : sq.status}
                </span>
              )}
              {isOpen ? <ChevronDown className="h-3 w-3 text-muted-foreground/40" /> : <ChevronRight className="h-3 w-3 text-muted-foreground/40" />}
            </div>
          </div>
          {sq.description && <p className="text-xs text-muted-foreground/70 line-clamp-2">{sq.description}</p>}
          <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground/50">
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {fileCount} arquivos
            </span>
            {agentNames.length > 0 && (
              <span className="flex items-center gap-1">
                <Bot className="h-3 w-3" />
                {agentNames.length} agentes
              </span>
            )}
            {sq.source && <span className="text-amber-400/60">{sq.source}</span>}
          </div>
        </div>
        {isOpen && (
          <div className="border-t border-amber-400/10 p-4 space-y-4 bg-muted/5" onClick={(e) => e.stopPropagation()}>
            <div className="text-[10px] font-mono text-muted-foreground/40">ID: {sq.id}</div>
            {agentNames.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-mono font-bold">Agentes vinculados</div>
                <div className="flex flex-wrap gap-2">
                  {agentNames.map((name) => (
                    <button
                      key={name}
                      onClick={() => navigate("/agents")}
                      className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border border-border bg-card hover:border-primary/40 hover:text-primary transition-colors"
                    >
                      <Bot className="h-3 w-3" />
                      <span>{name}</span>
                      <ExternalLink className="h-2.5 w-2.5 text-muted-foreground/40" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {fileNames.length > 0 ? (
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-mono font-bold">Arquivos ({fileNames.length})</div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {fileNames.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-mono text-foreground/70 rounded-md bg-card border border-border px-3 py-1.5">
                      <FileText className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                      <span className="truncate">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : fileCount > 0 ? (
              <div className="text-xs text-muted-foreground/50 italic">{fileCount} arquivos vinculados (nomes indisponíveis)</div>
            ) : null}
            {sq.tags && sq.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {sq.tags.map((t) => (
                  <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  /* ── Builder card renderer ── */
  const renderBuilderCard = (b: BuilderView, meta: (typeof DOMAIN_META)[BuilderDomain]) => {
    const isExpanded = expandedBuilder === b.id;
    const isOnline = b.status === "online";
    return (
      <div
        key={b.id}
        onClick={() => setExpandedBuilder(isExpanded ? null : b.id)}
        className={`rounded-lg border ${meta.border} ${meta.bg} hover:border-primary/30 transition-colors cursor-pointer`}
      >
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {b.emoji ? <span className="text-lg">{b.emoji}</span> : <meta.icon className={`h-5 w-5 ${meta.accent}`} />}
              <span className="font-semibold text-sm text-foreground truncate max-w-[180px]">{b.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground/30"}`} />
              <span className={`text-xs font-mono ${isOnline ? "text-emerald-400" : "text-muted-foreground/50"}`}>
                {isOnline ? "online" : b.status || "—"}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="space-y-0.5">
              <div className="text-muted-foreground/50 font-mono uppercase text-[10px]">Modelo</div>
              <div className="text-foreground/80 font-medium truncate">{b.model}</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-muted-foreground/50 font-mono uppercase text-[10px]">Sessões</div>
              <div className="text-foreground/80 font-medium">{b.activeSessions}</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-muted-foreground/50 font-mono uppercase text-[10px]">Última Ativ.</div>
              <div className="text-foreground/80 font-medium">{b.lastActivity}</div>
            </div>
          </div>
          {b.totalTokens > 0 && (
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50 font-mono">
              <Cpu className="h-3 w-3" />
              <span>{formatTokens(b.totalTokens)} tokens</span>
            </div>
          )}
          {/* Current task & context */}
          {(b.currentTask || b.context) && (
            <div className="rounded-md border border-primary/10 bg-primary/5 px-3 py-2 space-y-1">
              {b.currentTask && (
                <div className="flex items-center gap-2">
                  <Activity className="h-3 w-3 text-primary shrink-0" />
                  <span className="text-xs text-foreground/80 truncate">{b.currentTask}</span>
                </div>
              )}
              {b.context && (
                <div className="text-[10px] font-mono text-muted-foreground/50 pl-5">{b.context}</div>
              )}
            </div>
          )}
        </div>
        {isExpanded && (
          <div className="border-t border-border p-3 space-y-2 bg-muted/10">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-mono">Sessões recentes</div>
            {b.sessions.length === 0 ? (
              <p className="text-xs text-muted-foreground/40 italic">Nenhuma sessão vinculada</p>
            ) : (
              b.sessions.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center justify-between text-xs rounded-md bg-card border border-border px-3 py-2">
                  <div className="flex items-center gap-2 truncate">
                    <span>{s.typeEmoji || "💬"}</span>
                    <span className="text-foreground/80 truncate max-w-[160px]">{s.key}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground/60 font-mono">
                    <span>{formatTokens(s.totalTokens)} tk</span>
                    <span>{timeAgo(s.updatedAt)}</span>
                    {s.aborted && <span className="text-destructive text-[10px]">abortada</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  /* ── Squads split ── */
  const activeSquads = squads.filter((s) => s.status === "active");
  const importedSquads = squads.filter((s) => s.status !== "active");

  return (
    <OrionLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <OrionBreadcrumb items={["Builders"]} />
            <h1 className="text-2xl font-bold text-foreground mt-1 flex items-center gap-2">
              <Hammer className="h-6 w-6 text-primary" />
              Central de Builders
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Visão operacional dos 3 domínios de execução: OpenClaw · Claude Code · AIOX
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading} className="border-border text-muted-foreground hover:text-foreground">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total Builders", value: stats.total, icon: Layers, color: "text-primary" },
            { label: "Online", value: stats.online, icon: Activity, color: "text-emerald-400" },
            { label: "Sessões Ativas", value: stats.activeSessions, icon: MonitorSmartphone, color: "text-purple-400" },
            { label: "Tokens Hoje", value: formatTokens(stats.totalTokens), icon: Cpu, color: "text-primary" },
            { label: "Squads AIOX", value: stats.squads, icon: Package, color: "text-amber-400" },
          ].map((m) => (
            <div key={m.label} className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-muted/50 flex items-center justify-center">
                <m.icon className={`h-4 w-4 ${m.color}`} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{m.label}</div>
                <div className="text-lg font-bold text-foreground">{isLoading ? "—" : m.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Token chart — last 24h by domain */}
        {hasTokenData && (
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">Tokens por Domínio — Últimas 24h</span>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tokenChartData} barCategoryGap="20%">
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                    formatter={(value: number, name: string) => [formatTokens(value), name]}
                  />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="OpenClaw" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Claude Code" stackId="a" fill="hsl(270 60% 60%)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="AIOX" stackId="a" fill="hsl(45 96% 64%)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}


        {isLoading && !builders.length && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        )}
        {isError && !builders.length && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center space-y-3">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
            <p className="text-sm text-destructive">Falha ao carregar dados de builders</p>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              Tentar novamente
            </Button>
          </div>
        )}
        {!isLoading && !isError && builders.length === 0 && squads.length === 0 && (
          <div className="rounded-lg border border-border bg-card p-12 text-center space-y-3">
            <Inbox className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <p className="text-sm text-muted-foreground">Nenhum builder encontrado</p>
            <p className="text-xs text-muted-foreground/60">Aguardando dados de /api/agents</p>
          </div>
        )}

        {/* ═══ DOMAIN SECTIONS ═══ */}
        {!isLoading &&
          (["openclaw", "claude-code", "aiox"] as BuilderDomain[]).map((domain) => {
            const meta = DOMAIN_META[domain];
            const items = grouped[domain];
            const isAiox = domain === "aiox";

            // AIOX section shows even if no agents (squads matter)
            if (!isAiox && items.length === 0) return null;
            if (isAiox && items.length === 0 && squads.length === 0) return null;

            return (
              <section key={domain} className="space-y-4">
                {/* Domain header */}
                <div className={`flex items-center gap-3 border-b ${meta.border} pb-3`}>
                  <div className={`w-8 h-8 rounded-md ${meta.bg} flex items-center justify-center`}>
                    <meta.icon className={`h-4 w-4 ${meta.accent}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">{meta.label}</h2>
                      {items.length > 0 && (
                        <span className="text-[10px] font-mono text-muted-foreground/50">
                          {items.filter((i) => i.status === "online").length}/{items.length} online
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">{meta.desc}</p>
                  </div>
                </div>

                {/* Agent cards for this domain */}
                {items.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {items.map((b) => renderBuilderCard(b, meta))}
                  </div>
                )}

                {/* AIOX-specific: squads */}
                {isAiox && squads.length > 0 && (
                  <div className="space-y-4 pl-0">
                    {/* Active squads */}
                    {activeSquads.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Package className="h-3.5 w-3.5 text-amber-400" />
                          <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">Squads em Operação</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-400/10 text-emerald-400">
                            {activeSquads.length} ativos
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                          {activeSquads.map((sq) => renderSquadCard(sq, "border-amber-400/20", "bg-amber-400/5"))}
                        </div>
                      </div>
                    )}

                    {/* Imported / historical */}
                    {importedSquads.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Package className="h-3.5 w-3.5 text-muted-foreground/50" />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Importados / Histórico</span>
                            <span className="text-[10px] font-mono text-muted-foreground/40">({importedSquads.length})</span>
                          </div>
                          {importedSquads.length > 6 && (
                            <Button variant="ghost" size="sm" onClick={() => setShowAllImported(!showAllImported)} className="text-xs text-muted-foreground">
                              {showAllImported ? "Mostrar menos" : "Ver todos"}
                              {showAllImported ? <ChevronDown className="h-3 w-3 ml-1" /> : <ChevronRight className="h-3 w-3 ml-1" />}
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                          {(showAllImported ? importedSquads : importedSquads.slice(0, 6)).map((sq) => renderSquadCard(sq, "border-border", "bg-card"))}
                        </div>
                      </div>
                    )}

                    {/* Fallback: squads with no status at all */}
                    {activeSquads.length === 0 && importedSquads.length === 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Package className="h-3.5 w-3.5 text-amber-400" />
                          <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">Squads Instalados</span>
                          <span className="text-[10px] font-mono text-muted-foreground/40">({squads.length})</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                          {squads.map((sq) => renderSquadCard(sq, "border-amber-400/15", "bg-amber-400/5"))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Empty state for AIOX agents */}
                {isAiox && items.length === 0 && squads.length > 0 && (
                  <p className="text-xs text-muted-foreground/40 italic px-1">Nenhum agente AIOX registrado — operando via squads</p>
                )}
              </section>
            );
          })}
      </div>
    </OrionLayout>
  );
}
