/**
 * ProtectedRoute — Wrapper de rota protegida com checagem de role.
 *
 * Se Supabase não configurado → modo aberto com banner.
 * Se configurado e sem sessão → redireciona para /login.
 * Se rota exige role superior → mostra bloqueio.
 */
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole, ROUTE_PERMISSIONS, hasPermission } from "@/hooks/useUserRole";
import { Loader2, ShieldAlert, ShieldX } from "lucide-react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const location = useLocation();

  // Backend não configurado — modo aberto com aviso
  if (!configured) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-[100] bg-status-warning/10 border-b border-status-warning/20 px-4 py-1.5 flex items-center justify-center gap-2">
          <ShieldAlert className="h-3.5 w-3.5 text-status-warning" />
          <span className="text-[11px] font-mono text-status-warning">
            MODO ABERTO — Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.
          </span>
        </div>
        <div className="pt-8">{children}</div>
      </>
    );
  }

  if (loading || roleLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check route permission
  const requiredRole = ROUTE_PERMISSIONS[location.pathname];
  if (requiredRole && !hasPermission(role, requiredRole)) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-4 rounded-lg border border-border bg-card p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-lg bg-status-critical/10 border border-status-critical/20 flex items-center justify-center mx-auto">
            <ShieldX className="h-6 w-6 text-status-critical" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Acesso Restrito</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Esta página requer permissão de <strong className="text-foreground">{requiredRole}</strong>.
            Seu nível atual é <strong className="text-foreground">{role}</strong>.
          </p>
          <p className="text-xs text-muted-foreground/50 font-mono">
            Solicite acesso a um administrador do sistema.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
