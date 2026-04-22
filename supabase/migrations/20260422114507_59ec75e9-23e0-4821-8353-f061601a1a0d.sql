
ALTER TABLE public.materiais
  ADD COLUMN IF NOT EXISTS ponto_pedido_manual boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ponto_pedido_override numeric NULL,
  ADD COLUMN IF NOT EXISTS proposta_manual boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS proposta_override numeric NULL,
  ADD COLUMN IF NOT EXISTS cmm_manual boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cmm_override numeric NULL;

COMMENT ON COLUMN public.materiais.ponto_pedido_manual IS 'Quando true, usa ponto_pedido_override em vez do PP calculado por fórmula';
COMMENT ON COLUMN public.materiais.proposta_manual IS 'Quando true, usa proposta_override em vez da Proposta calculada (PP - Estoque + Lote)';
COMMENT ON COLUMN public.materiais.cmm_manual IS 'Quando true, usa cmm_override (mensal) em vez do consumo_medio_diario × 30';
