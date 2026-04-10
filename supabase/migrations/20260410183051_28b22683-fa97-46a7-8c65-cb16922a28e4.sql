ALTER TABLE public.logs_auditoria
  ADD COLUMN IF NOT EXISTS campo_alterado text,
  ADD COLUMN IF NOT EXISTS nivel_risco text NOT NULL DEFAULT 'BAIXO';