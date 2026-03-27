import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FileText, Loader2 } from "lucide-react";
import { apiUrl } from "@/domains/api";
import type { FileEntry } from "@/domains/files/types";

interface Props {
  file: FileEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const previewableExts = ["md", "json", "txt", "log", "yaml", "yml", "toml", "env", "sh", "js", "ts", "py", "csv", "ini", "cfg"];

export function FileDetailSheet({ file, open, onOpenChange }: Props) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const ext = file?.name.split(".").pop()?.toLowerCase() || "";
  const isPreviewable = previewableExts.includes(ext);

  useEffect(() => {
    if (!file || !open || !isPreviewable) { setContent(null); return; }
    setLoading(true);
    fetch(apiUrl(`/files/content?path=${encodeURIComponent(file.path)}`), { headers: { Accept: "text/plain" } })
      .then(r => r.ok ? r.text() : Promise.reject())
      .then(text => setContent(text))
      .catch(() => setContent(null))
      .finally(() => setLoading(false));
  }, [file?.path, open]);

  if (!file) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-border overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5" /> {file.name}
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-5 mt-6">
          <Row label="Caminho" value={file.path} />
          <Row label="Tipo" value={file.type} />
          <Row label="Tamanho" value={file.size} />
          <Row label="Modificado" value={`${file.modifiedAt} (${file.modifiedAgo})`} />
          {file.agent && <Row label="Workspace" value={file.agent} />}

          {isPreviewable && (
            <div className="rounded-lg border border-border/40 bg-surface-2 p-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground/50 mb-3">Conteúdo</h4>
              {loading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground/30" /></div>
              ) : content ? (
                <pre className="text-xs font-mono text-foreground/70 whitespace-pre-wrap break-words leading-relaxed max-h-96 overflow-y-auto">{content}</pre>
              ) : (
                <p className="text-xs text-muted-foreground/40">Preview não disponível</p>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-xs text-muted-foreground/50 w-24 shrink-0">{label}</span>
      <span className="text-sm font-mono text-foreground/80 break-all">{value}</span>
    </div>
  );
}
