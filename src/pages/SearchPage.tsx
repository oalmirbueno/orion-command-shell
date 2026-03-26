import { useState } from "react";
import { OrionLayout } from "@/components/OrionLayout";
import { OrionBreadcrumb } from "@/components/orion";
import {
  Search, Brain, Activity, Bot, FileText,
  Clock, ChevronRight, Inbox, AlertTriangle,
} from "lucide-react";

type SearchScope = "all" | "sessions" | "agents" | "memory" | "files" | "alerts";

const scopes: { value: SearchScope; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "Todos", icon: Search },
  { value: "sessions", label: "Sessões", icon: Activity },
  { value: "agents", label: "Agentes", icon: Bot },
  { value: "memory", label: "Memória", icon: Brain },
  { value: "files", label: "Arquivos", icon: FileText },
  { value: "alerts", label: "Alertas", icon: AlertTriangle },
];

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [activeScope, setActiveScope] = useState<SearchScope>("all");

  return (
    <OrionLayout title="Busca">
      <div className="space-y-8">
        <OrionBreadcrumb items={["Mission Control", "Busca"]} />

        {/* Search bar */}
        <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4">
            <Search className="h-5 w-5 text-muted-foreground/40 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar em todo o sistema..."
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground/30 outline-none w-full"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-xs font-mono text-muted-foreground/40 hover:text-foreground transition-colors px-2 py-1 rounded border border-border/20"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Scope filters */}
          <div className="flex items-center gap-1.5 px-6 py-3 border-t border-border/20 bg-accent/3">
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
                      : "text-muted-foreground/40 border-border/15 hover:border-border/30"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {scope.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results area */}
        {!query ? (
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
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-border/30 bg-card">
            <Inbox className="h-6 w-6 text-muted-foreground/25 mb-3" />
            <p className="text-sm font-medium text-muted-foreground/50">Aguardando conexão com API</p>
            <p className="text-xs font-mono text-muted-foreground/30 mt-1.5">
              A busca será conectada aos endpoints reais dos domínios
            </p>
          </div>
        )}

        {/* Recent searches placeholder */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-4 w-4 text-muted-foreground/30" />
            <h2 className="text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground/40">Buscas Recentes</h2>
            <div className="flex-1 h-px bg-border/30" />
          </div>
          <p className="text-xs font-mono text-muted-foreground/25 pl-7">Nenhuma busca registrada</p>
        </section>
      </div>
    </OrionLayout>
  );
};

export default SearchPage;
