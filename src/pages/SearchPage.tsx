import { useState, useCallback, useRef, useEffect } from "react";
import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import {
  Search, Brain, Activity, Bot, FileText,
  Clock, ChevronRight, Inbox, AlertTriangle, Loader2,
  RefreshCw, Tag, X, History,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiUrl } from "@/domains/api";
import { MemoryDetailSheet } from "@/components/sheets/MemoryDetailSheet";
import type { MemorySnapshot } from "@/domains/memory/types";

/* ── types ── */

type SearchScope = "all" | "memory" | "workspace";

const scopes: { value: SearchScope; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "Todos", icon: Search },
  { value: "memory", label: "Memória", icon: Brain },
  { value: "workspace", label: "Workspace", icon: FileText },
];

interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  source: "memory" | "workspace" | "unknown";
  score?: number;
  path?: string;
  tags?: string[];
  // raw data for opening detail sheets
  _memorySnapshot?: MemorySnapshot;
}

const sourceConfig: Record<string, { label: string; class: string }> = {
  memory: { label: "Memória", class: "bg-primary/15 text-primary border-primary/30" },
  workspace: { label: "Workspace", class: "bg-[hsl(var(--status-success))]/15 text-[hsl(var(--status-success))] border-[hsl(var(--status-success))]/30" },
  unknown: { label: "Outro", class: "bg-muted text-muted-foreground border-border" },
};

/* ── highlight helper ── */
function highlightTerm(text: string, term: string) {
  if (!term || term.length < 2) return text;
  try {
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part)
        ? <mark key={i} className="bg-primary/20 text-primary rounded px-0.5">{part}</mark>
        : part
    );
  } catch {
    return text;
  }
}

/* ── page ── */

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [activeScope, setActiveScope] = useState<SearchScope>("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const abortRef = useRef<AbortController>();

  // Detail sheet state
  const [selectedSnapshot, setSelectedSnapshot] = useState<MemorySnapshot | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const doSearch = useCallback(async (q: string, scope: SearchScope) => {
    if (!q.trim() || q.trim().length < 2) return;

    // Abort previous request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setSearched(true);
    setError(null);

    const allResults: SearchResult[] = [];

    try {
      const fetches: Promise<void>[] = [];

      // Memory search
      if (scope === "all" || scope === "memory") {
        fetches.push(
          fetch(apiUrl(`/memory/search?q=${encodeURIComponent(q)}`), {
            signal: controller.signal,
            headers: { Accept: "application/json" },
          })
            .then(async (res) => {
              if (!res.ok) return;
              const data = await res.json();
              const items = Array.isArray(data) ? data :
                data?.items ? data.items :
                data?.results ? data.results : [];
              for (const item of items) {
                const title = item.summary || item.title || item.label || item.content?.slice(0, 80) || "—";
                const snippet = item.content?.slice(0, 250) || item.summary || "";
                allResults.push({
                  id: item.id ? `mem-${item.id}` : `mem-${allResults.length}`,
                  title,
                  snippet,
                  source: "memory",
                  score: item.score,
                  tags: item.tags || [],
                  _memorySnapshot: {
                    id: String(item.id || allResults.length),
                    title,
                    category: item.memory_type || item.kind || "context",
                    summary: item.summary || title,
                    context: snippet,
                    capturedAt: item.created_at || "",
                    capturedAgo: "",
                    source: item.source || item.memory_type || "memory",
                    tags: item.tags || [],
                    relevance: item.score >= 0.8 ? "high" : item.score >= 0.4 ? "medium" : "low",
                  },
                });
              }
            })
            .catch(() => {})
        );
      }

      // Workspace search
      if (scope === "all" || scope === "workspace") {
        fetches.push(
          fetch(apiUrl(`/search?q=${encodeURIComponent(q)}`), {
            signal: controller.signal,
            headers: { Accept: "application/json" },
          })
            .then(async (res) => {
              if (!res.ok) return;
              const data = await res.json();
              const items = Array.isArray(data) ? data :
                data?.items ? data.items :
                data?.results ? data.results : [];
              for (const item of items) {
                allResults.push({
                  id: item.id ? `ws-${item.id}` : `ws-${allResults.length}`,
                  title: item.name || item.title || item.path || "—",
                  snippet: item.snippet || item.content?.slice(0, 250) || item.description || "",
                  source: "workspace",
                  score: item.score,
                  path: item.path,
                  tags: item.tags || [],
                });
              }
            })
            .catch(() => {})
        );
      }

      await Promise.all(fetches);

      if (controller.signal.aborted) return;

      // Sort by score desc
      allResults.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      setResults(allResults);
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setError("Erro ao buscar. Tente novamente.");
      setResults([]);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  // Debounced search on query change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.trim().length < 2) {
      if (query.trim().length === 0) {
        setSearched(false);
        setResults([]);
        setError(null);
      }
      return;
    }
    debounceRef.current = setTimeout(() => {
      doSearch(query, activeScope);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, activeScope, doSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      doSearch(query, activeScope);
    }
  };

  const handleResultClick = (r: SearchResult) => {
    if (r._memorySnapshot) {
      setSelectedSnapshot(r._memorySnapshot);
      setSheetOpen(true);
    }
  };

  const filteredResults = results;

  return (
    <OrionLayout title="Busca">
      <div className="space-y-8">
        <OrionBreadcrumb items={["Mission Control", "Busca"]} />

        {/* Search input */}
        <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4">
            <Search className="h-5 w-5 text-muted-foreground/40 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar em todo o sistema (mín. 2 caracteres)..."
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground/30 outline-none w-full"
              autoFocus
            />
            {query && (
              <button
                onClick={() => { setQuery(""); setResults([]); setSearched(false); setError(null); }}
                className="text-xs font-mono text-muted-foreground/40 hover:text-foreground transition-colors px-2 py-1 rounded border border-border/20"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Scope tabs */}
          <div className="flex items-center gap-1.5 px-6 py-3 border-t border-border/20 bg-accent/5">
            {scopes.map((scope) => {
              const Icon = scope.icon;
              const isActive = activeScope === scope.value;
              return (
                <button
                  key={scope.value}
                  onClick={() => setActiveScope(scope.value)}
                  className={`flex items-center gap-1.5 text-[10px] font-mono uppercase px-2.5 py-1 rounded-full border transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "text-muted-foreground/40 border-border/20 hover:border-border/30"
                  }`}
                >
                  <Icon className="h-3 w-3" />{scope.label}
                </button>
              );
            })}
            {query.trim().length > 0 && query.trim().length < 2 && (
              <span className="text-[10px] font-mono text-muted-foreground/30 ml-auto">
                Digite ao menos 2 caracteres
              </span>
            )}
          </div>
        </div>

        {/* Results area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary/50 mb-3" />
            <p className="text-sm font-mono text-muted-foreground/40">Buscando...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-destructive/20 bg-card">
            <AlertTriangle className="h-6 w-6 text-destructive/50 mb-3" />
            <p className="text-sm font-medium text-destructive/70 mb-3">{error}</p>
            <button
              onClick={() => doSearch(query, activeScope)}
              className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
            >
              <RefreshCw className="h-3 w-3" /> Tentar novamente
            </button>
          </div>
        ) : !searched ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-accent/5 border border-border/20 flex items-center justify-center mb-5">
              <Search className="h-6 w-6 text-muted-foreground/20" />
            </div>
            <p className="text-sm font-medium text-muted-foreground/40 mb-1.5">Busca operacional</p>
            <p className="text-xs font-mono text-muted-foreground/25 max-w-sm">
              Pesquise sessões, agentes, memória, arquivos e alertas em um único lugar
            </p>
            <div className="flex items-center gap-2 mt-6">
              <kbd className="text-[10px] font-mono px-2 py-1 rounded border border-border/20 text-muted-foreground/30 bg-accent/5">⌘</kbd>
              <kbd className="text-[10px] font-mono px-2 py-1 rounded border border-border/20 text-muted-foreground/30 bg-accent/5">K</kbd>
              <span className="text-[10px] font-mono text-muted-foreground/20 ml-1">acesso rápido</span>
            </div>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-border/30 bg-card">
            <Inbox className="h-6 w-6 text-muted-foreground/25 mb-3" />
            <p className="text-sm font-medium text-muted-foreground/50">
              Nenhum resultado para "<span className="text-foreground/70">{query}</span>"
            </p>
            <p className="text-xs font-mono text-muted-foreground/30 mt-1">Tente termos diferentes ou mude o escopo</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-mono text-muted-foreground/40">
                {filteredResults.length} resultado{filteredResults.length !== 1 ? "s" : ""}
              </span>
              <div className="flex-1 h-px bg-border/30" />
            </div>
            {filteredResults.map((r) => {
              const srcCfg = sourceConfig[r.source] || sourceConfig.unknown;
              return (
                <div
                  key={r.id}
                  onClick={() => handleResultClick(r)}
                  className="flex items-start gap-4 px-5 py-4 rounded-lg border border-border/30 bg-card hover:bg-accent/15 transition-colors cursor-pointer group"
                >
                  <Brain className="h-5 w-5 text-primary/50 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {highlightTerm(r.title, query)}
                    </h3>
                    <p className="text-xs text-foreground/45 leading-relaxed mt-1 line-clamp-2">
                      {highlightTerm(r.snippet, query)}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] font-mono ${srcCfg.class}`}>
                        {srcCfg.label}
                      </Badge>
                      {r.path && (
                        <span className="text-[10px] font-mono text-muted-foreground/30 truncate max-w-[200px]">
                          {r.path}
                        </span>
                      )}
                      {r.score != null && (
                        <span className="text-[10px] font-mono text-primary/40">
                          score: {r.score.toFixed(2)}
                        </span>
                      )}
                      {r.tags && r.tags.length > 0 && r.tags.slice(0, 3).map((t) => (
                        <Badge key={t} variant="outline" className="text-[9px] font-mono text-muted-foreground/30 border-border/20">
                          <Tag className="h-2 w-2 mr-0.5" />{t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/15 group-hover:text-muted-foreground/40 transition-colors shrink-0 mt-1" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail sheet for memory results */}
      <MemoryDetailSheet
        snapshot={selectedSnapshot}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </OrionLayout>
  );
};

export default SearchPage;
