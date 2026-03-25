/**
 * Orion API Configuration
 *
 * Central configuration for real API integration.
 * Set VITE_ORION_API_URL in your .env to enable real data fetching.
 *
 * When the env var is not set, all domains operate in fallback-only mode.
 */

export const API_BASE_URL = import.meta.env.VITE_ORION_API_URL || "";

/** Whether a real API endpoint is configured */
export const isApiConfigured = (): boolean => API_BASE_URL.length > 0;

/**
 * Build a full API URL for a given path.
 * @example apiUrl("/sessions") → "https://api.example.com/sessions"
 */
export const apiUrl = (path: string): string => `${API_BASE_URL}${path}`;
