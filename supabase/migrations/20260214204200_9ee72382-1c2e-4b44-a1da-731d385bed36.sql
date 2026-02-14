
-- Add fraction_count to itens_pedido (how many OPs to split this item into)
ALTER TABLE public.itens_pedido ADD COLUMN IF NOT EXISTS fraction_count integer NOT NULL DEFAULT 1;

-- Add columns to ops for the 1/N display mask logic
ALTER TABLE public.ops ADD COLUMN IF NOT EXISTS sequence_number integer;
ALTER TABLE public.ops ADD COLUMN IF NOT EXISTS total_ops_at_generation integer;
ALTER TABLE public.ops ADD COLUMN IF NOT EXISTS current_sector text;
ALTER TABLE public.ops ADD COLUMN IF NOT EXISTS pedido_id uuid REFERENCES public.pedidos(id);

-- Create op_route_steps table (snapshot of routing at OP creation time)
CREATE TABLE IF NOT EXISTS public.op_route_steps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  op_id uuid NOT NULL REFERENCES public.ops(id) ON DELETE CASCADE,
  setor_id uuid NOT NULL REFERENCES public.setores_produtivos(id),
  ordem integer NOT NULL DEFAULT 0,
  tempo_estimado numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.op_route_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Route steps acessíveis" ON public.op_route_steps FOR SELECT USING (true);
CREATE POLICY "Route steps inseríveis" ON public.op_route_steps FOR INSERT WITH CHECK (true);

-- Unique index on pedido codigo (internal_order_number)
CREATE UNIQUE INDEX IF NOT EXISTS idx_pedidos_codigo_unique ON public.pedidos(codigo);

-- Idempotency: prevent duplicate OPs per item+sequence
CREATE UNIQUE INDEX IF NOT EXISTS idx_ops_item_sequence ON public.ops(item_pedido_id, sequence_number);
