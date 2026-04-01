/**
 * useProfile — Lê e atualiza o perfil do usuário logado.
 * Fallback honesto quando Supabase não configurado ou tabela não existe.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase, supabaseConfigured } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface UserProfile {
  id: string;
  display_name: string;
  avatar_url: string;
}

interface UseProfileResult {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: Partial<Pick<UserProfile, "display_name" | "avatar_url">>) => Promise<{ error: string | null }>;
}

export function useProfile(): UseProfileResult {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabaseConfigured || !supabase || !user) {
      setProfile(null);
      return;
    }

    setLoading(true);
    supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .eq("id", user.id)
      .single()
      .then(({ data, error: err }) => {
        if (err) {
          // Table may not exist yet
          setError(err.code === "PGRST116" ? null : err.message);
          setProfile(user ? { id: user.id, display_name: user.email?.split("@")[0] || "", avatar_url: "" } : null);
        } else {
          setProfile(data as UserProfile);
          setError(null);
        }
        setLoading(false);
      });
  }, [user?.id]);

  const updateProfile = useCallback(async (updates: Partial<Pick<UserProfile, "display_name" | "avatar_url">>) => {
    if (!supabase || !user) return { error: "Não autenticado" };
    const { error: err } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (err) return { error: err.message };

    setProfile(prev => prev ? { ...prev, ...updates } : prev);
    return { error: null };
  }, [user?.id]);

  return { profile, loading, error, updateProfile };
}
