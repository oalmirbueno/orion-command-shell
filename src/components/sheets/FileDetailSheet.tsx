import { useState, useCallback, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  FileText, Copy, Check, ChevronDown, ChevronUp, AlertCircle,
  Download, Image as ImageIcon, Code, FileJson, FileType2, Settings, Terminal
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiUrl } from "@/domains/api";
import type { FileEntry } from "@/domains/files/types";

interface Props {
  file: FileEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* ── type badge colors ── */
const typeConfig: Record<string, { icon: React.ReactNode; class: string }> = {
  document: { icon: <FileText className="h-3 w-3" />, class: "bg-primary/15 text-primary border-primary/30" },
  config:   { icon: <Settings className="h-3 w-3" />, class: "bg-[hsl(var(--status-warning))]/15 text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning))]/30" },
  image:    { icon: <ImageIcon className="h-3 w-3" />, class: "bg-[hsl(var(--status-success))]/15 text-[hsl(var(--status-success))] border-[hsl(var(--status-success))]/30" },
  log:      { icon: <Terminal className="h-3 w-3" />, class: "bg-muted text-muted-foreground border-border" },
  data:     { icon: <FileJson className="h-3 w-3" />, class: "bg-accent-foreground/15 text-accent-foreground border-accent-foreground/30" },
  script:   { icon: <Code className="h-3 w-3" />, class: "bg-destructive/15 text-destructive border-destructive/30" },
};

const defaultType = { icon: <FileType2 className="h-3 w-3" />, class: "bg-muted text-muted-foreground border-border" };

/* ── file extension helpers ── */
const mdExts = ["md", "mdx"];
const codeExts = ["json", "ts", "tsx", "js", "jsx", "env", "yaml", "yml", "toml", "ini", "cfg", "sh", "bash", "py", "csv", "sql", "txt", "log", "xml", "html", "css"];
const imageExts = ["png", "jpg", "jpeg", "gif", "webp", "svg", "ico", "bmp"];
const previewableExts = [...mdExts, ...codeExts, ...imageExts];

function getExt(name: string) {
  return name.split(".").pop()?.toLowerCase() || "";
}

/* ── simple markdown renderer ── */
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const trimmed = line.trimStart();
    if (trimmed.startsWith("### ")) return <h3 key={i} className="text-sm font-semibold text-foreground mt-3 mb-1">{trimmed.slice(4)}</h3>;
    if (trimmed.startsWith("## ")) return <h2 key={i} className="text-base font-semibold text-foreground mt-4 mb-1">{trimmed.slice(3)}</h2>;
    if (trimmed.startsWith("# ")) return <h1 key={i} className="text-lg font-bold text-foreground mt-4 mb-2">{trimmed.slice(2)}</h1>;
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) return <li key={i} className="text-sm text-foreground/80 ml-4 list-disc">{trimmed.slice(2)}</li>;
    if (trimmed.startsWith("> ")) return <blockquote key={i} className="text-sm text-muted-foreground border-l-2 border-primary/40 pl-3 my-1 italic">{trimmed.slice(2)}</blockquote>;
    if (trimmed.startsWith("```")) return <Separator key={i} className="my-2 bg-border/30" />;
    if (trimmed === "") return <div key={i} className="h-2" />;
    // inline code
    const parts = line.split(/`([^`]+)`/g);
    if (parts.length > 1) {
      return (
        <p key={i} className="text-sm text-foreground/80 leading-relaxed">
          {parts.map((part, j) =>
            j % 2 === 1 ? <code key={j} className="px-1 py-0.5 rounded bg-surface-2 text-primary font-mono text-xs">{part}</code> : part
          )}
        </p>
      );
    }
    return <p key={i} className="text-sm text-foreground/80 leading-relaxed">{line}</p>;
  });
}

export function FileDetailSheet({ file, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [content, setContent] = useState<string | null>(null);
  const [contentState, setContentState] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [contentError, setContentError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const ext = file ? getExt(file.name) : "";
  const isImage = imageExts.includes(ext);
  const isMd = mdExts.includes(ext);
  const isCode = codeExts.includes(ext);
  const canPreview = previewableExts.includes(ext);

  const resetState = useCallback(() => {
    setContent(null);
    setContentState("idle");
    setContentError("");
    setExpanded(false);
    setCopied(false);
  }, []);

  const handleOpenChange = (v: boolean) => {
    if (!v) resetState();
    onOpenChange(v);
  };

  /* ── auto-fetch content on open ── */
  useEffect(() => {
    if (!file || !open || !canPreview || isImage) return;
    let cancelled = false;
    setContentState("loading");

    const encodedPath = encodeURIComponent(file.path);
    // Try candidate routes in order — backend may expose any of these
    const candidates = [
      apiUrl(`/files/read?path=${encodedPath}`),
      apiUrl(`/files/content?path=${encodedPath}`),
      apiUrl(`/files?path=${encodedPath}`),
    ];

    const tryFetch = async () => {
      for (const url of candidates) {
        try {
          const r = await fetch(url, { headers: { Accept: "text/plain, application/json" } });
          if (!r.ok) continue;

          const ct = r.headers.get("content-type") || "";
          // Guard: if backend returned HTML (SPA fallback / 404 page), skip
          if (ct.includes("text/html")) continue;

          const text = await r.text();
          // Extra guard: if it looks like an HTML page, skip
          if (text.trimStart().startsWith("<!DOCTYPE") || text.trimStart().startsWith("<html")) continue;

          if (!cancelled) {
            setContent(text);
            setContentState("loaded");
          }
          return;
        } catch {
          // try next candidate
        }
      }
      // All candidates failed
      if (!cancelled) {
        setContentError("Rota de conteúdo não disponível no backend");
        setContentState("error");
      }
    };

    tryFetch();
    return () => { cancelled = true; };
  }, [file?.path, open]);

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast({ title: "Conteúdo copiado" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Falha ao copiar", variant: "destructive" });
    }
  };

  const handleDownload = () => {
    if (!file) return;
    const encodedPath = encodeURIComponent(file.path);
    const url = apiUrl(`/files/read?path=${encodedPath}`);
    window.open(url, "_blank");
  };

  if (!file) return null;

  const tc = typeConfig[file.type] || defaultType;
  const imageUrl = isImage ? apiUrl(`/files/content?path=${encodeURIComponent(file.path)}`) : null;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="bg-card border-border overflow-hidden flex flex-col sm:max-w-lg">
        <SheetHeader className="shrink-0">
          <SheetTitle className="text-foreground flex items-center gap-2 text-base">
            <div className="h-8 w-8 rounded-lg bg-surface-2 border border-border/40 flex items-center justify-center">
              {tc.icon}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="truncate font-semibold">{file.name}</span>
              <span className="text-xs font-mono text-muted-foreground/50 truncate">{file.path}</span>
            </div>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-5 pb-6 mt-4">
            {/* ── Badges ── */}
            <div className="flex flex-wrap gap-2">
              <Badge className={`${tc.class} border text-xs gap-1`}>
                {tc.icon} {file.type}
              </Badge>
              <Badge className="bg-surface-2 text-muted-foreground border-border/40 text-xs font-mono">
                .{ext}
              </Badge>
            </div>

            {/* ── Metadata ── */}
            <div className="rounded-lg border border-border/40 bg-surface-2/50 p-4 space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground/50">Metadados</h4>
              <div className="grid grid-cols-2 gap-3">
                <MetaItem label="Tamanho" value={typeof file.size === "number" ? `${file.size} B` : file.size} />
                <MetaItem label="Modificado" value={file.modifiedAgo} />
                <MetaItem label="Data" value={file.modifiedAt} />
                {file.agent && <MetaItem label="Workspace" value={file.agent} />}
              </div>
              <div className="pt-1">
                <span className="text-xs text-muted-foreground/40">Path completo</span>
                <p className="text-xs font-mono text-foreground/60 break-all mt-0.5">{file.path}</p>
              </div>
            </div>

            {/* ── Image preview ── */}
            {isImage && imageUrl && (
              <div className="rounded-lg border border-border/40 bg-surface-2/50 p-4 space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground/50">Preview</h4>
                <div className="rounded-md overflow-hidden bg-background/50 flex items-center justify-center min-h-[120px]">
                  <img
                    src={imageUrl}
                    alt={file.name}
                    className="max-w-full max-h-80 object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              </div>
            )}

            {/* ── Text content ── */}
            {canPreview && !isImage && (
              <div className="rounded-lg border border-border/40 bg-surface-2/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground/50">Conteúdo</h4>
                  <div className="flex gap-1">
                    {contentState === "loaded" && content && (
                      <>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleCopy}>
                          {copied ? <Check className="h-3 w-3 text-[hsl(var(--status-success))]" /> : <Copy className="h-3 w-3" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setExpanded(!expanded)}>
                          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {contentState === "loading" && (
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full bg-surface-3" />
                    <Skeleton className="h-3 w-4/5 bg-surface-3" />
                    <Skeleton className="h-3 w-3/5 bg-surface-3" />
                    <Skeleton className="h-3 w-full bg-surface-3" />
                  </div>
                )}

                {contentState === "error" && (
                  <div className="flex items-center gap-2 text-destructive/80 py-4">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span className="text-xs">{contentError || "Erro ao carregar conteúdo"}</span>
                  </div>
                )}

                {contentState === "loaded" && content && (
                  <div className={`${expanded ? "max-h-[600px]" : "max-h-60"} overflow-y-auto transition-all duration-300`}>
                    {isMd ? (
                      <div className="space-y-0.5">{renderMarkdown(content)}</div>
                    ) : (
                      <pre className="text-xs font-mono text-foreground/70 whitespace-pre-wrap break-words leading-relaxed">{content}</pre>
                    )}
                  </div>
                )}

                {contentState === "loaded" && !content && (
                  <p className="text-xs text-muted-foreground/40 py-4">Arquivo vazio ou sem conteúdo legível</p>
                )}
              </div>
            )}

            {/* ── Non-previewable ── */}
            {!canPreview && (
              <div className="rounded-lg border border-border/40 bg-surface-2/50 p-4 text-center py-8">
                <FileType2 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground/50">Preview não disponível para este tipo de arquivo</p>
              </div>
            )}

            {/* ── Actions ── */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 h-9 text-xs border-border/40" onClick={handleDownload}>
                <Download className="h-3.5 w-3.5 mr-1.5" /> Abrir / Download
              </Button>
              {contentState === "loaded" && content && (
                <Button variant="outline" size="sm" className="h-9 text-xs border-border/40" onClick={handleCopy}>
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <span className="text-xs text-muted-foreground/40">{label}</span>
      <p className="text-sm font-mono text-foreground/80 truncate">{value}</p>
    </div>
  );
}
