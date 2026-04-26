/**
 * Runtime Profiles — perfis de execução do backend Orion.
 *
 * Lista declarativa de perfis (OpenClaw, Local, Demo, Custom, Hermes).
 * Cada perfil é testado via probe HTTP no /health do endpoint.
 * Tokens são considerados sensíveis e nunca expostos no frontend —
 * só mostramos status, URL mascarada, tipo e horário do último teste.
 */
import { API_BASE_URL } from "@/domains/api";

export type RuntimeProfileId = "openclaw" | "local" | "demo" | "custom" | "hermes";
export type RuntimeProfileKind = "production" | "development" | "demo" | "future";
export type RuntimeProbeStatus = "ok" | "degraded" | "down" | "unknown";

export interface RuntimeProfile {
  id: RuntimeProfileId;
  name: string;
  kind: RuntimeProfileKind;
  baseUrl: string;
  description: string;
  available: boolean;
  experimental?: boolean;
}

export interface RuntimeProbeResult {
  status: RuntimeProbeStatus;
  latencyMs: number | null;
  checkedAt: Date;
  detail: string | null;
}

/** Perfis declarados estaticamente — ativo é definido por VITE_API_BASE_URL. */
export const RUNTIME_PROFILES: RuntimeProfile[] = [
  {
    id: "openclaw",
    name: "OpenClaw",
    kind: "production",
    baseUrl: "https://api.aceleriq.online/api",
    description: "Backend de produção em api.aceleriq.online",
    available: true,
  },
  {
    id: "local",
    name: "Local",
    kind: "development",
    baseUrl: "http://localhost:3001/api",
    description: "OpenClaw rodando localmente para desenvolvimento",
    available: true,
  },
  {
    id: "demo",
    name: "Demo",
    kind: "demo",
    baseUrl: "https://demo.aceleriq.online/api",
    description: "Ambiente isolado para apresentações",
    available: false,
  },
  {
    id: "custom",
    name: "Custom",
    kind: "development",
    baseUrl: "—",
    description: "Endpoint definido via variável VITE_API_BASE_URL",
    available: true,
  },
  {
    id: "hermes",
    name: "Hermes",
    kind: "future",
    baseUrl: "—",
    description: "Camada de mensageria futura — não implementada",
    available: false,
    experimental: true,
  },
];

/** Mascara o host expondo só protocolo + domínio raiz, sem paths/queries. */
export function maskUrl(url: string): string {
  if (!url || url === "—") return "—";
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}${u.pathname.replace(/\/+$/, "") || ""}`;
  } catch {
    return url.length > 40 ? url.slice(0, 37) + "…" : url;
  }
}

/** Determina qual perfil corresponde à API atualmente em uso. */
export function getActiveProfileId(): RuntimeProfileId {
  const base = API_BASE_URL;
  if (base.includes("api.aceleriq.online")) return "openclaw";
  if (base.includes("localhost") || base.includes("127.0.0.1")) return "local";
  if (base.includes("demo.aceleriq.online")) return "demo";
  return "custom";
}

/** Faz probe ao endpoint /health do perfil. Retorna apenas dados não-sensíveis. */
export async function probeProfile(profile: RuntimeProfile): Promise<RuntimeProbeResult> {
  const checkedAt = new Date();

  if (!profile.available || profile.baseUrl === "—") {
    return {
      status: "unknown",
      latencyMs: null,
      checkedAt,
      detail: profile.experimental ? "Perfil futuro — não disponível" : "Endpoint não configurado",
    };
  }

  const t0 = performance.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${profile.baseUrl}/health`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timer);
    const latencyMs = Math.round(performance.now() - t0);

    if (!res.ok) {
      return {
        status: "degraded",
        latencyMs,
        checkedAt,
        detail: `HTTP ${res.status}`,
      };
    }
    return {
      status: latencyMs > 2500 ? "degraded" : "ok",
      latencyMs,
      checkedAt,
      detail: latencyMs > 2500 ? "Latência elevada" : "Health check ok",
    };
  } catch (e) {
    return {
      status: "down",
      latencyMs: null,
      checkedAt,
      detail: e instanceof Error ? e.message : "Falha de conexão",
    };
  }
}
