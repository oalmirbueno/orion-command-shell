import { useState, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Copy, Check, ChevronDown, ChevronUp, FileText, AlertCircle, Clock, Tag, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiUrl } from "@/domains/api";
import type { MemorySnapshot } from "@/domains/memory/types";

interface Props {
  snapshot: MemorySnapshot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categoryColors: Record<string, string> = {
  context: "bg-primary/15 text-primary border-primary/30",
  decision: "bg-[hsl(var(--status-warning))]/15 text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning))]/30",
  learning: "bg-[hsl(var(--status-success))]/15 text-[hsl(var(--status-success))] border-[hsl(var(--status-success))]/30",
  profile: "bg-accent-foreground/15 text-accent-foreground border-accent-foreground/30",
  config: "bg-secondary-foreground/15 text-secondary-foreground border-secondary-foreground/30",
  incident: "bg-destructive/15 text-destructive border-destructive/30",
};

const relevanceColors: Record<string, string> = {
  high: "bg-destructive/15 text-destructive border-destructive/30",
  medium: "bg-[hsl(var(--status-warning))]/15 text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning))]/30",
  low: "bg-muted text-muted-foreground border-border",
};

export function MemoryDetailSheet({ snapshot, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [fullContent, setFullContent] = useState<string | null>(null);
  const [contentState, setContentState] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [contentError, setContentError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const resetState = useCallback(() => {
    setFullContent(null);
    setContentState("idle");
    setContentError("");
    setExpanded(false);
    setCopied(false);
  }, []);

  const handleOpenChange = (v: boolean) => {
    if (!v) resetState();
    onOpenChange(v);
  };

  if (!snapshot) return null;

  // Heuristic: try to find the real file for this snapshot
  const guessFilePath = () => {
    const slug = snapshot.id || snapshot.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60);
    return `memory/${slug}.md`;
  };

  const fetchFullContent = async () => {
    setContentState("loading");
    setContentError("");
    try {
      // Try dedicated memory endpoint first, then files fallback
      const endpoints = [
        apiUrl(`/memory/${snapshot.id}`),
        apiUrl(`/memory/search?id=${snapshot.id}`),
        apiUrl(`/files?path=${encodeURIComponent(guessFilePath())}`),
      ];

      let content: string | null = null;

      for (const url of endpoints) {
        try {
          const res = await fetch(url, { headers: { Accept: "application/json" } });
          if (!res.ok) continue;
          const data = await res.json();
          // Extract content from various shapes
          const raw = data?.content || data?.context || data?.body || data?.text;
          if (raw && typeof raw === "string" && raw.length > 0) {
            content = raw;
            break;
          }
          // If it's an array (search results), take first
          if (Array.isArray(data) && data[0]?.content) {
            content = data[0].content;
            break;
          }
        } catch {
          continue;
        }
      }

      if (content) {
        setFullContent(content);
        setContentState("loaded");
      } else {
        // Use context as best available content
        setFullContent(snapshot.context);
        setContentState("loaded");
      }
    } catch {
      setContentError("Falha ao carregar conteúdo completo");
      setContentState("error");
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ title: "Copiado!" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Erro ao copiar", variant: "destructive" });
    }
  };

  const renderMarkdown = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("### ")) return <h4 key={i} className="text-sm font-semibold text-foreground mt-3 mb-1">{line.slice(4)}</h4>;
      if (line.startsWith("## ")) return <h3 key={i} className="text-base font-semibold text-foreground mt-4 mb-1">{line.slice(3)}</h3>;
      if (line.startsWith("# ")) return <h2 key={i} className="text-lg font-bold text-foreground mt-4 mb-2">{line.slice(2)}</h2>;
      if (line.startsWith("- ")) return <li key={i} className="text-sm text-foreground/70 ml-4 list-disc leading-relaxed">{line.slice(2)}</li>;
      if (line.startsWith("* ")) return <li key={i} className="text-sm text-foreground/70 ml-4 list-disc leading-relaxed">{line.slice(2)}</li>;
      if (line.startsWith("> ")) return <blockquote key={i} className="border-l-2 border-primary/40 pl-3 text-sm text-foreground/60 italic my-1">{line.slice(2)}</blockquote>;
      if (line.startsWith("```")) return <hr key={i} className="border-border/30 my-2" />;
      if (line.match(/^\d+\. /)) return <li key={i} className="text-sm text-foreground/70 ml-4 list-decimal leading-relaxed">{line.replace(/^\d+\. /, "")}</li>;
      if (line.trim() === "") return <div key={i} className="h-2" />;
      // Inline code
      const rendered = line.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-muted text-primary font-mono text-xs">$1</code>');
      if (rendered !== line) return <p key={i} className="text-sm text-foreground/70 leading-relaxed" dangerouslySetInnerHTML={{ __html: rendered }} />;
      return <p key={i} className="text-sm text-foreground/70 leading-relaxed">{line}</p>;
    });
  };

  const displayContent = fullContent || snapshot.context;
  const isPreviewOnly = contentState === "idle";
  const previewText = snapshot.context.length > 300 && isPreviewOnly
    ? snapshot.context.slice(0, 300) + "…"
    : snapshot.context;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="bg-card border-border w-full sm:max-w-lg p-0 flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-border/40">
          <SheetHeader>
            <SheetTitle className="text-foreground text-lg leading-tight pr-8">
              {snapshot.title}
            </SheetTitle>
          </SheetHeader>

          <div className="flex items-center gap-2 flex-wrap mt-3">
            <Badge className={`text-[10px] font-mono uppercase tracking-wider border ${categoryColors[snapshot.category] || "bg-muted text-muted-foreground border-border"}`}>
              {snapshot.category}
            </Badge>
            <Badge className={`text-[10px] font-mono uppercase tracking-wider border ${relevanceColors[snapshot.relevance] || "bg-muted text-muted-foreground border-border"}`}>
              <Sparkles className="w-3 h-3 mr-1" />
              {snapshot.relevance}
            </Badge>
          </div>
        </div>

        {/* Scrollable body */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-5">
            {/* Metadata */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span className="font-mono">{snapshot.capturedAgo}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span className="font-mono">{snapshot.source}</span>
              </div>
            </div>

            {/* Tags */}
            {snapshot.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {snapshot.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/60 border border-border/40 text-[10px] font-mono text-muted-foreground">
                    <Tag className="w-2.5 h-2.5" />{tag}
                  </span>
                ))}
              </div>
            )}

            <Separator className="bg-border/40" />

            {/* Summary */}
            <div className="rounded-lg border border-border/40 bg-muted/30 p-4">
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60 mb-2">Resumo</h4>
              <p className="text-sm text-foreground/80 leading-relaxed">{snapshot.summary}</p>
            </div>

            {/* Content preview / full */}
            <div className="rounded-lg border border-border/40 bg-muted/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
                  {contentState === "loaded" ? "Conteúdo completo" : "Preview"}
                </h4>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => handleCopy(displayContent)}
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[hsl(var(--status-success))]" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                  {contentState === "loaded" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => setExpanded(!expanded)}
                    >
                      {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </Button>
                  )}
                </div>
              </div>

              {/* Content area */}
              <div className={expanded ? "" : "max-h-80 overflow-y-auto"}>
                {contentState === "loading" ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-3/5" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ) : contentState === "error" ? (
                  <div className="flex items-center gap-2 text-destructive text-sm py-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{contentError}</span>
                  </div>
                ) : contentState === "loaded" ? (
                  renderMarkdown(displayContent)
                ) : (
                  /* Preview state */
                  <>
                    {renderMarkdown(previewText)}
                    {snapshot.context.length > 300 && (
                      <p className="text-xs text-muted-foreground/40 mt-1 italic">Conteúdo truncado</p>
                    )}
                  </>
                )}
              </div>

              {/* Load full button */}
              {contentState === "idle" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4 text-xs border-border/50 text-muted-foreground hover:text-foreground"
                  onClick={fetchFullContent}
                >
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  Ver completo
                </Button>
              )}
            </div>

            {/* Footer metadata */}
            <div className="text-[10px] font-mono text-muted-foreground/30 pt-2">
              ID: {snapshot.id} · {snapshot.capturedAt}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
