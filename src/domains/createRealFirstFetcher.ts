/**
 * createRealFirstFetcher — Real-first, fallback-safe data fetching.
 *
 * Estratégia (OpenClaw-first):
 *   1. Sempre tenta fetch real em /api/* (backend acoplado ao host).
 *   2. Se VITE_ORION_API_URL estiver definido, usa como override de host.
 *   3. Em caso de erro (rede, non-2xx, timeout), usa fallback vazio honesto.
 *
 * Padrão consolidado para todos os domínios do Orion Mission Control.
 */

import { apiUrl } from "./api";
import type { DomainFetcher, DomainResult, DataSource } from "./types";

interface RealFirstFetcherOptions<TRaw, TDomain> {
  /** API path appended to base URL (e.g. "/sessions") */
  endpoint: string;
  /** Local fallback data used when backend is unavailable */
  fallbackData: TDomain;
  /** Optional transform from raw API response to domain type */
  transform?: (raw: TRaw) => TDomain;
  /** Request timeout in ms (default: 8000) */
  timeout?: number;
}

export function createRealFirstFetcher<TRaw = unknown, TDomain = TRaw>({
  endpoint,
  fallbackData,
  transform,
  timeout = 8000,
}: RealFirstFetcherOptions<TRaw, TDomain>): DomainFetcher<TDomain> {
  return async (): Promise<DomainResult<TDomain>> => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(apiUrl(endpoint), {
        signal: controller.signal,
        headers: { "Accept": "application/json" },
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`API ${response.status}: ${response.statusText}`);
      }

      const raw = (await response.json()) as TRaw;
      const data = transform ? transform(raw) : (raw as unknown as TDomain);

      return {
        data,
        source: "api" as DataSource,
        timestamp: new Date(),
      };
    } catch {
      console.debug(`[Orion] ${endpoint}: backend indisponível, usando fallback`);
      return {
        data: fallbackData,
        source: "fallback" as DataSource,
        timestamp: new Date(),
      };
    }
  };
}
