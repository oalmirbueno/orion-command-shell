import { useState, useCallback } from "react";
import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import {
  Search, Brain, Activity, Bot, FileText,
  Clock, ChevronRight, Inbox, AlertTriangle, Loader2,
} from "lucide-react";
import { apiUrl } from "@/domains/api";

type SearchScope = "all" | "sessions" | "agents" | "memory" | "files" | "alerts";

const scopes: { value: SearchScope; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "Todos", icon: Search },
  { value: "sessions", label: "Sessões", icon: Activity },
  { value: "agents", label: "Agentes", icon: Bot },
  { value: "memory", label: "Memória", icon: Brain },
  { value: "files", label: "Arquivos", icon: FileText },
  { value: "alerts", label: "Alertas", icon: AlertTriangle },
];

interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  source: string;
  score?: number;
}

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [activeScope, setActiveScope] = useState<SearchScope>("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(apiUrl(`/memory/search?q=${encodeURIComponent(q)}`), {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      // Normalize: could be array or { items: [] } or { results: [] }
      const items = Array.isArray(data) ? data :
        data?.items ? data.items :
        data?.results ? data.results : [];
      setResults(items.map((item: any, i: number) => ({
        id: item.id || `result-${i}`,
        title: item.summary || item.label || item.content?.slice(0, 80) || "—",
        snippet: item.content?.slice(0, 200) || item.summary || "",
        source: item.source || item.kind || "memory",
        score: item.score,
      })));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") doSearch(query);
  };

  return (
    <OrionLayout title="Busca">
      <div className="space-y-8">
        <OrionBreadcrumb items={["Mission Control", "Busca"]} />

        <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4">
            <Search className="h-5 w-5 text-muted-foreground/40 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar em todo o sistema..."
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground/30 outline-none w-full"
              autoFocus
            />
            {query && (
              <button onClick={() => { setQuery(""); setResults([]); setSearched(false); }} className="text-xs font-mono text-muted-foreground/40 hover:text-foreground transition-colors px-2 py-1 rounded border border-border/20">Limpar</button>
            )}
            <button onClick={() => doSearch(query)} className="text-xs font-mono px-3 py-1.5 rounded bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors">Buscar</button>
          </div>

          <div className="flex items-center gap-1.5 px-6 py-3 border-t border-border/20 bg-accent/5">
            {scopes.map((scope) => {
              const Icon = scope.icon;
              const isActive = activeScope === scope.value;
              return (
                <button key={scope.value} onClick={() => setActiveScope(scope.value)} className={`flex items-center gap-1.5 text-[10px] font-mono uppercase px-2.5 py-1 rounded-full border transition-colors ${isActive ? "bg-primary/10 text-primary border-primary/20" : "text-muted-foreground/40 border-border/20 hover:border-border/30"}`}>
                  <Icon className="h-3 w-3" />{scope.label}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary/50 mb-3" />
            <p className="text-sm font-mono text-muted-foreground/40">Buscando...</p>
          </div>
        ) : !searched ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-accent/5 border border-border/20 flex items-center justify-center mb-5">
              <Search className="h-6 w-6 text-muted-foreground/20" />
            </div>
            <p className="text-sm font-medium text-muted-foreground/40 mb-1.5">Busca operacional</p>
            <p className="text-xs font-mono text-muted-foreground/25 max-w-sm">Pesquise sessões, agentes, memória, arquivos e alertas em um único lugar</p>
            <div className="flex items-center gap-2 mt-6">
              <kbd className="text-[10px] font-mono px-2 py-1 rounded border border-border/20 text-muted-foreground/30 bg-accent/5">⌘</kbd>
              <kbd className="text-[10px] font-mono px-2 py-1 rounded border border-border/20 text-muted-foreground/30 bg-accent/5">K</kbd>
              <span className="text-[10px] font-mono text-muted-foreground/20 ml-1">acesso rápido</span>
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-border/30 bg-card">
            <Inbox className="h-6 w-6 text-muted-foreground/25 mb-3" />
            <p className="text-sm font-medium text-muted-foreground/50">Nenhum resultado para "{query}"</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-mono text-muted-foreground/40">{results.length} resultados</span>
              <div className="flex-1 h-px bg-border/30" />
            </div>
            {results.map((r) => (
              <div key={r.id} className="flex items-start gap-4 px-5 py-4 rounded-lg border border-border/30 bg-card hover:bg-accent/15 transition-colors cursor-pointer group">
                <Brain className="h-5 w-5 text-primary/50 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">{r.title}</h3>
                  <p className="text-xs text-foreground/45 leading-relaxed mt-1 line-clamp-2">{r.snippet}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-mono text-muted-foreground/30">{r.source}</span>
                    {r.score != null && <span className="text-[10px] font-mono text-primary/40">score: {r.score.toFixed(2)}</span>}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/15 group-hover:text-muted-foreground/40 transition-colors shrink-0 mt-1" />
              </div>
            ))}
          </div>
        )}
      </div>
    </OrionLayout>
  );
};

export default SearchPage;
