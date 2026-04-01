/**
 * NotificationHistory — Histórico paginado de notificações persistidas.
 * Usa a tabela notifications do Supabase quando disponível.
 * Fallback honesto quando sem persistência.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase, supabaseConfigured } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Bell, ChevronLeft, ChevronRight, Inbox } from "lucide-react";

interface HistoryEntry {
  id: string;
  type: string;
  severity: string;
  title: string;
  detail: string;
  read: boolean;
  dismissed: boolean;
  created_at: string;
}

const PAGE_SIZE = 15;

const severityDot: Record<string, string> = {
  critical: "bg-status-critical",
  warning: "bg-status-warning",
  success: "bg-status-online",
  info: "bg-primary/50",
};

export function NotificationHistory() {
  const { user } = useAuth();
  const canPersist = supabaseConfigured && !!user;

  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async () => {
    if (!canPersist || !supabase) return;
    setLoading(true);
    try {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, count, error } = await supabase
        .from("notifications")
        .select("id, type, severity, title, detail, read, dismissed, created_at", { count: "exact" })
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      setEntries((data ?? []) as HistoryEntry[]);
      setTotal(count ?? 0);
    } catch (err) {
      console.warn("[notification-history] erro:", err);
    } finally {
      setLoading(false);
    }
  }, [canPersist, page, user]);

  useEffect(() => { load(); }, [load]);

  if (!canPersist) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground/50">
        <Inbox className="h-6 w-6" />
        <p className="text-xs font-mono">Histórico indisponível — Supabase não configurado</p>
        <p className="text-[10px] font-mono text-muted-foreground/30">Configure as variáveis de ambiente para habilitar persistência</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground/50" />
          <h3 className="text-sm font-semibold text-foreground">Histórico de Notificações</h3>
          <span className="text-[10px] font-mono text-muted-foreground/40">
            {total} registro{total !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-surface-2 animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center py-12 gap-2 text-muted-foreground/40">
          <Inbox className="h-5 w-5" />
          <p className="text-xs font-mono">Nenhuma notificação registrada</p>
        </div>
      ) : (
        <div className="divide-y divide-border/30 rounded-lg border border-border bg-card">
          {entries.map((e) => (
            <div key={e.id} className={`flex items-center gap-3 px-4 py-3 ${e.dismissed ? "opacity-40" : e.read ? "opacity-60" : ""}`}>
              <div className={`w-2 h-2 rounded-full shrink-0 ${severityDot[e.severity] || "bg-muted"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{e.title || "—"}</p>
                <p className="text-[10px] font-mono text-muted-foreground/40 truncate">{e.detail || "—"}</p>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-[10px] font-mono text-muted-foreground/30 uppercase">{e.type}</span>
                <p className="text-[10px] font-mono text-muted-foreground/20">
                  {e.created_at ? new Date(e.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
                </p>
              </div>
              <div className="shrink-0 flex gap-1">
                {e.read && <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-muted text-muted-foreground/40">lida</span>}
                {e.dismissed && <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-muted text-muted-foreground/40">dispensada</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-1.5 rounded hover:bg-accent/40 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <span className="text-[10px] font-mono text-muted-foreground/50">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-1.5 rounded hover:bg-accent/40 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  );
}
