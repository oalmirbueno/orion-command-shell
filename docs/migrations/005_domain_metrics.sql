-- Mission Control V1.3 — Domain Metrics Persistence
-- Snapshots periódicos de métricas por domínio para tendências e alertas.
-- Execute manualmente no Supabase externo (SQL Editor).
-- Pré-requisito: 002_profiles.sql executada.

-- ─── Tabela ───
CREATE TABLE IF NOT EXISTS public.domain_metrics (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  domain     TEXT        NOT NULL,              -- ex: 'system', 'agents', 'cron'
  avg_latency_ms  INTEGER NOT NULL DEFAULT 0,
  max_latency_ms  INTEGER NOT NULL DEFAULT 0,
  error_count     INTEGER NOT NULL DEFAULT 0,
  success_count   INTEGER NOT NULL DEFAULT 0,
  error_rate      REAL    NOT NULL DEFAULT 0,   -- 0.0 a 1.0
  trend      TEXT        NOT NULL DEFAULT 'stable' CHECK (trend IN ('up','down','stable')),
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Índices ───
CREATE INDEX IF NOT EXISTS idx_dm_domain     ON public.domain_metrics(domain);
CREATE INDEX IF NOT EXISTS idx_dm_recorded   ON public.domain_metrics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_domain_ts  ON public.domain_metrics(domain, recorded_at DESC);

-- ─── RLS ───
ALTER TABLE public.domain_metrics ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode ler (métricas são globais)
CREATE POLICY "Authenticated read domain metrics"
  ON public.domain_metrics FOR SELECT
  TO authenticated
  USING (true);

-- Insert apenas via função segura
CREATE OR REPLACE FUNCTION public.record_domain_metric(
  _domain       TEXT,
  _avg_latency  INTEGER,
  _max_latency  INTEGER,
  _errors       INTEGER,
  _successes    INTEGER,
  _error_rate   REAL,
  _trend        TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.domain_metrics
    (domain, avg_latency_ms, max_latency_ms, error_count, success_count, error_rate, trend)
  VALUES
    (_domain, _avg_latency, _max_latency, _errors, _successes, _error_rate, _trend);
END;
$$;

-- ─── Limpeza automática (opcional) ───
-- Mantém apenas 30 dias de histórico
-- Execute como cron job no Supabase ou manualmente:
-- DELETE FROM public.domain_metrics WHERE recorded_at < now() - interval '30 days';
