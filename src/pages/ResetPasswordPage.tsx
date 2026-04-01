/**
 * ResetPasswordPage — Página para redefinir senha via token de recovery.
 * Rota pública: /reset-password
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, supabaseConfigured } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ShieldCheck, ShieldAlert, ArrowLeft, KeyRound } from "lucide-react";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasRecoveryToken, setHasRecoveryToken] = useState(false);

  // Detect recovery token in URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setHasRecoveryToken(true);
    }
  }, []);

  if (!supabaseConfigured) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-4 rounded-lg border border-border bg-card p-8 text-center space-y-4">
          <ShieldAlert className="h-8 w-8 text-status-warning mx-auto" />
          <h1 className="text-lg font-bold text-foreground">Backend Não Configurado</h1>
          <p className="text-sm text-muted-foreground">Redefinição de senha requer Supabase configurado.</p>
          <Button variant="outline" size="sm" onClick={() => navigate("/login")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar ao login
          </Button>
        </div>
      </div>
    );
  }

  if (!hasRecoveryToken) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-4 rounded-lg border border-border bg-card p-8 text-center space-y-4">
          <KeyRound className="h-8 w-8 text-muted-foreground/40 mx-auto" />
          <h1 className="text-lg font-bold text-foreground">Link Inválido</h1>
          <p className="text-sm text-muted-foreground">
            Esta página só pode ser acessada através do link enviado por email.
            Use a opção "Esqueci a senha" na tela de login.
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate("/login")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Ir para login
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-4 rounded-lg border border-border bg-card p-8 text-center space-y-4">
          <ShieldCheck className="h-8 w-8 text-status-online mx-auto" />
          <h1 className="text-lg font-bold text-foreground">Senha Atualizada</h1>
          <p className="text-sm text-muted-foreground">Sua senha foi redefinida com sucesso.</p>
          <Button onClick={() => navigate("/")} className="gap-2">
            Ir para o Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      return setError("A senha deve ter pelo menos 6 caracteres.");
    }
    if (password !== confirmPassword) {
      return setError("As senhas não coincidem.");
    }

    setLoading(true);
    const { error: err } = await supabase!.auth.updateUser({ password });
    setLoading(false);

    if (err) {
      setError(err.message);
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="max-w-sm w-full mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold text-sm">⬡</span>
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-foreground">ORION</span>
          </div>
          <h1 className="text-sm font-medium text-muted-foreground">Redefinir Senha</h1>
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Nova Senha</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Confirmar Senha</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              className="bg-background"
            />
          </div>

          {error && (
            <div className="rounded-md bg-status-critical/10 border border-status-critical/20 px-3 py-2 text-xs text-status-critical">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Redefinir Senha
          </Button>

          <div className="text-center">
            <button type="button" onClick={() => navigate("/login")} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mx-auto">
              <ArrowLeft className="h-3 w-3" /> Voltar ao login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
