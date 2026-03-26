/**
 * Files — Contrato de Integração
 *
 * === ENDPOINT ===
 * GET /api/files → FilesPageData
 *
 * {
 *   "files": [
 *     {
 *       "id":          "string",
 *       "name":        "leads_export.csv",
 *       "type":        "document" | "image" | "config" | "log" | "data" | "script",
 *       "size":        "2.4 MB",
 *       "modifiedAt":  "2026-03-26T16:30:00Z",
 *       "modifiedAgo": "há 5 min",
 *       "path":        "/exports/leads_export.csv",
 *       "agent?":      "Exporter-01"                        // opcional
 *     }
 *   ],
 *   "summary": {
 *     "totalFiles":    42,
 *     "totalSize":     "1.2 GB",
 *     "lastModified":  "há 5 min",
 *     "categories":    4
 *   }
 * }
 *
 * === TRANSFORM ===
 * Nenhum necessário se a API seguir o formato acima.
 */

export type { FileEntry, FilesPageData, FilesSummaryData, FileType } from "./types";
