/**
 * Security Audit — verificações reais da postura de segurança do Mission Control.
 *
 * Cada check retorna um resultado objetivo (ok/warn/fail/unknown) baseado em
 * sinais reais (configuração de runtime, headers HTTP, RLS via Supabase quando
 * disponível). Sem hardcode "tudo verde". Sem expor tokens ou segredos.
 */
import { API_BASE_URL, apiUrl } from "@/domains/api";
import { getActiveProfileId, maskUrl } from "@/domains/runtime/profiles";

export type CheckSeverity = "ok" | "warn" | "fail" | "unknown";
export type CheckCategory = "transport" | "runtime" | "exposure" | "backend";

export interface SecurityCheck {
  id: string;
  category: CheckCategory;
  title: string;
  detail: string;
  severity: CheckSeverity;
  remediation?: string;
}

export interface SecurityReport {
  generatedAt: Date;
  checks: SecurityCheck[];
  summary: {
    ok: number;
    warn: number;
    fail: number;
    unknown: number;
  };
}

// ── Individual checks ──────────────────────────────

function checkHttps(): SecurityCheck {
  const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
  const isLocal = typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  return {
    id: "frontend-https",
    category: "transport",
    title: "Frontend servido via HTTPS",
    detail: isHttps
      ? `Origem ${window.location.origin} usando TLS`
      : isLocal
      ? "Origem local (dev) — não verificado em produção"
      : "Frontend servido em HTTP plano",
    severity: isHttps ? "ok" : isLocal ? "unknown" : "fail",
    remediation: !isHttps && !isLocal ? "Forçar HTTPS no edge/proxy do host" : undefined,
  };
}

function checkApiOrigin(): SecurityCheck {
  const base = API_BASE_URL;
  const masked = maskUrl(base);
  if (base.startsWith("https://")) {
    return {
      id: "api-https",
      category: "transport",
      title: "Backend acessado via HTTPS",
      detail: `Endpoint ${masked}`,
      severity: "ok",
    };
  }
  if (base === "/api") {
    return {
      id: "api-https",
      category: "transport",
      title: "Backend acessado via origem relativa",
      detail: "API consumida no mesmo host (herdará TLS do frontend)",
      severity: typeof window !== "undefined" && window.location.protocol === "https:" ? "ok" : "warn",
    };
  }
  if (base.includes("localhost") || base.includes("127.0.0.1")) {
    return {
      id: "api-https",
      category: "transport",
      title: "Backend em localhost",
      detail: "Apenas para desenvolvimento — não use em produção",
      severity: "unknown",
    };
  }
  return {
    id: "api-https",
    category: "transport",
    title: "Backend sem TLS confirmado",
    detail: `Endpoint ${masked} não usa HTTPS`,
    severity: "fail",
    remediation: "Configurar VITE_API_BASE_URL para um endpoint https://",
  };
}

function checkRuntimeProfile(): SecurityCheck {
  const id = getActiveProfileId();
  if (id === "openclaw") {
    return {
      id: "runtime-profile",
      category: "runtime",
      title: "Perfil de execução: produção (OpenClaw)",
      detail: "Conectado ao backend oficial",
      severity: "ok",
    };
  }
  if (id === "local") {
    return {
      id: "runtime-profile",
      category: "runtime",
      title: "Perfil de execução: local",
      detail: "Conexão a backend local — não use em produção",
      severity: "warn",
    };
  }
  if (id === "demo") {
    return {
      id: "runtime-profile",
      category: "runtime",
      title: "Perfil de execução: demo",
      detail: "Ambiente isolado de demonstração",
      severity: "warn",
    };
  }
  return {
    id: "runtime-profile",
    category: "runtime",
    title: "Perfil de execução: customizado",
    detail: `Endpoint custom: ${maskUrl(API_BASE_URL)}`,
    severity: "warn",
    remediation: "Validar se o endpoint custom é confiável",
  };
}

function checkSecretsExposure(): SecurityCheck {
  // Inspeciona apenas as chaves visíveis em import.meta.env (sem ler valores).
  // Identifica nomes que parecem sensíveis e não deveriam estar no bundle do cliente.
  const keys = Object.keys(import.meta.env || {});
  const sensitivePatterns = [
    /SECRET/i,
    /PRIVATE/i,
    /SERVICE_ROLE/i,
    /^STRIPE_SK/i,
    /OPENAI_API_KEY/i,
    /ANTHROPIC_API_KEY/i,
  ];
  const exposed = keys.filter(k =>
    !k.startsWith("VITE_") ? false : sensitivePatterns.some(p => p.test(k))
  );
  if (exposed.length === 0) {
    return {
      id: "secrets-bundle",
      category: "exposure",
      title: "Nenhum segredo aparente no bundle do cliente",
      detail: "Variáveis VITE_* analisadas — nenhuma com nome sensível",
      severity: "ok",
    };
  }
  return {
    id: "secrets-bundle",
    category: "exposure",
    title: "Variáveis com nome sensível expostas ao cliente",
    detail: `Possíveis segredos: ${exposed.join(", ")}`,
    severity: "fail",
    remediation: "Mover essas variáveis para o backend; jamais prefixar com VITE_",
  };
}

function checkLocalStorageTokens(): SecurityCheck {
  if (typeof window === "undefined") {
    return {
      id: "localstorage-tokens",
      category: "exposure",
      title: "Tokens em armazenamento local",
      detail: "Ambiente sem window — não verificado",
      severity: "unknown",
    };
  }
  try {
    const suspect: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (/token|secret|api[_-]?key|bearer|jwt/i.test(k)) suspect.push(k);
    }
    if (suspect.length === 0) {
      return {
        id: "localstorage-tokens",
        category: "exposure",
        title: "Nenhum token suspeito em localStorage",
        detail: "Inspeção heurística dos nomes de chave",
        severity: "ok",
      };
    }
    return {
      id: "localstorage-tokens",
      category: "exposure",
      title: "Possíveis tokens em localStorage",
      detail: `Chaves suspeitas: ${suspect.join(", ")}`,
      severity: "warn",
      remediation: "Preferir cookies httpOnly geridos pelo backend",
    };
  } catch {
    return {
      id: "localstorage-tokens",
      category: "exposure",
      title: "Tokens em armazenamento local",
      detail: "Acesso a localStorage bloqueado",
      severity: "unknown",
    };
  }
}

async function checkBackendHealth(): Promise<SecurityCheck> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(apiUrl("/health"), {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timer);
    if (!res.ok) {
      return {
        id: "backend-health",
        category: "backend",
        title: "Backend respondeu com erro",
        detail: `HTTP ${res.status} em /health`,
        severity: "warn",
      };
    }
    return {
      id: "backend-health",
      category: "backend",
      title: "Backend acessível",
      detail: "/health respondeu 2xx — autenticação não foi exigida no probe",
      severity: "ok",
    };
  } catch (e) {
    return {
      id: "backend-health",
      category: "backend",
      title: "Backend inalcançável",
      detail: e instanceof Error ? e.message : "Falha de rede",
      severity: "fail",
    };
  }
}

async function checkCorsRestriction(): Promise<SecurityCheck> {
  // Heurística: se o backend respondeu, leitura é permitida para esta origem.
  // Não temos como inspecionar o header Access-Control-Allow-Origin a partir do JS,
  // então só sinalizamos que o probe foi possível.
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(apiUrl("/health"), { signal: controller.signal });
    clearTimeout(timer);
    return {
      id: "cors-policy",
      category: "backend",
      title: "Política CORS",
      detail: res.ok
        ? "Origem atual aceita pelo backend (validar manualmente se há restrição por allowlist)"
        : "Backend recusou o probe — verificar política CORS",
      severity: "unknown",
      remediation: "Confirmar Access-Control-Allow-Origin no edge/proxy do OpenClaw",
    };
  } catch {
    return {
      id: "cors-policy",
      category: "backend",
      title: "Política CORS",
      detail: "Probe falhou — não foi possível avaliar",
      severity: "unknown",
    };
  }
}

// ── Runner ──────────────────────────────

export async function runSecurityAudit(): Promise<SecurityReport> {
  const sync: SecurityCheck[] = [
    checkHttps(),
    checkApiOrigin(),
    checkRuntimeProfile(),
    checkSecretsExposure(),
    checkLocalStorageTokens(),
  ];
  const async = await Promise.all([checkBackendHealth(), checkCorsRestriction()]);
  const checks = [...sync, ...async];

  const summary = checks.reduce(
    (acc, c) => {
      acc[c.severity]++;
      return acc;
    },
    { ok: 0, warn: 0, fail: 0, unknown: 0 }
  );

  return { generatedAt: new Date(), checks, summary };
}
