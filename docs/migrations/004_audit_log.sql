-- Mission Control V1.3 — Audit Log
-- Rastreabilidade de ações do usuário no painel.
-- Execute manualmente no Supabase externo (SQL Editor).
-- Pré-requisito: 002_profiles.sql executada.

-- ─── Tabela ───
CREATE TABLE IF NOT EXISTS public.audit_log (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  action     TEXT        NOT NULL,            -- ex: 'notification.dismiss', 'settings.update'
  domain     TEXT        NOT NULL DEFAULT '',  -- ex: 'notifications', 'agents', 'cron'
  target_id  TEXT        DEFAULT '',           -- id do recurso afetado (opcional)
  meta       JSONB       DEFAULT '{}',         -- dados extras livres
  ip         TEXT        DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Índices ───
CREATE INDEX IF NOT EXISTS idx_audit_user      ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action     ON public.audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_domain     ON public.audit_log(domain);
CREATE INDEX IF NOT EXISTS idx_audit_created    ON public.audit_log(created_at DESC);

-- ─── RLS ───
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Admins lêem tudo; demais lêem apenas o próprio
CREATE POLICY "Users read own audit"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
  );

-- Insert via função segura apenas (sem insert direto)
-- Nenhuma policy de INSERT para roles normais.

-- ─── Função segura de insert (security definer) ───
CREATE OR REPLACE FUNCTION public.log_audit(
  _action  TEXT,
  _domain  TEXT DEFAULT '',
  _target  TEXT DEFAULT '',
  _meta    JSONB DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_log (user_id, action, domain, target_id, meta)
  VALUES (auth.uid(), _action, _domain, _target, _meta);
END;
$$;
