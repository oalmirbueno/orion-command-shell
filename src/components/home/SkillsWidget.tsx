import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Zap, Layers, Bot, ChevronRight } from "lucide-react";
import { API_BASE_URL } from "@/domains/api";
import { Skeleton } from "@/components/ui/skeleton";

interface SkillItem {
  id: string;
  name: string;
  source?: string;
  agents?: string[];
  files?: number | string[];
}

async function fetchSkills() {
  const res = await fetch(`${API_BASE_URL}/skills`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const skills: SkillItem[] = Array.isArray(json.skills) ? json.skills : Array.isArray(json) ? json : [];
  return skills;
}

function getAgentCount(s: SkillItem) { return Array.isArray(s.agents) ? s.agents.length : 0; }
function getFileCount(s: SkillItem) { return typeof s.files === "number" ? s.files : Array.isArray(s.files) ? s.files.length : 0; }
function isActive(s: SkillItem) { return getAgentCount(s) > 0 || getFileCount(s) > 2; }

export function SkillsWidget() {
  const navigate = useNavigate();
  const { data: skills, isLoading } = useQuery({
    queryKey: ["skills-widget"],
    queryFn: fetchSkills,
    refetchInterval: 120_000,
    placeholderData: (prev) => prev,
  });

  if (isLoading && !skills) {
    return (
      <div className="orion-card p-5 space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!skills) return null;

  const total = skills.length;
  const active = skills.filter(isActive).length;
  const workspace = skills.filter((s) => s.source !== "system").length;

  return (
    <div
      className="orion-card hover:border-primary/20 transition-colors cursor-pointer group"
      onClick={() => navigate("/skills")}
    >
      {/* Header */}
      <div className="orion-panel-header">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="orion-panel-title">Skills</span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-colors" />
      </div>

      {/* Metrics */}
      <div className="px-5 py-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xl font-bold text-foreground leading-none">{total}</p>
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/40 mt-1">Total</span>
          </div>
          <div>
            <p className={`text-xl font-bold leading-none ${active > 0 ? "text-status-online" : "text-muted-foreground/40"}`}>{active}</p>
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/40 mt-1">Ativas</span>
          </div>
          <div>
            <p className="text-xl font-bold text-primary leading-none">{workspace}</p>
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/40 mt-1">Workspace</span>
          </div>
        </div>

        {/* Top skills preview */}
        {skills.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border/30 space-y-1.5">
            {skills.slice(0, 3).map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Layers className="h-3 w-3 text-muted-foreground/30 shrink-0" />
                  <span className="text-xs text-foreground/60 truncate">{s.name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/30 shrink-0">
                  <Bot className="h-2.5 w-2.5" />
                  <span>{getAgentCount(s)}</span>
                </div>
              </div>
            ))}
            {skills.length > 3 && (
              <p className="text-[10px] font-mono text-muted-foreground/25 text-right">
                +{skills.length - 3} mais
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
