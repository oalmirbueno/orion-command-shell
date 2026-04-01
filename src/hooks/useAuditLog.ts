/**
 * useAuditLog — Registra e consulta ações auditáveis.
 *
 * Com Supabase configurado: persiste via função log_audit (security definer).
 * Sem Supabase: fallback honesto — log apenas no console, sem fingir persistência.
 */

import { useCallback, useState } from "react";
import { supabase, supabaseConfigured } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface AuditEntry {
  id: string;
  action: string;
  domain: string;
  target_id: string;
  meta: Record<string, unknown>;
  created_at: string;
  user_id: string | null;
}

interface UseAuditLogReturn {
  /** Registra uma ação auditável */
  logAction: (action: string, domain?: string, targetId?: string, meta?: Record<string, unknown>) => Promise<void>;
  /** Busca histórico paginado */
  fetchHistory: (opts?: { page?: number; pageSize?: number; domain?: string }) => Promise<{ entries: AuditEntry[]; total: number }>;
  /** Modo de operação */
  mode: "supabase" | "memory";
}

export function useAuditLog(): UseAuditLogReturn {
  const { user } = useAuth();
  const mode = supabaseConfigured && user ? "supabase" : "memory";

  const logAction = useCallback(
    async (action: string, domain = "", targetId = "", meta: Record<string, unknown> = {}) => {
      if (mode === "supabase" && supabase) {
        try {
          await supabase.rpc("log_audit", {
            _action: action,
            _domain: domain,
            _target: targetId,
            _meta: meta,
          });
        } catch (err) {
          console.warn("[audit] falha ao persistir:", err);
        }
      } else {
        console.info("[audit]", action, domain, targetId, meta);
      }
    },
    [mode],
  );

  const fetchHistory = useCallback(
    async (opts?: { page?: number; pageSize?: number; domain?: string }) => {
      if (mode !== "supabase" || !supabase) {
        return { entries: [], total: 0 };
      }

      const page = opts?.page ?? 1;
      const pageSize = opts?.pageSize ?? 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      try {
        let query = supabase
          .from("audit_log")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(from, to);

        if (opts?.domain) {
          query = query.eq("domain", opts.domain);
        }

        const { data, count, error } = await query;
        if (error) throw error;

        return {
          entries: (data ?? []) as AuditEntry[],
          total: count ?? 0,
        };
      } catch (err) {
        console.warn("[audit] falha ao buscar histórico:", err);
        return { entries: [], total: 0 };
      }
    },
    [mode],
  );

  return { logAction, fetchHistory, mode };
}
