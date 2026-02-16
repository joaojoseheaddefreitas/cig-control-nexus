
-- 1. Add sequencia_fila to ops (auto-increment for FIFO queue)
CREATE SEQUENCE IF NOT EXISTS public.ops_sequencia_fila_seq;
ALTER TABLE public.ops ADD COLUMN IF NOT EXISTS sequencia_fila bigint DEFAULT nextval('public.ops_sequencia_fila_seq');

-- 2. Create carteira_producao table (accumulated hours)
CREATE TABLE IF NOT EXISTS public.carteira_producao (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  total_horas_acumuladas numeric NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.carteira_producao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Carteira acessível" ON public.carteira_producao FOR SELECT USING (true);
CREATE POLICY "Carteira atualizável" ON public.carteira_producao FOR UPDATE USING (true);
CREATE POLICY "Carteira inserível" ON public.carteira_producao FOR INSERT WITH CHECK (true);

-- Seed initial row
INSERT INTO public.carteira_producao (total_horas_acumuladas) VALUES (0);

-- 3. Make itens_pedido.tempo_total a GENERATED column (same pattern as ops)
ALTER TABLE public.itens_pedido DROP COLUMN IF EXISTS tempo_total;
ALTER TABLE public.itens_pedido ADD COLUMN tempo_total numeric GENERATED ALWAYS AS (quantidade * tempo_unitario) STORED;

-- 4. Add data_aprovacao to pedidos
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS data_aprovacao timestamp with time zone;
