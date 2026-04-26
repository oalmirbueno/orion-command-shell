/**
 * SecurityPanel — painel read-only de postura de segurança do Mission Control.
 *
 * Roda checks reais contra a configuração atual e o backend.
 * Estados não-verificáveis aparecem como "não verificado", nunca como OK falso.
 */
import { useEffect, useState, useCallback } from "react";
import {
  Shield, RefreshCw, CheckCircle2, AlertTriangle, XCircle,
  HelpCircle, Lock, Cpu, EyeOff, Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  runSecurityAudit,
  type SecurityReport,
  type SecurityCheck,
  type CheckCategory,
  type CheckSeverity,
} from "@/domains/security/audit";

const SEVERITY_META: Record<CheckSeverity, { Icon: typeof CheckCircle2; cls: string; label: string }> = {
  ok:      { Icon: CheckCircle2, cls: "text-status-success border-status-success/30 bg-status-success/10", label: "OK" },
  warn:    { Icon: AlertTriangle, cls: "text-status-warning border-status-warning/30 bg-status-warning/10", label: "ATENÇÃO" },
  fail:    { Icon: XCircle, cls: "text-status-error border-status-error/30 bg-status-error/10", label: "FALHA" },
  unknown: { Icon: HelpCircle, cls: "text-muted-foreground border-border/40 bg-muted/20", label: "NÃO VERIFICADO" },
};

const CATEGORY_META: Record<CheckCategory, { Icon: typeof Lock; label: string }> = {
  transport: { Icon: Lock, label: "Transporte" },
  runtime:   { Icon: Cpu, label: "Runtime" },
  exposure:  { Icon: EyeOff, label: "Exposição" },
  backend:   { Icon: Server, label: "Backend" },
};

export function SecurityPanel() {
  const [report, setReport] = useState<SecurityReport | null>(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    try {
      const r = await runSecurityAudit();
      setReport(r);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { run(); }, [run]);

  const groups = (report?.checks ?? []).reduce<Record<CheckCategory, SecurityCheck[]>>(
    (acc, c) => {
      (acc[c.category] ||= []).push(c);
      return acc;
    },
    { transport: [], runtime: [], exposure: [], backend: [] }
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-mono uppercase tracking-wider text-foreground/90">
            Postura de Segurança
          </h2>
          {report && (
            <Badge variant="outline" className="text-[10px] font-mono border-border/40 text-muted-foreground/60">
              {report.generatedAt.toLocaleTimeString("pt-BR")}
            </Badge>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={run} disabled={loading} className="h-7 text-xs">
          <RefreshCw className={`h-3 w-3 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Re-auditar
        </Button>
      </div>

      {/* Summary */}
      {report && (
        <div className="grid grid-cols-4 gap-2">
          {(["ok", "warn", "fail", "unknown"] as CheckSeverity[]).map(sev => {
            const meta = SEVERITY_META[sev];
            const Icon = meta.Icon;
            const count = report.summary[sev];
            return (
              <div key={sev} className={`rounded-lg border p-3 ${meta.cls}`}>
                <div className="flex items-center justify-between">
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-lg font-mono font-semibold">{count}</span>
                </div>
                <div className="text-[9px] font-mono uppercase tracking-wider mt-1 opacity-70">
                  {meta.label}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Disclaimer */}
      <div className="rounded-lg border border-border/30 bg-surface-2/40 p-3 text-[11px] text-muted-foreground/70">
        <span className="font-mono uppercase tracking-wider text-muted-foreground/60 mr-2">Nota:</span>
        Estes checks observam apenas a postura visível pelo cliente (TLS, perfil de runtime,
        heurísticas de exposição, alcance do backend). RLS, políticas de acesso e segredos
        do servidor são auditados no backend e no banco, não aqui.
      </div>

      {/* Groups */}
      {!report && loading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 rounded-lg bg-muted/30 animate-pulse" />
          ))}
        </div>
      )}

      {report && (
        <div className="space-y-4">
          {(Object.keys(groups) as CheckCategory[]).map(cat => {
            const items = groups[cat];
            if (items.length === 0) return null;
            const catMeta = CATEGORY_META[cat];
            const CatIcon = catMeta.Icon;
            return (
              <section key={cat} className="space-y-2">
                <div className="flex items-center gap-2">
                  <CatIcon className="h-3 w-3 text-muted-foreground/60" />
                  <h3 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">
                    {catMeta.label}
                  </h3>
                </div>
                <div className="rounded-lg border border-border/30 divide-y divide-border/20">
                  {items.map(check => {
                    const meta = SEVERITY_META[check.severity];
                    const Icon = meta.Icon;
                    return (
                      <div key={check.id} className="px-3 py-2.5 hover:bg-surface-2/40">
                        <div className="flex items-start gap-3">
                          <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${meta.cls.split(" ")[0]}`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-foreground/90">{check.title}</span>
                              <Badge variant="outline" className={`text-[9px] font-mono px-1.5 py-0 ${meta.cls}`}>
                                {meta.label}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground/70 mt-1">{check.detail}</p>
                            {check.remediation && (
                              <p className="text-[10px] text-muted-foreground/50 mt-1.5 font-mono">
                                ↳ {check.remediation}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
