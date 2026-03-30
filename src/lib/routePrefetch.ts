/**
 * Route → prefetch mapping.
 * On hover/focus of a sidebar link, we warm the React Query cache for that route's data.
 */
import type { QueryClient } from "@tanstack/react-query";

type Prefetcher = (qc: QueryClient) => void;

function makePrefetcher(key: string, fetcherImport: () => Promise<{ default?: any; [k: string]: any }>): Prefetcher {
  return (qc: QueryClient) => {
    // Only prefetch if not already in cache
    const existing = qc.getQueryData(["orion", key]);
    if (existing) return;

    fetcherImport().then((mod) => {
      // Find the fetcher function (named export)
      const fetcher = Object.values(mod).find((v) => typeof v === "function");
      if (!fetcher) return;

      qc.prefetchQuery({
        queryKey: ["orion", key],
        queryFn: async () => {
          const result = await (fetcher as any)();
          return { data: result.data, source: result.source, timestamp: result.timestamp };
        },
        staleTime: 30_000,
      });
    });
  };
}

export const routePrefetchMap: Record<string, Prefetcher> = {
  "/": makePrefetcher("home-page", () => import("@/domains/home/fetcher")),
  "/agents": makePrefetcher("agents-page", () => import("@/domains/agents/fetcher")),
  "/sessions": makePrefetcher("sessions", () => import("@/domains/sessions/fetcher")),
  "/activity": makePrefetcher("activity-page", () => import("@/domains/activity/fetcher")),
  "/cron": makePrefetcher("cron-page", () => import("@/domains/cron/fetcher")),
  "/alerts": makePrefetcher("alerts-page", () => import("@/domains/alerts/fetcher")),
  "/operations": makePrefetcher("operations-page", () => import("@/domains/operations/fetcher")),
  "/files": makePrefetcher("files-page", () => import("@/domains/files/fetcher")),
  "/memory": makePrefetcher("memory-page", () => import("@/domains/memory/fetcher")),
  "/system": makePrefetcher("system-page", () => import("@/domains/system/fetcher")),
};
