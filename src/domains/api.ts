/**
 * Orion API Configuration
 *
 * Central configuration for real API integration.
 * Set VITE_ORION_API_URL in your .env to enable real data fetching.
 *
 * When the env var is not set, all domains operate in fallback-only mode.
 */

/**
 * Default: /api (relativo ao host — OpenClaw no mesmo servidor).
 * Override: VITE_ORION_API_URL para apontar a um OpenClaw remoto.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

/** Whether we're using the default local backend or an explicit override */
export const isUsingLocalBackend = (): boolean => API_BASE_URL === "/api";

/**
 * Build a full API URL for a given path.
 * @example apiUrl("/sessions") → "/api/sessions" (local) or "https://host/api/sessions" (override)
 */
export const apiUrl = (path: string): string => `${API_BASE_URL}${path}`;
