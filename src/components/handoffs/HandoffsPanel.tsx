/**
 * HandoffsPanel — visualização de passagens de tarefa entre agentes.
 *
 * - Sem JSON bruto.
 * - Sem prompts internos.
 * - Empty state honesto se a API ainda não existir.
 * - Pode ser filtrado por agente (modo "agente em foco").
 */
import { useEffect, useState, useCallback } from "react";
import { ArrowRight, Clock, CheckCircle2, AlertCircle, XCircle, RefreshCw, Inbox, GitBranch, FileQuestion } from "lucide-react";
import { fetchHandoffs, filterHandoffsByAgent, type HandoffItem, type HandoffStatus, type HandoffsResult } from "@/domains/handoffs/fetcher";

interface Props {
  /** Se passado, filtra apenas handoffs onde o agente é origem ou destino. */
  agentId?: string;
  /** Compacto (lateral) vs completo (página). */
  variant?: "panel" | "compact";
}

const STATUS_META: Record<HandoffStatus, { Icon: typeof Clock; color: string; label: string; bg: string }> = {
  pending: { Icon: Clock, color: "text-status-warning", label: "Pendente", bg: "bg-status-warning/10 border-status-warning/30" },
  in_progress: { Icon: RefreshCw, color: "text-primary", label: "Em andamento", bg: "bg-primary/10 border-primary/30" },
  accepted: { Icon: CheckCircle2, color: "text-status-info", label: "Aceito", bg: "bg-status-info/10 border-status-info/30" },
  rejected: { Icon: XCircle, color: "text-status-error", label: "Rejeitado", bg: "bg-status-error/10 border-status-error/30" },
  completed: { Icon: CheckCircle2, color: "text-status-success", label: "Concluído", bg: "bg-status-success/10 border-status-success/30" },
  unknown: { Icon: AlertCircle, color: "text-muted-foreground", label: "—", bg: "bg-muted/20 border-border/40" },
};

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

function HandoffCard({ h, compact }: { h: HandoffItem; compact: boolean }) {
  const meta = STATUS_META[h.status];
  return (
    <div className={`rounded border ${meta.bg} p-3 space-y-2`}>
      {/* Header: status + time */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <meta.Icon className={`h-3 w-3 ${meta.color} shrink-0`} />
          <span className={`text-[11px] font-bold uppercase ${meta.color}`}>{meta.label}</span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground/50">
          {formatTime(h.updatedAt || h.createdAt)}
        </span>
      </div>

      {/* Task */}
      <div>
        <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2">{h.task}</p>
        {h.context && !compact && (
          <p className="text-[11px] text-muted-foreground/70 mt-1 line-clamp-3 leading-relaxed">{h.context}</p>
        )}
      </div>

      {/* From → To */}
      <div className="flex items-center gap-2 text-[10px] font-mono">
        <div className="flex-1 min-w-0">
          <p className="text-muted-foreground/40 uppercase">De</p>
          <p className="text-foreground/80 truncate">{h.fromAgentName || "—"}</p>
        </div>
        <ArrowRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
        <div className="flex-1 min-w-0 text-right">
          <p className="text-muted-foreground/40 uppercase">Para</p>
          <p className="text-foreground/80 truncate">{h.toAgentName || "—"}</p>
        </div>
      </div>

      {/* Acceptance criteria */}
      {h.acceptanceCriteria.length > 0 && !compact && (
        <div className="pt-2 border-t border-border/20">
          <p className="text-[10px] font-mono text-muted-foreground/40 uppercase mb-1">Critérios de aceite</p>
          <ul className="space-y-0.5">
            {h.acceptanceCriteria.slice(0, 4).map((c, i) => (
              <li key={i} className="text-[11px] text-foreground/70 flex items-start gap-1.5">
                <span className="text-primary/60 mt-0.5">•</span>
                <span className="line-clamp-2">{c}</span>
              </li>
            ))}
            {h.acceptanceCriteria.length > 4 && (
              <li className="text-[10px] text-muted-foreground/40">+{h.acceptanceCriteria.length - 4} restante(s)</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export function HandoffsPanel({ agentId, variant = "panel" }: Props) {
  const [result, setResult] = useState<HandoffsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const compact = variant === "compact";

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetchHandoffs();
    setResult(r);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const items = result?.items ?? [];
  const filtered = agentId ? filterHandoffsByAgent(items, agentId) : items;

  return (
    <div className={compact ? "" : "orion-card p-5"}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Handoffs</h3>
          {result?.apiState === "available" && (
            <span className="orion-badge orion-badge-info">{filtered.length}</span>
          )}
          {result?.apiState === "pending" && (
            <span className="orion-badge border-status-warning/30 text-status-warning bg-status-warning/10">
              Endpoint pendente
            </span>
          )}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="text-[10px] font-mono px-2 py-0.5 rounded bg-card border border-border/30 text-muted-foreground hover:text-foreground hover:border-border/60 transition-colors flex items-center gap-1 disabled:opacity-50"
        >
          <RefreshCw className={`h-2.5 w-2.5 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      {!compact && (
        <p className="text-[11px] text-muted-foreground/60 mb-3">
          Passagens de tarefa entre agentes — origem, destino, critérios de aceite e status reais
        </p>
      )}

      {/* States */}
      {loading && (
        <div className="py-8 flex items-center justify-center text-xs font-mono text-muted-foreground/50">
          <RefreshCw className="h-3 w-3 animate-spin mr-2" />
          Carregando handoffs…
        </div>
      )}

      {!loading && result?.apiState === "pending" && (
        <div className="py-8 flex flex-col items-center justify-center text-center px-4">
          <FileQuestion className="h-6 w-6 text-muted-foreground/40 mb-2" />
          <p className="text-xs font-mono text-muted-foreground/60">Endpoint de handoffs pendente no backend</p>
          <p className="text-[10px] font-mono text-muted-foreground/40 mt-1 max-w-md">
            A UI está preparada — quando o OpenClaw expor <code className="text-primary/70">/api/handoffs</code>,
            os dados aparecem aqui automaticamente. Sem dados sintéticos.
          </p>
        </div>
      )}

      {!loading && result?.apiState === "error" && (
        <div className="py-6 text-center">
          <AlertCircle className="h-5 w-5 text-status-error/60 mx-auto mb-2" />
          <p className="text-xs font-mono text-muted-foreground/60">Falha ao consultar handoffs</p>
          {result.error && <p className="text-[10px] font-mono text-muted-foreground/40 mt-1">{result.error}</p>}
        </div>
      )}

      {!loading && result?.apiState === "available" && filtered.length === 0 && (
        <div className="py-8 flex flex-col items-center justify-center text-center">
          <Inbox className="h-5 w-5 text-muted-foreground/30 mb-2" />
          <p className="text-xs font-mono text-muted-foreground/50">
            {agentId ? "Nenhum handoff para este agente" : "Nenhum handoff registrado"}
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className={`grid gap-2 ${compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
          {filtered.map(h => (
            <HandoffCard key={h.id} h={h} compact={compact} />
          ))}
        </div>
      )}
    </div>
  );
}
