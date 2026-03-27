import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { MemorySnapshot } from "@/domains/memory/types";

interface Props {
  snapshot: MemorySnapshot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MemoryDetailSheet({ snapshot, open, onOpenChange }: Props) {
  if (!snapshot) return null;

  // Simple markdown-like rendering
  const renderContent = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("# ")) return <h2 key={i} className="text-base font-bold text-foreground mt-3 mb-1">{line.slice(2)}</h2>;
      if (line.startsWith("## ")) return <h3 key={i} className="text-sm font-semibold text-foreground mt-2 mb-1">{line.slice(3)}</h3>;
      if (line.startsWith("- ")) return <li key={i} className="text-sm text-foreground/70 ml-4 list-disc">{line.slice(2)}</li>;
      if (line.startsWith("```")) return <hr key={i} className="border-border/20 my-2" />;
      return <p key={i} className="text-sm text-foreground/70 leading-relaxed">{line || "\u00A0"}</p>;
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-border overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-foreground">{snapshot.title}</SheetTitle>
        </SheetHeader>
        <div className="space-y-5 mt-6">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="orion-badge orion-badge-info">{snapshot.category}</span>
            <span className="text-xs font-mono text-muted-foreground/40">{snapshot.capturedAt} · {snapshot.capturedAgo}</span>
          </div>

          <div className="rounded-lg border border-border/40 bg-surface-2 p-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground/50 mb-3">Resumo</h4>
            <p className="text-sm text-foreground/70 leading-relaxed">{snapshot.summary}</p>
          </div>

          <div className="rounded-lg border border-border/40 bg-surface-2 p-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground/50 mb-3">Conteúdo</h4>
            <div className="max-h-96 overflow-y-auto">
              {renderContent(snapshot.context)}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {snapshot.tags.map(tag => <span key={tag} className="orion-tag">{tag}</span>)}
          </div>

          <div className="text-xs font-mono text-muted-foreground/30">
            Fonte: {snapshot.source} · Relevância: {snapshot.relevance}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
