/**
 * ProtectedRoute — Wrapper de rota protegida.
 *
 * Se Supabase não estiver configurado → renderiza children
 * com banner informativo (modo aberto).
 * Se configurado e sem sessão → redireciona para /login.
 */
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ShieldAlert } from "lucide-react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useAuth();

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

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
