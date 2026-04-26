/**
 * AgentUploadsPanel — UI de uploads por agente.
 *
 * Lista uploads existentes e permite enviar novos arquivos.
 * Empty state honesto quando o endpoint ainda não existe no backend.
 * Não armazena nada localmente: tudo passa pela API real.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { Upload, FileText, Loader2, AlertCircle, CheckCircle2, Clock, XCircle, RefreshCw, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  fetchAgentUploads,
  uploadAgentFile,
  formatBytes,
  type UploadItem,
  type UploadsResult,
} from "@/domains/uploads/fetcher";

interface Props {
  agentId: string;
  agentName: string;
}

const STATUS_META = {
  uploaded: { Icon: CheckCircle2, label: "Pronto", cls: "text-status-success border-status-success/30 bg-status-success/10" },
  processing: { Icon: Clock, label: "Processando", cls: "text-status-warning border-status-warning/30 bg-status-warning/10" },
  failed: { Icon: XCircle, label: "Falhou", cls: "text-status-error border-status-error/30 bg-status-error/10" },
  unknown: { Icon: AlertCircle, label: "—", cls: "text-muted-foreground border-border/30 bg-muted/20" },
} as const;

export function AgentUploadsPanel({ agentId, agentName }: Props) {
  const [result, setResult] = useState<UploadsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetchAgentUploads(agentId);
      setResult(r);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    setUploading(true);
    let successes = 0;
    let failures = 0;

    for (const file of list) {
      // Guard: 25MB safety limit (UI side; backend should enforce real limit)
      if (file.size > 25 * 1024 * 1024) {
        toast({ title: `"${file.name}" excede 25MB`, variant: "destructive" });
        failures++;
        continue;
      }
      const r = await uploadAgentFile(agentId, file);
      if (r.ok) successes++;
      else {
        failures++;
        toast({
          title: `Falha ao enviar "${file.name}"`,
          description: r.error || "Endpoint de upload indisponível",
          variant: "destructive",
        });
      }
    }
    setUploading(false);
    if (successes > 0) {
      toast({ title: `${successes} arquivo(s) enviado(s) para ${agentName}` });
      load();
    }
  }, [agentId, agentName, load]);

  const onPick = () => fileInputRef.current?.click();

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  const apiState = result?.apiState ?? "pending";
  const items = result?.items ?? [];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="h-3.5 w-3.5 text-muted-foreground/60" />
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/70">
            Uploads do Agente
          </span>
          <Badge
            variant="outline"
            className={`text-[9px] font-mono px-1.5 py-0 ${
              apiState === "available"
                ? "border-status-online/40 text-status-online"
                : apiState === "error"
                ? "border-status-error/40 text-status-error"
                : "border-border/30 text-muted-foreground/50"
            }`}
          >
            {apiState === "available" ? "API LIVE" : apiState === "error" ? "API ERROR" : "PENDENTE"}
          </Badge>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={load}
          disabled={loading}
          className="h-6 px-2 text-[10px] font-mono"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`rounded-lg border-2 border-dashed p-5 text-center transition-colors ${
          dragOver
            ? "border-primary/60 bg-primary/5"
            : "border-border/40 bg-surface-2/30 hover:border-border/60"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={onInputChange}
        />
        <Upload className="h-5 w-5 text-muted-foreground/50 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground/70 mb-2">
          Arraste arquivos aqui ou
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={onPick}
          disabled={uploading}
          className="h-7 text-[11px]"
        >
          {uploading ? (
            <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> Enviando…</>
          ) : (
            <>Selecionar arquivos</>
          )}
        </Button>
        <p className="text-[10px] text-muted-foreground/40 mt-2 font-mono">
          Limite seguro: 25 MB por arquivo
        </p>
      </div>

      {/* Empty / Pending state */}
      {apiState === "pending" && (
        <div className="rounded-lg border border-border/30 bg-surface-2/40 p-4 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-muted-foreground/60 mt-0.5 shrink-0" />
          <div className="text-[11px] text-muted-foreground/70 space-y-1">
            <p className="font-medium text-foreground/80">Endpoint de uploads ainda não disponível</p>
            <p>
              A UI está pronta para consumir <code className="text-[10px] bg-muted/40 px-1 rounded">/agents/:id/uploads</code> ou{" "}
              <code className="text-[10px] bg-muted/40 px-1 rounded">/uploads</code> assim que o backend expor.
              Tentativas de envio serão rejeitadas até lá — sem armazenamento local.
            </p>
          </div>
        </div>
      )}

      {apiState === "error" && (
        <div className="rounded-lg border border-status-error/30 bg-status-error/5 p-3 flex items-center gap-2">
          <XCircle className="h-3.5 w-3.5 text-status-error" />
          <span className="text-[11px] text-status-error">
            Erro ao consultar uploads: {result?.error}
          </span>
        </div>
      )}

      {/* List */}
      {apiState === "available" && (
        <>
          {items.length === 0 ? (
            <div className="rounded-lg border border-border/30 bg-surface-2/30 p-6 text-center">
              <FileText className="h-5 w-5 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground/60">Nenhum arquivo enviado ainda</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border/30 divide-y divide-border/20">
              {items.map((item) => {
                const meta = STATUS_META[item.status] ?? STATUS_META.unknown;
                const Icon = meta.Icon;
                return (
                  <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-2/40">
                    <FileText className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[12px] text-foreground/90 truncate hover:text-primary"
                          >
                            {item.name}
                          </a>
                        ) : (
                          <span className="text-[12px] text-foreground/90 truncate">{item.name}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono text-muted-foreground/50">
                          {formatBytes(item.sizeBytes)}
                        </span>
                        {item.mimeType && (
                          <span className="text-[10px] font-mono text-muted-foreground/40">
                            · {item.mimeType}
                          </span>
                        )}
                        {item.uploadedAt && (
                          <span className="text-[10px] font-mono text-muted-foreground/40">
                            · {new Date(item.uploadedAt).toLocaleString("pt-BR")}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[9px] font-mono px-1.5 py-0 ${meta.cls}`}>
                      <Icon className="h-2.5 w-2.5 mr-1" />
                      {meta.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
