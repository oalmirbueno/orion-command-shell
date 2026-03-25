/**
 * Sessions Domain — API Contract
 * ================================
 * Reference contract for real API integration.
 * This is the FIRST domain contract — use as template for all others.
 *
 * === ENDPOINT ===
 *
 *   GET {VITE_ORION_API_URL}/sessions
 *
 * === EXPECTED RESPONSE (direct shape) ===
 *
 *   Status: 200 OK
 *   Content-Type: application/json
 *
 *   Session[] — array of session objects:
 *
 *   [
 *     {
 *       "id":        "s-4821",                              // string, required — unique ID
 *       "title":     "Classificação Batch #4821",           // string, required — display name
 *       "type":      "classification",                      // SessionType, required — one of: classification | enrichment | sync | analysis | export | routing
 *       "agent":     "Classifier-01",                       // string, required — agent display name
 *       "model":     "GPT-4o",                              // string, required — model identifier
 *       "status":    "running",                             // SessionStatus, required — one of: running | paused | completed | failed
 *       "progress":  67,                                    // number, required — 0-100
 *       "preview":   "Processando 8.4k leads...",           // string, required — short progress description
 *       "startedAt": "09:28",                               // string, required — display time (HH:mm or ISO)
 *       "elapsed":   "14min",                               // string, required — human-readable elapsed
 *       "tokens":    "42k"                                  // string, required — token count (display format)
 *     }
 *   ]
 *
 * === WRAPPED RESPONSE (common API pattern) ===
 *
 *   If your API wraps data in an envelope:
 *
 *   {
 *     "data": Session[],
 *     "meta": { "total": 10, "page": 1 }
 *   }
 *
 *   Use the transform in fetcher.ts:
 *
 *   interface ApiEnvelope {
 *     data: Session[];
 *     meta: { total: number; page: number };
 *   }
 *
 *   export const fetchSessions = createRealFirstFetcher<ApiEnvelope, Session[]>({
 *     endpoint: "/sessions",
 *     fallbackData: FALLBACK_SESSIONS,
 *     transform: (raw) => raw.data,
 *   });
 *
 * === FIELD MAPPING (if API uses different names) ===
 *
 *   If your API returns snake_case or different field names:
 *
 *   interface ApiSession {
 *     session_id: string;
 *     name: string;
 *     session_type: string;
 *     agent_name: string;
 *     model_id: string;
 *     current_status: string;
 *     progress_pct: number;
 *     description: string;
 *     started_at: string;
 *     elapsed_time: string;
 *     token_count: string;
 *   }
 *
 *   Use the transform to map:
 *
 *   export const fetchSessions = createRealFirstFetcher<ApiSession[], Session[]>({
 *     endpoint: "/sessions",
 *     fallbackData: FALLBACK_SESSIONS,
 *     transform: (raw) => raw.map(s => ({
 *       id: s.session_id,
 *       title: s.name,
 *       type: s.session_type as SessionType,
 *       agent: s.agent_name,
 *       model: s.model_id,
 *       status: s.current_status as SessionStatus,
 *       progress: s.progress_pct,
 *       preview: s.description,
 *       startedAt: s.started_at,
 *       elapsed: s.elapsed_time,
 *       tokens: s.token_count,
 *     })),
 *   });
 *
 * === ACTIVATION ===
 *
 *   1. Set VITE_ORION_API_URL in your environment
 *   2. Ensure GET /sessions returns one of the shapes above
 *   3. Add a transform to fetcher.ts if needed
 *   4. No UI changes required — components are pure and data-driven
 *
 * === ERROR HANDLING ===
 *
 *   - Non-2xx responses → automatic fallback to local data
 *   - Network errors → automatic fallback
 *   - Timeout (8s default) → automatic fallback
 *   - source field in useOrionData indicates "api" vs "fallback"
 *
 * === REPLICATION ===
 *
 *   To apply this pattern to another domain:
 *
 *   1. Copy this contract file to the domain folder
 *   2. Adjust types, endpoint, and field mapping
 *   3. Update fetcher.ts with the correct transform
 *   4. That's it — useOrionData handles the rest
 */

export type { Session, SessionStatus, SessionType } from "./types";
