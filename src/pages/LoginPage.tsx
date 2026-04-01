import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ShieldAlert, LogIn, UserPlus, ArrowLeft } from "lucide-react";

type Mode = "login" | "signup" | "reset";

const LoginPage = () => {
  const { signIn, signUp, resetPassword, configured } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!configured) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-4 rounded-lg border border-border bg-card p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-lg bg-status-warning/10 border border-status-warning/20 flex items-center justify-center mx-auto">
            <ShieldAlert className="h-6 w-6 text-status-warning" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Backend Não Configurado</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Para ativar autenticação, defina as variáveis de ambiente:
          </p>
          <div className="text-left bg-muted/30 rounded-md p-4 font-mono text-xs text-muted-foreground space-y-1">
            <p>VITE_SUPABASE_URL=https://seu-projeto.supabase.co</p>
            <p>VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (mode === "reset") {
      const { error: err } = await resetPassword(email);
      setLoading(false);
      if (err) return setError(err);
      setSuccess("Link de redefinição enviado para seu email.");
      return;
    }

    const fn = mode === "login" ? signIn : signUp;
    const { error: err } = await fn(email, password);
    setLoading(false);

    if (err) return setError(err);
    if (mode === "signup") {
      setSuccess("Conta criada! Verifique seu email para confirmar.");
    } else {
      navigate("/");
    }
  };

  const titles: Record<Mode, string> = {
    login: "Acesso ao Mission Control",
    signup: "Criar Conta",
    reset: "Redefinir Senha",
  };

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="max-w-sm w-full mx-4">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold text-sm">⬡</span>
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-foreground">ORION</span>
          </div>
          <h1 className="text-sm font-medium text-muted-foreground">{titles[mode]}</h1>
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              className="bg-background"
            />
          </div>

          {mode !== "reset" && (
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Senha</label>
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
          )}

          {error && (
            <div className="rounded-md bg-status-critical/10 border border-status-critical/20 px-3 py-2 text-xs text-status-critical">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md bg-status-online/10 border border-status-online/20 px-3 py-2 text-xs text-status-online">
              {success}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === "login" ? (
              <LogIn className="h-4 w-4" />
            ) : mode === "signup" ? (
              <UserPlus className="h-4 w-4" />
            ) : null}
            {mode === "login" ? "Entrar" : mode === "signup" ? "Criar Conta" : "Enviar Link"}
          </Button>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            {mode === "login" ? (
              <>
                <button type="button" onClick={() => { setMode("signup"); setError(null); setSuccess(null); }} className="hover:text-foreground transition-colors">
                  Criar conta
                </button>
                <button type="button" onClick={() => { setMode("reset"); setError(null); setSuccess(null); }} className="hover:text-foreground transition-colors">
                  Esqueci a senha
                </button>
              </>
            ) : (
              <button type="button" onClick={() => { setMode("login"); setError(null); setSuccess(null); }} className="hover:text-foreground transition-colors flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" /> Voltar ao login
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
