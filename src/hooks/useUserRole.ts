/**
 * useUserRole — Lê o role do usuário logado.
 * Fallback: "viewer" quando sem Supabase ou tabela não existe.
 */

import { useState, useEffect } from "react";
import { supabase, supabaseConfigured } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AppRole = "admin" | "operator" | "viewer";

export interface UseUserRoleResult {
  role: AppRole;
  loading: boolean;
  isAdmin: boolean;
  isOperator: boolean;
  isViewer: boolean;
  canWrite: boolean;   // admin or operator
  canManage: boolean;  // admin only
}

export function useUserRole(): UseUserRoleResult {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole>("viewer");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured || !supabase || !user) {
      setRole("viewer");
      return;
    }

    setLoading(true);
    supabase
      .rpc("get_user_role", { _user_id: user.id })
      .then(({ data, error }) => {
        if (error || !data) {
          // Table/function may not exist — default to viewer
          setRole("viewer");
        } else {
          setRole(data as AppRole);
        }
        setLoading(false);
      });
  }, [user?.id]);

  return {
    role,
    loading,
    isAdmin: role === "admin",
    isOperator: role === "operator",
    isViewer: role === "viewer",
    canWrite: role === "admin" || role === "operator",
    canManage: role === "admin",
  };
}

/**
 * Route permission map — defines minimum role for each route.
 * Routes not listed default to "viewer" (read access).
 */
export const ROUTE_PERMISSIONS: Record<string, AppRole> = {
  "/settings": "operator",
  "/pipelines": "operator",    // has "Run Now" action
  "/missions": "operator",     // has "Run Now" action
};

/**
 * Action permission map — defines minimum role for specific actions.
 */
export const ACTION_PERMISSIONS: Record<string, AppRole> = {
  "pipeline.run": "operator",
  "mission.run": "operator",
  "agent.restart": "operator",
  "agent.toggle": "operator",
  "notification.dismiss": "viewer",
  "notification.read": "viewer",
  "settings.view": "operator",
  "roles.manage": "admin",
};

/** Check if a role meets the minimum required */
export function hasPermission(userRole: AppRole, requiredRole: AppRole): boolean {
  const hierarchy: Record<AppRole, number> = { admin: 3, operator: 2, viewer: 1 };
  return hierarchy[userRole] >= hierarchy[requiredRole];
}
