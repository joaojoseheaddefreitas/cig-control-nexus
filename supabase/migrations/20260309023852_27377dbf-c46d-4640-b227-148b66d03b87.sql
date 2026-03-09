
-- Materials (insumos) table for CIC
CREATE TABLE public.materiais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL,
  nome text NOT NULL,
  categoria text NOT NULL DEFAULT 'geral',
  unidade text NOT NULL DEFAULT 'un',
  estoque_atual numeric NOT NULL DEFAULT 0,
  estoque_minimo numeric NOT NULL DEFAULT 0,
  estoque_maximo numeric NOT NULL DEFAULT 0,
  estoque_seguranca numeric NOT NULL DEFAULT 0,
  ponto_pedido numeric NOT NULL DEFAULT 0,
  lote_economico numeric NOT NULL DEFAULT 0,
  consumo_medio_diario numeric NOT NULL DEFAULT 0,
  lead_time_dias integer NOT NULL DEFAULT 7,
  valor_unitario numeric NOT NULL DEFAULT 0,
  fornecedor_id uuid REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  fornecedor_nome text,
  ultima_entrada date,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- BOM: Bill of Materials linking products to materials
CREATE TABLE public.bom_produto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES public.materiais(id) ON DELETE CASCADE,
  quantidade_por_unidade numeric NOT NULL DEFAULT 1,
  unidade text NOT NULL DEFAULT 'un',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(produto_id, material_id)
);

-- Movimentações de materiais (separate from product stock)
CREATE TABLE public.movimentacoes_materiais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES public.materiais(id) ON DELETE CASCADE,
  tipo text NOT NULL, -- 'entrada', 'saida', 'consumo_op', 'ajuste'
  quantidade numeric NOT NULL,
  valor_total numeric NOT NULL DEFAULT 0,
  op_id uuid REFERENCES public.ops(id) ON DELETE SET NULL,
  nota_fiscal text,
  motivo text,
  usuario text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add turno to cargas
ALTER TABLE public.cargas ADD COLUMN IF NOT EXISTS turno text NOT NULL DEFAULT '1º Turno';

-- RLS for materiais
ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Materiais acessíveis" ON public.materiais FOR SELECT USING (true);
CREATE POLICY "Materiais inseríveis" ON public.materiais FOR INSERT WITH CHECK (true);
CREATE POLICY "Materiais atualizáveis" ON public.materiais FOR UPDATE USING (true);
CREATE POLICY "Materiais deletáveis" ON public.materiais FOR DELETE USING (true);

-- RLS for bom_produto
ALTER TABLE public.bom_produto ENABLE ROW LEVEL SECURITY;
CREATE POLICY "BOM acessível" ON public.bom_produto FOR SELECT USING (true);
CREATE POLICY "BOM inserível" ON public.bom_produto FOR INSERT WITH CHECK (true);
CREATE POLICY "BOM atualizável" ON public.bom_produto FOR UPDATE USING (true);
CREATE POLICY "BOM deletável" ON public.bom_produto FOR DELETE USING (true);

-- RLS for movimentacoes_materiais
ALTER TABLE public.movimentacoes_materiais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "MovMat acessível" ON public.movimentacoes_materiais FOR SELECT USING (true);
CREATE POLICY "MovMat inserível" ON public.movimentacoes_materiais FOR INSERT WITH CHECK (true);
