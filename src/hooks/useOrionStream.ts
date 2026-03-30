/**
 * useOrionStream — SSE-based real-time data layer.
 *
 * Connects to GET /api/stream (Server-Sent Events).
 * Each SSE event has `event: <domain>` and `data: <JSON>`.
 *
 * On each event, injects fresh data directly into React Query cache,
 * making all useOrionData consumers update instantly without polling.
 *
 * Falls back to polling-only when SSE is unavailable.
 */

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiUrl } from "@/domains/api";
import { getDomainHealthStore, type DomainKey } from "./useDomainHealth";

export type StreamStatus = "connecting" | "connected" | "disconnected" | "unsupported";

/** Domain event names the backend can push */
const DOMAIN_QUERY_MAP: Record<string, string> = {
  "system":     "status-bar-metrics",
  "system.stats": "status-bar-metrics",
  "sessions":   "sessions-page",
  "agents":     "agents-page",
  "activities":  "activity-page",
  "cron":       "cron-page",
  "operations": "operations-page",
  "alerts":     "alerts-page",
  "memory":     "memory-page",
  "files":      "files-page",
  "home":       "home-page",
};

interface StreamOptions {
  /** Override stream endpoint. Default: /api/stream */
  endpoint?: string;
  /** Reconnect delay in ms after disconnect. Default: 5000 */
  reconnectDelay?: number;
  /** Max reconnect attempts before giving up. Default: 10 */
  maxRetries?: number;
  /** Callback when status changes */
  onStatusChange?: (status: StreamStatus) => void;
}

/**
 * Global SSE connection hook. Mount once (e.g., in App or Layout).
 * Injects fresh data into React Query cache on each SSE event.
 */
export function useOrionStream(options: StreamOptions = {}) {
  const {
    endpoint = "/stream",
    reconnectDelay = 5000,
    maxRetries = 10,
    onStatusChange,
  } = options;

  const queryClient = useQueryClient();
  const esRef = useRef<EventSource | null>(null);
  const retriesRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const statusRef = useRef<StreamStatus>("disconnected");
  const mountedRef = useRef(true);

  const setStatus = useCallback((s: StreamStatus) => {
    statusRef.current = s;
    onStatusChange?.(s);
  }, [onStatusChange]);

  const injectData = useCallback((domain: string, rawData: unknown) => {
    const queryKey = DOMAIN_QUERY_MAP[domain];
    if (!queryKey) return;

    // For status-bar-metrics, the query stores { metrics, latencyMs }
    if (domain === "system" || domain === "system.stats") {
      // Invalidate to trigger a fresh fetch — SSE payload may be partial
      queryClient.invalidateQueries({ queryKey: ["orion", queryKey] });
      return;
    }

    // For domain pages, inject as a full FetcherResult
    queryClient.setQueryData(["orion", queryKey], {
      data: rawData,
      source: "api" as const,
      timestamp: new Date(),
    });
  }, [queryClient]);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (typeof EventSource === "undefined") {
      setStatus("unsupported");
      return;
    }

    const url = apiUrl(endpoint);
    setStatus("connecting");

    try {
      const es = new EventSource(url);
      esRef.current = es;

      es.onopen = () => {
        if (!mountedRef.current) return;
        retriesRef.current = 0;
        setStatus("connected");
      };

      // Listen for named events from all domains
      for (const domain of Object.keys(DOMAIN_QUERY_MAP)) {
        es.addEventListener(domain, (ev: MessageEvent) => {
          if (!mountedRef.current) return;
          try {
            const parsed = JSON.parse(ev.data);
            injectData(domain, parsed);
          } catch {
            // Ignore malformed payloads
          }
        });
      }

      // Generic message handler (unnamed events)
      es.onmessage = (ev: MessageEvent) => {
        if (!mountedRef.current) return;
        try {
          const parsed = JSON.parse(ev.data);
          if (parsed?.domain && parsed?.data) {
            injectData(parsed.domain, parsed.data);
          }
        } catch {
          // heartbeat or non-JSON — ignore
        }
      };

      es.onerror = () => {
        if (!mountedRef.current) return;
        es.close();
        esRef.current = null;
        setStatus("disconnected");

        if (retriesRef.current < maxRetries) {
          retriesRef.current++;
          const delay = reconnectDelay * Math.min(retriesRef.current, 4);
          timerRef.current = setTimeout(connect, delay);
        }
      };
    } catch {
      setStatus("disconnected");
    }
  }, [endpoint, reconnectDelay, maxRetries, setStatus, injectData]);

  // Connect on mount, reconnect on window focus
  useEffect(() => {
    mountedRef.current = true;
    connect();

    const handleFocus = () => {
      if (statusRef.current === "disconnected" || statusRef.current === "connecting") {
        retriesRef.current = 0;
        connect();
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        handleFocus();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      mountedRef.current = false;
      esRef.current?.close();
      esRef.current = null;
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [connect]);

  return { status: statusRef.current };
}
