
-- Add lead_time_dias to bom_produto (per-product override)
ALTER TABLE public.bom_produto
ADD COLUMN IF NOT EXISTS lead_time_dias integer NOT NULL DEFAULT 7;

-- Add lead time fields to produtos
ALTER TABLE public.produtos
ADD COLUMN IF NOT EXISTS lead_time_produto integer NOT NULL DEFAULT 0;

ALTER TABLE public.produtos
ADD COLUMN IF NOT EXISTS lead_time_manual boolean NOT NULL DEFAULT false;

-- Add dias_uteis fields to setores_produtivos
ALTER TABLE public.setores_produtivos
ADD COLUMN IF NOT EXISTS dias_uteis_mensais integer NOT NULL DEFAULT 22;

ALTER TABLE public.setores_produtivos
ADD COLUMN IF NOT EXISTS dias_uteis_manual boolean NOT NULL DEFAULT false;
