import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import {
  Zap,
  RefreshCw,
  Search,
  Inbox,
  AlertCircle,
  FileText,
  Bot,
  Globe,
  Wrench,
  ChevronRight,
  Layers,
  Clock,
  Calendar,
  Activity,
  ExternalLink,
  X,
  Timer,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { API_BASE_URL } from "@/domains/api";

/* ── Types ── */
interface SkillItem {
  id: string;
  name: string;
  description?: string;
  source?: "workspace" | "system" | string;
  files?: number | string[];
  agents?: string[];
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  lastUsed?: string;
  usageCount?: number;
  avgDuration?: number;
  status?: string;
  [key: string]: unknown;
}

interface SkillsResponse {
  skills: SkillItem[];
  total?: number;
}

/* ── Fetcher ── */
async function fetchSkills(): Promise<SkillsResponse> {
  const res = await fetch(`${API_BASE_URL}/skills`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const skills = Array.isArray(json.skills) ? json.skills : Array.isArray(json) ? json : [];
  return { skills, total: json.total ?? skills.length };
}

/* ── Helpers ── */
type FilterTab = "all" | "workspace" | "system";

function getSource(s: SkillItem): "workspace" | "system" {
  if (s.source === "system") return "system";
  return "workspace";
}

function getFileCount(s: SkillItem): number {
  if (typeof s.files === "number") return s.files;
  if (Array.isArray(s.files)) return s.files.length;
  return 0;
}

function getAgentCount(s: SkillItem): number {
  return Array.isArray(s.agents) ? s.agents.length : 0;
}

function isActive(s: SkillItem): boolean {
  return getAgentCount(s) > 0 || getFileCount(s) > 2;
}

function timeAgo(iso?: string): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d atrás`;
  return `${Math.round(days / 30)}m atrás`;
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(ms?: number): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  const secs = Math.round(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.round(secs / 60);
  return `${mins}min`;
}

/* ── Summary Metrics ── */
function SummaryBar({ skills }: { skills: SkillItem[] }) {
  const total = skills.length;
  const workspace = skills.filter((s) => getSource(s) === "workspace").length;
  const system = skills.filter((s) => getSource(s) === "system").length;
  const active = skills.filter(isActive).length;

  const metrics = [
    { label: "Total", value: total, icon: Layers, accent: "text-primary", bg: "bg-primary/5 border-primary/20" },
    { label: "Workspace", value: workspace, icon: Globe, accent: "text-status-info", bg: "bg-status-info/[0.06] border-status-info/20" },
    { label: "Sistema", value: system, icon: Wrench, accent: "text-muted-foreground", bg: "bg-surface-2 border-border/40" },
    { label: "Ativas", value: active, icon: Zap, accent: active > 0 ? "text-status-online" : "text-muted-foreground/40", bg: active > 0 ? "bg-status-online/[0.06] border-status-online/20" : "bg-surface-2 border-border/40" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <div key={m.label} className={`rounded-lg border px-5 py-4 flex items-center gap-4 ${m.bg}`}>
            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${m.bg}`}>
              <Icon className={`h-5 w-5 ${m.accent}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold leading-none ${m.accent}`}>{m.value}</p>
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/50 mt-1">{m.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Skill Card ── */
function SkillCard({ skill, onClick }: { skill: SkillItem; onClick: () => void }) {
  const source = getSource(skill);
  const fileCount = getFileCount(skill);
  const agentCount = getAgentCount(skill);
  const active = isActive(skill);

  return (
    <div
      onClick={onClick}
      className="orion-row-bordered group"
      style={{ borderLeftColor: source === "workspace" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.2)" }}
    >
      <div className="px-5 py-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
              source === "workspace" ? "bg-primary/10 border-primary/20" : "bg-surface-2 border-border"
            }`}>
              <Zap className={`h-4 w-4 ${source === "workspace" ? "text-primary" : "text-muted-foreground/50"}`} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground leading-snug truncate">{skill.name}</h3>
              {skill.description && (
                <p className="text-xs text-foreground/45 leading-relaxed mt-1 line-clamp-2">{skill.description}</p>
              )}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/10 group-hover:text-muted-foreground/40 transition-colors shrink-0 mt-2" />
        </div>

        <div className="flex items-center gap-3 ml-12 mt-2 flex-wrap">
          <span className={`orion-badge ${source === "workspace" ? "orion-badge-info" : "orion-badge-neutral"}`}>
            {source === "workspace" ? "workspace" : "sistema"}
          </span>
          {active && <span className="orion-badge orion-badge-success">ativa</span>}
          <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground/40">
            <FileText className="h-3 w-3" />
            <span>{fileCount} {fileCount === 1 ? "arquivo" : "arquivos"}</span>
          </div>
          <div className="w-px h-3 bg-border/20" />
          <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground/40">
            <Bot className="h-3 w-3" />
            <span>{agentCount} {agentCount === 1 ? "agente" : "agentes"}</span>
          </div>
          {skill.lastUsed && (
            <>
              <div className="w-px h-3 bg-border/20" />
              <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground/40">
                <Clock className="h-3 w-3" />
                <span>{timeAgo(skill.lastUsed)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Detail Panel (enhanced) ── */
function SkillDetailPanel({ skill, onClose }: { skill: SkillItem; onClose: () => void }) {
  const navigate = useNavigate();
  const source = getSource(skill);
  const fileCount = getFileCount(skill);
  const agentCount = getAgentCount(skill);
  const active = isActive(skill);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl mx-4 rounded-lg border border-border bg-card shadow-2xl max-h-[85vh] overflow-y-auto orion-thin-scroll"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-lg border flex items-center justify-center shrink-0 ${
                source === "workspace" ? "bg-primary/10 border-primary/20" : "bg-surface-2 border-border"
              }`}>
                <Zap className={`h-6 w-6 ${source === "workspace" ? "text-primary" : "text-muted-foreground/50"}`} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{skill.name}</h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`orion-badge ${source === "workspace" ? "orion-badge-info" : "orion-badge-neutral"}`}>
                    {source === "workspace" ? "workspace" : "sistema"}
                  </span>
                  {active && <span className="orion-badge orion-badge-success">ativa no ecossistema</span>}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-accent/30 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Descrição */}
          {skill.description && (
            <div>
              <span className="orion-section-label">Descrição</span>
              <p className="text-sm text-foreground/70 mt-2 leading-relaxed">{skill.description}</p>
            </div>
          )}

          {/* Métricas principais */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="orion-context-box">
              <div className="flex items-center gap-2 mb-1.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground/50" />
                <span className="orion-metric-label">Arquivos</span>
              </div>
              <p className="orion-metric-value text-lg">{fileCount}</p>
            </div>
            <div className="orion-context-box">
              <div className="flex items-center gap-2 mb-1.5">
                <Bot className="h-3.5 w-3.5 text-muted-foreground/50" />
                <span className="orion-metric-label">Agentes</span>
              </div>
              <p className="orion-metric-value text-lg">{agentCount}</p>
            </div>
            <div className="orion-context-box">
              <div className="flex items-center gap-2 mb-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground/50" />
                <span className="orion-metric-label">Utilizações</span>
              </div>
              <p className="orion-metric-value text-lg">{skill.usageCount ?? "—"}</p>
            </div>
            <div className="orion-context-box">
              <div className="flex items-center gap-2 mb-1.5">
                <Timer className="h-3.5 w-3.5 text-muted-foreground/50" />
                <span className="orion-metric-label">Duração Média</span>
              </div>
              <p className="orion-metric-value text-lg">{formatDuration(skill.avgDuration)}</p>
            </div>
          </div>

          {/* Timestamps */}
          <div className="orion-context-box space-y-3">
            <span className="orion-section-label">Histórico de Uso</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="h-3 w-3 text-muted-foreground/40" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/40">Último uso</span>
                </div>
                <p className="text-xs font-mono text-foreground/70">{skill.lastUsed ? timeAgo(skill.lastUsed) : "Sem registro"}</p>
                {skill.lastUsed && <p className="text-[10px] font-mono text-muted-foreground/30 mt-0.5">{formatDate(skill.lastUsed)}</p>}
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar className="h-3 w-3 text-muted-foreground/40" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/40">Criada em</span>
                </div>
                <p className="text-xs font-mono text-foreground/70">{formatDate(skill.createdAt)}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Activity className="h-3 w-3 text-muted-foreground/40" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/40">Atualizada em</span>
                </div>
                <p className="text-xs font-mono text-foreground/70">{formatDate(skill.updatedAt)}</p>
              </div>
            </div>
          </div>

          {/* Agentes vinculados — clicáveis */}
          {Array.isArray(skill.agents) && skill.agents.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="orion-section-label">Agentes Vinculados</span>
                <div className="flex-1 h-px bg-border/25" />
                <span className="text-[10px] font-mono text-muted-foreground/30">{skill.agents.length}</span>
              </div>
              <div className="space-y-1.5">
                {skill.agents.map((agent) => (
                  <button
                    key={agent}
                    onClick={() => {
                      onClose();
                      navigate("/agents");
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-border/40 bg-surface-1 hover:bg-accent/20 hover:border-primary/20 transition-all group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-md bg-primary/10 border border-primary/15 flex items-center justify-center">
                        <Bot className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground/80 group-hover:text-primary transition-colors">{agent}</span>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-primary/50 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {Array.isArray(skill.tags) && skill.tags.length > 0 && (
            <div>
              <span className="orion-section-label">Tags</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {skill.tags.map((t) => (
                  <span key={t} className="orion-tag">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Arquivos */}
          {Array.isArray(skill.files) && skill.files.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="orion-section-label">Arquivos da Skill</span>
                <div className="flex-1 h-px bg-border/25" />
                <span className="text-[10px] font-mono text-muted-foreground/30">{skill.files.length}</span>
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto orion-thin-scroll">
                {skill.files.map((f) => (
                  <div key={f} className="flex items-center gap-2 px-3 py-2 rounded-md bg-surface-1 border border-border/30">
                    <FileText className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                    <span className="text-xs font-mono text-muted-foreground/60 truncate">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ID técnico */}
          <div className="pt-2 border-t border-border/30">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/25">ID</span>
              <span className="text-[10px] font-mono text-muted-foreground/35">{skill.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton ── */
function SkillsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[76px] rounded-lg" />)}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-[90px] rounded-lg" />)}
      </div>
    </div>
  );
}

/* ── Page ── */
const SkillsPage = () => {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<FilterTab>("all");
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null);

  const { data, isLoading, isError, error, isFetching } = useQuery<SkillsResponse>({
    queryKey: ["skills-page"],
    queryFn: fetchSkills,
    refetchInterval: 60_000,
    placeholderData: (prev) => prev,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.refetchQueries({ queryKey: ["skills-page"] });
    setIsRefreshing(false);
  };

  const filtered = useMemo(() => {
    if (!data?.skills) return [];
    let list = data.skills;
    if (tab !== "all") list = list.filter((s) => getSource(s) === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [data, tab, search]);

  const workspaceSkills = useMemo(() => filtered.filter((s) => getSource(s) === "workspace"), [filtered]);
  const systemSkills = useMemo(() => filtered.filter((s) => getSource(s) === "system"), [filtered]);

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "Todas" },
    { key: "workspace", label: "Workspace" },
    { key: "system", label: "Sistema" },
  ];

  return (
    <OrionLayout title="Skills">
      <div className="space-y-8">
        <OrionBreadcrumb items={["Mission Control", "Skills"]} />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Skills</h1>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Capacidades e base de conhecimento dos agentes
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing || isFetching} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isRefreshing || isFetching ? "animate-spin" : ""}`} />
            {isRefreshing ? "Atualizando…" : "Atualizar"}
          </Button>
        </div>

        {/* Content */}
        {isLoading && !data ? (
          <SkillsSkeleton />
        ) : isError ? (
          <div className="rounded-lg border border-border p-12 text-center">
            <AlertCircle className="h-8 w-8 text-status-critical mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground/70">Falha ao carregar skills</p>
            <p className="text-xs text-muted-foreground/50 mt-1">{(error as Error)?.message}</p>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-4">Tentar novamente</Button>
          </div>
        ) : data ? (
          <>
            <SummaryBar skills={data.skills} />

            {/* Busca + Filtros */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar skills…"
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-surface-1 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              </div>
              <div className="flex gap-1 rounded-lg border border-border p-0.5 bg-surface-1">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-colors ${
                      tab === t.key
                        ? "bg-primary/15 text-primary font-semibold"
                        : "text-muted-foreground/50 hover:text-muted-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-lg border border-border p-16 text-center">
                <div className="w-12 h-12 rounded-lg bg-surface-2 border border-border flex items-center justify-center mx-auto mb-4">
                  <Inbox className="h-6 w-6 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-medium text-muted-foreground/50">Nenhuma skill encontrada</p>
                <p className="text-xs font-mono text-muted-foreground/30 mt-1.5">
                  {search ? "Tente um termo de busca diferente" : "Nenhuma skill registrada"}
                </p>
              </div>
            ) : tab === "all" ? (
              <div className="space-y-6">
                {workspaceSkills.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="status-dot bg-primary/60" />
                      <span className="text-xs font-mono uppercase tracking-widest font-semibold text-primary/70">Workspace</span>
                      <span className="text-xs font-mono text-muted-foreground/30">{workspaceSkills.length}</span>
                      <div className="flex-1 h-px bg-primary/10" />
                    </div>
                    <div className="space-y-2">
                      {workspaceSkills.map((s) => (
                        <SkillCard key={s.id} skill={s} onClick={() => setSelectedSkill(s)} />
                      ))}
                    </div>
                  </div>
                )}
                {systemSkills.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="status-dot bg-muted-foreground/30" />
                      <span className="text-xs font-mono uppercase tracking-widest font-semibold text-muted-foreground/50">Sistema</span>
                      <span className="text-xs font-mono text-muted-foreground/30">{systemSkills.length}</span>
                      <div className="flex-1 h-px bg-border/25" />
                    </div>
                    <div className="space-y-2">
                      {systemSkills.map((s) => (
                        <SkillCard key={s.id} skill={s} onClick={() => setSelectedSkill(s)} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((s) => (
                  <SkillCard key={s.id} skill={s} onClick={() => setSelectedSkill(s)} />
                ))}
              </div>
            )}
          </>
        ) : null}

        {selectedSkill && (
          <SkillDetailPanel skill={selectedSkill} onClose={() => setSelectedSkill(null)} />
        )}
      </div>
    </OrionLayout>
  );
};

export default SkillsPage;
