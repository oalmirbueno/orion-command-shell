/**
 * Supabase Client — Configuração Manual (Externo)
 *
 * Lê VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY do .env.
 * Quando ausentes, `supabase` será null e o app opera sem backend.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && key);

export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key) : null;
