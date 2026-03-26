/**
 * Sessions Domain — API Contract (Canônico OpenClaw)
 * ===================================================
 * Shape de referência baseado na rota local do OpenClaw.
 * A API externa publicada NÃO define o shape canônico.
 *
 * === ENDPOINT ===
 *
 *   GET /api/sessions
 *
 * === SHAPE CANÔNICO (rota local OpenClaw) ===
 *
 *   Session[] — array de objetos de sessão:
 *
 *   [
 *     {
 *       "id":           "sess_abc123",                  // string — ID único
 *       "key":          "batch-4821",                   // string — chave legível / slug
 *       "type":         "classification",               // SessionType — classification | enrichment | sync | analysis | export | routing
 *       "typeLabel":    "Classificação",                // string — label localizado do tipo
 *       "typeEmoji":    "🏷️",                           // string — emoji representativo
 *       "updatedAt":    "2025-03-26T09:42:00Z",         // string ISO 8601 — última atualização
 *       "ageMs":        840000,                         // number — idade em ms desde criação
 *       "model":        "gpt-4o",                       // string — modelo usado
 *       "inputTokens":  12400,                          // number — tokens de entrada
 *       "outputTokens": 29600,                          // number — tokens de saída
 *       "totalTokens":  42000,                          // number — total de tokens
 *       "preview":      "Processando 8.4k leads...",    // string — descrição curta do progresso
 *       "previewType":  "text",                         // PreviewType — text | json | markdown | code
 *       "aborted":      false                           // boolean — se foi abortada
 *     }
 *   ]
 *
 * === CAMPOS DERIVADOS (transform no fetcher.ts) ===
 *
 *   Os seguintes campos são derivados para a UI (SessionView):
 *
 *   - title:     construído a partir de typeEmoji + typeLabel + key
 *   - status:    derivado de aborted, ageMs, totalTokens
 *   - progress:  heurística baseada em ageMs e estado
 *   - elapsed:   formatação legível de ageMs
 *   - tokens:    formatação legível de totalTokens (ex: "42k")
 *   - agent:     mapeado de model (simplificação atual)
 *   - startedAt: extraído de updatedAt
 *
 * === CAMPO MAPPING (se API usar nomes diferentes) ===
 *
 *   Se o OpenClaw retornar snake_case:
 *
 *   interface ApiSession {
 *     session_id: string;
 *     session_key: string;
 *     session_type: string;
 *     type_label: string;
 *     type_emoji: string;
 *     updated_at: string;
 *     age_ms: number;
 *     model_id: string;
 *     input_tokens: number;
 *     output_tokens: number;
 *     total_tokens: number;
 *     preview_text: string;
 *     preview_type: string;
 *     is_aborted: boolean;
 *   }
 *
 *   Usar transform no fetcher para mapear ao shape canônico antes
 *   da derivação para SessionView.
 *
 * === ATIVAÇÃO ===
 *
 *   1. Rodar acoplado ao OpenClaw (rota /api/sessions disponível)
 *   2. Ou definir VITE_ORION_API_URL como override
 *   3. Nenhuma mudança de UI necessária — componentes consomem SessionView
 *
 * === ERRO ===
 *
 *   - Non-2xx / rede / timeout → fallback vazio (empty state honesto)
 *   - source indica "api" vs "fallback"
 */

export type { Session, SessionView, SessionStatus, SessionType, PreviewType } from "./types";
