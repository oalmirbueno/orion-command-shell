import { useState } from "react";
import {
  Brain, User, Target, Settings, Shield, Layers,
  ChevronRight, Clock, Inbox, Search,
} from "lucide-react";
import type { MemorySnapshot, MemoryCategory } from "@/domains/memory/types";
import { MemoryDetailSheet } from "@/components/sheets/MemoryDetailSheet";

const categoryConfig: Record<MemoryCategory, { icon: React.ElementType; label: string; color: string }> = {
  context: { icon: Brain, label: "Contexto", color: "bg-primary/10 text-primary border-primary/20" },
  decision: { icon: Target, label: "Decisão", color: "bg-status-warning/10 text-status-warning border-status-warning/20" },
  learning: { icon: Layers, label: "Aprendizado", color: "bg-status-online/10 text-status-online border-status-online/20" },
  profile: { icon: User, label: "Perfil", color: "bg-primary/10 text-primary border-primary/20" },
  config: { icon: Settings, label: "Configuração", color: "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20" },
  incident: { icon: Shield, label: "Incidente", color: "bg-status-critical/10 text-status-critical border-status-critical/20" },
};

const relevanceConfig = {
  high: { border: "border-l-primary", label: "Alta" },
  medium: { border: "border-l-muted-foreground/30", label: "Média" },
  low: { border: "border-l-border", label: "Baixa" },
};

function SnapshotCard({ snapshot, onClick }: { snapshot: MemorySnapshot; onClick: () => void }) {
  const cat = categoryConfig[snapshot.category];
  const rel = relevanceConfig[snapshot.relevance];
  const CatIcon = cat.icon;

  return (
    <div onClick={onClick} className={`rounded-xl border border-border/40 bg-card border-l-[3px] ${rel.border} hover:bg-accent/20 transition-colors cursor-pointer group`}>
      <div className="px-6 py-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <CatIcon className="h-5 w-5 text-muted-foreground/50 shrink-0" />
            <h3 className="text-sm font-semibold text-foreground leading-snug">{snapshot.title}</h3>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${cat.color}`}>{cat.label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground/15 group-hover:text-muted-foreground/40 transition-colors" />
          </div>
        </div>
        <p className="text-sm text-foreground/60 leading-relaxed mb-3 ml-8">{snapshot.summary}</p>
        <div className="ml-8 px-4 py-2.5 rounded-lg bg-accent/5 border border-border/20 mb-3">
          <p className="text-xs text-muted-foreground/45 leading-relaxed italic">{snapshot.context}</p>
        </div>
        <div className="flex items-center justify-between ml-8">
          <div className="flex items-center gap-1.5 flex-wrap">
            {snapshot.tags.map((tag) => <span key={tag} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent/10 text-muted-foreground/45 border border-border/15">{tag}</span>)}
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground/35 shrink-0">
            <span>{snapshot.source}</span>
            <div className="h-3 w-px bg-border/20" />
            <div className="flex items-center gap-1"><Clock className="h-3 w-3" /><span>{snapshot.capturedAt}</span></div>
            <span className="text-muted-foreground/20">{snapshot.capturedAgo}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MemorySnapshotsProps { snapshots: MemorySnapshot[]; }

export function MemorySnapshots({ snapshots = [] }: MemorySnapshotsProps) {
  const [activeFilter, setActiveFilter] = useState<MemoryCategory | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<MemorySnapshot | null>(null);

  if (snapshots.length === 0) {
    return (
      <section>
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">Banco de Memória</h2>
          <div className="flex-1 h-px bg-border/40" />
        </div>
        <div className="rounded-xl border border-border/30 bg-card">
          <div className="orion-empty">
            <div className="orion-empty-icon">
              <Inbox className="h-5 w-5 text-muted-foreground/30" />
            </div>
            <p className="orion-empty-title">Nenhum snapshot registrado</p>
            <p className="orion-empty-subtitle">Aguardando conexão com API</p>
          </div>
        </div>
      </section>
    );
  }

  const categories = Array.from(new Set(snapshots.map(s => s.category)));
  const filtered = snapshots.filter((s) => {
    if (activeFilter && s.category !== activeFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return s.title.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q) || s.tags.some(t => t.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground">Banco de Memória</h2>
        <div className="flex items-center gap-2 ml-1 px-2.5 py-0.5 rounded-full bg-primary/8 border border-primary/15">
          <span className="text-[10px] font-mono text-primary font-medium">{filtered.length} de {snapshots.length}</span>
        </div>
        <div className="flex-1 h-px bg-border/40" />
      </div>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/30 bg-card flex-1 max-w-xs">
          <Search className="h-3.5 w-3.5 text-muted-foreground/30" />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar memória..." className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground/30 outline-none w-full" />
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setActiveFilter(null)} className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-full border transition-colors ${!activeFilter ? "bg-primary/10 text-primary border-primary/20" : "text-muted-foreground/40 border-border/20 hover:border-border/40"}`}>Todos</button>
          {categories.map((cat) => {
            const cfg = categoryConfig[cat];
            const isActive = activeFilter === cat;
            return <button key={cat} onClick={() => setActiveFilter(isActive ? null : cat)} className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-full border transition-colors ${isActive ? cfg.color : "text-muted-foreground/40 border-border/20 hover:border-border/40"}`}>{cfg.label}</button>;
          })}
        </div>
      </div>
      <div className="space-y-2.5 max-h-[calc(100vh-340px)] overflow-y-auto orion-thin-scroll pr-1">
        {filtered.map((snapshot) => <SnapshotCard key={snapshot.id} snapshot={snapshot} onClick={() => setSelected(snapshot)} />)}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground/40">Nenhum resultado para o filtro aplicado</p>
          </div>
        )}
      </div>
      <MemoryDetailSheet snapshot={selected} open={!!selected} onOpenChange={(o) => !o && setSelected(null)} />
    </section>
  );
}
