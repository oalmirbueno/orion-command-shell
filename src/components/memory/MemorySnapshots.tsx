import {
  Brain, User, Target, Settings, Shield, Layers,
  ChevronRight, Clock,
} from "lucide-react";
import type { MemorySnapshot, MemoryCategory } from "@/domains/memory/types";

const categoryConfig: Record<MemoryCategory, { icon: React.ElementType; label: string; color: string }> = {
  context: { icon: Brain, label: "Contexto", color: "bg-primary/10 text-primary border-primary/20" },
  decision: { icon: Target, label: "Decisão", color: "bg-status-warning/10 text-status-warning border-status-warning/20" },
  learning: { icon: Layers, label: "Aprendizado", color: "bg-status-online/10 text-status-online border-status-online/20" },
  profile: { icon: User, label: "Perfil", color: "bg-primary/10 text-primary border-primary/20" },
  config: { icon: Settings, label: "Configuração", color: "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20" },
  incident: { icon: Shield, label: "Incidente", color: "bg-status-critical/10 text-status-critical border-status-critical/20" },
};

const relevanceConfig = {
  high: { border: "border-l-primary", label: "Alta relevância" },
  medium: { border: "border-l-muted-foreground/30", label: "Média" },
  low: { border: "border-l-border", label: "Baixa" },
};

function SnapshotCard({ snapshot }: { snapshot: MemorySnapshot }) {
  const cat = categoryConfig[snapshot.category];
  const rel = relevanceConfig[snapshot.relevance];
  const CatIcon = cat.icon;

  return (
    <div className={`rounded-xl border border-border/40 bg-card border-l-[3px] ${rel.border} hover:bg-accent/20 transition-colors cursor-pointer group`}>
      <div className="px-6 py-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <CatIcon className="h-5 w-5 text-muted-foreground/50 shrink-0" />
            <h3 className="text-base font-semibold text-foreground leading-snug">{snapshot.title}</h3>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <span className={`text-xs font-mono uppercase px-2 py-1 rounded border ${cat.color}`}>{cat.label}</span>
            <ChevronRight className="h-5 w-5 text-muted-foreground/15 group-hover:text-muted-foreground/40 transition-colors" />
          </div>
        </div>

        <p className="text-sm text-foreground/65 leading-relaxed mb-4 ml-8">{snapshot.summary}</p>

        <div className="ml-8 px-4 py-3 rounded-lg bg-surface-2 border border-border/30 mb-4">
          <p className="text-xs text-muted-foreground/50 leading-relaxed italic">{snapshot.context}</p>
        </div>

        <div className="flex items-center justify-between ml-8">
          <div className="flex items-center gap-2 flex-wrap">
            {snapshot.tags.map((tag) => (
              <span key={tag} className="text-xs font-mono px-2 py-1 rounded bg-surface-3 text-muted-foreground/50 border border-border/20">{tag}</span>
            ))}
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground/40 shrink-0">
            <span>{snapshot.source}</span>
            <div className="h-4 w-px bg-border/30" />
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{snapshot.capturedAt}</span>
            </div>
            <span className="text-muted-foreground/25">{snapshot.capturedAgo}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MemorySnapshotsProps {
  snapshots: MemorySnapshot[];
}

export function MemorySnapshots({ snapshots }: MemorySnapshotsProps) {
  const categories = Array.from(new Set(snapshots.map(s => s.category)));

  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">Banco de Memória</h2>
        <div className="flex items-center gap-2 ml-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
          <span className="text-xs font-mono text-primary font-medium">{snapshots.length} snapshots</span>
        </div>
        <div className="flex-1 h-px bg-border/40" />
        <div className="flex items-center gap-2">
          {categories.map((cat) => {
            const cfg = categoryConfig[cat];
            return (
              <span key={cat} className={`text-xs font-mono uppercase px-3 py-1.5 rounded-full border cursor-pointer hover:opacity-80 transition-opacity ${cfg.color}`}>{cfg.label}</span>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        {snapshots.map((snapshot) => (
          <SnapshotCard key={snapshot.id} snapshot={snapshot} />
        ))}
      </div>
    </section>
  );
}
